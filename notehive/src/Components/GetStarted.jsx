import React from "react";
import { useNavigate } from "react-router-dom";
import "./GetStarted.css";

function GetStarted() {
  const navigate = useNavigate();

  return (
    <div className="get-started-page">

      <div className="get-started-box">

        <div className="get-started-icon">
          🐝
        </div>

        <h1>
          Get Started with <span>NoteHive</span>
        </h1>

        <p>
          Organize your notes, ideas and thoughts in one simple
          and secure place.
        </p>

        <div className="steps">

          <div className="step-card">
            <span>📝</span>
            <h3>Create Notes</h3>
            <p>
              Create and save your important notes easily.
            </p>
          </div>

          <div className="step-card">
            <span>📂</span>
            <h3>Organize</h3>
            <p>
              Keep all your notes organized and manageable.
            </p>
          </div>

          <div className="step-card">
            <span>🔍</span>
            <h3>Search</h3>
            <p>
              Find your notes quickly whenever you need them.
            </p>
          </div>

          <div className="step-card">
            <span>🤝</span>
            <h3>Share</h3>
            <p>
              Share your notes with others securely.
            </p>
          </div>

        </div>

        <button
          className="create-account-btn"
          onClick={() => navigate("/signup")}
        >
          Create Your Account
        </button>

      </div>

    </div>
  );
}

export default GetStarted;