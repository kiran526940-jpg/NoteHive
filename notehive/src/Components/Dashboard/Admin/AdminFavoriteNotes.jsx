
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./AdminHeader";
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
          data.message ||
            "Failed to fetch favorite notes"
        );
      }

      setNotes(data.notes || []);
    } catch (err) {
      console.error(
        "Favorite notes error:",
        err
      );

      setError(
        err.message ||
          "Unable to fetch favorite notes"
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // DATE
  // ============================================================

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

  // ============================================================
  // USER HELPERS
  // ============================================================

  const getUserName = (note) => {
    return (
      note?.user?.name ||
      "Unknown User"
    );
  };

  const getUserEmail = (note) => {
    return (
      note?.user?.email ||
      "No email available"
    );
  };

  // ============================================================
  // NOTE OPEN
  // ============================================================

  const openNote = (note) => {
    if (!note?._id) return;

    navigate(
      `/admin/notes/${note._id}`
    );
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem(
      "adminLoggedIn"
    );
    localStorage.removeItem(
      "adminId"
    );
    localStorage.removeItem(
      "admin"
    );
    localStorage.removeItem(
      "isLoggedIn"
    );
    localStorage.removeItem(
      "userRole"
    );
    localStorage.removeItem(
      "notehive_userId"
    );
    localStorage.removeItem(
      "notehive_user"
    );

    navigate(
      "/admin-login",
      { replace: true }
    );
  };

  // ============================================================
  // NAVIGATION
  // ============================================================

  const goDashboard = () => {
    navigate("/admin-dashboard");
  };

  const goUsers = () => {
    navigate("/admin/manage-users");
  };

  const goNotifications = () => {
    navigate("/admin/notifications");
  };

  const goNotes = () => {
    navigate("/admin/manage-notes");
  };

  const goPinned = () => {
    navigate("/admin/pinned-notes");
  };

  const goFavorites = () => {
    navigate("/admin/favorite-notes");
  };

  const goReports = () => {
    navigate("/admin/reports");
  };

  // ============================================================
  // STATISTICS
  // ============================================================

  const stats = useMemo(() => {
    const total = notes.length;

    const completed = notes.filter(
      (note) => note.completed
    ).length;

    const pending =
      total - completed;

    const highPriority =
      notes.filter(
        (note) =>
          String(
            note.priority || ""
          ).toLowerCase() === "high"
      ).length;

    const publicNotes =
      notes.filter(
        (note) =>
          String(
            note.visibility || ""
          ).toLowerCase() === "public"
      ).length;

    return {
      total,
      completed,
      pending,
      highPriority,
      publicNotes,
    };
  }, [notes]);

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="admin-favorite-page">
        <AdminHeader />

        <main className="admin-favorite-main">
          <section className="favorite-loading-card">
            <div className="favorite-loading-spinner"></div>

            <h2>
              Loading Favorite Notes...
            </h2>

            <p>
              Please wait while NoteHive
              loads your favorite notes.
            </p>
          </section>
        </main>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="admin-favorite-page">

      {/* ======================================================
          ADMIN HEADER
      ====================================================== */}

      <AdminHeader />

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="admin-favorite-main">

        {/* ====================================================
            HERO
        ==================================================== */}

        <section className="favorite-hero">

          <div className="favorite-hero-text">

            <span className="favorite-eyebrow">
              ⭐ FAVORITE NOTES
            </span>

            <h1>
              Favorite Notes
            </h1>

            <p>
              View and manage notes that
              users have marked as favorites
              across your NoteHive platform.
            </p>

          </div>

          <div className="favorite-hero-actions">

            <button
              className="favorite-refresh-btn"
              onClick={fetchFavoriteNotes}
            >
              <span>↻</span>
              Refresh
            </button>

            <button
              className="favorite-dashboard-btn"
              onClick={goDashboard}
            >
              Dashboard →
            </button>

          </div>

        </section>

        {/* ====================================================
            STATS
        ==================================================== */}

        <section className="favorite-stat-scroll">

          <article className="favorite-stat-card blue">

            <div className="favorite-stat-top">
              <div className="favorite-stat-icon">
                ⭐
              </div>

              <span className="favorite-stat-mini">
                TOTAL
              </span>
            </div>

            <strong>
              {stats.total}
            </strong>

            <span>
              Favorite Notes
            </span>

          </article>

          <article className="favorite-stat-card purple">

            <div className="favorite-stat-top">
              <div className="favorite-stat-icon">
                ✅
              </div>

              <span className="favorite-stat-mini">
                DONE
              </span>
            </div>

            <strong>
              {stats.completed}
            </strong>

            <span>
              Completed Notes
            </span>

          </article>

          <article className="favorite-stat-card pink">

            <div className="favorite-stat-top">
              <div className="favorite-stat-icon">
                ⏳
              </div>

              <span className="favorite-stat-mini">
                PENDING
              </span>
            </div>

            <strong>
              {stats.pending}
            </strong>

            <span>
              Pending Notes
            </span>

          </article>

          <article className="favorite-stat-card orange">

            <div className="favorite-stat-top">
              <div className="favorite-stat-icon">
                🔥
              </div>

              <span className="favorite-stat-mini">
                HIGH
              </span>
            </div>

            <strong>
              {stats.highPriority}
            </strong>

            <span>
              High Priority
            </span>

          </article>

          <article className="favorite-stat-card green">

            <div className="favorite-stat-top">
              <div className="favorite-stat-icon">
                🌐
              </div>

              <span className="favorite-stat-mini">
                PUBLIC
              </span>
            </div>

            <strong>
              {stats.publicNotes}
            </strong>

            <span>
              Public Favorites
            </span>

          </article>

        </section>

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <section className="favorite-error-card">

            <div className="favorite-error-icon">
              ⚠️
            </div>

            <div>
              <h3>
                Unable to load favorites
              </h3>

              <p>
                {error}
              </p>

              <button
                onClick={fetchFavoriteNotes}
              >
                Try Again
              </button>
            </div>

          </section>
        )}

        {/* ====================================================
            EMPTY
        ==================================================== */}

        {!error &&
          notes.length === 0 && (
            <section className="favorite-empty-card">

              <div className="favorite-empty-icon">
                ⭐
              </div>

              <h2>
                No Favorite Notes
              </h2>

              <p>
                There are currently no
                favorite notes in NoteHive.
              </p>

              <button
                onClick={fetchFavoriteNotes}
              >
                ↻ Refresh
              </button>

            </section>
          )}

        {/* ====================================================
            NOTES SECTION
        ==================================================== */}

        {!error &&
          notes.length > 0 && (
            <section className="favorite-notes-panel">

              <div className="favorite-panel-header">

                <div>
                  <span>
                    ACTIVITY COLLECTION
                  </span>

                  <h2>
                    Recent Favorite Notes
                  </h2>

                  <p>
                    Notes currently marked as
                    favorites by NoteHive users.
                  </p>
                </div>

                <div className="favorite-count-badge">
                  ⭐ {notes.length}
                </div>

              </div>

              <div className="favorite-notes-grid">

                {notes.map((note) => {

                  const userName =
                    getUserName(note);

                  const image =
                    note.user?.profileImage;

                  return (
                    <article
                      className="favorite-note-card"
                      key={note._id}
                    >

                      {/* TOP */}

                      <div className="favorite-note-card-top">

                        <div className="favorite-note-badge">
                          ⭐ Favorite
                        </div>

                        <span className="favorite-note-date">
                          {formatDate(
                            note.createdAt
                          )}
                        </span>

                      </div>

                      {/* TITLE */}

                      <h3 className="favorite-note-title">
                        {note.title ||
                          "Untitled Note"}
                      </h3>

                      {/* CONTENT */}

                      <p className="favorite-note-content">

                        {note.content
                          ? note.content.length >
                            180
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
                          {note.category ||
                            "General"}
                        </strong>

                      </div>

                      {/* META */}

                      <div className="favorite-note-meta">

                        <div>
                          <span>
                            Priority
                          </span>

                          <strong>
                            {note.priority ||
                              "Medium"}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Status
                          </span>

                          <strong
                            className={
                              note.completed
                                ? "completed"
                                : "pending"
                            }
                          >
                            {note.completed
                              ? "Completed"
                              : "Pending"}
                          </strong>
                        </div>

                      </div>

                      {/* USER */}

                      <div className="favorite-note-user">

                        <div className="favorite-user-avatar">

                          {image ? (
                            <img
                              src={
                                image.startsWith(
                                  "http"
                                )
                                  ? image
                                  : `${SERVER_URL}${image}`
                              }
                              alt={userName}
                            />
                          ) : (
                            <span>
                              {userName
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          )}

                        </div>

                        <div className="favorite-user-info">

                          <strong>
                            {userName}
                          </strong>

                          <small>
                            {getUserEmail(note)}
                          </small>

                        </div>

                      </div>

                      {/* ACTION */}

                      <button
                        className="favorite-view-btn"
                        onClick={() =>
                          openNote(note)
                        }
                      >
                        View Note
                        <span>→</span>
                      </button>

                    </article>
                  );
                })}

              </div>

            </section>
          )}

      </main>

      {/* ======================================================
          MOBILE BOTTOM NAV
      ====================================================== */}

      <nav className="favorite-mobile-nav">

        <button onClick={goDashboard}>
          <span>⌂</span>
          <small>Home</small>
        </button>

        <button onClick={goUsers}>
          <span>👥</span>
          <small>Users</small>
        </button>

        <button onClick={goNotes}>
          <span>📝</span>
          <small>Notes</small>
        </button>

        <button onClick={goPinned}>
          <span>📌</span>
          <small>Pinned</small>
        </button>

        <button className="active">
          <span>⭐</span>
          <small>Favorites</small>
        </button>

        <button onClick={goReports}>
          <span>📊</span>
          <small>Reports</small>
        </button>

      </nav>

    </div>
  );
};

export default AdminFavoriteNotes;
