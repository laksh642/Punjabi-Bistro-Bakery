import { createClient } from '@supabase/supabase-js';
import { Order, CustomCakeEnquiry, ReviewItem, CustomerIssue, OrderStatus, Product } from '../types';

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
    result.message = 'Supabase credentials are not configured.';
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
      result.message = 'All database tables synced and operational in Supabase cloud.';
    } else if (activeCount > 0) {
      result.message = `Connected (${activeCount}/5 tables ready). Click 'Setup Schema' if needed.`;
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

export const SUPABASE_SETUP_SQL = `-- ==========================================================
-- Punjabi Bistro & Bakery, Dharamkot
-- Supabase Database Schema & Storage Configuration
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

-- Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_cake_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Allow public select on products" ON public.products;
CREATE POLICY "Allow public select on products" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on products" ON public.products;
CREATE POLICY "Allow public insert on products" ON public.products FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on products" ON public.products;
CREATE POLICY "Allow public update on products" ON public.products FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete on products" ON public.products;
CREATE POLICY "Allow public delete on products" ON public.products FOR DELETE USING (true);

-- 6. Supabase Storage: Product Images Bucket Setup
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for Public Reading and Admin Uploading
DROP POLICY IF EXISTS "Public Access product-images" ON storage.objects;
CREATE POLICY "Public Access product-images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public Upload product-images" ON storage.objects;
CREATE POLICY "Public Upload product-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public Update product-images" ON storage.objects;
CREATE POLICY "Public Update product-images" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public Delete product-images" ON storage.objects;
CREATE POLICY "Public Delete product-images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images');

-- Enable Realtime publication for live order and cake updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_cake_enquiries;`;
