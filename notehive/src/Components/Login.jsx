import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";


import { SERVER_URL } from "../config/api";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // =========================================================
  // HANDLE INPUT CHANGE
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setMessage("");
    setMessageType("");
  };

  // =========================================================
  // LOGIN
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    // =======================================================
    // VALIDATION
    // =======================================================

    if (!email) {
      setMessage("Please enter your email ❌");
      setMessageType("error");
      return;
    }

    if (!password) {
      setMessage("Please enter your password ❌");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
      // =====================================================
      // LOGIN API
      // =====================================================

      const response = await fetch(
        `${SERVER_URL}/api/users/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      console.log("Login Response:", data);

      // =====================================================
      // PENDING ACCOUNT
      // =====================================================

      if (
        response.status === 403 &&
        data.status === "pending"
      ) {
        setMessage(
          data.message ||
            "Your account is waiting for admin approval ⏳"
        );

        setMessageType("pending");
        setLoading(false);
        return;
      }

      // =====================================================
      // REJECTED ACCOUNT
      // =====================================================

      if (
        response.status === 403 &&
        data.status === "rejected"
      ) {
        setMessage(
          data.message ||
            "Your account has been rejected by admin ❌"
        );

        setMessageType("error");
        setLoading(false);
        return;
      }

      // =====================================================
      // OTHER LOGIN ERRORS
      // =====================================================

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Login failed. Please try again."
        );
      }

      // =====================================================
      // CHECK USER
      // =====================================================

      if (!data.user) {
        throw new Error(
          "User information server se nahi mili."
        );
      }

      // =====================================================
      // USER ID
      // =====================================================

      const userId =
        data.user.id ||
        data.user._id;

      if (!userId) {
        throw new Error(
          "User ID server se nahi mili."
        );
      }

      const loggedInUser = {
        ...data.user,
        id: userId,
      };

      console.log(
        "Logged in user:",
        loggedInUser
      );

      console.log(
        "User ID:",
        userId
      );

      // =====================================================
      // CLEAR OLD PENDING DATA
      // =====================================================

      localStorage.removeItem(
        "notehive_pendingUser"
      );

      // =====================================================
      // SAVE USER DATA
      // =====================================================

      localStorage.setItem(
        "notehive_userId",
        String(userId)
      );

      localStorage.setItem(
        "notehive_user",
        JSON.stringify(loggedInUser)
      );

      localStorage.setItem(
        "isLoggedIn",
        "true"
      );

      localStorage.setItem(
        "userRole",
        loggedInUser.role || "user"
      );

      // =====================================================
      // VERIFY LOCAL STORAGE
      // =====================================================

      const savedUserId =
        localStorage.getItem(
          "notehive_userId"
        );

      const savedLoginStatus =
        localStorage.getItem(
          "isLoggedIn"
        );

      const savedRole =
        localStorage.getItem(
          "userRole"
        );

      console.log(
        "NoteHive User ID:",
        savedUserId
      );

      console.log(
        "Login Status:",
        savedLoginStatus
      );

      console.log(
        "User Role:",
        savedRole
      );

      // =====================================================
      // FINAL CHECK
      // =====================================================

      if (!savedUserId) {
        throw new Error(
          "User ID browser mein save nahi hui."
        );
      }

      // =====================================================
      // SUCCESS MESSAGE
      // =====================================================

      setMessage(
        `Welcome back, ${
          loggedInUser.name || "User"
        }! Login successful ✅`
      );

      setMessageType("success");

      // =====================================================
      // GO TO DASHBOARD
      // =====================================================

      setTimeout(() => {
        navigate("/dashboard");
      }, 800);

    } catch (error) {
      console.error(
        "Login Error:",
        error
      );

      // Make sure failed login does not leave old login state
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("notehive_userId");
      localStorage.removeItem("notehive_user");
      localStorage.removeItem("userRole");

      setMessage(
        error.message ||
          "Login failed. Please try again ❌"
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="login-page">

      <div className="login-container">

        {/* =================================================
            LEFT SIDE
        ================================================= */}

        <div className="login-left">

          <div className="login-brand">
            🐝
          </div>

          <h1>
            Welcome Back!
          </h1>

          <p>
            Login to your NoteHive account
            and continue managing your notes
            smarter.
          </p>

          <div className="login-features">

            <div className="login-feature">
              <span>📝</span>

              <div>
                <strong>
                  Manage Notes
                </strong>

                <small>
                  Create, edit and organize
                  your notes easily.
                </small>
              </div>
            </div>

            <div className="login-feature">
              <span>🔒</span>

              <div>
                <strong>
                  Secure Account
                </strong>

                <small>
                  Your account and notes
                  stay protected.
                </small>
              </div>
            </div>

            <div className="login-feature">
              <span>☁️</span>

              <div>
                <strong>
                  Access Anywhere
                </strong>

                <small>
                  Access your notes whenever
                  you need them.
                </small>
              </div>
            </div>

          </div>

        </div>

        {/* =================================================
            RIGHT SIDE
        ================================================= */}

        <div className="login-right">

          <div className="login-form-wrapper">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="login-header">

              <h2>
                Login to NoteHive
              </h2>

              <p>
                Enter your details to continue
              </p>

            </div>

            {/* =================================================
                MESSAGE
            ================================================= */}

            {message && (
              <div
                className={`login-message ${
                  messageType === "success"
                    ? "login-success"
                    : messageType === "pending"
                    ? "login-pending"
                    : "login-error"
                }`}
              >
                {message}
              </div>
            )}

            {/* =================================================
                FORM
            ================================================= */}

            <form
              onSubmit={handleSubmit}
              className="login-form"
            >

              {/* =================================================
                  EMAIL
              ================================================= */}

              <div className="form-group">

                <label htmlFor="email">
                  Email Address
                </label>

                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="email"
                />

              </div>

              {/* =================================================
                  PASSWORD
              ================================================= */}

              <div className="form-group">

                <label htmlFor="password">
                  Password
                </label>

                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="current-password"
                />

              </div>

              {/* =================================================
                  LOGIN BUTTON
              ================================================= */}

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >

                {loading ? (
                  <>
                    <span className="login-spinner"></span>
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}

              </button>

            </form>

            {/* =================================================
                SIGNUP LINK
            ================================================= */}

            <div className="signup-link">

              <span>
                Don't have an account?
              </span>

              <Link
                to="/signup"
                className="signup-link-button"
              >
                Create Account
              </Link>

            </div>

            {/* =================================================
                APPROVAL INFO
            ================================================= */}

            <div className="approval-info">

              <span>⏳</span>

              <p>
                New accounts require admin
                approval before you can log in.
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default Login;