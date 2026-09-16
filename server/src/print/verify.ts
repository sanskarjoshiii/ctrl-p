// Automated prepress checks. A PDF is only marked `ready` once these pass.
//
// Issue #1 sketches these with poppler and Ghostscript (`pdfinfo`, `pdfimages`,
// `-sDEVICE=inkcov`). They are done in-process instead: no system packages to
// install, the same result on every machine, and — more usefully — the file is
// re-parsed with pdf-lib, which is not the code that wrote it, so a bug in the
// writer cannot pass its own exam.

import { readFileSync } from 'node:fs';
import { PDFArray, PDFDict, PDFDocument, PDFName, PDFNumber, PDFRawStream, PDFString, PDFHexString } from 'pdf-lib';
import type { BuildResult } from './build.ts';
import type { PrintConfig } from './config.ts';
import { PT_PER_MM } from './spec.ts';

export interface Check {
  name: string;
  pass: boolean;
  /** A failed check that is only advisory does not block the file. */
  blocking: boolean;
  detail: string;
}

export interface VerifyReport {
  ok: boolean;
  checks: Check[];
}

/** Page boxes must land within a tenth of a millimetre of the spec. */
const BOX_TOLERANCE_PT = 0.1 * PT_PER_MM;

const boxOf = (page: PDFDict, key: string): number[] | null => {
  const raw = page.lookup(PDFName.of(key));
  if (!(raw instanceof PDFArray)) return null;
  return raw.asArray().map(v => (v instanceof PDFNumber ? v.asNumber() : NaN));
};

const sizeMm = (box: number[]) => ({ width: (box[2] - box[0]) / PT_PER_MM, height: (box[3] - box[1]) / PT_PER_MM });

