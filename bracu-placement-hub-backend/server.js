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
    // NEW: Connected users for dashboard
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
    link: String, // URL to navigate to when clicked
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

// NEW: FORUM POST SCHEMA
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

// NEW: FORUM COMMENT SCHEMA
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
// JOB DISCOVERY & APPLICATION APIs
// =================================================================

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

      res.json({
        success: true,
        message: "Job deleted successfully",
      });
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
// NEW: COMMUNITY FORUM APIs
// =================================================================

// Get all forum posts with filters
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
      // Sort by number of likes (descending)
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

    // Add like count and comment count to each post
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

// Get single forum post with comments
app.get("/api/forum/posts/:postId", auth, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.postId)
      .populate("author", "name email department studentId")
      .lean();

    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    // Increment view count
    await ForumPost.findByIdAndUpdate(req.params.postId, {
      $inc: { views: 1 },
    });

    // Get comments
    const comments = await ForumComment.find({ post: req.params.postId })
      .populate("author", "name email department")
      .sort({ createdAt: 1 })
      .lean();

    // Add like info to comments
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

// Create new forum post
app.post("/api/forum/posts", auth, async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: "Title and content are required",
      });
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

// Update forum post
app.put("/api/forum/posts/:postId", auth, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        error: "You can only edit your own posts",
      });
    }

    const { title, content, category, tags } = req.body;

    const updatedPost = await ForumPost.findByIdAndUpdate(
      req.params.postId,
      { title, content, category, tags },
      { new: true }
    ).populate("author", "name email department");

    res.json({
      success: true,
      message: "Post updated successfully",
      post: updatedPost,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete forum post
app.delete("/api/forum/posts/:postId", auth, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        error: "You can only delete your own posts",
      });
    }

    // Delete all comments on this post
    await ForumComment.deleteMany({ post: req.params.postId });

    // Delete the post
    await ForumPost.findByIdAndDelete(req.params.postId);

    res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Like/Unlike a forum post
