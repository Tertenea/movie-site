import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Card.css';

interface CardProps {
  title: string;
  description: string;
  link: string;
  imageSrc: string;
}

const Card: React.FC<CardProps> = ({ title, description, link, imageSrc }) => {
  return (
    <Link to={link} className="card">
      <div className="card-image">
        <img src={imageSrc} alt={title} />
      </div>
      <div className="card-content">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </Link>
  );
};

export default Card; 