import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/Header.css';

// Cookie utility functions
const setCookie = (name: string, value: string, days: number = 7) => {
  // Check if cookies are consented to
  const consentGiven = localStorage.getItem('cookieConsent') === 'accepted';
  if (!consentGiven) return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name: string): string => {
  // Check if cookies are consented to
  const consentGiven = localStorage.getItem('cookieConsent') === 'accepted';
  if (!consentGiven) return '';
  
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return '';
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

const Header: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [displayUsername, setDisplayUsername] = useState(''); // New state for display username

  const loginFormRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }

    const userLoggedIn = getCookie('isLoggedIn') === 'true';
    setIsLoggedIn(userLoggedIn);
    
    // Set the display username from cookies if logged in
    if (userLoggedIn) {
      const storedUsername = getCookie('username');
      setDisplayUsername(storedUsername);
      console.log('Retrieved username from cookie:', storedUsername); // Debug log
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        loginFormRef.current &&
        !loginFormRef.current.contains(event.target as Node)
      ) {
        setShowLoginForm(false);
      }
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check username availability when registering
  useEffect(() => {
    if (isRegistering && username.length >= 3) {
      const timeoutId = setTimeout(async () => {
        setCheckingUsername(true);
        try {
          const response = await fetch(`http://localhost:4000/api/check-username/${username}`);
          const data = await response.json();
          setUsernameAvailable(data.available);
        } catch (error) {
          console.error('Error checking username:', error);
          setUsernameAvailable(null);
        } finally {
          setCheckingUsername(false);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setUsernameAvailable(null);
    }
  }, [username, isRegistering]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', newDarkMode ? 'dark' : 'light');
  };

  const toggleLoginForm = () => {
    setShowLoginForm(!showLoginForm);
    setShowProfileMenu(false);
    setError('');
    setUsernameAvailable(null);
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
    setShowLoginForm(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setError('');

    const endpoint = isRegistering ? '/api/register' : '/api/login';
    const requestBody = isRegistering 
      ? { username, email, password }
      : { email, password };

    try {
      const response = await fetch(`http://localhost:4000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (isRegistering) {
        setIsRegistering(false);
        setError('Registration successful! Please log in.');
        setUsername('');
        setEmail('');
        setPassword('');
        setUsernameAvailable(null);
      } else {
        console.log('Login successful, user data:', data.user); // Debug log
        
        // Store in cookies first
        setCookie('isLoggedIn', 'true');
        setCookie('username', data.user.username);
        setCookie('userEmail', data.user.email);
        
        // Then update all states together
        setIsLoggedIn(true);
        setDisplayUsername(data.user.username); // Set this immediately after login
        setShowLoginForm(false);
        
        // Clear form fields
        setUsername('');
        setEmail('');
        setPassword('');
        
        console.log('Set display username to:', data.user.username); // Debug log
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setShowProfileMenu(false);
    
    // Clear cookies instead of localStorage
    deleteCookie('isLoggedIn');
    deleteCookie('username');
    deleteCookie('userEmail');
    
    setUsername('');
    setEmail('');
    setPassword('');
    setDisplayUsername(''); // Clear the display username
  };

  const toggleRegisterMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setUsernameAvailable(null);
    setUsername('');
    setEmail('');
    setPassword('');
  };

  const getUsernameValidationClass = () => {
    if (!isRegistering || username.length < 3) return '';
    if (checkingUsername) return 'checking';
    if (usernameAvailable === true) return 'available';
    if (usernameAvailable === false) return 'unavailable';
    return '';
  };

  const getUsernameValidationMessage = () => {
    if (!isRegistering || username.length < 3) return '';
    if (checkingUsername) return 'Checking availability...';
    if (usernameAvailable === true) return '✓ Username is available';
    if (usernameAvailable === false) return '✗ Username is already taken';
    return '';
  };

  return (
    <header className="header">
      <div className="logo">
        <h1>Movieah</h1>
      </div>
      <nav className="nav">
        <ul>
          <li>
            <NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/movies" className={({ isActive }) => isActive ? "active" : ""}>
              Movies
            </NavLink>
          </li>
          <li>
            <NavLink to="/series" className={({ isActive }) => isActive ? "active" : ""}>
              Series
            </NavLink>
          </li>
          <li className="theme-toggle-container">
            <button
              className="theme-toggle"
              onClick={toggleDarkMode}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? (
                <svg className="sun-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                <svg className="moon-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>
          </li>
          <li className="auth-container">
            {isLoggedIn ? (
              <div className="profile-container" ref={profileMenuRef}>
                <button 
                  className="profile-button"
                  onClick={toggleProfileMenu}
                  aria-label="Open profile menu"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span>{displayUsername || 'Profile'}</span>
                </button>
                {showProfileMenu && (
                  <div className="profile-dropdown">
                    <ul>
                      <li>
                        <a href={`/${displayUsername}/movie-list`}>Movie List</a>
                      </li>
                      <li>
                        <a href={`/${displayUsername}/series-list`}>Series List</a>
                      </li>
                      <li>
                        <button className="sign-out-button" onClick={handleSignOut}>
                          Sign Out
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="login-container" ref={loginFormRef}>
                <button className="sign-in-button" onClick={toggleLoginForm}>
                  Sign In
                </button>
                {showLoginForm && (
                  <div className="login-dropdown">
                    <div className="login-form">
                      <h3>{isRegistering ? 'Register' : 'Sign In'}</h3>
                      {error && <div className="error-message">{error}</div>}
                      {isRegistering ? (
                        <>
                          <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                              type="text"
                              id="username"
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              className={getUsernameValidationClass()}
                              required
                            />
                            {getUsernameValidationMessage() && (
                              <div className={`validation-message ${getUsernameValidationClass()}`}>
                                {getUsernameValidationMessage()}
                              </div>
                            )}
                          </div>
                          <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                              type="email"
                              id="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                            />
                          </div>
                        </>
                      ) : (
                        <div className="form-group">
                          <label htmlFor="email">Email</label>
                          <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                      )}
                      <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                          type="password"
                          id="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      <button
                        type="button"
                        className="submit-button"
                        onClick={handleSubmit}
                        disabled={isRegistering && (usernameAvailable === false || checkingUsername)}
                      >
                        {isRegistering ? 'Register' : 'Sign In'}
                      </button>
                      <button
                        type="button"
                        className="toggle-mode-button"
                        onClick={toggleRegisterMode}
                      >
                        {isRegistering
                          ? 'Already have an account? Sign In'
                          : "Don't have an account? Register"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;