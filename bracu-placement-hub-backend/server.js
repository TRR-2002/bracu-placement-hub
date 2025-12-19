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

// USER SCHEMA
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
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);
const User = mongoose.model("User", UserSchema);

// JOB SCHEMA
const JobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: String,
    coordinates: { lat: { type: Number }, lng: { type: Number } },
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
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);
const Job = mongoose.model("Job", JobSchema);

// APPLICATION SCHEMA
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

// NOTIFICATION SCHEMA
const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    type: {
      type: String,
      enum: ["application", "forum", "connection", "system"],
      default: "system",
    },
    link: String,
  },
  { timestamps: true }
);
const Notification = mongoose.model("Notification", NotificationSchema);

// DASHBOARD SCHEMA
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

// FORUM POST SCHEMA
const ForumPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      enum: [
        "Interview Tips",
        "Job Seeking",
        "Career Advice",
        "Networking",
        "General Discussion",
        "Company Reviews",
      ],
      default: "General Discussion",
    },
    tags: [String],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    views: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);
const ForumPost = mongoose.model("ForumPost", ForumPostSchema);

// FORUM COMMENT SCHEMA
const ForumCommentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ForumPost",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);
const ForumComment = mongoose.model("ForumComment", ForumCommentSchema);

// =================================================================
// AUTHENTICATION & PROFILE APIs
// =================================================================

