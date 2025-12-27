import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function NotificationBell() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        "http://localhost:1350/api/notifications?unread=true",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications.slice(0, 5));
        setUnreadCount(data.notifications.length);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(
        `http://localhost:1350/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchNotifications();
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleNotificationClick = (notification) => {
    handleMarkAsRead(notification._id);
    if (notification.link) {
      navigate(notification.link);
    }
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-800"
      >
        <svg
          className="w-6 h-6"
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
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-20 max-h-96 overflow-y-auto">
            <div className="p-4 border-b">
              <h3 className="font-bold text-gray-800">Notifications</h3>
            </div>
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-600">
                No new notifications
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                  >
                    <p className="font-semibold text-gray-800 text-sm">
                      {notification.title}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      {notification.message}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div className="p-4 border-t">
              <button
                onClick={() => {
                  navigate("/notifications");
                  setShowDropdown(false);
                }}
                className="w-full text-center text-blue-600 hover:text-blue-800 font-semibold text-sm"
              >
                View All Notifications
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationBell;
