import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./AdminHeader";
import "./AdminReports.css";

const SERVER_URL = "http://192.168.1.68:5000";

const AdminReports = () => {
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // FETCH REPORTS
  // =====================================================

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${SERVER_URL}/api/admin/reports`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load reports"
        );
      }

      setReport(data.report);
    } catch (err) {
      console.error("Reports Error:", err);
      setError(
        err.message ||
          "Unable to load reports. Please check the server."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // =====================================================
  // DATE FORMAT
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "";

    const parts = date.split("-");

    if (parts.length !== 3) return date;

    return `${parts[2]}/${parts[1]}`;
  };

  // =====================================================
  // CSV EXPORT
  // =====================================================

  const exportCSV = () => {
    if (!report) return;

    let csv = "";

    csv += "NOTEHIVE ADMIN REPORTS\n\n";

    csv += "OVERVIEW\n";
    csv += "Metric,Value\n";
    csv += `Total Users,${report.overview?.totalUsers || 0}\n`;
    csv += `Total Notes,${report.overview?.totalNotes || 0}\n`;
    csv += `Completed Notes,${report.overview?.completedNotes || 0}\n`;
    csv += `Pending Notes,${report.overview?.pendingNotes || 0}\n`;
    csv += `Pinned Notes,${report.overview?.pinnedNotes || 0}\n`;
    csv += `Favorite Notes,${report.overview?.favoriteNotes || 0}\n\n`;

    csv += "CATEGORY REPORT\n";
    csv += "Category,Count\n";

    (report.categoryReport || []).forEach((item) => {
      csv += `"${item.category || "Uncategorized"}",${item.count || 0}\n`;
    });

    csv += "\nUSER REPORT\n";
    csv += "User,Email,Notes,Completed\n";

    (report.userReport || []).forEach((user) => {
      csv += `"${user.name || "User"}","${user.email || ""}",${
        user.notes || 0
      },${user.completed || 0}\n`;
    });

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "notehive-admin-report.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // =====================================================
  // SIDEBAR LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("userRole");
    localStorage.removeItem("adminName");
    localStorage.removeItem("adminId");

    navigate("/admin-login");
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="reports-page">
        <AdminHeader />

        <aside className="reports-sidebar">
          <div className="reports-sidebar-brand">
            <div className="reports-sidebar-logo">🐝</div>

            <div>
              <h2>NOTEHIVE</h2>
              <span>ADMIN PANEL</span>
            </div>
          </div>

          <nav className="reports-sidebar-nav">
            <button onClick={() => navigate("/admin-dashboard")}>
              <span>📊</span>
              <span>Dashboard</span>
            </button>

            <button onClick={() => navigate("/admin/users")}>
              <span>👥</span>
              <span>Users</span>
            </button>

            <button onClick={() => navigate("/admin/notifications")}>
              <span>🔔</span>
              <span>Notifications</span>
            </button>

            <button onClick={() => navigate("/admin/notes")}>
              <span>📝</span>
              <span>Notes</span>
            </button>

            <button onClick={() => navigate("/admin/pinned-notes")}>
              <span>📌</span>
              <span>Pinned Notes</span>
            </button>

            <button onClick={() => navigate("/admin/favorites")}>
              <span>⭐</span>
              <span>Favorites</span>
            </button>

            <button
              className="active"
              onClick={() => navigate("/admin/reports")}
            >
              <span>📈</span>
              <span>Reports</span>
            </button>
          </nav>

          <button
            className="reports-sidebar-logout"
            onClick={handleLogout}
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </aside>

        <div className="reports-loading">
          <div className="reports-spinner"></div>
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className="reports-page">
        <AdminHeader />

        <aside className="reports-sidebar">
          <div className="reports-sidebar-brand">
            <div className="reports-sidebar-logo">🐝</div>

            <div>
              <h2>NOTEHIVE</h2>
              <span>ADMIN PANEL</span>
            </div>
          </div>

          <nav className="reports-sidebar-nav">
            <button onClick={() => navigate("/admin-dashboard")}>
              <span>📊</span>
              <span>Dashboard</span>
            </button>

            <button onClick={() => navigate("/admin/users")}>
              <span>👥</span>
              <span>Users</span>
            </button>

            <button onClick={() => navigate("/admin/notifications")}>
              <span>🔔</span>
              <span>Notifications</span>
            </button>

            <button onClick={() => navigate("/admin/notes")}>
              <span>📝</span>
              <span>Notes</span>
            </button>

            <button onClick={() => navigate("/admin/pinned-notes")}>
              <span>📌</span>
              <span>Pinned Notes</span>
            </button>

            <button onClick={() => navigate("/admin/favorites")}>
              <span>⭐</span>
              <span>Favorites</span>
            </button>

            <button
              className="active"
              onClick={() => navigate("/admin/reports")}
            >
              <span>📈</span>
              <span>Reports</span>
            </button>
          </nav>

          <button
            className="reports-sidebar-logout"
            onClick={handleLogout}
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </aside>

        <main className="reports-error">
          <div className="error-icon">⚠️</div>

          <h2>Unable to Load Reports</h2>

          <p>{error}</p>

          <button
            className="retry-btn"
            onClick={fetchReports}
          >
            Try Again
          </button>
        </main>
      </div>
    );
  }

  // =====================================================
  // SAFE DATA
  // =====================================================

  const overview = report?.overview || {};

  const totalUsers = overview.totalUsers || 0;
  const totalNotes = overview.totalNotes || 0;
  const completedNotes = overview.completedNotes || 0;
  const pendingNotes = overview.pendingNotes || 0;
  const pinnedNotes = overview.pinnedNotes || 0;
  const favoriteNotes = overview.favoriteNotes || 0;

  const publicNotes = overview.publicNotes || 0;
  const privateNotes = overview.privateNotes || 0;

  const completionPercentage =
    totalNotes > 0
      ? Math.round((completedNotes / totalNotes) * 100)
      : 0;

  const visibilityTotal =
    publicNotes + privateNotes || 1;

  return (
    <div className="reports-page">
      {/* =================================================
          TOP HEADER
      ================================================= */}

      <AdminHeader />

      {/* =================================================
          LEFT ADMIN SIDEBAR
      ================================================= */}

      <aside className="reports-sidebar">
        <div className="reports-sidebar-brand">
          <div className="reports-sidebar-logo">🐝</div>

          <div>
            <h2>NOTEHIVE</h2>
            <span>ADMIN PANEL</span>
          </div>
        </div>

        <nav className="reports-sidebar-nav">
          <button onClick={() => navigate("/admin-dashboard")}>
            <span>📊</span>
            <span>Dashboard</span>
          </button>

          <button onClick={() => navigate("/admin/users")}>
            <span>👥</span>
            <span>Users</span>
          </button>

          <button
            onClick={() => navigate("/admin/notifications")}
          >
            <span>🔔</span>
            <span>Notifications</span>
          </button>

          <button onClick={() => navigate("/admin/notes")}>
            <span>📝</span>
            <span>Notes</span>
          </button>

          <button
            onClick={() => navigate("/admin/pinned-notes")}
          >
            <span>📌</span>
            <span>Pinned Notes</span>
          </button>

          <button
            onClick={() => navigate("/admin/favorites")}
          >
            <span>⭐</span>
            <span>Favorites</span>
          </button>

          <button
            className="active"
            onClick={() => navigate("/admin/reports")}
          >
            <span>📈</span>
            <span>Reports</span>
          </button>
        </nav>

        <button
          className="reports-sidebar-logout"
          onClick={handleLogout}
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </aside>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="reports-main">
        {/* HEADING */}

        <div className="reports-heading">
          <div>
            <span className="reports-small-title">
              ADMIN ANALYTICS
            </span>

            <h1>Reports & Analytics</h1>

            <p>
              Track your NoteHive activity, users and notes
              performance.
            </p>
          </div>

          <div className="reports-actions">
            <button
              className="refresh-report-btn"
              onClick={fetchReports}
            >
              🔄 Refresh
            </button>

            <button
              className="export-report-btn"
              onClick={exportCSV}
            >
              📥 Export CSV
            </button>
          </div>
        </div>

        {/* =================================================
            OVERVIEW CARDS
        ================================================= */}

        <section className="report-cards">
          <div className="report-card users-card">
            <div className="report-card-icon">👥</div>

            <div className="report-card-content">
              <span>Total Users</span>
              <strong>{totalUsers}</strong>
              <small>Registered users</small>
            </div>
          </div>

          <div className="report-card notes-card">
            <div className="report-card-icon">📝</div>

            <div className="report-card-content">
              <span>Total Notes</span>
              <strong>{totalNotes}</strong>
              <small>All notes</small>
            </div>
          </div>

          <div className="report-card completed-card">
            <div className="report-card-icon">✅</div>

            <div className="report-card-content">
              <span>Completed</span>
              <strong>{completedNotes}</strong>
              <small>Completed notes</small>
            </div>
          </div>

          <div className="report-card pending-card">
            <div className="report-card-icon">⏳</div>

            <div className="report-card-content">
              <span>Pending</span>
              <strong>{pendingNotes}</strong>
              <small>Pending notes</small>
            </div>
          </div>

          <div className="report-card pinned-card">
            <div className="report-card-icon">📌</div>

            <div className="report-card-content">
              <span>Pinned</span>
              <strong>{pinnedNotes}</strong>
              <small>Pinned notes</small>
            </div>
          </div>

          <div className="report-card favorite-card">
            <div className="report-card-icon">⭐</div>

            <div className="report-card-content">
              <span>Favorites</span>
              <strong>{favoriteNotes}</strong>
              <small>Favorite notes</small>
            </div>
          </div>
        </section>

        {/* =================================================
            VISIBILITY + COMPLETION
        ================================================= */}

        <section className="analytics-grid">
          <div className="analytics-box visibility-box">
            <div className="analytics-title">
              <div>
                <h2>Note Visibility</h2>
                <p>Public vs private notes</p>
              </div>

              <span className="analytics-icon">👁️</span>
            </div>

            <div className="visibility-content">
              <div className="visibility-item">
                <div className="visibility-label">
                  <span className="dot public-dot"></span>
                  Public
                </div>

                <strong>{publicNotes}</strong>
              </div>

              <div className="visibility-bar">
                <div
                  className="public-bar"
                  style={{
                    width: `${
                      (publicNotes / visibilityTotal) * 100
                    }%`,
                  }}
                ></div>
              </div>

              <div className="visibility-item">
                <div className="visibility-label">
                  <span className="dot private-dot"></span>
                  Private
                </div>

                <strong>{privateNotes}</strong>
              </div>

              <div className="visibility-bar">
                <div
                  className="private-bar"
                  style={{
                    width: `${
                      (privateNotes / visibilityTotal) * 100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="analytics-box completion-box">
            <div className="analytics-title">
              <div>
                <h2>Completion Rate</h2>
                <p>Overall note completion</p>
              </div>

              <span className="analytics-icon">🎯</span>
            </div>

            <div className="completion-content">
              <div
                className="completion-circle"
                style={{
                  "--progress": `${completionPercentage}%`,
                }}
              >
                <div>
                  <strong>
                    {completionPercentage}%
                  </strong>

                  <span>Completed</span>
                </div>
              </div>

              <div className="completion-stats">
                <div>
                  <span className="complete-dot"></span>

                  <div>
                    <small>Completed</small>
                    <strong>{completedNotes}</strong>
                  </div>
                </div>

                <div>
                  <span className="pending-dot"></span>

                  <div>
                    <small>Pending</small>
                    <strong>{pendingNotes}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            CHARTS
        ================================================= */}

        <section className="charts-grid">
          <div className="chart-box">
            <div className="chart-header">
              <div>
                <h2>Notes Activity</h2>
                <p>Last 7 days</p>
              </div>

              <span>📝</span>
            </div>

            <div className="bar-chart">
              {(report?.notesActivity || []).length === 0 ? (
                <div className="empty-chart">
                  No activity available
                </div>
              ) : (
                report.notesActivity.map((item, index) => {
                  const maxValue = Math.max(
                    ...(report.notesActivity || []).map(
                      (x) => x.count || 0
                    ),
                    1
                  );

                  const height =
                    ((item.count || 0) / maxValue) * 100;

                  return (
                    <div
                      className="chart-column"
                      key={index}
                    >
                      <span className="bar-value">
                        {item.count || 0}
                      </span>

                      <div className="bar-wrapper">
                        <div
                          className="chart-bar"
                          style={{
                            height: `${Math.max(
                              height,
                              3
                            )}%`,
                          }}
                        ></div>
                      </div>

                      <span className="bar-label">
                        {formatDate(item.date)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="chart-box">
            <div className="chart-header">
              <div>
                <h2>User Activity</h2>
                <p>Last 7 days</p>
              </div>

              <span>👥</span>
            </div>

            <div className="bar-chart">
              {(report?.userActivity || []).length === 0 ? (
                <div className="empty-chart">
                  No activity available
                </div>
              ) : (
                report.userActivity.map((item, index) => {
                  const maxValue = Math.max(
                    ...(report.userActivity || []).map(
                      (x) => x.count || 0
                    ),
                    1
                  );

                  const height =
                    ((item.count || 0) / maxValue) * 100;

                  return (
                    <div
                      className="chart-column"
                      key={index}
                    >
                      <span className="bar-value">
                        {item.count || 0}
                      </span>

                      <div className="bar-wrapper">
                        <div
                          className="chart-bar user-chart-bar"
                          style={{
                            height: `${Math.max(
                              height,
                              3
                            )}%`,
                          }}
                        ></div>
                      </div>

                      <span className="bar-label">
                        {formatDate(item.date)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* =================================================
            TABLES
        ================================================= */}

        <section className="tables-grid">
          {/* CATEGORY REPORT */}

          <div className="table-box">
            <div className="table-heading">
              <div>
                <h2>Notes by Category</h2>
                <p>Category-wise distribution</p>
              </div>

              <span>📂</span>
            </div>

            <div className="category-list">
              {(report?.categoryReport || []).length === 0 ? (
                <div className="empty-table">
                  No category data available
                </div>
              ) : (
                report.categoryReport.map((item, index) => (
                  <div
                    className="category-row"
                    key={index}
                  >
                    <div className="category-info">
                      <span className="category-number">
                        {index + 1}
                      </span>

                      <div>
                        <strong>
                          {item.category ||
                            "Uncategorized"}
                        </strong>

                        <small>Notes</small>
                      </div>
                    </div>

                    <span className="category-count">
                      {item.count || 0}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* USER REPORT */}

          <div className="table-box user-report-box">
            <div className="table-heading">
              <div>
                <h2>User Report</h2>
                <p>User-wise notes activity</p>
              </div>

              <span>👤</span>
            </div>

            <div className="user-table">
              <div className="user-table-head">
                <span>User</span>
                <span>Notes</span>
                <span>Done</span>
              </div>

              {(report?.userReport || []).length === 0 ? (
                <div className="empty-table">
                  No user data available
                </div>
              ) : (
                report.userReport.map((user, index) => (
                  <div
                    className="user-table-row"
                    key={user._id || index}
                  >
                    <div className="user-info">
                      <div className="user-avatar">
                        {(
                          user.name ||
                          "U"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <strong>
                          {user.name || "User"}
                        </strong>

                        <small>
                          {user.email || ""}
                        </small>
                      </div>
                    </div>

                    <strong>
                      {user.notes || 0}
                    </strong>

                    <strong className="done-number">
                      {user.completed || 0}
                    </strong>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminReports;