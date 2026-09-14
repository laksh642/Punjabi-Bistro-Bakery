import React, { useState } from 'react';
import { Lock, Eye, EyeOff, KeyRound, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AdminLockScreenProps {
  onUnlock: () => void;
  savedPassword: string;
}

export const AdminLockScreen: React.FC<AdminLockScreenProps> = ({ onUnlock, savedPassword }) => {
  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setErrorMessage('');
    setIsSubmitting(true);

    setTimeout(() => {
      const targetPassword = savedPassword || 'bistro123';
      if (inputPassword.trim() === targetPassword.trim()) {
        if (rememberDevice) {
          // 24 hours expiry
          const expiry = Date.now() + 24 * 60 * 60 * 1000;
          localStorage.setItem('pb_admin_auth_expiry', expiry.toString());
          localStorage.setItem('pb_admin_authenticated', 'true');
        } else {
          sessionStorage.setItem('pb_admin_authenticated', 'true');
        }
        onUnlock();
      } else {
        setError(true);
        setErrorMessage('Incorrect password. Please verify with kitchen management.');
      }
      setIsSubmitting(false);
    }, 250);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-emerald-900 to-stone-900 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 text-white">
      {/* Top Header */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-300 hover:text-white transition-colors bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-full backdrop-blur-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Storefront</span>
        </Link>
        <span className="text-[11px] text-emerald-300/80 font-mono tracking-wider uppercase">
          SECURE PORTAL v2.5
        </span>
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full mx-auto my-auto">
        <div className="bg-white text-stone-900 rounded-3xl shadow-2xl p-8 sm:p-10 border border-emerald-100 relative overflow-hidden">
          {/* Subtle Top Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-emerald-600 to-amber-400" />

          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-4">
              <img
                src="/logoo.png"
                alt="Punjabi Bistro & Bakery"
                className="w-20 h-20 mx-auto rounded-full object-cover shadow-lg border-2 border-emerald-100"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute -bottom-1 -right-1 bg-emerald-700 text-white p-1.5 rounded-full shadow-md border-2 border-white">
                <Lock className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Staff & Owner Access</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-emerald-950 tracking-tight">
              Admin Portal
            </h1>
            <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
              Please enter the master administration passcode to manage live kitchen orders, menu pricing, and bakery settings.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="admin-password" className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Master Passcode
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={inputPassword}
                  onChange={(e) => {
                    setInputPassword(e.target.value);
                    if (error) setError(false);
                  }}
                  placeholder="Enter passcode..."
                  required
                  autoFocus
                  className={`w-full pl-10 pr-10 py-3 bg-stone-50 border text-sm rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                    error
                      ? 'border-red-400 focus:ring-red-400 focus:border-red-400 bg-red-50/50'
                      : 'border-stone-200 focus:ring-emerald-600 focus:border-emerald-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-700 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <div className="mt-2 text-xs text-red-600 font-medium flex items-center gap-1.5 animate-bounce">
                  <span>⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs text-stone-600">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="w-4 h-4 text-emerald-700 rounded border-stone-300 focus:ring-emerald-600 cursor-pointer"
                />
                <span>Remember this device for 24h</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-emerald-900/20 transition-all cursor-pointer disabled:opacity-75"
            >
              <Lock className="w-4 h-4" />
              <span>{isSubmitting ? 'Verifying...' : 'Unlock Admin Portal'}</span>
            </button>
          </form>

          {/* Helpful Demo/Setup Note */}
          <div className="mt-6 pt-5 border-t border-stone-100 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 text-[11px] text-stone-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Default Passcode: <strong className="font-mono text-emerald-900 font-bold">{savedPassword || 'bistro123'}</strong></span>
            </div>
            <p className="text-[10px] text-stone-400 mt-2">
              You can change this password anytime in the Settings tab inside the dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-md w-full mx-auto text-center text-xs text-emerald-300/60">
        Punjabi Bistro & Bakery Dharamkot • Protected Operations Gateway
      </div>
    </div>
  );
};
