import "./Home.css";

function Home() {
  return (
    <>
      <header className="header">
        <div className="logo">MyWebsite</div>

        <nav>
          <ul className="nav-links">
            <li><a href="/">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/services">Services</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </nav>
      </header>

      <section className="hero">
        <h1>Welcome to My Website</h1>
        <p>Build modern websites with React.</p>
        <button className="btn">Get Started</button>
      </section>

      <section className="cards">
        <div className="card">
          <h2>Web Design</h2>
          <p>Create beautiful and responsive UI.</p>
        </div>

        <div className="card">
          <h2>Development</h2>
          <p>Fast and scalable React applications.</p>
        </div>

        <div className="card">
          <h2>Support</h2>
          <p>24/7 customer support available.</p>
        </div>
      </section>

      <footer className="footer">
        <p>© 2026 MyWebsite. All Rights Reserved.</p>
      </footer>
    </>
  );
}

export default Home;