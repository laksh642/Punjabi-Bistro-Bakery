import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Phone,
  MessageCircle,
  ShoppingBag,
  Clock,
  MapPin,
  Menu as MenuIcon,
  X,
  Search,
  Cake,
  QrCode,
  Bike,
  Store,
  Utensils,
  User,
  ChevronDown,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { PunjabiBistroLogo } from './PunjabiBistroLogo';

export const Navbar: React.FC = () => {
  const {
    cartItemCount,
    cartSubtotal,
    setIsCartOpen,
    setIsCakeStudioOpen,
    setIsIssueModalOpen,
    setIsMenuOnlyMode,
    isStoreOpen,
    businessSettings,
    fulfillmentMode,
    setFulfillmentMode,
  } = useStore();

  const {
    user,
    customerProfile,
    openLoginModal,
    setIsMyOrdersOpen,
    setIsAccountModalOpen,
  } = useCustomerAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSearchFocus = () => {
    const searchInput = document.getElementById('menu-search-input') as HTMLInputElement;
    const menuEl = document.getElementById('menu-section');
    if (menuEl) {
      menuEl.scrollIntoView({ behavior: 'smooth' });
    }
    if (searchInput) {
      setTimeout(() => searchInput.focus(), 350);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
        {/* Top Strip: Location & Fast Contact */}
        <div className="bg-[#0B2E15] text-emerald-100 text-xs py-1.5 px-4">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1.5 text-amber-300 font-medium truncate max-w-[220px] sm:max-w-none">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span className="truncate">{businessSettings.landmark || 'Dharamkot, Punjab'}</span>
              </span>

              {/* Service Mode Toggle */}
              <div className="hidden sm:flex items-center bg-emerald-950/80 p-0.5 rounded-lg border border-emerald-700/50 text-[11px] font-semibold">
                <button
                  onClick={() => setFulfillmentMode('delivery')}
                  className={`px-2.5 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                    fulfillmentMode === 'delivery'
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'text-emerald-200 hover:text-white'
                  }`}
                >
                  <Bike className="w-3 h-3" />
                  <span>Delivery</span>
                </button>
                <button
                  onClick={() => setFulfillmentMode('pickup')}
                  className={`px-2.5 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                    fulfillmentMode === 'pickup'
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'text-emerald-200 hover:text-white'
                  }`}
                >
                  <Store className="w-3 h-3" />
                  <span>Takeaway</span>
                </button>
                <button
                  onClick={() => setFulfillmentMode('dine_in')}
                  className={`px-2.5 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                    fulfillmentMode === 'dine_in'
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'text-emerald-200 hover:text-white'
                  }`}
                >
                  <Utensils className="w-3 h-3" />
                  <span>Dine-in</span>
                </button>
              </div>

              <span className="hidden md:inline-block text-emerald-700">|</span>
              <span className="hidden md:flex items-center gap-1.5 text-emerald-200">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    isStoreOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                  }`}
                />
                {isStoreOpen
                  ? `Open Now (10:00 AM - 10:00 PM)`
                  : `Currently Closed (Opens at ${businessSettings.openingTime})`}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <a
                href={`tel:${businessSettings.phone.replace(/\s+/g, '')}`}
                className="hover:text-amber-300 transition-colors flex items-center gap-1 font-medium text-emerald-200"
                title="Call Punjabi Bistro"
              >
                <Phone className="w-3 h-3 text-amber-300" />
                <span className="hidden sm:inline">Call:</span> {businessSettings.phone}
              </a>

              <a
                href={`https://wa.me/${businessSettings.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-300 transition-colors flex items-center gap-1 font-medium text-emerald-300"
                title="Chat on WhatsApp"
              >
                <MessageCircle className="w-3 h-3 text-emerald-300" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Main Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-[4.25rem] py-2 gap-3 sm:gap-6">
            
            {/* Left: Brand Logo & Location badge */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                id="header-brand-button"
                onClick={() => scrollToSection('hero-section')}
                className="text-left group flex items-center gap-2.5 sm:gap-3 focus:outline-none cursor-pointer min-w-0"
              >
                <PunjabiBistroLogo
                  id="header-bistro-logo-img"
                  className="w-10 h-10 sm:w-11 sm:h-11 group-hover:scale-105 transition-transform shrink-0"
                />
                <div className="min-w-0">
                  <h1 className="font-serif text-base sm:text-lg font-extrabold tracking-tight text-stone-900 leading-tight group-hover:text-emerald-800 transition-colors truncate">
                    {businessSettings.name}
                  </h1>
                  <p className="text-[11px] text-stone-500 font-medium flex items-center gap-1.5 mt-0.5">
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">100% Eggless</span>
                    <span>•</span>
                    <span className="truncate">25-35 mins delivery</span>
                  </p>
                </div>
              </button>
            </div>

            {/* Center: Prominent Food Delivery Search Bar (Desktop) */}
            <div className="hidden md:flex flex-1 max-w-md mx-2">
              <button
                onClick={handleSearchFocus}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-stone-100/90 hover:bg-stone-100 border border-stone-200 text-stone-500 hover:text-stone-700 text-xs sm:text-sm font-normal text-left transition-all cursor-pointer shadow-2xs hover:border-emerald-600/50"
              >
                <Search className="w-4 h-4 text-stone-400 shrink-0" />
                <span className="truncate">Search for dishes, cakes, pizzas or pasta...</span>
              </button>
            </div>

            {/* Right Action Cluster */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Mobile Search Button */}
              <button
                onClick={handleSearchFocus}
                className="md:hidden p-2 rounded-xl text-stone-700 hover:bg-stone-100 transition-colors"
                title="Search menu"
                aria-label="Search menu"
              >
                <Search className="w-5 h-5 text-stone-700" />
              </button>

              {/* Custom Cake Button (Desktop) */}
              <button
                onClick={() => setIsCakeStudioOpen(true)}
                className="hidden xl:flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200/80 transition-colors cursor-pointer"
              >
                <Cake className="w-3.5 h-3.5 text-emerald-700" />
                <span>Custom Cakes</span>
              </button>

              {/* Customer Account / My Orders */}
              {user ? (
                <div className="flex items-center gap-1.5">
                  <button
                    id="nav-my-orders-btn"
                    onClick={() => setIsMyOrdersOpen(true)}
                    className="hidden sm:flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-stone-200 text-stone-800 bg-white hover:bg-stone-50 transition-colors cursor-pointer shadow-2xs"
                    title="My Orders"
                  >
                    <Clock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>My Orders</span>
                  </button>
                  <button
                    id="nav-customer-account-btn"
                    onClick={() => setIsAccountModalOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold p-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-stone-200 bg-white text-stone-800 hover:bg-stone-50 transition-colors cursor-pointer"
                    title="Account & Addresses"
                  >
                    <div className="w-7 h-7 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                      {customerProfile?.fullName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'C'}
                    </div>
                    <span className="hidden md:inline max-w-[80px] truncate text-xs font-bold">
                      {customerProfile?.fullName?.split(' ')[0] || 'Profile'}
                    </span>
                    <ChevronDown className="w-3 h-3 text-stone-400 hidden sm:block" />
                  </button>
                </div>
              ) : (
                <button
                  id="nav-customer-signin-btn"
                  onClick={openLoginModal}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-stone-200 text-stone-800 bg-white hover:bg-stone-50 transition-colors cursor-pointer shadow-2xs"
                  title="Sign In with Google"
                >
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Sign In</span>
                </button>
              )}

              {/* Cart CTA Button */}
              <motion.button
                id="nav-cart-btn"
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm hover:shadow transition-all cursor-pointer"
                title="View Cart"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline font-bold">Cart</span>
                {cartItemCount > 0 ? (
                  <motion.span
                    key={cartItemCount}
                    initial={{ scale: 0.7 }}
                    animate={{ scale: 1 }}
                    className="bg-white text-emerald-800 font-extrabold text-xs px-1.5 py-0.2 rounded-full min-w-[18px] text-center"
                  >
                    {cartItemCount}
                  </motion.span>
                ) : (
                  <span className="text-xs text-emerald-200 font-normal">0</span>
                )}
                {cartSubtotal > 0 && (
                  <span className="hidden md:inline text-xs font-extrabold pl-1 border-l border-emerald-600 tabular-nums">
                    ₹{cartSubtotal}
                  </span>
                )}
              </motion.button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-stone-800 hover:bg-stone-100 transition-colors"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-stone-200 px-4 pt-3 pb-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 shadow-md">
            <div className="flex flex-col gap-1 font-medium text-stone-700 text-sm">
              <button
                onClick={() => scrollToSection('menu-section')}
                className="text-left py-2.5 px-3 rounded-xl hover:bg-stone-50 hover:text-emerald-900 transition-colors"
              >
                Browse Full Menu
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsCakeStudioOpen(true);
                }}
                className="text-left py-2.5 px-3 rounded-xl bg-emerald-50 text-emerald-900 font-bold flex items-center justify-between border border-emerald-100"
              >
                <span className="flex items-center gap-2">
                  <Cake className="w-4 h-4 text-emerald-700" />
                  Custom Cake Studio
                </span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                  Eggless
                </span>
              </button>
              <button
                onClick={() => scrollToSection('bestsellers-section')}
                className="text-left py-2.5 px-3 rounded-xl hover:bg-stone-50 hover:text-emerald-900 transition-colors"
              >
                Customer Favourites
              </button>
              <button
                onClick={() => scrollToSection('reviews-section')}
                className="text-left py-2.5 px-3 rounded-xl hover:bg-stone-50 hover:text-emerald-900 transition-colors"
              >
                Customer Reviews (4.4★)
              </button>
              <button
                onClick={() => scrollToSection('location-section')}
                className="text-left py-2.5 px-3 rounded-xl hover:bg-stone-50 hover:text-emerald-900 transition-colors"
              >
                Location & Opening Hours
              </button>
              <button
                onClick={() => scrollToSection('faq-section')}
                className="text-left py-2.5 px-3 rounded-xl hover:bg-stone-50 hover:text-emerald-900 transition-colors"
              >
                FAQs & Support
              </button>
            </div>

            <div className="pt-3 border-t border-stone-100 flex flex-col gap-2">
              {user ? (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsMyOrdersOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-50 text-emerald-950 font-bold text-sm border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    <Clock className="w-4 h-4 text-emerald-700" />
                    <span>My Orders & History</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsAccountModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white text-stone-700 font-semibold text-xs border border-stone-200 hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4 text-emerald-700" />
                    <span>Saved Address ({customerProfile?.fullName || user.email})</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openLoginModal();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-sm hover:bg-emerald-800 transition-colors cursor-pointer shadow-xs"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In with Google</span>
                </button>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsIssueModalOpen(true);
                }}
                className="w-full text-center text-xs text-stone-500 py-1 hover:underline hover:text-emerald-800"
              >
                Having an issue with an order? Get Support
              </button>
            </div>
          </div>
        )}

        {/* Store Closed Banner */}
        {!isStoreOpen && (
          <div className="bg-amber-600 text-white text-xs font-bold py-2 px-4 text-center shadow-inner flex items-center justify-center gap-2 border-t border-amber-700">
            <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
            <span>
              Bakery is Currently Closed for Orders • Opens at {businessSettings.openingTime} • Call {businessSettings.phone}
            </span>
          </div>
        )}
      </header>
    </>
  );
};
