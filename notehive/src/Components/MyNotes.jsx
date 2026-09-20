
import React, { useEffect, useState } from "react";
import "./MyNotes.css";
import { SERVER_URL } from "../config/api";

// =========================================================
// API CONFIG
// =========================================================

const API_URL = `${SERVER_URL}/api/notes`;

function MyNotes() {
  // =========================================================
  // USER ID
  // =========================================================

  const [userId, setUserId] = useState(
    localStorage.getItem("notehive_userId")
  );

  // =========================================================
  // STATES
  // =========================================================

  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [priority, setPriority] = useState("Medium");
  const [completed, setCompleted] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    const storedUserId = localStorage.getItem("notehive_userId");

    setUserId(storedUserId);

    if (!storedUserId) {
      setLoading(false);
      return;
    }

    fetchNotes(storedUserId);
  }, []);

  // =========================================================
  // FETCH NOTES
  // =========================================================

  const fetchNotes = async (currentUserId = userId) => {
    try {
      setLoading(true);

      if (!currentUserId) {
        throw new Error(
          "User ID nahi mili. Please login again."
        );
      }

      const response = await fetch(
        `${API_URL}?userId=${encodeURIComponent(currentUserId)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to fetch notes"
        );
      }

      const formattedNotes = (data.notes || []).map((note) => ({
        id: note._id,

        title: note.title || "",

        content: note.content || "",

        category: note.category || "General",

        priority: note.priority || "Medium",

        completed: Boolean(note.completed),

        pinned: Boolean(note.pinned),

        favorite: Boolean(note.favorite),

        visibility: note.visibility || "private",

        slug: note.slug || "",

        date: note.createdAt
          ? new Date(note.createdAt).toLocaleDateString()
          : "Today",

        attachments: note.attachments || [],
      }));

      setNotes(formattedNotes);
    } catch (error) {
      console.error("FETCH NOTES ERROR:", error);

      alert(
        "Notes fetch nahi ho pa rahi.\n\n" +
          error.message
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FILE CHANGE
  // =========================================================

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const validFiles = files.filter((file) =>
      allowedTypes.includes(file.type)
    );

    if (validFiles.length !== files.length) {
      alert(
        "Only PDF, JPG, PNG, DOC and DOCX files are allowed."
      );
    }

    const sizeValidFiles = validFiles.filter(
      (file) => file.size <= 10 * 1024 * 1024
    );

    if (sizeValidFiles.length !== validFiles.length) {
      alert("Each file must be smaller than 10 MB.");
    }

    setSelectedFiles(sizeValidFiles);

    e.target.value = "";
  };

  // =========================================================
  // SAVE / UPDATE NOTE
  // =========================================================

  const handleSaveNote = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter a note title.");
      return;
    }

    if (!content.trim()) {
      alert("Please enter note content.");
      return;
    }

    const currentUserId =
      localStorage.getItem("notehive_userId");

    if (!currentUserId) {
      alert(
        "User ID nahi mili. Please login again."
      );
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("userId", currentUserId);
      formData.append("title", title.trim());
      formData.append("content", content.trim());
      formData.append("category", category);
      formData.append("priority", priority);
      formData.append("completed", completed);
      formData.append("visibility", "private");

      selectedFiles.forEach((file) => {
        formData.append("attachments", file);
      });

      const url = editingId
        ? `${API_URL}/${editingId}`
        : API_URL;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to save note"
        );
      }

      alert(
        editingId
          ? "Note updated successfully ✅"
          : "Note created successfully ✅"
      );

      closeModal();

      await fetchNotes(currentUserId);
    } catch (error) {
      console.error("SAVE NOTE ERROR:", error);

      alert(
        "Note save nahi ho pa rahi.\n\n" +
          error.message
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // CREATE MODAL
  // =========================================================

  const openCreateModal = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setCategory("General");
    setPriority("Medium");
    setCompleted(false);
    setSelectedFiles([]);
    setShowModal(true);
  };

  // =========================================================
  // EDIT MODAL
  // =========================================================

  const openEditModal = (note) => {
    setEditingId(note.id);
    setTitle(note.title || "");
    setContent(note.content || "");
    setCategory(note.category || "General");
    setPriority(note.priority || "Medium");
    setCompleted(Boolean(note.completed));
    setSelectedFiles([]);
    setShowModal(true);
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setTitle("");
    setContent("");
    setCategory("General");
    setPriority("Medium");
    setCompleted(false);
    setSelectedFiles([]);
  };

  // =========================================================
  // DELETE NOTE
  // =========================================================

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this note?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const currentUserId =
        localStorage.getItem("notehive_userId");

      if (!currentUserId) {
        alert(
          "User ID nahi mili. Please login again."
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/${id}?userId=${encodeURIComponent(
          currentUserId
        )}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to delete note"
        );
      }

      alert("Note deleted successfully ✅");

      await fetchNotes(currentUserId);
    } catch (error) {
      console.error("DELETE ERROR:", error);

      alert(
        "Note delete nahi ho pa rahi.\n\n" +
          error.message
      );
    }
  };

  // =========================================================
  // PIN / UNPIN
  // =========================================================

  const handlePin = async (note) => {
    try {
      const currentUserId =
        localStorage.getItem("notehive_userId");

      if (!currentUserId) {
        alert(
          "User ID nahi mili. Please login again."
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/${note.id}/pin`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            userId: currentUserId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to pin note"
        );
      }

      await fetchNotes(currentUserId);
    } catch (error) {
      console.error("PIN ERROR:", error);

      alert(
        "Pin update nahi ho pa raha.\n\n" +
          error.message
      );
    }
  };

  // =========================================================
  // FAVORITE / UNFAVORITE
  // =========================================================

  const handleFavorite = async (note) => {
    try {
      const currentUserId =
        localStorage.getItem("notehive_userId");

      if (!currentUserId) {
        alert(
          "User ID nahi mili. Please login again."
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/${note.id}/favorite`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            userId: currentUserId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to update favorite"
        );
      }

      await fetchNotes(currentUserId);
    } catch (error) {
      console.error("FAVORITE ERROR:", error);

      alert(
        "Favorite update nahi ho pa raha.\n\n" +
          error.message
      );
    }
  };

  // =========================================================
  // FILTER NOTES
  // =========================================================

  const filteredNotes = notes.filter((note) => {
    const searchText = search.toLowerCase().trim();

    const titleText = note.title.toLowerCase();

    const contentText = note.content.toLowerCase();

    const categoryText = note.category.toLowerCase();

    const matchesSearch =
      titleText.includes(searchText) ||
      contentText.includes(searchText) ||
      categoryText.includes(searchText);

    if (!matchesSearch) {
      return false;
    }

    if (filter === "pinned") {
      return note.pinned;
    }

    if (filter === "favorite") {
      return note.favorite;
    }

    if (filter === "completed") {
      return note.completed;
    }

    if (filter === "high") {
      return note.priority === "High";
    }

    return true;
  });

  // =========================================================
  // FILE SIZE
  // =========================================================

  const formatFileSize = (bytes) => {
    if (!bytes) {
      return "0 Bytes";
    }

    const sizes = [
      "Bytes",
      "KB",
      "MB",
      "GB",
    ];

    const i = Math.floor(
      Math.log(bytes) / Math.log(1024)
    );

    return (
      parseFloat(
        (
          bytes / Math.pow(1024, i)
        ).toFixed(2)
      ) +
      " " +
      sizes[i]
    );
  };

  // =========================================================
  // FILE ICON
  // =========================================================

  const getFileIcon = (type = "") => {
    if (type === "application/pdf") {
      return "📄";
    }

    if (type.includes("image")) {
      return "🖼️";
    }

    if (
      type.includes("word") ||
      type.includes("document")
    ) {
      return "📝";
    }

    return "📎";
  };

  // =========================================================
  // FILE URL
  // =========================================================

  const getFileUrl = (file) => {
    if (!file) {
      return "#";
    }

    if (file.url?.startsWith("http")) {
      return file.url;
    }

    if (file.url) {
      return `${SERVER_URL}${file.url}`;
    }

    if (file.path) {
      const filename = file.path
        .split("\\")
        .pop()
        .split("/")
        .pop();

      return `${SERVER_URL}/uploads/${filename}`;
    }

    return "#";
  };

  // =========================================================
  // NO USER
  // =========================================================

  if (!userId && !loading) {
    return (
      <div className="mynotes-page">
        <div className="notes-empty">
          <div className="empty-note-icon">
            🔐
          </div>

          <h2>
            Please Login First
          </h2>

          <p>
            Your user session was not
            found. Please login again
            to view your notes.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="mynotes-page">
        <div className="notes-empty">
          <div className="empty-note-icon">
            ⏳
          </div>

          <h2>
            Loading Notes...
          </h2>

          <p>
            MongoDB se notes fetch ho
            rahi hain.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div className="mynotes-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mynotes-top">

        <div className="mynotes-heading">

          <div className="heading-icon">
            📝
          </div>

          <div>
            <span>
              NOTEHIVE
            </span>

            <h1>
              My Notes
            </h1>

            <p>
              Capture your ideas.
              Organize your thoughts.
            </p>
          </div>

        </div>

        <button
          className="new-note-btn"
          onClick={openCreateModal}
        >
          <span>＋</span>
          New Note
        </button>

      </div>

      {/* =====================================================
          SEARCH + FILTERS
      ===================================================== */}

      <div className="notes-controls">

        <div className="notes-search-box">

          <span>
            🔍
          </span>

          <input
            type="text"
            placeholder="Search your notes..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          {search && (
            <button
              className="clear-search"
              type="button"
              onClick={() =>
                setSearch("")
              }
            >
              ×
            </button>
          )}

        </div>

        <div className="notes-filters">

          <button
            className={
              filter === "all"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilter("all")
            }
          >
            All Notes
          </button>

          <button
            className={
              filter === "pinned"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilter("pinned")
            }
          >
            📌 Pinned
          </button>

          <button
            className={
              filter === "favorite"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilter("favorite")
            }
          >
            ⭐ Favorites
          </button>

          <button
            className={
              filter === "completed"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilter("completed")
            }
          >
            ✅ Completed
          </button>

          <button
            className={
              filter === "high"
                ? "active"
                : ""
            }
            onClick={() =>
              setFilter("high")
            }
          >
            ⚡ High Priority
          </button>

        </div>

      </div>

      {/* =====================================================
          INFO
      ===================================================== */}

      <div className="notes-info">

        <div>
          <strong>
            {filteredNotes.length}
          </strong>

          <span>
            {filteredNotes.length === 1
              ? " note"
              : " notes"}
          </span>
        </div>

        <span>
          {filter === "all"
            ? "All your notes"
            : filter === "pinned"
            ? "Pinned notes"
            : filter === "favorite"
            ? "Favorite notes"
            : filter === "completed"
            ? "Completed notes"
            : "High priority notes"}
        </span>

      </div>

      {/* =====================================================
          NOTES GRID
      ===================================================== */}

      {filteredNotes.length > 0 ? (

        <div className="professional-notes-grid">

          {filteredNotes.map((note) => (

            <div
              className={
                `professional-note-card ${
                  note.pinned
                    ? "is-pinned"
                    : ""
                } ${
                  note.favorite
                    ? "is-favorite"
                    : ""
                }`
              }
              key={note.id}
            >

              {/* CARD TOP */}

              <div className="card-top">

                <span className="note-date">
                  {note.date}
                </span>

                <div className="card-menu">

                  <button
                    type="button"
                    onClick={() =>
                      handlePin(note)
                    }
                    title={
                      note.pinned
                        ? "Unpin"
                        : "Pin"
                    }
                  >
                    {note.pinned
                      ? "📌"
                      : "📍"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleFavorite(note)
                    }
                    title={
                      note.favorite
                        ? "Remove Favorite"
                        : "Add Favorite"
                    }
                  >
                    {note.favorite
                      ? "⭐"
                      : "☆"}
                  </button>

                </div>

              </div>

              {/* TITLE */}

              <h2>
                {note.title}
              </h2>

              {/* CONTENT */}

              <p>
                {note.content}
              </p>

              {/* CATEGORY + PRIORITY */}

              <div className="note-meta">

                <div className="note-category">
                  📁 {note.category}
                </div>

                <div className="note-priority">
                  ⚡ {note.priority}
                </div>

              </div>

              {/* ATTACHMENTS */}

              {note.attachments &&
                note.attachments.length > 0 && (

                  <div className="note-attachments">

                    <div className="attachment-heading">
                      📎 Attachments
                    </div>

                    {note.attachments.map(
                      (file, index) => (

                        <a
                          className="note-file"
                          key={
                            file.filename ||
                            index
                          }
                          href={getFileUrl(file)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open file"
                        >

                          <span>
                            {getFileIcon(
                              file.type
                            )}
                          </span>

                          <div>

                            <strong>
                              {file.name ||
                                file.originalName ||
                                "Attachment"}
                            </strong>

                            <small>
                              {formatFileSize(
                                file.size
                              )}
                            </small>

                          </div>

                        </a>

                      )
                    )}

                  </div>

                )}

              {/* CARD BOTTOM */}

              <div className="card-bottom">

                <div className="note-status">

                  {note.pinned && (
                    <span>
                      📌 Pinned
                    </span>
                  )}

                  {note.favorite && (
                    <span>
                      ⭐ Favorite
                    </span>
                  )}

                  {note.completed && (
                    <span>
                      ✅ Completed
                    </span>
                  )}

                </div>

                <div className="card-actions">

                  <button
                    type="button"
                    onClick={() =>
                      openEditModal(note)
                    }
                    title="Edit"
                  >
                    ✏️
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(note.id)
                    }
                    title="Delete"
                  >
                    🗑️
                  </button>

                </div>

              </div>

            </div>

          ))}

        </div>

      ) : (

        <div className="notes-empty">

          <div className="empty-note-icon">
            📝
          </div>

          <h2>
            No Notes Found
          </h2>

          <p>
            {search
              ? "No notes match your search."
              : filter === "pinned"
              ? "You don't have any pinned notes yet."
              : filter === "favorite"
              ? "You don't have any favorite notes yet."
              : filter === "completed"
              ? "You don't have any completed notes yet."
              : filter === "high"
              ? "You don't have any high priority notes yet."
              : "Start creating notes to organize your ideas."}
          </p>

          {!search &&
            filter === "all" && (

              <button
                onClick={openCreateModal}
              >
                ＋ Create Your First Note
              </button>

            )}

        </div>

      )}

      {/* =====================================================
          CREATE / EDIT MODAL
      ===================================================== */}

      {showModal && (

        <div className="note-overlay">

          <div className="professional-modal">

            {/* MODAL HEADER */}

            <div className="modal-heading">

              <div>

                <span>
                  NOTEHIVE
                </span>

                <h2>
                  {editingId
                    ? "Edit Note"
                    : "Create New Note"}
                </h2>

              </div>

              <button
                className="modal-close"
                onClick={closeModal}
                type="button"
                disabled={saving}
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSaveNote}
            >

              {/* TITLE */}

              <div className="input-group">

                <label>
                  Note Title
                </label>

                <input
                  type="text"
                  placeholder="Give your note a title..."
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                />

              </div>

              {/* CONTENT */}

              <div className="input-group">

                <label>
                  Note Content
                </label>

                <textarea
                  rows="7"
                  placeholder="Write something here..."
                  value={content}
                  onChange={(e) =>
                    setContent(e.target.value)
                  }
                />

              </div>

              {/* CATEGORY */}

              <div className="input-group">

                <label>
                  Category
                </label>

                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value)
                  }
                >

                  <option value="General">
                    General
                  </option>

                  <option value="Study">
                    Study
                  </option>

                  <option value="Work">
                    Work
                  </option>

                  <option value="Personal">
                    Personal
                  </option>

                  <option value="Project">
                    Project
                  </option>

                </select>

              </div>

              {/* PRIORITY */}

              <div className="input-group">

                <label>
                  Priority
                </label>

                <select
                  value={priority}
                  onChange={(e) =>
                    setPriority(e.target.value)
                  }
                >

                  <option value="Low">
                    Low
                  </option>

                  <option value="Medium">
                    Medium
                  </option>

                  <option value="High">
                    High
                  </option>

                </select>

              </div>

              {/* COMPLETED */}

              <div className="input-group">

                <label className="checkbox-label">

                  <input
                    type="checkbox"
                    checked={completed}
                    onChange={(e) =>
                      setCompleted(
                        e.target.checked
                      )
                    }
                  />

                  <span>
                    Mark as completed
                  </span>

                </label>

              </div>

              {/* FILE UPLOAD */}

              <div className="input-group">

                <label>
                  Attachments
                </label>

                <label className="file-upload-box">

                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={
                      handleFileChange
                    }
                  />

                  <div className="upload-icon">
                    📎
                  </div>

                  <div className="upload-text">

                    <strong>
                      Click to upload files
                    </strong>

                    <span>
                      PDF, JPG, PNG, DOC or
                      DOCX • Max 10 MB each
                    </span>

                  </div>

                </label>

                {/* SELECTED FILES */}

                {selectedFiles.length > 0 && (

                  <div className="selected-files">

                    {selectedFiles.map(
                      (file, index) => (

                        <div
                          className="selected-file"
                          key={index}
                        >

                          <span>
                            {getFileIcon(
                              file.type
                            )}
                          </span>

                          <div>

                            <strong>
                              {file.name}
                            </strong>

                            <small>
                              {formatFileSize(
                                file.size
                              )}
                            </small>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                )}

              </div>

              {/* MODAL BUTTONS */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="modal-cancel"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="modal-save"
                  disabled={saving}
                >

                  {saving
                    ? "Saving..."
                    : editingId
                    ? "✓ Update Note"
                    : "✓ Save Note"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default MyNotes;

