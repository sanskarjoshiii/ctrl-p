import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { OrderRecord } from '../../shared/types.ts';

export const DATA_DIR = fileURLToPath(new URL('../data', import.meta.url));
export const ORDERS_DIR = path.join(DATA_DIR, 'orders');
mkdirSync(ORDERS_DIR, { recursive: true });

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
