'use client';

import React, { useState, useEffect } from 'react';

const Loading = () => {
  const [loadingProgress, setLoadingProgress] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 30); // Update every 30ms for smooth counting

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style jsx>{`
        .loading-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #000000;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .loading-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .loading-text {
          position: absolute;
          bottom: 5%;
          right: 5%;
          text-align: right;
          z-index: 10;
        }
        
        .loading-text h1 {
          color: #ffffff;
          font-weight: 400;
          font-family: 'Hacker';
          margin: 0;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
          animation: pulse 2s infinite;
          line-height: 1.2;
        }
        
        .hold-on {
          font-size: 3rem;
          display: block;
          margin-bottom: 0.5rem;
        }
        
        .feelme-town {
          font-size: 1.5rem;
          display: block;
          color: #FF0005;
        }
        
        .is-loading {
          font-size: 2.5rem;
          display: block;
        }
        
        .loading-counter {
          position: absolute;
          bottom: 5%;
          left: 5%;
          color: #ffffff;
          font-family: 'Hacker', monospace;
          font-size: 2rem;
          font-weight: 400;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
          z-index: 10;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.8;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
        }
        
        @media (max-width: 768px) {
          .loading-video {
            width: 100%;
            height: 56.25%; /* 16:9 aspect ratio */
            object-fit: cover;
            max-height: 90vh;
          }
          
          .loading-text {
            right: 2%;
            bottom: 2%;
          }
          
          .hold-on {
            font-size: 1.5rem;
            color: #FF0005;
            text-shadow: 0 0 10px rgba(255, 0, 5, 0.8);
            margin-bottom: 0.3rem;
          }
          
          .feelme-town {
            font-size: 1rem;
          }
          
          .is-loading {
            font-size: 1.2rem;
            color: #ffffff;
            text-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
          }
          
          .loading-counter {
            font-size: 1.3rem;
            bottom: 2%;
            left: 2%;
          }
        }
        
        @media (max-width: 480px) {
          .loading-video {
            width: 100%;
            height: 56.25%; /* 16:9 aspect ratio */
            object-fit: cover;
            max-height: 85vh;
          }
          
          .loading-text {
            right: 1%;
            bottom: 1%;
          }
          
          .hold-on {
            font-size: 1.2rem;
            color: #FF0005;
            text-shadow: 0 0 8px rgba(255, 0, 5, 0.8);
            margin-bottom: 0.2rem;
          }
          
          .feelme-town {
            font-size: 0.9rem;
          }
          
          .is-loading {
            font-size: 1rem;
            color: #ffffff;
            text-shadow: 0 0 6px rgba(255, 255, 255, 0.6);
          }
          
          .loading-counter {
            font-size: 1rem;
            bottom: 1%;
            left: 1%;
          }
        }
      `}</style>
      
      <div className="loading-container">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="loading-video"
        >
          <source src="/loading.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        <div className="loading-text">
          <h1>
            <span className="hold-on">HOLD ON</span>
            
            <span className="is-loading">Loading...</span>
          </h1>
        </div>
        
        <div className="loading-counter">
          {loadingProgress}
        </div>
      </div>
    </>
  );
};

export default Loading;