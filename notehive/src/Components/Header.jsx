import React, { useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { io } from "socket.io-client";
import "./Header.css";

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  "http://192.168.1.68:5000";

const API_URL = `${SERVER_URL}/api`;

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ======================================================
  // LOGIN STATE
  // ======================================================

  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );

  // ======================================================
  // UNREAD NOTIFICATIONS
  // ======================================================

  const [unreadNotifications, setUnreadNotifications] =
    useState(0);

  // ======================================================
  // CHAT
  // ======================================================

  const [chatUnreadCount, setChatUnreadCount] = useState(() => {
    return Number(
      localStorage.getItem(
        "notehive_chat_unread_count"
      ) || 0
    );
  });

  const [chatPopup, setChatPopup] = useState(null);

  const socketRef = useRef(null);

  const shownMessageIdsRef = useRef(new Set());

  // ======================================================
  // USER ID
  // ======================================================

  const userId =
    localStorage.getItem("notehive_userId");

  // ======================================================
  // CHECK LOGIN
  // ======================================================

  useEffect(() => {
    const checkLoginStatus = () => {
      setIsLoggedIn(
        localStorage.getItem("isLoggedIn") === "true"
      );
    };

    checkLoginStatus();

    window.addEventListener(
      "storage",
      checkLoginStatus
    );

    window.addEventListener(
      "notehive-login-change",
      checkLoginStatus
    );

    return () => {
      window.removeEventListener(
        "storage",
        checkLoginStatus
      );

      window.removeEventListener(
        "notehive-login-change",
        checkLoginStatus
      );
    };
  }, []);

  // ======================================================
  // GLOBAL CHAT SOCKET
  // ======================================================

  useEffect(() => {
    const currentUserId =
      localStorage.getItem("notehive_userId");

    const loggedIn =
      localStorage.getItem("isLoggedIn") === "true";

    if (!loggedIn || !currentUserId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      return;
    }

    // Prevent duplicate socket connection
    if (socketRef.current) {
      return;
    }

    console.log(
      "💬 Starting global NoteHive chat socket..."
    );

    const socket = io(SERVER_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socketRef.current = socket;

    // ==================================================
    // SOCKET CONNECTED
    // ==================================================

    socket.on("connect", () => {
      console.log(
        "🟢 Global chat socket connected:",
        socket.id
      );

      socket.emit(
        "join-user",
        currentUserId
      );

      console.log(
        `👤 Joined global chat room: user-${currentUserId}`
      );
    });

    // ==================================================
    // SOCKET ERROR
    // ==================================================

    socket.on("connect_error", (error) => {
      console.error(
        "❌ Global chat socket error:",
        error.message
      );
    });

    // ==================================================
    // RECEIVE MESSAGE
    // ==================================================

    socket.on(
      "receive-message",
      (messageData) => {
        try {
          console.log(
            "💬 Global message received:",
            messageData
          );

          if (!messageData) {
            return;
          }

          const messageId =
            messageData._id ||
            `${messageData.sender?._id}-${messageData.createdAt}-${messageData.message}`;

          // Prevent duplicate processing
          if (
            shownMessageIdsRef.current.has(
              messageId
            )
          ) {
            return;
          }

          shownMessageIdsRef.current.add(
            messageId
          );

          // Keep Set from growing forever
          if (
            shownMessageIdsRef.current.size >
            100
          ) {
            const firstId =
              shownMessageIdsRef.current
                .values()
                .next().value;

            shownMessageIdsRef.current.delete(
              firstId
            );
          }

          const senderId =
            messageData.sender?._id ||
            messageData.sender;

          // Ignore own messages
          if (
            String(senderId) ===
            String(currentUserId)
          ) {
            return;
          }

          const senderName =
            messageData.sender?.name ||
            "Someone";

          const senderImage =
            messageData.sender?.profileImage ||
            "";

          const messageText =
            messageData.message ||
            "New message";

          // ==================================================
          // IF CHAT PAGE IS CURRENTLY OPEN WITH THIS USER
          // ==================================================

          const currentChatUser =
            localStorage.getItem(
              "notehive_active_chat_user"
            );

          const isChatPage =
            location.pathname === "/chat";

          if (
            isChatPage &&
            currentChatUser &&
            String(currentChatUser) ===
              String(senderId)
          ) {
            // Chat page will handle the message itself.
            return;
          }

          // ==================================================
          // INCREASE UNREAD COUNT
          // ==================================================

          setChatUnreadCount((previous) => {
            const nextCount =
              previous + 1;

            localStorage.setItem(
              "notehive_chat_unread_count",
              String(nextCount)
            );

            window.dispatchEvent(
              new CustomEvent(
                "notehive-chat-unread-change",
                {
                  detail: {
                    count: nextCount,
                  },
                }
              )
            );

            return nextCount;
          });

          // ==================================================
          // SHOW POPUP
          // ==================================================

          setChatPopup({
            id: messageId,
            senderId,
            senderName,
            senderImage,
            message: messageText,
          });

          // ==================================================
          // ALSO INFORM CHAT COMPONENT
          // ==================================================

          window.dispatchEvent(
            new CustomEvent(
              "notehive-global-chat-message",
              {
                detail: messageData,
              }
            )
          );
        } catch (error) {
          console.error(
            "❌ Global chat message handling error:",
            error
          );
        }
      }
    );

    // ==================================================
    // DISCONNECT
    // ==================================================

    socket.on(
      "disconnect",
      (reason) => {
        console.log(
          "🔴 Global chat socket disconnected:",
          reason
        );
      }
    );

    // ==================================================
    // CLEANUP
    // ==================================================

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("receive-message");
      socket.off("disconnect");

      socket.disconnect();

      socketRef.current = null;
    };
  }, [isLoggedIn, location.pathname]);

  // ======================================================
  // LISTEN FOR CHAT UNREAD CHANGES
  // ======================================================

  useEffect(() => {
    const handleUnreadChange = (event) => {
      const count =
        Number(event.detail?.count || 0);

      setChatUnreadCount(count);
    };

    window.addEventListener(
      "notehive-chat-unread-change",
      handleUnreadChange
    );

    return () => {
      window.removeEventListener(
        "notehive-chat-unread-change",
        handleUnreadChange
      );
    };
  }, []);

  // ======================================================
  // OPEN CHAT FROM POPUP
  // ======================================================

  const handleChatPopupClick = () => {
    if (!chatPopup) {
      return;
    }

    const senderId =
      chatPopup.senderId;

    localStorage.setItem(
      "notehive_open_chat_user",
      String(senderId)
    );

    setChatPopup(null);

    navigate("/chat");

    setChatUnreadCount(0);

    localStorage.setItem(
      "notehive_chat_unread_count",
      "0"
    );

    window.dispatchEvent(
      new CustomEvent(
        "notehive-chat-unread-change",
        {
          detail: {
            count: 0,
          },
        }
      )
    );
  };

  // ======================================================
  // CLOSE CHAT POPUP
  // ======================================================

  const closeChatPopup = (event) => {
    event?.stopPropagation();

    setChatPopup(null);
  };

  // ======================================================
  // FETCH UNREAD NOTIFICATIONS
  // ======================================================

  const fetchUnreadNotifications =
    async () => {
      const currentUserId =
        localStorage.getItem(
          "notehive_userId"
        );

      const loggedIn =
        localStorage.getItem(
          "isLoggedIn"
        ) === "true";

      if (
        !currentUserId ||
        !loggedIn
      ) {
        setUnreadNotifications(0);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/notifications/${currentUserId}`
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to fetch notifications"
          );
        }

        setUnreadNotifications(
          Number(
            data.unreadCount || 0
          )
        );
      } catch (error) {
        console.error(
          "❌ Notification error:",
          error
        );

        setUnreadNotifications(0);
      }
    };

  // ======================================================
  // NOTIFICATION POLLING
  // ======================================================

  useEffect(() => {
    if (
      !isLoggedIn ||
      !userId
    ) {
      setUnreadNotifications(0);
      return;
    }

    fetchUnreadNotifications();

    const notificationInterval =
      setInterval(() => {
        fetchUnreadNotifications();
      }, 5000);

    return () => {
      clearInterval(
        notificationInterval
      );
    };
  }, [
    isLoggedIn,
    userId,
  ]);

  // ======================================================
  // LOGOUT
  // ======================================================

  const handleLogout = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    localStorage.removeItem(
      "isLoggedIn"
    );

    localStorage.removeItem(
      "notehive_userId"
    );

    localStorage.removeItem(
      "userRole"
    );

    localStorage.removeItem(
      "notehive_user"
    );

    localStorage.removeItem(
      "notehive_chat_unread_count"
    );

    localStorage.removeItem(
      "notehive_open_chat_user"
    );

    setIsLoggedIn(false);

    setUnreadNotifications(0);

    setChatUnreadCount(0);

    setChatPopup(null);

    window.dispatchEvent(
      new Event(
        "notehive-login-change"
      )
    );

    navigate("/login");
  };

  // ======================================================
  // NOTIFICATIONS
  // ======================================================

  const handleNotifications = () => {
    navigate("/notifications");
  };

  // ======================================================
  // CHAT
  // ======================================================

  const handleChat = () => {
    navigate("/chat");
  };

  // ======================================================
  // SETTINGS
  // ======================================================

  const handleSettings = () => {
    navigate("/settings");
  };

  // ======================================================
  // ACTIVE ROUTE
  // ======================================================

  const isActive = (path) => {
    return (
      location.pathname === path
    );
  };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <>
      {/* ==================================================
          GLOBAL CHAT POPUP
      ================================================== */}

      {isLoggedIn &&
        chatPopup && (
          <button
            type="button"
            className="global-chat-popup"
            onClick={handleChatPopupClick}
          >
            <div className="global-chat-popup-avatar">
              {chatPopup.senderImage ? (
                <img
                  src={`${SERVER_URL}${chatPopup.senderImage}`}
                  alt={chatPopup.senderName}
                />
              ) : (
                <span>
                  {chatPopup.senderName
                    ?.charAt(0)
                    ?.toUpperCase() || "U"}
                </span>
              )}
            </div>

            <div className="global-chat-popup-content">
              <strong>
                {chatPopup.senderName}
              </strong>

              <span>
                {chatPopup.message}
              </span>
            </div>

            <button
              type="button"
              className="global-chat-popup-close"
              onClick={closeChatPopup}
              aria-label="Close"
            >
              ×
            </button>
          </button>
        )}

      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="header">
        <div className="header-container">

          {/* LOGO */}

          <Link
            to="/"
            className="logo"
            onClick={() =>
              window.scrollTo(0, 0)
            }
          >
            <span className="logo-bee">
              🐝
            </span>

            <span className="logo-text">
              NOTEHIVE
            </span>
          </Link>

          {/* DESKTOP NAVIGATION */}

          {isLoggedIn && (
            <nav className="nav">

              <Link
                to="/dashboard"
                className={`nav-link ${
                  isActive(
                    "/dashboard"
                  )
                    ? "active"
                    : ""
                }`}
              >
                Dashboard
              </Link>

              <Link
                to="/my-notes"
                className={`nav-link ${
                  isActive(
                    "/my-notes"
                  )
                    ? "active"
                    : ""
                }`}
              >
                My Notes
              </Link>

              <Link
                to="/pinned-notes"
                className={`nav-link ${
                  isActive(
                    "/pinned-notes"
                  )
                    ? "active"
                    : ""
                }`}
              >
                Pinned
              </Link>

              {/* CHAT */}

              <Link
                to="/chat"
                className={`nav-link ${
                  isActive("/chat")
                    ? "active"
                    : ""
                }`}
              >
                <span>
                  Chat
                </span>

                {chatUnreadCount >
                  0 && (
                  <span className="header-chat-badge">
                    {chatUnreadCount >
                    99
                      ? "99+"
                      : chatUnreadCount}
                  </span>
                )}
              </Link>

              <Link
                to="/settings"
                className={`nav-link ${
                  isActive(
                    "/settings"
                  )
                    ? "active"
                    : ""
                }`}
              >
                Settings
              </Link>

            </nav>
          )}

          {/* RIGHT SIDE */}

          <div className="header-actions">

            {isLoggedIn && (
              <>

                {/* DESKTOP NOTIFICATION */}

                <button
                  type="button"
                  className="header-notification-btn desktop-only-notification"
                  onClick={
                    handleNotifications
                  }
                  title="Notifications"
                  aria-label="Notifications"
                >
                  <span className="header-bell-icon">
                    🔔
                  </span>

                  {unreadNotifications >
                    0 && (
                    <span className="notification-dot">
                      {unreadNotifications >
                      99
                        ? "99+"
                        : unreadNotifications}
                    </span>
                  )}
                </button>

                {/* LOGOUT */}

                <button
                  type="button"
                  className="header-logout-btn"
                  onClick={
                    handleLogout
                  }
                >
                  Logout
                </button>

              </>
            )}

            {!isLoggedIn && (
              <>
                <Link
                  to="/login"
                  className="header-login-btn"
                >
                  Login
                </Link>

                <Link
                  to="/signup"
                  className="header-signup-btn"
                >
                  Sign Up
                </Link>
              </>
            )}

          </div>
        </div>
      </header>

      {/* ======================================================
          MOBILE BOTTOM NAVIGATION
      ====================================================== */}

      {isLoggedIn && (
        <nav className="mobile-bottom-nav">

          {/* DASHBOARD */}

          <button
            type="button"
            className={`mobile-nav-item ${
              isActive(
                "/dashboard"
              )
                ? "mobile-nav-active"
                : ""
            }`}
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <span className="mobile-nav-icon">
              🏠
            </span>

            <span className="mobile-nav-label">
              Home
            </span>
          </button>

          {/* MY NOTES */}

          <button
            type="button"
            className={`mobile-nav-item ${
              isActive(
                "/my-notes"
              )
                ? "mobile-nav-active"
                : ""
            }`}
            onClick={() =>
              navigate("/my-notes")
            }
          >
            <span className="mobile-nav-icon">
              📝
            </span>

            <span className="mobile-nav-label">
              Notes
            </span>
          </button>

          {/* PINNED */}

          <button
            type="button"
            className={`mobile-nav-item ${
              isActive(
                "/pinned-notes"
              )
                ? "mobile-nav-active"
                : ""
            }`}
            onClick={() =>
              navigate(
                "/pinned-notes"
              )
            }
          >
            <span className="mobile-nav-icon">
              📌
            </span>

            <span className="mobile-nav-label">
              Pinned
            </span>
          </button>

          {/* CHAT */}

          <button
            type="button"
            className={`mobile-nav-item ${
              isActive("/chat")
                ? "mobile-nav-active"
                : ""
            }`}
            onClick={handleChat}
          >
            <span className="mobile-nav-icon">
              💬
            </span>

            {chatUnreadCount >
              0 && (
              <span className="mobile-chat-badge">
                {chatUnreadCount >
                99
                  ? "99+"
                  : chatUnreadCount}
              </span>
            )}

            <span className="mobile-nav-label">
              Chat
            </span>
          </button>

          {/* SETTINGS */}

          <button
            type="button"
            className={`mobile-nav-item ${
              isActive(
                "/settings"
              )
                ? "mobile-nav-active"
                : ""
            }`}
            onClick={
              handleSettings
            }
          >
            <span className="mobile-nav-icon">
              ⚙️
            </span>

            <span className="mobile-nav-label">
              Settings
            </span>
          </button>

        </nav>
      )}
    </>
  );
};

export default Header;