export async function verifyPrintPdf(build: BuildResult, cfg: PrintConfig): Promise<VerifyReport> {
  const checks: Check[] = [];
  const add = (name: string, pass: boolean, detail: string, blocking = true) => checks.push({ name, pass, blocking, detail });

  const bytes = readFileSync(build.path);
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (err) {
    add('parses', false, `The file could not be re-opened: ${(err as Error).message}`);
    return { ok: false, checks };
  }
  add('parses', true, 'Re-opened with an independent PDF parser');

  const pages = doc.getPages();
  const expected = build.pages.length;
  add('page count', pages.length === expected, `${pages.length} pages, expected ${expected} (front cover + inner pages + back cover)`);

  // Page boxes, every page, against the millimetre spec.
  const wantTrim = { width: build.geometry.trimW, height: build.geometry.trimH };
  const wantBleed = { width: build.geometry.mediaW, height: build.geometry.mediaH };
  const boxFailures: string[] = [];
  for (const [i, page] of pages.entries()) {
    const node = page.node;
    for (const [key, want] of [['TrimBox', wantTrim], ['BleedBox', wantBleed]] as const) {
      const box = boxOf(node, key);
      if (!box) {
        boxFailures.push(`page ${i + 1}: no ${key}`);
        continue;
      }
      const got = sizeMm(box);
      const off = Math.max(Math.abs(got.width - want.width), Math.abs(got.height - want.height)) * PT_PER_MM;
      if (off > BOX_TOLERANCE_PT) {
        boxFailures.push(`page ${i + 1}: ${key} ${got.width.toFixed(2)}×${got.height.toFixed(2)} mm, expected ${want.width}×${want.height} mm`);
      }
    }
  }
  add(
    'page boxes',
    boxFailures.length === 0,
    boxFailures.length === 0
      ? `TrimBox ${wantTrim.width}×${wantTrim.height} mm and BleedBox ${wantBleed.width}×${wantBleed.height} mm on all ${pages.length} pages (±0.1 mm)`
      : boxFailures.slice(0, 5).join('; '),
  );

  // Every placed image must be DeviceCMYK — one stray RGB object fails PDF/X.
  const colorSpaces = new Set<string>();
  let images = 0;
  for (const page of pages) {
    const resources = page.node.lookup(PDFName.of('Resources'));
    const xobjects = resources instanceof PDFDict ? resources.lookup(PDFName.of('XObject')) : undefined;
    if (!(xobjects instanceof PDFDict)) continue;
    for (const [, ref] of xobjects.entries()) {
      const stream = doc.context.lookup(ref);
      if (!(stream instanceof PDFRawStream)) continue;
      if (stream.dict.lookup(PDFName.of('Subtype')) !== PDFName.of('Image')) continue;
      images++;
      const cs = stream.dict.lookup(PDFName.of('ColorSpace'));
      colorSpaces.add(cs instanceof PDFName ? cs.asString() : String(cs));
    }
  }
  const nonCmyk = [...colorSpaces].filter(cs => cs !== '/DeviceCMYK');
  add('no RGB images', images > 0 && nonCmyk.length === 0, nonCmyk.length ? `found ${nonCmyk.join(', ')}` : `${images} images, all DeviceCMYK`);

  // Effective resolution at placed size. Rounded to the nearest whole ppi: a
  // 2480 px page across 210 mm measures 299.96 ppi, and half a pixel of
  // rounding is not a print defect.
  add(
    'resolution',
    Math.round(build.minPpi) >= cfg.minPpi,
    `lowest page is ${build.minPpi.toFixed(1)} ppi at final size, minimum ${cfg.minPpi} ppi`,
  );

  // Total area coverage, judged on the 99.9th percentile rather than the single
  // hottest pixel — JPEG ringing on a hard edge overshoots by a few percent and
  // should not condemn a whole book. Advisory unless the operator asked for it
  // to block: an over-inked result means the destination profile is wrong for
  // the paper, which is a conversation with the printer, not a per-pixel patch.
  add(
    'ink limit',
    build.ink.p999InkPct <= cfg.maxInkPct,
    `total area coverage ${build.ink.p999InkPct.toFixed(0)}% at the 99.9th percentile, limit ${cfg.maxInkPct}% (peak ${build.ink.maxInkPct.toFixed(0)}%, mean ${build.ink.meanInkPct.toFixed(0)}%)`,
    cfg.enforceInkLimit,
  );

  // OutputIntent with an embedded destination profile.
  const intents = doc.catalog.lookup(PDFName.of('OutputIntents'));
  const intent = intents instanceof PDFArray ? doc.context.lookup(intents.get(0)) : undefined;
  const destProfile = intent instanceof PDFDict ? doc.context.lookup(intent.lookup(PDFName.of('DestOutputProfile'))) : undefined;
  const intentName = intent instanceof PDFDict ? intent.lookup(PDFName.of('OutputConditionIdentifier')) : undefined;
  const intentLabel =
    intentName instanceof PDFHexString || intentName instanceof PDFString ? intentName.decodeText() : cfg.iccProfileName;
  add(
    'output intent',
    destProfile instanceof PDFRawStream,
    destProfile instanceof PDFRawStream
      ? `GTS_PDFX intent "${intentLabel}" with a ${destProfile.getContents().length} byte embedded profile`
      : 'no OutputIntent with an embedded DestOutputProfile',
  );

  if (build.pdfxVersion) {
    const info = doc.context.lookup(doc.context.trailerInfo.Info);
    const read = (key: string) => {
      const v = info instanceof PDFDict ? info.lookup(PDFName.of(key)) : undefined;
      return v instanceof PDFString || v instanceof PDFHexString ? v.decodeText() : null;
    };
    const version = read('GTS_PDFXVersion');
    const conformance = read('GTS_PDFXConformance');
    const ok = version === build.pdfxVersion && conformance === build.pdfxConformance;
    add(
      'pdf/x version',
      ok,
      version ? `declares ${version}${conformance ? ` / ${conformance}` : ''} for ${cfg.pdfxStandard}` : 'no GTS_PDFXVersion in the Info dictionary',
    );
  }

  return { ok: checks.every(c => c.pass || !c.blocking), checks };
}

export const failedChecks = (report: VerifyReport) => report.checks.filter(c => !c.pass && c.blocking);
