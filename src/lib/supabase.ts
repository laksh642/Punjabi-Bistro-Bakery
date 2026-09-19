import { createClient, User, Session } from '@supabase/supabase-js';
import { Order, CustomCakeEnquiry, ReviewItem, CustomerIssue, OrderStatus, Product, AdminUser } from '../types';

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
    admin_users: boolean;
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
      admin_users: false,
      storage: false,
    },
  };

  if (!isSupabaseConfigured) {
    result.message = 'Supabase credentials are not configured.';
    return result;
  }

  try {
    const [ordersRes, cakesRes, reviewsRes, issuesRes, productsRes, adminsRes] = await Promise.all([
      supabase.from('orders').select('id').limit(1),
      supabase.from('custom_cake_enquiries').select('id').limit(1),
      supabase.from('reviews').select('id').limit(1),
      supabase.from('customer_issues').select('id').limit(1),
      supabase.from('products').select('id').limit(1),
      supabase.from('admin_users').select('id').limit(1),
    ]);

    result.tablesStatus.orders = !ordersRes.error;
    result.tablesStatus.cake_enquiries = !cakesRes.error;
    result.tablesStatus.reviews = !reviewsRes.error;
    result.tablesStatus.issues = !issuesRes.error;
    result.tablesStatus.products = !productsRes.error;
    result.tablesStatus.admin_users = !adminsRes.error;

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
      result.tablesStatus.admin_users,
    ].filter(Boolean).length;

    if (activeCount === 6) {
      result.message = 'All database tables and admin authorization synced in Supabase cloud.';
    } else if (activeCount > 0) {
      result.message = `Connected (${activeCount}/6 tables ready). Click 'Setup Schema' if needed.`;
    } else {
      result.message = 'Supabase reachable! Ready for initial database table creation.';
    }
  } catch (err: unknown) {
    result.connected = false;
    result.message = err instanceof Error ? err.message : 'Failed to connect to Supabase';
  }

  return result;
}

// -------------------------------------------------------------
// Orders Cloud Synchronization & Secure Tracking
// -------------------------------------------------------------

export function generateTrackingToken(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint8Array(24);
    window.crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return Array.from({ length: 48 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export function mapRowToOrder(row: any): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    trackingToken: row.tracking_token || '',
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    orderType: row.order_type,
    deliveryAddress: row.delivery_address || undefined,
    landmark: row.landmark || undefined,
    zoneId: row.zone_id || undefined,
    tableNumber: row.table_number || undefined,
    timeSlot: row.time_slot || 'asap',
    scheduledDate: row.scheduled_date || new Date().toISOString().split('T')[0],
    items: Array.isArray(row.items) ? row.items : [],
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

export async function saveOrderToCloud(order: Order): Promise<boolean> {
  try {
    const token = order.trackingToken || generateTrackingToken();
    const payload = {
      id: order.id,
      order_number: order.orderNumber,
      tracking_token: token,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      order_type: order.orderType,
      delivery_address: order.deliveryAddress || null,
      landmark: order.landmark || null,
      zone_id: order.zoneId || null,
      table_number: order.tableNumber || null,
      time_slot: order.timeSlot,
      scheduled_date: order.scheduledDate,
      items: order.items,
      subtotal: order.subtotal,
      delivery_fee: order.deliveryFee,
      discount: order.discount,
      coupon_code: order.couponCode || null,
      total: order.total,
      payment_method: order.paymentMethod,
      payment_status: order.paymentStatus,
      upi_txn_id: order.upiTxnId || null,
      status: order.status,
      order_notes: order.orderNotes || null,
      is_no_contact_delivery: order.isNoContactDelivery || false,
      created_at: order.createdAt,
      estimated_delivery_time: order.estimatedDeliveryTime || null,
      delay_minutes: order.delayMinutes || null,
      delay_message: order.delayMessage || null,
    };

    const { error } = await supabase.from('orders').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase saveOrder error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase saveOrder exception:', err);
    return false;
  }
}

export async function fetchOrderByToken(token: string): Promise<Order | null> {
  const cleanToken = token.trim().toLowerCase();
  if (!cleanToken || cleanToken.length < 16) return null;

  try {
    // 1. Try secure RPC function (Security Definer)
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_by_tracking_token', {
      p_token: cleanToken,
    });

    if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
      return mapRowToOrder(rpcData[0]);
    }

    // 2. Direct PostgREST query fallback (if custom policy or table exposure allows)
    const { data: directData, error: directError } = await supabase
      .from('orders')
      .select('*')
      .eq('tracking_token', cleanToken)
      .maybeSingle();

    if (!directError && directData) {
      return mapRowToOrder(directData);
    }

    if (rpcError && directError) {
      console.warn('Supabase fetchOrderByToken query note:', rpcError.message || directError.message);
    }
    return null;
  } catch (err) {
    console.warn('Supabase fetchOrderByToken exception:', err);
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
    // 1. Try secure RPC function (verifies order number AND customer phone simultaneously)
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_order_by_number_and_phone', {
      p_order_number: cleanNum,
      p_phone: cleanPhone,
    });

    if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
      return mapRowToOrder(rpcData[0]);
    }

    // 2. Direct query fallback
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

    return null;
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

