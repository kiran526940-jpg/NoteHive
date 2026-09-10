import React, { useState } from "react";
import "./QuickSearch.css";
const API_URL = "http://192.168.1.68:5000/api";
function QuickSearch() {
  const [search, setSearch] = useState("");

  const notes = [
    {
      id: 1,
      title: "DBMS Notes",
      category: "Database",
      date: "Today",
      icon: "🗄️",
      content: "Normalization, keys, relationships and SQL concepts.",
    },
    {
      id: 2,
      title: "React Notes",
      category: "Programming",
      date: "Yesterday",
      icon: "⚛️",
      content: "Components, props, state and React Router DOM.",
    },
    {
      id: 3,
      title: "Computer Networks",
      category: "Networking",
      date: "2 days ago",
      icon: "🌐",
      content: "OSI model, TCP/IP, IP addressing and protocols.",
    },
    {
      id: 4,
      title: "JavaScript Basics",
      category: "Programming",
      date: "3 days ago",
      icon: "💻",
      content: "Variables, functions, arrays and objects.",
    },
  ];

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(search.toLowerCase()) ||
      note.content.toLowerCase().includes(search.toLowerCase()) ||
      note.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="quick-search-page">

      {/* Header */}
      <div className="quick-header">
        <div>
          <span className="quick-label">NOTEHIVE SEARCH</span>

          <h1>Find Anything, <span>Instantly.</span></h1>

          <p>
            Search your notes, topics, keywords and categories in seconds.
          </p>
        </div>

        <div className="search-badge">
          ⚡ Smart Search
        </div>
      </div>

      {/* Search Box */}
      <div className="main-search">
        <div className="search-icon">🔍</div>

        <input
          type="text"
          placeholder="Search your notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {search && (
          <button
            className="clear-btn"
            onClick={() => setSearch("")}
          >
            ✕
          </button>
        )}

      </div>

      {/* Quick Categories */}
      <div className="quick-section">

        <div className="section-title">
          <h2>Quick Categories</h2>
          <span>Browse by topic</span>
        </div>

        <div className="category-list">

          <button onClick={() => setSearch("Database")}>
            🗄️ Database
          </button>

          <button onClick={() => setSearch("Programming")}>
            💻 Programming
          </button>

          <button onClick={() => setSearch("Networking")}>
            🌐 Networking
          </button>

          <button onClick={() => setSearch("React")}>
            ⚛️ React
          </button>

        </div>
      </div>

      {/* Results */}
      <div className="results-section">

        <div className="section-title">
          <h2>
            {search ? "Search Results" : "Your Recent Notes"}
          </h2>

          <span>
            {filteredNotes.length} notes
          </span>
        </div>

        {filteredNotes.length > 0 ? (

          <div className="results-grid">

            {filteredNotes.map((note) => (

              <div className="result-card" key={note.id}>

                <div className="result-top">

                  <div className="note-icon">
                    {note.icon}
                  </div>

                  <span className="note-category">
                    {note.category}
                  </span>

                </div>

                <h3>{note.title}</h3>

                <p>{note.content}</p>

                <div className="result-bottom">

                  <span>
                    🕒 {note.date}
                  </span>

                  <button>
                    Open →
                  </button>

                </div>

              </div>

            ))}

          </div>

        ) : (

          <div className="no-results">

            <div className="no-results-icon">
              🔎
            </div>

            <h3>No notes found</h3>

            <p>
              Try searching with another keyword or category.
            </p>

          </div>

        )}

      </div>

    </div>
  );
}

export default QuickSearch;