import React, { useState } from 'react';
import { ArrowLeft, AlertCircle, Eye, EyeOff, Lock, ShieldCheck, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { PunjabiBistroLogo } from './PunjabiBistroLogo';

export const AdminLoginScreen: React.FC = () => {
  const { loginWithPassword, loginWithGoogle, authError, clearAuthError } = useAdminAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !identifier.trim() || !password) return;

    setIsSubmitting(true);
    clearAuthError();
    try {
      await loginWithPassword(identifier.trim(), password);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleClick = async () => {
    if (isGoogleSubmitting) return;
    setIsGoogleSubmitting(true);
    clearAuthError();
    try {
      await loginWithGoogle();
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 text-stone-100 font-sans">
      {/* Top Header */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link
          to="/"
          id="btn-return-storefront"
          className="inline-flex items-center gap-2 text-xs font-medium text-stone-400 hover:text-white transition-colors bg-stone-800/80 hover:bg-stone-700 px-3.5 py-1.5 rounded-xl cursor-pointer border border-stone-700/60"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Storefront</span>
        </Link>
        <span className="text-[11px] text-stone-400 font-mono tracking-wider uppercase flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Private Portal
        </span>
      </header>

      {/* Main Authentication Card */}
      <main className="max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-stone-800/90 backdrop-blur-md text-stone-100 rounded-3xl shadow-2xl p-8 sm:p-10 border border-stone-700/80 relative overflow-hidden">
          {/* Brand Header */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-stone-900/90 border border-stone-700 text-emerald-400 mb-3.5 shadow-inner">
              <PunjabiBistroLogo className="w-10 h-10 object-contain" />
            </div>
            <h1 className="text-2xl font-bold font-serif text-white tracking-tight">
              Operations Portal
            </h1>
            <p className="text-xs text-stone-400 mt-1">
              Punjabi Bistro &amp; Bakery • Dharamkot
            </p>
          </div>

          {/* Error Banner */}
          {authError && (
            <div
              id="admin-auth-error-banner"
              role="alert"
              className="mb-5 p-3.5 rounded-2xl bg-rose-950/90 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed">{authError}</p>
            </div>
          )}

          {/* Password Sign-in Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="admin-identifier-input"
                className="block text-xs font-semibold text-stone-300 mb-1.5"
              >
                Username or Email
              </label>
              <input
                id="admin-identifier-input"
                name="identifier"
                type="text"
                autoComplete="username"
                required
                autoFocus
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin or your@email.com"
                className="w-full text-sm px-4 py-2.5 rounded-xl border border-stone-700 bg-stone-900/90 text-white placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password-input"
                className="block text-xs font-semibold text-stone-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password-input"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="w-full text-sm px-4 py-2.5 pr-11 rounded-xl border border-stone-700 bg-stone-900/90 text-white placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  id="btn-toggle-password-visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                id="btn-admin-submit"
                disabled={isSubmitting || !identifier.trim() || !password}
                className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-semibold text-sm shadow-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Authenticating with Supabase...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Operations Portal</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-700/80" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-stone-800 px-3 text-stone-400 font-medium">Or</span>
            </div>
          </div>

          {/* Google OAuth Button for Owner */}
          <button
            type="button"
            id="btn-admin-google"
            onClick={handleGoogleClick}
            disabled={isGoogleSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-750 active:bg-stone-950 text-stone-200 font-medium text-xs sm:text-sm border border-stone-700 shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isGoogleSubmitting ? 'Connecting to Google...' : 'Sign In with Authorized Google Account'}</span>
          </button>

          {/* Security Assurance */}
          <div className="mt-6 pt-5 border-t border-stone-700/60 flex items-center justify-center gap-1.5 text-[11px] text-stone-400 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Authoritative Cloud Auth • Passwords encrypted server-side</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto text-center text-xs text-stone-500">
        Punjabi Bistro &amp; Bakery • Dharamkot, Himachal Pradesh
      </footer>
    </div>
  );
};

export default AdminLoginScreen;
