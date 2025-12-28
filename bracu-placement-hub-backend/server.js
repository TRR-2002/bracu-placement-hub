// =================================================================
// BRACU PLACEMENT HUB - COMPLETE BACKEND
// All 24 Features Implemented Across 3 Modules
// =================================================================

// =================================================================
// SETUP AND DEPENDENCIES
// =================================================================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const cron = require("node-cron");
require("dotenv").config();
const app = express();
const { sendOTPEmail } = require("./EmailService");

// =================================================================
// GOOGLE CALENDAR API SETUP (Member 1/2 External API Integration)
// =================================================================
const { google } = require("googleapis");

// Google Calendar API configuration
const googleCalendar = google.calendar({
  version: "v3",
  auth: new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/calendar"],
    credentials: {
      type: "service_account",
      project_id: process.env.GOOGLE_CALENDAR_PROJECT_ID,
      private_key_id: process.env.GOOGLE_CALENDAR_KEY_ID,
      private_key: process.env.GOOGLE_CALENDAR_PRIVATE_KEY
        ? process.env.GOOGLE_CALENDAR_PRIVATE_KEY.replace(/\\n/g, "\n")
        : null,
      client_email: process.env.GOOGLE_CALENDAR_EMAIL,
      client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.GOOGLE_CALENDAR_CERT_URL,
    },
  }),
});

// Helper function to add deadline to Google Calendar
async function addApplicationDeadlineToCalendar(
  userEmail,
  jobTitle,
  company,
  deadline
) {
  try {
    if (!process.env.GOOGLE_CALENDAR_EMAIL) {
      console.warn(
        "⚠️ Google Calendar not configured - skipping calendar sync"
      );
      return { success: false, reason: "not_configured" };
    }

    const event = {
      summary: `📋 Application Deadline: ${jobTitle} at ${company}`,
      description: `Submit your application for ${jobTitle} position at ${company}`,
      start: {
        dateTime: new Date(deadline),
        timeZone: "Asia/Dhaka",
      },
      end: {
        dateTime: new Date(new Date(deadline).getTime() + 60 * 60 * 1000), // 1 hour duration
        timeZone: "Asia/Dhaka",
      },
      attendees: [{ email: userEmail }],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 }, // 1 day before
          { method: "email", minutes: 2 * 60 }, // 2 hours before
          { method: "popup", minutes: 30 }, // 30 min before
        ],
      },
      colorId: "3", // Cyan color for application deadlines
    };

    const response = await googleCalendar.events.insert({
      calendarId: "primary",
      resource: event,
      sendUpdates: "all",
    });

    console.log("✅ Application deadline added to calendar:", response.data.id);
    return { success: true, eventId: response.data.id };
  } catch (error) {
    console.error(
      "⚠️ Calendar sync error (continuing without calendar):",
      error.message
    );
    return { success: false, error: error.message };
  }
}

// Helper function to remove deadline from Google Calendar
async function removeApplicationDeadlineFromCalendar(eventId) {
  try {
    if (!eventId || !process.env.GOOGLE_CALENDAR_EMAIL) {
      return { success: false };
    }

    await googleCalendar.events.delete({
      calendarId: "primary",
      eventId: eventId,
    });

    console.log("✅ Application deadline removed from calendar");
    return { success: true };
  } catch (error) {
    console.error("⚠️ Error removing calendar event:", error.message);
    return { success: false };
  }
}

// Helper function to create job posting event on Google Calendar
async function createJobPostingEvent(
  jobTitle,
  company,
  deadline,
  location,
  description
) {
  try {
    if (!process.env.GOOGLE_CALENDAR_EMAIL) {
      console.warn(
        "⚠️ Google Calendar not configured - skipping job posting event"
      );
      return { success: false, reason: "not_configured" };
    }

    const event = {
      summary: `💼 New Job Posted: ${jobTitle} at ${company}`,
      description: `${
        description || "New job opportunity available"
      }\n\nApplication Deadline: ${new Date(deadline).toLocaleDateString(
        "en-US",
        { year: "numeric", month: "long", day: "numeric" }
      )}`,
      location: location || "Online",
      start: {
        dateTime: new Date(),
        timeZone: "Asia/Dhaka",
      },
      end: {
        dateTime: new Date(new Date().getTime() + 2 * 60 * 60 * 1000),
        timeZone: "Asia/Dhaka",
      },
      reminders: {
        useDefault: false,
        overrides: [{ method: "popup", minutes: 0 }],
      },
      colorId: "5", // Purple color for job postings
    };

    const response = await googleCalendar.events.insert({
      calendarId: "primary",
      resource: event,
      sendUpdates: "all",
    });

    console.log("✅ Job posting event created on calendar:", response.data.id);
    return { success: true, eventId: response.data.id };
  } catch (error) {
    console.error("⚠️ Error creating job posting event:", error.message);
    return { success: false, error: error.message };
  }
}

// Helper function to create recruitment drive/event on Google Calendar
async function createRecruitmentDriveEvent(
  eventName,
  company,
  startTime,
  endTime,
  location,
  description,
  attendees = []
) {
  try {
    if (!process.env.GOOGLE_CALENDAR_EMAIL) {
      console.warn(
        "⚠️ Google Calendar not configured - skipping recruitment drive event"
      );
      return { success: false, reason: "not_configured" };
    }

    const event = {
      summary: `🎓 Campus Recruitment Drive: ${eventName} - ${company}`,
      description: `${
        description || "Campus recruitment event"
      }\n\nCompany: ${company}`,
      location: location || "Campus",
      start: {
        dateTime: new Date(startTime),
        timeZone: "Asia/Dhaka",
      },
      end: {
        dateTime: new Date(endTime),
        timeZone: "Asia/Dhaka",
      },
      attendees: attendees.map((email) => ({
        email,
        responseStatus: "needsAction",
      })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 }, // 1 day before
          { method: "email", minutes: 2 * 60 }, // 2 hours before
          { method: "popup", minutes: 30 }, // 30 min before
        ],
      },
      colorId: "2", // Blue color for recruitment drives
    };

    const response = await googleCalendar.events.insert({
      calendarId: "primary",
      resource: event,
      sendUpdates: "all",
    });

    console.log(
      "✅ Recruitment drive event created on calendar:",
      response.data.id
    );
    return { success: true, eventId: response.data.id };
  } catch (error) {
    console.error("⚠️ Error creating recruitment drive event:", error.message);
    return { success: false, error: error.message };
  }
}

// Helper function to create interview slot on Google Calendar
async function scheduleInterviewSlot(
  studentEmail,
  recruiterEmail,
  jobTitle,
  company,
  interviewTime,
  meetLink = null
) {
  try {
    if (!process.env.GOOGLE_CALENDAR_EMAIL) {
      console.warn(
        "⚠️ Google Calendar not configured - skipping interview scheduling"
      );
      return { success: false, reason: "not_configured" };
    }

    const meetingDescription = meetLink
      ? `Interview Link: ${meetLink}\n\nClick the link to join the meeting.`
      : "Interview scheduled. Details to follow.";

    const event = {
      summary: `📞 Interview: ${jobTitle} at ${company}`,
      description: meetingDescription,
      start: {
        dateTime: new Date(interviewTime),
        timeZone: "Asia/Dhaka",
      },
      end: {
        dateTime: new Date(new Date(interviewTime).getTime() + 60 * 60 * 1000), // 1 hour duration
        timeZone: "Asia/Dhaka",
      },
      attendees: [{ email: studentEmail }, { email: recruiterEmail }],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 }, // 1 day before
          { method: "email", minutes: 30 }, // 30 min before
          { method: "popup", minutes: 15 }, // 15 min before
        ],
      },
      colorId: "1", // Red color for interviews
      ...(meetLink && {
        conferenceData: {
          conferenceSolution: {
            key: {
              conferenceSolutionKey: { conferenceSolutionType: "hangoutsMeet" },
            },
          },
        },
      }),
    };

    const response = await googleCalendar.events.insert({
      calendarId: "primary",
      resource: event,
      conferenceDataVersion: meetLink ? 1 : 0,
      sendUpdates: "all",
    });

    console.log("✅ Interview scheduled on calendar:", response.data.id);
    return { success: true, eventId: response.data.id };
  } catch (error) {
    console.error("⚠️ Error scheduling interview:", error.message);
    return { success: false, error: error.message };
  }
}

// =================================================================
// MIDDLEWARE
// =================================================================
app.use(express.json());
app.use(cors());

// Authentication middleware
// =================================================================
// UPDATED AUTH MIDDLEWARE (With Debugging)
// =================================================================
const auth = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      console.error("❌ Auth Failed: No token provided");
      return res.status(401).json({
        success: false,
        error: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Validate that the decoded token has the necessary ID
    if (!decoded || !decoded.id) {
      console.error(
        "❌ Auth Failed: Invalid token payload (missing id)",
        decoded
      );
      return res.status(401).json({
        success: false,
        error: "Invalid token structure",
      });
    }

    // console.log("✅ Auth Successful for User ID:", decoded.id); // Uncomment for verbose logs
    req.user = decoded;
    next();
  } catch (error) {
    console.error("❌ Auth Error:", error.message);
    res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
};

// Recruiter authorization middleware
const recruiterAuth = (req, res, next) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({
      success: false,
      error: "Access denied. Recruiter role required.",
    });
  }
  next();
};

// Admin authorization middleware
const adminAuth = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, error: "Access denied. Admin role required." });
  }
  next();
};

// =================================================================
// DATABASE CONNECTION
// =================================================================
const MONGODB_URI = process.env.MONGO_URI;
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully!"))
  .catch((err) => console.error("MongoDB connection failed:", err));

// =================================================================
// MONGOOSE SCHEMAS & MODELS
// =================================================================

// OTP Schema for email verification and password reset
const OTPSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    otp: { type: String, required: true },
    type: {
      type: String,
      enum: ["registration", "password_reset"],
      required: true,
    },
    expiresAt: { type: Date, required: true },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const OTP = mongoose.model("OTP", OTPSchema);

// Enhanced User Schema
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
    isVerified: { type: Boolean, default: false },

    // Student fields
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

    // Recruiter/Company fields
    companyName: String,
    companyIndustry: String,
    companyDescription: String,
    companyLocation: String,
    companySize: String,

    // Account status
    isActive: { type: Boolean, default: true },
    warnings: { type: Number, default: 0 },
    suspendedUntil: Date,
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

