
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./AdminHeader";
import "./AdminDashboard.css";

const SERVER_URL = "http://192.168.1.68:5000";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalNotes: 0,
    activeUsers: 0,
    pendingUsers: 0,
    publicNotes: 0,
    privateNotes: 0,
    completedNotes: 0,
    pinnedNotes: 0,
    favoriteNotes: 0,
    todayActivity: 0,
    userGrowth: [],
    notesGrowth: [],
    activityGrowth: [],
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const adminLoggedIn = localStorage.getItem("adminLoggedIn");
    const userRole = localStorage.getItem("userRole");

    if (adminLoggedIn !== "true" || userRole !== "admin") {
      navigate("/admin-login");
      return;
    }

    fetchStats();
  }, [navigate]);

  const fetchStats = async () => {
    try {
      setError("");

      const response = await fetch(`${SERVER_URL}/api/admin/stats`);

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard statistics");
      }

      const data = await response.json();

      if (data?.success === false) {
        throw new Error(data.message || "Unable to load dashboard");
      }

      const dashboardStats = data.stats || data;

      setStats({
        totalUsers: dashboardStats.totalUsers || 0,
        totalNotes: dashboardStats.totalNotes || 0,
        activeUsers: dashboardStats.activeUsers || 0,
        pendingUsers: dashboardStats.pendingUsers || 0,
        publicNotes: dashboardStats.publicNotes || 0,
        privateNotes: dashboardStats.privateNotes || 0,
        completedNotes: dashboardStats.completedNotes || 0,
        pinnedNotes: dashboardStats.pinnedNotes || 0,
        favoriteNotes: dashboardStats.favoriteNotes || 0,
        todayActivity: dashboardStats.todayActivity || 0,
        userGrowth: dashboardStats.userGrowth || [],
        notesGrowth: dashboardStats.notesGrowth || [],
        activityGrowth: dashboardStats.activityGrowth || [],
      });
    } catch (err) {
      console.error("Admin dashboard error:", err);
      setError(err.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchStats();
    } finally {
      setRefreshing(false);
    }
  };

  const goToUsers = () => navigate("/admin/manage-users");
  const goToNotes = () => navigate("/admin/manage-notes");
  const goToPinned = () => navigate("/admin/pinned-notes");
  const goToFavorites = () => navigate("/admin/favorite-notes");
  const goToNotifications = () => navigate("/admin/notifications");
  const goToReports = () => navigate("/admin/reports");
  const goToProfile = () => navigate("/admin/profile");

  const getGrowthData = (data) => {
    if (!Array.isArray(data)) return [];

    return data.map((item) => ({
      label:
        item.label ||
        item.date ||
        item.day ||
        item._id ||
        "",
      value:
        Number(item.value) ||
        Number(item.count) ||
        Number(item.total) ||
        0,
    }));
  };

  const userGrowth = getGrowthData(stats.userGrowth);
  const notesGrowth = getGrowthData(stats.notesGrowth);
  const activityGrowth = getGrowthData(stats.activityGrowth);

  const maxValue = (data) => {
    const values = data.map((item) => item.value);
    return Math.max(...values, 1);
  };

  const renderMiniChart = (data, type = "bar") => {
    if (!data.length) {
      return (
        <div className="chart-empty">
          <span>📊</span>
          <p>No data available yet</p>
        </div>
      );
    }

    const maximum = maxValue(data);

    if (type === "line") {
      const width = 700;
      const height = 220;
      const padding = 24;
      const usableWidth = width - padding * 2;
      const usableHeight = height - padding * 2;

      const points = data.map((item, index) => {
        const x =
          data.length === 1
            ? width / 2
            : padding +
              (index / (data.length - 1)) * usableWidth;

        const y =
          height -
          padding -
          (item.value / maximum) * usableHeight;

        return `${x},${y}`;
      });

      return (
        <div className="line-chart-wrapper">
          <svg
            className="dashboard-line-chart"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="dashboardLineFill"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#6c63ff" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#6c63ff" stopOpacity="0" />
              </linearGradient>
            </defs>

            <polyline
              points={`${padding},${height - padding} ${points.join(
                " "
              )} ${width - padding},${height - padding}`}
              fill="url(#dashboardLineFill)"
              stroke="none"
            />

            <polyline
              points={points.join(" ")}
              fill="none"
              stroke="#6658d9"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {data.map((item, index) => {
              const [x, y] = points[index].split(",");

              return (
                <circle
                  key={`${item.label}-${index}`}
                  cx={x}
                  cy={y}
                  r="5"
                  fill="#6658d9"
                  stroke="#ffffff"
                  strokeWidth="3"
                />
              );
            })}
          </svg>

          <div className="chart-labels">
            {data.map((item, index) => (
              <span key={`${item.label}-label-${index}`}>
                {item.label}
              </span>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="bar-chart">
        {data.map((item, index) => {
          const height = Math.max(
            (item.value / maximum) * 100,
            item.value > 0 ? 5 : 0
          );

          return (
            <div
              className="bar-item"
              key={`${item.label}-${index}`}
            >
              <div className="bar-value">
                {item.value}
              </div>

              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ height: `${height}%` }}
                ></div>
              </div>

              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <div className="admin-loading-card">
          <div className="admin-loading-logo">🐝</div>
          <div className="admin-loading-spinner"></div>
          <h3>Loading Dashboard</h3>
          <p>Preparing your admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <AdminHeader />

      <main className="admin-main">
        {/* HERO */}
        <section className="admin-welcome-card">
          <div className="welcome-left">
            <div className="welcome-badge">
              <span>🛡️</span>
              Admin Dashboard
            </div>

            <h1>Welcome back, Admin 👋</h1>

            <p>
              Monitor your NoteHive platform, users, notes and
              activity from one place.
            </p>

            <div className="system-status">
              <span className="status-dot"></span>
              <span>System is running smoothly</span>
            </div>
          </div>

          <div className="welcome-right">
            <div className="welcome-bee">🐝</div>

            <button
              className="admin-refresh-button"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <span className={refreshing ? "refresh-spin" : ""}>
                ↻
              </span>

              {refreshing ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>
        </section>

        {error && (
          <div className="dashboard-error">
            ⚠️ {error}
            <button onClick={fetchStats}>Try Again</button>
          </div>
        )}

        {/* OVERVIEW */}
        <section className="admin-stats-section">
          <div className="dashboard-section-title">
            <div>
              <span>OVERVIEW</span>
              <h2>Platform Statistics</h2>
            </div>

            <p>Live overview of your NoteHive platform</p>
          </div>

          <div className="admin-stats advanced-stats">
            <button
              className="admin-stat-card users-card"
              onClick={goToUsers}
            >
              <div className="stat-top">
                <div className="admin-stat-icon">👥</div>
                <span className="stat-arrow">↗</span>
              </div>

              <div className="admin-stat-content">
                <span>Total Users</span>
                <strong>{stats.totalUsers}</strong>
                <small>Registered users</small>
              </div>
            </button>

            <button
              className="admin-stat-card notes-card"
              onClick={goToNotes}
            >
              <div className="stat-top">
                <div className="admin-stat-icon">📝</div>
                <span className="stat-arrow">↗</span>
              </div>

              <div className="admin-stat-content">
                <span>Total Notes</span>
                <strong>{stats.totalNotes}</strong>
                <small>Notes created</small>
              </div>
            </button>

            <button className="admin-stat-card active-card">
              <div className="stat-top">
                <div className="admin-stat-icon">🟢</div>
                <span className="stat-arrow">•</span>
              </div>

              <div className="admin-stat-content">
                <span>Active Users</span>
                <strong>{stats.activeUsers}</strong>
                <small>Active accounts</small>
              </div>
            </button>

            <button className="admin-stat-card pending-card">
              <div className="stat-top">
                <div className="admin-stat-icon">⏳</div>
                <span className="stat-arrow">•</span>
              </div>

              <div className="admin-stat-content">
                <span>Pending Users</span>
                <strong>{stats.pendingUsers}</strong>
                <small>Awaiting approval</small>
              </div>
            </button>

            <button className="admin-stat-card public-card">
              <div className="stat-top">
                <div className="admin-stat-icon">🌍</div>
                <span className="stat-arrow">•</span>
              </div>

              <div className="admin-stat-content">
                <span>Public Notes</span>
                <strong>{stats.publicNotes}</strong>
                <small>Visible to everyone</small>
              </div>
            </button>

            <button className="admin-stat-card private-card">
              <div className="stat-top">
                <div className="admin-stat-icon">🔒</div>
                <span className="stat-arrow">•</span>
              </div>

              <div className="admin-stat-content">
                <span>Private Notes</span>
                <strong>{stats.privateNotes}</strong>
                <small>Personal notes</small>
              </div>
            </button>

            <button className="admin-stat-card completed-card">
              <div className="stat-top">
                <div className="admin-stat-icon">✅</div>
                <span className="stat-arrow">•</span>
              </div>

              <div className="admin-stat-content">
                <span>Completed Notes</span>
                <strong>{stats.completedNotes}</strong>
                <small>Completed tasks</small>
              </div>
            </button>

            <button className="admin-stat-card activity-card">
              <div className="stat-top">
                <div className="admin-stat-icon">⚡</div>
                <span className="stat-arrow">•</span>
              </div>

              <div className="admin-stat-content">
                <span>Today's Activity</span>
                <strong>{stats.todayActivity}</strong>
                <small>Activity today</small>
              </div>
            </button>
          </div>
        </section>

        {/* QUICK INSIGHTS */}
        <section className="dashboard-insights">
          <div className="insight-card">
            <div className="insight-icon">📌</div>
            <div>
              <span>Pinned Notes</span>
              <strong>{stats.pinnedNotes}</strong>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">⭐</div>
            <div>
              <span>Favorite Notes</span>
              <strong>{stats.favoriteNotes}</strong>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">🌐</div>
            <div>
              <span>Public / Private</span>
              <strong>
                {stats.publicNotes} / {stats.privateNotes}
              </strong>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">📚</div>
            <div>
              <span>Completion</span>
              <strong>
                {stats.totalNotes
                  ? Math.round(
                      (stats.completedNotes / stats.totalNotes) * 100
                    )
                  : 0}
                %
              </strong>
            </div>
          </div>
        </section>

        {/* CHARTS */}
        <section className="analytics-section">
          <div className="dashboard-section-title">
            <div>
              <span>ANALYTICS</span>
              <h2>Last 7 Days</h2>
            </div>

            <p>Track platform growth and daily activity</p>
          </div>

          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="analytics-header">
                <div>
                  <span>USER GROWTH</span>
                  <h3>New Users</h3>
                </div>
                <div className="analytics-icon">👤</div>
              </div>

              {renderMiniChart(userGrowth, "line")}
            </div>

            <div className="analytics-card">
              <div className="analytics-header">
                <div>
                  <span>NOTE GROWTH</span>
                  <h3>Notes Created</h3>
                </div>
                <div className="analytics-icon">📝</div>
              </div>

              {renderMiniChart(notesGrowth, "line")}
            </div>

            <div className="analytics-card analytics-wide">
              <div className="analytics-header">
                <div>
                  <span>DAILY ACTIVITY</span>
                  <h3>Platform Activity</h3>
                </div>
                <div className="analytics-icon">⚡</div>
              </div>

              {renderMiniChart(activityGrowth, "bar")}
            </div>
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section className="admin-section">
          <div className="dashboard-section-title">
            <div>
              <span>ACTION CENTER</span>
              <h2>Quick Actions</h2>
            </div>

            <p>Quickly access important admin features</p>
          </div>

          <div className="admin-quick-actions">
            <button
              className="admin-action-card"
              onClick={goToUsers}
            >
              <div className="action-icon users-action">👥</div>
              <div className="action-content">
                <strong>Manage Users</strong>
                <span>View and manage all users</span>
              </div>
              <div className="action-arrow">→</div>
            </button>

            <button
              className="admin-action-card"
              onClick={goToNotes}
            >
              <div className="action-icon notes-action">📝</div>
              <div className="action-content">
                <strong>Manage Notes</strong>
                <span>View and manage all notes</span>
              </div>
              <div className="action-arrow">→</div>
            </button>

            <button
              className="admin-action-card"
              onClick={goToNotifications}
            >
              <div className="action-icon notification-action">
                🔔
              </div>
              <div className="action-content">
                <strong>Notifications</strong>
                <span>Manage platform notifications</span>
              </div>
              <div className="action-arrow">→</div>
            </button>

            <button
              className="admin-action-card"
              onClick={goToReports}
            >
              <div className="action-icon reports-action">📊</div>
              <div className="action-content">
                <strong>Reports & Analytics</strong>
                <span>View platform reports and statistics</span>
              </div>
              <div className="action-arrow">→</div>
            </button>

            <button
              className="admin-action-card"
              onClick={goToProfile}
            >
              <div className="action-icon settings-action">👤</div>
              <div className="action-content">
                <strong>Profile</strong>
                <span>Manage admin profile</span>
              </div>
              <div className="action-arrow">→</div>
            </button>
          </div>
        </section>
      </main>

      <footer className="admin-notifications-footer">
        <p>© {new Date().getFullYear()} NoteHive. All rights reserved.</p>
        <span>Made with ❤️ for better productivity</span>
      </footer>
    </div>
  );
};

export default AdminDashboard;
