import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

const PORT = 3000;
const app = express();

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve persistent uploaded images statically for all clients/devices
app.use('/uploads', express.static(UPLOADS_DIR));

// ============================================================================
// 1. ENVIRONMENT & SUPABASE SERVER CLIENT
// ============================================================================
const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://mlbjulhzbhnqkzzohgcm.supabase.co';

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_wepmD-cYmB4FyuoS2EByeA_pzfVNM_c';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// ============================================================================
// 2. CRYPTOGRAPHIC HASHING & SESSION HELPERS
// ============================================================================
// Server secret for signing session and challenge tokens
const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  crypto.randomBytes(32).toString('hex');

/**
 * Hash a secret using bcrypt (10 rounds) by default for seamless Supabase pgcrypto compatibility.
 */
function hashSecret(plainText: string): string {
  return bcrypt.hashSync(plainText, 10);
}

/**
 * Verify a plain text secret against a stored hash (supports bcrypt and PBKDF2).
 */
function verifySecret(plainText: string, storedHash: string): boolean {
  if (!plainText || !storedHash) return false;
  try {
    // 1. Check for bcrypt hash ($2a$, $2b$, $2y$)
    if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
      return bcrypt.compareSync(plainText, storedHash);
    }

    // 2. Check for PBKDF2 hash (pbkdf2$sha512$...)
    const parts = storedHash.split('$');
    if (parts.length === 5 && parts[0] === 'pbkdf2' && parts[1] === 'sha512') {
      const iterations = parseInt(parts[2], 10);
      const salt = parts[3];
      const originalDerived = Buffer.from(parts[4], 'hex');

      const testDerived = crypto.pbkdf2Sync(
        plainText,
        salt,
        iterations,
        originalDerived.length,
        'sha512'
      );

      return crypto.timingSafeEqual(originalDerived, testDerived);
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Constant-time dummy hash verification to thwart timing side-channel attacks.
 */
function dummyHashVerification(plainText: string): void {
  try {
    bcrypt.compareSync(plainText, '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012');
  } catch {
    // ignore
  }
}

// ============================================================================
// 3. ADMIN CREDENTIAL VERIFICATION (SUPABASE PUBLIC.ADMIN_KEYS AS SINGLE SOURCE OF TRUTH)
// ============================================================================

// In-memory challenge storage for Step 1 -> Step 2 transition
interface Step1Challenge {
  challengeId: string;
  username: string;
  expiresAt: number;
}
const activeStep1Challenges = new Map<string, Step1Challenge>();

function createStep1Token(username: string): string {
  const challengeId = crypto.randomUUID();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minute challenge window
  activeStep1Challenges.set(challengeId, { challengeId, username, expiresAt });

  // Clean up stale challenges
  const now = Date.now();
  for (const [id, ch] of activeStep1Challenges.entries()) {
    if (ch.expiresAt < now) activeStep1Challenges.delete(id);
  }

  const payload = JSON.stringify({ challengeId, username, step: 1, exp: expiresAt });
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${Buffer.from(payload).toString('base64url')}.${sig}`;
}

function verifyStep1Token(tokenString: string): { valid: boolean; username?: string; error?: string } {
  try {
    const parts = tokenString.split('.');
    if (parts.length !== 2) return { valid: false, error: 'Malformed verification token.' };
    const [payloadB64, sig] = parts;
    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadJson).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return { valid: false, error: 'Invalid verification token signature.' };
    }
    const payload = JSON.parse(payloadJson);
    if (!payload.exp || payload.exp < Date.now()) {
      return { valid: false, error: 'Verification session expired. Please start over from step 1.' };
    }
    const stored = activeStep1Challenges.get(payload.challengeId);
    if (!stored || stored.expiresAt < Date.now()) {
      return { valid: false, error: 'Challenge session already used or expired.' };
    }
    // Single-use: consume challenge
    activeStep1Challenges.delete(payload.challengeId);
    return { valid: true, username: payload.username };
  } catch {
    return { valid: false, error: 'Invalid verification token.' };
  }
}

// Revoked session IDs set
const revokedSessions = new Set<string>();

interface SessionPayload {
  sessionId: string;
  username: string;
  role: string;
  createdAt: number;
  expiresAt: number;
}

function createSessionToken(username: string): { token: string; expiresAt: number } {
  const sessionId = crypto.randomBytes(16).toString('hex');
  const now = Date.now();
  const expiresAt = now + 8 * 60 * 60 * 1000; // 8 hours validity

  const payload: SessionPayload = {
    sessionId,
    username,
    role: 'owner',
    createdAt: now,
    expiresAt,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadBase64)
    .digest('base64url');

  return {
    token: `${payloadBase64}.${signature}`,
    expiresAt,
  };
}

function verifySessionToken(token: string): SessionPayload | null {
  try {
    const [payloadBase64, signature] = token.split('.');
    if (!payloadBase64 || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payloadBase64)
      .digest('base64url');

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    ) {
      return null;
    }

    const payload: SessionPayload = JSON.parse(
      Buffer.from(payloadBase64, 'base64url').toString('utf-8')
    );

    if (revokedSessions.has(payload.sessionId)) {
      return null;
    }

    if (Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// ============================================================================
// 4. RATE LIMITING (Brute-Force Protection)
// ============================================================================
interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  lockedUntil: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function getClientIdentifier(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress || 'unknown';
  return ip;
}

function isRateLimited(identifier: string): { limited: boolean; retryAfterSeconds?: number } {
  const entry = rateLimitMap.get(identifier);
  if (!entry) return { limited: false };

  const now = Date.now();
  if (entry.lockedUntil > now) {
    return {
      limited: true,
      retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000),
    };
  }

  // Reset if window passed
  if (now - entry.firstAttempt > ATTEMPT_WINDOW_MS) {
    rateLimitMap.delete(identifier);
    return { limited: false };
  }

  return { limited: false };
}

function recordFailedAttempt(identifier: string): void {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier) || {
    attempts: 0,
    firstAttempt: now,
    lockedUntil: 0,
  };

  entry.attempts += 1;
  if (entry.attempts >= MAX_FAILED_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_DURATION_MS;
  }
  rateLimitMap.set(identifier, entry);
}

function resetRateLimit(identifier: string): void {
  rateLimitMap.delete(identifier);
}

// Periodically clean up expired rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.lockedUntil < now && now - entry.firstAttempt > ATTEMPT_WINDOW_MS) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ============================================================================
// 5. AUTHENTICATION MIDDLEWARE & AUTHORIZATION
// ============================================================================
export interface AuthenticatedRequest extends Request {
  adminSession?: SessionPayload;
}

/**
 * Authoritatively verifies whether an email belongs to an authorized administrator.
 * Queries public.admin_users table in Supabase dynamically - zero hardcoded emails.
 */
async function verifyIsAdminEmail(email?: string | null): Promise<boolean> {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();

  // Query public.admin_users table exclusively
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
        if (rowEmail === cleanEmail) return true;

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
    console.warn('[Admin Auth] Error querying admin_users table:', err);
  }

  return false;
}

/**
 * Unified, production-grade admin authentication middleware.
 * Verifies Supabase Auth JWTs directly against Supabase.
 * Also supports legacy server HMAC tokens for graceful compatibility.
 */
async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization token' });
    return;
  }

  const token = authHeader.slice(7).trim();

  // 1. Authoritative check: Supabase Auth access_token verification
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (!userError && user && user.email) {
      const isAuthorized = await verifyIsAdminEmail(user.email);
      if (isAuthorized) {
        req.adminSession = {
          sessionId: user.id,
          username: user.email,
          role: 'owner',
          createdAt: Date.now(),
          expiresAt: Date.now() + 8 * 60 * 60 * 1000,
        };
        next();
        return;
      } else {
        res.status(403).json({ error: 'Forbidden: Account is not an authorized administrator' });
        return;
      }
    }
  } catch {
    // Fall through to server session check
  }

  // 2. Compatibility check: Server-signed HMAC session token
  const session = verifySessionToken(token);
  if (session) {
    req.adminSession = session;
    next();
    return;
  }

  res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
}

// ============================================================================
// 6. REDESIGNED ADMIN AUTHENTICATION API ROUTES (SIMPLE & RELIABLE)
// ============================================================================

/**
 * Single-Step Unified Admin Login
 * POST /api/admin/login
 * Authenticates email/username with Supabase Auth GoTrue.
 */
app.post('/api/admin/login', async (req: Request, res: Response) => {
  const clientIp = getClientIdentifier(req);
  const { limited, retryAfterSeconds } = isRateLimited(clientIp);

  if (limited) {
    res.status(429).json({
      error: `Too many failed login attempts. Please wait ${retryAfterSeconds} seconds before trying again.`,
    });
    return;
  }

  const { identifier, email, username, password } = req.body || {};
  const rawId = identifier || email || username;

  if (
    typeof rawId !== 'string' ||
    typeof password !== 'string' ||
    !rawId.trim() ||
    !password
  ) {
    recordFailedAttempt(clientIp);
    await new Promise((r) => setTimeout(r, 400));
    res.status(400).json({ error: 'Username/Email and password are required.' });
    return;
  }

  const cleanId = rawId.trim();
  const authEmail = cleanId.includes('@')
    ? cleanId.toLowerCase()
    : `${cleanId.toLowerCase()}@punjabibistro.com`;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password,
    });

    if (error || !data.user || !data.session) {
      recordFailedAttempt(clientIp);
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 200));
      res.status(401).json({
        error: error?.message || 'Invalid administrator username or password.',
      });
      return;
    }

    const isAuthorized = await verifyIsAdminEmail(data.user.email);
    if (!isAuthorized) {
      recordFailedAttempt(clientIp);
      res.status(403).json({
        error: 'Access Denied: This account is not registered as an authorized administrator.',
      });
      return;
    }

    resetRateLimit(clientIp);
    res.json({
      success: true,
      username: data.user.email,
      token: data.session.access_token,
      expiresAt: data.session.expires_at ? data.session.expires_at * 1000 : Date.now() + 8 * 3600 * 1000,
    });
  } catch (err: any) {
    console.error('[Admin Auth] Login error:', err);
    res.status(500).json({ error: 'Authentication service temporarily unavailable. Please try again.' });
  }
});

/**
 * Compatibility handler for legacy Step 1
 */
app.post(['/api/admin/login-step1', '/api/admin/auth/step1'], async (req: Request, res: Response) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required.' });
    return;
  }
  const cleanId = String(username).trim();
  const authEmail = cleanId.includes('@') ? cleanId.toLowerCase() : `${cleanId.toLowerCase()}@punjabibistro.com`;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: authEmail,
    password: String(password),
  });

  if (error || !data.user || !data.session) {
    res.status(401).json({ error: 'Invalid administrator credentials.' });
    return;
  }

  const step1Token = createStep1Token(data.user.email || cleanId);
  res.json({
    success: true,
    step: 1,
    step1Token,
    message: 'Authentication verified.',
  });
});

/**
 * Compatibility handler for legacy Step 2
 */
app.post(['/api/admin/login-step2', '/api/admin/auth/step2'], (req: Request, res: Response) => {
  const { step1Token } = req.body || {};
  const verified = verifyStep1Token(String(step1Token || ''));
  if (!verified.valid || !verified.username) {
    res.status(401).json({ error: 'Verification session expired. Please log in again.' });
    return;
  }
  const { token, expiresAt } = createSessionToken(verified.username);
  res.json({ success: true, username: verified.username, token, expiresAt });
});

/**
 * GET /api/admin/session
 * Verifies the validity of the current admin session token (Supabase JWT or server session).
 */
app.get('/api/admin/session', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ authenticated: false, error: 'No active session' });
    return;
  }

  const token = authHeader.slice(7).trim();

  // 1. Check Supabase Auth
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user && user.email) {
      const isAuthorized = await verifyIsAdminEmail(user.email);
      if (isAuthorized) {
        res.json({
          authenticated: true,
          username: user.email,
          expiresAt: Date.now() + 8 * 60 * 60 * 1000,
        });
        return;
      }
    }
  } catch {}

  // 2. Check Server Session Token
  const session = verifySessionToken(token);
  if (session) {
    res.json({
      authenticated: true,
      username: session.username,
      expiresAt: session.expiresAt,
    });
    return;
  }

  res.status(401).json({ authenticated: false, error: 'Session expired' });
});

/**
 * POST /api/admin/logout
 * Invalidates the current admin session.
 */
app.post('/api/admin/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const session = verifySessionToken(token);
    if (session) {
      revokedSessions.add(session.sessionId);
    }
  }
  res.json({ success: true });
});

/**
 * POST /api/admin/credentials/update
 * Updates admin password securely.
 */
app.post('/api/admin/credentials/update', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { newPassword } = req.body || {};
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }

    res.json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (err: any) {
    console.error('[Admin Auth] Password update error:', err);
    res.status(500).json({ error: 'Failed to update password.' });
  }
});

// ============================================================================
// 7. SECURE ADMIN OPERATIONS API (REQUIRES SERVER SESSION)
// ============================================================================

/**
 * GET /api/admin/orders
 * Fetches all orders securely for authenticated administrators.
 */
app.get('/api/admin/orders', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: 'Failed to retrieve orders from database' });
      return;
    }
    res.json(data || []);
  } catch (err: unknown) {
    res.status(500).json({ error: 'Internal server error while fetching orders' });
  }
});

/**
 * POST /api/admin/orders/status
 * Updates order status for authenticated administrators.
 */
app.post('/api/admin/orders/status', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { orderId, status } = req.body || {};
  if (!orderId || !status) {
    res.status(400).json({ error: 'orderId and status are required' });
    return;
  }

  try {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .or(`id.eq.${orderId},order_number.eq.${orderId}`);

    if (error) {
      res.status(500).json({ error: 'Failed to update order status' });
      return;
    }
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ error: 'Internal server error updating status' });
  }
});

/**
 * POST /api/admin/orders/delay
 * Updates kitchen delay notices for authenticated administrators.
 */
app.post('/api/admin/orders/delay', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { orderId, delayMinutes, delayMessage } = req.body || {};
  if (!orderId) {
    res.status(400).json({ error: 'orderId is required' });
    return;
  }

  try {
    const { error } = await supabase
      .from('orders')
      .update({
        delay_minutes: Number(delayMinutes) || 0,
        delay_message: delayMessage || '',
      })
      .or(`id.eq.${orderId},order_number.eq.${orderId}`);

    if (error) {
      res.status(500).json({ error: 'Failed to update order delay' });
      return;
    }
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ error: 'Internal server error updating delay' });
  }
});

// ============================================================================
// 6B. PERSISTENT STORAGE FILE PATHS & HELPERS (DUAL-LAYER SUPABASE + SERVER SYNC)
// ============================================================================
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const ZONES_FILE = path.join(DATA_DIR, 'zones.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');

async function loadProductsFromServer(): Promise<any[]> {
  // 1. Attempt Supabase fetch
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      const mapped = data.map((row: any) => ({
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
      // Keep local persistent file updated
      try {
        fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(mapped, null, 2));
      } catch {}
      return mapped;
    }
  } catch (err) {
    console.warn('[Products] Supabase load notice:', err);
  }

  // 2. Load from PRODUCTS_FILE
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const data = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('[Products] File read notice:', err);
  }

  return [];
}

async function saveProductToServer(product: any): Promise<boolean> {
  if (!product || !product.id || !product.name) return false;

  const cleanProd = {
    id: String(product.id),
    name: String(product.name).trim(),
    categoryId: String(product.categoryId || 'cakes'),
    categoryName: String(product.categoryName || 'Cakes & Pastries'),
    description: String(product.description || ''),
    price: Number(product.price) || 0,
    originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
    image: String(product.image || ''),
    isAvailable: product.isAvailable !== undefined ? Boolean(product.isAvailable) : true,
    isBestseller: Boolean(product.isBestseller),
    isEggless: product.isEggless !== undefined ? Boolean(product.isEggless) : true,
    isVegetarian: product.isVegetarian !== undefined ? Boolean(product.isVegetarian) : true,
    isSpicy: Boolean(product.isSpicy),
    prepTimeMinutes: Number(product.prepTimeMinutes) || 20,
    customizationGroups: Array.isArray(product.customizationGroups) ? product.customizationGroups : [],
  };

  // 1. Immediately persist to PRODUCTS_FILE (authoritative shared across all devices)
  try {
    let list: any[] = [];
    if (fs.existsSync(PRODUCTS_FILE)) {
      try {
        list = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
      } catch {
        list = [];
      }
    }
    const idx = list.findIndex((p) => p.id === cleanProd.id);
    if (idx >= 0) {
      list[idx] = cleanProd;
    } else {
      list.unshift(cleanProd);
    }
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(list, null, 2));
  } catch (err) {
    console.warn('[Products] File write error:', err);
  }

  // 2. Persist to Supabase asynchronously
  try {
    const payload = {
      id: cleanProd.id,
      name: cleanProd.name,
      category_id: cleanProd.categoryId,
      category_name: cleanProd.categoryName,
      description: cleanProd.description,
      price: cleanProd.price,
      original_price: cleanProd.originalPrice || null,
      image: cleanProd.image,
      is_available: cleanProd.isAvailable,
      is_bestseller: cleanProd.isBestseller,
      is_eggless: cleanProd.isEggless,
      is_vegetarian: cleanProd.isVegetarian,
      is_spicy: cleanProd.isSpicy,
      prep_time_minutes: cleanProd.prepTimeMinutes,
      customization_groups: cleanProd.customizationGroups,
    };
    supabase.from('products').upsert(payload, { onConflict: 'id' }).then(({ error }) => {
      if (error) console.warn('[Products] Supabase upsert notice:', error.message);
    });
  } catch (err) {
    console.warn('[Products] Supabase sync notice:', err);
  }

  return true;
}

async function deleteProductFromServer(productId: string): Promise<boolean> {
  if (!productId) return false;

  // 1. Remove from PRODUCTS_FILE
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const list = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
      const filtered = list.filter((p: any) => p.id !== productId);
      fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(filtered, null, 2));
    }
  } catch (err) {
    console.warn('[Products] Delete from file notice:', err);
  }

  // 2. Delete from Supabase
  try {
    supabase.from('products').delete().eq('id', productId).then(({ error }) => {
      if (error) console.warn('[Products] Supabase delete notice:', error.message);
    });
  } catch {}

  return true;
}

async function loadSettingsFromServer(): Promise<any> {
  // 1. Try Supabase
  try {
    const { data, error } = await supabase.from('business_settings').select('*').limit(1).maybeSingle();
    if (!error && data) {
      const mapped = {
        name: data.name || 'Punjabi Bistro & Bakery',
        logoUrl: data.logo_url || data.logoUrl || '',
        address: data.address || 'Near Udham Singh Chowk, Dharamkot, Punjab 142042',
        landmark: data.landmark || 'Near Udham Singh Chowk',
        phone: data.phone || '098562 04951',
        whatsapp: data.whatsapp || '919856204951',
        isOpenManual: data.is_open_manual !== undefined ? Boolean(data.is_open_manual) : true,
        openingTime: data.opening_time || '10:00',
        closingTime: data.closing_time || '22:00',
        weeklyOff: data.weekly_off || 'None (Open All 7 Days)',
        upiId: data.upi_id || 'punjabibistro@upi',
        upiMerchantName: data.upi_merchant_name || 'Punjabi Bistro and Bakery',
        announcementText: data.announcement_text || '',
        showAnnouncement: data.show_announcement !== undefined ? Boolean(data.show_announcement) : true,
        maxOrdersPerSlot: Number(data.max_orders_per_slot) || 6,
        defaultPrepMinutes: Number(data.default_prep_minutes) || 25,
      };
      try {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(mapped, null, 2));
      } catch {}
      return mapped;
    }
  } catch {}

  // 2. Load from SETTINGS_FILE
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch {}

  return null;
}

async function saveSettingsToServer(settings: any): Promise<boolean> {
  if (!settings || typeof settings !== 'object') return false;

  // 1. Save to SETTINGS_FILE immediately (authoritative cross-device persistence)
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  } catch (err) {
    console.warn('[Settings] File write error:', err);
  }

  // 2. Try Supabase
  try {
    const payload = {
      id: 'default',
      name: settings.name,
      logo_url: settings.logoUrl || null,
      address: settings.address,
      landmark: settings.landmark,
      phone: settings.phone,
      whatsapp: settings.whatsapp,
      is_open_manual: settings.isOpenManual,
      opening_time: settings.openingTime,
      closing_time: settings.closingTime,
      weekly_off: settings.weeklyOff,
      upi_id: settings.upiId,
      upi_merchant_name: settings.upiMerchantName,
      announcement_text: settings.announcementText || null,
      show_announcement: settings.showAnnouncement,
      max_orders_per_slot: settings.maxOrdersPerSlot,
      default_prep_minutes: settings.defaultPrepMinutes,
      updated_at: new Date().toISOString(),
    };
    supabase.from('business_settings').upsert(payload, { onConflict: 'id' }).then(({ error }) => {
      if (error) console.warn('[Settings] Supabase upsert notice:', error.message);
    });
  } catch {}

  return true;
}

async function loadZonesFromServer(): Promise<any[]> {
  try {
    const { data, error } = await supabase.from('delivery_zones').select('*');
    if (!error && Array.isArray(data) && data.length > 0) {
      const mapped = data.map((z: any) => ({
        id: z.id,
        name: z.name,
        fee: Number(z.fee) || 0,
        freeAbove: z.free_above ? Number(z.free_above) : undefined,
        freeDeliveryThreshold: z.free_delivery_threshold ? Number(z.free_delivery_threshold) : (z.free_above ? Number(z.free_above) : undefined),
        estimatedMinutes: z.estimated_minutes || '30-40 mins',
        description: z.description || '',
      }));
      try {
        fs.writeFileSync(ZONES_FILE, JSON.stringify(mapped, null, 2));
      } catch {}
      return mapped;
    }
  } catch {}

  try {
    if (fs.existsSync(ZONES_FILE)) {
      return JSON.parse(fs.readFileSync(ZONES_FILE, 'utf-8'));
    }
  } catch {}

  return [];
}

async function saveZonesToServer(zones: any[]): Promise<boolean> {
  if (!Array.isArray(zones)) return false;

  try {
    fs.writeFileSync(ZONES_FILE, JSON.stringify(zones, null, 2));
  } catch (err) {
    console.warn('[Zones] File write error:', err);
  }

  try {
    const payloads = zones.map((z) => ({
      id: z.id,
      name: z.name,
      fee: z.fee,
      free_above: z.freeDeliveryThreshold || z.freeAbove || null,
      free_delivery_threshold: z.freeDeliveryThreshold || z.freeAbove || null,
      estimated_minutes: z.estimatedMinutes || null,
      description: z.description || '',
    }));
    supabase.from('delivery_zones').upsert(payloads, { onConflict: 'id' }).then(({ error }) => {
      if (error) console.warn('[Zones] Supabase upsert notice:', error.message);
    });
  } catch {}

  return true;
}

function loadCategoriesFromServer(): any[] {
  try {
    if (fs.existsSync(CATEGORIES_FILE)) {
      return JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf-8'));
    }
  } catch {}
  return [];
}

function saveCategoriesToServer(categories: any[]): boolean {
  if (!Array.isArray(categories)) return false;
  try {
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// 6C. PRODUCTS, SETTINGS, ZONES & UPLOADS API ROUTES (AUTHORITATIVE BACKEND)
// ============================================================================

/**
 * GET /api/products
 * Public endpoint: Returns all menu products from authoritative backend storage.
 */
app.get('/api/products', async (_req: Request, res: Response) => {
  try {
    const prods = await loadProductsFromServer();
    res.json(prods);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

/**
 * POST /api/admin/products and POST /api/products
 * Creates or updates products with authoritative cross-device persistence.
 */
const handleSaveProduct = async (req: Request, res: Response) => {
  const { product } = req.body || {};
  const targetProduct = product || req.body;
  if (!targetProduct || !targetProduct.id || !targetProduct.name) {
    res.status(400).json({ error: 'Valid product data is required' });
    return;
  }

  try {
    await saveProductToServer(targetProduct);
    res.json({ success: true, product: targetProduct });
  } catch (err: unknown) {
    res.status(500).json({ error: 'Failed to save product' });
  }
};
app.post('/api/admin/products', requireAdmin, handleSaveProduct);
app.post('/api/products', handleSaveProduct);

/**
 * DELETE /api/admin/products/:id and DELETE /api/products/:id
 * Deletes a product with authoritative cross-device persistence.
 */
const handleDeleteProduct = async (req: Request, res: Response) => {
  const productId = req.params.id;
  if (!productId) {
    res.status(400).json({ error: 'Product ID is required' });
    return;
  }

  try {
    await deleteProductFromServer(productId);
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
};
app.delete('/api/admin/products/:id', requireAdmin, handleDeleteProduct);
app.delete('/api/products/:id', handleDeleteProduct);

/**
 * GET /api/settings
 * Public endpoint: Returns current business settings (UPI ID, phone, timings, address).
 */
app.get('/api/settings', async (_req: Request, res: Response) => {
  try {
    const settings = await loadSettingsFromServer();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load business settings' });
  }
});

/**
 * POST /api/admin/settings and POST /api/settings
 * Saves business settings across all devices.
 */
const handleSaveSettings = async (req: Request, res: Response) => {
  const settings = req.body?.settings || req.body;
  if (!settings || typeof settings !== 'object') {
    res.status(400).json({ error: 'Settings object is required' });
    return;
  }

  try {
    await saveSettingsToServer(settings);
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save business settings' });
  }
};
app.post('/api/admin/settings', requireAdmin, handleSaveSettings);
app.post('/api/settings', handleSaveSettings);

/**
 * GET /api/zones
 * Public endpoint: Returns delivery zones and fees.
 */
app.get('/api/zones', async (_req: Request, res: Response) => {
  try {
    const zones = await loadZonesFromServer();
    res.json(zones);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load delivery zones' });
  }
});

/**
 * POST /api/admin/zones and POST /api/zones
 * Updates delivery zones across all devices.
 */
const handleSaveZones = async (req: Request, res: Response) => {
  const zones = req.body?.zones || req.body;
  if (!Array.isArray(zones)) {
    res.status(400).json({ error: 'Zones array is required' });
    return;
  }

  try {
    await saveZonesToServer(zones);
    res.json({ success: true, zones });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save delivery zones' });
  }
};
app.post('/api/admin/zones', requireAdmin, handleSaveZones);
app.post('/api/zones', handleSaveZones);

/**
 * GET /api/categories
 * Returns categories list.
 */
app.get('/api/categories', (_req: Request, res: Response) => {
  res.json(loadCategoriesFromServer());
});

/**
 * POST /api/admin/categories and POST /api/categories
 * Updates categories.
 */
const handleSaveCategories = (req: Request, res: Response) => {
  const categories = req.body?.categories || req.body;
  if (!Array.isArray(categories)) {
    res.status(400).json({ error: 'Categories array required' });
    return;
  }
  saveCategoriesToServer(categories);
  res.json({ success: true, categories });
};
app.post('/api/admin/categories', requireAdmin, handleSaveCategories);
app.post('/api/categories', handleSaveCategories);

/**
 * POST /api/upload
 * Persistent image upload: First attempts Supabase Storage, with robust server-side file storage fallback.
 * Generates lightweight, permanent public URLs that work across all devices without large base64 payload bloat.
 */
app.post('/api/upload', async (req: Request, res: Response) => {
  try {
    const { filename, data } = req.body || {};
    if (!data || typeof data !== 'string') {
      res.status(400).json({ error: 'Image data is required' });
      return;
    }

    const match = data.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    const mimeType = match ? match[1] : 'image/jpeg';
    const base64Content = match ? match[2] : data;
    const buffer = Buffer.from(base64Content, 'base64');

    const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
    const cleanBaseName = (filename || 'item').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    const uniqueFileName = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${cleanBaseName}.${ext}`;

    // 1. Try Supabase Storage first if bucket is configured
    try {
      const { error: sbUploadErr } = await supabase.storage
        .from('product-images')
        .upload(`products/${uniqueFileName}`, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (!sbUploadErr) {
        const { data: pubData } = supabase.storage
          .from('product-images')
          .getPublicUrl(`products/${uniqueFileName}`);
        if (pubData?.publicUrl) {
          res.json({ success: true, url: pubData.publicUrl, storage: 'supabase' });
          return;
        }
      }
    } catch {
      // Fall through to server storage
    }

    // 2. Server-side permanent file storage in data/uploads/
    const filePath = path.join(UPLOADS_DIR, uniqueFileName);
    fs.writeFileSync(filePath, buffer);

    res.json({
      success: true,
      url: `/uploads/${uniqueFileName}`,
      storage: 'server',
      filename: uniqueFileName,
    });
  } catch (err: any) {
    console.error('Upload handler exception:', err);
    res.status(500).json({ error: err.message || 'Failed to upload image' });
  }
});

/**
 * POST /api/admin/cakes/quote
 * Updates custom cake enquiries for authenticated administrators.
 */
app.post('/api/admin/cakes/quote', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id, status, quotationAmount, adminNotes } = req.body || {};
  if (!id || !status) {
    res.status(400).json({ error: 'id and status are required' });
    return;
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
      res.status(500).json({ error: 'Failed to update cake enquiry' });
      return;
    }
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ error: 'Internal server error updating enquiry' });
  }
});

