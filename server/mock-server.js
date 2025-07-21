const express = require('express');
const cors = require('cors');
const path = require('path');
let Database;
let db;
let usingMockData = false;

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors());

// Mock movie data as fallback
const mockMovies = [
  { id: 1, name: 'The Shawshank Redemption', year: 1994 },
  { id: 2, name: 'The Godfather', year: 1972 },
  { id: 3, name: 'The Dark Knight', year: 2008 },
  { id: 4, name: 'Pulp Fiction', year: 1994 },
  { id: 5, name: 'The Lord of the Rings: The Return of the King', year: 2003 },
  { id: 6, name: 'Forrest Gump', year: 1994 },
  { id: 7, name: 'Inception', year: 2010 },
  { id: 8, name: 'The Matrix', year: 1999 },
  { id: 9, name: 'Interstellar', year: 2014 },
  { id: 10, name: 'Parasite', year: 2019 },
  { id: 11, name: 'The Silence of the Lambs', year: 1991 },
  { id: 12, name: 'Gladiator', year: 2000 },
  { id: 13, name: 'The Avengers', year: 2012 },
  { id: 14, name: 'Joker', year: 2019 },
  { id: 15, name: 'The Departed', year: 2006 },
  { id: 16, name: 'Titanic', year: 1997 },
  { id: 17, name: 'Avatar', year: 2009 },
  { id: 18, name: 'The Revenant', year: 2015 },
  { id: 19, name: 'Whiplash', year: 2014 },
  { id: 20, name: 'The Prestige', year: 2006 }
];

// Try to connect to the actual SQLite database
try {
  Database = require('better-sqlite3');
  // Use an absolute path to the database file
  const dbPath = path.resolve(__dirname, '..', 'moviedata.db');
  console.log(`Attempting to connect to database at: ${dbPath}`);
  db = new Database(dbPath, { readonly: true });
  console.log('Connected to actual SQLite database successfully');
} catch (error) {
  console.error('Failed to connect to SQLite database:', error);
  console.log('Using mock movie data instead');
  usingMockData = true;
}

// API endpoints
app.get('/api/movies', (req, res) => {
  try {
    // Get page and limit parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20; // Default to 20 movies per page
    const offset = (page - 1) * limit;
    
    let movies;
    let totalCount = 0;
    
    if (!usingMockData) {
      // Try to get data from the actual database
      try {
        // Get total count first
        const countStmt = db.prepare('SELECT COUNT(*) as count FROM moviesclub');
        const countResult = countStmt.get();
        totalCount = countResult.count;
        
        // Get paginated results
        console.log(`Executing SQL query with pagination: SELECT id, name, year, poster_path, overview, runtime FROM moviesclub LIMIT ${limit} OFFSET ${offset}`);
        const stmt = db.prepare('SELECT id, name, year, poster_path, overview, runtime FROM moviesclub LIMIT ? OFFSET ?');
        movies = stmt.all(limit, offset);
        console.log(`wahh Retrieved ${movies.length} movies from database (page ${page}, limit ${limit}, total ${totalCount})`);
      } catch (dbError) {
        console.error('Error accessing database table:', dbError);
        console.log('Falling back to mock data');
        movies = mockMovies.slice(offset, offset + limit);
        totalCount = mockMovies.length;
      }
    } else {
      movies = mockMovies.slice(offset, offset + limit);
      totalCount = mockMovies.length;
    }
    
    // Return paginated response with metadata
    res.json({
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      movies
    });
  } catch (error) {
    console.error('Error sending movies:', error);
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});

app.get('/api/movies/:id', (req, res) => {
  try {
    const { id } = req.params;
    let movie;
    
    if (!usingMockData) {
      // Try to get data from the actual database
      try {
        const stmt = db.prepare('SELECT id, name, year, poster_path, overview, runtime FROM moviesclub WHERE id = ?');
        movie = stmt.get(parseInt(id));
      } catch (dbError) {
        console.error(`Error accessing database for movie ${id}:`, dbError);
        // Fall back to mock data
        movie = mockMovies.find(m => m.id === parseInt(id));
      }
    } else {
      movie = mockMovies.find(m => m.id === parseInt(id));
    }
    
    if (movie) {
      res.json(movie);
    } else {
      res.status(404).json({ error: 'Movie not found' });
    }
  } catch (error) {
    console.error(`Error fetching movie with id ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch movie' });
  }
});

// Start the server
app.listen(PORT, () => {
  if (usingMockData) {
    console.log(`Server running on port ${PORT} with MOCK DATA`);
  } else {
    console.log(`Server running on port ${PORT} with ACTUAL DATABASE`);
  }
}); 