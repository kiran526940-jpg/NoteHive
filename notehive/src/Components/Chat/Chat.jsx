import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import { SERVER_URL } from "../../config/api";
import "./Chat.css";

const Chat = () => {
  // ============================================================
  // CURRENT USER
  // ============================================================

  const [currentUserId, setCurrentUserId] = useState("");

  // ============================================================
  // USERS
  // ============================================================

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  // ============================================================
  // SELECTED CHAT
  // ============================================================

  const [selectedUser, setSelectedUser] = useState(null);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);

  // ============================================================
  // MESSAGE INPUT
  // ============================================================

  const [messageText, setMessageText] = useState("");

  // ============================================================
  // LOADING
  // ============================================================

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // ============================================================
  // SOCKET
  // ============================================================

  const [socketConnected, setSocketConnected] = useState(false);

  const socketRef = useRef(null);

  const messagesEndRef = useRef(null);

  // ============================================================
  // ONLINE / OFFLINE STATUS
  // ============================================================

  const [onlineUsers, setOnlineUsers] = useState({});

  // ============================================================
  // TYPING INDICATOR
  // ============================================================

  const [isOtherUserTyping, setIsOtherUserTyping] =
    useState(false);

  const typingTimeoutRef = useRef(null);

  // ============================================================
  // UNREAD COUNTS
  // ============================================================

  const [unreadCounts, setUnreadCounts] = useState({});

  // ============================================================
  // NEW MESSAGE POPUP
  // ============================================================

  const [messagePopup, setMessagePopup] = useState(null);

  const popupTimerRef = useRef(null);

  // ============================================================
  // SELECTED USER REF
  // ============================================================

  const selectedUserRef = useRef(null);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // ============================================================
  // GET CURRENT USER
  // ============================================================

  useEffect(() => {
    const storedUserId =
      localStorage.getItem("notehive_userId");

    if (storedUserId) {
      setCurrentUserId(storedUserId);
    }
  }, []);

  // ============================================================
  // LOAD SAVED UNREAD COUNTS
  // ============================================================

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    try {
      const savedUnread = localStorage.getItem(
        `notehive_chat_unread_${currentUserId}`
      );

      if (!savedUnread) {
        return;
      }

      const parsed = JSON.parse(savedUnread);

      if (parsed && typeof parsed === "object") {
        setUnreadCounts(parsed);
      }
    } catch (error) {
      console.error(
        "Unable to load chat unread counts:",
        error
      );
    }
  }, [currentUserId]);

  // ============================================================
  // SAVE UNREAD COUNTS
  // ============================================================

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    try {
      localStorage.setItem(
        `notehive_chat_unread_${currentUserId}`,
        JSON.stringify(unreadCounts)
      );
    } catch (error) {
      console.error(
        "Unable to save chat unread counts:",
        error
      );
    }
  }, [unreadCounts, currentUserId]);

  // ============================================================
  // TOTAL UNREAD
  // ============================================================

  const totalUnreadCount = useMemo(() => {
    return Object.values(unreadCounts).reduce(
      (total, count) =>
        total + Number(count || 0),
      0
    );
  }, [unreadCounts]);

  // ============================================================
  // SEND TOTAL UNREAD TO HEADER
  // ============================================================

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(
        "notehive-chat-unread-change",
        {
          detail: {
            count: totalUnreadCount,
          },
        }
      )
    );
  }, [totalUnreadCount]);

  // ============================================================
  // FORMAT LAST SEEN
  // ============================================================

  const formatLastSeen = (date) => {
    if (!date) {
      return "Offline";
    }

    const lastSeenDate = new Date(date);

    if (Number.isNaN(lastSeenDate.getTime())) {
      return "Offline";
    }

    const now = new Date();

    const difference =
      now.getTime() -
      lastSeenDate.getTime();

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (difference < minute) {
      return "Last seen just now";
    }

    if (difference < hour) {
      const minutes = Math.floor(
        difference / minute
      );

      return `Last seen ${minutes} ${
        minutes === 1
          ? "minute"
          : "minutes"
      } ago`;
    }

    if (difference < day) {
      const hours = Math.floor(
        difference / hour
      );

      return `Last seen ${hours} ${
        hours === 1
          ? "hour"
          : "hours"
      } ago`;
    }

    return `Last seen ${lastSeenDate.toLocaleDateString(
      [],
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    )}`;
  };

  // ============================================================
  // GET USER STATUS
  // ============================================================

  const getUserStatus = (user) => {
    if (!user?._id) {
      return {
        isOnline: false,
        lastSeen: null,
      };
    }

    const userId = String(user._id);

    if (onlineUsers[userId]) {
      return onlineUsers[userId];
    }

    return {
      isOnline: Boolean(user.isOnline),
      lastSeen: user.lastSeen || null,
    };
  };

  // ============================================================
  // SHOW MESSAGE POPUP
  // ============================================================

  const showMessagePopup = (newMessage) => {
    if (!newMessage) {
      return;
    }

    const sender =
      newMessage.sender || {};

    const senderId = String(
      sender._id ||
        newMessage.sender ||
        ""
    );

    const senderName =
      sender.name ||
      "NoteHive User";

    setMessagePopup({
      id: newMessage._id,
      senderId,
      name: senderName,
      message:
        newMessage.message ||
        "New message",
      profileImage:
        sender.profileImage ||
        "",
    });

    if (popupTimerRef.current) {
      clearTimeout(
        popupTimerRef.current
      );
    }

    popupTimerRef.current =
      setTimeout(() => {
        setMessagePopup(null);
      }, 4500);
  };

  // ============================================================
  // CLOSE POPUP
  // ============================================================

  const closeMessagePopup = () => {
    setMessagePopup(null);

    if (popupTimerRef.current) {
      clearTimeout(
        popupTimerRef.current
      );

      popupTimerRef.current = null;
    }
  };

  // ============================================================
  // OPEN POPUP SENDER CHAT
  // ============================================================

  const openPopupChat = () => {
    if (!messagePopup?.senderId) {
      closeMessagePopup();
      return;
    }

    const sender = users.find(
      (user) =>
        String(user._id) ===
        String(messagePopup.senderId)
    );

    if (sender) {
      setSelectedUser(sender);
      setMobileChatOpen(true);

      setUnreadCounts(
        (previousCounts) => {
          const updated = {
            ...previousCounts,
          };

          delete updated[sender._id];

          return updated;
        }
      );
    }

    closeMessagePopup();
  };

  // ============================================================
  // SOCKET.IO CONNECTION
  // ============================================================

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    const socket = io(SERVER_URL, {
      transports: [
        "polling",
        "websocket",
      ],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    // ==========================================================
    // CONNECT
    // ==========================================================

    socket.on("connect", () => {
      console.log(
        "🟢 Chat socket connected:",
        socket.id
      );

      setSocketConnected(true);

      socket.emit(
        "join-user",
        currentUserId
      );

      console.log(
        "👤 Chat joined user room:",
        `user-${currentUserId}`
      );
    });

    // ==========================================================
    // DISCONNECT
    // ==========================================================

    socket.on(
      "disconnect",
      (reason) => {
        console.log(
          "🔴 Chat socket disconnected:",
          reason
        );

        setSocketConnected(false);
      }
    );

    // ==========================================================
    // USER ONLINE / OFFLINE STATUS
    // ==========================================================

    const handleUserStatusChanged =
      (data) => {
        console.log(
          "📡 USER STATUS EVENT:",
          data
        );

        if (!data?.userId) {
          return;
        }

        const userId = String(
          data.userId
        );

        setOnlineUsers(
          (previousUsers) => ({
            ...previousUsers,
            [userId]: {
              isOnline: Boolean(
                data.isOnline
              ),
              lastSeen:
                data.lastSeen ||
                null,
            },
          })
        );
      };

    socket.on(
      "user-status-changed",
      handleUserStatusChanged
    );

    // ==========================================================
    // USER TYPING
    // ==========================================================

    const handleUserTyping = (data) => {
      if (!data?.sender) {
        return;
      }

      const openUser =
        selectedUserRef.current;

      if (!openUser?._id) {
        return;
      }

      if (
        String(data.sender) ===
        String(openUser._id)
      ) {
        setIsOtherUserTyping(
          Boolean(data.isTyping)
        );
      }
    };

    socket.on(
      "user-typing",
      handleUserTyping
    );

    // ==========================================================
    // CONNECTION ERROR
    // ==========================================================

    socket.on(
      "connect_error",
      (error) => {
        console.error(
          "❌ Chat socket error:",
          error.message
        );

        setSocketConnected(false);
      }
    );

    // ==========================================================
    // RECEIVE MESSAGE
    // ==========================================================

    const handleReceiveMessage =
      (newMessage) => {
        if (!newMessage) {
          return;
        }

        const senderId = String(
          newMessage.sender?._id ||
            newMessage.sender ||
            ""
        );

        if (!senderId) {
          return;
        }

        const openUser =
          selectedUserRef.current;

        const isCurrentChat =
          openUser &&
          String(openUser._id) ===
            senderId;

        // ------------------------------------------------------
        // MESSAGE FROM CURRENT OPEN CHAT
        // ------------------------------------------------------

        if (isCurrentChat) {
          setMessages(
            (previousMessages) => {
              const exists =
                previousMessages.some(
                  (item) =>
                    String(item._id) ===
                    String(
                      newMessage._id
                    )
                );

              if (exists) {
                return previousMessages;
              }

              return [
                ...previousMessages,
                newMessage,
              ];
            }
          );

          // Stop typing indicator
          setIsOtherUserTyping(false);

          fetch(
            `${SERVER_URL}/api/messages/${currentUserId}/${senderId}/read`,
            {
              method: "PATCH",
            }
          ).catch((error) => {
            console.error(
              "Mark message read error:",
              error
            );
          });

          return;
        }

        // ------------------------------------------------------
        // INCREMENT UNREAD
        // ------------------------------------------------------

        setUnreadCounts(
          (previousCounts) => {
            const currentCount =
              Number(
                previousCounts[
                  senderId
                ] || 0
              );

            return {
              ...previousCounts,
              [senderId]:
                currentCount + 1,
            };
          }
        );

        // ------------------------------------------------------
        // POPUP
        // ------------------------------------------------------

        showMessagePopup(newMessage);

        // ------------------------------------------------------
        // HEADER EVENT
        // ------------------------------------------------------

        window.dispatchEvent(
          new CustomEvent(
            "notehive-chat-message",
            {
              detail: {
                message: newMessage,
              },
            }
          )
        );
      };

    socket.on(
      "receive-message",
      handleReceiveMessage
    );

    // ==========================================================
    // MESSAGE SENT
    // ==========================================================

    const handleMessageSent =
      (newMessage) => {
        if (!newMessage) {
          return;
        }

        setMessages(
          (previousMessages) => {
            const exists =
              previousMessages.some(
                (item) =>
                  String(item._id) ===
                  String(
                    newMessage._id
                  )
              );

            if (exists) {
              return previousMessages;
            }

            return [
              ...previousMessages,
              newMessage,
            ];
          }
        );
      };

    socket.on(
      "message-sent",
      handleMessageSent
    );

    // ==========================================================
    // CLEANUP
    // ==========================================================

    return () => {
      if (popupTimerRef.current) {
        clearTimeout(
          popupTimerRef.current
        );

        popupTimerRef.current = null;
      }

      if (typingTimeoutRef.current) {
        clearTimeout(
          typingTimeoutRef.current
        );

        typingTimeoutRef.current = null;
      }

      // Stop typing before disconnect
      socket.emit(
        "typing-stop",
        {
          sender: currentUserId,
          receiver:
            selectedUserRef.current?._id,
        }
      );

      socket.off(
        "user-status-changed",
        handleUserStatusChanged
      );

      socket.off(
        "user-typing",
        handleUserTyping
      );

      socket.off(
        "receive-message",
        handleReceiveMessage
      );

      socket.off(
        "message-sent",
        handleMessageSent
      );

      socket.disconnect();

      socketRef.current = null;
    };
  }, [currentUserId]);

  // ============================================================
  // LOAD USERS
  // ============================================================

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    const loadUsers = async () => {
      try {
        setLoadingUsers(true);

        const response =
          await fetch(
            `${SERVER_URL}/api/users/chat-list`
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to load users."
          );
        }

        const otherUsers = (
          data.users || []
        ).filter(
          (user) =>
            String(user._id) !==
            String(currentUserId)
        );

        // ------------------------------------------------------
        // INITIAL ONLINE STATUS
        // ------------------------------------------------------

        const initialStatuses = {};

        otherUsers.forEach(
          (user) => {
            if (!user?._id) {
              return;
            }

            initialStatuses[
              String(user._id)
            ] = {
              isOnline: Boolean(
                user.isOnline
              ),
              lastSeen:
                user.lastSeen ||
                null,
            };
          }
        );

        setOnlineUsers(
          (previousUsers) => ({
            ...previousUsers,
            ...initialStatuses,
          })
        );

        setUsers(otherUsers);

        // No automatic first-user selection
        setSelectedUser(null);
        setMobileChatOpen(false);
      } catch (error) {
        console.error(
          "Load chat users error:",
          error
        );
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, [currentUserId]);

  // ============================================================
  // LOAD MESSAGES
  // ============================================================

  useEffect(() => {
    if (
      !currentUserId ||
      !selectedUser?._id
    ) {
      setMessages([]);
      setIsOtherUserTyping(false);
      return;
    }

    const loadMessages = async () => {
      try {
        setLoadingMessages(true);

        setIsOtherUserTyping(false);

        const response =
          await fetch(
            `${SERVER_URL}/api/messages/${currentUserId}/${selectedUser._id}`
          );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to load messages."
          );
        }

        setMessages(
          data.messages || []
        );

        // ------------------------------------------------------
        // CLEAR UNREAD
        // ------------------------------------------------------

        setUnreadCounts(
          (previousCounts) => {
            if (
              !previousCounts[
                selectedUser._id
              ]
            ) {
              return previousCounts;
            }

            const updated = {
              ...previousCounts,
            };

            delete updated[
              selectedUser._id
            ];

            return updated;
          }
        );

        // ------------------------------------------------------
        // MARK READ
        // ------------------------------------------------------

        await fetch(
          `${SERVER_URL}/api/messages/${currentUserId}/${selectedUser._id}/read`,
          {
            method: "PATCH",
          }
        );
      } catch (error) {
        console.error(
          "Load messages error:",
          error
        );

        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [
    currentUserId,
    selectedUser,
  ]);

  // ============================================================
  // AUTO SCROLL
  // ============================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // ============================================================
  // FILTER USERS
  // ============================================================

  const filteredUsers = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    if (!searchValue) {
      return users;
    }

    return users.filter(
      (user) =>
        user.name
          ?.toLowerCase()
          .includes(searchValue) ||
        user.email
          ?.toLowerCase()
          .includes(searchValue)
    );
  }, [users, search]);

  // ============================================================
  // SEND MESSAGE
  // ============================================================

  const sendMessage = (event) => {
    event.preventDefault();

    const text =
      messageText.trim();

    if (
      !text ||
      !currentUserId ||
      !selectedUser?._id ||
      !socketRef.current
    ) {
      return;
    }

    if (
      !socketRef.current.connected
    ) {
      console.warn(
        "Socket is not connected."
      );

      return;
    }

    // Stop typing immediately
    if (typingTimeoutRef.current) {
      clearTimeout(
        typingTimeoutRef.current
      );

      typingTimeoutRef.current = null;
    }

    socketRef.current.emit(
      "typing-stop",
      {
        sender: currentUserId,
        receiver:
          selectedUser._id,
      }
    );

    setIsOtherUserTyping(false);

    // Send actual message
    socketRef.current.emit(
      "send-message",
      {
        sender:
          currentUserId,

        receiver:
          selectedUser._id,

        message: text,
      }
    );

    setMessageText("");
  };

  // ============================================================
  // SELECT USER
  // ============================================================

  const handleSelectUser = (
    user
  ) => {
    // Stop previous typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(
        typingTimeoutRef.current
      );

      typingTimeoutRef.current = null;
    }

    const previousUser =
      selectedUserRef.current;

    if (
      previousUser?._id &&
      currentUserId &&
      socketRef.current
    ) {
      socketRef.current.emit(
        "typing-stop",
        {
          sender: currentUserId,
          receiver:
            previousUser._id,
        }
      );
    }

    setIsOtherUserTyping(false);

    setSelectedUser(user);

    setMobileChatOpen(true);

    setUnreadCounts(
      (previousCounts) => {
        if (
          !previousCounts[
            user._id
          ]
        ) {
          return previousCounts;
        }

        const updated = {
          ...previousCounts,
        };

        delete updated[user._id];

        return updated;
      }
    );

    if (
      messagePopup?.senderId &&
      String(
        messagePopup.senderId
      ) === String(user._id)
    ) {
      closeMessagePopup();
    }
  };

  // ============================================================
  // MOBILE BACK TO USERS
  // ============================================================

  const handleMobileBack = () => {
    if (
      selectedUser?._id &&
      currentUserId &&
      socketRef.current
    ) {
      socketRef.current.emit(
        "typing-stop",
        {
          sender: currentUserId,
          receiver:
            selectedUser._id,
        }
      );
    }

    if (typingTimeoutRef.current) {
      clearTimeout(
        typingTimeoutRef.current
      );

      typingTimeoutRef.current = null;
    }

    setIsOtherUserTyping(false);
    setMobileChatOpen(false);
  };

  // ============================================================
  // FORMAT TIME
  // ============================================================

  const formatTime = (date) => {
    if (!date) {
      return "";
    }

    return new Date(
      date
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ============================================================
  // USER INITIAL
  // ============================================================

  const getInitial = (name) => {
    return (
      name
        ?.trim()
        ?.charAt(0)
        ?.toUpperCase() ||
      "U"
    );
  };

  // ============================================================
  // POPUP AVATAR
  // ============================================================

  const renderPopupAvatar = () => {
    if (
      messagePopup?.profileImage
    ) {
      return (
        <img
          src={`${SERVER_URL}${messagePopup.profileImage}`}
          alt={messagePopup.name}
        />
      );
    }

    return getInitial(
      messagePopup?.name
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      className={`chat-page ${
        mobileChatOpen
          ? "mobile-chat-open"
          : ""
      }`}
    >
      {/* ======================================================
          NEW MESSAGE POPUP
      ====================================================== */}

      {messagePopup && (
        <button
          type="button"
          className="chat-message-popup"
          onClick={openPopupChat}
        >
          <div className="chat-popup-avatar">
            {renderPopupAvatar()}
          </div>

          <div className="chat-popup-content">
            <strong>
              {messagePopup.name}
            </strong>

            <span>
              {messagePopup.message}
            </span>
          </div>

          <span
            className="chat-popup-close"
            onClick={(event) => {
              event.stopPropagation();
              closeMessagePopup();
            }}
          >
            ×
          </span>
        </button>
      )}

      {/* ======================================================
          CHAT SIDEBAR
      ====================================================== */}

      <aside className="chat-sidebar">
        <div className="chat-sidebar-header">
          <div>
            <h1>Messages</h1>

            <p>
              Connect with NoteHive users
            </p>
          </div>

          <div
            className={`chat-live-status ${
              socketConnected
                ? "connected"
                : "offline"
            }`}
          >
            <span></span>

            {socketConnected
              ? "Live"
              : "Offline"}
          </div>
        </div>

        {/* TOTAL UNREAD */}

        {totalUnreadCount > 0 && (
          <div className="chat-unread-summary">
            <span>💬</span>

            <strong>
              {totalUnreadCount > 99
                ? "99+"
                : totalUnreadCount}
            </strong>

            <span>
              unread messages
            </span>
          </div>
        )}

        {/* SEARCH */}

        <div className="chat-search">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search people..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />
        </div>

        {/* USERS */}

        <div className="chat-users">
          {loadingUsers ? (
            <div className="chat-empty-list">
              <div className="chat-loader"></div>

              <p>
                Loading users...
              </p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="chat-empty-list">
              <div className="empty-chat-icon">
                👥
              </div>

              <h3>
                No users found
              </h3>

              <p>
                There are no other approved
                users to chat with.
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const unread =
                Number(
                  unreadCounts[
                    user._id
                  ] || 0
                );

              const userStatus =
                getUserStatus(user);

              return (
                <button
                  key={user._id}
                  type="button"
                  className={`chat-user-item ${
                    selectedUser?._id ===
                    user._id
                      ? "active"
                      : ""
                  } ${
                    unread > 0
                      ? "has-unread"
                      : ""
                  }`}
                  onClick={() =>
                    handleSelectUser(
                      user
                    )
                  }
                >
                  <div className="chat-user-avatar">
                    {user.profileImage ? (
                      <img
                        src={`${SERVER_URL}${user.profileImage}`}
                        alt={user.name}
                      />
                    ) : (
                      getInitial(
                        user.name
                      )
                    )}

                    <span
                      className={`user-online-dot ${
                        userStatus.isOnline
                          ? "online"
                          : "offline"
                      }`}
                    ></span>
                  </div>

                  <div className="chat-user-info">
                    <strong>
                      {user.name ||
                        "NoteHive User"}
                    </strong>

                    <span>
                      {userStatus.isOnline
                        ? "Online"
                        : userStatus.lastSeen
                        ? formatLastSeen(
                            userStatus.lastSeen
                          )
                        : user.profession ||
                          user.email ||
                          "NoteHive member"}
                    </span>
                  </div>

                  {unread > 0 && (
                    <span className="chat-unread-badge">
                      {unread > 99
                        ? "99+"
                        : unread}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ======================================================
          CHAT WINDOW
      ====================================================== */}

      <main className="chat-window">
        {!selectedUser ? (
          <div className="chat-no-selection">
            <div className="chat-no-selection-icon">
              💬
            </div>

            <h2>
              Start a conversation
            </h2>

            <p>
              Select a NoteHive user from
              the list to start chatting.
            </p>
          </div>
        ) : (
          <>
            {/* CHAT HEADER */}

            <header className="chat-header">
              {/* MOBILE BACK BUTTON */}

              <button
                type="button"
                className="mobile-chat-back"
                onClick={
                  handleMobileBack
                }
                aria-label="Back to users"
              >
                ←
              </button>

              <div className="selected-user">
                <div className="selected-user-avatar">
                  {selectedUser.profileImage ? (
                    <img
                      src={`${SERVER_URL}${selectedUser.profileImage}`}
                      alt={
                        selectedUser.name
                      }
                    />
                  ) : (
                    getInitial(
                      selectedUser.name
                    )
                  )}

                  <span
                    className={
                      getUserStatus(
                        selectedUser
                      ).isOnline
                        ? "online"
                        : "offline"
                    }
                  ></span>
                </div>

                <div>
                  <h2>
                    {selectedUser.name ||
                      "NoteHive User"}
                  </h2>

                  <p>
                    {isOtherUserTyping
                      ? "typing..."
                      : getUserStatus(
                          selectedUser
                        ).isOnline
                      ? "Online"
                      : getUserStatus(
                          selectedUser
                        ).lastSeen
                      ? formatLastSeen(
                          getUserStatus(
                            selectedUser
                          ).lastSeen
                        )
                      : selectedUser.profession ||
                        "NoteHive member"}
                  </p>
                </div>
              </div>

              <div className="chat-header-status">
                <span
                  className={
                    getUserStatus(
                      selectedUser
                    ).isOnline
                      ? "online"
                      : "offline"
                  }
                ></span>

                {isOtherUserTyping
                  ? "typing..."
                  : getUserStatus(
                      selectedUser
                    ).isOnline
                  ? "Online"
                  : "Offline"}
              </div>
            </header>

            {/* ==================================================
                MESSAGES
            ================================================== */}

            <section className="chat-messages">
              <div className="chat-welcome">
                <div className="chat-welcome-avatar">
                  {getInitial(
                    selectedUser.name
                  )}
                </div>

                <h3>
                  {selectedUser.name}
                </h3>

                <p>
                  Start your conversation
                  with this NoteHive user.
                </p>
              </div>

              {loadingMessages ? (
                <div className="messages-loading">
                  <div className="chat-loader"></div>

                  <span>
                    Loading conversation...
                  </span>
                </div>
              ) : (
                messages.map((item) => {
                  const isMine =
                    String(
                      item.sender?._id ||
                        item.sender
                    ) ===
                    String(
                      currentUserId
                    );

                  return (
                    <div
                      key={item._id}
                      className={`message-row ${
                        isMine
                          ? "mine"
                          : "theirs"
                      }`}
                    >
                      <div className="message-bubble">
                        <p>
                          {item.message}
                        </p>

                        <span>
                          {formatTime(
                            item.createdAt
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}

              <div
                ref={messagesEndRef}
              />
            </section>

            {/* ==================================================
                MESSAGE INPUT
            ================================================== */}

            <form
              className="chat-input-area"
              onSubmit={sendMessage}
            >
              <div className="chat-input-box">
                <input
                  type="text"
                  placeholder={`Message ${
                    selectedUser.name ||
                    "user"
                  }...`}
                  value={messageText}
                  maxLength={2000}
                  onChange={(event) => {
                    const value =
                      event.target.value;

  
  setMessageText(value);

  console.log("⌨️ TYPING EMIT", {
    sender: currentUserId,
    receiver: selectedUser?._id,
    connected: socketRef.current?.connected,
  });

  if (
    !selectedUser?._id ||
    !currentUserId ||
    !socketRef.current ||
    !socketRef.current.connected
  ) {
    return;
  }

  socketRef.current.emit("typing-start", {
    sender: currentUserId,
    receiver: selectedUser._id,
  });

  // baaki tumhara existing code...

                    if (
                      !selectedUser?._id ||
                      !currentUserId ||
                      !socketRef.current ||
                      !socketRef.current.connected
                    ) {
                      return;
                    }

                    // Start typing
                    socketRef.current.emit(
                      "typing-start",
                      {
                        sender:
                          currentUserId,
                        receiver:
                          selectedUser._id,
                      }
                    );

                    // Reset previous timer
                    if (
                      typingTimeoutRef.current
                    ) {
                      clearTimeout(
                        typingTimeoutRef.current
                      );
                    }

                    // Stop typing after 1 second
                    typingTimeoutRef.current =
                      setTimeout(() => {
                        socketRef.current?.emit(
                          "typing-stop",
                          {
                            sender:
                              currentUserId,
                            receiver:
                              selectedUser._id,
                          }
                        );

                        typingTimeoutRef.current =
                          null;
                      }, 1000);
                  }}
                />

                <span className="character-count">
                  {messageText.length}
                  /2000
                </span>
              </div>

              <button
                type="submit"
                className="chat-send-button"
                disabled={
                  !messageText.trim() ||
                  !socketConnected
                }
                title={
                  socketConnected
                    ? "Send message"
                    : "Connecting..."
                }
              >
                ➤
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
};

export default Chat;