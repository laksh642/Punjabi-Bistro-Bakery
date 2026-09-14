import React from 'react';
import { Phone, MessageCircle, ShoppingBag, Clock } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const MobileBottomBar: React.FC = () => {
  const {
    cartItemCount,
    cartSubtotal,
    setIsCartOpen,
    setIsTrackingOpen,
    businessSettings,
  } = useStore();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-emerald-100 p-2.5 px-4 shadow-lg">
      <div className="flex items-center justify-between gap-2 max-w-lg mx-auto">
        {/* Call button */}
        <a
          href={`tel:${businessSettings.phone.replace(/\s+/g, '')}`}
          className="flex-1 py-2.5 px-2 bg-white border border-emerald-200 rounded-xl text-center flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-950 shadow-2xs active:bg-emerald-50"
        >
          <Phone className="w-3.5 h-3.5 text-emerald-700" />
          <span>Call</span>
        </a>

        {/* WhatsApp button */}
        <a
          href={`https://wa.me/${businessSettings.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2.5 px-2 bg-emerald-850 hover:bg-emerald-900 text-white rounded-xl text-center flex items-center justify-center gap-1.5 text-xs font-semibold shadow-2xs"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>WhatsApp</span>
        </a>

        {/* View Cart / Order button */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="flex-1 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-center flex items-center justify-center gap-1.5 text-xs font-bold shadow-md relative"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Cart</span>
          {cartItemCount > 0 && (
            <span className="bg-white text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
              {cartItemCount}
            </span>
          )}
          {cartSubtotal > 0 && (
            <span className="text-[11px] text-emerald-200 font-semibold">₹{cartSubtotal}</span>
          )}
        </button>
      </div>
    </div>
  );
};
