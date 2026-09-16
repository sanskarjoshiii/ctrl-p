// Admin API. Everything under /api/admin except login sits behind requireAdmin,
// and every endpoint that changes something also names the permission it needs —
// the UI hiding a button is a courtesy, this is the control.

import { Router, type Request, type Response } from 'express';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import {
  ORDER_STATUSES,
  ROLE_PERMISSIONS,
  can,
  checkTransition,
  isLate,
  nextStatus,
  shipByDate,
  type AdminRole,
} from '../../../shared/admin.ts';
import { SIZES, formatMoney } from '../../../shared/pricing.ts';
import type { OrderRecord, OrderStatus, PaymentStatus } from '../../../shared/types.ts';
import { orders, printFiles } from '../db.ts';
import { sendEmail, addressLines, emailTransportName } from '../email/index.ts';
import { pagesDir, printDir } from '../paths.ts';
import { enqueuePrintJob } from '../print/queue.ts';
import {
  AuthError,
  clearSessionCookie,
  csrfGuard,
  login,
  loginRateLimit,
  requireAdmin,
  requirePermission,
  setSessionCookie,
  SESSION_IDLE_MS,
} from './auth.ts';
import { dailySeries, kpis, listAllOrders, listOrders, productMix, queues, statusFunnel, type OrderFilters } from './queries.ts';
import { adminSessions, orderEvents, orderNotes } from './store.ts';

export const adminRouter = Router();

adminRouter.use(csrfGuard);

