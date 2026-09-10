import React, { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import "./Header.css";

const API_URL = "http://192.168.1.68:5000/api";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ======================================================
  // LOGIN STATE
  // ======================================================

  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );

  // ======================================================
  // UNREAD NOTIFICATIONS
  // ======================================================

  const [unreadNotifications, setUnreadNotifications] =
    useState(0);

  // ======================================================
  // USER ID
  // ======================================================

  const userId = localStorage.getItem("notehive_userId");

  // ======================================================
  // CHECK LOGIN
  // ======================================================

  useEffect(() => {
    const checkLoginStatus = () => {
      setIsLoggedIn(
        localStorage.getItem("isLoggedIn") === "true"
      );
    };

    checkLoginStatus();

    window.addEventListener(
      "storage",
      checkLoginStatus
    );

    window.addEventListener(
      "notehive-login-change",
      checkLoginStatus
    );

    return () => {
      window.removeEventListener(
        "storage",
        checkLoginStatus
      );

      window.removeEventListener(
        "notehive-login-change",
        checkLoginStatus
      );
    };
  }, []);

  // ======================================================
  // FETCH UNREAD NOTIFICATIONS
  // ======================================================

  const fetchUnreadNotifications = async () => {
    const currentUserId =
      localStorage.getItem("notehive_userId");

    const loggedIn =
      localStorage.getItem("isLoggedIn") === "true";

    if (!currentUserId || !loggedIn) {
      setUnreadNotifications(0);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/notifications/${currentUserId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch notifications"
        );
      }

      setUnreadNotifications(
        Number(data.unreadCount || 0)
      );
    } catch (error) {
      console.error(
        "❌ Notification error:",
        error
      );

      setUnreadNotifications(0);
    }
  };

  // ======================================================
  // NOTIFICATION POLLING
  // ======================================================

  useEffect(() => {
    if (!isLoggedIn || !userId) {
      setUnreadNotifications(0);
      return;
    }

    fetchUnreadNotifications();

    const notificationInterval = setInterval(() => {
      fetchUnreadNotifications();
    }, 5000);

    return () => {
      clearInterval(notificationInterval);
    };
  }, [isLoggedIn, userId]);

  // ======================================================
  // LOGOUT
  // ======================================================

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("notehive_userId");
    localStorage.removeItem("userRole");
    localStorage.removeItem("notehive_user");

    setIsLoggedIn(false);
    setUnreadNotifications(0);

    window.dispatchEvent(
      new Event("notehive-login-change")
    );

    navigate("/login");
  };

  // ======================================================
  // NOTIFICATIONS
  // ======================================================

  const handleNotifications = () => {
    navigate("/notifications");
  };

  // ======================================================
  // SETTINGS
  // ======================================================

  const handleSettings = () => {
    navigate("/settings");
  };

  // ======================================================
  // ACTIVE ROUTE
  // ======================================================

  const isActive = (path) => {
    return location.pathname === path;
  };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <>
      <header className="header">
        <div className="header-container">

          {/* ==================================================
              LOGO
          ================================================== */}

          <Link
            to="/"
            className="logo"
            onClick={() => window.scrollTo(0, 0)}
          >
            <span className="logo-bee">🐝</span>
            <span className="logo-text">
              NOTEHIVE
            </span>
          </Link>

          {/* ==================================================
              DESKTOP NAVIGATION
          ================================================== */}

          {isLoggedIn && (
            <nav className="nav">

              <Link
                to="/dashboard"
                className={`nav-link ${
                  isActive("/dashboard")
                    ? "active"
                    : ""
                }`}
              >
                Dashboard
              </Link>

              <Link
                to="/my-notes"
                className={`nav-link ${
                  isActive("/my-notes")
                    ? "active"
                    : ""
                }`}
              >
                My Notes
              </Link>

              <Link
                to="/pinned-notes"
                className={`nav-link ${
                  isActive("/pinned-notes")
                    ? "active"
                    : ""
                }`}
              >
                Pinned
              </Link>

              <Link
                to="/settings"
                className={`nav-link ${
                  isActive("/settings")
                    ? "active"
                    : ""
                }`}
              >
                Settings
              </Link>

            </nav>
          )}

          {/* ==================================================
              RIGHT SIDE
          ================================================== */}

          <div className="header-actions">

            {isLoggedIn && (
              <>

                {/* ==================================================
                    NOTIFICATION
                ================================================== */}

                <button
                  type="button"
                  className="header-notification-btn"
                  onClick={handleNotifications}
                  title="Notifications"
                  aria-label="Notifications"
                >
                  <span className="header-bell-icon">
                    🔔
                  </span>

                  {unreadNotifications > 0 && (
                    <span className="notification-dot">
                      {unreadNotifications > 99
                        ? "99+"
                        : unreadNotifications}
                    </span>
                  )}
                </button>

                {/* ==================================================
                    LOGOUT
                ================================================== */}

                <button
                  type="button"
                  className="header-logout-btn"
                  onClick={handleLogout}
                >
                  Logout
                </button>

              </>
            )}

            {/* ==================================================
                LOGIN / SIGNUP
            ================================================== */}

            {!isLoggedIn && (
              <>
                <Link
                  to="/login"
                  className="header-login-btn"
                >
                  Login
                </Link>

                <Link
                  to="/signup"
                  className="header-signup-btn"
                >
                  Sign Up
                </Link>
              </>
            )}

          </div>

        </div>
      </header>

      {/* ======================================================
          MOBILE BOTTOM NAVIGATION
      ====================================================== */}

      {isLoggedIn && (
        <nav className="mobile-bottom-nav">

          {/* DASHBOARD */}

          <button
            type="button"
            className={`mobile-nav-item ${
              isActive("/dashboard")
                ? "mobile-nav-active"
                : ""
            }`}
            onClick={() => navigate("/dashboard")}
          >
            <span className="mobile-nav-icon">
              🏠
            </span>

            <span className="mobile-nav-label">
              Home
            </span>
          </button>

          {/* MY NOTES */}

          <button
            type="button"
            className={`mobile-nav-item ${
              isActive("/my-notes")
                ? "mobile-nav-active"
                : ""
            }`}
            onClick={() => navigate("/my-notes")}
          >
            <span className="mobile-nav-icon">
              📝
            </span>

            <span className="mobile-nav-label">
              Notes
            </span>
          </button>

          {/* PINNED */}

          <button
            type="button"
            className={`mobile-nav-item ${
              isActive("/pinned-notes")
                ? "mobile-nav-active"
                : ""
            }`}
            onClick={() =>
              navigate("/pinned-notes")
            }
          >
            <span className="mobile-nav-icon">
              📌
            </span>

            <span className="mobile-nav-label">
              Pinned
            </span>
          </button>

          {/* NOTIFICATIONS */}

          <button
            type="button"
            className={`mobile-nav-item mobile-notification-item ${
              isActive("/notifications")
                ? "mobile-nav-active"
                : ""
            }`}
            onClick={handleNotifications}
          >
            <span className="mobile-nav-icon">
              🔔
            </span>

            {unreadNotifications > 0 && (
              <span className="mobile-notification-badge">
                {unreadNotifications > 99
                  ? "99+"
                  : unreadNotifications}
              </span>
            )}

            <span className="mobile-nav-label">
              Alerts
            </span>
          </button>

          {/* SETTINGS */}

          <button
            type="button"
            className={`mobile-nav-item ${
              isActive("/settings")
                ? "mobile-nav-active"
                : ""
            }`}
            onClick={handleSettings}
          >
            <span className="mobile-nav-icon">
              ⚙️
            </span>

            <span className="mobile-nav-label">
              Settings
            </span>
          </button>

        </nav>
      )}
    </>
  );
};

export default Header;