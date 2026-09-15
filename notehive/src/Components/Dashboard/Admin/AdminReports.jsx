import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./AdminHeader";
import "./AdminReports.css";
import { API_URL } from "../../../config/api";

const AdminReports = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [notes, setNotes] = useState([]);
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);

  /* ============================================================
     AUTH CHECK
  ============================================================ */

  useEffect(() => {
    const adminLoggedIn = localStorage.getItem("adminLoggedIn");
    const userRole = localStorage.getItem("userRole");

    if (adminLoggedIn !== "true" || userRole !== "admin") {
      navigate("/admin-login", { replace: true });
    }
  }, [navigate]);

  /* ============================================================
     HELPERS
  ============================================================ */

  const getArray = (data, keys = []) => {
    if (Array.isArray(data)) {
      return data;
    }

    for (const key of keys) {
      if (Array.isArray(data?.[key])) {
        return data[key];
      }
    }

    return [];
  };

  const getId = (item) => {
    return item?._id || item?.id || "";
  };

  const getDate = (item) => {
    const value =
      item?.createdAt ||
      item?.updatedAt ||
      item?.date ||
      item?.timestamp;

    if (!value) return null;

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  };

  const isSameDay = (date, targetDate) => {
    if (!date) return false;

    return (
      date.getFullYear() === targetDate.getFullYear() &&
      date.getMonth() === targetDate.getMonth() &&
      date.getDate() === targetDate.getDate()
    );
  };

  const formatDay = (date) => {
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  };

  const getLast7Days = () => {
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);
      days.push(date);
    }

    return days;
  };

  /* ============================================================
     FETCH REPORT DATA
  ============================================================ */

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");

      const [notesResponse, usersResponse, activityResponse] =
        await Promise.all([
          fetch(`${API_URL}/admin/notes`),
          fetch(`${API_URL}/admin/users`),
          fetch(`${API_URL}/admin/activity`),
        ]);

      if (!notesResponse.ok) {
        throw new Error("Failed to fetch notes.");
      }

      if (!usersResponse.ok) {
        throw new Error("Failed to fetch users.");
      }

      if (!activityResponse.ok) {
        throw new Error("Failed to fetch activity.");
      }

      const notesData = await notesResponse.json();
      const usersData = await usersResponse.json();
      const activityData = await activityResponse.json();

      const notesArray = getArray(notesData, [
        "notes",
        "data",
        "results",
      ]);

      const usersArray = getArray(usersData, [
        "users",
        "data",
        "results",
      ]);

      const activityArray = getArray(activityData, [
        "activities",
        "notifications",
        "data",
        "results",
      ]);

      setNotes(notesArray);
      setUsers(usersArray);
      setActivities(activityArray);
    } catch (err) {
      console.error("Admin Reports error:", err);

      setError(
        err?.message || "Failed to load reports and analytics."
      );

      setNotes([]);
      setUsers([]);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const adminLoggedIn = localStorage.getItem("adminLoggedIn");
    const userRole = localStorage.getItem("userRole");

    if (adminLoggedIn === "true" && userRole === "admin") {
      fetchReports();
    }
  }, []);

  /* ============================================================
     BASIC OVERVIEW
  ============================================================ */

  const overview = useMemo(() => {
    const totalUsers = users.filter(
      (user) => user?.role !== "admin"
    ).length;

    const normalUsers = users.filter(
      (user) => user?.role !== "admin"
    );

    const totalNotes = notes.length;

    const completedNotes = notes.filter(
      (note) => note?.completed === true
    ).length;

    const pendingUsers = normalUsers.filter(
      (user) => user?.status === "pending"
    ).length;

    const pinnedNotes = notes.filter(
      (note) => note?.pinned === true
    ).length;

    const favoriteNotes = notes.filter(
      (note) => note?.favorite === true
    ).length;

    const publicNotes = notes.filter(
      (note) =>
        String(note?.visibility || "").toLowerCase() === "public"
    ).length;

    const privateNotes = notes.filter(
      (note) =>
        String(note?.visibility || "").toLowerCase() === "private"
    ).length;

    const today = new Date();

    const todayUsers = normalUsers.filter((user) =>
      isSameDay(getDate(user), today)
    ).length;

    const todayNotes = notes.filter((note) =>
      isSameDay(getDate(note), today)
    ).length;

    const completionPercentage =
      totalNotes > 0
        ? Math.round((completedNotes / totalNotes) * 100)
        : 0;

    return {
      totalUsers,
      totalNotes,
      completedNotes,
      pendingUsers,
      pinnedNotes,
      favoriteNotes,
      publicNotes,
      privateNotes,
      todayUsers,
      todayNotes,
      completionPercentage,
    };
  }, [notes, users]);

  /* ============================================================
     CATEGORY REPORT
  ============================================================ */

  const categoryReport = useMemo(() => {
    const categoryMap = {};

    notes.forEach((note) => {
      const category =
        note?.category?.trim() || "General";

      categoryMap[category] =
        (categoryMap[category] || 0) + 1;
    });

    return Object.entries(categoryMap)
      .map(([category, count]) => ({
        category,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [notes]);

  /* ============================================================
     USER REPORT
  ============================================================ */

  const userReport = useMemo(() => {
    const normalUsers = users.filter(
      (user) => user?.role !== "admin"
    );

    return normalUsers
      .map((user) => {
        const userId = getId(user);

        const userNotes = notes.filter((note) => {
          const noteUser =
            note?.user ||
            note?.userId ||
            note?.owner ||
            note?.createdBy;

          const noteUserId =
            typeof noteUser === "object"
              ? getId(noteUser)
              : noteUser;

          return String(noteUserId || "") === String(userId);
        });

        return {
          id: userId,
          name:
            user?.name ||
            user?.username ||
            "Unknown User",
          email: user?.email || "No email",
          status: user?.status || "approved",
          notes: userNotes.length,
          completed: userNotes.filter(
            (note) => note?.completed === true
          ).length,
        };
      })
      .sort((a, b) => b.notes - a.notes);
  }, [users, notes]);

  /* ============================================================
     LAST 7 DAYS - NOTES
  ============================================================ */

  const notesLast7Days = useMemo(() => {
    const days = getLast7Days();

    return days.map((day) => {
      const count = notes.filter((note) =>
        isSameDay(getDate(note), day)
      ).length;

      return {
        label: formatDay(day),
        count,
      };
    });
  }, [notes]);

  /* ============================================================
     LAST 7 DAYS - USERS
  ============================================================ */

  const usersLast7Days = useMemo(() => {
    const normalUsers = users.filter(
      (user) => user?.role !== "admin"
    );

    const days = getLast7Days();

    return days.map((day) => {
      const count = normalUsers.filter((user) =>
        isSameDay(getDate(user), day)
      ).length;

      return {
        label: formatDay(day),
        count,
      };
    });
  }, [users]);

  /* ============================================================
     ACTIVITY LAST 7 DAYS
  ============================================================ */

  const activityLast7Days = useMemo(() => {
    const days = getLast7Days();

    return days.map((day) => {
      const count = activities.filter((activity) =>
        isSameDay(getDate(activity), day)
      ).length;

      return {
        label: formatDay(day),
        count,
      };
    });
  }, [activities]);

  /* ============================================================
     ACTIVITY TOTAL
  ============================================================ */

  const activitySummary = useMemo(() => {
    const noteActivities = activities.filter((activity) => {
      const type = String(
        activity?.type || ""
      ).toLowerCase();

      return (
        type.includes("note") ||
        type.includes("created") ||
        type.includes("updated") ||
        type.includes("deleted") ||
        type.includes("pinned") ||
        type.includes("favorite")
      );
    }).length;

    const userActivities = activities.filter((activity) => {
      const type = String(
        activity?.type || ""
      ).toLowerCase();

      return (
        type.includes("user") ||
        type.includes("signup") ||
        type.includes("register") ||
        type.includes("login") ||
        type.includes("approved") ||
        type.includes("rejected")
      );
    }).length;

    return {
      total: activities.length,
      noteActivities,
      userActivities,
    };
  }, [activities]);

  /* ============================================================
     CSV EXPORT
  ============================================================ */

  const exportCSV = () => {
    const rows = [
      [
        "User Name",
        "Email",
        "Status",
        "Notes",
        "Completed Notes",
      ],
      ...userReport.map((user) => [
        user.name,
        user.email,
        user.status,
        user.notes,
        user.completed,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) =>
            `"${String(value ?? "").replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "notehive-user-report.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  /* ============================================================
     CHART HELPERS
  ============================================================ */

  const getMaxValue = (data) => {
    if (!data.length) return 1;

    return Math.max(
      1,
      ...data.map((item) => Number(item.count || 0))
    );
  };

  const renderBarChart = (data, emptyText = "No activity available") => {
    if (!data.length) {
      return (
        <div className="report-empty">
          {emptyText}
        </div>
      );
    }

    const max = getMaxValue(data);

    return (
      <div className="report-bar-chart">
        {data.map((item, index) => {
          const value = Number(item.count || 0);

          const height =
            value === 0
              ? 8
              : Math.max(12, (value / max) * 100);

          return (
            <div
              className="report-bar-column"
              key={`${item.label}-${index}`}
            >
              <div className="report-bar-value">
                {value}
              </div>

              <div className="report-bar-track">
                <div
                  className="report-bar-fill"
                  style={{
                    height: `${height}%`,
                  }}
                />
              </div>

              <div className="report-bar-label">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /* ============================================================
     NAVIGATION
  ============================================================ */

  const goTo = (path) => {
    navigate(path);
  };

  const logout = () => {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("userRole");
    localStorage.removeItem("adminId");

    navigate("/admin-login", {
      replace: true,
    });
  };

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <div className="admin-reports-page">
        <AdminHeader />

        <main className="admin-reports-main">
          <div className="reports-loading-card">
            <div className="reports-spinner" />

            <h2>Loading Reports...</h2>

            <p>
              Please wait while NoteHive analytics are being
              prepared.
            </p>
          </div>
        </main>
      </div>
    );
  }

  /* ============================================================
     MAIN UI
  ============================================================ */

  return (
    <div className="admin-reports-page">
      <AdminHeader />

      <main className="admin-reports-main">
        {/* ======================================================
            HERO
        ====================================================== */}

        <section className="reports-hero">
          <div className="reports-hero-content">
            <div className="reports-badge">
              📊 NOTEHIVE • ADMIN ANALYTICS
            </div>

            <h1>Reports & Analytics</h1>

            <p>
              Monitor users, notes, activity and overall
              NoteHive performance from one place.
            </p>
          </div>

          <div className="reports-hero-actions">
            <button
              className="reports-refresh-btn"
              onClick={fetchReports}
            >
              🔄 Refresh
            </button>

            <button
              className="reports-export-btn"
              onClick={exportCSV}
            >
              📥 Export CSV
            </button>
          </div>
        </section>

        {/* ======================================================
            ERROR
        ====================================================== */}

        {error && (
          <div className="reports-error">
            ⚠️ {error}
          </div>
        )}

        {/* ======================================================
            MAIN STATS
        ====================================================== */}

        <section className="reports-stats-grid">
          <div className="report-stat-card blue">
            <div className="report-stat-icon">👥</div>

            <div>
              <span>Total Users</span>
              <strong>{overview.totalUsers}</strong>
            </div>
          </div>

          <div className="report-stat-card purple">
            <div className="report-stat-icon">📝</div>

            <div>
              <span>Total Notes</span>
              <strong>{overview.totalNotes}</strong>
            </div>
          </div>

          <div className="report-stat-card pink">
            <div className="report-stat-icon">✅</div>

            <div>
              <span>Completed Notes</span>
              <strong>{overview.completedNotes}</strong>
            </div>
          </div>

          <div className="report-stat-card orange">
            <div className="report-stat-icon">⏳</div>

            <div>
              <span>Pending Users</span>
              <strong>{overview.pendingUsers}</strong>
            </div>
          </div>

          <div className="report-stat-card green">
            <div className="report-stat-icon">📌</div>

            <div>
              <span>Pinned Notes</span>
              <strong>{overview.pinnedNotes}</strong>
            </div>
          </div>

          <div className="report-stat-card violet">
            <div className="report-stat-icon">❤️</div>

            <div>
              <span>Favorite Notes</span>
              <strong>{overview.favoriteNotes}</strong>
            </div>
          </div>

          <div className="report-stat-card cyan">
            <div className="report-stat-icon">🌐</div>

            <div>
              <span>Public Notes</span>
              <strong>{overview.publicNotes}</strong>
            </div>
          </div>

          <div className="report-stat-card gray">
            <div className="report-stat-icon">🔒</div>

            <div>
              <span>Private Notes</span>
              <strong>{overview.privateNotes}</strong>
            </div>
          </div>
        </section>

        {/* ======================================================
            TODAY STRIP
        ====================================================== */}

        <section className="today-report-strip">
          <div className="today-report-title">
            <span>📅</span>

            <div>
              <h3>Today's Activity</h3>
              <p>Fresh activity recorded today</p>
            </div>
          </div>

          <div className="today-report-items">
            <div>
              <strong>{overview.todayUsers}</strong>
              <span>New Users</span>
            </div>

            <div>
              <strong>{overview.todayNotes}</strong>
              <span>New Notes</span>
            </div>

            <div>
              <strong>{activityLast7Days.at(-1)?.count || 0}</strong>
              <span>Activities</span>
            </div>
          </div>
        </section>

        {/* ======================================================
            VISIBILITY + COMPLETION
        ====================================================== */}

        <section className="reports-two-column">
          <div className="report-panel">
            <div className="report-panel-header">
              <div>
                <h2>Note Visibility</h2>
                <p>Public vs private notes</p>
              </div>

              <span>👁️</span>
            </div>

            <div className="visibility-report">
              <div className="visibility-total">
                <strong>{overview.totalNotes}</strong>
                <span>Total Notes</span>
              </div>

              <div className="visibility-items">
                <div className="visibility-item public">
                  <span className="visibility-dot" />

                  <div>
                    <strong>
                      {overview.publicNotes}
                    </strong>

                    <span>Public</span>
                  </div>
                </div>

                <div className="visibility-item private">
                  <span className="visibility-dot" />

                  <div>
                    <strong>
                      {overview.privateNotes}
                    </strong>

                    <span>Private</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="report-panel">
            <div className="report-panel-header">
              <div>
                <h2>Completion</h2>
                <p>Completed notes percentage</p>
              </div>

              <span>🎯</span>
            </div>

            <div className="completion-report">
              <div
                className="completion-ring"
                style={{
                  "--completion":
                    `${overview.completionPercentage}%`,
                }}
              >
                <div className="completion-ring-inner">
                  <strong>
                    {overview.completionPercentage}%
                  </strong>

                  <span>Completed</span>
                </div>
              </div>

              <div className="completion-info">
                <div>
                  <strong>
                    {overview.completedNotes}
                  </strong>

                  <span>Completed</span>
                </div>

                <div>
                  <strong>
                    {Math.max(
                      0,
                      overview.totalNotes -
                        overview.completedNotes
                    )}
                  </strong>

                  <span>Remaining</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================
            ACTIVITY CHARTS
        ====================================================== */}

        <section className="reports-analytics-grid">
          <div className="report-panel">
            <div className="report-panel-header">
              <div>
                <h2>Notes Activity</h2>
                <p>Notes created during the last 7 days</p>
              </div>

              <span>📝</span>
            </div>

            {renderBarChart(
              notesLast7Days,
              "No note activity available"
            )}
          </div>

          <div className="report-panel">
            <div className="report-panel-header">
              <div>
                <h2>User Activity</h2>
                <p>New users during the last 7 days</p>
              </div>

              <span>👤</span>
            </div>

            {renderBarChart(
              usersLast7Days,
              "No user activity available"
            )}
          </div>

          <div className="report-panel wide">
            <div className="report-panel-header">
              <div>
                <h2>System Activity</h2>
                <p>All recorded activity during the last 7 days</p>
              </div>

              <span>⚡</span>
            </div>

            {renderBarChart(
              activityLast7Days,
              "No system activity available"
            )}
          </div>
        </section>

        {/* ======================================================
            CATEGORY REPORT
        ====================================================== */}

        <section className="reports-two-column">
          <div className="report-panel">
            <div className="report-panel-header">
              <div>
                <h2>Notes by Category</h2>
                <p>Distribution of notes across categories</p>
              </div>

              <span>🗂️</span>
            </div>

            {categoryReport.length === 0 ? (
              <div className="report-empty">
                No category data available
              </div>
            ) : (
              <div className="category-report-list">
                {categoryReport.map((item) => {
                  const percentage =
                    overview.totalNotes > 0
                      ? Math.round(
                          (item.count /
                            overview.totalNotes) *
                            100
                        )
                      : 0;

                  return (
                    <div
                      className="category-report-item"
                      key={item.category}
                    >
                      <div className="category-report-top">
                        <span>{item.category}</span>

                        <strong>
                          {item.count}
                        </strong>
                      </div>

                      <div className="category-report-track">
                        <div
                          className="category-report-fill"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>

                      <small>
                        {percentage}% of all notes
                      </small>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ====================================================
              ACTIVITY SUMMARY
          ==================================================== */}

          <div className="report-panel">
            <div className="report-panel-header">
              <div>
                <h2>Activity Summary</h2>
                <p>Recorded NoteHive activity</p>
              </div>

              <span>📈</span>
            </div>

            <div className="activity-summary-grid">
              <div className="activity-summary-card">
                <span>⚡</span>
                <strong>
                  {activitySummary.total}
                </strong>
                <small>Total Activity</small>
              </div>

              <div className="activity-summary-card">
                <span>📝</span>
                <strong>
                  {activitySummary.noteActivities}
                </strong>
                <small>Note Activity</small>
              </div>

              <div className="activity-summary-card">
                <span>👥</span>
                <strong>
                  {activitySummary.userActivities}
                </strong>
                <small>User Activity</small>
              </div>

              <div className="activity-summary-card">
                <span>📅</span>
                <strong>
                  {overview.todayNotes +
                    overview.todayUsers}
                </strong>
                <small>Today's Records</small>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================
            USER REPORT
        ====================================================== */}

        <section className="report-panel full-width">
          <div className="report-panel-header">
            <div>
              <h2>User Report</h2>
              <p>
                Individual user activity and note summary
              </p>
            </div>

            <span>👥</span>
          </div>

          {userReport.length === 0 ? (
            <div className="report-empty">
              No user data available
            </div>
          ) : (
            <div className="user-report-table-wrapper">
              <table className="user-report-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th>Completed</th>
                  </tr>
                </thead>

                <tbody>
                  {userReport.map((user) => (
                    <tr key={user.id || user.email}>
                      <td>
                        <div className="user-report-name">
                          <div className="user-report-avatar">
                            {user.name
                              ?.charAt(0)
                              ?.toUpperCase() || "U"}
                          </div>

                          <span>{user.name}</span>
                        </div>
                      </td>

                      <td>{user.email}</td>

                      <td>
                        <span
                          className={`user-status-badge ${String(
                            user.status
                          ).toLowerCase()}`}
                        >
                          {user.status}
                        </span>
                      </td>

                      <td>
                        <strong>{user.notes}</strong>
                      </td>

                      <td>
                        <strong>
                          {user.completed}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ======================================================
            QUICK ACTIONS
        ====================================================== */}

        <section className="reports-quick-actions">
          <button onClick={() => goTo("/admin-dashboard")}>
            🏠
            <span>Dashboard</span>
          </button>

          <button onClick={() => goTo("/admin/manage-users")}>
            👥
            <span>Manage Users</span>
          </button>

          <button onClick={() => goTo("/admin/manage-notes")}>
            📝
            <span>Manage Notes</span>
          </button>

          <button onClick={() => goTo("/admin/notifications")}>
            🔔
            <span>Notifications</span>
          </button>

          <button onClick={() => goTo("/admin/profile")}>
            👤
            <span>Admin Profile</span>
          </button>
        </section>

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <footer className="admin-reports-footer">
          <div>
            🐝 <strong>NoteHive</strong>
          </div>

          <span>
            Admin Reports & Analytics
          </span>

          <button onClick={logout}>
            Logout
          </button>
        </footer>
      </main>

      {/* ========================================================
          MOBILE BOTTOM NAV
      ======================================================== */}

      <nav className="admin-mobile-bottom-nav">
        <button
          onClick={() => goTo("/admin-dashboard")}
        >
          <span>🏠</span>
          <small>Home</small>
        </button>

        <button
          onClick={() => goTo("/admin/manage-users")}
        >
          <span>👥</span>
          <small>Users</small>
        </button>

        <button
          onClick={() => goTo("/admin/manage-notes")}
        >
          <span>📝</span>
          <small>Notes</small>
        </button>

        <button
          onClick={() => goTo("/admin/notifications")}
        >
          <span>🔔</span>
          <small>Alerts</small>
        </button>

        <button
          onClick={() => goTo("/admin/profile")}
        >
          <span>👤</span>
          <small>Profile</small>
        </button>
      </nav>
    </div>
  );
};

export default AdminReports;