// -------------------------------------------------------------
// Supabase Authentication & Admin Authorization (Google OAuth)
// -------------------------------------------------------------

/**
 * Sign in to the Admin Portal using Google OAuth via Supabase Auth.
 * Redirects back to /admin on the current origin (Netlify or preview).
 */
export async function signInWithGoogle(returnPath: string = '/admin'): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { error: new Error('Supabase is not configured. Please check environment variables.') };
  }

  try {
    const redirectUrl = `${window.location.origin}${returnPath}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    return { error: error ? new Error(error.message) : null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err : new Error('Failed to initiate Google OAuth') };
  }
}

/**
 * Sign out the currently authenticated admin, terminating the Supabase session.
 */
export async function signOutAdmin(): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured) return { error: null };
  try {
    const { error } = await supabase.auth.signOut();
    return { error: error ? new Error(error.message) : null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err : new Error('Failed to sign out') };
  }
}

/**
 * Check whether an authenticated user is an authorized bakery administrator in public.admin_users.
 */
export async function checkAdminAuthorization(userId: string): Promise<{
  isAuthorized: boolean;
  role: string | null;
  adminRecord: AdminUser | null;
  error: string | null;
}> {
  if (!isSupabaseConfigured || !userId) {
    return {
      isAuthorized: false,
      role: null,
      adminRecord: null,
      error: 'Supabase not configured or missing User ID',
    };
  }

  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, email, role, is_active, created_at')
      .eq('id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      if (error.code === '42P01') {
        return {
          isAuthorized: false,
          role: null,
          adminRecord: null,
          error: 'admin_users table not created yet in Supabase schema.',
        };
      }
      return {
        isAuthorized: false,
        role: null,
        adminRecord: null,
        error: error.message,
      };
    }

    if (data && data.is_active) {
      return {
        isAuthorized: true,
        role: data.role || 'admin',
        adminRecord: {
          id: data.id,
          email: data.email,
          role: data.role,
          isActive: data.is_active,
          createdAt: data.created_at,
        },
        error: null,
      };
    }

    return {
      isAuthorized: false,
      role: null,
      adminRecord: null,
      error: null,
    };
  } catch (err: unknown) {
    return {
      isAuthorized: false,
      role: null,
      adminRecord: null,
      error: err instanceof Error ? err.message : 'Unknown authorization error',
    };
  }
}

/**
 * Fetch all registered administrators from public.admin_users (authorized admin only).
 */
export async function fetchAdminUsers(): Promise<AdminUser[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Supabase fetchAdminUsers notice:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      email: row.email,
      role: row.role || 'admin',
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.warn('Supabase fetchAdminUsers error:', err);
    return [];
  }
}

/**
 * Add or update an administrator in public.admin_users.
 */
export async function saveAdminUser(admin: {
  id: string;
  email: string;
  role?: 'owner' | 'admin' | 'manager';
  isActive?: boolean;
}): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const payload = {
      id: admin.id,
      email: admin.email,
      role: admin.role || 'admin',
      is_active: admin.isActive !== undefined ? admin.isActive : true,
    };

    const { error } = await supabase.from('admin_users').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase saveAdminUser error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase saveAdminUser error:', err);
    return false;
  }
}

/**
 * Delete or revoke an administrator in public.admin_users.
 */
export async function deleteAdminUser(adminId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('admin_users').delete().eq('id', adminId);
    return !error;
  } catch {
    return false;
  }
}

export const SUPABASE_SETUP_SQL = `-- ==========================================================
-- Punjabi Bistro & Bakery, Dharamkot
-- Supabase Database Schema, Storage & Google OAuth RLS Security
-- ==========================================================

-- 1. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  tracking_token TEXT UNIQUE NOT NULL DEFAULT md5(random()::text || clock_timestamp()::text),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  order_type TEXT NOT NULL DEFAULT 'delivery',
  delivery_address TEXT,
  landmark TEXT,
  zone_id TEXT,
  table_number TEXT,
  time_slot TEXT DEFAULT 'asap',
  scheduled_date TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL,
  delivery_fee NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  coupon_code TEXT,
  total NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'cod',
  payment_status TEXT DEFAULT 'pending',
  upi_txn_id TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  order_notes TEXT,
  is_no_contact_delivery BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estimated_delivery_time TEXT,
  delay_minutes INTEGER,
  delay_message TEXT
);

