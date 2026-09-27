import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext';

export const CustomerAccountModal: React.FC = () => {
  const {
    isAccountModalOpen,
    setIsAccountModalOpen,
    user,
    customerProfile,
    updateCustomerProfile,
    logoutCustomer,
    setIsMyOrdersOpen,
  } = useCustomerAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [pincode, setPincode] = useState('176219');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    if (customerProfile) {
      setFullName(customerProfile.fullName || '');
      setPhone(customerProfile.phone || '');
      setAddress(customerProfile.address || '');
      setLandmark(customerProfile.landmark || '');
      setDeliveryInstructions(customerProfile.deliveryInstructions || '');
      setPincode(customerProfile.pincode || '176219');
    } else if (user) {
      setFullName(user.user_metadata?.full_name || user.user_metadata?.name || '');
    }
  }, [customerProfile, user, isAccountModalOpen]);

  if (!isAccountModalOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(false);

    try {
      await updateCustomerProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        landmark: landmark.trim(),
        deliveryInstructions: deliveryInstructions.trim(),
        pincode: pincode.trim(),
      });
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err) {
      console.error('Save profile error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-emerald-100 flex flex-col max-h-[92vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0B2E15] via-[#0F381B] to-[#082210] p-5 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-lg shadow-sm border border-emerald-600/40">
                {fullName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'C'}
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-serif font-bold text-white leading-tight">
                  Customer Profile & Saved Address
                </h2>
                <p className="text-xs text-emerald-200/90">{user.email}</p>
              </div>
            </div>

            <button
              onClick={() => setIsAccountModalOpen(false)}
              className="p-1.5 text-emerald-300/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-stone-50/40">
            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">Delivery address & contact details saved successfully!</span>
              </div>
            )}

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Contact Details
              </h3>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="e.g. Lakshit Goyal"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Contact Phone (for delivery driver updates)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="e.g. 9876543210"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Google Account Email (Verified)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="w-full pl-9 pr-3 py-2 text-xs bg-stone-100 border border-stone-200 rounded-lg text-stone-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Default Dharamkot Delivery Address
              </h3>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  House/Hotel/Cafe/Street Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="e.g. Room 204, Cloud 9 Cafe, Upper Dharamkot"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Landmark
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="e.g. Near German Bakery"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="176219"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Special Delivery Instructions (Optional)
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <textarea
                    rows={2}
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="e.g. Leave with reception, ring doorbell twice..."
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsAccountModalOpen(false);
                  setIsMyOrdersOpen(true);
                }}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>View My Orders</span>
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Details'}</span>
              </button>
            </div>

            <div className="pt-4 border-t border-stone-200 flex justify-between items-center text-xs">
              <span className="text-stone-400">Authenticated via Google</span>
              <button
                type="button"
                onClick={logoutCustomer}
                className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
