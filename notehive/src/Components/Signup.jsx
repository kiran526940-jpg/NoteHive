import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Signup.css";
import { API_URL } from "../config/api";

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // =====================================================
  // HANDLE INPUT CHANGE
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
  // HANDLE SIGNUP
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    // -----------------------------------------------------
    // VALIDATION
    // -----------------------------------------------------

    if (!name || !email || !password || !confirmPassword) {
      setMessage("Please fill all fields ❌");
      setMessageType("error");
      return;
    }

    if (name.length < 2) {
      setMessage(
        "Name must contain at least 2 characters ❌"
      );
      setMessageType("error");
      return;
    }

    if (password.length < 6) {
      setMessage(
        "Password must contain at least 6 characters ❌"
      );
      setMessageType("error");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match ❌");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
      // ---------------------------------------------------
      // API CALL
      // Backend route:
      // POST /api/users
      // ---------------------------------------------------

      const response = await fetch(
        `${API_URL}/users`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

      // ---------------------------------------------------
      // READ RESPONSE SAFELY
      // ---------------------------------------------------

      let data = {};

      try {
        data = await response.json();
      } catch (jsonError) {
        console.error(
          "Signup response JSON error:",
          jsonError
        );

        data = {};
      }

      console.log(
        "Signup response:",
        data
      );

      // ---------------------------------------------------
      // ERROR RESPONSE
      // ---------------------------------------------------

      if (!response.ok || !data.success) {
        setMessage(
          data.message ||
            "Signup failed. Please try again ❌"
        );

        setMessageType("error");
        setLoading(false);

        return;
      }

      // ---------------------------------------------------
      // IMPORTANT:
      // NEW USER IS PENDING
      // DO NOT LOGIN USER HERE
      // ---------------------------------------------------

      localStorage.removeItem(
        "isLoggedIn"
      );

      localStorage.removeItem(
        "notehive_userId"
      );

      localStorage.removeItem(
        "notehive_user"
      );

      localStorage.removeItem(
        "userRole"
      );

      // ---------------------------------------------------
      // SAVE PENDING USER INFO
      // ---------------------------------------------------

      if (data.user) {
        localStorage.setItem(
          "notehive_pendingUser",
          JSON.stringify({
            id:
              data.user.id ||
              data.user._id,

            _id:
              data.user._id ||
              data.user.id,

            name:
              data.user.name,

            email:
              data.user.email,

            status:
              data.user.status ||
              "pending",
          })
        );
      }

      // ---------------------------------------------------
      // SUCCESS MESSAGE
      // ---------------------------------------------------

      setMessage(
        "Account created successfully! Your account is waiting for admin approval ⏳"
      );

      setMessageType("success");

      // ---------------------------------------------------
      // CLEAR FORM
      // ---------------------------------------------------

      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      // ---------------------------------------------------
      // GO TO LOGIN AFTER SHORT DELAY
      // ---------------------------------------------------

      setTimeout(() => {
        navigate("/login");
      }, 2500);

    } catch (error) {
      console.error(
        "❌ Signup error:",
        error
      );

      setMessage(
        "Unable to connect to server. Please try again ❌"
      );

      setMessageType("error");

    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // GO TO LOGIN
  // =====================================================

  const handleLogin = () => {
    navigate("/login");
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="signup-page">
      <div className="signup-container">

        {/* =================================================
            LEFT SIDE
        ================================================= */}

        <div className="signup-left">

          <div className="signup-brand">
            🐝
          </div>

          <h1>
            Join NoteHive
          </h1>

          <p>
            Create your account and start organizing
            your notes smarter.
          </p>

          <div className="signup-features">

            <div className="signup-feature">

              <span>
                📝
              </span>

              <div>

                <strong>
                  Manage Notes
                </strong>

                <small>
                  Create and organize your notes easily.
                </small>

              </div>

            </div>

            <div className="signup-feature">

              <span>
                🔒
              </span>

              <div>

                <strong>
                  Secure Account
                </strong>

                <small>
                  Your account and notes stay protected.
                </small>

              </div>

            </div>

            <div className="signup-feature">

              <span>
                ☁️
              </span>

              <div>

                <strong>
                  Access Anywhere
                </strong>

                <small>
                  Keep your notes available whenever you need them.
                </small>

              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            RIGHT SIDE
        ================================================= */}

        <div className="signup-right">

          <div className="signup-form-wrapper">

            <div className="signup-header">

              <h2>
                Create Account
              </h2>

              <p>
                Sign up to get started with NoteHive
              </p>

            </div>

            {/* =================================================
                MESSAGE
            ================================================= */}

            {message && (
              <div
                className={`signup-message ${
                  messageType === "success"
                    ? "signup-success"
                    : "signup-error"
                }`}
              >
                {message}
              </div>
            )}

            {/* =================================================
                FORM
            ================================================= */}

            <form onSubmit={handleSubmit}>

              {/* NAME */}

              <div className="form-group">

                <label htmlFor="name">
                  Full Name
                </label>

                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="name"
                />

              </div>

              {/* EMAIL */}

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

              {/* PASSWORD */}

              <div className="form-group">

                <label htmlFor="password">
                  Password
                </label>

                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="new-password"
                />

                <small className="password-hint">
                  Password must contain at least 6 characters.
                </small>

              </div>

              {/* CONFIRM PASSWORD */}

              <div className="form-group">

                <label htmlFor="confirmPassword">
                  Confirm Password
                </label>

                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="new-password"
                />

              </div>

              {/* =================================================
                  SUBMIT
              ================================================= */}

              <button
                type="submit"
                className="signup-button"
                disabled={loading}
              >

                {loading ? (
                  <>
                    <span className="signup-spinner"></span>
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}

              </button>

            </form>

            {/* =================================================
                LOGIN
            ================================================= */}

            <div className="login-link">

              <span>
                Already have an account?
              </span>

              <button
                type="button"
                onClick={handleLogin}
                disabled={loading}
              >
                Login
              </button>

            </div>

            {/* =================================================
                APPROVAL INFO
            ================================================= */}

            <div className="approval-info">

              <span>
                ⏳
              </span>

              <p>
                New accounts require admin approval before
                you can log in.
              </p>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Signup;