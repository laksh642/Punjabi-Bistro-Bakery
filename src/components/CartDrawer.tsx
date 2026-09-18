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
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { OrderType, PaymentMethod, DeliveryZone } from '../types';

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
    setIsTrackingOpen,
    setTrackingOrderNumber,
    setTrackingToken,
    generateWhatsAppOrderUrl,
  } = useStore();

  // Checkout states
  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState<string>(deliveryZones[0]?.id || 'zone-1');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [tableNumber, setTableNumber] = useState('Table 4');
  const [timeSlot, setTimeSlot] = useState('asap');
  const [orderNotes, setOrderNotes] = useState('');
  const [contactlessDelivery, setContactlessDelivery] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [upiTxnId, setUpiTxnId] = useState('');
  const [couponInput, setCouponInput] = useState('');

  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isCartOpen) return null;

  // Selected Zone calculation
  const selectedZone = deliveryZones.find((z) => z.id === selectedZoneId) || deliveryZones[0];

  let deliveryFee = 0;
  if (orderType === 'delivery') {
    if (selectedZone.freeDeliveryThreshold && cartSubtotal >= selectedZone.freeDeliveryThreshold) {
      deliveryFee = 0;
    } else {
      deliveryFee = selectedZone.fee;
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
    setCheckoutStep('checkout');
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage('Please enter your name and contact phone number.');
      return;
    }

    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      setErrorMessage('Please enter your complete delivery address in Dharamkot.');
      return;
    }

    setErrorMessage(null);

    const newOrder = placeOrder({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || undefined,
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

    setConfirmedOrder(newOrder);
    setCheckoutStep('success');
  };

  const handleClose = () => {
    setIsCartOpen(false);
    if (checkoutStep === 'success') {
      setCheckoutStep('cart');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl border-l border-emerald-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
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
                {/* Cart Items List */}
                <div className="space-y-3 divide-y divide-emerald-100">
                  {cart.map((item) => (
                    <div key={item.cartItemId} className="pt-3 first:pt-0 flex gap-3">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-16 h-16 rounded-xl object-cover border border-emerald-200 flex-shrink-0"
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-bold text-xs sm:text-sm text-emerald-950 line-clamp-1">
                              {item.product.name}
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
                    <span>Delivery ({selectedZone.name})</span>
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
                  className="px-4 py-3 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-900 hover:bg-emerald-50 transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Confirm Order • ₹{finalTotal}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
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
                    <span className="font-mono font-bold text-emerald-900">
                      #{confirmedOrder.orderNumber}
                    </span>
                  </div>
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
                    onClick={() => {
                      setIsCartOpen(false);
                      setTrackingOrderNumber(confirmedOrder.orderNumber);
                      if (confirmedOrder.trackingToken) {
                        setTrackingToken(confirmedOrder.trackingToken);
                      }
                      setIsTrackingOpen(true);
                      setCheckoutStep('cart');
                    }}
                    className="w-full bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold text-xs sm:text-sm py-3 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <Clock className="w-4 h-4 text-emerald-700" />
                    <span>Live Order Tracker</span>
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
            <button
              onClick={handleProceedToCheckout}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
