
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { SERVER_URL } from "../config/api";

// ======================================================
// DASHBOARD
// ======================================================

function Dashboard() {
  const navigate = useNavigate();

  // ======================================================
  // USER
  // ======================================================

  const [userId, setUserId] = useState(
    localStorage.getItem("notehive_userId")
  );

  const [userName, setUserName] = useState(
    localStorage.getItem("notehive_userName") ||
      localStorage.getItem("userName") ||
      localStorage.getItem("name") ||
      "User"
  );

  // ======================================================
  // DASHBOARD DATA
  // ======================================================

  const [dashboardData, setDashboardData] = useState({
    totalNotes: 0,
    favoriteNotes: 0,
    pinnedNotes: 0,
    completedNotes: 0,
    recentNotes: [],
  });

  // ======================================================
  // UI STATES
  // ======================================================

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  // ======================================================
  // NOTES API URL
  // ======================================================

  const NOTES_URL = `${SERVER_URL}/api/notes`;

  // ======================================================
  // GET USER NAME
  // ======================================================

  useEffect(() => {
    const updateUserName = () => {
      const storedName =
        localStorage.getItem("notehive_userName") ||
        localStorage.getItem("userName") ||
        localStorage.getItem("name");

      if (storedName) {
        setUserName(storedName);
      } else {
        setUserName("User");
      }
    };

    updateUserName();

    window.addEventListener(
      "notehive-login-change",
      updateUserName
    );

    window.addEventListener(
      "storage",
      updateUserName
    );

    return () => {
      window.removeEventListener(
        "notehive-login-change",
        updateUserName
      );

      window.removeEventListener(
        "storage",
        updateUserName
      );
    };
  }, []);

  // ======================================================
  // FETCH DASHBOARD / NOTES
  // ======================================================

  const fetchDashboard = async (
    currentUserId = userId
  ) => {
    try {
      setLoading(true);
      setError("");

      if (!currentUserId) {
        setDashboardData({
          totalNotes: 0,
          favoriteNotes: 0,
          pinnedNotes: 0,
          completedNotes: 0,
          recentNotes: [],
        });

        setError(
          "User session not found. Please login again."
        );

        return;
      }

      const response = await fetch(
        `${NOTES_URL}?userId=${encodeURIComponent(
          currentUserId
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to load notes."
        );
      }

      // ==================================================
      // NORMALIZE NOTES RESPONSE
      // ==================================================

      let fetchedNotes = [];

      if (Array.isArray(data)) {
        fetchedNotes = data;
      } else if (Array.isArray(data?.notes)) {
        fetchedNotes = data.notes;
      } else if (
        Array.isArray(data?.data)
      ) {
        fetchedNotes = data.data;
      }

      // ==================================================
      // SORT NOTES BY LATEST UPDATED / CREATED
      // ==================================================

      const sortedNotes = [...fetchedNotes].sort(
        (a, b) => {
          const dateA = new Date(
            a?.updatedAt ||
              a?.createdAt ||
              0
          ).getTime();

          const dateB = new Date(
            b?.updatedAt ||
              b?.createdAt ||
              0
          ).getTime();

          return dateB - dateA;
        }
      );

      // ==================================================
      // STATISTICS
      // ==================================================

      const totalNotes = sortedNotes.length;

      const favoriteNotes =
        sortedNotes.filter(
          (note) => note?.favorite === true
        ).length;

      const pinnedNotes =
        sortedNotes.filter(
          (note) => note?.pinned === true
        ).length;

      const completedNotes =
        sortedNotes.filter(
          (note) => note?.completed === true
        ).length;

      // ==================================================
      // RECENT NOTES
      // ==================================================

      const recentNotes =
        sortedNotes.slice(0, 6);

      setDashboardData({
        totalNotes,
        favoriteNotes,
        pinnedNotes,
        completedNotes,
        recentNotes,
      });
    } catch (error) {
      console.error(
        "DASHBOARD FETCH ERROR:",
        error
      );

      setError(
        error?.message ||
          "Dashboard load nahi ho pa raha."
      );

      setDashboardData({
        totalNotes: 0,
        favoriteNotes: 0,
        pinnedNotes: 0,
        completedNotes: 0,
        recentNotes: [],
      });
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // INITIAL LOAD
  // ======================================================

  useEffect(() => {
    const storedUserId =
      localStorage.getItem("notehive_userId");

    setUserId(storedUserId);

    if (!storedUserId) {
      setLoading(false);
      return;
    }

    fetchDashboard(storedUserId);
  }, []);

  // ======================================================
  // PIN / UNPIN
  // ======================================================

  const handlePin = async (note) => {
    const currentUserId =
      localStorage.getItem("notehive_userId");

    if (!currentUserId) {
      alert("Please login again.");
      return;
    }

    if (!note?._id) {
      alert("Invalid note.");
      return;
    }

    try {
      setActionLoading(`pin-${note._id}`);

      const response = await fetch(
        `${NOTES_URL}/${note._id}/pin`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: currentUserId,
            pinned: !Boolean(note.pinned),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to update pin."
        );
      }

      // ==================================================
      // UPDATE LOCAL STATE
      // ==================================================

      setDashboardData((prev) => {
        const updatedRecentNotes =
          prev.recentNotes.map((item) =>
            item._id === note._id
              ? {
                  ...item,
                  pinned:
                    typeof data?.note?.pinned ===
                    "boolean"
                      ? data.note.pinned
                      : !Boolean(item.pinned),
                }
              : item
          );

        const wasPinned = Boolean(note.pinned);

        return {
          ...prev,
          pinnedNotes:
            wasPinned
              ? Math.max(
                  0,
                  prev.pinnedNotes - 1
                )
              : prev.pinnedNotes + 1,
          recentNotes: updatedRecentNotes,
        };
      });
    } catch (error) {
      console.error(
        "PIN ERROR:",
        error
      );

      alert(
        error?.message ||
          "Pin update nahi ho pa raha."
      );
    } finally {
      setActionLoading("");
    }
  };

  // ======================================================
  // FAVORITE / UNFAVORITE
  // ======================================================

  const handleFavorite = async (note) => {
    const currentUserId =
      localStorage.getItem("notehive_userId");

    if (!currentUserId) {
      alert("Please login again.");
      return;
    }

    if (!note?._id) {
      alert("Invalid note.");
      return;
    }

    try {
      setActionLoading(
        `favorite-${note._id}`
      );

      const response = await fetch(
        `${NOTES_URL}/${note._id}/favorite`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: currentUserId,
            favorite: !Boolean(note.favorite),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to update favorite."
        );
      }

      // ==================================================
      // UPDATE LOCAL STATE
      // ==================================================

      setDashboardData((prev) => {
        const updatedRecentNotes =
          prev.recentNotes.map((item) =>
            item._id === note._id
              ? {
                  ...item,
                  favorite:
                    typeof data?.note?.favorite ===
                    "boolean"
                      ? data.note.favorite
                      : !Boolean(item.favorite),
                }
              : item
          );

        const wasFavorite =
          Boolean(note.favorite);

        return {
          ...prev,
          favoriteNotes:
            wasFavorite
              ? Math.max(
                  0,
                  prev.favoriteNotes - 1
                )
              : prev.favoriteNotes + 1,
          recentNotes: updatedRecentNotes,
        };
      });
    } catch (error) {
      console.error(
        "FAVORITE ERROR:",
        error
      );

      alert(
        error?.message ||
          "Favorite update nahi ho pa raha."
      );
    } finally {
      setActionLoading("");
    }
  };

  // ======================================================
  // DELETE NOTE
  // ======================================================

  const handleDelete = async (noteId) => {
    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this note?"
      );

    if (!confirmDelete) {
      return;
    }

    const currentUserId =
      localStorage.getItem("notehive_userId");

    if (!currentUserId) {
      alert("Please login again.");
      return;
    }

    if (!noteId) {
      alert("Invalid note.");
      return;
    }

    try {
      setActionLoading(
        `delete-${noteId}`
      );

      const response = await fetch(
        `${NOTES_URL}/${noteId}?userId=${encodeURIComponent(
          currentUserId
        )}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to delete note."
        );
      }

      // ==================================================
      // UPDATE LOCAL STATE
      // ==================================================

      setDashboardData((prev) => {
        const deletedNote =
          prev.recentNotes.find(
            (note) =>
              note._id === noteId
          );

        const wasFavorite =
          deletedNote?.favorite === true;

        const wasPinned =
          deletedNote?.pinned === true;

        return {
          ...prev,

          totalNotes: Math.max(
            0,
            prev.totalNotes - 1
          ),

          favoriteNotes: wasFavorite
            ? Math.max(
                0,
                prev.favoriteNotes - 1
              )
            : prev.favoriteNotes,

          pinnedNotes: wasPinned
            ? Math.max(
                0,
                prev.pinnedNotes - 1
              )
            : prev.pinnedNotes,

          completedNotes:
            deletedNote?.completed === true
              ? Math.max(
                  0,
                  prev.completedNotes - 1
                )
              : prev.completedNotes,

          recentNotes:
            prev.recentNotes.filter(
              (note) =>
                note._id !== noteId
            ),
        };
      });

      alert(
        "Note deleted successfully ✅"
      );
    } catch (error) {
      console.error(
        "DELETE ERROR:",
        error
      );

      alert(
        error?.message ||
          "Note delete nahi ho pa raha."
      );
    } finally {
      setActionLoading("");
    }
  };

  // ======================================================
  // FORMAT DATE
  // ======================================================

  const formatDate = (date) => {
    if (!date) {
      return "Today";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "Today";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ======================================================
  // COMPLETION PERCENTAGE
  // ======================================================

  const completionPercentage =
    dashboardData.totalNotes > 0
      ? Math.round(
          (dashboardData.completedNotes /
            dashboardData.totalNotes) *
            100
        )
      : 0;

  // ======================================================
  // SEARCH RECENT NOTES
  // ======================================================

  const filteredNotes = useMemo(() => {
    const searchText =
      search.toLowerCase().trim();

    if (!searchText) {
      return dashboardData.recentNotes;
    }

    return dashboardData.recentNotes.filter(
      (note) => {
        const title =
          note?.title?.toLowerCase() ||
          "";

        const content =
          note?.content?.toLowerCase() ||
          "";

        const category =
          note?.category?.toLowerCase() ||
          "";

        return (
          title.includes(searchText) ||
          content.includes(searchText) ||
          category.includes(searchText)
        );
      }
    );
  }, [
    dashboardData.recentNotes,
    search,
  ]);

  // ======================================================
  // LOGIN EMPTY STATE
  // ======================================================

  if (!userId && !loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-empty">
          <div className="dashboard-empty-icon">
            🔐
          </div>

          <h2>
            Please Login First
          </h2>

          <p>
            Your user session was not found.
            Please login again to access your
            dashboard.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/login")
            }
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-notes-loading">
          <div className="loading-spinner">
            🐝
          </div>

          <h2>
            Loading Dashboard...
          </h2>

          <p>
            Your notes are being loaded.
          </p>
        </div>
      </div>
    );
  }

  // ======================================================
  // ERROR
  // ======================================================

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-empty">
          <div className="dashboard-empty-icon">
            ⚠️
          </div>

          <h2>
            Unable to Load Dashboard
          </h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={() =>
              fetchDashboard(userId)
            }
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  // ======================================================
  // MAIN DASHBOARD
  // ======================================================

  return (
    <div className="dashboard">

      {/* ==================================================
          WELCOME SECTION
      ================================================== */}

      <section className="welcome-section">
        <div className="welcome-content">

          <div className="dashboard-brand">
            <span>🐝</span>
            <span>NOTEHIVE</span>
          </div>

          <h1>
            Good Morning, {userName}! 👋
          </h1>

          <p>
            Manage your notes, ideas and important
            information easily.
          </p>

        </div>

        <button
          type="button"
          className="new-note-btn"
          onClick={() =>
            navigate("/my-notes")
          }
        >
          <span>＋</span>
          New Note
        </button>
      </section>

      {/* ==================================================
          STATISTICS
      ================================================== */}

      <section className="stats-container">

        {/* TOTAL NOTES */}

        <div className="stat-card">
          <div className="stat-icon">
            📚
          </div>

          <div className="stat-info">
            <span>
              Total Notes
            </span>

            <h3>
              {dashboardData.totalNotes}
            </h3>

            <p>
              All your notes
            </p>
          </div>
        </div>

        {/* FAVORITES */}

        <div className="stat-card">
          <div className="stat-icon favorite-icon">
            ⭐
          </div>

          <div className="stat-info">
            <span>
              Favorites
            </span>

            <h3>
              {dashboardData.favoriteNotes}
            </h3>

            <p>
              Important notes
            </p>
          </div>
        </div>

        {/* PINNED */}

        <div className="stat-card">
          <div className="stat-icon pinned-icon">
            📌
          </div>

          <div className="stat-info">
            <span>
              Pinned Notes
            </span>

            <h3>
              {dashboardData.pinnedNotes}
            </h3>

            <p>
              Quick access notes
            </p>
          </div>
        </div>

        {/* COMPLETED */}

        <div className="stat-card">
          <div className="stat-icon completed-icon">
            ✅
          </div>

          <div className="stat-info">
            <span>
              Completed
            </span>

            <h3>
              {dashboardData.completedNotes}
            </h3>

            <p>
              Finished notes
            </p>
          </div>
        </div>

      </section>

      {/* ==================================================
          QUICK ACTIONS
      ================================================== */}

      <section className="quick-actions-section">

        <div className="quick-actions-heading">

          <div>
            <span className="section-label">
              QUICK ACCESS
            </span>

            <h2>
              Quick Actions
            </h2>
          </div>

        </div>

        <div className="quick-actions-grid">

          {/* NEW NOTE */}

          <button
            type="button"
            className="quick-action-card"
            onClick={() =>
              navigate("/my-notes")
            }
          >
            <span className="quick-action-icon">
              ➕
            </span>

            <span className="quick-action-content">
              <strong>
                New Note
              </strong>

              <small>
                Create a new note
              </small>
            </span>

            <span className="quick-action-arrow">
              →
            </span>
          </button>

          {/* ALL NOTES */}

          <button
            type="button"
            className="quick-action-card"
            onClick={() =>
              navigate("/my-notes")
            }
          >
            <span className="quick-action-icon">
              📚
            </span>

            <span className="quick-action-content">
              <strong>
                All Notes
              </strong>

              <small>
                View all your notes
              </small>
            </span>

            <span className="quick-action-arrow">
              →
            </span>
          </button>

          {/* PINNED */}

          <button
            type="button"
            className="quick-action-card"
            onClick={() =>
              navigate("/pinned-notes")
            }
          >
            <span className="quick-action-icon pinned-action">
              📌
            </span>

            <span className="quick-action-content">
              <strong>
                Pinned Notes
              </strong>

              <small>
                Access pinned notes
              </small>
            </span>

            <span className="quick-action-arrow">
              →
            </span>
          </button>

          {/* FAVORITES */}

          <button
            type="button"
            className="quick-action-card"
            onClick={() =>
              navigate("/favorite-notes")
            }
          >
            <span className="quick-action-icon favorite-action">
              ⭐
            </span>

            <span className="quick-action-content">
              <strong>
                Favorites
              </strong>

              <small>
                View important notes
              </small>
            </span>

            <span className="quick-action-arrow">
              →
            </span>
          </button>

        </div>
      </section>

      {/* ==================================================
          PROGRESS
      ================================================== */}

      <section className="dashboard-progress-section">

        <div className="progress-content">

          <div className="progress-heading">

            <div>
              <span className="section-label">
                PRODUCTIVITY
              </span>

              <h2>
                Your Progress
              </h2>

              <p>
                Track how much of your notes
                you've completed.
              </p>
            </div>

            <div className="progress-percentage">
              {completionPercentage}%
            </div>

          </div>

          <div className="progress-bar-wrapper">
            <div
              className="progress-bar"
              style={{
                width: `${completionPercentage}%`,
              }}
            />
          </div>

          <div className="progress-footer">

            <span>
              {dashboardData.completedNotes} of{" "}
              {dashboardData.totalNotes} notes
              completed
            </span>

            <span>
              {completionPercentage === 100
                ? "All done! 🎉"
                : "Keep going! 💪"}
            </span>

          </div>

        </div>

      </section>

      {/* ==================================================
          NOTES SECTION
      ================================================== */}

      <section className="notes-section">

        {/* SECTION HEADING */}

        <div className="section-heading">

          <div>
            <span className="section-label">
              YOUR COLLECTION
            </span>

            <h2>
              My Notes
            </h2>

            <p>
              Your latest notes and ideas.
            </p>
          </div>

          <button
            type="button"
            className="view-all-btn"
            onClick={() =>
              navigate("/my-notes")
            }
          >
            View All →
          </button>

        </div>

        {/* ==================================================
            SEARCH
        ================================================== */}

        {dashboardData.recentNotes.length >
          0 && (
          <div className="dashboard-search">

            <span>
              🔍
            </span>

            <input
              type="text"
              placeholder="Search your recent notes..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                aria-label="Clear search"
              >
                ×
              </button>
            )}

          </div>
        )}

        {/* ==================================================
            NOTES
        ================================================== */}

        {filteredNotes.length > 0 ? (

          <div className="notes-grid">

            {filteredNotes.map((note) => (

              <article
                className="note-card"
                key={note._id}
              >

                {/* CARD TOP */}

                <div className="note-card-top">

                  <span className="note-category">
                    📁{" "}
                    {note.category ||
                      "General"}
                  </span>

                  <div className="note-flags">

                    {note.pinned && (
                      <span
                        className="note-flag"
                        title="Pinned"
                      >
                        📌
                      </span>
                    )}

                    {note.favorite && (
                      <span
                        className="note-flag"
                        title="Favorite"
                      >
                        ⭐
                      </span>
                    )}

                  </div>

                </div>

                {/* TITLE */}

                <h3>
                  {note.title ||
                    "Untitled Note"}
                </h3>

                {/* DESCRIPTION */}

                <p className="note-description">
                  {note.content
                    ? note.content.length > 180
                      ? `${note.content.substring(
                          0,
                          180
                        )}...`
                      : note.content
                    : "No content available."}
                </p>

                {/* META */}

                <div className="note-card-meta">

                  <span
                    className={`priority priority-${(
                      note.priority ||
                      "Medium"
                    ).toLowerCase()}`}
                  >
                    ⚡{" "}
                    {note.priority ||
                      "Medium"}
                  </span>

                  <span>
                    {formatDate(
                      note.createdAt
                    )}
                  </span>

                </div>

                {/* COMPLETED */}

                {note.completed && (
                  <div className="note-completed-badge">
                    ✓ Completed
                  </div>
                )}

                {/* ACTIONS */}

                <div className="note-actions">

                  {/* EDIT */}

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/my-notes")
                    }
                  >
                    ✏️ Edit
                  </button>

                  {/* PIN */}

                  <button
                    type="button"
                    onClick={() =>
                      handlePin(note)
                    }
                    disabled={
                      actionLoading ===
                      `pin-${note._id}`
                    }
                  >
                    {actionLoading ===
                    `pin-${note._id}`
                      ? "..."
                      : note.pinned
                      ? "📌 Unpin"
                      : "📍 Pin"}
                  </button>

                  {/* FAVORITE */}

                  <button
                    type="button"
                    onClick={() =>
                      handleFavorite(note)
                    }
                    disabled={
                      actionLoading ===
                      `favorite-${note._id}`
                    }
                  >
                    {actionLoading ===
                    `favorite-${note._id}`
                      ? "..."
                      : note.favorite
                      ? "⭐ Unfavorite"
                      : "☆ Favorite"}
                  </button>

                  {/* DELETE */}

                  <button
                    type="button"
                    className="delete-action"
                    onClick={() =>
                      handleDelete(
                        note._id
                      )
                    }
                    disabled={
                      actionLoading ===
                      `delete-${note._id}`
                    }
                  >
                    {actionLoading ===
                    `delete-${note._id}`
                      ? "Deleting..."
                      : "🗑️ Delete"}
                  </button>

                </div>

              </article>

            ))}

          </div>

        ) : (

          /* ==================================================
             EMPTY / NO SEARCH RESULT
          ================================================== */

          <div className="dashboard-empty-notes">

            <div className="empty-notes-icon">
              {search
                ? "🔍"
                : "📝"}
            </div>

            <h3>
              {search
                ? "No Matching Notes"
                : "No Notes Yet"}
            </h3>

            <p>
              {search
                ? "No recent notes match your search."
                : "Start creating notes to organize your ideas."}
            </p>

            {search ? (

              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
              >
                Clear Search
              </button>

            ) : (

              <button
                type="button"
                onClick={() =>
                  navigate("/my-notes")
                }
              >
                ＋ Create Your First Note
              </button>

            )}

          </div>

        )}

      </section>

    </div>
  );
}

export default Dashboard;
