import React, { useState } from "react";
import { API_URL } from "../../config/api";
import "./NoteHiveAI.css";

const NoteHiveAI = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    const text = message.trim();

    if (!text || loading) return;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: text,
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to get AI response."
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
        },
      ]);
    } catch (error) {
      console.error("NoteHive AI Error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't process your request right now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="notehive-ai-page">
      <div className="notehive-ai-container">

        <div className="notehive-ai-header">
          <div className="notehive-ai-icon">🐝</div>

          <div>
            <h1>NoteHive AI</h1>
            <p>Your smart study & notes assistant</p>
          </div>
        </div>

        <div className="notehive-ai-chat">

          {messages.length === 0 && (
            <div className="notehive-ai-welcome">
              <div className="welcome-bee">🐝</div>

              <h2>Hi! I'm NoteHive AI 👋</h2>

              <p>
                Ask me anything about your notes, studies,
                programming, or everyday questions.
              </p>

              <div className="ai-suggestions">
                <button
                  onClick={() =>
                    setMessage(
                      "Explain JavaScript arrays in simple Hinglish."
                    )
                  }
                >
                  📚 Explain a topic
                </button>

                <button
                  onClick={() =>
                    setMessage(
                      "Create a short note about JavaScript loops."
                    )
                  }
                >
                  📝 Create a note
                </button>

                <button
                  onClick={() =>
                    setMessage(
                      "Give me 5 important JavaScript interview questions."
                    )
                  }
                >
                  💼 Interview questions
                </button>
              </div>
            </div>
          )}

          {messages.map((item, index) => (
            <div
              key={index}
              className={`ai-message ${
                item.role === "user"
                  ? "ai-user-message"
                  : "ai-assistant-message"
              }`}
            >
              {item.role === "assistant" && (
                <div className="message-avatar">🐝</div>
              )}

              <div className="message-bubble">
                {item.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="ai-message ai-assistant-message">
              <div className="message-avatar">🐝</div>

              <div className="message-bubble ai-typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
        </div>

        <div className="notehive-ai-input-area">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask NoteHive AI anything..."
            rows="1"
            disabled={loading}
          />

          <button
            className="ai-send-button"
            onClick={sendMessage}
            disabled={!message.trim() || loading}
            aria-label="Send message"
          >
            ➤
          </button>
        </div>

        <div className="ai-disclaimer">
          NoteHive AI can make mistakes. Please verify important information.
        </div>

      </div>
    </div>
  );
};

export default NoteHiveAI;