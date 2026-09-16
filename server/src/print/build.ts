// Builds one print-ready PDF for one ordered diary: front cover → pages 1…N →
// back cover, CMYK, at trim size with bleed.
//
// Deliberately free of any database or HTTP import so it can be driven from the
// queue, the CLI or a test with nothing but a directory of page renders.

import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync } from 'node:fs';
import path from 'node:path';
import type { BookOptions } from '../../../shared/pricing.ts';
import { convertPage, measureInk, type InkReport } from './color.ts';
import { printConfig, type PrintConfig } from './config.ts';
import { mmToPt, pageGeometry, printFileName } from './spec.ts';
import { PdfXWriter } from './writer.ts';

/** Margin around the bleed box when crop marks are switched on. */
const CROP_MARK_MARGIN_MM = 10;
const CROP_MARK_LENGTH_MM = 5;
const CROP_MARK_OFFSET_MM = 1.5;

/**
 * How each standard is declared. PDF/X-1a keys off "PDF/X-1:2001" in
 * GTS_PDFXVersion with the conformance level carried separately, which is the
 * one piece of this that does not read the way you would guess.
 */
const PDFX_STANDARDS = {
  'PDF/X-4': { version: 'PDF/X-4', conformance: null, pdfVersion: '1.6' },
  'PDF/X-1a:2001': { version: 'PDF/X-1:2001', conformance: 'PDF/X-1a:2001', pdfVersion: '1.3' },
} as const;

export interface BuildInput {
  orderId: string;
  itemIndex: number;
  title: string;
  options: BookOptions;
  /** Inner pages, excluding both covers. */
  pages: number;
  qty: number;
  /** Directory holding the uploaded page renders. */
  pagesDir: string;
  /** Directory the PDF is written into. */
  outDir: string;
  config?: PrintConfig;
  onProgress?: (done: number, total: number) => void;
}

export interface PageReport {
  file: string;
  ppi: number;
  widthPx: number;
  heightPx: number;
  bleedPx: number;
  maxInkPct: number;
  p999InkPct: number;
}

export interface BuildResult {
  path: string;
  fileName: string;
  bytes: number;
  sha256: string;
  pageCount: number;
  /** Physical geometry actually written, mm. */
  geometry: { trimW: number; trimH: number; mediaW: number; mediaH: number; bleedMm: number };
  pages: PageReport[];
  ink: InkReport;
  minPpi: number;
  iccProfileName: string;
  /** What the file declares in GTS_PDFXVersion, e.g. "PDF/X-4". */
  pdfxVersion: string | null;
  /** GTS_PDFXConformance, only used by the X-1a family. */
  pdfxConformance: string | null;
}

/**
 * Uploaded pages are named `000.jpg … NNN.jpg`, cover first and back cover last.
 * Sorting numerically (not lexically) keeps the book order past 99 pages.
 */
export function orderedPageFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => /^\d+\.(jpe?g|png)$/i.test(f))
    .map(f => ({ f, n: Number.parseInt(f, 10) }))
    .sort((a, b) => a.n - b.n)
    .map(({ f }) => path.join(dir, f));
}

export class PrintBuildError extends Error {}

