import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
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
// 3. PERSISTENT ADMIN CREDENTIAL & ADMIN_KEYS STORE
// ============================================================================
const DATA_DIR = path.join(process.cwd(), 'data');
const ADMIN_KEYS_FILE = path.join(DATA_DIR, 'admin-keys.json');

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

/**
 * Loads admin record strictly server-side:
 * 1. Attempts to read from Supabase public.admin_keys
 * 2. Falls back to protected local file data/admin-keys.json (0600 mode)
 */
async function loadAdminRecord(username: string): Promise<StoredAdminRecord | null> {
  const cleanUser = username.trim().toLowerCase();

  // Try Supabase admin_keys table first
  try {
    const { data, error } = await supabase
      .from('admin_keys')
      .select('id, username, password_hash, security_key_hash, created_at, updated_at')
      .ilike('username', cleanUser)
      .limit(1)
      .maybeSingle();

    if (!error && data && data.password_hash && data.security_key_hash) {
      return {
        id: data.id,
        username: data.username,
        password_hash: data.password_hash,
        security_key_hash: data.security_key_hash,
        is_active: true,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    }
  } catch {
    // Fall through to secure local store
  }

  // Fallback to secure server store
  ensureDataDir();
  const fileCandidates = [
    ADMIN_KEYS_FILE,
    path.join(DATA_DIR, 'admin-credentials.json'),
  ];

  for (const f of fileCandidates) {
    if (fs.existsSync(f)) {
      try {
        const raw = fs.readFileSync(f, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.username && parsed.password_hash && parsed.security_key_hash) {
          if (parsed.username.toLowerCase() === cleanUser) {
            return parsed as StoredAdminRecord;
          }
        }
      } catch {
        // ignore
      }
    }
  }

  return null;
}

/**
 * Saves admin record securely:
 * 1. Writes to data/admin-keys.json with 0600 (owner-only) permissions
 * 2. Syncs to Supabase public.admin_keys if database permissions allow
 */
async function saveAdminRecord(record: StoredAdminRecord): Promise<void> {
  ensureDataDir();
  fs.writeFileSync(ADMIN_KEYS_FILE, JSON.stringify(record, null, 2), {
    mode: 0o600, // Read/write only for process owner
  });

  try {
    await supabase.from('admin_keys').upsert(
      {
        username: record.username.toLowerCase(),
        password_hash: record.password_hash,
        security_key_hash: record.security_key_hash,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'username' }
    );
  } catch {
    // Local store is authoritative if database permissions are restricted
  }
}

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
// 6. TWO-STEP ADMIN AUTHENTICATION API ROUTES
// ============================================================================

/**
 * STEP 1: Username & Password Verification
 * POST /api/admin/login-step1 and /api/admin/auth/step1
 * Verifies username and password against database/stored hash.
 * If valid, returns a short-lived, HMAC-signed Step 1 Challenge Token.
 * NEVER returns password hash or credential information.
 */
async function handleStep1Login(req: Request, res: Response): Promise<void> {
  const clientIp = getClientIdentifier(req);
  const { limited, retryAfterSeconds } = isRateLimited(clientIp);

  if (limited) {
    res.status(429).json({
      error: `Too many attempts. Please wait ${retryAfterSeconds} seconds before trying again.`,
    });
    return;
  }

  const { username, password } = req.body || {};

  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    !username.trim() ||
    !password
  ) {
    recordFailedAttempt(clientIp);
    await new Promise((r) => setTimeout(r, 500));
    res.status(401).json({ error: 'Invalid username or password.' });
    return;
  }

  const cleanUsername = username.trim();

  // 1. Try Supabase RPC auth_verify_admin_step1 first
  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc('auth_verify_admin_step1', {
      p_username: cleanUsername,
      p_password_attempt: password,
    });
    if (!rpcErr && rpcData && rpcData.success) {
      resetRateLimit(clientIp);
      const step1Token = createStep1Token(rpcData.username || cleanUsername);
      res.json({
        success: true,
        step: 1,
        step1Token,
        message: 'Step 1 verification successful. Please enter your security key.',
      });
      return;
    }
  } catch {
    // Fall through to local record verification
  }

  // 2. Local fallback verification
  const adminRecord = await loadAdminRecord(cleanUsername);

  if (!adminRecord || !adminRecord.is_active) {
    recordFailedAttempt(clientIp);
    dummyHashVerification(password);
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 200));
    res.status(401).json({ error: 'Invalid username or password.' });
    return;
  }

  const isPasswordValid = verifySecret(password, adminRecord.password_hash);

  if (!isPasswordValid) {
    recordFailedAttempt(clientIp);
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 200));
    res.status(401).json({ error: 'Invalid username or password.' });
    return;
  }

  // Step 1 Success: Issue a single-use 5-minute challenge token for Step 2
  resetRateLimit(clientIp);
  const step1Token = createStep1Token(adminRecord.username);

  res.json({
    success: true,
    step: 1,
    step1Token,
    message: 'Step 1 verification successful. Please enter your security key.',
  });
}

