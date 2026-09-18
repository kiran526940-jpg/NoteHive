
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SERVER_URL } from "../config/api";
import "./Settings.css";

const API_URL = `${SERVER_URL}/api`;

const Settings = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const userId = localStorage.getItem("notehive_userId");

  // ============================================================
  // USER
  // ============================================================

  const [user, setUser] = useState({
    _id: "",
    name: "",
    email: "",
    bio: "",
    profileImage: "",
    profession: "",
    location: "",
    website: "",
    createdAt: "",
  });

  // ============================================================
  // NAVIGATION
  // ============================================================

  const [activeSection, setActiveSection] = useState("profile");
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // ============================================================
  // PROFILE
  // ============================================================

  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [profileProfession, setProfileProfession] = useState("");
  const [profileLocation, setProfileLocation] = useState("");
  const [profileWebsite, setProfileWebsite] = useState("");

  // ============================================================
  // STATS
  // ============================================================

  const [profileStats, setProfileStats] = useState({
    notes: 0,
    pinned: 0,
    favorites: 0,
  });

  // ============================================================
  // NOTIFICATIONS
  // ============================================================

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    noteReminders: true,
    sharedNotes: true,
    updates: true,
  });

  // ============================================================
  // THEME
  // ============================================================

  const [theme, setTheme] = useState("light");

  // ============================================================
  // PASSWORD
  // ============================================================

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ============================================================
  // LOADING
  // ============================================================

  const [profileSaving, setProfileSaving] = useState(false);
  const [notificationSaving, setNotificationSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // ============================================================
  // MESSAGES
  // ============================================================

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const clearMessages = () => {
    setSuccessMessage("");
    setErrorMessage("");
  };

  // ============================================================
  // THEME
  // ============================================================

  const applyTheme = (selectedTheme) => {
    setTheme(selectedTheme);

    try {
      const oldSettings = JSON.parse(
        localStorage.getItem("notehive_settings") || "{}"
      );

      localStorage.setItem(
        "notehive_settings",
        JSON.stringify({
          ...oldSettings,
          theme: selectedTheme,
        })
      );
    } catch (error) {
      console.error("Theme storage error:", error);
    }

    document.body.classList.remove(
      "theme-light",
      "theme-dark",
      "theme-system"
    );

    document.body.classList.add(`theme-${selectedTheme}`);
  };

  const loadTheme = () => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("notehive_settings") || "{}"
      );

      const selectedTheme = saved.theme || "light";

      setTheme(selectedTheme);

      document.body.classList.remove(
        "theme-light",
        "theme-dark",
        "theme-system"
      );

      document.body.classList.add(`theme-${selectedTheme}`);
    } catch (error) {
      setTheme("light");
      document.body.classList.add("theme-light");
    }
  };

  // ============================================================
  // FETCH USER
  // ============================================================

  const fetchUser = async () => {
    if (!userId) return;

    try {
      const response = await fetch(`${API_URL}/users/${userId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch profile.");
      }

      const u = data.user || data;

      const normalized = {
        ...u,
        profession: u.profession || "",
        location: u.location || "",
        website: u.website || "",
      };

      setUser(normalized);

      setProfileName(normalized.name || "");
      setProfileEmail(normalized.email || "");
      setProfileBio(normalized.bio || "");
      setProfileImage(normalized.profileImage || "");
      setProfileProfession(normalized.profession || "");
      setProfileLocation(normalized.location || "");
      setProfileWebsite(normalized.website || "");

      localStorage.setItem(
        "notehive_user",
        JSON.stringify(normalized)
      );
    } catch (error) {
      console.error("Fetch user error:", error);

      try {
        const stored = JSON.parse(
          localStorage.getItem("notehive_user") || "{}"
        );

        if (stored.name || stored.email) {
          setUser(stored);

          setProfileName(stored.name || "");
          setProfileEmail(stored.email || "");
          setProfileBio(stored.bio || "");
          setProfileImage(stored.profileImage || "");
          setProfileProfession(stored.profession || "");
          setProfileLocation(stored.location || "");
          setProfileWebsite(stored.website || "");
        }
      } catch (storageError) {
        console.error("Stored user error:", storageError);
      }
    }
  };

  // ============================================================
  // PROFILE STATS
  // ============================================================

  const fetchProfileStats = async () => {
    if (!userId) return;

    try {
      const response = await fetch(
        `${API_URL}/notes?userId=${userId}`
      );

      if (!response.ok) return;

      const data = await response.json();

      const notes = data.notes || [];

      setProfileStats({
        notes: notes.length,
        pinned: notes.filter((note) => note.pinned === true).length,
        favorites: notes.filter(
          (note) => note.favorite === true
        ).length,
      });
    } catch (error) {
      console.error("Profile stats error:", error);
    }
  };

  // ============================================================
  // NOTIFICATION SETTINGS
  // ============================================================

  const fetchNotificationSettings = async () => {
    if (!userId) return;

    try {
      const response = await fetch(
        `${API_URL}/users/${userId}/settings`
      );

      if (!response.ok) return;

      const data = await response.json();

      setNotificationSettings((previous) => ({
        ...previous,
        ...(data.settings || data),
      }));
    } catch (error) {
      console.error(
        "Notification settings error:",
        error
      );
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    fetchUser();
    fetchProfileStats();
    fetchNotificationSettings();
    loadTheme();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================
  // SECTION NAVIGATION
  // ============================================================

  const handleSection = (section) => {
    clearMessages();

    setActiveSection(section);

    // Mobile:
    // settings list -> detail page
    setMobileDetailOpen(true);
  };

  const handleMobileBack = () => {
    clearMessages();
    setMobileDetailOpen(false);
  };

  // ============================================================
  // PROFILE IMAGE
  // ============================================================

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    clearMessages();

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file.");

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(
        "Profile photo must be smaller than 5 MB."
      );

      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const image = new Image();

      image.onload = () => {
        const max = 500;

        let width = image.width;
        let height = image.height;

        if (width > height && width > max) {
          height = Math.round((height * max) / width);
          width = max;
        } else if (height > max) {
          width = Math.round((width * max) / height);
          height = max;
        }

        const canvas = document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        context.drawImage(
          image,
          0,
          0,
          width,
          height
        );

        setProfileImage(
          canvas.toDataURL("image/jpeg", 0.82)
        );
      };

      image.src = e.target.result;
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  };

  // ============================================================
  // SAVE PROFILE
  // ============================================================

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    clearMessages();

    if (!profileName.trim()) {
      setErrorMessage("Name is required.");
      return;
    }

    if (!profileEmail.trim()) {
      setErrorMessage("Email is required.");
      return;
    }

    setProfileSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/users/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: profileName.trim(),
            email: profileEmail.trim(),
            bio: profileBio.trim(),
            profileImage: profileImage || "",
            profession: profileProfession.trim(),
            location: profileLocation.trim(),
            website: profileWebsite.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update profile."
        );
      }

      const updated =
        data.user ||
        data.updatedUser || {
          ...user,
          name: profileName.trim(),
          email: profileEmail.trim(),
          bio: profileBio.trim(),
          profileImage: profileImage || "",
          profession: profileProfession.trim(),
          location: profileLocation.trim(),
          website: profileWebsite.trim(),
        };

      setUser(updated);

      localStorage.setItem(
        "notehive_user",
        JSON.stringify(updated)
      );

      setSuccessMessage(
        "Profile updated successfully ✅"
      );

      fetchProfileStats();
    } catch (error) {
      console.error("Save profile error:", error);

      setErrorMessage(
        error.message ||
          "Something went wrong while saving profile."
      );
    } finally {
      setProfileSaving(false);
    }
  };

  // ============================================================
  // SAVE NOTIFICATION SETTINGS
  // ============================================================

  const saveNotificationSettings = async () => {
    clearMessages();

    setNotificationSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/users/${userId}/settings`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(notificationSettings),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to save notification settings."
        );
      }

      setSuccessMessage(
        "Notification settings saved ✅"
      );
    } catch (error) {
      setErrorMessage(
        error.message ||
          "Unable to save notification settings."
      );
    } finally {
      setNotificationSaving(false);
    }
  };

  // ============================================================
  // CHANGE PASSWORD
  // ============================================================

  const handleChangePassword = async (event) => {
    event.preventDefault();

    clearMessages();

    if (!currentPassword) {
      setErrorMessage(
        "Please enter your current password."
      );
      return;
    }

    if (!newPassword) {
      setErrorMessage(
        "Please enter a new password."
      );
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage(
        "New password must be at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(
        "New passwords do not match."
      );
      return;
    }

    setPasswordSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/users/${userId}/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to change password."
        );
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setSuccessMessage(
        "Password changed successfully ✅"
      );
    } catch (error) {
      setErrorMessage(
        error.message || "Unable to change password."
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  // ============================================================
  // DELETE ACCOUNT
  // ============================================================

  const handleDeleteAccount = async () => {
    const firstConfirm = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );

    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      "Your profile and account data will be permanently deleted. Continue?"
    );

    if (!secondConfirm) return;

    try {
      const response = await fetch(
        `${API_URL}/users/${userId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to delete account."
        );
      }

      [
        "isLoggedIn",
        "notehive_userId",
        "notehive_user",
        "userRole",
        "notehive_settings",
      ].forEach((key) =>
        localStorage.removeItem(key)
      );

      navigate("/signup");
    } catch (error) {
      setErrorMessage(
        error.message || "Unable to delete account."
      );
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    [
      "isLoggedIn",
      "notehive_userId",
      "notehive_user",
      "userRole",
    ].forEach((key) =>
      localStorage.removeItem(key)
    );

    navigate("/login");
  };

  // ============================================================
  // HELPERS
  // ============================================================

  const getInitial = () => {
    return (
      profileName.trim().charAt(0).toUpperCase() ||
      "U"
    );
  };

  const getMemberSince = () => {
    if (!user.createdAt) return "—";

    const date = new Date(user.createdAt);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });
  };

  // ============================================================
  // NAV ITEMS
  // ============================================================

  const navItems = [
    {
      key: "profile",
      icon: "👤",
      label: "Profile",
      description: "Your personal information",
    },
    {
      key: "notifications",
      icon: "🔔",
      label: "Notifications",
      description: "Message and notification alerts",
    },
    {
      key: "appearance",
      icon: "🎨",
      label: "Appearance",
      description: "Theme and display",
    },
    {
      key: "privacy",
      icon: "🔐",
      label: "Privacy & Security",
      description: "Password and account security",
    },
    {
      key: "notes",
      icon: "📝",
      label: "Notes Preferences",
      description: "Manage note behaviour",
    },
  ];

  const activeNavItem =
    navItems.find(
      (item) => item.key === activeSection
    ) || navItems[0];

  // ============================================================
  // AVATAR
  // ============================================================

  const Avatar = ({ preview = false }) => (
    <div
      className={
        preview
          ? "profile-photo-preview"
          : "profile-avatar"
      }
    >
      {profileImage ? (
        <img
          src={profileImage}
          alt="Profile"
        />
      ) : (
        <span>{getInitial()}</span>
      )}
    </div>
  );

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="settings-page">

      {/* ======================================================
          MESSAGE
      ====================================================== */}

      {(successMessage || errorMessage) && (
        <div
          className={`settings-message ${
            successMessage ? "success" : "error"
          }`}
          role="status"
        >
          <span>
            {successMessage || errorMessage}
          </span>

          <button
            type="button"
            onClick={clearMessages}
            aria-label="Close message"
          >
            ×
          </button>
        </div>
      )}

      {/* ======================================================
          SETTINGS LAYOUT
      ====================================================== */}

      <div className="settings-layout">

        {/* ====================================================
            DESKTOP SIDEBAR
        ==================================================== */}

        <aside className="settings-sidebar">

          <div className="settings-panel-heading">
            <span className="panel-bee">🐝</span>

            <div>
              <strong>USER PANEL</strong>
              <small>Manage NoteHive</small>
            </div>
          </div>

          <nav>
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`settings-nav ${
                  activeSection === item.key
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleSection(item.key)
                }
              >
                <span className="settings-nav-icon">
                  {item.icon}
                </span>

                <span>{item.label}</span>

                {activeSection === item.key && (
                  <span className="nav-arrow">
                    ›
                  </span>
                )}
              </button>
            ))}

            <div className="settings-divider" />

            <button
              type="button"
              className="settings-nav logout"
              onClick={handleLogout}
            >
              <span className="settings-nav-icon">
                🚪
              </span>

              <span>Logout</span>
            </button>
          </nav>
        </aside>

        {/* ====================================================
            MOBILE SETTINGS HOME
        ==================================================== */}

        <div
          className={`mobile-settings-home ${
            mobileDetailOpen
              ? "mobile-hidden"
              : ""
          }`}
        >

          <div className="mobile-settings-profile">

            <Avatar />

            <div className="mobile-settings-profile-info">
              <strong>
                {profileName || "Your Profile"}
              </strong>

              <span>
                {profileEmail ||
                  "Add your email address"}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                handleSection("profile")
              }
              aria-label="Open profile"
            >
              ›
            </button>
          </div>

          <div className="mobile-settings-list">

            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className="mobile-settings-item"
                onClick={() =>
                  handleSection(item.key)
                }
              >
                <span className="mobile-settings-item-icon">
                  {item.icon}
                </span>

                <span className="mobile-settings-item-content">
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>

                <span className="mobile-settings-item-arrow">
                  ›
                </span>
              </button>
            ))}

            <div className="mobile-settings-section-label">
              ACCOUNT
            </div>

            <button
              type="button"
              className="mobile-settings-item mobile-logout-item"
              onClick={handleLogout}
            >
              <span className="mobile-settings-item-icon">
                🚪
              </span>

              <span className="mobile-settings-item-content">
                <strong>Logout</strong>
                <small>
                  Sign out of your NoteHive account
                </small>
              </span>

              <span className="mobile-settings-item-arrow">
                ›
              </span>
            </button>

          </div>

        </div>

        {/* ====================================================
            SETTINGS CONTENT
        ==================================================== */}

        <main
          className={`settings-main ${
            mobileDetailOpen
              ? "mobile-detail-active"
              : ""
          }`}
        >

          {/* ==================================================
              MOBILE DETAIL HEADER
          ================================================== */}

          <div className="mobile-detail-header">

            <button
              type="button"
              className="mobile-back-button"
              onClick={handleMobileBack}
              aria-label="Back to settings"
            >
              ←
            </button>

            <div>
              <span>
                {activeNavItem.icon}
              </span>

              <strong>
                {activeNavItem.label}
              </strong>
            </div>

          </div>

          {/* ==================================================
              PROFILE
          ================================================== */}

          {activeSection === "profile" && (
            <section className="settings-card profile-card">

              <div className="profile-cover">

                <div>
                  <span>
                    NOTEHIVE • PERSONAL SPACE
                  </span>

                  <strong>
                    My Profile
                  </strong>
                </div>

                <div className="cover-bee">
                  🐝
                </div>

              </div>

              <div className="profile-box">

                <div className="profile-avatar-wrapper">
                  <Avatar />

                  <span className="profile-online-dot" />
                </div>

                <div className="profile-info">

                  <h2>
                    {profileName ||
                      "Your Profile"}
                  </h2>

                  <p>
                    {profileProfession ||
                      "NoteHive User"}
                  </p>

                  <span className="profile-email">
                    {profileEmail ||
                      "Add your email address"}
                  </span>

                </div>
              </div>

              <form
                className="settings-form"
                onSubmit={handleSaveProfile}
              >

                {/* PROFILE PHOTO */}

                <div className="profile-photo-section">

                  <Avatar preview />

                  <div className="profile-photo-content">

                    <span className="field-kicker">
                      PROFILE IMAGE
                    </span>

                    <h3>
                      Profile Photo
                    </h3>

                    <p>
                      Use a clear JPG or PNG
                      image. Maximum original
                      size 5 MB.
                    </p>

                    <div className="photo-actions">

                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() =>
                          fileInputRef.current?.click()
                        }
                      >
                        📷 Change Photo
                      </button>

                      {profileImage && (
                        <button
                          type="button"
                          className="text-danger-btn"
                          onClick={() => {
                            clearMessages();
                            setProfileImage("");
                          }}
                        >
                          Remove
                        </button>
                      )}

                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={
                        handleProfileImageChange
                      }
                      hidden
                    />

                  </div>
                </div>

                {/* BASIC */}

                <div className="form-section-title">
                  <span>01</span>
                  BASIC INFORMATION
                </div>

                <div className="profile-form-grid">

                  <div className="form-group">
                    <label>
                      Full Name
                    </label>

                    <input
                      value={profileName}
                      onChange={(e) =>
                        setProfileName(
                          e.target.value
                        )
                      }
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Email Address
                    </label>

                    <input
                      type="email"
                      value={profileEmail}
                      onChange={(e) =>
                        setProfileEmail(
                          e.target.value
                        )
                      }
                      placeholder="Enter your email"
                    />
                  </div>

                </div>

                {/* EXTRA */}

                <div className="form-section-title">
                  <span>02</span>
                  EXTRA INFORMATION
                </div>

                <div className="profile-extra-grid">

                  <div className="form-group">
                    <label>
                      💼 Profession / Role
                    </label>

                    <input
                      value={
                        profileProfession
                      }
                      onChange={(e) =>
                        setProfileProfession(
                          e.target.value
                        )
                      }
                      placeholder="e.g. Student, Developer"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      📍 Location
                    </label>

                    <input
                      value={
                        profileLocation
                      }
                      onChange={(e) =>
                        setProfileLocation(
                          e.target.value
                        )
                      }
                      placeholder="e.g. Himachal Pradesh"
                    />
                  </div>

                  <div className="form-group profile-extra-full">
                    <label>
                      🌐 Portfolio / Website
                    </label>

                    <input
                      type="url"
                      value={
                        profileWebsite
                      }
                      onChange={(e) =>
                        setProfileWebsite(
                          e.target.value
                        )
                      }
                      placeholder="https://example.com"
                    />
                  </div>

                </div>

                {/* ABOUT */}

                <div className="form-section-title">
                  <span>03</span>
                  ABOUT YOU
                </div>

                <div className="form-group">

                  <label>
                    Bio
                  </label>

                  <textarea
                    value={profileBio}
                    onChange={(e) =>
                      setProfileBio(
                        e.target.value
                      )
                    }
                    placeholder="Tell something about yourself..."
                    maxLength={300}
                  />

                  <div className="bio-counter">
                    {profileBio.length}/300
                  </div>

                </div>

                {/* STATS */}

                <div className="profile-stats">

                  <div className="profile-stat">
                    <span>📝</span>

                    <div>
                      <strong>
                        {profileStats.notes}
                      </strong>

                      <small>
                        Total Notes
                      </small>
                    </div>
                  </div>

                  <div className="profile-stat">
                    <span>📌</span>

                    <div>
                      <strong>
                        {profileStats.pinned}
                      </strong>

                      <small>
                        Pinned
                      </small>
                    </div>
                  </div>

                  <div className="profile-stat">
                    <span>❤️</span>

                    <div>
                      <strong>
                        {profileStats.favorites}
                      </strong>

                      <small>
                        Favorites
                      </small>
                    </div>
                  </div>

                  <div className="profile-stat">
                    <span>📅</span>

                    <div>
                      <strong>
                        {getMemberSince()}
                      </strong>

                      <small>
                        Member Since
                      </small>
                    </div>
                  </div>

                </div>

                {/* ACCOUNT */}

                <div className="form-section-title">
                  <span>04</span>
                  ACCOUNT INFORMATION
                </div>

                <div className="form-group">

                  <label>
                    User ID
                  </label>

                  <div className="user-id-box">
                    {userId || "—"}
                  </div>

                </div>

                {/* SAVE */}

                <div className="profile-save-area">

                  <button
                    className="primary-btn"
                    disabled={profileSaving}
                  >
                    {profileSaving
                      ? "Saving..."
                      : "Save Profile →"}
                  </button>

                </div>

              </form>
            </section>
          )}

          {/* ==================================================
              NOTIFICATIONS
          ================================================== */}

          {activeSection === "notifications" && (
            <section className="settings-card">

              <CardHeader
                icon="🔔"
                eyebrow="NOTIFICATIONS"
                title="Notification Settings"
                text="Choose which updates and reminders you want to receive."
              />

              <div className="settings-options">

                <ToggleRow
                  title="Email Notifications"
                  text="Receive important account notifications by email."
                  checked={
                    notificationSettings.emailNotifications
                  }
                  onChange={() =>
                    setNotificationSettings(
                      (previous) => ({
                        ...previous,
                        emailNotifications:
                          !previous.emailNotifications,
                      })
                    )
                  }
                />

                <ToggleRow
                  title="Note Reminders"
                  text="Get reminders about your saved notes."
                  checked={
                    notificationSettings.noteReminders
                  }
                  onChange={() =>
                    setNotificationSettings(
                      (previous) => ({
                        ...previous,
                        noteReminders:
                          !previous.noteReminders,
                      })
                    )
                  }
                />

                <ToggleRow
                  title="Shared Notes"
                  text="Get notified when notes are shared with you."
                  checked={
                    notificationSettings.sharedNotes
                  }
                  onChange={() =>
                    setNotificationSettings(
                      (previous) => ({
                        ...previous,
                        sharedNotes:
                          !previous.sharedNotes,
                      })
                    )
                  }
                />

                <ToggleRow
                  title="NoteHive Updates"
                  text="Receive product and feature updates."
                  checked={
                    notificationSettings.updates
                  }
                  onChange={() =>
                    setNotificationSettings(
                      (previous) => ({
                        ...previous,
                        updates:
                          !previous.updates,
                      })
                    )
                  }
                />

              </div>

              <div className="card-action">

                <button
                  className="primary-btn"
                  onClick={
                    saveNotificationSettings
                  }
                  disabled={
                    notificationSaving
                  }
                >
                  {notificationSaving
                    ? "Saving..."
                    : "Save Notifications →"}
                </button>

              </div>

            </section>
          )}

          {/* ==================================================
              APPEARANCE
          ================================================== */}

          {activeSection === "appearance" && (
            <section className="settings-card">

              <CardHeader
                icon="🎨"
                eyebrow="APPEARANCE"
                title="Appearance"
                text="Customize the look of your NoteHive workspace."
              />

              <div className="theme-options">

                <ThemeOption
                  selected={
                    theme === "light"
                  }
                  onClick={() =>
                    applyTheme("light")
                  }
                  type="light"
                  title="Light"
                  text="Clean and bright interface"
                />

                <ThemeOption
                  selected={
                    theme === "dark"
                  }
                  onClick={() =>
                    applyTheme("dark")
                  }
                  type="dark"
                  title="Dark"
                  text="Comfortable dark interface"
                />

              </div>

            </section>
          )}

          {/* ==================================================
              PRIVACY
          ================================================== */}

          {activeSection === "privacy" && (
            <section className="settings-card">

              <CardHeader
                icon="🔐"
                eyebrow="PRIVACY & SECURITY"
                title="Privacy & Security"
                text="Keep your NoteHive account secure."
              />

              <form
                className="password-form"
                onSubmit={
                  handleChangePassword
                }
              >

                <div className="form-section-title">
                  <span>01</span>
                  CHANGE PASSWORD
                </div>

                <div className="form-group">

                  <label>
                    Current Password
                  </label>

                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) =>
                      setCurrentPassword(
                        e.target.value
                      )
                    }
                    placeholder="Enter current password"
                  />

                </div>

                <div className="form-group">

                  <label>
                    New Password
                  </label>

                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(
                        e.target.value
                      )
                    }
                    placeholder="At least 6 characters"
                  />

                </div>

                <div className="form-group">

                  <label>
                    Confirm New Password
                  </label>

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    placeholder="Confirm new password"
                  />

                </div>

                <div className="card-action">

                  <button
                    className="primary-btn"
                    disabled={
                      passwordSaving
                    }
                  >
                    {passwordSaving
                      ? "Updating..."
                      : "Change Password →"}
                  </button>

                </div>

              </form>

              <div className="danger-zone">

                <div>
                  <span className="danger-label">
                    DANGER ZONE
                  </span>

                  <h3>
                    Delete Account
                  </h3>

                  <p>
                    Permanently delete your
                    NoteHive account and account
                    data.
                  </p>
                </div>

                <button
                  className="danger-btn"
                  onClick={
                    handleDeleteAccount
                  }
                >
                  Delete Account
                </button>

              </div>

            </section>
          )}

          {/* ==================================================
              NOTES
          ================================================== */}

          {activeSection === "notes" && (
            <section className="settings-card">

              <CardHeader
                icon="📝"
                eyebrow="NOTES PREFERENCES"
                title="Notes Preferences"
                text="Manage your preferred note behaviour."
              />

              <ToggleRow
                title="Auto Save"
                text="Automatically save changes while editing notes."
                checked={true}
              />

              <ToggleRow
                title="Confirm Before Delete"
                text="Ask for confirmation before deleting a note."
                checked={true}
              />

              <ToggleRow
                title="Show Completed Notes"
                text="Keep completed notes visible in your notes list."
                checked={true}
              />

            </section>
          )}

        </main>
      </div>
    </div>
  );
};

