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

export type OrderStatus =
  | 'awaiting_files'
  | 'received'
  | 'ready_to_print'
  | 'printing'
  | 'binding'
  | 'quality_check'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'on_hold'
  | 'cancelled'
  | 'returned';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cod' | 'cod_collected' | 'refunded' | 'partially_refunded';

/** Client-side print checks, sent with the upload so the admin can show them. */
export interface PreflightSummary {
  emptyFrames: number;
  lowResPhotos: number;
  missingPhotos: number;
  photosPlaced: number;
  /** Page indexes, in book order, that carry a warning. */
  emptyPages: number[];
  lowResPages: number[];
}

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

export interface OrderItemRecord extends OrderItemPayload {
  unitPrice: number;
  filesReceived: number;
  /** Print checks the customer's browser ran before ordering. */
  preflight?: PreflightSummary | null;
}

export interface OrderRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  customer: CustomerDetails;
  items: OrderItemRecord[];
  totals: ReturnType<typeof import('./pricing.ts').cartTotals>;
  /** Operations fields, all set from the admin. */
  shippingMethod: ShippingKey;
  /** Date the order must leave by, from the shipping method's SLA. */
  shipBy: string | null;
  carrier: string | null;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  holdReason: string | null;
  /** Status the order paused at, so coming off hold resumes in the right place. */
  holdFrom: OrderStatus | null;
  assignedTo: string | null;
  tags: string[];
}
