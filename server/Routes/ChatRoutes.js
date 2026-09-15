const express = require("express");
const mongoose = require("mongoose");
const Message = require("../models/Message");

const router = express.Router();

/*
============================================================
  GET ALL CHAT USERS
  Returns registered normal users except current user
============================================================
*/

router.get("/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const User = mongoose.model("User");

    const users = await User.find({
      _id: { $ne: userId },
      role: "user",
      status: "approved",
    })
      .select("_id name email profileImage bio profession")
      .sort({ name: 1 })
      .lean();

    return res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("❌ Chat users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch chat users.",
    });
  }
});

/*
============================================================
  GET CHAT HISTORY
============================================================
*/

router.get("/:userId/:otherUserId", async (req, res) => {
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
      .lean();

    return res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("❌ Chat history error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch chat history.",
    });
  }
});

/*
============================================================
  MARK MESSAGES AS READ
============================================================
*/

router.patch("/:userId/:otherUserId/read", async (req, res) => {
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

    return res.json({
      success: true,
      message: "Messages marked as read.",
    });
  } catch (error) {
    console.error("❌ Mark read error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark messages as read.",
    });
  }
});

module.exports = router;