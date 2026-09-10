import React from "react";
import "./SaveAnywhere.css";
const API_URL = "http://192.168.1.68:5000/api";
function SaveAnywhere() {
  return (
    <div className="save-page">

      {/* Header */}
      <div className="save-header">
        <h1>Save Anywhere ☁️</h1>
        <p>
          Access and manage your notes from anywhere, anytime.
        </p>
      </div>

      {/* Storage Card */}
      <div className="storage-card">

        <div className="storage-icon">
          ☁️
        </div>

        <div className="storage-content">
          <h2>Your Notes are Safe</h2>

          <p>
            Your notes can be stored securely and accessed
            whenever you need them.
          </p>

          <div className="storage-status">
            <span>✓</span>
            Notes are securely saved
          </div>
        </div>

      </div>

      {/* Features */}
      <div className="save-features">

        <div className="save-feature-card">
          <div className="save-feature-icon">📱</div>
          <h3>Access Anywhere</h3>
          <p>
            Access your notes from your computer,
            laptop or mobile device.
          </p>
        </div>

        <div className="save-feature-card">
          <div className="save-feature-icon">🔄</div>
          <h3>Sync Notes</h3>
          <p>
            Keep your notes synchronized across
            all your devices.
          </p>
        </div>

        <div className="save-feature-card">
          <div className="save-feature-icon">🔐</div>
          <h3>Secure Storage</h3>
          <p>
            Your notes are protected and kept
            private.
          </p>
        </div>

      </div>

      {/* Recent Saved Notes */}
      <div className="recent-section">

        <div className="recent-heading">
          <h2>Recently Saved</h2>

          <button className="view-all-btn">
            View All
          </button>
        </div>

        <div className="saved-notes">

          <div className="saved-note">
            <span>📝</span>

            <div>
              <h3>React Components</h3>
              <p>Saved recently</p>
            </div>
          </div>

          <div className="saved-note">
            <span>📝</span>

            <div>
              <h3>JavaScript Notes</h3>
              <p>Saved recently</p>
            </div>
          </div>

          <div className="saved-note">
            <span>📝</span>

            <div>
              <h3>Exam Preparation</h3>
              <p>Saved recently</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default SaveAnywhere;