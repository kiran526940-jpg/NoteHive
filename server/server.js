// ============================================================
// NOTEHIVE BACKEND SERVER
// FULL UPDATED VERSION
// ============================================================

console.log(
  "?????? NOTEHIVE SERVER STARTING ??????"
);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const http = require("http");
const { Server } = require("socket.io");
const Message = require("./models/Message");

// ============================================================
// ENV
// ============================================================

dotenv.config();

// ============================================================
// APP CONFIG
// ============================================================

const app = express();

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: true,
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
    ],
  },
});

const PORT =
  process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI;

// ============================================================
// ENV CHECK
// ============================================================

if (!MONGO_URI) {
  console.error(
    "===================================="
  );

  console.error(
    "? MONGO_URI is missing in .env"
  );

  console.error(
    "===================================="
  );

  process.exit(1);
}

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "15mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "15mb",
  })
);

// ============================================================
// UPLOAD DIRECTORY
// ============================================================

const uploadDir =
  path.join(
    __dirname,
    "uploads"
  );

if (
  !fs.existsSync(
    uploadDir
  )
) {
  fs.mkdirSync(
    uploadDir,
    {
      recursive: true,
    }
  );
}

// ============================================================
// STATIC UPLOADS
// ============================================================

app.use(
  "/uploads",
  express.static(
    uploadDir
  )
);

// ============================================================
// MULTER STORAGE
// ============================================================

const storage =
  multer.diskStorage({

    destination: function (
      req,
      file,
      cb
    ) {
      cb(
        null,
        uploadDir
      );
    },

    filename: function (
      req,
      file,
      cb
    ) {
      const extension =
        path.extname(
          file.originalname
        );

      const safeName =
        path
          .basename(
            file.originalname,
            extension
          )
          .replace(
            /[^a-zA-Z0-9-_]/g,
            "_"
          );

      cb(
        null,
        `${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}-${safeName}${extension}`
      );
    },
  });

// ============================================================
// GENERAL FILE UPLOAD
// ============================================================

const upload =
  multer({

    storage,

    fileFilter:
      function (
        req,
        file,
        cb
      ) {

        const allowedTypes = [
          "application/pdf",
          "image/jpeg",
          "image/png",
          "image/jpg",
          "image/webp",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        if (
          allowedTypes.includes(
            file.mimetype
          )
        ) {
          cb(
            null,
            true
          );
        } else {
          cb(
            new Error(
              "Only PDF, JPG, JPEG, PNG, WEBP, DOC and DOCX files are allowed."
            )
          );
        }
      },

    limits: {
      fileSize:
        10 *
        1024 *
        1024,
    },
  });

// ============================================================
// PROFILE IMAGE FILTER
// ============================================================

const profileImageFilter =
  function (
    req,
    file,
    cb
  ) {

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
    ];

    if (
      allowedTypes.includes(
        file.mimetype
      )
    ) {
      cb(
        null,
        true
      );
    } else {
      cb(
        new Error(
          "Only JPG, JPEG, PNG and WEBP profile images are allowed."
        )
      );
    }
  };

// ============================================================
// PROFILE IMAGE UPLOAD
// ============================================================

const profileUpload =
  multer({

    storage,

    fileFilter:
      profileImageFilter,

    limits: {
      fileSize:
        5 *
        1024 *
        1024,
    },
  });

// ============================================================
// DELETE FILE HELPER
// ============================================================

const deleteFileIfExists =
  (
    filePath
  ) => {

    try {

      if (
        filePath &&
        fs.existsSync(
          filePath
        )
      ) {
        fs.unlinkSync(
          filePath
        );
      }

    } catch (
      error
    ) {

      console.log(
        "File delete error:",
        error.message
      );
    }
  };

// ============================================================
// PROFILE IMAGE PATH HELPER
// ============================================================

const getProfileImagePath =
  (
    profileImage
  ) => {

    if (
      !profileImage
    ) {
      return "";
    }

    const image =
      String(
        profileImage
      ).trim();

    if (!image) {
      return "";
    }

    if (
      image.startsWith(
        "http://"
      ) ||
      image.startsWith(
        "https://"
      )
    ) {
      return image;
    }

    if (
      image.startsWith(
        "/uploads/"
      )
    ) {
      return image;
    }

    if (
      image.startsWith(
        "uploads/"
      )
    ) {
      return `/${image}`;
    }

    return `/uploads/${image}`;
  };

// ============================================================
// DELETE PROFILE IMAGE FILE
// ============================================================

const deleteProfileImageFile =
  (
    profileImage
  ) => {

    try {

      if (
        !profileImage
      ) {
        return;
      }

      const image =
        String(
          profileImage
        ).trim();

      if (!image) {
        return;
      }

      // Never delete external URL
      if (
        image.startsWith(
          "http://"
        ) ||
        image.startsWith(
          "https://"
        )
      ) {
        return;
      }

      let filename =
        image;

      if (
        filename.startsWith(
          "/uploads/"
        )
      ) {
        filename =
          filename.replace(
            /^\/uploads\//,
            ""
          );
      }

      if (
        filename.startsWith(
          "uploads/"
        )
      ) {
        filename =
          filename.replace(
            /^uploads\//,
            ""
          );
      }

      filename =
        path.basename(
          filename
        );

      if (!filename) {
        return;
      }

      const fullPath =
        path.join(
          uploadDir,
          filename
        );

      deleteFileIfExists(
        fullPath
      );

    } catch (
      error
    ) {

      console.log(
        "Profile image delete error:",
        error.message
      );
    }
  };

// ============================================================
// USER MODEL
// ============================================================

