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
  );
}
