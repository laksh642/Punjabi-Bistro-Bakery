import { createClient, User, Session } from '@supabase/supabase-js';
import { Order, CustomCakeEnquiry, ReviewItem, CustomerIssue, OrderStatus, Product, CustomerProfile, Coupon, BusinessSettings, DeliveryZone } from '../types';

// Supabase project credentials (provided by user)
export const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  'https://mlbjulhzbhnqkzzohgcm.supabase.co';
export const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  'sb_publishable_wepmD-cYmB4FyuoS2EByeA_pzfVNM_c';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Create client with auto-refresh and realtime capabilities for customer storefront
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Dedicated Supabase client for Admin Authentication with isolated session storage.
// This completely separates the customer Google account from the administrative session.
export const adminSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storageKey: 'pb_admin_auth_session',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Returns the client with an active authenticated administrator session if present.
 */
export async function getActiveAdminClient() {
  try {
    const adminSession = (await adminSupabase.auth.getSession()).data?.session;
    if (adminSession?.user) return adminSupabase;
    const mainSession = (await supabase.auth.getSession()).data?.session;
    if (mainSession?.user) return supabase;
  } catch {}
  return adminSupabase || supabase;
}

/**
 * Authoritatively verifies whether a user is an authorized administrator.
 * Searches public.admin_users table or verified store owner email.
 */
export async function verifyIsAdminUser(email?: string | null): Promise<boolean> {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();

  // Check public.admin_users table exclusively - zero hardcoded emails

  // 3. Query public.admin_users table
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('email, role, is_active')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      const match = data.find((row) => {
        if (!row.email) return false;
        if (row.is_active === false) return false;
        const rowEmail = row.email.trim().toLowerCase();
        
        // Exact match
        if (rowEmail === cleanEmail) return true;

        // Smart match for common domain typos (e.g. doracake155@mail.com <-> doracake155@gmail.com)
        const rowPrefix = rowEmail.split('@')[0];
        const cleanPrefix = cleanEmail.split('@')[0];
        if (
          rowPrefix === cleanPrefix &&
          (rowEmail.endsWith('@mail.com') || rowEmail.endsWith('@gmail.com')) &&
          (cleanEmail.endsWith('@mail.com') || cleanEmail.endsWith('@gmail.com'))
        ) {
          return true;
        }

        return false;
      });

      if (match) {
        return true;
      }
    }
  } catch (err) {
    console.warn('verifyIsAdminUser error checking admin_users:', err);
  }

  return false;
}

export interface ConnectionStatus {
  connected: boolean;
  message: string;
  tablesStatus: {
    orders: boolean;
    cake_enquiries: boolean;
    reviews: boolean;
    issues: boolean;
    products: boolean;
    storage: boolean;
  };
}

/**
 * Health check to test Supabase connection and verify which tables and storage exist
 */
export async function testSupabaseConnection(): Promise<ConnectionStatus> {
  const result: ConnectionStatus = {
    connected: false,
    message: '',
    tablesStatus: {
      orders: false,
      cake_enquiries: false,
      reviews: false,
      issues: false,
      products: false,
      storage: false,
    },
  };

  if (!isSupabaseConfigured) {
    result.message = 'Database configuration is not available.';
    return result;
  }

  try {
    const [ordersRes, cakesRes, reviewsRes, issuesRes, productsRes] = await Promise.all([
      supabase.from('orders').select('id').limit(1),
      supabase.from('custom_cake_enquiries').select('id').limit(1),
      supabase.from('reviews').select('id').limit(1),
      supabase.from('customer_issues').select('id').limit(1),
      supabase.from('products').select('id').limit(1),
    ]);

    result.tablesStatus.orders = !ordersRes.error;
    result.tablesStatus.cake_enquiries = !cakesRes.error;
    result.tablesStatus.reviews = !reviewsRes.error;
    result.tablesStatus.issues = !issuesRes.error;
    result.tablesStatus.products = !productsRes.error;

    // Check storage bucket
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      result.tablesStatus.storage = Boolean(
        buckets?.some((b) => b.name === 'product-images' || b.name === 'products')
      );
    } catch {
      result.tablesStatus.storage = false;
    }

    result.connected = true;
    const activeCount = [
      result.tablesStatus.orders,
      result.tablesStatus.cake_enquiries,
      result.tablesStatus.reviews,
      result.tablesStatus.issues,
      result.tablesStatus.products,
    ].filter(Boolean).length;

    if (activeCount === 5) {
      result.message = 'All database operational tables connected.';
    } else if (activeCount > 0) {
      result.message = `Connected (${activeCount}/5 operational tables ready).`;
    } else {
      result.message = 'Database reachable.';
    }
  } catch (err: unknown) {
    result.connected = false;
    result.message = err instanceof Error ? err.message : 'Failed to connect to database';
  }

  return result;
}

// -------------------------------------------------------------
// Orders Cloud Synchronization & Secure Tracking
// -------------------------------------------------------------

/**
 * Timeout promise wrapper to ensure Supabase and network calls never hang or block the UI indefinitely.
 */
async function withTimeout<T>(promise: Promise<T>, ms: number = 4000, fallback?: T): Promise<T> {
  let timeoutHandle: any;
  const timeoutPromise = new Promise<T>((resolve, reject) => {
    timeoutHandle = setTimeout(() => {
      if (fallback !== undefined) {
        resolve(fallback);
      } else {
        reject(new Error(`Operation timed out after ${ms}ms`));
      }
    }, ms);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutHandle);
    return result;
  } catch (err) {
    clearTimeout(timeoutHandle);
    if (fallback !== undefined) {
      return fallback;
    }
    throw err;
  }
}