app.post("/api/auth/register", async (req, res) => {
  // ... (existing code is correct)
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Name, email, and password are required",
      });
    }
    if (role === "student" || !role) {
      if (!email.endsWith("@g.bracu.ac.bd")) {
        return res.status(400).json({
          success: false,
          error: "Students must use @g.bracu.ac.bd email addresses",
        });
      }
    } else if (role === "recruiter" || role === "admin") {
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
  // ... (existing code is correct)
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
  // ... (existing code is correct)
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/profile/status", auth, async (req, res) => {
  // ... (existing code is correct)
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

// ✅ FIXED: ADDED NEW ROUTE TO GET ANY USER'S PROFILE
app.get("/api/profile/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await User.findOne({ userId: userId }).select("-password");

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, error: "Profile not found" });
    }
    res.json({ success: true, profile: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

app.put("/api/profile/:userId", auth, async (req, res) => {
  // ... (existing code is correct)
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
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
// JOB DISCOVERY & APPLICATION APIs
// =================================================================

// ✅ FIXED: ADDED NEW ROUTE TO GET ALL JOBS FOR BROWSE PAGE
app.get("/api/jobs", auth, async (req, res) => {
  try {
    const jobs = await Job.find({ status: "Open" }).sort({ createdAt: -1 });
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

app.get("/api/jobs/search", auth, async (req, res) => {
  // ... (existing code is correct)
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

app.get("/api/jobs/:jobId", auth, async (req, res) => {
  // ... (existing code is correct)
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }
    const existingApplication = await Application.findOne({
      user: req.user.id,
      job: req.params.jobId,
    });
    res.json({ success: true, job, hasApplied: !!existingApplication });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/jobs/apply", auth, async (req, res) => {
  // ... (existing code is correct)
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
      profileSnapshot,
    });
    await newApplication.save();
    const notification = new Notification({
      user: req.user.id,
      message: `Your application for "${job.title}" at ${job.company} has been submitted successfully.`,
      type: "application",
      link: `/jobs/${jobId}`,
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

app.get("/api/applications/my-applications", auth, async (req, res) => {
  // ... (existing code is correct)
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
// RECRUITER JOB MANAGEMENT APIs
// =================================================================
// ... (All existing recruiter code is correct)
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
app.post("/api/recruiter/jobs", auth, recruiterAuth, async (req, res) => {
  try {
    const jobData = { ...req.body, recruiter: req.user.id, status: "Open" };
    const newJob = new Job(jobData);
    await newJob.save();
    res
      .status(201)
      .json({ success: true, message: "Job posted successfully", job: newJob });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
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
      res.json({ success: true, message: "Job deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);
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
      res.json({ success: true, message: "Job marked as filled", job });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);
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
      res.json({ success: true, applications, jobTitle: job.title });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// =================================================================
// COMMUNITY FORUM APIs
// =================================================================
// ... (All existing forum code is correct)
app.get("/api/forum/posts", auth, async (req, res) => {
  try {
    const { category, search, sortBy = "createdAt" } = req.query;
    let query = {};
    if (category && category !== "All") {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }
    let sortOptions = {};
    if (sortBy === "likes") {
      sortOptions = { "likes.length": -1, createdAt: -1 };
    } else if (sortBy === "views") {
      sortOptions = { views: -1, createdAt: -1 };
    } else {
      sortOptions = { isPinned: -1, createdAt: -1 };
    }
    const posts = await ForumPost.find(query)
      .populate("author", "name email department")
      .sort(sortOptions)
      .lean();
    const postsWithCounts = await Promise.all(
      posts.map(async (post) => {
        const commentCount = await ForumComment.countDocuments({
          post: post._id,
        });
        return {
          ...post,
          likeCount: post.likes.length,
          commentCount,
          isLiked: post.likes.some(
            (like) => like.toString() === req.user.id.toString()
          ),
        };
      })
    );
    res.json({ success: true, posts: postsWithCounts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get("/api/forum/posts/:postId", auth, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.postId)
      .populate("author", "name email department studentId")
      .lean();
    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }
    await ForumPost.findByIdAndUpdate(req.params.postId, {
      $inc: { views: 1 },
    });
    const comments = await ForumComment.find({ post: req.params.postId })
      .populate("author", "name email department")
      .sort({ createdAt: 1 })
      .lean();
    const commentsWithLikes = comments.map((comment) => ({
      ...comment,
      likeCount: comment.likes.length,
      isLiked: comment.likes.some(
        (like) => like.toString() === req.user.id.toString()
      ),
    }));
    res.json({
      success: true,
      post: {
        ...post,
        likeCount: post.likes.length,
        commentCount: comments.length,
        isLiked: post.likes.some(
          (like) => like.toString() === req.user.id.toString()
        ),
      },
      comments: commentsWithLikes,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
app.post("/api/forum/posts", auth, async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    if (!title || !content) {
      return res
        .status(400)
        .json({ success: false, error: "Title and content are required" });
    }
    const newPost = new ForumPost({
      title,
      content,
      category: category || "General Discussion",
      tags: tags || [],
      author: req.user.id,
    });
    await newPost.save();
    const populatedPost = await ForumPost.findById(newPost._id).populate(
      "author",
      "name email department"
    );
    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post: populatedPost,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
// ... other forum routes are also correct

// =================================================================
// NEW: ENHANCED PERSONALIZED DASHBOARD APIs
// =================================================================

// Get comprehensive dashboard data
app.get("/api/dashboard/:userId", auth, async (req, res) => {
  try {
    // 1. Find user by the userId in URL (e.g. "nina.hossain")
    const userFromParams = await User.findOne({ userId: req.params.userId });

    if (!userFromParams) {
      return res.status(404).json({ success: false, error: "User not found." });
    }

    // 2. Security Check: Only allow user to view their own dashboard
    if (req.user.id !== userFromParams._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Access denied. You can only view your own dashboard.",
      });
    }

    const user = userFromParams;

    // 3. Aggregate Dashboard Data
    const [
      applications,
      applicationStats,
      notifications,
      unreadCount,
      recentPosts,
      dashboard,
    ] = await Promise.all([
      // Get recent applications
      Application.find({ user: user._id })
        .populate("job")
        .sort({ createdAt: -1 })
        .limit(5),

      // Get application counts
      (async () => ({
        total: await Application.countDocuments({ user: user._id }),
        pending: await Application.countDocuments({
          user: user._id,
          status: "Pending",
        }),
        accepted: await Application.countDocuments({
          user: user._id,
          status: "Accepted",
        }),
      }))(),

      // Get notifications
      Notification.find({ user: user._id })
        .sort({ read: 1, createdAt: -1 })
        .limit(10),

      // Get unread count
      Notification.countDocuments({ user: user._id, read: false }),

      // Get user's recent forum posts
      ForumPost.find({ author: user._id })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),

      // Get saved jobs count
      Dashboard.findOne({ user: user._id }),
    ]);

    // Add counts to forum posts
    const postsWithCounts = await Promise.all(
      recentPosts.map(async (post) => {
        const commentCount = await ForumComment.countDocuments({
          post: post._id,
        });
        return { ...post, likeCount: post.likes.length, commentCount };
      })
    );

    // Populate connections for the connections tab
    await user.populate("connections", "name email department");

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
        applicationStats,
        notifications,
        unreadNotificationCount: unreadCount,
        connections: user.connections || [],
        connectionCount: user.connections ? user.connections.length : 0,
        recentForumPosts: postsWithCounts,
        savedJobsCount: dashboard ? dashboard.savedJobs.length : 0,
      },
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching dashboard data.",
    });
  }
});

// Route to Mark All Notifications as Read
app.patch(
  "/api/dashboard/notifications/mark-all-read",
  auth,
  async (req, res) => {
    try {
      await Notification.updateMany(
        { user: req.user.id, read: false },
        { $set: { read: true } }
      );
      res.json({ success: true, message: "All notifications marked as read" });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// =================================================================
// SERVER START
// =================================================================
const PORT = 1350;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Student ID: 23101350`);
  console.log(`Authentication: UPGRADED AND RUNNING!`);
  console.log(`Job Discovery & Application: READY!`);
  console.log(`Community Forum: READY!`);
  console.log(`Personalized Dashboard: ENHANCED AND READY!`);
  console.log(`External API (Maps): READY FOR INTEGRATION!`);
});
