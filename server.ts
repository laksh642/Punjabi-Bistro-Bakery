import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

const PORT = 3000;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
// Server secret for signing session tokens (generated on launch or from env)
const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  crypto.randomBytes(32).toString('hex');

const HASH_ITERATIONS = 100000;
const HASH_KEYLEN = 64;
const HASH_DIGEST = 'sha512';

/**
 * Hash a secret using PBKDF2-SHA512 with a cryptographically secure random salt.
 * Output format: pbkdf2$sha512$iterations$saltHex$derivedKeyHex
 */
function hashSecret(plainText: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.pbkdf2Sync(
    plainText,
    salt,
    HASH_ITERATIONS,
    HASH_KEYLEN,
    HASH_DIGEST
  );
  return `pbkdf2$sha512$${HASH_ITERATIONS}$${salt}$${derived.toString('hex')}`;
}

/**
 * Verify a plain text secret against a stored PBKDF2 hash using constant-time comparison.
 */
function verifySecret(plainText: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split('$');
    if (parts.length !== 5 || parts[0] !== 'pbkdf2' || parts[1] !== 'sha512') {
      return false;
    }
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
  } catch {
    return false;
  }
}

/**
 * Perform a dummy hash calculation to eliminate timing side-channels when a user is not found.
 */
function dummyHashVerification(plainText: string): void {
  try {
    crypto.pbkdf2Sync(
      plainText,
      '00112233445566778899aabbccddeeff',
      HASH_ITERATIONS,
      HASH_KEYLEN,
      HASH_DIGEST
    );
  } catch {
    // ignore
  }
}

// ============================================================================
// 3. PERSISTENT ADMIN CREDENTIAL METADATA STORE
// ============================================================================
const DATA_DIR = path.join(process.cwd(), 'data');
const CREDENTIALS_FILE = path.join(DATA_DIR, 'admin-credentials.json');

interface StoredAdminRecord {
  id: string;
  username: string;
  password_hash: string;
  security_key_hash: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadAdminCredentials(): StoredAdminRecord | null {
  ensureDataDir();
  if (fs.existsSync(CREDENTIALS_FILE)) {
    try {
      const raw = fs.readFileSync(CREDENTIALS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.username && parsed.password_hash && parsed.security_key_hash) {
        return parsed as StoredAdminRecord;
      }
    } catch {
      return null;
    }
  }
  return null;
}

function saveAdminCredentials(record: StoredAdminRecord): void {
  ensureDataDir();
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(record, null, 2), {
    mode: 0o600, // Read/write only for process owner
  });
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
// 5. AUTHENTICATION MIDDLEWARE
// ============================================================================
export interface AuthenticatedRequest extends Request {
  adminSession?: SessionPayload;
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization token' });
    return;
  }

  const token = authHeader.slice(7).trim();
  const session = verifySessionToken(token);

  if (!session) {
    res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
    return;
  }

  req.adminSession = session;
  next();
}

// ============================================================================
// 6. ADMIN AUTHENTICATION API ROUTES
// ============================================================================

/**
 * POST /api/admin/login
 * Validates Username, Password, and Security Key.
 * Rate limited to 5 attempts per 15 minutes.
 * Returns signed session token on success.
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

  const { username, password, securityKey } = req.body || {};

  // Validate presence
  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    typeof securityKey !== 'string' ||
    !username.trim() ||
    !password ||
    !securityKey
  ) {
    recordFailedAttempt(clientIp);
    // Artificially delay response to thwart brute-force speed
    await new Promise((r) => setTimeout(r, 600));
    res.status(401).json({ error: 'Invalid login details.' });
    return;
  }

  const cleanUsername = username.trim();
  let adminRecord = loadAdminCredentials();

  // If no administrator has been initialized yet in the secure credential store,
  // the bakery owner sets their initial private credentials on first login.
  if (!adminRecord) {
    const passwordHash = hashSecret(password);
    const securityKeyHash = hashSecret(securityKey);
    const newRecord: StoredAdminRecord = {
      id: crypto.randomUUID(),
      username: cleanUsername,
      password_hash: passwordHash,
      security_key_hash: securityKeyHash,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveAdminCredentials(newRecord);
    adminRecord = newRecord;

    resetRateLimit(clientIp);
    const { token, expiresAt } = createSessionToken(cleanUsername);
    res.json({
      success: true,
      username: cleanUsername,
      token,
      expiresAt,
    });
    return;
  }

  // Check username match
  const isUsernameMatch =
    adminRecord.is_active &&
    adminRecord.username.toLowerCase() === cleanUsername.toLowerCase();

  let isPasswordValid = false;
  let isSecurityKeyValid = false;

  if (isUsernameMatch) {
    isPasswordValid = verifySecret(password, adminRecord.password_hash);
    isSecurityKeyValid = verifySecret(securityKey, adminRecord.security_key_hash);
  } else {
    // Constant-time dummy hashes to prevent username enumeration timing
    dummyHashVerification(password);
    dummyHashVerification(securityKey);
  }

  // Artificial delay (400ms - 700ms)
  await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));

  if (!isUsernameMatch || !isPasswordValid || !isSecurityKeyValid) {
    recordFailedAttempt(clientIp);
    res.status(401).json({ error: 'Invalid login details.' });
    return;
  }

  // Success
  resetRateLimit(clientIp);
  const { token, expiresAt } = createSessionToken(adminRecord.username);

  res.json({
    success: true,
    username: adminRecord.username,
    token,
    expiresAt,
  });
});

/**
 * GET /api/admin/session
 * Verifies the validity of the current admin session token.
 */
