// Diary document model. Pages use a fixed 900 × 1200 coordinate space (3:4),
// matching the cover artwork; renders scale it to screen or print resolution.

import type { BookOptions, ShippingKey } from './pricing.ts';

export const PAGE_W = 900;
export const PAGE_H = 1200;

export type FrameStyle = 'none' | 'border' | 'polaroid' | 'rounded' | 'circle' | 'arch' | 'stamp' | 'film' | 'tape' | 'shadow' | 'heart';
export type PhotoFilter = 'none' | 'mono' | 'sepia' | 'warm' | 'cool' | 'fade';

interface ElementBase {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked?: boolean;
}

export interface PhotoElement extends ElementBase {
  type: 'photo';
  /** null = empty placeholder slot */
  photoId: string | null;
  frame: FrameStyle;
  frameColor: string;
  filter: PhotoFilter;
  /** 1 = cover-fit; larger zooms in. */
  zoom: number;
  /** Pan inside the frame, -1..1 on each axis. */
  panX: number;
  panY: number;
  caption?: string;
}

export interface TextElement extends ElementBase {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontStyle: 'normal' | 'bold' | 'italic' | 'italic bold';
  fill: string;
  align: 'left' | 'center' | 'right';
  letterSpacing: number;
  lineHeight: number;
}

export type ShapeKind = 'rect' | 'rounded' | 'circle' | 'triangle' | 'star' | 'heart' | 'line' | 'arrow' | 'blob' | 'burst';

export interface ShapeElement extends ElementBase {
  type: 'shape';
  shape: ShapeKind;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface StickerElement extends ElementBase {
  type: 'sticker';
  sticker: string;
  ink: string;
  tint: string;
}

export type DiaryElement = PhotoElement | TextElement | ShapeElement | StickerElement;

export type BackgroundPattern = 'plain' | 'grid' | 'dots' | 'lines' | 'kraft';

export interface Background {
  color: string;
  pattern: BackgroundPattern;
  patternColor: string;
  /** Cover artwork (front cover of illustrated templates). */
  image?: { preview: string; print: string } | null;
}

export type PageKind = 'cover' | 'inner' | 'back';

export interface DiaryPage {
  id: string;
  kind: PageKind;
  background: Background;
  elements: DiaryElement[];
}

export interface DiaryProject {
  id: string;
  title: string;
  templateSlug: string;
  createdAt: number;
  updatedAt: number;
  pages: DiaryPage[];
  photoIds: string[];
  options: BookOptions;
}

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export type PaymentMethod = 'online' | 'cod';

export interface OrderItemPayload {
  projectId: string;
  title: string;
  templateSlug: string;
  pages: number;
  qty: number;
  options: BookOptions;
}

export interface CreateOrderPayload {
  customer: CustomerDetails;
  items: OrderItemPayload[];
  shipping: ShippingKey;
  promoCode?: string;
  paymentMethod: PaymentMethod;
}

export type OrderStatus = 'awaiting_files' | 'received' | 'in_production' | 'shipped' | 'delivered' | 'cancelled';

/** Artefacts produced for the printer. `cover_pdf` / `interior_pdf` are the
 *  split cover-wrap mode, which needs the printer's spine formula first. */
export type PrintFileKind = 'cmyk_pdf' | 'cover_pdf' | 'interior_pdf';
export type PrintFileStatus = 'queued' | 'processing' | 'ready' | 'failed';

export interface PrintCheck {
  name: string;
  pass: boolean;
  blocking: boolean;
  detail: string;
}

/** What the admin order detail shows about a generated PDF. */
export interface PrintFileReport {
  pageCount: number;
  trimMm: { width: number; height: number };
  bleedMm: number;
  minPpi: number;
  maxInkPct: number;
  p999InkPct: number;
  iccProfileName: string;
  pdfxVersion: string | null;
  durationMs: number;
  checks: PrintCheck[];
}

export interface PrintFileRecord {
  id: string;
  orderId: string;
  itemIndex: number;
  kind: PrintFileKind;
  status: PrintFileStatus;
  /** File name only — the absolute path is never handed to a client. */
  fileName: string | null;
  bytes: number | null;
  sha256: string | null;
  error: string | null;
  attempts: number;
  report: PrintFileReport | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderRecord {
  id: string;
  createdAt: string;
  status: OrderStatus;
  paymentStatus: 'pending' | 'paid' | 'cod';
  paymentMethod: PaymentMethod;
  customer: CustomerDetails;
  items: (OrderItemPayload & { unitPrice: number; filesReceived: number })[];
  totals: ReturnType<typeof import('./pricing.ts').cartTotals>;
}
