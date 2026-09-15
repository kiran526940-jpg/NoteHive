
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminHeader.css";

const AdminHeader = () => {
  const navigate = useNavigate();
  const [showQuickActions, setShowQuickActions] = useState(false);

  const adminName =
    localStorage.getItem("adminName") ||
    localStorage.getItem("userName") ||
    "Admin";

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("userRole");
    localStorage.removeItem("adminName");
    localStorage.removeItem("adminId");

    navigate("/admin-login");
  };

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

  return (
    <header className="admin-header">
      <div className="admin-header-inner">

        {/* ================= BRAND ================= */}
        <div
          className="admin-brand"
          onClick={() => navigate("/admin-dashboard")}
        >
          <div className="admin-logo">🐝</div>

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
                showQuickActions ? "active" : ""
              }`}
              onClick={() =>
                setShowQuickActions((prev) => !prev)
              }
              aria-label="Quick Actions"
            >
              <span className="quick-actions-icon">⚡</span>
              <span className="quick-actions-text">
                Quick Actions
              </span>
              <span className="quick-actions-arrow">
                {showQuickActions ? "▲" : "▼"}
              </span>
            </button>

            {showQuickActions && (
              <div className="admin-quick-actions-menu">

                <div className="quick-actions-heading">
                  <div>
                    <strong>Quick Actions</strong>
                    <span>Manage your admin panel</span>
                  </div>
                </div>

                <div className="quick-actions-list">

                  {quickActions.map((action) => (
                    <button
                      key={action.path}
                      type="button"
                      className="quick-action-item"
                      onClick={() =>
                        handleQuickAction(action.path)
                      }
                    >
                      <div className="quick-action-icon">
                        {action.icon}
                      </div>

                      <div className="quick-action-content">
                        <strong>{action.title}</strong>
                      </div>

                      <div className="quick-action-arrow">
                        →
                      </div>
                    </button>
                  ))}

                </div>
              </div>
            )}
          </div>

          {/* ================= NOTIFICATIONS ================= */}
          <button
            type="button"
            className="admin-icon-button"
            onClick={() => navigate("/admin/notifications")}
            aria-label="Notifications"
          >
            🔔
            <span className="admin-notification-dot"></span>
          </button>

          {/* ================= PROFILE ================= */}
          <button
            type="button"
            className="admin-profile-button"
            onClick={() => navigate("/admin/profile")}
            aria-label="Admin Profile"
          >
            <div className="admin-avatar">
              {adminName.charAt(0).toUpperCase()}
            </div>

            <div className="admin-profile-info">
              <strong>{adminName}</strong>
              <span>Administrator</span>
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
            <span className="logout-text">Logout</span>
          </button>

        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
