// In-process print job runner.
//
// Generating a PDF is minutes of CPU and hundreds of megabytes, so it must never
// happen inside the upload request. Jobs live in the `print_files` table, which
// is also what the admin order detail reads, so the queue survives a restart and
// has no second source of truth. One job runs at a time on purpose: two 120-page
// diaries in parallel would double peak memory for no throughput gain on a
// single-box deployment.

import { existsSync, rmSync } from 'node:fs';
import type { OrderRecord, PrintFileKind, PrintFileRecord } from '../../../shared/types.ts';
import { orders, printFiles } from '../db.ts';
import { pagesDir, printDir } from '../paths.ts';
import { buildPrintPdf, PrintBuildError } from './build.ts';
import { printConfig } from './config.ts';
import { verifyPrintPdf, failedChecks } from './verify.ts';

/** Waiting time before retry 1, 2 and 3. */
const BACKOFF_MS = [5_000, 30_000, 120_000];

let running = false;
let pending: NodeJS.Timeout | null = null;

/** Queues (or re-queues) the print PDF for one diary and starts the worker. */
export function enqueuePrintJob(orderId: string, itemIndex: number, kind: PrintFileKind = 'cmyk_pdf'): PrintFileRecord {
  const record = printFiles.enqueue(orderId, itemIndex, kind);
  kick();
  return record;
}

/** Queues every diary in an order. Called when the last upload lands. */
export function enqueueOrder(order: OrderRecord): PrintFileRecord[] {
  return order.items.map((_, index) => enqueuePrintJob(order.id, index));
}

/**
 * Re-runs a job and replaces the file in place. Idempotent: the same input
 * produces the same output path, and the previous PDF is only removed once the
 * new one has been written and verified.
 */
export const regeneratePrintJob = enqueuePrintJob;

export function kick() {
  if (running || pending) return;
  pending = setTimeout(() => {
    pending = null;
    void drain();
  }, 0);
  pending.unref?.();
}

async function drain() {
  if (running) return;
  running = true;
  try {
    for (let job = printFiles.nextQueued(); job; job = printFiles.nextQueued()) {
      await runJob(job);
    }
  } finally {
    running = false;
  }
}

async function runJob(job: PrintFileRecord) {
  const cfg = printConfig();
  const attempts = job.attempts + 1;
  printFiles.setStatus(job.id, 'processing', attempts, null);

  const started = Date.now();
  try {
    if (job.kind !== 'cmyk_pdf') throw new PrintBuildError(`Print file kind "${job.kind}" is not produced yet`);

    const order = orders.get(job.orderId);
    if (!order) throw new PrintBuildError(`Order ${job.orderId} no longer exists`);
    const item = order.items[job.itemIndex];
    if (!item) throw new PrintBuildError(`Order ${job.orderId} has no item ${job.itemIndex + 1}`);

    const previous = job.fileName;
    const outDir = printDir(job.orderId, job.itemIndex);

    const build = await buildPrintPdf({
      orderId: order.id,
      itemIndex: job.itemIndex,
      title: item.title,
      options: item.options,
      pages: item.pages,
      qty: item.qty,
      pagesDir: pagesDir(job.orderId, job.itemIndex),
      outDir,
    });

    const verification = await verifyPrintPdf(build, cfg);
    if (!verification.ok) {
      rmSync(build.path, { force: true });
      const reasons = failedChecks(verification).map(c => `${c.name}: ${c.detail}`).join('; ');
      throw new PrintBuildError(`Prepress checks failed — ${reasons}`);
    }

    // The name encodes the title and specs, so an edited title leaves a stale
    // file behind. Drop it only now that the replacement is on disk and checked.
    if (previous && previous !== build.fileName) {
      const stale = `${outDir}/${previous}`;
      if (existsSync(stale)) rmSync(stale, { force: true });
    }

    printFiles.markReady(job.id, build.fileName, build.bytes, build.sha256, {
      pageCount: build.pageCount,
      trimMm: { width: build.geometry.trimW, height: build.geometry.trimH },
      bleedMm: build.geometry.bleedMm,
      minPpi: build.minPpi,
      maxInkPct: build.ink.maxInkPct,
      p999InkPct: build.ink.p999InkPct,
      iccProfileName: build.iccProfileName,
      pdfxVersion: build.pdfxVersion,
      durationMs: Date.now() - started,
      checks: verification.checks,
    });
    console.log(`[print] ${job.orderId} item ${job.itemIndex + 1}: ready in ${((Date.now() - started) / 1000).toFixed(1)}s — ${build.fileName}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const retryable = attempts < cfg.maxAttempts;
    printFiles.setStatus(job.id, retryable ? 'queued' : 'failed', attempts, message);
    console.error(`[print] ${job.orderId} item ${job.itemIndex + 1}: attempt ${attempts}/${cfg.maxAttempts} failed — ${message}`);
    if (retryable) {
      // Hold the worker briefly rather than spinning on a job that will fail
      // again immediately; a missing ICC profile is not fixed in 5 ms.
      await new Promise(resolve => setTimeout(resolve, BACKOFF_MS[Math.min(attempts - 1, BACKOFF_MS.length - 1)]));
    }
  }
}

/** Requeues anything interrupted by a restart, then starts the worker. */
export function startPrintWorker() {
  const recovered = printFiles.recoverInterrupted();
  if (recovered) console.log(`[print] requeued ${recovered} job(s) interrupted by a restart`);
  kick();
}
