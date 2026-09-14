import React, { useState } from 'react';
import {
  X,
  Clock,
  Search,
  CheckCircle2,
  AlertTriangle,
  Phone,
  MessageCircle,
  AlertCircle,
  Printer,
  Star,
  MapPin,
  Truck,
  ChefHat,
  PackageCheck,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { OrderStatus } from '../types';

const STATUS_STEPS: { status: OrderStatus; label: string; icon: any }[] = [
  { status: 'new', label: 'Order Received', icon: Clock },
  { status: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { status: 'preparing', label: 'In Kitchen', icon: ChefHat },
  { status: 'ready', label: 'Ready', icon: PackageCheck },
  { status: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

export const OrderTrackingModal: React.FC = () => {
  const {
    isTrackingOpen,
    setIsTrackingOpen,
    trackingOrderNumber,
    setTrackingOrderNumber,
    findOrder,
    businessSettings,
    setIsIssueModalOpen,
    submitFeedback,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState(trackingOrderNumber || 'PB-4081');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  if (!isTrackingOpen) return null;

  const currentOrder = findOrder(searchQuery);

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

  const handlePrint = () => {
    window.print();
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
        <div className="p-5 bg-emerald-50/50 border-b border-emerald-100">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Order # (e.g. PB-4081) or Phone..."
                className="w-full pl-10 pr-3 py-2.5 bg-white border border-emerald-200 rounded-xl text-xs sm:text-sm text-emerald-950 focus:outline-none focus:border-emerald-600"
              />
            </div>
            <button
              onClick={() => setTrackingOrderNumber(searchQuery)}
              className="bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-emerald-800 transition-colors cursor-pointer"
            >
              Track
            </button>
          </div>
          <p className="text-[11px] text-emerald-800/80 mt-1.5">
            Tip: You can search sample live order <strong>PB-4081</strong> or <strong>PB-4082</strong>
          </p>
        </div>

        {/* Tracking Details */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto bg-white">
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

              {/* PROACTIVE DELAY BANNER (Addressing Customer Review Friction Point) */}
              {currentOrder.delayMinutes && currentOrder.delayMinutes > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs space-y-1 animate-pulse">
                  <div className="font-bold flex items-center gap-1.5 text-sm text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Kitchen Delay Update (+{currentOrder.delayMinutes} Mins)</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    {currentOrder.delayMessage ||
                      `We sincerely apologize — our bakers are baking fresh batches to ensure top quality. Your order is expected to take an extra ${currentOrder.delayMinutes} minutes.`}
                  </p>
                  <p className="text-[11px] font-semibold text-amber-900 pt-1">
                    Need urgent assistance? Call master counter directly at 098562 04951.
                  </p>
                </div>
              )}

              {/* Order Status Stepper */}
              <div>
                <h3 className="font-serif text-sm font-bold text-emerald-950 uppercase tracking-wider mb-4">
                  Order Status
                </h3>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-200">
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

              {/* Order Items Summary */}
              <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between font-bold text-xs uppercase tracking-wider text-emerald-900">
                  <span>Items Ordered</span>
                  <span>Total: ₹{currentOrder.total}</span>
                </div>

                <div className="space-y-2 divide-y divide-emerald-100 text-xs text-emerald-900">
                  {currentOrder.items.map((item, i) => (
                    <div key={i} className="pt-2 first:pt-0 flex justify-between">
                      <div>
                        <span className="font-semibold text-emerald-950">
                          {item.quantity}x {item.product.name}
                        </span>
                        {item.selectedOptions.length > 0 && (
                          <span className="text-[11px] text-emerald-700/80 block">
                            {item.selectedOptions.map((o) => o.optionName).join(', ')}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-emerald-800">₹{item.totalPrice}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-emerald-200 text-xs flex justify-between text-emerald-800">
                  <span>Type & Address</span>
                  <span className="font-medium text-right max-w-xs">
                    {currentOrder.orderType.toUpperCase()}
                    {currentOrder.deliveryAddress ? ` • ${currentOrder.deliveryAddress}` : ''}
                  </span>
                </div>
              </div>

              {/* Direct Actions Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <a
                  href={`tel:${businessSettings.phone.replace(/\s+/g, '')}`}
                  className="p-2.5 rounded-xl border border-emerald-200 hover:bg-emerald-50 text-xs font-semibold text-emerald-950 flex flex-col items-center justify-center gap-1 text-center transition-colors"
                >
                  <Phone className="w-4 h-4 text-emerald-700" />
                  <span>Call Bistro</span>
                </a>

                <a
                  href={`https://wa.me/${businessSettings.whatsapp}?text=Hello%20Punjabi%20Bistro%2C%20inquiring%20about%20Order%20%23${currentOrder.orderNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl border border-emerald-300 hover:bg-emerald-50 text-xs font-semibold text-emerald-800 flex flex-col items-center justify-center gap-1 text-center transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>

                <button
                  onClick={() => setIsIssueModalOpen(true)}
                  className="p-2.5 rounded-xl border border-amber-300 hover:bg-amber-50 text-xs font-semibold text-amber-900 flex flex-col items-center justify-center gap-1 text-center cursor-pointer transition-colors"
                >
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Report Issue</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="p-2.5 rounded-xl border border-emerald-200 hover:bg-emerald-50 text-xs font-semibold text-emerald-950 flex flex-col items-center justify-center gap-1 text-center cursor-pointer transition-colors"
                >
                  <Printer className="w-4 h-4 text-emerald-700" />
                  <span>Print Slip</span>
                </button>
              </div>

              {/* Post-Order Feedback Section */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-emerald-900">
                  How was your experience with this order?
                </h4>

                {feedbackSubmitted ? (
                  <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Thank you for your feedback! It helps us continuously improve.</span>
                  </div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-2.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setFeedbackRating(star)}
                          className="p-1 text-amber-500 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              feedbackRating >= star
                                ? 'fill-amber-500 text-amber-500'
                                : 'text-stone-300'
                            }`}
                          >
                          </Star>
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
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto text-xl border border-emerald-200">
                🔎
              </div>
              <h3 className="font-serif text-base font-bold text-emerald-950">
                No order found with "{searchQuery}"
              </h3>
              <p className="text-xs text-emerald-800/80 max-w-xs mx-auto">
                Please check the order number or contact our bakery directly at 098562 04951.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