app.get('/api/admin/session', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ authenticated: false, error: 'No active session' });
    return;
  }

  const token = authHeader.slice(7).trim();
  const session = verifySessionToken(token);

  if (!session) {
    res.status(401).json({ authenticated: false, error: 'Session expired' });
    return;
  }

  res.json({
    authenticated: true,
    username: session.username,
    expiresAt: session.expiresAt,
  });
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
 * Allows authenticated administrators to update their username, password, or security key.
 */
app.post('/api/admin/credentials/update', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newUsername, newPassword, newSecurityKey } = req.body || {};
    const adminRecord = loadAdminCredentials();
    if (!adminRecord) {
      res.status(404).json({ error: 'No administrator record found.' });
      return;
    }

    // Verify current password
    if (typeof currentPassword !== 'string' || !verifySecret(currentPassword, adminRecord.password_hash)) {
      res.status(401).json({ error: 'Current password is incorrect.' });
      return;
    }

    if (newUsername && typeof newUsername === 'string' && newUsername.trim()) {
      adminRecord.username = newUsername.trim();
    }
    if (newPassword && typeof newPassword === 'string' && newPassword.length >= 6) {
      adminRecord.password_hash = hashSecret(newPassword);
    }
    if (newSecurityKey && typeof newSecurityKey === 'string' && newSecurityKey.length >= 6) {
      adminRecord.security_key_hash = hashSecret(newSecurityKey);
    }

    adminRecord.updated_at = new Date().toISOString();
    saveAdminCredentials(adminRecord);

    res.json({ success: true, username: adminRecord.username, message: 'Credentials updated successfully.' });
  } catch {
    res.status(500).json({ error: 'Failed to update credentials.' });
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

/**
 * POST /api/admin/products
 * Creates or updates products for authenticated administrators.
 */
app.post('/api/admin/products', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { product } = req.body || {};
  if (!product || !product.id || !product.name) {
    res.status(400).json({ error: 'Valid product data is required' });
    return;
  }

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
      is_available: product.isAvailable !== undefined ? product.isAvailable : true,
      is_bestseller: Boolean(product.isBestseller),
      is_eggless: product.isEggless !== undefined ? product.isEggless : true,
      is_vegetarian: product.isVegetarian !== undefined ? product.isVegetarian : true,
      is_spicy: Boolean(product.isSpicy),
      prep_time_minutes: product.prepTimeMinutes || 20,
      customization_groups: product.customizationGroups || [],
    };

    const { error } = await supabase.from('products').upsert(payload, { onConflict: 'id' });
    if (error) {
      res.status(500).json({ error: 'Failed to save product in database' });
      return;
    }
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ error: 'Internal server error saving product' });
  }
});

/**
 * DELETE /api/admin/products/:id
 * Deletes a product for authenticated administrators.
 */
app.delete('/api/admin/products/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const productId = req.params.id;
  if (!productId) {
    res.status(400).json({ error: 'Product ID is required' });
    return;
  }

  try {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      res.status(500).json({ error: 'Failed to delete product' });
      return;
    }
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ error: 'Internal server error deleting product' });
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
    const { error } = await supabase
      .from('customer_issues')
      .update({ status: 'resolved', resolution_notes: notes || 'Resolved by management' })
      .eq('id', id);

    if (error) {
      res.status(500).json({ error: 'Failed to resolve issue' });
      return;
    }
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ error: 'Internal server error resolving issue' });
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

/**
 * POST /api/orders
 * Resilient server-side persistence for customer orders.
 * Inserts order into Supabase with automatic schema column adaptation and
 * metadata preservation inside items JSONB array.
 */
app.post('/api/orders', async (req: Request, res: Response) => {
  try {
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
          userId: order.userId || null,
          customerEmail: order.customerEmail || null,
          trackingToken: trackingToken,
          orderNumber: orderNumber,
        },
      },
    ];

    // Base payload matching guaranteed Supabase orders columns
    const payload: Record<string, any> = {
      id: orderId,
      order_number: orderNumber,
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

    // Upsert into Supabase with automatic column error recovery
    let saveError: string | null = null;
    let savedRow: any = null;

    for (let attempt = 0; attempt < 4; attempt++) {
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
      if (colMatch && colMatch[1] && payload.hasOwnProperty(colMatch[1])) {
        delete payload[colMatch[1]];
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
 * Retrieves all orders for a verified customer by userId, email, or phone.
 */
app.get('/api/customer/orders', async (req: Request, res: Response) => {
  const userId = typeof req.query.userId === 'string' ? req.query.userId.trim() : '';
  const email = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : '';
  const phone = typeof req.query.phone === 'string' ? req.query.phone.replace(/\D/g, '') : '';

  if (!userId && !email && !phone) {
    res.json([]);
    return;
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    if (!Array.isArray(data)) {
      res.json([]);
      return;
    }

    const matched = data.filter((row: any) => {
      // Direct column match if column exists
      if (userId && row.user_id === userId) return true;
      if (email && row.customer_email && row.customer_email.toLowerCase() === email) return true;

      // Meta object in items JSONB
      if (Array.isArray(row.items)) {
        const meta = row.items.find((i: any) => i && i._meta)?._meta;
        if (meta) {
          if (userId && meta.userId === userId) return true;
          if (email && meta.customerEmail && meta.customerEmail.toLowerCase() === email) return true;
        }
      }

      // Phone matching
      if (phone && phone.length >= 10) {
        const cleanRowPhone = String(row.customer_phone || '').replace(/\D/g, '');
        if (cleanRowPhone && (cleanRowPhone === phone || cleanRowPhone.endsWith(phone) || phone.endsWith(cleanRowPhone))) {
          return true;
        }
      }

      return false;
    });

    res.json(matched);
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
