import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./AdminHeader";
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
  // STATS
  // =====================================================

  const stats = useMemo(() => {
    const total = notes.length;

    const highPriority = notes.filter(
      (note) =>
        note.priority?.toLowerCase() === "high"
    ).length;

    const mediumPriority = notes.filter(
      (note) =>
        note.priority?.toLowerCase() === "medium"
    ).length;

    const lowPriority = notes.filter(
      (note) =>
        note.priority?.toLowerCase() === "low"
    ).length;

    const completed = notes.filter(
      (note) => note.completed === true
    ).length;

    const publicNotes = notes.filter(
      (note) =>
        note.visibility?.toLowerCase() === "public"
    ).length;

    return {
      total,
      highPriority,
      mediumPriority,
      lowPriority,
      completed,
      publicNotes,
    };
  }, [notes]);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="admin-pinned-layout">
        <AdminHeader />

        <main className="admin-pinned-main">
          <div className="pinned-loading-card">
            <div className="loading-spinner"></div>

            <h3>
              Loading Pinned Notes...
            </h3>

            <p>
              Please wait while we fetch your
              pinned notes.
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

      <AdminHeader />

      <main className="admin-pinned-main">

        {/* =================================================
            HERO
        ================================================= */}

        <section className="pinned-hero">

          <div className="pinned-hero-text">

            <p className="pinned-eyebrow">
              ADMINISTRATION
            </p>

            <h1>
              📌 Pinned Notes
            </h1>

            <p>
              View, manage and organize all
              pinned notes across your NoteHive
              platform.
            </p>

          </div>

          <div className="pinned-hero-actions">

            <button
              className="pinned-refresh-btn"
              onClick={fetchPinnedNotes}
            >
              ↻ Refresh
            </button>

            <button
              className="pinned-dashboard-btn"
              onClick={() =>
                navigate("/admin-dashboard")
              }
            >
              ← Dashboard
            </button>

          </div>

        </section>

        {/* =================================================
            STAT CARDS
        ================================================= */}

        <section className="pinned-stat-scroll">

          <article className="pinned-stat-card total">
            <div className="pinned-stat-top">
              <span className="pinned-stat-icon">
                📌
              </span>

              <span className="pinned-stat-mini">
                TOTAL
              </span>
            </div>

            <div className="pinned-stat-number">
              {stats.total}
            </div>

            <div className="pinned-stat-label">
              Pinned Notes
            </div>
          </article>

          <article className="pinned-stat-card high">
            <div className="pinned-stat-top">
              <span className="pinned-stat-icon">
                🔴
              </span>

              <span className="pinned-stat-mini">
                PRIORITY
              </span>
            </div>

            <div className="pinned-stat-number">
              {stats.highPriority}
            </div>

            <div className="pinned-stat-label">
              High Priority
            </div>
          </article>

          <article className="pinned-stat-card medium">
            <div className="pinned-stat-top">
              <span className="pinned-stat-icon">
                🟡
              </span>

              <span className="pinned-stat-mini">
                PRIORITY
              </span>
            </div>

            <div className="pinned-stat-number">
              {stats.mediumPriority}
            </div>

            <div className="pinned-stat-label">
              Medium Priority
            </div>
          </article>

          <article className="pinned-stat-card low">
            <div className="pinned-stat-top">
              <span className="pinned-stat-icon">
                🟢
              </span>

              <span className="pinned-stat-mini">
                PRIORITY
              </span>
            </div>

            <div className="pinned-stat-number">
              {stats.lowPriority}
            </div>

            <div className="pinned-stat-label">
              Low Priority
            </div>
          </article>

          <article className="pinned-stat-card completed">
            <div className="pinned-stat-top">
              <span className="pinned-stat-icon">
                ✅
              </span>

              <span className="pinned-stat-mini">
                STATUS
              </span>
            </div>

            <div className="pinned-stat-number">
              {stats.completed}
            </div>

            <div className="pinned-stat-label">
              Completed
            </div>
          </article>

          <article className="pinned-stat-card public">
            <div className="pinned-stat-top">
              <span className="pinned-stat-icon">
                🌐
              </span>

              <span className="pinned-stat-mini">
                VISIBILITY
              </span>
            </div>

            <div className="pinned-stat-number">
              {stats.publicNotes}
            </div>

            <div className="pinned-stat-label">
              Public Notes
            </div>
          </article>

        </section>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="pinned-error-card">

            <div className="pinned-error-icon">
              ⚠️
            </div>

            <div>
              <h3>
                Unable to load pinned notes
              </h3>

              <p>
                {error}
              </p>
            </div>

            <button
              onClick={fetchPinnedNotes}
            >
              Try Again
            </button>

          </div>
        )}

        {/* =================================================
            EMPTY
        ================================================= */}

        {!error && notes.length === 0 && (
          <section className="pinned-empty-card">

            <div className="pinned-empty-icon">
              📌
            </div>

            <p className="pinned-empty-kicker">
              NOTEHIVE
            </p>

            <h2>
              No Pinned Notes Yet
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

          </section>
        )}

        {/* =================================================
            NOTES
        ================================================= */}

        {!error && notes.length > 0 && (
          <section className="pinned-notes-section">

            <div className="pinned-section-header">

              <div>
                <p>
                  COLLECTION
                </p>

                <h2>
                  Pinned Note Collection
                </h2>
              </div>

              <span>
                {notes.length} notes
              </span>

            </div>

            <div className="pinned-notes-grid">

              {notes.map((note) => (

                <article
                  className="pinned-note-card"
                  key={note._id}
                >

                  {/* CARD HEADER */}

                  <div className="pinned-note-card-top">

                    <span className="pinned-note-badge">
                      📌 Pinned
                    </span>

                    <span
                      className={`pinned-priority-badge ${
                        note.priority
                          ? note.priority.toLowerCase()
                          : "medium"
                      }`}
                    >
                      {note.priority || "Medium"}
                    </span>

                  </div>

                  {/* TITLE */}

                  <h3>
                    {note.title ||
                      "Untitled Note"}
                  </h3>

                  {/* CONTENT */}

                  <p className="pinned-note-content">

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

                  <div className="pinned-note-category">
                    📂
                    <span>
                      {note.category ||
                        "General"}
                    </span>
                  </div>

                  {/* USER */}

                  <div className="pinned-note-user">

                    <div className="pinned-user-avatar">

                      {note.user?.name
                        ? note.user.name
                            .charAt(0)
                            .toUpperCase()
                        : "U"}

                    </div>

                    <div className="pinned-user-details">

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

                  {/* META */}

                  <div className="pinned-note-meta">

                    <span>
                      🗓️{" "}
                      {formatDate(
                        note.createdAt
                      )}
                    </span>

                    {note.completed && (
                      <span className="completed-badge">
                        ✓ Completed
                      </span>
                    )}

                  </div>

                  {/* ACTIONS */}

                  <div className="pinned-note-actions">

                    <button
                      className="pinned-view-btn"
                      onClick={() =>
                        navigate(
                          `/admin/manage-notes?note=${note._id}`
                        )
                      }
                    >
                      👁️ View
                    </button>

                    <button
                      className="pinned-unpin-btn"
                      onClick={() =>
                        handleUnpin(
                          note._id
                        )
                      }
                    >
                      📌 Unpin
                    </button>

                    <button
                      className="pinned-delete-btn"
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

            </div>

          </section>
        )}

      </main>

      {/* =================================================
          MOBILE BOTTOM NAV
      ================================================= */}

      <nav className="pinned-mobile-nav">

        <button
          onClick={() =>
            navigate("/admin-dashboard")
          }
        >
          <span>📊</span>
          <small>Home</small>
        </button>

        <button onClick={handleUsers}>
          <span>👥</span>
          <small>Users</small>
        </button>

        <button onClick={handleNotes}>
          <span>📝</span>
          <small>Notes</small>
        </button>

        <button
          className="active"
          onClick={handlePinnedNotes}
        >
          <span>📌</span>
          <small>Pinned</small>
        </button>

        <button onClick={handleFavorites}>
          <span>⭐</span>
          <small>Favorites</small>
        </button>

        <button onClick={handleReports}>
          <span>📈</span>
          <small>Reports</small>
        </button>

      </nav>

    </div>
  );
};

export default AdminPinnedNotes;