// Physical print geometry. Everything downstream measures in millimetres and
// converts to PDF points only at the moment a box is written.

import { BINDINGS, PAPERS, SIZES, type BookOptions, type SizeKey } from '../../../shared/pricing.ts';

export const MM_PER_INCH = 25.4;
export const PT_PER_MM = 72 / MM_PER_INCH;

export const mmToPt = (mm: number) => mm * PT_PER_MM;
export const mmToPx = (mm: number, ppi: number) => (mm / MM_PER_INCH) * ppi;
export const pxToMm = (px: number, ppi: number) => (px / ppi) * MM_PER_INCH;

/**
 * Trim size per book size, in millimetres. These are the printer-facing numbers
 * from issue #1 and are deliberately round — `SIZES[].inches` in shared/pricing
 * is the marketing approximation and must not be used for print geometry.
 */
export const TRIM_MM: Record<SizeKey, { width: number; height: number }> = {
  medium: { width: 150, height: 200 },
  large: { width: 210, height: 280 },
};

export interface PageGeometry {
  /** Trim box, mm. */
  trimW: number;
  trimH: number;
  /** Media/bleed box, mm (trim + bleed on all four sides). */
  mediaW: number;
  mediaH: number;
  bleedMm: number;
}

export function pageGeometry(size: SizeKey, bleedMm: number): PageGeometry {
  const trim = TRIM_MM[size];
  return {
    trimW: trim.width,
    trimH: trim.height,
    mediaW: trim.width + bleedMm * 2,
    mediaH: trim.height + bleedMm * 2,
    bleedMm,
  };
}

const slug = (s: string) =>
  s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase().slice(0, 40) || 'diary';

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** `BD-XXXXXXXX_item-1_<title>_<Size>_<Binding>_<Paper>_<N>p_qty<Q>.pdf` */
export function printFileName(orderId: string, itemIndex: number, title: string, options: BookOptions, pages: number, qty: number) {
  const parts = [
    orderId,
    `item-${itemIndex + 1}`,
    slug(title),
    titleCase(SIZES[options.size].label),
    titleCase(BINDINGS[options.binding].label.replace(/[^a-zA-Z]/g, '')),
    titleCase(PAPERS[options.paper].label.split(' ')[0]),
    `${pages}p`,
    `qty${qty}`,
  ];
  return `${parts.join('_')}.pdf`;
}
