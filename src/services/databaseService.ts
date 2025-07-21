import Database from 'better-sqlite3';
import path from 'path';

// Define the Movie type
export interface Movie {
  id: number;
  name: string;
  year: number;
  poster_path: string | null;
  overview: string | null;
  runtime: number | null;
  rating?: number | null;
  genres: string[];
}

export interface PaginatedMoviesResponse {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  movies: Movie[];
}

const API_URL = 'http://localhost:3001/api';

// Get paginated movies
export const getMovies = async (
  page = 1,
  limit = 20,
  search?: string,
  sortBy?: string,
  sortOrder?: string
): Promise<PaginatedMoviesResponse> => {
  try {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search && search.trim() !== '') {
      params.append('search', search.trim());
    }
    if (sortBy) {
      params.append('sortBy', sortBy);
    }
    if (sortOrder) {
      params.append('sortOrder', sortOrder);
    }

    const response = await fetch(`${API_URL}/movies?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data as PaginatedMoviesResponse;
  } catch (error) {
    console.error('Error fetching movies:', error);
    return { page, limit, totalCount: 0, totalPages: 0, movies: [] };
  }
};

// Get a movie by id
export const getMovieById = async (id: number): Promise<Movie | null> => {
  try {
    const response = await fetch(`${API_URL}/movies/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data as Movie;
  } catch (error) {
    console.error(`Error fetching movie with id ${id}:`, error);
    return null;
  }
};

// Creating a named export default object to fix the linter warning
const databaseService = {
  getMovies,
  getMovieById
};

export default databaseService; 