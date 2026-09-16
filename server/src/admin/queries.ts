// Read side of the admin: the orders list, the overview KPIs and the queues.
//
// The filters are built as parameterised SQL against the columns pulled out of
// the JSON in the migration, so a 5,000-order list is an index scan rather than
// a full deserialise of every row.

import {
  PAYMENT_PENDING_HOURS,
  PRODUCTION_SLA_DAYS,
  UPLOAD_INCOMPLETE_MINUTES,
  addBusinessDays,
} from '../../../shared/admin.ts';
import type { OrderRecord, OrderStatus, PaymentStatus } from '../../../shared/types.ts';
import { db, toOrderRecord, type OrderRow } from '../db.ts';

export interface OrderFilters {
  status?: OrderStatus[];
  paymentStatus?: PaymentStatus[];
  paymentMethod?: string[];
  from?: string;
  to?: string;
  template?: string;
  size?: string;
  shipping?: string;
  tag?: string;
  assignedTo?: string;
  /** Orders whose client-side print check raised something. */
  hasWarnings?: boolean;
  late?: boolean;
  /** Order id, customer name, email, phone or postal code. */
  q?: string;
  sort?: 'newest' | 'oldest' | 'total' | 'ship_by';
  page?: number;
  perPage?: number;
}

interface Where {
  sql: string;
  params: (string | number)[];
}

const inClause = (column: string, values: string[]): Where => ({
  sql: `${column} IN (${values.map(() => '?').join(', ')})`,
  params: values,
});

function buildWhere(f: OrderFilters): Where {
  const clauses: string[] = [];
  const params: (string | number)[] = [];
  const push = (where: Where) => {
    clauses.push(where.sql);
    params.push(...where.params);
  };

  if (f.status?.length) push(inClause('status', f.status));
  if (f.paymentStatus?.length) push(inClause('payment_status', f.paymentStatus));
  if (f.paymentMethod?.length) push(inClause('payment_method', f.paymentMethod));
  if (f.shipping) push({ sql: 'shipping_method = ?', params: [f.shipping] });
  if (f.assignedTo) push({ sql: 'assigned_to = ?', params: [f.assignedTo] });
  if (f.from) push({ sql: 'created_at >= ?', params: [f.from] });
  if (f.to) push({ sql: 'created_at <= ?', params: [f.to] });

  if (f.late) {
    push({
      sql: "ship_by IS NOT NULL AND ship_by < ? AND status NOT IN ('shipped', 'delivered', 'cancelled', 'returned')",
      params: [new Date().toISOString()],
    });
  }

  // These three live inside the items/tags JSON. SQLite has no JSON path index,
  // but LIKE against the serialised blob is exact enough for the shapes we
  // write and keeps the list a single query.
  if (f.template) push({ sql: 'items LIKE ?', params: [`%"templateSlug":"${f.template}"%`] });
  if (f.size) push({ sql: 'items LIKE ?', params: [`%"size":"${f.size}"%`] });
  if (f.tag) push({ sql: 'tags LIKE ?', params: [`%"${f.tag}"%`] });
  if (f.hasWarnings) {
    push({
      sql: "(items LIKE '%\"lowResPhotos\":%' AND items NOT LIKE '%\"lowResPhotos\":0,\"missingPhotos\":0%') OR items LIKE '%\"emptyFrames\":%'",
      params: [],
    });
  }

  if (f.q?.trim()) {
    const q = `%${f.q.trim()}%`;
    push({
      sql: '(id LIKE ? OR customer_email LIKE ? OR customer_phone LIKE ? OR customer LIKE ?)',
      params: [q.toUpperCase(), q, q, q],
    });
  }

  return { sql: clauses.length ? `WHERE ${clauses.map(c => `(${c})`).join(' AND ')}` : '', params };
}

const ORDER_BY: Record<NonNullable<OrderFilters['sort']>, string> = {
  newest: 'created_at DESC',
  oldest: 'created_at ASC',
  total: 'CAST(json_extract(totals, \'$.total\') AS INTEGER) DESC',
  ship_by: 'ship_by IS NULL, ship_by ASC',
};

