import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css";

const SERVER_URL = "http://192.168.1.68:5000";

const AdminLogin = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // =====================================================
  // HANDLE INPUT
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setMessage("");
    setMessageType("");
  };

  // =====================================================
  // ADMIN LOGIN
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!email || !password) {
      setMessage("Admin email and password dono enter karo ❌");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
      console.log("🔵 Sending admin login request...");

      const response = await fetch(
        `${SERVER_URL}/api/admin/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const responseText = await response.text();

      console.log("🟢 Backend Status:", response.status);
      console.log("🟢 Backend Response:", responseText);

      // =====================================================
      // EMPTY RESPONSE
      // =====================================================

      if (!responseText) {
        setMessage(
          "Backend ne empty response diya ❌ Server check karo."
        );
        setMessageType("error");
        return;
      }

      // =====================================================
      // HTML RESPONSE
      // =====================================================

      if (
        responseText.trim().startsWith("<!DOCTYPE") ||
        responseText.trim().startsWith("<html")
      ) {
        console.error(
          "❌ Backend HTML response:",
          responseText
        );

        setMessage(
          "Backend API ka valid JSON response nahi aa raha ❌"
        );
        setMessageType("error");
        return;
      }

      // =====================================================
      // PARSE JSON
      // =====================================================

      let data;

      try {
        data = JSON.parse(responseText);
      } catch (error) {
        console.error("❌ JSON Parse Error:", error);

        setMessage(
          "Backend se valid JSON response nahi mila ❌"
        );
        setMessageType("error");
        return;
      }

      console.log("✅ ADMIN LOGIN DATA:", data);

      // =====================================================
      // API ERROR
      // =====================================================

      if (!response.ok || !data.success) {
        setMessage(
          data.message || "Admin login failed ❌"
        );

        setMessageType("error");
        return;
      }

      // =====================================================
      // GET ADMIN
      // IMPORTANT:
      // Backend sends admin inside data.user
      // =====================================================

      const admin = data.user;

      console.log("👑 ADMIN USER DATA:", admin);

      if (!admin || !admin._id) {
        console.error(
          "❌ Admin data missing:",
          data
        );

        setMessage(
          "Admin information nahi mili ❌"
        );

        setMessageType("error");
        return;
      }

      // =====================================================
      // ROLE CHECK
      // =====================================================

      if (admin.role !== "admin") {
        console.error(
          "❌ Invalid admin role:",
          admin.role
        );

        setMessage(
          "Access denied. Ye account admin nahi hai ❌"
        );

        setMessageType("error");
        return;
      }

      // =====================================================
      // STATUS CHECK
      // =====================================================

      if (admin.status !== "approved") {
        console.error(
          "❌ Admin status:",
          admin.status
        );

        setMessage(
          "Admin account approved nahi hai ❌"
        );

        setMessageType("error");
        return;
      }

      // =====================================================
      // CLEAR OLD USER LOGIN DATA
      // =====================================================

      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("notehive_userId");
      localStorage.removeItem("notehive_user");
      localStorage.removeItem("notehive_pendingUser");

      // =====================================================
      // CLEAR OLD ADMIN DATA
      // =====================================================

      localStorage.removeItem("adminLoggedIn");
      localStorage.removeItem("adminId");
      localStorage.removeItem("admin");
      localStorage.removeItem("notehive_adminId");
      localStorage.removeItem("notehive_admin");

      // =====================================================
      // SAVE ADMIN LOGIN
      // =====================================================

      localStorage.setItem(
        "adminLoggedIn",
        "true"
      );

      localStorage.setItem(
        "userRole",
        "admin"
      );

      localStorage.setItem(
        "adminId",
        String(admin._id)
      );

      localStorage.setItem(
        "notehive_adminId",
        String(admin._id)
      );

      localStorage.setItem(
        "admin",
        JSON.stringify(admin)
      );

      localStorage.setItem(
        "notehive_admin",
        JSON.stringify(admin)
      );

      // Save useful admin information separately
      localStorage.setItem(
        "adminName",
        admin.name || "NoteHive Admin"
      );

      localStorage.setItem(
        "adminEmail",
        admin.email || ""
      );

      localStorage.setItem(
        "adminProfileImage",
        admin.profileImage || ""
      );

      console.log("✅ Admin login successful");

      console.log("👑 Admin:", admin);

      console.log(
        "💾 Admin ID:",
        localStorage.getItem("adminId")
      );

      console.log(
        "💾 Admin Name:",
        localStorage.getItem("adminName")
      );

      // =====================================================
      // SUCCESS
      // =====================================================

      setMessage(
        "Admin login successful! Welcome 👑"
      );

      setMessageType("success");

      // =====================================================
      // REDIRECT
      // =====================================================

      setTimeout(() => {
        navigate("/admin-dashboard", {
          replace: true,
        });
      }, 700);

    } catch (error) {
      console.error(
        "❌ ADMIN LOGIN ERROR:",
        error
      );

      setMessage(
        "Backend server se connection nahi ho pa raha ❌"
      );

      setMessageType("error");

    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="admin-login-page">

      <div className="admin-login-container">

        {/* =================================================
            LEFT SIDE
        ================================================= */}

        <div className="admin-login-left">

          <div className="admin-login-brand">
            🐝
          </div>

          <h1>
            NoteHive
          </h1>

          <p className="admin-login-description">
            Welcome to the NoteHive
            Administrator Portal.
            Manage users, notes and
            platform activities from
            one secure place.
          </p>

          {/* FEATURES */}

          <div className="admin-login-features">

            <div className="admin-login-feature">

              <span>👥</span>

              <div>
                <strong>
                  Manage Users
                </strong>

                <small>
                  Approve, reject and
                  manage registered users.
                </small>
              </div>

            </div>

            <div className="admin-login-feature">

              <span>📝</span>

              <div>
                <strong>
                  Manage Notes
                </strong>

                <small>
                  Monitor and manage
                  platform notes.
                </small>
              </div>

            </div>

            <div className="admin-login-feature">

              <span>📊</span>

              <div>
                <strong>
                  Platform Overview
                </strong>

                <small>
                  View important platform
                  statistics and activities.
                </small>
              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            RIGHT SIDE
        ================================================= */}

        <div className="admin-login-right">

          <div className="admin-login-form-wrapper">

            {/* HEADER */}

            <div className="admin-login-header">

              <div className="admin-title-icon">
                👑
              </div>

              <h2>
                Administrator Login
              </h2>

              <p>
                Sign in to access the
                NoteHive admin panel
              </p>

            </div>

            {/* MESSAGE */}

            {message && (
              <div
                className={`admin-login-message ${
                  messageType === "success"
                    ? "admin-login-success"
                    : "admin-login-error"
                }`}
              >
                {message}
              </div>
            )}

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="admin-login-form"
            >

              {/* EMAIL */}

              <div className="admin-form-group">

                <label htmlFor="email">
                  Admin Email
                </label>

                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Enter admin email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="email"
                />

              </div>

              {/* PASSWORD */}

              <div className="admin-form-group">

                <label htmlFor="password">
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Enter admin password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="current-password"
                />

              </div>

              {/* LOGIN BUTTON */}

              <button
                type="submit"
                className="admin-login-btn"
                disabled={loading}
              >

                {loading ? (
                  <>
                    <span className="admin-login-spinner"></span>
                    Checking...
                  </>
                ) : (
                  <>
                    Login as Admin
                    <span>👑</span>
                  </>
                )}

              </button>

            </form>

            {/* SECURITY INFO */}

            <div className="admin-security-info">

              <span>🔐</span>

              <div>
                <strong>
                  Secure Administrator Access
                </strong>

                <p>
                  Only authorized admin accounts
                  can access this portal.
                </p>
              </div>

            </div>

            {/* BACK TO USER LOGIN */}

            <button
              type="button"
              className="back-user-login"
              onClick={() => navigate("/login")}
              disabled={loading}
            >
              ← Back to User Login
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};

export default AdminLogin;