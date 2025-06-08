"use client"

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  // Get user email from localStorage
  const userEmail = localStorage.getItem("userEmail") || "";

  // Fetch notifications from backend
  useEffect(() => {
    if (!userEmail) {
      setError("Please log in to view notifications");
      setLoading(false);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const response = await axios.get("https://chargemate-sp0r.onrender.com/api/notifications", {
          params: { user: userEmail },
        });
        setNotifications(response.data);
        setUnreadCount(response.data.filter((n) => !n.read).length);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError("Failed to load notifications");
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [userEmail]);

  // Mark a notification as read
  const handleMarkAsRead = async (id) => {
    try {
      const response = await axios.patch(`https://chargemate-sp0r.onrender.com/api/notifications/${id}`);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === id ? { ...notification, read: true } : notification
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  // Mark all notification as read
  const handleMarkAllAsRead = async () => {
    try {
      // Get only the unread notifications
      const unreadNotifications = notifications.filter(notification => !notification.read);

      if (unreadNotifications.length === 0) {
        console.log("No unread notifications to mark");
        return;
      }

      console.log(`Marking ${unreadNotifications.length} notifications as read`);

      // Create an array of promises for each mark-as-read request
      const markReadPromises = unreadNotifications.map(notification => 
        axios.patch(`https://chargemate-sp0r.onrender.com/api/notifications/${notification._id}`)
      );

      // Execute all requests in parallel
      await Promise.all(markReadPromises);

      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );

      // Reset unread count
      setUnreadCount(0);

      console.log("All notifications marked as read successfully");
    } catch (err) {
      console.error("Error marking all notifications as read:", err.message);
      setError("Failed to mark all notifications as read");
    }
  };

  // Delete a notification
  const handleDeleteNotification = async (id) => {
    try {
      await axios.delete(`https://chargemate-sp0r.onrender.com/api/notifications/${id}`);
      const notification = notifications.find((n) => n._id === id);
      if (notification && !notification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setNotifications((prev) => prev.filter((notification) => notification._id !== id));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  // Navigate to action URL
  const handleNavigate = (url) => {
    if (url) {
      navigate(url);
    }
  };

  // Filter notifications (include timestamp check for reminders)
  const filteredNotifications = notifications.filter((notification) => {
    const now = new Date();
    const notificationTime = new Date(notification.timestamp);
    if (notificationTime > now) return false; // Hide future reminders
    if (activeFilter === "all") return true;
    if (activeFilter === "unread") return !notification.read;
    return notification.type === activeFilter;
  });

  // Format relative time
  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "booking":
        return "🔋";
      case "cancellation":
        return "❌";
      case "reminder":
        return "⏰";
      default:
        return "📬";
    }
  };

  // Get color based on notification type
  const getNotificationColor = (type) => {
    switch (type) {
      case "booking":
        return "#10b981";
      case "cancellation":
        return "#ef4444";
      case "reminder":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      height: "100vh",
      overflow: "hidden"
    }}>
      <Navbar unreadCount={unreadCount} />
      
      <div style={{ 
        flex: 1,
        overflowY: "auto",
        padding: "20px",
        backgroundColor: "#f9fafb"
      }}>
        {loading ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "#6b7280",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            }}
          >
            <div style={{ fontSize: "36px", marginBottom: "16px" }}>⚡</div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>Loading your notifications...</h3>
            <div
              style={{
                maxHeight: "100vh",
                position: "relative",
                width: "200px",
                backgroundColor: "#e2e8f0",
                borderRadius: "3px",
                margin: "20px auto",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  height: "100%",
                  width: "30%",
                  backgroundColor: "#3b82f6",
                  borderRadius: "3px",
                  animation: "loading 1.5s infinite ease-in-out",
                }}
              ></div>
            </div>
            <style>
              {`
                @keyframes loading {
                  0% { left: -30%; }
                  100% { left: 100%; }
                }
              `}
            </style>
          </div>
        ) : error ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "#e11d48",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            }}
          >
            <div style={{ fontSize: "36px", marginBottom: "16px" }}>❌</div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>{error}</h3>
            <button
              onClick={() => navigate("/home")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                backgroundColor: "#f1f5f9",
                color: "#1e40af",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                margin: "20px auto",
              }}
            >
              <span>🏠</span> Back to Home
            </button>
          </div>
        ) : (
          <div
            style={{
              maxWidth: "900px",
              margin: "0 auto",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: "28px",
                    fontWeight: "700",
                    margin: "0 0 8px 0",
                    background: "linear-gradient(90deg, #3b82f6, #10b981)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <span style={{ fontSize: "32px" }}>📬</span>
                  Notifications
                  {unreadCount > 0 && (
                    <span
                      style={{
                        backgroundColor: "#ef4444",
                        color: "white",
                        fontSize: "14px",
                        fontWeight: "600",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        WebkitTextFillColor: "white",
                      }}
                    >
                      {unreadCount} new
                    </span>
                  )}
                </h1>
                <p
                  style={{
                    fontSize: "16px",
                    color: "#6b7280",
                    margin: "0",
                  }}
                >
                  Stay updated with your charging activity
                </p>
              </div>

              {notifications.length > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 16px",
                    backgroundColor: unreadCount > 0 ? "#3b82f6" : "#f1f5f9",
                    color: unreadCount > 0 ? "white" : "#64748b",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: unreadCount > 0 ? "pointer" : "default",
                    transition: "all 0.2s ease",
                    opacity: unreadCount > 0 ? 1 : 0.7,
                  }}
                  disabled={unreadCount === 0}
                >
                  <span>✓</span> Mark all as read
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div
              style={{
                display: "flex",
                overflowX: "auto",
                gap: "8px",
                marginBottom: "20px",
                padding: "4px",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <FilterTab
                label="All"
                count={notifications.length}
                active={activeFilter === "all"}
                onClick={() => setActiveFilter("all")}
              />
              <FilterTab
                label="Unread"
                count={notifications.filter((n) => !n.read).length}
                active={activeFilter === "unread"}
                onClick={() => setActiveFilter("unread")}
              />
              <FilterTab
                label="Bookings"
                icon="🔋"
                count={notifications.filter((n) => n.type === "booking").length}
                active={activeFilter === "booking"}
                onClick={() => setActiveFilter("booking")}
              />
              <FilterTab
                label="Cancellations"
                icon="❌"
                count={notifications.filter((n) => n.type === "cancellation").length}
                active={activeFilter === "cancellation"}
                onClick={() => setActiveFilter("cancellation")}
              />
              <FilterTab
                label="Reminders"
                icon="⏰"
                count={notifications.filter((n) => n.type === "reminder").length}
                active={activeFilter === "reminder"}
                onClick={() => setActiveFilter("reminder")}
              />
            </div>

            {/* Notification List */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                overflow: "hidden",
                marginBottom: "20px", /* Add bottom margin to prevent content being cut off */
              }}
            >
              {filteredNotifications.length === 0 ? (
                <div
                  style={{
                    padding: "40px 20px",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  <div style={{ fontSize: "36px", marginBottom: "16px" }}>📭</div>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>No notifications</h3>
                  <p style={{ margin: "0", fontSize: "14px" }}>
                    {activeFilter === "all"
                      ? "You don't have any notifications yet"
                      : `You don't have any ${activeFilter === "unread" ? "unread" : activeFilter} notifications`}
                  </p>
                </div>
              ) : (
                <div>
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification._id}
                      style={{
                        padding: "20px",
                        borderBottom: "1px solid #e5e7eb",
                        transition: "background-color 0.2s ease",
                        display: "flex",
                        gap: "16px",
                        backgroundColor: notification.read ? "transparent" : "rgba(59, 130, 246, 0.05)",
                        position: "relative",
                      }}
                    >
                      {/* Unread indicator */}
                      {!notification.read && (
                        <div
                          style={{
                            position: "absolute",
                            left: "0",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "4px",
                            height: "40%",
                            backgroundColor: getNotificationColor(notification.type),
                            borderRadius: "0 4px 4px 0",
                          }}
                        />
                      )}

                      {/* Icon */}
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "12px",
                          backgroundColor: `${getNotificationColor(notification.type)}15`,
                          color: getNotificationColor(notification.type),
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          fontSize: "20px",
                          flexShrink: 0,
                        }}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <h3
                            style={{
                              margin: "0 0 8px 0",
                              fontSize: "16px",
                              fontWeight: notification.read ? "600" : "700",
                              color: "#0f172a",
                            }}
                          >
                            {notification.title}
                          </h3>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <span
                              style={{
                                fontSize: "12px",
                                color: "#64748b",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {formatRelativeTime(notification.timestamp)}
                            </span>
                            <button
                              onClick={() => handleDeleteNotification(notification._id)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "#94a3b8",
                                fontSize: "16px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "4px",
                                borderRadius: "4px",
                                transition: "all 0.2s ease",
                              }}
                              onMouseOver={(e) => (e.currentTarget.style.color = "#64748b")}
                              onMouseOut={(e) => (e.currentTarget.style.color = "#94a3b8")}
                            >
                              ×
                            </button>
                          </div>
                        </div>

                        <p
                          style={{
                            margin: "0 0 12px 0",
                            fontSize: "14px",
                            color: "#4b5563",
                            lineHeight: "1.5",
                          }}
                        >
                          {notification.message}
                        </p>

                        <div style={{ display: "flex", gap: "12px" }}>
                          {notification.actionUrl && (
                            <button
                              onClick={() => handleNavigate(notification.actionUrl)}
                              style={{
                                padding: "6px 12px",
                                backgroundColor: `${getNotificationColor(notification.type)}15`,
                                color: getNotificationColor(notification.type),
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "13px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = `${getNotificationColor(notification.type)}25`;
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = `${getNotificationColor(notification.type)}15`;
                              }}
                            >
                              {notification.actionText}
                            </button>
                          )}

                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification._id)}
                              style={{
                                padding: "6px 12px",
                                backgroundColor: "transparent",
                                color: "#64748b",
                                border: "1px solid #e2e8f0",
                                borderRadius: "6px",
                                fontSize: "13px",
                                fontWeight: "500",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = "#f8fafc";
                                e.currentTarget.style.borderColor = "#cbd5e1";
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                                e.currentTarget.style.borderColor = "#e2e8f0";
                              }}
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Components
function FilterTab({ label, icon, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 16px",
        backgroundColor: active ? "#3b82f6" : "#f1f5f9",
        color: active ? "white" : "#64748b",
        border: "none",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: "500",
        cursor: "pointer",
        transition: "all 0.2s ease",
        whiteSpace: "nowrap",
      }}
      onMouseOver={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = "#e2e8f0";
      }}
      onMouseOut={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = "#f1f5f9";
      }}
    >
      {icon && <span>{icon}</span>} <span>{label}</span>
      {count > 0 && (
        <span
          style={{
            backgroundColor: active ? "rgba(255,255,255,0.2)" : "#e2e8f0",
            color: active ? "white" : "#64748b",
            fontSize: "12px",
            fontWeight: "600",
            padding: "2px 6px",
            borderRadius: "10px",
            minWidth: "20px",
            textAlign: "center",
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
