
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminPinnedNotes.css";

const SERVER_URL = "http://192.168.1.68:5000";

const AdminPinnedNotes = () => {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // CHECK ADMIN LOGIN
  // =====================================================

  useEffect(() => {
    const adminLoggedIn =
      localStorage.getItem("adminLoggedIn") === "true";

    const userRole = localStorage.getItem("userRole");

    if (!adminLoggedIn || userRole !== "admin") {
      navigate("/admin-login", { replace: true });
      return;
    }

    fetchPinnedNotes();
  }, [navigate]);

  // =====================================================
  // FETCH PINNED NOTES
  // =====================================================

  const fetchPinnedNotes = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${SERVER_URL}/api/admin/pinned-notes`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch pinned notes"
        );
      }

      setNotes(data.notes || []);
    } catch (err) {
      console.error("PINNED NOTES ERROR:", err);

      setError(
        err.message ||
          "Pinned notes fetch nahi ho pa rahi."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UNPIN NOTE
  // =====================================================

  const handleUnpin = async (noteId) => {
    const confirmUnpin = window.confirm(
      "Kya aap is note ko unpin karna chahte ho?"
    );

    if (!confirmUnpin) return;

    try {
      const response = await fetch(
        `${SERVER_URL}/api/admin/notes/${noteId}/pin`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pinned: false,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to unpin note"
        );
      }

      setNotes((prevNotes) =>
        prevNotes.filter(
          (note) => note._id !== noteId
        )
      );

      alert("Note unpinned successfully 📌");
    } catch (err) {
      console.error("UNPIN ERROR:", err);

      alert(
        err.message ||
          "Note unpin nahi ho paaya."
      );
    }
  };

  // =====================================================
  // DELETE NOTE
  // =====================================================

  const handleDelete = async (noteId) => {
    const confirmDelete = window.confirm(
      "Kya aap is note ko permanently delete karna chahte ho?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `${SERVER_URL}/api/admin/notes/${noteId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete note"
        );
      }

      setNotes((prevNotes) =>
        prevNotes.filter(
          (note) => note._id !== noteId
        )
      );

      alert("Note deleted successfully 🗑️");
    } catch (err) {
      console.error("DELETE ERROR:", err);

      alert(
        err.message ||
          "Note delete nahi ho paaya."
      );
    }
  };

  // =====================================================
  // DATE FORMAT
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =====================================================
  // LOGOUT
  // =====================================================

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

  // =====================================================
  // NAVIGATION
  // =====================================================

  const handleUsers = () => {
    navigate("/admin/manage-users");
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

  const handleNotifications = () => {
    navigate("/admin/notifications");
  };

  const handleReports = () => {
    navigate("/admin/reports");
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="admin-pinned-layout">

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

            <button
              onClick={() =>
                navigate("/admin-dashboard")
              }
            >
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

            <button
              className="active"
              onClick={handlePinnedNotes}
            >
              <span>📌</span>
              <span>Pinned Notes</span>
            </button>

            <button onClick={handleFavorites}>
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

        <main className="admin-pinned-main">

          <div className="admin-pinned-loading">
            <div className="loading-spinner"></div>

            <h3>
              Loading Pinned Notes...
            </h3>

            <p>
              Please wait...
            </p>
          </div>

        </main>

      </div>
    );
  }

  // =====================================================
  // MAIN PAGE
  // =====================================================

  return (
    <div className="admin-pinned-layout">

      {/* =================================================
          SIDEBAR
      ================================================= */}

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

          <button
            onClick={() =>
              navigate("/admin-dashboard")
            }
          >
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

          <button
            className="active"
            onClick={handlePinnedNotes}
          >
            <span>📌</span>
            <span>Pinned Notes</span>
          </button>

          <button onClick={handleFavorites}>
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

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="admin-pinned-main">

        {/* HEADER */}

        <header className="admin-pinned-header">

          <div>

            <p className="admin-header-label">
              ADMINISTRATION
            </p>

            <h1>
              📌 Pinned Notes
            </h1>

            <p>
              View and manage all pinned notes
              from your NoteHive platform.
            </p>

          </div>

          <div className="pinned-count">

            <span>
              {notes.length}
            </span>

            <small>
              Pinned Notes
            </small>

          </div>

        </header>

        {/* BACK / REFRESH ROW */}

        <div className="pinned-toolbar">

          <button
            className="back-btn"
            onClick={() =>
              navigate("/admin-dashboard")
            }
          >
            ← Back to Dashboard
          </button>

          <button
            className="refresh-pinned-btn"
            onClick={fetchPinnedNotes}
          >
            ↻ Refresh
          </button>

        </div>

        {/* ERROR */}

        {error && (

          <div className="admin-pinned-error">

            <strong>
              ⚠️ Error
            </strong>

            <p>
              {error}
            </p>

            <button
              onClick={fetchPinnedNotes}
            >
              Try Again
            </button>

          </div>

        )}

        {/* EMPTY */}

        {!error && notes.length === 0 && (

          <div className="admin-pinned-empty">

            <div className="empty-icon">
              📌
            </div>

            <h2>
              No Pinned Notes
            </h2>

            <p>
              Abhi database me koi pinned note
              nahi hai.
            </p>

            <button
              onClick={() =>
                navigate("/admin/manage-notes")
              }
            >
              View All Notes
            </button>

          </div>

        )}

        {/* NOTES */}

        {!error && notes.length > 0 && (

          <section className="admin-pinned-grid">

            {notes.map((note) => (

              <article
                className="admin-pinned-card"
                key={note._id}
              >

                {/* TOP */}

                <div className="pinned-card-top">

                  <span className="pin-badge">
                    📌 Pinned
                  </span>

                  <span
                    className={`priority-badge ${
                      note.priority
                        ? note.priority.toLowerCase()
                        : "medium"
                    }`}
                  >
                    {note.priority || "Medium"}
                  </span>

                </div>

                {/* TITLE */}

                <h2>
                  {note.title || "Untitled Note"}
                </h2>

                {/* CONTENT */}

                <p className="note-content">

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

                <div className="note-category">

                  <span>
                    📂
                  </span>

                  {note.category || "General"}

                </div>

                {/* USER */}

                <div className="note-user">

                  <div className="user-avatar">

                    {note.user?.name
                      ? note.user.name
                          .charAt(0)
                          .toUpperCase()
                      : "U"}

                  </div>

                  <div>

                    <strong>
                      {note.user?.name ||
                        "Unknown User"}
                    </strong>

                    <small>
                      {note.user?.email ||
                        "No email"}
                    </small>

                  </div>

                </div>

                {/* DATE */}

                <div className="note-date">

                  Created:{" "}
                  {formatDate(
                    note.createdAt
                  )}

                </div>

                {/* ACTIONS */}

                <div className="pinned-actions">

                  <button
                    className="view-btn"
                    onClick={() =>
                      navigate(
                        `/admin/manage-notes?note=${note._id}`
                      )
                    }
                  >
                    👁️ View
                  </button>

                  <button
                    className="unpin-btn"
                    onClick={() =>
                      handleUnpin(
                        note._id
                      )
                    }
                  >
                    📌 Unpin
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() =>
                      handleDelete(
                        note._id
                      )
                    }
                  >
                    🗑️ Delete
                  </button>

                </div>

              </article>

            ))}

          </section>

        )}

      </main>

    </div>
  );
};

export default AdminPinnedNotes;
