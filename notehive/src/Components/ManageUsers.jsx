
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./Dashboard/Admin/AdminHeader";
import "./ManageUsers.css";

const SERVER_URL = "http://192.168.1.68:5000";
const MAIN_ADMIN_EMAIL = "admin@notehive.com";

const ManageUsers = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [actionLoading, setActionLoading] = useState("");

  // User Details
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  // ============================================================
  // ADMIN AUTH
  // ============================================================
  useEffect(() => {
    const adminLoggedIn = localStorage.getItem("adminLoggedIn");
    const userRole = localStorage.getItem("userRole");

    if (adminLoggedIn !== "true" || userRole !== "admin") {
      navigate("/admin-login");
    }
  }, [navigate]);

  // ============================================================
  // FETCH USERS
  // ============================================================
  const fetchUsers = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(`${SERVER_URL}/api/admin/users`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load users.");
      }

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.users)
        ? data.users
        : [];

      setUsers(list);
    } catch (err) {
      console.error("Fetch users error:", err);
      setError(err.message || "Unable to load users.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ============================================================
  // HELPERS
  // ============================================================
  const getStatus = (user) => {
    return String(user?.status || "pending").toLowerCase();
  };

  const getRole = (user) => {
    return String(user?.role || "user").toLowerCase();
  };

  const isMainAdmin = (user) => {
    return (
      String(user?.email || "").toLowerCase() ===
      MAIN_ADMIN_EMAIL.toLowerCase()
    );
  };

  const getUserName = (user) => {
    return user?.name?.trim() || "Unnamed User";
  };

  const getUserInitial = (user) => {
    const name = getUserName(user);
    return name.charAt(0).toUpperCase();
  };

  const getProfileImage = (user) => {
    const image = user?.profileImage;

    if (!image) return "";

    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    if (image.startsWith("data:image")) {
      return image;
    }

    if (image.startsWith("/")) {
      return `${SERVER_URL}${image}`;
    }

    return `${SERVER_URL}/${image}`;
  };

  const formatDate = (date) => {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ============================================================
  // FILTER + SEARCH
  // ============================================================
  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        getUserName(user).toLowerCase().includes(query) ||
        String(user?.email || "").toLowerCase().includes(query);

      if (!matchesSearch) return false;

      const status = getStatus(user);
      const role = getRole(user);

      if (filter === "pending") return status === "pending";
      if (filter === "approved") return status === "approved";
      if (filter === "rejected") return status === "rejected";
      if (filter === "users") return role === "user";
      if (filter === "admins") return role === "admin";

      return true;
    });
  }, [users, search, filter]);

  // ============================================================
  // SUMMARY
  // ============================================================
  const totalUsers = users.length;

  const approvedUsers = users.filter(
    (user) => getStatus(user) === "approved"
  ).length;

  const pendingUsers = users.filter(
    (user) => getStatus(user) === "pending"
  ).length;

  const rejectedUsers = users.filter(
    (user) => getStatus(user) === "rejected"
  ).length;

  const adminUsers = users.filter(
    (user) => getRole(user) === "admin"
  ).length;

  // ============================================================
  // USER DETAILS API
  // ============================================================
  const openUserDetails = async (user) => {
    if (!user?._id || isMainAdmin(user)) return;

    setSelectedUser(user);
    setUserDetails(null);
    setDetailsError("");
    setDetailsLoading(true);

    try {
      const response = await fetch(
        `${SERVER_URL}/api/admin/users/${user._id}/details`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load user details."
        );
      }

      setUserDetails(data);
    } catch (err) {
      console.error("User details error:", err);
      setDetailsError(
        err.message || "Unable to load user details."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeUserDetails = () => {
    setSelectedUser(null);
    setUserDetails(null);
    setDetailsLoading(false);
    setDetailsError("");
  };

  // ============================================================
  // APPROVE USER
  // ============================================================
  const handleApprove = async (event, user) => {
    event.stopPropagation();

    if (!user?._id || isMainAdmin(user)) return;

    try {
      setActionLoading(user._id);

      const response = await fetch(
        `${SERVER_URL}/api/admin/users/${user._id}/approve`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Unable to approve user.");
      }

      setUsers((prev) =>
        prev.map((item) =>
          item._id === user._id
            ? { ...item, status: "approved" }
            : item
        )
      );

      setUserDetails((prev) =>
        prev
          ? {
              ...prev,
              user: {
                ...prev.user,
                status: "approved",
              },
            }
          : prev
      );
    } catch (err) {
      console.error("Approve error:", err);
      alert(err.message || "Unable to approve user.");
    } finally {
      setActionLoading("");
    }
  };

  // ============================================================
  // REJECT USER
  // ============================================================
  const handleReject = async (event, user) => {
    event.stopPropagation();

    if (!user?._id || isMainAdmin(user)) return;

    try {
      setActionLoading(user._id);

      const response = await fetch(
        `${SERVER_URL}/api/admin/users/${user._id}/reject`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Unable to reject user.");
      }

      setUsers((prev) =>
        prev.map((item) =>
          item._id === user._id
            ? { ...item, status: "rejected" }
            : item
        )
      );

      setUserDetails((prev) =>
        prev
          ? {
              ...prev,
              user: {
                ...prev.user,
                status: "rejected",
              },
            }
          : prev
      );
    } catch (err) {
      console.error("Reject error:", err);
      alert(err.message || "Unable to reject user.");
    } finally {
      setActionLoading("");
    }
  };

  // ============================================================
  // DELETE USER
  // ============================================================
  const handleDelete = async (event, user) => {
    event.stopPropagation();

    if (!user?._id || isMainAdmin(user)) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${getUserName(user)}?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(user._id);

      const response = await fetch(
        `${SERVER_URL}/api/users/${user._id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Unable to delete user.");
      }

      setUsers((prev) =>
        prev.filter((item) => item._id !== user._id)
      );

      if (selectedUser?._id === user._id) {
        closeUserDetails();
      }
    } catch (err) {
      console.error("Delete user error:", err);
      alert(err.message || "Unable to delete user.");
    } finally {
      setActionLoading("");
    }
  };

  // ============================================================
  // CLEAR FILTERS
  // ============================================================
  const clearFilters = () => {
    setSearch("");
    setFilter("all");
  };

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="manage-users-loading">
        <div className="manage-users-loader">
          <div className="loader-bee">🐝</div>
          <div className="loader-spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="admin-page-wrapper">
      <AdminHeader />

      <main className="manage-users-page">
        {/* PAGE HEADER */}
        <section className="manage-users-heading">
          <div>
            <div className="manage-users-title-row">
              <span className="title-bee">🐝</span>
              <div>
                <h1>Manage Users</h1>
                <p>
                  Manage NoteHive users, accounts and activities.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="refresh-users-btn"
            onClick={() => fetchUsers(true)}
            disabled={refreshing}
          >
            <span className={refreshing ? "refresh-icon spinning" : "refresh-icon"}>
              ↻
            </span>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </section>

        {/* SUMMARY */}
        <section className="users-summary">
          <div className="summary-card summary-total">
            <div className="summary-icon">👥</div>
            <div>
              <span>Total Users</span>
              <strong>{totalUsers}</strong>
            </div>
          </div>

          <div className="summary-card summary-approved">
            <div className="summary-icon">✓</div>
            <div>
              <span>Approved</span>
              <strong>{approvedUsers}</strong>
            </div>
          </div>

          <div className="summary-card summary-pending">
            <div className="summary-icon">⏳</div>
            <div>
              <span>Pending</span>
              <strong>{pendingUsers}</strong>
            </div>
          </div>

          <div className="summary-card summary-rejected">
            <div className="summary-icon">×</div>
            <div>
              <span>Rejected</span>
              <strong>{rejectedUsers}</strong>
            </div>
          </div>

          <div className="summary-card summary-admin">
            <div className="summary-icon">🛡️</div>
            <div>
              <span>Admins</span>
              <strong>{adminUsers}</strong>
            </div>
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="users-error">
            <span>⚠️</span>
            <p>{error}</p>
            <button type="button" onClick={() => fetchUsers()}>
              Retry
            </button>
          </div>
        )}

        {/* SEARCH / FILTER */}
        <section className="users-toolbar">
          <div className="users-search-box">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {search && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setSearch("")}
              >
                ×
              </button>
            )}
          </div>

          <div className="users-filters">
            <button
              type="button"
              className={filter === "all" ? "active" : ""}
              onClick={() => setFilter("all")}
            >
              All
            </button>

            <button
              type="button"
              className={filter === "pending" ? "active" : ""}
              onClick={() => setFilter("pending")}
            >
              Pending
            </button>

            <button
              type="button"
              className={filter === "approved" ? "active" : ""}
              onClick={() => setFilter("approved")}
            >
              Approved
            </button>

            <button
              type="button"
              className={filter === "rejected" ? "active" : ""}
              onClick={() => setFilter("rejected")}
            >
              Rejected
            </button>

            <button
              type="button"
              className={filter === "users" ? "active" : ""}
              onClick={() => setFilter("users")}
            >
              Users
            </button>

            <button
              type="button"
              className={filter === "admins" ? "active" : ""}
              onClick={() => setFilter("admins")}
            >
              Admins
            </button>
          </div>

          {(search || filter !== "all") && (
            <button
              type="button"
              className="clear-filters-btn"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </section>

        {/* RESULTS */}
        <section className="users-results-header">
          <div>
            <h2>Users</h2>
            <span>
              Showing {filteredUsers.length} of {users.length}
            </span>
          </div>

          <span className="click-hint">
            Click a user to view details
          </span>
        </section>

        {/* EMPTY */}
        {filteredUsers.length === 0 ? (
          <div className="users-empty">
            <div className="empty-icon">👤</div>
            <h3>No users found</h3>
            <p>
              {search || filter !== "all"
                ? "Try changing your search or filters."
                : "There are no users available yet."}
            </p>

            {(search || filter !== "all") && (
              <button type="button" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="users-table-card">
            <div className="users-table-wrap">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => {
                    const protectedAdmin = isMainAdmin(user);
                    const image = getProfileImage(user);
                    const status = getStatus(user);
                    const role = getRole(user);
                    const busy = actionLoading === user._id;

                    return (
                      <tr
                        key={user._id}
                        className={
                          protectedAdmin
                            ? "protected-user-row"
                            : "clickable-user-row"
                        }
                        onClick={() => openUserDetails(user)}
                        onKeyDown={(event) => {
                          if (
                            !protectedAdmin &&
                            (event.key === "Enter" ||
                              event.key === " ")
                          ) {
                            event.preventDefault();
                            openUserDetails(user);
                          }
                        }}
                        tabIndex={protectedAdmin ? -1 : 0}
                      >
                        <td>
                          <div className="user-table-profile">
                            <div className="user-avatar">
                              {image ? (
                                <img
                                  src={image}
                                  alt={getUserName(user)}
                                />
                              ) : (
                                <span>
                                  {getUserInitial(user)}
                                </span>
                              )}
                            </div>

                            <div className="user-table-info">
                              <strong>{getUserName(user)}</strong>
                              <span>{user.email || "No email"}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className={`role-badge ${role}`}>
                            {role === "admin" ? "🛡️ Admin" : "👤 User"}
                          </span>
                        </td>

                        <td>
                          <span className={`status-badge ${status}`}>
                            <i></i>
                            {status.charAt(0).toUpperCase() +
                              status.slice(1)}
                          </span>
                        </td>

                        <td>
                          <span className="joined-date">
                            {formatDate(user.createdAt)}
                          </span>
                        </td>

                        <td>
                          <div className="user-actions">
                            {protectedAdmin ? (
                              <span className="protected-badge">
                                🔒 Protected
                              </span>
                            ) : (
                              <>
                                {status === "pending" && (
                                  <>
                                    <button
                                      type="button"
                                      className="action-btn approve"
                                      disabled={busy}
                                      onClick={(event) =>
                                        handleApprove(event, user)
                                      }
                                      title="Approve user"
                                    >
                                      ✓
                                    </button>

                                    <button
                                      type="button"
                                      className="action-btn reject"
                                      disabled={busy}
                                      onClick={(event) =>
                                        handleReject(event, user)
                                      }
                                      title="Reject user"
                                    >
                                      ×
                                    </button>
                                  </>
                                )}

                                <button
                                  type="button"
                                  className="action-btn view"
                                  disabled={busy}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openUserDetails(user);
                                  }}
                                  title="View details"
                                >
                                  👁
                                </button>

                                <button
                                  type="button"
                                  className="action-btn delete"
                                  disabled={busy}
                                  onClick={(event) =>
                                    handleDelete(event, user)
                                  }
                                  title="Delete user"
                                >
                                  🗑
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE USERS */}
            <div className="mobile-users-list">
              {filteredUsers.map((user) => {
                const protectedAdmin = isMainAdmin(user);
                const image = getProfileImage(user);
                const status = getStatus(user);
                const busy = actionLoading === user._id;

                return (
                  <div
                    key={user._id}
                    className="mobile-user-card"
                    onClick={() => openUserDetails(user)}
                  >
                    <div className="mobile-user-top">
                      <div className="user-avatar">
                        {image ? (
                          <img
                            src={image}
                            alt={getUserName(user)}
                          />
                        ) : (
                          <span>{getUserInitial(user)}</span>
                        )}
                      </div>

                      <div className="mobile-user-main">
                        <strong>{getUserName(user)}</strong>
                        <span>{user.email || "No email"}</span>
                      </div>

                      <span className={`status-badge ${status}`}>
                        <i></i>
                        {status}
                      </span>
                    </div>

                    <div className="mobile-user-meta">
                      <span>
                        👤 {user.role || "user"}
                      </span>

                      <span>
                        📅 {formatDate(user.createdAt)}
                      </span>
                    </div>

                    <div className="mobile-user-actions">
                      {protectedAdmin ? (
                        <span className="protected-badge">
                          🔒 Protected
                        </span>
                      ) : (
                        <>
                          {status === "pending" && (
                            <>
                              <button
                                type="button"
                                className="mobile-action approve"
                                disabled={busy}
                                onClick={(event) =>
                                  handleApprove(event, user)
                                }
                              >
                                ✓ Approve
                              </button>

                              <button
                                type="button"
                                className="mobile-action reject"
                                disabled={busy}
                                onClick={(event) =>
                                  handleReject(event, user)
                                }
                              >
                                × Reject
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            className="mobile-action view"
                            disabled={busy}
                            onClick={(event) => {
                              event.stopPropagation();
                              openUserDetails(user);
                            }}
                          >
                            👁 Details
                          </button>

                          <button
                            type="button"
                            className="mobile-action delete"
                            disabled={busy}
                            onClick={(event) =>
                              handleDelete(event, user)
                            }
                          >
                            🗑 Delete
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

      {/* ========================================================
          USER DETAILS MODAL
          ======================================================== */}
      {selectedUser && (
        <div
          className="user-details-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeUserDetails();
            }
          }}
        >
          <div className="user-details-modal">
            {/* HEADER */}
            <div className="details-modal-header">
              <div>
                <span className="details-small-label">
                  NOTEHIVE USER
                </span>
                <h2>User Details</h2>
              </div>

              <button
                type="button"
                className="details-close-btn"
                onClick={closeUserDetails}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {detailsLoading ? (
              <div className="details-loading">
                <div className="details-spinner"></div>
                <p>Loading user details...</p>
              </div>
            ) : detailsError ? (
              <div className="details-error">
                <div>⚠️</div>
                <h3>Unable to load details</h3>
                <p>{detailsError}</p>

                <button
                  type="button"
                  onClick={() => openUserDetails(selectedUser)}
                >
                  Try Again
                </button>
              </div>
            ) : userDetails ? (
              <>
                {/* PROFILE */}
                <div className="details-profile-card">
                  <div className="details-avatar">
                    {userDetails.user.profileImage ? (
                      <img
                        src={
                          userDetails.user.profileImage.startsWith(
                            "http"
                          )
                            ? userDetails.user.profileImage
                            : `${SERVER_URL}${userDetails.user.profileImage}`
                        }
                        alt={userDetails.user.name}
                      />
                    ) : (
                      <span>
                        {userDetails.user.name
                          ?.charAt(0)
                          ?.toUpperCase() || "U"}
                      </span>
                    )}
                  </div>

                  <div className="details-profile-info">
                    <h3>
                      {userDetails.user.name || "Unnamed User"}
                    </h3>

                    <p>
                      {userDetails.user.email || "No email"}
                    </p>

                    <div className="details-badges">
                      <span className="details-role">
                        👤 {userDetails.user.role || "user"}
                      </span>

                      <span
                        className={`details-status ${String(
                          userDetails.user.status
                        ).toLowerCase()}`}
                      >
                        <i></i>
                        {userDetails.user.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* STATS */}
                <div className="user-details-stats">
                  <div className="detail-stat total">
                    <span className="detail-stat-icon">📝</span>
                    <div>
                      <strong>
                        {userDetails.stats.totalNotes}
                      </strong>
                      <span>Total Notes</span>
                    </div>
                  </div>

                  <div className="detail-stat pinned">
                    <span className="detail-stat-icon">📌</span>
                    <div>
                      <strong>
                        {userDetails.stats.pinnedNotes}
                      </strong>
                      <span>Pinned Notes</span>
                    </div>
                  </div>

                  <div className="detail-stat favorite">
                    <span className="detail-stat-icon">⭐</span>
                    <div>
                      <strong>
                        {userDetails.stats.favoriteNotes}
                      </strong>
                      <span>Favorites</span>
                    </div>
                  </div>

                  <div className="detail-stat completed">
                    <span className="detail-stat-icon">✅</span>
                    <div>
                      <strong>
                        {userDetails.stats.completedNotes}
                      </strong>
                      <span>Completed</span>
                    </div>
                  </div>
                </div>

                {/* INFORMATION */}
                <div className="details-section">
                  <div className="details-section-title">
                    <span>👤</span>
                    <h3>Profile Information</h3>
                  </div>

                  <div className="details-info-grid">
                    <div className="details-info-item">
                      <span>Full Name</span>
                      <strong>
                        {userDetails.user.name || "Not added"}
                      </strong>
                    </div>

                    <div className="details-info-item">
                      <span>Email</span>
                      <strong>
                        {userDetails.user.email || "Not added"}
                      </strong>
                    </div>

                    <div className="details-info-item">
                      <span>Profession</span>
                      <strong>
                        {userDetails.user.profession ||
                          "Not added"}
                      </strong>
                    </div>

                    <div className="details-info-item">
                      <span>Location</span>
                      <strong>
                        {userDetails.user.location ||
                          "Not added"}
                      </strong>
                    </div>

                    <div className="details-info-item">
                      <span>Joined</span>
                      <strong>
                        {formatDate(
                          userDetails.user.createdAt
                        )}
                      </strong>
                    </div>

                    <div className="details-info-item">
                      <span>Account Status</span>
                      <strong className="capitalize">
                        {userDetails.user.status || "pending"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* WEBSITE */}
                {userDetails.user.website && (
                  <div className="details-website">
                    <span>🌐</span>
                    <div>
                      <small>Website</small>
                      <a
                        href={userDetails.user.website}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) =>
                          event.stopPropagation()
                        }
                      >
                        {userDetails.user.website}
                      </a>
                    </div>
                  </div>
                )}

                {/* BIO */}
                {userDetails.user.bio && (
                  <div className="details-bio">
                    <div className="details-section-title">
                      <span>💬</span>
                      <h3>About User</h3>
                    </div>

                    <p>{userDetails.user.bio}</p>
                  </div>
                )}

                {/* ACTIONS */}
                {!isMainAdmin(selectedUser) && (
                  <div className="details-actions">
                    {getStatus(selectedUser) === "pending" && (
                      <>
                        <button
                          type="button"
                          className="details-approve-btn"
                          disabled={actionLoading === selectedUser._id}
                          onClick={(event) =>
                            handleApprove(event, selectedUser)
                          }
                        >
                          ✓ Approve User
                        </button>

                        <button
                          type="button"
                          className="details-reject-btn"
                          disabled={actionLoading === selectedUser._id}
                          onClick={(event) =>
                            handleReject(event, selectedUser)
                          }
                        >
                          × Reject User
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      className="details-delete-btn"
                      disabled={actionLoading === selectedUser._id}
                      onClick={(event) =>
                        handleDelete(event, selectedUser)
                      }
                    >
                      🗑 Delete User
                    </button>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
