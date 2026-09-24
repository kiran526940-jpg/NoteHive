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

  const fileInputRef = useRef(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageViewer, setImageViewer] = useState(null);
  const [showWallpaperMenu, setShowWallpaperMenu] = useState(false);
  const [chatWallpaper, setChatWallpaper] = useState("default");

  const wallpaperOptions = [
    { id: "default", name: "Default", value: "" },
    { id: "sky", name: "Sky", value: "linear-gradient(135deg,#eaf4ff,#f7fbff 45%,#eef0ff)" },
    { id: "lavender", name: "Lavender", value: "linear-gradient(135deg,#f5efff,#eee7ff 50%,#fdf5ff)" },
    { id: "mint", name: "Mint", value: "linear-gradient(135deg,#ecfff8,#e9f8ff 55%,#f7fffb)" },
    { id: "peach", name: "Peach", value: "linear-gradient(135deg,#fff2eb,#fff7ef 50%,#fff0f7)" },
    { id: "night", name: "Night", value: "linear-gradient(135deg,#172033,#20283d 55%,#151827)" },
  ];

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
        newMessage.fileName ||
        (newMessage.messageType === "image"
          ? "📷 Photo"
          : "📎 File"),
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
      console.log(
        "🔥 RECEIVED USER TYPING EVENT:",
        data
      );

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
        console.log(
          "✅ TYPING EVENT MATCHED CURRENT CHAT:",
          data
        );

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
    // MESSAGE DELIVERED
    // ==========================================================

    const handleMessageDelivered =
      (updatedMessage) => {
        if (!updatedMessage?._id) {
          return;
        }

        console.log(
          "📬 MESSAGE DELIVERED:",
          updatedMessage
        );

        setMessages(
          (previousMessages) =>
            previousMessages.map(
              (item) =>
                String(item._id) ===
                String(
                  updatedMessage._id
                )
                  ? {
                      ...item,
                      delivered:
                        updatedMessage.delivered,
                      deliveredAt:
                        updatedMessage.deliveredAt,
                      read:
                        updatedMessage.read,
                      readAt:
                        updatedMessage.readAt,
                    }
                  : item
            )
        );
      };

    socket.on(
      "message-delivered",
      handleMessageDelivered
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

        const receiverId = String(
          newMessage.receiver?._id ||
            newMessage.receiver ||
            ""
        );

        if (!senderId) {
          return;
        }

        // ======================================================
        // MESSAGE DELIVERED ACK
        // ======================================================

        if (
          newMessage._id &&
          senderId &&
          receiverId
        ) {
          socket.emit(
            "message-delivered",
            {
              messageId:
                newMessage._id,

              sender:
                senderId,

              receiver:
                receiverId,
            }
          );

          console.log(
            "📬 DELIVERY ACK SENT:",
            {
              messageId:
                newMessage._id,
              sender:
                senderId,
              receiver:
                receiverId,
            }
          );
        }

        const openUser =
          selectedUserRef.current;

        const isCurrentChat =
          openUser &&
          String(openUser._id) ===
            senderId;

        // ======================================================
        // MESSAGE FROM CURRENT OPEN CHAT
        // ======================================================

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

        // ======================================================
        // INCREMENT UNREAD
        // ======================================================

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

        // ======================================================
        // POPUP
        // ======================================================

        showMessagePopup(
          newMessage
        );

        // ======================================================
        // HEADER EVENT
        // ======================================================

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
// MESSAGE READ / SEEN
// ==========================================================

const handleMessageRead =
  (readData) => {
    if (!readData?.messageId) {
      return;
    }

    console.log(
      "🔵 MESSAGE SEEN:",
      readData
    );

    setMessages(
      (previousMessages) =>
        previousMessages.map(
          (item) =>
            String(item._id) ===
            String(readData.messageId)
              ? {
                  ...item,
                  read: true,
                  readAt:
                    readData.readAt ||
                    new Date(),
                }
              : item
        )
    );
  };

socket.on(
  "message-read",
  handleMessageRead
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

      socket.off(
        "message-delivered",
        handleMessageDelivered
      );
socket.off(
  "message-read",
  handleMessageRead
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

        // ======================================================
        // INITIAL ONLINE STATUS
        // ======================================================

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

        // ======================================================
        // CLEAR UNREAD
        // ======================================================

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

        // ======================================================
// MARK READ
// ======================================================

console.log(
  "🔵 MARK READ REQUEST:",
  {
    currentUserId,
    selectedUserId:
      selectedUser._id,
  }
);

const readResponse =
  await fetch(
    `${SERVER_URL}/api/messages/${currentUserId}/${selectedUser._id}/read`,
    {
      method: "PATCH",
    }
  );

console.log(
  "🔵 MARK READ RESPONSE:",
  readResponse.status
);

const readData =
  await readResponse.json();

console.log(
  "🔵 MARK READ DATA:",
  readData
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


  const getFileUrl = (fileUrl) => {
    if (!fileUrl) return "";
    if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
    return `${SERVER_URL}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
  };

  const getWallpaperStorageKey = (userId) => `notehive_chat_wallpaper_${currentUserId}_${userId}`;

  const handleWallpaperChange = (wallpaperId) => {
    if (!selectedUser?._id || !currentUserId) return;
    setChatWallpaper(wallpaperId);
    setShowWallpaperMenu(false);
    localStorage.setItem(getWallpaperStorageKey(selectedUser._id), wallpaperId);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be 10 MB or less.");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Only PDF, JPG, JPEG, PNG, WEBP, DOC and DOCX files are allowed.");
      return;
    }

    setSelectedFile(file);
  };

  const clearSelectedFile = () => {
    if (uploadingFile) {
      return;
    }

    setSelectedFile(null);
  };

  const formatFileSize = (size) => {
    const bytes = Number(size || 0);

    if (!bytes) {
      return "0 KB";
    }

    if (bytes < 1024 * 1024) {
      return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }

    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  // ============================================================
  // SEND MESSAGE
  // ============================================================

  const sendMessage = async (event) => {
    event.preventDefault();

    const text = messageText.trim();

    if (
      (!text && !selectedFile) ||
      !currentUserId ||
      !selectedUser?._id ||
      !socketRef.current
    ) {
      return;
    }

    if (!socketRef.current.connected) {
      console.warn("Socket is not connected.");
      return;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    socketRef.current.emit("typing-stop", {
      sender: currentUserId,
      receiver: selectedUser._id,
    });

    setIsOtherUserTyping(false);

    try {
      let attachment = null;

      if (selectedFile) {
        setUploadingFile(true);

        const formData = new FormData();
        formData.append("file", selectedFile);

        const response = await fetch(
          `${SERVER_URL}/api/messages/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.success || !data.file?.url) {
          throw new Error(
            data.message || "Unable to upload file."
          );
        }

        attachment = data.file;
      }

      socketRef.current.emit(
        "send-message",
        {
          sender: currentUserId,
          receiver: selectedUser._id,
          message: text,
          messageType: attachment?.messageType || "text",
          fileUrl: attachment?.url || "",
          fileName: attachment?.name || "",
          fileSize: attachment?.size || 0,
          mimeType: attachment?.mimeType || "",
        },
        (result) => {
          if (!result?.success) {
            console.error(
              "❌ Message send failed:",
              result?.message
            );
            alert(result?.message || "Unable to send message.");
          }
        }
      );

      setMessageText("");
      setSelectedFile(null);
    } catch (error) {
      console.error("❌ Send message error:", error);
      alert(error.message || "Unable to send message.");
    } finally {
      setUploadingFile(false);
    }
  };

  // ============================================================
  // SELECT USER
  // ============================================================

  const handleSelectUser = (
    user
  ) => {
    // ==========================================================
    // STOP PREVIOUS TYPING INDICATOR
    // ==========================================================

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
    setShowWallpaperMenu(false);
    const savedWallpaper = localStorage.getItem(getWallpaperStorageKey(user._id));
    setChatWallpaper(savedWallpaper || "default");

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

    const messageDate = new Date(date);

    if (
      Number.isNaN(
        messageDate.getTime()
      )
    ) {
      return "";
    }

    return messageDate.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // ============================================================
  // FORMAT MESSAGE DATE
  // ============================================================

  const formatMessageDate = (date) => {
    if (!date) {
      return "";
    }

    const messageDate = new Date(date);

    if (
      Number.isNaN(
        messageDate.getTime()
      )
    ) {
      return "";
    }

    const today = new Date();

    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const yesterdayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - 1
    );

    const messageDayStart = new Date(
      messageDate.getFullYear(),
      messageDate.getMonth(),
      messageDate.getDate()
    );

    if (
      messageDayStart.getTime() ===
      todayStart.getTime()
    ) {
      return "TODAY";
    }

    if (
      messageDayStart.getTime() ===
      yesterdayStart.getTime()
    ) {
      return "YESTERDAY";
    }

    return messageDate.toLocaleDateString(
      [],
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
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
              <div className="chat-header-actions">
                <button type="button" className="chat-wallpaper-button" onClick={() => setShowWallpaperMenu((v) => !v)} title="Change chat wallpaper">🎨</button>
                {showWallpaperMenu && (
                  <div className="chat-wallpaper-menu">
                    <div className="chat-wallpaper-title">Chat wallpaper</div>
                    <div className="chat-wallpaper-grid">
                      {wallpaperOptions.map((option) => (
                        <button key={option.id} type="button" className={`chat-wallpaper-option ${chatWallpaper === option.id ? "active" : ""}`} style={option.value ? { background: option.value } : undefined} onClick={() => handleWallpaperChange(option.id)} title={option.name}>
                          {option.id === "default" ? "✦" : ""}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </header>

            {/* ==================================================
                MESSAGES
            ================================================== */}

            <section className={`chat-messages ${chatWallpaper !== "default" ? "has-wallpaper" : ""}`} style={{ background: wallpaperOptions.find((item) => item.id === chatWallpaper)?.value || undefined }}>
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
                  (item, index) => {
                    const isMine =
                      String(
                        item.sender?._id ||
                          item.sender
                      ) ===
                      String(
                        currentUserId
                      );

                    const currentDate =
                      formatMessageDate(
                        item.createdAt
                      );

                    const previousDate =
                      index > 0
                        ? formatMessageDate(
                            messages[
                              index - 1
                            ]?.createdAt
                          )
                        : null;

                    const showDateSeparator =
                      currentDate !==
                      previousDate;

                    return (
                      <React.Fragment
                        key={item._id}
                      >
                        {/* DATE SEPARATOR */}

                        {showDateSeparator && (
                          <div className="message-date-separator">
                            <span>
                              {currentDate}
                            </span>
                          </div>
                        )}

                        {/* MESSAGE */}

                        <div
                          className={`message-row ${
                            isMine
                              ? "mine"
                              : "theirs"
                          }`}
                        >
                          <div className={`message-bubble ${item.messageType === "image" ? "image-message-bubble" : ""}`}>
                            {(item.messageType || "text") === "image" && item.fileUrl ? (
                              <button type="button" className="chat-image-button" onClick={() => setImageViewer({ url: getFileUrl(item.fileUrl), name: item.fileName || "Image" })}>
                                <img src={getFileUrl(item.fileUrl)} alt={item.fileName || "Chat image"} className="chat-message-image" loading="lazy" />
                              </button>
                            ) : (item.messageType || "text") === "file" && item.fileUrl ? (
                              <div className="chat-file-card">
                                <div className="chat-file-icon">📎</div>
                                <div className="chat-file-info"><strong title={item.fileName || "File"}>{item.fileName || "File"}</strong><span>{item.fileSize ? formatFileSize(item.fileSize) : "File"}</span></div>
                                <a className="chat-file-download" href={getFileUrl(item.fileUrl)} download={item.fileName || "download"} target="_blank" rel="noreferrer" title="Download file">⬇</a>
                              </div>
                            ) : (<p>{item.message}</p>)}

                            <span className="message-meta">
                              {formatTime(
                                item.createdAt
                              )}

                              {isMine && (
                                <span
                                  className={`message-status ${
                                    item.read
                                      ? "read"
                                      : ""
                                  }`}
                                >
                                  {item.delivered
                                    ? "✓✓"
                                    : "✓✓"}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  }
                )
              )}

              <div
                ref={messagesEndRef}
              />
            </section>

            {/* ==================================================
                MESSAGE INPUT
            ================================================== */}

            <form className="chat-input-area" onSubmit={sendMessage}>
              <input ref={fileInputRef} type="file" className="chat-hidden-file-input" onChange={handleFileSelect} accept="image/jpeg,image/jpg,image/png,image/webp,.pdf,.doc,.docx" />
              <button type="button" className="chat-attach-button" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile} title="Send image or file">{uploadingFile ? "⏳" : "📎"}</button>

              {selectedFile && (
                <div
                  className="chat-selected-file"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "7px 10px",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.9)",
                    border: "1px solid rgba(120,120,180,0.18)",
                    maxWidth: "220px",
                    minWidth: 0,
                  }}
                >
                  <span style={{ fontSize: "18px" }}>
                    {selectedFile.type.startsWith("image/") ? "🖼️" : "📎"}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <strong
                      title={selectedFile.name}
                      style={{
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                      }}
                    >
                      {selectedFile.name}
                    </strong>
                    <span style={{ fontSize: "10px", opacity: 0.65 }}>
                      {formatFileSize(selectedFile.size)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelectedFile}
                    disabled={uploadingFile}
                    style={{
                      border: 0,
                      background: "transparent",
                      cursor: uploadingFile ? "not-allowed" : "pointer",
                      fontSize: "17px",
                      lineHeight: 1,
                      padding: "2px 4px",
                    }}
                    title="Remove file"
                  >
                    ×
                  </button>
                </div>
              )}

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

                    // ==================================================
                    // SOCKET / TYPING VALIDATION
                    // ==================================================

                    if (
                      !selectedUser?._id ||
                      !currentUserId ||
                      !socketRef.current ||
                      !socketRef.current.connected
                    ) {
                      return;
                    }

                    // ==================================================
                    // EMPTY MESSAGE = STOP TYPING
                    // ==================================================

                    if (!value.trim()) {
                      socketRef.current.emit(
                        "typing-stop",
                        {
                          sender:
                            currentUserId,
                          receiver:
                            selectedUser._id,
                        }
                      );

                      if (
                        typingTimeoutRef.current
                      ) {
                        clearTimeout(
                          typingTimeoutRef.current
                        );

                        typingTimeoutRef.current =
                          null;
                      }

                      return;
                    }

                    // ==================================================
                    // START TYPING
                    // ==================================================

                    console.log(
                      "⌨️ TYPING EMIT:",
                      {
                        sender:
                          currentUserId,
                        receiver:
                          selectedUser._id,
                        connected:
                          socketRef.current
                            .connected,
                      }
                    );

                    socketRef.current.emit(
                      "typing-start",
                      {
                        sender:
                          currentUserId,
                        receiver:
                          selectedUser._id,
                      }
                    );

                    // ==================================================
                    // RESET OLD TIMER
                    // ==================================================

                    if (
                      typingTimeoutRef.current
                    ) {
                      clearTimeout(
                        typingTimeoutRef.current
                      );
                    }

                    // ==================================================
                    // STOP AFTER 1 SECOND
                    // ==================================================

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
                  (!messageText.trim() && !selectedFile) ||
                  !socketConnected ||
                  uploadingFile
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
      {imageViewer && (
        <div className="chat-image-viewer" role="dialog" aria-modal="true" onClick={() => setImageViewer(null)}>
          <button type="button" className="chat-image-viewer-close" onClick={() => setImageViewer(null)}>×</button>
          <img src={imageViewer.url} alt={imageViewer.name || "Chat image"} onClick={(event) => event.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default Chat;