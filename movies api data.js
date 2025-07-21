const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('moviedata.db');

(async () => {
  for (let i = 1; i <= 1807; i++) {
    try {
      const url = `https://moviesapi.to/api/discover/movie?direction=desc&page=${i}`;
      const response = await fetch(url);
      const data = await response.json();

      for (const movie of data.data) {
        const id = movie.tmdbid;
        const orig_title = movie.orig_title;
        const year = movie.year;

        console.log(`ID: ${id}, Title: ${orig_title}, Year: ${year}`);

        db.get(
          `SELECT 1 FROM moviesclub WHERE id = ?`,
          [id],
          (err, row) => {
            if (err) {
              console.error(`DB Select Error: ${err.message}`);
              return;
            }

            if (!row) {
              db.run(
                `INSERT INTO moviesclub (id, name, year) VALUES (?, ?, ?)`,
                [id, orig_title, year],
                insertErr => {
                  if (insertErr) {
                    console.error(`DB Insert Error: ${insertErr.message}`);
                  }
                }
              );
            } else {
              console.log(`Movie with ID ${id} already exists. Skipping.`);
            }
          }
        );
      }
    } catch (error) {
      console.error(`Fetch Error on page ${i}:`, error.message);
    }
  }
})();
