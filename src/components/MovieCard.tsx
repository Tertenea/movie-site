import React, { useState, useRef, useEffect } from 'react';
import { Movie } from '../services/databaseService';
import '../styles/MovieCard.css';

interface MovieCardProps {
  movie: Movie;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedSource, setSelectedSource] = useState(`https://moviesapi.to/movie/${movie.id}`);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isRatingLoading, setIsRatingLoading] = useState(false);
  const [ratingMessage, setRatingMessage] = useState<string>('');

  const cardRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const getCookie = (name: string): string => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return '';
  };

  useEffect(() => {
    const loggedIn = getCookie('isLoggedIn');
    const user = getCookie('username');
    setIsLoggedIn(loggedIn === 'true');
    if (user) setUsername(user);
  }, []);

  const togglePopup = () => {
    setShowPopup(!showPopup);
  };

  const formatRating = (rating: number | null | undefined) => {
    return typeof rating === 'number' ? rating.toFixed(1) : 'N/A';
  };

  const getPosterUrl = () => {
    if (movie.poster_path) {
      if (movie.poster_path.startsWith('/')) {
        return `https://image.tmdb.org/t/p/w600_and_h900_bestv2${movie.poster_path}`;
      } else if (movie.poster_path.startsWith('http')) {
        return movie.poster_path;
      }
    }
    return '/placeholder-poster.svg';
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleSourceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSource(event.target.value);
  };

  const formatRuntime = (minutes: number | null) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const truncateOverview = (text: string | null, maxLength = 400) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  const handleRating = async (value: number) => {
    if (!username || isRatingLoading) return;
    
    setIsRatingLoading(true);
    setRatingMessage('');
    
    try {
      const response = await fetch('http://localhost:4000/api/rate-movie', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          title: movie.name,
          rating: value,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setRating(value);
        setRatingMessage('Rating saved!');
        console.log(`Successfully rated "${movie.name}" with ${value} stars`);
      } else {
        console.error('Error rating movie:', data.error);
        setRatingMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Network error while rating movie:', error);
      setRatingMessage('Network error. Please try again.');
    } finally {
      setIsRatingLoading(false);
      // Clear message after 3 seconds
      setTimeout(() => setRatingMessage(''), 3000);
    }
  };

  const markAsWatched = async () => {
    if (!username || isRatingLoading) return;
    
    setIsRatingLoading(true);
    setRatingMessage('');
    
    try {
      const response = await fetch('http://localhost:4000/api/rate-movie', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          title: movie.name,
          rating: rating || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setRatingMessage('Marked as watched!');
        console.log(`Successfully marked "${movie.name}" as watched`);
      } else {
        console.error('Error marking movie as watched:', data.error);
        setRatingMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Network error while marking movie as watched:', error);
      setRatingMessage('Network error. Please try again.');
    } finally {
      setIsRatingLoading(false);
      // Clear message after 3 seconds
      setTimeout(() => setRatingMessage(''), 3000);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          if (cardRef.current) observer.unobserve(cardRef.current);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) observer.observe(cardRef.current);

    return () => {
      if (cardRef.current) observer.unobserve(cardRef.current);
    };
  }, []);

  // Close popup on outside click
  useEffect(() => {
    if (!showPopup) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPopup]);

  return (
    <>
      <div className="movie-card" onClick={togglePopup} ref={cardRef}>
        <div className="movie-poster">
          {isVisible && !imageError ? (
            <>
              {!isImageLoaded && <div className="poster-loading">Loading...</div>}
              <img
                src={getPosterUrl()}
                alt={`${movie.name} poster`}
                onError={handleImageError}
                onLoad={() => setIsImageLoaded(true)}
                style={{ opacity: isImageLoaded ? 1 : 0 }}
              />
            </>
          ) : imageError ? (
            <div className="poster-placeholder">
              <div className="poster-text">{movie.name}</div>
            </div>
          ) : (
            <div className="poster-placeholder loading-placeholder">
              <div className="poster-text">Loading...</div>
            </div>
          )}
        </div>
        <div className="movie-card-content">
          <h3>{movie.name}</h3>
          <div className="movie-details">
            <span className="release-year">{movie.year}</span>
            {movie.runtime && <span className="runtime">{formatRuntime(movie.runtime)}</span>}
            {movie.rating !== undefined && (
              <span className="rating">&nbsp;&nbsp;&nbsp;★{formatRating(movie.rating)}</span>
            )}
          </div>
          {movie.overview && (
            <p className="movie-overview">{truncateOverview(movie.overview)}</p>
          )}
        </div>
      </div>

      {showPopup && (
        <div className="movie-popup-overlay">
          <div className="movie-popup" ref={popupRef}>
            <div className="popup-header">
              <h2>
                {movie.name} ({movie.year})
                {movie.runtime && <span className="popup-runtime">{formatRuntime(movie.runtime)}</span>}
              </h2>
              <div className="header-controls">
                <div className="source-selector">
                  <label htmlFor="source-select">Choose Source:</label>
                  <select
                    id="source-select"
                    value={selectedSource}
                    onChange={handleSourceChange}
                  >
                    <option value={`https://moviesapi.to/movie/${movie.id}`}>MoviesClub</option>
                    <option value={`https://vidlink.pro/movie/${movie.id}`}>VidLink</option>
                    <option value={`https://vidsrc.xyz/embed/movie/${movie.id}`}>VidSrc</option>
                  </select>
                </div>
                <button className="close-btn" onClick={togglePopup}>×</button>
              </div>
            </div>
            <div className="popup-content">
              <iframe
                src={selectedSource}
                title={movie.name}
                className="movie-embed"
                allowFullScreen
              ></iframe>

              {isLoggedIn && (
                <div className="movie-card-bottom-bar">
                  <button 
                    className="mark-watched-btn" 
                    onClick={markAsWatched}
                    disabled={isRatingLoading}
                  >
                    {isRatingLoading ? 'Saving...' : 'Mark as Watched'}
                  </button>
                  <div className="rating-container">
                    <div className="rating-stars">
                      {[...Array(10)].map((_, index) => {
                        const starValue = index + 1;
                        return (
                          <span
                            key={index}
                            className={`star ${starValue <= (hoverRating || rating) ? 'filled' : ''} ${isRatingLoading ? 'disabled' : ''}`}
                            onClick={() => !isRatingLoading && handleRating(starValue)}
                            onMouseEnter={() => !isRatingLoading && setHoverRating(starValue)}
                            onMouseLeave={() => !isRatingLoading && setHoverRating(0)}
                            style={{ cursor: isRatingLoading ? 'not-allowed' : 'pointer' }}
                          >
                            ★
                          </span>
                        );
                      })}
                    </div>
                    {ratingMessage && (
                      <div className={`rating-message ${ratingMessage.includes('Error') ? 'error' : 'success'}`}>
                        {ratingMessage}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MovieCard;