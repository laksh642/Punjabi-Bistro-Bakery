import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, AlertCircle, Phone, LogIn, ShieldAlert, AlertTriangle, RotateCcw } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { CustomerIssue } from '../types';

type IssueStage = 'form' | 'submitting' | 'drawing_check' | 'pulse' | 'details_reveal' | 'error';

export const OrderIssueModal: React.FC = () => {
  const { isIssueModalOpen, setIsIssueModalOpen, submitIssue, businessSettings } = useStore();
  const { user, customerProfile, loginWithGoogle, openLoginModal } = useCustomerAuth();

  const [orderNumber, setOrderNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [issueType, setIssueType] = useState<CustomerIssue['issueType']>('late_delivery');
  const [description, setDescription] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [stage, setStage] = useState<IssueStage>('form');
  const [submittedTicketId, setSubmittedTicketId] = useState<string>('');

  // Pre-fill fields when customer is logged in
  useEffect(() => {
    if (user) {
      if (!customerName) {
        setCustomerName(customerProfile?.fullName || user.user_metadata?.full_name || user.email?.split('@')[0] || '');
      }
      if (!customerPhone && customerProfile?.phone) {
        setCustomerPhone(customerProfile.phone.replace(/\D/g, '').slice(0, 10));
      }
    }
  }, [user, customerProfile]);

  if (!isIssueModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setSubmitError('Customer sign-in required. Please sign in with your Google account to submit an issue ticket.');
      return;
    }

    const cleanDigits = customerPhone.replace(/\D/g, '');
    if (!customerName.trim() || !description.trim()) {
      setSubmitError('Please fill in your name and issue details.');
      return;
    }
    if (cleanDigits.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits.');
      return;
    }
    setPhoneError(null);
    setSubmitError(null);
    setStage('submitting');

    const ticketId = `ISS-${Date.now().toString().slice(-6)}`;
    setSubmittedTicketId(ticketId);

    try {
      const ok = await submitIssue({
        userId: user.id,
        orderNumber: orderNumber.trim() || 'N/A',
        customerName: customerName.trim(),
        customerPhone: cleanDigits,
        issueType,
        description: description.trim(),
      });

      if (ok) {
        // Choreographed green verification animation sequence
        setStage('drawing_check');
        setTimeout(() => setStage('pulse'), 500);
        setTimeout(() => setStage('details_reveal'), 1000);
      } else {
        setSubmitError('Unable to record issue ticket at this time. Please check your connection and try again.');
        setStage('error');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'An unexpected error occurred while saving your issue ticket.');
      setStage('error');
    }
  };

  const handleClose = () => {
    setIsIssueModalOpen(false);
    setStage('form');
    setSubmitError(null);
    setDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 to-[#0B2E15] text-white border-b border-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif text-base sm:text-lg font-bold text-white">
              Customer Support & Issue Resolution
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-emerald-800 text-emerald-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 bg-white">
          {!user ? (
            /* Guest Barrier: Require Google Customer Login */
            <div className="text-center py-6 space-y-4 animate-in fade-in duration-300">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
                <ShieldAlert className="w-8 h-8 text-amber-600" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Customer Sign-In Required
                </h3>
                <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
                  To protect your privacy, link tickets directly to your customer account, and receive updates from our manager, please sign in with your Google account.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => loginWithGoogle()}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In with Google</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Instant Call Alternative */}
              <div className="pt-4 mt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
                <span>Need immediate phone support?</span>
                <a
                  href={`tel:${businessSettings.phone.replace(/\s+/g, '')}`}
                  className="font-bold text-emerald-700 flex items-center gap-1 hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call {businessSettings.phone}</span>
                </a>
              </div>
            </div>
          ) : stage === 'submitting' ? (
            /* Submitting / Processing State */
            <div className="py-12 text-center space-y-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 mx-auto relative flex items-center justify-center">
                <svg className="w-16 h-16 animate-spin text-emerald-700" viewBox="0 0 50 50">
                  <circle
                    className="opacity-20"
                    cx="25"
                    cy="25"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <circle
                    className="text-emerald-700"
                    cx="25"
                    cy="25"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="80"
                    strokeDashoffset="60"
                    fill="none"
                  />
                </svg>
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Registering your issue ticket...
              </h3>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Recording issue in the bakery support database
              </p>
            </div>
          ) : stage === 'error' ? (
            /* Error State (Never Fakes Success) */
            <div className="py-8 text-center space-y-3 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Couldn't submit your issue
              </h3>
              <p className="text-xs text-stone-600 max-w-xs mx-auto leading-relaxed">
                {submitError || 'The support ticket could not be recorded at this moment. Please try again.'}
              </p>
              <div className="pt-2 flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setStage('form')}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : stage === 'drawing_check' || stage === 'pulse' || stage === 'details_reveal' ? (
            /* Premium Authenticated Confirmation Animation */
            <div className="py-6 text-center space-y-4 animate-in fade-in duration-300">
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                {stage === 'pulse' && (
                  <div
                    className="absolute inset-0 rounded-full border-2 border-emerald-500/60 animate-ping pointer-events-none"
                    aria-hidden="true"
                  />
                )}

                <svg className="w-20 h-20" viewBox="0 0 80 80" fill="none">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke="#16A34A"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    className="transition-all duration-300 opacity-100"
                  />
                  <path
                    d="M26 42.5 L35.5 52 L55 30.5"
                    stroke="#16A34A"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-pb-checkmark"
                  />
                </svg>
              </div>

              <div className="space-y-1">
                <h3 className="font-serif text-2xl font-extrabold text-stone-900">
                  Issue Submitted
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 max-w-xs mx-auto leading-relaxed">
                  Your issue has been successfully registered.
                </p>
              </div>

              {submittedTicketId && (
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl max-w-xs mx-auto text-left text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 text-[11px] font-semibold uppercase">Ticket ID</span>
                    <span className="font-mono font-bold text-stone-900 text-xs">#{submittedTicketId}</span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed pt-1">
                    The store manager at Punjabi Bistro has received your ticket and will contact you directly.
                  </p>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center max-w-xs mx-auto">
                <button
                  onClick={handleClose}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  Done
                </button>
                <a
                  href={`tel:${businessSettings.phone.replace(/\s+/g, '')}`}
                  className="flex-1 border border-stone-200 text-stone-800 hover:bg-stone-50 text-xs font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Call Bistro</span>
                </a>
              </div>
            </div>
          ) : (
            /* Issue Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-stone-100 text-xs text-stone-600">
                <span>Signed in as: <strong className="text-emerald-900">{user.email}</strong></span>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                We take all feedback seriously. If you experienced a delay, missing item, or quality concern, please let us know so our manager can assist immediately.
              </p>

              {submitError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{submitError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-800 mb-1">
                  Issue Type *
                </label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value as CustomerIssue['issueType'])}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:border-emerald-700"
                >
                  <option value="late_delivery">Delivery Delay / Taking Too Long</option>
                  <option value="missing_item">Missing Item in Order</option>
                  <option value="wrong_item">Wrong Item Delivered</option>
                  <option value="cake_issue">Custom Cake Issue / Text Mistake</option>
                  <option value="food_quality">Food Quality / Temperature Concern</option>
                  <option value="delivery_charge">Delivery Charge Confusion</option>
                  <option value="other">Other Inquiry</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-800 mb-1">
                    Order # (Optional)
                  </label>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="e.g. PB-4081"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:border-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-800 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                      setPhoneError(null);
                    }}
                    placeholder="10-digit mobile number"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:border-emerald-700"
                  />
                  {phoneError ? (
                    <p className="text-[10px] text-rose-600 font-medium mt-1">{phoneError}</p>
                  ) : customerPhone && customerPhone.length !== 10 ? (
                    <p className="text-[10px] text-amber-700 font-medium mt-1">{customerPhone.length}/10 digits</p>
                  ) : null}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-800 mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:border-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-800 mb-1">
                  Describe what happened *
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please provide details so we can resolve this right away..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:border-emerald-700"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>Submit Support Ticket</span>
                </button>
              </div>

              {/* Instant Call Alternative */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
                <span>Need immediate response?</span>
                <a
                  href={`tel:${businessSettings.phone.replace(/\s+/g, '')}`}
                  className="font-bold text-emerald-700 flex items-center gap-1 hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call {businessSettings.phone}</span>
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
