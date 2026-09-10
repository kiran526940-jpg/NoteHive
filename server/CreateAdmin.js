require("dotenv").config();

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB connected");

    const existingAdmin = await User.findOne({
      role: "admin",
    });

    if (existingAdmin) {
      console.log("⚠️ Admin already exists");
      console.log("Admin Email:", existingAdmin.email);

      await mongoose.disconnect();
      return;
    }

    const admin = new User({
      name: "NoteHive Admin",
      email: "admin@notehive.com",
      password: "Admin@12345",
      role: "admin",
    });

    await admin.save();

    console.log("=================================");
    console.log("👑 ADMIN CREATED SUCCESSFULLY");
    console.log("=================================");
    console.log("Email: admin@notehive.com");
    console.log("Password: Admin@12345");
    console.log("Role: admin");
    console.log("=================================");

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Failed to create admin");
    console.error(error.message);
  }
}

createAdmin();