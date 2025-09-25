'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Search, Play, Filter } from 'lucide-react';

type Industry =
  | 'ALL'
  | 'BOLLYWOOD'
  | 'TOLLYWOOD'
  | 'KOLLYWOOD'
  | 'MOLLYWOOD'
  | 'SANDALWOOD'
  | 'MARATHI'
  | 'PUNJABI'
  | 'BENGALI';

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

interface MovieSelectionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMovies: string[];
  onMoviesSelected: (movies: string[]) => void;
}

function mapIndustry(industry: Industry) {
  switch (industry) {
    case 'BOLLYWOOD':   return { region: 'IN', language: 'hi-IN', wol: 'hi' };
    case 'TOLLYWOOD':   return { region: 'IN', language: 'te-IN', wol: 'te' };
    case 'KOLLYWOOD':   return { region: 'IN', language: 'ta-IN', wol: 'ta' };
    case 'MOLLYWOOD':   return { region: 'IN', language: 'ml-IN', wol: 'ml' };
    case 'SANDALWOOD':  return { region: 'IN', language: 'kn-IN', wol: 'kn' };
    case 'MARATHI':     return { region: 'IN', language: 'mr-IN', wol: 'mr' };
    case 'PUNJABI':     return { region: 'IN', language: 'pa-IN', wol: 'pa' };
    case 'BENGALI':     return { region: 'IN', language: 'bn-IN', wol: 'bn' };
    case 'ALL':
    default:            return { region: '', language: 'en-US', wol: '' };
  }
}

