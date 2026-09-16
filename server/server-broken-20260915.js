/* ============================================================
   NOTEHIVE SERVER
   Express + MongoDB + Socket.IO
   ============================================================ */

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const chatRoutes = require("./Routes/ChatRoutes");

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

/* ============================================================
   SOCKET.IO
   ============================================================ */

const io = new Server(httpServer, {
  cors: {
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
});

/* ============================================================
   MIDDLEWARE
   ============================================================ */

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

/* ============================================================
   UPLOADS
   ============================================================ */

const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use("/uploads", express.static(uploadsDir));

app.use("/api/chat", chatRoutes);

/* ============================================================
   MULTER - GENERAL FILES
   ============================================================ */

const generalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },

  filename: (req, file, cb) => {
    const safeName = file.originalname
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, "");

    cb(null, `${Date.now()}-${safeName}`);
  },
});

const generalFileFilter = (req, file, cb) => {
  const allowedExtensions = [
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".doc",
    ".docx",
  ];

  const extension = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(extension)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only PDF, JPG, JPEG, PNG, WEBP, DOC and DOCX files are allowed."
      )
    );
  }
};

const upload = multer({
  storage: generalStorage,
  fileFilter: generalFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

/* ============================================================
   MULTER - PROFILE IMAGE
   ============================================================ */

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    cb(null, `profile-${Date.now()}${extension}`);
  },
});

const profileFilter = (req, file, cb) => {
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

  const extension = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(extension)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG and WEBP profile images are allowed."));
  }
};

const profileUpload = multer({
  storage: profileStorage,
  fileFilter: profileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

/* ============================================================
   HELPERS
   ============================================================ */

const MAIN_ADMIN_EMAIL = "admin@notehive.com";

const parseBoolean = (value, defaultValue = false) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "yes", "on"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "no", "off"].includes(normalized)) {
      return false;
    }
  }

  return defaultValue;
};

const getFileNameFromPath = (filePath) => {
  if (!filePath) return "";

  return String(filePath)
    .replace(/^\/?uploads\//, "")
    .replace(/^uploads[\\/]/, "");
};

const deleteFileIfExists = (filePath) => {
  try {
    if (!filePath) return;

    const fileName = getFileNameFromPath(filePath);

    if (!fileName) return;

    const absolutePath = path.join(uploadsDir, fileName);

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (error) {
    console.error("?? File delete error:", error.message);
  }
};

const getProfileImagePath = (image) => {
  if (!image) return null;

  if (String(image).startsWith("http")) {
    return image;
  }

  if (String(image).startsWith("/uploads/")) {
    return image;
  }

  return `/uploads/${getFileNameFromPath(image)}`;
};

const deleteProfileImageFile = (image) => {
  if (!image) return;

  if (String(image).startsWith("http")) {
    return;
  }

  deleteFileIfExists(image);
};

const deleteNoteAttachments = (attachments = []) => {
  if (!Array.isArray(attachments)) return;

  attachments.forEach((attachment) => {
    if (typeof attachment === "string") {
      deleteFileIfExists(attachment);
      return;
    }

    if (attachment?.url) {
      deleteFileIfExists(attachment.url);
      return;
    }

    if (attachment?.path) {
      deleteFileIfExists(attachment.path);
    }
  });
};

/* ============================================================
   USER SCHEMA
   ============================================================ */

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    profileImage: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
    },

    profession: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
    },

    website: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },

    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

/* ============================================================
   NOTE SCHEMA
   ============================================================ */

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      default: "General",
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    completed: {
      type: Boolean,
      default: false,
    },

    pinned: {
      type: Boolean,
      default: false,
    },

    favorite: {
      type: Boolean,
      default: false,
    },

    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "private",
    },

    slug: {
      type: String,
      default: "",
    },

    attachments: {
      type: Array,
      default: [],
    },

    views: {
      type: Number,
      default: 0,
    },

    likes: {
      type: Array,
      default: [],
    },

    savedBy: {
      type: Array,
      default: [],
    },

    repostedBy: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