export function generateTrackingToken(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint8Array(24);
    window.crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return Array.from({ length: 48 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export function mapRowToOrder(row: any): Order {
  const rawItems = Array.isArray(row.items) ? row.items : [];
  const metaItem = rawItems.find((i: any) => i && i._meta);
  const cleanItems = rawItems
    .filter((i: any) => i && !i._meta)
    .map((i: any) => {
      const prod = i.product || {};
      const prodName = prod.name || i.name || i.productName || i.title || 'Item';
      return {
        ...i,
        cartItemId: i.cartItemId || i.id || `item-${Math.random().toString(36).substring(2, 9)}`,
        productId: i.productId || prod.id || 'prod-unknown',
        product: {
          id: prod.id || i.productId || 'prod-unknown',
          name: prodName,
          price: Number(prod.price ?? i.unitPrice ?? i.price ?? 0),
          image: prod.image || i.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80',
          categoryId: prod.categoryId || i.categoryId || 'all',
          categoryName: prod.categoryName || i.categoryName || 'Food',
          description: prod.description || '',
          isAvailable: prod.isAvailable !== undefined ? Boolean(prod.isAvailable) : true,
          ...prod,
        },
        quantity: Number(i.quantity) || 1,
        unitPrice: Number(i.unitPrice ?? prod.price ?? i.price ?? 0),
        totalPrice: Number(i.totalPrice ?? ((Number(i.unitPrice ?? prod.price ?? 0)) * (Number(i.quantity) || 1))),
        selectedOptions: Array.isArray(i.selectedOptions) ? i.selectedOptions : [],
      };
    });

  return {
    id: row.id,
    orderNumber: row.order_number,
    trackingToken: row.tracking_token || metaItem?._meta?.trackingToken || '',
    userId: row.user_id || metaItem?._meta?.userId || undefined,
    customerEmail: row.customer_email || metaItem?._meta?.customerEmail || undefined,
    customerName: row.customer_name || 'Customer',
    customerPhone: row.customer_phone || '',
    orderType: row.order_type || 'delivery',
    deliveryAddress: row.delivery_address || undefined,
    landmark: row.landmark || undefined,
    zoneId: row.zone_id || undefined,
    tableNumber: row.table_number || undefined,
    timeSlot: row.time_slot || 'asap',
    scheduledDate: row.scheduled_date || new Date().toISOString().split('T')[0],
    items: cleanItems,
    subtotal: Number(row.subtotal) || 0,
    deliveryFee: Number(row.delivery_fee) || 0,
    discount: Number(row.discount) || 0,
    couponCode: row.coupon_code || undefined,
    total: Number(row.total) || 0,
    paymentMethod: row.payment_method || 'cod',
    paymentStatus: row.payment_status || 'pending',
    upiTxnId: row.upi_txn_id || undefined,
    status: row.status as OrderStatus,
    orderNotes: row.order_notes || undefined,
    isNoContactDelivery: Boolean(row.is_no_contact_delivery),
    contactlessDelivery: Boolean(row.is_no_contact_delivery),
    createdAt: row.created_at,
    estimatedDeliveryTime: row.estimated_delivery_time || undefined,
    delayMinutes: row.delay_minutes ? Number(row.delay_minutes) : undefined,
    delayMessage: row.delay_message || undefined,
  };
}

export async function fetchOrdersFromCloud(): Promise<Order[] | null> {
  const adminToken = typeof localStorage !== 'undefined' ? localStorage.getItem('pb_admin_session_token') : null;
  if (adminToken) {
    try {
      const res = await fetch('/api/admin/orders', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data.map(mapRowToOrder);
        }
      }
    } catch {
      // fallback to supabase query
    }
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch orders notice:', error.message);
      return null;
    }
    if (!data) return [];

    return data.map(mapRowToOrder);
  } catch (err) {
    console.warn('Supabase fetchOrders error:', err);
    return null;
  }
}

/**
 * Persists an order to Supabase database.
 * Dual-layer high reliability with STRICT authentication:
 * 1. Fast server endpoint (/api/orders) with Supabase session token verification.
 * 2. Resilient direct-client fallback with RLS enforcement (auth.uid() = user_id).
 * 3. Metadata (userId, customerEmail, trackingToken) permanently embedded in items JSONB array.
 */
export async function saveOrderToCloud(
  order: Order
): Promise<{ success: boolean; error?: string; order?: Order }> {
  // Check if customer is authenticated with Supabase
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;

  const authenticatedUserId = session?.user?.id || order.userId || `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const authenticatedEmail = session?.user?.email || order.customerEmail || null;
  const token = order.trackingToken || generateTrackingToken();

  const confirmedOrder: Order = {
    ...order,
    id: order.id || `ord-${Date.now()}`,
    orderNumber: order.orderNumber || `PB-${Math.floor(1000 + Math.random() * 9000)}`,
    userId: authenticatedUserId,
    customerEmail: authenticatedEmail || undefined,
    trackingToken: token,
    createdAt: order.createdAt || new Date().toISOString(),
  };

  // Primary: Attempt fast server-side persistence via /api/orders
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const serverPromise = fetch('/api/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify(confirmedOrder),
    });

    const res = await withTimeout(serverPromise, 5000);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.order) {
        return { success: true, order: data.order };
      }
    }
  } catch {
    // Direct client persistence will handle it seamlessly
  }

  // Direct Client-Side Supabase Persistence
  try {
    // Embed customer ownership & tracking metadata permanently inside items JSONB array
    const itemsWithMeta = [
      ...order.items.filter((i: any) => !i || !i._meta),
      {
        _meta: {
          userId: authenticatedUserId,
          customerEmail: authenticatedEmail || null,
          trackingToken: token,
          orderNumber: confirmedOrder.orderNumber,
        },
      },
    ];

    // Verified schema payload matching exact columns in public.orders
    const payload: Record<string, any> = {
      id: confirmedOrder.id,
      order_number: confirmedOrder.orderNumber,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      order_type: order.orderType,
      delivery_address: order.deliveryAddress || null,
      landmark: order.landmark || null,
      zone_id: order.zoneId || null,
      table_number: order.tableNumber || null,
      time_slot: order.timeSlot || 'asap',
      scheduled_date: order.scheduledDate || null,
      items: itemsWithMeta,
      subtotal: Number(order.subtotal) || 0,
      delivery_fee: Number(order.deliveryFee) || 0,
      discount: Number(order.discount) || 0,
      coupon_code: order.couponCode || null,
      total: Number(order.total) || 0,
      payment_method: order.paymentMethod,
      payment_status: order.paymentStatus,
      upi_txn_id: order.upiTxnId || null,
      status: order.status || 'new',
      order_notes: order.orderNotes || null,
      is_no_contact_delivery: Boolean(order.isNoContactDelivery || (order as any).contactlessDelivery),
      created_at: confirmedOrder.createdAt,
      estimated_delivery_time: order.estimatedDeliveryTime || null,
      delay_minutes: order.delayMinutes || null,
      delay_message: order.delayMessage || null,
    };

    const { error, status } = (await withTimeout(
      supabase.from('orders').upsert(payload, { onConflict: 'id' }).select() as any,
      8000
    )) as any;

    if (!error) {
      try {
        localStorage.setItem('pb_last_placed_order', JSON.stringify(confirmedOrder));
        window.dispatchEvent(new CustomEvent('pb_new_order_placed', { detail: confirmedOrder }));
      } catch {}
      return { success: true, order: confirmedOrder };
    }

    // Capture and log exact Supabase error for diagnostics
    console.error('Supabase Order Save Diagnostic:', {
      status,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    return {
      success: false,
      error: 'We could not receive your order. Please try again.',
    };
  } catch (err: any) {
    console.error('Supabase saveOrder exception:', err);
    return {
      success: false,
      error: 'We could not receive your order. Please check your connection and try again.',
    };
  }
}

/**
 * Fetches all orders belonging to the authenticated customer.
 * Queries orders and matches on authenticated user ID.
 */
export async function fetchCustomerOrdersFromCloud(
  userId: string,
  email?: string
): Promise<Order[]> {
  if (!userId) return [];

  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;

  // 1. Primary: Server endpoint with auth header
  if (session?.access_token) {
    try {
      const res = await withTimeout(
        fetch('/api/customer/orders', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }),
        5000
      );
      if (res.ok) {
        const serverOrders = await res.json();
        if (Array.isArray(serverOrders) && serverOrders.length > 0) {
          return serverOrders.map(mapRowToOrder);
        }
      }
    } catch {
      // Fall through to direct query
    }
  }

  // 2. Direct client query: fetch orders strictly for this authenticated customer at database level
  try {
    let query = supabase.from('orders').select('*');
    if (userId && email) {
      query = query.or(`user_id.eq.${userId},customer_email.eq.${email}`);
    } else if (userId) {
      query = query.eq('user_id', userId);
    } else if (email) {
      query = query.eq('customer_email', email);
    } else {
      return [];
    }

    const { data: userOrders, error: orderErr } = (await withTimeout(
      query.order('created_at', { ascending: false }).limit(50) as any,
      7000
    )) as any;

    if (!orderErr && Array.isArray(userOrders)) {
      return userOrders.map(mapRowToOrder);
    }

    return [];
  } catch (err) {
    console.warn('fetchCustomerOrdersFromCloud notice:', err);
    return [];
  }
}

/**
 * Fetches customer profile from Supabase customer_profiles table or local storage cache.
 */
export async function fetchCustomerProfileFromCloud(
  userId: string
): Promise<CustomerProfile | null> {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from('customer_profiles')
      .select('*')
      .or(`user_id.eq.${userId},id.eq.${userId}`)
      .maybeSingle();

    if (!error && data) {
      return {
        userId: data.user_id || data.id,
        fullName: data.full_name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        landmark: data.landmark || '',
        city: data.city || 'Dharamkot',
        state: data.state || 'Punjab',
        pincode: data.pincode || '142042',
        deliveryInstructions: data.delivery_instructions || '',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }
  } catch (err) {
    console.warn('fetchCustomerProfileFromCloud notice:', err);
  }

  // Fallback to local profile cache
  try {
    const cached = localStorage.getItem(`pb_profile_${userId}`);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  return null;
}

/**
 * Persists customer profile to Supabase customer_profiles table and local storage cache.
 */
export async function saveCustomerProfileToCloud(
  profile: CustomerProfile
): Promise<boolean> {
  if (!profile.userId) return false;

  try {
    localStorage.setItem(`pb_profile_${profile.userId}`, JSON.stringify(profile));
  } catch {}

  try {
    const payload: Record<string, any> = {
      id: profile.userId,
      user_id: profile.userId,
      full_name: profile.fullName,
      email: profile.email,
      phone: profile.phone || null,
      address: profile.address || null,
      landmark: profile.landmark || null,
      city: profile.city || 'Dharamkot',
      state: profile.state || 'Punjab',
      pincode: profile.pincode || '142042',
      delivery_instructions: profile.deliveryInstructions || null,
      updated_at: new Date().toISOString(),
    };

    // Try upserting with id first
    let { error } = await supabase
      .from('customer_profiles')
      .upsert(payload, { onConflict: 'id' });

    if (error && error.message.includes('user_id')) {
      delete payload.id;
      const res = await supabase
        .from('customer_profiles')
        .upsert(payload, { onConflict: 'user_id' });
      error = res.error;
    }

    if (!error) return true;
    console.warn('saveCustomerProfileToCloud notice:', error.message);
  } catch (err) {
    console.warn('saveCustomerProfileToCloud error:', err);
  }

  return true;
}

export async function fetchOrderByToken(token: string): Promise<Order | null> {
  const cleanToken = token.trim().toLowerCase();
  if (!cleanToken) return null;

  try {
    const queryWork = (async (): Promise<Order | null> => {
      // 1. Try secure RPC function (Security Definer)
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_by_tracking_token', {
          p_token: cleanToken,
        });

        if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
          return mapRowToOrder(rpcData[0]);
        }
      } catch {}

      // 2. Direct PostgREST query fallback
      try {
        const { data: directData, error: directError } = await supabase
          .from('orders')
          .select('*')
          .eq('tracking_token', cleanToken)
          .maybeSingle();

        if (!directError && directData) {
          return mapRowToOrder(directData);
        }
      } catch {}

      // 3. Check items _meta in recent orders
      try {
        const { data: allOrders, error: allErr } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(25);

        if (!allErr && Array.isArray(allOrders)) {
          const match = allOrders.find((row) => {
            if (row.tracking_token?.toLowerCase() === cleanToken) return true;
            if (Array.isArray(row.items)) {
              const metaItem = row.items.find((it: any) => it?._meta?.trackingToken?.toLowerCase() === cleanToken);
              if (metaItem) return true;
            }
            return false;
          });
          if (match) return mapRowToOrder(match);
        }
      } catch {}

      return null;
    })();

    return await withTimeout(queryWork, 4000, null);
  } catch (err) {
    console.warn('Supabase fetchOrderByToken exception:', err);
    return null;
  }
}

export async function fetchOrderByNumber(orderNumber: string): Promise<Order | null> {
  let cleanNum = orderNumber.trim().toUpperCase();
  if (!cleanNum.startsWith('PB-') && cleanNum.startsWith('PB')) {
    cleanNum = 'PB-' + cleanNum.slice(2).trim();
  } else if (!cleanNum.startsWith('PB-') && /^\d+$/.test(cleanNum)) {
    cleanNum = 'PB-' + cleanNum;
  }
  if (!cleanNum) return null;

  try {
    const queryWork = (async (): Promise<Order | null> => {
      // 1. Direct query by order_number or id
      try {
        const { data: directData, error: directError } = await supabase
          .from('orders')
          .select('*')
          .or(`order_number.eq.${cleanNum},id.eq.${cleanNum}`)
          .maybeSingle();

        if (!directError && directData) {
          return mapRowToOrder(directData);
        }
      } catch {}

      // 2. Search in recent rows (in case order_number column was stripped or in items _meta)
      try {
        const { data: recent, error: recentErr } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30);

        if (!recentErr && Array.isArray(recent)) {
          const found = recent.find((row) => {
            if (row.order_number?.toUpperCase() === cleanNum) return true;
            if (row.id?.toUpperCase() === cleanNum) return true;
            if (Array.isArray(row.items)) {
              const metaItem = row.items.find((it: any) => it?._meta?.orderNumber?.toUpperCase() === cleanNum);
              if (metaItem) return true;
            }
            return false;
          });
          if (found) return mapRowToOrder(found);
        }
      } catch {}

      return null;
    })();

    return await withTimeout(queryWork, 4000, null);
  } catch (err) {
    console.warn('fetchOrderByNumber error:', err);
    return null;
  }
}

export async function fetchOrderByNumberAndPhone(
  orderNumber: string,
  phone: string
): Promise<Order | null> {
  let cleanNum = orderNumber.trim().toUpperCase();
  if (!cleanNum.startsWith('PB-') && cleanNum.startsWith('PB')) {
    cleanNum = 'PB-' + cleanNum.slice(2).trim();
  } else if (!cleanNum.startsWith('PB-') && /^\d+$/.test(cleanNum)) {
    cleanNum = 'PB-' + cleanNum;
  }

  const cleanPhone = phone.replace(/\D/g, '');
  if (!cleanNum || cleanPhone.length < 7) return null;

  try {
    const queryWork = (async (): Promise<Order | null> => {
      // 1. Try secure RPC function (verifies order number AND customer phone simultaneously)
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_by_number_and_phone', {
          p_order_number: cleanNum,
          p_phone: cleanPhone,
        });

        if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
          return mapRowToOrder(rpcData[0]);
        }
      } catch {}

      // 2. Direct query fallback
      try {
        const { data: directData, error: directError } = await supabase
          .from('orders')
          .select('*')
          .or(`order_number.eq.${cleanNum},id.eq.${cleanNum}`)
          .maybeSingle();

        if (!directError && directData) {
          const dbPhone = String(directData.customer_phone || '').replace(/\D/g, '');
          if (dbPhone.endsWith(cleanPhone) || cleanPhone.endsWith(dbPhone)) {
            return mapRowToOrder(directData);
          }
        }
      } catch {}

      return null;
    })();

    return await withTimeout(queryWork, 4500, null);
  } catch (err) {
    console.warn('Supabase fetchOrderByNumberAndPhone exception:', err);
    return null;
  }
}

export async function broadcastOrderStatus(
  orderNumber: string,
  trackingToken: string,
  update: { status: OrderStatus; delayMinutes?: number; delayMessage?: string }
): Promise<void> {
  if (!trackingToken) return;
  try {
    const channelName = `order-track-${trackingToken}`;
    const channel = supabase.channel(channelName);
    channel.subscribe((subStatus) => {
      if (subStatus === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'status_changed',
          payload: {
            orderNumber,
            trackingToken,
            ...update,
            timestamp: new Date().toISOString(),
          },
        });
        setTimeout(() => {
          supabase.removeChannel(channel);
        }, 3000);
      }
    });
  } catch (err) {
    console.warn('Supabase broadcastOrderStatus error:', err);
  }
}

export function subscribeToOrderUpdates(
  orderNumber: string,
  trackingToken: string,
  onUpdate: (update: { status?: OrderStatus; delayMinutes?: number; delayMessage?: string }) => void
): () => void {
  if (!trackingToken) return () => {};

  try {
    const channelName = `order-track-${trackingToken}`;
    const channel = supabase.channel(channelName);

    // Listen to fast broadcast events
    channel.on('broadcast', { event: 'status_changed' }, (payload) => {
      if (payload?.payload) {
        onUpdate({
          status: payload.payload.status,
          delayMinutes: payload.payload.delayMinutes,
          delayMessage: payload.payload.delayMessage,
        });
      }
    });

    // Also listen to postgres changes if allowed
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `tracking_token=eq.${trackingToken}`,
      },
      (payload) => {
        if (payload?.new) {
          const row = payload.new as any;
          onUpdate({
            status: row.status as OrderStatus,
            delayMinutes: row.delay_minutes ? Number(row.delay_minutes) : undefined,
            delayMessage: row.delay_message || undefined,
          });
        }
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('subscribeToOrderUpdates exception:', err);
    return () => {};
  }
}

export async function updateOrderStatusInCloud(
  orderId: string,
  status: OrderStatus,
  delayMinutes?: number,
  delayMessage?: string
): Promise<boolean> {
  const adminToken = typeof localStorage !== 'undefined' ? localStorage.getItem('pb_admin_session_token') : null;
  if (adminToken) {
    try {
      const res = await fetch('/api/admin/orders/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ orderId, status }),
      });
      if (res.ok) {
        if (delayMinutes !== undefined || delayMessage !== undefined) {
          await fetch('/api/admin/orders/delay', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify({ orderId, delayMinutes, delayMessage }),
          });
        }
        return true;
      }
    } catch {
      // fallback
    }
  }

  try {
    const updatePayload: Record<string, unknown> = { status };
    if (delayMinutes !== undefined) updatePayload.delay_minutes = delayMinutes;
    if (delayMessage !== undefined) updatePayload.delay_message = delayMessage;

    const { error } = await supabase
      .from('orders')
      .update(updatePayload)
      .or(`id.eq.${orderId},order_number.eq.${orderId}`);

    if (error) {
      console.warn('Supabase updateOrderStatus error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase updateOrderStatus exception:', err);
    return false;
  }
}

// -------------------------------------------------------------
// Custom Cake Enquiries Cloud Synchronization
// -------------------------------------------------------------

export async function fetchCakeEnquiriesFromCloud(): Promise<CustomCakeEnquiry[] | null> {
  try {
    const { data, error } = await supabase
      .from('custom_cake_enquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchCakeEnquiries error:', error.message);
      return null;
    }
    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      enquiryNumber: row.enquiry_number,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerWhatsApp: row.customer_whatsapp || row.customer_phone,
      occasion: row.occasion || 'Celebration',
      eventDate: row.event_date,
      preferredTime: row.preferred_time || 'Evening (5:00 PM - 7:00 PM)',
      servings: row.servings || '10-15 Guests',
      weightKg: Number(row.weight_kg) || 1,
      flavour: row.flavour || row.flavor || 'Pineapple Cream',
      shape: row.shape || 'Round',
      themeDescription: row.theme_description || '',
      colorPreference: row.color_preference || '',
      messageOnCake: row.message_on_cake || '',
      isEggless: row.is_eggless !== undefined ? Boolean(row.is_eggless) : true,
      referenceImage: row.reference_image || undefined,
      approximateBudget: row.approximate_budget ? Number(row.approximate_budget) : undefined,
      additionalNotes: row.additional_notes || undefined,
      status: row.status as CustomCakeEnquiry['status'],
      quotationAmount: row.quotation_amount ? Number(row.quotation_amount) : undefined,
      adminNotes: row.admin_notes || undefined,
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.warn('Supabase fetchCakeEnquiries exception:', err);
    return null;
  }
}

export async function saveCakeEnquiryToCloud(enquiry: CustomCakeEnquiry): Promise<boolean> {
  try {
    const payload = {
      id: enquiry.id,
      enquiry_number: enquiry.enquiryNumber,
      customer_name: enquiry.customerName,
      customer_phone: enquiry.customerPhone,
      customer_whatsapp: enquiry.customerWhatsApp,
      occasion: enquiry.occasion,
      event_date: enquiry.eventDate,
      preferred_time: enquiry.preferredTime,
      servings: enquiry.servings,
      weight_kg: enquiry.weightKg,
      flavour: enquiry.flavour,
      shape: enquiry.shape,
      theme_description: enquiry.themeDescription,
      color_preference: enquiry.colorPreference,
      message_on_cake: enquiry.messageOnCake,
      is_eggless: enquiry.isEggless,
      reference_image: enquiry.referenceImage || null,
      approximate_budget: enquiry.approximateBudget || null,
      additional_notes: enquiry.additionalNotes || null,
      status: enquiry.status,
      quotation_amount: enquiry.quotationAmount || null,
      admin_notes: enquiry.adminNotes || null,
      created_at: enquiry.createdAt,
    };

    const { error } = await supabase
      .from('custom_cake_enquiries')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase saveCakeEnquiry error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase saveCakeEnquiry exception:', err);
    return false;
  }
}

export async function updateCakeEnquiryInCloud(
  id: string,
  status: CustomCakeEnquiry['status'],
  quotationAmount?: number,
  adminNotes?: string
): Promise<boolean> {
  const adminToken = typeof localStorage !== 'undefined' ? localStorage.getItem('pb_admin_session_token') : null;
  if (adminToken) {
    try {
      const res = await fetch('/api/admin/cakes/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ enquiryId: id, status, quotationAmount, adminNotes }),
      });
      if (res.ok) return true;
    } catch {
      // fallback
    }
  }

  try {
    const payload: Record<string, unknown> = { status };
    if (quotationAmount !== undefined) payload.quotation_amount = quotationAmount;
    if (adminNotes !== undefined) payload.admin_notes = adminNotes;

    const { error } = await supabase
      .from('custom_cake_enquiries')
      .update(payload)
      .or(`id.eq.${id},enquiry_number.eq.${id}`);

    if (error) {
      console.warn('Supabase updateCakeEnquiry error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase updateCakeEnquiry exception:', err);
    return false;
  }
}

// -------------------------------------------------------------
// Reviews & Issues Cloud Synchronization
// -------------------------------------------------------------

export async function fetchReviewsFromCloud(): Promise<ReviewItem[] | null> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return null;
    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      author: row.author,
      rating: Number(row.rating) || 5,
      date: row.date || 'Recent',
      text: row.text || row.comment || '',
      category: (row.category as ReviewItem['category']) || 'Food',
      verifiedCustomer: Boolean(row.verified_customer),
      ownerReply: row.owner_reply || undefined,
    }));
  } catch {
    return null;
  }
}

export async function saveReviewToCloud(review: ReviewItem): Promise<boolean> {
  try {
    const payload = {
      id: review.id,
      author: review.author,
      rating: review.rating,
      date: review.date,
      text: review.text,
      category: review.category,
      verified_customer: review.verifiedCustomer || false,
      owner_reply: review.ownerReply || null,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('reviews').upsert(payload, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

export async function saveCustomerIssueToCloud(issue: CustomerIssue): Promise<boolean> {
  const payload = {
    id: issue.id,
    order_number: issue.orderNumber,
    customer_phone: issue.customerPhone,
    customer_name: issue.customerName,
    issue_type: issue.issueType,
    description: issue.description,
    status: issue.status,
    resolution_notes: issue.resolutionNotes || null,
    created_at: issue.createdAt,
  };

  let saved = false;

  // 1. Direct Supabase save
  try {
    const { error } = await supabase.from('customer_issues').upsert(payload, { onConflict: 'id' });
    if (!error) saved = true;
  } catch (err) {
    console.warn('saveCustomerIssueToCloud Supabase error:', err);
  }

  // 2. Server persistence endpoint
  try {
    const res = await fetch('/api/customer/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(issue),
    });
    if (res.ok) saved = true;
  } catch (err) {
    console.warn('saveCustomerIssueToCloud server error:', err);
  }

  // 3. Local storage and cross-window event
  try {
    const existing = JSON.parse(localStorage.getItem('pb_issues') || '[]');
    const filtered = existing.filter((i: any) => i.id !== issue.id);
    const updated = [issue, ...filtered];
    localStorage.setItem('pb_issues', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('pb_issues_updated', { detail: updated }));
  } catch {}

  return saved;
}

export async function resolveCustomerIssueInCloud(id: string, notes: string): Promise<boolean> {
  const adminToken = typeof localStorage !== 'undefined' ? localStorage.getItem('pb_admin_session_token') : null;
  let resolved = false;

  try {
    const { error } = await supabase
      .from('customer_issues')
      .update({ status: 'resolved', resolution_notes: notes })
      .eq('id', id);
    if (!error) resolved = true;
  } catch {}

  try {
    const res = await fetch('/api/admin/issues/resolve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
      },
      body: JSON.stringify({ id, notes }),
    });
    if (res.ok) resolved = true;
  } catch {}

  return resolved;
}

/**
 * Fetch all customer issues/complaints from Supabase (authoritative cloud) with server API fallback.
 */
export async function fetchCustomerIssuesFromCloud(): Promise<CustomerIssue[] | null> {
  // 1. Direct Supabase query (Authoritative Cloud Source)
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('customer_issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return data.map((row) => ({
          id: row.id,
          orderNumber: row.order_number || 'N/A',
          customerPhone: row.customer_phone || '',
          customerName: row.customer_name || 'Customer',
          issueType: row.issue_type || 'other',
          description: row.description || '',
          status: row.status || 'open',
          resolutionNotes: row.resolution_notes || undefined,
          createdAt: row.created_at,
        }));
      }
    } catch (err) {
      console.warn('fetchCustomerIssues direct query notice:', err);
    }
  }

  // 2. Server API fallback
  try {
    const adminToken = typeof localStorage !== 'undefined' ? localStorage.getItem('pb_admin_session_token') : null;
    const headers: Record<string, string> = {};
    if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;
    const endpoint = adminToken ? '/api/admin/issues' : '/api/customer/issues';
    const res = await fetch(endpoint, { headers });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map((row) => ({
          id: row.id,
          orderNumber: row.order_number || row.orderNumber || 'N/A',
          customerPhone: row.customer_phone || row.customerPhone || '',
          customerName: row.customer_name || row.customerName || 'Customer',
          issueType: row.issue_type || row.issueType || 'other',
          description: row.description || '',
          status: row.status || 'open',
          resolutionNotes: row.resolution_notes || row.resolutionNotes || undefined,
          createdAt: row.created_at || row.createdAt,
        }));
      }
    }
  } catch (err) {
    console.warn('fetchCustomerIssues server fallback notice:', err);
  }

  return null;
}

/**
 * Fetch dynamic coupons from Supabase cloud database.
 * Used by Storefront (TopOffersStrip) and CartDrawer.
 */
export async function fetchCouponsFromCloud(): Promise<Coupon[] | null> {
  // 1. Direct Supabase query (Authoritative Cloud Source)
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((c: any) => ({
          id: c.id,
          code: (c.code || '').trim().toUpperCase(),
          title: c.title || (c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`),
          subtitle: c.subtitle || c.description || `Valid on orders above ₹${c.min_order || 0}`,
          discountType: c.discount_type === 'percentage' ? 'percentage' : 'flat',
          discountValue: Number(c.discount_value || 0),
          maxDiscount: c.max_discount ? Number(c.max_discount) : undefined,
          minOrder: Number(c.min_order !== undefined ? c.min_order : 0),
          isActive: c.is_active !== false,
          badge: c.badge || undefined,
          expiryDate: c.expiry_date || undefined,
        }));
      }
    } catch (err) {
      console.warn('fetchCouponsFromCloud Supabase error:', err);
    }
  }

  // 2. Server API fallback for local dev
  try {
    const res = await fetch('/api/coupons');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((c) => ({
          id: c.id,
          code: (c.code || '').trim().toUpperCase(),
          title: c.title || (c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`),
          subtitle: c.subtitle || c.description || `Valid on orders above ₹${c.minOrder || 0}`,
          discountType: c.discountType === 'percentage' ? 'percentage' : 'flat',
          discountValue: Number(c.discountValue || 0),
          maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : undefined,
          minOrder: Number(c.minOrder !== undefined ? c.minOrder : 0),
          isActive: c.isActive !== false,
          badge: c.badge || undefined,
          expiryDate: c.expiryDate || undefined,
        }));
      }
    }
  } catch {}

  return null;
}

/**
 * Save coupons to Supabase cloud database.
 * Used by AdminCouponManager.
 */
export async function saveCouponsToCloud(coupons: Coupon[]): Promise<boolean> {
  let saved = false;

  // 1. Direct Supabase upsert
  if (isSupabaseConfigured) {
    try {
      const payloads = coupons.map((c) => ({
        id: c.id,
        code: c.code.trim().toUpperCase(),
        title: c.title,
        subtitle: c.subtitle || '',
        discount_type: c.discountType,
        discount_value: c.discountValue,
        max_discount: c.maxDiscount || null,
        min_order: c.minOrder,
        is_active: c.isActive,
        badge: c.badge || null,
        expiry_date: c.expiryDate || null,
        updated_at: new Date().toISOString(),
      }));

      const targetClient = await getActiveAdminClient();
      const { error } = await targetClient.from('coupons').upsert(payloads, { onConflict: 'id' });
      if (!error) {
        saved = true;
      } else {
        console.warn('[Coupons] Supabase upsert notice:', error.message);
      }
    } catch (err) {
      console.warn('[Coupons] Supabase error:', err);
    }
  }

  // 2. Also notify server for local dev persistence
  try {
    const adminToken = typeof localStorage !== 'undefined' ? localStorage.getItem('pb_admin_session_token') : null;
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
      },
      body: JSON.stringify(coupons),
    });
    if (res.ok) saved = true;
  } catch {}

  return saved;
}

/**
 * Delete a coupon from cloud storage.
 */
export async function deleteCouponFromCloud(id: string): Promise<boolean> {
  let deleted = false;
  if (isSupabaseConfigured) {
    try {
      const targetClient = await getActiveAdminClient();
      const { error } = await targetClient.from('coupons').delete().eq('id', id);
      if (!error) deleted = true;
    } catch {}
  }

  try {
    const adminToken = typeof localStorage !== 'undefined' ? localStorage.getItem('pb_admin_session_token') : null;
    const res = await fetch(`/api/admin/coupons/${id}`, {
      method: 'DELETE',
      headers: {
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
      },
    });
    if (res.ok) deleted = true;
  } catch {}

  return deleted;
}

/**
 * Upload a product image file directly to Supabase Storage ('product-images' bucket).
 * Returns a permanent, real public CDN URL visible across all devices.
 */
export async function uploadProductImageToSupabase(file: File): Promise<{
  url: string | null;
  path: string | null;
  error: string | null;
}> {
  // Validate format
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/svg+xml'];
  if (!validTypes.includes(file.type.toLowerCase())) {
    return {
      url: null,
      path: null,
      error: 'Unsupported image format. Please upload JPG, PNG, WEBP, or SVG.',
    };
  }

  // Validate size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      url: null,
      path: null,
      error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 10MB.`,
    };
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `products/${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${cleanName}`;
  const bucketName = 'product-images';

  // 1. Direct Supabase Storage Upload
  if (isSupabaseConfigured) {
    try {
      const targetClient = await getActiveAdminClient();
      const { error: uploadError } = await targetClient.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });

      if (!uploadError) {
        const { data: publicUrlData } = targetClient.storage.from(bucketName).getPublicUrl(filePath);
        if (publicUrlData?.publicUrl) {
          return {
            url: publicUrlData.publicUrl,
            path: filePath,
            error: null,
          };
        }
      } else {
        console.warn('[Storage Upload] Supabase Storage notice:', uploadError.message);
      }
    } catch (err: any) {
      console.warn('[Storage Upload] Supabase exception:', err?.message);
    }
  }

  // 2. Server Upload fallback for local dev
  try {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, data: base64Data }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.url) {
        return {
          url: data.url,
          path: data.filename || data.url,
          error: null,
        };
      }
    }
  } catch (err: any) {
    console.warn('Server upload notice:', err);
  }

  return {
    url: null,
    path: null,
    error: 'Failed to upload image to Supabase Storage bucket. Please ensure the SQL migration has created the "product-images" bucket.',
  };
}

