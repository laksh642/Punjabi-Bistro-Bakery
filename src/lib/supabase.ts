import { createClient } from '@supabase/supabase-js';
import { Order, CustomCakeEnquiry, ReviewItem, CustomerIssue, OrderStatus } from '../types';

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
  };
}

/**
 * Health check to test Supabase connection and verify which tables exist
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
    },
  };

  if (!isSupabaseConfigured) {
    result.message = 'Supabase credentials are not configured.';
    return result;
  }

  try {
    const [ordersRes, cakesRes, reviewsRes, issuesRes] = await Promise.all([
      supabase.from('orders').select('id').limit(1),
      supabase.from('custom_cake_enquiries').select('id').limit(1),
      supabase.from('reviews').select('id').limit(1),
      supabase.from('customer_issues').select('id').limit(1),
    ]);

    result.tablesStatus.orders = !ordersRes.error;
    result.tablesStatus.cake_enquiries = !cakesRes.error;
    result.tablesStatus.reviews = !reviewsRes.error;
    result.tablesStatus.issues = !issuesRes.error;

    result.connected = true;
    const activeCount = Object.values(result.tablesStatus).filter(Boolean).length;
    if (activeCount === 4) {
      result.message = 'All 4 tables synced and operational in Supabase cloud.';
    } else if (activeCount > 0) {
      result.message = `Connected (${activeCount}/4 tables ready). Click 'Setup Schema' if needed.`;
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
// Orders Cloud Synchronization
// -------------------------------------------------------------

export async function fetchOrdersFromCloud(): Promise<Order[] | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch orders:', error.message);
      return null;
    }
    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      orderNumber: row.order_number,
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
    }));
  } catch (err) {
    console.warn('Supabase fetchOrders error:', err);
    return null;
  }
}

export async function saveOrderToCloud(order: Order): Promise<boolean> {
  try {
    const payload = {
      id: order.id,
      order_number: order.orderNumber,
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

export const SUPABASE_SETUP_SQL = `-- ==========================================================
-- Punjabi Bistro & Bakery, Dharamkot
-- Supabase Database Schema & Tables
-- ==========================================================

-- 1. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
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

-- Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_cake_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_issues ENABLE ROW LEVEL SECURITY;

-- Allow public read & write access for the Bistro store application
DROP POLICY IF EXISTS "Allow public select on orders" ON public.orders;
CREATE POLICY "Allow public select on orders" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on orders" ON public.orders;
CREATE POLICY "Allow public insert on orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on orders" ON public.orders;
CREATE POLICY "Allow public update on orders" ON public.orders FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public select on custom_cake_enquiries" ON public.custom_cake_enquiries;
CREATE POLICY "Allow public select on custom_cake_enquiries" ON public.custom_cake_enquiries FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on custom_cake_enquiries" ON public.custom_cake_enquiries;
CREATE POLICY "Allow public insert on custom_cake_enquiries" ON public.custom_cake_enquiries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on custom_cake_enquiries" ON public.custom_cake_enquiries;
CREATE POLICY "Allow public update on custom_cake_enquiries" ON public.custom_cake_enquiries FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public select on reviews" ON public.reviews;
CREATE POLICY "Allow public select on reviews" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on reviews" ON public.reviews;
CREATE POLICY "Allow public insert on reviews" ON public.reviews FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select on customer_issues" ON public.customer_issues;
CREATE POLICY "Allow public select on customer_issues" ON public.customer_issues FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on customer_issues" ON public.customer_issues;
CREATE POLICY "Allow public insert on customer_issues" ON public.customer_issues FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on customer_issues" ON public.customer_issues;
CREATE POLICY "Allow public update on customer_issues" ON public.customer_issues FOR UPDATE USING (true);

-- Enable Realtime publication for live order and cake updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_cake_enquiries;`;
