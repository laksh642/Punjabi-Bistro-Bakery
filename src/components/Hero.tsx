import React from 'react';
import { ArrowRight, Cake, Utensils, Phone, Clock, Sparkles, MapPin, CheckCircle2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const Hero: React.FC = () => {
  const { businessSettings, setIsCakeStudioOpen, isStoreOpen } = useStore();

  const scrollToMenu = () => {
    const el = document.getElementById('menu-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToCakes = () => {
    const el = document.getElementById('custom-cake-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero-section" className="relative overflow-hidden bg-gradient-to-b from-emerald-50/50 via-white to-white pt-6 pb-12 sm:py-16">
      {/* Subtle emerald background elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-emerald-100/60 opacity-60 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-emerald-50 opacity-80 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Authentic Brand Messaging */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Location & Distinction Badge */}
            <div className="inline-flex items-center gap-2.5 bg-emerald-50/80 border border-emerald-200/90 px-4 py-1.5 rounded-full shadow-2xs">
              <span className="text-emerald-950 font-bold tracking-wider uppercase text-[11px]">
                Dharamkot, Punjab
              </span>
              <span className="text-emerald-300/80 font-normal">|</span>
              <span className="bg-emerald-800 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full tracking-wider uppercase shadow-2xs">
                100% Pure Eggless
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-emerald-950 tracking-tight leading-[1.15]">
              Artisanal Bakes &{' '}
              <span className="font-serif italic font-normal text-emerald-700 underline decoration-emerald-200 decoration-wavy decoration-1 underline-offset-8">
                Bistro Comforts.
              </span>
              <span className="block font-sans text-lg sm:text-xl md:text-2xl font-semibold text-emerald-900/85 tracking-normal mt-4">
                Fresh pure eggless celebration cakes, stone-fired pizzas & warm café fare crafted daily in Dharamkot.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-emerald-900/80 leading-relaxed max-w-2xl">
              Eggless celebration cakes, fresh bakery treats, crispy pizzas, creamy pasta, toasted sandwiches, wraps and fast food — crafted fresh with authentic taste for dine-in, takeaway, and same-day delivery.
            </p>

            {/* Key Value Points */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 text-xs sm:text-sm font-medium text-emerald-950">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>100% Eggless Cakes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Fixed Zone Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Dine-in & Drive-thru</span>
              </div>
            </div>

            {/* Call to Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
              <button
                id="hero-order-now-btn"
                onClick={scrollToMenu}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-6 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm sm:text-base cursor-pointer"
              >
                <span>Order Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-explore-menu-btn"
                onClick={scrollToMenu}
                className="bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold px-5 py-3.5 rounded-xl transition-all flex items-center gap-2 text-sm sm:text-base cursor-pointer shadow-xs"
              >
                <Utensils className="w-4 h-4 text-emerald-700" />
                <span>Explore Menu</span>
              </button>

              <button
                id="hero-custom-cake-btn"
                onClick={scrollToCakes}
                className="text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 font-semibold px-4 py-3.5 rounded-xl transition-colors flex items-center gap-2 text-sm sm:text-base cursor-pointer"
              >
                <Cake className="w-4 h-4 text-emerald-600" />
                <span>Custom Cake?</span>
              </button>
            </div>

            {/* Verified Business Details strip */}
            <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-emerald-900/70 border-t border-emerald-100">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                Near Udham Singh Chowk, Dharamkot
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                Open daily 10:00 AM – 10:00 PM
              </span>
              <a
                href={`tel:${businessSettings.phone.replace(/\s+/g, '')}`}
                className="font-semibold text-emerald-700 hover:underline flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                {businessSettings.phone}
              </a>
            </div>
          </div>

          {/* Right Column: Visual Showcase Card */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Outer Decorative Frame */}
              <div className="rounded-3xl p-3 bg-gradient-to-br from-emerald-100 via-white to-emerald-200/50 shadow-xl border border-emerald-200">
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-[1/1] bg-stone-900">
                  <img
                    src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=85"
                    alt="Artisan Belgian Chocolate Cake - Punjabi Bistro Dharamkot"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

                  {/* Rating Tag */}
                  <div className="absolute top-3 left-3 bg-[#0B2E15]/90 backdrop-blur-xs text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                    <span className="text-amber-400 font-bold">★ 4.4/5</span>
                    <span className="text-emerald-300">•</span>
                    <span>170+ Google Reviews</span>
                  </div>

                  {/* Fresh Badge */}
                  <div className="absolute top-3 right-3 bg-emerald-800/90 backdrop-blur-xs text-white px-3 py-1 rounded-full text-xs font-semibold shadow-xs">
                    <span>Fresh Today</span>
                  </div>

                  {/* Bottom Highlight on image */}
                  <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-emerald-100 shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                          Customer Favourite
                        </div>
                        <div className="font-serif font-bold text-sm text-[#0F2916]">
                          Eggless Chocolate Truffle & Creamy White Sauce Pasta
                        </div>
                      </div>
                      <button
                        onClick={scrollToMenu}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer"
                      >
                        Explore
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floated Stats pill */}
              <div className="absolute -bottom-4 -left-4 sm:-bottom-5 sm:-left-5 bg-white border border-emerald-200 p-3 rounded-2xl shadow-lg flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  ⚡
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-[#0F2916]">Same-Day Delivery</div>
                  <div className="text-[11px] text-emerald-800">30-min scheduled slots</div>
                </div>
              </div>

              <div className="absolute -top-3 -right-3 bg-white border border-emerald-200 py-2 px-3 rounded-xl shadow-md text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>₹200–₹400 typical spend</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
