import React from "react";
import "./LearnMore.css";

function LearnMore() {
  return (
    <div className="learn-more-page">

      <div className="learn-more-content">

        <span className="learn-badge">
          ABOUT NOTEHIVE
        </span>

        <h1>
          Everything You Need to
          <span> Stay Organized</span>
        </h1>

        <p>
          NoteHive is a simple and powerful note management
          platform designed to help you store, organize,
          search and share your ideas easily.
        </p>

        <div className="learn-cards">

          <div className="learn-card">
            <div className="learn-icon">📝</div>
            <h3>Create Notes</h3>
            <p>
              Create and manage your notes in one simple place.
            </p>
          </div>

          <div className="learn-card">
            <div className="learn-icon">🔍</div>
            <h3>Quick Search</h3>
            <p>
              Quickly find notes, keywords and important information.
            </p>
          </div>

          <div className="learn-card">
            <div className="learn-icon">🔒</div>
            <h3>Stay Secure</h3>
            <p>
              Keep your personal notes private and protected.
            </p>
          </div>

          <div className="learn-card">
            <div className="learn-icon">🤝</div>
            <h3>Share & Collaborate</h3>
            <p>
              Share your notes and work together with others.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}

export default LearnMore;