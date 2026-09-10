
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./Dashboard/Admin/AdminHeader";
import "./ManageUsers.css";

const SERVER_URL = "http://192.168.1.68:5000";
const MAIN_ADMIN_EMAIL = "admin@notehive.com";

const ManageUsers = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  /* =========================================================
     ADMIN AUTH CHECK
  ========================================================= */

  useEffect(() => {
    const adminLoggedIn =
      localStorage.getItem("adminLoggedIn") === "true";

    const userRole = localStorage.getItem("userRole");

    if (!adminLoggedIn || userRole !== "admin") {
      navigate("/admin-login", { replace: true });
      return;
    }

    fetchUsers();
  }, [navigate]);

  /* =========================================================
     FETCH USERS
  ========================================================= */

  const fetchUsers = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(
        `${SERVER_URL}/api/admin/users`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch users"
        );
      }

      const userList = Array.isArray(data)
        ? data
        : data.users || [];

      setUsers(userList);
      setFilteredUsers(userList);
    } catch (err) {
      console.error("Fetch users error:", err);

      setError(
        err.message ||
          "Unable to load users. Please check the server."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* =========================================================
     SEARCH + FILTER
  ========================================================= */

  useEffect(() => {
    let result = [...users];

    const searchValue = search.trim().toLowerCase();

    if (searchValue) {
      result = result.filter((user) => {
        const name = String(user.name || "").toLowerCase();
        const email = String(user.email || "").toLowerCase();
        const role = String(user.role || "").toLowerCase();
        const status = String(user.status || "").toLowerCase();
        const id = String(user._id || "").toLowerCase();

        return (
          name.includes(searchValue) ||
          email.includes(searchValue) ||
          role.includes(searchValue) ||
          status.includes(searchValue) ||
          id.includes(searchValue)
        );
      });
    }

    if (filter !== "all") {
      result = result.filter((user) => {
        const role = String(user.role || "").toLowerCase();
        const status = String(user.status || "").toLowerCase();

        if (filter === "pending") {
          return status === "pending";
        }

        if (filter === "approved") {
          return status === "approved";
        }

        if (filter === "rejected") {
          return status === "rejected";
        }

        if (filter === "users") {
          return role === "user";
        }

        if (filter === "admins") {
          return role === "admin";
        }

        return true;
      });
    }

    setFilteredUsers(result);
  }, [users, search, filter]);

  /* =========================================================
     HELPERS
  ========================================================= */

  const isMainAdmin = (user) => {
    return (
      String(user.email || "").toLowerCase() ===
      MAIN_ADMIN_EMAIL.toLowerCase()
    );
  };

  const getUserName = (user) => {
    return user.name || "Unknown User";
  };

  const getUserInitial = (user) => {
    const name = getUserName(user);

    return name.charAt(0).toUpperCase();
  };

  const getProfileImage = (user) => {
    const image =
      user.profileImage ||
      user.profilePhoto ||
      user.avatar ||
      "";

    if (!image) {
      return "";
    }

    if (image.startsWith("data:image")) {
      return image;
    }

    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    if (image.startsWith("/uploads/")) {
      return `${SERVER_URL}${image}`;
    }

    if (image.startsWith("uploads/")) {
      return `${SERVER_URL}/${image}`;
    }

    return `${SERVER_URL}/uploads/${image.replace(/^\/+/, "")}`;
  };

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

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

  /* =========================================================
     APPROVE USER
  ========================================================= */

  const handleApprove = async (userId) => {
    try {
      const response = await fetch(
        `${SERVER_URL}/api/admin/users/${userId}/approve`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to approve user"
        );
      }

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId
            ? {
                ...user,
                status: "approved",
              }
            : user
        )
      );
    } catch (err) {
      console.error("Approve user error:", err);

      alert(
        err.message ||
          "Unable to approve user. Please try again."
      );
    }
  };

  /* =========================================================
     REJECT USER
  ========================================================= */

  const handleReject = async (userId) => {
    const confirmed = window.confirm(
      "Are you sure you want to reject this user?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${SERVER_URL}/api/admin/users/${userId}/reject`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to reject user"
        );
      }

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId
            ? {
                ...user,
                status: "rejected",
              }
            : user
        )
      );
    } catch (err) {
      console.error("Reject user error:", err);

      alert(
        err.message ||
          "Unable to reject user. Please try again."
      );
    }
  };

  /* =========================================================
     DELETE USER
  ========================================================= */

  const handleDelete = async (userId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this user? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${SERVER_URL}/api/users/${userId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete user"
        );
      }

      setUsers((prevUsers) =>
        prevUsers.filter((user) => user._id !== userId)
      );
    } catch (err) {
      console.error("Delete user error:", err);

      alert(
        err.message ||
          "Unable to delete user. Please try again."
      );
    }
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

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

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const goDashboard = () => {
    navigate("/admin-dashboard");
  };

  const goUsers = () => {
    navigate("/admin/manage-users");
  };

  const goNotes = () => {
    navigate("/admin/manage-notes");
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

  /* =========================================================
     CLEAR FILTERS
  ========================================================= */

  const clearFilters = () => {
    setSearch("");
    setFilter("all");
  };

  /* =========================================================
     SUMMARY DATA
  ========================================================= */

  const totalUsers = users.length;

  const approvedUsers = users.filter(
    (user) =>
      String(user.status || "").toLowerCase() ===
      "approved"
  ).length;

  const pendingUsers = users.filter(
    (user) =>
      String(user.status || "").toLowerCase() ===
      "pending"
  ).length;

  const adminUsers = users.filter(
    (user) =>
      String(user.role || "").toLowerCase() ===
      "admin"
  ).length;

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="admin-page-wrapper">
        {/* HEADER IS OUTSIDE THE MAIN FLEX LAYOUT */}
        
          
        </div>
      
    );
  }

  /* =========================================================
     MAIN UI
  ========================================================= */

  return (
    <div className="admin-page-wrapper">
      {/* =====================================================
          ADMIN HEADER
          OUTSIDE SIDEBAR + MAIN FLEX LAYOUT
      ===================================================== */}

      <AdminHeader />

      {/* =====================================================
          EXISTING ADMIN LAYOUT
      ===================================================== */}

      <div className="manage-notes-page">

        {/* ===================================================
            SIDEBAR
        =================================================== */}

        <aside className="admin-sidebar">
          <div className="admin-sidebar-brand">
            <div className="admin-logo">
              <span className="admin-logo-bee">🐝</span>
            </div>

            <div>
              <h2>NOTEHIVE</h2>
              <p>ADMIN PANEL</p>
            </div>
          </div>

          <nav className="admin-nav">

            <button
              type="button"
              onClick={goDashboard}
              className="admin-nav-item"
            >
              <span>📊</span>
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={goUsers}
              className="admin-nav-item active"
            >
              <span>👥</span>
              <span>Users</span>
            </button>

            <button
              type="button"
              onClick={goNotifications}
              className="admin-nav-item"
            >
              <span>🔔</span>
              <span>Notifications</span>
            </button>

            <button
              type="button"
              onClick={goNotes}
              className="admin-nav-item"
            >
              <span>📝</span>
              <span>Notes</span>
            </button>

            <button
              type="button"
              onClick={goPinned}
              className="admin-nav-item"
            >
              <span>📌</span>
              <span>Pinned Notes</span>
            </button>

            <button
              type="button"
              onClick={goFavorites}
              className="admin-nav-item"
            >
              <span>⭐</span>
              <span>Favorites</span>
            </button>

            <button
              type="button"
              onClick={goReports}
              className="admin-nav-item"
            >
              <span>📈</span>
              <span>Reports</span>
            </button>

          </nav>

          <button
            type="button"
            className="admin-logout"
            onClick={handleLogout}
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </aside>

        {/* ===================================================
            MAIN CONTENT
        =================================================== */}

        <main className="manage-notes-main">

          {/* PAGE HEADER */}

          <header className="manage-notes-header">
            <div>
              <p className="manage-notes-label">
                ADMINISTRATION
              </p>

              <h1>Manage Users</h1>

              <p>
                View and manage all users registered on the
                NoteHive platform.
              </p>
            </div>

            <button
              type="button"
              className={`notes-refresh-button ${
                refreshing ? "refreshing" : ""
              }`}
              onClick={() => fetchUsers(true)}
              disabled={refreshing}
            >
              <span>↻</span>

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
                👥
              </div>

              <div>
                <span>Total Users</span>
                <strong>{totalUsers}</strong>
              </div>
            </div>

            <div className="notes-summary-card">
              <div className="notes-summary-icon">
                ✅
              </div>

              <div>
                <span>Approved</span>
                <strong>{approvedUsers}</strong>
              </div>
            </div>

            <div className="notes-summary-card">
              <div className="notes-summary-icon">
                ⏳
              </div>

              <div>
                <span>Pending</span>
                <strong>{pendingUsers}</strong>
              </div>
            </div>

            <div className="notes-summary-card">
              <div className="notes-summary-icon">
                🛡️
              </div>

              <div>
                <span>Admins</span>
                <strong>{adminUsers}</strong>
              </div>
            </div>

          </section>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="notes-error">
              <div>
                <strong>Unable to load users</strong>
                <p>{error}</p>
              </div>

              <button
                type="button"
                onClick={() => fetchUsers()}
              >
                Try Again
              </button>
            </div>
          )}

          {/* =================================================
              TOOLBAR
          ================================================= */}

          <section className="notes-toolbar">

            <div className="notes-search">
              <span>🔎</span>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search users..."
              />
            </div>

            <div className="notes-filter">
              <select
                value={filter}
                onChange={(e) =>
                  setFilter(e.target.value)
                }
              >
                <option value="all">
                  All Users
                </option>

                <option value="pending">
                  Pending
                </option>

                <option value="approved">
                  Approved
                </option>

                <option value="rejected">
                  Rejected
                </option>

                <option value="users">
                  Users
                </option>

                <option value="admins">
                  Admins
                </option>
              </select>
            </div>

          </section>

          {/* =================================================
              RESULTS INFO
          ================================================= */}

          <div className="notes-results-info">

            <span>
              {filteredUsers.length}{" "}
              {filteredUsers.length === 1
                ? "user"
                : "users"}{" "}
              found
            </span>

            {(search || filter !== "all") && (
              <button
                type="button"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            )}

          </div>

          {/* =================================================
              EMPTY STATE
          ================================================= */}

          {filteredUsers.length === 0 ? (
            <div className="notes-empty-state">

              <div className="empty-icon">
                👥
              </div>

              <h3>No users found</h3>

              <p>
                Try changing your search or filter.
              </p>

              {(search || filter !== "all") && (
                <button
                  type="button"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              )}

            </div>
          ) : (
            /* ===============================================
               USERS TABLE
            =============================================== */

            <div className="notes-table-wrapper">

              <div className="notes-table">

                {/* TABLE HEADER */}

                <div className="notes-table-header">

                  <div>User</div>
                  <div>Role</div>
                  <div>Status</div>
                  <div>Joined</div>
                  <div>Actions</div>

                </div>

                {/* TABLE ROWS */}

                {filteredUsers.map((user) => {

                  const profileImage =
                    getProfileImage(user);

                  const role =
                    String(
                      user.role || "user"
                    ).toLowerCase();

                  const status =
                    String(
                      user.status || "pending"
                    ).toLowerCase();

                  const protectedAdmin =
                    isMainAdmin(user);

                  return (
                    <div
                      className="notes-table-row"
                      key={user._id}
                    >

                      {/* USER */}

                      <div className="note-info">

                        <div className="user-avatar-small">

                          {profileImage ? (
                            <img
                              src={profileImage}
                              alt={getUserName(user)}
                              onError={(e) => {
                                e.currentTarget.style.display =
                                  "none";

                                const fallback =
                                  e.currentTarget
                                    .nextElementSibling;

                                if (fallback) {
                                  fallback.style.display =
                                    "flex";
                                }
                              }}
                            />
                          ) : null}

                          <div
                            className="user-avatar-fallback"
                            style={{
                              display: profileImage
                                ? "none"
                                : "flex",
                            }}
                          >
                            {getUserInitial(user)}
                          </div>

                        </div>

                        <div>
                          <strong className="note-user">
                            {getUserName(user)}
                          </strong>

                          <span>
                            {user.email || "No email"}
                          </span>
                        </div>

                      </div>

                      {/* ROLE */}

                      <div>

                        <span
                          className={`note-category ${
                            role === "admin"
                              ? "user-role-admin"
                              : "user-role-user"
                          }`}
                        >
                          {role === "admin"
                            ? "Administrator"
                            : "User"}
                        </span>

                      </div>

                      {/* STATUS */}

                      <div>

                        <span
                          className={`user-status-badge status-${status}`}
                        >
                          {status
                            .charAt(0)
                            .toUpperCase() +
                            status.slice(1)}
                        </span>

                      </div>

                      {/* JOINED */}

                      <div className="note-created">
                        {formatDate(
                          user.createdAt
                        )}
                      </div>

                      {/* ACTIONS */}

                      <div className="note-actions">

                        {protectedAdmin ? (
                          <span className="protected-admin-badge">
                            🔒 Protected
                          </span>
                        ) : (
                          <>
                            {status !== "approved" && (
                              <button
                                type="button"
                                className="view-note-btn"
                                onClick={() =>
                                  handleApprove(
                                    user._id
                                  )
                                }
                                title="Approve user"
                              >
                                ✓
                              </button>
                            )}

                            {status !== "rejected" && (
                              <button
                                type="button"
                                className="edit-note-btn"
                                onClick={() =>
                                  handleReject(
                                    user._id
                                  )
                                }
                                title="Reject user"
                              >
                                ✕
                              </button>
                            )}

                            <button
                              type="button"
                              className="delete-note-btn"
                              onClick={() =>
                                handleDelete(
                                  user._id
                                )
                              }
                              title="Delete user"
                            >
                              🗑
                            </button>
                          </>
                        )}

                      </div>

                    </div>
                  );
                })}

              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default ManageUsers;