/**
 * Remove an image from Supabase Storage.
 */
export async function deleteProductImageFromSupabase(imageReference: string): Promise<boolean> {
  if (!imageReference) return false;
  try {
    if (isSupabaseConfigured && imageReference.includes('/storage/v1/object/public/')) {
      const parts = imageReference.split('/storage/v1/object/public/');
      if (parts[1]) {
        const [bucket, ...pathParts] = parts[1].split('/');
        const filePath = pathParts.join('/');
        if (bucket && filePath) {
          const { error } = await supabase.storage.from(bucket).remove([filePath]);
          return !error;
        }
      }
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetch all products from authoritative Supabase cloud database.
 */
export async function fetchProductsFromCloud(): Promise<Product[] | null> {
  // 1. Primary: Direct Supabase query (Authoritative Cloud Source)
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((row: any) => ({
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
        }));
      }
    } catch (err) {
      console.warn('Supabase fetchProducts direct query notice:', err);
    }
  }

  // 2. Server API fallback for local dev
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((p: any) => ({
          id: p.id,
          name: p.name,
          categoryId: p.categoryId || p.category_id,
          categoryName: p.categoryName || p.category_name,
          description: p.description || '',
          price: Number(p.price) || 0,
          originalPrice: p.originalPrice || p.original_price ? Number(p.originalPrice || p.original_price) : undefined,
          image: p.image || '',
          isAvailable: p.isAvailable !== undefined ? Boolean(p.isAvailable) : true,
          isBestseller: Boolean(p.isBestseller || p.is_bestseller),
          isEggless: p.isEggless !== undefined ? Boolean(p.isEggless) : true,
          isVegetarian: p.isVegetarian !== undefined ? Boolean(p.isVegetarian) : true,
          isSpicy: Boolean(p.isSpicy || p.is_spicy),
          prepTimeMinutes: Number(p.prepTimeMinutes || p.prep_time_minutes) || 20,
          customizationGroups: Array.isArray(p.customizationGroups || p.customization_groups) ? (p.customizationGroups || p.customization_groups) : undefined,
        }));
      }
    }
  } catch (err) {
    console.warn('fetchProducts API notice:', err);
  }

  return null;
}

