import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminProfile.css";

const SERVER_URL = "http://192.168.1.68:5000";

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
  // AUTH CHECK
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
  // INPUT CHANGE
  // =====================================================

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // SAVE PROFILE DETAILS
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
        throw new Error(data.message || "Unable to update profile");
      }

      const updatedUser = data.user || {};

      setAdmin((prev) => ({
        ...prev,
        name: updatedUser.name ?? trimmedName,
        email: updatedUser.email ?? trimmedEmail,
        bio: updatedUser.bio ?? trimmedBio,
      }));

      setFormData((prev) => ({
        ...prev,
        name: updatedUser.name ?? trimmedName,
        email: updatedUser.email ?? trimmedEmail,
        bio: updatedUser.bio ?? trimmedBio,
      }));

      localStorage.setItem(
        "adminName",
        updatedUser.name ?? trimmedName
      );

      showMessage("Profile updated successfully ✅", "success");
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

    if (preview && preview.startsWith("blob:")) {
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

      uploadData.append("profileImage", selectedFile);

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
          data.message || "Profile photo upload failed"
        );
      }

      const imagePath = data.user?.profileImage || "";

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
        "Profile photo updated successfully ✅",
        "success"
      );
    } catch (error) {
      console.error("Photo upload error:", error);

      showMessage(
        error.message || "Profile photo upload failed.",
        "error"
      );
    } finally {
      setUploading(false);
    }
  };

  // =====================================================
  // CANCEL SELECTED PHOTO
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
          data.message || "Unable to remove photo"
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
      console.error("Remove photo error:", error);

      showMessage(
        error.message || "Unable to remove photo.",
        "error"
      );
    } finally {
      setUploading(false);
    }
  };

  // =====================================================
  // PASSWORD INPUT
  // =====================================================

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // CHANGE PASSWORD
  // =====================================================

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
          data.message || "Unable to change password"
        );
      }

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setShowPasswordSection(false);

      showMessage(
        "Password changed successfully ✅",
        "success"
      );
    } catch (error) {
      console.error("Password change error:", error);

      showMessage(
        error.message || "Unable to change password.",
        "error"
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // =====================================================
  // DATE FORMAT
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
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    const confirmLogout = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmLogout) return;

    localStorage.removeItem("adminLoggedIn");
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

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="admin-profile-header">
        <div>
          <h1>Admin Profile</h1>
          <p>
            Manage your account, profile photo and security.
          </p>
        </div>

        <button
          className="admin-profile-back-btn"
          onClick={() => navigate("/admin-dashboard")}
        >
          ← Dashboard
        </button>
      </div>

      {/* =================================================
          MAIN PROFILE CARD
      ================================================= */}

      <div className="admin-profile-card">

        {/* =================================================
            LEFT PROFILE
        ================================================= */}

        <div className="admin-profile-left">

          <div className="admin-avatar-wrapper">

            {preview ? (
              <img
                src={preview}
                alt="Admin Profile"
                className="admin-profile-image"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
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
              onClick={() => fileInputRef.current?.click()}
              title="Change profile photo"
            >
              📷
            </button>
          </div>

          <h2>{admin.name || "Administrator"}</h2>

          <span className="admin-role-badge">
            🛡️ {admin.role}
          </span>

          <p className="admin-profile-email">
            {admin.email || "No email available"}
          </p>

          {admin.bio && (
            <p className="admin-profile-bio">
              "{admin.bio}"
            </p>
          )}
        </div>

        {/* =================================================
            RIGHT CONTENT
        ================================================= */}

        <div className="admin-profile-right">

          {/* =================================================
              MESSAGE
          ================================================= */}

          {message && (
            <div
              className={`admin-profile-message ${messageType}`}
            >
              <span>
                {messageType === "success" ? "✓" : "!"}
              </span>

              {message}
            </div>
          )}

          {/* =================================================
              PROFILE DETAILS
          ================================================= */}

          <section className="admin-profile-content-section">

            <div className="admin-profile-section-title">
              <span>👤</span>

              <div>
                <h3>Personal Information</h3>
                <p>
                  Update your basic administrator details.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile}>

              <div className="admin-form-grid">

                <div className="admin-form-group">
                  <label htmlFor="adminName">
                    Full Name
                  </label>

                  <div className="admin-input-wrapper">
                    <span>👤</span>

                    <input
                      id="adminName"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your name"
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label htmlFor="adminEmail">
                    Email Address
                  </label>

                  <div className="admin-input-wrapper">
                    <span>📧</span>

                    <input
                      id="adminEmail"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

              </div>

              <div className="admin-form-group admin-bio-group">
                <label htmlFor="adminBio">
                  About You
                </label>

                <textarea
                  id="adminBio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Write something about yourself..."
                  maxLength={250}
                  rows={4}
                />

                <small>
                  {formData.bio.length}/250
                </small>
              </div>

              <button
                type="submit"
                className="admin-save-profile-btn"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "💾 Save Profile"}
              </button>
            </form>
          </section>

          {/* =================================================
              PROFILE PHOTO
          ================================================= */}

          <section className="admin-profile-content-section">

            <div className="admin-profile-section-title">
              <span>📸</span>

              <div>
                <h3>Profile Photo</h3>
                <p>
                  Upload a professional photo for your admin
                  account.
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

            <div className="admin-upload-box">

              <div className="admin-upload-icon">
                📷
              </div>

              <div className="admin-upload-content">
                <h4>Choose Profile Photo</h4>

                <p>
                  JPG, PNG or WEBP • Maximum 5 MB
                </p>

                <button
                  type="button"
                  className="admin-choose-btn"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                >
                  Choose Photo
                </button>
              </div>
            </div>

            {selectedFile && (
              <div className="admin-selected-file">

                <div>
                  <span className="admin-file-icon">
                    🖼️
                  </span>

                  <div>
                    <strong>
                      {selectedFile.name}
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
                  onClick={handleCancelPhoto}
                  title="Cancel selected photo"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="admin-photo-actions">

              <button
                type="button"
                className="admin-save-photo-btn"
                onClick={handleUploadPhoto}
                disabled={!selectedFile || uploading}
              >
                {uploading
                  ? "Uploading..."
                  : "💾 Save Photo"}
              </button>

              {selectedFile && (
                <button
                  type="button"
                  className="admin-cancel-photo-btn"
                  onClick={handleCancelPhoto}
                  disabled={uploading}
                >
                  Cancel
                </button>
              )}

              {admin.profileImage && !selectedFile && (
                <button
                  type="button"
                  className="admin-remove-photo-btn"
                  onClick={handleRemovePhoto}
                  disabled={uploading}
                >
                  🗑️ Remove Photo
                </button>
              )}
            </div>
          </section>

          {/* =================================================
              ACCOUNT INFORMATION
          ================================================= */}

          <section className="admin-account-info">

            <div className="admin-account-heading">
              <div>
                <h3>Account Information</h3>
                <p>Your NoteHive administrator account.</p>
              </div>

              <span className="admin-account-status">
                ● Active
              </span>
            </div>

            <div className="admin-info-row">
              <span>👤 Name</span>

              <strong>
                {admin.name || "Administrator"}
              </strong>
            </div>

            <div className="admin-info-row">
              <span>📧 Email</span>

              <strong>
                {admin.email || "Not available"}
              </strong>
            </div>

            <div className="admin-info-row">
              <span>🛡️ Account Type</span>

              <strong>
                {admin.role || "Admin"}
              </strong>
            </div>

            <div className="admin-info-row">
              <span>📅 Joined</span>

              <strong>
                {formatDate(admin.createdAt)}
              </strong>
            </div>

            <div className="admin-info-row">
              <span>🔐 Security</span>

              <strong className="admin-security-text">
                Password Protected
              </strong>
            </div>
          </section>

          {/* =================================================
              PASSWORD SECTION
          ================================================= */}

          <section className="admin-security-section">

            <button
              type="button"
              className="admin-security-toggle"
              onClick={() =>
                setShowPasswordSection(
                  (prev) => !prev
                )
              }
            >
              <div className="admin-security-toggle-left">
                <span className="admin-security-icon">
                  🔐
                </span>

                <div>
                  <strong>Change Password</strong>

                  <small>
                    Keep your admin account secure
                  </small>
                </div>
              </div>

              <span className="admin-security-arrow">
                {showPasswordSection ? "⌃" : "⌄"}
              </span>
            </button>

            {showPasswordSection && (
              <form
                className="admin-password-form"
                onSubmit={handleChangePassword}
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
                  className="admin-change-password-btn"
                  disabled={changingPassword}
                >
                  {changingPassword
                    ? "Changing Password..."
                    : "🔐 Change Password"}
                </button>
              </form>
            )}
          </section>

          {/* =================================================
              LOGOUT
          ================================================= */}

          <button
            type="button"
            className="admin-profile-logout"
            onClick={handleLogout}
          >
            🚪 Logout from Admin Account
          </button>

        </div>
      </div>
    </div>
  );
}

export default AdminProfile;