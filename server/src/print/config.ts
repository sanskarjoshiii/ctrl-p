// Print output settings.
//
// Every value marked CONFIRM is a documented default from issue #1 that must be
// signed off by the printer before launch. Change them in one of three places,
// in increasing precedence:
//
//   1. the defaults below
//   2. server/data/print.config.json  (or $PRINT_CONFIG pointing elsewhere)
//   3. environment variables (PRINT_BLEED_MM, PRINT_ICC_PROFILE, …)

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from '../paths.ts';

export type CoverMode = 'single' | 'split';
export type PdfxStandard = 'PDF/X-4' | 'PDF/X-1a:2001' | 'none';

export interface PrintConfig {
  /** CONFIRM — bleed on every side, mm. MediaBox = TrimBox + 2 × bleed. */
  bleedMm: number;
  /** Minimum effective resolution of placed raster content, ppi. */
  minPpi: number;
  /** CONFIRM — maximum total area coverage, % (sum of C+M+Y+K). */
  maxInkPct: number;
  /** Fail the job when measured ink coverage exceeds maxInkPct. Off = record it as a warning. */
  enforceInkLimit: boolean;
  /** CONFIRM — output standard declared in the OutputIntent and XMP. */
  pdfxStandard: PdfxStandard;
  /** CONFIRM — crop marks. Off by default because the page boxes carry the trim. */
  cropMarks: boolean;
  /** `single` = one PDF, front cover → back cover. `split` = cover wrap + interior (not implemented in phase 1). */
  coverMode: CoverMode;
  /** Absolute path to the printer's CMYK ICC profile. Required: no profile, no colour-managed output. */
  iccProfile: string | null;
  /** Human name recorded in the OutputIntent, e.g. "ISO Coated v2 (ECI)". */
  iccProfileName: string;
  /** Quality of the CMYK JPEGs embedded in the PDF. */
  jpegQuality: number;
  /** Retries per job before it is left failed. */
  maxAttempts: number;
}

const DEFAULTS: PrintConfig = {
  bleedMm: 3,
  minPpi: 300,
  maxInkPct: 300,
  enforceInkLimit: true,
  pdfxStandard: 'PDF/X-4',
  cropMarks: false,
  coverMode: 'single',
  iccProfile: null,
  iccProfileName: 'ISO Coated v2 (ECI)',
  jpegQuality: 95,
  maxAttempts: 3,
};

const num = (v: string | undefined) => (v !== undefined && v !== '' && Number.isFinite(Number(v)) ? Number(v) : undefined);
const bool = (v: string | undefined) => (v === undefined || v === '' ? undefined : v !== '0' && v.toLowerCase() !== 'false');

function fromFile(): Partial<PrintConfig> {
  const file = process.env.PRINT_CONFIG || path.join(DATA_DIR, 'print.config.json');
  if (!existsSync(file)) return {};
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as Partial<PrintConfig>;
  } catch (err) {
    console.warn(`[print] ignoring ${file}: ${(err as Error).message}`);
    return {};
  }
}

function fromEnv(): Partial<PrintConfig> {
  const e = process.env;
  const out: Partial<PrintConfig> = {
    bleedMm: num(e.PRINT_BLEED_MM),
    minPpi: num(e.PRINT_MIN_PPI),
    maxInkPct: num(e.PRINT_MAX_INK_PCT),
    enforceInkLimit: bool(e.PRINT_ENFORCE_INK_LIMIT),
    cropMarks: bool(e.PRINT_CROP_MARKS),
    jpegQuality: num(e.PRINT_JPEG_QUALITY),
    maxAttempts: num(e.PRINT_MAX_ATTEMPTS),
    iccProfile: e.PRINT_ICC_PROFILE || undefined,
    iccProfileName: e.PRINT_ICC_PROFILE_NAME || undefined,
    pdfxStandard: e.PRINT_PDFX_STANDARD as PdfxStandard | undefined,
    coverMode: e.PRINT_COVER_MODE as CoverMode | undefined,
  };
  for (const k of Object.keys(out) as (keyof PrintConfig)[]) if (out[k] === undefined) delete out[k];
  return out;
}

let cached: PrintConfig | null = null;

export function printConfig(): PrintConfig {
  if (!cached) {
    const merged = { ...DEFAULTS, ...fromFile(), ...fromEnv() };
    if (merged.iccProfile) merged.iccProfile = path.resolve(merged.iccProfile);
    cached = merged;
  }
  return cached;
}

/** Test seam — also used by the CLI so `--icc` can override without env juggling. */
export function overridePrintConfig(patch: Partial<PrintConfig>) {
  cached = { ...printConfig(), ...patch };
  return cached;
}
