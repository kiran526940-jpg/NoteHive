import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Settings.css";

const API_URL = "http://192.168.1.68:5000/api";

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
  // ACTIVE SECTION
  // ============================================================

  const [activeSection, setActiveSection] = useState("profile");

  // ============================================================
  // MOBILE MENU
  // ============================================================

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const [profileSaving, setProfileSaving] = useState(false);

  // ============================================================
  // PROFILE STATS
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

  const [notificationSaving, setNotificationSaving] = useState(false);

  // ============================================================
  // APPEARANCE
  // ============================================================

  const [theme, setTheme] = useState("light");

  // ============================================================
  // PASSWORD
  // ============================================================

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordSaving, setPasswordSaving] = useState(false);

  // ============================================================
  // MESSAGES
  // ============================================================

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ============================================================
  // CLEAR MESSAGE
  // ============================================================

  const clearMessages = () => {
    setSuccessMessage("");
    setErrorMessage("");
  };

  // ============================================================
  // MOBILE SECTION CHANGE
  // ============================================================

  const handleMobileSectionChange = (section) => {
    clearMessages();
    setActiveSection(section);
    setMobileMenuOpen(false);
  };

  // ============================================================
  // FETCH USER
  // ============================================================

  const fetchUser = async () => {
    if (!userId) {
      setErrorMessage("User session not found.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/${userId}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to fetch profile."
        );
      }

      const fetchedUser = data.user || data;

      setUser({
        ...fetchedUser,
        profession: fetchedUser.profession || "",
        location: fetchedUser.location || "",
        website: fetchedUser.website || "",
      });

      setProfileName(fetchedUser.name || "");
      setProfileEmail(fetchedUser.email || "");
      setProfileBio(fetchedUser.bio || "");
      setProfileImage(fetchedUser.profileImage || "");
      setProfileProfession(fetchedUser.profession || "");
      setProfileLocation(fetchedUser.location || "");
      setProfileWebsite(fetchedUser.website || "");

      localStorage.setItem(
        "notehive_user",
        JSON.stringify(fetchedUser)
      );
    } catch (error) {
      console.error("Fetch user error:", error);

      try {
        const storedUser = JSON.parse(
          localStorage.getItem("notehive_user") || "{}"
        );

        if (storedUser.name || storedUser.email) {
          setUser(storedUser);

          setProfileName(storedUser.name || "");
          setProfileEmail(storedUser.email || "");
          setProfileBio(storedUser.bio || "");
          setProfileImage(storedUser.profileImage || "");

          setProfileProfession(
            storedUser.profession || ""
          );

          setProfileLocation(
            storedUser.location || ""
          );

          setProfileWebsite(
            storedUser.website || ""
          );
        }
      } catch {
        // ignore
      }
    }
  };

  // ============================================================
  // FETCH PROFILE STATS
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
        pinned: notes.filter(
          (note) => note.pinned === true
        ).length,
        favorites: notes.filter(
          (note) => note.favorite === true
        ).length,
      });
    } catch (error) {
      console.error(
        "Profile stats error:",
        error
      );
    }
  };

  // ============================================================
  // FETCH NOTIFICATION SETTINGS
  // ============================================================

  const fetchNotificationSettings = async () => {
    if (!userId) return;

    try {
      const response = await fetch(
        `${API_URL}/users/${userId}/settings`
      );

      if (!response.ok) return;

      const data = await response.json();

      const settings = data.settings || data;

      setNotificationSettings((previous) => ({
        ...previous,
        ...settings,
      }));
    } catch (error) {
      console.error(
        "Notification settings error:",
        error
      );
    }
  };

  // ============================================================
  // LOAD THEME
  // ============================================================

  const loadTheme = () => {
    try {
      const savedSettings = JSON.parse(
        localStorage.getItem(
          "notehive_settings"
        ) || "{}"
      );

      const savedTheme =
        savedSettings.theme || "light";

      setTheme(savedTheme);

      document.body.classList.remove(
        "theme-light",
        "theme-dark",
        "theme-system"
      );

      document.body.classList.add(
        `theme-${savedTheme}`
      );
    } catch {
      setTheme("light");
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
  }, []);

  // ============================================================
  // PROFILE PHOTO
  // ============================================================

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    clearMessages();

    if (!file.type.startsWith("image/")) {
      setErrorMessage(
        "Please select a valid image file."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(
        "Profile photo must be smaller than 5 MB."
      );
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const image = new Image();

      image.onload = () => {
        const maxSize = 500;

        let width = image.width;
        let height = image.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round(
              (height * maxSize) / width
            );

            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round(
              (width * maxSize) / height
            );

            height = maxSize;
          }
        }

        const canvas =
          document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const context =
          canvas.getContext("2d");

        context.drawImage(
          image,
          0,
          0,
          width,
          height
        );

        const compressedImage =
          canvas.toDataURL(
            "image/jpeg",
            0.82
          );

        setProfileImage(compressedImage);
      };

      image.src = e.target.result;
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  };

  // ============================================================
  // REMOVE PHOTO
  // ============================================================

  const handleRemoveProfileImage = () => {
    clearMessages();
    setProfileImage("");
  };

  // ============================================================
  // SAVE PROFILE
  // ============================================================

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    clearMessages();

    if (!userId) {
      setErrorMessage(
        "User session not found. Please login again."
      );
      return;
    }

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
          data.message ||
            "Unable to update profile."
        );
      }

      const updatedUser =
        data.user ||
        data.updatedUser ||
        {
          ...user,
          name: profileName.trim(),
          email: profileEmail.trim(),
          bio: profileBio.trim(),
          profileImage: profileImage || "",
          profession: profileProfession.trim(),
          location: profileLocation.trim(),
          website: profileWebsite.trim(),
        };

      setUser(updatedUser);

      setProfileName(
        updatedUser.name || ""
      );

      setProfileEmail(
        updatedUser.email || ""
      );

      setProfileBio(
        updatedUser.bio || ""
      );

      setProfileImage(
        updatedUser.profileImage || ""
      );

      setProfileProfession(
        updatedUser.profession || ""
      );

      setProfileLocation(
        updatedUser.location || ""
      );

      setProfileWebsite(
        updatedUser.website || ""
      );

      localStorage.setItem(
        "notehive_user",
        JSON.stringify(updatedUser)
      );

      setSuccessMessage(
        "Profile updated successfully ✅"
      );

      fetchProfileStats();
    } catch (error) {
      console.error(
        "Save profile error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Something went wrong while saving profile."
      );
    } finally {
      setProfileSaving(false);
    }
  };

  // ============================================================
  // NOTIFICATION SAVE
  // ============================================================

  const saveNotificationSettings =
    async () => {
      clearMessages();

      if (!userId) return;

      setNotificationSaving(true);

      try {
        const response = await fetch(
          `${API_URL}/users/${userId}/settings`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              notificationSettings
            ),
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
        console.error(
          "Save notification settings:",
          error
        );

        setErrorMessage(
          error.message ||
            "Unable to save notification settings."
        );
      } finally {
        setNotificationSaving(false);
      }
    };

  // ============================================================
  // NOTIFICATION TOGGLE
  // ============================================================

  const handleNotificationChange = (
    name
  ) => {
    setNotificationSettings(
      (previous) => ({
        ...previous,
        [name]: !previous[name],
      })
    );
  };

  // ============================================================
  // THEME
  // ============================================================

  const handleThemeChange = (
    selectedTheme
  ) => {
    setTheme(selectedTheme);

    try {
      const oldSettings = JSON.parse(
        localStorage.getItem(
          "notehive_settings"
        ) || "{}"
      );

      localStorage.setItem(
        "notehive_settings",
        JSON.stringify({
          ...oldSettings,
          theme: selectedTheme,
        })
      );
    } catch {
      // ignore
    }

    document.body.classList.remove(
      "theme-light",
      "theme-dark",
      "theme-system"
    );

    document.body.classList.add(
      `theme-${selectedTheme}`
    );
  };

  // ============================================================
  // CHANGE PASSWORD
  // ============================================================

  const handleChangePassword = async (
    event
  ) => {
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
            "Content-Type":
              "application/json",
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
          data.message ||
            "Unable to change password."
        );
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setSuccessMessage(
        "Password changed successfully ✅"
      );
    } catch (error) {
      console.error(
        "Change password error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to change password."
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  // ============================================================
  // DELETE ACCOUNT
  // ============================================================

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );

    if (!confirmed) return;

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
          data.message ||
            "Unable to delete account."
        );
      }

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

      localStorage.removeItem(
        "notehive_settings"
      );

      navigate("/signup");
    } catch (error) {
      console.error(
        "Delete account error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to delete account."
      );
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
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

    navigate("/login");
  };

  // ============================================================
  // AVATAR INITIAL
  // ============================================================

  const getInitial = () => {
    if (profileName) {
      return profileName
        .trim()
        .charAt(0)
        .toUpperCase();
    }

    return "U";
  };

  // ============================================================
  // MEMBER SINCE
  // ============================================================

  const getMemberSince = () => {
    if (!user.createdAt) return "—";

    const date = new Date(
      user.createdAt
    );

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        month: "short",
        year: "numeric",
      }
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="settings-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="settings-header">
        <div>
          <div className="settings-eyebrow">
            NOTEHIVE SETTINGS
          </div>

          <h1>Settings</h1>

          <p>
            Manage your account and
            application preferences.
          </p>
        </div>
      </div>

      {/* =====================================================
          MESSAGES
      ===================================================== */}

      {successMessage && (
        <div className="settings-message success">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="settings-message error">
          {errorMessage}
        </div>
      )}

      {/* =====================================================
          MAIN LAYOUT
      ===================================================== */}

      <div className="settings-layout">

        {/* =================================================
            DESKTOP SIDEBAR
        ================================================= */}

        <aside className="settings-sidebar">

          <div className="settings-panel-title">
            USER PANEL
          </div>

          <nav>

            <button
              type="button"
              className={`settings-nav ${
                activeSection === "profile"
                  ? "active"
                  : ""
              }`}
              onClick={() => {
                clearMessages();
                setActiveSection("profile");
              }}
            >
              <span className="settings-nav-icon">
                👤
              </span>

              <span>Profile</span>
            </button>

            <button
              type="button"
              className={`settings-nav ${
                activeSection === "notifications"
                  ? "active"
                  : ""
              }`}
              onClick={() => {
                clearMessages();
                setActiveSection("notifications");
              }}
            >
              <span className="settings-nav-icon">
                🔔
              </span>

              <span>Notifications</span>
            </button>

            <button
              type="button"
              className={`settings-nav ${
                activeSection === "appearance"
                  ? "active"
                  : ""
              }`}
              onClick={() => {
                clearMessages();
                setActiveSection("appearance");
              }}
            >
              <span className="settings-nav-icon">
                🎨
              </span>

              <span>Appearance</span>
            </button>

            <button
              type="button"
              className={`settings-nav ${
                activeSection === "privacy"
                  ? "active"
                  : ""
              }`}
              onClick={() => {
                clearMessages();
                setActiveSection("privacy");
              }}
            >
              <span className="settings-nav-icon">
                🔐
              </span>

              <span>
                Privacy & Security
              </span>
            </button>

            <button
              type="button"
              className={`settings-nav ${
                activeSection === "notes"
                  ? "active"
                  : ""
              }`}
              onClick={() => {
                clearMessages();
                setActiveSection("notes");
              }}
            >
              <span className="settings-nav-icon">
                📝
              </span>

              <span>
                Notes Preferences
              </span>
            </button>

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

        {/* =================================================
            MOBILE THREE DOT USER PANEL
        ================================================= */}

        <div className="mobile-settings-menu">

          <button
            type="button"
            className="mobile-settings-menu-btn"
            onClick={() =>
              setMobileMenuOpen(
                (previous) => !previous
              )
            }
            aria-label="Open User Panel"
            aria-expanded={mobileMenuOpen}
          >
            ⋮
          </button>

          {mobileMenuOpen && (
            <div className="mobile-settings-dropdown">

              <div className="mobile-settings-title">

                <span>🐝</span>

                <div>
                  <strong>
                    USER PANEL
                  </strong>

                  <small>
                    NoteHive
                  </small>
                </div>

              </div>

              <div className="mobile-settings-divider" />

              <button
                type="button"
                className={`mobile-settings-nav ${
                  activeSection === "profile"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleMobileSectionChange(
                    "profile"
                  )
                }
              >
                <span>👤</span>
                <span>Profile</span>
              </button>

              <button
                type="button"
                className={`mobile-settings-nav ${
                  activeSection === "notifications"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleMobileSectionChange(
                    "notifications"
                  )
                }
              >
                <span>🔔</span>
                <span>Notifications</span>
              </button>

              <button
                type="button"
                className={`mobile-settings-nav ${
                  activeSection === "appearance"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleMobileSectionChange(
                    "appearance"
                  )
                }
              >
                <span>🎨</span>
                <span>Appearance</span>
              </button>

              <button
                type="button"
                className={`mobile-settings-nav ${
                  activeSection === "privacy"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleMobileSectionChange(
                    "privacy"
                  )
                }
              >
                <span>🔐</span>
                <span>
                  Privacy & Security
                </span>
              </button>

              <button
                type="button"
                className={`mobile-settings-nav ${
                  activeSection === "notes"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleMobileSectionChange(
                    "notes"
                  )
                }
              >
                <span>📝</span>
                <span>
                  Notes Preferences
                </span>
              </button>

              <div className="mobile-settings-divider" />

              <button
                type="button"
                className="mobile-settings-nav mobile-settings-logout"
                onClick={handleLogout}
              >
                <span>🚪</span>
                <span>Logout</span>
              </button>

            </div>
          )}

        </div>

        {/* =================================================
            MAIN
        ================================================= */}

        <main className="settings-main">

          {/* =================================================
              PROFILE
          ================================================= */}

          {activeSection === "profile" && (
            <section className="settings-card profile-card">

              <div className="profile-cover">
                <div>

                  <span className="profile-cover-small">
                    NOTEHIVE
                  </span>

                  <strong>
                    My Profile
                  </strong>

                </div>
              </div>

              {/* PROFILE HEADER */}

              <div className="profile-box">

                <div className="profile-avatar-wrapper">

                  <div className="profile-avatar">

                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Profile"
                      />
                    ) : (
                      <span>
                        {getInitial()}
                      </span>
                    )}

                  </div>

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
                    {profileEmail}
                  </span>

                </div>

              </div>

              {/* PROFILE FORM */}

              <form
                className="settings-form"
                onSubmit={handleSaveProfile}
              >

                {/* PHOTO */}

                <div className="profile-photo-section">

                  <div className="profile-photo-preview">

                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Profile preview"
                      />
                    ) : (
                      <span>
                        {getInitial()}
                      </span>
                    )}

                  </div>

                  <div className="profile-photo-content">

                    <h3>
                      Profile Photo
                    </h3>

                    <p>
                      JPG, PNG or other
                      image format. Maximum
                      original size 5 MB.
                    </p>

                    <div className="photo-actions">

                      <button
                        type="button"
                        className="photo-btn"
                        onClick={() =>
                          fileInputRef.current?.click()
                        }
                      >
                        📷 Change Photo
                      </button>

                      {profileImage && (
                        <button
                          type="button"
                          className="remove-photo-btn"
                          onClick={
                            handleRemoveProfileImage
                          }
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

                {/* BASIC INFORMATION */}

                <div className="form-section-title">
                  BASIC INFORMATION
                </div>

                <div className="profile-form-grid">

                  <div className="form-group">

                    <label>
                      Full Name
                    </label>

                    <input
                      type="text"
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

                {/* EXTRA INFORMATION */}

                <div className="form-section-title">
                  EXTRA INFORMATION
                </div>

                <div className="profile-extra-grid">

                  <div className="form-group">

                    <label>
                      💼 Profession / Role
                    </label>

                    <input
                      type="text"
                      value={profileProfession}
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
                      type="text"
                      value={profileLocation}
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
                      value={profileWebsite}
                      onChange={(e) =>
                        setProfileWebsite(
                          e.target.value
                        )
                      }
                      placeholder="https://example.com"
                    />

                  </div>

                </div>

                {/* BIO */}

                <div className="form-section-title">
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

                  <div className="profile-stat blue-stat">

                    <div className="profile-stat-icon">
                      📝
                    </div>

                    <div>
                      <strong>
                        {profileStats.notes}
                      </strong>

                      <small>
                        Total Notes
                      </small>
                    </div>

                  </div>

                  <div className="profile-stat purple-stat">

                    <div className="profile-stat-icon">
                      📌
                    </div>

                    <div>
                      <strong>
                        {profileStats.pinned}
                      </strong>

                      <small>
                        Pinned
                      </small>
                    </div>

                  </div>

                  <div className="profile-stat pink-stat">

                    <div className="profile-stat-icon">
                      ❤️
                    </div>

                    <div>
                      <strong>
                        {profileStats.favorites}
                      </strong>

                      <small>
                        Favorites
                      </small>
                    </div>

                  </div>

                  <div className="profile-stat green-stat">

                    <div className="profile-stat-icon">
                      📅
                    </div>

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

                {/* USER ID */}

                <div className="form-section-title">
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
                    type="submit"
                    className="primary-btn"
                    disabled={profileSaving}
                  >
                    {profileSaving
                      ? "Saving..."
                      : "Save Profile"}
                  </button>

                </div>

              </form>

            </section>
          )}

          {/* =================================================
              NOTIFICATIONS
          ================================================= */}

          {activeSection === "notifications" && (
            <section className="settings-card">

              <div className="settings-card-header">

                <span className="section-label">
                  🔔 NOTIFICATIONS
                </span>

                <h2>
                  Notification Settings
                </h2>

                <p>
                  Choose which notifications
                  you want to receive.
                </p>

              </div>

              <div className="settings-options">

                <div className="settings-row">

                  <div className="settings-row-content">

                    <h3>
                      Email Notifications
                    </h3>

                    <p>
                      Receive important
                      account notifications
                      by email.
                    </p>

                  </div>

                  <label className="switch">

                    <input
                      type="checkbox"
                      checked={
                        notificationSettings.emailNotifications
                      }
                      onChange={() =>
                        handleNotificationChange(
                          "emailNotifications"
                        )
                      }
                    />

                    <span className="slider" />

                  </label>

                </div>

                <div className="settings-row">

                  <div className="settings-row-content">

                    <h3>
                      Note Reminders
                    </h3>

                    <p>
                      Get reminders about
                      your saved notes.
                    </p>

                  </div>

                  <label className="switch">

                    <input
                      type="checkbox"
                      checked={
                        notificationSettings.noteReminders
                      }
                      onChange={() =>
                        handleNotificationChange(
                          "noteReminders"
                        )
                      }
                    />

                    <span className="slider" />

                  </label>

                </div>

                <div className="settings-row">

                  <div className="settings-row-content">

                    <h3>
                      Shared Notes
                    </h3>

                    <p>
                      Get notified when notes
                      are shared with you.
                    </p>

                  </div>

                  <label className="switch">

                    <input
                      type="checkbox"
                      checked={
                        notificationSettings.sharedNotes
                      }
                      onChange={() =>
                        handleNotificationChange(
                          "sharedNotes"
                        )
                      }
                    />

                    <span className="slider" />

                  </label>

                </div>

                <div className="settings-row">

                  <div className="settings-row-content">

                    <h3>
                      NoteHive Updates
                    </h3>

                    <p>
                      Receive product and
                      feature updates.
                    </p>

                  </div>

                  <label className="switch">

                    <input
                      type="checkbox"
                      checked={
                        notificationSettings.updates
                      }
                      onChange={() =>
                        handleNotificationChange(
                          "updates"
                        )
                      }
                    />

                    <span className="slider" />

                  </label>

                </div>

              </div>

              <div className="card-action">

                <button
                  type="button"
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
                    : "Save Notifications"}
                </button>

              </div>

            </section>
          )}

          {/* =================================================
              APPEARANCE
          ================================================= */}

          {activeSection === "appearance" && (
            <section className="settings-card">

              <div className="settings-card-header">

                <span className="section-label">
                  🎨 APPEARANCE
                </span>

                <h2>
                  Appearance
                </h2>

                <p>
                  Customize the look of
                  your NoteHive account.
                </p>

              </div>

              <div className="theme-options">

                <button
                  type="button"
                  className={`theme-option ${
                    theme === "light"
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    handleThemeChange("light")
                  }
                >

                  <div className="theme-preview light-preview">
                    <div />
                    <div />
                    <div />
                  </div>

                  <div>

                    <strong>
                      Light
                    </strong>

                    <span>
                      Clean white interface
                    </span>

                  </div>

                  {theme === "light" && (
                    <span className="theme-check">
                      ✓
                    </span>
                  )}

                </button>

                <button
                  type="button"
                  className={`theme-option ${
                    theme === "dark"
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    handleThemeChange("dark")
                  }
                >

                  <div className="theme-preview dark-preview">
                    <div />
                    <div />
                    <div />
                  </div>

                  <div>

                    <strong>
                      Dark
                    </strong>

                    <span>
                      Dark interface
                    </span>

                  </div>

                  {theme === "dark" && (
                    <span className="theme-check">
                      ✓
                    </span>
                  )}

                </button>

              </div>

            </section>
          )}

          {/* =================================================
              PRIVACY
          ================================================= */}

          {activeSection === "privacy" && (
            <section className="settings-card">

              <div className="settings-card-header">

                <span className="section-label">
                  🔐 PRIVACY & SECURITY
                </span>

                <h2>
                  Privacy & Security
                </h2>

                <p>
                  Keep your NoteHive account
                  secure.
                </p>

              </div>

              <form
                className="password-form"
                onSubmit={
                  handleChangePassword
                }
              >

                <div className="form-section-title">
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
                    placeholder="Enter new password"
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
                    type="submit"
                    className="primary-btn"
                    disabled={passwordSaving}
                  >
                    {passwordSaving
                      ? "Updating..."
                      : "Change Password"}
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
                    NoteHive account and
                    account data.
                  </p>

                </div>

                <button
                  type="button"
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

          {/* =================================================
              NOTES
          ================================================= */}

          {activeSection === "notes" && (
            <section className="settings-card">

              <div className="settings-card-header">

                <span className="section-label">
                  📝 NOTES PREFERENCES
                </span>

                <h2>
                  Notes Preferences
                </h2>

                <p>
                  Manage your preferred note
                  behaviour.
                </p>

              </div>

              <div className="settings-row">

                <div className="settings-row-content">

                  <h3>
                    Auto Save
                  </h3>

                  <p>
                    Automatically save changes
                    while editing notes.
                  </p>

                </div>

                <label className="switch">

                  <input
                    type="checkbox"
                    defaultChecked
                  />

                  <span className="slider" />

                </label>

              </div>

              <div className="settings-row">

                <div className="settings-row-content">

                  <h3>
                    Confirm Before Delete
                  </h3>

                  <p>
                    Ask for confirmation before
                    deleting a note.
                  </p>

                </div>

                <label className="switch">

                  <input
                    type="checkbox"
                    defaultChecked
                  />

                  <span className="slider" />

                </label>

              </div>

              <div className="settings-row">

                <div className="settings-row-content">

                  <h3>
                    Show Completed Notes
                  </h3>

                  <p>
                    Keep completed notes visible
                    in your notes list.
                  </p>

                </div>

                <label className="switch">

                  <input
                    type="checkbox"
                    defaultChecked
                  />

                  <span className="slider" />

                </label>

              </div>

            </section>
          )}

        </main>

      </div>

    </div>
  );
};

export default Settings;