import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./UserPanel.css";

const UserPanel = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // =========================================
  // CLOSE MENU WHEN CLICKING OUTSIDE
  // =========================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // =========================================
  // NAVIGATION
  // =========================================

  const goTo = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  // =========================================
  // LOGOUT
  // =========================================

  const handleLogout = () => {
    setMenuOpen(false);

    localStorage.removeItem("notehive_user");
    localStorage.removeItem("notehive_userId");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userRole");

    navigate("/login");
  };

  // =========================================
  // MENU ITEMS
  // =========================================

  const menuItems = [
    {
      icon: "🏠",
      label: "Dashboard",
      path: "/dashboard",
    },
    {
      icon: "📝",
      label: "My Notes",
      path: "/mynotes",
    },
    {
      icon: "📌",
      label: "Pinned Notes",
      path: "/pinned-notes",
    },
    {
      icon: "⭐",
      label: "Favorites",
      path: "/favorite-notes",
    },
    {
      icon: "👤",
      label: "Profile",
      path: "/profile",
    },
    {
      icon: "⚙️",
      label: "Settings",
      path: "/settings",
    },
  ];

  return (
    <>
      {/* =====================================================
          DESKTOP USER PANEL
          ===================================================== */}

      <div className="desktop-user-panel">
        <div className="desktop-user-panel-title">
          <span>🐝</span>
          <strong>User Panel</strong>
        </div>

        <div className="desktop-user-panel-menu">
          {menuItems.map((item) => (
            <button
              key={item.path}
              type="button"
              className={
                location.pathname === item.path
                  ? "user-panel-item active"
                  : "user-panel-item"
              }
              onClick={() => goTo(item.path)}
            >
              <span className="user-panel-icon">
                {item.icon}
              </span>

              <span>{item.label}</span>
            </button>
          ))}

          <button
            type="button"
            className="user-panel-item logout-item"
            onClick={handleLogout}
          >
            <span className="user-panel-icon">
              🚪
            </span>

            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* =====================================================
          MOBILE THREE DOT BUTTON
          ===================================================== */}

      <div
        className="mobile-user-menu"
        ref={menuRef}
      >
        <button
          type="button"
          className="mobile-three-dot-btn"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Open user menu"
          aria-expanded={menuOpen}
        >
          ⋮
        </button>

        {/* ===================================================
            MOBILE DROPDOWN
            =================================================== */}

        {menuOpen && (
          <div className="mobile-user-dropdown">

            <div className="mobile-menu-header">
              <div className="mobile-menu-avatar">
                👤
              </div>

              <div>
                <strong>NoteHive</strong>
                <span>User Panel</span>
              </div>
            </div>

            <div className="mobile-menu-divider" />

            {menuItems.map((item) => (
              <button
                key={item.path}
                type="button"
                className={
                  location.pathname === item.path
                    ? "mobile-menu-item active"
                    : "mobile-menu-item"
                }
                onClick={() => goTo(item.path)}
              >
                <span className="mobile-menu-icon">
                  {item.icon}
                </span>

                <span>{item.label}</span>
              </button>
            ))}

            <div className="mobile-menu-divider" />

            <button
              type="button"
              className="mobile-menu-item mobile-logout"
              onClick={handleLogout}
            >
              <span className="mobile-menu-icon">
                🚪
              </span>

              <span>Logout</span>
            </button>

          </div>
        )}
      </div>
    </>
  );
};

export default UserPanel;