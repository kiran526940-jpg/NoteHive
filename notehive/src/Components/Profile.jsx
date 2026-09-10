import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  API_URL,
  SERVER_URL,
} from "../config/api";

import "./Profile.css";

// ============================================================
// NOTEHIVE - PROFILE
// ============================================================

const Profile = () => {
  const navigate = useNavigate();

  const fileInputRef =
    useRef(null);

  // ==========================================================
  // USER ID
  // ==========================================================

  const userId =
    localStorage.getItem(
      "notehive_userId"
    );

  // ==========================================================
  // STATES
  // ==========================================================

  const [user, setUser] =
    useState(null);

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [bio, setBio] =
    useState("");

  const [profileImage, setProfileImage] =
    useState("");

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [previewUrl, setPreviewUrl] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [photoUploading, setPhotoUploading] =
    useState(false);

  const [removingPhoto, setRemovingPhoto] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ==========================================================
  // IMAGE URL
  // ==========================================================

  const getImageUrl = (image) => {
    if (!image) {
      return "";
    }

    const value =
      String(image).trim();

    if (!value) {
      return "";
    }

    // Blob preview
    if (
      value.startsWith("blob:")
    ) {
      return value;
    }

    // Base64
    if (
      value.startsWith("data:image")
    ) {
      return value;
    }

    // Absolute URL
    if (
      value.startsWith("http://") ||
      value.startsWith("https://")
    ) {
      return value;
    }

    // Server relative path
    if (
      value.startsWith("/uploads/")
    ) {
      return `${SERVER_URL}${value}`;
    }

    // uploads/filename
    if (
      value.startsWith("uploads/")
    ) {
      return `${SERVER_URL}/${value}`;
    }

    // filename only
    return `${SERVER_URL}/uploads/${value}`;
  };

  // ==========================================================
  // SAVE USER LOCALLY
  // ==========================================================

  const saveUserLocally = (
    updatedUser
  ) => {
    if (!updatedUser) {
      return;
    }

    const normalizedUser = {
      ...updatedUser,

      id:
        updatedUser.id ||
        updatedUser._id ||
        userId,

      _id:
        updatedUser._id ||
        updatedUser.id ||
        userId,

      name:
        updatedUser.name ||
        "",

      email:
        updatedUser.email ||
        "",

      bio:
        updatedUser.bio ||
        "",

      profileImage:
        updatedUser.profileImage ||
        "",
    };

    localStorage.setItem(
      "notehive_user",
      JSON.stringify(
        normalizedUser
      )
    );

    if (
      normalizedUser.name
    ) {
      localStorage.setItem(
        "notehive_userName",
        normalizedUser.name
      );

      localStorage.setItem(
        "userName",
        normalizedUser.name
      );

      localStorage.setItem(
        "name",
        normalizedUser.name
      );
    }

    if (
      normalizedUser.email
    ) {
      localStorage.setItem(
        "notehive_userEmail",
        normalizedUser.email
      );

      localStorage.setItem(
        "email",
        normalizedUser.email
      );
    }

    if (
      normalizedUser.profileImage
    ) {
      localStorage.setItem(
        "notehive_profileImage",
        normalizedUser.profileImage
      );
    } else {
      localStorage.removeItem(
        "notehive_profileImage"
      );
    }
  };

  // ==========================================================
  // LOAD PROFILE
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    const loadProfile =
      async () => {
        setLoading(true);
        setError("");

        try {
          // ====================================================
          // LOCAL USER FIRST
          // ====================================================

          const localUserRaw =
            localStorage.getItem(
              "notehive_user"
            );

          let localUser = null;

          if (localUserRaw) {
            try {
              localUser =
                JSON.parse(
                  localUserRaw
                );
            } catch {
              localUser = null;
            }
          }

          if (mounted && localUser) {
            setUser(localUser);

            setName(
              localUser.name ||
                ""
            );

            setEmail(
              localUser.email ||
                ""
            );

            setBio(
              localUser.bio ||
                ""
            );

            setProfileImage(
              localUser.profileImage ||
                ""
            );
          }

          // ====================================================
          // USER ID CHECK
          // ====================================================

          if (!userId) {
            if (mounted) {
              setError(
                "User session not found. Please login again."
              );
              setLoading(false);
            }

            return;
          }

          // ====================================================
          // GET PROFILE FROM SERVER
          // ====================================================

          const response =
            await fetch(
              `${API_URL}/users/${userId}`
            );

          const data =
            await response
              .json()
              .catch(
                () => ({})
              );

          if (!response.ok) {
            throw new Error(
              data.message ||
                "Failed to fetch profile."
            );
          }

          const serverUser =
            data.user ||
            data.data ||
            data;

          if (
            mounted &&
            serverUser
          ) {
            setUser(
              serverUser
            );

            setName(
              serverUser.name ||
                ""
            );

            setEmail(
              serverUser.email ||
                ""
            );

            setBio(
              serverUser.bio ||
                ""
            );

            setProfileImage(
              serverUser.profileImage ||
                ""
            );

            saveUserLocally(
              serverUser
            );
          }
        } catch (err) {
          console.error(
            "Profile load error:",
            err
          );

          // ====================================================
          // LOCAL FALLBACK
          // ====================================================

          const localUserRaw =
            localStorage.getItem(
              "notehive_user"
            );

          if (
            mounted &&
            localUserRaw
          ) {
            try {
              const localUser =
                JSON.parse(
                  localUserRaw
                );

              setUser(
                localUser
              );

              setName(
                localUser.name ||
                  ""
              );

              setEmail(
                localUser.email ||
                  ""
              );

              setBio(
                localUser.bio ||
                  ""
              );

              setProfileImage(
                localUser.profileImage ||
                  ""
              );
            } catch {
              setError(
                "Unable to load profile."
              );
            }
          } else if (mounted) {
            setError(
              err.message ||
                "Unable to load profile."
            );
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [userId]);

  // ==========================================================
  // CLEAN BLOB PREVIEW
  // ==========================================================

  useEffect(() => {
    return () => {
      if (
        previewUrl &&
        previewUrl.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          previewUrl
        );
      }
    };
  }, [previewUrl]);

  // ==========================================================
  // CHOOSE PHOTO
  // ==========================================================

  const handleImageChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setSuccess("");

    // ========================================================
    // IMAGE TYPE
    // ========================================================

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      setError(
        "Only JPG, JPEG, PNG and WEBP images are allowed."
      );

      event.target.value = "";
      return;
    }

    // ========================================================
    // SIZE - 5 MB
    // ========================================================

    const maxSize =
      5 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        "Profile photo must be smaller than 5 MB."
      );

      event.target.value = "";
      return;
    }

    // ========================================================
    // OLD PREVIEW CLEANUP
    // ========================================================

    if (
      previewUrl &&
      previewUrl.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        previewUrl
      );
    }

    // ========================================================
    // NEW PREVIEW
    // ========================================================

    const objectUrl =
      URL.createObjectURL(
        file
      );

    setSelectedFile(file);
    setPreviewUrl(
      objectUrl
    );
  };

  // ==========================================================
  // UPLOAD PHOTO
  // ==========================================================

  const uploadProfilePhoto =
    async () => {
      if (!selectedFile) {
        return;
      }

      if (!userId) {
        setError(
          "User session not found. Please login again."
        );
        return;
      }

      setPhotoUploading(
        true
      );

      setError("");
      setSuccess("");

      try {
        const formData =
          new FormData();

        formData.append(
          "profileImage",
          selectedFile
        );

        const response =
          await fetch(
            `${API_URL}/users/${userId}/photo`,
            {
              method: "PUT",
              body: formData,
            }
          );

        const data =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Profile photo upload failed."
          );
        }

        const updatedUser =
          data.user ||
          data.data ||
          user;

        // ====================================================
        // UPDATE STATE
        // ====================================================

        setUser(
          updatedUser
        );

        setProfileImage(
          updatedUser.profileImage ||
            ""
        );

        setSelectedFile(
          null
        );

        // ====================================================
        // CLEAN PREVIEW
        // ====================================================

        if (
          previewUrl &&
          previewUrl.startsWith(
            "blob:"
          )
        ) {
          URL.revokeObjectURL(
            previewUrl
          );
        }

        setPreviewUrl("");

        // ====================================================
        // LOCAL STORAGE
        // ====================================================

        saveUserLocally(
          updatedUser
        );

        setSuccess(
          "Profile photo updated successfully ✅"
        );

        // Reset file input
        if (
          fileInputRef.current
        ) {
          fileInputRef.current.value =
            "";
        }
      } catch (err) {
        console.error(
          "Profile photo upload error:",
          err
        );

        setError(
          err.message ||
            "Profile photo upload failed."
        );
      } finally {
        setPhotoUploading(
          false
        );
      }
    };

  // ==========================================================
  // REMOVE PHOTO
  // ==========================================================

  const handleRemovePhoto =
    async () => {
      if (!userId) {
        setError(
          "User session not found. Please login again."
        );
        return;
      }

      if (
        !profileImage &&
        !selectedFile
      ) {
        return;
      }

      setRemovingPhoto(
        true
      );

      setError("");
      setSuccess("");

      try {
        // ====================================================
        // IF NEW FILE IS ONLY PREVIEW
        // ====================================================

        if (
          selectedFile &&
          !profileImage
        ) {
          if (
            previewUrl &&
            previewUrl.startsWith(
              "blob:"
            )
          ) {
            URL.revokeObjectURL(
              previewUrl
            );
          }

          setSelectedFile(
            null
          );

          setPreviewUrl("");

          if (
            fileInputRef.current
          ) {
            fileInputRef.current.value =
              "";
          }

          setSuccess(
            "Selected photo removed."
          );

          return;
        }

        // ====================================================
        // DELETE SERVER PHOTO
        // ====================================================

        const response =
          await fetch(
            `${API_URL}/users/${userId}/photo`,
            {
              method: "DELETE",
            }
          );

        const data =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to remove profile photo."
          );
        }

        const updatedUser =
          data.user ||
          data.data ||
          {
            ...user,
            profileImage: "",
          };

        setUser(
          updatedUser
        );

        setProfileImage(
          ""
        );

        setSelectedFile(
          null
        );

        if (
          previewUrl &&
          previewUrl.startsWith(
            "blob:"
          )
        ) {
          URL.revokeObjectURL(
            previewUrl
          );
        }

        setPreviewUrl("");

        saveUserLocally(
          updatedUser
        );

        if (
          fileInputRef.current
        ) {
          fileInputRef.current.value =
            "";
        }

        setSuccess(
          "Profile photo removed successfully ✅"
        );
      } catch (err) {
        console.error(
          "Remove profile photo error:",
          err
        );

        setError(
          err.message ||
            "Failed to remove profile photo."
        );
      } finally {
        setRemovingPhoto(
          false
        );
      }
    };

  // ==========================================================
  // SAVE PROFILE
  // ==========================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    // ========================================================
    // VALIDATION
    // ========================================================

    const cleanName =
      name.trim();

    const cleanBio =
      bio.trim();

    if (!cleanName) {
      setError(
        "Name is required."
      );
      return;
    }

    if (!userId) {
      setError(
        "User session not found. Please login again."
      );
      return;
    }

    setSaving(true);

    try {
      // ======================================================
      // UPDATE NAME + BIO
      // ======================================================

      const response =
        await fetch(
          `${API_URL}/users/${userId}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name: cleanName,
              bio: cleanBio,
            }),
          }
        );

      const data =
        await response
          .json()
          .catch(
            () => ({})
          );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Profile update failed."
        );
      }

      const updatedUser =
        data.user ||
        data.data ||
        {
          ...user,
          name: cleanName,
          bio: cleanBio,
        };

      // ======================================================
      // UPDATE STATE
      // ======================================================

      setUser(
        updatedUser
      );

      setName(
        updatedUser.name ||
          cleanName
      );

      setEmail(
        updatedUser.email ||
          email
      );

      setBio(
        updatedUser.bio ||
          cleanBio
      );

      setProfileImage(
        updatedUser.profileImage ||
          profileImage ||
          ""
      );

      // ======================================================
      // SAVE LOCAL
      // ======================================================

      saveUserLocally(
        updatedUser
      );

      // ======================================================
      // PHOTO
      // ======================================================

      if (selectedFile) {
        await uploadProfilePhoto();
      } else {
        setSuccess(
          "Profile updated successfully ✅"
        );
      }
    } catch (err) {
      console.error(
        "Profile update error:",
        err
      );

      setError(
        err.message ||
          "Profile update failed."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // DISPLAY IMAGE
  // ==========================================================

  const displayedImage =
    previewUrl ||
    getImageUrl(
      profileImage
    );

  // ==========================================================
  // INITIALS
  // ==========================================================

  const getInitials = () => {
    const value =
      name ||
      user?.name ||
      "User";

    const words =
      value
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (
      words.length >= 2
    ) {
      return (
        words[0][0] +
        words[1][0]
      ).toUpperCase();
    }

    return value
      .slice(0, 2)
      .toUpperCase();
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="profile-spinner"></div>

          <p>
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="profile-page">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="profile-header">

        <button
          type="button"
          className="profile-back-btn"
          onClick={() =>
            navigate("/dashboard")
          }
          aria-label="Back to dashboard"
        >
          ←
        </button>

        <div>
          <h1>
            Profile
          </h1>

          <p>
            Manage your NoteHive profile
          </p>
        </div>

      </div>

      {/* ====================================================
          ALERTS
      ==================================================== */}

      {error && (
        <div className="profile-alert profile-error">
          {error}
        </div>
      )}

      {success && (
        <div className="profile-alert profile-success">
          {success}
        </div>
      )}

      {/* ====================================================
          PROFILE CARD
      ==================================================== */}

      <div className="profile-card">

        {/* ==================================================
            PHOTO
        ================================================== */}

        <div className="profile-photo-section">

          <div className="profile-avatar">

            {displayedImage ? (
              <img
                src={displayedImage}
                alt="Profile"
                onError={(event) => {
                  event.currentTarget.style.display =
                    "none";
                }}
              />
            ) : (
              <span>
                {getInitials()}
              </span>
            )}

          </div>

          <div className="profile-photo-info">

            <h2>
              Profile Photo
            </h2>

            <p>
              JPG, JPEG, PNG or WEBP
              <br />
              Maximum size: 5 MB
            </p>

            <div className="profile-photo-actions">

              <button
                type="button"
                className="profile-upload-btn"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                disabled={
                  photoUploading ||
                  removingPhoto ||
                  saving
                }
              >
                {photoUploading
                  ? "Uploading..."
                  : "Choose Photo"}
              </button>

              {(profileImage ||
                selectedFile) && (
                <button
                  type="button"
                  className="profile-remove-btn"
                  onClick={
                    handleRemovePhoto
                  }
                  disabled={
                    photoUploading ||
                    removingPhoto ||
                    saving
                  }
                >
                  {removingPhoto
                    ? "Removing..."
                    : "Remove"}
                </button>
              )}

            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={
                handleImageChange
              }
              hidden
            />

            {/* ==============================================
                SAVE SELECTED PHOTO
            ============================================== */}

            {selectedFile && (
              <button
                type="button"
                className="profile-save-photo-btn"
                onClick={
                  uploadProfilePhoto
                }
                disabled={
                  photoUploading ||
                  removingPhoto
                }
              >
                {photoUploading
                  ? "Saving Photo..."
                  : "Save Photo"}
              </button>
            )}

          </div>
        </div>

        {/* ==================================================
            FORM
        ================================================== */}

        <form
          className="profile-form"
          onSubmit={
            handleSubmit
          }
        >

          {/* =================================================
              NAME
          ================================================= */}

          <div className="profile-field">

            <label htmlFor="profile-name">
              Full Name
            </label>

            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
              placeholder="Enter your name"
              maxLength={100}
              disabled={saving}
            />

          </div>

          {/* =================================================
              EMAIL
          ================================================= */}

          <div className="profile-field">

            <label htmlFor="profile-email">
              Email
            </label>

            <input
              id="profile-email"
              type="email"
              value={email}
              disabled
              readOnly
            />

            <small>
              Email is linked to your
              account and cannot be
              changed here.
            </small>

          </div>

          {/* =================================================
              BIO
          ================================================= */}

          <div className="profile-field">

            <label htmlFor="profile-bio">
              Bio
            </label>

            <textarea
              id="profile-bio"
              value={bio}
              onChange={(event) =>
                setBio(
                  event.target.value
                )
              }
              placeholder="Tell something about yourself..."
              rows={5}
              maxLength={500}
              disabled={saving}
            />

            <small>
              {bio.length}/500
            </small>

          </div>

          {/* =================================================
              ACCOUNT INFO
          ================================================= */}

          <div className="profile-account-info">

            <div>
              <span>
                Account ID
              </span>

              <strong>
                {userId || "—"}
              </strong>
            </div>

            <div>
              <span>
                Account Type
              </span>

              <strong>
                {user?.role ===
                "admin"
                  ? "Admin"
                  : "User"}
              </strong>
            </div>

            <div>
              <span>
                Status
              </span>

              <strong>
                {user?.status ||
                  "approved"}
              </strong>
            </div>

          </div>

          {/* =================================================
              BUTTONS
          ================================================= */}

          <div className="profile-form-actions">

            <button
              type="button"
              className="profile-cancel-btn"
              onClick={() =>
                navigate("/dashboard")
              }
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="profile-save-btn"
              disabled={
                saving ||
                photoUploading
              }
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default Profile;