app.post("/api/forum/posts/:postId/like", auth, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    const userLikeIndex = post.likes.indexOf(req.user.id);

    if (userLikeIndex > -1) {
      // User already liked, so unlike
      post.likes.splice(userLikeIndex, 1);
      await post.save();

      res.json({
        success: true,
        message: "Post unliked",
        likeCount: post.likes.length,
        isLiked: false,
      });
    } else {
      // User hasn't liked, so like
      post.likes.push(req.user.id);
      await post.save();

      // Create notification for post author (if not self-like)
      if (post.author.toString() !== req.user.id.toString()) {
        const notification = new Notification({
          user: post.author,
          message: `${req.user.name} liked your post: "${post.title}"`,
          type: "forum",
          link: `/forum/posts/${post._id}`,
        });
        await notification.save();
      }

      res.json({
        success: true,
        message: "Post liked",
        likeCount: post.likes.length,
        isLiked: true,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add comment to forum post
app.post("/api/forum/posts/:postId/comments", auth, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: "Comment content is required",
      });
    }

    const post = await ForumPost.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    const newComment = new ForumComment({
      post: req.params.postId,
      author: req.user.id,
      content,
    });

    await newComment.save();

    const populatedComment = await ForumComment.findById(newComment._id)
      .populate("author", "name email department")
      .lean();

    // Create notification for post author (if not commenting on own post)
    if (post.author.toString() !== req.user.id.toString()) {
      const notification = new Notification({
        user: post.author,
        message: `${req.user.name} commented on your post: "${post.title}"`,
        type: "forum",
        link: `/forum/posts/${post._id}`,
      });
      await notification.save();
    }

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: {
        ...populatedComment,
        likeCount: 0,
        isLiked: false,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Like/Unlike a comment
app.post("/api/forum/comments/:commentId/like", auth, async (req, res) => {
  try {
    const comment = await ForumComment.findById(req.params.commentId);

    if (!comment) {
      return res
        .status(404)
        .json({ success: false, error: "Comment not found" });
    }

    const userLikeIndex = comment.likes.indexOf(req.user.id);

    if (userLikeIndex > -1) {
      // Unlike
      comment.likes.splice(userLikeIndex, 1);
      await comment.save();

      res.json({
        success: true,
        message: "Comment unliked",
        likeCount: comment.likes.length,
        isLiked: false,
      });
    } else {
      // Like
      comment.likes.push(req.user.id);
      await comment.save();

      // Create notification for comment author
      if (comment.author.toString() !== req.user.id.toString()) {
        const notification = new Notification({
          user: comment.author,
          message: `${req.user.name} liked your comment`,
          type: "forum",
          link: `/forum/posts/${comment.post}`,
        });
        await notification.save();
      }

      res.json({
        success: true,
        message: "Comment liked",
        likeCount: comment.likes.length,
        isLiked: true,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete comment
app.delete("/api/forum/comments/:commentId", auth, async (req, res) => {
  try {
    const comment = await ForumComment.findById(req.params.commentId);

    if (!comment) {
      return res
        .status(404)
        .json({ success: false, error: "Comment not found" });
    }

    // Check if user is the author
    if (comment.author.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        error: "You can only delete your own comments",
      });
    }

    await ForumComment.findByIdAndDelete(req.params.commentId);

    res.json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
// NEW: ENHANCED PERSONALIZED DASHBOARD APIs
// =================================================================

// Get comprehensive dashboard data
app.get("/api/dashboard/:userId", auth, async (req, res) => {
  try {
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ success: false, error: "Access denied." });
    }

    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("connections", "name email department");

    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });

    // Get applications with job details
    const applications = await Application.find({ user: user.id })
      .populate("job")
      .sort({ createdAt: -1 })
      .limit(5);

    // Get application statistics
    const applicationStats = {
      total: await Application.countDocuments({ user: user.id }),
      pending: await Application.countDocuments({
        user: user.id,
        status: "Pending",
      }),
      reviewed: await Application.countDocuments({
        user: user.id,
        status: "Reviewed",
      }),
      accepted: await Application.countDocuments({
        user: user.id,
        status: "Accepted",
      }),
      rejected: await Application.countDocuments({
        user: user.id,
        status: "Rejected",
      }),
    };

    // Get saved jobs
    const dashboard = await Dashboard.findOne({ user: user.id }).populate(
      "savedJobs"
    );

    // Get recent notifications (unread first)
    const notifications = await Notification.find({ user: user.id })
      .sort({ read: 1, createdAt: -1 })
      .limit(10);

    const unreadNotificationCount = await Notification.countDocuments({
      user: user.id,
      read: false,
    });

    // Get user's recent forum posts
    const recentPosts = await ForumPost.find({ author: user.id })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    const postsWithCounts = await Promise.all(
      recentPosts.map(async (post) => {
        const commentCount = await ForumComment.countDocuments({
          post: post._id,
        });
        return {
          ...post,
          likeCount: post.likes.length,
          commentCount,
        };
      })
    );

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
        applications: applications,
        applicationStats: applicationStats,
        savedJobsCount: dashboard ? dashboard.savedJobs.length : 0,
        savedJobs: dashboard ? dashboard.savedJobs : [],
        notifications: notifications,
        unreadNotificationCount: unreadNotificationCount,
        connections: user.connections || [],
        connectionCount: user.connections ? user.connections.length : 0,
        recentForumPosts: postsWithCounts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's applications for dashboard
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

// Get user's notifications
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

// Mark notification as read
app.patch(
  "/api/dashboard/notifications/:notificationId/read",
  auth,
  async (req, res) => {
    try {
      const notification = await Notification.findById(
        req.params.notificationId
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          error: "Notification not found",
        });
      }

      if (notification.user.toString() !== req.user.id.toString()) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }

      notification.read = true;
      await notification.save();

      res.json({
        success: true,
        message: "Notification marked as read",
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Mark all notifications as read
app.patch(
  "/api/dashboard/notifications/mark-all-read",
  auth,
  async (req, res) => {
    try {
      await Notification.updateMany(
        { user: req.user.id, read: false },
        { $set: { read: true } }
      );

      res.json({
        success: true,
        message: "All notifications marked as read",
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Get saved jobs
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

// Save a job
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

// Remove saved job
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

// NEW: User Connections APIs

// Get user's connections
app.get("/api/dashboard/connections/:userId", auth, async (req, res) => {
  try {
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ success: false, error: "Access denied." });
    }

    const user = await User.findById(req.user.id).populate(
      "connections",
      "name email department studentId"
    );

    res.json({
      success: true,
      connections: user.connections || [],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add connection
app.post("/api/dashboard/connections/add", auth, async (req, res) => {
  try {
    const { userId } = req.body; // ID of user to connect with

    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        error: "You cannot connect with yourself",
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const currentUser = await User.findById(req.user.id);

    if (currentUser.connections.includes(userId)) {
      return res.status(400).json({
        success: false,
        error: "Already connected with this user",
      });
    }

    // Add to both users' connections
    currentUser.connections.push(userId);
    targetUser.connections.push(req.user.id);

    await currentUser.save();
    await targetUser.save();

    // Create notification for target user
    const notification = new Notification({
      user: userId,
      message: `${currentUser.name} connected with you`,
      type: "connection",
      link: `/profile/view/${currentUser.userId}`,
    });
    await notification.save();

    res.json({
      success: true,
      message: "Connection added successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove connection
app.post("/api/dashboard/connections/remove", auth, async (req, res) => {
  try {
    const { userId } = req.body;

    const currentUser = await User.findById(req.user.id);
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Remove from both users' connections
    currentUser.connections = currentUser.connections.filter(
      (conn) => conn.toString() !== userId
    );
    targetUser.connections = targetUser.connections.filter(
      (conn) => conn.toString() !== req.user.id
    );

    await currentUser.save();
    await targetUser.save();

    res.json({
      success: true,
      message: "Connection removed successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search users to connect
app.get("/api/users/search", auth, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: "Search query must be at least 2 characters",
      });
    }

    const users = await User.find({
      _id: { $ne: req.user.id }, // Exclude current user
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { department: { $regex: query, $options: "i" } },
      ],
    })
      .select("name email department studentId")
      .limit(20);

    // Check which users are already connected
    const currentUser = await User.findById(req.user.id);
    const usersWithConnectionStatus = users.map((user) => ({
      ...user.toObject(),
      isConnected: currentUser.connections.some(
        (conn) => conn.toString() === user._id.toString()
      ),
    }));

    res.json({
      success: true,
      users: usersWithConnectionStatus,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
// HELPER APIs FOR TESTING
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
  console.log(`Authentication: UPGRADED AND RUNNING!`);
  console.log(`Job Discovery & Application: READY!`);
  console.log(`Community Forum: READY!`);
  console.log(`Personalized Dashboard: ENHANCED AND READY!`);
  console.log(`External API (Maps): READY FOR INTEGRATION!`);
});
