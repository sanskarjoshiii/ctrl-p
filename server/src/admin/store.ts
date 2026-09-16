// Admin users, sessions, order events and notes.

import { randomUUID } from 'node:crypto';
import type { AdminRole, AdminUser, ActorType, OrderEvent, OrderEventType, OrderNote } from '../../../shared/admin.ts';
import type { OrderStatus } from '../../../shared/types.ts';
import { db } from '../db.ts';

type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  active: number;
  failed_attempts: number;
  locked_until: string | null;
  last_login_at: string | null;
  created_at: string;
};

const toUser = (r: UserRow): AdminUser => ({
  id: r.id,
  name: r.name,
  email: r.email,
  role: r.role as AdminRole,
  active: Boolean(r.active),
  lastLoginAt: r.last_login_at,
  createdAt: r.created_at,
});

const userByEmailStmt = db.prepare('SELECT * FROM admin_users WHERE email = ?');
const userByIdStmt = db.prepare('SELECT * FROM admin_users WHERE id = ?');
const userListStmt = db.prepare('SELECT * FROM admin_users ORDER BY created_at');
const userInsertStmt = db.prepare(
  'INSERT INTO admin_users (id, name, email, password_hash, role, active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)',
);
const userCountStmt = db.prepare('SELECT COUNT(*) AS n FROM admin_users');
const userLoginOkStmt = db.prepare('UPDATE admin_users SET failed_attempts = 0, locked_until = NULL, last_login_at = ? WHERE id = ?');
const userLoginFailStmt = db.prepare('UPDATE admin_users SET failed_attempts = ?, locked_until = ? WHERE id = ?');
const userPasswordStmt = db.prepare('UPDATE admin_users SET password_hash = ?, failed_attempts = 0, locked_until = NULL WHERE id = ?');

export const adminUsers = {
  /** Includes the hash and lockout state — only auth.ts should need this. */
  rawByEmail(email: string) {
    return (userByEmailStmt.get(email.toLowerCase()) as UserRow | undefined) ?? null;
  },
  byId(id: string): AdminUser | null {
    const row = userByIdStmt.get(id) as UserRow | undefined;
    return row ? toUser(row) : null;
  },
  list(): AdminUser[] {
    return (userListStmt.all() as UserRow[]).map(toUser);
  },
  count(): number {
    return Number((userCountStmt.get() as { n: number }).n);
  },
  create(name: string, email: string, passwordHash: string, role: AdminRole): AdminUser {
    const id = randomUUID();
    userInsertStmt.run(id, name, email.toLowerCase(), passwordHash, role, new Date().toISOString());
    return adminUsers.byId(id)!;
  },
  recordLogin(id: string) {
    userLoginOkStmt.run(new Date().toISOString(), id);
  },
  recordFailure(id: string, failedAttempts: number, lockedUntil: string | null) {
    userLoginFailStmt.run(failedAttempts, lockedUntil, id);
  },
  setPassword(id: string, passwordHash: string) {
    userPasswordStmt.run(passwordHash, id);
  },
};

type SessionRow = { id: string; user_id: string; expires_at: string; ip: string | null; user_agent: string | null; created_at: string };

const sessionInsertStmt = db.prepare('INSERT INTO admin_sessions (id, user_id, expires_at, ip, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?)');
const sessionGetStmt = db.prepare('SELECT * FROM admin_sessions WHERE id = ?');
const sessionTouchStmt = db.prepare('UPDATE admin_sessions SET expires_at = ? WHERE id = ?');
const sessionDeleteStmt = db.prepare('DELETE FROM admin_sessions WHERE id = ?');
const sessionPurgeStmt = db.prepare('DELETE FROM admin_sessions WHERE expires_at < ?');

export const adminSessions = {
  create(id: string, userId: string, expiresAt: string, ip: string | null, userAgent: string | null) {
    sessionInsertStmt.run(id, userId, expiresAt, ip, userAgent?.slice(0, 300) ?? null, new Date().toISOString());
  },
  get(id: string): SessionRow | null {
    return (sessionGetStmt.get(id) as SessionRow | undefined) ?? null;
  },
  /** Idle timeout: every authenticated request pushes the expiry out. */
  touch(id: string, expiresAt: string) {
    sessionTouchStmt.run(expiresAt, id);
  },
  destroy(id: string) {
    sessionDeleteStmt.run(id);
  },
  purgeExpired() {
    return Number(sessionPurgeStmt.run(new Date().toISOString()).changes);
  },
};