const userSchema =
  new mongoose.Schema(
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
        trim: true,
      },

      location: {
        type: String,
        default: "",
        trim: true,
      },

      website: {
        type: String,
        default: "",
        trim: true,
      },

      role: {
        type: String,
        enum: [
          "user",
          "admin",
        ],
        default: "user",
      },

      status: {
        type: String,
        enum: [
          "pending",
          "approved",
          "rejected",
        ],
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

// ============================================================
// NOTE MODEL
// ============================================================

const noteSchema =
  new mongoose.Schema(
    {

      user: {
        type:
          mongoose.Schema.Types.ObjectId,
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
        enum: [
          "Low",
          "Medium",
          "High",
        ],
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
        enum: [
          "private",
          "public",
        ],
        default: "private",
      },

      slug: {
        type: String,
        default: "",
      },

      attachments: [
        {
          filename:
            String,

          originalName:
            String,

          path:
            String,

          mimetype:
            String,
        },
      ],

      views: {
        type: Number,
        default: 0,
      },

      likes: {
        type: Number,
        default: 0,
      },
      likedBy: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
],

      savedBy: [
        {
          type:
            mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],

      repostedBy: [
        {
          type:
            mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },

    {
      timestamps: true,
    }
  );
// ============================================================
// COMMENT MODEL
// ============================================================

const commentSchema = new mongoose.Schema(
  {
    note: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);
// ============================================================
// ACTIVITY MODEL
// ============================================================

const activitySchema =
  new mongoose.Schema(
    {

      type: {
        type: String,
        default: "general",
      },

      message: {
        type: String,
        required: true,
      },

      userId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      noteId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Note",
        default: null,
      },
    },

    {
      timestamps: true,
    }
  );

// ============================================================
// NOTIFICATION MODEL
// ============================================================

const notificationSchema =
  new mongoose.Schema(
    {

      user: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      sender: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      note: {
        type:
          mongoose.Schema.Types.ObjectId,
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
    },

    {
      timestamps: true,
    }
  );

// ============================================================
// MODELS
// ============================================================

const User =
  mongoose.model(
    "User",
    userSchema
  );

const Note =
  mongoose.model(
    "Note",
    noteSchema
  );
const Comment =
  mongoose.model(
    "Comment",
    commentSchema
  );
const Activity =
  mongoose.model(
    "Activity",
    activitySchema
  );

const Notification =
  mongoose.model(
    "Notification",
    notificationSchema
  );
// ============================================================
// OBJECT ID HELPER
// ============================================================

const isValidObjectId =
  (id) => {
    return mongoose.Types.ObjectId.isValid(
      id
    );
  };

// ============================================================
// EMAIL HELPER
// ============================================================

const normalizeEmail =
  (email) => {
    return String(
      email || ""
    )
      .trim()
      .toLowerCase();
  };
// ============================================================
// ACTIVITY + ADMIN NOTIFICATION HELPER
// ============================================================

async function createActivity(
  type,
  message,
  userId = null,
  noteId = null
) {
  try {
    const activity = await Activity.create({
      type,
      message,
      userId,
      noteId,
    });

    console.log("========================================");
    console.log("? ACTIVITY CREATED");
    console.log("?? Activity ID:", activity._id);
    console.log("?? Type:", type);
    console.log("?? Message:", message);
    console.log("?? User ID:", userId);
    console.log("?? Note ID:", noteId);
    console.log("========================================");

    const adminNotificationTypes = [
      "user_registered",
      "user_login",
      "user_updated",
      "user_profile_updated",
      "user_password_changed",

      "note_created",
      "note_updated",
      "note_deleted",
      "note_pinned",
      "note_unpinned",
      "note_favorited",
      "note_unfavorited",

      "comment_created",
      "comment_added",
      "comment_deleted",
    ];

    if (!adminNotificationTypes.includes(type)) {
      return activity;
    }

    const admin = await User.findOne({
      email: "admin@notehive.com",
      role: "admin",
    });

    if (!admin) {
      console.log("?? Admin user not found.");
      return activity;
    }

    let title = "NoteHive Activity";
    let notificationType = "general";

    if (type === "user_registered") {
      title = "New User Registered";
      notificationType = "user";
    } else if (type === "user_login") {
      title = "User Logged In";
      notificationType = "user";
    } else if (
      type === "user_updated" ||
      type === "user_profile_updated"
    ) {
      title = "User Profile Updated";
      notificationType = "user";
    } else if (type === "user_password_changed") {
      title = "Password Changed";
      notificationType = "user";
    } else if (type === "note_created") {
      title = "New Note Created";
      notificationType = "note";
    } else if (type === "note_updated") {
      title = "Note Updated";
      notificationType = "note";
    } else if (type === "note_deleted") {
      title = "Note Deleted";
      notificationType = "note";
    } else if (
      type === "note_pinned" ||
      type === "note_unpinned"
    ) {
      title = "Note Pin Updated";
      notificationType = "note";
    } else if (
      type === "note_favorited" ||
      type === "note_unfavorited"
    ) {
      title = "Note Favorite Updated";
      notificationType = "note";
    } else if (
      type === "comment_created" ||
      type === "comment_added"
    ) {
      title = "New Comment Added";
      notificationType = "comment";
    } else if (type === "comment_deleted") {
      title = "Comment Deleted";
      notificationType = "comment";
    }

    const notification = await Notification.create({
      user: admin._id,
      sender: userId || null,
      note: noteId || null,
      type: notificationType,
      title,
      message,
      isRead: false,
    });

    console.log("========================================");
    console.log("?? ADMIN NOTIFICATION CREATED");
    console.log("?? Notification ID:", notification._id);
    console.log("?? Admin ID:", admin._id);
    console.log("?? Sender ID:", userId);
    console.log("?? Type:", notificationType);
    console.log("??? Title:", title);
    console.log("?? Message:", message);
    console.log("========================================");

    const populatedNotification =
      await Notification.findById(
        notification._id
      )
        .populate(
          "user",
          "name email profileImage"
        )
        .populate(
          "sender",
          "name email profileImage"
        )
        .populate(
          "note",
          "title"
        )
        .lean();

    console.log(
      "?? EMITTING ADMIN NOTIFICATION ? admin-room"
    );

    io.to("admin-room").emit(
      "admin-notification",
      populatedNotification
    );

    console.log(
      `? Admin notification sent: ${title} - ${message}`
    );

    return activity;

  } catch (error) {
    console.error(
      "? Activity / Admin notification error:",
      error
    );

    return null;
  }
}
// ============================================================
// SOCKET.IO - REAL-TIME FEATURES
// ============================================================

io.on("connection", (socket) => {
  console.log("?? Socket connected:", socket.id);

  // ==========================================================
  // ADMIN NOTIFICATION ROOM
  // ==========================================================

  socket.on("join-admin", () => {
    socket.join("admin-room");

    console.log(
      `?? Admin joined notification room: ${socket.id}`
    );
  });

  // ==========================================================
  // USER REAL-TIME ROOM
  // ==========================================================

  socket.on("join-user", (userId) => {
    if (!userId) {
      return;
    }

    const roomName = `user-${userId}`;

    socket.join(roomName);

    console.log(
      `?? User joined room ${roomName}: ${socket.id}`
    );
  });

  // ==========================================================
  // CHAT - REAL-TIME MESSAGE
  // ==========================================================

  socket.on("send-message", async (data, callback) => {
    try {
      console.log("?? send-message received:", data);

      const {
        sender,
        receiver,
        message,
      } = data || {};

      // --------------------------------------------------------
      // VALIDATION
      // --------------------------------------------------------

      if (
        !sender ||
        !receiver ||
        !message?.trim()
      ) {
        console.log(
          "? send-message validation failed"
        );

        if (typeof callback === "function") {
          callback({
            success: false,
            message:
              "Sender, receiver and message are required.",
          });
        }

        return;
      }

      if (
        !mongoose.Types.ObjectId.isValid(sender) ||
        !mongoose.Types.ObjectId.isValid(receiver)
      ) {
        console.log(
          "? Invalid sender or receiver:",
          sender,
          receiver
        );

        if (typeof callback === "function") {
          callback({
            success: false,
            message:
              "Invalid sender or receiver ID.",
          });
        }

        return;
      }

      // --------------------------------------------------------
      // SAVE MESSAGE IN MONGODB
      // --------------------------------------------------------

      const newMessage =
        await Message.create({
          sender,
          receiver,
          message: message.trim(),
          read: false,
        });

      console.log(
        "?? Message saved:",
        newMessage._id.toString()
      );

      // --------------------------------------------------------
      // POPULATE USER DETAILS
      // --------------------------------------------------------

      const populatedMessage =
        await Message.findById(
          newMessage._id
        )
          .populate(
            "sender",
            "name email profileImage"
          )
          .populate(
            "receiver",
            "name email profileImage"
          );

      // --------------------------------------------------------
      // ROOM NAMES
      // --------------------------------------------------------

      const receiverRoom =
        `user-${receiver}`;

      const senderRoom =
        `user-${sender}`;

      console.log(
        "?? Sending to receiver room:",
        receiverRoom
      );

      console.log(
        "?? Sending to sender room:",
        senderRoom
      );

      // --------------------------------------------------------
      // SEND TO RECEIVER
      // --------------------------------------------------------

      io.to(receiverRoom).emit(
        "receive-message",
        populatedMessage
      );

      // --------------------------------------------------------
      // SEND BACK TO SENDER
      // --------------------------------------------------------

      io.to(senderRoom).emit(
        "message-sent",
        populatedMessage
      );

      // --------------------------------------------------------
      // ACKNOWLEDGEMENT
      // --------------------------------------------------------

      if (typeof callback === "function") {
        callback({
          success: true,
          message:
            "Message sent successfully.",
          data: populatedMessage,
        });
      }

      console.log(
        "? Real-time message delivered"
      );
    } catch (error) {
      console.error(
        "? Socket send message error:",
        error
      );

      if (typeof callback === "function") {
        callback({
          success: false,
          message:
            "Unable to send message.",
        });
      }
    }
  });

  // ==========================================================
  // DISCONNECT
  // ==========================================================

  socket.on("disconnect", (reason) => {
    console.log(
      `?? Socket disconnected: ${socket.id} | ${reason}`
    );
  });
});
// ============================================================
// HEALTH CHECK
// ============================================================

app.get(
  "/",
  (
    req,
    res
  ) => {

    res.json({

      success: true,

      message:
        "NoteHive server is running ??",

      server:
        "NoteHive Backend",

      port:
        PORT,
    });
  }
);

/// ============================================================
// USER SIGNUP
// ============================================================

app.post("/api/users", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    }

    // --------------------------------------------------------
    // HASH PASSWORD
    // --------------------------------------------------------

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const user = await User.create({
      name: String(name).trim(),

      email: normalizedEmail,

      password: hashedPassword,

      role: "user",

      status: "pending",
    });

    console.log(
  "?? ABOUT TO CREATE USER REGISTRATION ACTIVITY:",
  user._id
);

await createActivity(
  "user_registered",
  `${user.name} created a new account.`,
  user._id
);

console.log(
  "? CREATE ACTIVITY FUNCTION FINISHED"
);

    return res.status(201).json({
      success: true,

      message:
        "Account created successfully. Waiting for admin approval.",

      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        profileImage: "",
        bio: "",
      },
    });

  } catch (error) {
    console.error("? Signup Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during signup.",
    });
  }
});


// ============================================================
// USER LOGIN
// ============================================================

app.post("/api/users/login", async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // --------------------------------------------------------
    // CHECK ACCOUNT STATUS
    // --------------------------------------------------------

    if (user.status === "pending") {
      return res.status(403).json({
        success: false,
        status: "pending",
        message:
          "Your account is waiting for admin approval.",
        user: {
          _id: user._id,
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      });
    }

    if (user.status === "rejected") {
      return res.status(403).json({
        success: false,
        status: "rejected",
        message:
          "Your account has been rejected by admin.",
        user: {
          _id: user._id,
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      });
    }

    // --------------------------------------------------------
    // BCRYPT PASSWORD CHECK
    // --------------------------------------------------------

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // --------------------------------------------------------
    // LOGIN ACTIVITY
    // --------------------------------------------------------

    await createActivity(
      "user_login",
      `${user.name} logged into NoteHive.`,
      user._id
    );
    

    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    return res.json({
      success: true,

      message: "Login successful.",

      user: {
        _id: user._id,
        id: user._id,

        name: user.name,

        email: user.email,

        role: user.role,

        status: user.status,

        profileImage:
          getProfileImagePath(
            user.profileImage
          ),

        bio: user.bio || "",

        profession:
          user.profession || "",

        location:
          user.location || "",

        website:
          user.website || "",
      },
    });

  } catch (error) {
    console.error(
      "? User Login Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error during login.",
    });
  }
});


// ============================================================
// ADMIN LOGIN
// ============================================================

app.post("/api/admin/login", async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Admin email and password are required.",
      });
    }

    const normalizedEmail =
      normalizeEmail(email);

    // --------------------------------------------------------
    // FIND ADMIN
    // --------------------------------------------------------

    const admin = await User.findOne({
      email: normalizedEmail,
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin account not found.",
      });
    }

    // --------------------------------------------------------
    // CHECK PASSWORD
    // --------------------------------------------------------

    const passwordMatch =
      await bcrypt.compare(
        password,
        admin.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid admin email or password.",
      });
    }

    // --------------------------------------------------------
    // CHECK ROLE
    // --------------------------------------------------------

    if (admin.role !== "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. This account is not an admin.",
      });
    }

    // --------------------------------------------------------
    // CHECK STATUS
    // --------------------------------------------------------

    if (admin.status === "pending") {
      return res.status(403).json({
        success: false,
        status: "pending",
        message:
          "Admin account is waiting for approval.",
      });
    }

    if (admin.status === "rejected") {
      return res.status(403).json({
        success: false,
        status: "rejected",
        message:
          "Admin account has been rejected.",
      });
    }

    // --------------------------------------------------------
    // ADMIN ACTIVITY
    // --------------------------------------------------------

    try {
      await createActivity(
        "admin_login",
        `${admin.name} logged into Admin Dashboard.`,
        admin._id
      );
    } catch (activityError) {
      console.error(
        "Admin activity error:",
        activityError.message
      );
    }

    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        "Admin login successful.",

      admin: {
        _id: admin._id,

        id: admin._id,

        name: admin.name,

        email: admin.email,

        role: admin.role,

        status: admin.status,

        profileImage:
          admin.profileImage
            ? getProfileImagePath(
                admin.profileImage
              )
            : "",

        bio: admin.bio || "",

        profession:
          admin.profession || "",

        location:
          admin.location || "",

        website:
          admin.website || "",
      },
    });

  } catch (error) {
    console.error(
      "? Admin Login Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error during admin login.",
    });
  }
});
// ============================================================
// UPDATE USER PROFILE
// NAME + BIO + EMAIL + OTHER PROFILE DATA
// ============================================================