const str = (v: unknown, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const list = (v: unknown): string[] => (typeof v === 'string' && v ? v.split(',').map(s => s.trim()).filter(Boolean) : []);

const actor = (req: Request) => ({
  actorType: 'admin' as const,
  actorId: req.admin!.id,
  actorName: req.admin!.name,
});

// --- auth ------------------------------------------------------------------

adminRouter.post('/login', loginRateLimit, async (req, res) => {
  const email = str(req.body?.email, 160).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!email || !password) return res.status(400).json({ error: 'Enter your email and password' });

  try {
    const result = await login(email, password, req.ip ?? null, req.get('user-agent') ?? null);
    setSessionCookie(res, result.sessionId, SESSION_IDLE_MS);
    res.json({ user: result.user, permissions: ROLE_PERMISSIONS[result.user.role] });
  } catch (err) {
    if (err instanceof AuthError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

adminRouter.post('/logout', (req, res) => {
  const id = req.adminSessionId ?? null;
  if (id) adminSessions.destroy(id);
  clearSessionCookie(res);
  res.json({ ok: true });
});

adminRouter.use(requireAdmin);

adminRouter.get('/me', (req, res) => {
  res.json({ user: req.admin, permissions: ROLE_PERMISSIONS[req.admin!.role] });
});

// --- overview --------------------------------------------------------------

adminRouter.get('/stats', (req, res) => {
  const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
  res.json({
    range: days,
    kpis: kpis(days),
    queues: queues(),
    series: dailySeries(Math.min(90, days)),
    funnel: statusFunnel(),
    mix: productMix(),
    printJobs: printFiles.countsByStatus(),
    activity: orderEvents.recent(20),
    emailTransport: emailTransportName(),
  });
});

// --- orders list -----------------------------------------------------------

function parseFilters(req: Request): OrderFilters {
  const q = req.query;
  return {
    status: list(q.status) as OrderStatus[],
    paymentStatus: list(q.paymentStatus) as PaymentStatus[],
    paymentMethod: list(q.paymentMethod),
    from: str(q.from, 40) || undefined,
    to: str(q.to, 40) || undefined,
    template: str(q.template, 40) || undefined,
    size: str(q.size, 20) || undefined,
    shipping: str(q.shipping, 20) || undefined,
    tag: str(q.tag, 40) || undefined,
    assignedTo: str(q.assignedTo, 60) || undefined,
    hasWarnings: q.hasWarnings === '1',
    late: q.late === '1',
    q: str(q.q, 120) || undefined,
    sort: (['newest', 'oldest', 'total', 'ship_by'] as const).includes(q.sort as never) ? (q.sort as OrderFilters['sort']) : 'newest',
    page: Number(q.page) || 1,
    perPage: Number(q.perPage) || 50,
  };
}

/** The row shape the list table renders — deliberately smaller than the record. */
function summarise(order: OrderRecord) {
  const warnings = order.items.reduce(
    (n, item) => n + (item.preflight ? item.preflight.emptyFrames + item.preflight.lowResPhotos + item.preflight.missingPhotos : 0),
    0,
  );
  return {
    id: order.id,
    createdAt: order.createdAt,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    customerName: order.customer.name,
    city: order.customer.city,
    books: order.items.reduce((n, i) => n + i.qty, 0),
    diaries: order.items.length,
    total: order.totals.total,
    shippingMethod: order.shippingMethod,
    shipBy: order.shipBy,
    late: isLate(order.shipBy, order.status),
    warnings,
    tags: order.tags,
    assignedTo: order.assignedTo,
  };
}

adminRouter.get('/orders', (req, res) => {
  const result = listOrders(parseFilters(req));
  res.json({ ...result, orders: result.orders.map(summarise) });
});

adminRouter.get('/orders.csv', (req, res) => {
  const rows = listAllOrders(parseFilters(req));
  const header = [
    'Order ID', 'Placed', 'Status', 'Payment', 'Method', 'Customer', 'Email', 'Phone',
    'City', 'State', 'Postal code', 'Diaries', 'Books', 'Subtotal', 'Discounts', 'Shipping',
    'Total', 'Shipping method', 'Ship by', 'Carrier', 'Tracking', 'Tags',
  ];
  const cell = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header.join(',')];
  for (const o of rows) {
    lines.push(
      [
        o.id, o.createdAt, o.status, o.paymentStatus, o.paymentMethod, o.customer.name, o.customer.email,
        o.customer.phone, o.customer.city, o.customer.state, o.customer.postalCode,
        o.items.length, o.items.reduce((n, i) => n + i.qty, 0),
        o.totals.subtotal, (o.totals.bundleDiscount ?? 0) + (o.totals.promoDiscount ?? 0), o.totals.shipping,
        o.totals.total, o.shippingMethod, o.shipBy ?? '', o.carrier ?? '', o.trackingNumber ?? '', o.tags.join(' '),
      ].map(cell).join(','),
    );
  }

  // Exporting personal data is itself an event worth having on the record.
  orderEvents.record({
    orderId: '-',
    type: 'file_downloaded',
    ...actor(req),
    note: `Exported ${rows.length} orders to CSV`,
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(`﻿${lines.join('\n')}\n`);
});

// --- one order -------------------------------------------------------------

const findOrder = (req: Request, res: Response): OrderRecord | null => {
  const order = orders.get(String(req.params.id));
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return null;
  }
  return order;
};

adminRouter.get('/orders/:id', (req, res) => {
  const order = findOrder(req, res);
  if (!order) return;

  const files = printFiles.listForOrder(order.id);
  const items = order.items.map((item, index) => {
    const dir = pagesDir(order.id, index);
    const printFile = files.find(f => f.itemIndex === index && f.kind === 'cmyk_pdf') ?? null;
    return {
      ...item,
      index,
      sizeLabel: SIZES[item.options.size].label,
      pagesExpected: item.pages + 2,
      pagesOnDisk: existsSync(dir) ? item.filesReceived : 0,
      printFile: printFile && {
        id: printFile.id,
        status: printFile.status,
        fileName: printFile.fileName,
        bytes: printFile.bytes,
        sha256: printFile.sha256,
        error: printFile.error,
        attempts: printFile.attempts,
        report: printFile.report,
        updatedAt: printFile.updatedAt,
      },
    };
  });

  // Viewing unmasked personal data is logged, per the privacy requirements.
  orderEvents.record({ orderId: order.id, type: 'file_downloaded', ...actor(req), note: 'Viewed order detail' });

  res.json({
    order: {
      ...order,
      late: isLate(order.shipBy, order.status),
      nextStatus: nextStatus(order.status, order.holdFrom),
      shippingLabel: addressLines(order),
    },
    items,
    notes: orderNotes.listForOrder(order.id),
    events: orderEvents.listForOrder(order.id),
    otherOrders: listOrders({ q: order.customer.email, perPage: 6 }).orders.filter(o => o.id !== order.id).map(summarise),
  });
});

adminRouter.patch('/orders/:id/status', requirePermission('orders.status'), async (req, res) => {
  const order = findOrder(req, res);
  if (!order) return;

  const to = str(req.body?.to, 40) as OrderStatus;
  if (!ORDER_STATUSES.includes(to)) return res.status(400).json({ error: 'Unknown status' });
  const note = str(req.body?.note, 500);

  const verdict = checkTransition(order.status, to, {
    role: req.admin!.role,
    paymentStatus: order.paymentStatus,
    holdFrom: order.holdFrom,
    carrier: order.carrier,
    trackingNumber: order.trackingNumber,
    reason: note,
  });
  if (!verdict.ok) return res.status(409).json({ error: verdict.reason });

  const from = order.status;
  const now = new Date().toISOString();

  if (to === 'on_hold') {
    order.holdFrom = from;
    order.holdReason = note;
  } else if (from === 'on_hold') {
    order.holdFrom = null;
    order.holdReason = null;
  }
  if (to === 'cancelled') {
    order.cancelledAt = now;
    order.cancelReason = note;
  }
  if (to === 'delivered') order.deliveredAt = now;

  order.status = to;
  orders.update(order);
  orderEvents.record({ orderId: order.id, type: 'status_changed', fromStatus: from, toStatus: to, ...actor(req), note: note || null });

  if (to === 'delivered') await notify(order, 'order_delivered', req);
  if (to === 'cancelled') await notify(order, 'order_cancelled', req);

  res.json({ order: { ...order, nextStatus: nextStatus(order.status, order.holdFrom) } });
});

adminRouter.post('/orders/:id/shipment', requirePermission('orders.ship'), async (req, res) => {
  const order = findOrder(req, res);
  if (!order) return;

  const carrier = str(req.body?.carrier, 80);
  const trackingNumber = str(req.body?.trackingNumber, 80);
  const verdict = checkTransition(order.status, 'shipped', {
    role: req.admin!.role,
    paymentStatus: order.paymentStatus,
    holdFrom: order.holdFrom,
    carrier,
    trackingNumber,
  });
  if (!verdict.ok) return res.status(409).json({ error: verdict.reason });

  const from = order.status;
  order.carrier = carrier;
  order.trackingNumber = trackingNumber;
  order.shippedAt = new Date().toISOString();
  order.status = 'shipped';
  orders.update(order);

  orderEvents.record({
    orderId: order.id,
    type: 'shipment_created',
    fromStatus: from,
    toStatus: 'shipped',
    ...actor(req),
    note: `${carrier} · ${trackingNumber}`,
    data: { carrier, trackingNumber },
  });

  const email = await notify(order, 'order_shipped', req);
  res.json({ order, email: email && { to: email.to, subject: email.subject } });
});

adminRouter.patch('/orders/:id/address', requirePermission('orders.address'), (req, res) => {
  const order = findOrder(req, res);
  if (!order) return;
  if (['shipped', 'delivered', 'returned'].includes(order.status)) {
    return res.status(409).json({ error: 'This order has already shipped — the address cannot be changed' });
  }

  const before = { ...order.customer };
  const fields = ['name', 'phone', 'address1', 'address2', 'city', 'state', 'postalCode', 'country'] as const;
  for (const field of fields) {
    if (typeof req.body?.[field] === 'string') order.customer[field] = str(req.body[field], field === 'address1' || field === 'address2' ? 200 : 120);
  }
  for (const field of ['name', 'address1', 'city', 'state', 'country', 'postalCode'] as const) {
    if (!order.customer[field]) return res.status(422).json({ error: `${field} cannot be empty` });
  }

  const changed = fields.filter(f => before[f] !== order.customer[f]);
  if (!changed.length) return res.json({ order });

  orders.update(order);
  orderEvents.record({
    orderId: order.id,
    type: 'address_changed',
    ...actor(req),
    note: `Changed ${changed.join(', ')}`,
    data: { before, after: order.customer },
  });
  res.json({ order, shippingLabel: addressLines(order) });
});

adminRouter.post('/orders/:id/notes', requirePermission('orders.annotate'), (req, res) => {
  const order = findOrder(req, res);
  if (!order) return;
  const body = str(req.body?.body, 2000);
  if (!body) return res.status(400).json({ error: 'Write something first' });

  const note = orderNotes.add(order.id, req.admin!.id, req.admin!.name, body);
  orderEvents.record({ orderId: order.id, type: 'note_added', ...actor(req), note: body.slice(0, 120) });
  res.status(201).json({ note });
});

adminRouter.patch('/orders/:id/tags', requirePermission('orders.annotate'), (req, res) => {
  const order = findOrder(req, res);
  if (!order) return;
  const tags = Array.isArray(req.body?.tags)
    ? [...new Set(req.body.tags.map((t: unknown) => str(t, 40)).filter(Boolean))].slice(0, 20)
    : [];

  const before = order.tags;
  order.tags = tags as string[];
  orders.update(order);
  orderEvents.record({ orderId: order.id, type: 'tags_changed', ...actor(req), note: tags.join(', ') || 'cleared', data: { before, after: tags } });
  res.json({ tags: order.tags });
});

adminRouter.post('/orders/:id/emails/:template/resend', requirePermission('orders.annotate'), async (req, res) => {
  const order = findOrder(req, res);
  if (!order) return;
  const template = String(req.params.template);
  if (!['order_received', 'order_shipped', 'order_delivered', 'order_cancelled'].includes(template)) {
    return res.status(400).json({ error: 'Unknown email template' });
  }
  const email = await notify(order, template as Parameters<typeof sendEmail>[0], req);
  res.json({ email: email && { to: email.to, subject: email.subject } });
});

// --- print files -----------------------------------------------------------

adminRouter.get('/orders/:id/items/:index/print.pdf', requirePermission('orders.files'), (req, res) => {
  const order = findOrder(req, res);
  if (!order) return;
  const index = Number(req.params.index);
  if (!Number.isInteger(index) || !order.items[index]) return res.status(404).json({ error: 'Diary not found' });

  const record = printFiles.get(order.id, index, 'cmyk_pdf');
  if (!record || record.status !== 'ready' || !record.fileName) {
    return res.status(409).json({ error: `Print file is ${record?.status ?? 'not queued'}`, detail: record?.error ?? null });
  }

  // The path comes from the database, never from the request, so a crafted
  // item index cannot walk out of the order's own directory.
  const file = path.join(printDir(order.id, index), record.fileName);
  if (!existsSync(file)) return res.status(410).json({ error: 'The file is recorded but missing on disk — regenerate it' });

  orderEvents.record({
    orderId: order.id,
    type: 'file_downloaded',
    ...actor(req),
    note: `Downloaded ${record.fileName}`,
    data: { sha256: record.sha256, bytes: record.bytes },
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Length', statSync(file).size);
  res.setHeader('Content-Disposition', `attachment; filename="${record.fileName}"`);
  createReadStream(file).pipe(res);
});

adminRouter.post('/orders/:id/items/:index/print.pdf/regenerate', requirePermission('orders.files'), (req, res) => {
  const order = findOrder(req, res);
  if (!order) return;
  const index = Number(req.params.index);
  if (!Number.isInteger(index) || !order.items[index]) return res.status(404).json({ error: 'Diary not found' });

  const record = enqueuePrintJob(order.id, index, 'cmyk_pdf');
  orderEvents.record({ orderId: order.id, type: 'print_file', ...actor(req), note: `Queued a rebuild of diary ${index + 1}` });
  res.status(202).json({ printFile: { id: record.id, status: record.status } });
});

/** Page thumbnails for the visual QC gallery. */
adminRouter.get('/orders/:id/items/:index/pages/:page', requirePermission('orders.files'), (req, res) => {
  const order = findOrder(req, res);
  if (!order) return;
  const index = Number(req.params.index);
  const page = Number(req.params.page);
  if (!Number.isInteger(index) || !order.items[index]) return res.status(404).json({ error: 'Diary not found' });
  if (!Number.isInteger(page) || page < 0 || page > order.items[index].pages + 1) return res.status(404).json({ error: 'Page not found' });

  const file = path.join(pagesDir(order.id, index), `${String(page).padStart(3, '0')}.jpg`);
  if (!existsSync(file)) return res.status(404).json({ error: 'Page not found' });
  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Cache-Control', 'private, max-age=300');
  createReadStream(file).pipe(res);
});

// --- helpers ---------------------------------------------------------------

async function notify(order: OrderRecord, template: Parameters<typeof sendEmail>[0], req: Request) {
  try {
    const email = await sendEmail(template, order);
    orderEvents.record({
      orderId: order.id,
      type: 'email_sent',
      ...actor(req),
      note: email.subject,
      data: { to: email.to, template, transport: emailTransportName() },
    });
    return email;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    orderEvents.record({ orderId: order.id, type: 'email_sent', ...actor(req), note: `Failed to send ${template}: ${message}` });
    console.error(`[email] ${order.id} ${template} failed: ${message}`);
    return null;
  }
}

export { shipByDate, formatMoney, can, type AdminRole };
