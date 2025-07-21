import React from 'react';
import '../styles/Footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section logo-section">
          <h3>Movieah</h3>
          <p className="tagline">Your ultimate destination for movies and TV shows.</p>
        </div>
        
        <div className="footer-section links-section">
          <h3>Links</h3>
          <ul className="footer-links">
            <li><a href="/">Home</a></li>
            <li><a href="/movies">Movies</a></li>
            <li><a href="/series">Series</a></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p className="footer-note">&copy; {currentYear} Movieah. All content is provided by non-affiliated third parties.</p>
      </div>
    </footer>
  );
};

export default Footer; 