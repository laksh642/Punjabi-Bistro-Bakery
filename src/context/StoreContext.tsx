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
  fetchCakeEnquiriesFromCloud,
  saveCakeEnquiryToCloud,
  updateCakeEnquiryInCloud,
  fetchReviewsFromCloud,
  saveReviewToCloud,
  saveCustomerIssueToCloud,
  resolveCustomerIssueInCloud,
  ConnectionStatus,
  supabase,
  isSupabaseConfigured,
} from '../lib/supabase';

interface CouponState {
  code: string;
  discountPercentage: number;
  maxDiscount: number;
  minOrder: number;
}

const VALID_COUPONS: Record<string, CouponState> = {
  WELCOME10: { code: 'WELCOME10', discountPercentage: 10, maxDiscount: 50, minOrder: 199 },
  BISTRO50: { code: 'BISTRO50', discountPercentage: 15, maxDiscount: 75, minOrder: 399 },
  CAKE100: { code: 'CAKE100', discountPercentage: 12, maxDiscount: 100, minOrder: 500 },
};

interface StoreContextType {
  // Products
  products: Product[];
  categories: typeof INITIAL_CATEGORIES;
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

  // Coupons
  appliedCoupon: CouponState | null;
  couponError: string | null;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;

  // Orders
  orders: Order[];
  currentOrder: Order | null;
  placeOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status'>) => Order;
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
  trackingOrderNumber: string;
  setTrackingOrderNumber: (val: string) => void;
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

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('pb_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
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

  const [appliedCoupon, setAppliedCoupon] = useState<CouponState | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Supabase Cloud State
  const [supabaseStatus, setSupabaseStatus] = useState<ConnectionStatus | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  // UI States
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState<boolean>(false);
  const [trackingOrderNumber, setTrackingOrderNumber] = useState<string>('PB-4081');
  const [isCakeStudioOpen, setIsCakeStudioOpen] = useState<boolean>(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState<boolean>(false);
  const [isMenuOnlyMode, setIsMenuOnlyMode] = useState<boolean>(false);

  // Cloud Synchronization Function
  const syncWithCloud = async () => {
    if (!isSupabaseConfigured) return;
    setIsCloudSyncing(true);
    try {
      const status = await testSupabaseConnection();
      setSupabaseStatus(status);

      if (status.connected) {
        // 1. Sync orders
        if (status.tablesStatus.orders) {
          const cloudOrders = await fetchOrdersFromCloud();
          if (cloudOrders && cloudOrders.length > 0) {
            setOrders((prev) => {
              const map = new Map<string, Order>();
              prev.forEach((o) => map.set(o.id, o));
              cloudOrders.forEach((o) => map.set(o.id, o));
              return Array.from(map.values()).sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
            });
          }
        }

        // 2. Sync cake enquiries
        if (status.tablesStatus.cake_enquiries) {
          const cloudEnquiries = await fetchCakeEnquiriesFromCloud();
          if (cloudEnquiries && cloudEnquiries.length > 0) {
            setCakeEnquiries((prev) => {
              const map = new Map<string, CustomCakeEnquiry>();
              prev.forEach((e) => map.set(e.id, e));
              cloudEnquiries.forEach((e) => map.set(e.id, e));
              return Array.from(map.values()).sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
            });
          }
        }

        // 3. Sync customer reviews
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
      }
    } catch (err) {
      console.warn('Sync with cloud error:', err);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Initial cloud sync & Real-time Supabase listeners
  useEffect(() => {
    syncWithCloud();

    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('pb-live-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newRow = payload.new as any;
            const newOrder: Order = {
              id: newRow.id,
              orderNumber: newRow.order_number,
              customerName: newRow.customer_name,
              customerPhone: newRow.customer_phone,
              orderType: newRow.order_type,
              deliveryAddress: newRow.delivery_address || undefined,
              landmark: newRow.landmark || undefined,
              zoneId: newRow.zone_id || undefined,
              tableNumber: newRow.table_number || undefined,
              timeSlot: newRow.time_slot || 'asap',
              scheduledDate: newRow.scheduled_date || new Date().toISOString().split('T')[0],
              items: Array.isArray(newRow.items) ? newRow.items : [],
              subtotal: Number(newRow.subtotal) || 0,
              deliveryFee: Number(newRow.delivery_fee) || 0,
              discount: Number(newRow.discount) || 0,
              couponCode: newRow.coupon_code || undefined,
              total: Number(newRow.total) || 0,
              paymentMethod: newRow.payment_method || 'cod',
              paymentStatus: newRow.payment_status || 'pending',
              upiTxnId: newRow.upi_txn_id || undefined,
              status: newRow.status as OrderStatus,
              orderNotes: newRow.order_notes || undefined,
              isNoContactDelivery: Boolean(newRow.is_no_contact_delivery),
              createdAt: newRow.created_at,
              estimatedDeliveryTime: newRow.estimated_delivery_time || undefined,
              delayMinutes: newRow.delay_minutes ? Number(newRow.delay_minutes) : undefined,
              delayMessage: newRow.delay_message || undefined,
            };
            setOrders((prev) => {
              if (prev.some((o) => o.id === newOrder.id)) return prev;
              return [newOrder, ...prev];
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedRow = payload.new as any;
            setOrders((prev) =>
              prev.map((o) =>
                o.id === updatedRow.id || o.orderNumber === updatedRow.order_number
                  ? {
                      ...o,
                      status: updatedRow.status as OrderStatus,
                      delayMinutes: updatedRow.delay_minutes ? Number(updatedRow.delay_minutes) : o.delayMinutes,
                      delayMessage: updatedRow.delay_message || o.delayMessage,
                    }
                  : o
              )
            );
            setCurrentOrder((curr) => {
              if (curr && (curr.id === updatedRow.id || curr.orderNumber === updatedRow.order_number)) {
                return {
                  ...curr,
                  status: updatedRow.status as OrderStatus,
                  delayMinutes: updatedRow.delay_minutes ? Number(updatedRow.delay_minutes) : curr.delayMinutes,
                  delayMessage: updatedRow.delay_message || curr.delayMessage,
                };
              }
              return curr;
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'custom_cake_enquiries' },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newRow = payload.new as any;
            const newEnquiry: CustomCakeEnquiry = {
              id: newRow.id,
              enquiryNumber: newRow.enquiry_number,
              customerName: newRow.customer_name,
              customerPhone: newRow.customer_phone,
              customerWhatsApp: newRow.customer_whatsapp || newRow.customer_phone,
              occasion: newRow.occasion || 'Celebration',
              eventDate: newRow.event_date,
              preferredTime: newRow.preferred_time || 'Evening',
              servings: newRow.servings || '10-15 Guests',
              weightKg: Number(newRow.weight_kg) || 1,
              flavour: newRow.flavour || 'Pineapple Cream',
              shape: newRow.shape || 'Round',
              themeDescription: newRow.theme_description || '',
              colorPreference: newRow.color_preference || '',
              messageOnCake: newRow.message_on_cake || '',
              isEggless: newRow.is_eggless !== undefined ? Boolean(newRow.is_eggless) : true,
              referenceImage: newRow.reference_image || undefined,
              approximateBudget: newRow.approximate_budget ? Number(newRow.approximate_budget) : undefined,
              additionalNotes: newRow.additional_notes || undefined,
              status: newRow.status as CustomCakeEnquiry['status'],
              quotationAmount: newRow.quotation_amount ? Number(newRow.quotation_amount) : undefined,
              adminNotes: newRow.admin_notes || undefined,
              createdAt: newRow.created_at,
            };
            setCakeEnquiries((prev) => {
              if (prev.some((e) => e.id === newEnquiry.id)) return prev;
              return [newEnquiry, ...prev];
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedRow = payload.new as any;
            setCakeEnquiries((prev) =>
              prev.map((e) =>
                e.id === updatedRow.id || e.enquiryNumber === updatedRow.enquiry_number
                  ? {
                      ...e,
                      status: updatedRow.status as CustomCakeEnquiry['status'],
                      quotationAmount: updatedRow.quotation_amount ? Number(updatedRow.quotation_amount) : e.quotationAmount,
                      adminNotes: updatedRow.admin_notes || e.adminNotes,
                    }
                  : e
              )
            );
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
    localStorage.setItem('pb_orders', JSON.stringify(orders));
  }, [orders]);

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

  // Coupons
  const applyCoupon = (code: string): boolean => {
    const cleanCode = code.trim().toUpperCase();
    const coupon = VALID_COUPONS[cleanCode];
    if (!coupon) {
      setCouponError('Invalid coupon code. Try WELCOME10 or BISTRO50');
      return false;
    }
    if (cartSubtotal < coupon.minOrder) {
      setCouponError(`Minimum order of ₹${coupon.minOrder} required for ${coupon.code}`);
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

  // Product Admin Operations
  const updateProduct = (product: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
  };

  const toggleProductAvailability = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, isAvailable: !p.isAvailable } : p))
    );
  };

  const addProduct = (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [newProduct, ...prev]);
  };

  const deleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  // Delivery & Settings Admin
  const updateDeliveryZone = (zone: DeliveryZone) => {
    setDeliveryZones((prev) => prev.map((z) => (z.id === zone.id ? zone : z)));
  };

  const updateBusinessSettings = (settings: BusinessSettings) => {
    setBusinessSettings(settings);
  };

  // Orders
  const placeOrder = (
    orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status'>
  ): Order => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `PB-${randomNum}`;
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber,
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    setOrders((prev) => [newOrder, ...prev]);
    setCurrentOrder(newOrder);
    setTrackingOrderNumber(orderNumber);
    clearCart();

    // Asynchronously synchronize with Supabase Cloud
    saveOrderToCloud(newOrder).catch((err) => {
      console.warn('Supabase cloud order save warning:', err);
    });

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId || ord.orderNumber === orderId) {
          const updated = { ...ord, status };
          if (currentOrder && (currentOrder.id === orderId || currentOrder.orderNumber === orderId)) {
            setCurrentOrder(updated);
          }
          return updated;
        }
        return ord;
      })
    );

    updateOrderStatusInCloud(orderId, status).catch((err) => {
      console.warn('Supabase updateOrderStatus error:', err);
    });
  };

  const delayOrder = (orderId: string, additionalMinutes: number, reason: string) => {
    let targetStatus: OrderStatus = 'preparing';
    let totalDelay = additionalMinutes;
    const currentMessage =
      reason || `Order delayed by ${additionalMinutes} mins due to fresh batch preparation.`;

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId || ord.orderNumber === orderId) {
          totalDelay = (ord.delayMinutes || 0) + additionalMinutes;
          targetStatus = ord.status;
          const updated = {
            ...ord,
            delayMinutes: totalDelay,
            delayMessage: currentMessage,
          };
          if (currentOrder && (currentOrder.id === orderId || currentOrder.orderNumber === orderId)) {
            setCurrentOrder(updated);
          }
          return updated;
        }
        return ord;
      })
    );

    updateOrderStatusInCloud(orderId, targetStatus, totalDelay, currentMessage).catch((err) => {
      console.warn('Supabase delayOrder error:', err);
    });
  };

  const findOrder = (query: string): Order | undefined => {
    const q = query.trim().toUpperCase();
    return orders.find(
      (o) => o.orderNumber.toUpperCase() === q || o.customerPhone.includes(q)
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
}
_Sent via Punjabi Bistro & Bakery Dharamkot Website_`;

    return `https://wa.me/${businessSettings.whatsapp}?text=${encodeURIComponent(message)}`;
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        categories: INITIAL_CATEGORIES,
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

        appliedCoupon,
        couponError,
        applyCoupon,
        removeCoupon,

        orders,
        currentOrder,
        placeOrder,
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
        trackingOrderNumber,
        setTrackingOrderNumber,
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