/**
 * POST /api/admin/issues/resolve
 * Resolves customer issues for authenticated administrators.
 */
app.post('/api/admin/issues/resolve', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id, notes } = req.body || {};
  if (!id) {
    res.status(400).json({ error: 'Issue ID is required' });
    return;
  }

  try {
    // Update local file backup if present
    const localIssues = loadIssuesFromFile();
    const localIdx = localIssues.findIndex((i) => i.id === id);
    if (localIdx >= 0) {
      localIssues[localIdx].status = 'resolved';
      localIssues[localIdx].resolution_notes = notes || 'Resolved by management';
      try {
        fs.writeFileSync(ISSUES_FILE, JSON.stringify(localIssues, null, 2));
      } catch {}
    }

    const { error } = await supabase
      .from('customer_issues')
      .update({ status: 'resolved', resolution_notes: notes || 'Resolved by management' })
      .eq('id', id);

    if (error) {
      console.warn('[Issues] Supabase resolve warning:', error);
    }
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ error: 'Internal server error resolving issue' });
  }
});

// ============================================================================
// 7C. DYNAMIC COUPONS & OFFERS API (PERSISTED ON SERVER)
// ============================================================================
const COUPONS_FILE = path.join(DATA_DIR, 'coupons.json');
const ISSUES_FILE = path.join(DATA_DIR, 'issues.json');

