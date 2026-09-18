import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  Percent,
  DollarSign,
  Sparkles,
  X,
  Check,
  AlertCircle,
  Calendar,
  ToggleLeft,
  ToggleRight,
  ShoppingBag,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Coupon } from '../types';

export const AdminCouponManager: React.FC = () => {
  const { coupons, addCoupon, updateCoupon, deleteCoupon, toggleCouponActive } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [discountType, setDiscountType] = useState<'flat' | 'percentage'>('flat');
  const [discountValue, setDiscountValue] = useState<number>(100);
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(undefined);
  const [minOrder, setMinOrder] = useState<number>(499);
  const [badge, setBadge] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setCode('');
    setTitle('₹100 FLAT OFF');
    setSubtitle('On orders above ₹499 • Freshly prepared pizzas, burgers & bakery items');
    setDiscountType('flat');
    setDiscountValue(100);
    setMaxDiscount(undefined);
    setMinOrder(499);
    setBadge('Special Offer');
    setExpiryDate('');
    setIsActive(true);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setTitle(coupon.title);
    setSubtitle(coupon.subtitle);
    setDiscountType(coupon.discountType);
    setDiscountValue(coupon.discountValue);
    setMaxDiscount(coupon.maxDiscount);
    setMinOrder(coupon.minOrder);
    setBadge(coupon.badge || '');
    setExpiryDate(coupon.expiryDate || '');
    setIsActive(coupon.isActive);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      setErrorMsg('Please provide a coupon code (e.g. BISTRO100)');
      return;
    }

    if (discountValue <= 0) {
      setErrorMsg('Discount value must be greater than 0');
      return;
    }

    if (minOrder < 0) {
      setErrorMsg('Minimum order criteria cannot be negative');
      return;
    }

    if (discountType === 'percentage' && discountValue > 100) {
      setErrorMsg('Percentage discount cannot exceed 100%');
      return;
    }

    if (editingCoupon) {
      updateCoupon({
        ...editingCoupon,
        code: cleanCode,
        title: title.trim() || `${discountType === 'flat' ? `₹${discountValue} OFF` : `${discountValue}% OFF`}`,
        subtitle: subtitle.trim() || `Valid on orders above ₹${minOrder}`,
        discountType,
        discountValue: Number(discountValue),
        maxDiscount: discountType === 'percentage' && maxDiscount ? Number(maxDiscount) : undefined,
        minOrder: Number(minOrder),
        badge: badge.trim() || undefined,
        expiryDate: expiryDate.trim() || undefined,
        isActive,
      });
    } else {
      // Check duplicate code
      if (coupons.some((c) => c.code.toUpperCase() === cleanCode)) {
        setErrorMsg(`Coupon code ${cleanCode} already exists. Please choose a unique code.`);
        return;
      }

      addCoupon({
        code: cleanCode,
        title: title.trim() || `${discountType === 'flat' ? `₹${discountValue} OFF` : `${discountValue}% OFF`}`,
        subtitle: subtitle.trim() || `Valid on orders above ₹${minOrder}`,
        discountType,
        discountValue: Number(discountValue),
        maxDiscount: discountType === 'percentage' && maxDiscount ? Number(maxDiscount) : undefined,
        minOrder: Number(minOrder),
        badge: badge.trim() || undefined,
        expiryDate: expiryDate.trim() || undefined,
        isActive,
      });
    }

    setIsModalOpen(false);
  };

  const activeCount = coupons.filter((c) => c.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header Banner & Summary Stats */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <Tag className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-stone-900">
                Coupons & Promotional Discounts
              </h2>
              <p className="text-xs sm:text-sm text-stone-500">
                Control active discount codes, minimum order buying criteria, and promo rules.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-stone-600">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Active Coupons: <strong className="text-stone-900">{activeCount}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 font-medium">
              Total Created: <strong className="text-stone-900">{coupons.length}</strong>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-xs cursor-pointer active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Coupon</span>
        </button>
      </div>

      {/* Coupons List (Responsive: Cards on Mobile/Tablet, Clean Grid on Laptop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((coupon) => {
          return (
            <div
              key={coupon.id}
              className={`rounded-2xl border transition-all p-4 flex flex-col justify-between relative bg-white shadow-xs ${
                coupon.isActive
                  ? 'border-emerald-200 hover:border-emerald-400'
                  : 'border-stone-200 opacity-70 bg-stone-50'
              }`}
            >
              <div>
                {/* Top Row: Code Badge & Active Switch */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-emerald-950 text-amber-300 font-mono font-bold text-xs tracking-wider border border-emerald-800">
                      {coupon.code}
                    </span>
                    {coupon.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                        {coupon.badge}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleCouponActive(coupon.id)}
                    className="cursor-pointer transition-colors p-1"
                    title={coupon.isActive ? 'Deactivate Coupon' : 'Activate Coupon'}
                  >
                    {coupon.isActive ? (
                      <ToggleRight className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-stone-400" />
                    )}
                  </button>
                </div>

                {/* Coupon Value & Title */}
                <div className="mt-3">
                  <h3 className="font-serif font-bold text-base text-stone-900">
                    {coupon.title}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                    {coupon.subtitle}
                  </p>
                </div>

                {/* Key Criteria Metrics */}
                <div className="mt-3 grid grid-cols-2 gap-2 bg-stone-50 rounded-xl p-2.5 text-[11px] border border-stone-200/70">
                  <div>
                    <span className="text-stone-400 block font-medium">Discount</span>
                    <span className="font-bold text-stone-800">
                      {coupon.discountType === 'flat'
                        ? `₹${coupon.discountValue} Flat OFF`
                        : `${coupon.discountValue}% OFF`}
                      {coupon.maxDiscount ? ` (Cap ₹${coupon.maxDiscount})` : ''}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 block font-medium">Min Buying Criteria</span>
                    <span className="font-bold text-emerald-800">
                      ₹{coupon.minOrder} Min Order
                    </span>
                  </div>
                </div>

                {/* Expiry status */}
                {coupon.expiryDate && (
                  <div className="mt-2 text-[11px] text-stone-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-stone-400" />
                    <span>Expires: {new Date(coupon.expiryDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Bottom Actions: Edit & Delete */}
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <span
                  className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                    coupon.isActive ? 'text-emerald-700' : 'text-stone-500'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      coupon.isActive ? 'bg-emerald-500' : 'bg-stone-400'
                    }`}
                  />
                  {coupon.isActive ? 'Live on Storefront' : 'Inactive'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(coupon)}
                    className="p-1.5 text-stone-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                    title="Edit Coupon"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete coupon ${coupon.code}?`)) {
                        deleteCoupon(coupon.id);
                      }
                    }}
                    className="p-1.5 text-stone-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Coupon"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-emerald-950 text-white px-5 py-3.5 flex items-center justify-between border-b border-emerald-900">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm">
                  {editingCoupon ? `Edit Coupon (${editingCoupon.code})` : 'Create New Promotional Coupon'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-emerald-300 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveCoupon} className="p-5 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Coupon Code */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                  placeholder="e.g. WEEKEND20, FESTIVE100"
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl font-mono font-bold text-sm tracking-wider uppercase text-emerald-950 focus:outline-none focus:border-emerald-600"
                />
                <span className="text-[10px] text-stone-500 mt-1 block">
                  Customers will type this code in their cart to claim the discount.
                </span>
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Discount Type *
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 bg-stone-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setDiscountType('flat')}
                      className={`py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${
                        discountType === 'flat'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      Flat (₹) Off
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('percentage')}
                      className={`py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${
                        discountType === 'percentage'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      Percent (%) Off
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    {discountType === 'flat' ? 'Discount Amount (₹) *' : 'Percentage Rate (%) *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={discountType === 'percentage' ? 100 : 10000}
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl font-semibold text-stone-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Minimum Buying Criteria & Max Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Minimum Buying Criteria (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={minOrder}
                    onChange={(e) => setMinOrder(Number(e.target.value))}
                    placeholder="e.g. 399"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl font-semibold text-stone-900 focus:outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-stone-500 mt-0.5 block">
                    Cart subtotal must equal or exceed this amount.
                  </span>
                </div>

                {discountType === 'percentage' && (
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Max Discount Cap (₹)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={maxDiscount || ''}
                      onChange={(e) => setMaxDiscount(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="e.g. 75"
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl font-semibold text-stone-900 focus:outline-none focus:border-emerald-600"
                    />
                    <span className="text-[10px] text-stone-500 mt-0.5 block">
                      Limits maximum ₹ deduction on large orders.
                    </span>
                  </div>
                )}
              </div>

              {/* Title & Subtitle for Marketing Cards */}
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Headline Title (Displayed to Customers)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. ₹100 FLAT OFF or 15% OFF (Up to ₹75)"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Offer Subtitle / Terms Summary
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g. On orders above ₹499 • Freshly baked cakes & pizzas"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Badge & Expiry Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Tag / Badge (Optional)
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="e.g. Weekend Deal, Popular, Bakery"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Active Toggle Switch */}
              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div>
                  <span className="font-bold text-stone-800 block">Make Coupon Active Immediately</span>
                  <span className="text-[11px] text-stone-500">
                    Active coupons will display in the Top Offers Strip and are redeemable in cart.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className="cursor-pointer p-1"
                >
                  {isActive ? (
                    <ToggleRight className="w-7 h-7 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-stone-400" />
                  )}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 font-semibold rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingCoupon ? 'Update Coupon' : 'Save & Publish Coupon'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
