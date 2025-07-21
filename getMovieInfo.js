const sqlite3 = require('sqlite3').verbose();
const TMDB_API_KEY = '8bbe556cabc31eff96d6deefe986d8f6';
const DB_PATH = 'moviedata.db';
const fetch = require('node-fetch'); // Required if you're running this in Node without native fetch

// Get all TMDB IDs
function getTmdbIdsFromDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY);
    db.all('SELECT id FROM moviesclub', [], (err, rows) => {
      db.close();
      if (err) return reject(err);
      resolve(rows.map(row => row.id));
    });
  });
}

// Get existing values from the DB for a movie
function getExistingMovieData(tmdbId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY);
    db.get(
      `SELECT runtime, overview, poster_path, rating, genres FROM moviesclub WHERE id = ?`,
      [tmdbId],
      (err, row) => {
        db.close();
        if (err) return reject(err);
        resolve(row);
      }
    );
  });
}

// Fetch movie details from TMDB
async function fetchMovieDetails(tmdbId) {
  const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TMDB fetch failed for ID ${tmdbId}: ${response.statusText}`);
  }
  const data = await response.json();
  return {
    runtime: data.runtime,
    original_title: data.original_title,
    overview: data.overview,
    poster_path: data.poster_path,
    rating: data.vote_average,
    genres: data.genres?.map(g => g.name).join(', ') || null
  };
}

// Conditionally update movie in database
function updateMovieInDatabase(tmdbId, updates) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);

    const fields = ['name = ?'];
    const values = [updates.original_title];

    if (updates.runtime !== undefined) {
      fields.push('runtime = ?');
      values.push(updates.runtime);
    }
    if (updates.overview !== undefined) {
      fields.push('overview = ?');
      values.push(updates.overview);
    }
    if (updates.poster_path !== undefined) {
      fields.push('poster_path = ?');
      values.push(updates.poster_path);
    }
    if (updates.rating !== undefined) {
      fields.push('rating = ?');
      values.push(updates.rating);
    }
    if (updates.genres !== undefined) {
      fields.push('genres = ?');
      values.push(updates.genres);
    }

    values.push(tmdbId); // For WHERE clause
    const query = `UPDATE moviesclub SET ${fields.join(', ')} WHERE id = ?`;

    db.run(query, values, function (err) {
      db.close();
      if (err) return reject(err);
      resolve();
    });
  });
}

// Main
(async () => {
  try {
    const tmdbIds = await getTmdbIdsFromDatabase();
    console.log(`Found ${tmdbIds.length} movies to check and update.`);

    for (const tmdbId of tmdbIds) {
      try {
        const existing = await getExistingMovieData(tmdbId);
        const fetched = await fetchMovieDetails(tmdbId);

        const updates = {
          original_title: fetched.original_title
        };

        if (existing.runtime == null) updates.runtime = fetched.runtime;
        if (existing.overview == null) updates.overview = fetched.overview;
        if (existing.poster_path == null) updates.poster_path = fetched.poster_path;
        if (existing.rating == null) updates.rating = fetched.rating;
        if (existing.genres == null) updates.genres = fetched.genres;

        await updateMovieInDatabase(tmdbId, updates);
        console.log(`✅ Updated TMDB ID ${tmdbId}`);
      } catch (err) {
        console.error(`❌ Failed for TMDB ID ${tmdbId}: ${err.message}`);
      }
    }

    console.log('🎬 Done updating movie details!');
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
