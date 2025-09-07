'use client';

import { useState, useEffect } from 'react';
import NetflixLoader from './ui/loading';

interface LoadingWrapperProps {
  children: React.ReactNode;
}

export default function LoadingWrapper({ children }: LoadingWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Show loading for a minimum time to ensure smooth experience
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // 3 seconds loading time

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <NetflixLoader />;
  }

  return <>{children}</>;
}
