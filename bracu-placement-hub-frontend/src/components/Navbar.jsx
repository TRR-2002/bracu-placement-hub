// src/components/Navbar.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const response = await fetch("http://localhost:1350/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) setUser(data.user);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    const fetchCounts = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const [notifRes, msgRes] = await Promise.all([
          fetch("http://localhost:1350/api/notifications/unread-count", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:1350/api/messages/unread/count", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const notifData = await notifRes.json();
        const msgData = await msgRes.json();
        if (notifData.success) setUnreadNotifications(notifData.count);
        if (msgData.success) setUnreadMessages(msgData.count);
      } catch (err) {
        console.error("Error fetching counts:", err);
      }
    };

    fetchUserData();
    fetchCounts();
  }, [location.pathname]); // Re-fetch on path change to keep data fresh

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const isActive = (path) => {
    return location.pathname === path
      ? "bg-blue-700 text-white"
      : "text-blue-100 hover:bg-blue-700 hover:text-white";
  };

  if (!user) return null;

  return (
    <nav className="bg-blue-600 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/")}
              className="text-white text-xl font-bold hover:text-blue-100 transition"
            >
              BRACU Placement Hub
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Student Navigation */}
            {user.role === "student" && (
              <>
                <button
                  onClick={() => navigate("/dashboard")}
                  className={`px-4 py-2 rounded-md font-semibold transition ${isActive(
                    "/dashboard"
                  )}`}
                >
                  📊 Dashboard
                </button>
                <button
                  onClick={() => navigate(`/profile/view/${user.userId}`)}
                  className={`px-4 py-2 rounded-md font-semibold transition ${isActive(
                    `/profile/view/${user.userId}`
                  )}`}
                >
                  👤 Profile
                </button>
                <button
                  onClick={() => navigate("/jobs")}
                  className={`px-4 py-2 rounded-md font-semibold transition ${isActive(
                    "/jobs"
                  )}`}
                >
                  🔍 Find Jobs
                </button>
                {/* ... other student buttons ... */}
                <button
                  onClick={() => navigate("/messages")}
                  className={`px-4 py-2 rounded-md font-semibold transition relative ${isActive(
                    "/messages"
                  )}`}
                >
                  💬 Messages{" "}
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadMessages}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => navigate("/forum")}
                  className={`px-4 py-2 rounded-md font-semibold transition ${isActive(
                    "/forum"
                  )}`}
                >
                  🗣️ Forum
                </button>
                <button
                  onClick={() => navigate("/calendar")}
                  className={`px-4 py-2 rounded-md font-semibold transition relative ${isActive(
                    "/calendar"
                  )}`}
                >
                  📅 Calendar{" "}
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    ⭐
                  </span>
                </button>
              </>
            )}

            {/* ... Recruiter and Admin Navigation ... */}

            <button
              onClick={() => navigate("/notifications")}
              className={`p-2 rounded-md font-semibold transition relative ${isActive(
                "/notifications"
              )}`}
            >
              🔔{" "}
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>
          </div>

          {/* Profile Dropdown */}
          <div className="hidden md:block relative ml-3">
            {/* ... a lot of dropdown JSX ... */}
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center space-x-2 text-white hover:text-blue-100 transition"
            >
              <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center font-bold">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <span className="font-semibold">{user.name}</span>
            </button>
            {showProfileDropdown && (
              <>{/* ... Dropdown content with logout etc. ... */}</>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="text-white hover:text-blue-100 transition"
            >
              {/* SVG for hamburger/close icon */}
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {/* ... */}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {showMobileMenu && (
        <div className="md:hidden pb-4">
          <div className="flex flex-col space-y-2 px-2 pt-2 pb-3">
            {/* Student Mobile Nav */}
            {user.role === "student" && (
              <>
                <button
                  onClick={() => {
                    navigate("/dashboard");
                    setShowMobileMenu(false);
                  }}
                  className={`px-3 py-2 rounded-md font-semibold transition text-left ${isActive(
                    "/dashboard"
                  )}`}
                >
                  📊 Dashboard
                </button>
                <button
                  onClick={() => {
                    navigate(`/profile/view/${user.userId}`);
                    setShowMobileMenu(false);
                  }}
                  className={`px-3 py-2 rounded-md font-semibold transition text-left ${isActive(
                    `/profile/view/${user.userId}`
                  )}`}
                >
                  👤 Profile
                </button>
                <button
                  onClick={() => {
                    navigate("/jobs");
                    setShowMobileMenu(false);
                  }}
                  className={`px-3 py-2 rounded-md font-semibold transition text-left ${isActive(
                    "/jobs"
                  )}`}
                >
                  🔍 Find Jobs
                </button>
                {/* ... other mobile buttons for students ... */}
              </>
            )}
            {/* ... Mobile navs for Recruiter and Admin ... */}

            {/* Common Mobile Nav */}
            <div className="border-t border-blue-500 mt-2 pt-2">
              {/* ... Mobile logout button etc. ... */}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
