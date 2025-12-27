import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";  // ← ADD THIS


function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("stats"); // stats, flagged, users
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Stats data
  const [stats, setStats] = useState(null);

  // Flagged content
  const [flaggedContent, setFlaggedContent] = useState([]);
  const [contentType, setContentType] = useState("all"); // all, reviews, posts, comments

  // Users
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    checkAdminAuth();
  }, []);

  useEffect(() => {
    if (activeTab === "stats") {
      fetchStats();
    } else if (activeTab === "flagged") {
      fetchFlaggedContent();
    } else if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab, contentType]);

  const checkAdminAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch("http://localhost:1350/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.user.role !== "admin") {
        alert("Access denied. Admin only.");
        navigate("/");
        return;
      }

      setLoading(false);
    } catch (err) {
      console.error("Auth error:", err);
      navigate("/login");
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:1350/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch stats");
      }

      setStats(data.stats);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchFlaggedContent = async () => {
    try {
      const token = localStorage.getItem("token");
      const url =
        contentType === "all"
          ? "http://localhost:1350/api/admin/flagged-content"
          : `http://localhost:1350/api/admin/flagged-content?type=${contentType}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch flagged content");
      }

      setFlaggedContent(data.flaggedContent);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const url = userSearch
        ? `http://localhost:1350/api/admin/users?search=${userSearch}`
        : "http://localhost:1350/api/admin/users";

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch users");
      }

      setUsers(data.users);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleContentAction = async (contentId, contentType, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this content?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:1350/api/admin/content/${contentId}/action`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ contentType, action }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Action failed");
      }

      alert(data.message);
      fetchFlaggedContent();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSuspendUser = async (userId, days = 30) => {
    const daysInput = prompt(`Suspend user for how many days?`, days);
    if (!daysInput) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:1350/api/admin/users/${userId}/suspend`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ days: parseInt(daysInput) }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to suspend user");
      }

      alert(data.message);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (
      !window.confirm(
        "Are you sure you want to PERMANENTLY DELETE this user? This cannot be undone!"
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:1350/api/admin/users/${userId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete user");
      }

      alert(data.message);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <>
    <Navbar />
    
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              🛡️ Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Manage content, moderate users, and view platform statistics
            </p>
          </div>
          <button
            onClick={() => {
              localStorage.clear();
              navigate("/login");
            }}
            className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold"
          >
            Logout
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("stats")}
              className={`flex-1 py-4 px-6 font-semibold transition ${
                activeTab === "stats"
                  ? "border-b-4 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              📊 Statistics
            </button>
            <button
              onClick={() => setActiveTab("flagged")}
              className={`flex-1 py-4 px-6 font-semibold transition ${
                activeTab === "flagged"
                  ? "border-b-4 border-red-600 text-red-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              🚩 Flagged Content
              {flaggedContent.length > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-600 text-white rounded-full text-xs">
                  {flaggedContent.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`flex-1 py-4 px-6 font-semibold transition ${
                activeTab === "users"
                  ? "border-b-4 border-green-600 text-green-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              👥 Users
            </button>
          </div>
        </div>

        {/* Stats Tab */}
        {activeTab === "stats" && stats && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-gray-600 font-semibold mb-2">Total Users</h3>
                <p className="text-4xl font-bold text-blue-600">{stats.totalUsers}</p>
                <div className="mt-4 text-sm text-gray-600">
                  <p>Students: {stats.students}</p>
                  <p>Recruiters: {stats.recruiters}</p>
                  <p>Admins: {stats.admins}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-gray-600 font-semibold mb-2">Jobs</h3>
                <p className="text-4xl font-bold text-green-600">{stats.totalJobs}</p>
                <div className="mt-4 text-sm text-gray-600">
                  <p>Open: {stats.openJobs}</p>
                  <p>Closed: {stats.closedJobs}</p>
                  <p>Filled: {stats.filledJobs}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-gray-600 font-semibold mb-2">Applications</h3>
                <p className="text-4xl font-bold text-purple-600">
                  {stats.totalApplications}
                </p>
                <div className="mt-4 text-sm text-gray-600">
                  <p>Pending: {stats.pendingApplications}</p>
                  <p>Reviewed: {stats.reviewedApplications}</p>
                  <p>Accepted: {stats.acceptedApplications}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-gray-600 font-semibold mb-2">Content</h3>
                <p className="text-4xl font-bold text-orange-600">
                  {stats.totalReviews + stats.totalPosts + stats.totalComments}
                </p>
                <div className="mt-4 text-sm text-gray-600">
                  <p>Reviews: {stats.totalReviews}</p>
                  <p>Posts: {stats.totalPosts}</p>
                  <p>Comments: {stats.totalComments}</p>
                </div>
              </div>
            </div>

            {/* Calendar Quick Access Card */}
            <div className="mb-8 bg-gradient-to-br from-indigo-600 via-blue-500 to-cyan-500 rounded-lg shadow-lg overflow-hidden">
              <div className="p-8 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <span className="text-4xl mr-3">📅</span>
                      <h3 className="text-2xl font-bold">Calendar & Deadlines</h3>
                    </div>
                    <p className="text-indigo-100 mb-4 text-lg">
                      Monitor recruitment timelines, application deadlines, and interview schedules
                    </p>
                    <button
                      onClick={() => navigate("/calendar")}
                      className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-lg hover:bg-gray-100 transition shadow-md"
                    >
                      📅 View Calendar
                    </button>
                  </div>
                  <div className="hidden md:block text-6xl opacity-20">
                    ⏰
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  🚨 Moderation Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Flagged Reviews</span>
                    <span className="font-bold text-red-600">
                      {stats.flaggedReviews}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Flagged Posts</span>
                    <span className="font-bold text-red-600">
                      {stats.flaggedPosts}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Flagged Comments</span>
                    <span className="font-bold text-red-600">
                      {stats.flaggedComments}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t">
                    <span className="text-gray-800 font-semibold">
                      Total Flagged
                    </span>
                    <span className="font-bold text-2xl text-red-600">
                      {stats.flaggedReviews +
                        stats.flaggedPosts +
                        stats.flaggedComments}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  📈 Activity Overview
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Messages</span>
                    <span className="font-bold">{stats.totalMessages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Invitations</span>
                    <span className="font-bold">{stats.totalInvitations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Users (30d)</span>
                    <span className="font-bold">{stats.activeUsers || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Flagged Content Tab */}
        {activeTab === "flagged" && (
          <div>
            {/* Content Type Filter */}
            <div className="bg-white rounded-lg shadow-md mb-6 p-4">
              <div className="flex flex-wrap gap-2">
                {["all", "reviews", "posts", "comments"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setContentType(type)}
                    className={`px-4 py-2 rounded-md font-semibold transition capitalize ${
                      contentType === type
                        ? "bg-red-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Flagged Content List */}
            {flaggedContent.length === 0 ? (
              <div className="bg-white p-12 rounded-lg shadow-md text-center">
                <p className="text-xl text-gray-600">
                  No flagged content to review
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {flaggedContent.map((item) => (
                  <div
                    key={item._id}
                    className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold capitalize">
                            {item.type}
                          </span>
                          <span className="text-sm text-gray-600">
                            by {item.author?.name || "Unknown"} (
                            {item.author?.email})
                          </span>
                        </div>
                        {item.title && (
                          <h3 className="text-xl font-bold text-gray-800 mb-2">
                            {item.title}
                          </h3>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {item.content || item.comment}
                      </p>
                    </div>

                    {/* AI Analysis */}
                    {item.aiAnalysis && (
                      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
                        <p className="font-semibold text-gray-800 mb-2">
                          🤖 AI Analysis:
                        </p>
                        <p className="text-sm text-gray-700">{item.aiAnalysis}</p>
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-semibold">Flag Reason:</span>{" "}
                          {item.flagReason}
                        </p>
                      </div>
                    )}

                    {/* Rating (for reviews) */}
                    {item.rating && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">
                          Rating: {item.rating}/5 ⭐
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={() =>
                          handleContentAction(item._id, item.type, "delete")
                        }
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold"
                      >
                        🗑️ Delete Content
                      </button>
                      <button
                        onClick={() =>
                          handleContentAction(item._id, item.type, "warn")
                        }
                        className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 font-semibold"
                      >
                        ⚠️ Warn User
                      </button>
                      <button
                        onClick={() =>
                          handleContentAction(item._id, item.type, "suspend")
                        }
                        className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 font-semibold"
                      >
                        🚫 Suspend User (30 days)
                      </button>
                      <button
                        onClick={() =>
                          handleContentAction(item._id, item.type, "ignore")
                        }
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold"
                      >
                        ✓ Mark as Safe
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div>
            {/* Search */}
            <div className="bg-white rounded-lg shadow-md mb-6 p-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="flex-1 p-3 border border-gray-300 rounded-md"
                />
                <button
                  onClick={fetchUsers}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Warnings
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-800">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : user.role === "recruiter"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.isActive ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                            Active
                          </span>
                        ) : (
                          <div>
                            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                              Suspended
                            </span>
                            {user.suspendedUntil && (
                              <p className="text-xs text-gray-600 mt-1">
                                Until{" "}
                                {new Date(user.suspendedUntil).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-bold ${
                            user.warnings >= 3
                              ? "text-red-600"
                              : user.warnings > 0
                              ? "text-yellow-600"
                              : "text-gray-600"
                          }`}
                        >
                          {user.warnings}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSuspendUser(user._id)}
                            disabled={!user.isActive}
                            className={`px-3 py-1 rounded-md text-sm font-semibold ${
                              user.isActive
                                ? "bg-orange-600 text-white hover:bg-orange-700"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            Suspend
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {users.length === 0 && (
                <div className="p-12 text-center text-gray-600">
                  No users found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

export default AdminDashboard;