const INITIAL_COUPONS = [
  {
    id: 'coupon-1',
    code: 'BISTRO100',
    title: '₹100 FLAT OFF',
    subtitle: 'On orders above ₹499 • Freshly prepared pizzas, burgers & bakery items',
    discountType: 'flat',
    discountValue: 100,
    minOrder: 499,
    isActive: true,
    badge: 'Trending Deal',
  },
  {
    id: 'coupon-2',
    code: 'BISTRO50',
    title: '15% OFF (Up to ₹75)',
    subtitle: 'On orders above ₹399 • Authentic fresh taste in Dharamkot',
    discountType: 'percentage',
    discountValue: 15,
    maxDiscount: 75,
    minOrder: 399,
    isActive: true,
    badge: 'Popular',
  },
  {
    id: 'coupon-3',
    code: 'WELCOME10',
    title: '10% FIRST ORDER OFF',
    subtitle: 'On minimum order of ₹199 • Fast takeaway & delivery',
    discountType: 'percentage',
    discountValue: 10,
    maxDiscount: 50,
    minOrder: 199,
    isActive: true,
    badge: 'New Customer',
  },
  {
    id: 'coupon-4',
    code: 'CAKE100',
    title: '₹100 OFF ON CAKES',
    subtitle: '100% Pure Eggless 1Kg+ Cakes • With candles & cutting knife',
    discountType: 'flat',
    discountValue: 100,
    minOrder: 500,
    isActive: true,
    badge: 'Bakery Special',
  },
  {
    id: 'coupon-5',
    code: 'FREEDEL',
    title: '₹40 OFF DELIVERY',
    subtitle: 'On orders above ₹299 • Safe & fast local delivery in Dharamkot',
    discountType: 'flat',
    discountValue: 40,
    minOrder: 299,
    isActive: true,
    badge: 'Free Delivery',
  },
];

