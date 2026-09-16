// Build a print PDF for a real order from the command line.
//
//   npm run print:pdf -w server -- BD-XXXXXXXX          # every diary
//   npm run print:pdf -w server -- BD-XXXXXXXX 1        # just diary 1
//   npm run print:pdf -w server -- BD-XXXXXXXX 1 --icc ./profiles/PSOcoated.icc
//
// Runs the build in the foreground and prints the prepress report, so a failure
// is readable instead of buried in the queue's retry log. Use --dry-run to leave
// the database untouched.

import path from 'node:path';
import { orders, printFiles } from '../db.ts';
import { pagesDir, printDir } from '../paths.ts';
import { buildPrintPdf } from './build.ts';
import { overridePrintConfig, printConfig } from './config.ts';
import { verifyPrintPdf } from './verify.ts';

const argv = process.argv.slice(2);
const flag = (name: string) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const positional = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--') && argv[i - 1] !== '--dry-run'));

const orderId = positional[0];
const itemArg = positional[1];
const dryRun = argv.includes('--dry-run');

if (!orderId) {
  console.error('Usage: npm run print:pdf -w server -- BD-XXXXXXXX [itemNumber] [--icc profile.icc] [--dry-run]');
  process.exit(2);
}

const icc = flag('--icc');
if (icc) overridePrintConfig({ iccProfile: path.resolve(icc) });
const cfg = printConfig();

const order = orders.get(orderId);
if (!order) {
  console.error(`Order ${orderId} not found`);
  process.exit(1);
}

const indexes = itemArg ? [Number(itemArg) - 1] : order.items.map((_, i) => i);
for (const index of indexes) {
  if (!order.items[index]) {
    console.error(`Order ${orderId} has no diary ${index + 1}`);
    process.exit(1);
  }
}

let failures = 0;
for (const index of indexes) {
  const item = order.items[index];
  process.stdout.write(`\n${orderId} diary ${index + 1}/${order.items.length} — “${item.title}” · ${item.pages} pages · ${item.options.size} · qty ${item.qty}\n`);

  const started = Date.now();
  try {
    const build = await buildPrintPdf({
      orderId: order.id,
      itemIndex: index,
      title: item.title,
      options: item.options,
      pages: item.pages,
      qty: item.qty,
      pagesDir: pagesDir(order.id, index),
      outDir: printDir(order.id, index),
      onProgress: (done, total) => process.stdout.write(`\r  page ${done}/${total}   `),
    });
    process.stdout.write('\n');

    const report = await verifyPrintPdf(build, cfg);
    for (const check of report.checks) {
      process.stdout.write(`  [${check.pass ? 'pass' : check.blocking ? 'FAIL' : 'warn'}] ${check.name.padEnd(16)} ${check.detail}\n`);
    }
    process.stdout.write(`  ${build.fileName} · ${(build.bytes / 1e6).toFixed(1)} MB · ${((Date.now() - started) / 1000).toFixed(1)} s\n`);

    if (!report.ok) failures++;
    if (dryRun) continue;

    const record = printFiles.enqueue(order.id, index, 'cmyk_pdf');
    if (report.ok) {
      printFiles.markReady(record.id, build.fileName, build.bytes, build.sha256, {
        pageCount: build.pageCount,
        trimMm: { width: build.geometry.trimW, height: build.geometry.trimH },
        bleedMm: build.geometry.bleedMm,
        minPpi: build.minPpi,
        maxInkPct: build.ink.maxInkPct,
        p999InkPct: build.ink.p999InkPct,
        iccProfileName: build.iccProfileName,
        pdfxVersion: build.pdfxVersion,
        durationMs: Date.now() - started,
        checks: report.checks,
      });
    } else {
      const reasons = report.checks.filter(c => !c.pass && c.blocking).map(c => `${c.name}: ${c.detail}`).join('; ');
      printFiles.setStatus(record.id, 'failed', 1, `Prepress checks failed — ${reasons}`);
    }
  } catch (err) {
    failures++;
    process.stdout.write('\n');
    console.error(`  error: ${err instanceof Error ? err.message : err}`);
  }
}

process.exitCode = failures ? 1 : 0;