app.put(
  "/api/users/:id",
  async (
    req,
    res
  ) => {

    try {

      const {
        id,
      } = req.params;

      if (
        !isValidObjectId(
          id
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Invalid user ID ?",
          });
      }

      const {
        name,
        email,
        bio,
        profession,
        location,
        website,
      } = req.body;

      const user =
        await User.findById(
          id
        );

      if (!user) {

        return res
          .status(404)
          .json({

            success: false,

            message:
              "User not found ?",
          });
      }

      // ========================================================
      // EMAIL
      // ========================================================

      if (
        email !== undefined
      ) {

        const normalizedEmail =
          normalizeEmail(
            email
          );

        if (
          !normalizedEmail
        ) {

          return res
            .status(400)
            .json({

              success: false,

              message:
                "Email cannot be empty ?",
            });
        }

        const emailUser =
          await User.findOne({

            email:
              normalizedEmail,

            _id: {
              $ne: id,
            },
          });

        if (
          emailUser
        ) {

          return res
            .status(409)
            .json({

              success: false,

              message:
                "Email already used by another account ?",
            });
        }

        user.email =
          normalizedEmail;
      }

      // ========================================================
      // NAME
      // ========================================================

      if (
        name !== undefined
      ) {

        const cleanName =
          String(
            name
          ).trim();

        if (
          !cleanName
        ) {

          return res
            .status(400)
            .json({

              success: false,

              message:
                "Name cannot be empty ?",
            });
        }

        user.name =
          cleanName;
      }

      // ========================================================
      // BIO
      // ========================================================

      if (
        bio !== undefined
      ) {

        user.bio =
          String(
            bio
          ).trim();
      }

      // ========================================================
      // PROFESSION
      // ========================================================

      if (
        profession !==
        undefined
      ) {

        user.profession =
          String(
            profession
          ).trim();
      }

      // ========================================================
      // LOCATION
      // ========================================================

      if (
        location !==
        undefined
      ) {

        user.location =
          String(
            location
          ).trim();
      }

      // ========================================================
      // WEBSITE
      // ========================================================

      if (
        website !==
        undefined
      ) {

        user.website =
          String(
            website
          ).trim();
      }

    await user.save();

await createActivity(
  "user_password_changed",
  `${user.name} changed their password.`,
  user._id
);

return res.json({
        success: true,

        message:
          "Profile updated successfully ?",

        user: {

          id:
            user._id,

          _id:
            user._id,

          name:
            user.name,

          email:
            user.email,

          role:
            user.role,

          status:
            user.status,

          profileImage:
            getProfileImagePath(
              user.profileImage
            ),

          bio:
            user.bio ||
            "",

          profession:
            user.profession ||
            "",

          location:
            user.location ||
            "",

          website:
            user.website ||
            "",
        },
      });

    } catch (
      error
    ) {

      console.error(
        "Update profile error:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            "Profile update failed ?",

          error:
            error.message,
        });
    }
  }
);
// ============================================================
// USER LOGIN
// ============================================================

app.post("/api/users/login", async (req, res) => {
  try {

    // tumhara existing login code

    await createActivity(
      "user_login",
      `${user.name} logged into NoteHive.`,
      user._id
    );

    return res.json({
      success: true,
      message: "Login successful.",
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        profileImage: user.profileImage,
        bio: user.bio,
      },
    });

  } catch (error) {

    console.error(
      "? Login Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error during login.",
    });
  }
});


// ============================================================
// ADMIN REPORTS & ANALYTICS
// ============================================================

app.get("/api/admin/reports", async (req, res) => {
  try {

    const totalUsers =
      await User.countDocuments();

    const totalNotes =
      await Note.countDocuments();

    const completedNotes =
      await Note.countDocuments({
        completed: true,
      });

    const pendingNotes =
      await Note.countDocuments({
        completed: { $ne: true },
      });

    const pinnedNotes =
      await Note.countDocuments({
        pinned: true,
      });

    const favoriteNotes =
      await Note.countDocuments({
        favorite: true,
      });

    const publicNotes =
      await Note.countDocuments({
        visibility: "public",
      });

    const privateNotes =
      await Note.countDocuments({
        visibility: "private",
      });


    // ========================================================
    // TODAY
    // ========================================================

    const today = new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const tomorrow = new Date(today);

    tomorrow.setDate(
      tomorrow.getDate() + 1
    );


    const todayUsers =
      await User.countDocuments({
        createdAt: {
          $gte: today,
          $lt: tomorrow,
        },
      });


    const todayNotes =
      await Note.countDocuments({
        createdAt: {
          $gte: today,
          $lt: tomorrow,
        },
      });


    // ========================================================
    // CATEGORY REPORT
    // ========================================================

    const categoryReport =
      await Note.aggregate([
        {
          $group: {
            _id: {
              $ifNull: [
                "$category",
                "Uncategorized",
              ],
            },

            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            count: -1,
          },
        },
      ]);


    // ========================================================
    // USER REPORT
    // ========================================================

    const userReport =
      await User.aggregate([
        {
          $lookup: {
            from: "notes",

            localField: "_id",

            foreignField: "user",

            as: "userNotes",
          },
        },

        {
          $project: {
            name: 1,

            email: 1,

            notesCount: {
              $size: "$userNotes",
            },

            completedCount: {
              $size: {
                $filter: {
                  input: "$userNotes",

                  as: "note",

                  cond: {
                    $eq: [
                      "$$note.completed",
                      true,
                    ],
                  },
                },
              },
            },

            pinnedCount: {
              $size: {
                $filter: {
                  input: "$userNotes",

                  as: "note",

                  cond: {
                    $eq: [
                      "$$note.pinned",
                      true,
                    ],
                  },
                },
              },
            },
          },
        },

        {
          $sort: {
            notesCount: -1,
          },
        },
      ]);


    // ========================================================
    // LAST 7 DAYS NOTES
    // ========================================================

    const sevenDaysAgo =
      new Date();

    sevenDaysAgo.setHours(
      0,
      0,
      0,
      0
    );

    sevenDaysAgo.setDate(
      sevenDaysAgo.getDate() - 6
    );


    const notesLast7Days =
      await Note.aggregate([
        {
          $match: {
            createdAt: {
              $gte: sevenDaysAgo,
            },
          },
        },

        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",

                date: "$createdAt",
              },
            },

            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            _id: 1,
          },
        },
      ]);


    // ========================================================
    // LAST 7 DAYS USERS
    // ========================================================

    const usersLast7Days =
      await User.aggregate([
        {
          $match: {
            createdAt: {
              $gte: sevenDaysAgo,
            },
          },
        },

        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",

                date: "$createdAt",
              },
            },

            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            _id: 1,
          },
        },
      ]);


    // ========================================================
    // RESPONSE
    // ========================================================

    return res.json({
      success: true,

      message:
        "Admin reports fetched successfully ?",

      overview: {
        totalUsers,

        totalNotes,

        completedNotes,

        pendingNotes,

        pinnedNotes,

        favoriteNotes,

        publicNotes,

        privateNotes,

        todayUsers,

        todayNotes,
      },

      categoryReport,

      userReport,

      notesLast7Days,

      usersLast7Days,
    });

  } catch (error) {

    console.error(
      "? Admin Reports Error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to fetch admin reports",

      error:
        error.message,
    });
  }
});
// ============================================================
// UPLOAD / REPLACE PROFILE PHOTO
// ============================================================

app.put(
  "/api/users/:id/photo",
  profileUpload.single(
    "profileImage"
  ),
  async (
    req,
    res
  ) => {

    try {

      const {
        id,
      } = req.params;

      if (
        !isValidObjectId(
          id
        )
      ) {

        if (
          req.file
        ) {

          deleteFileIfExists(
            path.join(
              uploadDir,
              req.file.filename
            )
          );
        }

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Invalid user ID ?",
          });
      }

      if (
        !req.file
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Profile image is required ?",
          });
      }

      const user =
        await User.findById(
          id
        );

      if (!user) {

        deleteFileIfExists(
          path.join(
            uploadDir,
            req.file.filename
          )
        );

        return res
          .status(404)
          .json({

            success: false,

            message:
              "User not found ?",
          });
      }

      // ======================================================
      // OLD IMAGE
      // ======================================================

      const oldProfileImage =
        user.profileImage;

      // ======================================================
      // NEW IMAGE
      // ======================================================

      user.profileImage =
        `/uploads/${req.file.filename}`;

      await user.save();

      // ======================================================
      // DELETE OLD IMAGE
      // ======================================================

      if (
        oldProfileImage &&
        oldProfileImage !==
          user.profileImage
      ) {

        deleteProfileImageFile(
          oldProfileImage
        );
      }

      return res.json({

        success: true,

        message:
          "Profile photo updated successfully ?",

        user: {

          id:
            user._id,

          _id:
            user._id,

          name:
            user.name,

          email:
            user.email,

          role:
            user.role,

          status:
            user.status,

          profileImage:
            getProfileImagePath(
              user.profileImage
            ),

          bio:
            user.bio ||
            "",
        },
      });

    } catch (
      error
    ) {

      console.error(
        "Profile photo upload error:",
        error
      );

      if (
        req.file
      ) {

        deleteFileIfExists(
          path.join(
            uploadDir,
            req.file.filename
          )
        );
      }

      return res
        .status(500)
        .json({

          success: false,

          message:
            "Profile photo upload failed ?",

          error:
            error.message,
        });
    }
  }
);