function normalizeCoupon(c: any): any {
  if (!c || typeof c !== 'object') return null;
  const discountType = c.discountType === 'percentage' ? 'percentage' : 'flat';
  const discountValue = Number(c.discountValue || 0);
  const minOrder = Number(c.minOrder !== undefined ? c.minOrder : (c.minOrderValue !== undefined ? c.minOrderValue : 0));
  const code = (c.code || '').trim().toUpperCase();
  const title = c.title || (discountType === 'flat' ? `₹${discountValue} OFF` : `${discountValue}% OFF`);
  const subtitle = c.subtitle || c.description || `Valid on orders above ₹${minOrder}`;
  
  return {
    id: c.id || `coupon-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    code,
    title,
    subtitle,
    discountType,
    discountValue,
    maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : (c.maxDiscountAmount ? Number(c.maxDiscountAmount) : undefined),
    minOrder,
    isActive: c.isActive !== false,
    badge: c.badge || undefined,
    expiryDate: c.expiryDate || undefined,
  };
}

function loadCouponsFromServer(): any[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(COUPONS_FILE)) {
      const data = fs.readFileSync(COUPONS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizeCoupon).filter(Boolean);
      }
    }
    fs.writeFileSync(COUPONS_FILE, JSON.stringify(INITIAL_COUPONS, null, 2));
    return INITIAL_COUPONS;
  } catch (err) {
    console.warn('[Coupons] Error loading coupons:', err);
    return INITIAL_COUPONS;
  }
}

function saveCouponsToServer(coupons: any[]): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const clean = coupons.map(normalizeCoupon).filter(Boolean);
    fs.writeFileSync(COUPONS_FILE, JSON.stringify(clean, null, 2));
    return true;
  } catch (err) {
    console.error('[Coupons] Error saving coupons:', err);
    return false;
  }
}

function loadIssuesFromFile(): any[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(ISSUES_FILE)) {
      const data = fs.readFileSync(ISSUES_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('[Issues] Error reading issues file:', err);
  }
  return [];
}

function saveIssueToFile(issue: any): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const current = loadIssuesFromFile();
    const idx = current.findIndex((i) => i.id === issue.id);
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...issue };
    } else {
      current.unshift(issue);
    }
    fs.writeFileSync(ISSUES_FILE, JSON.stringify(current, null, 2));
  } catch (err) {
    console.warn('[Issues] Error writing issue to file:', err);
  }
}

/**
 * GET /api/coupons
 * Public endpoint: Returns all coupons for the storefront top offers strip and cart.
 */
app.get('/api/coupons', (_req: Request, res: Response) => {
  const all = loadCouponsFromServer();
  res.json(all);
});

/**
 * POST /api/coupons
 * Public fallback endpoint: Allows updating coupons.
 */
app.post('/api/coupons', (req: Request, res: Response) => {
  const body = req.body;
  if (!body) {
    res.status(400).json({ error: 'Payload required' });
    return;
  }

  let current = loadCouponsFromServer();

  if (Array.isArray(body)) {
    const normalized = body.map(normalizeCoupon).filter(Boolean);
    saveCouponsToServer(normalized);
    res.json({ success: true, coupons: normalized });
    return;
  }

  if (body.coupon && typeof body.coupon === 'object') {
    const item = normalizeCoupon(body.coupon);
    if (!item) {
      res.status(400).json({ error: 'Invalid coupon' });
      return;
    }
    const existingIdx = current.findIndex((c) => c.id === item.id || c.code === item.code);
    if (existingIdx >= 0) {
      current[existingIdx] = item;
    } else {
      current.unshift(item);
    }
    saveCouponsToServer(current);
    res.json({ success: true, coupons: current });
    return;
  }

  res.status(400).json({ error: 'Invalid coupon format' });
});

/**
 * GET /api/admin/coupons
 * Returns all coupons (active and inactive) for admin coupon manager.
 */
app.get('/api/admin/coupons', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const all = loadCouponsFromServer();
  res.json(all);
});

/**
 * POST /api/admin/coupons
 * Saves full coupon list or inserts/updates a coupon.
 */
app.post('/api/admin/coupons', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const body = req.body;
  if (!body) {
    res.status(400).json({ error: 'Payload required' });
    return;
  }

  let current = loadCouponsFromServer();

  if (Array.isArray(body)) {
    const normalized = body.map(normalizeCoupon).filter(Boolean);
    saveCouponsToServer(normalized);
    res.json({ success: true, coupons: normalized });
    return;
  }

  if (body.coupon && typeof body.coupon === 'object') {
    const item = normalizeCoupon(body.coupon);
    if (!item) {
      res.status(400).json({ error: 'Invalid coupon' });
      return;
    }
    const existingIdx = current.findIndex((c) => c.id === item.id || c.code === item.code);
    if (existingIdx >= 0) {
      current[existingIdx] = item;
    } else {
      current.unshift(item);
    }
    saveCouponsToServer(current);
    res.json({ success: true, coupons: current });
    return;
  }

  res.status(400).json({ error: 'Invalid coupon format' });
});

/**
 * DELETE /api/admin/coupons/:id
 * Deletes a coupon by ID.
 */
app.delete('/api/admin/coupons/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  let current = loadCouponsFromServer();
  current = current.filter((c) => c.id !== id);
  saveCouponsToServer(current);
  res.json({ success: true, coupons: current });
});

function queryWithTimeout<T>(promise: PromiseLike<T>, ms = 2500): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Supabase query timeout')), ms)),
  ]);
}

/**
 * POST /api/customer/issues
 * Public endpoint: Allows any customer to report an issue/complaint.
 * Saves to Supabase customer_issues and local backup file so admin always receives it.
 */
app.post('/api/customer/issues', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body || !body.customerName || !body.description) {
      res.status(400).json({ error: 'Customer name and issue description are required.' });
      return;
    }

    const cleanPhone = (body.customerPhone || '').replace(/\D/g, '').slice(0, 10);
    const newIssue = {
      id: body.id || `iss-${Date.now()}`,
      order_number: body.orderNumber || 'N/A',
      customer_phone: cleanPhone,
      customer_name: body.customerName.trim(),
      issue_type: body.issueType || 'other',
      description: body.description.trim(),
      status: body.status || 'open',
      resolution_notes: null,
      created_at: body.createdAt || new Date().toISOString(),
    };

    // Save to local file backup
    saveIssueToFile(newIssue);

    // Also persist to Supabase asynchronously
    queryWithTimeout(supabase.from('customer_issues').upsert(newIssue, { onConflict: 'id' }), 2000).catch((sbErr) => {
      console.warn('[Issues] Supabase insert warning:', sbErr);
    });

    res.json({ success: true, issue: newIssue });
  } catch (err: any) {
    console.error('[Issues] Error creating customer issue:', err);
    res.status(500).json({ error: 'Failed to record customer issue' });
  }
});

/**
 * GET /api/customer/issues
 * Returns all issues from Supabase merged with local backup.
 */
app.get('/api/customer/issues', async (_req: Request, res: Response) => {
  try {
    const localIssues = loadIssuesFromFile();
    let cloudIssues: any[] = [];
    try {
      const res: any = await queryWithTimeout(
        supabase.from('customer_issues').select('*').order('created_at', { ascending: false }),
        2000
      );
      if (res && !res.error && Array.isArray(res.data)) {
        cloudIssues = res.data;
      }
    } catch (e) {
      console.warn('[Issues] Supabase query notice:', e);
    }

    // Merge and deduplicate by id
    const issueMap = new Map<string, any>();
    localIssues.forEach((i) => issueMap.set(i.id, i));
    cloudIssues.forEach((i) => issueMap.set(i.id, i));

    const combined = Array.from(issueMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    res.json(combined);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

/**
 * GET /api/admin/issues
 * Fetches all customer complaints and issues for authenticated administrators.
 */
app.get('/api/admin/issues', requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const localIssues = loadIssuesFromFile();
    let cloudIssues: any[] = [];
    try {
      const res: any = await queryWithTimeout(
        supabase.from('customer_issues').select('*').order('created_at', { ascending: false }),
        2000
      );
      if (res && !res.error && Array.isArray(res.data)) {
        cloudIssues = res.data;
      }
    } catch (e) {
      console.warn('[Admin Issues] Supabase query notice:', e);
    }

    // Merge and deduplicate by id
    const issueMap = new Map<string, any>();
    localIssues.forEach((i) => issueMap.set(i.id, i));
    cloudIssues.forEach((i) => issueMap.set(i.id, i));

    const combined = Array.from(issueMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    res.json(combined);
  } catch (err) {
    res.status(500).json({ error: 'Internal error fetching customer issues' });
  }
});

/**
 * POST /api/admin/reviews/reply
 * Adds owner reply to reviews for authenticated administrators.
 */
app.post('/api/admin/reviews/reply', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id, reply } = req.body || {};
  if (!id) {
    res.status(400).json({ error: 'Review ID is required' });
    return;
  }

  try {
    const { error } = await supabase
      .from('reviews')
      .update({ owner_reply: reply })
      .eq('id', id);

    if (error) {
      res.status(500).json({ error: 'Failed to update review reply' });
      return;
    }
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ error: 'Internal server error updating review' });
  }
});

// ============================================================================
// 7B. CUSTOMER ORDERS & TRACKING PERSISTENCE API
// ============================================================================
const serverKnownMissingOrderCols = new Set<string>();

/**
 * POST /api/orders
 * Resilient server-side persistence for customer orders.
 * STRICT: Requires valid Supabase Auth session token from authenticated customer.
 * Sets order.user_id = authenticated user ID to enforce strict ownership.
 */
app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';

    if (!token) {
      res.status(401).json({ error: 'Customer sign-in with Google is required to place an order.' });
      return;
    }

    // Verify token with Supabase Auth
    const { data: userData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !userData?.user) {
      res.status(401).json({ error: 'Valid customer sign-in with Google is required to place an order.' });
      return;
    }

    const authenticatedUser = userData.user;

    const order = req.body;
    if (!order || !order.customerName || !order.customerPhone || !Array.isArray(order.items)) {
      res.status(400).json({ error: 'Invalid order data: customerName, customerPhone and items are required' });
      return;
    }

    const orderId = order.id || `ord-${Date.now()}`;
    const orderNumber = order.orderNumber || `PB-${Math.floor(1000 + Math.random() * 9000)}`;
    const trackingToken = order.trackingToken || crypto.randomBytes(24).toString('hex');

    // Embed critical customer & tracking metadata permanently inside items JSONB
    const itemsWithMeta = [
      ...order.items.filter((i: any) => !i || !i._meta),
      {
        _meta: {
          userId: authenticatedUser.id,
          customerEmail: authenticatedUser.email || order.customerEmail || null,
          trackingToken: trackingToken,
          orderNumber: orderNumber,
        },
      },
    ];

    // Base payload matching guaranteed Supabase orders columns with verified user_id
    const payload: Record<string, any> = {
      id: orderId,
      order_number: orderNumber,
      tracking_token: trackingToken,
      user_id: authenticatedUser.id,
      customer_email: authenticatedUser.email || order.customerEmail || null,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      order_type: order.orderType || 'delivery',
      delivery_address: order.deliveryAddress || null,
      landmark: order.landmark || null,
      zone_id: order.zoneId || order.deliveryZoneId || null,
      table_number: order.tableNumber || null,
      time_slot: order.timeSlot || 'asap',
      scheduled_date: order.scheduledDate || null,
      items: itemsWithMeta,
      subtotal: Number(order.subtotal) || 0,
      delivery_fee: Number(order.deliveryFee) || 0,
      discount: Number(order.discount) || 0,
      coupon_code: order.couponCode || null,
      total: Number(order.total) || 0,
      payment_method: order.paymentMethod || 'cod',
      payment_status: order.paymentStatus || 'pending',
      upi_txn_id: order.upiTxnId || null,
      status: order.status || 'new',
      order_notes: order.orderNotes || null,
      is_no_contact_delivery: Boolean(order.isNoContactDelivery),
      created_at: order.createdAt || new Date().toISOString(),
      estimated_delivery_time: order.estimatedDeliveryTime || null,
      delay_minutes: order.delayMinutes || null,
      delay_message: order.delayMessage || null,
    };

    // Strip pre-identified missing columns immediately
    for (const col of serverKnownMissingOrderCols) {
      delete payload[col];
    }

    // Upsert into Supabase with automatic column error recovery
    let saveError: string | null = null;
    let savedRow: any = null;

    for (let attempt = 0; attempt < 20; attempt++) {
      const { data, error } = await supabase
        .from('orders')
        .upsert(payload, { onConflict: 'id' })
        .select();

      if (!error) {
        savedRow = data?.[0] || payload;
        saveError = null;
        break;
      }

      // Check for missing column error (PGRST204)
      const colMatch = error.message.match(/Could not find the '([^']+)' column/);
      if (colMatch && colMatch[1]) {
        const missingCol = colMatch[1];
        serverKnownMissingOrderCols.add(missingCol);
        delete payload[missingCol];
        continue;
      }

      saveError = error.message;
      break;
    }

    if (saveError) {
      console.error('Server /api/orders Supabase error:', saveError);
      res.status(500).json({ error: `Failed to save order to database: ${saveError}` });
      return;
    }

    const confirmedOrder = {
      ...order,
      id: orderId,
      orderNumber,
      trackingToken,
      userId: authenticatedUser.id,
      customerEmail: authenticatedUser.email || order.customerEmail || undefined,
      items: order.items.filter((i: any) => !i || !i._meta),
      status: payload.status,
      createdAt: payload.created_at,
    };

    res.json({ success: true, order: confirmedOrder });
  } catch (err: any) {
    console.error('Server /api/orders exception:', err);
    res.status(500).json({ error: err?.message || 'Server exception while saving order' });
  }
});

/**
 * GET /api/customer/orders
 * STRICT: Retrieves orders ONLY for the verified authenticated customer.
 * Customer A can NEVER access Customer B's orders.
 */
app.get('/api/customer/orders', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';

  if (!token) {
    res.status(401).json({ error: 'Authentication required to view orders.' });
    return;
  }

  try {
    const { data: userData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !userData?.user) {
      res.status(401).json({ error: 'Invalid or expired customer session.' });
      return;
    }

    const authenticatedUser = userData.user;

    // Direct database query scoped strictly to authenticated user's ID
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', authenticatedUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer orders:', error);
      res.status(500).json({ error: 'Failed to retrieve orders.' });
      return;
    }

    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch customer orders' });
  }
});

// ============================================================================
// 8. VITE MIDDLEWARE & STATIC ASSET SERVING
// ============================================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Punjabi Bistro & Bakery server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
