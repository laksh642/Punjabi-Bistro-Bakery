import React, { useState } from 'react';
import { ShieldCheck, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AdminLoginScreenProps {
  onSignIn: () => Promise<void>;
  authError?: string | null;
}

export const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({ onSignIn, authError }) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setLocalError(null);
      await onSignIn();
    } catch (err: unknown) {
      setIsSigningIn(false);
      setLocalError(err instanceof Error ? err.message : 'Google sign-in could not be initiated.');
    }
  };

  const displayError = authError || localError;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-emerald-900 to-stone-900 flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8 text-white">
      {/* Top Bar */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-200 hover:text-white transition-colors bg-white/10 hover:bg-white/15 px-3.5 py-1.5 rounded-full backdrop-blur-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Storefront</span>
        </Link>
        <span className="text-[11px] text-emerald-300/80 font-mono tracking-wider uppercase flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          SECURE PORTAL
        </span>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-auto py-4">
        <div className="bg-white text-stone-900 rounded-3xl shadow-2xl p-8 sm:p-10 border border-emerald-100 relative overflow-hidden">
          {/* Top Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-emerald-600 to-amber-400" />

          {/* Logo & Header */}
          <div className="text-center mb-7">
            <div className="relative inline-block mb-3">
              <img
                src="/logoo.png"
                alt="Punjabi Bistro & Bakery"
                className="w-20 h-20 mx-auto rounded-full object-cover shadow-lg border-2 border-emerald-100"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute -bottom-1 -right-1 bg-emerald-700 text-white p-1.5 rounded-full shadow-md border-2 border-white">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Dharamkot HQ • Staff & Owner Access</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-emerald-950 tracking-tight">
              Owner / Admin Portal
            </h1>
            <p className="text-xs text-stone-600 mt-2 max-w-xs mx-auto leading-relaxed">
              Manage live kitchen orders, custom cake enquiries, menu pricing, and bakery operations securely.
            </p>
          </div>

          {/* Error Banner */}
          {displayError && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Notice</p>
                <p className="text-rose-700 text-[11px] mt-0.5">{displayError}</p>
              </div>
            </div>
          )}

          {/* Google Sign-In Action */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 active:scale-[0.99] text-stone-800 font-semibold text-sm shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
            >
              {isSigningIn ? (
                <div className="flex items-center gap-2 text-stone-600">
                  <div className="w-4 h-4 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
                  <span>Redirecting to Google...</span>
                </div>
              ) : (
                <>
                  {/* Official Google 'G' Icon */}
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span className="text-stone-900 group-hover:text-emerald-950 font-medium">
                    Continue with Google
                  </span>
                </>
              )}
            </button>

            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 text-center">
              <p className="text-xs text-stone-600 font-medium">
                Only specifically authorized bakery administrator Google accounts can access this portal.
              </p>
              <p className="text-[11px] text-stone-400 mt-1">
                Zero passwords required • Managed via Supabase Auth & RLS
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-md w-full mx-auto text-center text-xs text-emerald-300/60">
        Punjabi Bistro & Bakery, Dharamkot • Private Operations Gateway
      </div>
    </div>
  );
};
