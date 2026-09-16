import { BINDINGS, PAPERS, PAGE_RULES, SHIPPING, SIZES } from '../../shared/pricing.ts';
import { getTemplate } from '../../shared/catalog.ts';
import type { CreateOrderPayload, CustomerDetails, PreflightSummary } from '../../shared/types.ts';

export class ValidationError extends Error {
  constructor(public fields: Record<string, string>) {
    super('Invalid request');
  }
}

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export function parseOrderPayload(body: unknown): CreateOrderPayload {
  const errors: Record<string, string> = {};
  const b = (body ?? {}) as Record<string, any>;
  const c = (b.customer ?? {}) as Record<string, unknown>;

  const customer: CustomerDetails = {
    name: str(c.name, 120),
    email: str(c.email, 160),
    phone: str(c.phone, 30),
    address1: str(c.address1),
    address2: str(c.address2),
    city: str(c.city, 80),
    state: str(c.state, 80),
    postalCode: str(c.postalCode, 12),
    country: str(c.country, 80),
  };
  for (const key of ['name', 'address1', 'city', 'state', 'country'] as const) if (!customer[key]) errors[`customer.${key}`] = 'Required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) errors['customer.email'] = 'Enter a valid email';
  if (customer.phone.replace(/\D/g, '').length < 8) errors['customer.phone'] = 'Enter a valid phone number';
  if (!/^[A-Za-z0-9 -]{3,12}$/.test(customer.postalCode)) errors['customer.postalCode'] = 'Enter a valid postal code';

  const rawItems = Array.isArray(b.items) ? b.items : [];
  if (rawItems.length === 0 || rawItems.length > 10) errors.items = 'Order between 1 and 10 diaries';
  const items = rawItems.slice(0, 10).map((raw: any, i: number) => {
    const o = raw?.options ?? {};
    const item = {
      projectId: str(raw?.projectId, 40),
      title: str(raw?.title, 80) || 'My travel diary',
      templateSlug: str(raw?.templateSlug, 40),
      pages: Number(raw?.pages),
      qty: Number(raw?.qty),
      options: { size: o.size, binding: o.binding, paper: o.paper, giftBox: Boolean(o.giftBox) },
    };
    if (!item.projectId) errors[`items.${i}.projectId`] = 'Missing project';
    if (!getTemplate(item.templateSlug)) errors[`items.${i}.templateSlug`] = 'Unknown template';
    if (!Number.isInteger(item.pages) || item.pages < PAGE_RULES.min || item.pages > PAGE_RULES.max || item.pages % 2)
      errors[`items.${i}.pages`] = `Pages must be an even number between ${PAGE_RULES.min} and ${PAGE_RULES.max}`;
    if (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > 20) errors[`items.${i}.qty`] = 'Quantity must be 1–20';
    if (!(o.size in SIZES)) errors[`items.${i}.options.size`] = 'Unknown size';
    if (!(o.binding in BINDINGS)) errors[`items.${i}.options.binding`] = 'Unknown binding';
    if (!(o.paper in PAPERS)) errors[`items.${i}.options.paper`] = 'Unknown paper';
    return item;
  });

  const shipping = b.shipping in SHIPPING ? b.shipping : null;
  if (!shipping) errors.shipping = 'Choose a delivery option';
  const paymentMethod = b.paymentMethod === 'cod' || b.paymentMethod === 'online' ? b.paymentMethod : null;
  if (!paymentMethod) errors.paymentMethod = 'Choose a payment method';

  if (Object.keys(errors).length) throw new ValidationError(errors);
  return { customer, items, shipping, paymentMethod, promoCode: str(b.promoCode, 30) || undefined } as CreateOrderPayload;
}

/**
 * Print-check results the browser sends with each diary's upload. Untrusted
 * input shown to staff, so every field is clamped to a sane count and page
 * indexes are bounded by the diary's own page count.
 */
export function parsePreflight(raw: unknown, maxPages = 130): PreflightSummary | null {
  if (typeof raw !== 'string' || !raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const p = parsed as Record<string, unknown>;
  const count = (v: unknown) => Math.max(0, Math.min(9999, Math.trunc(Number(v)) || 0));
  const pages = (v: unknown) =>
    Array.isArray(v) ? [...new Set(v.map(n => Math.trunc(Number(n))).filter(n => Number.isInteger(n) && n >= 0 && n < maxPages))].slice(0, maxPages) : [];
  return {
    emptyFrames: count(p.emptyFrames),
    lowResPhotos: count(p.lowResPhotos),
    missingPhotos: count(p.missingPhotos),
    photosPlaced: count(p.photosPlaced),
    emptyPages: pages(p.emptyPages),
    lowResPages: pages(p.lowResPages),
  };
}
