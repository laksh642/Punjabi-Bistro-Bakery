# Punjabi Bistro & Bakery, Dharamkot

> **Dharamkot’s Premier 100% Pure Eggless Bakery, Artisan Cakes & Comfort Food Café**  
> Located near Udham Singh Chowk, Dharamkot, Punjab (142042).

---

## ✨ Features Overview

- **🎨 Modern Green & White Theme**: High-contrast, clean emerald and white aesthetic matching the pure vegetarian & eggless identity.
- **🍰 100% Pure Eggless Bakery**: Celebration cakes, custom designer cakes, biscuits, pastries, rolls, and gift hampers.
- **🍕 Bistro Café Menu**: Thin-crust pizzas, creamy white & red sauce pastas, burgers, wraps, sandwiches, fries, and shakes.
- **🚚 Zone-Based Delivery**: Fixed-rate instant delivery for Dharamkot Town, Kot Ise Khan Road, Jalalabad Road, and surrounding villages.
- **📱 Separate Storefront & Admin Portal**:
  - **Storefront Page** (`/`): Customer menu, customizable orders, WhatsApp checkout, reviews, gallery, and FAQs.
  - **Admin Operations Portal** (`/admin`): **Securely protected by Supabase Auth with Google OAuth**. Features kitchen Kanban order board, live menu pricing & stock availability toggles, custom cake enquiries, delivery zones, order issue resolutions, business settings, and Supabase cloud sync.
    - **No passwords**: Access is granted strictly to authorized Google accounts in `public.admin_users`.
  - **Dedicated Order Tracking Page** (`/orders`): Real-time order status, preparation updates, rider dispatch, and delay notifications.
- **⚡ Supabase Integration**: Realtime database synchronization with local storage fallback (`supabase-schema.sql` included).
- **🖨️ Thermal KOT Printing**: One-click kitchen ticket printing for kitchen staff and delivery riders.
- **📱 PWA & Mobile-First**: Responsive navigation, sticky mobile bottom order bar, and table QR menu mode.

---

## 🌐 Deploying on Netlify (Ready Out-of-the-Box)

This project includes pre-configured `netlify.toml` and `public/_redirects` files for clean Single-Page Application (SPA) routing on Netlify.

### Option A: 1-Click Netlify Import via Git
1. Go to [Netlify](https://app.netlify.com/) and click **Add new site** → **Import an existing project**.
2. Connect your GitHub repository.
3. Netlify will auto-detect settings from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. (Optional) Set environment variables under **Site configuration > Environment variables**:
   - `VITE_SUPABASE_URL`: `https://mlbjulhzbhnqkzzohgcm.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `sb_publishable_wepmD-cYmB4FyuoS2EByeA_pzfVNM_c`
5. Click **Deploy Site**!

### Option B: Netlify CLI Manual Deploy
```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

---

## 🔒 Admin Portal Security & Google OAuth Authentication

- **Zero-Password Security**: Access to `/admin` requires signing in through **Google OAuth** powered by **Supabase Auth**.
- **Role-Based Access Control (RBAC)**: An account is only admitted if it exists in the `public.admin_users` table with `is_active = true`.
- **Row Level Security (RLS)**: Database write operations (creating/editing products, changing order statuses, uploading images) are strictly enforced at the database level by PostgreSQL RLS using `public.is_admin(auth.uid())`.
- **Managing Admin Accounts**: Authorized bakery owners can add or revoke staff accounts directly inside the **Settings** tab via the **Admin Access & Google OAuth Management** panel.
- **Logging Out**: Click the **Sign Out** button in the top navigation bar to terminate the Supabase session.

---

## 🚀 How to Publish to GitHub

### 1. Initialize Git and Push to GitHub

If you haven't yet pushed to your GitHub repository:

```bash
# 1. Initialize git repository
git init

# 2. Add all project files
git add .

# 3. Create initial commit
git commit -m "Initial commit: Punjabi Bistro & Bakery Web App"

# 4. Set default branch to main
git branch -M main

# 5. Link your GitHub remote repository (replace with your repository URL)
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPOSITORY-NAME>.git

# 6. Push to GitHub
git push -u origin main
```

---

## 🌐 How to Deploy for Free

### Option A: Deploy on GitHub Pages

1. In `vite.config.ts`, `base: './'` is already configured for relative path resolution.
2. Run build:
   ```bash
   npm run build
   ```
3. Push the `dist/` folder to a `gh-pages` branch, or go to your GitHub repository:
   - **Settings** → **Pages**
   - Under **Build and deployment**, select **GitHub Actions** and choose the standard **Static HTML** or **Vite** template.

### Option B: Deploy on Vercel (Recommended for 1-Click Zero Config)

1. Go to [vercel.com](https://vercel.com) and click **Add New** → **Project**.
2. Select your GitHub repository.
3. Keep default settings (Vite Framework preset).
4. Add environment variables if desired (or use the built-in defaults):
   - `VITE_SUPABASE_URL`: `https://mlbjulhzbhnqkzzohgcm.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `sb_publishable_wepmD-cYmB4FyuoS2EByeA_pzfVNM_c`
5. Click **Deploy**!

---

## 🗄️ Setting Up Supabase Database

This repository includes a ready-to-run schema file: `supabase-schema.sql`.

1. Open your [Supabase Dashboard](https://supabase.com/dashboard/project/mlbjulhzbhnqkzzohgcm).
2. Navigate to **SQL Editor** in the left sidebar.
3. Click **New Query**, paste the contents of `supabase-schema.sql`, and click **Run**.
4. All tables (`orders`, `custom_cake_enquiries`, `reviews`, `customer_issues`), Row Level Security policies, and Realtime publications will be created instantly.

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Build for production
npm run build

# Type check / Lint
npm run lint
```

---

## 📂 Key Architecture & Routing

- `/src/pages/StorefrontPage.tsx`: Main customer facing store and ordering platform.
- `/src/pages/AdminPage.tsx`: Dedicated kitchen operations, menu manager, and analytics portal.
- `/src/pages/OrderTrackingPage.tsx`: Dedicated customer order lookup and tracking page.
- `/src/context/StoreContext.tsx`: Unified cart, menu, favorites, and live order state.
- `/src/lib/supabase.ts`: Supabase client and sync helpers with automatic offline resilience.
- `/public/logoo.png`: Official Punjabi Bistro & Bakery circular badge logo.