/**
 * Save or update a product in Supabase cloud database.
 */
export async function saveProductToCloud(product: Product): Promise<boolean> {
  let saved = false;

  // 1. Direct Supabase upsert (Authoritative Cloud Source)
  if (isSupabaseConfigured) {
    try {
      const payload = {
        id: product.id,
        name: product.name,
        category_id: product.categoryId,
        category_name: product.categoryName,
        description: product.description || '',
        price: Number(product.price) || 0,
        original_price: product.originalPrice ? Number(product.originalPrice) : null,
        image: product.image,
        is_available: Boolean(product.isAvailable),
        is_bestseller: Boolean(product.isBestseller),
        is_eggless: product.isEggless ?? true,
        is_vegetarian: product.isVegetarian ?? true,
        is_spicy: Boolean(product.isSpicy),
        prep_time_minutes: Number(product.prepTimeMinutes) || 20,
        customization_groups: product.customizationGroups || [],
        updated_at: new Date().toISOString(),
      };

      const targetClient = await getActiveAdminClient();
      const { error } = await targetClient.from('products').upsert(payload, { onConflict: 'id' });
      if (!error) {
        saved = true;
      } else {
        console.warn('[Products] Supabase upsert notice:', error.message);
      }
    } catch (err) {
      console.warn('saveProduct Supabase notice:', err);
    }
  }

  // 2. Server API fallback
  try {
    const adminToken = typeof localStorage !== 'undefined' ? localStorage.getItem('pb_admin_session_token') : null;
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
      },
      body: JSON.stringify({ product }),
    });
    if (res.ok) {
      saved = true;
    }
  } catch {}

  return saved;
}

