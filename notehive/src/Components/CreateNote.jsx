import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateNote.css";

const SERVER_URL = "http://192.168.1.68:5000";

function CreateNote() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "General",
    priority: "Medium",
    visibility: "private",
    completed: false,
  });

  const [attachments, setAttachments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFiles = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const validFiles = selectedFiles.filter((file) => {
      if (!allowedTypes.includes(file.type)) {
        alert(
          `${file.name} supported file nahi hai. PDF, JPG, PNG, DOC ya DOCX upload karein.`
        );
        return false;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} 10MB se badi hai.`);
        return false;
      }

      return true;
    });

    setAttachments((previous) => [...previous, ...validFiles]);

    event.target.value = "";
  };

  const removeAttachment = (index) => {
    setAttachments((previous) =>
      previous.filter((_, fileIndex) => fileIndex !== index)
    );
  };

  const getFileIcon = (file) => {
    const type = file.type || "";

    if (type.includes("pdf")) return "📕";
    if (type.includes("image")) return "🖼️";
    if (type.includes("word")) return "📘";

    return "📎";
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const userId = localStorage.getItem("notehive_userId");

    if (!userId) {
      alert("Please login first.");
      navigate("/login");
      return;
    }

    if (!formData.title.trim()) {
      setError("Please enter a note title.");
      return;
    }

    if (!formData.content.trim()) {
      setError("Please enter some content in your note.");
      return;
    }

    try {
      setSaving(true);

      const data = new FormData();

      data.append("userId", userId);
      data.append("title", formData.title.trim());
      data.append("content", formData.content);
      data.append("category", formData.category);
      data.append("priority", formData.priority);
      data.append("visibility", formData.visibility);
      data.append("completed", String(formData.completed));

      attachments.forEach((file) => {
        data.append("attachments", file);
      });

      const response = await fetch(`${SERVER_URL}/api/notes`, {
        method: "POST",
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Note create nahi ho paya."
        );
      }

      alert("Note successfully created! 🎉");

      navigate("/my-notes");
    } catch (err) {
      console.error("CREATE NOTE ERROR:", err);

      setError(
        err.message || "Note create nahi ho paya. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="create-note-page">
      <div className="create-note-background"></div>

      <main className="create-note-container">
        {/* HEADER */}
        <div className="create-note-header">
          <div>
            <button
              type="button"
              className="back-button"
              onClick={() => navigate(-1)}
            >
              ← Back
            </button>

            <div className="page-heading">
              <span className="page-heading-icon">📝</span>

              <div>
                <span className="page-label">
                  NOTEHIVE
                </span>

                <h1>Create New Note</h1>

                <p>
                  Capture your thoughts, ideas and important
                  information in one place.
                </p>
              </div>
            </div>
          </div>

          <div className="bee-decoration">🐝</div>
        </div>

        {/* FORM */}
        <form
          className="create-note-form"
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="form-error">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          {/* BASIC INFORMATION */}
          <section className="form-card">
            <div className="form-section-heading">
              <div className="section-icon">✏️</div>

              <div>
                <h2>Note Details</h2>
                <p>Start with the basic information about your note.</p>
              </div>
            </div>

            {/* TITLE */}
            <div className="form-group">
              <label htmlFor="title">
                Note Title
                <span className="required">*</span>
              </label>

              <input
                id="title"
                name="title"
                type="text"
                placeholder="e.g. React Interview Questions"
                value={formData.title}
                onChange={handleChange}
                maxLength={120}
              />

              <div className="input-footer">
                <span>Give your note a clear and meaningful title.</span>
                <span>{formData.title.length}/120</span>
              </div>
            </div>

            {/* CONTENT */}
            <div className="form-group">
              <label htmlFor="content">
                Content
                <span className="required">*</span>
              </label>

              <textarea
                id="content"
                name="content"
                placeholder="Write your note here..."
                value={formData.content}
                onChange={handleChange}
                rows={12}
              />

              <div className="input-footer">
                <span>
                  Write your thoughts, ideas or important information.
                </span>

                <span>
                  {formData.content.length} characters
                </span>
              </div>
            </div>
          </section>

          {/* ORGANIZATION */}
          <section className="form-card">
            <div className="form-section-heading">
              <div className="section-icon">🗂️</div>

              <div>
                <h2>Organization</h2>
                <p>Organize your note so you can find it easily later.</p>
              </div>
            </div>

            <div className="form-grid">
              {/* CATEGORY */}
              <div className="form-group">
                <label htmlFor="category">
                  Category
                </label>

                <div className="select-wrapper">
                  <span className="select-icon">📂</span>

                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option value="General">General</option>
                    <option value="Study">Study</option>
                    <option value="Work">Work</option>
                    <option value="Personal">Personal</option>
                    <option value="Ideas">Ideas</option>
                    <option value="Important">Important</option>
                    <option value="Programming">Programming</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* PRIORITY */}
              <div className="form-group">
                <label htmlFor="priority">
                  Priority
                </label>

                <div className="priority-options">
                  <label
                    className={`priority-option ${
                      formData.priority === "Low"
                        ? "selected low"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value="Low"
                      checked={formData.priority === "Low"}
                      onChange={handleChange}
                    />

                    <span>🟢</span>
                    <strong>Low</strong>
                  </label>

                  <label
                    className={`priority-option ${
                      formData.priority === "Medium"
                        ? "selected medium"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value="Medium"
                      checked={formData.priority === "Medium"}
                      onChange={handleChange}
                    />

                    <span>🟡</span>
                    <strong>Medium</strong>
                  </label>

                  <label
                    className={`priority-option ${
                      formData.priority === "High"
                        ? "selected high"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value="High"
                      checked={formData.priority === "High"}
                      onChange={handleChange}
                    />

                    <span>🔴</span>
                    <strong>High</strong>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* VISIBILITY */}
          <section className="form-card">
            <div className="form-section-heading">
              <div className="section-icon">🔐</div>

              <div>
                <h2>Privacy & Status</h2>
                <p>Control who can access your note.</p>
              </div>
            </div>

            <div className="visibility-options">
              <label
                className={`visibility-option ${
                  formData.visibility === "private"
                    ? "selected"
                    : ""
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={formData.visibility === "private"}
                  onChange={handleChange}
                />

                <div className="visibility-icon">
                  🔒
                </div>

                <div>
                  <strong>Private</strong>
                  <span>
                    Only you can see this note.
                  </span>
                </div>

                <div className="radio-check">
                  {formData.visibility === "private" ? "✓" : ""}
                </div>
              </label>

              <label
                className={`visibility-option ${
                  formData.visibility === "public"
                    ? "selected"
                    : ""
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={formData.visibility === "public"}
                  onChange={handleChange}
                />

                <div className="visibility-icon">
                  🌎
                </div>

                <div>
                  <strong>Public</strong>
                  <span>
                    Your note can be shared with others.
                  </span>
                </div>

                <div className="radio-check">
                  {formData.visibility === "public" ? "✓" : ""}
                </div>
              </label>
            </div>

            <label className="completed-toggle">
              <div className="toggle-content">
                <span className="toggle-icon">✓</span>

                <div>
                  <strong>Mark as completed</strong>
                  <span>
                    Mark this note as completed.
                  </span>
                </div>
              </div>

              <input
                type="checkbox"
                name="completed"
                checked={formData.completed}
                onChange={handleChange}
              />

              <span className="toggle-slider"></span>
            </label>
          </section>

          {/* ATTACHMENTS */}
          <section className="form-card">
            <div className="form-section-heading">
              <div className="section-icon">📎</div>

              <div>
                <h2>Attachments</h2>
                <p>
                  Add documents or images related to your note.
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFiles}
              hidden
            />

            <button
              type="button"
              className="upload-area"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="upload-icon">☁️</div>

              <strong>Click to upload files</strong>

              <span>
                PDF, JPG, PNG, DOC or DOCX
              </span>

              <small>
                Maximum file size: 10MB per file
              </small>
            </button>

            {attachments.length > 0 && (
              <div className="attachment-list">
                <div className="attachment-heading">
                  <strong>
                    Selected Files ({attachments.length})
                  </strong>
                </div>

                {attachments.map((file, index) => (
                  <div
                    className="attachment-item"
                    key={`${file.name}-${index}`}
                  >
                    <div className="attachment-file-info">
                      <span className="attachment-file-icon">
                        {getFileIcon(file)}
                      </span>

                      <div>
                        <strong>{file.name}</strong>
                        <span>
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="remove-file-button"
                      onClick={() =>
                        removeAttachment(index)
                      }
                      title="Remove file"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ACTIONS */}
          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate(-1)}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-note-button"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="button-spinner"></span>
                  Saving...
                </>
              ) : (
                <>
                  💾 Save Note
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default CreateNote;