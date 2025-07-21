# Movie Site

A simple React TypeScript website for browsing movies and TV series.

## Features

- Home page with cards for Movies and Series sections
- Movies page with a grid of movie cards from SQLite database
- Series page with placeholder content
- Responsive design

## Prerequisites

- Node.js (v14 or higher)
- npm

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create the sample database:
   ```
   node create-sample-db.js
   ```
4. Install server dependencies:
   ```
   cd server
   npm install
   cd ..
   ```

## Running the Application

### Start the backend server

```
cd server
npm start
```

The server will run on http://localhost:3001

### Start the React frontend

In a new terminal window:

```
npm start
```

The application will run on http://localhost:3000

## Project Structure

- `src/` - React frontend code
  - `components/` - Reusable UI components
  - `pages/` - Page components (Home, Movies, Series)
  - `services/` - API services for data fetching
  - `styles/` - CSS stylesheets
  - `assets/` - Images and other static assets
- `server/` - Express backend API server
- `moviedata.db` - SQLite database with movie data

## How It Works

1. The Express server connects to the SQLite database and provides API endpoints
2. The React frontend fetches movie data from the backend API
3. The Movies page displays a grid of movie cards
4. Clicking on a movie card opens a popup with an embedded movie player
