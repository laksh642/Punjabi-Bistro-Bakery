-- ==========================================================
-- Punjabi Bistro & Bakery, Dharamkot
-- FOCUSED BUSINESS DATA PERSISTENCE MIGRATION
-- ==========================================================
-- NOTE:
-- - Existing Admin Authentication (admin_keys, admin_users, admin_recovery) is UNTOUCHED.
-- - Existing Customer Orders, Reviews, Issues & Enquiries are UNTOUCHED.
-- - No blanket or insecure policies are introduced.
-- - Creates the 5 missing business tables, RLS policies, Storage setup, and Realtime replication.
-- ==========================================================

-- 1. PRODUCTS TABLE (AUTHORITATIVE MENU & REALTIME PRICING)
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC,
  image TEXT NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  is_bestseller BOOLEAN DEFAULT FALSE,
  is_eggless BOOLEAN DEFAULT TRUE,
  is_vegetarian BOOLEAN DEFAULT TRUE,
  is_spicy BOOLEAN DEFAULT FALSE,
  prep_time_minutes INTEGER DEFAULT 20,
  customization_groups JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS original_price NUMERIC;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_eggless BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_vegetarian BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_spicy BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS prep_time_minutes INTEGER DEFAULT 20;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS customization_groups JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON public.products (is_available);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select_public" ON public.products;
CREATE POLICY "products_select_public"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "products_admin_modify" ON public.products;
CREATE POLICY "products_admin_modify"
  ON public.products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE lower(email) = lower(auth.jwt()->>'email')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE lower(email) = lower(auth.jwt()->>'email')
    )
  );


