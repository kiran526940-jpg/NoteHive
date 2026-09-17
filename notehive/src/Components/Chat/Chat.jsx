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

  const [currentUserId, setCurrentUserId] =
    useState("");

  // ============================================================
  // USERS
  // ============================================================

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  // ============================================================
  // SELECTED CHAT
  // ============================================================

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [messages, setMessages] = useState([]);

  // ============================================================
  // MOBILE VIEW STATE (Sidebar vs Chat Window toggling)
  // ============================================================

  const [showMobileChat, setShowMobileChat] =
    useState(false);

  // ============================================================
  // MESSAGE INPUT
  // ============================================================

  const [messageText, setMessageText] =
    useState("");

  // ============================================================
  // LOADING
  // ============================================================

  const [loadingUsers, setLoadingUsers] =
    useState(true);

  const [loadingMessages, setLoadingMessages] =
    useState(false);

  // ============================================================
  // SOCKET
  // ============================================================

  const [socketConnected, setSocketConnected] =
    useState(false);

  const socketRef = useRef(null);

  const messagesEndRef = useRef(null);

  // ============================================================
  // UNREAD COUNTS
  // ============================================================

  const [unreadCounts, setUnreadCounts] =
    useState({});

  // ============================================================
  // NEW MESSAGE POPUP
  // ============================================================

  const [messagePopup, setMessagePopup] =
    useState(null);

  const popupTimerRef = useRef(null);

  // ============================================================
  // SELECTED USER REF
  // ============================================================

  const selectedUserRef = useRef(null);

  useEffect(() => {
    selectedUserRef.current =
      selectedUser;
  }, [selectedUser]);

  // ============================================================
  // GET CURRENT USER
  // ============================================================

  useEffect(() => {
    const storedUserId =
      localStorage.getItem(
        "notehive_userId"
      );

    if (storedUserId) {
      setCurrentUserId(
        storedUserId
      );
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
      const savedUnread =
        localStorage.getItem(
          `notehive_chat_unread_${currentUserId}`
        );

      if (!savedUnread) {
        return;
      }

      const parsed =
        JSON.parse(savedUnread);

      if (
        parsed &&
        typeof parsed === "object"
      ) {
        setUnreadCounts(
          parsed
        );
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
        JSON.stringify(
          unreadCounts
        )
      );
    } catch (error) {
      console.error(
        "Unable to save chat unread counts:",
        error
      );
    }
  }, [
    unreadCounts,
    currentUserId,
  ]);

  // ============================================================
  // TOTAL UNREAD
  // ============================================================

  const totalUnreadCount =
    useMemo(() => {
      return Object.values(
        unreadCounts
      ).reduce(
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
            count:
              totalUnreadCount,
          },
        }
      )
    );
  }, [totalUnreadCount]);

  // ============================================================
  // SHOW MESSAGE POPUP
  // ============================================================

  const showMessagePopup = (
    newMessage
  ) => {
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

    if (
      popupTimerRef.current
    ) {
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

  const closeMessagePopup =
    () => {
      setMessagePopup(null);

      if (
        popupTimerRef.current
      ) {
        clearTimeout(
          popupTimerRef.current
        );

        popupTimerRef.current =
          null;
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

    const sender =
      users.find(
        (user) =>
          String(user._id) ===
          String(
            messagePopup.senderId
          )
      );

    if (sender) {
      setSelectedUser(
        sender
      );
      setShowMobileChat(true); // Open chat view on mobile

      setUnreadCounts(
        (previousCounts) => {
          const updated = {
            ...previousCounts,
          };

          delete updated[
            sender._id
          ];

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

    const socket = io(
      SERVER_URL,
      {
        transports: [
          "polling",
          "websocket",
        ],

        reconnection: true,

        reconnectionAttempts:
          Infinity,

        reconnectionDelay: 1000,

        reconnectionDelayMax: 5000,
      }
    );

    socketRef.current =
      socket;

    socket.on(
      "connect",
      () => {
        setSocketConnected(
          true
        );
        socket.emit(
          "join-user",
          currentUserId
        );
      }
    );

    socket.on(
      "disconnect",
      (reason) => {
        setSocketConnected(
          false
        );
      }
    );

    socket.on(
      "connect_error",
      (error) => {
        setSocketConnected(
          false
        );
      }
    );

    socket.on(
      "receive-message",
      (newMessage) => {
        if (!newMessage) {
          return;
        }

        const senderId =
          String(
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
          String(
            openUser._id
          ) === senderId;

        if (isCurrentChat) {
          setMessages(
            (previousMessages) => {
              const exists =
                previousMessages.some(
                  (item) =>
                    String(
                      item._id
                    ) ===
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

          fetch(
            `${SERVER_URL}/api/messages/${currentUserId}/${senderId}/read`,
            {
              method: "PATCH",
            }
          ).catch((error) =>
            console.error(error)
          );

          return;
        }

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

        showMessagePopup(
          newMessage
        );

        window.dispatchEvent(
          new CustomEvent(
            "notehive-chat-message",
            {
              detail: {
                message:
                  newMessage,
              },
            }
          )
        );
      }
    );

    socket.on(
      "message-sent",
      (newMessage) => {
        if (!newMessage) {
          return;
        }

        setMessages(
          (previousMessages) => {
            const exists =
              previousMessages.some(
                (item) =>
                  String(
                    item._id
                  ) ===
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
      }
    );

    return () => {
      if (
        popupTimerRef.current
      ) {
        clearTimeout(
          popupTimerRef.current
        );
      }

      socket.disconnect();

      socketRef.current =
        null;
    };
  }, [currentUserId]);

  // ============================================================
  // LOAD USERS
  // ============================================================

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    const loadUsers =
      async () => {
        try {
          setLoadingUsers(
            true
          );

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

          const otherUsers =
            (
              data.users || []
            ).filter(
              (user) =>
                String(
                  user._id
                ) !==
                String(
                  currentUserId
                )
            );

          setUsers(
            otherUsers
          );

          // Note: On desktop, you can keep auto-selecting the first user if desired, 
          // but for mobile we leave it unselected initially or let user click.
        } catch (error) {
          console.error(
            "Load chat users error:",
            error
          );
        } finally {
          setLoadingUsers(
            false
          );
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
      return;
    }

    const loadMessages =
      async () => {
        try {
          setLoadingMessages(
            true
          );

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
          setLoadingMessages(
            false
          );
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
    messagesEndRef.current?.scrollIntoView(
      {
        behavior: "smooth",
      }
    );
  }, [messages]);

  // ============================================================
  // FILTER USERS
  // ============================================================

  const filteredUsers =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      if (!searchValue) {
        return users;
      }

      return users.filter(
        (user) =>
          user.name
            ?.toLowerCase()
            .includes(
              searchValue
            ) ||
          user.email
            ?.toLowerCase()
            .includes(
              searchValue
            )
      );
    }, [users, search]);

  // ============================================================
  // SEND MESSAGE
  // ============================================================

  const sendMessage = (
    event
  ) => {
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
      !socketRef.current
        .connected
    ) {
      return;
    }

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
    setSelectedUser(user);
    setShowMobileChat(true); // Switch view to chat window on mobile

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

        delete updated[
          user._id
        ];

        return updated;
      }
    );

    if (
      messagePopup?.senderId &&
      String(
        messagePopup.senderId
      ) ===
        String(user._id)
    ) {
      closeMessagePopup();
    }
  };

  // ============================================================
  // BACK TO LIST (MOBILE)
  // ============================================================

  const handleBackToList = () => {
    setShowMobileChat(false);
  };

  // ============================================================
  // FORMAT TIME
  // ============================================================

  const formatTime = (
    date
  ) => {
    if (!date) {
      return "";
    }

    return new Date(
      date
    ).toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // ============================================================
  // USER INITIAL
  // ============================================================

  const getInitial = (
    name
  ) => {
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

  const renderPopupAvatar =
    () => {
      if (
        messagePopup?.profileImage
      ) {
        return (
          <img
            src={`${SERVER_URL}${messagePopup.profileImage}`}
            alt={
              messagePopup.name
            }
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
    <div className="chat-page">

      {/* ======================================================
          NEW MESSAGE POPUP
      ====================================================== */}

      {messagePopup && (
        <button
          type="button"
          className="chat-message-popup"
          onClick={
            openPopupChat
          }
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
          CHAT SIDEBAR (Hidden on mobile when chat is active)
      ====================================================== */}

      <aside className={`chat-sidebar ${showMobileChat ? "mobile-hidden" : ""}`}>

        <div className="chat-sidebar-header">

          <div>
            <h1>
              Messages
            </h1>

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

        {totalUnreadCount >
          0 && (
          <div className="chat-unread-summary">

            <span>
              💬
            </span>

            <strong>
              {totalUnreadCount >
              99
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

          <span>
            ⌕
          </span>

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
          ) : filteredUsers.length ===
            0 ? (
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
            filteredUsers.map(
              (user) => {
                const unread =
                  Number(
                    unreadCounts[
                      user._id
                    ] || 0
                  );

                return (
                  <button
                    key={
                      user._id
                    }
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
                          alt={
                            user.name
                          }
                        />
                      ) : (
                        getInitial(
                          user.name
                        )
                      )}

                      <span className="user-online-dot"></span>

                    </div>

                    <div className="chat-user-info">

                      <strong>
                        {user.name ||
                          "NoteHive User"}
                      </strong>

                      <span>
                        {user.profession ||
                          user.email ||
                          "NoteHive member"}
                      </span>

                    </div>

                    {/* UNREAD BADGE */}

                    {unread > 0 && (
                      <span className="chat-unread-badge">
                        {unread >
                        99
                          ? "99+"
                          : unread}
                      </span>
                    )}

                  </button>
                );
              }
            )
          )}

        </div>
      </aside>

      {/* ======================================================
          CHAT WINDOW (Hidden on mobile when sidebar is active)
      ====================================================== */}

      <main className={`chat-window ${!showMobileChat ? "mobile-hidden" : ""}`}>

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

              {/* BACK BUTTON FOR MOBILE */}
              <button
                type="button"
                className="chat-back-button"
                onClick={handleBackToList}
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

                  <span></span>

                </div>

                <div>

                  <h2>
                    {selectedUser.name ||
                      "NoteHive User"}
                  </h2>

                  <p>
                    {selectedUser.profession ||
                      "NoteHive member"}
                  </p>

                </div>

              </div>

              <div className="chat-header-status">

                <span></span>

                {socketConnected
                  ? "Connected"
                  : "Connecting..."}

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
                messages.map(
                  (item) => {
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
                        key={
                          item._id
                        }
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
                  }
                )
              )}

              <div
                ref={
                  messagesEndRef
                }
              />

            </section>

            {/* ==================================================
                MESSAGE INPUT
            ================================================== */}

            <form
              className="chat-input-area"
              onSubmit={
                sendMessage
              }
            >

              <div className="chat-input-box">

                <input
                  type="text"
                  placeholder={`Message ${
                    selectedUser.name ||
                    "user"
                  }...`}
                  value={
                    messageText
                  }
                  maxLength={
                    2000
                  }
                  onChange={(
                    event
                  ) =>
                    setMessageText(
                      event.target
                        .value
                    )
                  }
                />

                <span className="character-count">
                  {
                    messageText.length
                  }
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