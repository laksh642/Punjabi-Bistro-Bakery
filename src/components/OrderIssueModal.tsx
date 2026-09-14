import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle2, Phone, MessageCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { CustomerIssue } from '../types';

export const OrderIssueModal: React.FC = () => {
  const { isIssueModalOpen, setIsIssueModalOpen, submitIssue, businessSettings } = useStore();

  const [orderNumber, setOrderNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [issueType, setIssueType] = useState<CustomerIssue['issueType']>('late_delivery');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isIssueModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !description.trim()) {
      return;
    }

    submitIssue({
      orderNumber: orderNumber.trim() || 'N/A',
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      issueType,
      description: description.trim(),
    });

    setSubmitted(true);
  };

  const handleClose = () => {
    setIsIssueModalOpen(false);
    setSubmitted(false);
    setDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-lg w-full border border-emerald-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-900 to-[#0B2E15] text-white border-b border-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-emerald-300" />
            <h2 className="font-serif text-lg font-bold text-white">
              Customer Support & Issue Resolution
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-emerald-800 text-emerald-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-white">
          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl border border-emerald-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-xl font-bold text-emerald-950">
                Issue Ticket Logged
              </h3>
              <p className="text-xs text-emerald-800/80 max-w-xs mx-auto leading-relaxed">
                Thank you for bringing this to our attention. The manager at Punjabi Bistro has received your ticket and will call you back shortly.
              </p>
              <div className="pt-2">
                <button
                  onClick={handleClose}
                  className="bg-emerald-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-emerald-800 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-emerald-800/80 leading-relaxed">
                We take all feedback seriously. If you experienced a delay, missing item, or quality concern, please let us know so we can make it right immediately.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
                  Issue Type *
                </label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value as CustomerIssue['issueType'])}
                  className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:outline-none focus:border-emerald-600"
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
                    Order # (Optional)
                  </label>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="e.g. PB-4081"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 98551 12233"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
                  Describe what happened *
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please provide details so we can resolve this right away..."
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-900 hover:bg-emerald-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Submit Support Ticket
                </button>
              </div>

              {/* Instant Call Alternative */}
              <div className="pt-3 border-t border-emerald-100 flex items-center justify-between text-xs text-emerald-800">
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
