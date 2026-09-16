// Generates a synthetic diary and runs it through the whole print pipeline.
//
//   npm run print:sample -w server -- --size large --pages 24 --icc path/to.icc
//
// Use it to validate a new ICC profile or a changed bleed before pointing it at
// a real order, and to cover the awkward cases from issue #1's test matrix:
// neon covers outside the CMYK gamut, small near-black text, and very dark
// photos that push total ink coverage.

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { SIZES, type SizeKey } from '../../../shared/pricing.ts';
import { PAGE_H, PAGE_W } from '../../../shared/types.ts';
import { buildPrintPdf } from './build.ts';
import { overridePrintConfig, printConfig } from './config.ts';
import { MM_PER_INCH, TRIM_MM } from './spec.ts';
import { verifyPrintPdf } from './verify.ts';

interface Args {
  size: SizeKey;
  pages: number;
  out: string;
  icc?: string;
  keep: boolean;
}

function parseArgs(argv: string[]): Args {
  const get = (flag: string) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const size = (get('--size') ?? 'large') as SizeKey;
  if (!(size in SIZES)) throw new Error(`--size must be one of ${Object.keys(SIZES).join(', ')}`);
  return {
    size,
    pages: Number(get('--pages') ?? 24),
    out: get('--out') ?? path.join(tmpdir(), 'book-diaries-print-sample'),
    icc: get('--icc'),
    keep: argv.includes('--keep'),
  };
}

/** Page artwork chosen to stress the conversion rather than to look nice. */
function pageSvg(index: number, total: number, w: number, h: number) {
  const scale = w / PAGE_W;
  const px = (v: number) => (v * scale).toFixed(1);
  if (index === 0) {
    // Front cover: México rosa, far outside the CMYK gamut.
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#E4217A"/>
      <circle cx="${px(450)}" cy="${px(430)}" r="${px(240)}" fill="#FF5A52"/>
      <text x="${px(450)}" y="${px(860)}" font-family="Georgia,serif" font-size="${px(84)}" fill="#141414" text-anchor="middle">Sample Diary</text></svg>`;
  }
  if (index === total - 1) {
    // Back cover: Thailand turquoise.
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#23AFB3"/>
      <text x="${px(450)}" y="${px(620)}" font-family="Georgia,serif" font-size="${px(46)}" fill="#141414" text-anchor="middle">Book Diaries</text></svg>`;
  }
  if (index % 4 === 1) {
    // A very dark, edge-to-edge "photo" — the worst case for total ink.
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#05070a"/>
      <rect x="${px(60)}" y="${px(60)}" width="${px(780)}" height="${px(520)}" fill="#12161c"/></svg>`;
  }
  if (index % 4 === 2) {
    // Small near-black text: the case that goes muddy as a four-colour black.
    const lines = Array.from({ length: 18 }, (_, i) =>
      `<text x="${px(90)}" y="${px(180 + i * 52)}" font-family="Georgia,serif" font-size="${px(26)}" fill="#141414">The narrow lanes smelled of cardamom and rain, ${i + 1}</text>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#FFFDF8"/>${lines}</svg>`;
  }
  // A full-bleed colour field with content running to the very edge.
  const hue = (index * 47) % 360;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="hsl(${hue} 70% 55%)"/>
    <rect x="0" y="${px(900)}" width="${px(900)}" height="${px(300)}" fill="#BFE6FF"/>
    <text x="${px(450)}" y="${px(1080)}" font-family="Georgia,serif" font-size="${px(38)}" fill="#141414" text-anchor="middle">page ${index}</text></svg>`;
}

async function writeSamplePages(dir: string, size: SizeKey, inner: number) {
  // Match what the browser uploads: ~300 ppi at trim size, sRGB JPEG.
  const width = Math.ceil((TRIM_MM[size].width / MM_PER_INCH) * 300);
  const height = Math.round((width * PAGE_H) / PAGE_W);
  const total = inner + 2;
  for (let i = 0; i < total; i++) {
    const svg = Buffer.from(pageSvg(i, total, width, height));
    await sharp(svg, { density: 72 }).jpeg({ quality: 92 }).toFile(path.join(dir, `${String(i).padStart(3, '0')}.jpg`));
  }
  return { total, width, height };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.icc) overridePrintConfig({ iccProfile: path.resolve(args.icc) });
  const cfg = printConfig();

  const pagesDir = mkdtempSync(path.join(tmpdir(), 'bd-sample-pages-'));
  const started = Date.now();
  try {
    process.stdout.write(`Rendering ${args.pages + 2} sample pages (${args.size})…\n`);
    const { width, height } = await writeSamplePages(pagesDir, args.size, args.pages);
    process.stdout.write(`  ${width}×${height} px per page\n`);

    const build = await buildPrintPdf({
      orderId: 'BD-SAMPLE01',
      itemIndex: 0,
      title: 'Sample Diary',
      options: { size: args.size, binding: 'hardcover', paper: 'gloss', giftBox: false },
      pages: args.pages,
      qty: 1,
      pagesDir,
      outDir: args.out,
      onProgress: (done, total) => process.stdout.write(`\r  page ${done}/${total}   `),
    });
    process.stdout.write('\n');

    const seconds = (Date.now() - started) / 1000;
    const report = await verifyPrintPdf(build, cfg);

    process.stdout.write(`\n${build.path}\n`);
    process.stdout.write(`  ${build.pageCount} pages · ${(build.bytes / 1e6).toFixed(1)} MB · ${seconds.toFixed(1)} s · peak RSS ${(process.memoryUsage().rss / 1e6).toFixed(0)} MB\n`);
    process.stdout.write(`  trim ${build.geometry.trimW}×${build.geometry.trimH} mm, bleed ${build.geometry.bleedMm} mm, profile ${build.iccProfileName}\n\n`);
    for (const check of report.checks) {
      const mark = check.pass ? 'pass' : check.blocking ? 'FAIL' : 'warn';
      process.stdout.write(`  [${mark}] ${check.name.padEnd(16)} ${check.detail}\n`);
    }
    process.stdout.write(`\n${report.ok ? 'All blocking checks passed.' : 'Blocking checks failed.'}\n`);
    if (!args.keep) rmSync(build.path, { force: true });
    else process.stdout.write(`Kept ${build.path}\n`);
    process.exitCode = report.ok ? 0 : 1;
  } finally {
    rmSync(pagesDir, { recursive: true, force: true });
  }
}

main().catch(err => {
  console.error(`\n${err instanceof Error ? err.message : err}`);
  process.exitCode = 1;
});
