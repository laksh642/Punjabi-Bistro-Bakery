import React, { useState, useEffect } from 'react';
import {
  Clock,
  MapPin,
  MessageCircle,
  Copy,
  Check,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  UtensilsCrossed,
} from 'lucide-react';
import { Order, OrderType, BusinessSettings } from '../types';

interface OrderSuccessAnimationProps {
  isOpen: boolean;
  isProcessing: boolean;
  order: Order | null;
  error: string | null;
  onRetry: () => void;
  onClose: () => void;
  onViewTracking: () => void;
  onViewMyOrders?: () => void;
  onWhatsAppShare: () => void;
  userEmail?: string;
  orderType: OrderType;
  businessSettings: BusinessSettings;
}

type AnimationStage =
  | 'processing'
  | 'settling'
  | 'circle_formed'
  | 'drawing_check'
  | 'pulse'
  | 'text_reveal'
  | 'details_reveal'
  | 'error';

export const OrderSuccessAnimation: React.FC<OrderSuccessAnimationProps> = ({
  isOpen,
  isProcessing,
  order,
  error,
  onRetry,
  onClose,
  onViewTracking,
  onViewMyOrders,
  onWhatsAppShare,
  userEmail,
  orderType,
  businessSettings,
}) => {
  const [stage, setStage] = useState<AnimationStage>('processing');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;
    let timer3: NodeJS.Timeout;
    let timer4: NodeJS.Timeout;
    let timer5: NodeJS.Timeout;

    if (error) {
      setStage('error');
      return;
    }

    if (isProcessing && !order) {
      setStage('processing');
      return;
    }

    if (order && !error) {
      // Backend confirmation arrived! Begin the precise choreographed sequence:
      // 0 - 250ms: Settle processing indicator into uniform circular outline
      setStage('settling');

      // 250ms: Green success circle completes outline
      timer1 = setTimeout(() => {
        setStage('circle_formed');
      }, 250);

      // 450ms: Checkmark vector path starts drawing (~800ms drawing duration)
      timer2 = setTimeout(() => {
        setStage('drawing_check');
      }, 450);

      // 1250ms: Checkmark settles, subtle success pop and radiant ring pulse
      timer3 = setTimeout(() => {
        setStage('pulse');
      }, 1250);

      // 1600ms: "Order Received!" title and supporting copy reveal
      timer4 = setTimeout(() => {
        setStage('text_reveal');
      }, 1600);

      // 1950ms: Order number, item slip and action buttons reveal
      timer5 = setTimeout(() => {
        setStage('details_reveal');
      }, 1950);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [isProcessing, order, error]);

  if (!isOpen) return null;

  const handleCopyOrderNumber = () => {
    if (!order?.orderNumber) return;
    navigator.clipboard.writeText(order.orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCheckVisible =
    stage === 'drawing_check' ||
    stage === 'pulse' ||
    stage === 'text_reveal' ||
    stage === 'details_reveal';

  const isTextRevealed =
    stage === 'text_reveal' || stage === 'details_reveal';

  const isDetailsRevealed = stage === 'details_reveal';

  return (
    <div className="absolute inset-0 z-40 bg-stone-900/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-md mx-auto bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-emerald-100 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Brand Header Bar */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-950 via-[#0B2E15] to-emerald-900 border-b border-emerald-800 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-sm tracking-wide text-amber-200">
              Punjabi Bistro & Bakery
            </span>
            <span className="text-emerald-400/80 text-xs hidden sm:inline">· Dharamkot</span>
          </div>
          {isDetailsRevealed && (
            <button
              onClick={onClose}
              className="text-xs text-emerald-200 hover:text-white px-2 py-1 rounded-md hover:bg-emerald-800/60 transition-colors cursor-pointer"
            >
              Done
            </button>
          )}
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto px-5 py-6 sm:py-7 space-y-6 text-center">
          {/* ======================================================== */}
          {/* 1. ANIMATION STAGE: PROCESSING / DRAWING / SUCCESS CIRCLE */}
          {/* ======================================================== */}
          <div className="flex flex-col items-center justify-center pt-2">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
              {/* Radiating soft halo wave after checkmark settles */}
              {stage === 'pulse' && (
                <div
                  className="absolute inset-0 rounded-full border-2 border-emerald-500/60 animate-pb-ripple pointer-events-none"
                  aria-hidden="true"
                />
              )}

              {/* Error Circle */}
              {stage === 'error' ? (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-rose-50 border-2 border-rose-400 flex items-center justify-center text-rose-600 shadow-sm animate-pb-error">
                  <AlertTriangle className="w-10 h-10 sm:w-11 sm:h-11" strokeWidth={2} />
                </div>
              ) : (
                /* Main Vector Canvas */
                <svg
                  className={`w-20 h-20 sm:w-24 sm:h-24 transition-transform duration-300 ${
                    stage === 'pulse' ? 'animate-pb-success-pop' : ''
                  }`}
                  viewBox="0 0 80 80"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Subtle Background Guide Track */}
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke="#E2E8F0"
                    strokeWidth="3.5"
                    className="opacity-40"
                  />

                  {/* Processing Circular Arc (Actively communicating with backend) */}
                  {stage === 'processing' && (
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      stroke="#059669"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      className="animate-pb-spin animate-pb-processing origin-center"
                    />
                  )}

                  {/* Settling into Green Success Circle Outline */}
                  {stage !== 'processing' && stage !== 'error' && (
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      stroke="#16A34A"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      className={`transition-all duration-300 ${
                        stage === 'settling' ? 'opacity-90' : 'opacity-100'
                      }`}
                      style={{
                        strokeDasharray: 214,
                        strokeDashoffset: stage === 'settling' ? 40 : 0,
                        transition: 'stroke-dashoffset 250ms ease-out, stroke 250ms ease',
                      }}
                    />
                  )}

                  {/* The Physical Checkmark Drawing Path */}
                  {isCheckVisible && (
                    <path
                      d="M26 42.5 L35.5 52 L55 30.5"
                      stroke="#16A34A"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="animate-pb-checkmark"
                    />
                  )}
                </svg>
              )}
            </div>

            {/* ======================================================== */}
            {/* 2. PROGRESS / SUCCESS / ERROR HEADINGS */}
            {/* ======================================================== */}
            {stage === 'processing' && (
              <div className="mt-4 space-y-1.5 animate-in fade-in duration-300">
                <h3 className="font-serif text-lg sm:text-xl font-bold text-emerald-950">
                  Sending your order to the bakery...
                </h3>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  Communicating with Punjabi Bistro kitchen in Dharamkot
                </p>
                <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-emerald-700/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span>Reserving fresh batch & recording items</span>
                </div>
              </div>
            )}

            {stage === 'error' && (
              <div className="mt-4 space-y-2 animate-in fade-in duration-300">
                <h3 className="font-serif text-lg sm:text-xl font-bold text-rose-950">
                  We couldn't receive your order
                </h3>
                <p className="text-xs text-stone-600 max-w-xs mx-auto leading-relaxed">
                  {error || 'The bakery system could not save your order at this moment. Please try again. Your cart items and details are safely preserved.'}
                </p>
                <div className="pt-3 flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    onClick={onRetry}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                  >
                    <span>Back to Cart</span>
                  </button>
                </div>
              </div>
            )}

            {isTextRevealed && !error && (
              <div className="mt-3.5 space-y-1 animate-pb-reveal">
                <h3 className="font-serif text-2xl sm:text-[26px] font-bold text-emerald-950">
                  Order Received!
                </h3>
                <p className="text-xs sm:text-sm text-emerald-800/90 max-w-xs mx-auto">
                  We've received your order and will start preparing it shortly.
                </p>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* 3. ORDER DETAILS & CONFIRMATION SLIP */}
          {/* ======================================================== */}
          {isDetailsRevealed && order && (
            <div className="space-y-4 animate-pb-reveal text-left">
              {/* Customer-Facing Order Number Banner */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Customer Order Number
                  </span>
                  <div className="font-mono text-lg sm:text-xl font-extrabold text-emerald-950 flex items-center gap-2">
                    <span>#{order.orderNumber}</span>
                  </div>
                </div>
                <button
                  onClick={handleCopyOrderNumber}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-200 text-xs font-medium text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
                  title="Copy Order Number"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Order Status & Preparation Meta */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-0.5">
                  <span className="text-[10px] text-stone-500 uppercase font-semibold block">
                    Preparation Time
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-stone-800">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="truncate">
                      {order.timeSlot === 'asap'
                        ? 'ASAP (~25-35 mins)'
                        : order.timeSlot}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-0.5">
                  <span className="text-[10px] text-stone-500 uppercase font-semibold block">
                    Fulfillment
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-stone-800">
                    {order.orderType === 'delivery' ? (
                      <>
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="truncate">Dharamkot Delivery</span>
                      </>
                    ) : order.orderType === 'dine_in' ? (
                      <>
                        <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="truncate">{order.tableNumber || 'Dine-In Table'}</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="truncate">Self-Pickup</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery Address if delivery */}
              {order.orderType === 'delivery' && order.deliveryAddress && (
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-xs space-y-1">
                  <span className="text-[10px] text-stone-500 uppercase font-semibold block">
                    Delivering To
                  </span>
                  <p className="text-stone-800 font-medium leading-relaxed">
                    {order.deliveryAddress}
                    {order.landmark && (
                      <span className="text-stone-500 text-[11px] block mt-0.5">
                        Landmark: {order.landmark}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Items Summary Accordion / Slip */}
              <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
                <div className="p-2.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between text-stone-700 font-medium">
                  <span>Order Items ({order.items.reduce((s, i) => s + i.quantity, 0)})</span>
                  <span className="font-bold text-stone-900">Total: ₹{order.total}</span>
                </div>
                <div className="p-3 space-y-2 max-h-36 overflow-y-auto divide-y divide-stone-100">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between">
                      <div className="flex-1 pr-2 truncate">
                        <span className="font-semibold text-stone-800">
                          {item.quantity}× {item.product.name}
                        </span>
                        {item.selectedOptions && item.selectedOptions.length > 0 && (
                          <span className="block text-[10px] text-stone-500 truncate">
                            {item.selectedOptions.map((o) => o.optionName).join(', ')}
                          </span>
                        )}
                      </div>
                      <span className="text-stone-700 font-mono font-medium">
                        ₹{item.totalPrice}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Reminder (COD / Counter UPI) - NOT online payment success */}
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/70 text-amber-900 text-xs flex items-center justify-between">
                <span>Payment due at delivery / pickup:</span>
                <span className="font-bold font-mono text-sm text-amber-950">₹{order.total}</span>
              </div>

              {/* ======================================================== */}
              {/* 4. ACTIONS FOR CUSTOMER */}
              {/* ======================================================== */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={onViewTracking}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Clock className="w-4 h-4 text-emerald-200" />
                  <span>Live Order Tracker</span>
                  <ChevronRight className="w-4 h-4 ml-auto opacity-70" />
                </button>

                {onViewMyOrders && (
                  <button
                    onClick={onViewMyOrders}
                    className="w-full bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 text-emerald-700" />
                    <span>View in My Orders</span>
                    <ChevronRight className="w-4 h-4 ml-auto opacity-70" />
                  </button>
                )}

                <button
                  onClick={onWhatsAppShare}
                  className="w-full bg-[#25D366] hover:bg-[#1EBE5D] text-white font-semibold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send Order Slip via WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-70" />
                </button>

                <button
                  onClick={onClose}
                  className="w-full text-stone-500 hover:text-stone-800 text-xs font-medium py-2 transition-colors cursor-pointer text-center"
                >
                  Continue Browsing Bistro Menu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
