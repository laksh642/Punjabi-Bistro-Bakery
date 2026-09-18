import React, { useState } from 'react';
import { Tag, Check, ArrowRight, Sparkles, Percent } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const CARD_STYLES = [
  { bgGradient: 'from-emerald-800 to-[#0B2E15]', textColor: 'text-emerald-100', accentBadge: 'bg-emerald-500/30' },
  { bgGradient: 'from-amber-600 to-amber-800', textColor: 'text-amber-100', accentBadge: 'bg-amber-400/30' },
  { bgGradient: 'from-emerald-900 to-stone-900', textColor: 'text-emerald-200', accentBadge: 'bg-emerald-400/30' },
  { bgGradient: 'from-rose-800 to-rose-950', textColor: 'text-rose-100', accentBadge: 'bg-rose-500/30' },
  { bgGradient: 'from-teal-800 to-teal-950', textColor: 'text-teal-100', accentBadge: 'bg-teal-400/30' },
];

export const TopOffersStrip: React.FC = () => {
  const { coupons, applyCoupon, setIsCartOpen, cartItemCount } = useStore();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Active coupons configured dynamically by the store owner
  const activeCoupons = coupons.filter((c) => c.isActive);

  if (activeCoupons.length === 0) {
    return null;
  }

  const handleApplyOffer = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    const applied = applyCoupon(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2800);

    // If user already has items in cart, open the cart to see savings
    if (cartItemCount > 0 && applied) {
      setIsCartOpen(true);
    }
  };

  return (
    <section aria-label="Top Offers & Discounts" className="py-5 bg-emerald-50/50 border-b border-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-amber-500 text-white shadow-xs">
              <Percent className="w-3.5 h-3.5" />
            </span>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-950">
              Live Offers & Discount Codes
            </h3>
          </div>
          <span className="text-[11px] text-emerald-800 font-semibold hidden sm:inline">
            Tap code to apply directly to your cart
          </span>
        </div>

        {/* Horizontal Swipeable Coupons (Mobile, Tablet, Laptop) */}
        <div className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto pb-2 scroll-smooth no-scrollbar">
          {activeCoupons.map((coupon, idx) => {
            const isApplied = copiedCode === coupon.code;
            const style = CARD_STYLES[idx % CARD_STYLES.length];

            return (
              <div
                key={coupon.id}
                className={`flex-shrink-0 w-68 sm:w-76 md:w-80 rounded-2xl bg-gradient-to-r ${style.bgGradient} text-white p-4 shadow-md flex flex-col justify-between border border-white/10 relative overflow-hidden`}
              >
                {/* Subtle Decorative Pattern */}
                <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`${style.accentBadge} backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider`}>
                      {coupon.badge || (coupon.discountType === 'flat' ? `Flat ₹${coupon.discountValue} OFF` : `${coupon.discountValue}% OFF`)}
                    </span>
                    <span className="text-[10px] text-emerald-200 font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      Min ₹{coupon.minOrder}
                    </span>
                  </div>

                  <h4 className="font-serif text-base sm:text-lg font-black tracking-tight text-white mt-2">
                    {coupon.title}
                  </h4>
                  <p className={`text-xs mt-1 leading-relaxed line-clamp-2 ${style.textColor}`}>
                    {coupon.subtitle}
                  </p>
                </div>

                {/* Bottom Coupon Code Button */}
                <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 bg-black/35 px-2.5 py-1 rounded-lg border border-dashed border-white/30 text-xs font-mono font-bold tracking-wider text-amber-300">
                    <Tag className="w-3 h-3 text-amber-400" />
                    <span>{coupon.code}</span>
                  </div>

                  <button
                    onClick={() => handleApplyOffer(coupon.code)}
                    className="bg-white hover:bg-emerald-50 text-emerald-950 font-bold text-xs px-3 py-1.5 rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    {isApplied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="text-emerald-700">Applied!</span>
                      </>
                    ) : (
                      <>
                        <span>Apply</span>
                        <ArrowRight className="w-3 h-3 text-emerald-800" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
