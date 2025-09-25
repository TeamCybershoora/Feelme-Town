'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Play } from 'lucide-react';
import Movies from '@/components/Movies';
import SearchFilter from '@/components/SearchFilter';
import Pagination from '@/components/Pagination';


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

export default function MoviesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<Industry>('ALL');
  const [selectedRows, setSelectedRows] = useState(3);
  const itemsPerPage = selectedRows * 4; // 4 cards per row on desktop

  // Check if coming from booking popup or admin booking
  const fromBooking = searchParams.get('from') === 'booking';
  const fromAdminBooking = searchParams.get('from') === 'admin-booking';

  const handleBackClick = () => {
    console.log('Back button clicked, fromAdminBooking:', fromAdminBooking);
    
    if (fromBooking) {
      router.push('/theater?reopenBooking=true');
    } else if (fromAdminBooking) {
      // Set flag to reopen admin booking popup
      console.log('Setting reopen flag for admin booking popup (back button)');
      sessionStorage.setItem('reopenAdminBookingPopup', 'true');
      router.push('/Administrator/bookings');
    } else {
      router.back();
    }
  };

  const handleMovieSelect = (movieTitle: string) => {
    // Store selected movie in sessionStorage
    sessionStorage.setItem('selectedMovie', movieTitle);
    console.log('Movie selected:', movieTitle);
    console.log('From admin booking:', fromAdminBooking);
    
    if (fromBooking) {
      // Return to theater page which will reopen booking popup
      router.push('/theater?reopenBooking=true');
    } else if (fromAdminBooking) {
      // Set flag to reopen admin booking popup
      console.log('Setting reopen flag for admin booking popup');
      sessionStorage.setItem('reopenAdminBookingPopup', 'true');
      router.push('/Administrator/bookings');
    } else {
      router.back();
    }
  };


  return (
    <>
      <div className="movies-container">
        {/* Header with Back Button */}
        <div className="movies-header">
          <div className="movies-header-content">
            <button 
              onClick={handleBackClick}
              className="back-button"
              aria-label="Go back"
            >
              <ArrowLeft className="back-icon" />
              Back
            </button>
            <h1 className="movies-title">
              <Play className="title-icon" />
              Select Your Movie
            </h1>
            <p className="movies-subtitle">
              Choose your preferred movie for the theater experience
            </p>
          </div>
        </div>

        <div className="movies-content">
          <SearchFilter
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            selectedGenre={selectedGenre}
            setSelectedGenre={setSelectedGenre}
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={setSelectedLanguage}
            selectedIndustry={selectedIndustry}
            setSelectedIndustry={setSelectedIndustry}
            selectedRows={selectedRows}
            setSelectedRows={setSelectedRows}
          />

          <Movies
            searchTerm={searchTerm}
            selectedYear={selectedYear}
            selectedGenre={selectedGenre}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            language={selectedLanguage}
            industry={selectedIndustry}
            selectedRows={selectedRows}
            onMovieSelect={handleMovieSelect}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={50}
            onPageChange={setCurrentPage}
          />
        </div>

      </div>

      <style jsx>{`
        .movies-container {
          width: 100%;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%);
          position: relative;
          overflow-x: hidden;
        }

        .movies-header {
          padding: 2rem 3rem 1rem 3rem;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(20, 20, 20, 0.6) 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          position: relative;
        }

        .movies-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%);
        }

        .movies-header-content {
          max-width: 1400px;
          margin: 0 auto;
          position: relative;
        }

        .back-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(20px);
          margin-bottom: 2rem;
        }

        .back-button:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }

        .back-icon {
          width: 1.1rem;
          height: 1.1rem;
        }

        .movies-title {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: #ffffff;
          font-size: 2.8rem;
          font-weight: 900;
          font-family: 'Paralucent-Bold', Arial, sans-serif;
          margin: 0 0 1rem 0;
          background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 50%, #cccccc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 0 40px rgba(255, 255, 255, 0.1);
          letter-spacing: -0.02em;
        }

        .title-icon {
          width: 2.2rem;
          height: 2.2rem;
          color: #ff3366;
        }

        .movies-subtitle {
          color: rgba(255, 255, 255, 0.7);
          font-size: 1.2rem;
          margin: 0 0 2rem 0;
          line-height: 1.6;
          font-weight: 400;
          max-width: 600px;
        }

        .movies-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem 3rem;
        }


        .ai-recommendations-section {
          padding: 4rem 2rem;
          text-align: center;
          background: linear-gradient(135deg, rgba(255, 0, 5, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%);
          margin: 2rem 0;
          border-radius: 1rem;
        }

        .ai-recommendations-header {
          margin-bottom: 2rem;
        }

        .ai-recommendations-title {
          color: #FF0005;
          font-size: 2rem;
          font-weight: 700;
          font-family: 'Paralucent-Bold', Arial, sans-serif;
          margin: 0 0 1rem 0;
        }

        .ai-recommendations-description {
          color: #cccccc;
          font-size: 1.1rem;
          font-family: 'Paralucent-Medium', Arial, sans-serif;
          margin: 0;
          max-width: 600px;
          margin: 0 auto;
        }

        @media (max-width: 768px) {
          .movies-header {
            padding: 1.5rem 1.5rem 1rem 1.5rem;
          }

          .movies-header-content {
            padding: 0;
          }

          .back-button {
            padding: 0.6rem 1.25rem;
            font-size: 0.85rem;
            margin-bottom: 1.5rem;
          }

          .movies-title {
            font-size: 2.2rem;
            margin-bottom: 0.75rem;
          }

          .title-icon {
            width: 1.8rem;
            height: 1.8rem;
          }

          .movies-subtitle {
            font-size: 1.1rem;
            margin-bottom: 1.5rem;
          }

          .movies-content {
            padding: 1.5rem 1.5rem;
          }

          .ai-recommendations-section {
            padding: 2rem 1rem;
            margin: 1rem 0;
          }

          .ai-recommendations-title {
            font-size: 1.5rem;
          }

          .ai-recommendations-description {
            font-size: 1rem;
          }
        }

        @media (max-width: 480px) {
          .movies-header {
            padding: 1rem 1rem 0.75rem 1rem;
          }

          .back-button {
            padding: 0.5rem 1rem;
            font-size: 0.8rem;
            margin-bottom: 1rem;
          }

          .movies-title {
            font-size: 1.8rem;
            margin-bottom: 0.5rem;
          }

          .title-icon {
            width: 1.5rem;
            height: 1.5rem;
          }

          .movies-subtitle {
            font-size: 1rem;
            margin-bottom: 1rem;
          }

          .movies-content {
            padding: 1rem 1rem;
          }

          .ai-recommendations-section {
            padding: 1.5rem 0.5rem;
            margin: 1rem 0;
          }

          .ai-recommendations-title {
            font-size: 1.25rem;
          }

          .ai-recommendations-description {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </>
  );
}