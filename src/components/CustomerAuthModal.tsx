import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Sparkles, MapPin, Clock, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { PunjabiBistroLogo } from './PunjabiBistroLogo';

export const CustomerAuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    loginWithGoogle,
    loginWithDemoCustomer,
    user,
    customerProfile,
    logoutCustomer,
    setIsMyOrdersOpen,
    setIsAccountModalOpen,
  } = useCustomerAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const result = await loginWithGoogle();
      if (!result.success) {
        setAuthError(
          result.error || 'Google Sign-in could not be completed. You may also use Quick Sign-in below.'
        );
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Unexpected error signing in with Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = () => {
    loginWithDemoCustomer({
      name: 'Lakshit Goyal',
      email: 'lakshit@punjabibistro.com',
      phone: '9876543210',
      address: 'Near German Bakery, Dharamkot',
    });
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
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-300/30">
                  Customer Portal
                </span>
                <h2 className="text-xl font-serif font-bold text-white leading-tight">
                  Punjabi Bistro Dharamkot
                </h2>
              </div>
            </div>

            <p className="text-xs text-emerald-100/90 leading-relaxed">
              Sign in with your Google account to access your orders, track live baking status, and save your Dharamkot delivery address.
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
              // Already Signed In view
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-lg shadow-sm">
                    {customerProfile?.fullName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'C'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-emerald-950 truncate">
                      {customerProfile?.fullName || 'Valued Customer'}
                    </p>
                    <p className="text-xs text-emerald-700 truncate">{user.email}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Authenticated Customer
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => {
                      setIsAuthModalOpen(false);
                      setIsMyOrdersOpen(true);
                    }}
                    className="p-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  >
                    <Clock className="w-4 h-4" />
                    <span>My Orders</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsAuthModalOpen(false);
                      setIsAccountModalOpen(true);
                    }}
                    className="p-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Saved Address</span>
                  </button>
                </div>

                <button
                  onClick={logoutCustomer}
                  className="w-full py-2.5 text-xs text-stone-500 hover:text-rose-600 font-semibold transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              // Sign-In View
              <div className="space-y-4">
                {/* Benefits List */}
                <div className="space-y-2.5 py-1">
                  <div className="flex items-center gap-2.5 text-xs text-stone-700">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100/80 text-emerald-800 flex items-center justify-center shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <span>Real-time kitchen order tracking and order history</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-stone-700">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100/80 text-emerald-800 flex items-center justify-center shrink-0">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <span>Saved Dharamkot address for instant 1-tap checkout</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-stone-700">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100/80 text-emerald-800 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <span>Encrypted & secure with official Google Authentication</span>
                  </div>
                </div>

                {/* Primary Google Sign In Button */}
                <button
                  id="google-signin-btn"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white border border-stone-300 hover:border-emerald-600 hover:bg-stone-50 text-stone-800 rounded-xl font-semibold text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50"
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
                  <span>Continue with Google</span>
                </button>

                {/* Instant Sandbox Testing Fallback Button */}
                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-stone-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2 text-stone-400 font-medium">Or for testing</span>
                  </div>
                </div>

                <button
                  id="demo-signin-btn"
                  onClick={handleDemoSignIn}
                  className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 text-emerald-800 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>One-Click Test Login (Lakshit Goyal)</span>
                </button>

                <p className="text-[11px] text-center text-stone-500 leading-tight">
                  By continuing, you agree to our service terms. Your information is strictly used for order fulfillment in Dharamkot.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
