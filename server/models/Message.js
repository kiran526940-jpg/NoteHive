const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

   message: {
  type: String,
  required: false,
  trim: true,
  default: "",
  maxlength: 2000,
},
messageType: {
  type: String,
  enum: ["text", "image", "file"],
  default: "text",
},

fileUrl: {
  type: String,
  default: "",
},

fileName: {
  type: String,
  default: "",
},

fileSize: {
  type: Number,
  default: 0,
},

mimeType: {
  type: String,
  default: "",
},
    // ============================================================
    // MESSAGE STATUS
    // ============================================================

    // Message recipient ke socket/server tak successfully pahunch gaya
    delivered: {
      type: Boolean,
      default: false,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    // Recipient ne chat open karke message read kar liya
    read: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({
  sender: 1,
  receiver: 1,
  createdAt: 1,
});

messageSchema.index({
  receiver: 1,
  sender: 1,
  createdAt: 1,
});

module.exports = mongoose.model(
  "Message",
  messageSchema
);