type EventRow = {
  id: string;
  order_id: string;
  type: string;
  from_status: string | null;
  to_status: string | null;
  actor_type: string;
  actor_id: string | null;
  actor_name: string | null;
  note: string | null;
  data: string | null;
  created_at: string;
};

const toEvent = (r: EventRow): OrderEvent => ({
  id: r.id,
  orderId: r.order_id,
  type: r.type as OrderEventType,
  fromStatus: r.from_status as OrderStatus | null,
  toStatus: r.to_status as OrderStatus | null,
  actorType: r.actor_type as ActorType,
  actorId: r.actor_id,
  actorName: r.actor_name,
  note: r.note,
  data: r.data ? (JSON.parse(r.data) as Record<string, unknown>) : null,
  createdAt: r.created_at,
});

const eventInsertStmt = db.prepare(
  'INSERT INTO order_events (id, order_id, type, from_status, to_status, actor_type, actor_id, actor_name, note, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
);
const eventListStmt = db.prepare('SELECT * FROM order_events WHERE order_id = ? ORDER BY created_at DESC, rowid DESC');
const eventRecentStmt = db.prepare('SELECT * FROM order_events ORDER BY created_at DESC, rowid DESC LIMIT ?');

export interface RecordEventInput {
  orderId: string;
  type: OrderEventType;
  fromStatus?: OrderStatus | null;
  toStatus?: OrderStatus | null;
  actorType: ActorType;
  actorId?: string | null;
  actorName?: string | null;
  note?: string | null;
  data?: Record<string, unknown> | null;
}

export const orderEvents = {
  /** The activity timeline is append only; nothing here ever updates a row. */
  record(input: RecordEventInput): OrderEvent {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    eventInsertStmt.run(
      id,
      input.orderId,
      input.type,
      input.fromStatus ?? null,
      input.toStatus ?? null,
      input.actorType,
      input.actorId ?? null,
      input.actorName ?? null,
      input.note ?? null,
      input.data ? JSON.stringify(input.data) : null,
      createdAt,
    );
    return {
      id,
      orderId: input.orderId,
      type: input.type,
      fromStatus: input.fromStatus ?? null,
      toStatus: input.toStatus ?? null,
      actorType: input.actorType,
      actorId: input.actorId ?? null,
      actorName: input.actorName ?? null,
      note: input.note ?? null,
      data: input.data ?? null,
      createdAt,
    };
  },
  listForOrder(orderId: string): OrderEvent[] {
    return (eventListStmt.all(orderId) as EventRow[]).map(toEvent);
  },
  recent(limit = 25): OrderEvent[] {
    return (eventRecentStmt.all(limit) as EventRow[]).map(toEvent);
  },
};

type NoteRow = { id: string; order_id: string; author_id: string | null; author_name: string | null; body: string; created_at: string };

const toNote = (r: NoteRow): OrderNote => ({
  id: r.id,
  orderId: r.order_id,
  authorId: r.author_id,
  authorName: r.author_name,
  body: r.body,
  createdAt: r.created_at,
});

const noteInsertStmt = db.prepare('INSERT INTO order_notes (id, order_id, author_id, author_name, body, created_at) VALUES (?, ?, ?, ?, ?, ?)');
const noteListStmt = db.prepare('SELECT * FROM order_notes WHERE order_id = ? ORDER BY created_at DESC');

export const orderNotes = {
  add(orderId: string, authorId: string, authorName: string, body: string): OrderNote {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    noteInsertStmt.run(id, orderId, authorId, authorName, body, createdAt);
    return { id, orderId, authorId, authorName, body, createdAt };
  },
  listForOrder(orderId: string): OrderNote[] {
    return (noteListStmt.all(orderId) as NoteRow[]).map(toNote);
  },
};
