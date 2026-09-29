import React, { useState } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Clock,
  MapPin,
  Tag,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  QrCode,
  MessageCircle,
  User,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { OrderType, PaymentMethod, DeliveryZone } from '../types';
import { OrderSuccessAnimation } from './OrderSuccessAnimation';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    cartItemCount,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    isCartOpen,
    setIsCartOpen,
    deliveryZones,
    businessSettings,
    coupons,
    appliedCoupon,
    couponError,
    applyCoupon,
    removeCoupon,
    placeOrder,
    generateWhatsAppOrderUrl,
  } = useStore();

  const {
    user,
    customerProfile,
    updateCustomerProfile,
    openLoginModal,
    setIsMyOrdersOpen,
    openMyOrdersWithOrder,
  } = useCustomerAuth();

  // Checkout states with draft session persistence
  const [orderType, setOrderType] = useState<OrderType>(() => {
    try {
      const saved = sessionStorage.getItem('pb_draft_order_type');
      if (saved === 'delivery' || saved === 'takeaway' || saved === 'dine_in') return saved;
    } catch {}
    return 'delivery';
  });
  const [customerName, setCustomerName] = useState(() => {
    try { return sessionStorage.getItem('pb_draft_customer_name') || ''; } catch { return ''; }
  });
  const [customerPhone, setCustomerPhone] = useState(() => {
    try { return sessionStorage.getItem('pb_draft_customer_phone') || ''; } catch { return ''; }
  });
  const [customerEmail, setCustomerEmail] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState<string>(() => {
    try { return sessionStorage.getItem('pb_draft_zone_id') || deliveryZones[0]?.id || 'zone-1'; } catch { return deliveryZones[0]?.id || 'zone-1'; }
  });
  const [deliveryAddress, setDeliveryAddress] = useState(() => {
    try { return sessionStorage.getItem('pb_draft_delivery_address') || ''; } catch { return ''; }
  });
  const [landmark, setLandmark] = useState(() => {
    try { return sessionStorage.getItem('pb_draft_landmark') || ''; } catch { return ''; }
  });
  const [tableNumber, setTableNumber] = useState('Table 4');
  const [timeSlot, setTimeSlot] = useState('asap');
  const [orderNotes, setOrderNotes] = useState(() => {
    try { return sessionStorage.getItem('pb_draft_order_notes') || ''; } catch { return ''; }
  });
  const [contactlessDelivery, setContactlessDelivery] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [upiTxnId, setUpiTxnId] = useState('');
  const [couponInput, setCouponInput] = useState('');

  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isAnimationOpen, setIsAnimationOpen] = useState(false);
  const [animationError, setAnimationError] = useState<string | null>(null);

  // Sync draft fields to sessionStorage
  React.useEffect(() => {
    try {
      if (customerName) sessionStorage.setItem('pb_draft_customer_name', customerName);
      if (customerPhone) sessionStorage.setItem('pb_draft_customer_phone', customerPhone);
      if (deliveryAddress) sessionStorage.setItem('pb_draft_delivery_address', deliveryAddress);
      if (landmark) sessionStorage.setItem('pb_draft_landmark', landmark);
      if (orderNotes) sessionStorage.setItem('pb_draft_order_notes', orderNotes);
      if (orderType) sessionStorage.setItem('pb_draft_order_type', orderType);
      if (selectedZoneId) sessionStorage.setItem('pb_draft_zone_id', selectedZoneId);
    } catch {}
  }, [customerName, customerPhone, deliveryAddress, landmark, orderNotes, orderType, selectedZoneId]);

  // Auto-advance to checkout if user completed Google login after clicking checkout
  React.useEffect(() => {
    if (user) {
      try {
        const pending = sessionStorage.getItem('pb_pending_checkout');
        if (pending === 'true') {
          sessionStorage.removeItem('pb_pending_checkout');
          if (cart.length > 0) {
            setCheckoutStep('checkout');
          }
        }
      } catch {}
    } else if (checkoutStep === 'checkout') {
      // Strictly enforce login: unauthenticated guests cannot view or submit checkout
      setCheckoutStep('cart');
    }
  }, [user, cart.length, checkoutStep]);

  // Prefill customer details when profile or user changes (preserving any user-typed draft values)
  React.useEffect(() => {
    if (customerProfile) {
      if (customerProfile.fullName && !customerName) setCustomerName(customerProfile.fullName);
      if (customerProfile.phone && !customerPhone) setCustomerPhone(customerProfile.phone);
      if (customerProfile.email) setCustomerEmail(customerProfile.email);
      if (customerProfile.address && !deliveryAddress) setDeliveryAddress(customerProfile.address);
      if (customerProfile.landmark && !landmark) setLandmark(customerProfile.landmark);
    } else if (user) {
      if (user.user_metadata?.full_name && !customerName) setCustomerName(user.user_metadata.full_name);
      if (user.email) setCustomerEmail(user.email);
    }
  }, [customerProfile, user]);

  if (!isCartOpen) return null;

  // Selected Zone calculation
  const selectedZone = deliveryZones.find((z) => z.id === selectedZoneId) || deliveryZones[0] || {
    id: 'zone-1',
    name: 'Standard Delivery',
    fee: 20,
    freeAbove: 299,
    estimatedMinutes: '25-35 mins',
    description: 'Dharamkot Delivery',
  };

  let deliveryFee = 0;
  if (orderType === 'delivery') {
    const freeThreshold = (selectedZone as any)?.freeDeliveryThreshold || selectedZone?.freeAbove;
    if (freeThreshold && cartSubtotal >= freeThreshold) {
      deliveryFee = 0;
    } else {
      deliveryFee = selectedZone?.fee || 0;
    }
  }

  // Discount calculation
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'flat') {
      discountAmount = Math.min(cartSubtotal, appliedCoupon.discountValue);
    } else {
      const rawDiscount = (cartSubtotal * appliedCoupon.discountValue) / 100;
      discountAmount = appliedCoupon.maxDiscount
        ? Math.min(rawDiscount, appliedCoupon.maxDiscount)
        : rawDiscount;
    }
  }

  const finalTotal = Math.max(0, cartSubtotal + deliveryFee - discountAmount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponInput.trim()) {
      applyCoupon(couponInput);
    }
  };

  const handleProceedToCheckout = () => {
    if (cart.length === 0) return;
    if (!user) {
      try {
        sessionStorage.setItem('pb_pending_checkout', 'true');
      } catch {}
      openLoginModal();
      return;
    }
    setCheckoutStep('checkout');
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage('Sign in with Google is required to place your order.');
      try {
        sessionStorage.setItem('pb_pending_checkout', 'true');
      } catch {}
      openLoginModal();
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage('Please enter your name and contact phone number.');
      return;
    }

    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      setErrorMessage('Please enter your complete delivery address in Dharamkot.');
      return;
    }

    setErrorMessage(null);
    setAnimationError(null);
    setConfirmedOrder(null);
    setIsPlacingOrder(true);
    setIsAnimationOpen(true);

    const startTime = Date.now();

    const result = await placeOrder({
      userId: user?.id,
      customerEmail: user?.email || customerEmail.trim() || undefined,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      orderType,
      items: cart,
      subtotal: cartSubtotal,
      deliveryFee,
      discount: discountAmount,
      couponCode: appliedCoupon?.code,
      total: finalTotal,
      deliveryZoneId: orderType === 'delivery' ? selectedZoneId : undefined,
      deliveryAddress: orderType === 'delivery' ? deliveryAddress.trim() : undefined,
      landmark: orderType === 'delivery' ? landmark.trim() : undefined,
      tableNumber: orderType === 'dine_in' ? tableNumber.trim() : undefined,
      timeSlot,
      paymentMethod,
      paymentStatus: paymentMethod === 'upi' && upiTxnId ? 'paid' : 'pending',
      upiTxnId: upiTxnId.trim() || undefined,
      orderNotes: orderNotes.trim() || undefined,
      contactlessDelivery,
    });

    // Ensure polished minimum transition so success animation doesn't flash unnaturally
    const elapsed = Date.now() - startTime;
    if (elapsed < 400) {
      await new Promise((resolve) => setTimeout(resolve, 400 - elapsed));
    }

    setIsPlacingOrder(false);

    if (!result.success || !result.order) {
      setAnimationError(
        result.error || 'The bakery system could not save your order. Please try again.'
      );
      return;
    }

    // Auto-save delivery address for logged in customer
    if (user) {
      updateCustomerProfile({
        fullName: customerName.trim(),
        phone: customerPhone.trim(),
        address: orderType === 'delivery' ? deliveryAddress.trim() : customerProfile?.address,
        landmark: orderType === 'delivery' ? landmark.trim() : customerProfile?.landmark,
      }).catch(() => {});
    }

    setConfirmedOrder(result.order);
  };

  const handleRetryOrder = () => {
    setIsAnimationOpen(false);
    setAnimationError(null);
    setIsPlacingOrder(false);
  };

  const handleViewMyOrder = () => {
    if (!confirmedOrder) return;
    setIsAnimationOpen(false);
    setIsCartOpen(false);
    setCheckoutStep('cart');
    openMyOrdersWithOrder(confirmedOrder.orderNumber);
  };

  const handleWhatsAppShare = () => {
    if (!confirmedOrder) return;
    const url = generateWhatsAppOrderUrl(confirmedOrder);
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  const handleCloseAnimation = () => {
    setIsAnimationOpen(false);
    setIsCartOpen(false);
    setCheckoutStep('cart');
  };

  const handleClose = () => {
    setIsCartOpen(false);
    setIsAnimationOpen(false);
    if (checkoutStep === 'success') {
      setCheckoutStep('cart');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl border-l border-emerald-200 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dedicated Order Submission & Success Animation Component */}
        <OrderSuccessAnimation
          isOpen={isAnimationOpen}
          isProcessing={isPlacingOrder}
          order={confirmedOrder}
          error={animationError}
          onRetry={handleRetryOrder}
          onClose={handleCloseAnimation}
          onViewMyOrder={handleViewMyOrder}
          onWhatsAppShare={handleWhatsAppShare}
          userEmail={user?.email}
          orderType={orderType}
          businessSettings={businessSettings}
        />

        {/* Drawer Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 to-[#0B2E15] text-white border-b border-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-300" />
            <h2 className="font-serif text-lg font-bold text-white">
              {checkoutStep === 'cart'
                ? `Your Order (${cartItemCount} items)`
                : checkoutStep === 'checkout'
                ? 'Delivery & Payment'
                : 'Order Confirmed!'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-emerald-800 text-emerald-200 transition-colors cursor-pointer"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-white">
          {checkoutStep === 'cart' ? (
            /* CART VIEW */
            cart.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto text-2xl border border-emerald-200">
                  🛒
                </div>
                <h3 className="font-serif text-lg font-bold text-emerald-950">
                  Your cart is empty
                </h3>
                <p className="text-xs text-emerald-800/80 max-w-xs mx-auto">
                  Add fresh eggless cakes, pasta, pizzas, or burgers from our Dharamkot bistro menu.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="bg-emerald-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-emerald-800 transition-colors cursor-pointer"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <>
                {/* Guest Notice */}
                {!user && (
                  <div className="p-3 bg-emerald-50/90 border border-emerald-200/90 rounded-xl flex items-start gap-2.5 text-xs text-emerald-950">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-emerald-950">Google Sign-in Required to Place Order</p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Your cart items are saved. You will authenticate with Google when proceeding to checkout.
                      </p>
                    </div>
                  </div>
                )}

                {/* Cart Items List */}
                <div className="space-y-3 divide-y divide-emerald-100">
                  {cart.map((item) => (
                    <div key={item.cartItemId} className="pt-3 first:pt-0 flex gap-3">
                      <img
                        src={item.product?.image || (item as any).image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80'}
                        alt={item.product?.name || (item as any).name || 'Cart item'}
                        className="w-16 h-16 rounded-xl object-cover border border-emerald-200 flex-shrink-0"
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-bold text-xs sm:text-sm text-emerald-950 line-clamp-1">
                              {item.product?.name || (item as any).name || 'Item'}
                            </h4>
                            <span className="font-bold text-xs sm:text-sm text-emerald-700">
                              ₹{item.totalPrice}
                            </span>
                          </div>

                          {/* Selected Customization Options */}
                          {item.selectedOptions && item.selectedOptions.length > 0 && (
                            <div className="text-[11px] text-emerald-800/80 mt-0.5 space-y-0.5">
                              {item.selectedOptions.map((opt, idx) => (
                                <div key={idx}>
                                  • {opt.groupName}: {opt.optionName}
                                  {opt.price > 0 && ` (+₹${opt.price})`}
                                </div>
                              ))}
                            </div>
                          )}

                          {item.specialInstructions && (
                            <div className="text-[10px] text-stone-500 italic mt-0.5">
                              Note: "{item.specialInstructions}"
                            </div>
                          )}
                        </div>

                        {/* Quantity and Remove */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 bg-white border border-emerald-200 rounded-lg px-2 py-0.5">
                            <button
                              onClick={() =>
                                updateCartQuantity(item.cartItemId, item.quantity - 1)
                              }
                              className="text-emerald-800 hover:text-emerald-950 p-0.5 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold min-w-[14px] text-center text-emerald-950">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateCartQuantity(item.cartItemId, item.quantity + 1)
                              }
                              className="text-emerald-800 hover:text-emerald-950 p-0.5 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.cartItemId)}
                            className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Section */}
                <div className="pt-3 border-t border-emerald-100 space-y-2">
                  {appliedCoupon ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                        <Tag className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{appliedCoupon.code} Applied</span>
                        <span className="text-emerald-700 font-normal">(-₹{discountAmount})</span>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-emerald-900 font-bold hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <form onSubmit={handleApplyCoupon} className="space-y-1">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            placeholder="Coupon code (e.g. BISTRO100)"
                            className="flex-1 text-xs px-3 py-2 bg-white border border-emerald-200 rounded-xl text-emerald-950 focus:outline-none focus:border-emerald-600"
                          />
                          <button
                            type="submit"
                            className="bg-emerald-800 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-emerald-900 transition-colors cursor-pointer"
                          >
                            Apply
                          </button>
                        </div>
                        {couponError && (
                          <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>
                        )}
                      </form>

                      {/* Store-Owner Active Coupons Quick Tap */}
                      {coupons.filter((c) => c.isActive).length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                            Available Store Offers:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {coupons
                              .filter((c) => c.isActive)
                              .slice(0, 3)
                              .map((coupon) => {
                                const meetsCriteria = cartSubtotal >= coupon.minOrder;
                                return (
                                  <button
                                    key={coupon.id}
                                    type="button"
                                    onClick={() => {
                                      setCouponInput(coupon.code);
                                      applyCoupon(coupon.code);
                                    }}
                                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                                      meetsCriteria
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100 font-bold'
                                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                                    }`}
                                  >
                                    <Tag className="w-2.5 h-2.5 text-emerald-600" />
                                    <span>{coupon.code}</span>
                                    <span className="text-[10px] opacity-75 font-normal">
                                      (Min ₹{coupon.minOrder})
                                    </span>
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bill Summary */}
                <div className="bg-emerald-50/60 rounded-2xl p-4 space-y-2 text-xs border border-emerald-200/80">
                  <div className="flex justify-between text-emerald-900">
                    <span>Items Subtotal</span>
                    <span className="font-semibold">₹{cartSubtotal}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Promo Discount</span>
                      <span>-₹{discountAmount}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-emerald-900">
                    <span>Packaging & Taxes</span>
                    <span className="text-emerald-700 font-semibold">₹0 (Free)</span>
                  </div>

                  <div className="pt-2 border-t border-emerald-200 flex justify-between font-bold text-sm text-emerald-950">
                    <span>Estimated Total</span>
                    <span className="text-emerald-800 font-extrabold">₹{cartSubtotal - discountAmount}</span>
                  </div>
                </div>
              </>
            )
          ) : checkoutStep === 'checkout' ? (
            /* CHECKOUT VIEW */
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-5">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Customer Account Indicator / Login Prompt */}
              {user ? (
                <div className="p-3 bg-emerald-50/90 rounded-xl border border-emerald-200/90 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                      {customerProfile?.fullName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'C'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-emerald-950 truncate">
                        {customerProfile?.fullName || 'Customer Account'}
                      </p>
                      <p className="text-[10px] text-emerald-700 truncate">{user.email} • Verified Account</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-200/70 text-emerald-900 font-semibold px-2 py-0.5 rounded-full border border-emerald-300">
                    Verified
                  </span>
                </div>
              ) : (
                <div className="p-4 bg-amber-50/90 rounded-2xl border-2 border-amber-300 shadow-xs space-y-3">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                        Google Sign-in Required to Place Order
                      </p>
                      <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                        To place your order with Punjabi Bistro & Bakery, you must sign in with Google. Your cart items and entered details are preserved.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      try { sessionStorage.setItem('pb_pending_checkout', 'true'); } catch {}
                      openLoginModal();
                    }}
                    className="w-full py-2.5 px-3 bg-white hover:bg-stone-50 border border-amber-400 hover:border-emerald-600 text-stone-800 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Sign in with Google</span>
                  </button>
                </div>
              )}

              {/* Order Type Toggle */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-2">
                  Order Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['delivery', 'takeaway', 'dine_in'] as OrderType[]).map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setOrderType(type)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        orderType === type
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-white text-emerald-950 border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      {type === 'delivery' && '🛵 Delivery'}
                      {type === 'takeaway' && '🛍️ Takeaway'}
                      {type === 'dine_in' && '🍽️ Dine-in'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Contact Information
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Your Full Name *"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:outline-none focus:border-emerald-600"
                />
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Phone Number (10 digits) *"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Specific fields for Delivery */}
              {orderType === 'delivery' && (
                <div className="space-y-3 pt-2 border-t border-emerald-100">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900">
                      Dharamkot Delivery Zone
                    </label>
                    <span className="text-[10px] text-emerald-700 font-medium">Transparent rates</span>
                  </div>

                  <select
                    value={selectedZoneId}
                    onChange={(e) => setSelectedZoneId(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:outline-none focus:border-emerald-600"
                  >
                    {deliveryZones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name} — ₹{zone.fee} {zone.freeDeliveryThreshold ? `(Free on ₹${zone.freeDeliveryThreshold}+)` : ''}
                      </option>
                    ))}
                  </select>

                  <textarea
                    rows={2}
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="House / Street / Locality in Dharamkot *"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:outline-none focus:border-emerald-600"
                  />

                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="Famous Landmark (e.g. Near Udham Singh Chowk)"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:outline-none focus:border-emerald-600"
                  />

                  <label className="flex items-center gap-2 text-xs text-emerald-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contactlessDelivery}
                      onChange={(e) => setContactlessDelivery(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-600"
                    />
                    <span>Contactless Delivery (Leave at doorstep/gate)</span>
                  </label>
                </div>
              )}

              {/* Dine-in Table number */}
              {orderType === 'dine_in' && (
                <div className="space-y-1.5 pt-2 border-t border-emerald-100">
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900">
                    Table Number
                  </label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="e.g. Table 4"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              )}

              {/* Timing Slot */}
              <div className="space-y-2 pt-2 border-t border-emerald-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Fulfillment Time Slot
                </label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:outline-none focus:border-emerald-600"
                >
                  <option value="asap">⚡ ASAP (Immediate Fresh Preparation ~25-35 mins)</option>
                  <option value="01:00 PM - 01:30 PM">Lunch (01:00 PM - 01:30 PM)</option>
                  <option value="02:30 PM - 03:00 PM">Afternoon (02:30 PM - 03:00 PM)</option>
                  <option value="05:00 PM - 05:30 PM">Tea Time (05:00 PM - 05:30 PM)</option>
                  <option value="07:30 PM - 08:00 PM">Dinner (07:30 PM - 08:00 PM)</option>
                  <option value="09:00 PM - 09:30 PM">Late Dinner (09:00 PM - 09:30 PM)</option>
                </select>
              </div>

              {/* Payment Method */}
              <div className="space-y-2 pt-2 border-t border-emerald-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                      paymentMethod === 'cash'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-white text-emerald-950 border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    💵 Cash / Counter
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                      paymentMethod === 'upi'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-white text-emerald-950 border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    📱 UPI / QR Code
                  </button>
                </div>

                {paymentMethod === 'upi' && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-2 text-emerald-950">
                    <div className="flex items-center justify-between font-bold">
                      <span>Bistro UPI ID:</span>
                      <span className="font-mono text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">{businessSettings.upiId}</span>
                    </div>
                    <p className="text-[11px] text-emerald-800/80">
                      Pay via Google Pay, PhonePe, or Paytm to the UPI ID above. Enter your 12-digit transaction ID below:
                    </p>
                    <input
                      type="text"
                      value={upiTxnId}
                      onChange={(e) => setUpiTxnId(e.target.value)}
                      placeholder="UPI Reference / UTR Number (Optional)"
                      className="w-full text-xs px-3 py-1.5 rounded-lg border border-emerald-300 bg-white text-emerald-950"
                    />
                  </div>
                )}
              </div>

              {/* Transparent Final Bill */}
              <div className="bg-emerald-50/70 rounded-2xl p-4 space-y-2 text-xs border border-emerald-200">
                <div className="flex justify-between text-emerald-900">
                  <span>Items Subtotal</span>
                  <span>₹{cartSubtotal}</span>
                </div>
                {orderType === 'delivery' && (
                  <div className="flex justify-between text-emerald-900">
                    <span>Delivery ({selectedZone?.name || 'Standard'})</span>
                    <span className="font-semibold">
                      {deliveryFee === 0 ? (
                        <span className="text-emerald-700 font-bold">FREE</span>
                      ) : (
                        `₹${deliveryFee}`
                      )}
                    </span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-emerald-200 flex justify-between font-bold text-sm text-emerald-950">
                  <span>Total Amount</span>
                  <span className="text-emerald-800 font-extrabold text-base">₹{finalTotal}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCheckoutStep('cart')}
                  disabled={isPlacingOrder}
                  className="px-4 py-3 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-900 hover:bg-emerald-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Back
                </button>
                {user ? (
                  <button
                    type="submit"
                    disabled={isPlacingOrder}
                    className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isPlacingOrder ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending to Bakery...</span>
                      </>
                    ) : (
                      <>
                        <span>Place Bakery Order • ₹{finalTotal}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      try { sessionStorage.setItem('pb_pending_checkout', 'true'); } catch {}
                      openLoginModal();
                    }}
                    className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs sm:text-sm py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4 bg-white rounded-full p-0.5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Sign in with Google to Place Order • ₹{finalTotal}</span>
                  </button>
                )}
              </div>
            </form>
          ) : (
            /* SUCCESS VIEW */
            confirmedOrder && (
              <div className="py-6 text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-3xl animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div>
                  <h3 className="font-serif text-2xl font-bold text-emerald-950">
                    Order Placed Successfully!
                  </h3>
                  <p className="text-xs text-emerald-800 mt-1">
                    Fresh preparation initiated at Punjabi Bistro Dharamkot.
                  </p>
                </div>

                <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200 text-left space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-800 font-medium">Order Number:</span>
                    <span className="font-mono font-bold text-emerald-950">
                      #{confirmedOrder.orderNumber}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-800 font-medium">Database Status:</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Saved in Cloud (Supabase)
                    </span>
                  </div>
                  {confirmedOrder.customerEmail && (
                    <div className="flex justify-between text-xs">
                      <span className="text-emerald-800 font-medium">Linked Account:</span>
                      <span className="text-emerald-900 font-semibold truncate max-w-[180px]">
                        {confirmedOrder.customerEmail}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-800 font-medium">Time Slot:</span>
                    <span className="font-semibold text-emerald-950">
                      {confirmedOrder.timeSlot === 'asap' ? 'Immediate (~25-35 mins)' : confirmedOrder.timeSlot}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-800 font-medium">Total Paid / Due:</span>
                    <span className="font-bold text-emerald-950">₹{confirmedOrder.total}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {user && (
                    <button
                      onClick={() => {
                        setIsCartOpen(false);
                        setIsMyOrdersOpen(true);
                        setCheckoutStep('cart');
                      }}
                      className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs sm:text-sm py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                    >
                      <Clock className="w-4 h-4 text-emerald-200" />
                      <span>View in My Orders</span>
                    </button>
                  )}

                  <a
                    href={generateWhatsAppOrderUrl(confirmedOrder)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Send Order Slip via WhatsApp</span>
                  </a>

                  <button
                    onClick={handleViewMyOrder}
                    className="w-full bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold text-xs sm:text-sm py-3 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 text-emerald-700" />
                    <span>View My Order</span>
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        {/* Drawer Sticky Footer when in Cart step */}
        {checkoutStep === 'cart' && cart.length > 0 && (
          <div className="p-4 bg-emerald-50/80 border-t border-emerald-200 flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] text-emerald-800 block">Total</span>
              <span className="font-bold text-lg text-emerald-900">
                ₹{cartSubtotal - discountAmount}
              </span>
            </div>
            {user ? (
              <button
                onClick={handleProceedToCheckout}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleProceedToCheckout}
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs sm:text-sm px-4 py-3 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4 bg-white rounded-full p-0.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Sign in with Google to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
