import React, { useState, useEffect, useCallback } from 'react';
import { getMovies, Movie, PaginatedMoviesResponse } from '../services/databaseService';
import MovieCard from '../components/MovieCard';
import '../styles/Pages.css';
import '../styles/Movies.css';

const Movies: React.FC = () => {
  const [moviesData, setMoviesData] = useState<PaginatedMoviesResponse | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [moviesPerPage, setMoviesPerPage] = useState<number>(40);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  
  // New sorting state
  const [sortBy, setSortBy] = useState<string>('year');
  const [sortOrder, setSortOrder] = useState<string>('desc');

  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchMovies = useCallback(
    async (
      page: number,
      limit: number,
      search?: string,
      sortByParam?: string,
      sortOrderParam?: string
    ) => {
      try {
        setLoading(true);
        const data = await getMovies(page, limit, search, sortByParam, sortOrderParam);
        setMoviesData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching movies:', err);
        setError('Failed to load movies. Please try again later.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchMovies(currentPage, moviesPerPage, debouncedSearchQuery, sortBy, sortOrder);
  }, [currentPage, moviesPerPage, debouncedSearchQuery, sortBy, sortOrder, fetchMovies]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) return;
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchQuery]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && (!moviesData || newPage <= moviesData.totalPages)) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleMoviesPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(event.target.value);
    setMoviesPerPage(newLimit);
    setCurrentPage(1);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Sorting change handlers
  const handleSortByChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(event.target.value);
    setCurrentPage(1); // Reset to first page on sorting change
  };

  const handleSortOrderChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(event.target.value);
    setCurrentPage(1);
  };

  const PaginationControls = ({ position }: { position: 'top' | 'bottom' }) => {
    if (!moviesData || moviesData.totalPages <= 1) return null;

    return (
      <div className={`pagination pagination-${position}`}>
        <div className="pagination-buttons">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            Previous
          </button>
        </div>
        <div className="pagination-info">
          Page {currentPage} of {moviesData.totalPages}
          <span className="pagination-total"> ({moviesData.totalCount} movies)</span>
        </div>
        {position === 'top' && (
          <>
            <div className="per-page-selector">
              <label htmlFor="moviesPerPage">Show:</label>
              <select
                id="moviesPerPage"
                value={moviesPerPage}
                onChange={handleMoviesPerPageChange}
              >
                <option value="40">40</option>
                <option value="120">120</option>
                <option value="200">200</option>
              </select>
            </div>

            <div className="sorting-controls">
              <div>
                <label htmlFor="sortBy">Sort by:</label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={handleSortByChange}
                >
                  <option value="year">Year</option>
                  <option value="name">Name</option>
                  <option value="rating">Rating</option>
                </select>
              </div>
              <div>
                <label htmlFor="sortOrder">Order:</label>
                <select
                  id="sortOrder"
                  value={sortOrder}
                  onChange={handleSortOrderChange}
                >
                  <option value="asc">Asc</option>
                  <option value="desc">Desc</option>
                </select>
              </div>
            </div>
          </>
        )}
        <div className="pagination-buttons">
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === moviesData.totalPages}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="page movies-page">
      {/* Search Bar */}
      <div className="search-container">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search movies..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="clear-search-button"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
        {debouncedSearchQuery && (
          <div className="search-results-info">
            Showing results for: "{debouncedSearchQuery}"
          </div>
        )}
      </div>

      {loading && !moviesData ? (
        <div className="loading">Loading movies...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : moviesData && moviesData.movies.length > 0 ? (
        <>
          <PaginationControls position="top" />

          <div className="movies-grid">
            {moviesData.movies.map(movie => (
              <div key={movie.id}>
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>

          <PaginationControls position="bottom" />
        </>
      ) : (
        <div className="no-movies">
          {debouncedSearchQuery ? (
            <>
              <p>No movies found matching "{debouncedSearchQuery}".</p>
              <button onClick={clearSearch} className="clear-search-link">
                Clear search to see all movies
              </button>
            </>
          ) : (
            <p>No movies found in the database.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Movies;
