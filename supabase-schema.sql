-- ==========================================================
-- Punjabi Bistro & Bakery, Dharamkot
-- Hardened Supabase Database Schema, Functions & RLS Security
-- ==========================================================

-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/mlbjulhzbhnqkzzohgcm
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Click "New Query", paste this entire script and click "Run"

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

-- Schema Migration: Ensure tracking_token column and performance indexes exist
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
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_cake_enquiries;
