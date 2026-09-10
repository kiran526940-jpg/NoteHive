const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    action: {
      type: String,
      enum: [
        "signup",
        "login",
        "create_note",
        "update_note",
        "delete_note",
        "pin_note",
        "unpin_note",
        "favorite_note",
        "unfavorite_note",
        "admin_update_note",
        "admin_delete_note",
      ],
      required: true,
    },

    note: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      default: null,
    },

    noteTitle: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    icon: {
      type: String,
      default: "📋",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Activity",
  activitySchema
);