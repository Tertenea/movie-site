import React, { useState, useEffect } from 'react';
import '../styles/CookieConsent.css';

const CookieConsent: React.FC = () => {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    const consentGiven = localStorage.getItem('cookieConsent');
    if (!consentGiven) {
      setShowConsent(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowConsent(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setShowConsent(false);
    // Clear any existing cookies
    document.cookie = 'isLoggedIn=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'userEmail=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  };

  if (!showConsent) {
    return null;
  }

  return (
    <div className="cookie-consent-overlay">
      <div className="cookie-consent-banner">
        <div className="cookie-consent-content">
          <h3>🍪 We Use Cookies</h3>
          <p>
            We use cookies to enhance your experience on our site. These cookies help us:
          </p>
          <ul>
            <li>Keep you logged in to your account</li>
            <li>Remember your preferences (like dark/light mode)</li>
            <li>Provide personalized content</li>
          </ul>
          <p>
            By clicking "Accept", you consent to our use of cookies. You can change your 
            cookie preferences at any time in your browser settings.
          </p>
        </div>
        <div className="cookie-consent-actions">
          <button 
            className="cookie-btn cookie-btn-decline" 
            onClick={declineCookies}
          >
            Decline
          </button>
          <button 
            className="cookie-btn cookie-btn-accept" 
            onClick={acceptCookies}
          >
            Accept Cookies
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;