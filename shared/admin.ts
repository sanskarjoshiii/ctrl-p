// Roles, permissions and the order lifecycle.
//
// Shared on purpose: the admin UI uses these to decide which button to show,
// and the server uses the same tables to decide what it will actually accept.
// The UI copy is a convenience — the server check is the real one.

import type { OrderStatus, PaymentStatus } from './types.ts';

export type AdminRole = 'owner' | 'operations' | 'support';

export const ROLE_LABELS: Record<AdminRole, string> = {
  owner: 'Owner',
  operations: 'Operations',
  support: 'Support',
};

export type Permission =
  | 'orders.view'
  | 'orders.annotate'
  | 'orders.status'
  | 'orders.ship'
  | 'orders.files'
  | 'orders.address'
  | 'orders.cancel'
  | 'orders.refund'
  | 'catalogue.manage'
  | 'team.manage';

/** The permission table from issue #2, section 1. */
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  owner: [
    'orders.view',
    'orders.annotate',
    'orders.status',
    'orders.ship',
    'orders.files',
    'orders.address',
    'orders.cancel',
    'orders.refund',
    'catalogue.manage',
    'team.manage',
  ],
  operations: ['orders.view', 'orders.annotate', 'orders.status', 'orders.ship', 'orders.files', 'orders.address', 'orders.cancel'],
  support: ['orders.view', 'orders.annotate', 'orders.address'],
};

export const can = (role: AdminRole, permission: Permission) => ROLE_PERMISSIONS[role]?.includes(permission) ?? false;

export const ORDER_STATUSES: OrderStatus[] = [
  'awaiting_files',
  'received',
  'ready_to_print',
  'printing',
  'binding',
  'quality_check',
  'packed',
  'shipped',
  'delivered',
  'on_hold',
  'cancelled',
  'returned',
];

/** The happy path, in order — what the status stepper draws. */
export const FULFILMENT_FLOW: OrderStatus[] = [
  'awaiting_files',
  'received',
  'ready_to_print',
  'printing',
  'binding',
  'quality_check',
  'packed',
  'shipped',
  'delivered',
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  awaiting_files: 'Awaiting files',
  received: 'Received',
  ready_to_print: 'Ready to print',
  printing: 'Printing',
  binding: 'Binding',
  quality_check: 'Quality check',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  on_hold: 'On hold',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Payment pending',
  paid: 'Paid',
  failed: 'Payment failed',
  cod: 'COD',
  cod_collected: 'COD collected',
  refunded: 'Refunded',
  partially_refunded: 'Partly refunded',
};

/**
 * Allowed fulfilment transitions. Anything not listed here is rejected with a
 * 409 — the state machine is the thing that stops an order being marked shipped
 * before it has been printed.
 *
 * `on_hold` is reachable from any pre-shipped state and returns to whichever
 * state it paused (tracked in `holdFrom`), so it is not listed as a source here.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  awaiting_files: ['received', 'cancelled'],
  received: ['ready_to_print', 'cancelled'],
  ready_to_print: ['printing', 'cancelled'],
  printing: ['binding', 'cancelled'],
  binding: ['quality_check'],
  quality_check: ['packed', 'printing'],
  packed: ['shipped'],
  shipped: ['delivered', 'returned'],
  delivered: ['returned'],
  on_hold: [],
  cancelled: [],
  returned: [],
};

/** States an order can be put on hold from. */
export const HOLDABLE: OrderStatus[] = ['awaiting_files', 'received', 'ready_to_print', 'printing', 'binding', 'quality_check', 'packed'];

/** Reaching these needs a reason. */
export const REASON_REQUIRED: OrderStatus[] = ['on_hold', 'cancelled', 'returned'];

/** Cancelling after printing has started is the owner's call alone. */
export const CANCEL_AFTER_PRINTING_FROM: OrderStatus[] = ['printing', 'binding', 'quality_check', 'packed'];

export const isPaidOrConfirmedCod = (payment: PaymentStatus) => payment === 'paid' || payment === 'cod_collected' || payment === 'cod';

export interface TransitionContext {
  role: AdminRole;
  paymentStatus: PaymentStatus;
  holdFrom?: OrderStatus | null;
  carrier?: string | null;
  trackingNumber?: string | null;
  reason?: string | null;
}

export interface TransitionResult {
  ok: boolean;
  reason?: string;
}

/**
 * The single place that decides whether a status change is allowed. The admin
 * API calls it before touching anything, and the UI calls it to work out which
 * button to offer.
 */
