'use client';

import { useState } from 'react';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<Industry>('ALL');
  const [selectedRows, setSelectedRows] = useState(3);

  const itemsPerPage = selectedRows * 4; // 4 cards per row on desktop

  return (
    <>
      <div className="movies-container">
        <div className="movies-header">
          <h1 className="movies-title">Popular Movies</h1>
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
        </div>

        <Movies
          searchTerm={searchTerm}
          selectedYear={selectedYear}
          selectedGenre={selectedGenre}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          language={selectedLanguage}
          industry={selectedIndustry}
          selectedRows={selectedRows}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={50}
          onPageChange={setCurrentPage}
        />
      </div>

      <style jsx>{`
        .movies-container {
          width: 100%;
          min-height: 100vh;
          padding-bottom: 2rem;
        }

        .movies-header {
          padding: 2rem 1rem;
          text-align: center;
        }

        .movies-title {
          color: #ffffff;
          font-size: 2.5rem;
          font-weight: 700;
          font-family: 'Paralucent-Bold', Arial, sans-serif;
          margin: 0 0 2rem 0;
          background: linear-gradient(135deg, #ff3366 0%, #ff6b35 50%, #8b45ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        @media (max-width: 768px) {
          .movies-header {
            padding: 1rem 0.5rem;
          }

          .movies-title {
            font-size: 2rem;
            margin-bottom: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .movies-title {
            font-size: 1.5rem;
            margin-bottom: 1rem;
          }
        }
      `}</style>
    </>
  );
}