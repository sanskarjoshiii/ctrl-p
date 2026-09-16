// Single source of truth for prices. The web app shows these numbers and the API
// recomputes them when an order is placed, so client totals are never trusted.

export const CURRENCY = { code: 'INR', locale: 'en-IN' } as const;

export const PAGE_RULES = { included: 24, min: 24, max: 120, step: 2 } as const;

export type SizeKey = 'medium' | 'large';
export type BindingKey = 'hardcover' | 'layflat';
export type PaperKey = 'gloss' | 'silk';

export const SIZES: Record<SizeKey, { label: string; dims: string; inches: [number, number]; base: number; perPage: number }> = {
  medium: { label: 'Medium', dims: '15 × 20 cm', inches: [5.9, 7.9], base: 1499, perPage: 45 },
  large: { label: 'Large', dims: '21 × 28 cm', inches: [8.27, 11.02], base: 2199, perPage: 65 },
};

export const BINDINGS: Record<BindingKey, { label: string; note: string; add: number }> = {
  hardcover: { label: 'Hardcover', note: 'Perfect-bound with a matte laminated cover', add: 0 },
  layflat: { label: 'Lay-flat', note: 'Opens completely flat for seamless panoramas', add: 900 },
};

export const PAPERS: Record<PaperKey, { label: string; note: string; add: number }> = {
  gloss: { label: 'Gloss', note: 'Vivid colour, a little shine', add: 0 },
  silk: { label: 'Silk matte', note: 'Soft, glare-free, premium feel', add: 250 },
};

export const GIFT_BOX_PRICE = 199;

export const SHIPPING = {
  standard: { label: 'Standard', days: '7–10 business days', price: 149, freeOver: 2999 },
  express: { label: 'Express', days: '3–5 business days', price: 349, freeOver: Infinity },
} as const;
export type ShippingKey = keyof typeof SHIPPING;

/** Multi-book discount on the books subtotal. */
export const BUNDLE_TIERS = [
  { minBooks: 3, rate: 0.15, label: '15% off 3+ diaries' },
  { minBooks: 2, rate: 0.1, label: '10% off 2 diaries' },
] as const;

/** Example codes — edit or replace with a real promotions service. */
export const PROMO_CODES: Record<string, { type: 'flat' | 'percent'; value: number; label: string }> = {
  FIRSTDIARY: { type: 'flat', value: 250, label: '₹250 off your first diary' },
};

export interface BookOptions {
  size: SizeKey;
  binding: BindingKey;
  paper: PaperKey;
  giftBox: boolean;
}

export const DEFAULT_OPTIONS: BookOptions = { size: 'large', binding: 'hardcover', paper: 'gloss', giftBox: false };

export function clampPages(pages: number): number {
  const p = Math.max(PAGE_RULES.min, Math.min(PAGE_RULES.max, Math.round(pages)));
  return p % 2 ? p + 1 : p;
}

export function bookPrice(options: BookOptions, pages: number) {
  const size = SIZES[options.size];
  const count = clampPages(pages);
  const extraPages = Math.max(0, count - PAGE_RULES.included);
  const lines = {
    base: size.base,
    extraPages,
    extraPagesCost: extraPages * size.perPage,
    binding: BINDINGS[options.binding].add,
    paper: PAPERS[options.paper].add,
    giftBox: options.giftBox ? GIFT_BOX_PRICE : 0,
  };
  const unit = lines.base + lines.extraPagesCost + lines.binding + lines.paper + lines.giftBox;
  return { ...lines, pages: count, unit };
}

export interface PricedLine {
  options: BookOptions;
  pages: number;
  qty: number;
}

export function cartTotals(lines: PricedLine[], shipping: ShippingKey = 'standard', promoCode?: string) {
  const books = lines.reduce((n, l) => n + Math.max(0, Math.floor(l.qty)), 0);
  const subtotal = lines.reduce((sum, l) => sum + bookPrice(l.options, l.pages).unit * Math.max(0, Math.floor(l.qty)), 0);
  const tier = BUNDLE_TIERS.find(t => books >= t.minBooks);
  const bundleDiscount = tier ? Math.round(subtotal * tier.rate) : 0;
  const code = promoCode?.trim().toUpperCase();
  const promo = code ? PROMO_CODES[code] : undefined;
  const afterBundle = subtotal - bundleDiscount;
  const promoDiscount = promo ? Math.min(afterBundle, promo.type === 'flat' ? promo.value : Math.round(afterBundle * promo.value / 100)) : 0;
  const merchandise = afterBundle - promoDiscount;
  const ship = SHIPPING[shipping];
  const shippingCost = books === 0 ? 0 : merchandise >= ship.freeOver ? 0 : ship.price;
  return {
    books,
    subtotal,
    bundleLabel: tier?.label ?? null,
    bundleDiscount,
    promoCode: promo ? code : null,
    promoLabel: promo?.label ?? null,
    promoValid: code ? Boolean(promo) : null,
    promoDiscount,
    shipping: shippingCost,
    shippingMethod: shipping,
    total: merchandise + shippingCost,
  };
}

export const formatMoney = (value: number) =>
  new Intl.NumberFormat(CURRENCY.locale, { style: 'currency', currency: CURRENCY.code, maximumFractionDigits: 0 }).format(value);