export interface OrderListResult {
  orders: OrderRecord[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}

export function listOrders(filters: OrderFilters): OrderListResult {
  const where = buildWhere(filters);
  const perPage = Math.min(200, Math.max(1, filters.perPage ?? 50));
  const page = Math.max(1, filters.page ?? 1);
  const offset = (page - 1) * perPage;

  const total = Number((db.prepare(`SELECT COUNT(*) AS n FROM orders ${where.sql}`).get(...where.params) as { n: number }).n);
  const rows = db
    .prepare(`SELECT * FROM orders ${where.sql} ORDER BY ${ORDER_BY[filters.sort ?? 'newest']} LIMIT ? OFFSET ?`)
    .all(...where.params, perPage, offset) as OrderRow[];

  return { orders: rows.map(toOrderRecord), total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

/** Same filter set, no pagination — used by the CSV export. */
export function listAllOrders(filters: OrderFilters, cap = 10_000): OrderRecord[] {
  const where = buildWhere(filters);
  const rows = db
    .prepare(`SELECT * FROM orders ${where.sql} ORDER BY ${ORDER_BY[filters.sort ?? 'newest']} LIMIT ?`)
    .all(...where.params, cap) as OrderRow[];
  return rows.map(toOrderRecord);
}

// --- overview --------------------------------------------------------------

export interface Kpis {
  orders: number;
  netRevenue: number;
  shippingCollected: number;
  averageOrderValue: number;
  booksSold: number;
  pagesPrinted: number;
  codShare: number;
}

const LIVE_STATUSES = "status NOT IN ('cancelled')";

function kpisBetween(from: string, to: string): Kpis {
  const rows = db
    .prepare(`SELECT payment_method, items, totals FROM orders WHERE created_at >= ? AND created_at < ? AND ${LIVE_STATUSES}`)
    .all(from, to) as { payment_method: string; items: string; totals: string }[];

  let netRevenue = 0;
  let shippingCollected = 0;
  let booksSold = 0;
  let pagesPrinted = 0;
  let cod = 0;

  for (const row of rows) {
    const totals = JSON.parse(row.totals) as { total: number; shipping: number };
    const items = JSON.parse(row.items) as { pages: number; qty: number }[];
    netRevenue += (totals.total ?? 0) - (totals.shipping ?? 0);
    shippingCollected += totals.shipping ?? 0;
    for (const item of items) {
      booksSold += item.qty;
      pagesPrinted += (item.pages + 2) * item.qty;
    }
    if (row.payment_method === 'cod') cod++;
  }

  return {
    orders: rows.length,
    netRevenue,
    shippingCollected,
    averageOrderValue: rows.length ? Math.round((netRevenue + shippingCollected) / rows.length) : 0,
    booksSold,
    pagesPrinted,
    codShare: rows.length ? cod / rows.length : 0,
  };
}

export interface KpiWindow {
  current: Kpis;
  previous: Kpis;
}

/** KPIs for the last `days`, alongside the equally long window before it. */
export function kpis(days: number): KpiWindow {
  const now = Date.now();
  const span = days * 24 * 60 * 60 * 1000;
  const currentFrom = new Date(now - span).toISOString();
  const previousFrom = new Date(now - span * 2).toISOString();
  return {
    current: kpisBetween(currentFrom, new Date(now).toISOString()),
    previous: kpisBetween(previousFrom, currentFrom),
  };
}

export interface Queue {
  key: string;
  label: string;
  count: number;
  /** Query string that reproduces this queue on the orders list. */
  filter: string;
}

/**
 * The "needs attention" counts. Each one is produced by the same filter the
 * link applies, so the number and the list it opens can never disagree.
 */
export function queues(): Queue[] {
  const count = (sql: string, params: (string | number)[] = []) =>
    Number((db.prepare(`SELECT COUNT(*) AS n FROM orders ${sql}`).get(...params) as { n: number }).n);
  const now = Date.now();

  const uploadCutoff = new Date(now - UPLOAD_INCOMPLETE_MINUTES * 60 * 1000).toISOString();
  const paymentCutoff = new Date(now - PAYMENT_PENDING_HOURS * 60 * 60 * 1000).toISOString();
  const slaCutoff = addBusinessDays(new Date(now), -PRODUCTION_SLA_DAYS).toISOString();
  const nowIso = new Date(now).toISOString();

  const printFailed = Number(
    (db.prepare("SELECT COUNT(DISTINCT order_id) AS n FROM print_files WHERE status = 'failed'").get() as { n: number }).n,
  );

  return [
    {
      key: 'upload_incomplete',
      label: 'Upload incomplete',
      count: count("WHERE status = 'awaiting_files' AND created_at < ?", [uploadCutoff]),
      filter: 'status=awaiting_files',
    },
    {
      key: 'payment_pending',
      label: 'Payment pending over an hour',
      count: count("WHERE payment_status = 'pending' AND payment_method = 'online' AND created_at < ?", [paymentCutoff]),
      filter: 'paymentStatus=pending',
    },
    {
      key: 'to_review',
      label: 'New orders to review',
      count: count("WHERE status = 'received'"),
      filter: 'status=received',
    },
    {
      key: 'print_warnings',
      label: 'Print-check warnings',
      count: count("WHERE items LIKE '%\"emptyFrames\":%' AND items NOT LIKE '%\"emptyFrames\":0%'"),
      filter: 'hasWarnings=1',
    },
    {
      key: 'pdf_failed',
      label: 'PDF generation failed',
      count: printFailed,
      filter: 'printFailed=1',
    },
    {
      key: 'production_sla',
      label: `In production past ${PRODUCTION_SLA_DAYS} days`,
      count: count("WHERE status IN ('ready_to_print', 'printing', 'binding', 'quality_check') AND updated_at < ?", [slaCutoff]),
      filter: 'status=ready_to_print,printing,binding,quality_check',
    },
    {
      key: 'late',
      label: 'Late to ship',
      count: count("WHERE ship_by IS NOT NULL AND ship_by < ? AND status NOT IN ('shipped', 'delivered', 'cancelled', 'returned')", [nowIso]),
      filter: 'late=1',
    },
    {
      key: 'on_hold',
      label: 'On hold or returned',
      count: count("WHERE status IN ('on_hold', 'returned')"),
      filter: 'status=on_hold,returned',
    },
  ];
}

/** Orders and revenue per day, for the overview chart. */
export function dailySeries(days: number) {
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const rows = db
    .prepare(`SELECT created_at, totals FROM orders WHERE created_at >= ? AND ${LIVE_STATUSES} ORDER BY created_at`)
    .all(from) as { created_at: string; totals: string }[];

  const byDay = new Map<string, { orders: number; revenue: number }>();
  for (let i = days - 1; i >= 0; i--) {
    byDay.set(new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), { orders: 0, revenue: 0 });
  }
  for (const row of rows) {
    const day = row.created_at.slice(0, 10);
    const entry = byDay.get(day);
    if (!entry) continue;
    entry.orders++;
    entry.revenue += (JSON.parse(row.totals) as { total: number }).total ?? 0;
  }
  return [...byDay].map(([date, v]) => ({ date, ...v }));
}

/** How many orders sit in each fulfilment status right now. */
export function statusFunnel(): Record<string, number> {
  const rows = db.prepare('SELECT status, COUNT(*) AS n FROM orders GROUP BY status').all() as { status: string; n: number }[];
  return Object.fromEntries(rows.map(r => [r.status, r.n]));
}

/** Product mix across live orders: size, binding, paper and gift box. */
export function productMix() {
  const rows = db.prepare(`SELECT items FROM orders WHERE ${LIVE_STATUSES}`).all() as { items: string }[];
  const mix = { size: {}, binding: {}, paper: {}, giftBox: { yes: 0, no: 0 }, template: {} } as {
    size: Record<string, number>;
    binding: Record<string, number>;
    paper: Record<string, number>;
    giftBox: { yes: number; no: number };
    template: Record<string, number>;
  };
  for (const row of rows) {
    for (const item of JSON.parse(row.items) as { qty: number; templateSlug: string; options: { size: string; binding: string; paper: string; giftBox: boolean } }[]) {
      mix.size[item.options.size] = (mix.size[item.options.size] ?? 0) + item.qty;
      mix.binding[item.options.binding] = (mix.binding[item.options.binding] ?? 0) + item.qty;
      mix.paper[item.options.paper] = (mix.paper[item.options.paper] ?? 0) + item.qty;
      mix.giftBox[item.options.giftBox ? 'yes' : 'no'] += item.qty;
      mix.template[item.templateSlug] = (mix.template[item.templateSlug] ?? 0) + item.qty;
    }
  }
  return mix;
}
