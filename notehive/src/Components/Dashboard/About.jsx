import React from "react";
import "./About.css";

function About() {
  return (
    <div className="about-page">

      {/* ================= HERO ================= */}

      <section className="about-hero">

        <div className="about-hero-content">

          <div className="about-logo">
            🐝
          </div>

          <h1>
            About <span>NoteHive</span>
          </h1>

          <p>
            Organize your thoughts, capture your ideas,
            and manage your notes easily — all in one place.
          </p>

        </div>

      </section>


      {/* ================= PURPOSE ================= */}

      <section className="about-purpose">

        <div className="section-heading">

          <span className="small-title">
            OUR PURPOSE
          </span>

          <h2>
            Why was NoteHive created?
          </h2>

          <p>
            NoteHive is designed to make digital note-taking
            simple, organized, and convenient. It helps users
            keep their important thoughts, ideas, and information
            in one place.
          </p>

        </div>


        <div className="purpose-content">

          <div className="purpose-card">
            <span>📝</span>

            <h3>
              Stay Organized
            </h3>

            <p>
              Keep all your notes organized and easy to manage
              from one simple dashboard.
            </p>

          </div>


          <div className="purpose-card">
            <span>💡</span>

            <h3>
              Capture Ideas
            </h3>

            <p>
              Save your important ideas and thoughts whenever
              inspiration comes to you.
            </p>

          </div>


          <div className="purpose-card">
            <span>⚡</span>

            <h3>
              Work Smarter
            </h3>

            <p>
              Find and manage your information quickly so you
              can focus on what really matters.
            </p>

          </div>

        </div>

      </section>


      {/* ================= FEATURES ================= */}

      <section className="about-features">

        <div className="section-heading">

          <span className="small-title">
            WHAT WE OFFER
          </span>

          <h2>
            Everything you need for better notes
          </h2>

          <p>
            NoteHive provides simple and useful tools to make
            your note-taking experience easier.
          </p>

        </div>


        <div className="feature-grid">

          {/* Create Notes */}

          <div className="feature-card">

            <div className="feature-icon">
              📝
            </div>

            <h3>
              Create Notes
            </h3>

            <p>
              Create and manage your notes easily in one place.
            </p>

          </div>


          {/* Pin Notes */}

          <div className="feature-card">

            <div className="feature-icon">
              📌
            </div>

            <h3>
              Pin Notes
            </h3>

            <p>
              Keep your most important notes at the top for
              quick access.
            </p>

          </div>


          {/* Favorites */}

          <div className="feature-card">

            <div className="feature-icon">
              ⭐
            </div>

            <h3>
              Favorites
            </h3>

            <p>
              Mark useful notes as favorites and access them
              whenever you need them.
            </p>

          </div>


          {/* Search */}

          <div className="feature-card">

            <div className="feature-icon">
              🔍
            </div>

            <h3>
              Quick Search
            </h3>

            <p>
              Find your notes quickly using the search feature.
            </p>

          </div>


          {/* Security */}

          <div className="feature-card">

            <div className="feature-icon">
              🔐
            </div>

            <h3>
              Secure Data
            </h3>

            <p>
              Keep your personal notes protected and organized.
            </p>

          </div>


          {/* Save Anywhere */}

          <div className="feature-card">

            <div className="feature-icon">
              ☁️
            </div>

            <h3>
              Save Anywhere
            </h3>

            <p>
              Access your notes whenever and wherever you need them.
            </p>

          </div>

        </div>

      </section>


      {/* ================= WHY NOTEHIVE ================= */}

      <section className="why-notehive">

        <div className="why-content">

          <span className="small-title">
            WHY NOTEHIVE?
          </span>

          <h2>
            Simple. Organized. Convenient.
          </h2>

          <p>
            NoteHive combines simplicity and organization in one
            easy-to-use platform. Whether you are a student,
            professional, or someone who loves writing down ideas,
            NoteHive helps you keep everything in one place.
          </p>


          <div className="why-points">

            <div>
              <span>✓</span>
              Easy to use
            </div>

            <div>
              <span>✓</span>
              Clean and organized
            </div>

            <div>
              <span>✓</span>
              Quick access to notes
            </div>

            <div>
              <span>✓</span>
              Designed for everyone
            </div>

          </div>

        </div>


        <div className="why-visual">

          <div className="hive-card">

            <div className="hive-icon">
              🐝
            </div>

            <h3>
              NOTEHIVE
            </h3>

            <p>
              Your thoughts. Your ideas. Your notes.
            </p>

          </div>

        </div>

      </section>


      {/* ================= VISION ================= */}

      <section className="our-vision">

        <div className="vision-content">

          <div className="vision-icon">
            🚀
          </div>

          <span className="small-title">
            OUR VISION
          </span>

          <h2>
            Making note-taking easier for everyone.
          </h2>

          <p>
            Our vision is to create a simple, reliable, and
            user-friendly digital space where people can capture,
            organize, and manage their ideas without unnecessary
            complexity.
          </p>

        </div>

      </section>

    </div>
  );
}

export default About;