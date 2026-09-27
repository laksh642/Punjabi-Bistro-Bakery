import React from 'react';
import { Phone, MessageCircle, ShoppingBag, Clock, User } from 'lucide-react';
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

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-emerald-100 p-2.5 px-3 shadow-lg">
      <div className="flex items-center justify-between gap-1.5 max-w-lg mx-auto">
        {/* Call button */}
        <a
          href={`tel:${businessSettings.phone.replace(/\s+/g, '')}`}
          className="flex-1 py-2 px-1.5 bg-white border border-emerald-200 rounded-xl text-center flex items-center justify-center gap-1 text-[11px] font-semibold text-emerald-950 shadow-2xs active:bg-emerald-50"
        >
          <Phone className="w-3 h-3 text-emerald-700" />
          <span>Call</span>
        </a>

        {/* WhatsApp button */}
        <a
          href={`https://wa.me/${businessSettings.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 px-1.5 bg-emerald-850 hover:bg-emerald-900 text-white rounded-xl text-center flex items-center justify-center gap-1 text-[11px] font-semibold shadow-2xs"
        >
          <MessageCircle className="w-3 h-3" />
          <span>WhatsApp</span>
        </a>

        {/* My Orders / Customer Auth */}
        <button
          onClick={() => (user ? setIsMyOrdersOpen(true) : openLoginModal())}
          className="flex-1 py-2 px-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-center flex items-center justify-center gap-1 text-[11px] font-semibold text-emerald-950 shadow-2xs"
        >
          {user ? (
            <>
              <Clock className="w-3 h-3 text-emerald-700" />
              <span>Orders</span>
            </>
          ) : (
            <>
              <User className="w-3 h-3 text-emerald-700" />
              <span>Sign In</span>
            </>
          )}
        </button>

        {/* View Cart / Order button */}
        <button
          onClick={() => (user ? setIsCartOpen(true) : openLoginModal())}
          className="flex-1.5 py-2 px-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-center flex items-center justify-center gap-1 text-[11px] font-bold shadow-md relative"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Cart</span>
          {cartItemCount > 0 ? (
            <span className="bg-white text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
              {cartItemCount}
            </span>
          ) : cartSubtotal > 0 ? (
            <span className="text-[10px] text-emerald-200 font-semibold">₹{cartSubtotal}</span>
          ) : null}
        </button>
      </div>
    </div>
  );
};