// ============================================================
// REMOVE PROFILE PHOTO
// ============================================================

app.delete(
  "/api/users/:id/photo",
  async (
    req,
    res
  ) => {

    try {

      const {
        id,
      } = req.params;

      if (
        !isValidObjectId(
          id
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Invalid user ID ?",
          });
      }

      const user =
        await User.findById(
          id
        );

      if (!user) {

        return res
          .status(404)
          .json({

            success: false,

            message:
              "User not found ?",
          });
      }

      const oldProfileImage =
        user.profileImage;

      user.profileImage =
        "";

      await user.save();

      if (
        oldProfileImage
      ) {

        deleteProfileImageFile(
          oldProfileImage
        );
      }

      return res.json({

        success: true,

        message:
          "Profile photo removed successfully ?",

        user: {

          id:
            user._id,

          _id:
            user._id,

          name:
            user.name,

          email:
            user.email,

          role:
            user.role,

          status:
            user.status,

          profileImage:
            "",

          bio:
            user.bio ||
            "",
        },
      });

    } catch (
      error
    ) {

      console.error(
        "Remove profile photo error:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            "Failed to remove profile photo ?",

          error:
            error.message,
        });
    }
  }
);

// ============================================================
// CHANGE PASSWORD
// ============================================================

app.put(
  "/api/users/:id/change-password",
  async (
    req,
    res
  ) => {

    try {

      const {
        currentPassword,
        oldPassword,
        newPassword,
      } = req.body;

      const oldPass =
        currentPassword ||
        oldPassword;

      if (
        !oldPass ||
        !newPassword
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Current and new password are required.",
          });
      }

      const user =
        await User.findById(
          req.params.id
        );

      if (!user) {

        return res
          .status(404)
          .json({

            success: false,

            message:
              "User not found.",
          });
      }

      if (
        user.password !==
        oldPass
      ) {

        return res
          .status(401)
          .json({

            success: false,

            message:
              "Current password is incorrect.",
          });
      }

      user.password =
        newPassword;

      await user.save();

      return res.json({

        success: true,

        message:
          "Password changed successfully.",
      });

    } catch (
      error
    ) {

      return res
        .status(500)
        .json({

          success: false,

          message:
            "Failed to change password.",

          error:
            error.message,
        });
    }
  }
);
// ============================================================
// DELETE USER ACCOUNT
// ============================================================

app.delete(
  "/api/users/:id",
  async (
    req,
    res
  ) => {

    try {

      const {
        id,
      } = req.params;

      if (
        !isValidObjectId(
          id
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Invalid user ID ?",
          });
      }

      const user =
        await User.findById(
          id
        );

      if (!user) {

        return res
          .status(404)
          .json({

            success: false,

            message:
              "User not found ?",
          });
      }

      // Delete user's profile image
      if (
        user.profileImage
      ) {

        deleteProfileImageFile(
          user.profileImage
        );
      }

      // Delete user's notes
      const userNotes =
        await Note.find({
          user:
            id,
        });

      for (
        const note of userNotes
      ) {

        if (
          note.attachments &&
          note.attachments.length
        ) {

          note.attachments.forEach(
            (
              attachment
            ) => {

              if (
                attachment.path
              ) {

                let filename =
                  String(
                    attachment.path
                  );

                filename =
                  filename.replace(
                    /^\/uploads\//,
                    ""
                  );

                filename =
                  path.basename(
                    filename
                  );

                deleteFileIfExists(
                  path.join(
                    uploadDir,
                    filename
                  )
                );
              }
            }
          );
        }
      }

      await Note.deleteMany({
        user:
          id,
      });

      await Notification.deleteMany({
        user:
          id,
      });

      await Activity.deleteMany({`r`n  userId: id,`r`n});`r`n`r`nawait User.findByIdAndDelete(id);


return res.json({

        success: true,

        message:
          "User account deleted successfully ?",
      });

    } catch (
      error
    ) {

      console.error(
        "Delete user error:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            "Failed to delete user ?",

          error:
            error.message,
        });
    }
  }
);

// ============================================================
// USER SETTINGS - GET
// ============================================================

app.get(
  "/api/users/:id/settings",
  async (
    req,
    res
  ) => {

    try {

      const {
        id,
      } = req.params;

      if (
        !isValidObjectId(
          id
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Invalid user ID ?",
          });
      }

      const user =
        await User.findById(
          id
        ).select(
          "notificationsEnabled"
        );

      if (!user) {

        return res
          .status(404)
          .json({

            success: false,

            message:
              "User not found ?",
          });
      }

      return res.json({

        success: true,

        settings: {

          notificationsEnabled:
            user.notificationsEnabled,
        },
      });

    } catch (
      error
    ) {

      return res
        .status(500)
        .json({

          success: false,

          message:
            "Failed to fetch settings.",

          error:
            error.message,
        });
    }
  }
);

// ============================================================
// USER SETTINGS - UPDATE
// ============================================================

app.put(
  "/api/users/:id/settings",
  async (
    req,
    res
  ) => {

    try {

      const {
        id,
      } = req.params;

      const {
        notificationsEnabled,
      } = req.body;

      if (
        !isValidObjectId(
          id
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Invalid user ID ?",
          });
      }

      const user =
        await User.findById(
          id
        );

      if (!user) {

        return res
          .status(404)
          .json({

            success: false,

            message:
              "User not found ?",
          });
      }

      if (
        notificationsEnabled !==
        undefined
      ) {

        user.notificationsEnabled =
          Boolean(
            notificationsEnabled
          );
      }

      await user.save();

      return res.json({

        success: true,

        message:
          "Settings updated successfully ?",

        settings: {

          notificationsEnabled:
            user.notificationsEnabled,
        },
      });

    } catch (
      error
    ) {

      return res
        .status(500)
        .json({

          success: false,

          message:
            "Failed to update settings.",

          error:
            error.message,
        });
    }
  }
);

// ============================================================
// USER NOTIFICATIONS - GET
// ============================================================

app.get(
  "/api/users/:id/notifications",
  async (
    req,
    res
  ) => {

    try {

      const {
        id,
      } = req.params;

      if (
        !isValidObjectId(
          id
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Invalid user ID ?",
          });
      }

      const notifications =
        await Notification.find({
          user:
            id,
        })
          .populate(
            "sender",
            "name email profileImage"
          )
          .populate(
            "note",
            "title"
          )
          .sort({
            createdAt:
              -1,
          });

      const unreadCount =
        notifications.filter(
          (
            notification
          ) =>
            !notification.isRead
        ).length;

      return res.json({

        success: true,

        notifications,

        unreadCount,
      });

    } catch (
      error
    ) {

      console.error(
        "Get user notifications error:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            "Failed to fetch notifications.",

          error:
            error.message,
        });
    }
  }
);

// ============================================================
// USER NOTIFICATIONS - MARK ONE / ALL READ
// ============================================================

app.put(
  "/api/users/:id/notifications",
  async (
    req,
    res
  ) => {

    try {

      const {
        id,
      } = req.params;

      const {
        notificationId,
        isRead,
      } = req.body;

      if (
        !isValidObjectId(
          id
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Invalid user ID ?",
          });
      }

      if (
        notificationId
      ) {

        if (
          !isValidObjectId(
            notificationId
          )
        ) {

          return res
            .status(400)
            .json({

              success: false,

              message:
                "Invalid notification ID ?",
            });
        }

        const notification =
          await Notification.findOneAndUpdate(

            {
              _id:
                notificationId,

              user:
                id,
            },

            {
              isRead:
                isRead !==
                undefined
                  ? Boolean(
                      isRead
                    )
                  : true,
            },

            {
              new:
                true,
            }
          );

        if (
          !notification
        ) {

          return res
            .status(404)
            .json({

              success: false,

              message:
                "Notification not found ?",
            });
        }

        return res.json({

          success: true,

          message:
            "Notification updated successfully ?",

          notification,
        });
      }

      // Mark all as read
      await Notification.updateMany(

        {
          user:
            id,

          isRead:
            false,
        },

        {
          $set: {
            isRead:
              true,
          },
        }
      );

      return res.json({

        success: true,

        message:
          "All notifications marked as read ?",
      });

    } catch (
      error
    ) {

      console.error(
        "Update notifications error:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            "Failed to update notifications.",

          error:
            error.message,
        });
    }
  }
);

// ============================================================
// GET NOTIFICATIONS
// ============================================================

app.get(
  "/api/notifications/:userId",
  async (
    req,
    res
  ) => {

    try {

      const {
        userId,
      } = req.params;

      if (
        !isValidObjectId(
          userId
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Invalid user ID ?",
          });
      }

      const notifications =
        await Notification.find({
          user:
            userId,
        })
          .populate(
            "sender",
            "name email profileImage"
          )
          .populate(
            "note",
            "title"
          )
          .sort({
            createdAt:
              -1,
          });

      const unreadCount =
        notifications.filter(
          (
            item
          ) =>
            !item.isRead
        ).length;

      return res.json({

        success: true,

        notifications,

        unreadCount,
      });

    } catch (
      error
    ) {

      console.error(
        "Notifications error:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            "Failed to fetch notifications.",

          error:
            error.message,
        });
    }
  }
);
// ============================================================
// GET ADMIN NOTIFICATIONS
// ============================================================

