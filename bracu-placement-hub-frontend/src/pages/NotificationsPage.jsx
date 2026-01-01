import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";  // ← ADD THIS


function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notificationError, setNotificationError] = useState("");
  const [filter, setFilter] = useState("all"); // all, unread

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const url =
        filter === "unread"
          ? "http://localhost:1350/api/notifications?unread=true"
          : "http://localhost:1350/api/notifications";

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch notifications");
      }

      setNotifications(data.notifications);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:1350/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to mark as read");
      }

      fetchNotifications();
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:1350/api/notifications/read-all",
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to mark all as read");
      }

      alert("All notifications marked as read");
      fetchNotifications();
    } catch (err) {
      alert(err.message);
    }
  };



  const getNotificationIcon = (type) => {
    const icons = {
      application: "📝",
      invitation: "📧",
      message: "💬",
      connection: "🤝",
      review: "⭐",
      system: "🔔",
      deadline: "⏰",
      job: "💼",
    };
    return icons[type] || "🔔";
  };

  const getNotificationColor = (type) => {
    const colors = {
      application: "bg-blue-50 border-blue-200",
      invitation: "bg-green-50 border-green-200",
      message: "bg-purple-50 border-purple-200",
      connection: "bg-yellow-50 border-yellow-200",
      review: "bg-pink-50 border-pink-200",
      system: "bg-gray-50 border-gray-200",
      deadline: "bg-red-50 border-red-200",
      job: "bg-indigo-50 border-indigo-200",
    };
    return colors[type] || "bg-gray-50 border-gray-200";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">Loading notifications...</p>
      </div>
    );
  }

  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              🔔 Notifications
            </h1>
            <p className="text-gray-600">Stay updated with your activities</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-800 font-semibold transition"
          >
            Back
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {notificationError && (
          <div className="mb-6 p-4 bg-orange-100 border border-orange-400 text-orange-700 rounded-md flex justify-between items-center">
            <span>{notificationError}</span>
            <button
              onClick={() => setNotificationError("")}
              className="text-orange-700 hover:text-orange-900 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Filter and Actions */}
        <div className="bg-white rounded-lg shadow-md mb-6 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-md font-semibold transition ${
                  filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-4 py-2 rounded-md font-semibold transition ${
                  filter === "unread"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Unread (
                {notifications.filter((n) => !n.read).length})
              </button>
            </div>

            {notifications.some((n) => !n.read) && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold"
              >
                ✓ Mark All as Read
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-md text-center">
            <svg
              className="w-24 h-24 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <p className="text-xl text-gray-600 mb-2">No notifications</p>
            <p className="text-gray-500">
              {filter === "unread"
                ? "You're all caught up!"
                : "You don't have any notifications yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`bg-white rounded-lg shadow-md border-l-4 p-5 transition ${
                  notification.read
                    ? "opacity-75 border-gray-300"
                    : getNotificationColor(notification.type)
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="text-3xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h3
                        className={`font-semibold text-gray-800 ${
                          !notification.read ? "font-bold" : ""
                        }`}
                      >
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></span>
                      )}
                    </div>

                    <p className="text-gray-700 mb-2">{notification.message}</p>

                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                          notification.type === "application"
                            ? "bg-blue-100 text-blue-800"
                            : notification.type === "invitation"
                            ? "bg-green-100 text-green-800"
                            : notification.type === "message"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {notification.type}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0">
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification._id);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-semibold"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State Info */}
        {notifications.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              Use the "Mark Read" button to mark notifications as read
            </p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

export default NotificationsPage;
