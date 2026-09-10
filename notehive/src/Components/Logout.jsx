import React from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/login");
  };

  return (
    <div className="dashboard">

      <div className="dashboard-header">
        <h2>🐝 NOTEHIVE</h2>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Baaki tumhara dashboard code */}
      
    </div>
  );
}

export default Dashboard;