app.get(
  "/api/admin/notifications",
  async (req, res) => {
    try {
      const admin = await User.findOne({
        email: "admin@notehive.com",
        role: "admin",
      });

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Admin user not found.",
        });
      }

      const notifications =
        await Notification.find({
          user: admin._id,
        })
          .populate(
            "user",
            "name email profileImage"
          )
          .populate(
            "sender",
            "name email profileImage"
          )
          .populate(
            "note",
            "title"
          )
          .sort({
            createdAt: -1,
          })
          .lean();

      return res.status(200).json({
        success: true,
        notifications,
      });

    } catch (error) {
      console.error(
        "? Get Admin Notifications Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Unable to load admin notifications.",
        error: error.message,
      });
    }
  }
);

// ============================================================
// ============================================================
// MARK ADMIN NOTIFICATION AS READ
// ============================================================

app.patch(
  "/api/admin/notifications/:notificationId/read",
  async (req, res) => {

    try {

      const {
        notificationId,
      } = req.params;

      if (
        !isValidObjectId(
          notificationId
        )
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Invalid notification ID.",
        });
      }

      const notification =
        await Notification.findByIdAndUpdate(
          notificationId,
          {
            isRead: true,
          },
          {
            new: true,
          }
        );

      if (!notification) {

        return res.status(404).json({
          success: false,
          message:
            "Notification not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Admin notification marked as read.",
        notification,
      });

    } catch (error) {

      console.error(
        "? Admin notification read error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to mark notification as read.",
        error:
          error.message,
      });
    }
  }
);
// ============================================================
// GET USER NOTIFICATIONS
// ============================================================

app.get(
  "/api/notifications/:userId",
  async (req, res) => {
    try {
      const { userId } = req.params;

      if (!isValidObjectId(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID.",
        });
      }

      const notifications =
        await Notification.find({
          user: userId,
        })
          .populate(
            "sender",
            "name email profileImage"
          )
          .populate(
            "note",
            "title"
          )
          .sort({
            createdAt: -1,
          });

      const unreadCount =
        notifications.filter(
          (notification) =>
            notification.isRead === false
        ).length;

      return res.status(200).json({
        success: true,
        notifications,
        unreadCount,
        total: notifications.length,
      });

    } catch (error) {
      console.error(
        "? User notifications fetch error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load notifications.",
        error: error.message,
      });
    }
  }
);


// ============================================================
// MARK ONE NOTIFICATION AS READ
// ============================================================

app.patch(
  "/api/notifications/:notificationId/read",
  async (req, res) => {
    try {
      const {
        notificationId,
      } = req.params;

      if (
        !isValidObjectId(
          notificationId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid notification ID.",
        });
      }

      const notification =
        await Notification.findByIdAndUpdate(
          notificationId,
          {
            isRead: true,
          },
          {
            new: true,
          }
        );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message:
            "Notification not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Notification marked as read.",
        notification,
      });

    } catch (error) {
      console.error(
        "? Mark notification read error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update notification.",
        error: error.message,
      });
    }
  }
);


// ============================================================
// MARK ALL USER NOTIFICATIONS AS READ
// ============================================================

app.patch(
  "/api/notifications/:userId/read-all",
  async (req, res) => {
    try {
      const { userId } = req.params;

      if (!isValidObjectId(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID.",
        });
      }

      const result =
        await Notification.updateMany(
          {
            user: userId,
            isRead: false,
          },
          {
            $set: {
              isRead: true,
            },
          }
        );

      return res.status(200).json({
        success: true,
        message:
          "All notifications marked as read.",
        modifiedCount:
          result.modifiedCount,
      });

    } catch (error) {
      console.error(
        "? Mark all notifications read error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update notifications.",
        error: error.message,
      });
    }
  }
);


// ============================================================
// DELETE ONE USER NOTIFICATION
// ============================================================

app.delete(
  "/api/notifications/:notificationId",
  async (req, res) => {
    try {
      const {
        notificationId,
      } = req.params;

      const {
        userId,
      } = req.query;

      if (
        !isValidObjectId(
          notificationId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid notification ID.",
        });
      }

      if (
        userId &&
        !isValidObjectId(userId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID.",
        });
      }

      const filter = {
        _id: notificationId,
      };

      // If userId is supplied, make sure
      // user can only delete their own notification.
      if (userId) {
        filter.user = userId;
      }

      const notification =
        await Notification.findOneAndDelete(
          filter
        );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message:
            "Notification not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Notification deleted successfully.",
      });

    } catch (error) {
      console.error(
        "? Delete notification error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to delete notification.",
        error: error.message,
      });
    }
  }
);


// ============================================================
// DELETE ALL USER NOTIFICATIONS
// ============================================================

app.delete(
  "/api/notifications/user/:userId",
  async (req, res) => {
    try {
      const { userId } = req.params;

      if (!isValidObjectId(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID.",
        });
      }

      const result =
        await Notification.deleteMany({
          user: userId,
        });

      return res.status(200).json({
        success: true,
        message:
          "All notifications deleted successfully.",
        deletedCount:
          result.deletedCount,
      });

    } catch (error) {
      console.error(
        "? Delete all notifications error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to delete notifications.",
        error: error.message,
      });
    }
  }
);
// ============================================================
// GET ALL NOTES FOR USER
// ============================================================

app.get(
  "/api/notes",
  async (
    req,
    res
  ) => {

    try {

      const {
        userId,
      } = req.query;

      if (
        !userId
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "userId is required ?",
          });
      }

      if (
        !isValidObjectId(
          userId
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Invalid userId ?",
          });
      }

      const notes =
        await Note.find({
          user:
            userId,
        }).sort({
          createdAt:
            -1,
        });

      return res.json({

        success: true,

        notes,
      });

    } catch (
      error
    ) {

      console.error(
        "Get notes error:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            "Failed to fetch notes.",

          error:
            error.message,
        });
    }
  }
);

// ============================================================
// GET PINNED NOTES FOR USER
// ============================================================

app.get(
  "/api/notes/pinned",
  async (
    req,
    res
  ) => {

    try {

      const {
        userId,
      } = req.query;

      if (
        !userId ||
        !isValidObjectId(
          userId
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Valid userId is required ?",
          });
      }

      const notes =
        await Note.find({

          user:
            userId,

          pinned:
            true,

        }).sort({
          createdAt:
            -1,
        });

      return res.json({

        success: true,

        notes,
      });

    } catch (
      error
    ) {

      return res
        .status(500)
        .json({

          success: false,

          message:
            "Failed to fetch pinned notes.",

          error:
            error.message,
        });
    }
  }
);

// ============================================================
// GET FAVORITE NOTES FOR USER
// ============================================================

app.get(
  "/api/notes/favorites",
  async (
    req,
    res
  ) => {

    try {

      const {
        userId,
      } = req.query;

      if (
        !userId ||
        !isValidObjectId(
          userId
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Valid userId is required ?",
          });
      }

      const notes =
        await Note.find({

          user:
            userId,

          favorite:
            true,

        }).sort({
          createdAt:
            -1,
        });

      return res.json({

        success: true,

        notes,
      });

    } catch (
      error
    ) {

      return res
        .status(500)
        .json({

          success: false,

          message:
            "Failed to fetch favorite notes.",

          error:
            error.message,
        });
    }
  }
);

// ============================================================
// GET SINGLE NOTE
// ============================================================

app.get(
  "/api/notes/:id",
  async (
    req,
    res
  ) => {

    try {

      const {
        id,
      } = req.params;

      const {
        userId,
      } = req.query;

      if (
        !isValidObjectId(
          id
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Invalid note ID ?",
          });
      }

      const query = {
        _id:
          id,
      };

      if (
        userId
      ) {

        if (
          !isValidObjectId(
            userId
          )
        ) {

          return res
            .status(400)
            .json({

              success: false,

              message:
                "Invalid userId ?",
            });
        }

        query.user =
          userId;
      }

      const note =
        await Note.findOne(
          query
        );

      if (
        !note
      ) {

        return res
          .status(404)
          .json({

            success: false,

            message:
              "Note not found ?",
          });
      }

      return res.json({

        success: true,

        note,
      });

    } catch (
      error
    ) {

      return res
        .status(500)
        .json({

          success: false,

          message:
            "Failed to fetch note.",

          error:
            error.message,
        });
    }
  }
);

// ============================================================
// CREATE NOTE
// ============================================================

app.post(
  "/api/notes",
  upload.array(
    "attachments",
    5
  ),
  async (
    req,
    res
  ) => {

    try {

      const {
        userId,
        title,
        content,
        category,
        priority,
        visibility,
        slug,
      } = req.body;

      if (
        !userId
      ) {

        if (
          req.files
        ) {

          req.files.forEach(
            (
              file
            ) => {

              deleteFileIfExists(
                file.path
              );
            }
          );
        }

        return res
          .status(400)
          .json({

            success: false,

            message:
              "userId is required ?",
          });
      }

      if (
        !isValidObjectId(
          userId
        )
      ) {

        if (
          req.files
        ) {

          req.files.forEach(
            (
              file
            ) => {

              deleteFileIfExists(
                file.path
              );
            }
          );
        }

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Invalid userId ?",
          });
      }

      if (
        !title ||
        !String(
          title
        ).trim()
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Note title is required ?",
          });
      }

      const user =
        await User.findById(
          userId
        );

      if (!user) {

        return res
          .status(404)
          .json({

            success: false,

            message:
              "User not found ?",
          });
      }

      const attachments =
        (
          req.files ||
          []
        ).map(
          (
            file
          ) => ({

            filename:
              file.filename,

            originalName:
              file.originalname,

            path:
              `/uploads/${file.filename}`,

            mimetype:
              file.mimetype,
          })
        );

      const note =
        await Note.create({

          user:
            userId,

          title:
            String(
              title
            ).trim(),

          content:
            content ||
            "",

          category:
            category ||
            "General",

          priority:
            priority ||
            "Medium",

          visibility:
            visibility ||
            "private",

          slug:
            slug ||
            "",

          attachments,
        });

      await createActivity(
        "note_created",

        `${user.name} created note "${note.title}".`,

        userId,

        note._id
      );

      return res
        .status(201)
        .json({

          success: true,

          message:
            "Note created successfully ?",

          note,
        });

    } catch (
      error
    ) {

      console.error(
        "Create note error:",
        error
      );

      if (
        req.files
      ) {

        req.files.forEach(
          (
            file
          ) => {

            deleteFileIfExists(
              file.path
            );
          }
        );
      }

      return res
        .status(500)
        .json({

          success: false,

          message:
            "Failed to create note.",

          error:
            error.message,
        });
    }
  }
);

