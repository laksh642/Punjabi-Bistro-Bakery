import React, { useState } from 'react';
import { ArrowLeft, AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

export const AdminLoginScreen: React.FC = () => {
  const { login, authError } = useAdminAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [securityKey, setSecurityKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSecurityKey, setShowSecurityKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await login(username, password, securityKey);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 text-stone-100">
      {/* Top Bar */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link
          to="/"
          id="btn-return-storefront"
          className="inline-flex items-center gap-2 text-xs font-medium text-stone-400 hover:text-white transition-colors bg-stone-800 hover:bg-stone-700 px-3.5 py-1.5 rounded-xl"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Storefront</span>
        </Link>
        <span className="text-[11px] text-stone-400 font-mono tracking-wider uppercase flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Private Portal
        </span>
      </header>

      {/* Main Login Card */}
      <main className="max-w-md w-full mx-auto my-auto py-4">
        <div className="bg-stone-800 text-stone-100 rounded-2xl shadow-xl p-8 sm:p-10 border border-stone-700 relative overflow-hidden">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-stone-900 border border-stone-700 text-emerald-400 mb-4 shadow-inner">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold font-serif text-white tracking-tight">
              Administrator Login
            </h1>
            <p className="text-xs text-stone-400 mt-1.5">
              Punjabi Bistro &amp; Bakery Management
            </p>
          </div>

          {/* Error Banner */}
          {authError && (
            <div
              id="admin-auth-error-banner"
              role="alert"
              className="mb-6 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <p className="font-medium">{authError}</p>
            </div>
          )}

          {/* Neutral Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Field 1: Username */}
            <div>
              <label
                htmlFor="admin-username-input"
                className="block text-xs font-semibold text-stone-300 mb-1.5"
              >
                Username
              </label>
              <input
                id="admin-username-input"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-900 text-white placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>

            {/* Field 2: Password */}
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
                  placeholder="Enter password"
                  className="w-full text-sm px-3.5 py-2.5 pr-10 rounded-xl border border-stone-700 bg-stone-900 text-white placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  id="btn-toggle-password-visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Field 3: Security Key (Exact label specified by user) */}
            <div>
              <label
                htmlFor="admin-security-key-input"
                className="block text-xs font-semibold text-stone-300 mb-1.5"
              >
                Security Key
              </label>
              <div className="relative">
                <input
                  id="admin-security-key-input"
                  name="securityKey"
                  type={showSecurityKey ? 'text' : 'password'}
                  autoComplete="off"
                  required
                  value={securityKey}
                  onChange={(e) => setSecurityKey(e.target.value)}
                  placeholder="Enter security key"
                  className="w-full text-sm px-3.5 py-2.5 pr-10 rounded-xl border border-stone-700 bg-stone-900 text-white placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  id="btn-toggle-security-key-visibility"
                  onClick={() => setShowSecurityKey(!showSecurityKey)}
                  aria-label={showSecurityKey ? 'Hide security key' : 'Show security key'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 p-1 cursor-pointer"
                >
                  {showSecurityKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <div className="pt-2">
              <button
                type="submit"
                id="btn-admin-sign-in"
                disabled={isSubmitting || !username || !password || !securityKey}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto text-center text-xs text-stone-500">
        Punjabi Bistro &amp; Bakery, Dharamkot
      </footer>
    </div>
  );
};

export default AdminLoginScreen;
