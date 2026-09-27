import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  Search,
  Clock,
  CheckCircle2,
  Package,
  Bike,
  AlertCircle,
  Phone,
  MessageCircle,
  ArrowLeft,
  Store,
  FileText,
  Lock,
  Copy,
  Check,
  ShieldCheck,
  RefreshCw,
  ChefHat,
  PackageCheck,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Order, OrderStatus } from '../types';
import {
  fetchOrderByToken,
  fetchOrderByNumber,
  fetchOrderByNumberAndPhone,
  subscribeToOrderUpdates,
} from '../lib/supabase';

export const OrderTrackingPage: React.FC = () => {
  const {
    customerOrders,
    businessSettings,
    getCustomerToken,
    saveCustomerToken,
  } = useStore();

  const { token: routeToken } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [phoneQuery, setPhoneQuery] = useState('');
  const [needsPhoneVerification, setNeedsPhoneVerification] = useState(false);
  const [pendingOrderNumber, setPendingOrderNumber] = useState('');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Track initialization
  const hasInitializedRef = useRef(false);

  // Helper to load order via tracking token or order number
  const loadOrderByTokenOrNumber = useCallback(
    async (queryParam: string, tokenParam?: string): Promise<boolean> => {
      const raw = queryParam.trim();
      if (!raw && !tokenParam) return false;

      let cleanNum = raw.toUpperCase();
      if (!cleanNum.startsWith('PB-') && /^\d+$/.test(cleanNum)) {
        cleanNum = `PB-${cleanNum}`;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        // 1. Check if order exists in customerOrders on this device (instant!)
        const local = customerOrders.find(
          (o) =>
            o.orderNumber.toUpperCase() === cleanNum ||
            o.orderNumber.toUpperCase() === raw.toUpperCase() ||
            (tokenParam && o.trackingToken && o.trackingToken.toLowerCase() === tokenParam.toLowerCase()) ||
            (raw.length > 16 && o.trackingToken && o.trackingToken.toLowerCase() === raw.toLowerCase())
        );

        if (local) {
          setSelectedOrder(local);
          if (local.trackingToken) {
            saveCustomerToken(local.orderNumber, local.trackingToken);
          }
          setNeedsPhoneVerification(false);
        }

        // 2. Fetch fresh from token if available
        const effectiveToken =
          tokenParam || (raw.length > 16 ? raw : undefined) || getCustomerToken(cleanNum);

        if (effectiveToken) {
          const fresh = await fetchOrderByToken(effectiveToken);
          if (fresh) {
            setSelectedOrder(fresh);
            saveCustomerToken(fresh.orderNumber, fresh.trackingToken);
            setNeedsPhoneVerification(false);
            return true;
          }
        }

        // 3. Fetch from cloud by order number
        if (cleanNum) {
          const cloudOrder = await fetchOrderByNumber(cleanNum);
          if (cloudOrder) {
            setSelectedOrder(cloudOrder);
            if (cloudOrder.trackingToken) {
              saveCustomerToken(cloudOrder.orderNumber, cloudOrder.trackingToken);
            }
            setNeedsPhoneVerification(false);
            return true;
          }
        }

        if (!local) {
          setPendingOrderNumber(cleanNum || raw);
          setNeedsPhoneVerification(true);
          setErrorMessage(`Order #${cleanNum || raw} not found on this device. Please verify your phone number to track.`);
        }
      } catch (err) {
        console.warn('loadOrderByTokenOrNumber page error:', err);
        setErrorMessage('Unable to retrieve order details. Please check the order number.');
      } finally {
        setIsLoading(false);
      }
      return false;
    },
    [customerOrders, getCustomerToken, saveCustomerToken]
  );

  // Helper to load order by order number + phone verification
  const loadByNumberAndPhone = async (orderNum: string, phone: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const order = await fetchOrderByNumberAndPhone(orderNum, phone);
      if (order) {
        setSelectedOrder(order);
        saveCustomerToken(order.orderNumber, order.trackingToken);
        setNeedsPhoneVerification(false);
        setPendingOrderNumber('');
        setPhoneQuery('');
      } else {
        setErrorMessage(
          'Order not found or phone number does not match the customer record on this order.'
        );
      }
    } catch (err) {
      console.warn('loadByNumberAndPhone error:', err);
      setErrorMessage('Error verifying order ownership. Please verify details.');
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Initial resolution on page mount or URL parameter change only
  useEffect(() => {
    const tokenParam = routeToken || searchParams.get('token');
    const orderIdParam = searchParams.get('id') || searchParams.get('order');

    if (tokenParam) {
      setSearchQuery(tokenParam);
      loadOrderByTokenOrNumber(tokenParam, tokenParam);
    } else if (orderIdParam) {
      const cleanNum = orderIdParam.trim().toUpperCase();
      setSearchQuery(cleanNum);
      const localToken = getCustomerToken(cleanNum);
      loadOrderByTokenOrNumber(cleanNum, localToken);
    } else if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      if (customerOrders.length > 0) {
        const latest = customerOrders[0];
        setSelectedOrder(latest);
        setSearchQuery(latest.orderNumber);
        if (latest.trackingToken) {
          saveCustomerToken(latest.orderNumber, latest.trackingToken);
        }
      }
    }
  }, [routeToken, searchParams]);

  // 2. Real-time Subscription for currently selected order
  useEffect(() => {
    if (!selectedOrder?.trackingToken) return;

    const unsubscribe = subscribeToOrderUpdates(
      selectedOrder.orderNumber,
      selectedOrder.trackingToken,
      (update) => {
        setSelectedOrder((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            status: update.status || prev.status,
            delayMinutes:
              update.delayMinutes !== undefined ? update.delayMinutes : prev.delayMinutes,
            delayMessage:
              update.delayMessage !== undefined ? update.delayMessage : prev.delayMessage,
          };
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [selectedOrder?.orderNumber, selectedOrder?.trackingToken]);

  // Handle Search Submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setErrorMessage('Please enter an order number (e.g. PB-6991) or tracking token.');
      return;
    }

    setErrorMessage(null);
    setNeedsPhoneVerification(false);

    let clean = query.toUpperCase();
    if (!clean.startsWith('PB-') && /^\d+$/.test(clean)) {
      clean = `PB-${clean}`;
      setSearchQuery(clean);
    }

    await loadOrderByTokenOrNumber(clean);
  };

  // Handle Phone Verification Submission
  const handlePhoneVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingOrderNumber || !phoneQuery.trim()) return;
    await loadByNumberAndPhone(pendingOrderNumber, phoneQuery.trim());
  };

  const handleCopyTrackingLink = () => {
    if (!selectedOrder?.trackingToken) return;
    const url = `${window.location.origin}/track/${selectedOrder.trackingToken}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const getStatusStep = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return 1;
      case 'confirmed':
        return 2;
      case 'preparing':
        return 3;
      case 'ready':
      case 'out_for_delivery':
        return 4;
      case 'delivered':
      case 'completed':
        return 5;
      case 'cancelled':
        return -1;
      default:
        return 1;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans antialiased text-stone-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Header */}
      <header className="bg-white border-b border-emerald-100 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors"
              title="Return to Storefront"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <img
                src="/logoo.png"
                alt="Punjabi Bistro & Bakery"
                className="h-9 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div>
                <h1 className="font-serif font-bold text-base sm:text-lg text-emerald-950 leading-tight">
                  Punjabi Bistro & Bakery
                </h1>
                <p className="text-[11px] text-emerald-700 font-semibold">
                  Secure Live Order Status & Kitchen Tracker
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Browse Menu</span>
            </Link>
            <a
              href={`https://wa.me/${businessSettings.whatsapp}?text=${encodeURIComponent(
                `Hello Punjabi Bistro, I am tracking my order ${selectedOrder ? `#${selectedOrder.orderNumber}` : ''}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 px-3.5 py-1.5 rounded-xl shadow-2xs transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp Help</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Search Bar Card */}
        <div className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-xs mb-8">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-emerald-950">
              Track Your Order
            </h2>
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Privacy Protected</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 mb-4">
            Enter your Order Number (e.g. PB-4081) or secret tracking link to check live preparation and kitchen status.
          </p>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Order # (e.g. PB-6991) or tracking token..."
                className="w-full pl-10 pr-9 py-2.5 bg-emerald-50/40 border border-emerald-200 rounded-xl text-sm text-emerald-950 placeholder-stone-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setErrorMessage(null);
                    setNeedsPhoneVerification(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 transition-colors rounded-full cursor-pointer"
                  title="Clear input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Tracking...</span>
                </>
              ) : (
                <span>Track</span>
              )}
            </button>
          </form>

          {/* Customer's Local Orders Quick Selection */}
          {customerOrders.length > 0 && (
            <div className="mt-4 pt-3 border-t border-emerald-100/70">
              <span className="text-[11px] font-semibold text-emerald-900 uppercase tracking-wider block mb-2">
                Your Orders on this Device:
              </span>
              <div className="flex flex-wrap gap-2">
                {customerOrders.map((ord) => (
                  <button
                    key={ord.id}
                    type="button"
                    onClick={() => {
                      setSearchQuery(ord.orderNumber);
                      setSelectedOrder(ord);
                      setNeedsPhoneVerification(false);
                      setErrorMessage(null);
                      if (ord.trackingToken) {
                        saveCustomerToken(ord.orderNumber, ord.trackingToken);
                      }
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedOrder?.orderNumber === ord.orderNumber
                        ? 'bg-emerald-800 text-white border-emerald-800 font-bold shadow-xs'
                        : 'bg-emerald-50/60 hover:bg-emerald-100 text-emerald-900 border-emerald-200 font-medium'
                    }`}
                  >
                    <span>#{ord.orderNumber}</span>
                    <span className="text-[10px] opacity-80 uppercase">({ord.status})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Security / Phone Verification Dialog */}
        {needsPhoneVerification && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-6 mb-8 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                <Lock className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif font-bold text-amber-950 text-base">
                  Verify Order Ownership
                </h3>
                <p className="text-xs text-amber-900 mt-1 mb-3 leading-relaxed">
                  To protect customer privacy, order <strong>#{pendingOrderNumber}</strong> requires
                  verification. Please enter the 10-digit mobile number provided at checkout.
                </p>

                <form onSubmit={handlePhoneVerify} className="flex flex-col sm:flex-row gap-2 sm:max-w-md">
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-amber-700 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      value={phoneQuery}
                      onChange={(e) => setPhoneQuery(e.target.value)}
                      placeholder="10-digit mobile number"
                      maxLength={14}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-amber-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-amber-600"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !phoneQuery.trim()}
                    className="bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    {isLoading ? 'Verifying...' : 'Verify & View'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 mb-8 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Selected Order Details */}
        {selectedOrder ? (
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-3xl border border-emerald-100 p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-emerald-100">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                      <span>Order #{selectedOrder.orderNumber}</span>
                    </span>
                    <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">
                      {selectedOrder.orderType.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-emerald-950">
                    {selectedOrder.orderType === 'delivery'
                      ? 'Home Delivery Order'
                      : selectedOrder.orderType === 'dine_in'
                      ? `Dine-In (Table ${selectedOrder.tableNumber || 'N/A'})`
                      : 'Takeaway / Counter Pickup'}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Placed on{' '}
                    {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div className="sm:text-right">
                  <div className="text-xs text-stone-500 uppercase font-semibold">Total Amount</div>
                  <div className="text-2xl font-extrabold text-emerald-900">
                    ₹{selectedOrder.total}
                  </div>
                  <div className="text-xs text-emerald-700 font-semibold uppercase">
                    {selectedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online / UPI Paid'}
                  </div>
                </div>
              </div>

              {/* Private Shareable Tracking Link */}
              {selectedOrder.trackingToken && (
                <div className="mt-4 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-900 font-medium">
                    <Lock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Your Secure Tracking Link:</span>
                    <span className="text-[11px] text-emerald-700 font-mono hidden md:inline truncate max-w-xs">
                      {window.location.origin}/track/{selectedOrder.trackingToken}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyTrackingLink}
                    className="inline-flex items-center gap-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ml-auto"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Delay Alert if any */}
              {selectedOrder.delayMinutes && selectedOrder.delayMinutes > 0 && (
                <div className="my-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0" />
                  <div>
                    <span className="font-bold">Kitchen Rush Update: </span>
                    {selectedOrder.delayMessage ||
                      `We are taking approximately ${selectedOrder.delayMinutes} extra minutes to bake and pack your order to perfection. Thank you for your patience!`}
                  </div>
                </div>
              )}

              {/* Progress Stepper */}
              <div className="py-8">
                <div className="relative">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
                    {/* Step 1: Received */}
                    <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white border border-emerald-100 sm:border-transparent">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm mb-2 ${
                          getStatusStep(selectedOrder.status) >= 1
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-xs text-emerald-950">Received</span>
                      <span className="text-[11px] text-stone-500">Order confirmed</span>
                    </div>

                    {/* Step 2: In Kitchen */}
                    <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white border border-emerald-100 sm:border-transparent">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm mb-2 ${
                          getStatusStep(selectedOrder.status) >= 3
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : getStatusStep(selectedOrder.status) === 2
                            ? 'bg-emerald-600 text-white animate-pulse'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        <ChefHat className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-xs text-emerald-950">In Kitchen</span>
                      <span className="text-[11px] text-stone-500">Baking & preparing</span>
                    </div>

                    {/* Step 3: Out for Delivery / Ready */}
                    <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white border border-emerald-100 sm:border-transparent">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm mb-2 ${
                          getStatusStep(selectedOrder.status) >= 4
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {selectedOrder.orderType === 'delivery' ? (
                          <Bike className="w-5 h-5" />
                        ) : (
                          <PackageCheck className="w-5 h-5" />
                        )}
                      </div>
                      <span className="font-bold text-xs text-emerald-950">
                        {selectedOrder.orderType === 'delivery' ? 'On the Way' : 'Ready for Pickup'}
                      </span>
                      <span className="text-[11px] text-stone-500">
                        {selectedOrder.orderType === 'delivery'
                          ? 'Rider dispatched'
                          : 'Counter ready'}
                      </span>
                    </div>

                    {/* Step 4: Delivered */}
                    <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white border border-emerald-100 sm:border-transparent">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm mb-2 ${
                          getStatusStep(selectedOrder.status) >= 5
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-xs text-emerald-950">Completed</span>
                      <span className="text-[11px] text-stone-500">Enjoy your meal!</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items Summary */}
              <div className="pt-6 border-t border-emerald-100">
                <h4 className="font-bold text-xs text-emerald-950 uppercase tracking-wider mb-3">
                  Items in this Order
                </h4>
                <div className="divide-y divide-emerald-50">
                  {selectedOrder.items.map((item, idx) => {
                    const itemName = item.product?.name || (item as any).name || 'Bakery Item';
                    const itemPrice = item.totalPrice || item.unitPrice * item.quantity || 0;
                    return (
                      <div
                        key={idx}
                        className="py-2.5 flex items-center justify-between text-xs sm:text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-800">{item.quantity}x</span>
                          <span className="font-medium text-emerald-950">{itemName}</span>
                          {item.selectedOptions && item.selectedOptions.length > 0 && (
                            <span className="text-[11px] text-stone-500">
                              ({item.selectedOptions.map((o) => o.optionName).join(', ')})
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-emerald-950">₹{itemPrice}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Subtotal & Delivery details */}
                <div className="mt-4 pt-4 border-t border-emerald-100 flex flex-col gap-1.5 text-xs text-stone-600">
                  {selectedOrder.deliveryAddress && (
                    <div className="flex justify-between">
                      <span>Delivery Address</span>
                      <span className="font-semibold text-emerald-950 text-right max-w-xs">
                        {selectedOrder.deliveryAddress}
                        {selectedOrder.landmark ? ` (Landmark: ${selectedOrder.landmark})` : ''}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Contact Name</span>
                    <span className="font-semibold text-emerald-950">
                      {selectedOrder.customerName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scheduled Time</span>
                    <span className="font-semibold text-emerald-950">
                      {selectedOrder.timeSlot === 'asap'
                        ? 'Immediate (ASAP)'
                        : selectedOrder.timeSlot}
                    </span>
                  </div>
                </div>
              </div>

              {/* Support Actions */}
              <div className="mt-6 pt-6 border-t border-emerald-100 flex flex-wrap items-center gap-3 justify-between">
                <div className="text-xs text-stone-500">
                  Questions regarding this order? Call our Dharamkot staff anytime.
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${businessSettings.phone.replace(/\s+/g, '')}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-950 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Call Counter</span>
                  </a>
                  <a
                    href={`https://wa.me/${businessSettings.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          !needsPhoneVerification && (
            <div className="bg-white rounded-3xl border border-emerald-100 p-8 text-center shadow-xs">
              <FileText className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
              <h3 className="font-serif text-lg font-bold text-emerald-950 mb-1">
                No Order Selected
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto mb-4">
                Enter your order number or tracking link above to track your order in real time.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                <Store className="w-4 h-4" />
                <span>Back to Storefront Menu</span>
              </Link>
            </div>
          )
        )}
      </main>
    </div>
  );
};