// Enhanced Job Schema
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
    applicationDeadline: Date,
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Job = mongoose.model("Job", JobSchema);

// Application Schema
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
    // Interview scheduling fields
    interviewScheduled: { type: Boolean, default: false },
    interviewTime: Date,
    interviewMeetLink: String,
    interviewCalendarEventId: String,
  },
  { timestamps: true }
);

const Application = mongoose.model("Application", ApplicationSchema);

// Invitation Schema - NEW
const InvitationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: String,
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Declined"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

const Invitation = mongoose.model("Invitation", InvitationSchema);

// Notification Schema
const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "application",
        "invitation",
        "message",
        "connection",
        "review",
        "system",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: String,
    read: { type: Boolean, default: false },
    relatedId: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", NotificationSchema);

// Message Schema - NEW
const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: String,
    content: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", MessageSchema);

// Review Schema - NEW
const ReviewSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    workCulture: { type: Number, min: 1, max: 5 },
    salary: { type: Number, min: 1, max: 5 },
    careerGrowth: { type: Number, min: 1, max: 5 },
    comment: String,
    flagged: { type: Boolean, default: false },
    flagReason: String,
    aiAnalysis: String,
  },
  { timestamps: true }
);

const Review = mongoose.model("Review", ReviewSchema);

// Forum Post Schema - NEW
const ForumPostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
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
      required: true,
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    tags: { type: [String], default: [] }, // An array of strings, defaults to empty
    views: { type: Number, default: 0 }, // A number, defaults to 0
    flagged: { type: Boolean, default: false },
    flagReason: String,
    aiAnalysis: String,
  },
  { timestamps: true }
);

const ForumPost = mongoose.model("ForumPost", ForumPostSchema);

// Forum Comment Schema - NEW
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
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // <-- ADD THIS LINE
    flagged: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const ForumComment = mongoose.model("ForumComment", ForumCommentSchema);

// Dashboard Schema
const DashboardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
  connections: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

const Dashboard = mongoose.model("Dashboard", DashboardSchema);

// Calendar Event Tracking Schema (for Google Calendar sync)
const CalendarEventSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application" },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    googleEventId: { type: String },
    deadline: { type: Date, required: true },
    jobTitle: String,
    company: String,
    eventType: {
      type: String,
      enum: ["job_posting_deadline", "application_deadline", "interview"],
      default: "application_deadline",
    },
    isAutomaticSync: { type: Boolean, default: false },
    googleSyncStatus: {
      type: String,
      enum: ["synced", "failed", "pending"],
      default: "pending",
    },
    syncError: String,
  },
  { timestamps: true }
);

const CalendarEvent = mongoose.model("CalendarEvent", CalendarEventSchema);

// =================================================================
// UTILITY FUNCTIONS
// =================================================================

// Generate 6-digit OTP
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// Send OTP email (simulated - replace with real email service)

// Simple AI content moderation (replace with real AI service)
async function moderateContent(text) {
  const negativeKeywords = [
    "hate",
    "abuse",
    "scam",
    "fraud",
    "terrible",
    "worst",
    "awful",
    "stupid",
    "idiot",
  ];
  const inappropriateKeywords = ["profanity", "offensive", "spam"];

  let score = 0;
  let flags = [];

  const lowerText = text.toLowerCase();

  negativeKeywords.forEach((keyword) => {
    if (lowerText.includes(keyword)) {
      score += 2;
      flags.push(`Negative sentiment: "${keyword}"`);
    }
  });

  inappropriateKeywords.forEach((keyword) => {
    if (lowerText.includes(keyword)) {
      score += 3;
      flags.push(`Inappropriate content: "${keyword}"`);
    }
  });

  return {
    flagged: score >= 2,
    score,
    flags,
    analysis:
      flags.length > 0 ? flags.join("; ") : "Content appears appropriate",
  };
}

// Create notification helper
async function createNotification(
  userId,
  type,
  title,
  message,
  link = null,
  relatedId = null
) {
  const notification = new Notification({
    user: userId,
    type,
    title,
    message,
    link,
    relatedId,
  });
  await notification.save();
  return notification;
}

// =================================================================
// CRON JOB FOR DEADLINE MANAGEMENT
// =================================================================

// Check for expired job deadlines every hour
cron.schedule("0 * * * *", async () => {
  try {
    console.log("🕐 Running deadline check...");

    const expiredJobs = await Job.find({
      status: "Open",
      applicationDeadline: { $lt: new Date() },
    });

    for (const job of expiredJobs) {
      job.status = "Closed";
      await job.save();

      // Notify recruiter
      await createNotification(
        job.recruiter,
        "system",
        "Job Application Deadline Passed",
        `Applications for "${job.title}" are now closed.`,
        `/recruiter/jobs/${job._id}`
      );

      console.log(`✅ Closed job: ${job.title}`);
    }
  } catch (error) {
    console.error("❌ Deadline check error:", error);
  }
});

// =================================================================
// AUTHENTICATION APIs WITH OTP
// =================================================================

