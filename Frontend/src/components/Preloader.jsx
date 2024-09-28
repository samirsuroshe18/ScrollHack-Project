import React from 'react';
import '../assets/Preloader.css'

const Preloader = () => {
    return (
      <div className="preloader">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          width="150px"
          height="150px"
          className="logo-svg"
        >
          
          <polygon
            points="50,15 85,85 15,85"
            fill="url(#gradient1)"
            stroke="none"
            className="triangle"
          />
          
          
          <circle
            cx="50"
            cy="50"
            r="38"
            stroke="url(#gradient2)"
            strokeWidth="4"
            fill="none"
            className="ring"
          />
  
          
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: "#ffb600", stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: "#7b2cbf", stopOpacity: 1 }} />
            </linearGradient>
  
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: "#ffb600", stopOpacity: 0.5 }} />
              <stop offset="100%" style={{ stopColor: "#7b2cbf", stopOpacity: 0.5 }} />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  };

export default Preloader;
