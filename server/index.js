const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');
const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors());

// Connect to the database
let db;
try {
  // Use an absolute path to the database file
  const dbPath = path.resolve(__dirname, '..', 'moviedata.db');
  console.log(`Connecting to database at: ${dbPath}`);
  db = new Database(dbPath, { readonly: true });
  console.log('Connected to database successfully');
} catch (error) {
  console.error('Failed to connect to database:', error);
  process.exit(1); // Exit if database connection fails
}

// API endpoint to get paginated movies with search
app.get('/api/movies', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search ? String(req.query.search).trim() : '';
    const sortBy = String(req.query.sortBy || 'year').toLowerCase();
    const sortOrderRaw = String(req.query.sortOrder || 'desc').toLowerCase();

    const offset = (page - 1) * limit;

    // Whitelist allowed sorting columns
    const allowedSortColumns = new Set(['rating', 'year', 'name']);
    const allowedSortOrders = new Set(['asc', 'desc']);

    // Validate inputs
    const orderColumn = allowedSortColumns.has(sortBy) ? sortBy : 'year';
    const orderDirection = allowedSortOrders.has(sortOrderRaw) ? sortOrderRaw.toUpperCase() : 'DESC';

    let baseQuery = '';
    let countQuery = '';
    let queryParams = [];
    let countParams = [];

    if (search) {
      const searchPattern = `%${search}%`;

      baseQuery = `
        SELECT id, name, year, poster_path, overview, runtime, rating, genres
        FROM moviesclub
        WHERE name LIKE ?
        ORDER BY ${orderColumn} ${orderDirection}, name ASC
        LIMIT ? OFFSET ?
      `;

      countQuery = `
        SELECT COUNT(*) as count
        FROM moviesclub
        WHERE name LIKE ?
      `;

      queryParams = [searchPattern, limit, offset];
      countParams = [searchPattern];
    } else {
      baseQuery = `
        SELECT id, name, year, poster_path, overview, runtime, rating, genres
        FROM moviesclub
        ORDER BY ${orderColumn} ${orderDirection}, name ASC
        LIMIT ? OFFSET ?
      `;

      countQuery = `SELECT COUNT(*) as count FROM moviesclub`;

      queryParams = [limit, offset];
      countParams = [];
    }

    // Get total count
    const countStmt = db.prepare(countQuery);
    const countResult = countStmt.get(...countParams);
    const totalCount = countResult.count;

    // Get movies
    const stmt = db.prepare(baseQuery);
    const movies = stmt.all(...queryParams);

    res.json({
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      movies,
    });
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});


// API endpoint to get a specific movie by ID
app.get('/api/movies/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('SELECT id, name, year, poster_path, overview, runtime, rating, genres FROM moviesclub WHERE id = ?');
    const movie = stmt.get(parseInt(id));
   
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

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Closing database connection...');
  if (db) {
    db.close();
  }
  process.exit(0);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});