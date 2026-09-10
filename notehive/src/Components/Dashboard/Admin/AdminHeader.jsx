import React from "react";
import { useNavigate } from "react-router-dom";
import "./AdminHeader.css";

const AdminHeader = () => {
  const navigate = useNavigate();

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

  return (
    <header className="admin-header">
      <div className="admin-header-inner">

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

        <div className="admin-header-actions">

          <button
            type="button"
            className="admin-icon-button"
            onClick={() => navigate("/admin/notifications")}
            aria-label="Notifications"
          >
            🔔
            <span className="admin-notification-dot"></span>
          </button>

          <button
            type="button"
            className="admin-profile-button"
            onClick={() => navigate("/admin/settings")}
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