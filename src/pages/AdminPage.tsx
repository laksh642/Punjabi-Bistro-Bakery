import React, { useEffect } from 'react';
import { AdminDashboard } from '../components/AdminDashboard';
import { AdminLoginScreen } from '../components/AdminLoginScreen';
import { AdminAccessDenied } from '../components/AdminAccessDenied';
import { Link } from 'react-router-dom';
import { Store, ArrowLeft, LogOut, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useAdminAuth } from '../context/AdminAuthContext';

export const AdminPage: React.FC = () => {
  const { setIsAdminView } = useStore();
  const {
    user,
    session,
    adminRecord,
    adminRole,
    isAuthorized,
    isLoading,
    isCheckingAuth,
    authError,
    signInWithGoogle,
    signOut,
    refreshAuthorization,
  } = useAdminAuth();

  // Clean up any legacy password/auth flags from older versions
  useEffect(() => {
    sessionStorage.removeItem('pb_admin_authenticated');
    localStorage.removeItem('pb_admin_authenticated');
    localStorage.removeItem('pb_admin_auth_expiry');
    localStorage.removeItem('pb_admin_password');
  }, []);

  // 1. Initial Session Retrieval Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-emerald-300">Verifying Secure Admin Authorization...</p>
        <p className="text-xs text-stone-500 mt-1">Punjabi Bistro & Bakery • Dharamkot HQ</p>
      </div>
    );
  }

  // 2. Unauthenticated: Render Google OAuth Login Screen
  if (!session || !user) {
    return <AdminLoginScreen onSignIn={signInWithGoogle} authError={authError} />;
  }

  // 3. Authenticated via Google, but not in admin_users allowlist: Render Access Denied with one-time bootstrap guide
  if (!isAuthorized) {
    return (
      <AdminAccessDenied
        user={user}
        onSignOut={signOut}
        onRefresh={refreshAuthorization}
        isChecking={isCheckingAuth}
      />
    );
  }

  // 4. Authenticated & Authorized: Render Full Protected Admin Dashboard
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Banner with Authorized Admin Status, Storefront Switcher and Sign Out Button */}
      <div className="bg-emerald-950 text-white text-xs py-2.5 px-4 sm:px-6 border-b border-emerald-900 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold tracking-wide">Staff & Kitchen Operations Portal</span>
          </div>

          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-900 text-[10px] text-emerald-200 border border-emerald-800">
            Dharamkot HQ
          </span>

          {/* Current Authorized Admin Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-700/60 text-emerald-200 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium truncate max-w-[200px]">{user.email}</span>
            <span className="font-bold uppercase text-[9px] bg-emerald-800 px-1.5 py-0.2 rounded text-emerald-100">
              {adminRole || 'admin'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-1.5 bg-rose-900/80 hover:bg-rose-800 active:scale-[0.98] text-rose-100 border border-rose-700/60 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            title="Sign out of Google OAuth session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          <Link
            to="/"
            onClick={() => setIsAdminView(false)}
            className="inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 active:scale-[0.98] text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
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
