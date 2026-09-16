import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import type { OrderRecord, PrintFileKind, PrintFileRecord, PrintFileReport, PrintFileStatus } from '../../shared/types.ts';
import { DATA_DIR } from './paths.ts';

export { DATA_DIR, ORDERS_DIR } from './paths.ts';

const db = new DatabaseSync(path.join(DATA_DIR, 'book-diaries.db'));
db.exec(`
  PRAGMA journal_mode = WAL;
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
`);

type Row = { id: string; created_at: string; status: string; payment_status: string; payment_method: string; customer: string; items: string; totals: string };

const toRecord = (r: Row): OrderRecord => ({
  id: r.id,
  createdAt: r.created_at,
  status: r.status as OrderRecord['status'],
  paymentStatus: r.payment_status as OrderRecord['paymentStatus'],
  paymentMethod: r.payment_method as OrderRecord['paymentMethod'],
  customer: JSON.parse(r.customer),
  items: JSON.parse(r.items),
  totals: JSON.parse(r.totals),
});

const insertStmt = db.prepare(`INSERT INTO orders (id, created_at, status, payment_status, payment_method, customer, items, totals)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
const getStmt = db.prepare('SELECT * FROM orders WHERE id = ?');
const updateStmt = db.prepare('UPDATE orders SET status = ?, payment_status = ?, items = ? WHERE id = ?');

export const orders = {
  insert(o: OrderRecord) {
    insertStmt.run(o.id, o.createdAt, o.status, o.paymentStatus, o.paymentMethod, JSON.stringify(o.customer), JSON.stringify(o.items), JSON.stringify(o.totals));
  },
  get(id: string): OrderRecord | null {
    const row = getStmt.get(id) as Row | undefined;
    return row ? toRecord(row) : null;
  },
  update(o: OrderRecord) {
    updateStmt.run(o.status, o.paymentStatus, JSON.stringify(o.items), o.id);
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
  /** After a crash, anything left mid-flight goes back in the queue. */
  recoverInterrupted(): number {
    const result = printRecoverStmt.run(new Date().toISOString());
    return Number(result.changes);
  },
};
