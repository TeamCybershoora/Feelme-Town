'use client';

import React, { useState, useEffect } from 'react';

const Loading = () => {
  const [progress, setProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Set client-side flag and mounted state
  useEffect(() => {
    setIsClient(true);
    setMounted(true);
  }, []);

  // Progress animation
  useEffect(() => {
    if (!isClient) return;
    
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setShowContent(true), 800);
          return 100;
        }
        // Simulate realistic loading with occasional pauses
        const increment = Math.random() > 0.8 ? 0 : Math.random() * 12 + 3;
        return Math.min(prev + increment, 100);
      });
    }, 150);

    return () => clearInterval(timer);
  }, [isClient]);

  // Show loading placeholder during SSR
  if (!mounted) {
    return (
      <div className="loading-container">
        <div className="loading-overlay"></div>
        <div className="loading-content">
          <div className="loading-logo-container">
            <img 
              src="/text.png" 
              alt="Feel The Town" 
              className="loading-logo"
            />
          </div>
          <p className="loading-text">
            Loading your premium experience...
          </p>
          <div className="loading-progress-container">
            <div className="loading-progress-bar" style={{ width: '0%' }}></div>
          </div>
          <p className="loading-percentage">
            0%
          </p>
        </div>
      </div>
    );
  }

  if (showContent) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundImage: 'url(/load-bg.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 1s ease-in-out'
      }}>
        <div style={{ textAlign: 'center' }}>
          {/* Logo Image */}
          <div style={{
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <img 
              src="/text.png" 
              alt="Feel The Town" 
              style={{
                height: '150px',
                width: 'auto',
                filter: 'drop-shadow(0 0 30px rgba(255, 255, 255, 0.4))',
                maxWidth: '90vw'
              }}
              className="logo-image"
            />
          </div>
          
          <p style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: '300' }}>
            Welcome to your cinematic universe
          </p>
          <div style={{
            marginTop: '2rem',
            width: '8rem',
            height: '0.25rem',
            background: 'linear-gradient(135deg, #dc2626, #ef4444)',
            margin: '2rem auto 0',
            borderRadius: '0.125rem'
          }}></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: 'url(/load-bg.jpeg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Dark overlay for better text visibility */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)'
      }}></div>

      {/* Main content */}
      <div style={{ 
        textAlign: 'center', 
        zIndex: 10,
        position: 'relative'
      }}>
        {/* Logo Image */}
        <div style={{
          marginBottom: '3rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <img 
            src="/text.png" 
            alt="Feel The Town" 
            style={{
              height: '120px',
              width: 'auto',
              filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))',
              maxWidth: '90vw'
            }}
            className="logo-image"
          />
        </div>
        
        <p style={{ 
          fontSize: '1.25rem', 
          marginBottom: '3rem',
          color: 'rgba(255, 255, 255, 0.8)'
        }}>
          Loading your premium experience...
        </p>

        {/* Progress bar */}
        <div style={{
          width: '300px',
          height: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '2px',
          margin: '0 auto 1rem',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(135deg, #dc2626, #ef4444)',
            transition: 'width 0.3s ease',
            borderRadius: '2px'
          }}></div>
        </div>

        <p style={{ 
          fontSize: '1rem', 
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          {Math.floor(progress)}%
        </p>
      </div>

      {/* Custom CSS for animations and responsive design */}
      <style jsx global>{`
        .loading-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url(/load-bg.jpeg);
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
        }
        
        .loading-content {
          text-align: center;
          z-index: 10;
          position: relative;
        }
        
        .loading-logo-container {
          margin-bottom: 3rem;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .loading-logo {
          height: 120px;
          width: auto;
          filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.3));
          max-width: 90vw;
        }
        
        .loading-text {
          font-size: 1.25rem;
          margin-bottom: 3rem;
          color: rgba(255, 255, 255, 0.8);
        }
        
        .loading-progress-container {
          width: 300px;
          height: 4px;
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
          margin: 0 auto 1rem;
          overflow: hidden;
        }
        
        .loading-progress-bar {
          height: 100%;
          background: linear-gradient(135deg, #dc2626, #ef4444);
          transition: width 0.3s ease;
          border-radius: 2px;
        }
        
        .loading-percentage {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.6);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Mobile responsive styles */
        @media (max-width: 768px) {
          .loading-logo {
            height: 80px !important;
            max-width: 80vw !important;
          }
        }
        
        @media (max-width: 480px) {
          .loading-logo {
            height: 60px !important;
            max-width: 85vw !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Loading;