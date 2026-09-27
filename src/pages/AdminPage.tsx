import React, { useEffect } from 'react';
import { AdminDashboard } from '../components/AdminDashboard';
import { AdminLoginScreen } from '../components/AdminLoginScreen';
import { Link } from 'react-router-dom';
import { Store, ArrowLeft, LogOut, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useAdminAuth } from '../context/AdminAuthContext';

export const AdminPage: React.FC = () => {
  const { setIsAdminView } = useStore();
  const { isAuthenticated, adminUsername, isLoading, logout } = useAdminAuth();

  // Clean up legacy auth flags from earlier versions
  useEffect(() => {
    try {
      sessionStorage.removeItem('pb_admin_authenticated');
      localStorage.removeItem('pb_admin_authenticated');
      localStorage.removeItem('pb_admin_auth_expiry');
      localStorage.removeItem('pb_admin_password');
    } catch {
      // ignore
    }
  }, []);

  // Set admin view mode when authenticated
  useEffect(() => {
    setIsAdminView(isAuthenticated);
  }, [isAuthenticated, setIsAdminView]);

  // 1. Loading state while checking server session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-emerald-300">Checking Administrator Session...</p>
        <p className="text-xs text-stone-500 mt-1">Punjabi Bistro &amp; Bakery • Dharamkot</p>
      </div>
    );
  }

  // 2. Unauthenticated: Render dedicated 3-field Login Screen
  if (!isAuthenticated) {
    return <AdminLoginScreen />;
  }

  // 3. Authenticated: Render Protected Operations Bar & Dashboard
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Banner with Authorized Admin Status, Storefront Switcher, and Sign Out Button */}
      <header className="bg-emerald-950 text-white text-xs py-2.5 px-4 sm:px-6 border-b border-emerald-900 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold tracking-wide">Operations Portal</span>
          </div>

          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-900 text-[10px] text-emerald-200 border border-emerald-800">
            Dharamkot HQ
          </span>

          {/* Current Administrator Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-700/60 text-emerald-200 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium">{adminUsername || 'Administrator'}</span>
            <span className="font-bold uppercase text-[9px] bg-emerald-800 px-1.5 py-0.5 rounded text-emerald-100">
              Active
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-admin-sign-out"
            onClick={logout}
            className="inline-flex items-center gap-1.5 bg-rose-900/80 hover:bg-rose-800 active:scale-[0.98] text-rose-100 border border-rose-700/60 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            title="Sign out of Administrator Session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          <Link
            to="/"
            id="btn-admin-return-storefront"
            onClick={() => setIsAdminView(false)}
            className="inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 active:scale-[0.98] text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <Store className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </Link>
        </div>
      </header>

      <AdminDashboard />
    </div>
  );
};

export default AdminPage;