// Step 1: Request OTP for registration
app.post("/api/auth/request-otp", async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, error: "Email is required" });
    }

    // Role-specific email validation
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

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return res
        .status(400)
        .json({ success: false, error: "User already exists" });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email, type: "registration" });

    // Save new OTP
    const otpDoc = new OTP({
      email,
      otp,
      type: "registration",
      expiresAt,
    });
    await otpDoc.save();

    // Send OTP email
    await sendOTPEmail(email, otp, "registration");

    res.json({
      success: true,
      message: "OTP sent to your email. Valid for 10 minutes.",
      email,
      // REMOVE THIS IN PRODUCTION - Only for testing
    });
  } catch (error) {
    console.error("Request OTP error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Step 2: Verify OTP and complete registration
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role, otp } = req.body;

    if (!name || !email || !password || !otp) {
      return res.status(400).json({
        success: false,
        error: "Name, email, password, and OTP are required",
      });
    }

    // Find valid OTP
    const otpDoc = await OTP.findOne({
      email,
      otp,
      type: "registration",
      expiresAt: { $gt: new Date() },
      verified: false,
    });

    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired OTP",
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user && user.isVerified) {
      return res
        .status(400)
        .json({ success: false, error: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create or update user
    const userId = email.split("@")[0];

    if (user) {
      user.name = name;
      user.password = hashedPassword;
      user.role = role || "student";
      user.isVerified = true;
      await user.save();
    } else {
      user = new User({
        name,
        userId,
        email,
        password: hashedPassword,
        role: role || "student",
        isVerified: true,
      });
      await user.save();
    }

    // Mark OTP as verified
    otpDoc.verified = true;
    await otpDoc.save();

    // Create dashboard for user
    const dashboard = new Dashboard({ user: user._id });
    await dashboard.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      userId: user.userId,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res
        .status(401)
        .json({ success: false, error: "Please verify your email first" });
    }

    if (!user.isActive) {
      const message = user.suspendedUntil
        ? `Account suspended until ${user.suspendedUntil.toLocaleDateString()}`
        : "Account is suspended";
      return res.status(401).json({ success: false, error: message });
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
        _id: user._id,
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

// Request password reset OTP
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OTP.deleteMany({ email, type: "password_reset" });

    const otpDoc = new OTP({
      email,
      otp,
      type: "password_reset",
      expiresAt,
    });
    await otpDoc.save();

    await sendOTPEmail(email, otp, "password_reset");

    res.json({
      success: true,
      message: "OTP sent to your email",
      email,
      // REMOVE IN PRODUCTION
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reset password with OTP
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const otpDoc = await OTP.findOne({
      email,
      otp,
      type: "password_reset",
      expiresAt: { $gt: new Date() },
      verified: false,
    });

    if (!otpDoc) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid or expired OTP" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    otpDoc.verified = true;
    await otpDoc.save();

    res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get profile
app.get("/api/auth/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Profile status check
app.get("/api/profile/status", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "User not found", hasProfile: false });
    }

    let hasProfile = false;

    if (user.role === "student") {
      hasProfile = !!(
        user.skills &&
        user.skills.length > 0 &&
        user.interests &&
        user.interests.length > 0
      );
    } else if (user.role === "recruiter") {
      hasProfile = !!(user.companyName && user.companyIndustry);
    }

    res.json({
      success: true,
      hasProfile,
      userId: user.userId,
      role: user.role,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: error.message, hasProfile: false });
  }
});

// Update profile
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
// COMPANY PROFILE MANAGEMENT (Module 1 - Feature 3)
// =================================================================

// Get company profile
app.get("/api/company/:companyId", auth, async (req, res) => {
  try {
    const company = await User.findOne({
      _id: req.params.companyId,
      role: "recruiter",
    }).select("-password");

    if (!company) {
      return res
        .status(404)
        .json({ success: false, error: "Company not found" });
    }

    // Get company reviews
    const reviews = await Review.find({ company: req.params.companyId })
      .populate("reviewer", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    // Calculate average rating
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    res.json({
      success: true,
      company,
      reviews,
      avgRating: avgRating.toFixed(1),
      reviewCount: reviews.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update company profile (recruiter only)
app.put("/api/company/profile", auth, recruiterAuth, async (req, res) => {
  try {
    const {
      companyName,
      companyIndustry,
      companyDescription,
      companyLocation,
      companySize,
    } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          companyName,
          companyIndustry,
          companyDescription,
          companyLocation,
          companySize,
        },
      },
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Company profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search companies
app.get("/api/companies/search", auth, async (req, res) => {
  try {
    const { keyword, industry } = req.query;

    let query = {
      role: "recruiter",
      companyName: { $exists: true, $ne: null },
    };

    if (keyword) {
      query.$or = [
        { companyName: { $regex: keyword, $options: "i" } },
        { companyDescription: { $regex: keyword, $options: "i" } },
      ];
    }

    if (industry) {
      query.companyIndustry = { $regex: industry, $options: "i" };
    }

    const companies = await User.find(query)
      .select(
        "companyName companyIndustry companyDescription companyLocation companySize"
      )
      .limit(50);

    res.json({ success: true, companies });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
// JOB MANAGEMENT APIs
// =================================================================

// Search jobs with filters
app.get("/api/jobs/search", auth, async (req, res) => {
  try {
    const { keyword, location, minSalary, maxSalary } = req.query;
    let query = { status: "Open" };

    // Check deadline
    query.$or = [
      { applicationDeadline: { $exists: false } },
      { applicationDeadline: null },
      { applicationDeadline: { $gte: new Date() } },
    ];

    if (keyword) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: keyword, $options: "i" } },
          { company: { $regex: keyword, $options: "i" } },
          { description: { $regex: keyword, $options: "i" } },
        ],
      });
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

    const jobsResponse = jobs.map((job) => ({
      _id: job._id,
      title: job.title,
      company: job.company,
      companyId: job.recruiter,
      location: job.location,
      status: job.status,
      type: job.type,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      requiredSkills: job.requiredSkills,
      description: job.description,
      coordinates: job.coordinates,
      applicationDeadline: job.applicationDeadline,
      createdAt: job.createdAt,
    }));

    res.json({ success: true, count: jobsResponse.length, jobsResponse });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single job details
app.get("/api/jobs/:jobId", auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId).populate(
      "recruiter",
      "name email companyName"
    );
    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    const existingApplication = await Application.findOne({
      user: req.user.id,
      job: req.params.jobId,
    });

    const jobsResponse = {
      _id: job._id,
      title: job.title,
      company: job.company,
      companyId: job.recruiter._id, // recruiter mapped to companyId
      location: job.location,
      status: job.status,
      type: job.type,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      requiredSkills: job.requiredSkills,
      description: job.description,
      coordinates: job.coordinates,
      applicationDeadline: job.applicationDeadline,
      recruiter: job.recruiter, // optional if you want recruiter info
    };

    res.json({
      success: true,
      job: jobsResponse,
      hasApplied: !!existingApplication,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Apply to job
app.post("/api/jobs/apply", auth, async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: "jobId is required",
      });
    }

    // ✅ FIX 2: Validate logged-in user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized user",
      });
    }

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

    // Check deadline
    if (job.applicationDeadline && new Date() > job.applicationDeadline) {
      return res.status(400).json({
        success: false,
        error: "Application deadline has passed",
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
    // 📅 GOOGLE CALENDAR INTEGRATION: Check if deadline already in calendar from automatic sync
    let calendarEventId = null;
    let existingCalendarEvent = null;

    if (job.applicationDeadline) {
      // Check if this job deadline is already in student's calendar (from automatic sync)
      existingCalendarEvent = await CalendarEvent.findOne({
        user: req.user.id,
        job: jobId,
        eventType: "job_posting_deadline",
      });

      // Only add if not already synced
      if (!existingCalendarEvent) {
        const calendarResult = await addApplicationDeadlineToCalendar(
          user.email,
          job.title,
          job.company,
          job.applicationDeadline
        );

        // ✅ IMPORTANT: Save to database ALWAYS, regardless of Google Calendar sync status
        const calendarEvent = new CalendarEvent({
          user: req.user.id,
          application: newApplication._id,
          job: jobId,
          googleEventId: calendarResult.success ? calendarResult.eventId : null,
          deadline: job.applicationDeadline,
          jobTitle: job.title,
          company: job.company,
          eventType: "application_deadline",
          googleSyncStatus: calendarResult.success ? "synced" : "failed",
          syncError: calendarResult.success ? null : calendarResult.error,
        });
        await calendarEvent.save();

        if (calendarResult.success) {
          calendarEventId = calendarResult.eventId;
          console.log("✅ Application deadline added to Google Calendar");
        } else {
          console.log(
            "✅ Application deadline tracked in database (Google Calendar sync failed)"
          );
        }
      } else {
        console.log("ℹ️ Job deadline already synced to student calendar");
        calendarEventId = existingCalendarEvent.googleEventId;
      }
    }

    // Create notification for student
    await createNotification(
      req.user.id,
      "application",
      "Application Submitted",
      `Your application for "${job.title}" at ${
        job.company
      } has been submitted successfully.${
        job.applicationDeadline
          ? " Deadline added to your Google Calendar! 📅"
          : ""
      }`,
      `/jobs/${job._id}`
    );

    // Create notification for recruiter
    await createNotification(
      job.recruiter,
      "application",
      "New Application Received",
      `${user.name} has applied for ${job.title}`,
      `/recruiter/jobs/${jobId}/applications`
    );

    const responseJob = {
      ...job.toObject(),
      companyId: job.recruiter._id,
    };

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      application: newApplication,
      job: responseJob,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's applications
app.get("/api/applications/my-applications", auth, async (req, res) => {
  try {
    const applications = await Application.find({ user: req.user.id })
      .populate({
        path: "job",
        select: "title company recruiter location status",
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
// RECRUITER JOB MANAGEMENT
// =================================================================

// Get recruiter's jobs
app.get("/api/recruiter/jobs", auth, recruiterAuth, async (req, res) => {
  try {
    const jobs = await Job.find({ recruiter: req.user.id }).sort({
      createdAt: -1,
    });

    const jobsResponse = jobs.map((job) => ({
      _id: job._id,
      title: job.title,
      company: job.company,
      companyId: job.recruiter, // recruiter mapped to companyId
      location: job.location,
      status: job.status,
      type: job.type,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      requiredSkills: job.requiredSkills,
      description: job.description,
      coordinates: job.coordinates,
      applicationDeadline: job.applicationDeadline,
      createdAt: job.createdAt,
    }));

    res.json({ success: true, jobs: jobsResponse });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single job (recruiter view)
app.get("/api/recruiter/jobs/:jobId", auth, recruiterAuth, async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.jobId,
      recruiter: req.user.id,
    });

    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    const jobsResponse = {
      _id: job._id,
      title: job.title,
      company: job.company,
      companyId: job.recruiter,
      location: job.location,
      status: job.status,
      type: job.type,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      requiredSkills: job.requiredSkills,
      description: job.description,
      coordinates: job.coordinates,
      applicationDeadline: job.applicationDeadline,
    };

    res.json({ success: true, job: jobsResponse });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create job posting
app.post("/api/recruiter/jobs", auth, recruiterAuth, async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      recruiter: req.user.id,
      status: "Open",
    };

    const newJob = new Job(jobData);
    await newJob.save();

    // 📅 GOOGLE CALENDAR INTEGRATION: Create calendar event for job posting
    let calendarEventId = null;
    if (newJob.applicationDeadline) {
      const recruiter = await User.findById(req.user.id);
      const calendarResult = await createJobPostingEvent(
        newJob.title,
        newJob.company,
        newJob.applicationDeadline,
        newJob.location,
        newJob.description
      );

      if (calendarResult.success) {
        // Store calendar event ID in job for future reference
        calendarEventId = calendarResult.eventId;
        console.log(
          "✅ Job posting added to recruiter calendar:",
          calendarEventId
        );
      }

      // 🚀 NEW: Automatically add job deadline to ALL students' calendars
      try {
        const allStudents = await User.find({ role: "student" });
        console.log(
          `📅 Syncing job deadline to ${allStudents.length} students' calendars...`
        );

        for (const student of allStudents) {
          try {
            const studentCalendarResult =
              await addApplicationDeadlineToCalendar(
                student.email,
                newJob.title,
                newJob.company,
                newJob.applicationDeadline
              );

            // ✅ IMPORTANT: Save to database ALWAYS, regardless of Google Calendar sync status
            const calendarEvent = new CalendarEvent({
              user: student._id,
              job: newJob._id,
              googleEventId: studentCalendarResult.success
                ? studentCalendarResult.eventId
                : null,
              deadline: newJob.applicationDeadline,
              jobTitle: newJob.title,
              company: newJob.company,
              eventType: "job_posting_deadline",
              isAutomaticSync: true, // Mark as automatic sync
              googleSyncStatus: studentCalendarResult.success
                ? "synced"
                : "failed", // Track sync status
              syncError: studentCalendarResult.success
                ? null
                : studentCalendarResult.error,
            });
            await calendarEvent.save();

            if (studentCalendarResult.success) {
              console.log(
                `✅ Added ${newJob.title} deadline to ${student.email}`
              );
            } else {
              console.log(
                `✅ Tracked deadline in database for ${student.email} (Google Calendar sync failed)`
              );
            }
          } catch (studentError) {
            console.error(
              `⚠️ Failed to track deadline for ${student.email}:`,
              studentError.message
            );
            // Continue with other students if one fails
          }
        }
      } catch (syncError) {
        console.error("⚠️ Batch calendar sync error:", syncError.message);
        // Don't fail the job creation if calendar sync fails
      }
    }

    // Create notification for recruiters/admins about new job posting
    await createNotification(
      req.user.id,
      "system",
      "Job Posted Successfully",
      `Your job posting for "${newJob.title}" at ${
        newJob.company
      } is now live and accepting applications.${
        newJob.applicationDeadline
          ? " Deadline added to all student calendars! 📅"
          : ""
      }`,
      `/recruiter/jobs/${newJob._id}`
    );

    res.status(201).json({
      success: true,
      message: "Job posted successfully",
      job: newJob,
      calendarEvent: calendarEventId
        ? {
            eventId: calendarEventId,
            message: "Job posting added to recruiter and all student calendars",
          }
        : null,
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

// Delete job
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

// Get applications for a job
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
        .populate(
          "user",
          "name email department cgpa skills studentId workExperience education resumeLink"
        )
        .sort({ createdAt: -1 });

      const responseJob = {
        ...job.toObject(),
        companyId: job.recruiter,
      };

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

// Update application status (Accept/Reject)
app.patch(
  "/api/recruiter/applications/:id/status",
  auth,
  recruiterAuth,
  async (req, res) => {
    try {
      const { status } = req.body;
      if (!["Accepted", "Rejected"].includes(status)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid status" });
      }

      const application = await Application.findById(req.params.id).populate(
        "job"
      );

      if (!application) {
        return res
          .status(404)
          .json({ success: false, error: "Application not found" });
      }

      // Verify recruiter owns the job
      const job = await Job.findOne({
        _id: application.job._id,
        recruiter: req.user.id,
      });

      if (!job) {
        return res.status(403).json({
          success: false,
          error: "You are not authorized to manage this application",
        });
      }

      application.status = status;
      await application.save();

      // Notify student
      await createNotification(
        application.user,
        "application",
        `Application ${status}`,
        `Your application for ${job.title} at ${job.company} has been ${status}.`,
        `/applications`
      );

      res.json({
        success: true,
        message: `Application ${status} successfully`,
        application,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Schedule interview for accepted application
app.post(
  "/api/recruiter/applications/:id/schedule-interview",
  auth,
  recruiterAuth,
  async (req, res) => {
    try {
      const { interviewTime, meetLink } = req.body;

      if (!interviewTime) {
        return res.status(400).json({
          success: false,
          error: "Interview time is required",
        });
      }

      const application = await Application.findById(req.params.id)
        .populate("job")
        .populate("user", "email name");

      if (!application) {
        return res.status(404).json({
          success: false,
          error: "Application not found",
        });
      }

      // Verify recruiter owns the job
      const job = await Job.findOne({
        _id: application.job._id,
        recruiter: req.user.id,
      });

      if (!job) {
        return res.status(403).json({
          success: false,
          error: "You are not authorized to schedule interviews for this job",
        });
      }

      // Verify application is accepted
      if (application.status !== "Accepted") {
        return res.status(400).json({
          success: false,
          error: "Can only schedule interviews for accepted applications",
        });
      }

      // Get recruiter email
      const recruiter = await User.findById(req.user.id);

      // Schedule interview on Google Calendar
      const calendarResult = await scheduleInterviewSlot(
        application.user.email,
        recruiter.email,
        job.title,
        job.company,
        interviewTime,
        meetLink
      );

      // Store interview details in application
      // Parse the datetime string and create a proper Date object
      // The interviewTime comes as "2025-12-30T18:05" from datetime-local input
      const interviewDate = new Date(interviewTime);
      
      application.interviewScheduled = true;
      application.interviewTime = interviewDate;
      application.interviewMeetLink = meetLink;
      application.interviewCalendarEventId = calendarResult.success
        ? calendarResult.eventId
        : null;
      await application.save();

      // Notify student about interview
      await createNotification(
        application.user._id,
        "application",
        "Interview Scheduled",
        `Your interview for ${job.title} at ${job.company} has been scheduled for ${new Date(
          interviewTime
        ).toLocaleString()}.${meetLink ? ` Meeting link: ${meetLink}` : ""}`,
        `/applications`
      );

      res.json({
        success: true,
        message: "Interview scheduled successfully",
        interview: {
          time: interviewTime,
          meetLink,
          calendarSynced: calendarResult.success,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// =================================================================
// CALENDAR API - Get all deadlines and interviews
// =================================================================
app.get("/api/calendar/deadlines", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let events = [];

    if (userRole === "student") {
      // For students: Get job application deadlines and scheduled interviews
      
      // Get jobs student has applied to
      const studentApplications = await Application.find({ user: userId })
        .populate("job")
        .lean();

      studentApplications.forEach((app) => {
        if (app.job && app.job.applicationDeadline) {
          events.push({
            jobTitle: app.job.title,
            company: app.job.company,
            deadline: app.job.applicationDeadline,
            eventType: "application_deadline",
          });
        }
      });

      // Get scheduled interviews for accepted applications
      const acceptedApplications = await Application.find({
        user: userId,
        status: "Accepted",
        interviewScheduled: true,
      })
        .populate("job")
        .lean();

      acceptedApplications.forEach((app) => {
        if (app.interviewTime) {
          events.push({
            jobTitle: app.job.title,
            company: app.job.company,
            deadline: app.interviewTime,
            eventType: "interview",
            meetLink: app.interviewMeetLink,
          });
        }
      });
    } else if (userRole === "recruiter") {
      // For recruiters: Get their posted jobs and scheduled interviews
      
      // Get jobs posted by recruiter
      const recruiterJobs = await Job.find({ recruiter: userId }).lean();

      recruiterJobs.forEach((job) => {
        if (job.applicationDeadline) {
          events.push({
            jobTitle: job.title,
            company: job.company,
            deadline: job.applicationDeadline,
            eventType: "job_posting_deadline",
          });
        }
      });

      // Get scheduled interviews for recruiter's jobs
      const scheduledInterviews = await Application.find({
        interviewScheduled: true,
      })
        .populate("job")
        .populate("user", "name email")
        .lean();

      const recruiterInterviews = scheduledInterviews.filter(
        (app) => app.job && app.job.recruiter.toString() === userId
      );

      recruiterInterviews.forEach((app) => {
        if (app.interviewTime) {
          events.push({
            jobTitle: app.job.title,
            company: app.job.company,
            deadline: app.interviewTime,
            eventType: "interview",
            candidateName: app.user.name,
            candidateEmail: app.user.email,
            meetLink: app.interviewMeetLink,
          });
        }
      });
    }

    // Sort events by date
    events.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    // Separate upcoming and passed events
    const now = new Date();
    const upcoming = events.filter((e) => new Date(e.deadline) >= now);
    const passed = events.filter((e) => new Date(e.deadline) < now);

    res.json({
      success: true,
      upcoming,
      passed,
      total: events.length,
    });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
// TALENT SOURCING & INVITATION SYSTEM (Module 2 - Feature 3)
// =================================================================

// Search for talent with AI-powered matching
app.post(
  "/api/recruiter/search-talent",
  auth,
  recruiterAuth,
  async (req, res) => {
    try {
      const { keywords, skills, minCGPA, department } = req.body;

      let query = { role: "student", isVerified: true, isActive: true };

      // Keyword search across multiple fields
      if (keywords) {
        const keywordRegex = new RegExp(keywords, "i");
        query.$or = [
          { name: keywordRegex },
          { department: keywordRegex },
          { interests: keywordRegex },
          { skills: keywordRegex },
        ];
      }

      // Skills filter
      if (skills && skills.length > 0) {
        query.skills = { $in: skills.map((s) => new RegExp(s, "i")) };
      }

      // CGPA filter
      if (minCGPA) {
        query.cgpa = { $gte: parseFloat(minCGPA) };
      }

      // Department filter
      if (department) {
        query.department = new RegExp(department, "i");
      }

      const students = await User.find(query)
        .select(
          "name email department cgpa skills interests studentId workExperience education"
        )
        .limit(100);

      // AI-powered relevance scoring
      const scoredStudents = students.map((student) => {
        let score = 0;

        // Skills matching (most important)
        if (skills && skills.length > 0) {
          const studentSkills = student.skills || [];
          const matchingSkills = studentSkills.filter((s) =>
            skills.some((reqSkill) =>
              s.toLowerCase().includes(reqSkill.toLowerCase())
            )
          );
          score += matchingSkills.length * 10;
        }

        // CGPA bonus
        if (student.cgpa) {
          score += student.cgpa * 2;
        }

        // Work experience bonus
        if (student.workExperience && student.workExperience.length > 0) {
          score += student.workExperience.length * 5;
        }

        // Education bonus
        if (student.education && student.education.length > 0) {
          score += student.education.length * 3;
        }

        return {
          ...student.toObject(),
          relevanceScore: score,
          matchPercentage: skills
            ? Math.min(100, (score / (skills.length * 10)) * 100)
            : 0,
        };
      });

      // Sort by relevance
      scoredStudents.sort((a, b) => b.relevanceScore - a.relevanceScore);

      res.json({
        success: true,
        count: scoredStudents.length,
        students: scoredStudents,
      });
    } catch (error) {
      console.error("Talent search error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Send job invitation to student
app.post(
  "/api/recruiter/invite/:studentId",
  auth,
  recruiterAuth,
  async (req, res) => {
    try {
      const { jobId, message } = req.body;

      // Verify job belongs to recruiter
      const job = await Job.findOne({ _id: jobId, recruiter: req.user.id });
      if (!job) {
        return res.status(404).json({
          success: false,
          error: "Job not found or you don't have permission",
        });
      }

      // Verify student exists
      const student = await User.findOne({
        _id: req.params.studentId,
        role: "student",
      });
      if (!student) {
        return res.status(404).json({
          success: false,
          error: "Student not found",
        });
      }

      // Check if invitation already exists
      const existingInvitation = await Invitation.findOne({
        job: jobId,
        student: req.params.studentId,
        status: "Pending",
      });

      if (existingInvitation) {
        return res.status(400).json({
          success: false,
          error: "Invitation already sent to this student",
        });
      }

      // Create invitation
      const invitation = new Invitation({
        job: jobId,
        student: req.params.studentId,
        recruiter: req.user.id,
        message: message || `You've been invited to apply for ${job.title}`,
      });
      await invitation.save();

      // Create notification for student
      await createNotification(
        req.params.studentId,
        "invitation",
        "New Job Invitation",
        `You've been invited to apply for ${job.title} at ${job.company}`,
        `/invitations`,
        invitation._id
      );

      res.status(201).json({
        success: true,
        message: "Invitation sent successfully",
        invitation,
      });
    } catch (error) {
      console.error("Send invitation error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Get student's invitations
app.get("/api/student/invitations", auth, async (req, res) => {
  try {
    const invitations = await Invitation.find({
      student: req.user.id,
    })
      .populate("job")
      .populate("recruiter", "name email companyName")
      .sort({ createdAt: -1 });

    res.json({ success: true, invitations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Respond to invitation
app.post("/api/invitations/:invitationId/respond", auth, async (req, res) => {
  try {
    const { action } = req.body; // 'accept' or 'decline'

    if (!["accept", "decline"].includes(action)) {
      return res.status(400).json({
        success: false,
        error: "Invalid action. Use 'accept' or 'decline'",
      });
    }

    const invitation = await Invitation.findOne({
      _id: req.params.invitationId,
      student: req.user.id,
      status: "Pending",
    }).populate("job");

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: "Invitation not found or already responded",
      });
    }

    // Update invitation status
    invitation.status = action === "accept" ? "Accepted" : "Declined";
    await invitation.save();

    // If accepted, create application automatically
    if (action === "accept") {
      const user = await User.findById(req.user.id).select("-password");

      // Check if already applied
      const existingApplication = await Application.findOne({
        user: req.user.id,
        job: invitation.job._id,
      });

      if (!existingApplication) {
        const application = new Application({
          user: req.user.id,
          job: invitation.job._id,
          status: "Pending",
          profileSnapshot: {
            name: user.name,
            email: user.email,
            studentId: user.studentId,
            department: user.department,
            cgpa: user.cgpa,
            skills: user.skills,
            interests: user.interests,
            workExperience: user.workExperience,
            education: user.education,
          },
        });
        await application.save();

        // Notify student about application
        await createNotification(
          req.user.id,
          "application",
          "Application Submitted",
          `Your application for ${invitation.job.title} has been submitted`,
          `/jobs/${invitation.job._id}`
        );

        // Notify recruiter
        await createNotification(
          invitation.recruiter._id,
          "application",
          "Invitation Accepted - Application Received",
          `${user.name} accepted your invitation and applied for ${invitation.job.title}`,
          `/recruiter/jobs/${invitation.job._id}/applications`
        );
      }
    } else {
      // Notify recruiter about decline
      await createNotification(
        invitation.recruiter._id,
        "invitation",
        "Invitation Declined",
        `A student declined your invitation for ${invitation.job.title}`,
        `/recruiter/jobs/${invitation.job._id}`
      );
    }

    // Response includes companyId
    const responseJob = {
      ...invitation.job.toObject(),
      companyId: invitation.job.recruiter._id,
    };

    res.json({
      success: true,
      message: `Invitation ${action}ed successfully`,
    });
  } catch (error) {
    console.error("Respond to invitation error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
// DIRECT MESSAGING SYSTEM (Module 3 - Feature 2)
// =================================================================

// Send message
app.post("/api/messages/send", auth, async (req, res) => {
  try {
    const { recipientId, recipientEmail, subject, content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: "Content is required",
      });
    }

    // Verify recipient exists
    // 2. Determine the Recipient ID
    let finalRecipientId = recipientId;

    // If no ID is provided but we have an email, find the user by email
    if (!finalRecipientId && recipientEmail) {
      const userByEmail = await User.findOne({ email: recipientEmail });
      if (userByEmail) {
        finalRecipientId = userByEmail._id;
      }
    }

    // 3. Check if we found a valid recipient
    if (!finalRecipientId) {
      return res.status(404).json({
        success: false,
        error: "Recipient not found. Please check the email address.",
      });
    }

    // (Optional) Verify the user exists in DB to be safe
    const recipient = await User.findById(finalRecipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: "Recipient no longer exists",
      });
    }

    // 4. Create the message using the resolved finalRecipientId
    const message = new Message({
      sender: req.user.id,
      recipient: finalRecipientId,
      subject: subject || "(No subject)",
      content,
    });

    await message.save();

    // Create notification for recipient
    // Ensure createNotification is imported or available in this scope
    try {
      if (typeof createNotification === "function") {
        await createNotification(
          finalRecipientId,
          "message",
          "New Message",
          `You have a new message from ${req.user.name}`,
          `/messages`,
          message._id
        );
      }
    } catch (notifError) {
      console.error("Notification failed but message sent:", notifError);
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      messageData: message,
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/*const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ 
        success: false, 
        error: "Recipient not found" 
      });
    }
    
    const message = new Message({
      sender: req.user.id,
      recipient: recipientId,
      subject: subject || '(No subject)',
      content
    });
    await message.save();
    */
// Create notification for recipient
// Get conversations list (aggregated with last message & unread count)
app.get("/api/messages/conversations", auth, async (req, res) => {
  try {
    const myUserId = new mongoose.Types.ObjectId(req.user.id);

    // Aggregate all messages to group by conversation partner
    const conversations = await Message.aggregate([
      // Stage 1: Find all messages where I'm involved
      {
        $match: {
          $or: [{ sender: myUserId }, { recipient: myUserId }],
        },
      },
      // Stage 2: Sort by newest first to correctly identify the last message
      { $sort: { createdAt: -1 } },
      // Stage 3: Group by the "other person" in the conversation
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$sender", myUserId] }, "$recipient", "$sender"],
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$recipient", myUserId] },
                    { $eq: ["$read", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      // Stage 4: Sort conversations by the date of the last message
      { $sort: { "lastMessage.createdAt": -1 } },
      // Stage 5: Join with the 'users' collection to get the other user's details
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "withUser",
        },
      },
      // Stage 6: Deconstruct the 'withUser' array created by $lookup
      { $unwind: "$withUser" },
      // Stage 7: Project the final, clean structure for the frontend
      {
        $project: {
          _id: 0, // Exclude the default _id field from the group stage
          withUser: {
            _id: "$withUser._id",
            name: "$withUser.name",
            email: "$withUser.email",
            role: "$withUser.role",
            companyName: "$withUser.companyName",
            userId: "$withUser.userId",
          },
          lastMessage: {
            content: "$lastMessage.content",
            createdAt: "$lastMessage.createdAt",
          },
          unreadCount: 1,
        },
      },
    ]);

    // This aggregation pipeline is now much more efficient and automatically
    // filters out conversations where the other user has been deleted,
    // because the $lookup and $unwind stages will not produce a result for them.

    res.json({ success: true, conversations: conversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch conversations" });
  }
});
// Get message history with specific user
app.get("/api/messages/history/:otherUserId", auth, async (req, res) => {
  try {
    const myUserId = new mongoose.Types.ObjectId(req.user.id);
    const otherUserId = new mongoose.Types.ObjectId(req.params.otherUserId);

    if (myUserId.equals(otherUserId)) {
      return res.json({ success: true, messages: [] });
    }

    const messages = await Message.find({
      $or: [
        { sender: myUserId, recipient: otherUserId },
        { sender: otherUserId, recipient: myUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    // ADD THIS: Mark which messages are mine
    const messagesWithFlag = messages.map((msg) => ({
      ...msg,
      isMine: msg.sender.toString() === myUserId.toString(),
    }));

    await Message.updateMany(
      { sender: otherUserId, recipient: myUserId, read: false },
      { $set: { read: true } }
    );

    res.json({ success: true, messages: messagesWithFlag });
  } catch (error) {
    console.error("Error fetching message history:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch message history" });
  }
});
// Get inbox
app.get("/api/messages/inbox", auth, async (req, res) => {
  try {
    const messages = await Message.find({ recipient: req.user.id })
      .populate("sender", "name email role companyName")
      .sort({ createdAt: -1 });

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get sent messages
app.get("/api/messages/sent", auth, async (req, res) => {
  try {
    const messages = await Message.find({ sender: req.user.id })
      .populate("recipient", "name email role companyName")
      .sort({ createdAt: -1 });

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single message
app.get("/api/messages/:messageId", auth, async (req, res) => {
  try {
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.messageId)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid message ID format" });
    }

    const message = await Message.findOne({
      _id: req.params.messageId,
      $or: [{ sender: req.user.id }, { recipient: req.user.id }],
    })
      .populate("sender", "name email role companyName")
      .populate("recipient", "name email role companyName");

    if (!message) {
      return res
        .status(404)
        .json({ success: false, error: "Message not found" });
    }

    // Mark as read if user is recipient
    if (message.recipient._id.toString() === req.user.id && !message.read) {
      message.read = true;
      await message.save();
    }

    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
// =================================================================
// GET CONNECTIONS - ROBUST VERSION
// =================================================================
app.get("/api/messages/connections", auth, async (req, res) => {
  try {
    // 1. Validation: Ensure User ID exists and is valid
    if (!req.user || !req.user.id) {
      console.error("❌ Connection Error: No user ID in request object");
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const userIdString = req.user.id.toString();
    console.log("🔍 Fetching connections for user:", userIdString);

    if (!mongoose.Types.ObjectId.isValid(userIdString)) {
      console.error(
        "❌ Connection Error: Invalid ObjectId format:",
        userIdString
      );
      return res
        .status(400)
        .json({ success: false, error: "Invalid user ID format" });
    }

    const myUserId = new mongoose.Types.ObjectId(userIdString);

    // 2. Database Query: Find all messages involving this user
    // .lean() converts Mongoose Documents to plain JS objects for better performance
    const messages = await Message.find({
      $or: [{ sender: myUserId }, { recipient: myUserId }],
    }).lean();

    console.log(`📨 Found ${messages.length} messages involved in.`);

    if (messages.length === 0) {
      return res.json({ success: true, connections: [] });
    }

    // 3. Logic: Extract unique IDs of the OTHER person in the conversation
    const connectionIds = new Set();

    messages.forEach((msg) => {
      // Safely convert to strings for comparison
      const senderId = msg.sender ? msg.sender.toString() : null;
      const recipientId = msg.recipient ? msg.recipient.toString() : null;
      const myId = myUserId.toString();

      // Skip malformed messages
      if (!senderId || !recipientId) return;

      if (senderId === myId) {
        // I sent it -> Add recipient
        connectionIds.add(recipientId);
      } else if (recipientId === myId) {
        // I received it -> Add sender
        connectionIds.add(senderId);
      }
    });

    console.log(`👥 Identified ${connectionIds.size} unique connections.`);

    if (connectionIds.size === 0) {
      return res.json({ success: true, connections: [] });
    }

    // 4. Fetch Profiles: Get user details for these IDs
    // Filter out any IDs that might be invalid (just in case)
    const validIds = Array.from(connectionIds).filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    const connections = await User.find({
      _id: { $in: validIds },
    })
      .select("name email role companyName")
      .lean();

    console.log(
      `✅ Successfully returned ${connections.length} connection profiles.`
    );

    res.json({ success: true, connections });
  } catch (error) {
    console.error("❌ Fatal Connection Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch connections",
      details: error.message,
    });
  }
});
// Delete message
app.delete("/api/messages/:messageId", auth, async (req, res) => {
  try {
    const message = await Message.findOneAndDelete({
      _id: req.params.messageId,
      $or: [{ sender: req.user.id }, { recipient: req.user.id }],
    });

    if (!message) {
      return res
        .status(404)
        .json({ success: false, error: "Message not found" });
    }

    res.json({ success: true, message: "Message deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get unread message count
app.get("/api/messages/unread/count", auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      recipient: req.user.id,
      read: false,
    });

    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
// COMPANY REVIEWS & RATINGS (Module 3 - Feature 1)
// =================================================================

// Submit review
app.post("/api/reviews/submit", auth, async (req, res) => {
  try {
    const { companyId, rating, workCulture, salary, careerGrowth, comment } =
      req.body;

    // Verify company exists and is a recruiter
    const company = await User.findOne({
      _id: companyId,
      role: "recruiter",
    });
    if (!company) {
      return res.status(404).json({
        success: false,
        error: "Company not found",
      });
    }

    // Check if user already reviewed this company
    const existingReview = await Review.findOne({
      company: companyId,
      reviewer: req.user.id,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: "You have already reviewed this company",
      });
    }

    // AI content moderation
    const moderation = await moderateContent(comment || "");

    const review = new Review({
      company: companyId,
      reviewer: req.user.id,
      rating,
      workCulture,
      salary,
      careerGrowth,
      comment,
      flagged: moderation.flagged,
      flagReason: moderation.flagged ? moderation.flags.join("; ") : null,
      aiAnalysis: moderation.analysis,
    });
    await review.save();

    // If flagged, notify admins
    if (moderation.flagged) {
      const admins = await User.find({ role: "admin" });
      for (const admin of admins) {
        await createNotification(
          admin._id,
          "system",
          "Content Flagged for Review",
          `A review has been flagged by AI for potential inappropriate content`,
          `/admin/dashboard`
        );
      }
    }

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review,
      moderated: moderation.flagged,
    });
  } catch (error) {
    console.error("Submit review error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get company reviews
app.get("/api/reviews/company/:companyId", auth, async (req, res) => {
  try {
    const reviews = await Review.find({
      company: req.params.companyId,
    })
      .populate("reviewer", "name _id")
      .sort({ createdAt: -1 });

    // Calculate average ratings
    const stats = {
      totalReviews: reviews.length,
      averageRating:
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length || 0,
      averageWorkCulture:
        reviews.reduce((sum, r) => sum + (r.workCulture || 0), 0) /
          reviews.length || 0,
      averageSalary:
        reviews.reduce((sum, r) => sum + (r.salary || 0), 0) / reviews.length ||
        0,
      averageCareerGrowth:
        reviews.reduce((sum, r) => sum + (r.careerGrowth || 0), 0) /
          reviews.length || 0,
    };

    res.json({ success: true, reviews, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Edit review
app.put("/api/reviews/:reviewId", auth, async (req, res) => {
  try {
    const { rating, workCulture, salary, careerGrowth, comment } = req.body;

    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res
        .status(404)
        .json({ success: false, error: "Review not found" });
    }

    // Check if user is the reviewer
    if (review.reviewer.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, error: "You can only edit your own reviews" });
    }

    // AI content moderation for updated comment
    const moderation = await moderateContent(comment || "");

    review.rating = rating;
    review.workCulture = workCulture;
    review.salary = salary;
    review.careerGrowth = careerGrowth;
    review.comment = comment;
    review.flagged = moderation.flagged;
    review.flagReason = moderation.flagged ? moderation.flags.join("; ") : null;
    review.aiAnalysis = moderation.analysis;
    review.updatedAt = new Date();

    await review.save();

    res.json({ success: true, message: "Review updated successfully", review });
  } catch (error) {
    console.error("Edit review error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete review
app.delete("/api/reviews/:reviewId", auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res
        .status(404)
        .json({ success: false, error: "Review not found" });
    }

    // Check if user is the reviewer or admin
    if (
      review.reviewer.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        error: "You can only delete your own reviews",
      });
    }

    await Review.findByIdAndDelete(req.params.reviewId);

    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's reviews
app.get("/api/reviews/my-reviews", auth, async (req, res) => {
  try {
    const reviews = await Review.find({ reviewer: req.user.id })
      .populate("company", "companyName")
      .sort({ createdAt: -1 });

    res.json({ success: true, reviews });
  } catch (error) {
    console.error("Get my reviews error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
// FORUM SYSTEM (Module 3 - Feature 2)
// =================================================================

// Create forum post
app.post("/api/forum/posts", auth, async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({
        success: false,
        error: "Title, content, and category are required",
      });
    }

    // AI content moderation
    const moderation = await moderateContent(`${title} ${content}`);

    const post = new ForumPost({
      author: req.user.id,
      title,
      content,
      category,
      tags: tags || [],
      flagged: moderation.flagged,
      flagReason: moderation.flagged ? moderation.flags.join("; ") : null,
      aiAnalysis: moderation.analysis,
    });
    await post.save();

    // If flagged, notify admins
    if (moderation.flagged) {
      const admins = await User.find({ role: "admin" });
      for (const admin of admins) {
        await createNotification(
          admin._id,
          "system",
          "Forum Post Flagged",
          `A forum post has been flagged by AI`,
          `/forum`
        );
      }
    }

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post,
      moderated: moderation.flagged,
    });
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all forum posts (with search, filter, and sort)
app.get("/api/forum/posts", auth, async (req, res) => {
  try {
    // --- ADDED: Destructure new query params ---
    const { category, search, sortBy } = req.query;

    let query = {};

    // Category filtering (unchanged)
    if (category && category !== "All") {
      query.category = category;
    }

    // --- ADDED: Text search logic ---
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } }, // Search in title
        { content: { $regex: search, $options: "i" } }, // Search in content
        { tags: { $regex: search, $options: "i" } }, // Search in tags array
      ];
    }

    // --- ADDED: Sorting logic ---
    let sortOptions = { createdAt: -1 }; // Default sort: latest first
    if (sortBy === "Most Liked") {
      // To sort by most liked, we need to sort by the size of the 'likes' array.
      // We add a temporary field 'likesCount' and sort by it.
      // This requires using an aggregation pipeline.
    } else if (sortBy === "Most Viewed") {
      sortOptions = { views: -1 }; // Sort by views, descending
    }

    let posts;
    if (sortBy === "Most Liked") {
      posts = await ForumPost.aggregate([
        { $match: query },
        { $addFields: { likesCount: { $size: "$likes" } } },
        { $sort: { likesCount: -1 } },
        { $limit: 100 },
        {
          $lookup: {
            from: "users",
            localField: "author",
            foreignField: "_id",
            as: "author",
          },
        },
        { $unwind: "$author" },
      ]);
    } else {
      posts = await ForumPost.find(query)
        .populate("author", "name email")
        .sort(sortOptions)
        .limit(100);
    }

    res.json({ success: true, posts });
  } catch (error) {
    console.error("Get all posts error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// --- ADD THIS NEW ENDPOINT ---

// Get all posts by the logged-in user (for dashboard)
app.get("/api/forum/my-posts", auth, async (req, res) => {
  try {
    const myPosts = await ForumPost.find({ author: req.user.id })
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(5); // Limit to the 5 most recent posts for the dashboard overview

    res.json({ success: true, posts: myPosts });
  } catch (error) {
    console.error("Error fetching user's posts:", error);
    res.status(500).json({ success: false, error: "Failed to fetch posts." });
  }
});
// Get single post with comments
app.get("/api/forum/posts/:postId", auth, async (req, res) => {
  try {
    // --- MODIFIED LOGIC: Use findByIdAndUpdate to increment views ---
    const post = await ForumPost.findById(req.params.postId).populate(
      "author",
      "name email"
    );
    // --- END OF MODIFICATION ---

    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    const comments = await ForumComment.find({ post: req.params.postId })
      .populate("author", "name email")
      .sort({ createdAt: 1 });

    res.json({ success: true, post, comments });
  } catch (error) {
    // --- ADD THIS FOR BETTER DEBUGGING ---
    console.error("Get single post error:", error);
    // ---
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- ADD THIS ENTIRE NEW ENDPOINT ---

// Increment view count for a post
app.post("/api/forum/posts/:postId/view", auth, async (req, res) => {
  try {
    await ForumPost.findByIdAndUpdate(req.params.postId, {
      $inc: { views: 1 },
    });
    res.json({ success: true, message: "View count updated." });
  } catch (error) {
    // This is a non-critical error, so we just log it and send a generic response
    console.error("View count increment error:", error);
    res.status(500).json({ success: false, error: "Server error." });
  }
});

// Like/Unlike post
app.post("/api/forum/posts/:postId/like", auth, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    const userIndex = post.likes.indexOf(req.user.id);

    if (userIndex > -1) {
      // Unlike
      post.likes.splice(userIndex, 1);
    } else {
      // Like
      post.likes.push(req.user.id);
    }

    await post.save();

    res.json({
      success: true,
      liked: userIndex === -1,
      likeCount: post.likes.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
// --- ADD THIS ENTIRE NEW ENDPOINT ---

// Like/Unlike a comment
app.post("/api/forum/comments/:commentId/like", auth, async (req, res) => {
  try {
    const comment = await ForumComment.findById(req.params.commentId);

    if (!comment) {
      return res
        .status(404)
        .json({ success: false, error: "Comment not found" });
    }

    // --- THIS IS THE CORRECTED LOGIC ---
    const userIndex = comment.likes.findIndex(
      (likeId) => likeId.toString() === req.user.id
    );

    if (userIndex > -1) {
      // User has already liked, so unlike
      comment.likes.splice(userIndex, 1);
    } else {
      // User has not liked, so like
      comment.likes.push(req.user.id);
    }

    await comment.save();

    // Populate author to send back updated comment if needed, or just send likes
    const updatedComment = await ForumComment.findById(comment._id).populate(
      "author",
      "name email"
    );

    res.json({
      success: true,
      likes: updatedComment.likes.length,
      comment: updatedComment, // Sending back the whole updated comment can be useful
    });
  } catch (error) {
    console.error("Like comment error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Comment on post
app.post("/api/forum/posts/:postId/comments", auth, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: "Content is required",
      });
    }

    const post = await ForumPost.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    // AI moderation
    const moderation = await moderateContent(content);

    const comment = new ForumComment({
      post: req.params.postId,
      author: req.user.id,
      content,
      flagged: moderation.flagged,
    });
    await comment.save();

    if (moderation.flagged) {
      const admins = await User.find({ role: "admin" });
      for (const admin of admins) {
        await createNotification(
          admin._id,
          "system",
          "Forum Comment Flagged",
          `A comment has been flagged by AI`,
          `/forum`
        );
      }
    }

    // Notify post author
    if (post.author.toString() !== req.user.id) {
      await createNotification(
        post.author,
        "system",
        "New Comment on Your Post",
        `Someone commented on your forum post: ${post.title}`,
        `/forum/posts/${post._id}`
      );
    }

    const populatedComment = await ForumComment.findById(comment._id).populate(
      "author",
      "name email"
    );

    res.status(201).json({ success: true, comment: populatedComment });
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

    // Verify authorship
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "You are not authorized to delete this post",
      });
    }

    // Delete associated comments
    await ForumComment.deleteMany({ post: req.params.postId });

    // Delete the post
    await ForumPost.findByIdAndDelete(req.params.postId);

    res.json({ success: true, message: "Post and comments deleted successfully" });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete forum comment
app.delete("/api/forum/comments/:commentId", auth, async (req, res) => {
  try {
    const comment = await ForumComment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ success: false, error: "Comment not found" });
    }

    // Verify authorship
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "You are not authorized to delete this comment",
      });
    }

    await ForumComment.findByIdAndDelete(req.params.commentId);

    res.json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update forum post
app.put("/api/forum/posts/:postId", auth, async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    const post = await ForumPost.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    // Verify authorship
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "You are not authorized to edit this post",
      });
    }

    // AI content moderation
    const moderation = await moderateContent(`${title || post.title} ${content || post.content}`);

    // Update fields
    if (title) post.title = title;
    if (content) post.content = content;
    if (category) post.category = category;
    if (tags) post.tags = tags;
    
    post.flagged = moderation.flagged;
    post.flagReason = moderation.flagged ? moderation.flags.join("; ") : null;
    post.aiAnalysis = moderation.analysis;

    await post.save();

    res.json({
      success: true,
      message: "Post updated successfully",
      post,
      moderated: moderation.flagged,
    });
  } catch (error) {
    console.error("Update post error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update forum comment
app.put("/api/forum/comments/:commentId", auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, error: "Content is required" });
    }

    const comment = await ForumComment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ success: false, error: "Comment not found" });
    }

    // Verify authorship
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "You are not authorized to edit this comment",
      });
    }

    // AI moderation
    const moderation = await moderateContent(content);

    comment.content = content;
    comment.flagged = moderation.flagged;

    await comment.save();

    const populatedComment = await ForumComment.findById(comment._id).populate(
      "author",
      "name email"
    );

    res.json({
      success: true,
      message: "Comment updated successfully",
      comment: populatedComment,
      moderated: moderation.flagged,
    });
  } catch (error) {
    console.error("Update comment error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
// NOTIFICATION CENTER (Module 3 - Feature 3)
// =================================================================

// Get notifications
app.get("/api/notifications", auth, async (req, res) => {
  try {
    const { unread } = req.query;

    let query = { user: req.user.id };
    if (unread === "true") {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark notification as read
app.put("/api/notifications/:notificationId/read", auth, async (req, res) => {
  try {
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.notificationId)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid notification ID format" });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, user: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, error: "Notification not found" });
    }

    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark all as read
app.put("/api/notifications/read-all", auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get unread count
app.get("/api/notifications/unread-count", auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user.id,
      read: false,
    });

    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
// DASHBOARD APIs
// =================================================================

// Get personalized dashboard
app.get("/api/dashboard/overview", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Get applications
    const applications = await Application.find({ user: req.user.id })
      .populate("job")
      .sort({ createdAt: -1 })
      .limit(5);

    const appStats = {
      pending: await Application.countDocuments({
        user: req.user.id,
        status: "Pending",
      }),
      reviewed: await Application.countDocuments({
        user: req.user.id,
        status: "Reviewed",
      }),
      accepted: await Application.countDocuments({
        user: req.user.id,
        status: "Accepted",
      }),
      rejected: await Application.countDocuments({
        user: req.user.id,
        status: "Rejected",
      }),
    };

    // Get saved jobs
    const dashboard = await Dashboard.findOne({ user: req.user.id }).populate(
      "savedJobs"
    );

    // Get notifications
    const notifications = await Notification.find({
      user: req.user.id,
      read: false,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get invitations
    const invitations = await Invitation.find({
      student: req.user.id,
      status: "Pending",
    }).populate("job");

    // Get unread message count
    const unreadMessages = await Message.countDocuments({
      recipient: req.user.id,
      read: false,
    });

    res.json({
      success: true,
      data: {
        applications: appStats,
        recentApplications: applications,
        savedJobs: dashboard?.savedJobs || [],
        notifications,
        invitations,
        messages: { unreadCount: unreadMessages },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save job
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
      // Check if job is already saved (robust ObjectId comparison)
      const isAlreadySaved = dashboard.savedJobs.some(
        (id) => id.toString() === jobId
      );

      if (isAlreadySaved) {
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

// Remove saved job
app.delete("/api/dashboard/saved-jobs/:userId/:jobId", auth, async (req, res) => {
  try {
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ success: false, error: "Access denied." });
    }

    const { jobId } = req.params;

    // Explicitly cast to ObjectId to ensure $pull works correctly
    await Dashboard.updateOne(
      { user: req.user.id },
      { $pull: { savedJobs: new mongoose.Types.ObjectId(jobId) } }
    );

    res.json({ success: true, message: "Job removed from saved" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
// =================================================================
// USER UTILITIES
// =================================================================

// Find user by email
app.get("/api/users/find-by-email", auth, async (req, res) => {
  try {
    const { email } = req.query;
    const currentUserId = req.user.id;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, error: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "name email role userId _id companyName"
    );

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Prevent finding yourself
    if (
      user._id.toString() === currentUserId ||
      user.userId === currentUserId
    ) {
      return res
        .status(400)
        .json({ success: false, error: "You cannot message yourself" });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("Error finding user:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// --- END OF BLOCK ---
// =================================================================
// ADMIN DASHBOARD (Module 3 - Feature 3)
// =================================================================

// Get flagged content
app.get("/api/admin/flagged-content", auth, adminAuth, async (req, res) => {
  try {
    const flaggedReviews = await Review.find({ flagged: true })
      .populate("company", "name companyName")
      .populate("reviewer", "name email")
      .sort({ createdAt: -1 });

    const flaggedPosts = await ForumPost.find({ flagged: true })
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    const flaggedComments = await ForumComment.find({ flagged: true })
      .populate("author", "name email")
      .populate("post", "title")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      reviews: flaggedReviews,
      posts: flaggedPosts,
      comments: flaggedComments,
      totalFlagged:
        flaggedReviews.length + flaggedPosts.length + flaggedComments.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin action on content
app.post(
  "/api/admin/content/:contentId/action",
  auth,
  adminAuth,
  async (req, res) => {
    try {
      const { action, reason, contentType } = req.body;
      // contentType: 'review', 'post', or 'comment'

      let content;
      let author;

      // Find content based on type
      if (contentType === "review") {
        content = await Review.findById(req.params.contentId).populate(
          "reviewer"
        );
        author = content?.reviewer;
      } else if (contentType === "post") {
        content = await ForumPost.findById(req.params.contentId).populate(
          "author"
        );
        author = content?.author;
      } else if (contentType === "comment") {
        content = await ForumComment.findById(req.params.contentId).populate(
          "author"
        );
        author = content?.author;
      }

      if (!content) {
        return res
          .status(404)
          .json({ success: false, error: "Content not found" });
      }

      const authorUser = await User.findById(author._id);

      switch (action) {
        case "delete":
          // Delete the content
          if (contentType === "review")
            await Review.findByIdAndDelete(req.params.contentId);
          else if (contentType === "post")
            await ForumPost.findByIdAndDelete(req.params.contentId);
          else if (contentType === "comment")
            await ForumComment.findByIdAndDelete(req.params.contentId);

          // Notify user
          await createNotification(
            author._id,
            "system",
            "Content Removed",
            `Your ${contentType} has been removed by an admin. Reason: ${reason}`,
            null
          );
          break;

        case "warn":
          // Increment warnings
          authorUser.warnings += 1;
          await authorUser.save();

          // Notify user
          await createNotification(
            author._id,
            "system",
            "Warning Issued",
            `You have received a warning. Reason: ${reason}. Total warnings: ${authorUser.warnings}`,
            null
          );

          // Auto-suspend if 3+ warnings
          if (authorUser.warnings >= 3) {
            authorUser.isActive = false;
            authorUser.suspendedUntil = new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ); // 30 days
            await authorUser.save();

            await createNotification(
              author._id,
              "system",
              "Account Suspended",
              `Your account has been suspended for 30 days due to multiple warnings`,
              null
            );
          }
          break;

        case "suspend":
          // Suspend user
          authorUser.isActive = false;
          authorUser.suspendedUntil = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          );
          await authorUser.save();

          await createNotification(
            author._id,
            "system",
            "Account Suspended",
            `Your account has been suspended. Reason: ${reason}`,
            null
          );
          break;

        default:
          return res
            .status(400)
            .json({ success: false, error: "Invalid action" });
      }

      res.json({
        success: true,
        message: `Action ${action} completed successfully`,
      });
    } catch (error) {
      console.error("Admin action error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Get all users (admin)
app.get("/api/admin/users", auth, adminAuth, async (req, res) => {
  try {
    const { search, role } = req.query;

    let query = {};

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { userId: searchRegex },
      ];
    }

    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Suspend user
app.put(
  "/api/admin/users/:userId/suspend",
  auth,
  adminAuth,
  async (req, res) => {
    try {
      const { days, reason } = req.body;

      const user = await User.findById(req.params.userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      user.isActive = false;
      user.suspendedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      await user.save();

      await createNotification(
        req.params.userId,
        "system",
        "Account Suspended",
        `Your account has been suspended for ${days} days. Reason: ${reason}`,
        null
      );

      res.json({ success: true, message: "User suspended successfully" });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Delete user
app.delete("/api/admin/users/:userId", auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Clean up related data
    await Application.deleteMany({ user: req.params.userId });
    await Message.deleteMany({
      $or: [{ sender: req.params.userId }, { recipient: req.params.userId }],
    });
    await Notification.deleteMany({ user: req.params.userId });
    await Dashboard.deleteOne({ user: req.params.userId });

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get platform statistics
app.get("/api/admin/stats", auth, adminAuth, async (req, res) => {
  try {
    const stats = {
      users: {
        total: await User.countDocuments(),
        students: await User.countDocuments({ role: "student" }),
        recruiters: await User.countDocuments({ role: "recruiter" }),
        admins: await User.countDocuments({ role: "admin" }),
        suspended: await User.countDocuments({ isActive: false }),
      },
      jobs: {
        total: await Job.countDocuments(),
        open: await Job.countDocuments({ status: "Open" }),
        closed: await Job.countDocuments({ status: "Closed" }),
        filled: await Job.countDocuments({ status: "Filled" }),
      },
      applications: {
        total: await Application.countDocuments(),
        pending: await Application.countDocuments({ status: "Pending" }),
        reviewed: await Application.countDocuments({ status: "Reviewed" }),
        accepted: await Application.countDocuments({ status: "Accepted" }),
        rejected: await Application.countDocuments({ status: "Rejected" }),
      },
      content: {
        reviews: await Review.countDocuments(),
        flaggedReviews: await Review.countDocuments({ flagged: true }),
        forumPosts: await ForumPost.countDocuments(),
        flaggedPosts: await ForumPost.countDocuments({ flagged: true }),
        forumComments: await ForumComment.countDocuments(),
        flaggedComments: await ForumComment.countDocuments({ flagged: true }),
      },
      activity: {
        messages: await Message.countDocuments(),
        notifications: await Notification.countDocuments(),
        invitations: await Invitation.countDocuments(),
      },
    };

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
// LEGACY ROUTES (Keep for backward compatibility)
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

// Test routes (remove in production)
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
    const newNotification = await createNotification(
      req.user.id,
      "system",
      "Test Notification",
      message || "This is a test notification"
    );
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
// ADVANCED CALENDAR FEATURES
// Interview Scheduling, Recruitment Drives, Event Management
// =================================================================

// Schedule interview with student
app.post(
  "/api/calendar/schedule-interview",
  auth,
  recruiterAuth,
  async (req, res) => {
    try {
      const { studentId, jobId, interviewTime, meetingLink } = req.body;

      // Validate required fields
      if (!studentId || !jobId || !interviewTime) {
        return res.status(400).json({
          success: false,
          error: "studentId, jobId, and interviewTime are required",
        });
      }

      // Verify job belongs to recruiter
      const job = await Job.findOne({ _id: jobId, recruiter: req.user.id });
      if (!job) {
        return res.status(404).json({
          success: false,
          error: "Job not found or you don't have permission",
        });
      }

      // Verify student exists and get email
      const student = await User.findById(studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          error: "Student not found",
        });
      }

      // Get recruiter email
      const recruiter = await User.findById(req.user.id);

      // Schedule interview on Google Calendar
      const calendarResult = await scheduleInterviewSlot(
        student.email,
        recruiter.email,
        job.title,
        job.company,
        interviewTime,
        meetingLink
      );

      if (!calendarResult.success) {
        return res.status(500).json({
          success: false,
          error: "Failed to schedule interview on calendar",
        });
      }

      // Create notification for student
      await createNotification(
        studentId,
        "system",
        "Interview Scheduled",
        `Your interview for ${job.title} at ${
          job.company
        } has been scheduled for ${new Date(
          interviewTime
        ).toLocaleString()}. Check your calendar for details.`,
        `/notifications`,
        jobId
      );

      res.status(201).json({
        success: true,
        message: "Interview scheduled successfully",
        calendarEvent: {
          eventId: calendarResult.eventId,
          studentEmail: student.email,
          recruiterEmail: recruiter.email,
          interviewTime,
          jobTitle: job.title,
          company: job.company,
        },
      });
    } catch (error) {
      console.error("Schedule interview error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Create recruitment drive/event
app.post(
  "/api/calendar/recruitment-drive",
  auth,
  recruiterAuth,
  async (req, res) => {
    try {
      const {
        eventName,
        startTime,
        endTime,
        location,
        description,
        studentEmails,
      } = req.body;

      // Validate required fields
      if (!eventName || !startTime || !endTime || !location) {
        return res.status(400).json({
          success: false,
          error: "eventName, startTime, endTime, and location are required",
        });
      }

      // Get recruiter company info
      const recruiter = await User.findById(req.user.id);

      // Create recruitment drive event on Google Calendar
      const calendarResult = await createRecruitmentDriveEvent(
        eventName,
        recruiter.companyName || "Company",
        startTime,
        endTime,
        location,
        description,
        studentEmails || []
      );

      if (!calendarResult.success) {
        return res.status(500).json({
          success: false,
          error: "Failed to create recruitment drive event on calendar",
        });
      }

      // Create notifications for all invited students
      if (studentEmails && studentEmails.length > 0) {
        const students = await User.find({
          email: { $in: studentEmails },
          role: "student",
        });
        for (const student of students) {
          await createNotification(
            student._id,
            "system",
            "Campus Recruitment Drive",
            `You're invited to a recruitment drive: ${eventName} by ${
              recruiter.companyName
            }. Scheduled for ${new Date(
              startTime
            ).toLocaleString()} at ${location}.`,
            `/notifications`,
            recruiter._id
          );
        }
      }

      res.status(201).json({
        success: true,
        message: "Recruitment drive created successfully",
        event: {
          eventId: calendarResult.eventId,
          eventName,
          company: recruiter.companyName,
          startTime,
          endTime,
          location,
          invitedStudents: studentEmails ? studentEmails.length : 0,
        },
      });
    } catch (error) {
      console.error("Create recruitment drive error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Get all recruitment events for students to view
app.get("/api/calendar/recruitment-events", auth, async (req, res) => {
  try {
    // Get all upcoming recruitment drive events
    // Note: This would require storing them in database. For now, show a status
    res.json({
      success: true,
      message: "Recruitment events are synced to Google Calendar",
      note: "Check your Google Calendar for campus recruitment drives and events",
      upcomingEvents: [],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
// SERVER START
// =================================================================
// =================================================================
// GOOGLE CALENDAR APIs (Member 1/2 External API Integration)
// Application Deadline Tracking with Google Calendar
// =================================================================

// Get user's upcoming application deadlines
app.get("/api/calendar/deadlines", auth, async (req, res) => {
  try {
    const calendarEvents = await CalendarEvent.find({ user: req.user.id })
      .populate("job", "title company")
      .sort({ deadline: 1 })
      .limit(10);

    // Separate upcoming and passed deadlines
    const now = new Date();
    const upcoming = calendarEvents.filter((e) => new Date(e.deadline) > now);
    const passed = calendarEvents.filter((e) => new Date(e.deadline) <= now);

    res.json({
      success: true,
      upcoming,
      passed,
      totalUpcoming: upcoming.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sync all application deadlines to Google Calendar for a user
app.post("/api/calendar/sync-deadlines", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Get all applications with deadlines
    const applications = await Application.find({ user: req.user.id }).populate(
      "job"
    );

    let synced = 0;
    let failed = 0;

    for (const app of applications) {
      if (app.job && app.job.applicationDeadline) {
        // Check if already synced
        const exists = await CalendarEvent.findOne({
          application: app._id,
        });

        if (!exists) {
          const calendarResult = await addApplicationDeadlineToCalendar(
            user.email,
            app.job.title,
            app.job.company,
            app.job.applicationDeadline
          );

          if (calendarResult.success) {
            const calendarEvent = new CalendarEvent({
              user: req.user.id,
              application: app._id,
              job: app.job._id,
              googleEventId: calendarResult.eventId,
              deadline: app.job.applicationDeadline,
              jobTitle: app.job.title,
              company: app.job.company,
              eventType: "application_deadline",
            });
            await calendarEvent.save();
            synced++;
          } else {
            failed++;
          }
        }
      }
    }

    res.json({
      success: true,
      message: `Synced ${synced} deadlines to Google Calendar`,
      synced,
      failed,
      total: applications.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove deadline from Google Calendar
app.delete(
  "/api/calendar/deadlines/:calendarEventId",
  auth,
  async (req, res) => {
    try {
      const calendarEvent = await CalendarEvent.findOne({
        _id: req.params.calendarEventId,
        user: req.user.id,
      });

      if (!calendarEvent) {
        return res
          .status(404)
          .json({ success: false, error: "Calendar event not found" });
      }

      // Remove from Google Calendar
      const result = await removeApplicationDeadlineFromCalendar(
        calendarEvent.googleEventId
      );

      // Remove from database
      await CalendarEvent.findByIdAndDelete(req.params.calendarEventId);

      res.json({
        success: true,
        message: "Deadline removed from calendar",
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Get calendar status (check if configured)
app.get("/api/calendar/status", auth, async (req, res) => {
  try {
    const isConfigured = !!process.env.GOOGLE_CALENDAR_EMAIL;
    const totalDeadlines = await CalendarEvent.countDocuments({
      user: req.user.id,
    });

    res.json({
      success: true,
      configured: isConfigured,
      message: isConfigured
        ? "Google Calendar is configured"
        : "Google Calendar not yet configured",
      totalSyncedDeadlines: totalDeadlines,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
// SERVER STARTUP
// =================================================================

const PORT = process.env.PORT || 1350;
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           BRACU PLACEMENT HUB - BACKEND SERVER                ║
║                    FULLY OPERATIONAL                          ║
╚═══════════════════════════════════════════════════════════════╝

🚀 Server running on http://localhost:${PORT}
📚 Student ID: 23101350

✅ MODULE 1 - User Profile and Access:
   • OTP-based Authentication
   • Student Profile Management
   • Company Profile Management

✅ MODULE 2 - Jobs and Applications:
   • Job Posting with Deadlines
   • Job Discovery & Application
   • AI-Powered Talent Sourcing & Invitations

✅ MODULE 3 - Community & Interaction:
   • Company Reviews & Ratings
   • Direct Messaging System
   • Community Forum
   • Personalized Dashboard
   • Admin Dashboard with AI Moderation
   • Notification Center

🔧 Features:
   • JWT Authentication
   • OTP Email Verification
   • AI Content Moderation
   • Role-Based Access Control
   • Automatic Deadline Management
   • Profile Snapshots
   • Relevance-Based Search
   • 📅 Google Calendar Integration (Application Deadlines)

⚠️  PRODUCTION REMINDERS:
   • Replace console.log with real email service
   • Integrate with actual AI moderation API
   • Add rate limiting
   • Enable HTTPS
   • Set secure JWT_SECRET
   • Configure proper CORS
   • Configure Google Calendar API credentials
`);
});
