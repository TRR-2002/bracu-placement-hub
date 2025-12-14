// =================================================================
// SETUP AND DEPENDENCIES
// =================================================================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();

// =================================================================
// MIDDLEWARE
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

// NEW: Middleware to check if user is a recruiter
const recruiterAuth = (req, res, next) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({
      success: false,
      error: "Access denied. Recruiter role required.",
    });
  }
  next();
};

// =================================================================
// DATABASE CONNECTION
// =================================================================
const MONGODB_URI = process.env.MONGO_URI;
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully! "))
  .catch((err) => console.error("MongoDB connection failed:", err));

// =================================================================
// MONGOOSE SCHEMAS & MODELS
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

// UPDATED JOB SCHEMA - Added recruiter reference
const JobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: String,
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    salaryMin: Number,
    salaryMax: Number,
    description: String,
    requiredSkills: [String],
    type: {
      type: String,
      enum: ["Full-time", "Part-time", "Internship"],
      default: "Full-time",
    },
    status: {
      type: String,
      enum: ["Open", "Closed", "Filled"],
      default: "Open",
    },
    // NEW: Track which recruiter posted this job
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
    profileSnapshot: {
      name: String,
      email: String,
      studentId: String,
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
// AUTHENTICATION APIs
// =================================================================
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Name, email, and password are required",
      });
    }

    // Role-specific email validation
    if (role === "student" || !role) {
      // Students must use @g.bracu.ac.bd
      if (!email.endsWith("@g.bracu.ac.bd")) {
        return res.status(400).json({
          success: false,
          error: "Students must use @g.bracu.ac.bd email addresses",
        });
      }
    } else if (role === "recruiter" || role === "admin") {
      // Recruiters and admins cannot use @g.bracu.ac.bd
      if (email.endsWith("@g.bracu.ac.bd")) {
        return res.status(400).json({
          success: false,
          error:
            "Recruiters and admins must use non-university email addresses",
        });
      }
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

    res.status(201).json({
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
      return res.status(403).json({
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
// FEATURE 02: JOB DISCOVERY & APPLICATION APIs (STUDENT)
// =================================================================

// Search jobs with filters
app.get("/api/jobs/search", auth, async (req, res) => {
  try {
    const { keyword, location, minSalary, maxSalary } = req.query;
    let query = { status: "Open" };

    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { company: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ];
    }

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    if (minSalary) {
      query.salaryMin = { $gte: Number(minSalary) };
    }

    if (maxSalary) {
      query.salaryMax = { $lte: Number(maxSalary) };
    }

    const jobs = await Job.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: jobs.length, jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single job details
app.get("/api/jobs/:jobId", auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    const existingApplication = await Application.findOne({
      user: req.user.id,
      job: req.params.jobId,
    });

    res.json({
      success: true,
      job,
      hasApplied: !!existingApplication,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Apply to job with profile snapshot
app.post("/api/jobs/apply", auth, async (req, res) => {
  try {
    const { jobId } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    if (job.status !== "Open") {
      return res.status(400).json({
        success: false,
        error: "This job is no longer accepting applications",
      });
    }

    const existingApplication = await Application.findOne({
      user: req.user.id,
      job: jobId,
    });

    if (existingApplication) {
      return res
        .status(400)
        .json({ success: false, error: "Already applied to this job" });
    }

    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const profileSnapshot = {
      name: user.name,
      email: user.email,
      studentId: user.studentId,
      department: user.department,
      cgpa: user.cgpa,
      skills: user.skills,
      interests: user.interests,
      workExperience: user.workExperience,
      education: user.education,
    };

    const newApplication = new Application({
      user: req.user.id,
      job: jobId,
      status: "Pending",
      profileSnapshot: profileSnapshot,
    });

    await newApplication.save();

    const notification = new Notification({
      user: req.user.id,
      message: `Your application for "${job.title}" at ${job.company} has been submitted successfully.`,
    });
    await notification.save();

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      application: newApplication,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's applications
app.get("/api/applications/my-applications", auth, async (req, res) => {
  try {
    const applications = await Application.find({ user: req.user.id })
      .populate("job")
      .sort({ createdAt: -1 });

    res.json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
// NEW: RECRUITER JOB MANAGEMENT APIs
// =================================================================

// Get all jobs posted by the recruiter
app.get("/api/recruiter/jobs", auth, recruiterAuth, async (req, res) => {
  try {
    const jobs = await Job.find({ recruiter: req.user.id }).sort({
      createdAt: -1,
    });

    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single job details (recruiter view)
app.get("/api/recruiter/jobs/:jobId", auth, recruiterAuth, async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.jobId,
      recruiter: req.user.id,
    });

    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new job posting
app.post("/api/recruiter/jobs", auth, recruiterAuth, async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      recruiter: req.user.id,
      status: "Open",
    };

    const newJob = new Job(jobData);
    await newJob.save();

    res.status(201).json({
      success: true,
      message: "Job posted successfully",
      job: newJob,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update job posting
app.put("/api/recruiter/jobs/:jobId", auth, recruiterAuth, async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.jobId,
      recruiter: req.user.id,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: "Job not found or you don't have permission to edit it",
      });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.jobId,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Job updated successfully",
      job: updatedJob,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete job posting
app.delete(
  "/api/recruiter/jobs/:jobId",
  auth,
  recruiterAuth,
  async (req, res) => {
    try {
      const job = await Job.findOne({
        _id: req.params.jobId,
        recruiter: req.user.id,
      });

      if (!job) {
        return res.status(404).json({
          success: false,
          error: "Job not found or you don't have permission to delete it",
        });
      }

      await Job.findByIdAndDelete(req.params.jobId);

      res.json({
        success: true,
        message: "Job deleted successfully",
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Mark job as filled
app.patch(
  "/api/recruiter/jobs/:jobId/mark-filled",
  auth,
  recruiterAuth,
  async (req, res) => {
    try {
      const job = await Job.findOne({
        _id: req.params.jobId,
        recruiter: req.user.id,
      });

      if (!job) {
        return res.status(404).json({
          success: false,
          error: "Job not found or you don't have permission to modify it",
        });
      }

      job.status = "Filled";
      await job.save();

      res.json({
        success: true,
        message: "Job marked as filled",
        job,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Get applications for a specific job (recruiter view)
app.get(
  "/api/recruiter/jobs/:jobId/applications",
  auth,
  recruiterAuth,
  async (req, res) => {
    try {
      const job = await Job.findOne({
        _id: req.params.jobId,
        recruiter: req.user.id,
      });

      if (!job) {
        return res.status(404).json({
          success: false,
          error:
            "Job not found or you don't have permission to view applications",
        });
      }

      const applications = await Application.find({ job: req.params.jobId })
        .populate("user", "name email")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        applications,
        jobTitle: job.title,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// =================================================================
// DASHBOARD APIs
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
// HELPER APIs FOR TESTING (Keep for backward compatibility)
// =================================================================

app.post("/api/test/create-job", async (req, res) => {
  try {
    // For testing, allow creating jobs without recruiter
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
    res.status(201).json({
      success: true,
      message: "Test notification created",
      notification: newNotification,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
// SERVER START
// =================================================================
const PORT = 1350;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Student ID: 23101350`);
  console.log(`Authentication: UPGRADED WITH ROLE-BASED REGISTRATION!`);
  console.log(`Job Discovery & Application: READY!`);
  console.log(`Recruiter Job Management: READY!`);
  console.log(`External API (Maps): READY FOR INTEGRATION!`);
});
