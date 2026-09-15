import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./Dashboard/Admin/AdminHeader";
import "./ManageNotes.css";

const SERVER_URL = "http://192.168.1.68:5000";

const ManageNotes = () => {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [selectedNote, setSelectedNote] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [actionLoading, setActionLoading] = useState("");

  // ============================================================
  // ADMIN AUTH
  // ============================================================

  useEffect(() => {
    const adminLoggedIn =
      localStorage.getItem("adminLoggedIn") === "true";

    const userRole = localStorage.getItem("userRole");

    if (!adminLoggedIn || userRole !== "admin") {
      navigate("/admin-login", { replace: true });
      return;
    }

    fetchNotes();
  }, [navigate]);

  // ============================================================
  // FETCH NOTES
  // ============================================================

  const fetchNotes = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(
        `${SERVER_URL}/api/admin/notes`
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        throw new Error("Server ne valid response nahi diya.");
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Failed to fetch notes (${response.status})`
        );
      }

      const noteList = Array.isArray(data)
        ? data
        : Array.isArray(data.notes)
        ? data.notes
        : [];

      setNotes(noteList);
    } catch (err) {
      console.error("Fetch notes error:", err);

      setError(
        err.message ||
          "Unable to load notes. Please check the server."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ============================================================
  // USER HELPERS
  // ============================================================

  const getUserName = (note) => {
    return (
      note.user?.name ||
      note.user?.email ||
      note.userId?.name ||
      note.userId?.email ||
      "Unknown User"
    );
  };

  const getUserEmail = (note) => {
    return (
      note.user?.email ||
      note.userId?.email ||
      "No email"
    );
  };

  const getInitial = (note) => {
    return getUserName(note).charAt(0).toUpperCase();
  };

  // ============================================================
  // DATE / STATUS HELPERS
  // ============================================================

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getPriority = (note) => {
    return String(note.priority || "Medium").toLowerCase();
  };

  const getVisibility = (note) => {
    return String(note.visibility || "private").toLowerCase();
  };

  // ============================================================
  // ATTACHMENT HELPERS
  // ============================================================

  const getAttachments = (note) => {
    if (!Array.isArray(note?.attachments)) {
      return [];
    }

    return note.attachments;
  };

  const getAttachmentName = (attachment, index = 0) => {
    if (typeof attachment === "string") {
      const cleanPath = attachment
        .replace(/\\/g, "/")
        .split("?")[0];

      const fileName =
        cleanPath.split("/").pop();

      return fileName || `Attachment ${index + 1}`;
    }

    if (!attachment || typeof attachment !== "object") {
      return `Attachment ${index + 1}`;
    }

    return (
      attachment.originalname ||
      attachment.originalName ||
      attachment.filename ||
      attachment.name ||
      attachment.fileName ||
      attachment.path
        ?.replace(/\\/g, "/")
        ?.split("/")
        ?.pop() ||
      attachment.url
        ?.replace(/\\/g, "/")
        ?.split("/")
        ?.pop() ||
      `Attachment ${index + 1}`
    );
  };

  const getAttachmentRawValue = (attachment) => {
    if (typeof attachment === "string") {
      return attachment;
    }

    if (!attachment || typeof attachment !== "object") {
      return "";
    }

    return (
      attachment.url ||
      attachment.path ||
      attachment.fileUrl ||
      attachment.filePath ||
      attachment.filename ||
      attachment.fileName ||
      attachment.name ||
      ""
    );
  };

  const getAttachmentUrl = (attachment) => {
    const rawValue = String(
      getAttachmentRawValue(attachment) || ""
    )
      .trim()
      .replace(/\\/g, "/");

    if (!rawValue) {
      return "";
    }

    // Already a complete URL
    if (/^https?:\/\//i.test(rawValue)) {
      return rawValue;
    }

    // Remove starting slash
    const cleanPath = rawValue.replace(/^\/+/, "");

    return `${SERVER_URL}/${cleanPath}`;
  };

  const getAttachmentExtension = (attachment, index = 0) => {
    const name = getAttachmentName(
      attachment,
      index
    ).toLowerCase();

    const cleanName = name.split("?")[0];

    if (!cleanName.includes(".")) {
      return "";
    }

    return cleanName
      .split(".")
      .pop()
      .trim();
  };

  const isImageAttachment = (
    attachment,
    index = 0
  ) => {
    const extension =
      getAttachmentExtension(
        attachment,
        index
      );

    return ["jpg", "jpeg", "png"].includes(
      extension
    );
  };

  const isPdfAttachment = (
    attachment,
    index = 0
  ) => {
    return (
      getAttachmentExtension(
        attachment,
        index
      ) === "pdf"
    );
  };

  const isWordAttachment = (
    attachment,
    index = 0
  ) => {
    const extension =
      getAttachmentExtension(
        attachment,
        index
      );

    return ["doc", "docx"].includes(extension);
  };

  const getAttachmentIcon = (
    attachment,
    index = 0
  ) => {
    if (
      isPdfAttachment(
        attachment,
        index
      )
    ) {
      return "📄";
    }

    if (
      isImageAttachment(
        attachment,
        index
      )
    ) {
      return "🖼️";
    }

    if (
      isWordAttachment(
        attachment,
        index
      )
    ) {
      return "📘";
    }

    return "📎";
  };

  // ============================================================
  // FILTERED NOTES
  // ============================================================

  const filteredNotes = useMemo(() => {
    let result = [...notes];

    const searchValue = search.trim().toLowerCase();

    if (searchValue) {
      result = result.filter((note) => {
        const title = String(
          note.title || ""
        ).toLowerCase();

        const content = String(
          note.content || ""
        ).toLowerCase();

        const category = String(
          note.category || ""
        ).toLowerCase();

        const userName = String(
          note.user?.name ||
            note.userId?.name ||
            ""
        ).toLowerCase();

        const userEmail = String(
          note.user?.email ||
            note.userId?.email ||
            ""
        ).toLowerCase();

        return (
          title.includes(searchValue) ||
          content.includes(searchValue) ||
          category.includes(searchValue) ||
          userName.includes(searchValue) ||
          userEmail.includes(searchValue)
        );
      });
    }

    switch (filter) {
      case "pinned":
        result = result.filter(
          (note) => note.pinned === true
        );
        break;

      case "favorite":
        result = result.filter(
          (note) => note.favorite === true
        );
        break;

      case "completed":
        result = result.filter(
          (note) => note.completed === true
        );
        break;

      case "public":
        result = result.filter(
          (note) =>
            getVisibility(note) === "public"
        );
        break;

      case "private":
        result = result.filter(
          (note) =>
            getVisibility(note) === "private"
        );
        break;

      default:
        break;
    }

    return result;
  }, [notes, search, filter]);

  // ============================================================
  // SUMMARY
  // ============================================================

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

  const publicNotes = notes.filter(
    (note) =>
      getVisibility(note) === "public"
  ).length;

  // ============================================================
  // DELETE NOTE
  // ============================================================

  const handleDelete = async (noteId) => {
    const note = notes.find(
      (item) => item._id === noteId
    );

    const confirmed = window.confirm(
      `Are you sure you want to delete "${
        note?.title || "this note"
      }"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setActionLoading(noteId);

      const response = await fetch(
        `${SERVER_URL}/api/admin/notes/${noteId}`,
        {
          method: "DELETE",
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "Server ne valid response nahi diya."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete note"
        );
      }

      setNotes((previous) =>
        previous.filter(
          (item) => item._id !== noteId
        )
      );

      if (
        selectedNote?._id === noteId
      ) {
        setSelectedNote(null);
        setShowViewModal(false);
      }

      alert(
        data.message ||
          "Note deleted successfully ✅"
      );
    } catch (err) {
      console.error(
        "Delete note error:",
        err
      );

      alert(
        err.message ||
          "Unable to delete note."
      );
    } finally {
      setActionLoading("");
    }
  };

  // ============================================================
  // VIEW
  // ============================================================

  const handleView = (note) => {
    setSelectedNote(note);
    setShowViewModal(true);
  };

  const closeModal = () => {
    setSelectedNote(null);
    setShowViewModal(false);
  };

  // ============================================================
  // OPEN ATTACHMENT
  // ============================================================

  const handleOpenAttachment = (
    attachment
  ) => {
    const url =
      getAttachmentUrl(attachment);

    if (!url) {
      alert(
        "Attachment file path nahi mila."
      );
      return;
    }

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // ============================================================
  // CLEAR FILTERS
  // ============================================================

  const clearFilters = () => {
    setSearch("");
    setFilter("all");
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

  const goPinned = () => {
    navigate("/admin/pinned-notes");
  };

  const goFavorites = () => {
    navigate("/admin/favorite-notes");
  };

  const goNotifications = () => {
    navigate("/admin/notifications");
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="manage-notes-page">
        <AdminHeader />

        <main className="manage-notes-loading">
          <div className="manage-notes-loader">
            🐝
          </div>

          <h2>Loading notes...</h2>

          <p>
            Please wait while NoteHive loads all
            notes.
          </p>
        </main>
      </div>
    );
  }

  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <div className="manage-notes-page">
      <AdminHeader />

      <main className="manage-notes-content">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <header className="manage-notes-header">
          <div>
            <span className="manage-notes-label">
              🐝 NOTEHIVE ADMINISTRATION
            </span>

            <h1>Manage Notes</h1>

            <p>
              View and manage all notes created on
              the NoteHive platform.
            </p>
          </div>

          <button
            type="button"
            className={`manage-notes-refresh ${
              refreshing ? "refreshing" : ""
            }`}
            onClick={() =>
              fetchNotes(true)
            }
            disabled={refreshing}
          >
            <span>↻</span>

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </header>

        {/* =====================================================
            SUMMARY
        ===================================================== */}

        <section className="manage-notes-summary">

          <button
            type="button"
            className={`manage-note-summary-card ${
              filter === "all"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setFilter("all")
            }
          >
            <div className="manage-note-summary-icon">
              📝
            </div>

            <div>
              <span>Total Notes</span>
              <strong>{totalNotes}</strong>
            </div>
          </button>

          <button
            type="button"
            className={`manage-note-summary-card ${
              filter === "pinned"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setFilter("pinned")
            }
          >
            <div className="manage-note-summary-icon">
              📌
            </div>

            <div>
              <span>Pinned</span>
              <strong>{pinnedNotes}</strong>
            </div>
          </button>

          <button
            type="button"
            className={`manage-note-summary-card ${
              filter === "favorite"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setFilter("favorite")
            }
          >
            <div className="manage-note-summary-icon">
              ⭐
            </div>

            <div>
              <span>Favorites</span>
              <strong>{favoriteNotes}</strong>
            </div>
          </button>

          <button
            type="button"
            className={`manage-note-summary-card ${
              filter === "completed"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setFilter("completed")
            }
          >
            <div className="manage-note-summary-icon">
              ✅
            </div>

            <div>
              <span>Completed</span>
              <strong>{completedNotes}</strong>
            </div>
          </button>

          <button
            type="button"
            className={`manage-note-summary-card ${
              filter === "public"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setFilter("public")
            }
          >
            <div className="manage-note-summary-icon">
              🌐
            </div>

            <div>
              <span>Public</span>
              <strong>{publicNotes}</strong>
            </div>
          </button>

        </section>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="manage-notes-error">
            <div>
              <strong>
                Unable to load notes
              </strong>

              <p>{error}</p>
            </div>

            <button
              type="button"
              onClick={() =>
                fetchNotes()
              }
            >
              Try Again
            </button>
          </div>
        )}

        {/* =====================================================
            TOOLBAR
        ===================================================== */}

        {!error && (
          <>
            <section className="manage-notes-toolbar">

              <div className="manage-notes-search">
                <span>🔎</span>

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search notes, users, category..."
                />

                {search && (
                  <button
                    type="button"
                    className="manage-notes-clear-search"
                    onClick={() =>
                      setSearch("")
                    }
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="manage-notes-filter">
                <select
                  value={filter}
                  onChange={(e) =>
                    setFilter(
                      e.target.value
                    )
                  }
                >
                  <option value="all">
                    All Notes
                  </option>

                  <option value="pinned">
                    📌 Pinned
                  </option>

                  <option value="favorite">
                    ⭐ Favorites
                  </option>

                  <option value="completed">
                    ✅ Completed
                  </option>

                  <option value="public">
                    🌐 Public
                  </option>

                  <option value="private">
                    🔒 Private
                  </option>
                </select>
              </div>

            </section>

            {/* =================================================
                RESULTS
            ================================================= */}

            <div className="manage-notes-results">
              <span>
                {filteredNotes.length}{" "}
                {filteredNotes.length === 1
                  ? "note"
                  : "notes"}{" "}
                found
              </span>

              {(search ||
                filter !== "all") && (
                <button
                  type="button"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* =================================================
                EMPTY
            ================================================= */}

            {filteredNotes.length === 0 ? (
              <div className="manage-notes-empty">

                <div className="manage-notes-empty-icon">
                  📝
                </div>

                <h3>No notes found</h3>

                <p>
                  Try changing your search or
                  filter.
                </p>

                {(search ||
                  filter !== "all") && (
                  <button
                    type="button"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </button>
                )}

              </div>
            ) : (

              /* =================================================
                 NOTES TABLE
              ================================================= */

              <section className="manage-notes-table-card">

                <div className="manage-notes-table">

                  {/* TABLE HEADER */}

                  <div className="manage-notes-table-header">
                    <div>Note</div>
                    <div>User</div>
                    <div>Category</div>
                    <div>Status</div>
                    <div>Created</div>
                    <div>Actions</div>
                  </div>

                  {/* TABLE ROWS */}

                  {filteredNotes.map(
                    (note) => {
                      const priority =
                        getPriority(
                          note
                        );

                      const visibility =
                        getVisibility(
                          note
                        );

                      const attachments =
                        getAttachments(
                          note
                        );

                      const isActionLoading =
                        actionLoading ===
                        note._id;

                      return (
                        <div
                          className="manage-notes-table-row"
                          key={note._id}
                        >

                          {/* NOTE */}

                          <div className="manage-note-info">

                            <div className="manage-note-mini-icon">
                              📝
                            </div>

                            <div className="manage-note-text">

                              <strong>
                                {note.title ||
                                  "Untitled Note"}
                              </strong>

                              <span>
                                {note.content
                                  ? note.content
                                      .replace(
                                        /\s+/g,
                                        " "
                                      )
                                      .slice(
                                        0,
                                        65
                                      ) +
                                    (note.content
                                      .length >
                                    65
                                      ? "..."
                                      : "")
                                  : "No content"}
                              </span>

                              {/* ATTACHMENT COUNT */}

                              {attachments.length >
                                0 && (
                                <small className="manage-note-attachments-count">
                                  📎{" "}
                                  {
                                    attachments.length
                                  }{" "}
                                  {attachments.length ===
                                  1
                                    ? "attachment"
                                    : "attachments"}
                                </small>
                              )}

                            </div>

                          </div>

                          {/* USER */}

                          <div className="manage-note-user">

                            <div className="manage-note-user-avatar">
                              {getInitial(
                                note
                              )}
                            </div>

                            <div className="manage-note-user-text">
                              <strong>
                                {getUserName(
                                  note
                                )}
                              </strong>

                              <span>
                                {getUserEmail(
                                  note
                                )}
                              </span>
                            </div>

                          </div>

                          {/* CATEGORY */}

                          <div className="manage-note-category-cell">

                            <span>
                              {note.category ||
                                "General"}
                            </span>

                            <small
                              className={`note-priority ${priority}`}
                            >
                              {note.priority ||
                                "Medium"}
                            </small>

                          </div>

                          {/* STATUS */}

                          <div className="manage-note-status-cell">

                            {note.pinned && (
                              <span className="note-status pinned">
                                📌 Pinned
                              </span>
                            )}

                            {note.favorite && (
                              <span className="note-status favorite">
                                ⭐ Favorite
                              </span>
                            )}

                            {note.completed && (
                              <span className="note-status completed">
                                ✓ Completed
                              </span>
                            )}

                            {!note.pinned &&
                              !note.favorite &&
                              !note.completed && (
                                <span className="note-status active">
                                  Active
                                </span>
                              )}

                            <span className="note-visibility">
                              {visibility ===
                              "public"
                                ? "🌐 Public"
                                : "🔒 Private"}
                            </span>

                          </div>

                          {/* CREATED */}

                          <div className="manage-note-date">
                            {formatDate(
                              note.createdAt
                            )}
                          </div>

                          {/* ACTIONS */}

                          <div className="manage-note-actions">

                            <button
                              type="button"
                              className="manage-view-btn"
                              onClick={() =>
                                handleView(
                                  note
                                )
                              }
                              title="View note"
                            >
                              👁️
                            </button>

                            <button
                              type="button"
                              className="manage-delete-btn"
                              onClick={() =>
                                handleDelete(
                                  note._id
                                )
                              }
                              disabled={
                                isActionLoading
                              }
                              title="Delete note"
                            >
                              {isActionLoading
                                ? "..."
                                : "🗑️"}
                            </button>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

              </section>
            )}
          </>
        )}

      </main>

      {/* =====================================================
          MOBILE NAV
      ===================================================== */}

      <nav className="manage-notes-mobile-nav">

        <button
          onClick={goDashboard}
        >
          <span>🏠</span>
          <small>Home</small>
        </button>

        <button
          onClick={goUsers}
        >
          <span>👥</span>
          <small>Users</small>
        </button>

        <button className="active">
          <span>📝</span>
          <small>Notes</small>
        </button>

        <button
          onClick={goPinned}
        >
          <span>📌</span>
          <small>Pinned</small>
        </button>

        <button
          onClick={goFavorites}
        >
          <span>⭐</span>
          <small>Favorites</small>
        </button>

        <button
          onClick={goNotifications}
        >
          <span>🔔</span>
          <small>Alerts</small>
        </button>

      </nav>

      {/* =====================================================
          VIEW MODAL
      ===================================================== */}

      {showViewModal &&
        selectedNote && (
          <div
            className="manage-note-modal-overlay"
            onClick={closeModal}
          >
            <div
              className="manage-note-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* MODAL HEADER */}

              <div className="manage-modal-header">

                <div>
                  <span>
                    NOTE DETAILS
                  </span>

                  <h2>
                    {selectedNote.title ||
                      "Untitled Note"}
                  </h2>
                </div>

                <button
                  type="button"
                  className="manage-modal-close"
                  onClick={closeModal}
                >
                  ×
                </button>

              </div>

              {/* MODAL BODY */}

              <div className="manage-modal-body">

                {/* META */}

                <div className="manage-modal-meta">

                  <div>
                    <span>
                      Created by
                    </span>

                    <strong>
                      {getUserName(
                        selectedNote
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Email
                    </span>

                    <strong>
                      {getUserEmail(
                        selectedNote
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Category
                    </span>

                    <strong>
                      {selectedNote.category ||
                        "General"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Created
                    </span>

                    <strong>
                      {formatDate(
                        selectedNote.createdAt
                      )}
                    </strong>
                  </div>

                </div>

                {/* CONTENT */}

                <div className="manage-modal-content">

                  <h3>Content</h3>

                  <p>
                    {selectedNote.content ||
                      "No content available."}
                  </p>

                </div>

                {/* =================================================
                    ATTACHMENTS
                ================================================= */}

                <div className="manage-modal-attachments">

                  <div className="manage-modal-section-heading">

                    <div>
                      <span className="manage-modal-section-icon">
                        📎
                      </span>

                      <div>
                        <h3>
                          Attachments
                        </h3>

                        <p>
                          {getAttachments(
                            selectedNote
                          ).length > 0
                            ? `${
                                getAttachments(
                                  selectedNote
                                ).length
                              } file${
                                getAttachments(
                                  selectedNote
                                ).length === 1
                                  ? ""
                                  : "s"
                              } attached`
                            : "No files attached to this note"}
                        </p>
                      </div>
                    </div>

                    <span className="manage-attachment-count">
                      {
                        getAttachments(
                          selectedNote
                        ).length
                      }
                    </span>

                  </div>

                  {getAttachments(
                    selectedNote
                  ).length === 0 ? (
                    <div className="manage-no-attachments">
                      <span>📂</span>

                      <div>
                        <strong>
                          No attachments
                        </strong>

                        <p>
                          This note does not
                          have any uploaded
                          files.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="manage-attachment-list">

                      {getAttachments(
                        selectedNote
                      ).map(
                        (
                          attachment,
                          index
                        ) => {
                          const fileName =
                            getAttachmentName(
                              attachment,
                              index
                            );

                          const fileUrl =
                            getAttachmentUrl(
                              attachment
                            );

                          const extension =
                            getAttachmentExtension(
                              attachment,
                              index
                            );

                          const isImage =
                            isImageAttachment(
                              attachment,
                              index
                            );

                          const isPdf =
                            isPdfAttachment(
                              attachment,
                              index
                            );

                          return (
                            <div
                              className="manage-attachment-item"
                              key={`${fileName}-${index}`}
                            >

                              {/* PREVIEW */}

                              <div className="manage-attachment-preview">

                                {isImage &&
                                fileUrl ? (
                                  <img
                                    src={
                                      fileUrl
                                    }
                                    alt={
                                      fileName
                                    }
                                    onError={(
                                      e
                                    ) => {
                                      e.currentTarget.style.display =
                                        "none";
                                    }}
                                  />
                                ) : (
                                  <div className="manage-attachment-file-icon">
                                    {isPdf
                                      ? "📄"
                                      : getAttachmentIcon(
                                          attachment,
                                          index
                                        )}
                                  </div>
                                )}

                              </div>

                              {/* FILE INFO */}

                              <div className="manage-attachment-info">

                                <strong
                                  title={
                                    fileName
                                  }
                                >
                                  {fileName}
                                </strong>

                                <span>
                                  {extension
                                    ? extension.toUpperCase()
                                    : "FILE"}
                                </span>

                              </div>

                              {/* ACTIONS */}

                              <div className="manage-attachment-actions">

                                <button
                                  type="button"
                                  className="manage-attachment-open"
                                  onClick={() =>
                                    handleOpenAttachment(
                                      attachment
                                    )
                                  }
                                  disabled={
                                    !fileUrl
                                  }
                                  title="Open attachment"
                                >
                                  👁️{" "}
                                  <span>
                                    Open
                                  </span>
                                </button>

                                <a
                                  className="manage-attachment-download"
                                  href={
                                    fileUrl ||
                                    "#"
                                  }
                                  download={
                                    fileName
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(
                                    e
                                  ) => {
                                    if (
                                      !fileUrl
                                    ) {
                                      e.preventDefault();

                                      alert(
                                        "Attachment file path nahi mila."
                                      );
                                    }
                                  }}
                                  title="Download attachment"
                                >
                                  ⬇️{" "}
                                  <span>
                                    Download
                                  </span>
                                </a>

                              </div>

                            </div>
                          );
                        }
                      )}

                    </div>
                  )}

                </div>

                {/* STATUS */}

                <div className="manage-modal-statuses">

                  {selectedNote.pinned && (
                    <span>
                      📌 Pinned
                    </span>
                  )}

                  {selectedNote.favorite && (
                    <span>
                      ⭐ Favorite
                    </span>
                  )}

                  {selectedNote.completed && (
                    <span>
                      ✅ Completed
                    </span>
                  )}

                  <span>
                    {getVisibility(
                      selectedNote
                    ) === "public"
                      ? "🌐 Public"
                      : "🔒 Private"}
                  </span>

                </div>

              </div>

              {/* FOOTER */}

              <div className="manage-modal-footer">

                <button
                  type="button"
                  className="manage-modal-delete"
                  onClick={() =>
                    handleDelete(
                      selectedNote._id
                    )
                  }
                >
                  🗑️ Delete Note
                </button>

                <button
                  type="button"
                  className="manage-modal-close-btn"
                  onClick={closeModal}
                >
                  Close
                </button>

              </div>

            </div>
          </div>
        )}

    </div>
  );
};

export default ManageNotes;