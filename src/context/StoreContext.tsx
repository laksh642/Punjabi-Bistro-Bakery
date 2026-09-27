import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  CartItem,
  CartItemOption,
  Order,
  CustomCakeEnquiry,
  CustomerIssue,
  CustomerFeedback,
  BusinessSettings,
  DeliveryZone,
  ReviewItem,
  OrderStatus,
  Coupon,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_ORDERS,
  INITIAL_CAKE_ENQUIRIES,
  INITIAL_DELIVERY_ZONES,
  INITIAL_BUSINESS_SETTINGS,
  INITIAL_REVIEWS,
  INITIAL_ISSUES,
} from '../data/initialData';
import {
  testSupabaseConnection,
  fetchOrdersFromCloud,
  saveOrderToCloud,
  updateOrderStatusInCloud,
  fetchOrderByToken,
  fetchOrderByNumberAndPhone,
  broadcastOrderStatus,
  generateTrackingToken,
  fetchCustomerOrdersFromCloud,
  fetchCakeEnquiriesFromCloud,
  saveCakeEnquiryToCloud,
  updateCakeEnquiryInCloud,
  fetchReviewsFromCloud,
  saveReviewToCloud,
  saveCustomerIssueToCloud,
  resolveCustomerIssueInCloud,
  fetchProductsFromCloud,
  saveProductToCloud,
  deleteProductFromCloud,
  ConnectionStatus,
  supabase,
  isSupabaseConfigured,
} from '../lib/supabase';

export const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'coupon-1',
    code: 'BISTRO100',
    title: '₹100 FLAT OFF',
    subtitle: 'On orders above ₹499 • Freshly prepared pizzas, burgers & bakery items',
    discountType: 'flat',
    discountValue: 100,
    minOrder: 499,
    isActive: true,
    badge: 'Trending Deal',
  },
  {
    id: 'coupon-2',
    code: 'BISTRO50',
    title: '15% OFF (Up to ₹75)',
    subtitle: 'On orders above ₹399 • Authentic fresh taste in Dharamkot',
    discountType: 'percentage',
    discountValue: 15,
    maxDiscount: 75,
    minOrder: 399,
    isActive: true,
    badge: 'Popular',
  },
  {
    id: 'coupon-3',
    code: 'WELCOME10',
    title: '10% FIRST ORDER OFF',
    subtitle: 'On minimum order of ₹199 • Fast takeaway & delivery',
    discountType: 'percentage',
    discountValue: 10,
    maxDiscount: 50,
    minOrder: 199,
    isActive: true,
    badge: 'New Customer',
  },
  {
    id: 'coupon-4',
    code: 'CAKE100',
    title: '₹100 OFF ON CAKES',
    subtitle: '100% Pure Eggless 1Kg+ Cakes • With candles & cutting knife',
    discountType: 'flat',
    discountValue: 100,
    minOrder: 500,
    isActive: true,
    badge: 'Bakery Special',
  },
  {
    id: 'coupon-5',
    code: 'FREEDEL',
    title: '₹40 OFF DELIVERY',
    subtitle: 'On orders above ₹299 • Safe & fast local delivery in Dharamkot',
    discountType: 'flat',
    discountValue: 40,
    minOrder: 299,
    isActive: true,
    badge: 'Free Delivery',
  },
];

interface StoreContextType {
  // Products
  products: Product[];
  categories: typeof INITIAL_CATEGORIES;
  selectedCategory: string;
  setSelectedCategory: (catId: string) => void;
  fulfillmentMode: 'delivery' | 'pickup' | 'dine_in';
  setFulfillmentMode: (mode: 'delivery' | 'pickup' | 'dine_in') => void;
  updateProduct: (product: Product) => void;
  toggleProductAvailability: (productId: string) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  deleteProduct: (productId: string) => void;