// ============================================================
// UPDATE NOTE
// ============================================================

app.put(
  "/api/notes/:id",
  upload.array(
    "attachments",
    5
  ),
  async (
    req,
    res
  ) => {

    try {

      const {
        id,
      } = req.params;

      const {
        userId,
        title,
        content,
        category,
        priority,
        visibility,
        completed,
        pinned,
        favorite,
      } = req.body;

      if (
        !isValidObjectId(
          id
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Invalid note ID ?",
          });
      }

      if (
        !userId ||
        !isValidObjectId(
          userId
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Valid userId is required ?",
          });
      }

      const note =
        await Note.findOne({
          _id:
            id,

          user:
            userId,
        });

      if (
        !note
      ) {

        return res
          .status(404)
          .json({

            success: false,

            message:
              "Note not found ?",
          });
      }

      if (
        title !==
        undefined
      ) {

        note.title =
          String(
            title
          ).trim();
      }

      if (
        content !==
        undefined
      ) {

        note.content =
          content;
      }

      if (
        category !==
        undefined
      ) {

        note.category =
          category;
      }

      if (
        priority !==
        undefined
      ) {

        note.priority =
          priority;
      }

      if (
        visibility !==
        undefined
      ) {

        note.visibility =
          visibility;
      }

      if (
        completed !==
        undefined
      ) {

        note.completed =
          completed ===
            true ||
          completed ===
            "true";
      }

      if (
        pinned !==
        undefined
      ) {

        note.pinned =
          pinned ===
            true ||
          pinned ===
            "true";
      }

      if (
        favorite !==
        undefined
      ) {

        note.favorite =
          favorite ===
            true ||
          favorite ===
            "true";
      }

      // Replace attachments only when new files are provided
      if (
        req.files &&
        req.files.length
      ) {

        if (
          note.attachments &&
          note.attachments.length
        ) {

          note.attachments.forEach(
            (
              attachment
            ) => {

              if (
                attachment.path
              ) {

                let filename =
                  String(
                    attachment.path
                  );

                filename =
                  filename.replace(
                    /^\/uploads\//,
                    ""
                  );

                filename =
                  path.basename(
                    filename
                  );

                deleteFileIfExists(
                  path.join(
                    uploadDir,
                    filename
                  )
                );
              }
            }
          );
        }

        note.attachments =
          req.files.map(
            (
              file
            ) => ({

              filename:
                file.filename,

              originalName:
                file.originalname,

              path:
                `/uploads/${file.filename}`,

              mimetype:
                file.mimetype,
            })
          );
      }

      await note.save();

      await createActivity(
        "note_updated",

        `Note "${note.title}" was updated.`,

        userId,

        note._id
      );

      return res.json({

        success: true,

        message:
          "Note updated successfully ?",

        note,
      });

    } catch (
      error
    ) {

      console.error(
        "Update note error:",
        error
      );

      if (
        req.files
      ) {

        req.files.forEach(
          (
            file
          ) => {

            deleteFileIfExists(
              file.path
            );
          }
        );
      }

      return res
        .status(500)
        .json({

          success: false,

          message:
            "Failed to update note.",

          error:
            error.message,
        });
    }
  }
);

// ============================================================
// DELETE NOTE
// ============================================================

app.delete(
  "/api/notes/:id",
  async (
    req,
    res
  ) => {

    try {

      const {
        id,
      } = req.params;

      const {
        userId,
      } = req.query;

      if (
        !isValidObjectId(
          id
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Invalid note ID ?",
          });
      }

      if (
        !userId ||
        !isValidObjectId(
          userId
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Valid userId is required ?",
          });
      }

      const note =
        await Note.findOne({
          _id:
            id,

          user:
            userId,
        });

      if (
        !note
      ) {

        return res
          .status(404)
          .json({

            success: false,

            message:
              "Note not found ?",
          });
      }

      // Delete attachments
      if (
        note.attachments &&
        note.attachments.length
      ) {

        note.attachments.forEach(
          (
            attachment
          ) => {

            if (
              attachment.path
            ) {

              let filename =
                String(
                  attachment.path
                );

              filename =
                filename.replace(
                  /^\/uploads\//,
                  ""
                );

              filename =
                path.basename(
                  filename
                );

              deleteFileIfExists(
                path.join(
                  uploadDir,
                  filename
                )
              );
            }
          }
        );
      }
console.log("?? NOTE DELETE ROUTE HIT:", id);
      await Note.findByIdAndDelete(
        id
      );

      await Activity.deleteMany({`r`n  userId: id,`r`n});`r`n`r`nawait User.findByIdAndDelete(id);

      await createActivity(
        "note_deleted",
        `${note.title} was deleted.`,
        userId,
        id
      );

      return res.json({

        success: true,

        message:
          "Note deleted successfully ?",
      });

    } catch (
      error
    ) {

      console.error(
        "Delete note error:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            "Failed to delete note.",

          error:
            error.message,
        });
    }
  }
);

// ============================================================
// PIN / UNPIN NOTE
// ============================================================

app.patch(
  "/api/notes/:id/pin",
  async (
    req,
    res
  ) => {

    try {

      const {
        id,
      } = req.params;

      const {
        userId,
        pinned,
      } = req.body;

      if (
        !isValidObjectId(
          id
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Invalid note ID ?",
          });
      }

      if (
        !userId ||
        !isValidObjectId(
          userId
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Valid userId is required ?",
          });
      }

      const note =
        await Note.findOne({
          _id:
            id,

          user:
            userId,
        });

      if (
        !note
      ) {

        return res
          .status(404)
          .json({

            success: false,

            message:
              "Note not found ?",
          });
      }

      note.pinned =
        pinned !==
        undefined
          ? Boolean(
              pinned
            )
          : !note.pinned;

      await note.save();

      await createActivity(

        note.pinned
          ? "note_pinned"
          : "note_unpinned",

        note.pinned
          ? `Note "${note.title}" was pinned.`
          : `Note "${note.title}" was unpinned.`,

        userId,

        note._id
      );

      return res.json({

        success: true,

        message:
          note.pinned
            ? "Note pinned successfully ??"
            : "Note unpinned successfully.",

        note,
      });

    } catch (
      error
    ) {

      console.error(
        "Pin note error:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            "Failed to update pin status.",

          error:
            error.message,
        });
    }
  }
);

// ============================================================
// FAVORITE / UNFAVORITE NOTE
// ============================================================

app.patch(
  "/api/notes/:id/favorite",
  async (
    req,
    res
  ) => {

    try {

      const {
        id,
      } = req.params;

      const {
        userId,
        favorite,
      } = req.body;

      if (
        !isValidObjectId(
          id
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Invalid note ID ?",
          });
      }

      if (
        !userId ||
        !isValidObjectId(
          userId
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Valid userId is required ?",
          });
      }

      const note =
        await Note.findOne({
          _id:
            id,

          user:
            userId,
        });

      if (
        !note
      ) {

        return res
          .status(404)
          .json({

            success: false,

            message:
              "Note not found ?",
          });
      }

      note.favorite =
        favorite !==
        undefined
          ? Boolean(
              favorite
            )
          : !note.favorite;

      await note.save();

      await createActivity(

        note.favorite
          ? "note_favorited"
          : "note_unfavorited",

        note.favorite
          ? `Note "${note.title}" was added to favorites.`
          : `Note "${note.title}" was removed from favorites.`,

        userId,

        note._id
      );

      return res.json({

        success: true,

        message:
          note.favorite
            ? "Note added to favorites ?"
            : "Note removed from favorites.",

        note,
      });

    } catch (
      error
    ) {

      console.error(
        "Favorite note error:",
        error
      );

      return res
        .status(500)
        .json({

          success: false,

          message:
            "Failed to update favorite status.",

          error:
            error.message,
        });
    }
  }
);
// ============================================================
// EXPLORE / PUBLIC NOTES
// ============================================================

// ------------------------------------------------------------
// GET ALL PUBLIC NOTES FOR EXPLORE
// ------------------------------------------------------------
app.get("/api/explore", async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const category = String(req.query.category || "").trim();

    const filter = {
      visibility: "public",
    };

    if (category && category.toLowerCase() !== "all") {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const notes = await Note.find(filter)
      .populate("user", "name email profileImage")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      notes,
    });
  } catch (error) {
    console.error("Explore notes error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load explore notes.",
    });
  }
});


// ------------------------------------------------------------
// GET SINGLE PUBLIC NOTE
// ------------------------------------------------------------
app.get("/api/explore/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID.",
      });
    }

    const note = await Note.findOne({
      _id: id,
      visibility: "public",
    }).populate("user", "name email profileImage");

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Public note not found.",
      });
    }

    res.json({
      success: true,
      note,
    });
  } catch (error) {
    console.error("Explore single note error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load note.",
    });
  }
});
// ============================================================
// EXPLORE NOTE - LIKE / UNLIKE
// ============================================================

