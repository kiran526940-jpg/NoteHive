import React from "react";
import { Link } from "react-router-dom";
import "./Privacypolicy.css";

const PrivacyPolicy = () => {
  return (
    <div className="policy-page">
      <div className="policy-card">
        
        {/* Header */}
        <div className="policy-header">
          <span className="policy-badge">Security & Trust</span>
          <h1>Privacy Policy</h1>
          <p>We respect your data. Here is a clear and simple overview of how NoteHive protects your privacy.</p>
        </div>

        {/* Modern Grid Cards */}
        <div className="policy-grid">
          <div className="policy-box">
            <div className="policy-icon">🔒</div>
            <h3>1. Data Security</h3>
            <p>Your personal information and notes are protected with industry-standard encryption protocols.</p>
          </div>

          <div className="policy-box">
            <div className="policy-icon">🚫</div>
            <h3>2. Zero Third-Party Sharing</h3>
            <p>We strictly never sell, rent, or trade your personal data or notes to external advertisers.</p>
          </div>

          <div className="policy-box">
            <div className="policy-icon">☁️</div>
            <h3>3. Seamless Sync</h3>
            <p>Your notes are securely stored to let you access your workspace smoothly across all devices.</p>
          </div>

          <div className="policy-box">
            <div className="policy-icon">⚙️</div>
            <h3>4. Full Control</h3>
            <p>You maintain total ownership. Update, modify, or permanently delete your data anytime.</p>
          </div>
        </div>

        {/* Support Footer Box */}
        <div className="policy-footer-box">
          <div className="policy-footer-text">
            <h4>Have questions regarding your privacy?</h4>
            <p>Our support team is always available to help you out.</p>
          </div>
          <Link to="/contacts" className="policy-contact-btn">Get in Touch</Link>
        </div>

        {/* Back Home */}
        <div className="policy-back">
          <Link to="/">&larr; Back to Home</Link>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicy;