// src/pages/StudentDashboard.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getConversations } from "../api/jobApi";

function StudentDashboard() {
  const navigate = useNavigate();

  // State for tabs and loading
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false); // For individual tab loading
  const [error, setError] = useState("");

  // State for initially fetched data
  const [userProfile, setUserProfile] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [myPosts, setMyPosts] = useState([]);
  const [connections, setConnections] = useState([]);

  // State for on-demand fetched data
  const [allApplications, setAllApplications] = useState([]);
  const [allNotifications, setAllNotifications] = useState([]);

  // State to prevent re-fetching
  const [applicationsFetched, setApplicationsFetched] = useState(false);
  const [notificationsFetched, setNotificationsFetched] = useState(false);

  // Initial data fetch on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const responses = await Promise.all([
          fetch("http://localhost:1350/api/auth/profile", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:1350/api/dashboard/overview", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:1350/api/forum/my-posts", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          getConversations(), // Use the API helper
        ]);

        const [profileData, overviewData, myPostsData, connectionsData] =
          await Promise.all([
            responses[0].json(),
            responses[1].json(),
            responses[2].json(),
            Promise.resolve(responses[3]), // getConversations returns data directly
          ]);

        setUserProfile(profileData.user);
        setOverviewData(overviewData.data);

        // --- FIX: Ensure state is always an array ---
        setMyPosts(myPostsData.posts || []);
        // data.conversations is the array from getConversations ({ success: true, conversations: [...] })
        setConnections(connectionsData.conversations || []);
      } catch (err) {
        setError(
          err.message || "An error occurred while loading dashboard data."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [navigate]);

  // On-demand fetch for Applications tab
  const fetchAllApplications = async () => {
    if (applicationsFetched) return;
    setTabLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        "http://localhost:1350/api/applications/my-applications",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAllApplications(data.applications || []); // --- FIX ---
      setApplicationsFetched(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setTabLoading(false);
    }
  };

  // On-demand fetch for Notifications tab
  const fetchAllNotifications = async () => {
    if (notificationsFetched) return;
    setTabLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:1350/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAllNotifications(data.notifications || []); // --- FIX ---
      setNotificationsFetched(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setTabLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch("http://localhost:1350/api/notifications/read-all", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotificationsFetched(false);
      fetchAllNotifications();
    } catch (err) {
      alert("Failed to mark all as read.");
    }
  };

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    if (tabName === "applications") fetchAllApplications();
    if (tabName === "notifications") fetchAllNotifications();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-xl text-gray-600">Loading Dashboard...</p>
        </div>
      </>
    );
  }
  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-md">
            <p className="font-bold">An Error Occurred</p>
            <p>{error}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />

      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {userProfile?.name}!
              </h1>
              <p className="text-gray-600 mt-1">
                {userProfile?.department} | CGPA: {userProfile?.cgpa || "N/A"}
              </p>
            </div>
            <button
              onClick={() => navigate(`/profile/view/${userProfile.userId}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition"
            >
              View Profile
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 font-semibold">Total Applications</h3>
            <p className="text-3xl font-bold text-blue-600">
              {overviewData?.applications
                ? Object.values(overviewData.applications).reduce(
                    (a, b) => a + b,
                    0
                  )
                : 0}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 font-semibold">Pending</h3>
            <p className="text-3xl font-bold text-yellow-500">
              {overviewData?.applications?.pending || 0}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 font-semibold">Accepted</h3>
            <p className="text-3xl font-bold text-green-500">
              {overviewData?.applications?.accepted || 0}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 font-semibold">Connections</h3>
            <p className="text-3xl font-bold text-purple-500">
              {connections?.length || 0}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <nav className="flex border-b overflow-x-auto">
            {[
              "overview",
              "applications",
              "notifications",
              "savedJobs",
              "forum",
              "connections",
            ].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                className={`flex-shrink-0 py-4 px-6 font-semibold capitalize transition ${
                  activeTab === tab
                    ? "border-b-4 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab.replace("savedJobs", "Saved Jobs")}
              </button>
            ))}
          </nav>

          <div className="p-6">
            {tabLoading ? (
              <p>Loading...</p>
            ) : (
              (() => {
                switch (activeTab) {
                  case "overview":
                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-700 mb-4">
                            Recent Applications
                          </h3>
                          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                            {overviewData?.recentApplications?.length > 0 ? (
                              overviewData.recentApplications.map((app) => (
                                <div
                                  key={app._id}
                                  className="flex justify-between items-center"
                                >
                                  <div>
                                    <p className="font-semibold text-gray-800">
                                      {app.job?.title}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {app.job?.company}
                                    </p>
                                  </div>
                                  <span
                                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                      app.status === "Pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {app.status}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-gray-500 text-center py-4">
                                No recent applications.
                              </p>
                            )}
                            <button
                              onClick={() => handleTabClick("applications")}
                              className="w-full text-center text-blue-600 font-semibold pt-2 hover:underline"
                            >
                              View All Applications →
                            </button>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-700 mb-4">
                            Your Recent Forum Posts
                          </h3>
                          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                            {myPosts?.length > 0 ? (
                              myPosts.map((post) => (
                                <div
                                  key={post._id}
                                  className="flex justify-between items-center"
                                >
                                  <p className="font-semibold text-gray-800 truncate">
                                    {post.title}
                                  </p>
                                  <div className="flex gap-4 text-xs text-gray-500 flex-shrink-0 ml-4">
                                    <span>❤️ {post.likes?.length || 0}</span>
                                    <span>👁️ {post.views || 0}</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-gray-500 text-center py-4">
                                You haven't posted anything yet.
                              </p>
                            )}
                            <button
                              onClick={() => navigate("/forum")}
                              className="w-full text-center text-blue-600 font-semibold pt-2 hover:underline"
                            >
                              Visit Forum →
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  case "applications":
                    return (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">
                          All Applications ({allApplications.length})
                        </h3>
                        <div className="space-y-3">
                          {allApplications.length > 0 ? (
                            allApplications.map((app) => (
                              <div
                                key={app._id}
                                className="bg-gray-50 p-4 rounded-lg flex justify-between items-center"
                              >
                                <div>
                                  <p className="font-semibold text-gray-800">
                                    {app.job?.title}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {app.job?.company}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    Applied on:{" "}
                                    {new Date(
                                      app.createdAt
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span
                                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                      app.status === "Pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {app.status}
                                  </span>
                                  <button
                                    onClick={() =>
                                      navigate(`/jobs/${app.job?._id}`)
                                    }
                                    className="mt-2 text-sm text-white bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
                                  >
                                    View Job
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-4">
                              You have not submitted any applications yet.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  case "notifications":
                    return (
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold text-gray-700">
                            Notifications ({allNotifications.length})
                          </h3>
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-sm text-blue-600 font-semibold hover:underline"
                          >
                            Mark All as Read
                          </button>
                        </div>
                        <div className="space-y-3">
                          {allNotifications.length > 0 ? (
                            allNotifications.map((notif) => (
                              <div
                                key={notif._id}
                                className={`p-4 rounded-lg border-l-4 ${
                                  notif.read
                                    ? "bg-gray-50 border-gray-300"
                                    : "bg-blue-50 border-blue-400"
                                }`}
                              >
                                {" "}
                                <p
                                  className={`font-semibold ${
                                    !notif.read && "text-blue-800"
                                  }`}
                                >
                                  {notif.title}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {notif.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(notif.createdAt).toLocaleString()}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-4">
                              You have no notifications.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  case "savedJobs":
                    return (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">
                          Saved Jobs ({overviewData?.savedJobs?.length || 0})
                        </h3>
                        <div className="space-y-3">
                          {overviewData?.savedJobs?.length > 0 ? (
                            overviewData.savedJobs.map((job) => (
                              <div
                                key={job._id}
                                className="bg-gray-50 p-4 rounded-lg flex justify-between items-center"
                              >
                                <div>
                                  <p className="font-semibold text-gray-800">
                                    {job.title}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {job.company}
                                  </p>
                                </div>
                                <button
                                  onClick={() => navigate(`/jobs/${job._id}`)}
                                  className="text-sm text-white bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
                                >
                                  View Job
                                </button>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-4">
                              You have not saved any jobs yet.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  case "forum":
                    return (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">
                          Your Forum Activity ({myPosts.length})
                        </h3>
                        <div className="space-y-3">
                          {myPosts.length > 0 ? (
                            myPosts.map((post) => (
                              <div
                                key={post._id}
                                className="bg-gray-50 p-4 rounded-lg flex justify-between items-center"
                              >
                                <div>
                                  <p className="font-semibold text-gray-800">
                                    {post.title}
                                  </p>
                                  <div className="flex gap-4 text-xs text-gray-500 mt-1">
                                    <span>❤️ {post.likes?.length || 0}</span>
                                    <span>👁️ {post.views || 0}</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    navigate(`/forum/posts/${post._id}`)
                                  }
                                  className="text-sm text-white bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
                                >
                                  View Post
                                </button>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-4">
                              You have not created any posts.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  case "connections":
                    return (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">
                          Your Connections ({connections.length})
                        </h3>
                        <div className="space-y-3">
                          {connections.length > 0 ? (
                            connections.map((conn) => {
                              return (
                              <div
                                key={conn.withUser.userId}
                                className="bg-gray-50 p-4 rounded-lg flex justify-between items-center"
                              >
                                <div>
                                  <p className="font-semibold text-gray-800">
                                    {conn.withUser.name}
                                  </p>
                                  <p className="text-xs text-blue-600 mb-1">
                                    {conn.withUser.companyName ||
                                      conn.withUser.role}
                                  </p>
                                  <p className="text-sm text-gray-500 max-w-xs truncate">
                                    <span className="font-bold">
                                      Last Message: {conn.lastMessage.content}
                                    </span>
                                  </p>
                                </div>
                                <button
                                  onClick={() =>
                                    navigate(
                                      `/messages?userId=${conn.withUser._id}`,
                                      { state: { selectedUser: conn.withUser } }
                                    )
                                  }
                                  className="text-sm text-white bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
                                >
                                  Message
                                </button>
                              </div>
                              );
                            })
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-4">
                              You have not sent any messages yet.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  default:
                    return null;
                }
              })()
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default StudentDashboard;
