import React from "react";
import { useNavigate } from "react-router-dom";
import "./Hero.css";

function Hero() {
  const navigate = useNavigate();

  return (
    <section className="hero">
      <div className="hero-content">

        <h1>
          Welcome to <span>NoteHive</span>
        </h1>

        <p>
          Store your notes, ideas and thoughts in one simple place.
          Stay organized with NoteHive.
        </p>

        <div className="hero-buttons">

          {/* Get Started */}
          <button
            className="start-btn"
            onClick={() => navigate("/get-started")}
          >
            Get Started
          </button>

          {/* Learn More */}
          <button
            className="learn-btn"
            onClick={() => navigate("/learn-more")}
          >
            Learn More
          </button>

        </div>

      </div>

      <div className="hero-image">
        🐝
      </div>
    </section>
  );
}

export default Hero;