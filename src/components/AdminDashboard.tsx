import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Bell,
  XCircle,
  ShieldCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useAdminAuth } from '../context/AdminAuthContext';
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
    saveAllDeliveryZones,
    businessSettings,
    updateBusinessSettings,
    issues,
    loadIssuesFromCloud,
    resolveIssue,
    feedbacks,
    setIsAdminView,
    supabaseStatus,
    isCloudSyncing,
    syncWithCloud,
  } = useStore();
  const { updatePassword } = useAdminAuth();

  // Settings & Zones Cloud Persistence Form State
  const [settingsForm, setSettingsForm] = useState(businessSettings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setSettingsForm(businessSettings);
  }, [businessSettings]);

  const [zonesForm, setZonesForm] = useState(deliveryZones);
  const [isSavingZones, setIsSavingZones] = useState(false);
  const [zonesFeedback, setZonesFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setZonesForm(deliveryZones);
  }, [deliveryZones]);

  const handleSaveSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsFeedback(null);
    try {
      const ok = await updateBusinessSettings(settingsForm);
      if (ok) {
        setSettingsFeedback({
          type: 'success',
          message: '✓ Settings saved to database & synchronized across all devices!',
        });
      } else {
        setSettingsFeedback({
          type: 'error',
          message: 'Settings updated locally, but server response was delayed. Syncing in background.',
        });
      }
      setTimeout(() => setSettingsFeedback(null), 4000);
    } catch (err: any) {
      setSettingsFeedback({
        type: 'error',
        message: err.message || 'Failed to save settings. Please try again.',
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveZonesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingZones(true);
    setZonesFeedback(null);
    try {
      const ok = await saveAllDeliveryZones(zonesForm);
      if (ok) {
        setZonesFeedback({
          type: 'success',
          message: '✓ Delivery zones saved to database & synchronized across all devices!',
        });
      } else {
        setZonesFeedback({
          type: 'error',
          message: 'Zones updated locally, but server response was delayed. Syncing in background.',
        });
      }
      setTimeout(() => setZonesFeedback(null), 4000);
    } catch (err: any) {
      setZonesFeedback({
        type: 'error',
        message: err.message || 'Failed to save delivery zones. Please try again.',
      });
    } finally {
      setIsSavingZones(false);
    }
  };

  // Alert sound and banner notification state
  const [newOrderAlert, setNewOrderAlert] = useState<{
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    total: number;
    itemsSummary: string;
    fulfillment: string;
    isContactless?: boolean;
  } | null>(null);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isRefreshingIssues, setIsRefreshingIssues] = useState(false);
  const [mobileStatusTab, setMobileStatusTab] = useState<'all' | 'new' | 'preparing' | 'ready' | 'delivered' | 'cancelled'>('all');
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialMountRef = useRef<boolean>(true);

  // Synthesize crystal bell/ting chime using Web Audio API
  const playTingSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;

      // Primary crystal chime (A5 note -> ting)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.12);
      gain1.gain.setValueAtTime(0.6, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 1.2);

      // Shimmering second harmonic
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1320, now + 0.05);
      gain2.gain.setValueAtTime(0.35, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.05);
      osc2.stop(now + 1.5);
    } catch (e) {
      console.warn('Audio alert error:', e);
    }
  }, [soundEnabled]);

  // Load cloud orders and complaints on Admin Dashboard mount, with active polling and live events
  useEffect(() => {
    loadAdminOrders();
    loadIssuesFromCloud();

    // 1. Cross-window / custom event listener for immediate notifications
    const handleNewOrderEvent = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail) {
        const o = custom.detail;
        if (!knownOrderIdsRef.current.has(o.id)) {
          knownOrderIdsRef.current.add(o.id);
          playTingSound();
          const itemsText = o.items && o.items.length > 0
            ? o.items.map((i: any) => `${i.quantity || 1}x ${i.product?.name || i.name || (i as any).productName || 'Item'}`).join(', ')
            : 'Fresh Bakery Order';
          setNewOrderAlert({
            id: o.id,
            orderNumber: o.orderNumber,
            customerName: o.customerName,
            customerPhone: o.customerPhone,
            total: o.total,
            itemsSummary: itemsText,
            fulfillment: o.orderType,
            isContactless: Boolean(o.isNoContactDelivery || o.contactlessDelivery),
          });
          loadAdminOrders();
        }
      }
    };

    const handleIssueUpdateEvent = () => {
      loadIssuesFromCloud();
    };

    window.addEventListener('pb_new_order_placed', handleNewOrderEvent);
    window.addEventListener('pb_issues_updated', handleIssueUpdateEvent);

    // 2. Active 5-second polling to ensure live updates across all sessions
    const pollInterval = setInterval(() => {
      loadAdminOrders();
      loadIssuesFromCloud();
    }, 5000);

    let orderChannel: any = null;
    let issueChannel: any = null;

    if (isSupabaseConfigured) {
      // 3. Live Supabase orders channel
      orderChannel = supabase
        .channel('pb-admin-live-orders')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload: any) => {
            loadAdminOrders();
            if (payload.eventType === 'INSERT' && payload.new) {
              const newRow = payload.new;
              if (!knownOrderIdsRef.current.has(newRow.id)) {
                knownOrderIdsRef.current.add(newRow.id);
                playTingSound();
                setNewOrderAlert({
                  id: newRow.id,
                  orderNumber: newRow.order_number || 'New',
                  customerName: newRow.customer_name || 'Customer',
                  customerPhone: newRow.customer_phone || '',
                  total: Number(newRow.total || 0),
                  itemsSummary: Array.isArray(newRow.items)
                    ? newRow.items.map((i: any) => `${i.quantity || 1}x ${i.product?.name || i.name || 'Item'}`).join(', ')
                    : 'Fresh Bakery Order',
                  fulfillment: newRow.order_type || 'delivery',
                  isContactless: Boolean(newRow.is_no_contact_delivery),
                });
              }
            }
          }
        )
        .subscribe();

      // 4. Live Supabase customer issues / complaints channel
      issueChannel = supabase
        .channel('pb-admin-live-issues')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'customer_issues' },
          () => {
            loadIssuesFromCloud();
          }
        )
        .subscribe();
    }

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('pb_new_order_placed', handleNewOrderEvent);
      window.removeEventListener('pb_issues_updated', handleIssueUpdateEvent);
      if (orderChannel) supabase.removeChannel(orderChannel);
      if (issueChannel) supabase.removeChannel(issueChannel);
    };
  }, [loadAdminOrders, loadIssuesFromCloud, playTingSound]);

  // Track order updates and trigger notification when a new order appears
  useEffect(() => {
    if (isInitialMountRef.current) {
      orders.forEach((o) => knownOrderIdsRef.current.add(o.id));
      isInitialMountRef.current = false;
      return;
    }

    const newArrival = orders.find((o) => !knownOrderIdsRef.current.has(o.id));
    if (newArrival) {
      knownOrderIdsRef.current.add(newArrival.id);
      playTingSound();
      const itemsText = newArrival.items && newArrival.items.length > 0
        ? newArrival.items.map((i) => `${i.quantity}x ${i.product?.name || (i as any).name || 'Item'}`).join(', ')
        : 'Fresh Bistro Items';
      setNewOrderAlert({
        id: newArrival.id,
        orderNumber: newArrival.orderNumber,
        customerName: newArrival.customerName,
        customerPhone: newArrival.customerPhone,
        total: newArrival.total,
        itemsSummary: itemsText,
        fulfillment: newArrival.orderType,
        isContactless: Boolean(newArrival.isNoContactDelivery || (newArrival as any).contactlessDelivery),
      });
    }

    orders.forEach((o) => knownOrderIdsRef.current.add(o.id));
  }, [orders, playTingSound]);

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
  const [credConfirmPassword, setCredConfirmPassword] = useState('');
  const [credNewSecurityKey, setCredNewSecurityKey] = useState('');
  const [credConfirmSecurityKey, setCredConfirmSecurityKey] = useState('');
  const [credLoading, setCredLoading] = useState(false);
  const [credStatusMsg, setCredStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credNewPassword) {
      setCredStatusMsg({ type: 'error', text: 'Please enter your new administrator password.' });
      return;
    }
    if (credNewPassword.length < 6) {
      setCredStatusMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (credNewPassword !== credConfirmPassword) {
      setCredStatusMsg({ type: 'error', text: 'New password and confirmation password do not match.' });
      return;
    }

    setCredLoading(true);
    setCredStatusMsg(null);
    try {
      const res = await updatePassword(credNewPassword);
      if (!res.success) {
        setCredStatusMsg({ type: 'error', text: res.error || 'Failed to update password in Supabase.' });
      } else {
        setCredStatusMsg({ type: 'success', text: 'Administrator password updated successfully in Supabase Auth!' });
        setCredCurrentPassword('');
        setCredNewUsername('');
        setCredNewPassword('');
        setCredConfirmPassword('');
        setCredNewSecurityKey('');
        setCredConfirmSecurityKey('');
      }
    } catch (err: any) {
      setCredStatusMsg({ type: 'error', text: err?.message || 'Error updating password.' });
    } finally {
      setCredLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Top Operations Header Bar */}
      <header className="bg-emerald-950 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between min-h-[3.5rem] py-2 sm:py-2.5 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <PunjabiBistroLogo className="w-8 h-8 sm:w-10 sm:h-10 shrink-0" />
              <div className="min-w-0">
                <h1 className="font-serif font-bold text-sm sm:text-base lg:text-lg leading-tight text-white truncate">
                  Punjabi Bistro Operations Portal
                </h1>
                <p className="text-[10px] sm:text-[11px] text-emerald-300 truncate max-w-[180px] xs:max-w-[240px] sm:max-w-none">
                  Near Udham Singh Chowk, Dharamkot • Live Board
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* Live Kitchen Sync Status Pill */}
              <div
                className="flex items-center gap-1 bg-emerald-900/80 border border-emerald-800 px-2 py-1 rounded-full text-[10px] sm:text-xs"
                title="Live kitchen synchronization"
              >
                <Cloud className="w-3 h-3 text-emerald-300" />
                <span className="text-emerald-100 font-medium hidden sm:inline text-[11px]">
                  Live
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    supabaseStatus?.connected
                      ? 'bg-emerald-400 shadow-xs shadow-emerald-400/50'
                      : 'bg-amber-400 animate-pulse'
                  }`}
                />
              </div>

              {/* Sound Ting Test / Toggle Button */}
              <button
                onClick={() => {
                  setSoundEnabled(true);
                  playTingSound();
                }}
                title="Test bakery order ting chime sound"
                className="flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/60 text-amber-200 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Ting Sound 🔔</span>
              </button>

              {/* Quick Sync Button */}
              <button
                onClick={() => syncWithCloud()}
                disabled={isCloudSyncing}
                title="Refresh live orders"
                className="flex items-center gap-1 bg-emerald-900/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-200 hover:text-white px-2 py-1 rounded-xl text-[11px] transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 text-emerald-300 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isCloudSyncing ? 'Syncing...' : 'Sync'}</span>
              </button>

              {/* Manual Open / Close quick toggle */}
              <button
                onClick={() =>
                  updateBusinessSettings({
                    ...businessSettings,
                    isOpenManual: !businessSettings.isOpenManual,
                  })
                }
                className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                  businessSettings.isOpenManual
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-rose-700 hover:bg-rose-600 text-white'
                }`}
              >
                <Power className="w-3 h-3" />
                <span>{businessSettings.isOpenManual ? 'OPEN' : 'CLOSED'}</span>
              </button>
            </div>
          </div>

          {/* Nav Tabs (Smooth horizontal scrolling on mobile, zero overlap) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs font-medium no-scrollbar pt-1">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                activeTab === 'orders'
                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                  : 'text-emerald-200 hover:bg-emerald-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Orders ({activeOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('menu')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                activeTab === 'menu'
                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                  : 'text-emerald-200 hover:bg-emerald-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Menu & Stock ({products.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('cakes')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                activeTab === 'cakes'
                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                  : 'text-emerald-200 hover:bg-emerald-900'
              }`}
            >
              <Cake className="w-3.5 h-3.5" />
              <span>Cake Requests ({cakeEnquiries.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('coupons')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                activeTab === 'coupons'
                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                  : 'text-emerald-200 hover:bg-emerald-900'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Coupons & Offers</span>
            </button>

            <button
              onClick={() => setActiveTab('zones')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                activeTab === 'zones'
                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                  : 'text-emerald-200 hover:bg-emerald-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Delivery Zones</span>
            </button>

            <button
              onClick={() => setActiveTab('issues')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                activeTab === 'issues'
                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                  : 'text-emerald-200 hover:bg-emerald-900'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Issues ({issues.filter((i) => i.status === 'open').length})</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                  : 'text-emerald-200 hover:bg-emerald-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Overview & Sales</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                activeTab === 'settings'
                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
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
        
        {/* Real-time Order Arrival Banner with Ting Notification */}
        {newOrderAlert && (
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-amber-500 via-emerald-600 to-[#0B2E15] p-1 shadow-2xl animate-in slide-in-from-top-4 duration-300">
            <div className="bg-white rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0 shadow-xs animate-bounce">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      🔔 New Order Received!
                    </span>
                    <span className="font-mono font-bold text-sm text-emerald-950">
                      #{newOrderAlert.orderNumber}
                    </span>
                    <span className="text-xs bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-md uppercase">
                      {newOrderAlert.fulfillment}
                    </span>
                    {newOrderAlert.isContactless && (
                      <span className="text-xs bg-indigo-100 text-indigo-950 border border-indigo-200 font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-700" />
                        ⚡ Contactless Delivery
                      </span>
                    )}
                  </div>
                  <p className="font-serif font-black text-base sm:text-lg text-emerald-950 mt-1">
                    New Order of: {newOrderAlert.itemsSummary}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 mt-1">
                    <span>Customer: <strong>{newOrderAlert.customerName}</strong> ({newOrderAlert.customerPhone})</span>
                    <span>•</span>
                    <span>Total Amount: <strong className="text-emerald-800 text-sm">₹{newOrderAlert.total}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <button
                  onClick={() => playTingSound()}
                  className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Re-play Ting Sound"
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Re-play Ting 🔔</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('orders');
                    setNewOrderAlert(null);
                  }}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  View in Board
                </button>
                <button
                  onClick={() => setNewOrderAlert(null)}
                  className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                  title="Dismiss notification"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: KANBAN LIVE ORDERS BOARD */}
        {activeTab === 'orders' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-emerald-950">
                  Live Kitchen Order Board
                </h2>
                <p className="text-xs text-stone-600">
                  Manage incoming orders in real time. Update status or alert customers about kitchen preparation delays.
                </p>
              </div>

              <div className="text-xs font-semibold text-stone-700 bg-white px-3 py-1.5 rounded-xl border border-emerald-100 shadow-2xs self-start sm:self-auto">
                Total Orders Logged: <strong>{orders.length}</strong>
              </div>
            </div>

            {/* Mobile / Tablet Status Filter Pills */}
            <div className="xl:hidden flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
              <button
                onClick={() => setMobileStatusTab('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                  mobileStatusTab === 'all'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-emerald-100 hover:bg-emerald-50'
                }`}
              >
                All Columns ({orders.length})
              </button>
              <button
                onClick={() => setMobileStatusTab('new')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                  mobileStatusTab === 'new'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-emerald-100 hover:bg-emerald-50'
                }`}
              >
                New ({orders.filter((o) => o.status === 'new' || o.status === 'confirmed').length})
              </button>
              <button
                onClick={() => setMobileStatusTab('preparing')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                  mobileStatusTab === 'preparing'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-emerald-100 hover:bg-emerald-50'
                }`}
              >
                In Kitchen ({orders.filter((o) => o.status === 'preparing').length})
              </button>
              <button
                onClick={() => setMobileStatusTab('ready')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                  mobileStatusTab === 'ready'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-emerald-100 hover:bg-emerald-50'
                }`}
              >
                Ready & Out ({orders.filter((o) => o.status === 'ready' || o.status === 'out_for_delivery').length})
              </button>
              <button
                onClick={() => setMobileStatusTab('delivered')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                  mobileStatusTab === 'delivered'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-emerald-100 hover:bg-emerald-50'
                }`}
              >
                Completed ({completedOrders.length})
              </button>
              <button
                onClick={() => setMobileStatusTab('cancelled')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                  mobileStatusTab === 'cancelled'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-emerald-100 hover:bg-emerald-50'
                }`}
              >
                Cancelled ({orders.filter((o) => o.status === 'cancelled').length})
              </button>
            </div>

            {/* Kanban Columns - Responsive 5 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              
              {/* Column 1: New / Confirmed */}
              <div className={`bg-white rounded-2xl border border-emerald-100 p-3.5 sm:p-4 flex flex-col shadow-2xs ${
                mobileStatusTab !== 'all' && mobileStatusTab !== 'new' ? 'hidden xl:flex' : 'flex'
              }`}>
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
              <div className={`bg-white rounded-2xl border border-emerald-100 p-3.5 sm:p-4 flex flex-col shadow-2xs ${
                mobileStatusTab !== 'all' && mobileStatusTab !== 'preparing' ? 'hidden xl:flex' : 'flex'
              }`}>
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
              <div className={`bg-white rounded-2xl border border-emerald-100 p-3.5 sm:p-4 flex flex-col shadow-2xs ${
                mobileStatusTab !== 'all' && mobileStatusTab !== 'ready' ? 'hidden xl:flex' : 'flex'
              }`}>
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
              <div className={`bg-white rounded-2xl border border-emerald-100 p-3.5 sm:p-4 flex flex-col shadow-2xs ${
                mobileStatusTab !== 'all' && mobileStatusTab !== 'delivered' ? 'hidden xl:flex' : 'flex'
              }`}>
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

              {/* Column 5: Cancelled Orders */}
              <div className={`bg-white rounded-2xl border border-rose-200 p-3.5 sm:p-4 flex flex-col shadow-2xs ${
                mobileStatusTab !== 'all' && mobileStatusTab !== 'cancelled' ? 'hidden xl:flex' : 'flex'
              }`}>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-rose-100">
                  <span className="font-bold text-xs uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    Cancelled Orders
                  </span>
                  <span className="bg-rose-100 text-rose-900 text-xs font-bold px-2 py-0.5 rounded-full">
                    {orders.filter((o) => o.status === 'cancelled').length}
                  </span>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[70vh]">
                  {orders.filter((o) => o.status === 'cancelled').length === 0 ? (
                    <div className="py-8 text-center text-xs text-stone-400">
                      No cancelled orders.
                    </div>
                  ) : (
                    orders
                      .filter((o) => o.status === 'cancelled')
                      .map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          onUpdateStatus={(s) => updateOrderStatus(order.id, s)}
                          onDelay={() => setDelayModalOrder(order)}
                          onPrint={() => setPrintOrder(order)}
                          businessSettings={businessSettings}
                        />
                      ))
                  )}
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
                <table className="w-full text-left text-xs text-stone-700 min-w-[640px]">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-emerald-950">
                  Delivery Zones & Fee Settings
                </h2>
                <p className="text-xs text-stone-600">
                  Configure fixed rates to prevent customer confusion or unexpected fees in Dharamkot.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveZonesSubmit}
                disabled={isSavingZones}
                className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSavingZones ? 'Saving to Database...' : 'Save Delivery Zones to Database'}</span>
              </button>
            </div>

            {zonesFeedback && (
              <div
                className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
                  zonesFeedback.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {zonesFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span className="font-medium">{zonesFeedback.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {zonesForm.map((zone, idx) => (
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
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setZonesForm((prev) =>
                            prev.map((z, i) => (i === idx ? { ...z, fee: val } : z))
                          );
                        }}
                        className="w-full text-xs px-3 py-2 border border-emerald-200 rounded-xl bg-emerald-50/40 text-emerald-950 focus:outline-none focus:border-emerald-600 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-1">
                        Free Delivery Threshold (₹, 0 to disable)
                      </label>
                      <input
                        type="number"
                        value={zone.freeDeliveryThreshold || 0}
                        onChange={(e) => {
                          const val = Number(e.target.value) || undefined;
                          setZonesForm((prev) =>
                            prev.map((z, i) =>
                              i === idx
                                ? { ...z, freeDeliveryThreshold: val, freeAbove: val }
                                : z
                            )
                          );
                        }}
                        className="w-full text-xs px-3 py-2 border border-emerald-200 rounded-xl bg-emerald-50/40 text-emerald-950 focus:outline-none focus:border-emerald-600 font-bold"
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-emerald-950">
                  Customer Support & Complaint Desk
                </h2>
                <p className="text-xs text-stone-600">
                  Live reports submitted by customers through the storefront report desk. Track and resolve issues directly.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    setIsRefreshingIssues(true);
                    await loadIssuesFromCloud();
                    setTimeout(() => setIsRefreshingIssues(false), 500);
                  }}
                  disabled={isRefreshingIssues}
                  className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-200 ${isRefreshingIssues ? 'animate-spin' : ''}`} />
                  <span>{isRefreshingIssues ? 'Checking...' : 'Refresh Complaints'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">Total Tickets</span>
                <span className="text-2xl font-black text-emerald-950 mt-1 block">{issues.length}</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">Open Complaints</span>
                <span className="text-2xl font-black text-rose-700 mt-1 block">
                  {issues.filter((i) => i.status === 'open').length}
                </span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs col-span-2 sm:col-span-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">Resolved</span>
                <span className="text-2xl font-black text-emerald-800 mt-1 block">
                  {issues.filter((i) => i.status === 'resolved').length}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-emerald-100 p-6 space-y-4 shadow-xs">
              {issues.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-500 space-y-2">
                  <p>No customer complaints or issues reported yet.</p>
                  <p className="text-[11px] text-stone-400">When customers submit issues via the footer or orders help modal, they will appear here live.</p>
                </div>
              ) : (
                <div className="space-y-3 divide-y divide-emerald-100">
                  {issues.map((iss) => (
                    <div key={iss.id} className="pt-3 first:pt-0 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
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
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 self-start sm:self-auto ${
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
          <div className="max-w-3xl bg-white rounded-3xl border border-emerald-100 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-100">
              <div>
                <h2 className="font-serif text-2xl font-bold text-emerald-950">
                  Storefront &amp; Operational Settings
                </h2>
                <p className="text-xs text-stone-600">
                  Manage bakery contact details, UPI payment IDs, address, and live operational parameters. Changes persist to database and sync across all devices.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveSettingsSubmit}
                disabled={isSavingSettings}
                className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50 shrink-0 self-start sm:self-auto"
              >
                <Check className="w-4 h-4" />
                <span>{isSavingSettings ? 'Saving to Database...' : 'Save Settings to Database'}</span>
              </button>
            </div>

            {settingsFeedback && (
              <div
                className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
                  settingsFeedback.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {settingsFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span className="font-medium">{settingsFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettingsSubmit} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-emerald-900 mb-1">
                    Bakery / Store Name
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.name}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:outline-none focus:border-emerald-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-emerald-900 mb-1">
                    Official Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.phone}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:outline-none focus:border-emerald-600 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-emerald-900 mb-1">
                    WhatsApp Number (with country code, no +)
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.whatsapp}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({ ...prev, whatsapp: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:outline-none focus:border-emerald-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-emerald-900 mb-1">
                    UPI VPA ID (for QR &amp; In-App Payments)
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.upiId}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({ ...prev, upiId: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:outline-none focus:border-emerald-600 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-emerald-900 mb-1">
                    UPI Merchant Name
                  </label>
                  <input
                    type="text"
                    value={settingsForm.upiMerchantName || ''}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({ ...prev, upiMerchantName: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-emerald-900 mb-1">
                    Weekly Off Day
                  </label>
                  <input
                    type="text"
                    value={settingsForm.weeklyOff || ''}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({ ...prev, weeklyOff: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:outline-none focus:border-emerald-600"
                    placeholder="e.g. None (Open All 7 Days)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-emerald-900 mb-1">
                    Store Address
                  </label>
                  <input
                    type="text"
                    value={settingsForm.address || ''}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({ ...prev, address: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-emerald-900 mb-1">
                    Landmark / City
                  </label>
                  <input
                    type="text"
                    value={settingsForm.landmark || ''}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({ ...prev, landmark: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-emerald-900 mb-1">
                    Opening Time
                  </label>
                  <input
                    type="time"
                    value={settingsForm.openingTime}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({ ...prev, openingTime: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:outline-none focus:border-emerald-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-emerald-900 mb-1">
                    Closing Time
                  </label>
                  <input
                    type="time"
                    value={settingsForm.closingTime}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({ ...prev, closingTime: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:outline-none focus:border-emerald-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-emerald-900 mb-1">
                    Prep Time (Mins)
                  </label>
                  <input
                    type="number"
                    value={settingsForm.defaultPrepMinutes || 25}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({ ...prev, defaultPrepMinutes: Number(e.target.value) || 20 }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:outline-none focus:border-emerald-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-emerald-900 mb-1">
                    Orders / Slot
                  </label>
                  <input
                    type="number"
                    value={settingsForm.maxOrdersPerSlot || 6}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({ ...prev, maxOrdersPerSlot: Number(e.target.value) || 6 }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:outline-none focus:border-emerald-600 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-emerald-900 mb-1">
                  Public Announcement Banner Text
                </label>
                <input
                  type="text"
                  value={settingsForm.announcementText || ''}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({ ...prev, announcementText: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-emerald-200 bg-white text-emerald-950 focus:outline-none focus:border-emerald-600"
                  placeholder="e.g. Freshly Baked Custom Cakes & Gourmet Bistro Treats Ready in Dharamkot!"
                />
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-2 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.isOpenManual}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({ ...prev, isOpenManual: e.target.checked }))
                    }
                    className="w-4 h-4 text-emerald-700 rounded border-stone-300 focus:ring-emerald-600"
                  />
                  <span className="font-semibold text-emerald-950">Store is Open for Ordering (Manual Override)</span>
                </label>

                <label className="flex items-center gap-2 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.showAnnouncement}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({ ...prev, showAnnouncement: e.target.checked }))
                    }
                    className="w-4 h-4 text-emerald-700 rounded border-stone-300 focus:ring-emerald-600"
                  />
                  <span className="font-semibold text-emerald-950">Show Announcement Bar on Storefront</span>
                </label>
              </div>

              <div className="pt-3 border-t border-emerald-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingSettings ? 'Saving to Database...' : 'Save All Settings to Database'}</span>
                </button>
              </div>
            </form>

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
                  Update Administrator Password
                </h3>
              </div>
              <p className="text-xs text-stone-600 mb-5">
                Update your Supabase Auth administrator password anytime. It takes effect immediately across all sessions.
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

              <form onSubmit={handleUpdateCredentials} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    New Password <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={credNewPassword}
                    onChange={(e) => setCredNewPassword(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Confirm New Password <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter new password to confirm"
                    value={credConfirmPassword}
                    onChange={(e) => setCredConfirmPassword(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={credLoading}
                    className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
                  >
                    {credLoading ? 'Updating in Supabase...' : 'Save New Password'}
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
              Informing the customer early avoids bad Google reviews. This will instantly display a clear delay badge in their live order status.
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
                  Broadcast Delay to Customer
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
              {printOrder.items?.map((it, idx) => (
                <div key={idx} className="flex justify-between font-bold">
                  <span>
                    {it.quantity}x {it.product?.name || (it as any).name || (it as any).productName || 'Item'}
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
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="font-mono font-bold text-emerald-800 text-sm">
            #{order.orderNumber}
          </span>
          <div className="font-bold text-emerald-950 truncate">{order.customerName}</div>
          <div className="text-[11px] text-stone-500 truncate">{order.customerPhone}</div>
        </div>

        <div className="text-right shrink-0">
          <span className="font-bold text-sm text-emerald-950">₹{order.total}</span>
          <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-bold uppercase block mt-0.5">
            {order.orderType}
          </span>
        </div>
      </div>

      {/* Contactless Delivery Notification */}
      {(order.isNoContactDelivery || (order as any).contactlessDelivery) && (
        <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 text-[11px] font-bold flex items-center gap-1.5 shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>⚡ Contactless Delivery Selected (Drop at Doorstep & Call Customer)</span>
        </div>
      )}

      {/* Delay alert banner on card */}
      {order.delayMinutes && order.delayMinutes > 0 && (
        <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-semibold flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0" />
          <span>Delayed by +{order.delayMinutes} mins</span>
        </div>
      )}

      {/* Items preview */}
      <div className="space-y-0.5 text-[11px] text-stone-700 border-t border-stone-100 pt-1.5">
        {order.items?.map((it, idx) => (
          <div key={idx} className="flex justify-between">
            <span>
              {it.quantity}x {it.product?.name || (it as any).name || (it as any).productName || 'Item'}
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

      {/* Quick Action For Cancelled Orders: Allows Admin to reinstate or move to kitchen */}
      {order.status === 'cancelled' && (
        <div className="pt-2 border-t border-rose-200 bg-rose-50/70 p-2.5 rounded-xl flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-rose-800">
            <span className="flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              Cancelled Order
            </span>
            <span className="text-[10px] text-stone-600">Reactivate:</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onUpdateStatus('confirmed')}
              className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold transition-all shadow-2xs cursor-pointer text-center"
              title="Re-confirm order and send to active queue"
            >
              ✓ Re-Confirm
            </button>
            <button
              onClick={() => onUpdateStatus('preparing')}
              className="flex-1 py-1.5 px-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold transition-all shadow-2xs cursor-pointer text-center"
              title="Move order directly into kitchen preparation"
            >
              🍳 In Kitchen
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-1.5">
        <select
          value={order.status}
          onChange={(e) => onUpdateStatus(e.target.value as OrderStatus)}
          className="text-[11px] p-1.5 rounded-lg border border-emerald-200 bg-emerald-50/50 font-semibold text-emerald-950 focus:outline-none focus:border-emerald-600 cursor-pointer flex-1 min-w-[100px]"
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