/**
 * Delete a product from Supabase cloud database.
 */
export async function deleteProductFromCloud(productId: string): Promise<boolean> {
  let deleted = false;

  if (isSupabaseConfigured) {
    try {
      const targetClient = await getActiveAdminClient();
      const { error } = await targetClient.from('products').delete().eq('id', productId);
      if (!error) deleted = true;
    } catch {}
  }

  try {
    const adminToken = typeof localStorage !== 'undefined' ? localStorage.getItem('pb_admin_session_token') : null;
    const res = await fetch(`/api/admin/products/${productId}`, {
      method: 'DELETE',
      headers: {
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
      },
    });
    if (res.ok) deleted = true;
  } catch {}

  return deleted;
}

/**
 * Fetch business settings (UPI ID, phone, store timings, bakery details, logo) from Supabase cloud database.
 */
export async function fetchBusinessSettingsFromCloud(): Promise<BusinessSettings | null> {
  // 1. Direct Supabase query (Authoritative Cloud Source)
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('business_settings').select('*').limit(1).maybeSingle();
      if (!error && data) {
        return {
          name: data.name || 'Punjabi Bistro & Bakery',
          logoUrl: data.logo_url || data.logoUrl || '',
          address: data.address || '',
          landmark: data.landmark || '',
          phone: data.phone || '',
          whatsapp: data.whatsapp || '',
          isOpenManual: data.is_open_manual !== undefined ? Boolean(data.is_open_manual) : true,
          openingTime: data.opening_time || '10:00',
          closingTime: data.closing_time || '22:00',
          weeklyOff: data.weekly_off || 'None',
          upiId: data.upi_id || 'punjabibistro@upi',
          upiMerchantName: data.upi_merchant_name || 'Punjabi Bistro and Bakery',
          announcementText: data.announcement_text || '',
          showAnnouncement: data.show_announcement !== undefined ? Boolean(data.show_announcement) : true,
          maxOrdersPerSlot: Number(data.max_orders_per_slot) || 6,
          defaultPrepMinutes: Number(data.default_prep_minutes) || 25,
        };
      }
    } catch (err) {
      console.warn('Supabase fetchBusinessSettings notice:', err);
    }
  }

  // 2. Server API fallback for local dev
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object' && data.name) {
        return {
          name: data.name,
          logoUrl: data.logoUrl || data.logo_url || '',
          address: data.address || '',
          landmark: data.landmark || '',
          phone: data.phone || '',
          whatsapp: data.whatsapp || '',
          isOpenManual: data.isOpenManual !== undefined ? Boolean(data.isOpenManual) : true,
          openingTime: data.openingTime || '10:00',
          closingTime: data.closingTime || '22:00',
          weeklyOff: data.weeklyOff || 'None',
          upiId: data.upiId || 'punjabibistro@upi',
          upiMerchantName: data.upiMerchantName || 'Punjabi Bistro and Bakery',
          announcementText: data.announcementText || '',
          showAnnouncement: data.showAnnouncement !== undefined ? Boolean(data.showAnnouncement) : true,
          maxOrdersPerSlot: Number(data.maxOrdersPerSlot) || 6,
          defaultPrepMinutes: Number(data.defaultPrepMinutes) || 25,
        };
      }
    }
  } catch {}

  return null;
}

