'use client';

import { usePathname } from 'next/navigation';
import ClientLayout from './ClientLayout';

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
}

export default function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  const pathname = usePathname();
  
  // Check if current path is an admin route, management route, test page, or ManualBooking page
  const isAdminRoute = pathname.startsWith('/Administrator');
  const isManagementRoute = pathname.startsWith('/management');
  const isTestRoute = pathname.startsWith('/test-counters');
  const isManualBookingRoute = pathname.startsWith('/ManualBooking');
  const isEditBookingRoute = pathname.toLowerCase().startsWith('/editbooking');
  
  // If it's an admin route, management route, test route, or ManualBooking route, render children directly without navbar/footer
  // (admin layout is handled in Administrator/layout.tsx, management layout is handled in management/layout.tsx)
  if (isAdminRoute || isManagementRoute || isTestRoute || isManualBookingRoute || isEditBookingRoute) {
    return <>{children}</>;
  }
  
  return (
    <ClientLayout>
      {children}
    </ClientLayout>
  );
}
