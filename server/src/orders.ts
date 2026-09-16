import { Router, type Request } from 'express';
import multer from 'multer';
import { randomInt } from 'node:crypto';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { bookPrice, cartTotals, SHIPPING, type ShippingKey } from '../../shared/pricing.ts';
import type { OrderRecord } from '../../shared/types.ts';
import { orders } from './db.ts';
import { itemDir } from './paths.ts';
import { enqueueOrder } from './print/queue.ts';
import { parseOrderPayload, ValidationError } from './validate.ts';

const ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newOrderId = () => 'BD-' + Array.from({ length: 8 }, () => ID_ALPHABET[randomInt(ID_ALPHABET.length)]).join('');
const ORDER_ID = /^BD-[A-Z2-9]{8}$/;

const upload = multer({
  storage: multer.diskStorage({
    destination(req, _file, cb) {
      const dir = path.join(itemDir(String(req.params.id), Number(req.params.index)), 'pages');
      mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename(_req, file, cb) {
      const safe = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, safe);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024, files: 130, fieldSize: 8 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    cb(null, file.mimetype === 'image/jpeg' || file.mimetype === 'image/png');
  },
});

/** What the customer-facing confirmation page may see. */
function publicView(o: OrderRecord) {
  const [user, domain] = o.customer.email.split('@');
  return {
    ...o,
    customer: {
      name: o.customer.name,
      email: `${user.slice(0, 2)}•••@${domain}`,
      city: o.customer.city,
      state: o.customer.state,
      country: o.customer.country,
    },
  };
}

const findOrder = (req: Request) => {
  const id = String(req.params.id);
  return ORDER_ID.test(id) ? orders.get(id) : null;
};

export const ordersRouter = Router();

ordersRouter.post('/quote', (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  const shipping: ShippingKey = req.body?.shipping in SHIPPING ? req.body.shipping : 'standard';
  try {
    const lines = items.slice(0, 10).map((i: any) => ({ options: i.options, pages: Number(i.pages), qty: Number(i.qty) }));
    res.json(cartTotals(lines, shipping, req.body?.promoCode));
  } catch {
    res.status(400).json({ error: 'Could not price this cart' });
  }
});

ordersRouter.post('/orders', (req, res) => {
  const payload = parseOrderPayload(req.body);
  const totals = cartTotals(payload.items, payload.shipping, payload.promoCode);
  const order: OrderRecord = {
    id: newOrderId(),
    createdAt: new Date().toISOString(),
    status: 'awaiting_files',
    paymentStatus: payload.paymentMethod === 'cod' ? 'cod' : 'pending',
    paymentMethod: payload.paymentMethod,
    customer: payload.customer,
    items: payload.items.map(i => ({ ...i, unitPrice: bookPrice(i.options, i.pages).unit, filesReceived: 0 })),
    totals,
  };
  orders.insert(order);
  res.status(201).json({
    order: publicView(order),
    uploads: order.items.map((item, index) => ({ index, expectedFiles: item.pages + 2, url: `/api/orders/${order.id}/items/${index}/files` })),
  });
});

ordersRouter.post('/orders/:id/items/:index/files', (req, res, next) => {
  const order = findOrder(req);
  const index = Number(req.params.index);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (!Number.isInteger(index) || !order.items[index]) return res.status(404).json({ error: 'Item not found' });
  if (order.status !== 'awaiting_files') return res.status(409).json({ error: 'Files already received for this order' });

  rmSync(itemDir(order.id, index), { recursive: true, force: true });
  upload.array('pages', 130)(req, res, err => {
    if (err) return next(err);
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const item = order.items[index];
    if (files.length !== item.pages + 2) {
      rmSync(itemDir(order.id, index), { recursive: true, force: true });
      return res.status(400).json({ error: `Expected ${item.pages + 2} page images (covers + ${item.pages} pages), got ${files.length}` });
    }
    if (typeof req.body.project === 'string') writeFileSync(path.join(itemDir(order.id, index), 'project.json'), req.body.project);
    item.filesReceived = files.length;
    const complete = order.items.every(i => i.filesReceived === i.pages + 2);
    if (complete) order.status = 'received';
    orders.update(order);
    // Queue the print PDFs once every diary has arrived. Generation is
    // asynchronous by design: this response must not wait minutes for it.
    if (complete) enqueueOrder(order);
    res.json({ order: publicView(order) });
  });
});

// Payment integration point: swap this for Razorpay / Stripe order creation + webhook verification.
ordersRouter.post('/orders/:id/pay', (req, res) => {
  const order = findOrder(req);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.paymentMethod === 'online' && order.paymentStatus === 'pending') {
    order.paymentStatus = 'paid';
    orders.update(order);
  }
  res.json({ order: publicView(order), mode: 'demo' });
});

ordersRouter.get('/orders/:id', (req, res) => {
  const order = findOrder(req);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ order: publicView(order) });
});

export { ValidationError };
