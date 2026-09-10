import React, { useState } from 'react';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Contact Form Data:', formData);
    setIsSubmitted(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
    
    // Reset success message after 4 seconds
    setTimeout(() => setIsSubmitted(false), 4000);
  };

  return (
    <div className="contact-page-wrapper">
      <div className="contact-container-modern">
        
        {/* Header Section */}
        <div className="contact-header-section">
          <span className="contact-badge">We are here for you</span>
          <h1>Get in Touch</h1>
          <p>
            Have a question, feedback, or need assistance? Drop us a line and our team will respond swiftly.
          </p>
        </div>

        {/* Content Grid */}
        <div className="contact-grid-layout">
          
          {/* Left Side: Quick Info Cards */}
          <div className="contact-info-cards">
            <div className="info-card-item">
              <div className="icon-box">✉️</div>
              <div>
                <h3>Chat with us</h3>
                <p>Our friendly team is here to help.</p>
                <span className="highlight-text">support@notehive.com</span>
              </div>
            </div>

            <div className="info-card-item">
              <div className="icon-box">📍</div>
              <div>
                <h3>Visit Office</h3>
                <p>Come say hello at our headquarters.</p>
                <span className="highlight-text">New Delhi, India</span>
              </div>
            </div>

            <div className="info-card-item">
              <div className="icon-box">⚡</div>
              <div>
                <h3>Response Time</h3>
                <p>We typically reply within</p>
                <span className="highlight-text">2 - 4 Business Hours</span>
              </div>
            </div>
          </div>

          {/* Right Side: Modern Form */}
          <div className="contact-form-card">
            <h2>Send a Message</h2>
            
            {isSubmitted && (
              <div className="success-alert">
                ✨ Thank you! Your message has been sent successfully.
              </div>
            )}

            <form onSubmit={handleSubmit} className="modern-form">
              <div className="form-group-row">
                <div className="input-field-box">
                  <label htmlFor="name">Your Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-field-box">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="input-field-box">
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  placeholder="How can we help you?"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-field-box">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Type your message details here..."
                  value={formData.message}
                  onChange={handleChange}
                  required
                />
              </div>

              <button type="submit" className="submit-btn-modern">
                Send Message &rarr;
              </button>
            </form>
          </div>

        </div>

        {/* Footer Credit */}
        <div className="contact-page-footer">
          <p>© 2026 NoteHive. All rights reserved.</p>
        </div>

      </div>
    </div>
  );
};

export default Contact;