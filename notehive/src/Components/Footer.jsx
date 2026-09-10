
import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const SERVER_URL = "http://192.168.1.68:5000";
function Footer() {
  return (
    <footer className="footer">

      <div className="footer-logo">
        🐝 NoteHive
      </div>

      <p>
        Organize your notes, ideas and thoughts in one place.
      </p>

      <div className="footer-links">

        <Link to="/privacy-policy">
          PrivacyPolicy
        </Link>

        <Link to="/terms">
          Terms & Conditions
        </Link>

      </div>

      <div className="copyright">
        © 2026 NoteHive. All rights reserved.
      </div>

    </footer>
  );
}

export default Footer;
