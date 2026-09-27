import React, { useState } from 'react';
import { ArrowLeft, AlertCircle, Eye, EyeOff, Lock, KeyRound, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

export const AdminLoginScreen: React.FC = () => {
  const { loginStep1, loginStep2, authError, clearAuthError } = useAdminAuth();

  // Step 1: username and password
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: challenge token and security key
  const [step1Token, setStep1Token] = useState<string | null>(null);
  const [securityKey, setSecurityKey] = useState('');
  const [showSecurityKey, setShowSecurityKey] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 Submission: verify username and password
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !username.trim() || !password) return;

    setIsSubmitting(true);
    try {
      const res = await loginStep1(username.trim(), password);
      if (res.success && res.step1Token) {
        setStep1Token(res.step1Token);
        setPassword(''); // Immediately clear plaintext password from component memory
        setCurrentStep(2);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2 Submission: verify security key using the step 1 challenge token
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !step1Token || !securityKey.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await loginStep2(step1Token, securityKey.trim());
      if (res.success) {
        setSecurityKey(''); // Clear security key from memory
      } else {
        // If challenge token expired or invalid, prompt user to restart step 1
        if (res.error?.includes('expired') || res.error?.includes('start over')) {
          setStep1Token(null);
          setCurrentStep(1);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToStep1 = () => {
    clearAuthError();
    setStep1Token(null);
    setSecurityKey('');
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 text-stone-100">
      {/* Top Bar */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link
          to="/"
          id="btn-return-storefront"
          className="inline-flex items-center gap-2 text-xs font-medium text-stone-400 hover:text-white transition-colors bg-stone-800 hover:bg-stone-700 px-3.5 py-1.5 rounded-xl cursor-pointer"
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
              {currentStep === 1 ? <Lock className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <h1 className="text-2xl font-bold font-serif text-white tracking-tight">
              {currentStep === 1 ? 'Administrator Login' : 'Security Verification'}
            </h1>
            <p className="text-xs text-stone-400 mt-1.5">
              {currentStep === 1
                ? 'Step 1 of 2: Enter Administrator Credentials'
                : 'Step 2 of 2: Two-Step Authentication'}
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

          {/* Step Indicator Badges */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                currentStep === 1
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-700 text-stone-300'
              }`}
            >
              <span>1</span>
              <span>Credentials</span>
            </div>
            <div className="w-4 h-px bg-stone-600" />
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                currentStep === 2
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-700/50 text-stone-500'
              }`}
            >
              <span>2</span>
              <span>Security Key</span>
            </div>
          </div>

          {/* STEP 1 FORM */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4" noValidate>
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

              <div className="pt-2">
                <button
                  type="submit"
                  id="btn-admin-continue-step2"
                  disabled={isSubmitting || !username.trim() || !password}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying credentials...</span>
                    </>
                  ) : (
                    <span>Continue to Step 2 →</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2 FORM */}
          {currentStep === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-4" noValidate>
              <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-700 text-xs text-stone-300 flex items-center justify-between">
                <span>Account: <strong className="text-white">{username}</strong></span>
                <button
                  type="button"
                  onClick={handleBackToStep1}
                  className="text-emerald-400 hover:text-emerald-300 font-medium underline text-xs cursor-pointer"
                >
                  Change Account
                </button>
              </div>

              <div>
                <label
                  htmlFor="admin-security-key-input"
                  className="block text-xs font-semibold text-stone-300 mb-1.5"
                >
                  Security Key / PIN
                </label>
                <div className="relative">
                  <input
                    id="admin-security-key-input"
                    name="securityKey"
                    type={showSecurityKey ? 'text' : 'password'}
                    autoComplete="off"
                    required
                    autoFocus
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

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  id="btn-admin-sign-in"
                  disabled={isSubmitting || !securityKey.trim()}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying Security Key...</span>
                    </>
                  ) : (
                    <span>Verify & Enter Admin Portal</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBackToStep1}
                  className="w-full py-2 px-4 rounded-xl bg-transparent hover:bg-stone-700/50 text-stone-400 hover:text-stone-200 text-xs font-medium transition-colors cursor-pointer text-center"
                >
                  ← Back to Step 1
                </button>
              </div>
            </form>
          )}
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
