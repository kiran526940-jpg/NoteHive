import React, { useEffect, useState } from "react";
import "./Notifications.css";
import { API_URL, SERVER_URL } from "../config/api";

const Notifications = () => {
  // ======================================================
  // USER ID
  // ======================================================

  const userId = localStorage.getItem("notehive_userId");

  // ======================================================
  // NOTIFICATIONS
  // ======================================================

  const [notificationList, setNotificationList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loadingNotifications, setLoadingNotifications] =
    useState(true);

  const [notificationError, setNotificationError] =
    useState("");

  // ======================================================
  // MESSAGE
  // ======================================================

  const [message, setMessage] = useState("");

  // ======================================================
  // SHOW MESSAGE
  // ======================================================

  const showMessage = (text, duration = 2500) => {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, duration);
  };

  // ======================================================
  // SAFE JSON RESPONSE
  // ======================================================

  const getResponseData = async (response) => {
    try {
      return await response.json();
    } catch (error) {
      console.error(
        "Notification JSON response error:",
        error
      );

      return {};
    }
  };

  // ======================================================
  // FETCH NOTIFICATIONS
  // ======================================================

  const fetchNotificationList = async () => {
    const currentUserId =
      localStorage.getItem("notehive_userId");

    if (!currentUserId) {
      setNotificationList([]);
      setUnreadCount(0);

      setNotificationError(
        "User session not found. Please login again."
      );

      setLoadingNotifications(false);

      return;
    }

    try {
      setLoadingNotifications(true);
      setNotificationError("");

      const response = await fetch(
        `${API_URL}/notifications/${encodeURIComponent(
          currentUserId
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data =
        await getResponseData(response);

      console.log(
        "🔔 Notifications API:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to fetch notifications."
        );
      }

      const notifications =
        Array.isArray(data?.notifications)
          ? data.notifications
          : Array.isArray(data)
          ? data
          : [];

      setNotificationList(
        notifications
      );

      const calculatedUnreadCount =
        notifications.filter(
          (notification) =>
            !notification.isRead
        ).length;

      const serverUnreadCount =
        Number(data?.unreadCount);

      if (
        Number.isFinite(
          serverUnreadCount
        )
      ) {
        setUnreadCount(
          serverUnreadCount
        );
      } else {
        setUnreadCount(
          calculatedUnreadCount
        );
      }

    } catch (error) {
      console.error(
        "❌ Notification fetch error:",
        error
      );

      setNotificationError(
        error.message ||
          "Failed to load notifications."
      );

      setNotificationList([]);
      setUnreadCount(0);

    } finally {
      setLoadingNotifications(false);
    }
  };

  // ======================================================
  // INITIAL LOAD
  // ======================================================

  useEffect(() => {
    fetchNotificationList();
  }, [userId]);

  // ======================================================
  // MARK ONE NOTIFICATION AS READ
  // ======================================================

  const markAsRead = async (
    notificationId
  ) => {
    if (!notificationId) {
      return;
    }

    try {
      const notification =
        notificationList.find(
          (item) =>
            item._id === notificationId
        );

      if (
        !notification ||
        notification.isRead
      ) {
        return;
      }

      const response = await fetch(
        `${API_URL}/notifications/${encodeURIComponent(
          notificationId
        )}/read`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data =
        await getResponseData(response);

      console.log(
        "✓ Mark notification read:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to mark notification as read."
        );
      }

      setNotificationList(
        (previous) =>
          previous.map(
            (item) =>
              item._id ===
              notificationId
                ? {
                    ...item,
                    isRead: true,
                  }
                : item
          )
      );

      setUnreadCount(
        (previous) =>
          previous > 0
            ? previous - 1
            : 0
      );

      showMessage(
        "Notification marked as read ✅"
      );

    } catch (error) {
      console.error(
        "❌ Mark notification read error:",
        error
      );

      showMessage(
        "Failed to mark notification as read ❌",
        3000
      );
    }
  };

  // ======================================================
  // MARK ALL AS READ
  // ======================================================

  const markAllAsRead = async () => {
    const currentUserId =
      localStorage.getItem("notehive_userId");

    if (
      !currentUserId ||
      unreadCount === 0
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/notifications/${encodeURIComponent(
          currentUserId
        )}/read-all`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data =
        await getResponseData(response);

      console.log(
        "✓ Mark all notifications read:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to mark all notifications as read."
        );
      }

      setNotificationList(
        (previous) =>
          previous.map(
            (notification) => ({
              ...notification,
              isRead: true,
            })
          )
      );

      setUnreadCount(0);

      showMessage(
        "All notifications marked as read ✅"
      );

    } catch (error) {
      console.error(
        "❌ Mark all read error:",
        error
      );

      showMessage(
        "Failed to mark all notifications as read ❌",
        3000
      );
    }
  };

  // ======================================================
  // DELETE ONE NOTIFICATION
  // ======================================================

  const deleteNotification = async (
    notificationId
  ) => {
    const currentUserId =
      localStorage.getItem("notehive_userId");

    if (!currentUserId) {
      showMessage(
        "Please login again ❌",
        3000
      );

      return;
    }

    if (!notificationId) {
      return;
    }

    try {
      const notification =
        notificationList.find(
          (item) =>
            item._id === notificationId
        );

      const response = await fetch(
        `${API_URL}/notifications/${encodeURIComponent(
          notificationId
        )}?userId=${encodeURIComponent(
          currentUserId
        )}`,
        {
          method: "DELETE",
        }
      );

      const data =
        await getResponseData(response);

      console.log(
        "🗑️ Delete notification:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to delete notification."
        );
      }

      setNotificationList(
        (previous) =>
          previous.filter(
            (item) =>
              item._id !==
              notificationId
          )
      );

      if (
        notification &&
        !notification.isRead
      ) {
        setUnreadCount(
          (previous) =>
            previous > 0
              ? previous - 1
              : 0
        );
      }

      showMessage(
        "Notification deleted successfully ✅"
      );

    } catch (error) {
      console.error(
        "❌ Delete notification error:",
        error
      );

      showMessage(
        "Failed to delete notification ❌",
        3000
      );
    }
  };

  // ======================================================
  // DELETE ALL NOTIFICATIONS
  // ======================================================

  const deleteAllNotifications = async () => {
    const currentUserId =
      localStorage.getItem("notehive_userId");

    if (
      !currentUserId ||
      notificationList.length === 0
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete all notifications?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/notifications/user/${encodeURIComponent(
          currentUserId
        )}`,
        {
          method: "DELETE",
        }
      );

      const data =
        await getResponseData(response);

      console.log(
        "🗑️ Delete all notifications:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to delete notifications."
        );
      }

      setNotificationList([]);
      setUnreadCount(0);

      showMessage(
        "All notifications deleted successfully ✅"
      );

    } catch (error) {
      console.error(
        "❌ Delete all notifications error:",
        error
      );

      showMessage(
        "Failed to delete notifications ❌",
        3000
      );
    }
  };

  // ======================================================
  // FORMAT DATE
  // ======================================================

  const formatNotificationDate = (
    date
  ) => {
    if (!date) {
      return "";
    }

    const notificationDate =
      new Date(date);

    if (
      Number.isNaN(
        notificationDate.getTime()
      )
    ) {
      return "";
    }

    return notificationDate.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // ======================================================
  // PROFILE IMAGE URL
  // ======================================================

  const getProfileImage = (
    profileImage
  ) => {
    if (!profileImage) {
      return "";
    }

    if (
      profileImage.startsWith(
        "http://"
      ) ||
      profileImage.startsWith(
        "https://"
      )
    ) {
      return profileImage;
    }

    return `${SERVER_URL}${
      profileImage.startsWith("/")
        ? ""
        : "/"
    }${profileImage}`;
  };

  // ======================================================
  // NOTIFICATION ICON
  // ======================================================

  const getNotificationIcon = (
    type
  ) => {
    switch (type) {
      case "note_liked":
        return "❤️";

      case "note_saved":
        return "🔖";

      case "note_created":
        return "📝";

      case "note_pinned":
        return "📌";

      case "note_unpinned":
        return "📍";

      case "note_favorite":
        return "⭐";

      case "note_unfavorite":
        return "☆";

      case "note_unliked":
        return "💔";

      case "note_unsaved":
        return "📂";

      case "login":
        return "👋";

      case "welcome":
        return "🐝";

      case "password_changed":
        return "🔐";

      case "admin_note_updated":
        return "✏️";

      case "admin_note_deleted":
        return "🗑️";

      case "general":
      default:
        return "🔔";
    }
  };

  // ======================================================
  // LOGIN REQUIRED
  // ======================================================

  if (!userId) {
    return (
      <div className="notifications-page">

        <div className="notifications-empty">

          <div className="empty-icon">
            🔒
          </div>

          <h2>
            Login Required
          </h2>

          <p>
            Please login to manage your
            notifications.
          </p>

          <button
            type="button"
            onClick={() => {
              window.location.href =
                "/login";
            }}
          >
            Go to Login
          </button>

        </div>

      </div>
    );
  }

  // ======================================================
  // MAIN UI
  // ======================================================

  return (
    <div className="notifications-page">

      <div className="notifications-container">

        {/* ==================================================
            NOTIFICATIONS COVER
        ================================================== */}

        <div className="notifications-cover">

          <div className="notifications-heading">

            <div className="notification-main-icon">
              🔔
            </div>

            <div className="notifications-cover-text">

              <span className="notifications-small-label">
                NOTEHIVE
              </span>

              <h1>
                Notifications
              </h1>

              <p>
                Stay updated with your NoteHive activity.
              </p>

            </div>

          </div>

          <div className="notification-header-actions">

            <button
              type="button"
              className="notification-refresh-btn"
              onClick={fetchNotificationList}
              disabled={loadingNotifications}
            >
              🔄 Refresh
            </button>

          </div>

        </div>

        {/* ==================================================
            MESSAGE
        ================================================== */}

        {message && (
          <div
            className={`notification-message ${
              message.includes("❌")
                ? "error"
                : "success"
            }`}
          >
            {message}
          </div>
        )}

        {/* ==================================================
            ACTUAL NOTIFICATIONS
        ================================================== */}

        <div className="notifications-card actual-notifications-card">

          <div className="notifications-card-header">

            <div>

              <h2>
                Recent Notifications
              </h2>

              <p>
                Your latest NoteHive
                updates and activities.
              </p>

            </div>

            <div className="notification-actions">

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="mark-all-btn"
                >
                  ✓ Mark all as read
                </button>
              )}

              {notificationList.length > 0 && (
                <button
                  type="button"
                  onClick={
                    deleteAllNotifications
                  }
                  className="clear-all-btn"
                >
                  🗑️ Clear all
                </button>
              )}

            </div>

          </div>

          {/* ==================================================
              COUNT
          ================================================== */}

          <div className="notification-count-row">

            <span>
              Total:{" "}
              <strong>
                {notificationList.length}
              </strong>
            </span>

            <span>
              Unread:{" "}
              <strong>
                {unreadCount}
              </strong>
            </span>

          </div>

          {/* ==================================================
              LOADING
          ================================================== */}

          {loadingNotifications && (
            <div className="notifications-loading">

              <div className="notification-spinner"></div>

              <p>
                Loading notifications...
              </p>

            </div>
          )}

          {/* ==================================================
              ERROR
          ================================================== */}

          {!loadingNotifications &&
            notificationError && (
              <div className="notifications-empty">

                <div className="empty-icon">
                  ⚠️
                </div>

                <h3>
                  Unable to load notifications
                </h3>

                <p>
                  {notificationError}
                </p>

                <button
                  type="button"
                  onClick={
                    fetchNotificationList
                  }
                >
                  Try Again
                </button>

              </div>
            )}

          {/* ==================================================
              EMPTY
          ================================================== */}

          {!loadingNotifications &&
            !notificationError &&
            notificationList.length === 0 && (
              <div className="notifications-empty">

                <div className="empty-icon">
                  🔔
                </div>

                <h3>
                  No notifications yet
                </h3>

                <p>
                  You're all caught up!
                  New NoteHive activity
                  will appear here.
                </p>

              </div>
            )}

          {/* ==================================================
              NOTIFICATION LIST
          ================================================== */}

          {!loadingNotifications &&
            !notificationError &&
            notificationList.length > 0 && (
              <div className="notification-list">

                {notificationList.map(
                  (notification) => {

                    const isUnread =
                      !notification.isRead;

                    const senderImage =
                      getProfileImage(
                        notification
                          .sender
                          ?.profileImage
                      );

                    return (
                      <div
                        key={
                          notification._id
                        }
                        className={`notification-list-item ${
                          isUnread
                            ? "unread"
                            : "read"
                        }`}
                      >

                        <div className="notification-list-icon">
                          {getNotificationIcon(
                            notification.type
                          )}
                        </div>

                        <div className="notification-list-content">

                          <div className="notification-title-row">

                            <h3>
                              {
                                notification.title ||
                                "Notification"
                              }
                            </h3>

                            {isUnread && (
                              <span className="unread-badge">
                                New
                              </span>
                            )}

                          </div>

                          <p>
                            {
                              notification.message ||
                              "You have a new NoteHive notification."
                            }
                          </p>

                          {/* ==============================
                              SENDER
                          ============================== */}

                          {notification.sender && (
                            <div className="notification-sender">

                              {senderImage ? (
                                <img
                                  src={
                                    senderImage
                                  }
                                  alt={
                                    notification
                                      .sender
                                      .name ||
                                    "User"
                                  }
                                />
                              ) : (
                                <span className="notification-sender-avatar">

                                  {(
                                    notification
                                      .sender
                                      .name ||
                                    "U"
                                  )
                                    .charAt(0)
                                    .toUpperCase()}

                                </span>
                              )}

                              <span>
                                {
                                  notification
                                    .sender
                                    .name ||
                                  "NoteHive User"
                                }
                              </span>

                            </div>
                          )}

                          <span className="notification-date">
                            {formatNotificationDate(
                              notification.createdAt
                            )}
                          </span>

                        </div>

                        <div className="notification-list-actions">

                          {isUnread && (
                            <button
                              type="button"
                              onClick={() =>
                                markAsRead(
                                  notification._id
                                )
                              }
                              title="Mark as read"
                              aria-label="Mark as read"
                            >
                              ✓
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              deleteNotification(
                                notification._id
                              )
                            }
                            title="Delete notification"
                            aria-label="Delete notification"
                          >
                            🗑️
                          </button>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            )}

        </div>

        {/* ==================================================
            INFO
        ================================================== */}

        <div className="notifications-info">

          <div className="info-icon">
            💡
          </div>

          <div>

            <h3>
              Keep your notifications useful
            </h3>

            <p>
              Your latest NoteHive activity
              will appear here. You can mark
              notifications as read or delete
              them anytime.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
};

export default Notifications;