import { createClient, User, Session } from '@supabase/supabase-js';
import { Order, CustomCakeEnquiry, ReviewItem, CustomerIssue, OrderStatus, Product, CustomerProfile } from '../types';

// Supabase project credentials (provided by user)
export const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  'https://mlbjulhzbhnqkzzohgcm.supabase.co';
export const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  'sb_publishable_wepmD-cYmB4FyuoS2EByeA_pzfVNM_c';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Create client with auto-refresh and realtime capabilities
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
  const cleanItems = rawItems.filter((i: any) => !i || !i._meta);

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
 * Dual-layer high reliability:
 * 1. Fast server endpoint (/api/orders) that executes database persistence in ~300ms.
 * 2. Resilient direct-client fallback with timeout protection and schema column recovery.
 * 3. Metadata (userId, customerEmail, trackingToken) permanently embedded in items JSONB array.
 */
export async function saveOrderToCloud(
  order: Order
): Promise<{ success: boolean; error?: string; order?: Order }> {
  const token = order.trackingToken || generateTrackingToken();
  const confirmedOrder: Order = {
    ...order,
    trackingToken: token,
  };

  // Primary: Attempt fast server-side persistence via /api/orders
  try {
    const serverPromise = fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(confirmedOrder),
    });

    const res = await withTimeout(serverPromise, 5000);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.order) {
        return { success: true, order: data.order };
      }
    }
  } catch (serverErr) {
    console.warn('Server /api/orders attempt failed or timed out, falling back to direct client Supabase:', serverErr);
  }

  // Secondary Fallback: Direct Client-Side Supabase Persistence
  try {
    // Embed metadata inside the items JSON array to preserve customer ownership & tracking
    // permanently in the database even before dedicated columns are added.
    const itemsWithMeta = [
      ...order.items.filter((i: any) => !i || !i._meta),
      {
        _meta: {
          userId: order.userId || null,
          customerEmail: order.customerEmail || null,
          trackingToken: token,
          orderNumber: order.orderNumber,
        },
      },
    ];

    // Base payload matching guaranteed Supabase orders columns
    const payload: Record<string, any> = {
      id: order.id,
      order_number: order.orderNumber,
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
      status: order.status,
      order_notes: order.orderNotes || null,
      is_no_contact_delivery: Boolean(order.isNoContactDelivery),
      created_at: order.createdAt || new Date().toISOString(),
      estimated_delivery_time: order.estimatedDeliveryTime || null,
      delay_minutes: order.delayMinutes || null,
      delay_message: order.delayMessage || null,
    };

    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const upsertPromise = supabase
        .from('orders')
        .upsert(payload, { onConflict: 'id' })
        .select();

      const { data, error } = (await withTimeout(upsertPromise as any, 7000)) as any;

      if (!error) {
        return { success: true, order: confirmedOrder };
      }

      // Check for missing column error (PGRST204)
      const colMatch = error.message.match(/Could not find the '([^']+)' column/);
      if (colMatch && colMatch[1] && payload.hasOwnProperty(colMatch[1])) {
        const missingCol = colMatch[1];
        delete payload[missingCol];
        continue;
      }

      console.error('Supabase saveOrder direct error:', error);
      return { success: false, error: error.message };
    }

    return { success: false, error: 'Database order insertion exceeded retries' };
  } catch (err: any) {
    console.error('Supabase saveOrder exception:', err);
    return { success: false, error: err?.message || 'Network exception while saving order' };
  }
}

/**
 * Fetches all orders belonging to a specific customer.
 */
