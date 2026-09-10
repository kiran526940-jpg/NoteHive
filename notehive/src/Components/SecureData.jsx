import React from "react";
import "./SecureData.css";

function SecureData() {
  return (
    <div className="secure-page">

      {/* Header */}
      <div className="secure-header">

        <div>
          <span className="secure-label">
            NOTEHIVE SECURITY
          </span>

          <h1>
            Your Notes. <span>Your Privacy.</span>
          </h1>

          <p>
            NoteHive keeps your personal notes protected with
            modern security features and privacy controls.
          </p>
        </div>

        <div className="security-shield">
          🔒
        </div>

      </div>

      {/* Security Status */}
      <div className="security-status">

        <div className="status-icon">
          ✓
        </div>

        <div>
          <h2>Your Workspace is Secure</h2>
          <p>
            Your account security is currently active.
          </p>
        </div>

        <span className="secure-badge">
          Protected
        </span>

      </div>

      {/* Security Features */}
      <div className="security-grid">

        <div className="security-card">
          <div className="security-card-icon">
            🔐
          </div>

          <h3>Data Encryption</h3>

          <p>
            Your notes and personal information are protected
            using secure encryption techniques.
          </p>

          <span className="security-link">
            Protected ✓
          </span>
        </div>

        <div className="security-card">
          <div className="security-card-icon">
            🛡️
          </div>

          <h3>Private Notes</h3>

          <p>
            Your notes remain private and are only accessible
            through your authorized account.
          </p>

          <span className="security-link">
            Private ✓
          </span>
        </div>

        <div className="security-card">
          <div className="security-card-icon">
            👤
          </div>

          <h3>Secure Access</h3>

          <p>
            Only authenticated users can access their
            personal NoteHive workspace.
          </p>

          <span className="security-link">
            Active ✓
          </span>
        </div>

        <div className="security-card">
          <div className="security-card-icon">
            🔑
          </div>

          <h3>Password Protection</h3>

          <p>
            Your account is protected with secure login
            credentials and authentication.
          </p>

          <span className="security-link">
            Enabled ✓
          </span>
        </div>

      </div>

      {/* Privacy Section */}
      <div className="privacy-section">

        <div className="privacy-icon">
          🛡️
        </div>

        <div>
          <h2>Your Privacy Matters</h2>

          <p>
            NoteHive is designed to give you control over your
            personal information. Your notes are yours, and your
            workspace is built with privacy in mind.
          </p>
        </div>

      </div>

    </div>
  );
}

export default SecureData;