// Movie Card Component
function MovieCard({ 
  movie, 
  isSelected, 
  onSelect 
}: { 
  movie: Movie; 
  isSelected: boolean; 
  onSelect: (movie: Movie) => void; 
}) {
  const [isHovered, setIsHovered] = useState(false);

  const handleCardClick = () => {
    onSelect(movie);
  };

  return (
    <div
      className={`movie-card ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      style={{
        background: 'linear-gradient(145deg, #0f0f0f 0%, #1a1a1a 60%, #111111 100%)',
        borderRadius: '28px',
        overflow: 'hidden',
        border: isSelected ? '3px solid #ff3366' : '1px solid rgba(255, 255, 255, 0.06)',
        position: 'relative',
        cursor: 'pointer',
        aspectRatio: '4/5',
        width: '100%',
        display: 'block',
        boxShadow: isSelected ? '0 0 20px rgba(255, 51, 102, 0.5)' : '0 20px 60px rgba(0, 0, 0, 0.5)'
      }}
    >
      <div className="card-image-container" style={{
        position: 'relative',
        width: '100%',
        height: '100%'
      }}>
        <img
          src={movie.image}
          alt={movie.title}
          className="card-image"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block'
          }}
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450/1a1a1a/ffffff?text=No+Image'; }}
        />
        {/* Black Gradient Overlay */}
        <div className="gradient-overlay" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.9) 100%)',
          zIndex: 1
        }}></div>
        
        {/* Rating in Top Right Corner */}
        <div className="rating-corner" style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 3
        }}>
          <div className="rating" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(0, 0, 0, 0.8)',
            padding: '8px 12px',
            borderRadius: '20px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFD700" style={{ color: '#FFD700' }}>
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            <span style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: '600' }}>{movie.rating}</span>
          </div>
        </div>
        
        {/* Movie Title and Description Overlay */}
        <div className="movie-title-overlay" style={{
          position: 'absolute',
          bottom: '1rem',
          left: '1rem',
          zIndex: 2
        }}>
          <h3 className="movie-title" style={{
            color: '#ffffff',
            fontSize: '0.9rem',
            fontWeight: '700',
            margin: '0 0 8px 0',
            lineHeight: '1.3',
            textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
            textAlign: 'left'
          }} title={movie.title}>{movie.title}</h3>
          <p className="movie-year" style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '1.0rem',
            fontWeight: '500',
            margin: '0',
            textShadow: '1px 1px 4px rgba(0,0,0,0.8)',
            textAlign: 'left'
          }}>({movie.year})</p>
        </div>
        {isSelected && (
          <div className="movie-selection-checkmark" style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            background: 'linear-gradient(135deg, #ff3366 0%, #ff1744 100%)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '3',
            boxShadow: '0 4px 12px rgba(255, 51, 102, 0.4)',
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}>
            <Check className="w-5 h-5" style={{ color: '#ffffff' }} />
          </div>
        )}
        {movie.isFollowing && <div className="following-badge">Following Now</div>}
        {movie.isSubscription && <div className="subscription-badge">Subscription</div>}
      </div>
    </div>
  );
}

export default function MovieSelectionPopup({ 
  isOpen, 
  onClose, 
  selectedMovies, 
  onMoviesSelected 
}: MovieSelectionPopupProps) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tempSelectedMovies, setTempSelectedMovies] = useState<string[]>(selectedMovies);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<Industry>('ALL');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedRows, setSelectedRows] = useState(3);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch movies from API
  const fetchMovies = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const map = mapIndustry(selectedIndustry);
      const params = new URLSearchParams({
        page: String(currentPage),
        language: selectedLanguage || map.language || 'en-US',
      });

      // Industry-only filters when not searching
      if (!searchTerm && map.region) params.set('region', map.region);
      if (!searchTerm && map.wol) params.set('wol', map.wol);

      // Search or Discover filters
      if (searchTerm) params.set('query', searchTerm);
      if (!searchTerm && selectedYear) params.set('year', selectedYear);
      if (!searchTerm && selectedGenre) params.set('genre', selectedGenre);

      console.log('Fetching movies with params:', {
        searchTerm,
        selectedYear,
        selectedGenre,
        selectedIndustry,
        selectedLanguage,
        currentPage,
        url: `/api/tmdb?${params.toString()}`,
        allParams: params.toString()
      });

      const response = await fetch(`/api/tmdb?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch movies');
        
      const data = await response.json();
      console.log('API Response:', data);

      const transformed: Movie[] = (data.results ?? []).map((m: unknown, index: number) => {
        const movie = m as {
          id: number;
          title?: string;
          name?: string;
          release_date?: string;
          first_air_date?: string;
          vote_average?: number;
          poster_path?: string;
          overview?: string;
          genre_ids?: number[];
        };
        return {
          id: movie.id,
          title: movie.title ?? movie.name ?? 'Untitled',
          year: movie.release_date
            ? new Date(movie.release_date).getFullYear()
            : (movie.first_air_date ? new Date(movie.first_air_date).getFullYear() : 2023),
          rating: parseFloat(((movie.vote_average ?? 0) / 2).toFixed(1)), // 10 -> 5 scale
          image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/bg.png',
          description: movie.overview || 'No description available',
          isSubscription: Math.random() > 0.6,
          isFollowing: index < 3,
          genre: Array.isArray(movie.genre_ids) && movie.genre_ids.length ? String(movie.genre_ids[0]) : 'Action',
        };
      });

      console.log('Transformed movies:', transformed);
      setMovies(transformed);
    } catch (err) {
      setError('Failed to load movies. Please try again later.');
      // Fallback movies
      const fallbackMovies: Movie[] = [
        {
          id: 1, title: 'The Dark Knight', year: 2008, rating: 4.8,
          image: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg', 
          description: 'Batman faces the Joker in this epic superhero film.',
          isSubscription: false, isFollowing: true, genre: 'Action'
        },
        {
          id: 2, title: 'Inception', year: 2010, rating: 4.6,
          image: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg', 
          description: 'A mind-bending thriller about dreams within dreams.',
          isSubscription: true, isFollowing: false, genre: 'Sci-Fi'
        }
      ];
      setMovies(fallbackMovies);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, selectedYear, selectedGenre, selectedIndustry, selectedLanguage]);

  // Initialize movies on mount
  useEffect(() => {
    if (isOpen) {
      setTempSelectedMovies(selectedMovies);
      setSearchTerm('');
      setSelectedYear('');
      setSelectedGenre('');
      setSelectedIndustry('ALL');
      setSelectedLanguage('');
      setSelectedRows(3);
      setCurrentPage(1);
    }
  }, [isOpen, selectedMovies]);

  // Fetch movies when filters change (like movies page)
  useEffect(() => {
    if (isOpen) {
      fetchMovies();
    }
  }, [isOpen, currentPage, searchTerm, selectedYear, selectedGenre, selectedIndustry, selectedLanguage, fetchMovies]);


  // Client-side filter (like movies page)
  useEffect(() => {
    const filtered = movies.filter((movie) => {
      const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesYear = !selectedYear || movie.year.toString() === selectedYear;
      const matchesGenre = !selectedGenre || movie.genre === selectedGenre;
      return matchesSearch && matchesYear && matchesGenre;
    });
    setFilteredMovies(filtered);
  }, [movies, searchTerm, selectedYear, selectedGenre]);

  // Helper functions to convert IDs to names
  const getGenreName = (genreId: string) => {
    const genreMap: { [key: string]: string } = {
      '28': 'Action', '12': 'Adventure', '16': 'Animation', '35': 'Comedy',
      '80': 'Crime', '99': 'Documentary', '18': 'Drama', '10751': 'Family',
      '14': 'Fantasy', '36': 'History', '27': 'Horror', '10402': 'Music',
      '9648': 'Mystery', '10749': 'Romance', '878': 'Sci-Fi', '10770': 'TV Movie',
      '53': 'Thriller', '10752': 'War', '37': 'Western'
    };
    return genreMap[genreId] || genreId;
  };

  const getLanguageName = (languageCode: string) => {
    const languageMap: { [key: string]: string } = {
      'en-US': 'English', 'hi-IN': 'Hindi', 'es-ES': 'Spanish', 'fr-FR': 'French',
      'de-DE': 'German', 'it-IT': 'Italian', 'ja-JP': 'Japanese', 'ko-KR': 'Korean',
      'zh-CN': 'Chinese', 'pt-BR': 'Portuguese', 'ru-RU': 'Russian', 'ar-SA': 'Arabic'
    };
    return languageMap[languageCode] || languageCode;
  };

  // Handle filter changes
  const handleFilterChange = (filterType: string, value: string) => {
    console.log(`Filter changed: ${filterType} = ${value}`);
    // Reset to first page when filters change
    setCurrentPage(1);
    // The useEffect will handle the API call
  };

  // Handle movie selection (single selection only)
  const handleMovieSelection = (movie: Movie) => {
    setTempSelectedMovies(prev => 
      prev.includes(movie.title)
        ? [] // Deselect if already selected
        : [movie.title] // Select only this movie (single selection)
    );
  };

  // Handle confirm selection
  const handleConfirm = () => {
    onMoviesSelected(tempSelectedMovies);
    onClose();
  };

  // Handle cancel
  const handleCancel = () => {
    setTempSelectedMovies(selectedMovies);
    onClose();
  };

  if (!isOpen) return null;

  const popupContent = (
    <div className="movie-selection-overlay">
      <div className="movie-selection-popup">
        {/* Header */}
        <div className="movie-selection-header">
          <div className="movie-selection-title-section">
            <h2 className="movie-selection-title">
              <Play className="w-7 h-7 text-red-500" />
              Select Movie
            </h2>
            <p className="movie-selection-description">
              Choose your preferred movie for the theater experience
              {filteredMovies.length > 0 && (
                <span className="movie-selection-count">
                  ({filteredMovies.length} movies available)
                </span>
              )}
            </p>
          </div>
          <button 
            onClick={handleCancel}
            className="movie-selection-close-btn"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filter Options */}
        <div className="movie-selection-filters">
          <div className="filter-row single-row">
            <div className="filter-group">
              <label style={{ fontSize: '0.7rem' }}>Industry:</label>
              <select
                value={selectedIndustry}
                onChange={(e) => {
                  const value = e.target.value as Industry;
                  setSelectedIndustry(value);
                  handleFilterChange('industry', value);
                }}
                className="filter-select"
                style={{ fontSize: '0.7rem', padding: '2px 6px', height: '25px' }}
              >
                <option value="ALL">All Industries</option>
                <option value="BOLLYWOOD">Bollywood (Hindi)</option>
                <option value="TOLLYWOOD">Tollywood (Telugu)</option>
                <option value="KOLLYWOOD">Kollywood (Tamil)</option>
                <option value="MOLLYWOOD">Mollywood (Malayalam)</option>
                <option value="SANDALWOOD">Sandalwood (Kannada)</option>
                <option value="MARATHI">Marathi Cinema</option>
                <option value="PUNJABI">Punjabi Cinema</option>
                <option value="BENGALI">Bengali Cinema</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label style={{ fontSize: '0.7rem' }}>Genre:</label>
              <select
                value={selectedGenre}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedGenre(value);
                  handleFilterChange('genre', value);
                }}
                className="filter-select"
                style={{ fontSize: '0.7rem', padding: '2px 6px', height: '25px' }}
              >
                <option value="">All Categories</option>
                <option value="28">Action</option>
                <option value="12">Adventure</option>
                <option value="16">Animation</option>
                <option value="35">Comedy</option>
                <option value="80">Crime</option>
                <option value="99">Documentary</option>
                <option value="18">Drama</option>
                <option value="10751">Family</option>
                <option value="14">Fantasy</option>
                <option value="36">History</option>
                <option value="27">Horror</option>
                <option value="10402">Music</option>
                <option value="9648">Mystery</option>
                <option value="10749">Romance</option>
                <option value="878">Sci-Fi</option>
                <option value="53">Thriller</option>
                <option value="10752">War</option>
                <option value="37">Western</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label style={{ fontSize: '0.7rem' }}>Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedYear(value);
                  handleFilterChange('year', value);
                }}
                className="filter-select"
                style={{ fontSize: '0.7rem', padding: '2px 6px', height: '25px' }}
              >
                <option value="">All Years</option>
                {Array.from({ length: new Date().getFullYear() - 1950 + 1 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
            
            <div className="filter-group">
              <label style={{ fontSize: '0.7rem' }}>Language:</label>
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedLanguage(value);
                  handleFilterChange('language', value);
                }}
                className="filter-select"
                style={{ fontSize: '0.7rem', padding: '2px 6px', height: '25px' }}
              >
                <option value="">All Languages</option>
                <option value="en-US">English</option>
                <option value="hi-IN">Hindi</option>
                <option value="es-ES">Spanish</option>
                <option value="fr-FR">French</option>
                <option value="de-DE">German</option>
                <option value="ja-JP">Japanese</option>
                <option value="ko-KR">Korean</option>
                <option value="zh-CN">Chinese</option>
                <option value="it-IT">Italian</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label style={{ fontSize: '0.7rem' }}>Rows:</label>
              <select
                value={selectedRows}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedRows(Number(value));
                  handleFilterChange('rows', value);
                }}
                className="filter-select"
                style={{ fontSize: '0.7rem', padding: '2px 6px', height: '25px' }}
              >
                <option value={1}>1 Row</option>
                <option value={2}>2 Rows</option>
                <option value={3}>3 Rows</option>
                <option value={4}>4 Rows</option>
                <option value={5}>5 Rows</option>
                <option value={6}>6 Rows</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="movie-selection-search">
          <div className="movie-selection-search-container">
            <Search className="movie-selection-search-icon" />
            <input
              type="text"
              placeholder="Search movies by name or genre..."
              value={searchTerm}
              onChange={(e) => {
                const value = e.target.value;
                setSearchTerm(value);
                setCurrentPage(1); // Reset to first page when searching
              }}
              className="movie-selection-search-input"
            />
          </div>
          <button
            className="clear-filters-btn search-clear-btn"
            onClick={() => {
              setSelectedYear('');
              setSelectedGenre('');
              setSelectedIndustry('ALL');
              setSelectedLanguage('');
              setSelectedRows(3);
              setSearchTerm('');
              setCurrentPage(1);
            }}
          >
            Clear All Filters
          </button>
        </div>

        {/* Movies Grid */}
        <div className="movie-selection-content">
          {isLoading ? (
            <div className="movie-selection-loading">
              <div className="movie-selection-spinner"></div>
              <p>Loading movies...</p>
            </div>
          ) : filteredMovies.length === 0 ? (
            <div className="movie-selection-no-movies">
              <p>No movies found. Try a different search term.</p>
            </div>
          ) : (
            <div className="movie-selection-grid">
              {filteredMovies.slice(0, selectedRows * 4).map((movie, index) => (
                <MovieCard
                  key={`${movie.id}-${index}`}
                  movie={movie}
                  isSelected={tempSelectedMovies.includes(movie.title)}
                  onSelect={handleMovieSelection}
                />
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {filteredMovies.length > 0 && (
            <div className="movie-selection-pagination">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {currentPage}
              </span>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={filteredMovies.length < selectedRows * 4}
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="movie-selection-footer">
          <div className="movie-selection-selected-count">
            <span className="selected-number">{tempSelectedMovies.length}</span>
            <span className="selected-text">movie{tempSelectedMovies.length !== 1 ? 's' : ''} selected</span>
          </div>
          <div className="movie-selection-actions">
            <button 
              onClick={handleCancel}
              className="movie-selection-btn secondary"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirm}
              className="movie-selection-btn primary"
            >
              <Check className="w-4 h-4 mr-2" />
              {tempSelectedMovies.length === 1 ? 'Confirm Movie' : 'Confirm Selection'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Main Overlay */
        .movie-selection-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.96);
          backdrop-filter: blur(25px);
          z-index: 1000002;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: overlayFadeIn 0.3s ease-out;
        }

        @keyframes overlayFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Main Popup Container */
        .movie-selection-popup {
          background: linear-gradient(145deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%);
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 
            0 40px 80px rgba(0, 0, 0, 0.8),
            0 0 0 1px rgba(255, 255, 255, 0.02) inset;
          width: 100%;
          max-width: 1450px;
          height: 95vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
          animation: popupSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes popupSlideIn {
          from { 
            opacity: 0;
            transform: translateY(30px) scale(0.96);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Header Section */
        .movie-selection-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 2.5rem 3rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(0, 0, 0, 0.1) 100%);
          position: relative;
        }

        .movie-selection-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%);
        }

        .movie-selection-title-section {
          flex: 1;
        }

        .movie-selection-title {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 2rem;
          font-weight: 900;
          margin: 0 0 0.75rem 0;
          background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 50%, #cccccc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 0 40px rgba(255, 255, 255, 0.1);
          letter-spacing: -0.02em;
        }

        .movie-selection-description {
          color: rgba(255, 255, 255, 0.65);
          font-size: 1.1rem;
          margin: 0;
          line-height: 1.6;
          font-weight: 400;
        }

        .movie-selection-count {
          color: #ff3366;
          font-weight: 700;
          margin-left: 0.75rem;
          font-size: 1rem;
        }

        .movie-selection-close-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(20px);
        }

        .movie-selection-close-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
          transform: scale(1.05);
          border-color: rgba(255, 255, 255, 0.15);
        }

        /* Search Section */
        .movie-selection-search {
          padding: 0.75rem 3rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(20, 20, 20, 0.2) 100%);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1.25rem;
          position: relative;
        }

        .movie-selection-search::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%);
        }

        .movie-selection-search-container {
          position: relative;
          display: flex;
          align-items: center;
          gap: 1rem;
          max-width: 280px;
          width: 100%;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
          border-radius: 12px;
          padding: 0.375rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 
            0 6px 24px rgba(0, 0, 0, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
        }

        .movie-selection-search-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.6);
          width: 1rem;
          height: 0.5rem
          z-index: 2;
          transition: all 0.3s ease;
        }

        .movie-selection-search-input {
          width: 100%;
          padding: 0.75rem 0.75rem 0.75rem 2.5rem;
          background: transparent;
          border: none;
          border-radius: 10px;
          color: #ffffff;
          font-size: 0.9rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-weight: 400;
          outline: none;
        }

        .movie-selection-search-input:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.03);
        }

        .movie-selection-search-container:focus-within {
          border-color: rgba(255, 51, 102, 0.5);
          box-shadow: 
            0 6px 24px rgba(0, 0, 0, 0.35),
            0 0 0 2px rgba(255, 51, 102, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        .movie-selection-search-container:focus-within .movie-selection-search-icon {
          color: rgba(255, 51, 102, 0.8);
          transform: translateY(-50%) scale(1.1);
        }

        .movie-selection-search-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
          font-weight: 400;
        }

        /* Filter Button */
        .movie-selection-filter-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(20px);
          white-space: nowrap;
        }

        .movie-selection-filter-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .movie-selection-filter-btn.active {
          background: rgba(255, 51, 102, 0.15);
          border-color: rgba(255, 51, 102, 0.3);
          color: #ff3366;
        }

        .movie-selection-filter-btn.active:hover {
          background: rgba(255, 51, 102, 0.25);
          border-color: rgba(255, 51, 102, 0.5);
        }

        .filter-indicator {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 8px;
          height: 8px;
          background: #ff3366;
          border-radius: 50%;
          border: 2px solid #1a1a1a;
        }

        .selected-filters-text {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
          margin-left: 0.5rem;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Filter Options */
        .movie-selection-filters {
          margin-top: 1.5rem;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          backdrop-filter: blur(20px);
        }

        .filter-row {
          display: flex;
          gap: 1.5rem;
          justify-content: center;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .filter-row.single-row {
          display: flex;
          gap: 1rem;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }

        @media (max-width: 1200px) {
          .filter-row.single-row {
            gap: 0.75rem;
          }
          
          .filter-group {
            min-width: 120px;
          }
        }

        @media (max-width: 768px) {
          .filter-row.single-row {
            gap: 0.5rem;
            flex-wrap: wrap;
            justify-content: flex-start;
          }
          
          .filter-group {
            min-width: 100px;
            flex: 1;
          }
          
          .filter-group label {
            font-size: 0.65rem;
            margin-bottom: 0.2rem;
          }
          
          .filter-select {
            padding: 0.35rem 0.5rem;
            font-size: 0.7rem;
            border-radius: 6px;
            height: 22px;
          }
          
          .clear-filters-btn {
            padding: 0.4rem 0.8rem;
            font-size: 0.7rem;
            border-radius: 6px;
          }
        }

        @media (max-width: 640px) {
          .filter-row.single-row {
            gap: 0.5rem;
            flex-direction: column;
            align-items: stretch;
          }
          
          .filter-group {
            min-width: auto;
            width: 100%;
          }
          
          .filter-group label {
            font-size: 0.6rem;
          }
          
          .filter-select {
            padding: 0.4rem 0.6rem;
            font-size: 0.65rem;
            height: 24px;
          }
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          min-width: 130px;
          flex: 1;
          max-width: 180px;
        }

        .filter-group label {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
          font-weight: 600;
        }

        .filter-select {
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #ffffff;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(20px);
        }

        .filter-select:focus {
          outline: none;
          border-color: #ff3366;
          background: rgba(255, 255, 255, 0.1);
          box-shadow: 0 0 0 3px rgba(255, 51, 102, 0.1);
        }

        .filter-select option {
          background: #1a1a1a;
          color: #ffffff;
        }

        .filter-actions {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: flex-end;
        }

        .clear-filters-btn {
          padding: 0.75rem 1.5rem;
          background: rgba(255, 69, 69, 0.1);
          border: 1px solid rgba(255, 69, 69, 0.3);
          border-radius: 12px;
          color: #ff4545;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .clear-filters-btn:hover {
          background: rgba(255, 69, 69, 0.2);
          border-color: rgba(255, 69, 69, 0.5);
          transform: translateY(-2px);
        }

        .search-clear-btn {
          padding: 0.75rem 1.25rem;
          font-size: 0.85rem;
          white-space: nowrap;
          flex-shrink: 0;
          background: linear-gradient(135deg, rgba(255, 69, 69, 0.15) 0%, rgba(255, 69, 69, 0.1) 100%);
          border: 1px solid rgba(255, 69, 69, 0.3);
          border-radius: 10px;
          color: #ff4545;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 3px 12px rgba(255, 69, 69, 0.2);
          backdrop-filter: blur(20px);
        }

        .search-clear-btn:hover {
          background: linear-gradient(135deg, rgba(255, 69, 69, 0.25) 0%, rgba(255, 69, 69, 0.2) 100%);
          border-color: rgba(255, 69, 69, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 4px 18px rgba(255, 69, 69, 0.3);
        }

        /* Pagination */
        .movie-selection-pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 2rem;
          padding: 1.5rem 0;
        }

        .pagination-btn {
          padding: 0.75rem 1.5rem;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(20px);
        }

        .pagination-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .pagination-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
        }

        .pagination-info {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
          font-weight: 600;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        /* Mobile Layout - 2 cards per row */
        @media (max-width: 640px) {
          .movie-selection-pagination {
            gap: 0.5rem;
            padding: 0.75rem 0;
          }
          
          .pagination-btn {
            padding: 0.4rem 0.75rem;
            font-size: 0.75rem;
            border-radius: 8px;
          }
          
          .pagination-info {
            padding: 0.4rem 0.6rem;
            font-size: 0.75rem;
            border-radius: 8px;
          }

          .movie-selection-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.75rem !important;
            overflow-x: visible !important;
            flex-wrap: nowrap !important;
          }

          .movie-card {
            height: 80px !important;
            max-width: none !important;
            margin: 0 !important;
            flex: none !important;
            width: auto !important;
          }

          .movie-selection-title {
            font-size: 1rem;
          }
          
          .movie-title {
            font-size: 0.6rem !important;
            line-height: 1.0 !important;
            margin: 0 0 1px !important;
          }
          
          .movie-year {
            font-size: 0.5rem !important;
          }
          
          .rating {
            padding: 2px 6px !important;
            gap: 2px !important;
          }
          
          .rating svg {
            width: 8px !important;
            height: 8px !important;
          }
          
          .rating span {
            font-size: 0.6rem !important;
          }
          
          .movie-title-overlay {
            bottom: 20px !important;
            left: 6px !important;
            right: 6px !important;
          }
          
          .movie-selection-checkmark {
            bottom: 6px !important;
            right: 6px !important;
            width: 18px !important;
            height: 18px !important;
          }
          
          .movie-selection-checkmark svg {
            width: 8px !important;
            height: 8px !important;
          }
          
          .rating-corner {
            top: 6px !important;
            right: 6px !important;
          }
        }

        /* Content Section */
        .movie-selection-content {
          flex: 1;
          padding: 2.5rem 3rem;
          overflow-y: auto;
          background: rgba(0, 0, 0, 0.1);
          min-height: 0;
        }

        .movie-selection-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
          min-height: auto;
        }

        .movie-selection-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .movie-selection-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-top: 3px solid #ff3366;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1.5rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .movie-selection-no-movies {
          text-align: center;
          padding: 4rem;
          color: rgba(255, 255, 255, 0.6);
          font-size: 1.2rem;
        }

         /* Movie Card Styles */
         .movie-card {
           background: linear-gradient(145deg, #0f0f0f 0%, #1a1a1a 60%, #111111 100%) !important;
           border-radius: 28px !important;
           overflow: hidden !important;
           transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1) !important;
           border: 1px solid rgba(255, 255, 255, 0.06) !important;
           position: relative !important;
           cursor: pointer !important;
           height: 480px !important;
           box-shadow: 
             0 20px 60px rgba(0, 0, 0, 0.5),
             0 8px 25px rgba(0, 0, 0, 0.3),
             0 0 0 1px rgba(255, 255, 255, 0.02) inset !important;
           backdrop-filter: blur(15px) !important;
           width: 100% !important;
           display: block !important;
         }

        .movie-card:hover {
          transform: translateY(-25px) scale(1.06);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 
            0 45px 90px rgba(0, 0, 0, 0.7),
            0 20px 45px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.08) inset;
        }

        .movie-card.selected {
          border: 3px solid #ff3366 !important;
          box-shadow: 
            0 0 20px rgba(255, 51, 102, 0.5),
            0 25px 50px rgba(0, 0, 0, 0.4) !important;
          transform: translateY(-10px) scale(1.02) !important;
          background: linear-gradient(145deg, #1a0f0f 0%, #2a1a1a 60%, #1a1111 100%) !important;
        }

        .card-image-container {
          position: relative !important;
          width: 100% !important;
          height: 100% !important;
        }

        .card-image {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          object-position: center !important;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1) !important;
          display: block !important;
        }

        .movie-card:hover .card-image {
          transform: scale(1.08);
        }

        .gradient-overlay {
          position: absolute !important;
          inset: 0 !important;
          background: linear-gradient(180deg, 
            rgba(0, 0, 0, 0) 0%, 
            rgba(0, 0, 0, 0.3) 30%,
            rgba(0, 0, 0, 0.7) 70%, 
            rgba(0, 0, 0, 0.9) 100%
          ) !important;
          z-index: 1 !important;
          pointer-events: none !important;
        }

        /* Rating Corner */
        .rating-corner {
          position: absolute !important;
          top: 16px !important;
          right: 16px !important;
          z-index: 3 !important;
        }

        .rating {
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
          background: rgba(0, 0, 0, 0.8) !important;
          padding: 8px 12px !important;
          border-radius: 20px !important;
          backdrop-filter: blur(10px) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
        }

        .rating svg {
          color: #ffd700 !important;
          width: 14px !important;
          height: 14px !important;
        }

        .rating span {
          color: #ffffff !important;
          font-size: 0.9rem !important;
          font-weight: 600 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }

        /* Movie Title Overlay */
        .movie-title-overlay {
          position: absolute !important;
          bottom: 80px !important;
          left: 20px !important;
          right: 20px !important;
          z-index: 2 !important;
        }

        .movie-title {
          color: #ffffff !important;
          font-size: 1.2rem !important;
          font-weight: 700 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          line-height: 1.3 !important;
          text-shadow: 2px 2px 8px rgba(0,0,0,0.8) !important;
          margin: 0 0 8px !important;
          display: -webkit-box !important;
          -webkit-line-clamp: 2 !important;
          -webkit-box-orient: vertical !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          letter-spacing: -0.01em !important;
        }

        .movie-year {
          color: rgba(255,255,255,0.8) !important;
          font-size: 0.9rem !important;
          font-weight: 500 !important;
          margin: 0 !important;
          text-shadow: 1px 1px 4px rgba(0,0,0,0.8) !important;
        }

        /* Play Button */
        .play-button {
          position: absolute;
          bottom: 28px;
          right: 28px;
          background: rgba(255, 255, 255, 0.98);
          border: none;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #000;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 
            0 10px 40px rgba(0, 0, 0, 0.5),
            0 6px 20px rgba(0, 0, 0, 0.3);
          z-index: 3;
          backdrop-filter: blur(25px);
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .play-button:hover {
          background: #ffffff;
          transform: scale(1.1);
          box-shadow: 
            0 12px 40px rgba(0, 0, 0, 0.5),
            0 6px 20px rgba(0, 0, 0, 0.3);
        }

        .play-button svg {
          margin-left: 2px;
        }

        /* Selection Checkmark */
        .movie-selection-checkmark {
          position: absolute !important;
          bottom: 20px !important;
          right: 20px !important;
          background: linear-gradient(135deg, #ff3366 0%, #ff1744 100%) !important;
          color: #ffffff !important;
          border-radius: 50% !important;
          width: 40px !important;
          height: 40px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 3 !important;
          box-shadow: 0 4px 12px rgba(255, 51, 102, 0.4) !important;
          border: 2px solid rgba(255, 255, 255, 0.2) !important;
          backdrop-filter: blur(20px) !important;
          animation: checkmarkPulse 0.5s ease-out !important;
        }

        @keyframes checkmarkPulse {
          0% { transform: scale(0.8); opacity: 0.8; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }

        /* Badges */
        .following-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: #fff;
          padding: 8px 16px;
          border-radius: 24px;
          font-size: 0.8rem;
          font-weight: 700;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          z-index: 3;
          box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .subscription-badge {
          position: absolute;
          top: 52px;
          left: 16px;
          background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
          color: #fff;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          z-index: 3;
          box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        /* Footer Section */
        .movie-selection-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2.5rem 3rem;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          background: linear-gradient(135deg, 
            rgba(0, 0, 0, 0.6) 0%, 
            rgba(255, 255, 255, 0.01) 50%,
            rgba(0, 0, 0, 0.4) 100%
          );
          backdrop-filter: blur(25px);
          position: relative;
        }

        .movie-selection-footer::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.08) 50%, transparent 100%);
        }

        .movie-selection-selected-count {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .selected-number {
          background: linear-gradient(135deg, #ff3366 0%, #ff1744 100%);
          color: #ffffff;
          font-size: 1.5rem;
          font-weight: 900;
          padding: 0.5rem 1rem;
          border-radius: 16px;
          min-width: 3rem;
          text-align: center;
          box-shadow: 0 6px 20px rgba(255, 51, 102, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .selected-text {
          color: rgba(255, 255, 255, 0.8);
          font-size: 1.1rem;
          font-weight: 500;
        }

        .movie-selection-actions {
          display: flex;
          gap: 1.5rem;
        }

        .movie-selection-btn {
          padding: 1rem 2rem;
          border-radius: 16px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 140px;
          backdrop-filter: blur(20px);
        }

        .movie-selection-btn.secondary {
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .movie-selection-btn.secondary:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .movie-selection-btn.primary {
          background: linear-gradient(135deg, #ff3366 0%, #ff1744 100%);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 6px 20px rgba(255, 51, 102, 0.3);
        }

        .movie-selection-btn.primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(255, 51, 102, 0.4);
          background: linear-gradient(135deg, #ff1744 0%, #e91e63 100%);
        }

        /* Mobile Responsive */
        @media (max-width: 1200px) {
          .movie-selection-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
          }
        }

        @media (max-width: 900px) {
          .movie-selection-popup {
            margin: 0.5rem;
            height: 98vh;
            border-radius: 20px;
          }

          .movie-selection-header {
            padding: 2rem 1.5rem;
          }

          .movie-selection-title {
            font-size: 1.5rem;
          }

          .movie-selection-search {
            padding: 1.25rem 1.5rem;
          }

          .movie-selection-content {
            padding: 1.5rem 1.5rem;
          }
          
          .movie-selection-filters {
            padding: 0.75rem;
            margin-top: 0.75rem;
          }
          
          .movie-selection-search {
            padding: 0.75rem 1.5rem;
          }

          .movie-selection-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.25rem;
          }

          .movie-card {
            height: 200px;
          }

          .movie-title {
            font-size: 1.1rem;
            bottom: 60px;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.3;
          }

          .movie-year {
            font-size: 0.8rem;
            padding: 4px 10px;
          }

          .rating {
            font-size: 0.75rem;
            padding: 6px 10px;
          }

          .rating span {
            font-size: 0.75rem;
          }

           .play-button {
             width: 44px;
             height: 44px;
             bottom: 16px;
             right: 16px;
           }

           .select-button {
             padding: 10px 16px;
             font-size: 0.8rem;
             bottom: 16px;
             right: 16px;
           }

          .movie-selection-checkmark {
            width: 36px;
            height: 36px;
            bottom: 16px;
            right: 16px;
          }

          .following-badge,
          .subscription-badge {
            display: none;
          }

          .rating-corner {
            top: 12px;
            right: 12px;
          }

          .movie-title-overlay {
            bottom: 60px;
            left: 16px;
            right: 16px;
          }

          .movie-selection-footer {
            padding: 1.5rem;
            flex-direction: column;
            gap: 1.5rem;
            align-items: stretch;
          }
          
          .movie-selection-close-btn {
            padding: 0.5rem;
            border-radius: 8px;
          }

          .movie-selection-actions {
            justify-content: center;
            width: 100%;
          }

          .movie-selection-btn {
            flex: 1;
            max-width: 140px;
            padding: 0.75rem 1.25rem;
            font-size: 0.9rem;
            border-radius: 12px;
          }
        }

        @media (max-width: 768px) {
          .movie-selection-search {
            flex-direction: column;
            gap: 1rem;
            padding: 1rem 1.5rem;
          }
          
          .movie-selection-search-container {
            max-width: 100%;
            padding: 0.4rem;
          }
          
          .movie-selection-search-input {
            padding: 0.875rem 0.875rem 0.875rem 2.75rem;
            font-size: 0.9rem;
          }
          
          .movie-selection-search-icon {
            left: 0.875rem;
            width: 1rem;
            height: 1rem;
          }
          
          .search-clear-btn {
            width: 100%;
            padding: 0.75rem 1.25rem;
            font-size: 0.85rem;
          }
        }

        @media (max-width: 640px) {
          .movie-selection-search {
            padding: 0.75rem 1rem;
            gap: 0.75rem;
          }
          
          .movie-selection-search-container {
            padding: 0.3rem;
          }
          
          .movie-selection-search-input {
            font-size: 0.85rem;
            padding: 0.75rem 0.75rem 0.75rem 2.5rem;
          }
          
          .movie-selection-search-icon {
            width: 0.9rem;
            height: 0.9rem;
            left: 0.75rem;
          }
          
          .search-clear-btn {
            padding: 0.7rem 1rem;
            font-size: 0.8rem;
          }
        }

        /* Scrollbar Styling */
        .movie-selection-content::-webkit-scrollbar {
          width: 8px;
        }

        .movie-selection-content::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
          margin: 10px 0;
        }

        .movie-selection-content::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: background 0.3s ease;
        }

        .movie-selection-content::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .movie-selection-content::-webkit-scrollbar-thumb:active {
          background: rgba(255, 51, 102, 0.3);
        }

        /* Custom Focus States */
        .movie-card:focus {
          outline: none;
          border-color: #ff3366;
          box-shadow: 0 0 0 3px rgba(255, 51, 102, 0.2);
        }

        .movie-selection-btn:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(255, 51, 102, 0.3);
        }

        .movie-selection-search-input:focus {
          outline: none;
          border-color: #ff3366;
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 0 0 3px rgba(255, 51, 102, 0.1);
        }

        /* Loading Animation Enhancement */
        .movie-selection-loading p {
          font-size: 1.1rem;
          font-weight: 500;
        }

         /* Enhanced Hover Effects */
         .movie-card:hover .movie-title {
           text-shadow: 
             2px 2px 25px rgba(0, 0, 0, 0.95),
             0 0 50px rgba(255, 255, 255, 0.15);
           transform: translateY(-2px);
         }

         .movie-card:hover .movie-year {
           background: rgba(255, 255, 255, 0.15);
           border-color: rgba(255, 255, 255, 0.2);
           transform: translateY(-1px);
         }

         .movie-card:hover .rating {
           background: rgba(0, 0, 0, 0.95);
           transform: scale(1.08);
           box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6);
         }

         .movie-card:hover .following-badge,
         .movie-card:hover .subscription-badge {
           transform: scale(1.08) translateY(-2px);
           box-shadow: 0 10px 30px rgba(139, 92, 246, 0.6);
         }

         .movie-card:hover .play-button {
           transform: scale(1.15);
           box-shadow: 
             0 15px 50px rgba(0, 0, 0, 0.6),
             0 8px 25px rgba(0, 0, 0, 0.4);
         }

         .movie-card:hover .select-button {
           transform: translateY(-3px) scale(1.08);
           box-shadow: 
             0 15px 40px rgba(255, 51, 102, 0.6),
             0 8px 25px rgba(255, 23, 68, 0.5);
         }

         /* Card Loading State */
         .movie-card.loading {
           opacity: 0.7;
           pointer-events: none;
         }

         .movie-card.loading .card-image {
           filter: blur(2px);
         }

         /* Card Focus States for Accessibility */
         .movie-card:focus-visible {
           outline: 3px solid #ff3366;
           outline-offset: 2px;
         }

         /* Smooth Image Loading */
         .card-image {
           transition: opacity 0.3s ease, transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
         }

         .card-image.loading {
           opacity: 0.8;
         }

         /* Card Shimmer Effect */
         @keyframes shimmer {
           0% { background-position: -200px 0; }
           100% { background-position: calc(200px + 100%) 0; }
         }

         .movie-card::before {
           content: '';
           position: absolute;
           top: 0;
           left: -200px;
           width: 200px;
           height: 100%;
           background: linear-gradient(
             90deg,
             transparent,
             rgba(255, 255, 255, 0.1),
             transparent
           );
           animation: shimmer 2s infinite;
           z-index: 2;
           opacity: 0;
         }

         .movie-card:hover::before {
           opacity: 1;
        }
      `}</style>
    </div>
  );

  return createPortal(popupContent, document.body);
}
