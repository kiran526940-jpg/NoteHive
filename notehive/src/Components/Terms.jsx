import React from "react";
import { Link } from "react-router-dom";
import "./Terms.css";

const Terms = () => {
  return (
    <div className="terms-page">
      <div className="terms-card">
        
        {/* Header */}
        <div className="terms-header">
          <span className="terms-badge">User Agreement</span>
          <h1>Terms & Conditions</h1>
          <p>Please read these terms carefully before using NoteHive to ensure a great experience for everyone.</p>
        </div>

        {/* Modern Grid Cards */}
        <div className="terms-grid">
          <div className="terms-box">
            <div className="terms-icon">📜</div>
            <h3>1. Acceptance of Terms</h3>
            <p>By accessing or using NoteHive, you agree to be bound by these Terms and our Privacy Policy.</p>
          </div>

          <div className="terms-box">
            <div className="terms-icon">👤</div>
            <h3>2. User Accounts</h3>
            <p>You are responsible for maintaining the confidentiality of your login credentials and account security.</p>
          </div>

          <div className="terms-box">
            <div className="terms-icon">📝</div>
            <h3>3. Content Ownership</h3>
            <p>You retain full ownership of all notes, data, and information you create within your workspace.</p>
          </div>

          <div className="terms-box">
            <div className="terms-icon">⚖️</div>
            <h3>4. Acceptable Use</h3>
            <p>You agree not to misuse our platform, breach security, or violate any applicable laws while using the app.</p>
          </div>
        </div>

        {/* Support Footer Box */}
        <div className="terms-footer-box">
          <div className="terms-footer-text">
            <h4>Have questions about our terms?</h4>
            <p>Feel free to reach out and our team will gladly assist you.</p>
          </div>
          <Link to="/contacts" className="terms-contact-btn">Get in Touch</Link>
        </div>

        {/* Back Home */}
        <div className="terms-back">
          <Link to="/">&larr; Back to Home</Link>
        </div>

      </div>
    </div>
  );
};

export default Terms;