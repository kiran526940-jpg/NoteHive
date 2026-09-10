
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import AdminHeader from "./AdminHeader";
import "./AdminNotifications.css";

import { API_URL, SERVER_URL } from "../../../config/api";

// =====================================================
// NOTEHIVE - ADMIN NOTIFICATIONS
// Manage Users Style Admin Layout
// =====================================================

const AdminNotifications = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);

  // =====================================================
  // AUTH CHECK
  // =====================================================

  useEffect(() => {
    const adminLoggedIn = localStorage.getItem("adminLoggedIn");
    const userRole = localStorage.getItem("userRole");

    if (adminLoggedIn !== "true" || userRole !== "admin") {
      navigate("/admin-login", { replace: true });
    }
  }, [navigate]);

  // =====================================================
  // FETCH NOTIFICATIONS
  // =====================================================

  const fetchNotifications = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(`${API_URL}/admin/notifications`);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      const notificationList = Array.isArray(data)
        ? data
        : Array.isArray(data.notifications)
        ? data.notifications
        : Array.isArray(data.activities)
        ? data.activities
        : [];

      setNotifications(notificationList);
    } catch (err) {
      console.error("❌ Admin notifications error:", err);

      setError(
        "Unable to load notifications. Please check the server."
      );

      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // =====================================================
  // SOCKET.IO REAL TIME
  // =====================================================

  useEffect(() => {
    const socket = io(SERVER_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log(
        "🟢 Connected to NoteHive real-time server:",
        socket.id
      );

      setSocketConnected(true);

      socket.emit("join-admin");
    });

    socket.on("disconnect", () => {
      console.log("🔴 Admin socket disconnected");

      setSocketConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error(
        "❌ Socket connection error:",
        err.message
      );

      setSocketConnected(false);
    });

    socket.on("admin-notification", (newNotification) => {
      console.log(
        "🔔 New admin notification:",
        newNotification
      );

      setNotifications((prev) => {
        const notificationId =
          newNotification?._id ||
          newNotification?.id;

        if (
          notificationId &&
          prev.some(
            (item) =>
              item?._id === notificationId ||
              item?.id === notificationId
          )
        ) {
          return prev;
        }

        return [newNotification, ...prev];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = () => {
    fetchNotifications(true);
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminId");
    localStorage.removeItem("admin");
    localStorage.removeItem("user");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userRole");
    localStorage.removeItem("notehive_userId");
    localStorage.removeItem("notehive_user");

    navigate("/admin-login", { replace: true });
  };

  // =====================================================
  // NAVIGATION
  // =====================================================

  const goToDashboard = () => {
    navigate("/admin-dashboard");
  };

  const goToUsers = () => {
    navigate("/admin/manage-users");
  };

  const goToNotifications = () => {
    navigate("/admin/notifications");
  };

  const goToNotes = () => {
    navigate("/admin/manage-notes");
  };

  const goToPinned = () => {
    navigate("/admin/pinned-notes");
  };

  const goToFavorites = () => {
    navigate("/admin/favorite-notes");
  };

  const goToReports = () => {
    navigate("/admin/reports");
  };

  // =====================================================
  // DATE FORMAT
  // =====================================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Just now";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Just now";
    }

    const now = new Date();
    const difference = now.getTime() - date.getTime();

    const seconds = Math.floor(difference / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes} min ago`;
    }

    if (hours < 24) {
      return `${hours} hr ago`;
    }

    if (days < 7) {
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================================
  // NOTIFICATION TYPE
  // =====================================================

  const getNotificationType = (notification) => {
    const type = String(
      notification?.type ||
        notification?.category ||
        ""
    ).toLowerCase();

    if (
      type.includes("user") ||
      type.includes("login") ||
      type.includes("signup") ||
      type.includes("register")
    ) {
      return "user";
    }

    if (
      type.includes("note") ||
      type.includes("created") ||
      type.includes("updated") ||
      type.includes("deleted") ||
      type.includes("pinned") ||
      type.includes("favorite")
    ) {
      return "note";
    }

    return "system";
  };

  // =====================================================
  // ICON
  // =====================================================

  const getNotificationIcon = (notification) => {
    const type = getNotificationType(notification);

    if (type === "user") {
      return "👤";
    }

    if (type === "note") {
      return "📝";
    }

    return "🔔";
  };

  // =====================================================
  // TITLE
  // =====================================================

  const getNotificationTitle = (notification) => {
    if (notification?.title) {
      return notification.title;
    }

    const type = getNotificationType(notification);

    if (type === "user") {
      return "User Activity";
    }

    if (type === "note") {
      return "Note Activity";
    }

    return "System Notification";
  };

  // =====================================================
  // MESSAGE
  // =====================================================

  const getNotificationMessage = (notification) => {
    if (notification?.message) {
      return notification.message;
    }

    if (notification?.description) {
      return notification.description;
    }

    if (notification?.text) {
      return notification.text;
    }

    return "New activity has been recorded in NoteHive.";
  };

  // =====================================================
  // USER NAME
  // =====================================================

  const getUserName = (notification) => {
    if (notification?.user?.name) {
      return notification.user.name;
    }

    if (notification?.sender?.name) {
      return notification.sender.name;
    }

    if (notification?.userName) {
      return notification.userName;
    }

    if (notification?.name) {
      return notification.name;
    }

    return "";
  };

  // =====================================================
  // READ / UNREAD
  // =====================================================

  const isUnread = (notification) => {
    return (
      notification?.read === false ||
      notification?.isRead === false
    );
  };

  // =====================================================
  // SUMMARY
  // =====================================================

  const totalNotifications = notifications.length;

  const systemNotifications = notifications.filter(
    (notification) =>
      getNotificationType(notification) === "system"
  ).length;

  const userActivities = notifications.filter(
    (notification) =>
      getNotificationType(notification) === "user"
  ).length;

  const noteActivities = notifications.filter(
    (notification) =>
      getNotificationType(notification) === "note"
  ).length;

  const unreadNotifications = notifications.filter(
    (notification) => isUnread(notification)
  ).length;

  // =====================================================
  // SIDEBAR
  // =====================================================

  const AdminSidebar = () => (
    <aside className="admin-sidebar">
      {/* BRAND */}
      <div className="admin-sidebar-brand">
        <div className="admin-logo">
          <span className="admin-logo-bee">🐝</span>

          <div className="admin-logo-text">
            <strong>NOTEHIVE</strong>
            <small>ADMIN PANEL</small>
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="admin-nav">
        <button
          className="admin-nav-item"
          onClick={goToDashboard}
        >
          <span>📊</span>
          <label>Dashboard</label>
        </button>

        <button
          className="admin-nav-item"
          onClick={goToUsers}
        >
          <span>👥</span>
          <label>Users</label>
        </button>

        <button
          className="admin-nav-item active"
          onClick={goToNotifications}
        >
          <span>🔔</span>
          <label>Notifications</label>
        </button>

        <button
          className="admin-nav-item"
          onClick={goToNotes}
        >
          <span>📝</span>
          <label>Notes</label>
        </button>

        <button
          className="admin-nav-item"
          onClick={goToPinned}
        >
          <span>📌</span>
          <label>Pinned Notes</label>
        </button>

        <button
          className="admin-nav-item"
          onClick={goToFavorites}
        >
          <span>⭐</span>
          <label>Favorites</label>
        </button>

        <button
          className="admin-nav-item"
          onClick={goToReports}
        >
          <span>📈</span>
          <label>Reports</label>
        </button>
      </nav>

      {/* LOGOUT */}
      <button
        className="admin-logout"
        onClick={handleLogout}
      >
        <span>🚪</span>
        <label>Logout</label>
      </button>
    </aside>
  );

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="admin-page-wrapper">
        <AdminHeader />

        <div className="manage-notes-page">
          <AdminSidebar />

          <main className="manage-notes-main">
            <div className="notifications-loading">
              <div className="loading-spinner"></div>

              <p>Loading notifications...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN
  // =====================================================

  return (
    <div className="admin-page-wrapper">
      {/* =================================================
          HEADER
      ================================================= */}
      <AdminHeader />

      <div className="manage-notes-page">
        {/* =================================================
            SIDEBAR
        ================================================= */}
        <AdminSidebar />

        {/* =================================================
            MAIN CONTENT
        ================================================= */}
        <main className="manage-notes-main">
          {/* =================================================
              PAGE HEADER
          ================================================= */}
          <header className="manage-notes-header">
            <div>
              <span className="manage-notes-label">
                ADMIN NOTIFICATIONS
              </span>

              <h1>Notifications</h1>

              <p>
                Monitor all system, user and note
                activities across NoteHive.
              </p>
            </div>

            <div className="notification-header-actions">
              <div className="notification-live-status">
                <span
                  className={`live-status-dot ${
                    socketConnected ? "connected" : ""
                  }`}
                ></span>

                {socketConnected
                  ? "Live"
                  : "Connecting..."}
              </div>

              <button
                className={`notes-refresh-button ${
                  refreshing ? "refreshing" : ""
                }`}
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <span className="refresh-icon">↻</span>

                {refreshing
                  ? "Refreshing..."
                  : "Refresh"}
              </button>
            </div>
          </header>

          {/* =================================================
              SUMMARY
          ================================================= */}
          <section className="notes-summary">
            {/* TOTAL */}
            <div className="notes-summary-card">
              <div className="notes-summary-icon blue">
                🔔
              </div>

              <div>
                <span>Total Notifications</span>
                <strong>{totalNotifications}</strong>
              </div>
            </div>

            {/* SYSTEM */}
            <div className="notes-summary-card">
              <div className="notes-summary-icon purple">
                📢
              </div>

              <div>
                <span>System Updates</span>
                <strong>{systemNotifications}</strong>
              </div>
            </div>

            {/* USERS */}
            <div className="notes-summary-card">
              <div className="notes-summary-icon pink">
                👤
              </div>

              <div>
                <span>User Activities</span>
                <strong>{userActivities}</strong>
              </div>
            </div>

            {/* NOTES */}
            <div className="notes-summary-card">
              <div className="notes-summary-icon green">
                📝
              </div>

              <div>
                <span>Note Activities</span>
                <strong>{noteActivities}</strong>
              </div>
            </div>

            {/* UNREAD */}
            <div className="notes-summary-card">
              <div className="notes-summary-icon orange">
                ✨
              </div>

              <div>
                <span>New / Unread</span>
                <strong>{unreadNotifications}</strong>
              </div>
            </div>
          </section>

          {/* =================================================
              ERROR
          ================================================= */}
          {error && (
            <div className="notes-error">
              <span>⚠️</span>

              <div>
                <strong>
                  Unable to load notifications
                </strong>

                <p>{error}</p>
              </div>

              <button onClick={handleRefresh}>
                Try Again
              </button>
            </div>
          )}

          {/* =================================================
              NOTIFICATIONS
          ================================================= */}
          <section className="notifications-container">
            <div className="notifications-container-header">
              <div>
                <h2>Recent Notifications</h2>

                <p>
                  Latest activity from your NoteHive
                  application
                </p>
              </div>

              <span className="notification-count">
                {totalNotifications}{" "}
                {totalNotifications === 1
                  ? "Notification"
                  : "Notifications"}
              </span>
            </div>

            {/* EMPTY */}
            {!error && notifications.length === 0 ? (
              <div className="notes-empty-state">
                <div className="empty-icon">
                  🔔
                </div>

                <h3>No notifications yet</h3>

                <p>
                  New system, user and note activities
                  will appear here.
                </p>

                <button
                  className="empty-refresh-btn"
                  onClick={handleRefresh}
                >
                  Refresh Notifications
                </button>
              </div>
            ) : (
              <div className="notifications-list">
                {notifications.map(
                  (notification, index) => {
                    const notificationId =
                      notification?._id ||
                      notification?.id ||
                      `notification-${index}`;

                    const unread =
                      isUnread(notification);

                    const type =
                      getNotificationType(
                        notification
                      );

                    const userName =
                      getUserName(notification);

                    return (
                      <div
                        key={notificationId}
                        className={`notification-item ${
                          unread ? "unread" : ""
                        }`}
                      >
                        {/* ICON */}
                        <div
                          className={`notification-icon ${type}`}
                        >
                          {getNotificationIcon(
                            notification
                          )}
                        </div>

                        {/* CONTENT */}
                        <div className="notification-content">
                          <div className="notification-title-row">
                            <h3>
                              {getNotificationTitle(
                                notification
                              )}
                            </h3>

                            {unread && (
                              <span className="unread-badge">
                                NEW
                              </span>
                            )}
                          </div>

                          <p className="notification-message">
                            {getNotificationMessage(
                              notification
                            )}
                          </p>

                          <div className="notification-meta">
                            {userName && (
                              <span className="notification-user">
                                👤 {userName}
                              </span>
                            )}

                            {notification?.note
                              ?.title && (
                              <span className="notification-note">
                                📝{" "}
                                {
                                  notification.note
                                    .title
                                }
                              </span>
                            )}

                            <span className="notification-time">
                              🕒{" "}
                              {formatDate(
                                notification?.createdAt ||
                                  notification?.date
                              )}
                            </span>
                          </div>
                        </div>

                        {/* TYPE */}
                        <div
                          className={`notification-type-badge ${type}`}
                        >
                          {type === "user"
                            ? "User"
                            : type === "note"
                            ? "Note"
                            : "System"}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </section>

          {/* =================================================
              FOOTER
          ================================================= */}
          <footer className="admin-notifications-footer">
            <span>
              🐝 NOTEHIVE ADMIN PANEL
            </span>

            <span>
              Real-time notifications
              {socketConnected
                ? " • Connected"
                : " • Offline"}
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default AdminNotifications;
