// =================================================================
//                      SETUP AND DEPENDENCIES
// =================================================================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

// =================================================================
//                            MIDDLEWARE
// =================================================================
app.use(express.json());
app.use(cors());

const auth = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res
      .status(401)
      .json({ success: false, error: "Access denied. No token provided." });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
};

// =================================================================
//                         DATABASE CONNECTION
// =================================================================
const MONGODB_URI = process.env.MONGO_URI;
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully! "))
  .catch((err) => console.error("MongoDB connection failed:", err));

// =================================================================
//                         MONGOOSE SCHEMAS & MODELS
// =================================================================
const UserSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    studentId: { type: String },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "recruiter", "admin"],
      default: "student",
    },
    department: String,
    cgpa: Number,
    skills: [String],
    interests: [String],
    workExperience: [
      {
        company: String,
        position: String,
        duration: String,
        description: String,
      },
    ],
    education: [{ institution: String, degree: String, year: String }],
  },
  { timestamps: true }
);
const User = mongoose.model("User", UserSchema);

const JobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: String,
    salaryMin: Number,
    description: String,
  },
  { timestamps: true }
);
const Job = mongoose.model("Job", JobSchema);

const ApplicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["Pending", "Reviewed", "Rejected", "Accepted"],
      default: "Pending",
    },
  },
  { timestamps: true }
);
const Application = mongoose.model("Application", ApplicationSchema);

const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);
const Notification = mongoose.model("Notification", NotificationSchema);

const DashboardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
});
const Dashboard = mongoose.model("Dashboard", DashboardSchema);

// =================================================================
//                         AUTHENTICATION APIs
// =================================================================
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Name, email, and password are required",
        });
    }
    if (!email.endsWith("@g.bracu.ac.bd")) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Only @g.bracu.ac.bd email addresses are allowed",
        });
    }
    let user = await User.findOne({ email });
    if (user) {
      return res
        .status(400)
        .json({ success: false, error: "User with this email already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userId = email.split("@")[0];
    user = new User({ name, userId, email, password: hashedPassword, role });
    await user.save();
    res
      .status(201)
      .json({
        success: true,
        message: "User registered successfully",
        userId: user.userId,
      });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid email or password" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid email or password" });
    }
    const payload = {
      id: user.id,
      userId: user.userId,
      role: user.role,
      name: user.name,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/auth/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/profile/status", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "User not found", hasProfile: false });
    }
    const hasProfile = !!(
      user.skills &&
      user.skills.length > 0 &&
      user.interests &&
      user.interests.length > 0
    );
    res.json({ success: true, hasProfile, userId: user.userId });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: error.message, hasProfile: false });
  }
});

app.put("/api/profile/:userId", auth, async (req, res) => {
  try {
    if (req.user.userId !== req.params.userId) {
      return res
        .status(403)
        .json({
          success: false,
          error: "Access denied. You can only update your own profile.",
        });
    }
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user.id },
      { $set: req.body },
      { new: true, runValidators: true }
    ).select("-password");
    if (!updatedUser) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
//                 FEATURE 02: JOB DISCOVERY APIs
// =================================================================
app.get("/api/jobs/search", auth, async (req, res) => {
  try {
    const { keyword } = req.query;
    let query = {};
    if (keyword) {
      query.title = { $regex: keyword, $options: "i" };
    }
    const jobs = await Job.find(query);
    res.json({ success: true, count: jobs.length, jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get("/api/jobs/:jobId", auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }
    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.post("/api/jobs/apply", auth, async (req, res) => {
  try {
    const { jobId } = req.body;
    const job = await Job.findById(jobId);
    if (!job)
      return res.status(404).json({ success: false, error: "Job not found" });
    const existingApplication = await Application.findOne({
      user: req.user.id,
      job: jobId,
    });
    if (existingApplication) {
      return res
        .status(400)
        .json({ success: false, error: "Already applied to this job" });
    }
    const newApplication = new Application({
      user: req.user.id,
      job: jobId,
      status: "Pending",
    });
    await newApplication.save();
    res
      .status(201)
      .json({
        success: true,
        message: "Application submitted",
        application: newApplication,
      });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
//                 FEATURE 01: DASHBOARD APIs
// =================================================================
app.get("/api/dashboard/applications/:userId", auth, async (req, res) => {
  try {
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ success: false, error: "Access denied." });
    }
    const applications = await Application.find({ user: req.user.id })
      .populate("job")
      .sort({ createdAt: -1 });
    res.json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get("/api/dashboard/notifications/:userId", auth, async (req, res) => {
  try {
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ success: false, error: "Access denied." });
    }
    const notifications = await Notification.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get("/api/dashboard/saved-jobs/:userId", auth, async (req, res) => {
  try {
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ success: false, error: "Access denied." });
    }
    const dashboard = await Dashboard.findOne({ user: req.user.id }).populate(
      "savedJobs"
    );
    res.json({
      success: true,
      savedJobs: dashboard ? dashboard.savedJobs : [],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.post("/api/dashboard/saved-jobs/:userId", auth, async (req, res) => {
  try {
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ success: false, error: "Access denied." });
    }
    const { jobId } = req.body;
    const job = await Job.findById(jobId);
    if (!job)
      return res.status(404).json({ success: false, error: "Job not found" });
    let dashboard = await Dashboard.findOne({ user: req.user.id });
    if (!dashboard) {
      dashboard = new Dashboard({ user: req.user.id, savedJobs: [jobId] });
    } else {
      if (dashboard.savedJobs.includes(jobId)) {
        return res
          .status(400)
          .json({ success: false, error: "Job already saved" });
      }
      dashboard.savedJobs.push(jobId);
    }
    await dashboard.save();
    res.json({ success: true, message: "Job saved successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.delete("/api/dashboard/saved-jobs/:userId", auth, async (req, res) => {
  try {
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ success: false, error: "Access denied." });
    }
    const { jobId } = req.body;
    await Dashboard.updateOne(
      { user: req.user.id },
      { $pull: { savedJobs: jobId } }
    );
    res.json({ success: true, message: "Job removed from saved" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get("/api/dashboard/:userId", auth, async (req, res) => {
  try {
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ success: false, error: "Access denied." });
    }
    const user = await User.findById(req.user.id).select("-password");
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });
    const applications = await Application.find({ user: user.id })
      .populate("job")
      .sort({ createdAt: -1 })
      .limit(5);
    const dashboard = await Dashboard.findOne({ user: user.id }).populate(
      "savedJobs"
    );
    const notifications = await Notification.find({ user: user.id })
      .sort({ createdAt: -1 })
      .limit(5);
    res.json({
      success: true,
      data: {
        userId: user.userId,
        studentInfo: {
          name: user.name,
          email: user.email,
          department: user.department,
          cgpa: user.cgpa,
        },
        applications,
        savedJobsCount: dashboard ? dashboard.savedJobs.length : 0,
        savedJobs: dashboard ? dashboard.savedJobs : [],
        notifications,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
//                 HELPER APIs FOR TESTING
// =================================================================
app.post("/api/test/create-job", async (req, res) => {
  try {
    const job = new Job(req.body);
    await job.save();
    res.status(201).json({ success: true, message: "Test job created", job });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.post("/api/test/create-notification", auth, async (req, res) => {
  try {
    const { message } = req.body;
    const newNotification = new Notification({ user: req.user.id, message });
    await newNotification.save();
    res
      .status(201)
      .json({
        success: true,
        message: "Test notification created",
        notification: newNotification,
      });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
//                             SERVER START
// =================================================================
const PORT = 1350;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Student ID: 23101350`);
  console.log(`Authentication: UPGRADED AND RUNNING!`);
});
