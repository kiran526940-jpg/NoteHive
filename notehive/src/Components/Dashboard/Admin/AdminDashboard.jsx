
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./AdminHeader";
import "./AdminDashboard.css";

const SERVER_URL = "http://192.168.1.68:5000";

const AdminDashboard = () => {
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalNotes: 0,
    pinnedNotes: 0,
    favoriteNotes: 0,
    completedNotes: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // =========================================================
  // ADMIN ACCESS CHECK
  // =========================================================

  useEffect(() => {
    const adminLoggedIn = localStorage.getItem("adminLoggedIn");
    const userRole = localStorage.getItem("userRole");

    if (adminLoggedIn !== "true" || userRole !== "admin") {
      navigate("/admin-login");
      return;
    }

    fetchStats();
  }, [navigate]);

  // =========================================================
  // FETCH STATS
  // =========================================================

  const fetchStats = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${SERVER_URL}/api/admin/stats`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch admin statistics");
      }

      const data = await response.json();

      if (data?.stats) {
        setStats({
          totalUsers: data.stats.totalUsers || 0,
          totalNotes: data.stats.totalNotes || 0,
          pinnedNotes: data.stats.pinnedNotes || 0,
          favoriteNotes: data.stats.favoriteNotes || 0,
          completedNotes: data.stats.completedNotes || 0,
        });
      }
    } catch (error) {
      console.error("Admin stats error:", error);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchStats();
    } finally {
      setRefreshing(false);
    }
  };

  // =========================================================
  // NAVIGATION
  // =========================================================

  const goToUsers = () => {
    navigate("/admin/manage-users");
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

  const goToNotifications = () => {
    navigate("/admin/notifications");
  };

  const goToReports = () => {
    navigate("/admin/reports");
  };

  // =========================================================
  // PROFILE NAVIGATION
  // =========================================================

  const goToProfile = () => {
    navigate("/admin/profile");
  };

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <div className="admin-dashboard-loading">

        <div className="admin-loading-card">

          <div className="admin-loading-logo">
            🐝
          </div>

          <div className="admin-loading-spinner"></div>

          <h3>Loading Dashboard</h3>

          <p>
            Preparing your admin panel...
          </p>

        </div>

      </div>
    );
  }

  // =========================================================
  // DASHBOARD UI
  // =========================================================

  return (
    <div className="admin-dashboard">

      {/* =====================================================
          ADMIN HEADER
      ===================================================== */}

      <AdminHeader />

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="admin-main">

        {/* ===================================================
            WELCOME HERO
        =================================================== */}

        <section className="admin-welcome-card">

          <div className="welcome-left">

            <div className="welcome-badge">
              <span>🛡️</span>
              Admin Dashboard
            </div>

            <h1>
              Welcome back, Admin 👋
            </h1>

            <p>
              Manage your NoteHive platform, users,
              notes and notifications from one place.
            </p>

            <div className="system-status">
              <span className="status-dot"></span>
              <span>
                System is running smoothly
              </span>
            </div>

          </div>

          <div className="welcome-right">

            <div className="welcome-bee">
              🐝
            </div>

            <button
              className="admin-refresh-button"
              onClick={handleRefresh}
              disabled={refreshing}
            >

              <span
                className={
                  refreshing
                    ? "refresh-spin"
                    : ""
                }
              >
                ↻
              </span>

              {refreshing
                ? "Refreshing..."
                : "Refresh Data"}

            </button>

          </div>

        </section>

        {/* ===================================================
            STATISTICS
        =================================================== */}

        <section className="admin-stats-section">

          <div className="dashboard-section-title">

            <div>
              <span>OVERVIEW</span>
              <h2>
                Platform Statistics
              </h2>
            </div>

            <p>
              A quick look at your NoteHive activity
            </p>

          </div>

          <div className="admin-stats">

            {/* USERS */}

            <button
              className="admin-stat-card users-card"
              onClick={goToUsers}
            >

              <div className="stat-top">

                <div className="admin-stat-icon">
                  👥
                </div>

                <span className="stat-arrow">
                  ↗
                </span>

              </div>

              <div className="admin-stat-content">

                <span>Total Users</span>

                <strong>
                  {stats.totalUsers}
                </strong>

                <small>
                  Registered users
                </small>

              </div>

            </button>

            {/* NOTES */}

            <button
              className="admin-stat-card notes-card"
              onClick={goToNotes}
            >

              <div className="stat-top">

                <div className="admin-stat-icon">
                  📝
                </div>

                <span className="stat-arrow">
                  ↗
                </span>

              </div>

              <div className="admin-stat-content">

                <span>Total Notes</span>

                <strong>
                  {stats.totalNotes}
                </strong>

                <small>
                  Notes created
                </small>

              </div>

            </button>

            {/* PINNED */}

            <button
              className="admin-stat-card pinned-card"
              onClick={goToPinned}
            >

              <div className="stat-top">

                <div className="admin-stat-icon">
                  📌
                </div>

                <span className="stat-arrow">
                  ↗
                </span>

              </div>

              <div className="admin-stat-content">

                <span>Pinned Notes</span>

                <strong>
                  {stats.pinnedNotes}
                </strong>

                <small>
                  Important notes
                </small>

              </div>

            </button>

            {/* FAVORITES */}

            <button
              className="admin-stat-card favorite-card"
              onClick={goToFavorites}
            >

              <div className="stat-top">

                <div className="admin-stat-icon">
                  ⭐
                </div>

                <span className="stat-arrow">
                  ↗
                </span>

              </div>

              <div className="admin-stat-content">

                <span>Favorite Notes</span>

                <strong>
                  {stats.favoriteNotes}
                </strong>

                <small>
                  Saved favorites
                </small>

              </div>

            </button>

          </div>

        </section>

        {/* ===================================================
            QUICK ACTIONS
        =================================================== */}

        <section className="admin-section">

          <div className="dashboard-section-title">

            <div>
              <span>ACTION CENTER</span>

              <h2>
                Quick Actions
              </h2>
            </div>

            <p>
              Quickly access important admin features
            </p>

          </div>

          <div className="admin-quick-actions">

            {/* MANAGE USERS */}

            <button
              className="admin-action-card"
              onClick={goToUsers}
            >

              <div className="action-icon users-action">
                👥
              </div>

              <div className="action-content">

                <strong>
                  Manage Users
                </strong>

                <span>
                  View and manage all users
                </span>

              </div>

              <div className="action-arrow">
                →
              </div>

            </button>

            {/* MANAGE NOTES */}

            <button
              className="admin-action-card"
              onClick={goToNotes}
            >

              <div className="action-icon notes-action">
                📝
              </div>

              <div className="action-content">

                <strong>
                  Manage Notes
                </strong>

                <span>
                  View and manage all notes
                </span>

              </div>

              <div className="action-arrow">
                →
              </div>

            </button>

            {/* NOTIFICATIONS */}

            <button
              className="admin-action-card"
              onClick={goToNotifications}
            >

              <div className="action-icon notification-action">
                🔔
              </div>

              <div className="action-content">

                <strong>
                  Notifications
                </strong>

                <span>
                  Manage platform notifications
                </span>

              </div>

              <div className="action-arrow">
                →
              </div>

            </button>

            {/* REPORTS */}

            <button
              className="admin-action-card"
              onClick={goToReports}
            >

              <div className="action-icon reports-action">
                📊
              </div>

              <div className="action-content">

                <strong>
                  Reports & Analytics
                </strong>

                <span>
                  View platform reports and statistics
                </span>

              </div>

              <div className="action-arrow">
                →
              </div>

            </button>

            {/* PROFILE */}

            <button
              className="admin-action-card"
              onClick={goToProfile}
            >

              <div className="action-icon settings-action">
                👤
              </div>

              <div className="action-content">

                <strong>
                  Profile
                </strong>

                <span>
                  Manage admin profile
                </span>

              </div>

              <div className="action-arrow">
                →
              </div>

            </button>

          </div>

        </section>

      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="admin-notifications-footer">

        <p>
          © {new Date().getFullYear()} NoteHive.
          All rights reserved.
        </p>

        <span>
          Made with ❤️ for better productivity
        </span>

      </footer>

    </div>
  );
};

export default AdminDashboard;
