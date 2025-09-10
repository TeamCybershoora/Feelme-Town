'use client';

import Navbar from "./Navbar/Navbar";
import Footer from "./Footer";
import FloatingNavigation from "./FloatingNavigation";
import SmoothScroll from "./SmoothScroll";
import { DatePickerProvider } from "@/contexts/DatePickerContext";
import LayoutContent from "./LayoutContent";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <DatePickerProvider>
      <Navbar />
      <SmoothScroll />
      <LayoutContent>
        {children}
      </LayoutContent>
      <Footer />
      <FloatingNavigation />
    </DatePickerProvider>
  );
}
