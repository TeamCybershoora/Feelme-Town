'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import NetflixLoader from './ui/loading';

interface LoadingWrapperProps {
  children: React.ReactNode;
}

export default function LoadingWrapper({ children }: LoadingWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  
  // Check if we're on an admin route
  const isAdminRoute = pathname.startsWith('/Administrator');

  useEffect(() => {
    // Skip loading for admin routes
    if (isAdminRoute) {
      setIsLoading(false);
      return;
    }

    // Show loading for a minimum time to ensure smooth experience for main site
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // 3 seconds loading time

    return () => clearTimeout(timer);
  }, [isAdminRoute]);

  // Don't show loading for admin routes
  if (isAdminRoute) {
    return <>{children}</>;
  }

  if (isLoading) {
    return <NetflixLoader />;
  }

  return <>{children}</>;
}
