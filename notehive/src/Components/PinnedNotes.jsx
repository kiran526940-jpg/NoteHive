
import React, { useEffect, useState } from "react";
import "./PinnedNotes.css";
import { SERVER_URL } from "../config/api";

const BACKGROUND_IMAGE =
  "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=2000&q=85";

const PinnedNotes = () => {
  const [pinnedNotes, setPinnedNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = localStorage.getItem("notehive_userId");
  const NOTES_URL = `${SERVER_URL}/api/notes`;

  // =====================================================
  // FETCH PINNED NOTES
  // =====================================================

  const fetchPinnedNotes = async () => {
    if (!userId) {
      setPinnedNotes([]);
      setError("User login information not found.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${NOTES_URL}?userId=${encodeURIComponent(userId)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to fetch notes."
        );
      }

      const allNotes = Array.isArray(data)
        ? data
        : Array.isArray(data?.notes)
        ? data.notes
        : Array.isArray(data?.data)
        ? data.data
        : [];

      const onlyPinnedNotes = allNotes.filter(
        (note) => note.pinned === true
      );

      setPinnedNotes(onlyPinnedNotes);
    } catch (err) {
      console.error("FETCH PINNED NOTES ERROR:", err);

      setPinnedNotes([]);
      setError(
        err.message || "Pinned notes fetch nahi ho pa rahi."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD NOTES
  // =====================================================

  useEffect(() => {
    fetchPinnedNotes();
  }, [userId]);

  // =====================================================
  // UNPIN NOTE
  // =====================================================

  const handleUnpin = async (noteId) => {
    const confirmUnpin = window.confirm(
      "Are you sure you want to unpin this note?"
    );

    if (!confirmUnpin) {
      return;
    }

    if (!userId) {
      alert("Please login again.");
      return;
    }

    try {
      const response = await fetch(
        `${NOTES_URL}/${noteId}/pin`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            pinned: false,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to unpin note."
        );
      }

      setPinnedNotes((previousNotes) =>
        previousNotes.filter(
          (note) => note._id !== noteId
        )
      );

      alert("Note unpinned successfully 📌");
    } catch (err) {
      console.error("UNPIN NOTE ERROR:", err);

      alert(
        err.message || "Note unpin nahi ho paya."
      );
    }
  };

  // =====================================================
  // DELETE NOTE
  // =====================================================

  const handleDelete = async (noteId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete this note?"
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
        `${NOTES_URL}/${noteId}?userId=${encodeURIComponent(userId)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to delete note."
        );
      }

      setPinnedNotes((previousNotes) =>
        previousNotes.filter(
          (note) => note._id !== noteId
        )
      );

      alert("Note deleted successfully 🗑️");
    } catch (err) {
      console.error("DELETE PINNED NOTE ERROR:", err);

      alert(
        err.message || "Note delete nahi ho paya."
      );
    }
  };

  // =====================================================
  // SEARCH
  // =====================================================

  const searchText = search.trim().toLowerCase();

  const filteredNotes = pinnedNotes.filter((note) => {
    if (!searchText) {
      return true;
    }

    const title = String(note.title || "").toLowerCase();
    const content = String(note.content || "").toLowerCase();
    const category = String(note.category || "").toLowerCase();
    const userName = String(
      note.user?.name || ""
    ).toLowerCase();
    const userEmail = String(
      note.user?.email || ""
    ).toLowerCase();

    return (
      title.includes(searchText) ||
      content.includes(searchText) ||
      category.includes(searchText) ||
      userName.includes(searchText) ||
      userEmail.includes(searchText)
    );
  });

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) {
      return "Unknown date";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Unknown date";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================================
  // IMAGE URL
  // =====================================================

  const getProfileImage = (profileImage) => {
    if (!profileImage) {
      return "";
    }

    if (
      profileImage.startsWith("http://") ||
      profileImage.startsWith("https://")
    ) {
      return profileImage;
    }

    return `${SERVER_URL}${profileImage.startsWith("/") ? "" : "/"}${profileImage}`;
  };

  // =====================================================
  // BACKGROUND STYLE
  // =====================================================

  const pageStyle = {
    "--pinned-bg": `url("${BACKGROUND_IMAGE}")`,
  };

  // =====================================================
  // LOADING STATE
  // =====================================================

  if (loading) {
    return (
      <div
        className="pinned-page"
        style={pageStyle}
      >
        <div className="pinned-background"></div>

        <div className="pinned-content-wrapper">
          <div className="pinned-loading">

            <div className="loading-bee">
              🐝
            </div>

            <h2>
              Loading Pinned Notes...
            </h2>

            <p>
              Please wait while we fetch your pinned notes.
            </p>

          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR STATE
  // =====================================================

  if (error) {
    return (
      <div
        className="pinned-page"
        style={pageStyle}
      >
        <div className="pinned-background"></div>

        <div className="pinned-content-wrapper">
          <div className="pinned-error">

            <div className="error-icon">
              ⚠️
            </div>

            <h2>
              Unable to Load Pinned Notes
            </h2>

            <p>
              {error}
            </p>

            <button
              type="button"
              onClick={fetchPinnedNotes}
            >
              🔄 Try Again
            </button>

          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <div
      className="pinned-page"
      style={pageStyle}
    >
      {/* BACKGROUND */}

      <div className="pinned-background"></div>

      <div className="pinned-content-wrapper">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="pinned-header">

          <div className="pinned-title">

            <div className="pinned-brand">
              <span>🐝</span>
              <span>NOTEHIVE</span>
            </div>

            <span className="pinned-label">
              MY NOTES
            </span>

            <h1>
              📌 Pinned Notes
            </h1>

            <p>
              Keep your important notes together in one place.
            </p>

          </div>

          <div className="pinned-header-count">

            <span>
              Total Pinned
            </span>

            <strong>
              {pinnedNotes.length}
            </strong>

            <small>
              Important notes
            </small>

          </div>

        </header>

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <div className="pinned-toolbar">

          <div className="pinned-search">

            <span className="search-icon">
              🔍
            </span>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search pinned notes..."
              aria-label="Search pinned notes"
            />

            {search && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setSearch("")}
                title="Clear search"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}

          </div>

          <div className="pinned-count">

            <span>
              Showing
            </span>

            <strong>
              {filteredNotes.length}
            </strong>

            <span>
              {filteredNotes.length === 1
                ? "Pinned Note"
                : "Pinned Notes"}
            </span>

          </div>

        </div>

        {/* =================================================
            NOTES
        ================================================= */}

        {filteredNotes.length > 0 ? (

          <div className="pinned-grid">

            {filteredNotes.map((note) => {

              const profileImage = getProfileImage(
                note.user?.profileImage
              );

              const priority =
                note.priority || "Medium";

              return (
                <article
                  className="pinned-card"
                  key={note._id}
                >

                  {/* CARD TOP */}

                  <div className="pinned-card-top">

                    <div className="pinned-date">
                      📅 {formatDate(note.createdAt)}
                    </div>

                    <div className="pinned-actions">

                      <button
                        type="button"
                        className="unpin-btn"
                        title="Unpin Note"
                        aria-label="Unpin Note"
                        onClick={() =>
                          handleUnpin(note._id)
                        }
                      >
                        📌
                      </button>

                      <button
                        type="button"
                        className="delete-btn"
                        title="Delete Note"
                        aria-label="Delete Note"
                        onClick={() =>
                          handleDelete(note._id)
                        }
                      >
                        🗑️
                      </button>

                    </div>

                  </div>

                  {/* NOTE ICON */}

                  <div className="pinned-note-icon">
                    📝
                  </div>

                  {/* TITLE */}

                  <h2>
                    {note.title || "Untitled Note"}
                  </h2>

                  {/* CONTENT */}

                  <p className="pinned-content">
                    {note.content || "No content available."}
                  </p>

                  {/* CATEGORY + PRIORITY */}

                  <div className="pinned-meta">

                    <span className="category-tag">
                      🏷️ {note.category || "General"}
                    </span>

                    <span
                      className={`priority-tag priority-${String(
                        priority
                      ).toLowerCase()}`}
                    >
                      ⚡ {priority}
                    </span>

                  </div>

                  {/* USER */}

                  <div className="pinned-user">

                    <div className="pinned-user-avatar">

                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt={
                            note.user?.name || "User"
                          }
                        />
                      ) : (
                        note.user?.name
                          ?.charAt(0)
                          ?.toUpperCase() || "U"
                      )}

                    </div>

                    <div className="pinned-user-info">

                      <strong>
                        {note.user?.name || "You"}
                      </strong>

                      <span>
                        {note.user?.email || "Your note"}
                      </span>

                    </div>

                  </div>

                  {/* FOOTER */}

                  <div className="pinned-card-footer">

                    <span className="pinned-status">
                      📌 Pinned
                    </span>

                    <span className="visibility-status">
                      {note.visibility || "Private"}
                    </span>

                  </div>

                </article>
              );
            })}

          </div>

        ) : (

          /* =================================================
             EMPTY STATE
          ================================================= */

          <div className="pinned-empty">

            <div className="pinned-empty-icon">
              {search ? "🔍" : "📌"}
            </div>

            <h2>
              {search
                ? "No Matching Notes"
                : "No Pinned Notes"}
            </h2>

            <p>
              {search
                ? "No pinned notes match your search."
                : "You haven't pinned any notes yet."}
            </p>

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
              >
                Clear Search
              </button>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default PinnedNotes;
