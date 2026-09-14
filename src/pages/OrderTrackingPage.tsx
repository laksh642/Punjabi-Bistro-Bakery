import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  ChevronRight,
  Store,
  FileText
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Order } from '../types';

export const OrderTrackingPage: React.FC = () => {
  const { orders, businessSettings } = useStore();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Initialize search from query param if available
  useEffect(() => {
    const orderIdParam = searchParams.get('id');
    if (orderIdParam) {
      setSearchQuery(orderIdParam);
      const found = orders.find((o) => o.id.toLowerCase() === orderIdParam.toLowerCase());
      if (found) setSelectedOrder(found);
    } else if (orders.length > 0) {
      // Default to the most recent order
      setSelectedOrder(orders[0]);
    }
  }, [searchParams, orders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    const matched = orders.find(
      (o) =>
        o.id.toLowerCase().includes(query) ||
        o.customerPhone.replace(/\D/g, '').includes(query)
    );

    if (matched) {
      setSelectedOrder(matched);
    } else {
      setSelectedOrder(null);
    }
  };

  const getStatusStep = (status: Order['status']) => {
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
                  Live Order Status & Kitchen Tracker
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
                `Hello Punjabi Bistro, I am tracking my order ${selectedOrder ? `#${selectedOrder.id}` : ''}`
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
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-emerald-950 mb-1">
            Track Your Order
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mb-4">
            Enter your Order ID (e.g. PB-1001) or 10-digit mobile number to see real-time preparation and delivery updates.
          </p>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Order ID or Phone Number..."
                className="w-full pl-10 pr-4 py-2.5 bg-emerald-50/40 border border-emerald-200 rounded-xl text-sm text-emerald-950 placeholder-stone-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
              />
            </div>
            <button
              type="submit"
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-colors shadow-2xs cursor-pointer"
            >
              Track
            </button>
          </form>
        </div>

        {/* Selected Order Details */}
        {selectedOrder ? (
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-3xl border border-emerald-100 p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-emerald-100">
                <div>
                  <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-900 text-xs font-bold px-3 py-1 rounded-full mb-2 uppercase tracking-wide">
                    <span>Order #{selectedOrder.id}</span>
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-emerald-950">
                    {selectedOrder.fulfillmentType === 'delivery' ? 'Home Delivery Order' : 'Store Pickup / Takeaway'}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Placed on {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <div className="sm:text-right">
                  <div className="text-xs text-stone-500 uppercase font-semibold">Total Amount</div>
                  <div className="text-2xl font-extrabold text-emerald-900">
                    ₹{selectedOrder.totalAmount}
                  </div>
                  <div className="text-xs text-emerald-700 font-semibold uppercase">
                    {selectedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online / UPI Paid'}
                  </div>
                </div>
              </div>

              {/* Delay Alert if any */}
              {selectedOrder.delayMinutes && selectedOrder.delayMinutes > 0 && (
                <div className="my-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0" />
                  <div>
                    <span className="font-bold">Kitchen Rush Update: </span>
                    We are taking approximately <strong>{selectedOrder.delayMinutes} extra minutes</strong> to bake and pack your order to perfection. Thank you for your patience!
                  </div>
                </div>
              )}

              {/* Progress Stepper */}
              <div className="py-6">
                <div className="relative">
                  {/* Background progress bar */}
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-emerald-100 -translate-y-1/2 z-0 hidden sm:block" />
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
                    
                    {/* Step 1: Received */}
                    <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white border border-emerald-100 sm:border-transparent">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 ${
                        getStatusStep(selectedOrder.status) >= 1
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-stone-200 text-stone-600'
                      }`}>
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-xs text-emerald-950">Received</span>
                      <span className="text-[11px] text-stone-500">Order confirmed</span>
                    </div>

                    {/* Step 2: Preparing */}
                    <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white border border-emerald-100 sm:border-transparent">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 ${
                        getStatusStep(selectedOrder.status) >= 3
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : getStatusStep(selectedOrder.status) === 2
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-200 text-stone-600'
                      }`}>
                        <Package className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-xs text-emerald-950">In Kitchen</span>
                      <span className="text-[11px] text-stone-500">Freshly baking</span>
                    </div>

                    {/* Step 3: Out for Delivery */}
                    <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white border border-emerald-100 sm:border-transparent">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 ${
                        getStatusStep(selectedOrder.status) >= 4
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-stone-200 text-stone-600'
                      }`}>
                        <Bike className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-xs text-emerald-950">On the Way</span>
                      <span className="text-[11px] text-stone-500">Out with rider</span>
                    </div>

                    {/* Step 4: Delivered */}
                    <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white border border-emerald-100 sm:border-transparent">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 ${
                        getStatusStep(selectedOrder.status) >= 5
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-stone-200 text-stone-600'
                      }`}>
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-xs text-emerald-950">Delivered</span>
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
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-800">{item.quantity}x</span>
                        <span className="font-medium text-emerald-950">{item.name}</span>
                        {item.selectedOptions && Object.values(item.selectedOptions).length > 0 && (
                          <span className="text-[11px] text-stone-500">
                            ({Object.values(item.selectedOptions).join(', ')})
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-emerald-950">
                        ₹{item.price * item.quantity}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal & Delivery details */}
                <div className="mt-4 pt-4 border-t border-emerald-100 flex flex-col gap-1.5 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span>Delivery Address</span>
                    <span className="font-semibold text-emerald-950 text-right max-w-xs">
                      {selectedOrder.deliveryAddress || 'Dine-in / Bistro Pickup'}
                    </span>
                  </div>
                  {selectedOrder.deliveryZoneName && (
                    <div className="flex justify-between">
                      <span>Delivery Zone</span>
                      <span className="font-semibold text-emerald-950">
                        {selectedOrder.deliveryZoneName}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Contact Name & Phone</span>
                    <span className="font-semibold text-emerald-950">
                      {selectedOrder.customerName} ({selectedOrder.customerPhone})
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
          <div className="bg-white rounded-3xl border border-emerald-100 p-8 text-center shadow-xs">
            <FileText className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-emerald-950 mb-1">
              No Order Found
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto mb-4">
              We couldn't find an order matching "{searchQuery}". Please check your Order ID or mobile number.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              <Store className="w-4 h-4" />
              <span>Back to Storefront Menu</span>
            </Link>
          </div>
        )}

      </main>
    </div>
  );
};
