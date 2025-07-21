const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = 4000;
const fs = require('fs');
const path = require('path');

app.use(cors());
app.use(bodyParser.json());

// Open SQLite database (will create if it doesn't exist)
const db = new sqlite3.Database('./accounts.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    // Create users table if it doesn't exist
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        password TEXT
      )
    `);
  }
});

// Register new user
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password required' });
  }

  // Validate username format
  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters long' });
  }
  if (username.length > 20) {
    return res.status(400).json({ error: 'Username can\'t be longer than 20 characters' });
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;

    db.run(query, [username, email, hashedPassword], function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          if (err.message.includes('users.username')) {
            return res.status(400).json({ error: 'Username is already taken. Please choose a different username.' });
          }
          if (err.message.includes('users.email')) {
            return res.status(400).json({ error: 'Email is already registered. Please use a different email or sign in.' });
          }
          return res.status(400).json({ error: 'Username or email is already taken.' });
        }
        return res.status(500).json({ error: 'Database error during user insert' });
      }

      // Step 1: Create 'users' folder if it doesn't exist
      const userDbDir = path.join(__dirname, 'users');
      if (!fs.existsSync(userDbDir)) {
        fs.mkdirSync(userDbDir);
      }

      // Step 2: Create new SQLite DB for the user
      const userDbPath = path.join(userDbDir, `${username}.db`);
      const userDb = new sqlite3.Database(userDbPath, (err) => {
        if (err) {
          console.error('Error creating user DB:', err);
          return res.status(500).json({ error: 'Error creating user database' });
        }

        // Step 3: Create required tables
        userDb.serialize(() => {
          userDb.run(`
            CREATE TABLE IF NOT EXISTS profile (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              display_name TEXT,
              bio TEXT,
              moviewatchtime INTEGER DEFAULT 0,
              serieswatchtime INTEGER DEFAULT 0
            )
          `);
          // Fixed movie_list table with UNIQUE constraint on title
          userDb.run(`
            CREATE TABLE IF NOT EXISTS movie_list (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              title TEXT UNIQUE,
              rating INTEGER
            )
          `);
          userDb.run(`
            CREATE TABLE IF NOT EXISTS series_list (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              title TEXT,
              seasons INTEGER,
              episodes INTEGER,
              rating INTEGER
            )
          `, (tableErr) => {
            if (tableErr) {
              console.error('Error creating tables:', tableErr);
              return res.status(500).json({ error: 'Error setting up user database tables' });
            }

            res.json({ message: 'User registered successfully and user database created.' });
          });
        });

        userDb.close();
      });
    });
  } catch (error) {
    console.error('Error hashing password:', error);
    res.status(500).json({ error: 'Error hashing password' });
  }
});

// Login user
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const query = `SELECT * FROM users WHERE email = ?`;
  
  db.get(query, [email], async (err, row) => {
    if (err) {
      console.error('Database error during login:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log('Found user in database:', { 
      id: row.id, 
      username: row.username, 
      email: row.email 
    });

    try {
      const match = await bcrypt.compare(password, row.password);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Authentication successful
      const responseData = { 
        message: 'Logged in successfully',
        user: {
          id: row.id,
          username: row.username,
          email: row.email
        }
      };
      
      console.log('Sending login response:', responseData);
      res.json(responseData);
    } catch (error) {
      console.error('Error verifying password:', error);
      res.status(500).json({ error: 'Error verifying password' });
    }
  });
});

// Optional: Check if username is available (for real-time validation)
app.get('/api/check-username/:username', (req, res) => {
  const { username } = req.params;
  
  if (!username) {
    return res.status(400).json({ error: 'Username required' });
  }

  const query = `SELECT username FROM users WHERE username = ?`;
  
  db.get(query, [username], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({ available: !row });
  });
});

// Fixed rate-movie endpoint
app.post('/api/rate-movie', (req, res) => {
  const { username, title, rating } = req.body;
  
  if (!username || !title) {
    return res.status(400).json({ error: 'Username and title are required' });
  }

  const dbPath = path.resolve(`./users/${username}.db`);
  
  // Check if user database exists
  if (!fs.existsSync(dbPath)) {
    return res.status(404).json({ error: 'User database not found' });
  }

  const userDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening user database:', err);
      return res.status(500).json({ error: 'Error opening user database' });
    }

    // First check if movie already exists
    userDb.get(
      'SELECT id FROM movie_list WHERE title = ?',
      [title],
      (err, row) => {
        if (err) {
          console.error('Error checking existing movie:', err);
          userDb.close();
          return res.status(500).json({ error: 'Database error' });
        }

        if (row) {
          // Movie exists, update it
          userDb.run(
            'UPDATE movie_list SET rating = ? WHERE title = ?',
            [rating, title],
            function (err) {
              if (err) {
                console.error('Error updating movie:', err);
                userDb.close();
                return res.status(500).json({ error: 'Error updating movie rating' });
              }
              
              userDb.close();
              console.log(`Movie "${title}" rating updated to ${rating} for user ${username}`);
              res.json({ message: 'Movie rating updated successfully' });
            }
          );
        } else {
          // Movie doesn't exist, insert new
          userDb.run(
            'INSERT INTO movie_list (title, rating) VALUES (?, ?)',
            [title, rating],
            function (err) {
              if (err) {
                console.error('Error inserting movie:', err);
                userDb.close();
                return res.status(500).json({ error: 'Error saving movie rating' });
              }
              
              userDb.close();
              console.log(`Movie "${title}" rated ${rating} by user ${username}`);
              res.json({ message: 'Movie rating saved successfully' });
            }
          );
        }
      }
    );
  });
});

// Get user's movie ratings (optional endpoint for debugging)
app.get('/api/user-movies/:username', (req, res) => {
  const { username } = req.params;
  const dbPath = path.resolve(`./users/${username}.db`);
  
  if (!fs.existsSync(dbPath)) {
    return res.status(404).json({ error: 'User database not found' });
  }

  const userDb = new sqlite3.Database(dbPath);
  userDb.all('SELECT * FROM movie_list', [], (err, rows) => {
    if (err) {
      console.error('Error fetching movies:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    userDb.close();
    res.json({ movies: rows });
  });
});

// Debug endpoint to check what's in the database
app.get('/api/debug/users', (req, res) => {
  const query = `SELECT id, username, email FROM users`;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({ users: rows });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});