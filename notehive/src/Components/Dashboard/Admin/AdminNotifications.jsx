import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import AdminHeader from "./AdminHeader";
import "./AdminNotifications.css";

import { API_URL, SERVER_URL } from "../../../config/api";

// =====================================================
// NOTEHIVE - ADMIN NOTIFICATIONS
// Reports Style • No Sidebar • Responsive
// Socket.IO kept only for real-time notifications
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
    const adminLoggedIn =
      localStorage.getItem("adminLoggedIn");

    const userRole =
      localStorage.getItem("userRole");

    if (
      adminLoggedIn !== "true" ||
      userRole !== "admin"
    ) {
      navigate("/admin-login", {
        replace: true,
      });
    }
  }, [navigate]);

  // =====================================================
  // FETCH NOTIFICATIONS
  // =====================================================

  const fetchNotifications = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await fetch(
          `${API_URL}/admin/notifications`
        );

        if (!response.ok) {
          throw new Error(
            `Server returned ${response.status}`
          );
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
        console.error(
          "❌ Admin notifications error:",
          err
        );

        setError(
          "Unable to load notifications. Please check the server."
        );

        setNotifications([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // =====================================================
  // SOCKET.IO
  // Real-time only for admin notifications
  // =====================================================

  useEffect(() => {
    console.log(
      "🟡 Starting NoteHive admin real-time connection..."
    );

    const socket = io(SERVER_URL, {
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on("connect", () => {
      console.log(
        "🟢 Connected to NoteHive real-time server:",
        socket.id
      );

      setSocketConnected(true);

      socket.emit("join-admin");

      console.log(
        "👑 Admin joined real-time notification room"
      );
    });

    socket.on("disconnect", (reason) => {
      console.log(
        "🔴 Admin socket disconnected:",
        reason
      );

      setSocketConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error(
        "❌ Socket connection error:",
        err.message
      );

      setSocketConnected(false);
    });

    socket.on(
      "admin-notification",
      (newNotification) => {
        console.log(
          "🔔 New admin notification:",
          newNotification
        );

        if (!newNotification) {
          return;
        }

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

          return [
            newNotification,
            ...prev,
          ];
        });
      }
    );

    return () => {
      console.log(
        "🧹 Cleaning up admin Socket.IO connection..."
      );

      socket.removeAllListeners();
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

    navigate("/admin-login", {
      replace: true,
    });
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

    const difference =
      now.getTime() - date.getTime();

    const seconds = Math.floor(
      difference / 1000
    );

    const minutes = Math.floor(
      seconds / 60
    );

    const hours = Math.floor(
      minutes / 60
    );

    const days = Math.floor(
      hours / 24
    );

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
      return `${days} day${
        days > 1 ? "s" : ""
      } ago`;
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =====================================================
  // NOTIFICATION TYPE
  // =====================================================

  const getNotificationType = (
    notification
  ) => {
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

  const getNotificationIcon = (
    notification
  ) => {
    const type =
      getNotificationType(notification);

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

  const getNotificationTitle = (
    notification
  ) => {
    if (notification?.title) {
      return notification.title;
    }

    const type =
      getNotificationType(notification);

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

  const getNotificationMessage = (
    notification
  ) => {
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

  const getUserName = (
    notification
  ) => {
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

  const isUnread = (
    notification
  ) => {
    return (
      notification?.read === false ||
      notification?.isRead === false
    );
  };

  // =====================================================
  // SUMMARY
  // =====================================================

  const totalNotifications =
    notifications.length;

  const systemNotifications =
    notifications.filter(
      (notification) =>
        getNotificationType(
          notification
        ) === "system"
    ).length;

  const userActivities =
    notifications.filter(
      (notification) =>
        getNotificationType(
          notification
        ) === "user"
    ).length;

  const noteActivities =
    notifications.filter(
      (notification) =>
        getNotificationType(
          notification
        ) === "note"
    ).length;

  const unreadNotifications =
    notifications.filter(
      (notification) =>
        isUnread(notification)
    ).length;

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="admin-notifications-page">

        <AdminHeader />

        <main className="admin-notifications-main">

          <div className="notifications-loading-card">

            <div className="loading-spinner"></div>

            <h3>
              Loading Notifications...
            </h3>

            <p>
              Please wait while we fetch
              your latest activities.
            </p>

          </div>

        </main>

      </div>
    );
  }

  // =====================================================
  // MAIN PAGE
  // =====================================================

  return (
    <div className="admin-notifications-page">

      <AdminHeader />

      <main className="admin-notifications-main">

        {/* =================================================
            HERO
        ================================================= */}

        <section className="notifications-hero">

          <div className="notifications-hero-text">

            <p className="notifications-eyebrow">
              ADMINISTRATION
            </p>

            <h1>
              🔔 Notifications
            </h1>

            <p>
              Monitor system, user and note
              activities across your NoteHive
              platform in real time.
            </p>

          </div>

          <div className="notifications-hero-actions">

            <div className="live-status">

              <span
                className={`live-dot ${
                  socketConnected
                    ? "connected"
                    : ""
                }`}
              ></span>

              <span>
                {socketConnected
                  ? "Live Connected"
                  : "Connecting..."}
              </span>

            </div>

            <button
              className={`notifications-refresh-btn ${
                refreshing
                  ? "refreshing"
                  : ""
              }`}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <span>↻</span>

              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>

          </div>

        </section>

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <section className="notification-stat-scroll">

          <article className="notification-stat-card blue">

            <div className="notification-stat-top">

              <span className="notification-stat-icon">
                🔔
              </span>

              <span className="notification-stat-mini">
                TOTAL
              </span>

            </div>

            <strong>
              {totalNotifications}
            </strong>

            <span>
              Total Notifications
            </span>

          </article>

          <article className="notification-stat-card purple">

            <div className="notification-stat-top">

              <span className="notification-stat-icon">
                📢
              </span>

              <span className="notification-stat-mini">
                SYSTEM
              </span>

            </div>

            <strong>
              {systemNotifications}
            </strong>

            <span>
              System Updates
            </span>

          </article>

          <article className="notification-stat-card pink">

            <div className="notification-stat-top">

              <span className="notification-stat-icon">
                👤
              </span>

              <span className="notification-stat-mini">
                USERS
              </span>

            </div>

            <strong>
              {userActivities}
            </strong>

            <span>
              User Activities
            </span>

          </article>

          <article className="notification-stat-card green">

            <div className="notification-stat-top">

              <span className="notification-stat-icon">
                📝
              </span>

              <span className="notification-stat-mini">
                NOTES
              </span>

            </div>

            <strong>
              {noteActivities}
            </strong>

            <span>
              Note Activities
            </span>

          </article>

          <article className="notification-stat-card orange">

            <div className="notification-stat-top">

              <span className="notification-stat-icon">
                ✨
              </span>

              <span className="notification-stat-mini">
                NEW
              </span>

            </div>

            <strong>
              {unreadNotifications}
            </strong>

            <span>
              Unread Notifications
            </span>

          </article>

        </section>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="notifications-error-card">

            <div className="error-icon">
              ⚠️
            </div>

            <div className="error-content">

              <h3>
                Unable to load notifications
              </h3>

              <p>
                {error}
              </p>

            </div>

            <button
              onClick={handleRefresh}
            >
              Try Again
            </button>

          </div>
        )}

        {/* =================================================
            NOTIFICATIONS SECTION
        ================================================= */}

        <section className="notifications-panel">

          <div className="notifications-panel-header">

            <div>

              <p>
                ACTIVITY CENTER
              </p>

              <h2>
                Recent Notifications
              </h2>

              <span>
                Latest activity from your
                NoteHive application
              </span>

            </div>

            <div className="notification-count-badge">

              {totalNotifications}{" "}

              {totalNotifications === 1
                ? "Notification"
                : "Notifications"}

            </div>

          </div>

          {/* EMPTY */}

          {!error &&
          notifications.length === 0 ? (

            <div className="notifications-empty">

              <div className="empty-notification-icon">
                🔔
              </div>

              <p>
                NOTEHIVE ACTIVITY
              </p>

              <h3>
                No notifications yet
              </h3>

              <span>
                New system, user and note
                activities will appear here.
              </span>

              <button
                onClick={handleRefresh}
              >
                Refresh Notifications
              </button>

            </div>

          ) : (

            <div className="notifications-list">

              {notifications.map(
                (
                  notification,
                  index
                ) => {

                  const notificationId =
                    notification?._id ||
                    notification?.id ||
                    `notification-${index}`;

                  const unread =
                    isUnread(
                      notification
                    );

                  const type =
                    getNotificationType(
                      notification
                    );

                  const userName =
                    getUserName(
                      notification
                    );

                  return (
                    <article
                      key={notificationId}
                      className={`notification-card ${
                        unread
                          ? "unread"
                          : ""
                      }`}
                    >

                      <div
                        className={`notification-card-icon ${type}`}
                      >
                        {getNotificationIcon(
                          notification
                        )}
                      </div>

                      <div className="notification-card-content">

                        <div className="notification-card-title">

                          <div>

                            <h3>
                              {getNotificationTitle(
                                notification
                              )}
                            </h3>

                            {unread && (
                              <span className="new-badge">
                                NEW
                              </span>
                            )}

                          </div>

                          <span
                            className={`notification-type ${type}`}
                          >
                            {type === "user"
                              ? "User"
                              : type === "note"
                              ? "Note"
                              : "System"}
                          </span>

                        </div>

                        <p className="notification-card-message">
                          {getNotificationMessage(
                            notification
                          )}
                        </p>

                        <div className="notification-card-meta">

                          {userName && (
                            <span>
                              👤 {userName}
                            </span>
                          )}

                          {notification?.note
                            ?.title && (
                            <span>
                              📝{" "}
                              {
                                notification
                                  .note
                                  .title
                              }
                            </span>
                          )}

                          <span>
                            🕒{" "}
                            {formatDate(
                              notification?.createdAt ||
                                notification?.date
                            )}
                          </span>

                        </div>

                      </div>

                    </article>
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

          <div>
            🐝 NOTEHIVE ADMIN PANEL
          </div>

          <span>
            Real-time notifications
            {socketConnected
              ? " • Connected"
              : " • Offline"}
          </span>

        </footer>

      </main>

      {/* =================================================
          MOBILE NAV
      ================================================= */}

      <nav className="notifications-mobile-nav">

        <button
          onClick={goToDashboard}
        >
          <span>📊</span>
          <small>Home</small>
        </button>

        <button
          onClick={goToUsers}
        >
          <span>👥</span>
          <small>Users</small>
        </button>

        <button
          onClick={goToNotes}
        >
          <span>📝</span>
          <small>Notes</small>
        </button>

        <button
          onClick={goToPinned}
        >
          <span>📌</span>
          <small>Pinned</small>
        </button>

        <button
          className="active"
          onClick={goToNotifications}
        >
          <span>🔔</span>
          <small>Alerts</small>
        </button>

        <button
          onClick={goToReports}
        >
          <span>📈</span>
          <small>Reports</small>
        </button>

      </nav>

    </div>
  );
};

export default AdminNotifications;