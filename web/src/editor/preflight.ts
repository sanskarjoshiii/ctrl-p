import { PAGE_RULES, SIZES, type SizeKey } from '@shared/pricing';
import { PAGE_W, type DiaryProject } from '@shared/types';
import type { PhotoMeta } from '../lib/photos';
import { innerPageCount } from './factory';
import { coverCrop, frameInner } from './render/nodes';

export interface PreflightIssue {
  level: 'ok' | 'warn' | 'error';
  title: string;
  detail?: string;
  pages?: number[];
}

/** Print checks shown before ordering. Nothing here blocks except an invalid page count. */
export function preflight(project: DiaryProject, metas: Record<string, PhotoMeta>, size: SizeKey): PreflightIssue[] {
  const issues: PreflightIssue[] = [];
  const emptyPages = new Set<number>();
  const lowResPages = new Set<number>();
  let lowRes = 0, empty = 0, missing = 0, placed = 0;

  project.pages.forEach((page, index) => {
    for (const el of page.elements) {
      if (el.type !== 'photo') continue;
      if (!el.photoId) { empty++; emptyPages.add(index); continue; }
      const meta = metas[el.photoId];
      if (!meta) { missing++; continue; }
      placed++;
      const inner = frameInner(el.frame, el.width, el.height);
      const crop = coverCrop(meta.width, meta.height, inner.w, inner.h, el.zoom, el.panX, el.panY);
      const dpi = crop.width / ((inner.w / PAGE_W) * SIZES[size].inches[0]);
      if (dpi < 150) { lowRes++; lowResPages.add(index); }
    }
  });

  const inner = innerPageCount(project);
  if (inner < PAGE_RULES.min || inner % 2) issues.push({ level: 'error', title: `Page count must be even and at least ${PAGE_RULES.min}`, detail: `You have ${inner} pages.` });
  else issues.push({ level: 'ok', title: `${inner} pages ready to print` });

  if (placed === 0) issues.push({ level: 'warn', title: 'No photos placed yet', detail: 'Your diary will print with empty pages.' });
  else issues.push({ level: 'ok', title: `${placed} photos placed` });

  if (empty) issues.push({ level: 'warn', title: `${empty} empty photo frame${empty > 1 ? 's' : ''}`, detail: 'Empty frames are left blank in print.', pages: [...emptyPages] });
  if (lowRes) issues.push({ level: 'warn', title: `${lowRes} photo${lowRes > 1 ? 's' : ''} may print soft`, detail: `Below 150 dpi at ${SIZES[size].label} size — try a smaller frame or less zoom.`, pages: [...lowResPages] });
  if (missing) issues.push({ level: 'error', title: `${missing} photo${missing > 1 ? 's are' : ' is'} missing from this device`, detail: 'Replace them before ordering.' });
  return issues;
}
