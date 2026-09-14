-- ==========================================================
-- Punjabi Bistro & Bakery, Dharamkot
-- Supabase Database Schema & Tables
-- ==========================================================

-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/mlbjulhzbhnqkzzohgcm
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Click "New Query", paste this entire script and click "Run"

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
ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_cake_enquiries;
