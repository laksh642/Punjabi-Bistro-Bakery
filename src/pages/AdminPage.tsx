import React, { useState, useEffect } from 'react';
import { AdminDashboard } from '../components/AdminDashboard';
import { AdminLockScreen } from '../components/AdminLockScreen';
import { Link } from 'react-router-dom';
import { Store, ArrowLeft, Lock, LogOut } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const AdminPage: React.FC = () => {
  const { setIsAdminView } = useStore();

  const [savedPassword, setSavedPassword] = useState<string>(() => {
    return localStorage.getItem('pb_admin_password') || 'bistro123';
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // 1. Check current session storage
    if (sessionStorage.getItem('pb_admin_authenticated') === 'true') {
      return true;
    }
    // 2. Check 24-hour remembered device
    const localAuth = localStorage.getItem('pb_admin_authenticated');
    const expiry = localStorage.getItem('pb_admin_auth_expiry');
    if (localAuth === 'true' && expiry && Date.now() < parseInt(expiry, 10)) {
      return true;
    }
    return false;
  });

  // Keep savedPassword updated if changed in settings
  useEffect(() => {
    const handleStorageChange = () => {
      setSavedPassword(localStorage.getItem('pb_admin_password') || 'bistro123');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('pb_admin_authenticated');
    localStorage.removeItem('pb_admin_authenticated');
    localStorage.removeItem('pb_admin_auth_expiry');
    setIsAuthenticated(false);
  };

  // If not authenticated, render password lock screen first
  if (!isAuthenticated) {
    return (
      <AdminLockScreen
        onUnlock={() => setIsAuthenticated(true)}
        savedPassword={savedPassword}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Banner with Quick Storefront Switcher and Lock & Log Out Button */}
      <div className="bg-emerald-950 text-white text-xs py-2.5 px-4 sm:px-6 border-b border-emerald-900 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold tracking-wide">Staff & Kitchen Operations Portal</span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-900 text-[10px] text-emerald-200 border border-emerald-800">
            Dharamkot HQ
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 bg-rose-900/80 hover:bg-rose-800 text-rose-100 border border-rose-700/60 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            title="Lock portal and require password on next visit"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock & Log Out</span>
          </button>

          <Link
            to="/"
            onClick={() => setIsAdminView(false)}
            className="inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <Store className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </Link>
        </div>
      </div>

      <AdminDashboard />
    </div>
  );
};

