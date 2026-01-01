// src/components/Navbar.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// --- ADDED: Import all necessary icons ---
import {
  GraduationCap,
  LayoutDashboard,
  PlusSquare,
  Search,
  MessageCircle,
  MessagesSquare,
  Calendar,
  Bell,
  ChevronDown,
} from "lucide-react";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    // This effect runs when the user navigates to a new page
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        handleLogout();
        return;
      }
      try {
        const [profileRes, notifRes, msgRes] = await Promise.all([
          fetch("http://localhost:1350/api/auth/profile", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:1350/api/notifications/unread-count", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:1350/api/messages/unread/count", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const profileData = await profileRes.json();
        if (profileData.success) {
          setUser(profileData.user);
        } else {
          handleLogout();
        }

        const notifData = await notifRes.json();
        if (notifData.success) setUnreadNotifications(notifData.count);

        const msgData = await msgRes.json();
        if (msgData.success) setUnreadMessages(msgData.count);
      } catch (err) {
        console.error("Error fetching navbar data:", err);
        handleLogout();
      }
    };
    fetchData();
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const isActive = (path) => {
    return (location.pathname.startsWith(path) && path !== "/") ||
      location.pathname === path
      ? "bg-blue-700 text-white"
      : "text-blue-100 hover:bg-blue-700 hover:text-white";
  };

  if (!user) return null;

  const NavLink = ({ to, icon: Icon, children }) => (
    <button
      onClick={() => navigate(to)}
      className={`px-3 py-2 rounded-md font-semibold transition flex items-center gap-2 ${isActive(
        to
      )}`}
    >
      <Icon className="w-5 h-5" />
      {children}
    </button>
  );

  return (
    <nav className="bg-blue-600 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button
            onClick={() =>
              navigate(
                user.role === "admin" ? "/admin/dashboard" : user.role === "student" ? "/dashboard" : "/recruiter/dashboard"
              )
            }
            className="flex items-center gap-2 text-white text-xl font-bold hover:text-blue-100 transition"
          >
            <GraduationCap className="w-8 h-8" />
            <span>BRACU Placement Hub</span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {user.role === "student" && (
              <>
                <NavLink to="/dashboard" icon={LayoutDashboard}>
                  Dashboard
                </NavLink>
                <NavLink to="/jobs" icon={Search}>
                  Find Jobs
                </NavLink>
                {/* Invitations might need an icon */}
              </>
            )}
            {user.role === "recruiter" && (
              <>
                <NavLink to="/recruiter/dashboard" icon={LayoutDashboard}>
                  Dashboard
                </NavLink>
                <NavLink to="/recruiter/jobs/create" icon={PlusSquare}>
                  Post Job
                </NavLink>
                <NavLink to="/recruiter/talent-search" icon={Search}>
                  Find Talent
                </NavLink>
              </>
            )}
            {user.role === "admin" && (
              <NavLink to="/admin/dashboard" icon={LayoutDashboard}>
                Dashboard
              </NavLink>
            )}
            {/* Messages for all authenticated users */}
            {["student", "recruiter", "admin"].includes(user.role) && (
              <>
                <button
                  onClick={() => navigate("/messages")}
                  className={`px-3 py-2 rounded-md font-semibold transition flex items-center gap-2 relative ${isActive(
                    "/messages"
                  )}`}
                >
                  <MessageCircle className="w-5 h-5" /> Messages{" "}
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadMessages}
                    </span>
                  )}
                </button>
                <NavLink to="/forum" icon={MessagesSquare}>
                  Forum
                </NavLink>
                <button
                  onClick={() => navigate("/calendar")}
                  className={`px-3 py-2 rounded-md font-semibold transition flex items-center gap-2 relative ${isActive(
                    "/calendar"
                  )}`}
                >
                  <Calendar className="w-5 h-5" /> Calendar{" "}
                  <span className="absolute -top-1 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    ⭐
                  </span>
                </button>
              </>
            )}
          </div>

          {/* Right side icons and dropdown */}
          <div className="flex items-center">
            <button
              onClick={() => navigate("/notifications")}
              className={`p-2 rounded-full font-semibold transition relative ${
                isActive("/notifications")
                  ? "text-white"
                  : "text-blue-100 hover:text-white"
              }`}
            >
              <Bell className="h-6 w-6" />
              {unreadNotifications > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>

            <div className="relative ml-3">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-2 text-white hover:text-blue-100 transition"
              >
                <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center font-bold">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold hidden md:block">
                  {user.name}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showProfileDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowProfileDropdown(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-20">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-semibold text-gray-800">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {user.email}
                      </p>
                      <p className="text-xs text-gray-500 capitalize mt-1">
                        {user.role}
                      </p>
                    </div>
                    {user.role === "student" && (
                      <>
                        <button
                          onClick={() => {
                            navigate(`/profile/view/${user.userId}`);
                            setShowProfileDropdown(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => {
                            navigate("/profile/edit");
                            setShowProfileDropdown(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Edit Profile
                        </button>
                      </>
                    )}
                    {/* --- THIS IS THE MODIFIED SECTION --- */}
                    {user.role === "recruiter" && (
                      <>
                        <button
                          onClick={() => {
                            // Note: A recruiter's user document ID is their company ID
                            navigate(`/company/${user._id}`);
                            setShowProfileDropdown(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          View Company Profile
                        </button>
                        <button
                          onClick={() => {
                            navigate("/company/edit-profile");
                            setShowProfileDropdown(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Edit Company Profile
                        </button>
                      </>
                    )}
                    {/* --- END OF MODIFIED SECTION --- */}
                    <div className="border-t my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Mobile Menu logic would go here, updated similarly with icons */}
    </nav>
  );
}

export default Navbar;
