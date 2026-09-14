import React, { useState } from 'react';
import { MapPin, Phone, MessageCircle, Clock, ShieldCheck, Heart } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PolicyModal } from './PolicyModal';
import { PunjabiBistroLogo } from './PunjabiBistroLogo';

export const Footer: React.FC = () => {
  const {
    businessSettings,
    setIsTrackingOpen,
    setIsCakeStudioOpen,
    setIsIssueModalOpen,
  } = useStore();

  const [activePolicy, setActivePolicy] = useState<'delivery' | 'refund' | 'eggless' | 'privacy' | null>(null);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <footer className="bg-[#0B1E12] text-white pt-14 pb-24 lg:pb-12 border-t border-emerald-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-12 border-b border-emerald-900/50">
            
            {/* Col 1: Brand & NAP */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                <PunjabiBistroLogo className="w-12 h-12" />
                <div>
                  <h3 className="font-serif text-lg font-bold text-white leading-tight">
                    Punjabi Bistro & Bakery
                  </h3>
                  <p className="text-xs text-amber-400">Dharamkot, Punjab 142042</p>
                </div>
              </div>

              <p className="text-xs text-emerald-100/75 leading-relaxed max-w-sm">
                Near Udham Singh Chowk, Dharamkot. Handcrafting 100% pure eggless celebration cakes, fresh pizzas, creamy pasta, burgers, and comforting snacks for dine-in, takeaway, and same-day delivery.
              </p>

              <div className="space-y-2 text-xs text-emerald-100/75">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Near Udham Singh Chowk, Dharamkot, Punjab 142042</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <a
                    href={`tel:${businessSettings.phone.replace(/\s+/g, '')}`}
                    className="hover:text-white transition-colors"
                  >
                    {businessSettings.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Daily: 10:00 AM – 10:00 PM</span>
                </div>
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider">
                Explore Menu
              </h4>
              <ul className="space-y-2 text-xs text-emerald-100/75">
                <li>
                  <button
                    onClick={() => scrollTo('menu-section')}
                    className="hover:text-amber-300 transition-colors"
                  >
                    Digital Food Menu
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollTo('custom-cake-section')}
                    className="hover:text-amber-300 transition-colors"
                  >
                    Custom Cake Studio
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollTo('menu-section')}
                    className="hover:text-amber-300 transition-colors"
                  >
                    Eggless Celebration Cakes
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollTo('menu-section')}
                    className="hover:text-amber-300 transition-colors"
                  >
                    White Sauce Pastas & Pizzas
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollTo('reviews-section')}
                    className="hover:text-amber-300 transition-colors"
                  >
                    Google Customer Reviews (4.4★)
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Customer Care & Operations */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider">
                Customer Support
              </h4>
              <ul className="space-y-2 text-xs text-emerald-100/75">
                <li>
                  <button
                    onClick={() => setIsTrackingOpen(true)}
                    className="hover:text-amber-300 transition-colors"
                  >
                    Track Active Order
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setIsIssueModalOpen(true)}
                    className="hover:text-amber-300 transition-colors"
                  >
                    Report Issue / Late Delivery
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActivePolicy('delivery')}
                    className="hover:text-amber-300 transition-colors"
                  >
                    Delivery Policy & Zones
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActivePolicy('refund')}
                    className="hover:text-amber-300 transition-colors"
                  >
                    Cancellation & Refund Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActivePolicy('eggless')}
                    className="hover:text-amber-300 transition-colors"
                  >
                    100% Eggless Guarantee
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActivePolicy('privacy')}
                    className="hover:text-amber-300 transition-colors"
                  >
                    Customer Privacy Policy
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: Fresh Bakery Promise */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider">
                Fresh Promise
              </h4>
              <p className="text-xs text-emerald-200/80 leading-relaxed">
                Handcrafted daily in Dharamkot using premium dairy cream, fresh fruits, and 100% pure vegetarian ingredients.
              </p>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-900/60 border border-emerald-700/50 text-[11px] text-amber-300 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>100% Pure Eggless</span>
                </span>
              </div>
            </div>

          </div>

          {/* Bottom Copyright Strip */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-200/60 text-center sm:text-left">
            <div>
              © {new Date().getFullYear()} Punjabi Bistro & Bakery. All Rights Reserved. Near Udham Singh Chowk, Dharamkot.
            </div>
            <div className="flex items-center gap-1 text-emerald-200/60">
              <span>Made with care for Dharamkot, Punjab</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Policy View Modal */}
      <PolicyModal
        policyType={activePolicy}
        onClose={() => setActivePolicy(null)}
      />
    </>
  );
};