app.patch("/api/explore/:id/like", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID.",
      });
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required.",
      });
    }

    const note = await Note.findOne({
      _id: id,
      visibility: "public",
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Public note not found.",
      });
    }

    if (!note.likedBy) {
      note.likedBy = [];
    }

    const alreadyLiked = note.likedBy.some(
      (likedUserId) =>
        likedUserId.toString() === userId.toString()
    );

    if (alreadyLiked) {
      note.likedBy = note.likedBy.filter(
        (likedUserId) =>
          likedUserId.toString() !== userId.toString()
      );

      note.likes = Math.max(
        0,
        note.likedBy.length
      );

      await note.save();

      return res.json({
        success: true,
        liked: false,
        likes: note.likes,
        message: "Note unliked.",
      });
    }

    note.likedBy.push(userId);

    note.likes = note.likedBy.length;

    await note.save();

    return res.json({
      success: true,
      liked: true,
      likes: note.likes,
      message: "Note liked ??",
    });

  } catch (error) {
    console.error(
      "Explore like error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to like note.",
    });
  }
});
// ============================================================
// EXPLORE NOTE - VIEW
// ============================================================

app.patch("/api/explore/:id/view", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID.",
      });
    }

    const note = await Note.findOne({
      _id: id,
      visibility: "public",
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Public note not found.",
      });
    }

    note.views = (note.views || 0) + 1;

    await note.save();

    return res.json({
      success: true,
      views: note.views,
    });
  } catch (error) {
    console.error("Explore view error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update views.",
    });
  }
});


// ============================================================
// EXPLORE NOTE - SAVE / UNSAVE
// ============================================================

app.patch("/api/explore/:id/save", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID.",
      });
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required.",
      });
    }

    const note = await Note.findOne({
      _id: id,
      visibility: "public",
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Public note not found.",
      });
    }

    if (!note.savedBy) {
      note.savedBy = [];
    }

    const alreadySaved = note.savedBy.some(
      (savedUserId) =>
        savedUserId.toString() === userId.toString()
    );

    if (alreadySaved) {
      note.savedBy = note.savedBy.filter(
        (savedUserId) =>
          savedUserId.toString() !== userId.toString()
      );

      await note.save();

      return res.json({
        success: true,
        saved: false,
        saves: note.savedBy.length,
        message: "Note removed from saved.",
      });
    }

    note.savedBy.push(userId);

    await note.save();

    return res.json({
      success: true,
      saved: true,
      saves: note.savedBy.length,
      message: "Note saved.",
    });
  } catch (error) {
    console.error("Explore save error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save note.",
    });
  }
});


// ============================================================
// EXPLORE NOTE - REPOST / UNREPOST
// ============================================================

app.patch("/api/explore/:id/repost", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID.",
      });
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required.",
      });
    }

    const note = await Note.findOne({
      _id: id,
      visibility: "public",
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Public note not found.",
      });
    }

    if (!note.repostedBy) {
      note.repostedBy = [];
    }

    const alreadyReposted = note.repostedBy.some(
      (repostedUserId) =>
        repostedUserId.toString() === userId.toString()
    );

    if (alreadyReposted) {
      note.repostedBy = note.repostedBy.filter(
        (repostedUserId) =>
          repostedUserId.toString() !== userId.toString()
      );

      await note.save();

      return res.json({
        success: true,
        reposted: false,
        reposts: note.repostedBy.length,
        message: "Repost removed.",
      });
    }

    note.repostedBy.push(userId);

    await note.save();

    return res.json({
      success: true,
      reposted: true,
      reposts: note.repostedBy.length,
      message: "Note reposted.",
    });
  } catch (error) {
    console.error("Explore repost error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to repost note.",
    });
  }
});
// ============================================================
// EXPLORE NOTE - GET COMMENTS
// ============================================================

app.get("/api/explore/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID.",
      });
    }

    const note = await Note.findOne({
      _id: id,
      visibility: "public",
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Public note not found.",
      });
    }

    const comments = await Comment.find({
      note: id,
    })
      .populate(
        "user",
        "name email profileImage"
      )
      .sort({
        createdAt: -1,
      });

    return res.json({
      success: true,
      comments,
    });

  } catch (error) {
    console.error(
      "Get comments error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load comments.",
    });
  }
});


// ============================================================
// EXPLORE NOTE - ADD COMMENT
// ============================================================

app.post("/api/explore/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID.",
      });
    }

    if (
      !userId ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required.",
      });
    }

    if (
      !text ||
      !String(text).trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot be empty.",
      });
    }

    const note = await Note.findOne({
      _id: id,
      visibility: "public",
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Public note not found.",
      });
    }

    const user = await User.findById(
      userId
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const comment =
      await Comment.create({
        note: id,

        user: userId,

        text: String(
          text
        ).trim(),
      });
    await createActivity(
      "comment_created",
      `${user.name} added a comment on "${note.title}".`,
      userId,
      id
    );
await createActivity(
  "comment_created",
  `${user.name} added a comment on "${note.title}".`,
  userId,
  id
);
    const populatedComment =
      await Comment.findById(
        comment._id
      ).populate(
        "user",
        "name email profileImage"
      );

    return res.status(201).json({
      success: true,
      message: "Comment added successfully.",
      comment: populatedComment,
    });

  } catch (error) {
    console.error(
      "Add comment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to add comment.",
    });
  }
});


// ============================================================
// EXPLORE NOTE - DELETE COMMENT
// ============================================================

app.delete(
  "/api/explore/comments/:commentId",
  async (req, res) => {
    try {
      const { commentId } =
        req.params;

      const { userId } =
        req.body;

      if (
        !mongoose.Types.ObjectId.isValid(
          commentId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid comment ID.",
        });
      }

      if (
        !userId ||
        !mongoose.Types.ObjectId.isValid(
          userId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid userId is required.",
        });
      }

      const comment =
        await Comment.findById(
          commentId
        );

      if (!comment) {
        return res.status(404).json({
          success: false,
          message:
            "Comment not found.",
        });
      }

      if (
        comment.user.toString() !==
        userId.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can delete only your own comment.",
        });
      }

     await Comment.findByIdAndDelete(
  commentId
);
await createActivity(
  "comment_deleted",
  `A user deleted their comment.`,
  userId,
  comment.note
);
await createActivity(
  "comment_deleted",
  `${userId} deleted a comment.`,
  userId,
  comment.note
);

return res.json({
        success: true,
        message:
          "Comment deleted successfully.",
      });

    } catch (error) {
      console.error(
        "Delete comment error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to delete comment.",
      });
    }
  }
);
// ============================================================
// ADMIN STATISTICS
// ============================================================

app.get("/api/admin/stats", async (req, res) => {
  try {
    const [
      totalUsers,
      totalNotes,
      pinnedNotes,
      favoriteNotes,
      completedNotes,
      pendingUsers,
      approvedUsers,
      rejectedUsers,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),

      Note.countDocuments(),

      Note.countDocuments({
        pinned: true,
      }),

      Note.countDocuments({
        favorite: true,
      }),

      Note.countDocuments({
        completed: true,
      }),

      User.countDocuments({
        role: "user",
        status: "pending",
      }),

      User.countDocuments({
        role: "user",
        status: "approved",
      }),

      User.countDocuments({
        role: "user",
        status: "rejected",
      }),
    ]);

    res.json({
      success: true,
      message: "Admin statistics fetched successfully ?",
      stats: {
        totalUsers,
        totalNotes,
        pinnedNotes,
        favoriteNotes,
        completedNotes,
        pendingUsers,
        approvedUsers,
        rejectedUsers,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch admin statistics.",
    });
  }
});


// ============================================================
// ADMIN ACTIVITY
// ============================================================

// ------------------------------------------------------------
// GET ADMIN ACTIVITY
// ------------------------------------------------------------
app.get("/api/admin/activity", async (req, res) => {
  try {
    const activities = await Activity.find()
      .populate("userId", "name email")
      .populate("noteId", "title")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      activities,
    });
  } catch (error) {
    console.error("Admin activity error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load admin activity.",
    });
  }
});


// ------------------------------------------------------------
// DELETE ALL ADMIN ACTIVITY
// ------------------------------------------------------------
app.delete("/api/admin/activity", async (req, res) => {
  try {
    await Activity.deleteMany({});

    res.json({
      success: true,
      message: "All activity cleared successfully ?",
    });
  } catch (error) {
    console.error("Delete activity error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to clear activity.",
    });
  }
});


// ============================================================
// ADMIN - ALL NOTES
// ============================================================

// ------------------------------------------------------------
// GET ALL NOTES
// ------------------------------------------------------------
app.get("/api/admin/notes", async (req, res) => {
  try {
    const notes = await Note.find()
      .populate("user", "name email profileImage")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      notes,
    });
  } catch (error) {
    console.error("Admin notes error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch admin notes.",
    });
  }
});


// ============================================================
// ADMIN - PINNED NOTES
// ============================================================

app.get("/api/admin/pinned-notes", async (req, res) => {
  try {
    const notes = await Note.find({
      pinned: true,
    })
      .populate("user", "name email profileImage")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      notes,
    });
  } catch (error) {
    console.error("Admin pinned notes error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch pinned notes.",
    });
  }
});


// ============================================================
// ADMIN - FAVORITE NOTES
// ============================================================

app.get("/api/admin/favorite-notes", async (req, res) => {
  try {
    const notes = await Note.find({
      favorite: true,
    })
      .populate("user", "name email profileImage")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      notes,
    });
  } catch (error) {
    console.error("Admin favorite notes error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch favorite notes.",
    });
  }
});


// ============================================================
// ADMIN - COMPLETED NOTES
// ============================================================

app.get("/api/admin/completed-notes", async (req, res) => {
  try {
    const notes = await Note.find({
      completed: true,
    })
      .populate("user", "name email profileImage")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      notes,
    });
  } catch (error) {
    console.error("Admin completed notes error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch completed notes.",
    });
  }
});


// ============================================================
// ADMIN - SINGLE NOTE
// ============================================================

app.get("/api/admin/notes/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID.",
      });
    }

    const note = await Note.findById(id).populate(
      "user",
      "name email profileImage"
    );

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found.",
      });
    }

    res.json({
      success: true,
      note,
    });
  } catch (error) {
    console.error("Admin single note error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch note.",
    });
  }
});