  // Cart
  cart: CartItem[];
  addToCart: (
    product: Product,
    quantity?: number,
    selectedOptions?: CartItemOption[],
    specialInstructions?: string
  ) => void;
  updateCartQuantity: (cartItemId: string, newQuantity: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartItemCount: number;

  // Delivery & Settings
  deliveryZones: DeliveryZone[];
  updateDeliveryZone: (zone: DeliveryZone) => void;
  businessSettings: BusinessSettings;
  updateBusinessSettings: (settings: BusinessSettings) => void;
  isStoreOpen: boolean;

  // Dynamic Coupons Management (Owner-Controlled)
  coupons: Coupon[];
  appliedCoupon: Coupon | null;
  couponError: string | null;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  addCoupon: (coupon: Omit<Coupon, 'id'>) => void;
  updateCoupon: (coupon: Coupon) => void;
  deleteCoupon: (id: string) => void;
  toggleCouponActive: (id: string) => void;

  // Orders
  orders: Order[];
  currentOrder: Order | null;
  customerOrders: Order[];
  trackingOrderNumber: string;
  setTrackingOrderNumber: (val: string) => void;
  trackingToken: string;
  setTrackingToken: (val: string) => void;
  getCustomerToken: (orderNumber: string) => string | undefined;
  saveCustomerToken: (orderNumber: string, token: string) => void;
  loadAdminOrders: () => Promise<Order[]>;
  placeOrder: (
    orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status' | 'trackingToken'>
  ) => Promise<{ success: boolean; order?: Order; error?: string }>;
  syncCustomerOrders: (userId: string, email?: string) => Promise<Order[]>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  delayOrder: (orderId: string, additionalMinutes: number, reason: string) => void;
  findOrder: (query: string) => Order | undefined;

  // Custom Cakes
  cakeEnquiries: CustomCakeEnquiry[];
  submitCakeEnquiry: (enquiry: Omit<CustomCakeEnquiry, 'id' | 'enquiryNumber' | 'createdAt' | 'status'>) => CustomCakeEnquiry;
  updateCakeEnquiry: (
    id: string,
    status: CustomCakeEnquiry['status'],
    quotationAmount?: number,
    adminNotes?: string
  ) => void;

  // Issues & Feedback
  issues: CustomerIssue[];
  submitIssue: (issue: Omit<CustomerIssue, 'id' | 'createdAt' | 'status'>) => void;
  resolveIssue: (id: string, notes: string) => void;
  feedbacks: CustomerFeedback[];
  submitFeedback: (feedback: Omit<CustomerFeedback, 'id' | 'createdAt'>) => void;
  reviews: ReviewItem[];
  addReview: (review: Omit<ReviewItem, 'id' | 'date'>) => void;

  // Favourites
  favorites: string[];
  toggleFavorite: (productId: string) => void;

  // UI state
  isAdminView: boolean;
  setIsAdminView: (value: boolean) => void;
  isCartOpen: boolean;
  setIsCartOpen: (value: boolean) => void;
  isTrackingOpen: boolean;
  setIsTrackingOpen: (value: boolean) => void;
  isCakeStudioOpen: boolean;
  setIsCakeStudioOpen: (value: boolean) => void;
  isIssueModalOpen: boolean;
  setIsIssueModalOpen: (value: boolean) => void;
  isMenuOnlyMode: boolean;
  setIsMenuOnlyMode: (value: boolean) => void;

  // Helper
  generateWhatsAppOrderUrl: (order: Order) => string;

  // Supabase Cloud Synchronization
  supabaseStatus: ConnectionStatus | null;
  isCloudSyncing: boolean;
  syncWithCloud: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from localStorage or initial
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('pb_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('pb_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Customer-placed orders strictly isolated on this device/browser
  const [customerOrders, setCustomerOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('pb_customer_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Map of orderNumber -> trackingToken for instant lookup on this device
  const [customerTokens, setCustomerTokens] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('pb_customer_tokens');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Admin orders (loaded strictly on admin demand or admin route)
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('pb_admin_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [cakeEnquiries, setCakeEnquiries] = useState<CustomCakeEnquiry[]>(() => {
    const saved = localStorage.getItem('pb_cake_enquiries');
    return saved ? JSON.parse(saved) : INITIAL_CAKE_ENQUIRIES;
  });

  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(() => {
    const saved = localStorage.getItem('pb_delivery_zones');
    return saved ? JSON.parse(saved) : INITIAL_DELIVERY_ZONES;
  });

  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(() => {
    const saved = localStorage.getItem('pb_business_settings');
    return saved ? JSON.parse(saved) : INITIAL_BUSINESS_SETTINGS;
  });

  const [issues, setIssues] = useState<CustomerIssue[]>(() => {
    const saved = localStorage.getItem('pb_issues');
    return saved ? JSON.parse(saved) : INITIAL_ISSUES;
  });

  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>(() => {
    const saved = localStorage.getItem('pb_feedbacks');
    return saved ? JSON.parse(saved) : [];
  });

  const [reviews, setReviews] = useState<ReviewItem[]>(() => {
    const saved = localStorage.getItem('pb_reviews');
    return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('pb_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // Dynamic Coupons State (Owner Controlled, Persisted)
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    try {
      const saved = localStorage.getItem('pb_coupons');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved coupons:', e);
    }
    return DEFAULT_COUPONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('pb_coupons', JSON.stringify(coupons));
    } catch (e) {
      console.warn('Failed to save coupons to localStorage:', e);
    }
  }, [coupons]);

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Category & Fulfillment Mode State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [fulfillmentMode, setFulfillmentMode] = useState<'delivery' | 'pickup' | 'dine_in'>('delivery');

  // Supabase Cloud State
  const [supabaseStatus, setSupabaseStatus] = useState<ConnectionStatus | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  // UI States
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState<boolean>(false);
  const [trackingOrderNumber, setTrackingOrderNumber] = useState<string>(() => {
    try {
      const savedOrders = localStorage.getItem('pb_customer_orders');
      if (savedOrders) {
        const parsed = JSON.parse(savedOrders);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0].orderNumber || '';
        }
      }
    } catch {
      // ignore
    }
    return '';
  });
  const [trackingToken, setTrackingToken] = useState<string>(() => {
    try {
      const savedOrders = localStorage.getItem('pb_customer_orders');
      if (savedOrders) {
        const parsed = JSON.parse(savedOrders);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0].trackingToken || '';
        }
      }
    } catch {
      // ignore
    }
    return '';
  });
  const [isCakeStudioOpen, setIsCakeStudioOpen] = useState<boolean>(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState<boolean>(false);
  const [isMenuOnlyMode, setIsMenuOnlyMode] = useState<boolean>(false);

  // Helper to retrieve token for an order number placed on this device
  const getCustomerToken = (orderNumber: string): string | undefined => {
    const clean = orderNumber.trim().toUpperCase();
    if (customerTokens[clean]) return customerTokens[clean];
    const match = customerOrders.find((o) => o.orderNumber.toUpperCase() === clean);
    return match?.trackingToken;
  };

  // Helper to persist token for an order number on this device
  const saveCustomerToken = (orderNumber: string, token: string) => {
    const clean = orderNumber.trim().toUpperCase();
    setCustomerTokens((prev) => {
      const next = { ...prev, [clean]: token };
      localStorage.setItem('pb_customer_tokens', JSON.stringify(next));
      return next;
    });
  };

  // Admin-only order loader (invoked exclusively from Admin portal or when authenticated)
  const loadAdminOrders = async (): Promise<Order[]> => {
    if (!isSupabaseConfigured) {
      if (orders.length === 0) {
        setOrders(INITIAL_ORDERS);
        return INITIAL_ORDERS;
      }
      return orders;
    }
    try {
      const cloudOrders = await fetchOrdersFromCloud();
      if (cloudOrders && cloudOrders.length > 0) {
        setOrders(cloudOrders);
        localStorage.setItem('pb_admin_orders', JSON.stringify(cloudOrders));
        return cloudOrders;
      }
    } catch (err) {
      console.warn('loadAdminOrders error:', err);
    }
    return orders;
  };

  // Cloud Synchronization Function - storefront syncs products and public reviews only
  const syncWithCloud = async () => {
    if (!isSupabaseConfigured) return;
    setIsCloudSyncing(true);
    try {
      const status = await testSupabaseConnection();
      setSupabaseStatus(status);

      if (status.connected) {
        // 1. Sync customer reviews (public)
        if (status.tablesStatus.reviews) {
          const cloudReviews = await fetchReviewsFromCloud();
          if (cloudReviews && cloudReviews.length > 0) {
            setReviews((prev) => {
              const map = new Map<string, ReviewItem>();
              prev.forEach((r) => map.set(r.id, r));
              cloudReviews.forEach((r) => map.set(r.id, r));
              return Array.from(map.values());
            });
          }
        }

        // 2. Sync products from Supabase cloud (public menu)
        if (status.tablesStatus.products) {
          const cloudProducts = await fetchProductsFromCloud();
          if (cloudProducts && cloudProducts.length > 0) {
            setProducts((prev) => {
              const map = new Map<string, Product>();
              prev.forEach((p) => map.set(p.id, p));
              cloudProducts.forEach((p) => map.set(p.id, p));
              return Array.from(map.values());
            });
          }
        }
      }
    } catch (err) {
      console.warn('Sync with cloud error:', err);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Initial cloud sync & Real-time public product listeners
  useEffect(() => {
    // Clear legacy insecure pb_orders from non-admin browser cache
    try {
      const legacyOrders = localStorage.getItem('pb_orders');
      if (legacyOrders && !localStorage.getItem('pb_admin_orders')) {
        localStorage.removeItem('pb_orders');
      }
    } catch {
      // ignore
    }

    syncWithCloud();

    if (!isSupabaseConfigured) return;

    // Public broadcast channel strictly for menu product updates
    const channel = supabase
      .channel('pb-storefront-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
            const row = payload.new as any;
            const updatedProd: Product = {
              id: row.id,
              name: row.name,
              categoryId: row.category_id,
              categoryName: row.category_name,
              description: row.description || '',
              price: Number(row.price) || 0,
              originalPrice: row.original_price ? Number(row.original_price) : undefined,
              image: row.image || '',
              isAvailable: row.is_available !== undefined ? Boolean(row.is_available) : true,
              isBestseller: Boolean(row.is_bestseller),
              isEggless: row.is_eggless !== undefined ? Boolean(row.is_eggless) : true,
              isVegetarian: row.is_vegetarian !== undefined ? Boolean(row.is_vegetarian) : true,
              isSpicy: Boolean(row.is_spicy),
              prepTimeMinutes: row.prep_time_minutes ? Number(row.prep_time_minutes) : 20,
              customizationGroups: Array.isArray(row.customization_groups) ? row.customization_groups : undefined,
            };
            setProducts((prev) => {
              const idx = prev.findIndex((p) => p.id === updatedProd.id);
              if (idx > -1) {
                const next = [...prev];
                next[idx] = updatedProd;
                return next;
              }
              return [updatedProd, ...prev];
            });
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const oldId = (payload.old as any).id;
            setProducts((prev) => prev.filter((p) => p.id !== oldId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Persistence
  useEffect(() => {
    localStorage.setItem('pb_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('pb_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('pb_customer_orders', JSON.stringify(customerOrders));
  }, [customerOrders]);

  useEffect(() => {
    localStorage.setItem('pb_customer_tokens', JSON.stringify(customerTokens));
  }, [customerTokens]);

  useEffect(() => {
    if (isAdminView) {
      localStorage.setItem('pb_admin_orders', JSON.stringify(orders));
    }
  }, [orders, isAdminView]);

  useEffect(() => {
    localStorage.setItem('pb_cake_enquiries', JSON.stringify(cakeEnquiries));
  }, [cakeEnquiries]);

  useEffect(() => {
    localStorage.setItem('pb_delivery_zones', JSON.stringify(deliveryZones));
  }, [deliveryZones]);

  useEffect(() => {
    localStorage.setItem('pb_business_settings', JSON.stringify(businessSettings));
  }, [businessSettings]);

  useEffect(() => {
    localStorage.setItem('pb_issues', JSON.stringify(issues));
  }, [issues]);

  useEffect(() => {
    localStorage.setItem('pb_feedbacks', JSON.stringify(feedbacks));
  }, [feedbacks]);

  useEffect(() => {
    localStorage.setItem('pb_reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('pb_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Store open detection
  const isStoreOpen = React.useMemo(() => {
    if (!businessSettings.isOpenManual) return false;
    // Current time check
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentMinsTotal = currentHours * 60 + currentMinutes;

    const [openH, openM] = businessSettings.openingTime.split(':').map(Number);
    const [closeH, closeM] = businessSettings.closingTime.split(':').map(Number);
    const openMinsTotal = openH * 60 + openM;
    const closeMinsTotal = closeH * 60 + closeM;

    // Normal day open period
    return currentMinsTotal >= openMinsTotal && currentMinsTotal <= closeMinsTotal;
  }, [businessSettings]);

  // Cart Calculations
  const cartSubtotal = React.useMemo(() => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [cart]);

  const cartItemCount = React.useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const addToCart = (
    product: Product,
    quantity: number = 1,
    selectedOptions: CartItemOption[] = [],
    specialInstructions?: string
  ) => {
    const optionsTotal = selectedOptions.reduce((sum, opt) => sum + opt.price, 0);
    const unitPrice = product.price + optionsTotal;
    const totalPrice = unitPrice * quantity;

    // Generate unique key based on product + sorted options
    const optionsKey = selectedOptions
      .map((o) => `${o.groupName}:${o.optionName}`)
      .sort()
      .join('|');
    const cartItemId = `${product.id}-${optionsKey}-${specialInstructions || ''}`;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.cartItemId === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          totalPrice: newQty * unitPrice,
        };
        return updated;
      } else {
        return [
          ...prevCart,
          {
            cartItemId,
            productId: product.id,
            product,
            quantity,
            selectedOptions,
            specialInstructions,
            unitPrice,
            totalPrice,
          },
        ];
      }
    });
  };

  const updateCartQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartItemId === cartItemId) {
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: newQuantity * item.unitPrice,
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  // Coupons (Owner-Controlled Dynamic Rules)
  const applyCoupon = (code: string): boolean => {
    const cleanCode = code.trim().toUpperCase();
    const coupon = coupons.find((c) => c.code.toUpperCase() === cleanCode);
    if (!coupon) {
      const activeCodes = coupons
        .filter((c) => c.isActive)
        .map((c) => c.code)
        .slice(0, 3)
        .join(' or ');
      setCouponError(`Invalid coupon code. ${activeCodes ? `Try ${activeCodes}` : ''}`);
      return false;
    }
    if (!coupon.isActive) {
      setCouponError(`Coupon ${coupon.code} is currently inactive.`);
      return false;
    }
    if (coupon.expiryDate && new Date(coupon.expiryDate).getTime() < new Date().setHours(0, 0, 0, 0)) {
      setCouponError(`Coupon ${coupon.code} has expired.`);
      return false;
    }
    if (cartSubtotal < coupon.minOrder) {
      setCouponError(
        `Minimum order of ₹${coupon.minOrder} required for ${coupon.code}. Add ₹${coupon.minOrder - cartSubtotal} more items!`
      );
      return false;
    }
    setAppliedCoupon(coupon);
    setCouponError(null);
    return true;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const addCoupon = (couponData: Omit<Coupon, 'id'>) => {
    const newCoupon: Coupon = {
      ...couponData,
      id: `coupon-${Date.now()}`,
      code: couponData.code.trim().toUpperCase(),
    };
    setCoupons((prev) => [newCoupon, ...prev]);
  };

  const updateCoupon = (updatedCoupon: Coupon) => {
    const formatted: Coupon = {
      ...updatedCoupon,
      code: updatedCoupon.code.trim().toUpperCase(),
    };
    setCoupons((prev) => prev.map((c) => (c.id === formatted.id ? formatted : c)));
    if (appliedCoupon?.id === formatted.id) {
      if (!formatted.isActive || cartSubtotal < formatted.minOrder) {
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon(formatted);
      }
    }
  };

  const deleteCoupon = (id: string) => {
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    if (appliedCoupon?.id === id) {
      setAppliedCoupon(null);
    }
  };

  const toggleCouponActive = (id: string) => {
    setCoupons((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, isActive: !c.isActive };
          if (!updated.isActive && appliedCoupon?.id === id) {
            setAppliedCoupon(null);
          }
          return updated;
        }
        return c;
      })
    );
  };

  // Product Admin Operations
  const updateProduct = (product: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
    saveProductToCloud(product).catch((err) => {
      console.warn('Supabase updateProduct sync warning:', err);
    });
  };

  const toggleProductAvailability = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const updated = { ...p, isAvailable: !p.isAvailable };
          saveProductToCloud(updated).catch((err) => {
            console.warn('Supabase toggleAvailability sync warning:', err);
          });
          return updated;
        }
        return p;
      })
    );
  };

  const addProduct = (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [newProduct, ...prev]);
    saveProductToCloud(newProduct).catch((err) => {
      console.warn('Supabase addProduct sync warning:', err);
    });
  };

  const deleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    deleteProductFromCloud(productId).catch((err) => {
      console.warn('Supabase deleteProduct sync warning:', err);
    });
  };

  // Delivery & Settings Admin
  const updateDeliveryZone = (zone: DeliveryZone) => {
    setDeliveryZones((prev) => prev.map((z) => (z.id === zone.id ? zone : z)));
  };

  const updateBusinessSettings = (settings: BusinessSettings) => {
    setBusinessSettings(settings);
  };

  // Orders
  const placeOrder = async (
    orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status' | 'trackingToken'>
  ): Promise<{ success: boolean; order?: Order; error?: string }> => {
    if (!orderData.userId) {
      return {
        success: false,
        error: 'Customer sign-in with Google is required to place an order.',
      };
    }

    const trackingToken = generateTrackingToken();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `PB-${randomNum}`;
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber,
      trackingToken,
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    // Await actual cloud database persistence in Supabase
    const cloudResult = await saveOrderToCloud(newOrder);

    if (!cloudResult.success) {
      console.error('Failed to save order to Supabase database:', cloudResult.error);
      return {
        success: false,
        error: cloudResult.error || 'Failed to save order to bakery database. Please try again.',
      };
    }

    const confirmedOrder = cloudResult.order || newOrder;

    // Only update local state, customer orders and clear cart after database confirmation
    setCustomerOrders((prev) => [confirmedOrder, ...prev.filter((o) => o.id !== confirmedOrder.id)]);
    saveCustomerToken(confirmedOrder.orderNumber, confirmedOrder.trackingToken);
    setOrders((prev) => [confirmedOrder, ...prev.filter((o) => o.id !== confirmedOrder.id)]);
    setCurrentOrder(confirmedOrder);
    setTrackingOrderNumber(confirmedOrder.orderNumber);
    setTrackingToken(confirmedOrder.trackingToken);
    clearCart();

    return { success: true, order: confirmedOrder };
  };

  const syncCustomerOrders = async (userId: string, email?: string): Promise<Order[]> => {
    if (!userId && !email) return customerOrders;
    try {
      const cloudOrders = await fetchCustomerOrdersFromCloud(userId, email);
      if (cloudOrders && cloudOrders.length > 0) {
        // Merge cloud orders with local customer orders, avoiding duplicates
        setCustomerOrders((prev) => {
          const map = new Map<string, Order>();
          cloudOrders.forEach((o) => map.set(o.id, o));
          prev.forEach((o) => {
            if (!map.has(o.id)) map.set(o.id, o);
          });
          return Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
        return cloudOrders;
      }
    } catch (err) {
      console.warn('syncCustomerOrders error:', err);
    }
    return customerOrders;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    let matchedToken: string | undefined;
    let matchedNum: string | undefined;

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId || ord.orderNumber === orderId) {
          matchedToken = ord.trackingToken;
          matchedNum = ord.orderNumber;
          return { ...ord, status };
        }
        return ord;
      })
    );

    setCustomerOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId || ord.orderNumber === orderId) {
          matchedToken = ord.trackingToken;
          matchedNum = ord.orderNumber;
          return { ...ord, status };
        }
        return ord;
      })
    );

    if (currentOrder && (currentOrder.id === orderId || currentOrder.orderNumber === orderId)) {
      setCurrentOrder((prev) => (prev ? { ...prev, status } : prev));
    }

    updateOrderStatusInCloud(orderId, status).catch((err) => {
      console.warn('Supabase updateOrderStatus error:', err);
    });

    if (matchedToken && matchedNum) {
      broadcastOrderStatus(matchedNum, matchedToken, { status });
    }
  };

  const delayOrder = (orderId: string, additionalMinutes: number, reason: string) => {
    let targetStatus: OrderStatus = 'preparing';
    let totalDelay = additionalMinutes;
    let matchedToken: string | undefined;
    let matchedNum: string | undefined;
    const currentMessage =
      reason || `Order delayed by ${additionalMinutes} mins due to fresh batch preparation.`;

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId || ord.orderNumber === orderId) {
          totalDelay = (ord.delayMinutes || 0) + additionalMinutes;
          targetStatus = ord.status;
          matchedToken = ord.trackingToken;
          matchedNum = ord.orderNumber;
          return {
            ...ord,
            delayMinutes: totalDelay,
            delayMessage: currentMessage,
          };
        }
        return ord;
      })
    );

    setCustomerOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId || ord.orderNumber === orderId) {
          totalDelay = (ord.delayMinutes || 0) + additionalMinutes;
          targetStatus = ord.status;
          matchedToken = ord.trackingToken;
          matchedNum = ord.orderNumber;
          return {
            ...ord,
            delayMinutes: totalDelay,
            delayMessage: currentMessage,
          };
        }
        return ord;
      })
    );

    if (currentOrder && (currentOrder.id === orderId || currentOrder.orderNumber === orderId)) {
      setCurrentOrder((prev) =>
        prev
          ? {
              ...prev,
              delayMinutes: totalDelay,
              delayMessage: currentMessage,
            }
          : prev
      );
    }

    updateOrderStatusInCloud(orderId, targetStatus, totalDelay, currentMessage).catch((err) => {
      console.warn('Supabase delayOrder error:', err);
    });

    if (matchedToken && matchedNum) {
      broadcastOrderStatus(matchedNum, matchedToken, {
        status: targetStatus,
        delayMinutes: totalDelay,
        delayMessage: currentMessage,
      });
    }
  };

  const findOrder = (query: string): Order | undefined => {
    const q = query.trim().toUpperCase();
    if (!q) return undefined;
    return (
      customerOrders.find(
        (o) =>
          o.orderNumber.toUpperCase() === q ||
          o.id.toUpperCase() === q ||
          (o.trackingToken && o.trackingToken.toLowerCase() === q.toLowerCase())
      ) ||
      orders.find(
        (o) =>
          o.orderNumber.toUpperCase() === q ||
          o.id.toUpperCase() === q ||
          (o.trackingToken && o.trackingToken.toLowerCase() === q.toLowerCase())
      )
    );
  };

  // Custom Cakes
  const submitCakeEnquiry = (
    enquiryData: Omit<CustomCakeEnquiry, 'id' | 'enquiryNumber' | 'createdAt' | 'status'>
  ): CustomCakeEnquiry => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const enquiryNumber = `CK-${randomNum}`;
    const newEnquiry: CustomCakeEnquiry = {
      ...enquiryData,
      id: `enq-${Date.now()}`,
      enquiryNumber,
      status: 'enquiry_received',
      createdAt: new Date().toISOString(),
    };
    setCakeEnquiries((prev) => [newEnquiry, ...prev]);

    saveCakeEnquiryToCloud(newEnquiry).catch((err) => {
      console.warn('Supabase saveCakeEnquiry error:', err);
    });

    return newEnquiry;
  };

  const updateCakeEnquiry = (
    id: string,
    status: CustomCakeEnquiry['status'],
    quotationAmount?: number,
    adminNotes?: string
  ) => {
    setCakeEnquiries((prev) =>
      prev.map((item) =>
        item.id === id || item.enquiryNumber === id
          ? {
              ...item,
              status,
              ...(quotationAmount !== undefined ? { quotationAmount } : {}),
              ...(adminNotes !== undefined ? { adminNotes } : {}),
            }
          : item
      )
    );

    updateCakeEnquiryInCloud(id, status, quotationAmount, adminNotes).catch((err) => {
      console.warn('Supabase updateCakeEnquiry error:', err);
    });
  };

  // Issues
  const submitIssue = (issueData: Omit<CustomerIssue, 'id' | 'createdAt' | 'status'>) => {
    const newIssue: CustomerIssue = {
      ...issueData,
      id: `iss-${Date.now()}`,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    setIssues((prev) => [newIssue, ...prev]);

    saveCustomerIssueToCloud(newIssue).catch((err) => {
      console.warn('Supabase saveCustomerIssue error:', err);
    });
  };

  const resolveIssue = (id: string, notes: string) => {
    setIssues((prev) =>
      prev.map((iss) =>
        iss.id === id ? { ...iss, status: 'resolved', resolutionNotes: notes } : iss
      )
    );

    resolveCustomerIssueInCloud(id, notes).catch((err) => {
      console.warn('Supabase resolveCustomerIssue error:', err);
    });
  };

  // Feedback & Reviews
  const submitFeedback = (feedbackData: Omit<CustomerFeedback, 'id' | 'createdAt'>) => {
    const newFeedback: CustomerFeedback = {
      ...feedbackData,
      id: `fb-${Date.now()}`,
      createdAt: new Date().toISOString(),
      resolved: false,
    };
    setFeedbacks((prev) => [newFeedback, ...prev]);
  };

  const addReview = (reviewData: Omit<ReviewItem, 'id' | 'date'>) => {
    const newReview: ReviewItem = {
      ...reviewData,
      id: `rev-${Date.now()}`,
      date: 'Just now',
    };
    setReviews((prev) => [newReview, ...prev]);

    saveReviewToCloud(newReview).catch((err) => {
      console.warn('Supabase saveReview error:', err);
    });
  };

  // Favorites
  const toggleFavorite = (productId: string) => {
    setFavorites((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  // WhatsApp Formatter
  const generateWhatsAppOrderUrl = (order: Order): string => {
    const itemsList = order.items
      .map(
        (i) =>
          `• ${i.quantity}x ${i.product.name}${
            i.selectedOptions.length > 0
              ? ` (${i.selectedOptions.map((o) => o.optionName).join(', ')})`
              : ''
          } - ₹${i.totalPrice}`
      )
      .join('\n');

    const trackingLink = order.trackingToken
      ? `\n*Live Order Tracking:* ${window.location.origin}/track/${order.trackingToken}\n`
      : '';

    const message = `*Punjabi Bistro & Bakery - Order #${order.orderNumber}*
------------------------------
*Customer:* ${order.customerName}
*Phone:* ${order.customerPhone}
*Type:* ${order.orderType.toUpperCase()}
${
  order.orderType === 'delivery'
    ? `*Address:* ${order.deliveryAddress || ''} (Landmark: ${order.landmark || 'N/A'})\n`
    : ''
}${order.orderType === 'dine_in' ? `*Table:* ${order.tableNumber || 'N/A'}\n` : ''}
*Scheduled Time:* ${order.timeSlot === 'asap' ? 'ASAP (Immediate Preparation)' : order.timeSlot}

*Items Ordered:*
${itemsList}

------------------------------
*Subtotal:* ₹${order.subtotal}
*Delivery Fee:* ₹${order.deliveryFee}
${order.discount > 0 ? `*Discount (${order.couponCode || 'Promo'}):* -₹${order.discount}\n` : ''}*Total Amount:* ₹${order.total}
*Payment Method:* ${order.paymentMethod.toUpperCase()} (${order.paymentStatus.toUpperCase()})
${order.upiTxnId ? `*UPI Txn ID:* ${order.upiTxnId}\n` : ''}${
  order.orderNotes ? `*Special Request:* ${order.orderNotes}\n` : ''
}${trackingLink}
_Sent via Punjabi Bistro & Bakery Dharamkot Website_`;

    return `https://wa.me/${businessSettings.whatsapp}?text=${encodeURIComponent(message)}`;
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        categories: INITIAL_CATEGORIES,
        selectedCategory,
        setSelectedCategory,
        fulfillmentMode,
        setFulfillmentMode,
        updateProduct,
        toggleProductAvailability,
        addProduct,
        deleteProduct,

        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartSubtotal,
        cartItemCount,

        deliveryZones,
        updateDeliveryZone,
        businessSettings,
        updateBusinessSettings,
        isStoreOpen,

        coupons,
        appliedCoupon,
        couponError,
        applyCoupon,
        removeCoupon,
        addCoupon,
        updateCoupon,
        deleteCoupon,
        toggleCouponActive,

        orders,
        currentOrder,
        customerOrders,
        trackingOrderNumber,
        setTrackingOrderNumber,
        trackingToken,
        setTrackingToken,
        getCustomerToken,
        saveCustomerToken,
        loadAdminOrders,
        placeOrder,
        syncCustomerOrders,
        updateOrderStatus,
        delayOrder,
        findOrder,

        cakeEnquiries,
        submitCakeEnquiry,
        updateCakeEnquiry,

        issues,
        submitIssue,
        resolveIssue,
        feedbacks,
        submitFeedback,
        reviews,
        addReview,

        favorites,
        toggleFavorite,

        isAdminView,
        setIsAdminView,
        isCartOpen,
        setIsCartOpen,
        isTrackingOpen,
        setIsTrackingOpen,
        isCakeStudioOpen,
        setIsCakeStudioOpen,
        isIssueModalOpen,
        setIsIssueModalOpen,
        isMenuOnlyMode,
        setIsMenuOnlyMode,

        generateWhatsAppOrderUrl,

        // Supabase Cloud State & Actions
        supabaseStatus,
        isCloudSyncing,
        syncWithCloud,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
