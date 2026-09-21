
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import "./AdminHeader.css";

import { API_URL, SERVER_URL } from "../../../config/api";

const AdminHeader = () => {
  const navigate = useNavigate();

  const [showQuickActions, setShowQuickActions] =
    useState(false);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const adminName =
    localStorage.getItem("adminName") ||
    localStorage.getItem("userName") ||
    "Admin";

  // =====================================================
  // FETCH UNREAD NOTIFICATION COUNT
  // =====================================================

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(
        `${API_URL}/admin/notifications`
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      const notificationList = Array.isArray(data)
        ? data
        : Array.isArray(data.notifications)
        ? data.notifications
        : Array.isArray(data.activities)
        ? data.activities
        : [];

      const unread = notificationList.filter(
        (notification) =>
          notification?.read === false ||
          notification?.isRead === false
      ).length;

      setUnreadCount(unread);
    } catch (error) {
      console.error(
        "❌ Unable to fetch notification count:",
        error
      );
    }
  };

  // =====================================================
  // INITIAL COUNT + REAL-TIME SOCKET
  // =====================================================

  useEffect(() => {
    fetchUnreadCount();

    console.log(
      "🟡 Starting admin header notification socket..."
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
        "🟢 Admin header socket connected:",
        socket.id
      );

      socket.emit("join-admin");
    });

    // ===================================================
    // NEW NOTIFICATION
    // ===================================================

    socket.on(
      "admin-notification",
      (newNotification) => {
        console.log(
          "🔔 Header received new notification:",
          newNotification
        );

        if (!newNotification) {
          return;
        }

        const isUnread =
          newNotification?.read === false ||
          newNotification?.isRead === false;

        if (isUnread) {
          setUnreadCount((previous) => previous + 1);
        }
      }
    );

    // ===================================================
    // CLEANUP
    // ===================================================

    return () => {
      console.log(
        "🧹 Cleaning up admin header notification socket..."
      );

      socket.removeAllListeners();
      socket.disconnect();
    };
  }, []);

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("userRole");
    localStorage.removeItem("adminName");
    localStorage.removeItem("adminId");

    navigate("/admin-login");
  };

  // =====================================================
  // QUICK ACTIONS
  // =====================================================

  const quickActions = [
    {
      icon: "👥",
      title: "Manage Users",
      path: "/admin/manage-users",
    },
    {
      icon: "📝",
      title: "Manage Notes",
      path: "/admin/manage-notes",
    },
    {
      icon: "📊",
      title: "Reports & Analytics",
      path: "/admin/reports",
    },
    {
      icon: "👤",
      title: "Profile",
      path: "/admin/profile",
    },
  ];

  const handleQuickAction = (path) => {
    setShowQuickActions(false);
    navigate(path);
  };

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  const handleNotifications = () => {
    navigate("/admin/notifications");
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <header className="admin-header">
      <div className="admin-header-inner">

        {/* ================= BRAND ================= */}

        <div
          className="admin-brand"
          onClick={() =>
            navigate("/admin-dashboard")
          }
        >
          <div className="admin-logo">
            🐝
          </div>

          <div className="admin-brand-text">
            <h1>NoteHive</h1>
            <span>Admin Panel</span>
          </div>
        </div>

        {/* ================= HEADER ACTIONS ================= */}

        <div className="admin-header-actions">

          {/* ================= QUICK ACTIONS ================= */}

          <div className="admin-quick-actions-wrapper">

            <button
              type="button"
              className={`admin-quick-actions-button ${
                showQuickActions
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setShowQuickActions(
                  (previous) => !previous
                )
              }
              aria-label="Quick Actions"
            >
              <span className="quick-actions-icon">
                ⚡
              </span>

              <span className="quick-actions-text">
                Quick Actions
              </span>

              <span className="quick-actions-arrow">
                {showQuickActions
                  ? "▲"
                  : "▼"}
              </span>
            </button>

            {showQuickActions && (
              <div className="admin-quick-actions-menu">

                <div className="quick-actions-heading">
                  <div>
                    <strong>
                      Quick Actions
                    </strong>

                    <span>
                      Manage your admin panel
                    </span>
                  </div>
                </div>

                <div className="quick-actions-list">

                  {quickActions.map(
                    (action) => (
                      <button
                        key={action.path}
                        type="button"
                        className="quick-action-item"
                        onClick={() =>
                          handleQuickAction(
                            action.path
                          )
                        }
                      >
                        <div className="quick-action-icon">
                          {action.icon}
                        </div>

                        <div className="quick-action-content">
                          <strong>
                            {action.title}
                          </strong>
                        </div>

                        <div className="quick-action-arrow">
                          →
                        </div>
                      </button>
                    )
                  )}

                </div>
              </div>
            )}

          </div>

          {/* ================= NOTIFICATIONS ================= */}

          <button
            type="button"
            className="admin-icon-button admin-notification-button"
            onClick={handleNotifications}
            aria-label="Notifications"
          >
            <span className="admin-bell-icon">
              🔔
            </span>

            {/* ================= UNREAD COUNT ================= */}

            {unreadCount > 0 && (
              <span className="admin-notification-count">
                {unreadCount > 99
                  ? "99+"
                  : unreadCount}
              </span>
            )}
          </button>

          {/* ================= PROFILE ================= */}

          <button
            type="button"
            className="admin-profile-button"
            onClick={() =>
              navigate("/admin/profile")
            }
            aria-label="Admin Profile"
          >
            <div className="admin-avatar">
              {adminName
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="admin-profile-info">
              <strong>
                {adminName}
              </strong>

              <span>
                Administrator
              </span>
            </div>
          </button>

          {/* ================= LOGOUT ================= */}

          <button
            type="button"
            className="admin-logout-button"
            onClick={handleLogout}
            aria-label="Logout"
          >
            <span>🚪</span>

            <span className="logout-text">
              Logout
            </span>
          </button>

        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