export async function buildPrintPdf(input: BuildInput): Promise<BuildResult> {
  const cfg = input.config ?? printConfig();

  if (cfg.coverMode === 'split') {
    throw new PrintBuildError('coverMode "split" (cover wrap + interior) is not implemented yet — it needs the printer\'s spine width formula, see issue #1');
  }
  if (!cfg.iccProfile) {
    throw new PrintBuildError('No CMYK ICC profile configured. Set PRINT_ICC_PROFILE (or iccProfile in print.config.json) to the profile your printer supplies — without it the conversion is not colour managed.');
  }
  if (!existsSync(cfg.iccProfile)) {
    throw new PrintBuildError(`ICC profile not found at ${cfg.iccProfile}`);
  }

  const files = orderedPageFiles(input.pagesDir);
  const expected = input.pages + 2;
  if (files.length !== expected) {
    throw new PrintBuildError(`Expected ${expected} page images (front cover + ${input.pages} pages + back cover), found ${files.length} in ${input.pagesDir}`);
  }

  const geometry = pageGeometry(input.options.size, cfg.bleedMm);
  const bleedBoxPt = { width: mmToPt(geometry.mediaW), height: mmToPt(geometry.mediaH) };
  const marginPt = cfg.cropMarks ? mmToPt(CROP_MARK_MARGIN_MM) : 0;
  const bleed = { x: marginPt, y: marginPt, width: bleedBoxPt.width, height: bleedBoxPt.height };
  const trim = {
    x: marginPt + mmToPt(cfg.bleedMm),
    y: marginPt + mmToPt(cfg.bleedMm),
    width: mmToPt(geometry.trimW),
    height: mmToPt(geometry.trimH),
  };
  const sheet = { width: bleed.width + marginPt * 2, height: bleed.height + marginPt * 2 };

  const pdfx = cfg.pdfxStandard === 'none' ? null : PDFX_STANDARDS[cfg.pdfxStandard];

  const fileName = printFileName(input.orderId, input.itemIndex, input.title, input.options, input.pages, input.qty);
  mkdirSync(input.outDir, { recursive: true });
  const finalPath = path.join(input.outDir, fileName);
  // Write to a temp name so a crashed run never leaves a half PDF where the
  // admin can download it; the rename at the end is what publishes the file.
  const tempPath = path.join(input.outDir, `.${fileName}.partial`);

  const writer = new PdfXWriter({
    outFile: tempPath,
    bleed,
    trim,
    sheet,
    icc: { profile: readFileSync(cfg.iccProfile), name: cfg.iccProfileName, components: 4 },
    pdfx,
    info: {
      title: input.title,
      subject: input.orderId,
      creator: 'Book Diaries',
      producer: 'Book Diaries print pipeline',
    },
    cropMarks: cfg.cropMarks ? { lengthPt: mmToPt(CROP_MARK_LENGTH_MM), offsetPt: mmToPt(CROP_MARK_OFFSET_MM) } : null,
  });

  const pages: PageReport[] = [];
  let maxInkPct = 0;
  let maxP999InkPct = 0;
  let meanTotal = 0;

  try {
    await writer.open();
    for (const [i, file] of files.entries()) {
      // One page in memory at a time — this is what keeps a 120-page diary from
      // needing gigabytes. Nothing but the report survives each iteration.
      const converted = await convertPage(file, {
        trimWidthMm: geometry.trimW,
        trimHeightMm: geometry.trimH,
        bleedMm: cfg.bleedMm,
        iccProfile: cfg.iccProfile,
        jpegQuality: cfg.jpegQuality,
      });
      const ink = await measureInk(converted.jpeg);
      if (!ink.isCmyk) throw new PrintBuildError(`Page ${i + 1} did not convert to CMYK — check the ICC profile at ${cfg.iccProfile}`);

      await writer.addPage(converted.jpeg, { width: converted.width, height: converted.height });

      maxInkPct = Math.max(maxInkPct, ink.maxInkPct);
      maxP999InkPct = Math.max(maxP999InkPct, ink.p999InkPct);
      meanTotal += ink.meanInkPct;
      pages.push({
        file: path.basename(file),
        ppi: converted.ppi,
        widthPx: converted.width,
        heightPx: converted.height,
        bleedPx: converted.bleedPx,
        maxInkPct: ink.maxInkPct,
        p999InkPct: ink.p999InkPct,
      });
      input.onProgress?.(i + 1, files.length);
    }

    const { bytes, sha256, pageCount } = await writer.close();
    rmSync(finalPath, { force: true });
    renameSync(tempPath, finalPath);

    return {
      path: finalPath,
      fileName,
      bytes,
      sha256,
      pageCount,
      geometry,
      pages,
      ink: { maxInkPct, p999InkPct: maxP999InkPct, meanInkPct: pages.length ? meanTotal / pages.length : 0, isCmyk: true },
      minPpi: pages.reduce((lowest, p) => Math.min(lowest, p.ppi), Infinity),
      iccProfileName: cfg.iccProfileName,
      pdfxVersion: pdfx?.version ?? null,
      pdfxConformance: pdfx?.conformance ?? null,
    };
  } catch (err) {
    rmSync(tempPath, { force: true });
    throw err;
  }
}