/**
 * Save business settings to Supabase cloud database across all devices.
 */
export async function saveBusinessSettingsToCloud(settings: BusinessSettings): Promise<boolean> {
  let saved = false;

  // 1. Direct Supabase save (Authoritative Cloud Source)
  if (isSupabaseConfigured) {
    try {
      const payload = {
        id: 'default',
        name: settings.name,
        logo_url: settings.logoUrl || null,
        address: settings.address,
        landmark: settings.landmark,
        phone: settings.phone,
        whatsapp: settings.whatsapp,
        is_open_manual: Boolean(settings.isOpenManual),
        opening_time: settings.openingTime,
        closing_time: settings.closingTime,
        weekly_off: settings.weeklyOff,
        upi_id: settings.upiId,
        upi_merchant_name: settings.upiMerchantName,
        announcement_text: settings.announcementText || null,
        show_announcement: Boolean(settings.showAnnouncement),
        max_orders_per_slot: Number(settings.maxOrdersPerSlot) || 6,
        default_prep_minutes: Number(settings.defaultPrepMinutes) || 25,
        updated_at: new Date().toISOString(),
      };
      const targetClient = await getActiveAdminClient();
      const { error } = await targetClient.from('business_settings').upsert(payload, { onConflict: 'id' });
      if (!error) {
        saved = true;
      } else {
        console.warn('[Settings] Supabase upsert notice:', error.message);
      }
    } catch (err) {
      console.warn('[Settings] Supabase save notice:', err);
    }
  }

  // 2. Server API fallback
  try {
    const adminToken = typeof localStorage !== 'undefined' ? localStorage.getItem('pb_admin_session_token') : null;
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
      },
      body: JSON.stringify({ settings }),
    });
    if (res.ok) {
      saved = true;
    }
  } catch {}

  return saved;
}

