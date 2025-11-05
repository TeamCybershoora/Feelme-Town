'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import ManagementSidebar from '@/components/ManagementSidebar';
import ManagementHeader from '@/components/ManagementHeader';

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [staffUser, setStaffUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only check authentication for dashboard routes, not login page
    if (pathname !== '/management') {
      const staffToken = localStorage.getItem('staffToken');
      const loginTime = localStorage.getItem('staffLoginTime');
      const staffUserData = localStorage.getItem('staffUser');

      if (staffToken === 'authenticated' && loginTime && staffUserData) {
         // Check if session is valid using configurable lifetime (days)
         const checkSession = async () => {
           try {
             const res = await fetch('/api/admin/settings');
             const data = await res.json();
             const sessionTimeoutDays = Number(data?.settings?.sessionTimeout) || 1; // default 1 day
             const sessionDuration = sessionTimeoutDays * 24 * 60 * 60 * 1000;
 
             const currentTime = Date.now();
             if (currentTime - parseInt(loginTime) < sessionDuration) {
              const parsedUser = JSON.parse(staffUserData);
              try {
                const staffRes = await fetch('/api/admin/staff');
                const staffData = await staffRes.json();
                if (staffData.success && Array.isArray(staffData.staff)) {
                  const match = staffData.staff.find((member: any) => String(member.userId || member._id) === String(parsedUser.userId || parsedUser._id));
                  if (match) {
                    parsedUser.bookingAccess = match.bookingAccess === 'edit' ? 'edit' : 'view';
                    localStorage.setItem('staffUser', JSON.stringify(parsedUser));
                  }
                }
              } catch (error) {
                // Ignore refresh errors; fallback to stored data
              }
              setStaffUser(parsedUser);
              setIsLoading(false);
            } else {
              localStorage.removeItem('staffToken');
              localStorage.removeItem('staffLoginTime');
              localStorage.removeItem('staffUser');
              router.push('/management');
            }
          } catch (e) {
            // Fallback to 1 day if settings fetch fails
            const currentTime = Date.now();
            const sessionDuration = 1 * 24 * 60 * 60 * 1000;
            if (currentTime - parseInt(loginTime) < sessionDuration) {
              setStaffUser(JSON.parse(staffUserData));
              setIsLoading(false);
            } else {
              localStorage.removeItem('staffToken');
              localStorage.removeItem('staffLoginTime');
              localStorage.removeItem('staffUser');
              router.push('/management');
            }
          }
        };
        checkSession();
      } else {
        // Not authenticated, redirect to login
        router.push('/management');
      }
    } else {
      // For login page, just set loading to false
      setIsLoading(false);
    }
  }, [pathname, router]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'Paralucent-Medium, Arial, Helvetica, sans-serif',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  // For login page, don't show sidebar
  if (pathname === '/management') {
    return <>{children}</>;
  }

  // For all other management pages, show sidebar layout
  return (
    <div className="management-layout">
      <ManagementSidebar isOpen={sidebarOpen} />
      <div className={`management-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <ManagementHeader 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          staffUser={staffUser}
        />
        <main className="main-content">
          {children}
        </main>
      </div>

      <style jsx>{`
        .management-layout {
          display: flex;
          min-height: 100vh;
          background: #f8fafc;
        }

        .management-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          transition: margin-left 0.3s ease;
        }

        .management-content.sidebar-open {
          margin-left: 280px;
        }

        .management-content.sidebar-closed {
          margin-left: 80px;
        }


        .main-content {
          flex: 1;
          padding: 2rem;
        }

        @media (max-width: 768px) {
          .management-content {
            margin-left: 0 !important;
          }

          .management-content.sidebar-open,
          .management-content.sidebar-closed {
            margin-left: 0 !important;
          }


          .main-content {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
