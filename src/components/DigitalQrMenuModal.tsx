import React, { useState } from 'react';
import { X, Search, QrCode, Phone, MessageCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const DigitalQrMenuModal: React.FC = () => {
  const { isMenuOnlyMode, setIsMenuOnlyMode, products, categories, businessSettings } = useStore();
  const [selectedCat, setSelectedCat] = useState('all');
  const [search, setSearch] = useState('');

  if (!isMenuOnlyMode) return null;

  const filtered = products.filter((p) => {
    if (selectedCat !== 'all' && p.categoryId !== selectedCat) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      onClick={() => setIsMenuOnlyMode(false)}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-emerald-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 to-[#0B2E15] text-white flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-emerald-300 font-bold">
              Table & Takeaway Digital Menu
            </div>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-white">
              Punjabi Bistro & Bakery • Dharamkot
            </h2>
          </div>
          <button
            onClick={() => setIsMenuOnlyMode(false)}
            className="p-1.5 rounded-full hover:bg-emerald-800 text-emerald-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Categories */}
        <div className="p-4 bg-white border-b border-emerald-100 space-y-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items (e.g. pizza, cake, pasta)..."
            className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50/40 focus:outline-none focus:border-emerald-600 text-emerald-950"
          />

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.id)}
                className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer ${
                  selectedCat === c.id
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* List of items */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1 divide-y divide-emerald-100 bg-white">
          {filtered.map((item) => (
            <div key={item.id} className="pt-3 first:pt-0 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-emerald-950">{item.name}</span>
                  {item.isEggless && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold border border-emerald-200">
                      Eggless
                    </span>
                  )}
                  {item.isBestseller && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold border border-amber-200">
                      Bestseller
                    </span>
                  )}
                </div>
                <p className="text-xs text-emerald-800/80 leading-relaxed max-w-md">
                  {item.description}
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="font-bold text-base text-emerald-800">₹{item.price}</span>
                {!item.isAvailable && (
                  <span className="text-[10px] text-stone-500 block italic">Sold Out</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-emerald-50/80 border-t border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
          <span>To order, call table server or use online order cart.</span>
          <a
            href={`tel:${businessSettings.phone.replace(/\s+/g, '')}`}
            className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{businessSettings.phone}</span>
          </a>
        </div>
      </div>
    </div>
  );
};
