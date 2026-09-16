// sRGB page render → bleed-extended, colour-managed CMYK JPEG.
//
// The browser can only produce sRGB, so this is where the conversion to the
// printer's process colours happens. It is ICC-driven on purpose: hitting a
// total-ink limit is a property of the destination profile, not something to
// patch per pixel afterwards. `measureInk` reports what the profile actually
// produced so a wrong profile fails loudly instead of reaching the press.

import sharp from 'sharp';
import { MM_PER_INCH, mmToPx } from './spec.ts';

export interface ConvertedPage {
  /** CMYK JPEG, bleed included. */
  jpeg: Buffer;
  /** Pixel size of the source render, before bleed. */
  sourceWidth: number;
  sourceHeight: number;
  /** Pixel size including bleed. */
  width: number;
  height: number;
  /** Effective resolution of the source render at final trim size. */
  ppi: number;
  bleedPx: number;
}

export interface ConvertOptions {
  /** Trim width in mm — sets the scale at which ppi is measured. */
  trimWidthMm: number;
  trimHeightMm: number;
  bleedMm: number;
  iccProfile: string;
  jpegQuality: number;
}

const ASPECT_TOLERANCE = 0.01;

/**
 * Converts one rendered page. The image is never resampled: it is placed at its
 * native resolution and the PDF box fixes the physical size, so the only pixels
 * invented are the mirrored bleed.
 */
export async function convertPage(source: Buffer | string, opts: ConvertOptions): Promise<ConvertedPage> {
  const input = sharp(source, { failOn: 'error' });
  const meta = await input.metadata();
  const sourceWidth = meta.width ?? 0;
  const sourceHeight = meta.height ?? 0;
  if (!sourceWidth || !sourceHeight) throw new Error('Page image has no readable dimensions');

  const wanted = opts.trimWidthMm / opts.trimHeightMm;
  const actual = sourceWidth / sourceHeight;
  if (Math.abs(actual - wanted) > ASPECT_TOLERANCE) {
    throw new Error(`Page aspect ${actual.toFixed(4)} does not match the ${opts.trimWidthMm}×${opts.trimHeightMm} mm trim (${wanted.toFixed(4)})`);
  }

  const ppi = sourceWidth / (opts.trimWidthMm / MM_PER_INCH);
  const bleedPx = Math.round(mmToPx(opts.bleedMm, ppi));

  const jpeg = await sharp(source, { failOn: 'error' })
    .extend({ top: bleedPx, bottom: bleedPx, left: bleedPx, right: bleedPx, extendWith: 'mirror' })
    .withIccProfile(opts.iccProfile)
    .toColourspace('cmyk')
    // 4:4:4 keeps small dark text from bleeding across channels.
    .jpeg({ quality: opts.jpegQuality, chromaSubsampling: '4:4:4', mozjpeg: false })
    .toBuffer();

  return { jpeg, sourceWidth, sourceHeight, width: sourceWidth + bleedPx * 2, height: sourceHeight + bleedPx * 2, ppi, bleedPx };
}

export interface InkReport {
  /** Highest total area coverage found, %. */
  maxInkPct: number;
  /** 99.9th percentile coverage, %. JPEG ringing on a hard edge can push a
   *  handful of pixels well above the surrounding artwork, so this is the
   *  number that says whether a page is genuinely over-inked. */
  p999InkPct: number;
  /** Mean total area coverage, %. */
  meanInkPct: number;
  /** True when every sampled pixel decoded as four-component CMYK. */
  isCmyk: boolean;
}

/**
 * Reads back the encoded CMYK JPEG and measures total area coverage.
 *
 * libvips stores CMYK samples inverted (255 = no ink), the same convention
 * Adobe uses and the one pdf-lib's `Decode [1 0 1 0 1 0 1 0]` array undoes,
 * so ink% is (255 - sample) / 255.
 */
export async function measureInk(cmykJpeg: Buffer, sampleStride = 4): Promise<InkReport> {
  const image = sharp(cmykJpeg);
  const meta = await image.metadata();
  if (meta.space !== 'cmyk' || meta.channels !== 4) return { maxInkPct: 0, p999InkPct: 0, meanInkPct: 0, isCmyk: false };

  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  // Coverage runs 0…1020 (four channels of 0…255), small enough to histogram.
  const histogram = new Uint32Array(1021);
  let max = 0;
  let total = 0;
  let counted = 0;
  const step = Math.max(1, sampleStride) * info.channels;
  for (let i = 0; i + 3 < data.length; i += step) {
    const ink = (255 - data[i]) + (255 - data[i + 1]) + (255 - data[i + 2]) + (255 - data[i + 3]);
    if (ink > max) max = ink;
    histogram[ink]++;
    total += ink;
    counted++;
  }

  let p999 = 0;
  let seen = 0;
  const target = counted * 0.999;
  for (let ink = 0; ink < histogram.length; ink++) {
    seen += histogram[ink];
    if (seen >= target) {
      p999 = ink;
      break;
    }
  }

  const toPct = (v: number) => (v / 255) * 100;
  return { maxInkPct: toPct(max), p999InkPct: toPct(p999), meanInkPct: counted ? toPct(total / counted) : 0, isCmyk: true };
}
