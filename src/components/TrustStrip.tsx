import React from 'react';
import { Star, ShieldCheck, Clock, Truck, Utensils, Award } from 'lucide-react';

export const TrustStrip: React.FC = () => {
  return (
    <section className="bg-emerald-50/50 border-y border-emerald-100 py-3 sm:py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-2.5 sm:gap-3 lg:gap-4">
          
          {/* Trust Point 1: Google Rating */}
          <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-white/80 rounded-2xl border border-emerald-100/90 shadow-2xs">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-700 flex-shrink-0">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-500 text-amber-500" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-[#0F2916] truncate">
                4.4 / 5 Rating
              </div>
              <div className="text-[10px] sm:text-xs text-emerald-800/80 truncate">170+ Google Reviews</div>
            </div>
          </div>

          {/* Trust Point 2: Eggless Bakery */}
          <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-white/80 rounded-2xl border border-emerald-100/90 shadow-2xs">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-700/15 flex items-center justify-center text-emerald-800 flex-shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-[#0F2916] truncate">Eggless Bakery</div>
              <div className="text-[10px] sm:text-xs text-emerald-800/80 truncate">100% Pure Veg Line</div>
            </div>
          </div>

          {/* Trust Point 3: Same-Day Delivery */}
          <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-white/80 rounded-2xl border border-emerald-100/90 shadow-2xs">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-800/15 flex items-center justify-center text-emerald-800 flex-shrink-0">
              <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-[#0F2916] truncate">Same-Day Delivery</div>
              <div className="text-[10px] sm:text-xs text-emerald-800/80 truncate">Fixed Zone Rates</div>
            </div>
          </div>

          {/* Trust Point 4: Service Facilities */}
          <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-white/80 rounded-2xl border border-emerald-100/90 shadow-2xs">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-600/15 flex items-center justify-center text-emerald-800 flex-shrink-0">
              <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-[#0F2916] truncate">Dine-In & Takeaway</div>
              <div className="text-[10px] sm:text-xs text-emerald-800/80 truncate">Drive-through Counter</div>
            </div>
          </div>

          {/* Trust Point 5: Transparent Timing */}
          <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-white/80 rounded-2xl border border-emerald-100/90 shadow-2xs col-span-2 sm:col-span-2 md:col-span-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-800/15 flex items-center justify-center text-emerald-800 flex-shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-[#0F2916] truncate">Structured Slots</div>
              <div className="text-[10px] sm:text-xs text-emerald-800/80 truncate">Live Order Updates</div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
