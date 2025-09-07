'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Movie {
  id: number;
  title: string;
  year: number;
  rating: number;
  image: string;
  description: string;
  isSubscription: boolean;
  isFollowing: boolean;
  genre?: string;
}

interface MoviePopupProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MoviePopup({ movie, isOpen, onClose }: MoviePopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Disable web app completely
      document.body.style.overflow = 'hidden';
      document.body.style.pointerEvents = 'none';
      document.body.style.userSelect = 'none';
      
      // Re-enable pointer events only for popup
      const popupElement = document.querySelector('.popup-overlay');
      if (popupElement) {
        (popupElement as HTMLElement).style.pointerEvents = 'auto';
      }
    } else {
      setIsVisible(false);
      // Re-enable web app
      document.body.style.overflow = 'unset';
      document.body.style.pointerEvents = 'auto';
      document.body.style.userSelect = 'auto';
    }

    return () => {
      // Cleanup - re-enable web app
      document.body.style.overflow = 'unset';
      document.body.style.pointerEvents = 'auto';
      document.body.style.userSelect = 'auto';
    };
  }, [isOpen]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  if (!isOpen || !movie) return null;

  return (
    <div 
      className={`popup-overlay ${isVisible ? 'visible' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className="popup-container">
        <button className="close-button" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="popup-content">
          <div className="movie-image-section">
            <div className="image-container">
              <Image
                src={movie.image}
                alt={movie.title}
                fill
                className="popup-image"
                style={{ objectFit: 'cover' }}
                onError={(e) => { (e.target as HTMLImageElement).src = '/bg.png'; }}
              />
              <div className="image-overlay">
                <div className="rating-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  <span>{movie.rating}</span>
                </div>
                {movie.isFollowing && (
                  <div className="following-badge">Following Now</div>
                )}
                {movie.isSubscription && (
                  <div className="subscription-badge">Subscription</div>
                )}
              </div>
            </div>
          </div>

          <div className="movie-details-section">
            <div className="movie-header">
              <h1 className="movie-title">{movie.title}</h1>
              <div className="movie-year">({movie.year})</div>
            </div>

            <div className="movie-description">
              <h3>Description</h3>
              <p>{movie.description}</p>
            </div>

            <div className="movie-actions">
              <button className="play-button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5V19L19 12L8 5Z" />
                </svg>
                <span>Play Now</span>
              </button>
              <button className="add-to-list-button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 5V19M5 12H19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Add to List</span>
              </button>
            </div>
          </div>
        </div>

        <style jsx>{`
          .popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.95);
            backdrop-filter: blur(15px);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            overflow-y: auto;
            pointer-events: auto;
          }

          .popup-overlay.visible {
            opacity: 1;
            visibility: visible;
          }

          .popup-container {
            background: linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%);
            border-radius: 20px;
            border: 1px solid rgba(139, 69, 255, 0.3);
            max-width: 900px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            transform: scale(0.9) translateY(20px);
            transition: all 0.3s ease;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8);
            pointer-events: auto;
          }

          .popup-overlay.visible .popup-container {
            transform: scale(1) translateY(0);
          }

          .close-button {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            cursor: pointer;
            transition: all 0.3s ease;
            z-index: 10;
            backdrop-filter: blur(10px);
          }

          .close-button:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: scale(1.1);
          }

          .popup-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            padding: 2rem;
          }

          .movie-image-section {
            position: relative;
          }

          .image-container {
            position: relative;
            width: 100%;
            height: 400px;
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid rgba(139, 69, 255, 0.2);
          }

          .popup-image {
            transition: transform 0.3s ease;
          }

          .image-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(
              180deg,
              rgba(0, 0, 0, 0.1) 0%,
              rgba(0, 0, 0, 0.3) 50%,
              rgba(0, 0, 0, 0.7) 100%
            );
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 1rem;
          }

          .rating-badge {
            display: flex;
            align-items: center;
            gap: 6px;
            background: rgba(0, 0, 0, 0.8);
            padding: 8px 12px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            align-self: flex-start;
          }

          .rating-badge svg {
            color: #FFD700;
          }

          .rating-badge span {
            color: #fff;
            font-size: 1rem;
            font-weight: 600;
            font-family: 'Paralucent-Medium', Arial, sans-serif;
          }

          .following-badge {
            background: linear-gradient(135deg, #8b45ff, #6b2cff);
            color: #fff;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            font-family: 'Paralucent-Medium', Arial, sans-serif;
            align-self: flex-start;
            animation: pulse 2s infinite;
          }

          .subscription-badge {
            background: linear-gradient(135deg, #ff6b35, #ff8c42);
            color: #fff;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.7rem;
            font-weight: 600;
            font-family: 'Paralucent-Medium', Arial, sans-serif;
            align-self: flex-start;
            margin-top: 8px;
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }

          .movie-details-section {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }

          .movie-header {
            text-align: left;
          }

          .movie-title {
            color: #ffffff;
            font-size: 2.5rem;
            font-weight: 700;
            font-family: 'Paralucent-DemiBold', Arial, sans-serif;
            margin: 0 0 0.5rem 0;
            line-height: 1.2;
            text-shadow: 0 0 20px rgba(139, 69, 255, 0.3);
          }

          .movie-year {
            color: rgba(255, 255, 255, 0.8);
            font-size: 1.2rem;
            font-weight: 400;
            font-family: 'Paralucent-Medium', Arial, sans-serif;
          }

          .movie-description h3 {
            color: #ffffff;
            font-size: 1.3rem;
            font-weight: 600;
            font-family: 'Paralucent-DemiBold', Arial, sans-serif;
            margin: 0 0 1rem 0;
          }

          .movie-description p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 1rem;
            line-height: 1.6;
            font-family: 'Paralucent-Medium', Arial, sans-serif;
            margin: 0;
          }

          .movie-actions {
            display: flex;
            gap: 1rem;
            margin-top: auto;
          }

          .play-button {
            background: linear-gradient(135deg, #8b45ff 0%, #6b2cff 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 600;
            font-family: 'Paralucent-Medium', Arial, sans-serif;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
            flex: 1;
            justify-content: center;
          }

          .play-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(139, 69, 255, 0.4);
          }

          .add-to-list-button {
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 600;
            font-family: 'Paralucent-Medium', Arial, sans-serif;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
          }

          .add-to-list-button:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
          }

          /* Mobile Styles */
          @media (max-width: 768px) {
            .popup-overlay {
              padding: 1rem;
              align-items: center;
            }

            .popup-container {
              max-height: 95vh;
              border-radius: 16px;
            }

            .popup-content {
              grid-template-columns: 1fr;
              gap: 1.5rem;
              padding: 1.5rem;
            }

            .image-container {
              height: 250px;
            }

            .movie-title {
              font-size: 1.8rem;
            }

            .movie-year {
              font-size: 1rem;
            }

            .movie-description h3 {
              font-size: 1.1rem;
            }

            .movie-description p {
              font-size: 0.9rem;
            }

            .movie-actions {
              flex-direction: column;
            }

            .play-button,
            .add-to-list-button {
              padding: 14px 20px;
              font-size: 0.9rem;
            }

            .close-button {
              top: 15px;
              right: 15px;
              width: 35px;
              height: 35px;
            }
          }

          @media (max-width: 480px) {
            .popup-overlay {
              padding: 0.5rem;
              align-items: center;
            }

            .popup-content {
              padding: 1rem;
              gap: 1rem;
            }

            .image-container {
              height: 200px;
            }

            .movie-title {
              font-size: 1.5rem;
            }

            .movie-year {
              font-size: 0.9rem;
            }

            .movie-description h3 {
              font-size: 1rem;
            }

            .movie-description p {
              font-size: 0.85rem;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
