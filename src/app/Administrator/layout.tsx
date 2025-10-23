'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Shield } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import ToastManager from '@/components/ToastManager';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Login form states
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Immediate authentication check - no loading state
    const adminToken = localStorage.getItem('adminToken');
    const loginTime = localStorage.getItem('adminLoginTime');

    const checkSession = async () => {
      if (adminToken === 'authenticated' && loginTime) {
        try {
          // Fetch settings to get configurable session lifetime (days)
          const res = await fetch('/api/admin/settings');
          const data = await res.json();
          const sessionTimeoutDays = Number(data?.settings?.sessionTimeout) || 30; // default 30 days
          const sessionDuration = sessionTimeoutDays * 24 * 60 * 60 * 1000;

          const currentTime = Date.now();
          if (currentTime - parseInt(loginTime) < sessionDuration) {
            setIsAuthenticated(true);
          } else {
            // Session expired, clear storage
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminLoginTime');
            localStorage.removeItem('adminUser');
            setIsAuthenticated(false);
          }
        } catch (e) {
          // Fallback to 30 days if settings fetch fails
          const currentTime = Date.now();
          const sessionDuration = 30 * 24 * 60 * 60 * 1000;
          if (currentTime - parseInt(loginTime) < sessionDuration) {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminLoginTime');
            localStorage.removeItem('adminUser');
            setIsAuthenticated(false);
          }
        }
      } else {
        setIsAuthenticated(false);
      }
    };

    checkSession();
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Call API to verify admin password from database
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      

      if (data.success) {
        
        // Store admin session
        localStorage.setItem('adminToken', 'authenticated');
        localStorage.setItem('adminLoginTime', Date.now().toString());
        localStorage.setItem('adminUser', JSON.stringify(data.admin));
        
        // Set authenticated state directly instead of redirect
        setIsAuthenticated(true);
        return;
      } else {
        setError(data.message || 'Invalid admin password. Please try again.');
        setPassword('');
        setIsLoading(false);
      }
    } catch (error) {
      
      setError('Connection error. Please try again.');
      setPassword('');
      setIsLoading(false);
    }
  };


  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="animated-bg">
          <div className="grid-container">
            <div className="grid-overlay"></div>
            <div className="colored-grid-line horizontal-line-1"></div>
            <div className="colored-grid-line horizontal-line-2"></div>
            <div className="colored-grid-line horizontal-line-4"></div>
            <div className="colored-grid-line vertical-line-1"></div>
            <div className="colored-grid-line vertical-line-2"></div>
            <div className="colored-grid-line vertical-line-4"></div>
            <div className="colored-grid-line vertical-line-5"></div>
          </div>
        </div>
        
        <div className="login-container">
          <div className="login-header">
            <div className="logo-section">
              <Shield size={48} className="shield-icon" />
              <h1>FeelMe Town</h1>
              <p>Admin Access</p>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="password">Admin Password</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  className="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="toggle-password"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password}
              className="login-button"
            >
              {isLoading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <span>Loading...</span>
                </div>
              ) : (
                'Access Admin Panel'
              )}
            </button>

            <div className="additional-buttons">
              <button type="button" className="secondary-button">
                Login with Face
              </button>
              <button type="button" className="secondary-button">
                Forgot Password
              </button>
            </div>
          </form>

          <div className="login-footer">
            <p>Authorized personnel only</p>
          </div>
        </div>
      </div>
    );
  }

  // Show admin panel if authenticated
  return (
    <div className="admin-layout">
      <AdminSidebar isOpen={sidebarOpen} />
      <div className={`admin-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <AdminHeader onToggleSidebar={toggleSidebar} />
        <main className="admin-content">
          {children}
        </main>
      </div>
      <ToastManager />
    </div>
  );
}