-- Schema Migration: Add tracking_token column if missing and create indexes
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_token TEXT;
UPDATE public.orders SET tracking_token = md5(random()::text || id || clock_timestamp()::text) WHERE tracking_token IS NULL;
ALTER TABLE public.orders ALTER COLUMN tracking_token SET DEFAULT md5(random()::text || clock_timestamp()::text);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_tracking_token ON public.orders (tracking_token);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders (customer_phone);

-- 2. Custom Cake Enquiries Table
CREATE TABLE IF NOT EXISTS public.custom_cake_enquiries (
  id TEXT PRIMARY KEY,
  enquiry_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_whatsapp TEXT NOT NULL,
  occasion TEXT NOT NULL,
  event_date TEXT NOT NULL,
  preferred_time TEXT,
  servings TEXT,
  weight_kg NUMERIC NOT NULL,
  flavour TEXT NOT NULL,
  shape TEXT DEFAULT 'Round',
  theme_description TEXT,
  color_preference TEXT,
  message_on_cake TEXT,
  is_eggless BOOLEAN DEFAULT TRUE,
  reference_image TEXT,
  approximate_budget NUMERIC,
  additional_notes TEXT,
  status TEXT NOT NULL DEFAULT 'enquiry_received',
  quotation_amount NUMERIC,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Customer Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  author TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  date TEXT,
  text TEXT NOT NULL,
  category TEXT DEFAULT 'Food',
  verified_customer BOOLEAN DEFAULT FALSE,
  owner_reply TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Customer Issues & Late Delivery Reports Table
CREATE TABLE IF NOT EXISTS public.customer_issues (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Products Table (Menu Items & Live Pricing)
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  image TEXT NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  is_bestseller BOOLEAN DEFAULT FALSE,
  is_eggless BOOLEAN DEFAULT TRUE,
  is_vegetarian BOOLEAN DEFAULT TRUE,
  is_spicy BOOLEAN DEFAULT FALSE,
  prep_time_minutes INTEGER DEFAULT 20,
  customization_groups JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Authorized Admin Users Allowlist Table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Revoke all table-level access on admin_users from anonymous users
REVOKE ALL ON TABLE public.admin_users FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.admin_users TO authenticated;

-- 7. Hardened Security Definer Helper Functions for RLS
-- Checks if current calling session (auth.uid()) is an active administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE id = auth.uid() 
      AND is_active = true
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Checks if current calling session (auth.uid()) is an active owner or super_admin
CREATE OR REPLACE FUNCTION public.is_admin_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE id = auth.uid() 
      AND role IN ('owner', 'super_admin')
      AND is_active = true
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin_owner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_owner() TO authenticated;

-- 7b. Secure Order Lookup by Cryptographic Tracking Token
-- Exposes ONLY customer-safe fields; excludes internal tokens, payment transaction IDs, and customer phone
CREATE OR REPLACE FUNCTION public.get_order_by_tracking_token(p_token TEXT)
RETURNS TABLE (
  id TEXT,
  order_number TEXT,
  tracking_token TEXT,
  customer_name TEXT,
  order_type TEXT,
  delivery_address TEXT,
  landmark TEXT,
  table_number TEXT,
  time_slot TEXT,
  scheduled_date TEXT,
  items JSONB,
  subtotal NUMERIC,
  delivery_fee NUMERIC,
  discount NUMERIC,
  coupon_code TEXT,
  total NUMERIC,
  payment_method TEXT,
  payment_status TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  estimated_delivery_time TEXT,
  delay_minutes INTEGER,
  delay_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_token TEXT;
BEGIN
  v_token := trim(p_token);
  IF v_token IS NULL OR length(v_token) < 16 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    o.id,
    o.order_number,
    o.tracking_token,
    o.customer_name,
    o.order_type,
    o.delivery_address,
    o.landmark,
    o.table_number,
    o.time_slot,
    o.scheduled_date,
    o.items,
    o.subtotal,
    o.delivery_fee,
    o.discount,
    o.coupon_code,
    o.total,
    o.payment_method,
    o.payment_status,
    o.status,
    o.created_at,
    o.estimated_delivery_time,
    o.delay_minutes,
    o.delay_message
  FROM public.orders o
  WHERE o.tracking_token = v_token
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_order_by_tracking_token(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_by_tracking_token(TEXT) TO anon, authenticated;

-- 7c. Secure Order Lookup by Order Number AND Exact Normalized Phone Verification
-- Verifies ownership without exposing full table or PII; returns at most 1 matching order
CREATE OR REPLACE FUNCTION public.get_order_by_number_and_phone(p_order_number TEXT, p_phone TEXT)
RETURNS TABLE (
  id TEXT,
  order_number TEXT,
  tracking_token TEXT,
  customer_name TEXT,
  order_type TEXT,
  delivery_address TEXT,
  landmark TEXT,
  table_number TEXT,
  time_slot TEXT,
  scheduled_date TEXT,
  items JSONB,
  subtotal NUMERIC,
  delivery_fee NUMERIC,
  discount NUMERIC,
  coupon_code TEXT,
  total NUMERIC,
  payment_method TEXT,
  payment_status TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  estimated_delivery_time TEXT,
  delay_minutes INTEGER,
  delay_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_clean_num TEXT;
  v_clean_phone TEXT;
BEGIN
  v_clean_num := upper(trim(p_order_number));
  IF v_clean_num ~ '^PB[0-9]+$' THEN
    v_clean_num := 'PB-' || substring(v_clean_num FROM 3);
  END IF;

  v_clean_phone := regexp_replace(p_phone, '\D', '', 'g');
  IF length(v_clean_phone) = 12 AND v_clean_phone LIKE '91%' THEN
    v_clean_phone := substring(v_clean_phone FROM 3);
  ELSIF length(v_clean_phone) = 11 AND v_clean_phone LIKE '0%' THEN
    v_clean_phone := substring(v_clean_phone FROM 2);
  END IF;

  -- Require exact 10-digit mobile number and valid order identifier
  IF v_clean_num = '' OR length(v_clean_phone) <> 10 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    o.id,
    o.order_number,
    o.tracking_token,
    o.customer_name,
    o.order_type,
    o.delivery_address,
    o.landmark,
    o.table_number,
    o.time_slot,
    o.scheduled_date,
    o.items,
    o.subtotal,
    o.delivery_fee,
    o.discount,
    o.coupon_code,
    o.total,
    o.payment_method,
    o.payment_status,
    o.status,
    o.created_at,
    o.estimated_delivery_time,
    o.delay_minutes,
    o.delay_message
  FROM public.orders o
  WHERE (upper(trim(o.order_number)) = v_clean_num OR upper(trim(o.id)) = v_clean_num)
    AND (
      CASE 
        WHEN length(regexp_replace(o.customer_phone, '\D', '', 'g')) = 12 AND regexp_replace(o.customer_phone, '\D', '', 'g') LIKE '91%'
          THEN substring(regexp_replace(o.customer_phone, '\D', '', 'g') FROM 3)
        WHEN length(regexp_replace(o.customer_phone, '\D', '', 'g')) = 11 AND regexp_replace(o.customer_phone, '\D', '', 'g') LIKE '0%'
          THEN substring(regexp_replace(o.customer_phone, '\D', '', 'g') FROM 2)
        ELSE regexp_replace(o.customer_phone, '\D', '', 'g')
      END = v_clean_phone
    )
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_order_by_number_and_phone(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_by_number_and_phone(TEXT, TEXT) TO anon, authenticated;

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_cake_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- ==========================================================
-- RLS Policies: Storefront Public Access vs Admin Authorizations
-- ==========================================================

-- Clean up existing legacy policies to ensure idempotent migration
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename IN ('orders', 'admin_users', 'custom_cake_enquiries', 'customer_issues', 'reviews', 'products')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 1. Admin Users Table RLS: Non-recursive, hardened security design
-- An authenticated user can read exclusively their own record (solves Admin Access Denied without recursion)
CREATE POLICY "admin_users_select_self"
  ON public.admin_users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Active administrators can read the team list
CREATE POLICY "admin_users_select_team"
  ON public.admin_users
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Active owner or super_admin can manage admin team records
CREATE POLICY "admin_users_manage_owner"
  ON public.admin_users
  FOR ALL TO authenticated
  USING (public.is_admin_owner())
  WITH CHECK (public.is_admin_owner());

-- 2. Orders Table RLS: Protected customer orders & admin operations
-- Customers can submit new orders with constrained initial fields (cannot set kitchen delays or arbitrary status)
CREATE POLICY "orders_public_insert"
  ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'new'
    AND (delay_minutes IS NULL OR delay_minutes = 0)
    AND (delay_message IS NULL OR trim(delay_message) = '')
    AND (payment_status IS NULL OR payment_status IN ('pending', 'paid'))
    AND total >= 0
    AND length(trim(customer_name)) > 0
    AND length(trim(customer_phone)) > 0
  );

-- Only verified active administrators can select all orders (customers use secure RPC functions)
CREATE POLICY "orders_admin_select"
  ON public.orders
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Only verified active administrators can update orders (status, delays, cancellations)
CREATE POLICY "orders_admin_update"
  ON public.orders
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Only verified active administrators can delete orders
CREATE POLICY "orders_admin_delete"
  ON public.orders
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- 3. Custom Cake Enquiries RLS:
-- Anyone can submit cake enquiries with constrained non-privileged fields
CREATE POLICY "cake_enquiries_public_insert"
  ON public.custom_cake_enquiries
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    status IN ('enquiry_received', 'new')
    AND quotation_amount IS NULL
    AND admin_notes IS NULL
    AND length(trim(customer_name)) > 0
    AND length(trim(customer_phone)) > 0
  );

-- Only active admins can select, quote, or manage custom cake enquiries
CREATE POLICY "cake_enquiries_admin_all"
  ON public.custom_cake_enquiries
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Customer Issues & Late Delivery Reports RLS:
-- Customers can submit issues (cannot read other customers' complaints)
CREATE POLICY "issues_public_insert"
  ON public.customer_issues
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'open'
    AND resolution_notes IS NULL
    AND length(trim(customer_name)) > 0
    AND length(trim(customer_phone)) > 0
    AND length(trim(description)) > 0
  );

-- Only active admins can view and resolve customer issues
CREATE POLICY "issues_admin_all"
  ON public.customer_issues
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Customer Reviews Table RLS:
-- Public can view approved customer testimonials
CREATE POLICY "reviews_public_select"
  ON public.reviews
  FOR SELECT TO anon, authenticated
  USING (true);

-- Public can submit reviews, but cannot mark themselves as verified or add owner replies
CREATE POLICY "reviews_public_insert"
  ON public.reviews
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    (verified_customer IS NULL OR verified_customer = false)
    AND (owner_reply IS NULL OR trim(owner_reply) = '')
    AND rating >= 1 AND rating <= 5
    AND length(trim(author)) > 0
    AND length(trim(text)) > 0
  );

-- Only active admins can manage reviews (owner replies, moderation)
CREATE POLICY "reviews_admin_all"
  ON public.reviews
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6. Products Table RLS:
-- Public can view menu items
CREATE POLICY "products_public_select"
  ON public.products
  FOR SELECT TO anon, authenticated
  USING (true);

-- Only active admins can create, update, or delete menu items
CREATE POLICY "products_admin_all"
  ON public.products
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 7. Supabase Storage: Product Images Bucket Setup
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies:
DROP POLICY IF EXISTS "Public Access product-images" ON storage.objects;
CREATE POLICY "Public Access product-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admin Upload product-images" ON storage.objects;
CREATE POLICY "Admin Upload product-images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admin Update product-images" ON storage.objects;
CREATE POLICY "Admin Update product-images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admin Delete product-images" ON storage.objects;
CREATE POLICY "Admin Delete product-images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());

-- Enable Realtime publication for live order and cake updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_cake_enquiries;`;
