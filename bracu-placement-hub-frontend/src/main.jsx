import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";

// Import CSS
import "./index.css";

// Authentication Pages
import App from "./App.jsx"; // Dev Login
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPageWithOTP from "./pages/RegisterPageWithOTP.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";

// Student Profile Pages
import CreateProfilePage from "./pages/CreateProfilePage.jsx";
import ViewProfilePage from "./pages/ViewProfilePage.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx"; // <-- ADD THIS
import EditProfilePage from "./pages/EditProfilePage.jsx";

// Job Discovery & Application (Student)
import JobSearchPage from "./pages/JobSearchPage.jsx";
import JobDetailsPage from "./pages/JobDetailsPage.jsx";
import ApplicationConfirmPage from "./pages/ApplicationConfirmPage.jsx";
import ApplicationSuccessPage from "./pages/ApplicationSuccessPage.jsx";

//Notifications
import NotificationsPage from "./pages/NotificationsPage";
import JobApplicationsPage from "./pages/JobApplicationsPage";

// Invitations (Student)
import InvitationsPage from "./pages/InvitationsPage.jsx";

// Recruiter Pages
import RecruiterDashboard from "./pages/RecruiterDashboard.jsx";
import CreateJobPage from "./pages/CreateJobPage.jsx";
import EditJobPage from "./pages/EditJobPage.jsx";
import TalentSearchPage from "./pages/TalentSearchPage.jsx";
import CreateCompanyProfilePage from "./pages/CreateCompanyProfilePage.jsx";
import EditCompanyProfilePage from "./pages/EditCompanyProfilePage.jsx";
// Company & Reviews
import CompanyProfilePage from "./pages/CompanyProfilePage.jsx";

// Messaging
import MessagesPage from "./pages/MessagesPage.jsx";

// Forum
import ForumPage from "./pages/ForumPage.jsx";
import ForumPostDetail from "./pages/ForumPostDetail.jsx";
import CreatePostPage from "./pages/CreatePostPage.jsx"; // <-- ADD THIS LINE

// Calendar
import CalendarPage from "./pages/CalendarPage.jsx";

// Admin
import AdminDashboard from "./pages/AdminDashboard.jsx";

// Error Page
import ErrorPage from "./pages/ErrorPage.jsx";

// Create the router configuration
const router = createBrowserRouter([
  // ============================================
  // AUTHENTICATION ROUTES
  // ============================================
  {
    path: "/",
    element: <LandingPage />, // Landing page
    errorElement: <ErrorPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPageWithOTP />, // NEW: OTP-based registration
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />, // NEW: Password reset with OTP
  },
  {
    path: "/dev-login",
    element: <App />, // Developer token login (for testing)
  },

  // ============================================
  // STUDENT PROFILE ROUTES
  // ============================================
  {
    path: "/create-profile",
    element: <CreateProfilePage />,
  },
  {
    path: "/dashboard",
    element: <StudentDashboard />,
  },
  {
    path: "/profile/view/:userId",
    element: <ViewProfilePage />,
  },
  {
    path: "/profile/edit",
    element: <EditProfilePage />,
  },

  // ============================================
  // JOB DISCOVERY & APPLICATION ROUTES (STUDENT)
  // ============================================
  {
    path: "/jobs",
    element: <JobSearchPage />,
  },
  {
    path: "/jobs/:jobId",
    element: <JobDetailsPage />,
  },
  {
    path: "/jobs/:jobId/apply",
    element: <ApplicationConfirmPage />,
  },
  {
    path: "/jobs/:jobId/application-success",
    element: <ApplicationSuccessPage />,
  },

  // ============================================
  // INVITATIONS (STUDENT)
  // ============================================
  {
    path: "/invitations",
    element: <InvitationsPage />, // NEW: View and respond to job invitations
  },

  // ============================================
  // NOTIFICATIONS
  // ============================================
  {
    path: "/notifications",
    element: <NotificationsPage />,
  },

  {
    path: "/recruiter/jobs/:jobId/applications",
    element: <JobApplicationsPage />,
  },

  // ============================================
  // RECRUITER ROUTES
  // ============================================
  {
    path: "/recruiter/dashboard",
    element: <RecruiterDashboard />,
  },
  {
    path: "/recruiter/jobs/create",
    element: <CreateJobPage />,
  },
  {
    path: "/recruiter/jobs/edit/:jobId",
    element: <EditJobPage />,
  },
  {
    path: "/recruiter/talent-search",
    element: <TalentSearchPage />, // NEW: AI-powered talent search
  },
  {
    path: "/company/create-profile",
    element: <CreateCompanyProfilePage />,
  },
  {
    path: "/company/edit-profile",
    element: <EditCompanyProfilePage />,
  },

  // ============================================
  // COMPANY & REVIEWS
  // ============================================
  {
    path: "/company/:companyId",
    element: <CompanyProfilePage />, // NEW: View company profile and reviews
  },

  // ============================================
  // MESSAGING SYSTEM
  // ============================================
  {
    path: "/messages",
    element: <MessagesPage />, // NEW: Direct messaging
  },

  // ============================================
  // FORUM ROUTES
  // ============================================
  {
    path: "/forum",
    element: <ForumPage />, // NEW: Community forum
  },
  {
    path: "/forum/create",
    element: <CreatePostPage />,
  },
  {
    path: "/forum/posts/:postId",
    element: <ForumPostDetail />, // NEW: Forum post detail with comments
  },

  // ============================================
  // CALENDAR ROUTES
  // ============================================
  {
    path: "/calendar",
    element: <CalendarPage />, // NEW: View calendar, deadlines, and interviews
  },

  // ============================================
  // ADMIN ROUTES
  // ============================================
  {
    path: "/admin/dashboard",
    element: <AdminDashboard />,
  },

  // ============================================
  // CATCH-ALL / ERROR ROUTES
  // ============================================
  {
    path: "*",
    element: <ErrorPage />,
    errorElement: <ErrorPage />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
