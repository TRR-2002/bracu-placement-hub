import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";

// Import CSS
import "./index.css";

// Import Page Components - Authentication
import App from "./App.jsx"; // Dev Login
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";

// Import Page Components - Student
import CreateProfilePage from "./pages/CreateProfilePage.jsx";
import ViewProfilePage from "./pages/ViewProfilePage.jsx";
import EditProfilePage from "./pages/EditProfilePage.jsx";

// Import Page Components - Job Discovery
import JobSearchPage from "./pages/JobSearchPage.jsx";
import JobDetailsPage from "./pages/JobDetailsPage.jsx";
import ApplicationConfirmPage from "./pages/ApplicationConfirmPage.jsx";
import ApplicationSuccessPage from "./pages/ApplicationSuccessPage.jsx";

// Import Page Components - Recruiter
import RecruiterDashboard from "./pages/RecruiterDashboard.jsx";
import CreateJobPage from "./pages/CreateJobPage.jsx";
import EditJobPage from "./pages/EditJobPage.jsx";

// Import Page Components - Admin
import AdminDashboard from "./pages/AdminDashboard.jsx";

// NEW: Import Page Components - Community Forum
import ForumPage from "./pages/ForumPage.jsx";
import CreateForumPostPage from "./pages/CreateForumPostPage.jsx";
import ForumPostDetailsPage from "./pages/ForumPostDetailsPage.jsx";

// NEW: Import Page Components - Enhanced Dashboard
import EnhancedDashboardPage from "./pages/EnhancedDashboardPage.jsx";

// Create the router configuration
const router = createBrowserRouter([
  // ============================================
  // AUTHENTICATION ROUTES
  // ============================================
  {
    path: "/",
    element: <LoginPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/dev-login",
    element: <App />,
  },

  // ============================================
  // STUDENT PROFILE ROUTES
  // ============================================
  {
    path: "/create-profile",
    element: <CreateProfilePage />,
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
  // JOB DISCOVERY & APPLICATION ROUTES
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

  // ============================================
  // ADMIN ROUTES
  // ============================================
  {
    path: "/admin/dashboard",
    element: <AdminDashboard />,
  },

  // ============================================
  // NEW: COMMUNITY FORUM ROUTES
  // ============================================
  {
    path: "/forum",
    element: <ForumPage />,
  },
  {
    path: "/forum/create",
    element: <CreateForumPostPage />,
  },
  {
    path: "/forum/posts/:postId",
    element: <ForumPostDetailsPage />,
  },

  // ============================================
  // NEW: ENHANCED DASHBOARD ROUTE
  // ============================================
  {
    path: "/dashboard/:userId",
    element: <EnhancedDashboardPage />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