-- Seed Initial Menu Products
INSERT INTO public.products (
  id, name, category_id, category_name, description, price, original_price,
  image, is_available, is_bestseller, is_eggless, is_vegetarian, is_spicy,
  prep_time_minutes, customization_groups
) VALUES
  ('prod-cake-1', 'Eggless Black Forest Cake', 'cakes', 'Cakes & Pastries', 'Classic rich chocolate sponge layered with whipped fresh cream, dark cherries, and chocolate shavings. 100% Eggless.', 350, 400, 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=700&q=80', TRUE, TRUE, TRUE, TRUE, FALSE, 30, '[{"name":"Cake Weight","type":"single","options":[{"name":"0.5 Kg","price":0},{"name":"1.0 Kg","price":320},{"name":"1.5 Kg","price":600}]},{"name":"Celebration Add-ons","type":"multiple","options":[{"name":"Birthday Candle & Knife Set","price":20},{"name":"Sparkler Candle","price":40},{"name":"Golden Birthday Tag","price":30}]}]'::jsonb),
  ('prod-cake-2', 'Belgian Chocolate Truffle Cake', 'cakes', 'Cakes & Pastries', 'Silky smooth dark chocolate ganache draped over moist chocolate sponge. Decadent, glossy, and 100% eggless.', 450, 500, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=700&q=80', TRUE, TRUE, TRUE, TRUE, FALSE, 30, '[{"name":"Cake Weight","type":"single","options":[{"name":"0.5 Kg","price":0},{"name":"1.0 Kg","price":400}]}]'::jsonb),
  ('prod-cake-3', 'Fresh Pineapple Cream Cake', 'cakes', 'Cakes & Pastries', 'Light vanilla sponge enriched with chopped juicy pineapples and whipped fresh dairy cream. Gentle and refreshing.', 320, NULL, 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=700&q=80', TRUE, FALSE, TRUE, TRUE, FALSE, 25, '[{"name":"Cake Weight","type":"single","options":[{"name":"0.5 Kg","price":0},{"name":"1.0 Kg","price":300}]}]'::jsonb),
  ('prod-cake-4', 'Red Velvet Cream Cheese Pastry', 'cakes', 'Cakes & Pastries', 'Individual velvety crimson slice layered with creamy cheese frosting and red velvet crumb dusting.', 85, NULL, 'https://images.unsplash.com/photo-1616031037011-0872951336c1?auto=format&fit=crop&w=700&q=80', TRUE, FALSE, TRUE, TRUE, FALSE, 10, '[]'::jsonb),
  ('prod-cake-5', 'Hot Choco Lava Cupcake', 'cakes', 'Cakes & Pastries', 'Warm cocoa muffin with a molten chocolate core that flows with the first bite.', 70, NULL, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=700&q=80', TRUE, TRUE, TRUE, TRUE, FALSE, 15, '[]'::jsonb),
  ('prod-cake-6', 'Artisan Butter Cookies Box (250g)', 'cakes', 'Cakes & Pastries', 'Fresh bakery baked crisp butter cookies with a melt-in-mouth crumb. Perfect for chai time.', 130, NULL, 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=700&q=80', TRUE, FALSE, TRUE, TRUE, FALSE, 5, '[]'::jsonb),
  ('prod-pasta-1', 'Creamy White Sauce Penne Pasta', 'pasta', 'Pasta & Italian', 'Signature bistro white sauce penne cooked with rich garlic cream, sweet corn, crunchy bell peppers, and oregano herbs.', 190, NULL, 'https://images.unsplash.com/photo-1621996346565-e3d5d6281699?auto=format&fit=crop&w=700&q=80', TRUE, TRUE, TRUE, TRUE, FALSE, 20, '[{"name":"Cheese & Spice","type":"multiple","options":[{"name":"Extra Mozzarella Cheese","price":40},{"name":"Spicy Chilli Flakes Kick","price":0},{"name":"Garlic Bread Slices (2 pcs)","price":45}]}]'::jsonb),
  ('prod-pasta-2', 'Tangy Red Sauce Arrabiata Pasta', 'pasta', 'Pasta & Italian', 'Spicy simmered Italian tomato sauce with crushed garlic, fresh basil hints, black olives, and bell peppers.', 180, NULL, 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=700&q=80', TRUE, FALSE, TRUE, TRUE, TRUE, 20, '[{"name":"Add-ons","type":"multiple","options":[{"name":"Extra Cheese Topping","price":40},{"name":"Garlic Bread Slices (2 pcs)","price":45}]}]'::jsonb),
  ('prod-pasta-3', 'Pink Mixed Sauce Fusion Pasta', 'pasta', 'Pasta & Italian', 'The best of both worlds: creamy bechamel combined with tangy pomodoro sauce, tossed with sweet corn and paneer cubes.', 210, NULL, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=700&q=80', TRUE, TRUE, TRUE, TRUE, FALSE, 20, '[]'::jsonb),
  ('prod-pasta-4', 'Toasted Cheesy Garlic Bread (4 pcs)', 'pasta', 'Pasta & Italian', 'Crisp fresh baguette slices brushed with fragrant garlic butter and topped with bubbling melted mozzarella cheese.', 120, NULL, 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?auto=format&fit=crop&w=700&q=80', TRUE, FALSE, TRUE, TRUE, FALSE, 15, '[]'::jsonb),
  ('prod-pizza-1', 'Punjabi Bistro Special Paneer Pizza', 'pizza', 'Handcrafted Pizza', 'Hand-tossed crust with aromatic spiced pizza sauce, marinated soft paneer cubes, crisp onions, green capsicum, and 100% mozzarella.', 260, NULL, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=700&q=80', TRUE, TRUE, TRUE, TRUE, FALSE, 25, '[{"name":"Crust & Cheese","type":"single","options":[{"name":"Regular Pan Crust (8 inch)","price":0},{"name":"Medium Pan Crust (10 inch)","price":140},{"name":"Cheese Burst Base (8 inch)","price":60}]},{"name":"Extra Toppings","type":"multiple","options":[{"name":"Extra Paneer Cubes","price":45},{"name":"Extra Cheese","price":50},{"name":"Spicy Jalapeños","price":30}]}]'::jsonb),
  ('prod-pizza-2', 'Farmhouse Garden Pizza', 'pizza', 'Handcrafted Pizza', 'Loaded with tender sweet corn, fresh mushrooms, diced capsicum, juicy tomatoes, and melted mozzarella.', 240, NULL, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=700&q=80', TRUE, FALSE, TRUE, TRUE, FALSE, 25, '[{"name":"Size","type":"single","options":[{"name":"Regular (8 inch)","price":0},{"name":"Medium (10 inch)","price":130}]}]'::jsonb),
  ('prod-pizza-3', 'Classic Margherita Pizza', 'pizza', 'Handcrafted Pizza', 'Simple authentic delight with rich tomato basil sauce, double mozzarella cheese, and Italian oregano dusting.', 190, NULL, 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=700&q=80', TRUE, FALSE, TRUE, TRUE, FALSE, 20, '[]'::jsonb),
  ('prod-pizza-4', 'Spicy Mexican Jalapeño Pizza', 'pizza', 'Handcrafted Pizza', 'Fiery Mexican salsa spread, spicy jalapeños, sweet golden corn, red paprika, and stretchy melted cheese.', 250, NULL, 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=700&q=80', TRUE, FALSE, TRUE, TRUE, TRUE, 25, '[]'::jsonb),
  ('prod-burger-1', 'Crispy Veggie Crunch Burger', 'burgers', 'Burgers & Wraps', 'Crispy spiced vegetable patty nestled between soft toasted sesame buns, crisp lettuce, tomato slices, and house burger spread.', 95, NULL, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80', TRUE, TRUE, TRUE, TRUE, FALSE, 15, '[{"name":"Upgrades","type":"multiple","options":[{"name":"Add Cheese Slice","price":25},{"name":"Make It Double Patty","price":40},{"name":"Add Small Salted Fries","price":45}]}]'::jsonb),
  ('prod-burger-2', 'Spicy Paneer Tikka Burger', 'burgers', 'Burgers & Wraps', 'Charred paneer slice marinated in roasted tandoori spices, topped with mint chutney mayo and onion rings.', 135, NULL, 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=700&q=80', TRUE, FALSE, TRUE, TRUE, TRUE, 15, '[]'::jsonb),
  ('prod-wrap-1', 'Spicy Mexican Bean & Cheese Wrap', 'burgers', 'Burgers & Wraps', 'Grilled whole wheat tortilla packed with Mexican spiced filling, fresh salsa, crunchy bell peppers, and chipotle cheese sauce.', 145, NULL, 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=700&q=80', TRUE, TRUE, TRUE, TRUE, TRUE, 15, '[]'::jsonb),
  ('prod-wrap-2', 'Tandoori Paneer Roll Wrap', 'burgers', 'Burgers & Wraps', 'Flaky warm paratha wrap stuffed with roasted paneer tikka, pickled sliced onions, and smoky Punjabi bistro dip.', 150, NULL, 'https://images.unsplash.com/photo-1648787989447-06bdfd1891b0?auto=format&fit=crop&w=700&q=80', TRUE, FALSE, TRUE, TRUE, FALSE, 15, '[]'::jsonb),
  ('prod-sand-1', 'Jumbo Cheesy Grilled Sandwich', 'sandwiches', 'Grilled Sandwiches', 'Triple-decker bread toasted golden-crisp on the grill with butter, stuffed with sliced vegetables, green chutney, and double cheese.', 130, NULL, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=700&q=80', TRUE, TRUE, TRUE, TRUE, FALSE, 15, '[]'::jsonb),
  ('prod-sand-2', 'Paneer Corn Club Sandwich', 'sandwiches', 'Grilled Sandwiches', 'Wholesome grilled club sandwich packed with seasoned paneer bhurji, sweet golden corn, capsicum, and house bistro spread.', 145, NULL, 'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=700&q=80', TRUE, FALSE, TRUE, TRUE, FALSE, 15, '[]'::jsonb),
  ('prod-sand-3', 'Coleslaw Mayo Cold Sandwich', 'sandwiches', 'Grilled Sandwiches', 'Chilled sandwich filled with shredded crisp cabbage, carrots, sweet corn, and creamy eggless mayonnaise spread.', 90, NULL, 'https://images.unsplash.com/photo-1481070414801-51fd732d7184?auto=format&fit=crop&w=700&q=80', TRUE, FALSE, TRUE, TRUE, FALSE, 10, '[]'::jsonb),
  ('prod-fries-1', 'Peri Peri Crinkle Cut Fries', 'fries', 'Fries & Quick Bites', 'Deep-fried golden crinkle potatoes tossed in hot & tangy African peri peri spice blend. Served with bistro dip.', 95, NULL, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=700&q=80', TRUE, TRUE, TRUE, TRUE, TRUE, 10, '[]'::jsonb),
  ('prod-fries-2', 'Loaded Melted Cheese Fries', 'fries', 'Fries & Quick Bites', 'Hot crisp fries drenched in molten cheddar cheese sauce and garnished with sliced spicy jalapeños.', 130, NULL, 'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=700&q=80', TRUE, FALSE, TRUE, TRUE, FALSE, 12, '[]'::jsonb),
  ('prod-fries-3', 'Crispy Veg Nuggets (8 pcs)', 'fries', 'Fries & Quick Bites', 'Crunchy battered vegetable bites with a savory herbal seasoning. Served with tomato salsa dip.', 90, NULL, 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=700&q=80', TRUE, FALSE, TRUE, TRUE, FALSE, 12, '[]'::jsonb),
  ('prod-bev-1', 'Chilled Fruit Beer (Non-Alcoholic)', 'beverages', 'Drinks & Fruit Beer', 'Dharamkot’s beloved bubbly malted fruit beverage served ice-cold. Refreshing, sweet, and effervescent.', 60, NULL, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=700&q=80', TRUE, TRUE, TRUE, TRUE, FALSE, 5, '[]'::jsonb),
  ('prod-bev-2', 'Classic Thick Cold Coffee', 'beverages', 'Drinks & Fruit Beer', 'Blended creamy chilled coffee topped with chocolate syrup drizzle and a scoop of vanilla ice cream.', 110, NULL, 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=700&q=80', TRUE, FALSE, TRUE, TRUE, FALSE, 5, '[]'::jsonb),
  ('prod-bev-3', 'Fresh Lime Mint Soda (Sweet & Salt)', 'beverages', 'Drinks & Fruit Beer', 'Zesty freshly squeezed lemon juice with garden mint leaves and sparkling soda.', 70, NULL, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=700&q=80', TRUE, FALSE, TRUE, TRUE, FALSE, 5, '[]'::jsonb),
  ('prod-bev-4', 'Hot Hazelnut Bistro Cappuccino', 'beverages', 'Drinks & Fruit Beer', 'Freshly brewed espresso topped with velvety steamed milk foam and subtle hazelnut essence.', 80, NULL, 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=700&q=80', TRUE, FALSE, TRUE, TRUE, FALSE, 5, '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;


-- 2. BUSINESS SETTINGS TABLE (STORE DETAILS, UPI, TIMINGS, LOGO)
CREATE TABLE IF NOT EXISTS public.business_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  name TEXT NOT NULL DEFAULT 'Punjabi Bistro & Bakery',
  logo_url TEXT,
  address TEXT DEFAULT 'Near Udham Singh Chowk, Dharamkot, Punjab 142042',
  landmark TEXT DEFAULT 'Near Udham Singh Chowk',
  phone TEXT DEFAULT '098562 04951',
  whatsapp TEXT DEFAULT '919856204951',
  is_open_manual BOOLEAN DEFAULT TRUE,
  opening_time TEXT DEFAULT '10:00',
  closing_time TEXT DEFAULT '22:00',
  weekly_off TEXT DEFAULT 'None (Open All 7 Days)',
  upi_id TEXT DEFAULT 'punjabibistro@upi',
  upi_merchant_name TEXT DEFAULT 'Punjabi Bistro and Bakery',
  announcement_text TEXT DEFAULT 'Fresh batch of eggless cakes and pizza ready today! Book before 9:30 PM for same-day delivery.',
  show_announcement BOOLEAN DEFAULT TRUE,
  max_orders_per_slot INTEGER DEFAULT 6,
  default_prep_minutes INTEGER DEFAULT 25,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select_public" ON public.business_settings;
CREATE POLICY "settings_select_public"
  ON public.business_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "settings_admin_modify" ON public.business_settings;
CREATE POLICY "settings_admin_modify"
  ON public.business_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE lower(email) = lower(auth.jwt()->>'email')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE lower(email) = lower(auth.jwt()->>'email'))
  );

-- Seed default settings record if not present
INSERT INTO public.business_settings (
  id, name, logo_url, address, landmark, phone, whatsapp,
  is_open_manual, opening_time, closing_time, weekly_off,
  upi_id, upi_merchant_name, announcement_text, show_announcement,
  max_orders_per_slot, default_prep_minutes
) VALUES (
  'default', 'Punjabi Bistro & Bakery', '/logoo.png',
  'Near Udham Singh Chowk, Dharamkot, Punjab 142042', 'Near Udham Singh Chowk',
  '098562 04951', '919856204951',
  TRUE, '10:00', '22:00', 'None (Open All 7 Days)',
  'punjabibistro@upi', 'Punjabi Bistro and Bakery',
  'Fresh batch of eggless cakes and pizza ready today! Book before 9:30 PM for same-day delivery.',
  TRUE, 6, 25
)
ON CONFLICT (id) DO NOTHING;


-- 3. DELIVERY ZONES TABLE
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  min_order NUMERIC DEFAULT 0,
  delivery_fee NUMERIC DEFAULT 0,
  free_delivery_above NUMERIC DEFAULT 499,
  estimated_time TEXT DEFAULT '30-45 mins',
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "zones_select_public" ON public.delivery_zones;
CREATE POLICY "zones_select_public"
  ON public.delivery_zones
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "zones_admin_modify" ON public.delivery_zones;
CREATE POLICY "zones_admin_modify"
  ON public.delivery_zones
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE lower(email) = lower(auth.jwt()->>'email')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE lower(email) = lower(auth.jwt()->>'email')
    )
  );

INSERT INTO public.delivery_zones (id, name, min_order, delivery_fee, free_delivery_above, estimated_time, description, is_active)
VALUES
  ('zone-1', 'Dharamkot Main Town & Udham Singh Chowk', 150, 20, 299, '25-35 mins', 'Covers central Dharamkot within 2.5 km of Udham Singh Chowk.', true),
  ('zone-2', 'Dharamkot Outskirts & Outer Link Roads', 250, 35, 449, '35-45 mins', 'Covers residential colonies and bypass areas (2.5 km to 5 km).', true),
  ('zone-3', 'Surrounding Villages & Rural Connectors', 400, 55, 699, '45-60 mins', 'Covers nearby village periphery (up to 8 km) with dedicated delivery.', true)
ON CONFLICT (id) DO NOTHING;


-- 4. DYNAMIC COUPONS TABLE
CREATE TABLE IF NOT EXISTS public.coupons (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('flat', 'percentage')),
  discount_value NUMERIC NOT NULL,
  max_discount NUMERIC,
  min_order NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  badge TEXT,
  expiry_date TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coupons_select_public" ON public.coupons;
CREATE POLICY "coupons_select_public"
  ON public.coupons
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "coupons_admin_modify" ON public.coupons;
CREATE POLICY "coupons_admin_modify"
  ON public.coupons
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE lower(email) = lower(auth.jwt()->>'email')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE lower(email) = lower(auth.jwt()->>'email')
    )
  );

INSERT INTO public.coupons (id, code, title, subtitle, discount_type, discount_value, max_discount, min_order, is_active, badge)
VALUES
  ('coupon-1', 'BISTRO100', '₹100 FLAT OFF', 'On orders above ₹499 • Freshly prepared pizzas, burgers & bakery items', 'flat', 100, NULL, 499, true, 'Trending Deal'),
  ('coupon-2', 'BISTRO50', '15% OFF (Up to ₹75)', 'On orders above ₹399 • Authentic fresh taste in Dharamkot', 'percentage', 15, 75, 399, true, 'Popular'),
  ('coupon-3', 'WELCOME10', '10% FIRST ORDER OFF', 'On minimum order of ₹199 • Fast takeaway & delivery', 'percentage', 10, 50, 199, true, 'New Customer'),
  ('coupon-4', 'CAKE100', '₹100 OFF ON CAKES', '100% Pure Eggless 1Kg+ Cakes • With candles & cutting knife', 'flat', 100, NULL, 500, true, 'Bakery Special'),
  ('coupon-5', 'FREEDEL', '₹40 OFF DELIVERY', 'On orders above ₹299 • Safe & fast local delivery in Dharamkot', 'flat', 40, 40, 299, true, 'Free Shipping'),
  ('coupon-6', 'SUPER20', '20% OFF (Up to ₹150)', 'On large group orders above ₹799', 'percentage', 20, 150, 799, true, 'Party Saver')
ON CONFLICT (id) DO NOTHING;


-- 5. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_public" ON public.categories;
CREATE POLICY "categories_select_public"
  ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "categories_admin_modify" ON public.categories;
CREATE POLICY "categories_admin_modify"
  ON public.categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE lower(email) = lower(auth.jwt()->>'email')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE lower(email) = lower(auth.jwt()->>'email')
    )
  );

INSERT INTO public.categories (id, name, icon, display_order)
VALUES
  ('all', 'All Items', 'Sparkles', 0),
  ('cakes', 'Cakes & Pastries', 'Cake', 1),
  ('pasta', 'Pasta & Italian', 'UtensilsCrossed', 2),
  ('pizza', 'Handcrafted Pizza', 'Pizza', 3),
  ('burgers', 'Burgers & Wraps', 'Sandwich', 4),
  ('sandwiches', 'Grilled Sandwiches', 'Layers', 5),
  ('fries', 'Fries & Quick Bites', 'Flame', 6),
  ('beverages', 'Drinks & Fruit Beer', 'Coffee', 7)
ON CONFLICT (id) DO NOTHING;


-- 6. STORAGE BUCKET: product-images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "product_images_public_view" ON storage.objects;
CREATE POLICY "product_images_public_view"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_admin_insert" ON storage.objects;
CREATE POLICY "product_images_admin_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND EXISTS (SELECT 1 FROM public.admin_users WHERE lower(email) = lower(auth.jwt()->>'email'))
  );

DROP POLICY IF EXISTS "product_images_admin_update" ON storage.objects;
CREATE POLICY "product_images_admin_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND EXISTS (SELECT 1 FROM public.admin_users WHERE lower(email) = lower(auth.jwt()->>'email'))
  );

DROP POLICY IF EXISTS "product_images_admin_delete" ON storage.objects;
CREATE POLICY "product_images_admin_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND EXISTS (SELECT 1 FROM public.admin_users WHERE lower(email) = lower(auth.jwt()->>'email'))
  );


-- 7. REALTIME REPLICATION FOR BUSINESS DATA
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.products; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.business_settings; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_zones; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.categories; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_issues; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.orders; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;


-- ==========================================================
-- 8. CUSTOMER SECURITY HARDENING: ORDERS & CUSTOMER ISSUES
-- ==========================================================

-- A. ORDERS SECURITY HARDENING
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Deny anonymous grants explicitly
REVOKE ALL ON public.orders FROM anon;
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

-- Policy 1: Authenticated Customer can read only their own orders; Admins can read all
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
CREATE POLICY "orders_select_policy"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.admin_users WHERE lower(email) = lower(auth.jwt()->>'email')
    )
  );

-- Policy 2: Authenticated Customer can only insert orders with their own user_id
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
CREATE POLICY "orders_insert_policy"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.admin_users WHERE lower(email) = lower(auth.jwt()->>'email')
    )
  );

-- Policy 3: Only Admins can update orders
DROP POLICY IF EXISTS "orders_admin_update" ON public.orders;
CREATE POLICY "orders_admin_update"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE lower(email) = lower(auth.jwt()->>'email')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE lower(email) = lower(auth.jwt()->>'email')
    )
  );


-- B. CUSTOMER ISSUES SECURITY HARDENING
ALTER TABLE public.customer_issues ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS idx_customer_issues_user_id ON public.customer_issues (user_id);
ALTER TABLE public.customer_issues ENABLE ROW LEVEL SECURITY;

-- Deny anonymous grants explicitly (No guest reading or guest submission)
REVOKE ALL ON public.customer_issues FROM anon;
GRANT SELECT, INSERT ON public.customer_issues TO authenticated;
GRANT ALL ON public.customer_issues TO service_role;

-- Policy 1: Authenticated Customer can read only their own issues; Admins can read all
DROP POLICY IF EXISTS "customer_issues_select" ON public.customer_issues;
CREATE POLICY "customer_issues_select"
  ON public.customer_issues
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.admin_users WHERE lower(email) = lower(auth.jwt()->>'email')
    )
  );

-- Policy 2: Only Authenticated Customer can submit their OWN issue
DROP POLICY IF EXISTS "customer_issues_insert" ON public.customer_issues;
CREATE POLICY "customer_issues_insert"
  ON public.customer_issues
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.admin_users WHERE lower(email) = lower(auth.jwt()->>'email')
    )
  );

-- Policy 3: Only Admins can update customer issues (resolution notes & status)
DROP POLICY IF EXISTS "customer_issues_admin_modify" ON public.customer_issues;
CREATE POLICY "customer_issues_admin_modify"
  ON public.customer_issues
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE lower(email) = lower(auth.jwt()->>'email')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE lower(email) = lower(auth.jwt()->>'email')
    )
  );

