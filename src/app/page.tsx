'use client';

import Navbar from "../components/Navbar/Navbar";
import HeroContent from "../components/HeroContent";


import Portfolio from "../components/Portfolio";
import MoviesSection from "../components/MoviesSection";

export default function Home() {
  return (
    <div>
      <Navbar />
      <HeroContent />
      <MoviesSection />
      <Portfolio />
    </div>
  );
}
