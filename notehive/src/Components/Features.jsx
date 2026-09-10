import React from "react";
import { useNavigate } from "react-router-dom";
import "./Features.css";

function Features() {
  const navigate = useNavigate();

  const features = [
    {
      icon: "📝",
      title: "My Notes",
      desc: "Create, organize, and manage your rich-text notes with ease and speed.",
      action: () => navigate("/dashboard"),
      isClickable: true,
    },
    {
      icon: "☁️",
      title: "Save Anywhere",
      desc: "Seamlessly sync and access your thoughts across all devices in real-time.",
      action: () => navigate("/save-anywhere"),
      isClickable: true,
    },
    {
      icon: "🔒",
      title: "Secure & Private",
      desc: "Enterprise-grade encryption keeps your sensitive information fully protected.",
      action: () => navigate("/secure-data"),
      isClickable: true,
    },
    {
      icon: "⚡",
      title: "Quick Search",
      desc: "Instantly find notes, keywords, and tags with lightning-fast smart search.",
      action: () => navigate("/quick-search"),
      isClickable: true,
    },
    {
      icon: "🤝",
      title: "Collaborative Sharing",
      desc: "Share notes securely with colleagues and friends in a single click.",
      action: () => navigate("/collaborative-sharing"),
      isClickable: true,
    },
    {
      icon: "🎨",
      title: "Custom Workspace",
      desc: "Personalize your workspace with themes, tags, and flexible layouts.",
      action: () => navigate("/custom-workspace"),
      isClickable: true,
    },
  ];

  return (
    <section id="features" className="features-section">

      {/* ================= HEADER ================= */}
      <div className="features-header">

        <span className="features-badge">
          Key Capabilities
        </span>

        <h2>
          Why Choose NoteHive?
        </h2>

        <p className="features-subtitle">
          Everything you need to capture ideas, boost productivity,
          and keep your thoughts organized.
        </p>

      </div>

      {/* ================= FEATURE CARDS ================= */}
      <div className="feature-container">

        {features.map((item, index) => (

          <div
            className={`feature-card ${
              item.isClickable ? "clickable" : ""
            }`}
            key={index}
            onClick={
              item.isClickable
                ? item.action
                : undefined
            }
          >

            {/* Icon */}
            <div className="icon-wrapper">
              <span className="feature-icon">
                {item.icon}
              </span>
            </div>

            {/* Title */}
            <h3>
              {item.title}
            </h3>

            {/* Description */}
            <p>
              {item.desc}
            </p>

            {/* Explore Link */}
            {item.isClickable && (
              <div className="card-action-link">
                <span>Explore</span>
                <span>&rarr;</span>
              </div>
            )}

          </div>

        ))}

      </div>

    </section>
  );
}

export default Features;