/* ============================================================
   ACTIVITY SCHEMA
   ============================================================ */

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/* ============================================================
   NOTIFICATION SCHEMA
   ============================================================ */

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    note: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      default: null,
    },

    type: {
      type: String,
      default: "general",
    },

    title: {
      type: String,
      default: "Notification",
    },

    message: {
      type: String,
      required: true,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    forAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

/* ============================================================
   MODELS
   ============================================================ */

const User = mongoose.model("User", userSchema);
const Note = mongoose.model("Note", noteSchema);
const Activity = mongoose.model("Activity", activitySchema);
const Notification = mongoose.model("Notification", notificationSchema);
const Message = require("./models/Message");

/* ============================================================
   ACTIVITY HELPER
   ============================================================ */

const createActivity = async (
  type,
  message,
  userId = null,
  noteId = null
) => {
  try {
    return await Activity.create({
      type,
      message,
      userId,
      noteId,
    });
  } catch (error) {
    console.error("?? Activity creation error:", error.message);
    return null;
  }
};

/* ============================================================
   SOCKET.IO
   ============================================================ */

io.on("connection", (socket) => {
  console.log("?? Socket connected:", socket.id);

  /* ==========================================================
     ADMIN ROOM
     ========================================================== */

  socket.on("join-admin", () => {
    socket.join("admin-room");

    console.log(
      `?? Admin joined notification room: ${socket.id}`
    );
  });

  /* ==========================================================
     USER ROOM
     ========================================================== */

  socket.on("join-user", (userId) => {
    if (!userId) return;

    socket.join(`user-${userId}`);

    console.log(
      `?? User joined chat room: ${userId}`
    );
  });

  /* ==========================================================
     SEND MESSAGE
     ========================================================== */

  socket.on("send-message", async (data) => {
    try {
      const { sender, receiver, message } = data;

      if (!sender || !receiver || !message?.trim()) {
        return;
      }

      if (
        !mongoose.Types.ObjectId.isValid(sender) ||
        !mongoose.Types.ObjectId.isValid(receiver)
      ) {
        return;
      }

      const senderUser = await User.findById(sender).select(
        "_id name email profileImage role"
      );

      const receiverUser = await User.findById(receiver).select(
        "_id name email profileImage role"
      );

      if (!senderUser || !receiverUser) {
        return;
      }

      if (
        senderUser.role !== "user" ||
        receiverUser.role !== "user"
      ) {
        return;
      }

      const newMessage = await Message.create({
        sender,
        receiver,
        message: message.trim(),
        read: false,
      });

      const messageData = {
        _id: newMessage._id,
        sender,
        receiver,
        message: newMessage.message,
        read: newMessage.read,
        createdAt: newMessage.createdAt,
      };

      /* Send message to receiver */

      io.to(`user-${receiver}`).emit(
        "receive-message",
        messageData
      );

      /* Confirm message to sender */

      io.to(`user-${sender}`).emit(
        "message-sent",
        messageData
      );

      console.log(
        `?? Message: ${sender} ? ${receiver}`
      );
    } catch (error) {
      console.error(
        "? Send message error:",
        error
      );

      socket.emit("message-error", {
        message: "Failed to send message.",
      });
    }
  });

  /* ==========================================================
     DISCONNECT
     ========================================================== */

  socket.on("disconnect", (reason) => {
    console.log(
      `?? Socket disconnected: ${socket.id} - ${reason}`
    );
  });
});
/* ============================================================
   DATABASE + SERVER START
   ============================================================ */

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("🟢 MongoDB connected");

    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`🐝 NoteHive server running on port ${PORT}`);
      console.log(`🌐 Local: http://localhost:${PORT}`);
      console.log(`📱 Network: http://192.168.1.68:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ MongoDB connection failed:", error.message);
  });