app.post('/api/admin/login-step1', handleStep1Login);
app.post('/api/admin/auth/step1', handleStep1Login);

/**
 * STEP 2: Security Key Verification
 * POST /api/admin/login-step2 and /api/admin/auth/step2
 * Validates the single-use Step 1 Challenge Token and verifies the Security Key.
 * Only after BOTH steps succeed is the full admin session established.
 * NEVER returns security key hash or credentials.
 */
async function handleStep2Login(req: Request, res: Response): Promise<void> {
  const clientIp = getClientIdentifier(req);
  const { limited, retryAfterSeconds } = isRateLimited(clientIp);

  if (limited) {
    res.status(429).json({
      error: `Too many attempts. Please wait ${retryAfterSeconds} seconds before trying again.`,
    });
    return;
  }

  const { step1Token, securityKey } = req.body || {};

  if (
    typeof step1Token !== 'string' ||
    typeof securityKey !== 'string' ||
    !step1Token.trim() ||
    !securityKey.trim()
  ) {
    recordFailedAttempt(clientIp);
    await new Promise((r) => setTimeout(r, 500));
    res.status(401).json({ error: 'Invalid security key.' });
    return;
  }

  // Verify and consume Step 1 Challenge Token
  const step1Result = verifyStep1Token(step1Token.trim());
  if (!step1Result.valid || !step1Result.username) {
    recordFailedAttempt(clientIp);
    await new Promise((r) => setTimeout(r, 500));
    res.status(401).json({
      error: step1Result.error || 'Verification session expired. Please start over from step 1.',
      requiresStep1: true,
    });
    return;
  }

  // 1. Try Supabase RPC auth_verify_admin_step2 first
  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc('auth_verify_admin_step2', {
      p_username: step1Result.username,
      p_security_key_attempt: securityKey,
    });
    if (!rpcErr && rpcData && rpcData.success) {
      resetRateLimit(clientIp);
      const { token, expiresAt } = createSessionToken(rpcData.username || step1Result.username);
      res.json({
        success: true,
        username: rpcData.username || step1Result.username,
        token,
        expiresAt,
      });
      return;
    }
  } catch {
    // Fall through to local record verification
  }

  // 2. Local fallback verification
  const adminRecord = await loadAdminRecord(step1Result.username);
  if (!adminRecord || !adminRecord.is_active) {
    recordFailedAttempt(clientIp);
    dummyHashVerification(securityKey);
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 200));
    res.status(401).json({ error: 'Invalid security key.' });
    return;
  }

  const isKeyValid = verifySecret(securityKey, adminRecord.security_key_hash);

  if (!isKeyValid) {
    recordFailedAttempt(clientIp);
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 200));
    res.status(401).json({ error: 'Invalid security key.' });
    return;
  }

  // Step 2 Success: Issue authenticated administrative session
  resetRateLimit(clientIp);
  const { token, expiresAt } = createSessionToken(adminRecord.username);

  res.json({
    success: true,
    username: adminRecord.username,
    token,
    expiresAt,
  });
}

app.post('/api/admin/login-step2', handleStep2Login);
app.post('/api/admin/auth/step2', handleStep2Login);

/**
 * POST /api/admin/recover
 * Emergency admin account recovery and credential reset.
 * Validates single-use recovery token from Supabase or local server file.
 * Hashes new password and security key with bcrypt before saving.
 * Immediately destroys the recovery token to prevent replay attacks.
 */
