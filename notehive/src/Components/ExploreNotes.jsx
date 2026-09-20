import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SERVER_URL } from "../config/api";
import "./ExploreNotes.css";

const API_URL = `${SERVER_URL}/api`;

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

  // =====================================================
  // MAIN STATES
  // =====================================================

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("latest");

  const [selectedNote, setSelectedNote] = useState(null);

  // =====================================================
  // ACTION STATES
  // =====================================================

  const [likedNotes, setLikedNotes] = useState({});
  const [savedNotes, setSavedNotes] = useState({});
  const [repostedNotes, setRepostedNotes] = useState({});

  const [actionLoading, setActionLoading] = useState({});

  // =====================================================
  // COMMENTS
  // =====================================================

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

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

        // Restore user action states
        if (userId) {
          const likedState = {};
          const savedState = {};
          const repostedState = {};

          fetchedNotes.forEach((note) => {
            const noteId = note._id;

            // NEW BACKEND:
            // likes = number
            // likedBy = array of user IDs

            likedState[noteId] =
              Array.isArray(note.likedBy) &&
              note.likedBy.some(
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
        (a, b) => (b.likes || 0) - (a.likes || 0)
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
  // OPEN NOTE
  // =====================================================

  const openNote = async (note) => {
    setSelectedNote(note);

    // Load comments immediately
    fetchComments(note._id);

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
  // LIKE / UNLIKE NOTE
  // =====================================================

  const handleLike = async (noteId) => {
    if (!userId) {
      alert("Please login to like a note.");
      navigate("/login");
      return;
    }

    if (isButtonLoading(noteId, "like")) {
      return;
    }

    try {
      setButtonLoading(noteId, "like", true);

      const response = await fetch(
        `${API_URL}/explore/${noteId}/like`,
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
        const isLiked = !!data.liked;
        const newLikesCount = Number(data.likes || 0);

        setLikedNotes((prev) => ({
          ...prev,
          [noteId]: isLiked,
        }));

        setNotes((prev) =>
          prev.map((note) =>
            note._id === noteId
              ? {
                  ...note,
                  likes: newLikesCount,
                }
              : note
          )
        );

        setSelectedNote((prev) =>
          prev && prev._id === noteId
            ? {
                ...prev,
                likes: newLikesCount,
              }
            : prev
        );
      } else {
        alert(data.message || "Unable to like note.");
      }
    } catch (error) {
      console.error("Like error:", error);
      alert("Something went wrong while liking the note.");
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
          [noteId]: !!data.saved,
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

        setSelectedNote((prev) =>
          prev && prev._id === noteId
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
          [noteId]: !!data.reposted,
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

        setSelectedNote((prev) =>
          prev && prev._id === noteId
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
  // COMMENTS - FETCH
  // =====================================================

  const fetchComments = async (noteId) => {
    try {
      setCommentsLoading(true);

      const response = await fetch(
        `${API_URL}/explore/${noteId}/comments`
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setComments(data.comments || []);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error("Comments fetch error:", error);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  // =====================================================
  // ADD COMMENT
  // =====================================================

  const handleAddComment = async () => {
    if (!userId) {
      alert("Please login to comment.");
      navigate("/login");
      return;
    }

    if (!selectedNote?._id) {
      return;
    }

    const cleanText = commentText.trim();

    if (!cleanText) {
      return;
    }

    if (commentSubmitting) {
      return;
    }

    try {
      setCommentSubmitting(true);

      const response = await fetch(
        `${API_URL}/explore/${selectedNote._id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            text: cleanText,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setComments((prev) => [
          data.comment,
          ...prev,
        ]);

        setCommentText("");
      } else {
        alert(data.message || "Unable to add comment.");
      }
    } catch (error) {
      console.error("Add comment error:", error);
      alert("Something went wrong while adding comment.");
    } finally {
      setCommentSubmitting(false);
    }
  };

  // =====================================================
  // DELETE COMMENT
  // =====================================================

  const handleDeleteComment = async (commentId) => {
    if (!userId) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/explore/comments/${commentId}`,
        {
          method: "DELETE",
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
        setComments((prev) =>
          prev.filter(
            (comment) => comment._id !== commentId
          )
        );
      } else {
        alert(
          data.message ||
            "Unable to delete comment."
        );
      }
    } catch (error) {
      console.error("Delete comment error:", error);
    }
  };

  // =====================================================
  // SHARE NOTE
  // =====================================================

  const handleShare = async (note) => {
    const shareUrl =
      `${window.location.origin}/explore?note=${note._id}`;

    const shareData = {
      title: note.title || "NoteHive Note",
      text: `Check out this note on NoteHive: ${
        note.title || "Public Note"
      }`,
      url: shareUrl,
    };

    try {
      if (
        navigator.share &&
        typeof navigator.share === "function"
      ) {
        await navigator.share(shareData);
        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        alert("Note link copied!");
        return;
      }

      window.prompt(
        "Copy this NoteHive link:",
        shareUrl
      );
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error("Share error:", error);
      }
    }
  };

  // =====================================================
  // DOWNLOAD ATTACHMENT
  // =====================================================

  const handleDownload = (attachment) => {
    if (!attachment?.path) {
      alert("Attachment not available.");
      return;
    }

    const fileUrl = attachment.path.startsWith("http")
      ? attachment.path
      : `${SERVER_URL}${attachment.path}`;

    const link = document.createElement("a");

    link.href = fileUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.download =
      attachment.originalName ||
      attachment.filename ||
      "NoteHive-file";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeNote = () => {
    setSelectedNote(null);
    setComments([]);
    setCommentText("");
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
              onChange={(e) =>
                setSearch(e.target.value)
              }
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
                  onClick={() =>
                    setCategory(item)
                  }
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
                <option value="latest">
                  Latest
                </option>

                <option value="oldest">
                  Oldest
                </option>

                <option value="views">
                  Most Viewed
                </option>

                <option value="likes">
                  Most Liked
                </option>
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

        {/* EMPTY */}

        {filteredNotes.length === 0 ? (
          <div className="empty-explore">

            <div className="empty-icon">
              📭
            </div>

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

          /* NOTES */

          <div className="notes-grid">

            {filteredNotes.map((note) => {

              const isLiked =
                likedNotes[note._id] || false;

              const isSaved =
                savedNotes[note._id] || false;

              const isReposted =
                repostedNotes[note._id] || false;

              const likesCount =
                Number(note.likes || 0);

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
                    {note.title ||
                      "Untitled Note"}
                  </h3>

                  {/* PREVIEW */}

                  <p className="note-card-preview">
                    {getPreview(note.content)}
                  </p>

                  {/* AUTHOR */}

                  <div className="note-author">

                    <div className="author-avatar">
                      {(
                        note.user?.name ||
                        "U"
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
                        {formatDate(
                          note.createdAt
                        )}
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
                      disabled={isButtonLoading(
                        note._id,
                        "like"
                      )}
                      title={
                        isLiked
                          ? "Unlike note"
                          : "Like note"
                      }
                    >
                      <span className="action-icon">
                        {isLiked ? "♥" : "♡"}
                      </span>

                      <span className="action-text">
                        {isLiked
                          ? "Liked"
                          : "Like"}
                      </span>

                      <span className="action-count">
                        {likesCount}
                      </span>
                    </button>

                    {/* COMMENT */}

                    <button
                      className="explore-action comment-action"
                      onClick={() =>
                        openNote(note)
                      }
                      title="View comments"
                    >
                      <span className="action-icon">
                        💬
                      </span>

                      <span className="action-text">
                        Comment
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
                        {isSaved
                          ? "Saved"
                          : "Save"}
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

                    {note.attachments?.length > 0 && (
                      <span>
                        📎{" "}
                        {note.attachments.length}
                      </span>
                    )}

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

            {/* CLOSE */}

            <button
              className="modal-close"
              onClick={closeNote}
            >
              ×
            </button>

            {/* CATEGORY */}

            <div className="modal-category">
              {selectedNote.category ||
                "Other"}
            </div>

            {/* TITLE */}

            <h2>
              {selectedNote.title ||
                "Untitled Note"}
            </h2>

            {/* AUTHOR */}

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

            {/* STATS */}

            <div className="modal-stats">

              <span>
                👁{" "}
                {selectedNote.views || 0} views
              </span>

              <span>
                ♥{" "}
                {Number(
                  selectedNote.likes || 0
                )}{" "}
                likes
              </span>

              <span>
                🔁{" "}
                {selectedNote.repostCount ??
                  selectedNote.repostedBy?.length ??
                  0}{" "}
                reposts
              </span>

              <span>
                💬 {comments.length} comments
              </span>

            </div>

            {/* CONTENT */}

            <div className="modal-content">

              {selectedNote.content ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html:
                      selectedNote.content,
                  }}
                />
              ) : (
                <p>
                  No content available.
                </p>
              )}

            </div>

            {/* ATTACHMENTS */}

            {selectedNote.attachments?.length > 0 && (
              <div className="modal-attachments">

                <h3>
                  Attachments
                </h3>

                <div className="attachment-list">

                  {selectedNote.attachments.map(
                    (attachment, index) => (
                      <div
                        className="attachment-item"
                        key={
                          attachment._id ||
                          `${attachment.filename}-${index}`
                        }
                      >

                        <div className="attachment-info">
                          <span className="attachment-icon">
                            📎
                          </span>

                          <span className="attachment-name">
                            {attachment.originalName ||
                              attachment.filename ||
                              "Attachment"}
                          </span>
                        </div>

                        <button
                          className="attachment-download"
                          onClick={() =>
                            handleDownload(
                              attachment
                            )
                          }
                        >
                          Download
                        </button>

                      </div>
                    )
                  )}

                </div>

              </div>
            )}

            {/* MODAL ACTIONS */}

            <div className="modal-actions">

              {/* LIKE */}

              <button
                className={
                  likedNotes[
                    selectedNote._id
                  ]
                    ? "modal-action modal-like active"
                    : "modal-action modal-like"
                }
                onClick={() =>
                  handleLike(
                    selectedNote._id
                  )
                }
                disabled={isButtonLoading(
                  selectedNote._id,
                  "like"
                )}
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
                  ? "Unlike"
                  : "Like"}

                <span>
                  {Number(
                    selectedNote.likes || 0
                  )}
                </span>
              </button>

              {/* REPOST */}

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

              {/* SAVE */}

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

              {/* SHARE */}

              <button
                className="modal-action modal-share"
                onClick={() =>
                  handleShare(
                    selectedNote
                  )
                }
              >
                <span className="modal-action-icon">
                  ↗
                </span>

                Share
              </button>

            </div>

            {/* =================================================
                COMMENTS
            ================================================= */}

            <div className="comments-section">

              <div className="comments-header">
                <h3>
                  Comments
                </h3>

                <span>
                  {comments.length}
                </span>
              </div>

              {/* ADD COMMENT */}

              <div className="comment-input-box">

                <textarea
                  value={commentText}
                  onChange={(e) =>
                    setCommentText(
                      e.target.value
                    )
                  }
                  placeholder={
                    userId
                      ? "Write a comment..."
                      : "Login to write a comment..."
                  }
                  maxLength={1000}
                  disabled={
                    !userId ||
                    commentSubmitting
                  }
                />

                <div className="comment-input-bottom">

                  <span>
                    {commentText.length}/1000
                  </span>

                  <button
                    onClick={
                      handleAddComment
                    }
                    disabled={
                      !userId ||
                      !commentText.trim() ||
                      commentSubmitting
                    }
                  >
                    {commentSubmitting
                      ? "Posting..."
                      : "Post Comment"}
                  </button>

                </div>

              </div>

              {/* COMMENT LIST */}

              <div className="comments-list">

                {commentsLoading ? (
                  <div className="comments-loading">
                    Loading comments...
                  </div>
                ) : comments.length === 0 ? (
                  <div className="no-comments">
                    <span>💬</span>
                    <p>
                      No comments yet.
                    </p>
                    <small>
                      Be the first to comment.
                    </small>
                  </div>
                ) : (
                  comments.map((comment) => {

                    const commentUser =
                      comment.user?.name ||
                      "NoteHive User";

                    const isOwnComment =
                      String(
                        comment.user?._id
                      ) === String(userId);

                    return (
                      <div
                        className="comment-item"
                        key={comment._id}
                      >

                        <div className="comment-avatar">
                          {commentUser
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="comment-body">

                          <div className="comment-top">

                            <strong>
                              {commentUser}
                            </strong>

                            <span>
                              {formatDate(
                                comment.createdAt
                              )}
                            </span>

                          </div>

                          <p>
                            {comment.text}
                          </p>

                          {isOwnComment && (
                            <button
                              className="delete-comment-btn"
                              onClick={() =>
                                handleDeleteComment(
                                  comment._id
                                )
                              }
                            >
                              Delete
                            </button>
                          )}

                        </div>

                      </div>
                    );
                  })
                )}

              </div>

            </div>

          </div>

        </div>
      )}
    </div>
  );
}

export default ExploreNotes;