import React from 'react';
import { Star, ShieldCheck, Clock, Truck, Utensils, Award } from 'lucide-react';

export const TrustStrip: React.FC = () => {
  return (
    <section className="bg-emerald-50/50 border-y border-emerald-100 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 divide-y md:divide-y-0 md:divide-x divide-emerald-200/60">
          
          {/* Trust Point 1: Google Rating */}
          <div className="flex items-center gap-3 pt-2 md:pt-0 md:px-3 first:pt-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-700 flex-shrink-0">
              <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#0F2916] flex items-center gap-1">
                <span>4.4 / 5 Rating</span>
              </div>
              <div className="text-xs text-emerald-800/80">170+ Google Reviews</div>
            </div>
          </div>

          {/* Trust Point 2: Eggless Bakery */}
          <div className="flex items-center gap-3 pt-2 md:pt-0 md:px-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/15 flex items-center justify-center text-emerald-800 flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#0F2916]">Eggless Bakery</div>
              <div className="text-xs text-emerald-800/80">100% Pure Veg Line</div>
            </div>
          </div>

          {/* Trust Point 3: Same-Day Delivery */}
          <div className="flex items-center gap-3 pt-2 md:pt-0 md:px-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800/15 flex items-center justify-center text-emerald-800 flex-shrink-0">
              <Truck className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#0F2916]">Same-Day Delivery</div>
              <div className="text-xs text-emerald-800/80">Fixed Zone Rates</div>
            </div>
          </div>

          {/* Trust Point 4: Service Facilities */}
          <div className="flex items-center gap-3 pt-2 md:pt-0 md:px-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/15 flex items-center justify-center text-emerald-800 flex-shrink-0">
              <Utensils className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#0F2916]">Dine-In & Takeaway</div>
              <div className="text-xs text-emerald-800/80">Drive-through & Counter</div>
            </div>
          </div>

          {/* Trust Point 5: Transparent Timing */}
          <div className="flex items-center gap-3 pt-2 md:pt-0 md:px-3 col-span-2 md:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-800/15 flex items-center justify-center text-emerald-800 flex-shrink-0">
              <Clock className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#0F2916]">Structured Slots</div>
              <div className="text-xs text-emerald-800/80">Live Order Updates</div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