export async function fetchCustomerOrdersFromCloud(
  userId: string,
  email?: string,
  phone?: string
): Promise<Order[]> {
  if (!userId && !email && !phone) return [];

  // 1. Primary: Server endpoint with fast relational query
  try {
    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    if (email) params.set('email', email);
    if (phone) params.set('phone', phone);

    const res = await withTimeout(fetch(`/api/customer/orders?${params.toString()}`), 5000);
    if (res.ok) {
      const serverOrders = await res.json();
      if (Array.isArray(serverOrders) && serverOrders.length > 0) {
        return serverOrders.map(mapRowToOrder);
      }
    }
  } catch (serverErr) {
    console.warn('Customer orders server query notice:', serverErr);
  }

  // 2. Secondary: Direct client Supabase query with timeout
  try {
    const queryPromise = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: allData, error: allErr } = (await withTimeout(queryPromise as any, 7000)) as any;

    if (!allErr && Array.isArray(allData)) {
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPhone = (phone || '').replace(/\D/g, '');

      const matched = allData.filter((row: any) => {
        if (userId && row.user_id === userId) return true;
        if (cleanEmail && row.customer_email && row.customer_email.toLowerCase() === cleanEmail) return true;

        if (Array.isArray(row.items)) {
          const meta = row.items.find((i: any) => i && i._meta)?._meta;
          if (meta) {
            if (userId && meta.userId === userId) return true;
            if (cleanEmail && meta.customerEmail && meta.customerEmail.toLowerCase() === cleanEmail) return true;
          }
        }

        if (cleanPhone.length >= 10) {
          const dbPhone = String(row.customer_phone || '').replace(/\D/g, '');
          if (dbPhone && (dbPhone === cleanPhone || dbPhone.endsWith(cleanPhone) || cleanPhone.endsWith(dbPhone))) {
            return true;
          }
        }

        return false;
      });

      return matched.map(mapRowToOrder);
    }

    return [];
  } catch (err) {
    console.warn('fetchCustomerOrdersFromCloud error:', err);
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
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      return {
        userId: data.user_id,
        fullName: data.full_name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        landmark: data.landmark || '',
        city: data.city || 'Dharamkot',
        state: data.state || 'Himachal Pradesh',
        pincode: data.pincode || '176219',
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
    const payload = {
      user_id: profile.userId,
      full_name: profile.fullName,
      email: profile.email,
      phone: profile.phone || null,
      address: profile.address || null,
      landmark: profile.landmark || null,
      city: profile.city || 'Dharamkot',
      state: profile.state || 'Himachal Pradesh',
      pincode: profile.pincode || '176219',
      delivery_instructions: profile.deliveryInstructions || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('customer_profiles')
      .upsert(payload, { onConflict: 'user_id' });

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
  try {
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

    const { error } = await supabase.from('customer_issues').upsert(payload, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

export async function resolveCustomerIssueInCloud(id: string, notes: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('customer_issues')
      .update({ status: 'resolved', resolution_notes: notes })
      .eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Upload a product image file to Supabase Storage ('product-images' bucket).
 * Validates image mime type (JPEG, PNG, WEBP) and file size (up to 10MB).
 * Returns the public URL on success or an error message on failure.
 */
export async function uploadProductImageToSupabase(file: File): Promise<{
  url: string | null;
  path: string | null;
  error: string | null;
}> {
  if (!isSupabaseConfigured) {
    return {
      url: null,
      path: null,
      error: 'Supabase credentials are not configured.',
    };
  }

  // Validate format
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!validTypes.includes(file.type.toLowerCase())) {
    return {
      url: null,
      path: null,
      error: 'Unsupported image format. Please upload JPG, PNG, or WEBP.',
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
  const primaryBucket = 'product-images';
  const fallbackBucket = 'products';

  try {
    let chosenBucket = primaryBucket;
    let { data: uploadData, error: uploadError } = await supabase.storage
      .from(primaryBucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      // If primary bucket not found, try fallback bucket
      if (
        uploadError.message.toLowerCase().includes('not found') ||
        uploadError.message.toLowerCase().includes('bucket')
      ) {
        const fallbackRes = await supabase.storage.from(fallbackBucket).upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });

        if (!fallbackRes.error) {
          chosenBucket = fallbackBucket;
          uploadError = null;
        }
      }
    }

    if (uploadError) {
      return {
        url: null,
        path: null,
        error: uploadError.message || 'Failed to upload image to Supabase Storage.',
      };
    }

    const { data: publicUrlData } = supabase.storage.from(chosenBucket).getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      return {
        url: null,
        path: null,
        error: 'Failed to retrieve public image URL from Supabase Storage.',
      };
    }

    return {
      url: publicUrlData.publicUrl,
      path: filePath,
      error: null,
    };
  } catch (err: unknown) {
    return {
      url: null,
      path: null,
      error: err instanceof Error ? err.message : 'Unknown storage upload error',
    };
  }
}

/**
 * Remove an image from Supabase Storage if it was uploaded there.
 */
export async function deleteProductImageFromSupabase(imageReference: string): Promise<boolean> {
  if (!isSupabaseConfigured || !imageReference) return false;
  try {
    if (imageReference.includes('/storage/v1/object/public/')) {
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
 * Fetch all products from Supabase cloud database.
 */
export async function fetchProductsFromCloud(): Promise<Product[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Supabase fetchProducts notice:', error.message);
      return null;
    }
    if (!data || data.length === 0) return [];

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
  } catch (err) {
    console.warn('Supabase fetchProducts error:', err);
    return null;
  }
}

/**
 * Save or update a product in Supabase cloud database.
 */
export async function saveProductToCloud(product: Product): Promise<boolean> {
  const adminToken = typeof localStorage !== 'undefined' ? localStorage.getItem('pb_admin_session_token') : null;
  if (adminToken) {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ product }),
      });
      if (res.ok) return true;
    } catch {
      // fallback
    }
  }

  if (!isSupabaseConfigured) return false;
  try {
    const payload = {
      id: product.id,
      name: product.name,
      category_id: product.categoryId,
      category_name: product.categoryName,
      description: product.description || '',
      price: product.price,
      original_price: product.originalPrice || null,
      image: product.image,
      is_available: product.isAvailable,
      is_bestseller: product.isBestseller || false,
      is_eggless: product.isEggless ?? true,
      is_vegetarian: product.isVegetarian ?? true,
      is_spicy: product.isSpicy || false,
      prep_time_minutes: product.prepTimeMinutes || 20,
      customization_groups: product.customizationGroups || [],
    };

    const { error } = await supabase.from('products').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase saveProduct error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase saveProduct error:', err);
    return false;
  }
}

/**
 * Delete a product from Supabase cloud database.
 */
export async function deleteProductFromCloud(productId: string): Promise<boolean> {
  const adminToken = typeof localStorage !== 'undefined' ? localStorage.getItem('pb_admin_session_token') : null;
  if (adminToken) {
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (res.ok) return true;
    } catch {
      // fallback
    }
  }

  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      console.warn('Supabase deleteProduct error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase deleteProduct error:', err);
    return false;
  }
}
