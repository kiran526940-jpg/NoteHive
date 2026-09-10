
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./AdminFooter.css";

function AdminFooter() {
  const navigate = useNavigate();
  const location = useLocation();

  // =====================================================
  // ADMIN LOGIN PAGE PAR FOOTER SHOW NAHI HOGA
  // =====================================================

  if (location.pathname === "/admin-login") {
    return null;
  }

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("userRole");
    localStorage.removeItem("adminName");
    localStorage.removeItem("adminId");

    navigate("/admin-login", { replace: true });
  };

  // =====================================================
  // NAVIGATION
  // =====================================================

  const goTo = (path) => {
    navigate(path);
  };

  // =====================================================
  // ACTIVE PAGE
  // =====================================================

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <footer className="admin-mobile-footer">

      {/* =================================================
          DASHBOARD
      ================================================= */}

      <button
        type="button"
        className={`admin-footer-btn ${
          isActive("/admin-dashboard") ? "active" : ""
        }`}
        onClick={() => goTo("/admin-dashboard")}
      >
        <span className="admin-footer-icon">
          🏠
        </span>

        <span className="admin-footer-label">
          Dashboard
        </span>
      </button>


      {/* =================================================
          NOTES
      ================================================= */}

      <button
        type="button"
        className={`admin-footer-btn ${
          isActive("/admin/manage-notes") ? "active" : ""
        }`}
        onClick={() => goTo("/admin/manage-notes")}
      >
        <span className="admin-footer-icon">
          📝
        </span>

        <span className="admin-footer-label">
          Notes
        </span>
      </button>


      {/* =================================================
          NOTIFICATIONS
      ================================================= */}

      <button
        type="button"
        className={`admin-footer-btn ${
          isActive("/admin/notifications") ? "active" : ""
        }`}
        onClick={() => goTo("/admin/notifications")}
      >
        <span className="admin-footer-icon">
          🔔
        </span>

        <span className="admin-footer-label">
          Alerts
        </span>
      </button>


      {/* =================================================
          USERS
      ================================================= */}

      <button
        type="button"
        className={`admin-footer-btn ${
          isActive("/admin/manage-users") ? "active" : ""
        }`}
        onClick={() => goTo("/admin/manage-users")}
      >
        <span className="admin-footer-icon">
          👥
        </span>

        <span className="admin-footer-label">
          Users
        </span>
      </button>


      {/* =================================================
          PROFILE
      ================================================= */}

      <button
        type="button"
        className={`admin-footer-btn ${
          isActive("/admin/profile") ? "active" : ""
        }`}
        onClick={() => goTo("/admin/profile")}
      >
        <span className="admin-footer-icon">
          👤
        </span>

        <span className="admin-footer-label">
          Profile
        </span>
      </button>


    </footer>
  );
}

export default AdminFooter;
