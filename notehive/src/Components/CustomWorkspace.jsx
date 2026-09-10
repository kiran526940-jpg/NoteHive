import React, { useState } from "react";
import "./CustomWorkspace.css";

function CustomWorkspace() {
  const [theme, setTheme] = useState("Light");
  const [layout, setLayout] = useState("Grid");
  const [fontSize, setFontSize] = useState("Medium");
  const [density, setDensity] = useState("Comfortable");
  const [workspaceName, setWorkspaceName] = useState("My Workspace");

  const handleSave = () => {
    localStorage.setItem(
      "notehiveWorkspace",
      JSON.stringify({
        theme,
        layout,
        fontSize,
        density,
        workspaceName,
      })
    );

    alert("Workspace settings saved successfully!");
  };

  return (
    <div className="workspace-page">

      {/* Header */}
      <div className="workspace-header">

        <div>
          <span className="workspace-label">
            NOTEHIVE WORKSPACE
          </span>

          <h1>
            Make it <span>Your Space.</span>
          </h1>

          <p>
            Customize your NoteHive workspace according to your
            personal style and working preferences.
          </p>
        </div>

        <div className="workspace-symbol">
          🎨
        </div>

      </div>

      {/* Main Content */}
      <div className="workspace-content">

        {/* Settings Card */}
        <div className="settings-card">

          <div className="settings-title">
            <div className="settings-icon">
              ⚙️
            </div>

            <div>
              <h2>Workspace Settings</h2>
              <p>
                Personalize how your workspace looks and feels.
              </p>
            </div>
          </div>

          {/* Workspace Name */}
          <div className="setting-item">

            <label>Workspace Name</label>

            <input
              type="text"
              value={workspaceName}
              onChange={(e) =>
                setWorkspaceName(e.target.value)
              }
              placeholder="Enter workspace name"
            />

          </div>

          {/* Theme */}
          <div className="setting-item">

            <label>Theme</label>

            <div className="option-group">

              {["Light", "Dark", "Blue"].map((item) => (

                <button
                  key={item}
                  className={
                    theme === item
                      ? "option active"
                      : "option"
                  }
                  onClick={() => setTheme(item)}
                >
                  {item === "Light" && "☀️"}
                  {item === "Dark" && "🌙"}
                  {item === "Blue" && "💙"}

                  {item}
                </button>

              ))}

            </div>

          </div>

          {/* Layout */}
          <div className="setting-item">

            <label>Note Layout</label>

            <div className="option-group">

              <button
                className={
                  layout === "Grid"
                    ? "option active"
                    : "option"
                }
                onClick={() => setLayout("Grid")}
              >
                ▦ Grid
              </button>

              <button
                className={
                  layout === "List"
                    ? "option active"
                    : "option"
                }
                onClick={() => setLayout("List")}
              >
                ☰ List
              </button>

              <button
                className={
                  layout === "Compact"
                    ? "option active"
                    : "option"
                }
                onClick={() => setLayout("Compact")}
              >
                ▤ Compact
              </button>

            </div>

          </div>

          {/* Font Size */}
          <div className="setting-item">

            <label>Font Size</label>

            <div className="option-group">

              {["Small", "Medium", "Large"].map((item) => (

                <button
                  key={item}
                  className={
                    fontSize === item
                      ? "option active"
                      : "option"
                  }
                  onClick={() => setFontSize(item)}
                >
                  {item}
                </button>

              ))}

            </div>

          </div>

          {/* Density */}
          <div className="setting-item">

            <label>Workspace Density</label>

            <div className="option-group">

              {["Comfortable", "Compact"].map((item) => (

                <button
                  key={item}
                  className={
                    density === item
                      ? "option active"
                      : "option"
                  }
                  onClick={() => setDensity(item)}
                >
                  {item}
                </button>

              ))}

            </div>

          </div>

          <button
            className="save-workspace"
            onClick={handleSave}
          >
            Save Workspace Settings
          </button>

        </div>

        {/* Preview Card */}
        <div className="preview-card">

          <div className="preview-header">

            <div>
              <span>LIVE PREVIEW</span>
              <h2>{workspaceName}</h2>
            </div>

            <div className="preview-theme">
              {theme === "Light" && "☀️"}
              {theme === "Dark" && "🌙"}
              {theme === "Blue" && "💙"}
            </div>

          </div>

          <div
            className={`preview-notes ${
              layout.toLowerCase()
            }`}
          >

            <div className="preview-note">
              <span>📝</span>
              <h3>My First Note</h3>
              <p>
                This is how your notes will appear.
              </p>
            </div>

            <div className="preview-note">
              <span>📚</span>
              <h3>Study Notes</h3>
              <p>
                Organize your important information.
              </p>
            </div>

            <div className="preview-note">
              <span>💡</span>
              <h3>Ideas</h3>
              <p>
                Keep your ideas safe and organized.
              </p>
            </div>

          </div>

          <div className="preview-footer">

            <span>
              Layout: <strong>{layout}</strong>
            </span>

            <span>
              Font: <strong>{fontSize}</strong>
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}

export default CustomWorkspace;