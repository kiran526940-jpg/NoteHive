import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ManageNotes.css";
import AdminHeader from "./Dashboard/Admin/AdminHeader";

const SERVER_URL = "http://192.168.1.68:5000";

const ManageNotes = () => {
  const navigate = useNavigate();

  // =====================================================
  // STATE
  // =====================================================

  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [selectedNote, setSelectedNote] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // =====================================================
  // ADMIN ACCESS
  // =====================================================

  useEffect(() => {
    const adminLoggedIn =
      localStorage.getItem("adminLoggedIn") === "true";

    const userRole = localStorage.getItem("userRole");

    if (!adminLoggedIn || userRole !== "admin") {
      navigate("/admin-login", {
        replace: true,
      });

      return;
    }

    fetchNotes();
  }, [navigate]);

  // =====================================================
  // FETCH NOTES
  // =====================================================

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${SERVER_URL}/api/admin/notes`
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
            `Failed to fetch notes (${response.status})`
        );
      }

      const backendNotes = Array.isArray(data.notes)
        ? data.notes
        : [];

      setNotes(backendNotes);
      setFilteredNotes(backendNotes);

      console.log(
        "✅ Admin notes fetched:",
        backendNotes
      );
    } catch (error) {
      console.error(
        "❌ ADMIN NOTES FETCH ERROR:",
        error
      );

      setNotes([]);
      setFilteredNotes([]);

      setError(
        error.message ||
          "Notes fetch nahi ho pa rahe ❌"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =====================================================
  // SEARCH + FILTER
  // =====================================================

  useEffect(() => {
    let result = [...notes];

    if (search.trim()) {
      const searchText = search
        .toLowerCase()
        .trim();

      result = result.filter((note) => {
        const title =
          note.title?.toLowerCase() || "";

        const content =
          note.content?.toLowerCase() || "";

        const category =
          note.category?.toLowerCase() || "";

        const userName =
          note.user?.name?.toLowerCase() || "";

        const userEmail =
          note.user?.email?.toLowerCase() || "";

        return (
          title.includes(searchText) ||
          content.includes(searchText) ||
          category.includes(searchText) ||
          userName.includes(searchText) ||
          userEmail.includes(searchText)
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

      case "private":
        result = result.filter(
          (note) => note.visibility === "private"
        );
        break;

      case "public":
        result = result.filter(
          (note) => note.visibility === "public"
        );
        break;

      default:
        break;
    }

    setFilteredNotes(result);
  }, [search, filter, notes]);

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = async () => {
    if (refreshing) {
      return;
    }

    setRefreshing(true);

    await fetchNotes();
  };

  // =====================================================
  // DELETE NOTE
  // =====================================================

  const handleDelete = async (noteId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this note?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
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

      setNotes((previousNotes) =>
        previousNotes.filter(
          (note) => note._id !== noteId
        )
      );

      if (selectedNote?._id === noteId) {
        setSelectedNote(null);
        setShowViewModal(false);
      }

      alert(
        data.message ||
          "Note deleted successfully ✅"
      );
    } catch (error) {
      console.error(
        "❌ DELETE ADMIN NOTE ERROR:",
        error
      );

      alert(
        error.message ||
          "Failed to delete note ❌"
      );
    }
  };

  // =====================================================
  // EDIT NOTE
  // =====================================================

  const handleEdit = (note) => {
    alert(
      `Edit functionality for "${note.title}" can be connected to your admin edit page.`
    );
  };

  // =====================================================
  // VIEW NOTE
  // =====================================================

  const handleView = (note) => {
    setSelectedNote(note);
    setShowViewModal(true);
  };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeModal = () => {
    setSelectedNote(null);
    setShowViewModal(false);
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
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

  // =====================================================
  // GET USER NAME
  // =====================================================

  const getUserName = (note) => {
    if (note.user?.name) {
      return note.user.name;
    }

    if (note.user?.email) {
      return note.user.email;
    }

    if (note.userId?.name) {
      return note.userId.name;
    }

    return "Unknown User";
  };

  // =====================================================
  // GET USER EMAIL
  // =====================================================

  const getUserEmail = (note) => {
    return (
      note.user?.email ||
      note.userId?.email ||
      "No email"
    );
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminId");
    localStorage.removeItem("admin");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userRole");
    localStorage.removeItem("notehive_userId");
    localStorage.removeItem("notehive_user");

    navigate("/admin-login", {
      replace: true,
    });
  };

  // =====================================================
  // NAVIGATION
  // =====================================================

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

  const goReports = () => {
    navigate("/admin/reports");
  };

  const goNotifications = () => {
    navigate("/admin/notifications");
  };

  // =====================================================
  // SIDEBAR
  // =====================================================

  const AdminSidebar = () => {
    return (
      <aside className="admin-sidebar">

        <div className="admin-logo">
          <span className="admin-logo-bee">
            🐝
          </span>

          <span>
            NOTEHIVE
          </span>
        </div>

        <p className="admin-panel-title">
          ADMIN PANEL
        </p>

        <nav className="admin-nav">

          <button onClick={goDashboard}>
            <span>📊</span>
            <span>Dashboard</span>
          </button>

          <button onClick={goUsers}>
            <span>👥</span>
            <span>Users</span>
          </button>

          <button onClick={goNotifications}>
            <span>🔔</span>
            <span>Notifications</span>
          </button>

          <button
            className="active"
            onClick={() =>
              navigate("/admin/manage-notes")
            }
          >
            <span>📝</span>
            <span>Notes</span>
          </button>

          <button onClick={goPinned}>
            <span>📌</span>
            <span>Pinned Notes</span>
          </button>

          <button onClick={goFavorites}>
            <span>⭐</span>
            <span>Favorites</span>
          </button>

          <button onClick={goReports}>
            <span>📈</span>
            <span>Reports</span>
          </button>

        </nav>

        <button
          className="admin-logout"
          onClick={handleLogout}
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>

      </aside>
    );
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="admin-page-wrapper">

        {/* 🔥 ADMIN HEADER */}
        <AdminHeader />

        <div className="manage-notes-page">

          <AdminSidebar />

          <main className="manage-notes-main">

            <div className="notes-loading">

              <div className="notes-loader">
                ↻
              </div>

              <h2>
                Loading Notes...
              </h2>

              <p>
                Fetching notes from NoteHive.
              </p>

            </div>

          </main>

        </div>

      </div>
    );
  }

  // =====================================================
  // MAIN RENDER
  // =====================================================

  return (
    <div className="admin-page-wrapper">

      {/* =================================================
          ADMIN HEADER
          🔥 ALWAYS VISIBLE
      ================================================= */}

      <AdminHeader />

      <div className="manage-notes-page">

        {/* =================================================
            SIDEBAR
        ================================================= */}

        <AdminSidebar />

        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <main className="manage-notes-main">

          {/* =================================================
              PAGE HEADER
          ================================================= */}

          <header className="manage-notes-header">

            <div>

              <p className="manage-notes-label">
                ADMINISTRATION
              </p>

              <h1>
                Manage Notes
              </h1>

              <p>
                View and manage all notes created
                on the NoteHive platform.
              </p>

            </div>

            <button
              className={`notes-refresh-button ${
                refreshing
                  ? "refreshing"
                  : ""
              }`}
              onClick={handleRefresh}
              disabled={refreshing}
            >

              <span>
                ↻
              </span>

              {refreshing
                ? "Refreshing..."
                : "Refresh"}

            </button>

          </header>

          {/* =================================================
              SUMMARY CARDS
          ================================================= */}

          <section className="notes-summary">

            <div className="notes-summary-card">

              <div className="notes-summary-icon">
                📝
              </div>

              <div>
                <span>
                  Total Notes
                </span>

                <strong>
                  {notes.length}
                </strong>
              </div>

            </div>

            <div className="notes-summary-card">

              <div className="notes-summary-icon">
                📌
              </div>

              <div>
                <span>
                  Pinned
                </span>

                <strong>
                  {
                    notes.filter(
                      (note) =>
                        note.pinned === true
                    ).length
                  }
                </strong>
              </div>

            </div>

            <div className="notes-summary-card">

              <div className="notes-summary-icon">
                ⭐
              </div>

              <div>
                <span>
                  Favorites
                </span>

                <strong>
                  {
                    notes.filter(
                      (note) =>
                        note.favorite === true
                    ).length
                  }
                </strong>
              </div>

            </div>

            <div className="notes-summary-card">

              <div className="notes-summary-icon">
                ✅
              </div>

              <div>
                <span>
                  Completed
                </span>

                <strong>
                  {
                    notes.filter(
                      (note) =>
                        note.completed === true
                    ).length
                  }
                </strong>
              </div>

            </div>

          </section>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (

            <section className="notes-empty">

              <div className="notes-empty-icon">
                ❌
              </div>

              <h2>
                Failed to Load Notes
              </h2>

              <p>
                {error}
              </p>

              <button
                onClick={fetchNotes}
                className="try-again-button"
              >
                Try Again
              </button>

            </section>

          )}

          {/* =================================================
              CONTENT
          ================================================= */}

          {!error && (

            <>

              {/* =================================================
                  TOOLBAR
              ================================================= */}

              <section className="notes-toolbar">

                <div className="notes-search">

                  <span>
                    🔎
                  </span>

                  <input
                    type="text"
                    placeholder="Search notes, users, category..."
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                  />

                  {search && (

                    <button
                      className="clear-search"
                      onClick={() =>
                        setSearch("")
                      }
                      aria-label="Clear search"
                    >
                      ×
                    </button>

                  )}

                </div>

                <div className="notes-filter">

                  <label>
                    Filter
                  </label>

                  <select
                    value={filter}
                    onChange={(event) =>
                      setFilter(
                        event.target.value
                      )
                    }
                  >

                    <option value="all">
                      All Notes
                    </option>

                    <option value="pinned">
                      Pinned
                    </option>

                    <option value="favorite">
                      Favorites
                    </option>

                    <option value="completed">
                      Completed
                    </option>

                    <option value="private">
                      Private
                    </option>

                    <option value="public">
                      Public
                    </option>

                  </select>

                </div>

              </section>

              {/* =================================================
                  RESULTS INFO
              ================================================= */}

              <div className="notes-results-info">

                <div>

                  <strong>
                    {filteredNotes.length}
                  </strong>

                  <span>
                    {" "}
                    {filteredNotes.length === 1
                      ? "note"
                      : "notes"}{" "}
                    found
                  </span>

                </div>

                {(search ||
                  filter !== "all") && (

                  <button
                    onClick={() => {
                      setSearch("");
                      setFilter("all");
                    }}
                  >
                    Clear filters
                  </button>

                )}

              </div>

              {/* =================================================
                  EMPTY STATE
              ================================================= */}

              {filteredNotes.length === 0 ? (

                <section className="notes-empty">

                  <div className="notes-empty-icon">
                    📝
                  </div>

                  <h2>
                    No Notes Found
                  </h2>

                  <p>
                    {search ||
                    filter !== "all"
                      ? "Try changing your search or filter."
                      : "There are no notes available yet."}
                  </p>

                </section>

              ) : (

                /* =================================================
                   NOTES TABLE
                ================================================= */

                <section className="notes-table-wrapper">

                  <div className="notes-table">

                    {/* TABLE HEADER */}

                    <div className="notes-table-header">

                      <span>
                        Note
                      </span>

                      <span>
                        User
                      </span>

                      <span>
                        Category
                      </span>

                      <span>
                        Status
                      </span>

                      <span>
                        Created
                      </span>

                      <span>
                        Actions
                      </span>

                    </div>

                    {/* TABLE ROWS */}

                    {filteredNotes.map(
                      (note) => (

                        <div
                          className="notes-table-row"
                          key={note._id}
                        >

                          {/* NOTE */}

                          <div className="note-info">

                            <div className="note-mini-icon">
                              📝
                            </div>

                            <div>

                              <h3>
                                {note.title ||
                                  "Untitled Note"}
                              </h3>

                              <p>

                                {note.content
                                  ? note.content
                                      .replace(
                                        /\s+/g,
                                        " "
                                      )
                                      .slice(
                                        0,
                                        70
                                      )
                                  : "No content"}

                                {note.content &&
                                note.content.length >
                                  70
                                  ? "..."
                                  : ""}

                              </p>

                            </div>

                          </div>

                          {/* USER */}

                          <div className="note-user">

                            <div className="user-avatar-small">

                              {getUserName(note)
                                .charAt(0)
                                .toUpperCase()}

                            </div>

                            <div>

                              <strong>
                                {getUserName(note)}
                              </strong>

                              <span>
                                {getUserEmail(note)}
                              </span>

                            </div>

                          </div>

                          {/* CATEGORY */}

                          <div className="note-category">

                            <span className="category-text">
                              {note.category ||
                                "General"}
                            </span>

                          </div>

                          {/* STATUS */}

                          <div className="note-status">

                            {note.pinned && (

                              <span
                                className="status-badge pinned"
                                title="Pinned"
                              >
                                📌
                              </span>

                            )}

                            {note.favorite && (

                              <span
                                className="status-badge favorite"
                                title="Favorite"
                              >
                                ⭐
                              </span>

                            )}

                            {note.completed && (

                              <span
                                className="status-badge completed"
                                title="Completed"
                              >
                                ✓
                              </span>

                            )}

                            {!note.pinned &&
                              !note.favorite &&
                              !note.completed && (

                                <span className="status-none">
                                  —
                                </span>

                              )}

                          </div>

                          {/* CREATED */}

                          <div className="note-created">

                            {formatDate(
                              note.createdAt
                            )}

                          </div>

                          {/* ACTIONS */}

                          <div className="note-actions">

                            <button
                              className="view-note-btn"
                              onClick={() =>
                                handleView(note)
                              }
                              title="View note"
                              aria-label="View note"
                            >
                              👁️
                            </button>

                            <button
                              className="edit-note-btn"
                              onClick={() =>
                                handleEdit(note)
                              }
                              title="Edit note"
                              aria-label="Edit note"
                            >
                              ✏️
                            </button>

                            <button
                              className="delete-note-btn"
                              onClick={() =>
                                handleDelete(
                                  note._id
                                )
                              }
                              title="Delete note"
                              aria-label="Delete note"
                            >
                              🗑️
                            </button>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                </section>

              )}

            </>

          )}

        </main>

      </div>

      {/* =====================================================
          VIEW NOTE MODAL
      ===================================================== */}

      {showViewModal &&
        selectedNote && (

          <div
            className="note-modal-overlay"
            onClick={closeModal}
          >

            <div
              className="note-view-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              {/* MODAL HEADER */}

              <div className="note-modal-header">

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
                  onClick={closeModal}
                  className="modal-close"
                  aria-label="Close modal"
                >
                  ×
                </button>

              </div>

              {/* MODAL BODY */}

              <div className="note-modal-body">

                <div className="modal-meta">

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

                <div className="modal-note-content">

                  <h3>
                    Content
                  </h3>

                  <p>
                    {selectedNote.content ||
                      "No content available."}
                  </p>

                </div>

                <div className="modal-statuses">

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

                  {selectedNote.visibility && (
                    <span>
                      👁️{" "}
                      {selectedNote.visibility}
                    </span>
                  )}

                </div>

              </div>

              {/* MODAL FOOTER */}

              <div className="note-modal-footer">

                <button
                  className="modal-delete-btn"
                  onClick={() =>
                    handleDelete(
                      selectedNote._id
                    )
                  }
                >
                  🗑️ Delete Note
                </button>

                <button
                  className="modal-close-btn"
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