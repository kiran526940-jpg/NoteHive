
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminProfile.css";

const SERVER_URL = "https://notehive-backend-g1pc.onrender.com";

function AdminProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const adminId = localStorage.getItem("adminId");

  const [admin, setAdmin] = useState({
    name: "",
    email: "",
    profileImage: "",
    role: "Admin",
    bio: "",
    profession: "",
    location: "",
    website: "",
    createdAt: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // =====================================================
  // AUTH + LOAD
  // =====================================================

  useEffect(() => {
    if (!adminId) {
      navigate("/admin-login");
      return;
    }

    fetchAdminProfile();

    return () => {
      if (preview && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [adminId, navigate]);

  // =====================================================
  // MESSAGE
  // =====================================================

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 4000);
  };

  // =====================================================
  // FETCH PROFILE
  // =====================================================

  const fetchAdminProfile = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${SERVER_URL}/api/admin/profile/${adminId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch profile");
      }

      const user = data.user || {};

      const profile = {
        name: user.name || "",
        email: user.email || "",
        profileImage: user.profileImage || "",
        role: user.role || "Admin",
        bio: user.bio || "",
        profession: user.profession || "",
        location: user.location || "",
        website: user.website || "",
        createdAt: user.createdAt || "",
      };

      setAdmin(profile);

      setFormData({
        name: profile.name,
        email: profile.email,
        bio: profile.bio,
      });

      if (profile.profileImage) {
        setPreview(
          `${SERVER_URL}${profile.profileImage}?t=${Date.now()}`
        );
      } else {
        setPreview("");
      }
    } catch (error) {
      console.error("Admin profile error:", error);

      showMessage(
        error.message || "Unable to load admin profile.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INPUT
  // =====================================================

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // SAVE PROFILE
  // =====================================================

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (!adminId) {
      navigate("/admin-login");
      return;
    }

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedBio = formData.bio.trim();

    if (!trimmedName) {
      showMessage("Please enter your name.", "error");
      return;
    }

    if (!trimmedEmail) {
      showMessage("Please enter your email.", "error");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const response = await fetch(
        `${SERVER_URL}/api/admin/profile/${adminId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: trimmedName,
            email: trimmedEmail,
            bio: trimmedBio,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update profile"
        );
      }

      const updatedUser = data.user || {};

      setAdmin((prev) => ({
        ...prev,
        name: updatedUser.name ?? trimmedName,
        email: updatedUser.email ?? trimmedEmail,
        bio: updatedUser.bio ?? trimmedBio,
      }));

      setFormData({
        name: updatedUser.name ?? trimmedName,
        email: updatedUser.email ?? trimmedEmail,
        bio: updatedUser.bio ?? trimmedBio,
      });

      localStorage.setItem(
        "adminName",
        updatedUser.name ?? trimmedName
      );

      showMessage(
        "Profile updated successfully ✓",
        "success"
      );
    } catch (error) {
      console.error("Profile update error:", error);

      showMessage(
        error.message || "Unable to update profile.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =====================================================
  // JOIN DATE FALLBACK
  // =====================================================

  const getJoinDate = () => {
    if (admin.createdAt) {
      return formatDate(admin.createdAt);
    }

    if (
      adminId &&
      /^[a-fA-F0-9]{24}$/.test(adminId)
    ) {
      try {
        const timestamp = parseInt(
          adminId.substring(0, 8),
          16
        );

        const date = new Date(timestamp * 1000);

        if (!Number.isNaN(date.getTime())) {
          return formatDate(date);
        }
      } catch (error) {
        console.error(
          "Join date calculation error:",
          error
        );
      }
    }

    return "Not available";
  };

  // =====================================================
  // FILE SELECT
  // =====================================================

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      showMessage(
        "Please select JPG, PNG or WEBP image.",
        "error"
      );

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showMessage(
        "Image size must be less than 5 MB.",
        "error"
      );

      event.target.value = "";
      return;
    }

    if (
      preview &&
      preview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(preview);
    }

    const imageURL = URL.createObjectURL(file);

    setSelectedFile(file);
    setPreview(imageURL);
    setMessage("");
  };

  // =====================================================
  // UPLOAD PHOTO
  // =====================================================

  const handleUploadPhoto = async () => {
    if (!selectedFile) {
      showMessage(
        "Please select a profile photo first.",
        "error"
      );
      return;
    }

    if (!adminId) {
      navigate("/admin-login");
      return;
    }

    try {
      setUploading(true);

      const uploadData = new FormData();

      uploadData.append(
        "profileImage",
        selectedFile
      );

      const response = await fetch(
        `${SERVER_URL}/api/admin/profile/${adminId}/photo`,
        {
          method: "PUT",
          body: uploadData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Profile photo upload failed"
        );
      }

      const imagePath =
        data.user?.profileImage || "";

      setAdmin((prev) => ({
        ...prev,
        profileImage: imagePath,
      }));

      setPreview(
        imagePath
          ? `${SERVER_URL}${imagePath}?t=${Date.now()}`
          : ""
      );

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      showMessage(
        "Profile photo updated successfully ✓",
        "success"
      );
    } catch (error) {
      console.error(
        "Photo upload error:",
        error
      );

      showMessage(
        error.message ||
          "Profile photo upload failed.",
        "error"
      );
    } finally {
      setUploading(false);
    }
  };

  // =====================================================
  // CANCEL PHOTO
  // =====================================================

  const handleCancelPhoto = () => {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (admin.profileImage) {
      setPreview(
        `${SERVER_URL}${admin.profileImage}?t=${Date.now()}`
      );
    } else {
      setPreview("");
    }

    setMessage("");
  };

  // =====================================================
  // REMOVE PHOTO
  // =====================================================

  const handleRemovePhoto = async () => {
    if (!adminId) return;

    const confirmRemove = window.confirm(
      "Are you sure you want to remove your profile photo?"
    );

    if (!confirmRemove) return;

    try {
      setUploading(true);

      const response = await fetch(
        `${SERVER_URL}/api/admin/profile/${adminId}/photo`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to remove photo"
        );
      }

      setAdmin((prev) => ({
        ...prev,
        profileImage: "",
      }));

      setPreview("");
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      showMessage(
        "Profile photo removed successfully.",
        "success"
      );
    } catch (error) {
      console.error(
        "Remove photo error:",
        error
      );

      showMessage(
        error.message ||
          "Unable to remove photo.",
        "error"
      );
    } finally {
      setUploading(false);
    }
  };

  // =====================================================
  // PASSWORD
  // =====================================================

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (!adminId) {
      navigate("/admin-login");
      return;
    }

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = passwordData;

    if (!currentPassword) {
      showMessage(
        "Please enter your current password.",
        "error"
      );
      return;
    }

    if (!newPassword) {
      showMessage(
        "Please enter a new password.",
        "error"
      );
      return;
    }

    if (newPassword.length < 6) {
      showMessage(
        "New password must contain at least 6 characters.",
        "error"
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage(
        "New password and confirm password do not match.",
        "error"
      );
      return;
    }

    try {
      setChangingPassword(true);

      const response = await fetch(
        `${SERVER_URL}/api/admin/profile/${adminId}/password`,
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
          data.message ||
            "Unable to change password"
        );
      }

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setShowPasswordSection(false);

      showMessage(
        "Password changed successfully ✓",
        "success"
      );
    } catch (error) {
      console.error(
        "Password change error:",
        error
      );

      showMessage(
        error.message ||
          "Unable to change password.",
        "error"
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    const confirmLogout = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmLogout) return;

    localStorage.removeItem(
      "adminLoggedIn"
    );
    localStorage.removeItem("userRole");
    localStorage.removeItem("adminName");
    localStorage.removeItem("adminId");

    navigate("/admin-login");
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="admin-profile-loading">
        <div className="admin-profile-spinner"></div>
        <p>Loading admin profile...</p>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="admin-profile-page">

      {/* HEADER */}

      <header className="admin-profile-topbar">

        <div>
          <span className="admin-profile-eyebrow">
            NOTEHIVE ADMINISTRATION
          </span>

          <h1>Admin Profile</h1>

          <p>
            Manage your account, identity and security
            settings.
          </p>
        </div>

        <button
          className="admin-profile-dashboard-btn"
          onClick={() =>
            navigate("/admin-dashboard")
          }
        >
          <span>←</span>
          Dashboard
        </button>

      </header>

      {/* MESSAGE */}

      {message && (
        <div
          className={`admin-profile-message ${messageType}`}
        >
          <span>
            {messageType === "success"
              ? "✓"
              : "!"}
          </span>

          {message}
        </div>
      )}

      {/* HERO */}

      <section className="admin-profile-hero">

        <div className="admin-hero-glow"></div>

        <div className="admin-hero-content">

          <div className="admin-hero-avatar-area">

            <div className="admin-avatar-ring">

              {preview ? (
                <img
                  src={preview}
                  alt="Admin"
                  className="admin-profile-image"
                  onError={(event) => {
                    event.currentTarget.style.display =
                      "none";
                  }}
                />
              ) : (
                <div className="admin-default-avatar">
                  👤
                </div>
              )}

              <button
                type="button"
                className="admin-camera-btn"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                title="Change profile photo"
              >
                📷
              </button>

            </div>

          </div>

          <div className="admin-hero-info">

            <div className="admin-name-line">

              <h2>
                {admin.name ||
                  "Administrator"}
              </h2>

              <span className="admin-verified">
                ✓
              </span>

            </div>

            <span className="admin-role-badge">
              🛡️ Administrator
            </span>

            <p className="admin-hero-email">
              {admin.email ||
                "No email available"}
            </p>

            {admin.bio ? (
              <p className="admin-hero-bio">
                “{admin.bio}”
              </p>
            ) : (
              <p className="admin-hero-bio muted">
                Add a short description about
                yourself.
              </p>
            )}

          </div>

          <div className="admin-hero-date">

            <span className="admin-date-icon">
              📅
            </span>

            <div>
              <small>Member since</small>

              <strong>
                {getJoinDate()}
              </strong>
            </div>

          </div>

        </div>

      </section>

      {/* MAIN GRID */}

      <div className="admin-profile-layout">

        {/* LEFT */}

        <main>

          {/* PERSONAL */}

          <section className="admin-panel">

            <div className="admin-panel-heading">

              <div className="admin-panel-icon blue">
                👤
              </div>

              <div>
                <h3>Personal Information</h3>
                <p>
                  Keep your administrator profile
                  information up to date.
                </p>
              </div>

            </div>

            <form
              onSubmit={handleSaveProfile}
            >

              <div className="admin-form-grid">

                <div className="admin-form-group">

                  <label>
                    Full Name
                  </label>

                  <div className="admin-input-wrapper">

                    <span>👤</span>

                    <input
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={
                        handleInputChange
                      }
                      placeholder="Enter your name"
                    />

                  </div>

                </div>

                <div className="admin-form-group">

                  <label>
                    Email Address
                  </label>

                  <div className="admin-input-wrapper">

                    <span>📧</span>

                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={
                        handleInputChange
                      }
                      placeholder="Enter your email"
                    />

                  </div>

                </div>

              </div>

              <div className="admin-form-group">

                <div className="admin-label-row">

                  <label>
                    About You
                  </label>

                  <span>
                    {formData.bio.length}/250
                  </span>

                </div>

                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={
                    handleInputChange
                  }
                  maxLength={250}
                  rows={5}
                  placeholder="Write something about yourself..."
                />

              </div>

              <button
                type="submit"
                className="admin-primary-btn"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "💾 Save Profile"}
              </button>

            </form>

          </section>

          {/* PROFILE PHOTO */}

          <section className="admin-panel">

            <div className="admin-panel-heading">

              <div className="admin-panel-icon purple">
                📸
              </div>

              <div>
                <h3>Profile Photo</h3>
                <p>
                  Use a professional image for your
                  administrator account.
                </p>
              </div>

            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileChange}
              className="admin-hidden-file-input"
            />

            <div className="admin-photo-upload">

              <div className="admin-upload-preview">

                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                  />
                ) : (
                  <span>👤</span>
                )}

              </div>

              <div className="admin-upload-text">

                <h4>
                  {selectedFile
                    ? selectedFile.name
                    : "Upload profile photo"}
                </h4>

                <p>
                  JPG, PNG or WEBP · Maximum 5 MB
                </p>

                <div className="admin-photo-buttons">

                  <button
                    type="button"
                    className="admin-secondary-btn"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                  >
                    📷 Choose Photo
                  </button>

                  {admin.profileImage &&
                    !selectedFile && (
                      <button
                        type="button"
                        className="admin-danger-outline"
                        onClick={
                          handleRemovePhoto
                        }
                        disabled={uploading}
                      >
                        Remove
                      </button>
                    )}

                </div>

              </div>

            </div>

            {selectedFile && (
              <div className="admin-selected-file">

                <div>
                  <span>🖼️</span>

                  <div>
                    <strong>
                      Selected image
                    </strong>

                    <small>
                      {(
                        selectedFile.size /
                        1024 /
                        1024
                      ).toFixed(2)}{" "}
                      MB
                    </small>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={
                    handleCancelPhoto
                  }
                >
                  ✕
                </button>

              </div>
            )}

            <div className="admin-photo-actions">

              <button
                type="button"
                className="admin-primary-btn"
                onClick={
                  handleUploadPhoto
                }
                disabled={
                  !selectedFile ||
                  uploading
                }
              >
                {uploading
                  ? "Uploading..."
                  : "💾 Save Photo"}
              </button>

              {selectedFile && (
                <button
                  type="button"
                  className="admin-cancel-btn"
                  onClick={
                    handleCancelPhoto
                  }
                  disabled={uploading}
                >
                  Cancel
                </button>
              )}

            </div>

          </section>

          {/* SECURITY */}

          <section className="admin-panel security-panel">

            <button
              type="button"
              className="security-header"
              onClick={() =>
                setShowPasswordSection(
                  (prev) => !prev
                )
              }
            >

              <div className="security-header-left">

                <div className="admin-panel-icon green">
                  🔐
                </div>

                <div>
                  <h3>Security</h3>
                  <p>
                    Protect your administrator
                    account.
                  </p>
                </div>

              </div>

              <span className="security-arrow">
                {showPasswordSection
                  ? "⌃"
                  : "⌄"}
              </span>

            </button>

            {showPasswordSection && (
              <form
                className="admin-password-form"
                onSubmit={
                  handleChangePassword
                }
              >

                <div className="admin-form-group">

                  <label>
                    Current Password
                  </label>

                  <div className="admin-input-wrapper">

                    <span>🔒</span>

                    <input
                      type={
                        showCurrentPassword
                          ? "text"
                          : "password"
                      }
                      name="currentPassword"
                      value={
                        passwordData.currentPassword
                      }
                      onChange={
                        handlePasswordChange
                      }
                      placeholder="Enter current password"
                    />

                    <button
                      type="button"
                      className="admin-password-eye"
                      onClick={() =>
                        setShowCurrentPassword(
                          (prev) => !prev
                        )
                      }
                    >
                      {showCurrentPassword
                        ? "🙈"
                        : "👁️"}
                    </button>

                  </div>

                </div>

                <div className="admin-form-grid">

                  <div className="admin-form-group">

                    <label>
                      New Password
                    </label>

                    <div className="admin-input-wrapper">

                      <span>🔑</span>

                      <input
                        type={
                          showNewPassword
                            ? "text"
                            : "password"
                        }
                        name="newPassword"
                        value={
                          passwordData.newPassword
                        }
                        onChange={
                          handlePasswordChange
                        }
                        placeholder="Minimum 6 characters"
                      />

                      <button
                        type="button"
                        className="admin-password-eye"
                        onClick={() =>
                          setShowNewPassword(
                            (prev) => !prev
                          )
                        }
                      >
                        {showNewPassword
                          ? "🙈"
                          : "👁️"}
                      </button>

                    </div>

                  </div>

                  <div className="admin-form-group">

                    <label>
                      Confirm Password
                    </label>

                    <div className="admin-input-wrapper">

                      <span>🔐</span>

                      <input
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        name="confirmPassword"
                        value={
                          passwordData.confirmPassword
                        }
                        onChange={
                          handlePasswordChange
                        }
                        placeholder="Repeat new password"
                      />

                      <button
                        type="button"
                        className="admin-password-eye"
                        onClick={() =>
                          setShowConfirmPassword(
                            (prev) => !prev
                          )
                        }
                      >
                        {showConfirmPassword
                          ? "🙈"
                          : "👁️"}
                      </button>

                    </div>

                  </div>

                </div>

                <button
                  type="submit"
                  className="admin-primary-btn"
                  disabled={
                    changingPassword
                  }
                >
                  {changingPassword
                    ? "Changing Password..."
                    : "🔐 Change Password"}
                </button>

              </form>
            )}

          </section>

        </main>

        {/* RIGHT SIDEBAR */}

        <aside className="admin-profile-sidebar">

          {/* ACCOUNT CARD */}

          <section className="admin-account-card">

            <div className="admin-account-card-top">

              <div className="admin-small-avatar">

                {preview ? (
                  <img
                    src={preview}
                    alt="Admin"
                  />
                ) : (
                  <span>👤</span>
                )}

              </div>

              <div>

                <strong>
                  {admin.name ||
                    "Administrator"}
                </strong>

                <span>
                  {admin.role ||
                    "Admin"}
                </span>

              </div>

            </div>

            <div className="admin-active-status">
              <span></span>
              Account Active
            </div>

          </section>

          {/* ACCOUNT DETAILS */}

          <section className="admin-details-card">

            <div className="admin-card-title">
              <h3>Account Details</h3>
              <span>•••</span>
            </div>

            <div className="admin-detail-item">
              <div className="detail-icon blue">
                👤
              </div>

              <div>
                <small>Full Name</small>
                <strong>
                  {admin.name ||
                    "Administrator"}
                </strong>
              </div>
            </div>

            <div className="admin-detail-item">
              <div className="detail-icon purple">
                📧
              </div>

              <div>
                <small>Email Address</small>
                <strong>
                  {admin.email ||
                    "Not available"}
                </strong>
              </div>
            </div>

            <div className="admin-detail-item">
              <div className="detail-icon orange">
                🛡️
              </div>

              <div>
                <small>Account Type</small>
                <strong>
                  {admin.role ||
                    "Admin"}
                </strong>
              </div>
            </div>

            <div className="admin-detail-item">
              <div className="detail-icon green">
                📅
              </div>

              <div>
                <small>Joined</small>
                <strong>
                  {getJoinDate()}
                </strong>
              </div>
            </div>

            <div className="admin-detail-item">
              <div className="detail-icon pink">
                🔐
              </div>

              <div>
                <small>Security</small>
                <strong>
                  Password Protected
                </strong>
              </div>
            </div>

          </section>

          {/* QUICK ACTION */}

          <section className="admin-quick-card">

            <div className="quick-icon">
              🐝
            </div>

            <div>
              <h3>NoteHive Admin</h3>
              <p>
                Your account is protected and
                managed securely.
              </p>
            </div>

          </section>

          {/* LOGOUT */}

          <button
            type="button"
            className="admin-profile-logout"
            onClick={handleLogout}
          >
            <span>🚪</span>
            Logout from Admin Account
          </button>

        </aside>

      </div>

    </div>
  );
}

export default AdminProfile;