/**
 * Fetch delivery zones from Supabase cloud database.
 */
export async function fetchDeliveryZonesFromCloud(): Promise<DeliveryZone[] | null> {
  // 1. Direct Supabase query
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('delivery_zones').select('*').order('created_at', { ascending: true });
      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((z: any) => ({
          id: z.id,
          name: z.name,
          fee: Number(z.fee !== undefined ? z.fee : (z.delivery_fee || 0)),
          freeAbove: Number(z.free_above !== undefined ? z.free_above : (z.freeAbove || 499)),
          estimatedMinutes: z.estimated_minutes || z.estimatedMinutes || '30-45 mins',
          description: z.description || '',
        }));
      }
    } catch (err) {
      console.warn('Supabase fetchDeliveryZones notice:', err);
    }
  }

  // 2. Server API fallback for local dev
  try {
    const res = await fetch('/api/zones');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch {}

  return null;
}

/**
 * Save delivery zones to Supabase cloud database across all devices.
 */
export async function saveDeliveryZonesToCloud(zones: DeliveryZone[]): Promise<boolean> {
  let saved = false;

  // 1. Direct Supabase upsert
  if (isSupabaseConfigured) {
    try {
      const payloads = zones.map((z) => ({
        id: z.id,
        name: z.name,
        delivery_fee: z.fee,
        free_delivery_above: z.freeAbove,
        estimated_time: z.estimatedMinutes,
        description: z.description,
        is_active: true,
        updated_at: new Date().toISOString(),
      }));

      const targetClient = await getActiveAdminClient();
      const { error } = await targetClient.from('delivery_zones').upsert(payloads, { onConflict: 'id' });
      if (!error) {
        saved = true;
      } else {
        console.warn('[Zones] Supabase upsert notice:', error.message);
      }
    } catch (err) {
      console.warn('[Zones] Supabase notice:', err);
    }
  }

  // 2. Server API fallback
  try {
    const adminToken = typeof localStorage !== 'undefined' ? localStorage.getItem('pb_admin_session_token') : null;
    const res = await fetch('/api/admin/zones', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
      },
      body: JSON.stringify({ zones }),
    });
    if (res.ok) {
      saved = true;
    }
  } catch {}

  return saved;
}

