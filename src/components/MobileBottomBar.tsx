import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ArrowRight, Utensils, Search, Clock, User, MessageCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';

export const MobileBottomBar: React.FC = () => {
  const {
    cartItemCount,
    cartSubtotal,
    setIsCartOpen,
    businessSettings,
  } = useStore();

  const { user, setIsMyOrdersOpen, openLoginModal } = useCustomerAuth();

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSearchFocus = () => {
    scrollToSection('menu-section');
    const input = document.getElementById('menu-search-input') as HTMLInputElement;
    if (input) setTimeout(() => input.focus(), 350);
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 bg-gradient-to-t from-white via-white/95 to-white/0 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <AnimatePresence mode="wait">
          {cartItemCount > 0 ? (
            /* Zomato/Swiggy Style Sticky Bottom Cart Bar */
            <motion.button
              key="sticky-cart-bar"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-emerald-800 hover:bg-emerald-900 text-white p-3 rounded-2xl shadow-xl border border-emerald-700/60 flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-9 h-9 rounded-xl bg-emerald-700/80 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-emerald-200">
                    {cartItemCount} {cartItemCount === 1 ? 'ITEM' : 'ITEMS'}
                  </div>
                  <div className="text-base font-extrabold text-white tabular-nums leading-tight">
                    ₹{cartSubtotal}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 px-3.5 py-1.5 rounded-xl font-extrabold text-xs text-white shadow-xs">
                <span>View Cart</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </motion.button>
          ) : (
            /* Standard Bottom Navigation */
            <motion.div
              key="bottom-nav"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/95 backdrop-blur-md border border-stone-200/90 rounded-2xl px-2 py-1.5 shadow-lg flex items-center justify-around text-stone-700"
            >
              <button
                onClick={() => scrollToSection('menu-section')}
                className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl hover:text-emerald-800 text-xs font-semibold"
              >
                <Utensils className="w-4 h-4 text-emerald-700" />
                <span className="text-[10px]">Menu</span>
              </button>

              <button
                onClick={handleSearchFocus}
                className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl hover:text-emerald-800 text-xs font-semibold"
              >
                <Search className="w-4 h-4 text-stone-600" />
                <span className="text-[10px]">Search</span>
              </button>

              <button
                onClick={() => (user ? setIsMyOrdersOpen(true) : openLoginModal())}
                className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl hover:text-emerald-800 text-xs font-semibold"
              >
                <Clock className="w-4 h-4 text-stone-600" />
                <span className="text-[10px]">{user ? 'Orders' : 'Sign In'}</span>
              </button>

              <a
                href={`https://wa.me/${businessSettings.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-emerald-700 text-xs font-semibold"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-[10px]">WhatsApp</span>
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
