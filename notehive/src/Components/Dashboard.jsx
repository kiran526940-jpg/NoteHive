
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
  // GET LOGGED-IN USER NAME
  // =====================================================

  useEffect(() => {
    const loadUserName = () => {
      try {
        // -------------------------------------------------
        // 1. MAIN USER OBJECT
        // -------------------------------------------------

        const storedUser = localStorage.getItem("notehive_user");

        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);

            if (user?.name) {
              setUserName(user.name);
              return;
            }
          } catch (error) {
            console.error(
              "Invalid notehive_user data:",
              error
            );
          }
        }

        // -------------------------------------------------
        // 2. FALLBACK LOCAL STORAGE KEYS
        // -------------------------------------------------

        const storedName =
          localStorage.getItem("notehive_userName") ||
          localStorage.getItem("userName") ||
          localStorage.getItem("name");

        if (storedName) {
          setUserName(storedName);
          return;
        }

        // -------------------------------------------------
        // 3. DEFAULT
        // -------------------------------------------------

        setUserName("User");
      } catch (error) {
        console.error(
          "Unable to get logged-in user name:",
          error
        );

        setUserName("User");
      }
    };

    loadUserName();

    // -----------------------------------------------------
    // UPDATE NAME WHEN LOCAL STORAGE CHANGES
    // -----------------------------------------------------

    const handleStorageChange = () => {
      loadUserName();
    };

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };
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

    if (!confirmDelete) return;

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
  // DATE
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
  // UI
  // =====================================================

  return (
    <div className="dashboard-page">

      {/* =================================================
          APP HERO
      ================================================= */}

      <section className="dashboard-hero">

        <div className="hero-glow hero-glow-one"></div>
        <div className="hero-glow hero-glow-two"></div>

        <div className="dashboard-hero-content">

          <div className="hero-text">

            <div className="hero-mini-badge">
              <span className="hero-mini-dot"></span>
              Your workspace
            </div>

            <h1>
              Hello,{" "}
              <span>{userName}</span>
              <span className="hero-wave">👋</span>
            </h1>

            <p>
              Capture your ideas, organize your thoughts,
              and keep everything in one beautiful place.
            </p>

          </div>

          <button
            className="create-note-btn"
            type="button"
            onClick={() => navigate("/create-note")}
          >
            <span className="create-note-plus">＋</span>

            <span>
              <small>Start writing</small>
              New Note
            </span>

            <span className="create-note-arrow">→</span>
          </button>

        </div>

      </section>

      {/* =================================================
          STATS
      ================================================= */}

      <section className="dashboard-stats">

        <div className="stat-card stat-blue">
          <div className="stat-icon">📝</div>

          <div className="stat-info">
            <span>Total Notes</span>
            <strong>{totalNotes}</strong>
          </div>

          <div className="stat-decoration">01</div>
        </div>

        <div className="stat-card stat-purple">
          <div className="stat-icon">📌</div>

          <div className="stat-info">
            <span>Pinned</span>
            <strong>{pinnedNotes}</strong>
          </div>

          <div className="stat-decoration">02</div>
        </div>

        <div className="stat-card stat-pink">
          <div className="stat-icon">⭐</div>

          <div className="stat-info">
            <span>Favorites</span>
            <strong>{favoriteNotes}</strong>
          </div>

          <div className="stat-decoration">03</div>
        </div>

        <div className="stat-card stat-green">
          <div className="stat-icon">✓</div>

          <div className="stat-info">
            <span>Completed</span>
            <strong>{completedNotes}</strong>
          </div>

          <div className="stat-decoration">04</div>
        </div>

      </section>

      {/* =================================================
          QUICK ACTIONS
      ================================================= */}

      <section className="quick-actions-section">

        <div className="section-heading">

          <div>
            <span className="section-small-title">
              QUICK ACCESS
            </span>

            <h2>
              What do you want to do?
            </h2>
          </div>

          <div className="section-heading-mark">
            ✦
          </div>

        </div>

        <div className="quick-actions-grid">

          <button
            type="button"
            className="quick-action-card quick-create"
            onClick={() => navigate("/create-note")}
          >
            <div className="quick-action-icon">
              ＋
            </div>

            <div className="quick-action-content">
              <strong>Create Note</strong>
              <span>
                Write down your ideas
              </span>
            </div>

            <span className="quick-action-arrow">
              ↗
            </span>
          </button>

          <button
            type="button"
            className="quick-action-card quick-explore"
            onClick={() => navigate("/explore-notes")}
          >
            <div className="quick-action-icon">
              🔎
            </div>

            <div className="quick-action-content">
              <strong>Explore</strong>
              <span>
                Discover shared notes
              </span>
            </div>

            <span className="quick-action-arrow">
              ↗
            </span>
          </button>

          <button
            type="button"
            className="quick-action-card quick-pinned"
            onClick={() => navigate("/pinned-notes")}
          >
            <div className="quick-action-icon">
              📌
            </div>

            <div className="quick-action-content">
              <strong>Pinned Notes</strong>
              <span>
                Your important notes
              </span>
            </div>

            <span className="quick-action-arrow">
              ↗
            </span>
          </button>

          <button
            type="button"
            className="quick-action-card quick-favorite"
            onClick={() => navigate("/favorite-notes")}
          >
            <div className="quick-action-icon">
              ⭐
            </div>

            <div className="quick-action-content">
              <strong>Favorites</strong>
              <span>
                Notes you love
              </span>
            </div>

            <span className="quick-action-arrow">
              ↗
            </span>
          </button>

        </div>

      </section>

      {/* =================================================
          NOTES
      ================================================= */}

      <section className="dashboard-notes-section">

        <div className="notes-section-header">

          <div>
            <span className="section-small-title">
              YOUR NOTES
            </span>

            <h2>
              Recent Notes
            </h2>
          </div>

          <button
            type="button"
            className="view-all-btn"
            onClick={() => navigate("/my-notes")}
          >
            View all
            <span>→</span>
          </button>

        </div>

        {/* SEARCH */}

        <div className="dashboard-search-wrapper">

          <span className="dashboard-search-icon">
            ⌕
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
              Loading your notes
            </h3>

            <p>
              Getting everything ready for you...
            </p>

          </div>

        ) : filteredNotes.length === 0 ? (

          <div className="dashboard-empty-state">

            <div className="empty-icon">
              {searchText ? "🔎" : "📝"}
            </div>

            <h3>
              {searchText
                ? "No notes found"
                : "Your notebook is empty"}
            </h3>

            <p>
              {searchText
                ? "Try another keyword."
                : "Create your first note and start capturing your ideas."}
            </p>

            {!searchText && (
              <button
                type="button"
                className="empty-create-btn"
                onClick={() => navigate("/create-note")}
              >
                ＋ Create Your First Note
              </button>
            )}

          </div>

        ) : (

          <div className="dashboard-notes-grid">

            {filteredNotes.map((note) => (

              <article
                className="dashboard-note-card"
                key={note._id}
              >

                <div className="note-card-color"></div>

                <div className="note-card-top">

                  <span className="note-category">
                    {note.category || "General"}
                  </span>

                  <div className="note-card-actions">

                    <button
                      type="button"
                      title={
                        note.pinned
                          ? "Unpin note"
                          : "Pin note"
                      }
                      onClick={() => togglePin(note)}
                      className={
                        note.pinned
                          ? "active-action pin-active"
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
                      onClick={() => toggleFavorite(note)}
                      className={
                        note.favorite
                          ? "active-action favorite-active"
                          : ""
                      }
                    >
                      ⭐
                    </button>

                    <button
                      type="button"
                      title="Delete note"
                      onClick={() => deleteNote(note._id)}
                    >
                      🗑
                    </button>

                  </div>

                </div>

                <h3>
                  {note.title || "Untitled Note"}
                </h3>

                <p className="note-card-content">
                  {note.content
                    ? note.content.length > 150
                      ? `${note.content.substring(0, 150)}...`
                      : note.content
                    : "No content available."}
                </p>

                <div className="note-card-footer">

                  <span className="note-date">
                    ◷{" "}
                    {formatDate(
                      note.updatedAt || note.createdAt
                    )}
                  </span>

                  {note.completed && (
                    <span className="completed-badge">
                      ✓ Done
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