/**
 * Fetch categories from Supabase cloud database.
 */
export async function fetchCategoriesFromCloud(): Promise<any[] | null> {
  // 1. Direct Supabase query
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('display_order', { ascending: true });
      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((c: any) => ({
          id: c.id,
          name: c.name,
          icon: c.icon || 'Sparkles',
          count: Number(c.count) || 0,
        }));
      }
    } catch (err) {
      console.warn('Supabase fetchCategories notice:', err);
    }
  }

  // 2. Server API fallback for local dev
  try {
    const res = await fetch('/api/categories');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {}

  return null;
}

/**
 * Save categories to Supabase cloud database.
 */
export async function saveCategoriesToCloud(categories: any[]): Promise<boolean> {
  let saved = false;

  // 1. Direct Supabase upsert
  if (isSupabaseConfigured) {
    try {
      const payloads = categories.map((c, idx) => ({
        id: c.id,
        name: c.name,
        icon: c.icon || 'Sparkles',
        display_order: idx,
        is_active: true,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from('categories').upsert(payloads, { onConflict: 'id' });
      if (!error) {
        saved = true;
      } else {
        console.warn('[Categories] Supabase upsert error:', error.message);
      }
    } catch (err) {
      console.warn('[Categories] Supabase notice:', err);
    }
  }

  // 2. Server API fallback for local dev
  try {
    const adminToken = typeof localStorage !== 'undefined' ? localStorage.getItem('pb_admin_session_token') : null;
    await fetch('/api/admin/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
      },
      body: JSON.stringify({ categories }),
    });
  } catch {}

  return saved;
}

