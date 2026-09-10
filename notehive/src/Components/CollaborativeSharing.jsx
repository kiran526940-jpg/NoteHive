import React, { useState } from "react";
import "./CollaborativeSharing.css";

function CollaborativeSharing() {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("Can Edit");
  const [sharedUsers, setSharedUsers] = useState([
    {
      id: 1,
      name: "Kiran Thakur",
      email: "kiran@example.com",
      permission: "Owner",
      avatar: "KT",
    },
  ]);

  const handleShare = () => {
    if (!email.trim()) {
      alert("Please enter an email address.");
      return;
    }

    const alreadyShared = sharedUsers.some(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );

    if (alreadyShared) {
      alert("This user is already added.");
      return;
    }

    const newUser = {
      id: Date.now(),
      name: email.split("@")[0],
      email: email,
      permission: permission,
      avatar: email.substring(0, 2).toUpperCase(),
    };

    setSharedUsers([...sharedUsers, newUser]);
    setEmail("");
  };

  const removeUser = (id) => {
    setSharedUsers(
      sharedUsers.filter((user) => user.id !== id)
    );
  };

  return (
    <div className="sharing-page">

      {/* Page Header */}
      <div className="sharing-header">
        <div>
          <span className="sharing-label">
            NOTEHIVE COLLABORATION
          </span>

          <h1>
            Share. <span>Collaborate.</span> Create.
          </h1>

          <p>
            Share your notes with friends, classmates and teammates
            and work together in real time.
          </p>
        </div>

        <div className="collab-icon">
          🤝
        </div>
      </div>

      <div className="sharing-container">

        {/* Share Card */}
        <div className="share-card">

          <div className="card-heading">
            <div className="heading-icon">
              📤
            </div>

            <div>
              <h2>Share Your Note</h2>
              <p>
                Invite someone to collaborate on your note.
              </p>
            </div>
          </div>

          <label>Email Address</label>

          <div className="email-box">
            <span>✉️</span>

            <input
              type="email"
              placeholder="Enter person's email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <label>Permission</label>

          <div className="permission-box">

            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value)}
            >
              <option>Can Edit</option>
              <option>Can View</option>
            </select>

            <button onClick={handleShare}>
              Share Note →
            </button>

          </div>

        </div>

        {/* Shared Users */}
        <div className="users-card">

          <div className="users-heading">
            <div>
              <h2>People With Access</h2>
              <p>
                {sharedUsers.length} people have access
              </p>
            </div>

            <span className="access-badge">
              🔐 Secure
            </span>
          </div>

          <div className="users-list">

            {sharedUsers.map((user) => (

              <div className="user-row" key={user.id}>

                <div className="user-avatar">
                  {user.avatar}
                </div>

                <div className="user-info">
                  <h3>{user.name}</h3>
                  <p>{user.email}</p>
                </div>

                <span className="permission-tag">
                  {user.permission}
                </span>

                {user.permission !== "Owner" && (
                  <button
                    className="remove-btn"
                    onClick={() => removeUser(user.id)}
                  >
                    Remove
                  </button>
                )}

              </div>

            ))}

          </div>

        </div>

      </div>

      {/* Collaboration Info */}
      <div className="collaboration-info">

        <div className="info-box">
          <span>🔒</span>
          <div>
            <h3>Private & Secure</h3>
            <p>
              Only people you invite can access your shared notes.
            </p>
          </div>
        </div>

        <div className="info-box">
          <span>⚡</span>
          <div>
            <h3>Real-Time Collaboration</h3>
            <p>
              Work together and keep your ideas organized.
            </p>
          </div>
        </div>

        <div className="info-box">
          <span>👥</span>
          <div>
            <h3>Easy Teamwork</h3>
            <p>
              Share notes with classmates, friends or teammates.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}

export default CollaborativeSharing;