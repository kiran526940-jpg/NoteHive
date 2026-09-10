import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminFavoriteNotes.css";

const SERVER_URL = "http://192.168.1.68:5000";

const AdminFavoriteNotes = () => {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // ADMIN ACCESS CHECK
  // ============================================================

  useEffect(() => {
    const adminLoggedIn =
      localStorage.getItem("adminLoggedIn") === "true";

    const userRole =
      localStorage.getItem("userRole");

    if (!adminLoggedIn || userRole !== "admin") {
      navigate("/admin-login", { replace: true });
      return;
    }

    fetchFavoriteNotes();
  }, [navigate]);

  // ============================================================
  // FETCH FAVORITE NOTES
  // ============================================================

  const fetchFavoriteNotes = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${SERVER_URL}/api/admin/favorite-notes`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch favorite notes"
        );
      }

      setNotes(data.notes || []);
    } catch (err) {
      console.error("Favorite notes error:", err);

      setError(
        err.message || "Unable to fetch favorite notes"
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ============================================================
  // GET USER NAME
  // ============================================================

  const getUserName = (note) => {
    return note.user?.name || "Unknown User";
  };

  // ============================================================
  // GET USER EMAIL
  // ============================================================

  const getUserEmail = (note) => {
    return note.user?.email || "No email available";
  };

  // ============================================================
  // OPEN NOTE
  // ============================================================

  const openNote = (note) => {
    if (!note?._id) return;

    navigate(`/admin/notes/${note._id}`);
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminId");
    localStorage.removeItem("admin");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userRole");
    localStorage.removeItem("notehive_userId");
    localStorage.removeItem("notehive_user");

    navigate("/admin-login", {
      replace: true,
    });
  };

  // ============================================================
  // SIDEBAR NAVIGATION
  // ============================================================

  const handleDashboard = () => {
    navigate("/admin-dashboard");
  };

  const handleUsers = () => {
    navigate("/admin/manage-users");
  };

  const handleNotifications = () => {
    navigate("/admin/notifications");
  };

  const handleNotes = () => {
    navigate("/admin/manage-notes");
  };

  const handlePinnedNotes = () => {
    navigate("/admin/pinned-notes");
  };

  const handleFavorites = () => {
    navigate("/admin/favorite-notes");
  };

  const handleReports = () => {
    navigate("/admin/reports");
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="admin-favorite-layout">

        {/* SIDEBAR */}

        <aside className="admin-sidebar">

          <div className="admin-logo">
            <span className="admin-logo-bee">
              🐝
            </span>

            <span>
              NOTEHIVE
            </span>
          </div>

          <p className="admin-panel-title">
            ADMIN PANEL
          </p>

          <nav className="admin-nav">

            <button onClick={handleDashboard}>
              <span>📊</span>
              <span>Dashboard</span>
            </button>

            <button onClick={handleUsers}>
              <span>👥</span>
              <span>Users</span>
            </button>

            <button onClick={handleNotifications}>
              <span>🔔</span>
              <span>Notifications</span>
            </button>

            <button onClick={handleNotes}>
              <span>📝</span>
              <span>Notes</span>
            </button>

            <button onClick={handlePinnedNotes}>
              <span>📌</span>
              <span>Pinned Notes</span>
            </button>

            <button
              className="active"
              onClick={handleFavorites}
            >
              <span>⭐</span>
              <span>Favorites</span>
            </button>

            <button onClick={handleReports}>
              <span>📈</span>
              <span>Reports</span>
            </button>

          </nav>

          <button
            className="admin-logout"
            onClick={handleLogout}
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>

        </aside>

        {/* LOADING CONTENT */}

        <main className="admin-favorite-main">

          <div className="admin-favorite-loading">
            <div className="favorite-spinner"></div>

            <p>
              Loading favorite notes...
            </p>
          </div>

        </main>

      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="admin-favorite-layout">

      {/* ======================================================
          SAME ADMIN DASHBOARD SIDEBAR
      ====================================================== */}

      <aside className="admin-sidebar">

        {/* LOGO */}

        <div className="admin-logo">

          <span className="admin-logo-bee">
            🐝
          </span>

          <span>
            NOTEHIVE
          </span>

        </div>

        {/* PANEL TITLE */}

        <p className="admin-panel-title">
          ADMIN PANEL
        </p>

        {/* NAVIGATION */}

        <nav className="admin-nav">

          <button onClick={handleDashboard}>
            <span>📊</span>
            <span>Dashboard</span>
          </button>

          <button onClick={handleUsers}>
            <span>👥</span>
            <span>Users</span>
          </button>

          <button onClick={handleNotifications}>
            <span>🔔</span>
            <span>Notifications</span>
          </button>

          <button onClick={handleNotes}>
            <span>📝</span>
            <span>Notes</span>
          </button>

          <button onClick={handlePinnedNotes}>
            <span>📌</span>
            <span>Pinned Notes</span>
          </button>

          {/* ACTIVE */}

          <button
            className="active"
            onClick={handleFavorites}
          >
            <span>⭐</span>
            <span>Favorites</span>
          </button>

          <button onClick={handleReports}>
            <span>📈</span>
            <span>Reports</span>
          </button>

        </nav>

        {/* LOGOUT */}

        <button
          className="admin-logout"
          onClick={handleLogout}
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>

      </aside>

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="admin-favorite-main">

        {/* HEADER */}

        <div className="admin-favorite-header">

          <div>

            <button
              className="favorite-back-btn"
              onClick={handleDashboard}
            >
              ← Back to Dashboard
            </button>

            <div className="favorite-title-section">

              <div className="favorite-title-icon">
                ⭐
              </div>

              <div>

                <h1>
                  Favorite Notes
                </h1>

                <p>
                  Admin can view and manage all favorite notes.
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* ======================================================
            STAT CARD
        ====================================================== */}

        <div className="favorite-stat-card">

          <div className="favorite-stat-icon">
            ⭐
          </div>

          <div>

            <span>
              Favorite Notes
            </span>

            <strong>
              {notes.length}
            </strong>

          </div>

        </div>

        {/* ======================================================
            ERROR
        ====================================================== */}

        {error && (

          <div className="favorite-error">

            <div className="favorite-error-icon">
              ⚠️
            </div>

            <div>

              <h3>
                Error
              </h3>

              <p>
                {error}
              </p>

              <button
                onClick={fetchFavoriteNotes}
                className="favorite-retry-btn"
              >
                Try Again
              </button>

            </div>

          </div>

        )}

        {/* ======================================================
            EMPTY
        ====================================================== */}

        {!error && notes.length === 0 && (

          <div className="favorite-empty">

            <div className="favorite-empty-icon">
              ⭐
            </div>

            <h2>
              No Favorite Notes
            </h2>

            <p>
              There are currently no favorite notes.
            </p>

          </div>

        )}

        {/* ======================================================
            NOTES
        ====================================================== */}

        {!error && notes.length > 0 && (

          <div className="favorite-notes-container">

            <div className="favorite-notes-grid">

              {notes.map((note) => (

                <div
                  className="favorite-note-card"
                  key={note._id}
                >

                  {/* NOTE HEADER */}

                  <div className="favorite-note-header">

                    <div className="favorite-note-star">
                      ⭐
                    </div>

                    <div className="favorite-note-date">
                      {formatDate(note.createdAt)}
                    </div>

                  </div>

                  {/* TITLE */}

                  <h2 className="favorite-note-title">
                    {note.title || "Untitled Note"}
                  </h2>

                  {/* CONTENT */}

                  <p className="favorite-note-content">

                    {note.content
                      ? note.content.length > 180
                        ? `${note.content.substring(
                            0,
                            180
                          )}...`
                        : note.content
                      : "No content available."}

                  </p>

                  {/* CATEGORY */}

                  <div className="favorite-note-category">

                    <span>
                      Category
                    </span>

                    <strong>
                      {note.category || "General"}
                    </strong>

                  </div>

                  {/* PRIORITY / STATUS */}

                  <div className="favorite-note-info">

                    <div>

                      <span>
                        Priority
                      </span>

                      <strong>
                        {note.priority || "Medium"}
                      </strong>

                    </div>

                    <div>

                      <span>
                        Status
                      </span>

                      <strong>
                        {note.completed
                          ? "Completed"
                          : "Pending"}
                      </strong>

                    </div>

                  </div>

                  {/* USER */}

                  <div className="favorite-note-user">

                    <div className="favorite-user-avatar">

                      {note.user?.profileImage ? (

                        <img
                          src={
                            note.user.profileImage.startsWith(
                              "http"
                            )
                              ? note.user.profileImage
                              : `${SERVER_URL}${note.user.profileImage}`
                          }
                          alt={getUserName(note)}
                        />

                      ) : (

                        <span>
                          {getUserName(note)
                            .charAt(0)
                            .toUpperCase()}
                        </span>

                      )}

                    </div>

                    <div>

                      <strong>
                        {getUserName(note)}
                      </strong>

                      <small>
                        {getUserEmail(note)}
                      </small>

                    </div>

                  </div>

                  {/* VIEW */}

                  <button
                    className="favorite-view-btn"
                    onClick={() => openNote(note)}
                  >
                    View Note →
                  </button>

                </div>

              ))}

            </div>

          </div>

        )}

      </main>

    </div>
  );
};

export default AdminFavoriteNotes;