import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Phone,
  MessageCircle,
  ShoppingBag,
  Clock,
  MapPin,
  Menu as MenuIcon,
  X,
  ShieldCheck,
  Search,
  Sparkles,
  Cake,
  QrCode,
  FileText,
  Bike,
  Store,
  Utensils,
  User,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { PunjabiBistroLogo } from './PunjabiBistroLogo';

export const Navbar: React.FC = () => {
  const {
    cartItemCount,
    cartSubtotal,
    setIsCartOpen,
    setIsTrackingOpen,
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

  return (
    <>
      {/* Top Announcement & Quick Contact Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
        <div className="bg-[#0B2E15] text-emerald-100 text-xs py-1.5 px-4">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-amber-300 font-semibold">
                <MapPin className="w-3.5 h-3.5" />
                Near Udham Singh Chowk, Dharamkot
              </span>
              {/* Service Mode Toggle (Delivery, Pick-up, Dine-in) */}
              <div className="hidden sm:flex items-center bg-emerald-950/60 p-0.5 rounded-lg border border-emerald-700/60 text-[11px] font-semibold">
                <button
                  onClick={() => setFulfillmentMode('delivery')}
                  className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                    fulfillmentMode === 'delivery'
                      ? 'bg-emerald-500 text-emerald-950 font-bold shadow-2xs'
                      : 'text-emerald-200 hover:text-white'
                  }`}
                >
                  <Bike className="w-3 h-3" />
                  <span>Delivery</span>
                </button>
                <button
                  onClick={() => setFulfillmentMode('pickup')}
                  className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                    fulfillmentMode === 'pickup'
                      ? 'bg-emerald-500 text-emerald-950 font-bold shadow-2xs'
                      : 'text-emerald-200 hover:text-white'
                  }`}
                >
                  <Store className="w-3 h-3" />
                  <span>Pick-up</span>
                </button>
                <button
                  onClick={() => setFulfillmentMode('dine_in')}
                  className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                    fulfillmentMode === 'dine_in'
                      ? 'bg-emerald-500 text-emerald-950 font-bold shadow-2xs'
                      : 'text-emerald-200 hover:text-white'
                  }`}
                >
                  <Utensils className="w-3 h-3" />
                  <span>Dine-in</span>
                </button>
              </div>

              <span className="hidden md:inline-block text-emerald-600">|</span>
              <span className="hidden md:flex items-center gap-1.5 text-emerald-200">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    isStoreOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                  }`}
                />
                {isStoreOpen
                  ? `Open Now (until ${businessSettings.closingTime})`
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
          <div className="flex items-center justify-between h-18">
            {/* Logo / Brand Name */}
            <div className="flex items-center gap-3">
              <button
                id="header-brand-button"
                onClick={() => scrollToSection('hero-section')}
                className="text-left group flex items-center gap-3 focus:outline-none cursor-pointer"
              >
                <PunjabiBistroLogo
                  id="header-bistro-logo-img"
                  className="w-12 h-12 sm:w-13 sm:h-13 group-hover:scale-105 transition-transform"
                />
                <div>
                  <h1 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#0F2916] leading-tight group-hover:text-emerald-700 transition-colors">
                    Punjabi Bistro & Bakery
                  </h1>
                  <p className="text-[11px] text-emerald-800 font-medium tracking-wide flex items-center gap-1">
                    <span>Dharamkot</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">100% Pure Eggless</span>
                  </p>
                </div>
              </button>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 text-[14px] font-medium text-emerald-950">
              <button
                onClick={() => scrollToSection('menu-section')}
                className="hover:text-emerald-700 transition-colors cursor-pointer"
              >
                Menu
              </button>
              <button
                onClick={() => scrollToSection('custom-cake-section')}
                className="hover:text-emerald-800 transition-colors flex items-center gap-1 text-emerald-700 font-semibold cursor-pointer"
              >
                <Cake className="w-4 h-4" />
                Custom Cakes
              </button>
              <button
                onClick={() => scrollToSection('bestsellers-section')}
                className="hover:text-emerald-700 transition-colors cursor-pointer"
              >
                Favourites
              </button>
              <button
                onClick={() => scrollToSection('reviews-section')}
                className="hover:text-emerald-700 transition-colors cursor-pointer"
              >
                Reviews (4.4★)
              </button>
              <button
                onClick={() => scrollToSection('gallery-section')}
                className="hover:text-emerald-700 transition-colors cursor-pointer"
              >
                Gallery
              </button>
              <button
                onClick={() => scrollToSection('about-section')}
                className="hover:text-emerald-700 transition-colors cursor-pointer"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection('location-section')}
                className="hover:text-emerald-700 transition-colors cursor-pointer"
              >
                Location & Hours
              </button>
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Customer Account / My Orders / Sign In */}
              {user ? (
                <div className="flex items-center gap-1.5">
                  <button
                    id="nav-my-orders-btn"
                    onClick={() => setIsMyOrdersOpen(true)}
                    className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-2 rounded-lg border border-emerald-300 text-emerald-950 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer"
                    title="My Orders & Live Status"
                  >
                    <Clock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>My Orders</span>
                  </button>
                  <button
                    id="nav-customer-account-btn"
                    onClick={() => setIsAccountModalOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1.5 rounded-lg border border-emerald-200 hover:border-emerald-400 bg-white text-emerald-950 hover:bg-emerald-50 transition-colors cursor-pointer"
                    title="Saved Addresses & Profile"
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-[10px] shadow-2xs">
                      {customerProfile?.fullName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'C'}
                    </div>
                    <span className="hidden md:inline max-w-[80px] truncate">
                      {customerProfile?.fullName?.split(' ')[0] || 'Account'}
                    </span>
                  </button>
                </div>
              ) : (
                <button
                  id="nav-customer-signin-btn"
                  onClick={openLoginModal}
                  className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg border border-emerald-300 text-emerald-900 bg-emerald-50/80 hover:bg-emerald-100 transition-colors cursor-pointer"
                  title="Sign In with Google"
                >
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}

              {/* Order Tracking Button */}
              <button
                id="nav-track-order-btn"
                onClick={() => setIsTrackingOpen(true)}
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-emerald-200 text-emerald-900 bg-emerald-50/50 hover:bg-emerald-100/60 transition-colors cursor-pointer"
                title="Track Your Order"
              >
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Track Order</span>
              </button>

              {/* Digital QR Menu Mode */}
              <button
                onClick={() => setIsMenuOnlyMode(true)}
                className="hidden md:flex items-center gap-1 text-xs font-medium px-2.5 py-2 rounded-lg text-emerald-800 hover:bg-emerald-50 transition-colors"
                title="Table QR / Compact Menu View"
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                <span>QR Menu</span>
              </button>

              {/* Cart Button */}
              <motion.button
                id="nav-cart-btn"
                whileTap={{ scale: 0.95 }}
                onClick={() => (user ? setIsCartOpen(true) : openLoginModal())}
                className="relative flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm shadow-xs hover:shadow transition-all cursor-pointer"
                title={user ? 'View Cart' : 'Sign in with Google to access Cart'}
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline font-semibold">Cart</span>
                {cartItemCount > 0 ? (
                  <motion.span
                    key={cartItemCount}
                    initial={{ scale: 0.6, opacity: 0.7 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    className="bg-white text-emerald-800 font-bold text-xs px-1.5 py-0.2 rounded-full min-w-[18px] text-center shadow-xs"
                  >
                    {cartItemCount}
                  </motion.span>
                ) : (
                  <span className="text-xs text-emerald-200">0</span>
                )}
                {cartSubtotal > 0 && (
                  <span className="hidden md:inline text-xs font-semibold pl-1 border-l border-emerald-600">
                    ₹{cartSubtotal}
                  </span>
                )}
              </motion.button>

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-emerald-950 hover:bg-emerald-50 transition-colors"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-emerald-100 px-4 pt-3 pb-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 shadow-md">
            <div className="flex flex-col gap-2 font-medium text-stone-700">
              <button
                onClick={() => scrollToSection('menu-section')}
                className="text-left py-2 px-3 rounded-lg hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
              >
                Browse Menu
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsCakeStudioOpen(true);
                }}
                className="text-left py-2 px-3 rounded-lg bg-emerald-50 text-emerald-900 font-semibold flex items-center justify-between border border-emerald-100"
              >
                <span className="flex items-center gap-2">
                  <Cake className="w-4 h-4 text-emerald-700" />
                  Custom Cake Studio
                </span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                  Enquire
                </span>
              </button>
              <button
                onClick={() => scrollToSection('bestsellers-section')}
                className="text-left py-2 px-3 rounded-lg hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
              >
                Customer Favourites
              </button>
              <button
                onClick={() => scrollToSection('reviews-section')}
                className="text-left py-2 px-3 rounded-lg hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
              >
                Customer Reviews (4.4★)
              </button>
              <button
                onClick={() => scrollToSection('gallery-section')}
                className="text-left py-2 px-3 rounded-lg hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
              >
                Photo Gallery
              </button>
              <button
                onClick={() => scrollToSection('location-section')}
                className="text-left py-2 px-3 rounded-lg hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
              >
                Location & Opening Hours
              </button>
              <button
                onClick={() => scrollToSection('faq-section')}
                className="text-left py-2 px-3 rounded-lg hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
              >
                FAQs & Ordering Policy
              </button>
            </div>

            <div className="pt-3 border-t border-emerald-100 flex flex-col gap-2">
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

              <Link
                to="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-950 hover:bg-emerald-50 transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Track Order by Token / Number</span>
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsIssueModalOpen(true);
                }}
                className="w-full text-center text-xs text-stone-500 py-1 hover:underline hover:text-emerald-800"
              >
                Having an issue with an order? Get Help
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
