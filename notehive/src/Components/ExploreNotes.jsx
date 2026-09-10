import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ExploreNotes.css";

const API_URL = "http://192.168.1.68:5000/api";

const categories = [
  "All",
  "Study",
  "Programming",
  "Exam",
  "Personal",
  "Work",
  "Other",
];

function ExploreNotes() {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("latest");

  const [selectedNote, setSelectedNote] = useState(null);

  const [likedNotes, setLikedNotes] = useState({});
  const [savedNotes, setSavedNotes] = useState({});
  const [repostedNotes, setRepostedNotes] = useState({});

  const [actionLoading, setActionLoading] = useState({});

  const userId = localStorage.getItem("notehive_userId");

  // =====================================================
  // FETCH PUBLIC NOTES
  // =====================================================

  const fetchExploreNotes = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/explore/notes?userId=${userId || ""}`
      );

      const data = await response.json();

      if (response.ok && data.success) {
        const fetchedNotes = data.notes || [];

        setNotes(fetchedNotes);

        // Restore Like / Save / Repost state from database
        if (userId) {
          const likedState = {};
          const savedState = {};
          const repostedState = {};

          fetchedNotes.forEach((note) => {
            const noteId = note._id;

            likedState[noteId] =
              Array.isArray(note.likes) &&
              note.likes.some(
                (id) => String(id) === String(userId)
              );

            savedState[noteId] =
              Array.isArray(note.savedBy) &&
              note.savedBy.some(
                (id) => String(id) === String(userId)
              );

            repostedState[noteId] =
              Array.isArray(note.repostedBy) &&
              note.repostedBy.some(
                (id) => String(id) === String(userId)
              );
          });

          setLikedNotes(likedState);
          setSavedNotes(savedState);
          setRepostedNotes(repostedState);
        }
      } else {
        console.error(data.message);
        setNotes([]);
      }
    } catch (error) {
      console.error("Explore notes error:", error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExploreNotes();
  }, []);

  // =====================================================
  // FILTER + SORT
  // =====================================================

  const filteredNotes = useMemo(() => {
    let result = [...notes];

    const searchText = search.trim().toLowerCase();

    if (searchText) {
      result = result.filter((note) => {
        const title = note.title?.toLowerCase() || "";
        const content = note.content?.toLowerCase() || "";
        const noteCategory =
          note.category?.toLowerCase() || "";
        const author =
          note.user?.name?.toLowerCase() || "";

        return (
          title.includes(searchText) ||
          content.includes(searchText) ||
          noteCategory.includes(searchText) ||
          author.includes(searchText)
        );
      });
    }

    if (category !== "All") {
      result = result.filter(
        (note) =>
          note.category?.toLowerCase() ===
          category.toLowerCase()
      );
    }

    if (sortBy === "latest") {
      result.sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
      );
    }

    if (sortBy === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.createdAt || 0) -
          new Date(b.createdAt || 0)
      );
    }

    if (sortBy === "views") {
      result.sort(
        (a, b) => (b.views || 0) - (a.views || 0)
      );
    }

    if (sortBy === "likes") {
      result.sort(
        (a, b) =>
          (b.likesCount || b.likes?.length || 0) -
          (a.likesCount || a.likes?.length || 0)
      );
    }

    return result;
  }, [notes, search, category, sortBy]);

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================================
  // CONTENT PREVIEW
  // =====================================================

  const getPreview = (content) => {
    if (!content) return "No content available.";

    const cleanContent = content
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (cleanContent.length > 120) {
      return cleanContent.substring(0, 120) + "...";
    }

    return cleanContent;
  };

  // =====================================================
  // OPEN NOTE
  // =====================================================

  const openNote = async (note) => {
    setSelectedNote(note);

    try {
      const response = await fetch(
        `${API_URL}/explore/notes/${note._id}/view`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        const newViews = data.views;

        setNotes((prev) =>
          prev.map((item) =>
            item._id === note._id
              ? {
                  ...item,
                  views: newViews,
                }
              : item
          )
        );

        setSelectedNote((prev) =>
          prev
            ? {
                ...prev,
                views: newViews,
              }
            : prev
        );
      }
    } catch (error) {
      console.error("View count error:", error);
    }
  };

  // =====================================================
  // ACTION LOADING
  // =====================================================

  const setButtonLoading = (noteId, action, value) => {
    setActionLoading((prev) => ({
      ...prev,
      [`${action}_${noteId}`]: value,
    }));
  };

  const isButtonLoading = (noteId, action) => {
    return !!actionLoading[`${action}_${noteId}`];
  };

  // =====================================================
  // LIKE NOTE
  // ONE USER = ONE LIKE
  // NO UNLIKE
  // =====================================================

  const handleLike = async (noteId) => {
    if (!userId) {
      alert("Please login to like a note.");
      navigate("/login");
      return;
    }

    // Already liked -> do absolutely nothing
    if (likedNotes[noteId]) {
      return;
    }

    if (isButtonLoading(noteId, "like")) {
      return;
    }

    try {
      setButtonLoading(noteId, "like", true);

      const response = await fetch(
        `${API_URL}/explore/notes/${noteId}/like`,
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

      if (response.ok && data.success) {
        setLikedNotes((prev) => ({
          ...prev,
          [noteId]: true,
        }));

        const newLikesCount =
          data.likesCount ??
          data.likes?.length ??
          0;

        setNotes((prev) =>
          prev.map((note) =>
            note._id === noteId
              ? {
                  ...note,
                  likesCount: newLikesCount,
                  likes: data.note?.likes || note.likes,
                }
              : note
          )
        );

        if (selectedNote?._id === noteId) {
          setSelectedNote((prev) =>
            prev
              ? {
                  ...prev,
                  likesCount: newLikesCount,
                  likes:
                    data.note?.likes || prev.likes,
                }
              : prev
          );
        }
      } else {
        alert(data.message || "Unable to like note.");
      }
    } catch (error) {
      console.error("Like error:", error);
    } finally {
      setButtonLoading(noteId, "like", false);
    }
  };

  // =====================================================
  // SAVE / UNSAVE NOTE
  // =====================================================

  const handleSave = async (noteId) => {
    if (!userId) {
      alert("Please login to save a note.");
      navigate("/login");
      return;
    }

    if (isButtonLoading(noteId, "save")) {
      return;
    }

    try {
      setButtonLoading(noteId, "save", true);

      const response = await fetch(
        `${API_URL}/explore/notes/${noteId}/save`,
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

      if (response.ok && data.success) {
        setSavedNotes((prev) => ({
          ...prev,
          [noteId]: data.saved,
        }));

        setNotes((prev) =>
          prev.map((note) =>
            note._id === noteId
              ? {
                  ...note,
                  savedCount:
                    data.savedCount ??
                    note.savedCount ??
                    0,
                  savedBy:
                    data.note?.savedBy ||
                    note.savedBy,
                }
              : note
          )
        );

        if (selectedNote?._id === noteId) {
          setSelectedNote((prev) =>
            prev
              ? {
                  ...prev,
                  savedCount:
                    data.savedCount ??
                    prev.savedCount ??
                    0,
                  savedBy:
                    data.note?.savedBy ||
                    prev.savedBy,
                }
              : prev
          );
        }
      } else {
        alert(data.message || "Unable to save note.");
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setButtonLoading(noteId, "save", false);
    }
  };

  // =====================================================
  // REPOST / UNREPOST
  // =====================================================

  const handleRepost = async (noteId) => {
    if (!userId) {
      alert("Please login to repost a note.");
      navigate("/login");
      return;
    }

    if (isButtonLoading(noteId, "repost")) {
      return;
    }

    try {
      setButtonLoading(noteId, "repost", true);

      const response = await fetch(
        `${API_URL}/explore/notes/${noteId}/repost`,
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

      if (response.ok && data.success) {
        setRepostedNotes((prev) => ({
          ...prev,
          [noteId]: data.reposted,
        }));

        setNotes((prev) =>
          prev.map((note) =>
            note._id === noteId
              ? {
                  ...note,
                  repostCount:
                    data.repostCount ??
                    note.repostCount ??
                    0,
                  repostedBy:
                    data.note?.repostedBy ||
                    note.repostedBy,
                }
              : note
          )
        );

        if (selectedNote?._id === noteId) {
          setSelectedNote((prev) =>
            prev
              ? {
                  ...prev,
                  repostCount:
                    data.repostCount ??
                    prev.repostCount ??
                    0,
                  repostedBy:
                    data.note?.repostedBy ||
                    prev.repostedBy,
                }
              : prev
          );
        }
      } else {
        alert(data.message || "Unable to repost note.");
      }
    } catch (error) {
      console.error("Repost error:", error);
    } finally {
      setButtonLoading(noteId, "repost", false);
    }
  };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeNote = () => {
    setSelectedNote(null);
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="explore-page">
        <div className="explore-loading">
          <div className="explore-spinner"></div>
          <p>Discovering notes...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="explore-page">
      <div className="explore-container">

        {/* HERO */}

        <section className="explore-hero">
          <div className="explore-hero-content">

            <div className="explore-badge">
              <span>✦</span>
              NoteHive Community
            </div>

            <h1>
              Explore <span>Notes</span>
            </h1>

            <p>
              Discover useful notes, ideas and knowledge
              shared by the NoteHive community.
            </p>

          </div>
        </section>

        {/* SEARCH */}

        <section className="explore-controls">

          <div className="explore-search">
            <span className="search-icon">⌕</span>

            <input
              type="text"
              placeholder="Search notes, topics or categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {search && (
              <button
                className="clear-search"
                onClick={() => setSearch("")}
              >
                ×
              </button>
            )}
          </div>

          <div className="category-row">

            <div className="category-list">
              {categories.map((item) => (
                <button
                  key={item}
                  className={
                    category === item
                      ? "category-btn active"
                      : "category-btn"
                  }
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="sort-box">
              <label>Sort:</label>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value)
                }
              >
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
                <option value="views">Most Viewed</option>
                <option value="likes">Most Liked</option>
              </select>
            </div>

          </div>
        </section>

        {/* RESULT HEADER */}

        <div className="explore-result-header">

          <div>
            <h2>Public Notes</h2>

            <p>
              {filteredNotes.length}{" "}
              {filteredNotes.length === 1
                ? "note"
                : "notes"}{" "}
              found
            </p>
          </div>

          <button
            className="refresh-btn"
            onClick={fetchExploreNotes}
          >
            ↻ Refresh
          </button>

        </div>

        {/* NOTES */}

        {filteredNotes.length === 0 ? (
          <div className="empty-explore">

            <div className="empty-icon">📭</div>

            <h3>No notes found</h3>

            <p>
              Try searching for something else or choose
              another category.
            </p>

            {(search || category !== "All") && (
              <button
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                }}
              >
                Clear Filters
              </button>
            )}

          </div>
        ) : (
          <div className="notes-grid">

            {filteredNotes.map((note) => {

              const isLiked =
                likedNotes[note._id] || false;

              const isSaved =
                savedNotes[note._id] || false;

              const isReposted =
                repostedNotes[note._id] || false;

              const likesCount =
                note.likesCount ??
                note.likes?.length ??
                0;

              const savedCount =
                note.savedCount ??
                note.savedBy?.length ??
                0;

              const repostCount =
                note.repostCount ??
                note.repostedBy?.length ??
                0;

              return (
                <article
                  className="explore-note-card"
                  key={note._id}
                >

                  {/* TOP */}

                  <div className="note-card-top">

                    <span className="note-category">
                      {note.category || "Other"}
                    </span>

                    <button
                      className={
                        isSaved
                          ? "save-btn saved"
                          : "save-btn"
                      }
                      onClick={() =>
                        handleSave(note._id)
                      }
                      disabled={isButtonLoading(
                        note._id,
                        "save"
                      )}
                      title={
                        isSaved
                          ? "Unsave note"
                          : "Save note"
                      }
                    >
                      {isSaved ? "🔖" : "♡"}
                    </button>

                  </div>

                  {/* TITLE */}

                  <h3 className="note-card-title">
                    {note.title || "Untitled Note"}
                  </h3>

                  {/* PREVIEW */}

                  <p className="note-card-preview">
                    {getPreview(note.content)}
                  </p>

                  {/* AUTHOR */}

                  <div className="note-author">

                    <div className="author-avatar">
                      {(
                        note.user?.name || "U"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <strong>
                        {note.user?.name ||
                          "NoteHive User"}
                      </strong>

                      <span>
                        {formatDate(note.createdAt)}
                      </span>
                    </div>

                  </div>

                  {/* ACTIONS */}

                  <div className="note-card-actions">

                    {/* LIKE */}

                    <button
                      className={
                        isLiked
                          ? "explore-action like-action liked"
                          : "explore-action like-action"
                      }
                      onClick={() =>
                        handleLike(note._id)
                      }
                      disabled={
                        isLiked ||
                        isButtonLoading(
                          note._id,
                          "like"
                        )
                      }
                      title={
                        isLiked
                          ? "Already liked"
                          : "Like note"
                      }
                    >
                      <span className="action-icon">
                        {isLiked ? "♥" : "♡"}
                      </span>

                      <span className="action-text">
                        {isLiked ? "Liked" : "Like"}
                      </span>

                      <span className="action-count">
                        {likesCount}
                      </span>
                    </button>

                    {/* REPOST */}

                    <button
                      className={
                        isReposted
                          ? "explore-action repost-action reposted"
                          : "explore-action repost-action"
                      }
                      onClick={() =>
                        handleRepost(note._id)
                      }
                      disabled={isButtonLoading(
                        note._id,
                        "repost"
                      )}
                      title={
                        isReposted
                          ? "Unrepost"
                          : "Repost note"
                      }
                    >
                      <span className="action-icon">
                        🔁
                      </span>

                      <span className="action-text">
                        {isReposted
                          ? "Reposted"
                          : "Repost"}
                      </span>

                      <span className="action-count">
                        {repostCount}
                      </span>
                    </button>

                    {/* SAVE */}

                    <button
                      className={
                        isSaved
                          ? "explore-action save-action saved"
                          : "explore-action save-action"
                      }
                      onClick={() =>
                        handleSave(note._id)
                      }
                      disabled={isButtonLoading(
                        note._id,
                        "save"
                      )}
                      title={
                        isSaved
                          ? "Unsave note"
                          : "Save note"
                      }
                    >
                      <span className="action-icon">
                        {isSaved ? "🔖" : "♡"}
                      </span>

                      <span className="action-text">
                        {isSaved ? "Saved" : "Save"}
                      </span>

                      <span className="action-count">
                        {savedCount}
                      </span>
                    </button>

                  </div>

                  {/* VIEWS */}

                  <div className="note-card-stats">

                    <span>
                      👁 {note.views || 0}
                    </span>

                  </div>

                  {/* READ */}

                  <button
                    className="read-note-btn"
                    onClick={() =>
                      openNote(note)
                    }
                  >
                    Read Note
                    <span>→</span>
                  </button>

                </article>
              );
            })}

          </div>
        )}

      </div>

      {/* =====================================================
          NOTE DETAILS MODAL
      ===================================================== */}

      {selectedNote && (
        <div
          className="note-modal-overlay"
          onClick={closeNote}
        >

          <div
            className="note-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="modal-close"
              onClick={closeNote}
            >
              ×
            </button>

            <div className="modal-category">
              {selectedNote.category || "Other"}
            </div>

            <h2>
              {selectedNote.title ||
                "Untitled Note"}
            </h2>

            <div className="modal-author">

              <div className="author-avatar large">
                {(
                  selectedNote.user?.name ||
                  "U"
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>
                  {selectedNote.user?.name ||
                    "NoteHive User"}
                </strong>

                <span>
                  {formatDate(
                    selectedNote.createdAt
                  )}
                </span>
              </div>

            </div>

            <div className="modal-stats">

              <span>
                👁 {selectedNote.views || 0} views
              </span>

              <span>
                ♥{" "}
                {selectedNote.likesCount ??
                  selectedNote.likes?.length ??
                  0}{" "}
                likes
              </span>

              <span>
                🔁{" "}
                {selectedNote.repostCount ??
                  selectedNote.repostedBy?.length ??
                  0}{" "}
                reposts
              </span>

            </div>

            <div className="modal-content">

              {selectedNote.content ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html:
                      selectedNote.content,
                  }}
                />
              ) : (
                <p>No content available.</p>
              )}

            </div>

            {/* MODAL ACTIONS */}

            <div className="modal-actions">

              <button
                className={
                  likedNotes[selectedNote._id]
                    ? "modal-action modal-like active"
                    : "modal-action modal-like"
                }
                onClick={() =>
                  handleLike(
                    selectedNote._id
                  )
                }
                disabled={
                  likedNotes[
                    selectedNote._id
                  ] ||
                  isButtonLoading(
                    selectedNote._id,
                    "like"
                  )
                }
              >
                <span className="modal-action-icon">
                  {likedNotes[
                    selectedNote._id
                  ]
                    ? "♥"
                    : "♡"}
                </span>

                {likedNotes[
                  selectedNote._id
                ]
                  ? "Liked"
                  : "Like"}

                <span>
                  {selectedNote.likesCount ??
                    selectedNote.likes?.length ??
                    0}
                </span>
              </button>

              <button
                className={
                  repostedNotes[
                    selectedNote._id
                  ]
                    ? "modal-action modal-repost active"
                    : "modal-action modal-repost"
                }
                onClick={() =>
                  handleRepost(
                    selectedNote._id
                  )
                }
                disabled={isButtonLoading(
                  selectedNote._id,
                  "repost"
                )}
              >
                <span className="modal-action-icon">
                  🔁
                </span>

                {repostedNotes[
                  selectedNote._id
                ]
                  ? "Reposted"
                  : "Repost"}

                <span>
                  {selectedNote.repostCount ??
                    selectedNote.repostedBy?.length ??
                    0}
                </span>
              </button>

              <button
                className={
                  savedNotes[
                    selectedNote._id
                  ]
                    ? "modal-action modal-save active"
                    : "modal-action modal-save"
                }
                onClick={() =>
                  handleSave(
                    selectedNote._id
                  )
                }
                disabled={isButtonLoading(
                  selectedNote._id,
                  "save"
                )}
              >
                <span className="modal-action-icon">
                  {savedNotes[
                    selectedNote._id
                  ]
                    ? "🔖"
                    : "♡"}
                </span>

                {savedNotes[
                  selectedNote._id
                ]
                  ? "Saved"
                  : "Save"}

                <span>
                  {selectedNote.savedCount ??
                    selectedNote.savedBy?.length ??
                    0}
                </span>
              </button>

            </div>

          </div>

        </div>
      )}
    </div>
  );
}

export default ExploreNotes;