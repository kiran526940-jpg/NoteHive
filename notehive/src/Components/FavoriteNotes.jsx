
import React, { useEffect, useState } from "react";
import "./FavoriteNotes.css";
import { SERVER_URL } from "../config/api";

function FavoriteNotes() {
  const [favoriteNotes, setFavoriteNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // GET CURRENT USER
  // =====================================================

  const userId = localStorage.getItem("notehive_userId");

  // =====================================================
  // API URL
  // =====================================================

  const NOTES_URL = `${SERVER_URL}/api/notes`;

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "";

    const noteDate = new Date(date);

    if (Number.isNaN(noteDate.getTime())) {
      return "";
    }

    const today = new Date();

    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const noteStart = new Date(
      noteDate.getFullYear(),
      noteDate.getMonth(),
      noteDate.getDate()
    );

    const difference =
      todayStart.getTime() - noteStart.getTime();

    const oneDay = 24 * 60 * 60 * 1000;

    if (difference === 0) {
      return "Today";
    }

    if (difference === oneDay) {
      return "Yesterday";
    }

    return noteDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================================
  // FETCH FAVORITE NOTES
  // =====================================================

  const fetchFavoriteNotes = async () => {
    if (!userId) {
      setError("User session not found. Please login again.");
      setFavoriteNotes([]);
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
          data?.message || "Unable to load favorite notes."
        );
      }

      // ===================================================
      // BACKEND CAN RETURN:
      // 1. ARRAY
      // 2. { notes: [] }
      // 3. { data: [] }
      // ===================================================

      const notes = Array.isArray(data)
        ? data
        : Array.isArray(data?.notes)
        ? data.notes
        : Array.isArray(data?.data)
        ? data.data
        : [];

      // ===================================================
      // ONLY FAVORITE NOTES
      // ===================================================

      const favorites = notes.filter(
        (note) => note.favorite === true
      );

      setFavoriteNotes(favorites);
    } catch (err) {
      console.error(
        "Fetch favorite notes error:",
        err
      );

      setError(
        err.message ||
          "Unable to load favorite notes. Please check the server."
      );

      setFavoriteNotes([]);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD NOTES
  // =====================================================

  useEffect(() => {
    fetchFavoriteNotes();
  }, [userId]);

  // =====================================================
  // REMOVE FROM FAVORITES
  // =====================================================

  const handleRemoveFavorite = async (id) => {
    if (!userId) {
      alert("Please login again.");
      return;
    }

    try {
      const response = await fetch(
        `${NOTES_URL}/${id}/favorite`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            favorite: false,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to remove favorite."
        );
      }

      // ===================================================
      // REMOVE IMMEDIATELY FROM UI
      // ===================================================

      setFavoriteNotes((prevNotes) =>
        prevNotes.filter(
          (note) => note._id !== id
        )
      );
    } catch (err) {
      console.error(
        "Remove favorite error:",
        err
      );

      alert(
        err.message ||
          "Unable to remove note from favorites."
      );
    }
  };

  // =====================================================
  // DELETE NOTE
  // =====================================================

  const handleDelete = async (id) => {
    if (!userId) {
      alert("Please login again.");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this note?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        `${NOTES_URL}/${id}?userId=${encodeURIComponent(
          userId
        )}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to delete note."
        );
      }

      // ===================================================
      // REMOVE IMMEDIATELY FROM UI
      // ===================================================

      setFavoriteNotes((prevNotes) =>
        prevNotes.filter(
          (note) => note._id !== id
        )
      );
    } catch (err) {
      console.error(
        "Delete favorite note error:",
        err
      );

      alert(
        err.message ||
          "Unable to delete note. Please try again."
      );
    }
  };

  // =====================================================
  // SEARCH NOTES
  // =====================================================

  const searchText = search.toLowerCase().trim();

  const filteredNotes = favoriteNotes.filter(
    (note) => {
      const title =
        String(note.title || "").toLowerCase();

      const content =
        String(note.content || "").toLowerCase();

      const category =
        String(note.category || "").toLowerCase();

      return (
        title.includes(searchText) ||
        content.includes(searchText) ||
        category.includes(searchText)
      );
    }
  );

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="favorite-page">
        <div className="favorite-empty">
          <div className="favorite-empty-icon">
            ⭐
          </div>

          <h2>
            Loading Favorite Notes...
          </h2>

          <p>
            Please wait while your favorite
            notes are being loaded.
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="favorite-page">

      {/* =========================
          PAGE HEADER
      ========================= */}

      <div className="favorite-header">
        <div className="favorite-title">

          <span className="favorite-label">
            NOTEHIVE
          </span>

          <h1>
            ⭐ Favorite Notes
          </h1>

          <p>
            Keep your most useful and important
            notes in one place.
          </p>

        </div>
      </div>

      {/* =========================
          ERROR
      ========================= */}

      {error && (
        <div className="favorite-empty">

          <div className="favorite-empty-icon">
            ⚠️
          </div>

          <h2>
            Unable to Load Favorites
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={fetchFavoriteNotes}
          >
            Try Again
          </button>

        </div>
      )}

      {/* =========================
          SEARCH TOOLBAR
      ========================= */}

      {!error && (
        <div className="favorite-toolbar">

          <div className="favorite-search">

            <span>
              🔍
            </span>

            <input
              type="text"
              placeholder="Search favorite notes..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              aria-label="Search favorite notes"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                title="Clear Search"
                aria-label="Clear Search"
              >
                ✕
              </button>
            )}

          </div>

          <div className="favorite-count">
            {filteredNotes.length}{" "}
            {filteredNotes.length === 1
              ? "Favorite"
              : "Favorites"}
          </div>

        </div>
      )}

      {/* =========================
          FAVORITE NOTES
      ========================= */}

      {!error &&
        (filteredNotes.length > 0 ? (
          <div className="favorite-grid">

            {filteredNotes.map((note) => (
              <div
                className="favorite-card"
                key={note._id}
              >

                {/* =====================
                    CARD TOP
                ===================== */}

                <div className="favorite-card-top">

                  <span className="favorite-date">
                    {formatDate(
                      note.updatedAt ||
                        note.createdAt
                    )}
                  </span>

                  <div className="favorite-actions">

                    {/* REMOVE FAVORITE */}

                    <button
                      type="button"
                      className="favorite-star"
                      title="Remove from Favorites"
                      aria-label="Remove from Favorites"
                      onClick={() =>
                        handleRemoveFavorite(
                          note._id
                        )
                      }
                    >
                      ⭐
                    </button>

                    {/* DELETE */}

                    <button
                      type="button"
                      className="favorite-delete"
                      title="Delete Note"
                      aria-label="Delete Note"
                      onClick={() =>
                        handleDelete(
                          note._id
                        )
                      }
                    >
                      🗑️
                    </button>

                  </div>

                </div>

                {/* =====================
                    NOTE CONTENT
                ===================== */}

                <h2>
                  {note.title || "Untitled Note"}
                </h2>

                <p>
                  {note.content
                    ? note.content.replace(
                        /<[^>]*>/g,
                        " "
                      )
                    : "No content available."}
                </p>

                {/* =====================
                    CARD FOOTER
                ===================== */}

                <div className="favorite-card-footer">

                  <span>
                    ⭐ Favorite
                  </span>

                </div>

              </div>
            ))}

          </div>
        ) : (
          /* =========================
             EMPTY STATE
          ========================= */

          <div className="favorite-empty">

            <div className="favorite-empty-icon">
              ⭐
            </div>

            <h2>
              {search
                ? "No Matching Favorite Notes"
                : "No Favorite Notes"}
            </h2>

            <p>
              {search
                ? "No favorite notes match your search."
                : "You haven't added any notes to your favorites yet. Mark your important notes with ⭐ to access them quickly."}
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
        ))}
    </div>
  );
}

export default FavoriteNotes;