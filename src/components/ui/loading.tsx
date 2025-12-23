'use client';

import { useEffect, useState } from 'react';

import { ShaderAnimation } from './shader-animation';

const Loading = () => {
  const [loadingProgress, setLoadingProgress] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 30);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="loading-root">
      {/* Text overlay - always visible */}
      <div className="overlay">
        <span className="overlay-overline">FeelME Town</span>
        <h1 className="overlay-heading">Curating your private world</h1>
        <p className="overlay-subtitle">Please hold on while we set the ambience.</p>
      </div>

      {/* Shader Animation - loads in background */}
      <div className="animation-layer">
        <ShaderAnimation />
      </div>

      {/* Progress indicator */}
      <div className="progress-indicator">{loadingProgress}%</div>

      <style jsx>{`
        .loading-root {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
          overflow: hidden;
        }

        .animation-layer {
          position: absolute;
          inset: 0;
          opacity: 0.5; /* Set to 50% opacity by default */
          transition: opacity 0.5s ease-in-out;
        }

        .animation-layer :global(div) {
          width: 100% !important;
          height: 100% !important;
        }

        .overlay {
          position: relative;
          z-index: 2;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 2rem;
          pointer-events: none;
        }

        .overlay-overline {
          color: rgba(255, 255, 255, 0.65);
          font-family: 'Paralucent-Medium', Arial, sans-serif;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          font-size: 0.75rem;
        }

        .overlay-heading {
          margin: 0;
          font-size: clamp(2rem, 4vw, 3.5rem);
          font-family: 'Paralucent-DemiBold', Arial, sans-serif;
          color: #ffffff;
          text-shadow: 0 0 30px rgba(255, 0, 5, 0.45);
          letter-spacing: 0.05em;
        }

        .overlay-subtitle {
          margin: 0;
          font-size: clamp(1rem, 2vw, 1.25rem);
          color: rgba(255, 255, 255, 0.8);
          font-family: 'Paralucent-Medium', Arial, sans-serif;
        }

        .progress-indicator {
          position: absolute;
          bottom: 2.5rem;
          right: 3rem;
          z-index: 2;
          font-family: 'Hacker', monospace;
          font-size: 1.75rem;
          color: rgba(255, 255, 255, 0.9);
          text-shadow: 0 0 12px rgba(255, 0, 5, 0.6);
        }

        @media (max-width: 768px) {
          .overlay {
            gap: 0.5rem;
            padding: 1.5rem;
          }

          .overlay-overline {
            font-size: 0.65rem;
            letter-spacing: 0.3em;
          }

          .overlay-heading {
            font-size: clamp(1.75rem, 8vw, 2.5rem);
            letter-spacing: 0.04em;
          }

          .overlay-subtitle {
            font-size: clamp(0.95rem, 3vw, 1.1rem);
          }

          .progress-indicator {
            bottom: 1.5rem;
            right: 1.75rem;
            font-size: 1.25rem;
          }
        }

        @media (max-width: 480px) {
          .overlay {
            padding: 1.25rem;
          }

          .overlay-overline {
            font-size: 0.6rem;
            letter-spacing: 0.25em;
          }

          .progress-indicator {
            bottom: 1.25rem;
            right: 1.25rem;
            font-size: 1.1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Loading;