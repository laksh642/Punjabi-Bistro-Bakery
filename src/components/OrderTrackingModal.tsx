import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Clock,
  Search,
  CheckCircle2,
  AlertTriangle,
  Phone,
  MessageCircle,
  Printer,
  Star,
  Bike,
  ChefHat,
  PackageCheck,
  Lock,
  Copy,
  Check,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Order, OrderStatus } from '../types';
import {
  fetchOrderByToken,
  fetchOrderByNumber,
  fetchOrderByNumberAndPhone,
  subscribeToOrderUpdates,
} from '../lib/supabase';

const STATUS_STEPS: { status: OrderStatus; label: string; icon: any }[] = [
  { status: 'new', label: 'Order Received', icon: Clock },
  { status: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { status: 'preparing', label: 'In Kitchen', icon: ChefHat },
  { status: 'ready', label: 'Ready for Pickup', icon: PackageCheck },
  { status: 'out_for_delivery', label: 'Out for Delivery', icon: Bike },
  { status: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

export const OrderTrackingModal: React.FC = () => {
  const {
    isTrackingOpen,
    setIsTrackingOpen,
    trackingOrderNumber,
    trackingToken,
    customerOrders,
    businessSettings,
    setIsIssueModalOpen,
    submitFeedback,
    getCustomerToken,
    saveCustomerToken,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [phoneQuery, setPhoneQuery] = useState('');
  const [needsPhoneVerification, setNeedsPhoneVerification] = useState(false);
  const [pendingOrderNumber, setPendingOrderNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Feedback State
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Track whether the modal has performed its initial auto-fill on open
  const hasInitializedRef = useRef(false);

  // Helper to load order via tracking token or order number
  const loadOrderByTokenOrNumber = useCallback(
    async (queryParam: string, tokenParam?: string) => {
      const raw = queryParam.trim();
      if (!raw && !tokenParam) return;

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
          setCurrentOrder(local);
          if (local.trackingToken) {
            saveCustomerToken(local.orderNumber, local.trackingToken);
          }
          setNeedsPhoneVerification(false);
        }

        // 2. If token is provided or stored, fetch fresh data via token
        const effectiveToken =
          tokenParam || (raw.length > 16 ? raw : undefined) || getCustomerToken(cleanNum);

        if (effectiveToken) {
          const fresh = await fetchOrderByToken(effectiveToken);
          if (fresh) {
            setCurrentOrder(fresh);
            saveCustomerToken(fresh.orderNumber, fresh.trackingToken);
            setNeedsPhoneVerification(false);
            return;
          }
        }

        // 3. If no token match or token not found, query cloud by order number
        if (cleanNum) {
          const cloudOrder = await fetchOrderByNumber(cleanNum);
          if (cloudOrder) {
            setCurrentOrder(cloudOrder);
            if (cloudOrder.trackingToken) {
              saveCustomerToken(cloudOrder.orderNumber, cloudOrder.trackingToken);
            }
            setNeedsPhoneVerification(false);
            return;
          }
        }

        // 4. If not found locally or in cloud
        if (!local) {
          setPendingOrderNumber(cleanNum || raw);
          setNeedsPhoneVerification(true);
          setErrorMessage(
            `Order #${cleanNum || raw} was not found on this device. Please verify your phone number to view live status.`
          );
        }
      } catch (err) {
        console.warn('loadOrderByTokenOrNumber error:', err);
        if (!currentOrder) {
          setErrorMessage('Unable to retrieve order details. Please check the order number.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [customerOrders, getCustomerToken, saveCustomerToken, currentOrder]
  );

  // Helper to load order by order number + phone verification
  const loadByNumberAndPhone = async (orderNum: string, phone: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const order = await fetchOrderByNumberAndPhone(orderNum, phone);
      if (order) {
        setCurrentOrder(order);
        saveCustomerToken(order.orderNumber, order.trackingToken);
        setNeedsPhoneVerification(false);
        setPendingOrderNumber('');
        setPhoneQuery('');
      } else {
        setErrorMessage(
          'Order not found or mobile number does not match order records.'
        );
      }
    } catch (err) {
      console.warn('loadByNumberAndPhone modal error:', err);
      setErrorMessage('Verification failed. Please check your phone number.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sync initial search query ONCE when modal transitions from closed to open
  useEffect(() => {
    if (!isTrackingOpen) {
      hasInitializedRef.current = false;
      return;
    }

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      setFeedbackSubmitted(false);
      setErrorMessage(null);

      if (trackingToken) {
        setSearchQuery(trackingOrderNumber || trackingToken);
        loadOrderByTokenOrNumber(trackingOrderNumber || trackingToken, trackingToken);
      } else if (trackingOrderNumber) {
        setSearchQuery(trackingOrderNumber);
        const token = getCustomerToken(trackingOrderNumber);
        loadOrderByTokenOrNumber(trackingOrderNumber, token);
      } else if (customerOrders.length > 0) {
        const latest = customerOrders[0];
        setSearchQuery(latest.orderNumber);
        setCurrentOrder(latest);
        if (latest.trackingToken) {
          saveCustomerToken(latest.orderNumber, latest.trackingToken);
        }
      }
    }
  }, [isTrackingOpen]);

  // Real-time updates subscription for currently tracked order
  useEffect(() => {
    if (!currentOrder?.trackingToken) return;

    const unsubscribe = subscribeToOrderUpdates(
      currentOrder.orderNumber,
      currentOrder.trackingToken,
      (update) => {
        setCurrentOrder((prev) => {
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
  }, [currentOrder?.orderNumber, currentOrder?.trackingToken]);

  if (!isTrackingOpen) return null;

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setErrorMessage('Please enter an order number or tracking code.');
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

  const handlePhoneVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingOrderNumber || !phoneQuery.trim()) return;
    await loadByNumberAndPhone(pendingOrderNumber, phoneQuery.trim());
  };

  const handleCopyTrackingLink = () => {
    if (!currentOrder?.trackingToken) return;
    const url = `${window.location.origin}/track/${currentOrder.trackingToken}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const getCurrentStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return 0;
      case 'confirmed':
        return 1;
      case 'preparing':
        return 2;
      case 'ready':
        return 3;
      case 'out_for_delivery':
        return 4;
      case 'delivered':
      case 'completed':
        return 5;
      case 'cancelled':
        return -1;
      default:
        return 0;
    }
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrder) return;

    submitFeedback({
      orderId: currentOrder.id,
      orderNumber: currentOrder.orderNumber,
      customerName: currentOrder.customerName,
      customerPhone: currentOrder.customerPhone,
      rating: feedbackRating,
      comments: feedbackComments.trim(),
    });

    setFeedbackSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-xl w-full border border-emerald-200 shadow-2xl overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-900 to-[#0B2E15] text-white border-b border-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-300" />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-white">
              Live Order Tracker
            </h2>
          </div>
          <button
            onClick={() => setIsTrackingOpen(false)}
            className="p-1.5 rounded-full hover:bg-emerald-800 text-emerald-200 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-emerald-50/50 border-b border-emerald-100">
          <form onSubmit={handleTrackSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Order # (e.g. PB-6991) or tracking token..."
                className="w-full pl-10 pr-9 py-2.5 bg-white border border-emerald-200 rounded-xl text-xs sm:text-sm text-emerald-950 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
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
                  title="Clear order number"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-emerald-800 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Tracking...</span>
                </>
              ) : (
                <span>Track</span>
              )}
            </button>
          </form>

          {/* Quick-select recent orders from this device */}
          {customerOrders.length > 0 && (
            <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              <span className="text-emerald-800 font-semibold flex-shrink-0">Your Orders:</span>
              {customerOrders.map((ord) => (
                <button
                  key={ord.id}
                  type="button"
                  onClick={() => {
                    setSearchQuery(ord.orderNumber);
                    setCurrentOrder(ord);
                    setNeedsPhoneVerification(false);
                    setErrorMessage(null);
                    if (ord.trackingToken) {
                      saveCustomerToken(ord.orderNumber, ord.trackingToken);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-md border flex-shrink-0 transition-colors cursor-pointer ${
                    currentOrder?.orderNumber === ord.orderNumber
                      ? 'bg-emerald-800 text-white border-emerald-800 font-bold'
                      : 'bg-white hover:bg-emerald-100/70 text-emerald-900 border-emerald-200'
                  }`}
                >
                  #{ord.orderNumber}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Security / Phone Verification Dialog */}
        {needsPhoneVerification && (
          <div className="m-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <div className="flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-bold text-xs text-amber-950">Verify Order Ownership</h4>
                <p className="text-[11px] text-amber-800 mt-0.5 mb-2 leading-tight">
                  To protect order privacy, enter the 10-digit mobile number for order{' '}
                  <strong>#{pendingOrderNumber}</strong>:
                </p>
                <form onSubmit={handlePhoneVerify} className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="w-3.5 h-3.5 text-amber-700 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phoneQuery}
                      onChange={(e) => setPhoneQuery(e.target.value)}
                      placeholder="10-digit mobile number"
                      maxLength={14}
                      className="w-full pl-8 pr-2 py-1.5 bg-white border border-amber-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:border-amber-600"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !phoneQuery.trim()}
                    className="bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    {isLoading ? 'Checking...' : 'Verify'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="mx-4 mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tracking Details */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto bg-white">
          {currentOrder ? (
            <>
              {/* Order Meta Box */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200">
                <div>
                  <div className="text-xs text-emerald-800 font-medium">Order Reference</div>
                  <div className="font-mono text-lg font-extrabold text-emerald-900">
                    #{currentOrder.orderNumber}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-emerald-800 font-medium">Customer Name</div>
                  <div className="text-xs font-bold text-emerald-950">
                    {currentOrder.customerName}
                  </div>
                </div>
              </div>

              {/* Secure Tracking Link */}
              {currentOrder.trackingToken && (
                <div className="p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-medium truncate">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                    <span className="text-[11px] truncate">
                      Secret Link: /track/{currentOrder.trackingToken.slice(0, 13)}...
                    </span>
                  </div>
                  <button
                    onClick={handleCopyTrackingLink}
                    className="inline-flex items-center gap-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer flex-shrink-0"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Kitchen Delay Update */}
              {currentOrder.delayMinutes && currentOrder.delayMinutes > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-sm text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Kitchen Delay Update (+{currentOrder.delayMinutes} Mins)</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    {currentOrder.delayMessage ||
                      `We are baking fresh batches to ensure supreme freshness. Your order will take approximately ${currentOrder.delayMinutes} extra minutes.`}
                  </p>
                </div>
              )}

              {/* Order Status Stepper */}
              <div>
                <h3 className="font-serif text-sm font-bold text-emerald-950 uppercase tracking-wider mb-4">
                  Order Status
                </h3>

                <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-200">
                  {STATUS_STEPS.map((step, idx) => {
                    const currentIdx = getCurrentStepIndex(currentOrder.status);
                    const isPassed = currentIdx >= idx;
                    const isCurrent = currentIdx === idx;
                    const IconComp = step.icon;

                    return (
                      <div key={step.status} className="relative flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center -ml-6 border-2 transition-all ${
                            isCurrent
                              ? 'bg-emerald-700 border-white text-white shadow-md ring-2 ring-emerald-500/40'
                              : isPassed
                              ? 'bg-emerald-600 border-white text-white'
                              : 'bg-white border-stone-300 text-stone-400'
                          }`}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                        </div>

                        <div className="flex-1 flex items-center justify-between">
                          <span
                            className={`text-xs sm:text-sm font-semibold ${
                              isCurrent
                                ? 'text-emerald-800 font-bold'
                                : isPassed
                                ? 'text-emerald-950'
                                : 'text-stone-400'
                            }`}
                          >
                            {step.label}
                          </span>

                          {isCurrent && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full animate-pulse border border-emerald-200">
                              In Progress
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Items Summary */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-serif text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    Order Details ({currentOrder.items.length} items)
                  </h4>
                  <span className="text-xs font-bold text-emerald-900">
                    Total: ₹{currentOrder.total}
                  </span>
                </div>

                <div className="space-y-1.5 divide-y divide-stone-200/60">
                  {currentOrder.items.map((item, i) => {
                    const name = item.product?.name || (item as any).name || 'Item';
                    const price = item.totalPrice || item.unitPrice * item.quantity || 0;
                    return (
                      <div key={i} className="pt-1.5 flex justify-between text-xs text-stone-700">
                        <span>
                          {item.quantity}x {name}
                          {item.selectedOptions && item.selectedOptions.length > 0 && (
                            <span className="text-[10px] text-stone-500 block">
                              {item.selectedOptions.map((o) => o.optionName).join(', ')}
                            </span>
                          )}
                        </span>
                        <span className="font-medium text-stone-900">₹{price}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Support & Print Action */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-100">
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${businessSettings.phone.replace(/\s+/g, '')}`}
                    className="inline-flex items-center gap-1 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 font-medium"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Bakery Support</span>
                  </a>
                  <button
                    onClick={() => setIsIssueModalOpen(true)}
                    className="text-xs text-rose-700 hover:text-rose-800 font-medium underline cursor-pointer"
                  >
                    Report an Issue
                  </button>
                </div>

                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 p-1.5 rounded-lg border border-stone-200 cursor-pointer"
                  title="Print Slip"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
              </div>

              {/* Customer Feedback section */}
              <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-200/80">
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider mb-2">
                  Rate Your Experience
                </h4>
                {feedbackSubmitted ? (
                  <p className="text-xs text-emerald-800 font-medium">
                    ✓ Thank you for your feedback! Our bakers truly appreciate it.
                  </p>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-2.5">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          className="p-1 text-amber-500 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              feedbackRating >= star
                                ? 'fill-amber-500 text-amber-500'
                                : 'text-stone-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={feedbackComments}
                      onChange={(e) => setFeedbackComments(e.target.value)}
                      placeholder="Any comments about taste, packing, or delivery timing?"
                      className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-emerald-200 focus:outline-none focus:border-emerald-600 text-emerald-950"
                    />

                    <button
                      type="submit"
                      className="bg-emerald-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer"
                    >
                      Submit Feedback
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            !needsPhoneVerification && (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto text-xl border border-emerald-200">
                  🔎
                </div>
                <h3 className="font-serif text-base font-bold text-emerald-950">
                  No order currently selected
                </h3>
                <p className="text-xs text-emerald-800/80 max-w-xs mx-auto">
                  Enter your order number (e.g. PB-4081) or tracking token above to view live progress.
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
