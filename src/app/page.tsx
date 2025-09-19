'use client';

import HeroContent from "../components/HeroContent";
import WhyChooseUs from '../components/WhyChooseUs';
import TrustedBy from "../components/ui/TrustedBy";
import Portfolio from "../components/Portfolio";
import MoviesSection from "../components/MoviesSection";
import TestimonialPage from "../components/testimonials";
import Footer from "../components/Footer";
import FloatingNavigation from "../components/FloatingNavigation";

export default function Home() {
  return (
    <div>
      <HeroContent />
      <MoviesSection />
      <Portfolio />
      <WhyChooseUs />
      <TrustedBy />
      <TestimonialPage />
      
    </div>
  );
}
