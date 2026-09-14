import React, { useState } from 'react';
import { ShieldAlert, LogOut, ArrowLeft, RefreshCw, Copy, Check, UserCheck, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { User } from '@supabase/supabase-js';

interface AdminAccessDeniedProps {
  user: User;
  onSignOut: () => Promise<void>;
  onRefresh: () => Promise<void>;
  isChecking?: boolean;
}

export const AdminAccessDenied: React.FC<AdminAccessDeniedProps> = ({
  user,
  onSignOut,
  onRefresh,
  isChecking = false,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const bootstrapSql = `-- Authorize this Google account as a Bakery Owner in Supabase:
INSERT INTO public.admin_users (id, email, role, is_active)
VALUES ('${user.id}', '${user.email || 'owner@punjabibistro.com'}', 'owner', true)
ON CONFLICT (id) DO UPDATE SET is_active = true, role = 'owner';`;

  const copyUserId = () => {
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  const copySql = () => {
    navigator.clipboard.writeText(bootstrapSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

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
      <div className="max-w-2xl w-full mx-auto flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-300 hover:text-white transition-colors bg-stone-800 hover:bg-stone-700 px-3.5 py-1.5 rounded-full"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Storefront</span>
        </Link>
        <span className="text-[11px] text-rose-400 font-mono tracking-wider uppercase flex items-center gap-1.5 bg-rose-950/60 border border-rose-800/60 px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          UNAUTHORIZED ACCOUNT
        </span>
      </div>

      {/* Main Card */}
      <div className="max-w-2xl w-full mx-auto my-6">
        <div className="bg-stone-800 border border-stone-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div className="w-14 h-14 rounded-2xl bg-rose-900/40 border border-rose-700/60 flex items-center justify-center text-rose-400 flex-shrink-0">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white font-serif">Access Denied</h1>
              <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                Your Google authentication succeeded, but this account has not been granted administrator permissions
                for Punjabi Bistro & Bakery.
              </p>
            </div>
          </div>

          {/* Current Google Account Details */}
          <div className="bg-stone-900/80 rounded-2xl p-4 border border-stone-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                Signed-In Google Identity
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-300 flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                <span>Google OAuth Verified</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-stone-400 block text-[11px]">Email:</span>
                <span className="font-medium text-stone-200 break-all">{user.email || 'No email provided'}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[11px]">Supabase Auth UUID:</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-stone-300 text-[11px] truncate">{user.id}</span>
                  <button
                    type="button"
                    onClick={copyUserId}
                    className="p-1 rounded hover:bg-stone-700 text-stone-400 hover:text-white transition-colors flex-shrink-0"
                    title="Copy User ID"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Initial Admin Bootstrap Instruction (For Bakery Owner / Developer) */}
          <div className="bg-amber-950/30 border border-amber-800/50 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span>Bakery Owner / Developer One-Time Setup</span>
              </div>
              <button
                type="button"
                onClick={copySql}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-900/60 hover:bg-amber-800/80 text-amber-200 text-xs font-semibold border border-amber-700/80 transition-colors"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>SQL Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy SQL Command</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-amber-200/90 leading-relaxed">
              If you are the bakery owner setting up this deployment for the first time, run the command below once in
              your <strong>Supabase Dashboard → SQL Editor</strong>:
            </p>

            <pre className="p-3 bg-stone-950 rounded-xl text-stone-300 text-[11px] font-mono overflow-x-auto border border-amber-900/40">
              <code>{bootstrapSql}</code>
            </pre>

            <p className="text-[11px] text-amber-300/70">
              Once you execute this query in Supabase, click <strong>&quot;Re-check Access&quot;</strong> below to enter
              the Admin Portal immediately.
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
      <div className="max-w-2xl w-full mx-auto text-center text-xs text-stone-500">
        Punjabi Bistro & Bakery • Dharamkot • Access Control System
      </div>
    </div>
  );
};
