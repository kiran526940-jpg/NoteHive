import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { SERVER_URL } from "../config/api";

function Dashboard() {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("User");

  const userId = localStorage.getItem("notehive_userId");

  // =====================================================
  // GET USER NAME
  // =====================================================

  useEffect(() => {
    const storedName =
      localStorage.getItem("notehive_userName") ||
      localStorage.getItem("userName") ||
      localStorage.getItem("name");

    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  // =====================================================
  // FETCH NOTES
  // =====================================================

  const fetchNotes = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${SERVER_URL}/api/notes?userId=${userId}`
      );

      const data = await response.json();

      if (response.ok) {
        const fetchedNotes = Array.isArray(data)
          ? data
          : data.notes || [];

        setNotes(fetchedNotes);
      } else {
        console.error("Failed to fetch notes:", data);
        setNotes([]);
      }
    } catch (error) {
      console.error("Fetch notes error:", error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [userId]);

  // =====================================================
  // STATISTICS
  // =====================================================

  const totalNotes = notes.length;

  const pinnedNotes = notes.filter(
    (note) => note.pinned === true
  ).length;

  const favoriteNotes = notes.filter(
    (note) => note.favorite === true
  ).length;

  const completedNotes = notes.filter(
    (note) => note.completed === true
  ).length;

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredNotes = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    if (!search) {
      return notes;
    }

    return notes.filter((note) => {
      const title = note.title?.toLowerCase() || "";
      const content = note.content?.toLowerCase() || "";
      const category = note.category?.toLowerCase() || "";

      return (
        title.includes(search) ||
        content.includes(search) ||
        category.includes(search)
      );
    });
  }, [notes, searchText]);

  // =====================================================
  // PIN NOTE
  // =====================================================

  const togglePin = async (note) => {
    if (!userId) {
      alert("Please login again.");
      return;
    }

    try {
      const response = await fetch(
        `${SERVER_URL}/api/notes/${note._id}/pin`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            pinned: !note.pinned,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Pin API error:", data);
        alert(data.message || "Unable to update pin.");
        return;
      }

      setNotes((prevNotes) =>
        prevNotes.map((item) =>
          item._id === note._id
            ? {
                ...item,
                pinned:
                  typeof data?.note?.pinned === "boolean"
                    ? data.note.pinned
                    : !item.pinned,
              }
            : item
        )
      );
    } catch (error) {
      console.error("Pin error:", error);
      alert("Server error while updating pin.");
    }
  };

  // =====================================================
  // FAVORITE NOTE
  // =====================================================

  const toggleFavorite = async (note) => {
    if (!userId) {
      alert("Please login again.");
      return;
    }

    try {
      const response = await fetch(
        `${SERVER_URL}/api/notes/${note._id}/favorite`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Favorite API error:", data);
        alert(data.message || "Unable to update favorite.");
        return;
      }

      setNotes((prevNotes) =>
        prevNotes.map((item) =>
          item._id === note._id
            ? {
                ...item,
                favorite:
                  typeof data?.note?.favorite === "boolean"
                    ? data.note.favorite
                    : !item.favorite,
              }
            : item
        )
      );
    } catch (error) {
      console.error("Favorite error:", error);
      alert("Server error while updating favorite.");
    }
  };

  // =====================================================
  // DELETE NOTE
  // =====================================================

  const deleteNote = async (noteId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this note?"
    );

    if (!confirmDelete) {
      return;
    }

    if (!userId) {
      alert("Please login again.");
      return;
    }

    try {
      const response = await fetch(
        `${SERVER_URL}/api/notes/${noteId}?userId=${userId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Delete error:", data);
        alert(data.message || "Unable to delete note.");
        return;
      }

      setNotes((prevNotes) =>
        prevNotes.filter((note) => note._id !== noteId)
      );
    } catch (error) {
      console.error("Delete note error:", error);
      alert("Server error while deleting note.");
    }
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "";

    try {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("notehive_userId");
    localStorage.removeItem("notehive_userName");
    localStorage.removeItem("userName");
    localStorage.removeItem("name");
    localStorage.removeItem("userRole");

    navigate("/login");
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="dashboard-page">

      {/* =================================================
          HERO / WELCOME
      ================================================= */}

      <section className="dashboard-hero">
        <div className="dashboard-hero-content">
          <div>
            <span className="dashboard-welcome">
              Welcome back 👋
            </span>

            <h1>
              Hello, {userName}
            </h1>

            <p>
              Organize your thoughts, manage your notes and
              keep everything in one place.
            </p>
          </div>

          <button
            className="create-note-btn"
            type="button"
            onClick={() => navigate("/create-note")}
          >
            <span>＋</span>
            Create Note
          </button>
        </div>
      </section>

      {/* =================================================
          STATISTICS
      ================================================= */}

      <section className="dashboard-stats">

        <div className="stat-card">
          <div className="stat-icon">📝</div>

          <div>
            <span>Total Notes</span>
            <strong>{totalNotes}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📌</div>

          <div>
            <span>Pinned Notes</span>
            <strong>{pinnedNotes}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>

          <div>
            <span>Favorites</span>
            <strong>{favoriteNotes}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>

          <div>
            <span>Completed</span>
            <strong>{completedNotes}</strong>
          </div>
        </div>

      </section>

      {/* =================================================
          QUICK ACTIONS
      ================================================= */}

      <section className="quick-actions-section">

        <div className="section-heading">
          <div>
            <span className="section-small-title">
              Quick Access
            </span>

            <h2>
              What would you like to do?
            </h2>
          </div>
        </div>

        <div className="quick-actions-grid">

          {/* CREATE NOTE */}

          <button
            type="button"
            className="quick-action-card"
            onClick={() => navigate("/create-note")}
          >
            <div className="quick-action-icon">
              📝
            </div>

            <div className="quick-action-content">
              <strong>Create Note</strong>

              <span>
                Create a new note and save your ideas
              </span>
            </div>

            <span className="quick-action-arrow">
              →
            </span>
          </button>

          {/* EXPLORE NOTES */}

          <button
            type="button"
            className="quick-action-card"
            onClick={() => navigate("/explore-notes")}
          >
            <div className="quick-action-icon">
              🔍
            </div>

            <div className="quick-action-content">
              <strong>Explore Notes</strong>

              <span>
                Discover notes shared by the community
              </span>
            </div>

            <span className="quick-action-arrow">
              →
            </span>
          </button>

          {/* PINNED NOTES */}

          <button
            type="button"
            className="quick-action-card"
            onClick={() => navigate("/pinned-notes")}
          >
            <div className="quick-action-icon">
              📌
            </div>

            <div className="quick-action-content">
              <strong>Pinned Notes</strong>

              <span>
                Quickly access your important notes
              </span>
            </div>

            <span className="quick-action-arrow">
              →
            </span>
          </button>

          {/* FAVORITE NOTES */}

          <button
            type="button"
            className="quick-action-card"
            onClick={() => navigate("/favorite-notes")}
          >
            <div className="quick-action-icon">
              ⭐
            </div>

            <div className="quick-action-content">
              <strong>Favorite Notes</strong>

              <span>
                View notes you marked as favorite
              </span>
            </div>

            <span className="quick-action-arrow">
              →
            </span>
          </button>

        </div>
      </section>

      {/* =================================================
          MY NOTES
      ================================================= */}

      <section className="dashboard-notes-section">

        <div className="notes-section-header">

          <div>
            <span className="section-small-title">
              Your Workspace
            </span>

            <h2>
              My Recent Notes
            </h2>
          </div>

          <button
            type="button"
            className="view-all-btn"
            onClick={() => navigate("/my-notes")}
          >
            View All →
          </button>

        </div>

        {/* SEARCH */}

        <div className="dashboard-search-wrapper">

          <span className="dashboard-search-icon">
            🔍
          </span>

          <input
            type="text"
            value={searchText}
            onChange={(e) =>
              setSearchText(e.target.value)
            }
            placeholder="Search your notes..."
          />

          {searchText && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchText("")}
            >
              ×
            </button>
          )}

        </div>

        {/* LOADING */}

        {loading ? (
          <div className="dashboard-empty-state">
            <div className="loading-spinner"></div>

            <h3>
              Loading your notes...
            </h3>

            <p>
              Please wait while we fetch your notes.
            </p>
          </div>
        ) : filteredNotes.length === 0 ? (

          /* EMPTY */

          <div className="dashboard-empty-state">

            <div className="empty-icon">
              {searchText ? "🔎" : "📝"}
            </div>

            <h3>
              {searchText
                ? "No notes found"
                : "No notes yet"}
            </h3>

            <p>
              {searchText
                ? "Try searching with another keyword."
                : "Create your first note and start organizing your ideas."}
            </p>

            {!searchText && (
              <button
                type="button"
                className="empty-create-btn"
                onClick={() =>
                  navigate("/create-note")
                }
              >
                ＋ Create Your First Note
              </button>
            )}

          </div>

        ) : (

          /* NOTES */

          <div className="dashboard-notes-grid">

            {filteredNotes.map((note) => (

              <article
                className="dashboard-note-card"
                key={note._id}
              >

                {/* CARD TOP */}

                <div className="note-card-top">

                  <div className="note-category">
                    {note.category || "General"}
                  </div>

                  <div className="note-card-actions">

                    <button
                      type="button"
                      title={
                        note.pinned
                          ? "Unpin note"
                          : "Pin note"
                      }
                      onClick={() =>
                        togglePin(note)
                      }
                      className={
                        note.pinned
                          ? "active-action"
                          : ""
                      }
                    >
                      📌
                    </button>

                    <button
                      type="button"
                      title={
                        note.favorite
                          ? "Remove favorite"
                          : "Add favorite"
                      }
                      onClick={() =>
                        toggleFavorite(note)
                      }
                      className={
                        note.favorite
                          ? "active-action"
                          : ""
                      }
                    >
                      ⭐
                    </button>

                    <button
                      type="button"
                      title="Delete note"
                      onClick={() =>
                        deleteNote(note._id)
                      }
                    >
                      🗑️
                    </button>

                  </div>

                </div>

                {/* TITLE */}

                <h3>
                  {note.title || "Untitled Note"}
                </h3>

                {/* CONTENT */}

                <p className="note-card-content">
                  {note.content
                    ? note.content.length > 150
                      ? `${note.content.substring(
                          0,
                          150
                        )}...`
                      : note.content
                    : "No content available."}
                </p>

                {/* FOOTER */}

                <div className="note-card-footer">

                  <span>
                    {formatDate(
                      note.updatedAt ||
                        note.createdAt
                    )}
                  </span>

                  {note.completed && (
                    <span className="completed-badge">
                      ✓ Completed
                    </span>
                  )}

                </div>

              </article>

            ))}

          </div>

        )}

      </section>

    </div>
  );
}

export default Dashboard;