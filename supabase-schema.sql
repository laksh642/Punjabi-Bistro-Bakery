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
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email TEXT,
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

-- Schema Migration: Ensure user_id, customer_email, tracking_token column and performance indexes exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_token TEXT;
UPDATE public.orders SET tracking_token = md5(random()::text || id || clock_timestamp()::text) WHERE tracking_token IS NULL;
ALTER TABLE public.orders ALTER COLUMN tracking_token SET DEFAULT md5(random()::text || clock_timestamp()::text);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_tracking_token ON public.orders (tracking_token);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders (customer_phone);

-- 1b. Customer Profiles Table (Persistent Google Account Records)
CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  address TEXT,
  landmark TEXT,
  city TEXT DEFAULT 'Dharamkot',
  state TEXT DEFAULT 'Himachal Pradesh',
  pincode TEXT DEFAULT '176219',
  delivery_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Schema Migration for customer_profiles
ALTER TABLE public.customer_profiles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.customer_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON public.customer_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_email ON public.customer_profiles (email);

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

-- 6. Dedicated Admin Keys Table (Secure Server & Database Authentication)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.admin_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  security_key_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security on admin_keys
ALTER TABLE public.admin_keys ENABLE ROW LEVEL SECURITY;

-- CRITICAL: Block all direct client/public access to admin_keys
REVOKE ALL ON TABLE public.admin_keys FROM anon, authenticated, public;

-- Automatic Hashing Trigger:
-- If an admin edits password_hash or security_key_hash in Supabase Table Editor using plaintext,
-- this trigger automatically converts it to a secure bcrypt hash before saving to the table!
CREATE OR REPLACE FUNCTION public.hash_admin_keys_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- If password_hash is not already a bcrypt ($2a$, $2b$) or pbkdf2 hash, hash it with bcrypt
  IF NEW.password_hash IS NOT NULL AND NEW.password_hash !~ '^\$2[ab]\$' AND NEW.password_hash !~ '^pbkdf2\$' THEN
    NEW.password_hash := crypt(NEW.password_hash, gen_salt('bf', 10));
  END IF;

  -- If security_key_hash is not already a bcrypt or pbkdf2 hash, hash it with bcrypt
  IF NEW.security_key_hash IS NOT NULL AND NEW.security_key_hash !~ '^\$2[ab]\$' AND NEW.security_key_hash !~ '^pbkdf2\$' THEN
    NEW.security_key_hash := crypt(NEW.security_key_hash, gen_salt('bf', 10));
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_hash_admin_keys ON public.admin_keys;
CREATE TRIGGER trg_hash_admin_keys
BEFORE INSERT OR UPDATE ON public.admin_keys
FOR EACH ROW
EXECUTE FUNCTION public.hash_admin_keys_trigger();

