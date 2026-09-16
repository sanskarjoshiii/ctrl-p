import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import type { OrderRecord, PrintFileKind, PrintFileRecord, PrintFileReport, PrintFileStatus } from '../../shared/types.ts';
import { DATA_DIR } from './paths.ts';

export { DATA_DIR, ORDERS_DIR } from './paths.ts';

export const db = new DatabaseSync(path.join(DATA_DIR, 'book-diaries.db'));

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    status TEXT NOT NULL,
    payment_status TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    customer TEXT NOT NULL,
    items TEXT NOT NULL,
    totals TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS print_files (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    item_index INTEGER NOT NULL,
    kind TEXT NOT NULL,
    status TEXT NOT NULL,
    file_name TEXT,
    bytes INTEGER,
    sha256 TEXT,
    error TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    report TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (order_id, item_index, kind)
  );
  CREATE INDEX IF NOT EXISTS print_files_status ON print_files (status, created_at);
  CREATE INDEX IF NOT EXISTS print_files_order ON print_files (order_id);

  CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TEXT,
    last_login_at TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES admin_users (id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    ip TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS admin_sessions_user ON admin_sessions (user_id);

  CREATE TABLE IF NOT EXISTS order_events (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    type TEXT NOT NULL,
    from_status TEXT,
    to_status TEXT,
    actor_type TEXT NOT NULL,
    actor_id TEXT,
    actor_name TEXT,
    note TEXT,
    data TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS order_events_order ON order_events (order_id, created_at);
  CREATE INDEX IF NOT EXISTS order_events_recent ON order_events (created_at);

  CREATE TABLE IF NOT EXISTS order_notes (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    author_id TEXT,
    author_name TEXT,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS order_notes_order ON order_notes (order_id, created_at);
`);

// ---------------------------------------------------------------------------
// Migration: the orders table shipped as eight columns with everything else
// buried in JSON, which cannot be filtered or sorted. These columns are pulled
// out for the admin list; the JSON stays the source of truth for the rest.
// ---------------------------------------------------------------------------

const ORDER_COLUMNS: Record<string, string> = {
  updated_at: 'TEXT',
  customer_email: 'TEXT',
  customer_phone: 'TEXT',
  shipping_method: 'TEXT',
  ship_by: 'TEXT',
  carrier: 'TEXT',
  tracking_number: 'TEXT',
  shipped_at: 'TEXT',
  delivered_at: 'TEXT',
  cancelled_at: 'TEXT',
  cancel_reason: 'TEXT',
  hold_reason: 'TEXT',
  hold_from: 'TEXT',
  assigned_to: 'TEXT',
  tags: 'TEXT',
};

function migrateOrders() {
  const existing = new Set((db.prepare('PRAGMA table_info(orders)').all() as { name: string }[]).map(c => c.name));
  const added: string[] = [];
  for (const [column, type] of Object.entries(ORDER_COLUMNS)) {
    if (!existing.has(column)) {
      db.exec(`ALTER TABLE orders ADD COLUMN ${column} ${type}`);
      added.push(column);
    }
  }
  if (!added.length) return;

  // Backfill what can be derived from the JSON columns already there.
  const rows = db.prepare('SELECT id, created_at, customer, totals FROM orders').all() as {
    id: string;
    created_at: string;
    customer: string;
    totals: string;
  }[];
  const update = db.prepare(
    'UPDATE orders SET updated_at = ?, customer_email = ?, customer_phone = ?, shipping_method = ?, tags = ? WHERE id = ?',
  );
  const seedEvent = db.prepare(
    "INSERT INTO order_events (id, order_id, type, from_status, to_status, actor_type, actor_id, actor_name, note, data, created_at) VALUES (?, ?, 'created', NULL, NULL, 'system', NULL, NULL, ?, NULL, ?)",
  );
  const hasEvent = db.prepare('SELECT 1 FROM order_events WHERE order_id = ? LIMIT 1');
  for (const row of rows) {
    const customer = JSON.parse(row.customer) as { email?: string; phone?: string };
    const totals = JSON.parse(row.totals) as { shippingMethod?: string };
    update.run(row.created_at, customer.email ?? null, customer.phone ?? null, totals.shippingMethod ?? 'standard', '[]', row.id);
    if (!hasEvent.get(row.id)) seedEvent.run(randomUUID(), row.id, 'Order placed (backfilled)', row.created_at);
  }
  console.log(`[db] migrated orders: added ${added.join(', ')}; backfilled ${rows.length} row(s)`);
}

migrateOrders();

db.exec(`
  CREATE INDEX IF NOT EXISTS orders_created ON orders (created_at);
  CREATE INDEX IF NOT EXISTS orders_status ON orders (status);
  CREATE INDEX IF NOT EXISTS orders_payment ON orders (payment_status);
  CREATE INDEX IF NOT EXISTS orders_email ON orders (customer_email);
  CREATE INDEX IF NOT EXISTS orders_ship_by ON orders (ship_by);
`);

export type OrderRow = {
  id: string;
  created_at: string;
  updated_at: string | null;
  status: string;
  payment_status: string;
  payment_method: string;
  customer: string;
  items: string;
  totals: string;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_method: string | null;
  ship_by: string | null;
  carrier: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  hold_reason: string | null;
  hold_from: string | null;
  assigned_to: string | null;
  tags: string | null;
};

export const toOrderRecord = (r: OrderRow): OrderRecord => ({
  id: r.id,
  createdAt: r.created_at,
  updatedAt: r.updated_at ?? r.created_at,
  status: r.status as OrderRecord['status'],
  paymentStatus: r.payment_status as OrderRecord['paymentStatus'],
  paymentMethod: r.payment_method as OrderRecord['paymentMethod'],
  customer: JSON.parse(r.customer),
  items: JSON.parse(r.items),
  totals: JSON.parse(r.totals),
  shippingMethod: (r.shipping_method ?? 'standard') as OrderRecord['shippingMethod'],
  shipBy: r.ship_by,
  carrier: r.carrier,
  trackingNumber: r.tracking_number,
  shippedAt: r.shipped_at,
  deliveredAt: r.delivered_at,
  cancelledAt: r.cancelled_at,
  cancelReason: r.cancel_reason,
  holdReason: r.hold_reason,
  holdFrom: (r.hold_from as OrderRecord['holdFrom']) ?? null,
  assignedTo: r.assigned_to,
  tags: r.tags ? (JSON.parse(r.tags) as string[]) : [],
});

const insertStmt = db.prepare(`INSERT INTO orders
  (id, created_at, updated_at, status, payment_status, payment_method, customer, items, totals,
   customer_email, customer_phone, shipping_method, ship_by, tags)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
const getStmt = db.prepare('SELECT * FROM orders WHERE id = ?');
const updateStmt = db.prepare(`UPDATE orders SET
  updated_at = ?, status = ?, payment_status = ?, customer = ?, items = ?,
  customer_email = ?, customer_phone = ?, ship_by = ?, carrier = ?, tracking_number = ?,
  shipped_at = ?, delivered_at = ?, cancelled_at = ?, cancel_reason = ?, hold_reason = ?,
  hold_from = ?, assigned_to = ?, tags = ?
  WHERE id = ?`);

export const orders = {
  insert(o: OrderRecord) {
    insertStmt.run(
      o.id,
      o.createdAt,
      o.updatedAt,
      o.status,
      o.paymentStatus,
      o.paymentMethod,
      JSON.stringify(o.customer),
      JSON.stringify(o.items),
      JSON.stringify(o.totals),
      o.customer.email,
      o.customer.phone,
      o.shippingMethod,
      o.shipBy,
      JSON.stringify(o.tags),
    );
  },
  get(id: string): OrderRecord | null {
    const row = getStmt.get(id) as OrderRow | undefined;
    return row ? toOrderRecord(row) : null;
  },
  update(o: OrderRecord) {
    updateStmt.run(
      new Date().toISOString(),
      o.status,
      o.paymentStatus,
      JSON.stringify(o.customer),
      JSON.stringify(o.items),
      o.customer.email,
      o.customer.phone,
      o.shipBy,
      o.carrier,
      o.trackingNumber,
      o.shippedAt,
      o.deliveredAt,
      o.cancelledAt,
      o.cancelReason,
      o.holdReason,
      o.holdFrom,
      o.assignedTo,
      JSON.stringify(o.tags),
      o.id,
    );
  },
};

type PrintRow = {
  id: string;
  order_id: string;
  item_index: number;
  kind: string;
  status: string;
  file_name: string | null;
  bytes: number | null;
  sha256: string | null;
  error: string | null;
  attempts: number;
  report: string | null;
  created_at: string;
  updated_at: string;
};

const toPrintRecord = (r: PrintRow): PrintFileRecord => ({
  id: r.id,
  orderId: r.order_id,
  itemIndex: r.item_index,
  kind: r.kind as PrintFileKind,
  status: r.status as PrintFileStatus,
  fileName: r.file_name,
  bytes: r.bytes,
  sha256: r.sha256,
  error: r.error,
  attempts: r.attempts,
  report: r.report ? (JSON.parse(r.report) as PrintFileReport) : null,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const printUpsertStmt = db.prepare(`
  INSERT INTO print_files (id, order_id, item_index, kind, status, attempts, created_at, updated_at)
  VALUES (?, ?, ?, ?, 'queued', 0, ?, ?)
  ON CONFLICT (order_id, item_index, kind)
  DO UPDATE SET status = 'queued', attempts = 0, error = NULL, updated_at = excluded.updated_at`);
const printGetStmt = db.prepare('SELECT * FROM print_files WHERE order_id = ? AND item_index = ? AND kind = ?');
const printByIdStmt = db.prepare('SELECT * FROM print_files WHERE id = ?');
const printListStmt = db.prepare('SELECT * FROM print_files WHERE order_id = ? ORDER BY item_index, kind');
const printClaimStmt = db.prepare("SELECT * FROM print_files WHERE status = 'queued' ORDER BY created_at LIMIT 1");
const printStatusStmt = db.prepare('UPDATE print_files SET status = ?, attempts = ?, error = ?, updated_at = ? WHERE id = ?');
const printReadyStmt = db.prepare(`UPDATE print_files
  SET status = 'ready', file_name = ?, bytes = ?, sha256 = ?, report = ?, error = NULL, updated_at = ? WHERE id = ?`);
const printRecoverStmt = db.prepare("UPDATE print_files SET status = 'queued', updated_at = ? WHERE status = 'processing'");
const printCountByStatusStmt = db.prepare('SELECT status, COUNT(*) AS n FROM print_files GROUP BY status');

export const printFiles = {
  /** Queues a job, resetting any previous attempt. Regenerating is the same call. */
  enqueue(orderId: string, itemIndex: number, kind: PrintFileKind): PrintFileRecord {
    const now = new Date().toISOString();
    printUpsertStmt.run(randomUUID(), orderId, itemIndex, kind, now, now);
    return printFiles.get(orderId, itemIndex, kind)!;
  },
  get(orderId: string, itemIndex: number, kind: PrintFileKind): PrintFileRecord | null {
    const row = printGetStmt.get(orderId, itemIndex, kind) as PrintRow | undefined;
    return row ? toPrintRecord(row) : null;
  },
  byId(id: string): PrintFileRecord | null {
    const row = printByIdStmt.get(id) as PrintRow | undefined;
    return row ? toPrintRecord(row) : null;
  },
  listForOrder(orderId: string): PrintFileRecord[] {
    return (printListStmt.all(orderId) as PrintRow[]).map(toPrintRecord);
  },
  /** Oldest waiting job, or null when the queue is drained. */
  nextQueued(): PrintFileRecord | null {
    const row = printClaimStmt.get() as PrintRow | undefined;
    return row ? toPrintRecord(row) : null;
  },
  setStatus(id: string, status: PrintFileStatus, attempts: number, error: string | null) {
    printStatusStmt.run(status, attempts, error, new Date().toISOString(), id);
  },
  markReady(id: string, fileName: string, bytes: number, sha256: string, report: PrintFileReport) {
    printReadyStmt.run(fileName, bytes, sha256, JSON.stringify(report), new Date().toISOString(), id);
  },
  countsByStatus(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const row of printCountByStatusStmt.all() as { status: string; n: number }[]) out[row.status] = row.n;
    return out;
  },
  /** After a crash, anything left mid-flight goes back in the queue. */
  recoverInterrupted(): number {
    return Number(printRecoverStmt.run(new Date().toISOString()).changes);
  },
};
