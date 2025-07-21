import React from 'react';
import Card from '../components/Card';
import '../styles/Home.css';

const Home: React.FC = () => {
  return (
    <div className="home">
      <h1>Welcome to Movieah</h1>
      <p className="subtitle">Your ultimate destination for movies and TV series</p>
      
      <div className="card-container">
        <Card 
          title="Movies" 
          description="Explore our collection of blockbuster movies from different genres" 
          link="/movies" 
          imageSrc="/movies.jpg" 
        />
        <Card 
          title="TV Series" 
          description="Discover the best TV shows and series from around the world" 
          link="/series" 
          imageSrc="/tvshows.jpg" 
        />
      </div>
    </div>
  );
};

export default Home; 