import React, { useState } from 'react';
import { ShieldAlert, LogOut, ArrowLeft, RefreshCw, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { User } from '@supabase/supabase-js';

interface AdminAccessDeniedProps {
  user: User;
  onSignOut: () => Promise<void>;
  onRefresh: () => Promise<void>;
  isChecking?: boolean;
  authError?: string | null;
}

export const AdminAccessDenied: React.FC<AdminAccessDeniedProps> = ({
  user,
  onSignOut,
  onRefresh,
  isChecking = false,
  authError = null,
}) => {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await onSignOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8 text-stone-100">
      {/* Top Bar */}
      <div className="max-w-xl w-full mx-auto flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-300 hover:text-white transition-colors bg-stone-800 hover:bg-stone-700 px-3.5 py-1.5 rounded-full"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Storefront</span>
        </Link>
        <span className="text-[11px] text-stone-400 font-medium uppercase tracking-wider px-3 py-1 rounded-full bg-stone-800/80 border border-stone-700">
          Staff Portal
        </span>
      </div>

      {/* Main Card */}
      <div className="max-w-xl w-full mx-auto my-auto py-6">
        <div className="bg-stone-800 border border-stone-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div className="w-14 h-14 rounded-2xl bg-amber-950/70 border border-amber-800/60 flex items-center justify-center text-amber-400 flex-shrink-0">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white font-serif">Access Restricted</h1>
              <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                This Google account is not on the authorized staff list for the Punjabi Bistro & Bakery operations portal.
              </p>
            </div>
          </div>

          {/* Current Google Account Details */}
          <div className="bg-stone-900/80 rounded-2xl p-4 border border-stone-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                Signed-In Account
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                <span>Google Verified</span>
              </span>
            </div>

            <div className="text-xs">
              <span className="font-medium text-stone-200 break-all">{user.email || 'Google User'}</span>
            </div>
          </div>

          {authError && (
            <div className="p-3.5 rounded-2xl bg-amber-950/50 border border-amber-800/60 text-amber-200 text-xs leading-relaxed">
              {authError}
            </div>
          )}

          {/* Help Guidance */}
          <div className="p-4 rounded-2xl bg-stone-900/40 border border-stone-700/50 text-xs text-stone-300 leading-relaxed space-y-2">
            <p>
              If you are a team member or bakery owner, please ask the primary administrator to authorize your Google email address in the staff directory.
            </p>
            <p className="text-stone-400">
              If your account was just authorized, click <strong>Re-check Access</strong> below to load your permissions.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isChecking}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:scale-[0.99] text-white font-semibold text-xs shadow-md transition-all cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Checking Permissions...' : 'Re-check Access'}</span>
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-stone-700 hover:bg-stone-600 active:scale-[0.99] text-stone-200 hover:text-white font-semibold text-xs transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isSigningOut ? 'Signing out...' : 'Sign Out & Switch Account'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-xl w-full mx-auto text-center text-xs text-stone-500">
        Punjabi Bistro & Bakery • Dharamkot HQ
      </div>
    </div>
  );
};