export function checkTransition(from: OrderStatus, to: OrderStatus, ctx: TransitionContext): TransitionResult {
  if (from === to) return { ok: false, reason: `The order is already ${ORDER_STATUS_LABELS[to].toLowerCase()}` };

  if (!can(ctx.role, 'orders.status')) return { ok: false, reason: 'Your role cannot change fulfilment status' };

  if (to === 'on_hold') {
    if (!HOLDABLE.includes(from)) return { ok: false, reason: `An order that is ${ORDER_STATUS_LABELS[from].toLowerCase()} cannot be put on hold` };
    if (!ctx.reason?.trim()) return { ok: false, reason: 'Putting an order on hold needs a reason' };
    return { ok: true };
  }

  if (from === 'on_hold') {
    // Coming off hold, the only destinations are where it paused, or cancelled.
    if (to === 'cancelled') {
      if (!ctx.reason?.trim()) return { ok: false, reason: 'Cancelling needs a reason' };
      if (ctx.holdFrom && CANCEL_AFTER_PRINTING_FROM.includes(ctx.holdFrom) && ctx.role !== 'owner') {
        return { ok: false, reason: 'Only the owner can cancel an order once printing has started' };
      }
      return { ok: true };
    }
    if (ctx.holdFrom && to !== ctx.holdFrom) {
      return { ok: false, reason: `This order was held at ${ORDER_STATUS_LABELS[ctx.holdFrom].toLowerCase()} and can only resume there` };
    }
    return { ok: true };
  }

  if (!ORDER_TRANSITIONS[from]?.includes(to)) {
    return { ok: false, reason: `${ORDER_STATUS_LABELS[from]} cannot become ${ORDER_STATUS_LABELS[to].toLowerCase()}` };
  }

  if (to === 'cancelled') {
    if (!ctx.reason?.trim()) return { ok: false, reason: 'Cancelling needs a reason' };
    if (CANCEL_AFTER_PRINTING_FROM.includes(from) && ctx.role !== 'owner') {
      return { ok: false, reason: 'Only the owner can cancel an order once printing has started' };
    }
    if (!can(ctx.role, 'orders.cancel')) return { ok: false, reason: 'Your role cannot cancel orders' };
  }

  if (to === 'returned' && !ctx.reason?.trim()) return { ok: false, reason: 'Recording a return needs a reason' };

  // Nothing goes to the press until the money is settled.
  if (to === 'ready_to_print' && !isPaidOrConfirmedCod(ctx.paymentStatus)) {
    return { ok: false, reason: 'Payment is not settled — an online order must be paid, or COD confirmed, before printing' };
  }

  if (to === 'shipped') {
    if (!can(ctx.role, 'orders.ship')) return { ok: false, reason: 'Your role cannot mark orders shipped' };
    if (!ctx.carrier?.trim() || !ctx.trackingNumber?.trim()) return { ok: false, reason: 'Shipping needs a carrier and a tracking number' };
  }

  return { ok: true };
}

/** The primary action offered on the order detail header. */
export function nextStatus(from: OrderStatus, holdFrom?: OrderStatus | null): OrderStatus | null {
  if (from === 'on_hold') return holdFrom ?? null;
  return ORDER_TRANSITIONS[from]?.[0] ?? null;
}

export type OrderEventType =
  | 'created'
  | 'files_received'
  | 'status_changed'
  | 'payment_changed'
  | 'print_file'
  | 'note_added'
  | 'tags_changed'
  | 'address_changed'
  | 'email_sent'
  | 'file_downloaded'
  | 'shipment_created';

export type ActorType = 'admin' | 'customer' | 'system';

export interface OrderEvent {
  id: string;
  orderId: string;
  type: OrderEventType;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus | null;
  actorType: ActorType;
  actorId: string | null;
  actorName: string | null;
  note: string | null;
  data: Record<string, unknown> | null;
  createdAt: string;
}

export interface OrderNote {
  id: string;
  orderId: string;
  authorId: string | null;
  authorName: string | null;
  body: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

/** Business days allowed before an order is late to ship, per shipping method. */
export const SHIP_BY_DAYS: Record<string, number> = { standard: 10, express: 5 };

/**
 * Adds business days, skipping weekends. Public holidays are not modelled —
 * that calendar is an open question on issue #2, and guessing at one would make
 * every ship-by date quietly wrong.
 */
export function addBusinessDays(from: Date, days: number): Date {
  const date = new Date(from);
  let remaining = Math.max(0, Math.round(days));
  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) remaining--;
  }
  return date;
}

/** The date an order has to leave by, from when it was placed. */
export function shipByDate(placedAt: string | Date, shipping: string): string {
  const days = SHIP_BY_DAYS[shipping] ?? SHIP_BY_DAYS.standard;
  return addBusinessDays(new Date(placedAt), days).toISOString();
}

export const isLate = (shipBy: string | null, status: OrderStatus) =>
  Boolean(shipBy) && !['shipped', 'delivered', 'cancelled', 'returned'].includes(status) && new Date(shipBy!) < new Date();

/** An order stuck this long in awaiting_files probably lost its upload. */
export const UPLOAD_INCOMPLETE_MINUTES = 30;

/** An unpaid online order this old needs chasing. */
export const PAYMENT_PENDING_HOURS = 1;

/** Business days in production before the SLA is breached. */
export const PRODUCTION_SLA_DAYS = 3;
