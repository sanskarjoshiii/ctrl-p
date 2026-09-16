// Admin authentication: password hashing, sessions, role checks and CSRF.
//
// Passwords use scrypt from node:crypto rather than argon2id or bcrypt as the
// issue suggested. Both of those are native builds — a compiler on every deploy
// and another dependency in the supply chain for the one service that guards
// every customer's address and photos. scrypt is memory-hard, in the standard
// library, and the stored format below carries its parameters, so moving to
// argon2id later is a rehash-on-next-login, not a migration.

import { randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { NextFunction, Request, Response } from 'express';
import { can, type AdminRole, type AdminUser, type Permission } from '../../../shared/admin.ts';
import { adminSessions, adminUsers } from './store.ts';

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number, options: { N: number; r: number; p: number; maxmem: number }) => Promise<Buffer>;

// ~64 MB and roughly 100 ms per hash on a small server.
const SCRYPT = { N: 2 ** 16, r: 8, p: 1, maxmem: 128 * 1024 * 1024 };
const KEY_LENGTH = 64;

export const SESSION_COOKIE = 'bd_admin';
/** Idle timeout, refreshed on every authenticated request. */
export const SESSION_IDLE_MS = 12 * 60 * 60 * 1000;

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password.normalize('NFKC'), salt, KEY_LENGTH, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, salt, key] = stored.split('$');
  if (scheme !== 'scrypt') return false;
  const expected = Buffer.from(key, 'base64');
  const actual = await scryptAsync(password.normalize('NFKC'), Buffer.from(salt, 'base64'), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: 256 * 1024 * 1024,
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// --- cookies ---------------------------------------------------------------

/** Minimal cookie reader — the admin needs exactly one cookie. */
export function readCookie(req: Request, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return null;
}

const secureCookies = () => process.env.NODE_ENV === 'production' || process.argv.includes('--prod');

export function setSessionCookie(res: Response, id: string, maxAgeMs: number) {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(id)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${Math.floor(maxAgeMs / 1000)}`,
  ];
  if (secureCookies()) parts.push('Secure');
  res.append('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(res: Response) {
  const parts = [`${SESSION_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Strict', 'Max-Age=0'];
  if (secureCookies()) parts.push('Secure');
  res.append('Set-Cookie', parts.join('; '));
}

// --- login -----------------------------------------------------------------

export class AuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface LoginResult {
  user: AdminUser;
  sessionId: string;
  expiresAt: string;
}

export async function login(email: string, password: string, ip: string | null, userAgent: string | null): Promise<LoginResult> {
  const row = adminUsers.rawByEmail(email);

  // Always spend the time, whether or not the account exists, so response time
  // does not reveal which emails are real.
  const stored = row?.password_hash ?? (await decoyHash());
  const matched = await verifyPassword(password, stored);

  if (!row || !row.active) throw new AuthError(401, 'Email or password is incorrect');

  if (row.locked_until && new Date(row.locked_until) > new Date()) {
    const minutes = Math.ceil((new Date(row.locked_until).getTime() - Date.now()) / 60000);
    throw new AuthError(429, `Too many failed attempts — try again in ${minutes} minute${minutes === 1 ? '' : 's'}`);
  }

  if (!matched) {
    const attempts = row.failed_attempts + 1;
    const lockedUntil = attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS).toISOString() : null;
    adminUsers.recordFailure(row.id, attempts, lockedUntil);
    if (lockedUntil) throw new AuthError(429, 'Too many failed attempts — this account is locked for 15 minutes');
    throw new AuthError(401, 'Email or password is incorrect');
  }

  adminUsers.recordLogin(row.id);
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_IDLE_MS).toISOString();
  adminSessions.create(sessionId, row.id, expiresAt, ip, userAgent);
  return { user: adminUsers.byId(row.id)!, sessionId, expiresAt };
}

let decoy: string | null = null;
/** A real hash to compare against when the account does not exist. */
async function decoyHash() {
  decoy ??= await hashPassword(randomUUID());
  return decoy;
}

// --- request guards --------------------------------------------------------

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AdminUser;
      adminSessionId?: string;
    }
  }
}

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Rejects cross-site state changes. SameSite=Strict already stops the cookie
 * being sent, and this is the belt to that pair of braces: a mutating request
 * must carry an Origin that matches the host it arrived on.
 */
export function csrfGuard(req: Request, res: Response, next: NextFunction) {
  if (!MUTATING.has(req.method)) return next();
  const origin = req.get('origin');
  if (!origin) return next(); // same-origin form posts and curl send none
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return res.status(403).json({ error: 'Bad origin' });
  }
  if (originHost !== req.get('host')) return res.status(403).json({ error: 'Cross-site request blocked' });
  next();
}

/** Loads the session and extends it. Every admin route sits behind this. */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const sessionId = readCookie(req, SESSION_COOKIE);
  if (!sessionId) return res.status(401).json({ error: 'Sign in to continue' });

  const session = adminSessions.get(sessionId);
  if (!session || new Date(session.expires_at) <= new Date()) {
    if (session) adminSessions.destroy(sessionId);
    clearSessionCookie(res);
    return res.status(401).json({ error: 'Your session has expired — sign in again' });
  }

  const user = adminUsers.byId(session.user_id);
  if (!user || !user.active) {
    adminSessions.destroy(sessionId);
    clearSessionCookie(res);
    return res.status(401).json({ error: 'This account is no longer active' });
  }

  const expiresAt = new Date(Date.now() + SESSION_IDLE_MS).toISOString();
  adminSessions.touch(sessionId, expiresAt);
  setSessionCookie(res, sessionId, SESSION_IDLE_MS);

  req.admin = user;
  req.adminSessionId = sessionId;
  next();
}

/** Role check, enforced server side on every endpoint that needs one. */
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.admin?.role as AdminRole | undefined;
    if (!role) return res.status(401).json({ error: 'Sign in to continue' });
    if (!can(role, permission)) return res.status(403).json({ error: 'Your role does not allow this' });
    next();
  };
}

// --- brute-force throttle --------------------------------------------------

const attemptsByIp = new Map<string, { count: number; resetAt: number }>();
const IP_WINDOW_MS = 15 * 60 * 1000;
const IP_MAX_ATTEMPTS = 20;

/** Per-IP throttle on top of the per-account lockout. */
export function loginRateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip ?? 'unknown';
  const now = Date.now();
  const entry = attemptsByIp.get(ip);
  if (!entry || entry.resetAt < now) {
    attemptsByIp.set(ip, { count: 1, resetAt: now + IP_WINDOW_MS });
    return next();
  }
  entry.count++;
  if (entry.count > IP_MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'Too many sign-in attempts from this address — wait a few minutes' });
  }
  next();
}

/** Housekeeping, called on a timer from the server entry point. */
export function purgeExpiredSessions() {
  const removed = adminSessions.purgeExpired();
  if (removed) console.log(`[admin] purged ${removed} expired session(s)`);
}