app.post('/api/admin/recover', async (req: Request, res: Response) => {
  const clientIp = getClientIdentifier(req);
  const { limited, retryAfterSeconds } = isRateLimited(clientIp);

  if (limited) {
    res.status(429).json({
      error: `Too many attempts. Please wait ${retryAfterSeconds} seconds before trying again.`,
    });
    return;
  }

  const { recoveryToken, newUsername, newPassword, newSecurityKey } = req.body || {};

  if (
    typeof recoveryToken !== 'string' ||
    typeof newUsername !== 'string' ||
    typeof newPassword !== 'string' ||
    typeof newSecurityKey !== 'string' ||
    !recoveryToken.trim() ||
    !newUsername.trim() ||
    !newPassword ||
    !newSecurityKey
  ) {
    recordFailedAttempt(clientIp);
    res.status(400).json({ error: 'All fields are required for admin credential recovery.' });
    return;
  }

  const cleanToken = recoveryToken.trim();
  const cleanUsername = newUsername.trim().toLowerCase();

  if (cleanUsername.length < 3) {
    res.status(400).json({ error: 'Username must be at least 3 characters.' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters.' });
    return;
  }

  if (newSecurityKey.length < 4) {
    res.status(400).json({ error: 'Security key must be at least 4 characters.' });
    return;
  }

  let isTokenValid = false;

  // 1. Check Supabase admin_verify_and_consume_recovery_token RPC
  try {
    const { data: dbValid, error: dbErr } = await supabase.rpc('admin_verify_and_consume_recovery_token', {
      p_token: cleanToken,
    });
    if (!dbErr && dbValid === true) {
      isTokenValid = true;
    }
  } catch {}

  // 2. Check local server emergency recovery key file
  const localRecoveryFile = path.join(DATA_DIR, 'admin-recovery.key');
  if (!isTokenValid && fs.existsSync(localRecoveryFile)) {
    try {
      const storedKey = fs.readFileSync(localRecoveryFile, 'utf-8').trim();
      if (storedKey && storedKey.toUpperCase() === cleanToken.toUpperCase()) {
        isTokenValid = true;
        // Single-use: immediately delete the recovery key file
        try { fs.unlinkSync(localRecoveryFile); } catch {}
      }
    } catch {}
  }

  if (!isTokenValid) {
    recordFailedAttempt(clientIp);
    await new Promise((r) => setTimeout(r, 600));
    res.status(401).json({ error: 'Invalid or expired recovery key.' });
    return;
  }

  // Generate cryptographic bcrypt hashes
  const passwordHash = hashSecret(newPassword);
  const securityKeyHash = hashSecret(newSecurityKey);

  const newAdminRecord: StoredAdminRecord = {
    id: crypto.randomUUID(),
    username: cleanUsername,
    password_hash: passwordHash,
    security_key_hash: securityKeyHash,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Save to local secure store (0600 mode)
  await saveAdminRecord(newAdminRecord);

  // Sync to Supabase if set_admin_credentials exists
  try {
    await supabase.rpc('set_admin_credentials', {
      p_username: cleanUsername,
      p_new_password: newPassword,
      p_new_security_key: newSecurityKey,
    });
  } catch {}

  // Reset rate limits on success
  resetRateLimit(clientIp);

  // Issue authenticated admin session
  const { token, expiresAt } = createSessionToken(cleanUsername);

  res.json({
    success: true,
    username: cleanUsername,
    token,
    expiresAt,
    message: 'Admin credentials successfully established. You are now logged in.',
  });
});

/**
 * All-in-one Admin Login (For compatibility / direct verification)
 * POST /api/admin/login
 * Performs server-side verification of Username, Password, and Security Key.
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

  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    typeof securityKey !== 'string' ||
    !username.trim() ||
    !password ||
    !securityKey
  ) {
    recordFailedAttempt(clientIp);
    await new Promise((r) => setTimeout(r, 500));
    res.status(401).json({ error: 'Invalid login details.' });
    return;
  }

  const cleanUsername = username.trim();
  const adminRecord = await loadAdminRecord(cleanUsername);

  if (!adminRecord || !adminRecord.is_active) {
    recordFailedAttempt(clientIp);
    dummyHashVerification(password);
    dummyHashVerification(securityKey);
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 200));
    res.status(401).json({ error: 'Invalid login details.' });
    return;
  }

  const isPasswordValid = verifySecret(password, adminRecord.password_hash);
  const isSecurityKeyValid = isPasswordValid && verifySecret(securityKey, adminRecord.security_key_hash);

  if (!isPasswordValid || !isSecurityKeyValid) {
    recordFailedAttempt(clientIp);
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 200));
    res.status(401).json({ error: 'Invalid login details.' });
    return;
  }

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
 * Requires current password verification and stores one-way cryptographic hashes only.
 */
app.post('/api/admin/credentials/update', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newUsername, newPassword, newSecurityKey } = req.body || {};
    const sessionUsername = req.adminSession?.username;
    if (!sessionUsername) {
      res.status(401).json({ error: 'Session invalid.' });
      return;
    }

    const adminRecord = await loadAdminRecord(sessionUsername);
    if (!adminRecord) {
      res.status(404).json({ error: 'Administrator record not found.' });
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
    if (newSecurityKey && typeof newSecurityKey === 'string' && newSecurityKey.length >= 4) {
      adminRecord.security_key_hash = hashSecret(newSecurityKey);
    }

    adminRecord.updated_at = new Date().toISOString();
    await saveAdminRecord(adminRecord);

    res.json({
      success: true,
      username: adminRecord.username,
      message: 'Credentials updated successfully.',
    });
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
