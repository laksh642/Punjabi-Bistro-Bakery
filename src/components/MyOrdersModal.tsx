import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Clock,
  Package,
  Bike,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  ExternalLink,
  MapPin,
  Phone,
  Store,
  Utensils,
  Receipt,
  RefreshCw,
  Sparkles,
  Search,
} from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useStore } from '../context/StoreContext';
import { Order, OrderStatus } from '../types';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

const STATUS_BADGES: Record<
  OrderStatus,
  { label: string; color: string; bg: string; border: string; stepIndex: number }
> = {
  new: {
    label: 'Order Placed',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    stepIndex: 0,
  },
  confirmed: {
    label: 'Confirmed by Bakery',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    stepIndex: 1,
  },
  preparing: {
    label: 'Baking & Preparing',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    stepIndex: 2,
  },
  ready: {
    label: 'Ready for Dispatch',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    stepIndex: 3,
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    stepIndex: 3,
  },
  delivered: {
    label: 'Delivered',
    color: 'text-emerald-800',
    bg: 'bg-emerald-100',
    border: 'border-emerald-300',
    stepIndex: 4,
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-800',
    bg: 'bg-emerald-100',
    border: 'border-emerald-300',
    stepIndex: 4,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    stepIndex: -1,
  },
};

export const MyOrdersModal: React.FC = () => {
  const { isMyOrdersOpen, setIsMyOrdersOpen, user, openLoginModal } = useCustomerAuth();
  const { customerOrders, syncCustomerOrders, setIsIssueModalOpen } = useStore();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Load latest orders from Supabase whenever modal opens or user changes
  useEffect(() => {
    if (isMyOrdersOpen && user) {
      setIsRefreshing(true);
      syncCustomerOrders(user.id, user.email)
        .finally(() => setIsRefreshing(false));
    }
  }, [isMyOrdersOpen, user, syncCustomerOrders]);

  // Supabase Realtime channel for live customer order updates
  useEffect(() => {
    if (!isMyOrdersOpen || !user) return;

    const channel = supabase
      .channel(`customer-live-orders-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          // Re-sync customer orders on any cloud update
          syncCustomerOrders(user.id, user.email);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isMyOrdersOpen, user, syncCustomerOrders]);

  if (!isMyOrdersOpen) return null;

  // Filter orders matching user
  const userOrders = customerOrders.filter((o) => {
    if (!user) return true;
    if (o.userId === user.id) return true;
    if (user.email && o.customerEmail && o.customerEmail.toLowerCase() === user.email.toLowerCase())
      return true;
    return true; // Local device orders as well
  });

  const filteredOrders = userOrders.filter((o) => {
    if (statusFilter === 'active') {
      return ['new', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(o.status);
    }
    if (statusFilter === 'completed') {
      return ['delivered', 'completed', 'cancelled'].includes(o.status);
    }
    return true;
  });

  const handleRefresh = async () => {
    if (!user) return;
    setIsRefreshing(true);
    await syncCustomerOrders(user.id, user.email);
    setIsRefreshing(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-emerald-100 flex flex-col max-h-[92vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0B2E15] via-[#0F381B] to-[#082210] p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              {selectedOrder ? (
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 -ml-1 text-emerald-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  title="Back to Orders List"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-emerald-800/80 border border-emerald-600/40 flex items-center justify-center text-amber-300">
                  <Clock className="w-5 h-5" />
                </div>
              )}
              <div>
                <h2 className="text-base sm:text-lg font-serif font-bold text-white leading-tight">
                  {selectedOrder ? `Order #${selectedOrder.orderNumber}` : 'My Orders'}
                </h2>
                <p className="text-xs text-emerald-200/90">
                  {selectedOrder
                    ? new Date(selectedOrder.createdAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Punjabi Bistro Dharamkot • Live Order History'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!selectedOrder && user && (
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-2 text-emerald-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  title="Refresh orders from database"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setIsMyOrdersOpen(false);
                }}
                className="p-1.5 text-emerald-300/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-50/50">
            {!user ? (
              // Unauthenticated customer prompt
              <div className="text-center py-12 px-4 max-w-md mx-auto space-y-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
                  <Clock className="w-7 h-7" />
                </div>
                <h3 className="font-serif text-lg font-bold text-stone-800">
                  Sign in to view your orders
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Sign in with your Google account to track your orders, view order history, and re-order your Dharamkot favourites easily.
                </p>
                <button
                  onClick={() => {
                    setIsMyOrdersOpen(false);
                    openLoginModal();
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <span>Sign In with Google</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : selectedOrder ? (
              // Detailed Order View
              <div className="space-y-5">
                {/* Status Card & Progress */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                        Current Status
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            STATUS_BADGES[selectedOrder.status]?.bg || 'bg-stone-100'
                          } ${STATUS_BADGES[selectedOrder.status]?.color || 'text-stone-800'} ${
                            STATUS_BADGES[selectedOrder.status]?.border || 'border-stone-200'
                          }`}
                        >
                          {STATUS_BADGES[selectedOrder.status]?.label || selectedOrder.status}
                        </span>
                        {selectedOrder.delayMinutes && selectedOrder.delayMinutes > 0 ? (
                          <span className="text-xs text-amber-700 font-semibold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <AlertCircle className="w-3.5 h-3.5" />+{selectedOrder.delayMinutes} mins delay
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <Link
                      to={`/orders/${selectedOrder.trackingToken || selectedOrder.orderNumber}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                    >
                      <span>Dedicated Live Tracking</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {/* Delay notice if present */}
                  {selectedOrder.delayMessage && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                      <p className="font-bold">Kitchen Notice:</p>
                      <p>{selectedOrder.delayMessage}</p>
                    </div>
                  )}

                  {/* Tracking Timeline Progress Steps */}
                  <div className="pt-2">
                    <div className="grid grid-cols-4 gap-1 text-center">
                      {[
                        { title: 'Placed', step: 0 },
                        { title: 'Confirmed', step: 1 },
                        { title: 'Preparing', step: 2 },
                        {
                          title: selectedOrder.orderType === 'delivery' ? 'Out for Delivery' : 'Ready',
                          step: 3,
                        },
                      ].map((st, i) => {
                        const currentStep = STATUS_BADGES[selectedOrder.status]?.stepIndex ?? 0;
                        const isDone = currentStep >= st.step;
                        const isCurrent = currentStep === st.step;

                        return (
                          <div key={i} className="flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-all ${
                                isDone
                                  ? 'bg-emerald-700 text-white shadow-2xs'
                                  : 'bg-stone-100 text-stone-400 border border-stone-200'
                              } ${isCurrent ? 'ring-2 ring-emerald-400 ring-offset-2' : ''}`}
                            >
                              {isDone ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                            </div>
                            <span
                              className={`text-[10px] font-semibold leading-tight ${
                                isDone ? 'text-emerald-950' : 'text-stone-400'
                              }`}
                            >
                              {st.title}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Ordered Items List */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Ordered Bakery & Bistro Items ({selectedOrder.items.length})
                  </h4>

                  <div className="divide-y divide-stone-100">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0 border border-emerald-200/60">
                            {item.quantity}×
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-stone-900 truncate">
                              {item.product?.name || 'Item'}
                            </p>
                            {item.selectedOptions && item.selectedOptions.length > 0 && (
                              <p className="text-[11px] text-stone-500 truncate">
                                {item.selectedOptions.map((o) => o.optionName).join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-stone-800 shrink-0">
                          ₹{item.totalPrice}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Financial Bill Breakdown */}
                  <div className="pt-3 border-t border-stone-200 space-y-1.5 text-xs text-stone-600">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-semibold text-stone-800">₹{selectedOrder.subtotal}</span>
                    </div>
                    {selectedOrder.deliveryFee > 0 && (
                      <div className="flex justify-between">
                        <span>Delivery Fee</span>
                        <span className="font-semibold text-stone-800">₹{selectedOrder.deliveryFee}</span>
                      </div>
                    )}
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Discount ({selectedOrder.couponCode || 'Coupon'})</span>
                        <span className="font-semibold">-₹{selectedOrder.discount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-emerald-950 pt-2 border-t border-dashed border-stone-200">
                      <span>Total Paid / Payable</span>
                      <span className="text-base text-emerald-800">₹{selectedOrder.total}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery / Fulfillment Details */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Fulfillment Information
                  </h4>

                  <div className="grid sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-stone-400">Order Mode:</span>
                      <p className="font-semibold text-stone-800 capitalize flex items-center gap-1 mt-0.5">
                        {selectedOrder.orderType === 'delivery' && <Bike className="w-3.5 h-3.5 text-emerald-600" />}
                        {selectedOrder.orderType === 'takeaway' && <Store className="w-3.5 h-3.5 text-emerald-600" />}
                        {selectedOrder.orderType === 'dine_in' && <Utensils className="w-3.5 h-3.5 text-emerald-600" />}
                        {selectedOrder.orderType.replace('_', ' ')}
                      </p>
                    </div>

                    <div>
                      <span className="text-stone-400">Payment:</span>
                      <p className="font-semibold text-stone-800 capitalize mt-0.5">
                        {selectedOrder.paymentMethod.toUpperCase()} ({selectedOrder.paymentStatus})
                      </p>
                    </div>

                    {selectedOrder.deliveryAddress && (
                      <div className="sm:col-span-2">
                        <span className="text-stone-400">Delivery Address:</span>
                        <p className="font-semibold text-stone-800 mt-0.5">
                          {selectedOrder.deliveryAddress}
                          {selectedOrder.landmark ? ` (Near ${selectedOrder.landmark})` : ''}
                        </p>
                      </div>
                    )}

                    <div>
                      <span className="text-stone-400">Contact Phone:</span>
                      <p className="font-semibold text-stone-800 mt-0.5">{selectedOrder.customerPhone}</p>
                    </div>

                    {selectedOrder.orderNotes && (
                      <div className="sm:col-span-2">
                        <span className="text-stone-400">Special Instructions:</span>
                        <p className="font-medium text-stone-700 italic mt-0.5">
                          "{selectedOrder.orderNotes}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Need Help / Issue Button */}
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="text-xs text-emerald-900">
                    <p className="font-bold">Need assistance with this order?</p>
                    <p className="text-emerald-700">Report an issue or call bakery kitchen directly.</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsMyOrdersOpen(false);
                      setIsIssueModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    Report Issue
                  </button>
                </div>
              </div>
            ) : (
              // Orders List View
              <div className="space-y-4">
                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-stone-200/60 rounded-xl max-w-fit">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      statusFilter === 'all'
                        ? 'bg-white text-emerald-950 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    All ({userOrders.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('active')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      statusFilter === 'active'
                        ? 'bg-white text-emerald-950 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Active (
                    {
                      userOrders.filter((o) =>
                        ['new', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(
                          o.status
                        )
                      ).length
                    }
                    )
                  </button>
                  <button
                    onClick={() => setStatusFilter('completed')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      statusFilter === 'completed'
                        ? 'bg-white text-emerald-950 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Completed
                  </button>
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="text-center py-12 px-4 space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 text-stone-400 flex items-center justify-center">
                      <Package className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-stone-700">No orders found</p>
                    <p className="text-xs text-stone-500 max-w-xs mx-auto">
                      {statusFilter === 'active'
                        ? 'You have no active bakery orders in Dharamkot right now.'
                        : 'Your placed orders will be stored safely here.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredOrders.map((order) => {
                      const badge = STATUS_BADGES[order.status] || STATUS_BADGES.new;
                      const itemCount = order.items.reduce((acc, i) => acc + i.quantity, 0);

                      return (
                        <div
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className="bg-white rounded-xl p-4 border border-stone-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group space-y-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                #{order.orderNumber}
                              </span>
                              <span className="text-[11px] text-stone-400">
                                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg} ${badge.color} ${badge.border}`}
                            >
                              {badge.label}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1">
                            <div className="min-w-0 pr-3">
                              <p className="text-stone-700 truncate font-medium">
                                {order.items
                                  .map((i) => `${i.product?.name || 'Item'} (${i.quantity})`)
                                  .join(', ')}
                              </p>
                              <span className="text-[11px] text-stone-400 capitalize">
                                {order.orderType.replace('_', ' ')} • {itemCount} {itemCount === 1 ? 'item' : 'items'}
                              </span>
                            </div>

                            <div className="text-right shrink-0 flex items-center gap-2">
                              <div>
                                <span className="font-bold text-sm text-emerald-900">
                                  ₹{order.total}
                                </span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-700 transition-colors" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
