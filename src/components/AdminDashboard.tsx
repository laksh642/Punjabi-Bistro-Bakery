import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Phone,
  MessageCircle,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  Package,
  Layers,
  Cake,
  Sliders,
  AlertCircle,
  TrendingUp,
  MapPin,
  RefreshCw,
  ShoppingBag,
  Power,
  X,
  Send,
  Database,
  Cloud,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Shield,
  Tag,
  KeyRound,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Order, OrderStatus, Product, CustomCakeEnquiry, DeliveryZone } from '../types';
import { PunjabiBistroLogo } from './PunjabiBistroLogo';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ProductImageManager } from './ProductImageManager';
import { AdminCouponManager } from './AdminCouponManager';

export const AdminDashboard: React.FC = () => {
  const {
    orders,
    loadAdminOrders,
    updateOrderStatus,
    delayOrder,
    products,
    updateProduct,
    toggleProductAvailability,
    addProduct,
    deleteProduct,
    categories,
    cakeEnquiries,
    updateCakeEnquiry,
    deliveryZones,
    updateDeliveryZone,
    businessSettings,
    updateBusinessSettings,
    issues,
    resolveIssue,
    feedbacks,
    setIsAdminView,
    supabaseStatus,
    isCloudSyncing,
    syncWithCloud,
  } = useStore();

  // Load cloud orders on Admin Dashboard mount and listen to changes
  useEffect(() => {
    loadAdminOrders();

    if (isSupabaseConfigured) {
      const channel = supabase
        .channel('pb-admin-live-orders')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          () => {
            loadAdminOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const [activeTab, setActiveTab] = useState<
    'orders' | 'menu' | 'cakes' | 'coupons' | 'zones' | 'issues' | 'settings' | 'analytics'
  >('orders');

  // Delay Order Modal State
  const [delayModalOrder, setDelayModalOrder] = useState<Order | null>(null);
  const [delayMinutes, setDelayMinutes] = useState(15);
  const [delayReason, setDelayReason] = useState(
    'Baking fresh batch to ensure supreme freshness and hot delivery.'
  );

  // Print KOT Modal State
  const [printOrder, setPrintOrder] = useState<Order | null>(null);

  // New Product Modal State
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState(199);
  const [newProdCat, setNewProdCat] = useState(categories[0]?.id || 'cakes');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdImage, setNewProdImage] = useState(
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80'
  );
  const [newProdEggless, setNewProdEggless] = useState(true);
  const [newProdBestseller, setNewProdBestseller] = useState(false);

  // Edit Existing Product & Image Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdPrice, setEditProdPrice] = useState(0);
  const [editProdCat, setEditProdCat] = useState('');
  const [editProdDesc, setEditProdDesc] = useState('');
  const [editProdImage, setEditProdImage] = useState('');
  const [editProdEggless, setEditProdEggless] = useState(true);
  const [editProdBestseller, setEditProdBestseller] = useState(false);
  const [editProdAvailable, setEditProdAvailable] = useState(true);

  const startEditProduct = (p: Product) => {
    setEditingProduct(p);
    setEditProdName(p.name);
    setEditProdPrice(p.price);
    setEditProdCat(p.categoryId);
    setEditProdDesc(p.description || '');
    setEditProdImage(p.image);
    setEditProdEggless(p.isEggless ?? true);
    setEditProdBestseller(p.isBestseller ?? false);
    setEditProdAvailable(p.isAvailable);
  };

  const handleUpdateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editProdName.trim()) return;

    const catObj = categories.find((c) => c.id === editProdCat);
    const updated: Product = {
      ...editingProduct,
      name: editProdName.trim(),
      description: editProdDesc.trim(),
      price: Number(editProdPrice),
      categoryId: editProdCat,
      categoryName: catObj ? catObj.name : editingProduct.categoryName,
      image: editProdImage.trim() || editingProduct.image,
      isAvailable: editProdAvailable,
      isEggless: editProdEggless,
      isBestseller: editProdBestseller,
    };

    updateProduct(updated);
    setEditingProduct(null);
  };

  // Cake Quotation State
  const [quoteEnquiry, setQuoteEnquiry] = useState<CustomCakeEnquiry | null>(null);
  const [quoteAmount, setQuoteAmount] = useState<number>(1200);
  const [quoteNotes, setQuoteNotes] = useState('');

  // Analytics Calculations
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const activeOrders = orders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'completed' && o.status !== 'cancelled'
  );
  const completedOrders = orders.filter(
    (o) => o.status === 'delivered' || o.status === 'completed'
  );

  const handleApplyDelay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!delayModalOrder) return;
    delayOrder(delayModalOrder.id, delayMinutes, delayReason);
    setDelayModalOrder(null);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const catObj = categories.find((c) => c.id === newProdCat);

    addProduct({
      name: newProdName.trim(),
      description: newProdDesc.trim() || 'Delicious freshly prepared bistro treat.',
      price: Number(newProdPrice),
      categoryId: newProdCat,
      categoryName: catObj ? catObj.name : 'Bakery',
      image: newProdImage.trim(),
      isAvailable: true,
      isVegetarian: true,
      isEggless: newProdEggless,
      isBestseller: newProdBestseller,
      prepTimeMinutes: 20,
    });

    setShowAddProductModal(false);
    setNewProdName('');
    setNewProdDesc('');
  };

  const handleSaveQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteEnquiry) return;
    updateCakeEnquiry(quoteEnquiry.id, 'quotation_sent', Number(quoteAmount), quoteNotes);
    setQuoteEnquiry(null);
  };

  // Credentials Update State
  const [credCurrentPassword, setCredCurrentPassword] = useState('');
  const [credNewUsername, setCredNewUsername] = useState('');
  const [credNewPassword, setCredNewPassword] = useState('');
  const [credNewSecurityKey, setCredNewSecurityKey] = useState('');
  const [credLoading, setCredLoading] = useState(false);
  const [credStatusMsg, setCredStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credCurrentPassword) {
      setCredStatusMsg({ type: 'error', text: 'Please enter your current password to authorize changes.' });
      return;
    }
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('pb_admin_session_token') : null;
    if (!token) {
      setCredStatusMsg({ type: 'error', text: 'Admin session missing. Please re-login.' });
      return;
    }

    setCredLoading(true);
    setCredStatusMsg(null);
    try {
      const res = await fetch('/api/admin/credentials/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: credCurrentPassword,
          newUsername: credNewUsername.trim() || undefined,
          newPassword: credNewPassword || undefined,
          newSecurityKey: credNewSecurityKey || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCredStatusMsg({ type: 'error', text: data.error || 'Failed to update credentials.' });
      } else {
        setCredStatusMsg({ type: 'success', text: 'Credentials updated successfully!' });
        setCredCurrentPassword('');
        setCredNewUsername('');
        setCredNewPassword('');
        setCredNewSecurityKey('');
        if (data.username) {
          localStorage.setItem('pb_admin_username', data.username);
        }
      }
    } catch {
      setCredStatusMsg({ type: 'error', text: 'Network error communicating with server.' });
    } finally {
      setCredLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Top Operations Header Bar */}
      <header className="bg-emerald-950 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <PunjabiBistroLogo className="w-10 h-10" />
              <div>
                <h1 className="font-serif font-bold text-base sm:text-lg leading-tight text-white">
                  Punjabi Bistro Operations Portal
                </h1>
                <p className="text-[11px] text-emerald-300">
                  Near Udham Singh Chowk, Dharamkot • Live Kitchen Board
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Live Kitchen Sync Status Pill */}
              <div
                className="flex items-center gap-1.5 bg-emerald-900/80 border border-emerald-800 px-2.5 sm:px-3 py-1.5 rounded-full text-xs"
                title="Live kitchen synchronization"
              >
                <Cloud className="w-3.5 h-3.5 text-emerald-300" />
                <span className="text-emerald-100 font-medium text-[11px] hidden md:inline">
                  Live Sync
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    supabaseStatus?.connected
                      ? 'bg-emerald-400 shadow-xs shadow-emerald-400/50'
                      : 'bg-amber-400 animate-pulse'
                  }`}
                />
              </div>

              {/* Quick Sync Button */}
              <button
                onClick={() => syncWithCloud()}
                disabled={isCloudSyncing}
                title="Refresh live orders"
                className="flex items-center gap-1 bg-emerald-900/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-200 hover:text-white px-2.5 py-1.5 rounded-xl text-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-300 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline text-[11px]">{isCloudSyncing ? 'Syncing...' : 'Sync'}</span>
              </button>

              {/* Manual Open / Close quick toggle */}
              <button
                onClick={() =>
                  updateBusinessSettings({
                    ...businessSettings,
                    isOpenManual: !businessSettings.isOpenManual,
                  })
                }
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  businessSettings.isOpenManual
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-rose-700 hover:bg-rose-600 text-white'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{businessSettings.isOpenManual ? 'Store: OPEN' : 'Store: CLOSED'}</span>
              </button>

              {/* Exit to customer view */}
              <button
                onClick={() => setIsAdminView(false)}
                className="bg-white hover:bg-emerald-50 text-emerald-950 text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                ← Back to Storefront
              </button>
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none text-xs font-medium">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'orders'
                  ? 'bg-emerald-700 text-white font-bold'
                  : 'text-emerald-200 hover:bg-emerald-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Orders ({activeOrders.length} active)</span>
            </button>

            <button
              onClick={() => setActiveTab('menu')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'menu'
                  ? 'bg-emerald-700 text-white font-bold'
                  : 'text-emerald-200 hover:bg-emerald-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Menu & Stock ({products.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('cakes')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'cakes'
                  ? 'bg-emerald-700 text-white font-bold'
                  : 'text-emerald-200 hover:bg-emerald-900'
              }`}
            >
              <Cake className="w-3.5 h-3.5" />
              <span>Cake Requests ({cakeEnquiries.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('coupons')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'coupons'
                  ? 'bg-emerald-700 text-white font-bold'
                  : 'text-emerald-200 hover:bg-emerald-900'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Coupons & Offers</span>
            </button>

            <button
              onClick={() => setActiveTab('zones')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'zones'
                  ? 'bg-emerald-700 text-white font-bold'
                  : 'text-emerald-200 hover:bg-emerald-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Delivery Zones</span>
            </button>

            <button
              onClick={() => setActiveTab('issues')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'issues'
                  ? 'bg-emerald-700 text-white font-bold'
                  : 'text-emerald-200 hover:bg-emerald-900'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Issue Center ({issues.filter((i) => i.status === 'open').length})</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-emerald-700 text-white font-bold'
                  : 'text-emerald-200 hover:bg-emerald-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Overview & Sales</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'settings'
                  ? 'bg-emerald-700 text-white font-bold'
                  : 'text-emerald-200 hover:bg-emerald-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Store Settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* TAB 1: KANBAN LIVE ORDERS BOARD */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-bold text-emerald-950">
                  Live Kitchen Order Board
                </h2>
                <p className="text-xs text-stone-600">
                  Manage incoming orders in real time. Update status or alert customers about kitchen preparation delays.
                </p>
              </div>

              <div className="text-xs font-semibold text-stone-700 bg-white px-3 py-1.5 rounded-xl border border-emerald-100 shadow-2xs">
                Total Orders Logged: <strong>{orders.length}</strong>
              </div>
            </div>

            {/* Kanban Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Column 1: New / Confirmed */}
              <div className="bg-white rounded-2xl border border-emerald-100 p-4 flex flex-col shadow-2xs">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-100">
                  <span className="font-bold text-xs uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    New & Confirmed
                  </span>
                  <span className="bg-emerald-100 text-emerald-850 text-xs font-bold px-2 py-0.5 rounded-full">
                    {orders.filter((o) => o.status === 'new' || o.status === 'confirmed').length}
                  </span>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[70vh]">
                  {orders
                    .filter((o) => o.status === 'new' || o.status === 'confirmed')
                    .map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onUpdateStatus={(s) => updateOrderStatus(order.id, s)}
                        onDelay={() => setDelayModalOrder(order)}
                        onPrint={() => setPrintOrder(order)}
                        businessSettings={businessSettings}
                      />
                    ))}
                </div>
              </div>

              {/* Column 2: In Kitchen Preparing */}
              <div className="bg-white rounded-2xl border border-emerald-100 p-4 flex flex-col shadow-2xs">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-100">
                  <span className="font-bold text-xs uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    Preparing in Kitchen
                  </span>
                  <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full">
                    {orders.filter((o) => o.status === 'preparing').length}
                  </span>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[70vh]">
                  {orders
                    .filter((o) => o.status === 'preparing')
                    .map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onUpdateStatus={(s) => updateOrderStatus(order.id, s)}
                        onDelay={() => setDelayModalOrder(order)}
                        onPrint={() => setPrintOrder(order)}
                        businessSettings={businessSettings}
                      />
                    ))}
                </div>
              </div>

              {/* Column 3: Ready / Out for Delivery */}
              <div className="bg-white rounded-2xl border border-emerald-100 p-4 flex flex-col shadow-2xs">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-100">
                  <span className="font-bold text-xs uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Ready & Out
                  </span>
                  <span className="bg-blue-100 text-blue-900 text-xs font-bold px-2 py-0.5 rounded-full">
                    {
                      orders.filter(
                        (o) => o.status === 'ready' || o.status === 'out_for_delivery'
                      ).length
                    }
                  </span>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[70vh]">
                  {orders
                    .filter((o) => o.status === 'ready' || o.status === 'out_for_delivery')
                    .map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onUpdateStatus={(s) => updateOrderStatus(order.id, s)}
                        onDelay={() => setDelayModalOrder(order)}
                        onPrint={() => setPrintOrder(order)}
                        businessSettings={businessSettings}
                      />
                    ))}
                </div>
              </div>

              {/* Column 4: Delivered / Completed */}
              <div className="bg-white rounded-2xl border border-emerald-100 p-4 flex flex-col shadow-2xs">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-100">
                  <span className="font-bold text-xs uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Completed
                  </span>
                  <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-2 py-0.5 rounded-full">
                    {completedOrders.length}
                  </span>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[70vh]">
                  {completedOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onUpdateStatus={(s) => updateOrderStatus(order.id, s)}
                      onDelay={() => setDelayModalOrder(order)}
                      onPrint={() => setPrintOrder(order)}
                      businessSettings={businessSettings}
                    />
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: MENU & STOCK INVENTORY MANAGER */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-emerald-950">
                  Menu Pricing & Live Stock Management
                </h2>
                <p className="text-xs text-stone-600">
                  Toggle sold-out items instantly so customers cannot order unavailable dishes. Edit prices and badges.
                </p>
              </div>

              <button
                onClick={() => setShowAddProductModal(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Item</span>
              </button>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-3xl border border-emerald-100 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-emerald-50/70 text-emerald-950 uppercase font-bold border-b border-emerald-100">
                    <tr>
                      <th className="p-3.5">Product</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Price (₹)</th>
                      <th className="p-3.5">Dietary</th>
                      <th className="p-3.5">Availability</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="p-3.5 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => startEditProduct(p)}
                            className="relative group rounded-lg overflow-hidden shrink-0 border border-emerald-100 cursor-pointer"
                            title="Click to edit item and image"
                          >
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-11 h-11 object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                              <Edit2 className="w-3.5 h-3.5" />
                            </div>
                          </button>
                          <div>
                            <button
                              type="button"
                              onClick={() => startEditProduct(p)}
                              className="font-bold text-emerald-950 text-sm hover:text-emerald-700 text-left transition-colors cursor-pointer"
                            >
                              {p.name}
                            </button>
                            {p.isBestseller && (
                              <div>
                                <span className="text-[10px] text-emerald-800 font-bold uppercase">
                                  ★ Bestseller
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 font-medium">{p.categoryName}</td>
                        <td className="p-3.5">
                          <input
                            type="number"
                            value={p.price}
                            onChange={(e) =>
                              updateProduct({ ...p, price: Number(e.target.value) })
                            }
                            className="w-20 px-2 py-1 border border-emerald-200 rounded-lg bg-emerald-50/40 font-bold text-sm text-emerald-950 focus:outline-none focus:border-emerald-600"
                          />
                        </td>
                        <td className="p-3.5">
                          <div className="flex gap-1 flex-wrap">
                            {p.isEggless && (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-medium">
                                Eggless
                              </span>
                            )}
                            {p.isVegetarian && (
                              <span className="bg-stone-100 text-stone-700 text-[10px] px-1.5 py-0.5 rounded">
                                Veg
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={() => toggleProductAvailability(p.id)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              p.isAvailable
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                          >
                            {p.isAvailable ? 'In Stock ✓' : 'Sold Out ✕'}
                          </button>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => startEditProduct(p)}
                              className="text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer border border-emerald-200/60"
                              title="Edit item details & change image"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete "${p.name}"?`)) {
                                  deleteProduct(p.id);
                                }
                              }}
                              className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOM CAKE REQUESTS PIPELINE */}
        {activeTab === 'cakes' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-emerald-950">
                Custom Celebration Cake Enquiries
              </h2>
              <p className="text-xs text-stone-600">
                Review customer design submissions, send transparent quotations, and communicate via WhatsApp.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cakeEnquiries.map((enq) => (
                <div
                  key={enq.id}
                  className="bg-white rounded-3xl border border-emerald-100 p-5 shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-mono font-bold text-emerald-800">
                        #{enq.enquiryNumber}
                      </span>
                      <h3 className="font-serif font-bold text-base text-emerald-950">
                        {enq.occasion} Cake for {enq.customerName}
                      </h3>
                      <p className="text-xs text-stone-600">
                        Date: <strong>{enq.eventDate}</strong> ({enq.preferredTime})
                      </p>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase ${
                        enq.status === 'enquiry_received'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : enq.status === 'quotation_sent'
                          ? 'bg-blue-100 text-blue-900 border border-blue-200'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      }`}
                    >
                      {enq.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Specs Pill List */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100">
                    <div>
                      <span className="text-stone-400 block text-[10px]">Weight & Shape</span>
                      <span className="font-bold text-emerald-950">
                        {enq.weightKg} Kg • {enq.shape}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px]">Flavour</span>
                      <span className="font-bold text-emerald-950">{enq.flavour}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-stone-400 block text-[10px]">Text on Cake</span>
                      <span className="font-serif italic font-bold text-emerald-800">
                        "{enq.messageOnCake}"
                      </span>
                    </div>
                    {enq.additionalNotes && (
                      <div className="col-span-2">
                        <span className="text-stone-400 block text-[10px]">Notes / Theme</span>
                        <span className="text-stone-700">{enq.additionalNotes}</span>
                      </div>
                    )}
                  </div>

                  {/* Reference Image Preview */}
                  {enq.referenceImage && (
                    <div>
                      <span className="text-[11px] font-bold text-stone-600 block mb-1">
                        Customer Reference Photo:
                      </span>
                      <img
                        src={enq.referenceImage}
                        alt="Reference design"
                        className="w-full h-36 object-cover rounded-xl border border-stone-200"
                      />
                    </div>
                  )}

                  {/* Quotation Details */}
                  {enq.quotationAmount && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex justify-between items-center">
                      <span className="font-bold text-emerald-900">
                        Quotation Sent: ₹{enq.quotationAmount}
                      </span>
                      {enq.adminNotes && (
                        <span className="text-emerald-700 italic">{enq.adminNotes}</span>
                      )}
                    </div>
                  )}

                  {/* Action Controls */}
                  <div className="pt-2 border-t border-emerald-100 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        setQuoteEnquiry(enq);
                        setQuoteAmount(enq.quotationAmount || 1200);
                      }}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors cursor-pointer shadow-xs"
                    >
                      {enq.quotationAmount ? 'Update Quote' : 'Send Quotation'}
                    </button>

                    <a
                      href={`https://wa.me/${enq.customerWhatsApp.replace(/\s+/g, '')}?text=Hello%20${encodeURIComponent(
                        enq.customerName
                      )}%2C%20regarding%20your%20custom%20cake%20enquiry%20%23${
                        enq.enquiryNumber
                      }%20at%20Punjabi%20Bistro%20Dharamkot%3A%20${
                        enq.quotationAmount
                          ? `Our%20quotation%20is%20INR%20${enq.quotationAmount}.`
                          : ''
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-850 hover:bg-emerald-900 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Customer</span>
                    </a>

                    <select
                      value={enq.status}
                      onChange={(e) =>
                        updateCakeEnquiry(
                          enq.id,
                          e.target.value as CustomCakeEnquiry['status']
                        )
                      }
                      className="text-xs p-2 rounded-xl border border-emerald-200 bg-emerald-50/50 ml-auto font-medium text-emerald-950 focus:outline-none focus:border-emerald-600 cursor-pointer"
                    >
                      <option value="enquiry_received">Enquiry Received</option>
                      <option value="quotation_sent">Quotation Sent</option>
                      <option value="confirmed">Confirmed / Paid</option>
                      <option value="in_production">Baking in Kitchen</option>
                      <option value="ready_for_pickup">Ready for Pickup</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: COUPONS & DISCOUNTS MANAGEMENT (OWNER CONTROLLED) */}
        {activeTab === 'coupons' && <AdminCouponManager />}

        {/* TAB 4: DELIVERY ZONES CONFIGURATION */}
        {activeTab === 'zones' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-emerald-950">
                Delivery Zones & Fee Settings
              </h2>
              <p className="text-xs text-stone-600">
                Configure fixed rates to prevent customer confusion or unexpected fees in Dharamkot.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {deliveryZones.map((zone) => (
                <div
                  key={zone.id}
                  className="bg-white rounded-3xl border border-emerald-100 p-6 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif font-bold text-base text-emerald-950">
                      {zone.name}
                    </h3>
                    <span className="text-xs font-bold text-emerald-800">
                      ₹{zone.fee}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed">{zone.description}</p>

                  <div className="space-y-3 pt-2 border-t border-emerald-100">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-1">
                        Delivery Fee (₹)
                      </label>
                      <input
                        type="number"
                        value={zone.fee}
                        onChange={(e) =>
                          updateDeliveryZone({ ...zone, fee: Number(e.target.value) })
                        }
                        className="w-full text-xs px-3 py-2 border border-emerald-200 rounded-xl bg-emerald-50/40 text-emerald-950 focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-1">
                        Free Delivery Threshold (₹, 0 to disable)
                      </label>
                      <input
                        type="number"
                        value={zone.freeDeliveryThreshold || 0}
                        onChange={(e) =>
                          updateDeliveryZone({
                            ...zone,
                            freeDeliveryThreshold: Number(e.target.value) || undefined,
                          })
                        }
                        className="w-full text-xs px-3 py-2 border border-emerald-200 rounded-xl bg-emerald-50/40 text-emerald-950 focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: CUSTOMER ISSUE RESOLUTION CENTER */}
        {activeTab === 'issues' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-emerald-950">
                Customer Support & Complaint Desk
              </h2>
              <p className="text-xs text-stone-600">
                Track and resolve reported delivery delays, missing items, or cake issues directly.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-emerald-100 p-6 space-y-4 shadow-xs">
              {issues.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-500">
                  No active customer tickets reported.
                </div>
              ) : (
                <div className="space-y-3 divide-y divide-emerald-100">
                  {issues.map((iss) => (
                    <div key={iss.id} className="pt-3 first:pt-0 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-emerald-950">
                              {iss.customerName} ({iss.customerPhone})
                            </span>
                            <span className="text-xs font-mono text-emerald-800">
                              Order #{iss.orderNumber}
                            </span>
                          </div>
                          <span className="text-[11px] text-amber-900 font-bold uppercase tracking-wider block mt-0.5">
                            Issue: {iss.issueType.replace('_', ' ')}
                          </span>
                        </div>

                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            iss.status === 'open'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {iss.status.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-xs text-stone-700 italic bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100">
                        "{iss.description}"
                      </p>

                      {iss.resolutionNotes ? (
                        <div className="text-xs text-emerald-800 font-medium">
                          Resolved: {iss.resolutionNotes}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => {
                              const note = prompt(
                                'Enter resolution notes (e.g. Sent replacement pizza / issued UPI refund):'
                              );
                              if (note) resolveIssue(iss.id, note);
                            }}
                            className="bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-800 transition-colors shadow-2xs cursor-pointer"
                          >
                            Mark Resolved
                          </button>
                          <a
                            href={`tel:${iss.customerPhone}`}
                            className="text-xs font-bold text-emerald-800 hover:underline"
                          >
                            Call Customer
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: BUSINESS & STORE SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-white rounded-3xl border border-emerald-100 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-emerald-950">
                Storefront & Operational Settings
              </h2>
              <p className="text-xs text-stone-600">
                Manage public contact info, UPI configuration, and opening hours.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
                  Official Phone Number
                </label>
                <input
                  type="text"
                  value={businessSettings.phone}
                  onChange={(e) =>
                    updateBusinessSettings({ ...businessSettings, phone: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
                  WhatsApp Number (with country code, no +)
                </label>
                <input
                  type="text"
                  value={businessSettings.whatsapp}
                  onChange={(e) =>
                    updateBusinessSettings({ ...businessSettings, whatsapp: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
                  UPI VPA Handle (for payments)
                </label>
                <input
                  type="text"
                  value={businessSettings.upiId}
                  onChange={(e) =>
                    updateBusinessSettings({ ...businessSettings, upiId: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
                    Opening Time
                  </label>
                  <input
                    type="time"
                    value={businessSettings.openingTime}
                    onChange={(e) =>
                      updateBusinessSettings({
                        ...businessSettings,
                        openingTime: e.target.value,
                      })
                    }
                    className="w-full text-xs px-3 py-2 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
                    Closing Time
                  </label>
                  <input
                    type="time"
                    value={businessSettings.closingTime}
                    onChange={(e) =>
                      updateBusinessSettings({
                        ...businessSettings,
                        closingTime: e.target.value,
                      })
                    }
                    className="w-full text-xs px-3 py-2 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Private Portal Security Information */}
            <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-emerald-700" />
                <h3 className="font-serif font-bold text-lg text-emerald-950">
                  Portal Access &amp; Operations Security
                </h3>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Management operations are secured with server-side authentication. Direct access to customer records, order updates, and live menu configurations requires an active administrator session.
              </p>
            </div>

            {/* Change Administrator Credentials Card */}
            <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-xs">
              <div className="flex items-center gap-2 mb-1">
                <KeyRound className="w-5 h-5 text-emerald-700" />
                <h3 className="font-serif font-bold text-lg text-emerald-950">
                  Update Administrator Credentials
                </h3>
              </div>
              <p className="text-xs text-stone-600 mb-5">
                Customize your portal login credentials anytime. Requires your current password to authorize updates.
              </p>

              {credStatusMsg && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-center gap-2 mb-4 ${
                    credStatusMsg.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  {credStatusMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  )}
                  <span>{credStatusMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdateCredentials} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Current Password <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter current password to authorize"
                    value={credCurrentPassword}
                    onChange={(e) => setCredCurrentPassword(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      New Username (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Leave blank to keep unchanged"
                      value={credNewUsername}
                      onChange={(e) => setCredNewUsername(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      New Password (Optional)
                    </label>
                    <input
                      type="password"
                      placeholder="Min 6 characters"
                      value={credNewPassword}
                      onChange={(e) => setCredNewPassword(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    New Security Key (Optional)
                  </label>
                  <input
                    type="password"
                    placeholder="Min 6 characters (leave blank to keep unchanged)"
                    value={credNewSecurityKey}
                    onChange={(e) => setCredNewSecurityKey(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={credLoading}
                    className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {credLoading ? 'Saving...' : 'Save New Credentials'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 7: SALES OVERVIEW & METRICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-emerald-950">
                Business Metrics Overview
              </h2>
              <p className="text-xs text-stone-600">
                Today's revenue, order counts, and operations performance in Dharamkot.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-xs">
                <div className="text-xs font-bold text-emerald-800 uppercase">Total Revenue</div>
                <div className="font-serif font-black text-3xl text-emerald-950 mt-1">
                  ₹{totalRevenue}
                </div>
                <div className="text-[11px] text-stone-500 mt-1">Across all order channels</div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-xs">
                <div className="text-xs font-bold text-amber-700 uppercase">Active Kitchen Orders</div>
                <div className="font-serif font-black text-emerald-950 mt-1 text-3xl">
                  {activeOrders.length}
                </div>
                <div className="text-[11px] text-stone-500 mt-1">Orders in progress right now</div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-xs">
                <div className="text-xs font-bold text-emerald-700 uppercase">Custom Cake Enquiries</div>
                <div className="font-serif font-black text-emerald-950 mt-1 text-3xl">
                  {cakeEnquiries.length}
                </div>
                <div className="text-[11px] text-stone-500 mt-1">Celebration orders logged</div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* DELAY ORDER POPUP (Proactive transparency tool) */}
      {delayModalOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setDelayModalOrder(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full border border-emerald-200 p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-serif font-bold text-lg text-emerald-950">
                  Alert Delay on Order #{delayModalOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setDelayModalOrder(null)}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Informing the customer early avoids bad Google reviews. This will instantly display a clear delay badge on their live tracking screen.
            </p>

            <form onSubmit={handleApplyDelay} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
                  Delay Minutes
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 15, 20, 30].map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setDelayMinutes(m)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        delayMinutes === m
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      +{m} Mins
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
                  Explanation to Customer
                </label>
                <textarea
                  rows={2}
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDelayModalOrder(null)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  Broadcast Delay to Tracker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT KOT / RECEIPT MODAL */}
      {printOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPrintOrder(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-300 font-mono text-xs space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center border-b pb-3 border-dashed border-stone-400">
              <div className="font-bold text-sm">PUNJABI BISTRO & BAKERY</div>
              <div className="text-[10px]">Near Udham Singh Chowk, Dharamkot</div>
              <div className="text-[10px]">Ph: 098562 04951</div>
              <div className="font-bold text-xs mt-2">
                KITCHEN TICKET #{printOrder.orderNumber}
              </div>
              <div className="text-[10px]">{new Date().toLocaleString()}</div>
            </div>

            <div className="text-[11px] space-y-1">
              <div>
                <strong>Customer:</strong> {printOrder.customerName} ({printOrder.customerPhone})
              </div>
              <div>
                <strong>Type:</strong> {printOrder.orderType.toUpperCase()}
                {printOrder.tableNumber ? ` • ${printOrder.tableNumber}` : ''}
              </div>
              {printOrder.deliveryAddress && (
                <div>
                  <strong>Address:</strong> {printOrder.deliveryAddress}
                </div>
              )}
            </div>

            <div className="border-t border-b border-dashed border-stone-400 py-2 space-y-1.5">
              {printOrder.items.map((it, idx) => (
                <div key={idx} className="flex justify-between font-bold">
                  <span>
                    {it.quantity}x {it.product.name}
                  </span>
                  <span>₹{it.totalPrice}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between font-bold text-sm">
              <span>TOTAL DUE:</span>
              <span>₹{printOrder.total}</span>
            </div>

            <div className="pt-3 flex gap-2">
              <button
                onClick={() => setPrintOrder(null)}
                className="flex-1 py-1.5 rounded-lg border border-stone-300 text-stone-600"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-1.5 rounded-lg bg-stone-900 text-white font-bold"
              >
                Print Slip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEND QUOTATION MODAL */}
      {quoteEnquiry && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setQuoteEnquiry(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full border border-emerald-200 p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif font-bold text-lg text-emerald-950">
              Cake Quotation for {quoteEnquiry.customerName}
            </h3>
            <p className="text-xs text-stone-600">
              Cake: {quoteEnquiry.flavour} ({quoteEnquiry.weightKg} Kg, {quoteEnquiry.shape})
            </p>

            <form onSubmit={handleSaveQuotation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
                  Quotation Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(Number(e.target.value))}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white font-bold text-emerald-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
                  Baker Note to Customer
                </label>
                <input
                  type="text"
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="e.g. Includes custom figurine topper and complimentary candle knife set."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setQuoteEnquiry(null)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer"
                >
                  Save & Confirm Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEW PRODUCT MODAL */}
      {showAddProductModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowAddProductModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full border border-emerald-200 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-emerald-950">
                Add New Menu Item
              </h3>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-emerald-900 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. Tandoori Paneer Pizza"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white focus:outline-none focus:border-emerald-600 text-emerald-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-emerald-900 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white focus:outline-none focus:border-emerald-600 text-emerald-950"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-emerald-900 mb-1">
                    Category
                  </label>
                  <select
                    value={newProdCat}
                    onChange={(e) => setNewProdCat(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white focus:outline-none focus:border-emerald-600 text-emerald-950"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-emerald-900 mb-1">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="e.g. Crispy crust topped with marinated paneer, diced capsicum and mozzarella."
                  className="w-full px-3.5 py-2 rounded-xl border border-emerald-200 bg-white focus:outline-none focus:border-emerald-600 text-emerald-950"
                />
              </div>

              <ProductImageManager
                currentImageUrl={newProdImage}
                onImageChange={(url) => setNewProdImage(url)}
                productName={newProdName || 'New Menu Item'}
              />

              <div className="flex gap-4">
                <label className="flex items-center gap-2 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProdEggless}
                    onChange={(e) => setNewProdEggless(e.target.checked)}
                  />
                  <span>100% Eggless</span>
                </label>

                <label className="flex items-center gap-2 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProdBestseller}
                    onChange={(e) => setNewProdBestseller(e.target.checked)}
                  />
                  <span>Mark as Bestseller</span>
                </label>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-700 text-white font-bold py-2.5 rounded-xl hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer"
                >
                  Save Item to Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EXISTING PRODUCT & IMAGE MODAL */}
      {editingProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setEditingProduct(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full border border-emerald-200 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-emerald-950">
                  Edit Menu Item & Image
                </h3>
                <p className="text-xs text-stone-500">
                  Update product details, live availability, or replace the photo using Supabase Storage.
                </p>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProductSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-emerald-900 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={editProdName}
                  onChange={(e) => setEditProdName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white focus:outline-none focus:border-emerald-600 text-emerald-950 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-emerald-900 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={editProdPrice}
                    onChange={(e) => setEditProdPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white focus:outline-none focus:border-emerald-600 text-emerald-950 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-emerald-900 mb-1">
                    Category
                  </label>
                  <select
                    value={editProdCat}
                    onChange={(e) => setEditProdCat(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-white focus:outline-none focus:border-emerald-600 text-emerald-950"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-emerald-900 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editProdDesc}
                  onChange={(e) => setEditProdDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-emerald-200 bg-white focus:outline-none focus:border-emerald-600 text-emerald-950"
                />
              </div>

              {/* DEDICATED PRODUCT IMAGE MANAGEMENT SECTION */}
              <ProductImageManager
                currentImageUrl={editProdImage}
                onImageChange={(url) => setEditProdImage(url)}
                productName={editProdName}
              />

              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editProdEggless}
                    onChange={(e) => setEditProdEggless(e.target.checked)}
                    className="w-4 h-4 text-emerald-700 rounded border-stone-300 focus:ring-emerald-600"
                  />
                  <span>100% Eggless</span>
                </label>

                <label className="flex items-center gap-2 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editProdBestseller}
                    onChange={(e) => setEditProdBestseller(e.target.checked)}
                    className="w-4 h-4 text-emerald-700 rounded border-stone-300 focus:ring-emerald-600"
                  />
                  <span>Mark as Bestseller</span>
                </label>

                <label className="flex items-center gap-2 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editProdAvailable}
                    onChange={(e) => setEditProdAvailable(e.target.checked)}
                    className="w-4 h-4 text-emerald-700 rounded border-stone-300 focus:ring-emerald-600"
                  />
                  <span>In Stock (Available for ordering)</span>
                </label>
              </div>

              <div className="pt-3 flex gap-2 border-t border-emerald-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-800 text-white font-bold py-2.5 rounded-xl hover:bg-emerald-900 transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Changes & Sync to Menu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

// Reusable Order Card for Kanban
interface OrderCardProps {
  order: Order;
  onUpdateStatus: (status: OrderStatus) => void;
  onDelay: () => void;
  onPrint: () => void;
  businessSettings: any;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onUpdateStatus,
  onDelay,
  onPrint,
  businessSettings,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-emerald-100 p-3.5 shadow-xs space-y-2.5 text-xs">
      <div className="flex items-start justify-between">
        <div>
          <span className="font-mono font-bold text-emerald-800 text-sm">
            #{order.orderNumber}
          </span>
          <div className="font-bold text-emerald-950">{order.customerName}</div>
          <div className="text-[11px] text-stone-500">{order.customerPhone}</div>
        </div>

        <div className="text-right">
          <span className="font-bold text-sm text-emerald-950">₹{order.total}</span>
          <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-bold uppercase block mt-0.5">
            {order.orderType}
          </span>
        </div>
      </div>

      {/* Delay alert banner on card */}
      {order.delayMinutes && order.delayMinutes > 0 && (
        <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-semibold flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0" />
          <span>Delayed by +{order.delayMinutes} mins</span>
        </div>
      )}

      {/* Items preview */}
      <div className="space-y-0.5 text-[11px] text-stone-700 border-t border-stone-100 pt-1.5">
        {order.items.map((it, idx) => (
          <div key={idx} className="flex justify-between">
            <span>
              {it.quantity}x {it.product.name}
            </span>
            <span className="text-stone-400">₹{it.totalPrice}</span>
          </div>
        ))}
      </div>

      {order.deliveryAddress && (
        <div className="text-[10px] text-stone-500 line-clamp-1">
          📍 {order.deliveryAddress}
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-1.5">
        <select
          value={order.status}
          onChange={(e) => onUpdateStatus(e.target.value as OrderStatus)}
          className="text-[11px] p-1.5 rounded-lg border border-emerald-200 bg-emerald-50/50 font-semibold text-emerald-950 focus:outline-none focus:border-emerald-600 cursor-pointer"
        >
          <option value="new">New</option>
          <option value="confirmed">Confirmed</option>
          <option value="preparing">In Kitchen</option>
          <option value="ready">Ready</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <button
          onClick={onDelay}
          className="p-1.5 rounded-lg border border-amber-300 hover:bg-amber-50 text-amber-800 text-[10px] font-bold cursor-pointer"
          title="Broadcast Delay to Customer"
        >
          +Delay
        </button>

        <button
          onClick={onPrint}
          className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 cursor-pointer"
          title="Print Kitchen Ticket"
        >
          <Printer className="w-3 h-3" />
        </button>

        <a
          href={`https://wa.me/${order.customerPhone.replace(/\s+/g, '')}?text=Hello%20${encodeURIComponent(
            order.customerName
          )}%2C%20regarding%20your%20order%20%23${order.orderNumber}%20at%20Punjabi%20Bistro%3A%20Status%20is%20now%20${
            order.status
          }.`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg border border-emerald-300 hover:bg-emerald-50 text-emerald-800"
          title="WhatsApp Customer"
        >
          <MessageCircle className="w-3 h-3 text-emerald-600" />
        </a>
      </div>
    </div>
  );
};
