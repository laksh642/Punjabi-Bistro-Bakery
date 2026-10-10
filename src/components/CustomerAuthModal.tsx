import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, MapPin, Clock, AlertCircle, Mail, KeyRound, User as UserIcon } from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { PunjabiBistroLogo } from './PunjabiBistroLogo';

export const CustomerAuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    loginWithGoogle,
    loginWithEmail,
    signUpWithEmail,
    user,
    customerProfile,
    logoutCustomer,
    setIsMyOrdersOpen,
    setIsAccountModalOpen,
  } = useCustomerAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Email state
  const [emailTab, setEmailTab] = useState<'signin' | 'signup'>('signin');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');

  if (!isAuthModalOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const result = await loginWithGoogle();
      if (!result.success) {
        setAuthError(
          result.error || 'Google Sign-in could not be completed. Please try again.'
        );
        setIsLoading(false);
      }
      // On success, browser navigates to Google OAuth flow
    } catch (err: any) {
      setAuthError(err?.message || 'Unexpected error signing in with Google.');
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput.trim()) {
      setAuthError('Please enter both your email address and password.');
      return;
    }
    setIsLoading(true);
    setAuthError(null);

    try {
      if (emailTab === 'signin') {
        const res = await loginWithEmail(emailInput, passwordInput);
        if (!res.success) {
          setAuthError(res.error || 'Failed to sign in. Please verify your email and password.');
        }
      } else {
        if (!fullNameInput.trim()) {
          setAuthError('Please enter your full name.');
          setIsLoading(false);
          return;
        }
        const res = await signUpWithEmail(emailInput, passwordInput, fullNameInput);
        if (!res.success) {
          setAuthError(res.error || 'Failed to create account.');
        }
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-[#0B2E15] via-[#0F381B] to-[#082210] p-6 text-white relative">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 text-emerald-300/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <PunjabiBistroLogo className="w-12 h-12 shadow-md rounded-full bg-white p-1" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-300/30">
                Customer Account
              </span>
              <h2 className="text-xl font-serif font-bold text-white leading-tight mt-1">
                Punjabi Bistro &amp; Bakery
              </h2>
            </div>

            <p className="text-xs text-emerald-100/90 leading-relaxed mt-2">
              Sign in to place your order, confirm your Dharamkot delivery address, and view your complete order history.
            </p>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-5">
            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Sign-in Notice</p>
                  <p>{authError}</p>
                </div>
              </div>
            )}

            {user ? (
              // Already Signed In State
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-700 text-white font-bold text-base flex items-center justify-center shadow-xs">
                    {(customerProfile?.fullName || user.email || 'U')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-emerald-950 truncate">
                      {customerProfile?.fullName || user.user_metadata?.full_name || 'Valued Customer'}
                    </h3>
                    <p className="text-xs text-emerald-800 truncate">{user.email}</p>
                    <span className="text-[10px] text-emerald-700 font-medium inline-flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3 h-3" /> Signed in as Customer
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      setIsAuthModalOpen(false);
                      setIsMyOrdersOpen(true);
                    }}
                    className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>My Orders</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsAuthModalOpen(false);
                      setIsAccountModalOpen(true);
                    }}
                    className="py-2.5 px-3 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Delivery Address</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <button
                    onClick={() => logoutCustomer()}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer py-1"
                  >
                    Sign Out of Account
                  </button>
                  <button
                    onClick={() => setIsAuthModalOpen(false)}
                    className="text-xs text-stone-500 hover:text-stone-800 font-medium cursor-pointer py-1"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              // Sign-in Required View
              <div className="space-y-4">
                <div className="space-y-2.5 text-xs text-stone-600">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Secure ordering connected to your customer account</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Save your Dharamkot address for instant one-tap checkout</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>View baking and delivery progress in real time</span>
                  </div>
                </div>

                {/* Primary Google Login Button */}
                <button
                  id="btn-google-customer-auth"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-white hover:bg-stone-50 border-2 border-stone-200 hover:border-emerald-600 text-stone-800 rounded-xl font-semibold text-sm transition-all shadow-xs flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                  )}
                  <span>{isLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
                </button>

                {/* Email / Password Option Divider */}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-stone-200"></div>
                  <span className="flex-shrink mx-3 text-[11px] text-stone-400 font-medium uppercase tracking-wider">
                    Or with email
                  </span>
                  <div className="flex-grow border-t border-stone-200"></div>
                </div>

                {/* Optional Email Sign-In / Sign-Up Form */}
                <div className="space-y-3">
                  <div className="flex bg-stone-100 p-0.5 rounded-lg text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setEmailTab('signin')}
                      className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
                        emailTab === 'signin' ? 'bg-white text-emerald-900 shadow-xs font-semibold' : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmailTab('signup')}
                      className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
                        emailTab === 'signup' ? 'bg-white text-emerald-900 shadow-xs font-semibold' : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      Create Account
                    </button>
                  </div>

                  <form onSubmit={handleEmailSubmit} className="space-y-2.5">
                    {emailTab === 'signup' && (
                      <div className="relative">
                        <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                        <input
                          type="text"
                          placeholder="Your Full Name"
                          value={fullNameInput}
                          onChange={(e) => setFullNameInput(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-emerald-600"
                        />
                      </div>
                    )}
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                      <input
                        type="email"
                        placeholder="customer@example.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        required
                        className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-emerald-600"
                      />
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                      <input
                        type="password"
                        placeholder="Password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        required
                        className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-emerald-600"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? 'Processing...' : emailTab === 'signin' ? 'Sign In with Email' : 'Create Customer Account'}
                    </button>
                  </form>
                </div>

                <p className="text-[11px] text-center text-stone-500 leading-tight">
                  By continuing, your order and address will be securely linked to your customer profile.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
