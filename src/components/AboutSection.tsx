import React from 'react';
import { ShieldCheck, Heart, Users, Sparkles, UtensilsCrossed, Clock } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section id="about-section" className="py-16 bg-emerald-50/20 border-t border-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Image Mosaic */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-emerald-950 shadow-xl border border-emerald-100">
              <img
                src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80"
                alt="Punjabi Bistro & Bakery dining ambiance in Dharamkot"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="text-xs uppercase tracking-wider text-amber-300 font-bold">
                  Near Udham Singh Chowk
                </div>
                <div className="font-serif font-bold text-base">
                  A Welcoming Space for Dharamkot Families & Friends
                </div>
              </div>
            </div>

            {/* Inset badge */}
            <div className="absolute -bottom-4 -right-4 bg-white border border-emerald-100 p-3.5 rounded-2xl shadow-lg max-w-xs text-left">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>100% Pure Eggless Bakery</span>
              </div>
              <p className="text-[11px] text-emerald-950/70 mt-0.5">
                Every pastry, cupcake, and custom tier baked fresh without eggs.
              </p>
            </div>
          </div>

          {/* Right Column: Grounded Brand Story */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5 text-emerald-700" />
              <span>Rooted in Dharamkot</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#0F2916] tracking-tight">
              Honest Flavours, Warm Hospitality & Local Pride
            </h2>

            <p className="text-sm sm:text-base text-emerald-950/80 leading-relaxed">
              Situated right near the bustling <strong>Udham Singh Chowk</strong> in Dharamkot, <strong>Punjabi Bistro & Bakery</strong> was built around a simple promise: bringing high-standard modern café treats, pure eggless celebration cakes, and comforting Italian-Punjabi snacks to our local community at fair, honest prices.
            </p>

            <p className="text-sm text-emerald-950/80 leading-relaxed">
              Whether you are stopping by for a quick drive-through coffee, celebrating your child’s birthday with a custom designer cake, or enjoying an evening of white sauce pasta and paneer tikka pizza with family, we prepare every dish fresh to order.
            </p>

            {/* Core Values 3-column grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 bg-white rounded-2xl border border-emerald-100 shadow-2xs">
                <div className="font-bold text-sm text-[#0F2916] mb-1">
                  🌱 100% Eggless Line
                </div>
                <p className="text-[11px] text-emerald-900/70">
                  Respecting community traditions with strictly vegetarian & eggless baking.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-emerald-100 shadow-2xs">
                <div className="font-bold text-sm text-[#0F2916] mb-1">
                  ⏱️ Fresh to Order
                </div>
                <p className="text-[11px] text-emerald-900/70">
                  No stale display snacks. Breads toasted and pasta cooked fresh when you order.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-emerald-100 shadow-2xs">
                <div className="font-bold text-sm text-[#0F2916] mb-1">
                  🤝 Transparent Care
                </div>
                <p className="text-[11px] text-emerald-900/70">
                  Clear delivery fees, upfront time slots, and immediate resolution if anything goes wrong.
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