// ============================================================
// ADMIN - UPDATE NOTE
// ============================================================

app.put(
  "/api/admin/notes/:id",
  upload.array("attachments", 5),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid note ID.",
        });
      }

      const note = await Note.findById(id);

      if (!note) {
        return res.status(404).json({
          success: false,
          message: "Note not found.",
        });
      }

      const {
        title,
        content,
        category,
        priority,
        visibility,
        completed,
        pinned,
        favorite,
      } = req.body;

      if (title !== undefined) {
        note.title = String(title).trim();
      }

      if (content !== undefined) {
        note.content = content;
      }

      if (category !== undefined) {
        note.category = category;
      }

      if (priority !== undefined) {
        note.priority = priority;
      }

      if (visibility !== undefined) {
        note.visibility = visibility;
      }

      if (completed !== undefined) {
        note.completed =
          completed === true ||
          completed === "true" ||
          completed === 1 ||
          completed === "1";
      }

      if (pinned !== undefined) {
        note.pinned =
          pinned === true ||
          pinned === "true" ||
          pinned === 1 ||
          pinned === "1";
      }

      if (favorite !== undefined) {
        note.favorite =
          favorite === true ||
          favorite === "true" ||
          favorite === 1 ||
          favorite === "1";
      }

      // --------------------------------------------------------
      // NEW ATTACHMENTS
      // --------------------------------------------------------

      if (req.files && req.files.length > 0) {
        note.attachments = req.files.map((file) => ({
          filename: file.filename,
          originalName: file.originalname,
          path: `/uploads/${file.filename}`,
          mimetype: file.mimetype,
        }));
      }

      await note.save();

      await createActivity(
        "admin_note_update",
        `Admin updated note "${note.title}"`,
        note.user,
        note._id
      );

      const updatedNote = await Note.findById(note._id).populate(
        "user",
        "name email profileImage"
      );

      res.json({
        success: true,
        message: "Note updated successfully ?",
        note: updatedNote,
      });
    } catch (error) {
      console.error("Admin update note error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to update note.",
        error: error.message,
      });
    }
  }
);


// ============================================================
// ADMIN - DELETE NOTE
// ============================================================

app.delete("/api/admin/notes/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID.",
      });
    }

    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found.",
      });
    }

    const noteTitle = note.title;
    const userId = note.user;

    await Note.findByIdAndDelete(id);

    await createActivity(
      "admin_note_delete",
      `Admin deleted note "${noteTitle}"`,
      userId,
      null
    );

    res.json({
      success: true,
      message: "Note deleted successfully ?",
    });
  } catch (error) {
    console.error("Admin delete note error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to delete note.",
    });
  }
});

// ============================================================
// ADMIN - GET SINGLE USER FULL DETAILS
// ============================================================

app.get(
  "/api/admin/users/:id/details",
  async (req, res) => {
    try {
      const { id } = req.params;

      console.log(
        "?? ADMIN USER DETAILS API CALLED:",
        id
      );

      // --------------------------------------------------------
      // VALIDATE USER ID
      // --------------------------------------------------------

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID ?",
        });
      }

      // --------------------------------------------------------
      // FIND USER
      // --------------------------------------------------------

      const user = await User.findOne({
        _id: id,
        role: "user",
      }).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found ?",
        });
      }

      // --------------------------------------------------------
      // USER NOTE STATISTICS
      // --------------------------------------------------------

      const [
        totalNotes,
        pinnedNotes,
        favoriteNotes,
        completedNotes,
      ] = await Promise.all([
        Note.countDocuments({
          user: user._id,
        }),

        Note.countDocuments({
          user: user._id,
          pinned: true,
        }),

        Note.countDocuments({
          user: user._id,
          favorite: true,
        }),

        Note.countDocuments({
          user: user._id,
          completed: true,
        }),
      ]);

      // --------------------------------------------------------
      // PROFILE IMAGE
      // --------------------------------------------------------

      let profileImage = user.profileImage || "";

      if (
        profileImage &&
        !profileImage.startsWith("http://") &&
        !profileImage.startsWith("https://") &&
        !profileImage.startsWith("data:image")
      ) {
        if (!profileImage.startsWith("/")) {
          profileImage = `/${profileImage}`;
        }

        profileImage = `${SERVER_URL}${profileImage}`;
      }

      // --------------------------------------------------------
      // RESPONSE
      // --------------------------------------------------------

      return res.status(200).json({
        success: true,

        message:
          "User details fetched successfully ?",

        user: {
          _id: user._id,
          name: user.name || "",
          email: user.email || "",

          profileImage,

          bio: user.bio || "",

          profession:
            user.profession || "",

          location:
            user.location || "",

          website:
            user.website || "",

          role:
            user.role || "user",

          status:
            user.status || "approved",

          createdAt:
            user.createdAt || null,

          updatedAt:
            user.updatedAt || null,
        },

        stats: {
          totalNotes,
          pinnedNotes,
          favoriteNotes,
          completedNotes,
        },
      });
    } catch (error) {
      console.error(
        "? ADMIN USER DETAILS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to fetch user details ?",

        error: error.message,
      });
    }
  }
);
// ============================================================
// ADMIN - APPROVE USER
// ============================================================

app.patch("/api/admin/users/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.status = "approved";

    await user.save();

    await Notification.create({
      user: user._id,
      title: "Account Approved ??",
      message:
        "Your NoteHive account has been approved. You can now use all features.",
      type: "account_approved",
      isRead: false,
    });

    await createActivity(
      "user_approved",
      `User "${user.name}" was approved`,
      user._id,
      null
    );

    res.json({
      success: true,
      message: "User approved successfully ?",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Approve user error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to approve user.",
    });
  }
});


// ============================================================
// ADMIN - REJECT USER
// ============================================================

app.patch("/api/admin/users/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.status = "rejected";

    await user.save();

    await Notification.create({
      user: user._id,
      title: "Account Rejected",
      message:
        "Your NoteHive account has been rejected. Please contact the administrator for more information.",
      type: "account_rejected",
      isRead: false,
    });

    await createActivity(
      "user_rejected",
      `User "${user.name}" was rejected`,
      user._id,
      null
    );

    res.json({
      success: true,
      message: "User rejected successfully.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Reject user error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to reject user.",
    });
  }
});


// ============================================================
// ADMIN - GET USERS
// ============================================================

app.get("/api/admin/users", async (req, res) => {
  try {
    const users = await User.find({
      role: "user",
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Admin users error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch users.",
    });
  }
});

// ============================================================
// CHAT - MESSAGE APIs
// ============================================================

// GET CHAT MESSAGES BETWEEN TWO USERS
app.get("/api/messages/:userId/:otherUserId", async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(otherUserId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const messages = await Message.find({
      $or: [
        {
          sender: userId,
          receiver: otherUserId,
        },
        {
          sender: otherUserId,
          receiver: userId,
        },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "name email profileImage")
      .populate("receiver", "name email profileImage");

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Get chat messages error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load messages.",
    });
  }
});


// SEND A MESSAGE
app.post("/api/messages", async (req, res) => {
  try {
    const { sender, receiver, message } = req.body;

    if (!sender || !receiver || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Sender, receiver and message are required.",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(sender) ||
      !mongoose.Types.ObjectId.isValid(receiver)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid sender or receiver ID.",
      });
    }

    const newMessage = await Message.create({
      sender,
      receiver,
      message: message.trim(),
      read: false,
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("sender", "name email profileImage")
      .populate("receiver", "name email profileImage");

    res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      data: populatedMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to send message.",
    });
  }
});


// MARK CHAT MESSAGES AS READ
app.patch(
  "/api/messages/:userId/:otherUserId/read",
  async (req, res) => {
    try {
      const { userId, otherUserId } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(userId) ||
        !mongoose.Types.ObjectId.isValid(otherUserId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID.",
        });
      }

      await Message.updateMany(
        {
          sender: otherUserId,
          receiver: userId,
          read: false,
        },
        {
          $set: {
            read: true,
          },
        }
      );

      res.json({
        success: true,
        message: "Messages marked as read.",
      });
    } catch (error) {
      console.error("Mark messages read error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to mark messages as read.",
      });
    }
  }
);
// ============================================================
// CHAT - GET USERS LIST
// ============================================================

app.get("/api/users/chat-list", async (req, res) => {
  try {
    const users = await User.find({
      role: "user",
      status: "approved",
    })
      .select("_id name email profileImage bio profession")
      .sort({ name: 1 });

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Chat users error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load chat users.",
    });
  }
});
// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use((error, req, res, next) => {
  console.error("====================================");
  console.error("GLOBAL SERVER ERROR");
  console.error(error);
  console.error("====================================");

  // ----------------------------------------------------------
  // MULTER FILE SIZE ERROR
  // ----------------------------------------------------------

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size is too large.",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  // ----------------------------------------------------------
  // NORMAL ERROR
  // ----------------------------------------------------------

  return res.status(500).json({
    success: false,
    message: error.message || "Internal server error.",
  });
});


// ============================================================
// 404 ROUTE
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found ?`,
  });
});


// ============================================================
// MONGODB CONNECTION
// ============================================================

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("====================================");
    console.log("? MongoDB connected successfully");
    console.log("====================================");

    // --------------------------------------------------------
    // START SERVER
    // --------------------------------------------------------

    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log("====================================");
      console.log(`?? NoteHive server running on port ${PORT}`);
      console.log(
        `?? Local:   http://localhost:${PORT}`
      );
      console.log(
        `?? Network: http://192.168.1.68:${PORT}`
      );
      console.log("====================================");
    });
  })
  .catch((error) => {
    console.error("====================================");
    console.error("? MongoDB connection failed");
    console.error(error.message);
    console.error("====================================");
  });


  









