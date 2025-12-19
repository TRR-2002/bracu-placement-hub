import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

function EnhancedDashboardPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login to view your dashboard.");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      const response = await fetch(
        `http://localhost:1350/api/dashboard/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          setError("Access Denied: You can only view your own dashboard.");
        } else {
          throw new Error("Failed to fetch dashboard data from server.");
        }
        return;
      }

      const data = await response.json();
      if (data.success && data.data) {
        setDashboardData(data.data);
      } else {
        throw new Error(
          "Dashboard data format received from server is incorrect."
        );
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(
        "http://localhost:1350/api/dashboard/notifications/mark-all-read",
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchDashboardData();
    } catch (err) {
      console.error("Error marking notifications as read:", err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Reviewed":
        return "bg-blue-100 text-blue-800";
      case "Accepted":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white shadow-md rounded-lg max-w-sm w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">
            {error || "Could not load dashboard data."}
          </p>
          <button
            onClick={fetchDashboardData}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-800">
                Welcome back, {dashboardData.studentInfo.name}!
              </h1>
              <p className="text-gray-600 mt-2">
                {dashboardData.studentInfo.department} | CGPA:{" "}
                {dashboardData.studentInfo.cgpa || "N/A"}
              </p>
            </div>
            <button
              onClick={() => navigate(`/profile/view/${userId}`)}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
            >
              View Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-gray-600 font-semibold mb-2">
                Total Applications
              </h3>
              <p className="text-4xl font-bold text-blue-600">
                {dashboardData.applicationStats.total}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-gray-600 font-semibold mb-2">Pending</h3>
              <p className="text-4xl font-bold text-yellow-600">
                {dashboardData.applicationStats.pending}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-gray-600 font-semibold mb-2">Accepted</h3>
              <p className="text-4xl font-bold text-green-600">
                {dashboardData.applicationStats.accepted}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-gray-600 font-semibold mb-2">Connections</h3>
              <p className="text-4xl font-bold text-purple-600">
                {dashboardData.connectionCount}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 border-b">
            {[
              "overview",
              "applications",
              "notifications",
              "forum",
              "connections",
            ].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-semibold capitalize ${
                  activeTab === tab
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                {tab}
                {tab === "notifications" &&
                  dashboardData.unreadNotificationCount > 0 && (
                    <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                      {dashboardData.unreadNotificationCount}
                    </span>
                  )}
              </button>
            ))}
          </div>
        </div>

        <div>
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Recent Applications
                </h2>
                {dashboardData.applications.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">
                    No applications yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {dashboardData.applications.slice(0, 5).map((app) => (
                      <div
                        key={app._id}
                        className="p-4 border rounded-lg hover:shadow-md transition cursor-pointer"
                        onClick={() => navigate(`/jobs/${app.job._id}`)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-bold text-gray-800">
                              {app.job.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {app.job.company}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                              app.status
                            )}`}
                          >
                            {app.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Applied {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setActiveTab("applications")}
                  className="mt-4 w-full py-2 text-blue-600 hover:text-blue-800 font-semibold"
                >
                  View All Applications →
                </button>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Your Recent Forum Posts
                </h2>
                {dashboardData.recentForumPosts.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">
                    No forum posts yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {dashboardData.recentForumPosts.map((post) => (
                      <div
                        key={post._id}
                        className="p-4 border rounded-lg hover:shadow-md transition cursor-pointer"
                        onClick={() => navigate(`/forum/posts/${post._id}`)}
                      >
                        <h3 className="font-bold text-gray-800 mb-2">
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>❤️ {post.likeCount}</span>
                          <span>💬 {post.commentCount}</span>
                          <span>👁 {post.views}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => navigate("/forum")}
                  className="mt-4 w-full py-2 text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Visit Forum →
                </button>
              </div>
            </div>
          )}

          {activeTab === "applications" && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                All Applications ({dashboardData.applications.length})
              </h2>
              {dashboardData.applications.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">No applications yet</p>
                  <button
                    onClick={() => navigate("/jobs")}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Browse Jobs
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData.applications.map((app) => (
                    <div
                      key={app._id}
                      className="p-6 border rounded-lg hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-800">
                            {app.job.title}
                          </h3>
                          <p className="text-gray-600">{app.job.company}</p>
                          {app.job.location && (
                            <p className="text-sm text-gray-500">
                              📍 {app.job.location}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                            app.status
                          )}`}
                        >
                          {app.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">
                        Applied on{" "}
                        {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                      <button
                        onClick={() => navigate(`/jobs/${app.job._id}`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        View Job Details
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  Notifications ({dashboardData.notifications.length})
                </h2>
                {dashboardData.unreadNotificationCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="px-4 py-2 text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    Mark All as Read
                  </button>
                )}
              </div>
              {dashboardData.notifications.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No notifications
                </p>
              ) : (
                <div className="space-y-2">
                  {dashboardData.notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`p-4 border rounded-lg ${
                        notif.read ? "bg-white" : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <p className="text-gray-800">{notif.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "forum" && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Your Forum Activity
              </h2>
              {dashboardData.recentForumPosts.length === 0 ? (
                <p className="text-center py-8 text-gray-600">
                  You haven't posted anything yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {dashboardData.recentForumPosts.map((post) => (
                    <div
                      key={post._id}
                      className="p-6 border rounded-lg hover:shadow-md transition cursor-pointer"
                      onClick={() => navigate(`/forum/posts/${post._id}`)}
                    >
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span>❤️ {post.likeCount} likes</span>
                        <span>💬 {post.commentCount} comments</span>
                        <span>👁 {post.views} views</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => navigate("/forum")}
                className="mt-4 w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
              >
                Go to Forum
              </button>
            </div>
          )}

          {activeTab === "connections" && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Your Connections ({dashboardData.connectionCount})
              </h2>
              {dashboardData.connections.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No connections yet
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dashboardData.connections.map((connection) => (
                    <div
                      key={connection._id}
                      className="p-4 border rounded-lg hover:shadow-md transition"
                    >
                      <h3 className="font-bold text-gray-800">
                        {connection.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {connection.email}
                      </p>
                      {connection.department && (
                        <p className="text-sm text-gray-500">
                          {connection.department}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EnhancedDashboardPage;