// ============================================================
// CARD HEADER
// ============================================================

const CardHeader = ({
  icon,
  eyebrow,
  title,
  text,
}) => (
  <div className="settings-card-header">

    <span className="section-label">
      {icon} {eyebrow}
    </span>

    <h2>{title}</h2>

    <p>{text}</p>

  </div>
);

// ============================================================
// TOGGLE
// ============================================================

const ToggleRow = ({
  title,
  text,
  checked,
  onChange,
}) => (
  <div className="settings-row">

    <div className="settings-row-content">

      <h3>{title}</h3>

      <p>{text}</p>

    </div>

    <label className="switch">

      <input
        type="checkbox"
        checked={checked}
        onChange={
          onChange || (() => {})
        }
      />

      <span className="slider" />

    </label>

  </div>
);

// ============================================================
// THEME OPTION
// ============================================================

const ThemeOption = ({
  selected,
  onClick,
  type,
  title,
  text,
}) => (
  <button
    type="button"
    className={`theme-option ${
      selected ? "selected" : ""
    }`}
    onClick={onClick}
  >

    <div
      className={`theme-preview ${type}-preview`}
    >
      <i />
      <i />
      <i />
    </div>

    <div>
      <strong>{title}</strong>
      <span>{text}</span>
    </div>

    {selected && (
      <b className="theme-check">
        ✓
      </b>
    )}

  </button>
);

export default Settings;