-- Helper function: Change credentials directly from Supabase SQL Editor
-- Usage: SELECT set_admin_credentials('admin', 'YourNewPassword123', 'YourNewSecurityKey123');
CREATE OR REPLACE FUNCTION public.set_admin_credentials(
  p_username TEXT,
  p_new_password TEXT,
  p_new_security_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user TEXT := lower(trim(p_username));
  v_pass_hash TEXT;
  v_key_hash TEXT;
BEGIN
  IF length(trim(p_new_password)) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters.';
  END IF;
  IF length(trim(p_new_security_key)) < 4 THEN
    RAISE EXCEPTION 'Security key must be at least 4 characters.';
  END IF;

  v_pass_hash := crypt(trim(p_new_password), gen_salt('bf', 10));
  v_key_hash := crypt(trim(p_new_security_key), gen_salt('bf', 10));

  INSERT INTO public.admin_keys (username, password_hash, security_key_hash, updated_at)
  VALUES (v_user, v_pass_hash, v_key_hash, NOW())
  ON CONFLICT (username)
  DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    security_key_hash = EXCLUDED.security_key_hash,
    updated_at = NOW();

  RETURN jsonb_build_object('success', true, 'username', v_user, 'updated_at', NOW());
END;
$$;

REVOKE ALL ON FUNCTION public.set_admin_credentials(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- Server verification endpoint Step 1 (Returns boolean only, never credentials or hashes)
CREATE OR REPLACE FUNCTION public.auth_verify_admin_step1(
  p_username TEXT,
  p_password_attempt TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rec RECORD;
  v_valid BOOLEAN := FALSE;
BEGIN
  SELECT id, username, password_hash
  INTO v_rec
  FROM public.admin_keys
  WHERE lower(username) = lower(trim(p_username))
  LIMIT 1;

  IF v_rec IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid credentials');
  END IF;

  IF v_rec.password_hash ~ '^\$2[ab]\$' THEN
    v_valid := (crypt(p_password_attempt, v_rec.password_hash) = v_rec.password_hash);
  END IF;

  IF v_valid THEN
    RETURN jsonb_build_object('success', true, 'username', v_rec.username);
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
END;
$$;

-- Server verification endpoint Step 2 (Returns boolean only, never credentials or hashes)
CREATE OR REPLACE FUNCTION public.auth_verify_admin_step2(
  p_username TEXT,
  p_security_key_attempt TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rec RECORD;
  v_valid BOOLEAN := FALSE;
BEGIN
  SELECT id, username, security_key_hash
  INTO v_rec
  FROM public.admin_keys
  WHERE lower(username) = lower(trim(p_username))
  LIMIT 1;

  IF v_rec IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid credentials');
  END IF;

  IF v_rec.security_key_hash ~ '^\$2[ab]\$' THEN
    v_valid := (crypt(p_security_key_attempt, v_rec.security_key_hash) = v_rec.security_key_hash);
  END IF;

  IF v_valid THEN
    RETURN jsonb_build_object('success', true, 'username', v_rec.username);
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.auth_verify_admin_step1(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auth_verify_admin_step2(TEXT, TEXT) TO anon, authenticated;

-- 7a. Secure Order Lookup by Cryptographic Tracking Token
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

-- 7b. Secure Order Lookup by Order Number AND Exact Normalized Phone Verification
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
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_cake_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies to ensure idempotent migration
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename IN ('orders', 'customer_profiles', 'admin_credentials', 'custom_cake_enquiries', 'customer_issues', 'reviews', 'products')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- RLS: Orders Table
-- STRICT: Only authenticated customers can place orders; anonymous orders are strictly blocked.
-- The order's user_id MUST match auth.uid(), preventing account spoofing.
CREATE POLICY "orders_authenticated_insert"
  ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND status = 'new'
    AND (delay_minutes IS NULL OR delay_minutes = 0)
    AND (delay_message IS NULL OR trim(delay_message) = '')
    AND (payment_status IS NULL OR payment_status IN ('pending', 'paid'))
    AND total >= 0
    AND length(trim(customer_name)) > 0
    AND length(trim(customer_phone)) > 0
  );

-- Customers can only SELECT their own authenticated orders
CREATE POLICY "orders_authenticated_select_own"
  ON public.orders
  FOR SELECT TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  );

-- RLS: Customer Profiles Table
-- Customers can only view, insert, or update their own profile linked to auth.uid()
CREATE POLICY "customer_profiles_select_own"
  ON public.customer_profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  );

CREATE POLICY "customer_profiles_insert_own"
  ON public.customer_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  );

CREATE POLICY "customer_profiles_update_own"
  ON public.customer_profiles
  FOR UPDATE TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  );

-- Automatic Google Account Profile Synchronization Trigger
-- When a user authenticates via Google for the first time or updates metadata,
-- automatically upsert their record into customer_profiles without creating duplicates.
CREATE OR REPLACE FUNCTION public.handle_new_customer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.customer_profiles (id, user_id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, customer_profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, customer_profiles.avatar_url),
    updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_customer();

-- Direct selects on orders are restricted; customers use secure lookup RPCs
-- Server backend service role bypasses RLS for admin portal operations

-- RLS: Custom Cake Enquiries
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

-- RLS: Customer Issues & Late Delivery Reports
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

-- RLS: Customer Reviews Table
-- Public can view approved customer reviews
CREATE POLICY "reviews_public_select"
  ON public.reviews
  FOR SELECT TO anon, authenticated
  USING (true);

-- Public can submit reviews, but cannot mark verified or add owner replies
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

-- RLS: Products Table
-- Public can view menu items
CREATE POLICY "products_public_select"
  ON public.products
  FOR SELECT TO anon, authenticated
  USING (true);

-- Storage: product-images bucket setup
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access product-images" ON storage.objects;
CREATE POLICY "Public Access product-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- Enable Realtime publication for live order and cake updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_cake_enquiries;
