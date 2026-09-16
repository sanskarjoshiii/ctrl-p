import type { Template } from '@shared/catalog';
import { PAGE_RULES } from '@shared/pricing';
import type { DiaryPage, DiaryProject, PhotoElement } from '@shared/types';
import type { PhotoMeta } from '../lib/photos';
import { applyLayoutToPage, makeText, newInnerPage, paperBackground, textRole, uid } from './factory';
import { getLayout } from './layouts';

const POOLS: Record<number, string[]> = {
  1: ['single', 'polaroid', 'postcard', 'full-bleed', 'journal'],
  2: ['duo-stack', 'duo-overlap', 'circles', 'duo-side'],
  3: ['trio-hero', 'scatter', 'trio-column', 'film', 'arches'],
  4: ['quad', 'stamps'],
  5: ['mosaic'],
  6: ['six'],
};

const isLandscape = (m?: PhotoMeta) => (m ? m.width > m.height * 1.1 : false);

/** Picks the next photo, preferring one whose orientation matches the slot. */
function takePhoto(queue: string[], metas: Record<string, PhotoMeta>, slot: PhotoElement) {
  if (!queue.length) return null;
  const wantLandscape = slot.width > slot.height * 1.1;
  const look = Math.min(4, queue.length);
  let pick = 0;
  for (let i = 0; i < look; i++) if (isLandscape(metas[queue[i]]) === wantLandscape) { pick = i; break; }
  return queue.splice(pick, 1)[0];
}

/** Fills only empty frames, keeping every layout as it is. */
export function fillEmptyFrames(project: DiaryProject, metas: Record<string, PhotoMeta>): { pages: DiaryPage[]; placed: number } {
  const used = new Set<string>();
  for (const p of project.pages) for (const el of p.elements) if (el.type === 'photo' && el.photoId) used.add(el.photoId);
  const queue = project.photoIds.filter(id => !used.has(id) && metas[id]);
  let placed = 0;
  const pages = project.pages.map(page => {
    if (!queue.length || !page.elements.some(el => el.type === 'photo' && !el.photoId)) return page;
    return {
      ...page,
      elements: page.elements.map(el => {
        if (el.type !== 'photo' || el.photoId) return el;
        const photoId = takePhoto(queue, metas, el);
        if (!photoId) return el;
        placed++;
        return { ...el, photoId, zoom: 1, panX: 0, panY: 0 };
      }),
    };
  });
  return { pages, placed };
}

/** Rebuilds every inner page (except the title page) around the uploaded photos. */
export function rebuildAllPages(project: DiaryProject, metas: Record<string, PhotoMeta>, tpl: Template): { pages: DiaryPage[]; placed: number; added: number } {
  const photos = project.photoIds.filter(id => metas[id]);
  const cover = project.pages.filter(p => p.kind === 'cover');
  const back = project.pages.filter(p => p.kind === 'back');
  const inner = project.pages.filter(p => p.kind === 'inner');
  const [title, ...rest] = inner;

  const queue = [...photos];
  // The title page keeps its layout; give its first empty frame a photo.
  const titlePage: DiaryPage | undefined = title && {
    ...title,
    elements: title.elements.map(el => (el.type === 'photo' && !el.photoId && queue.length ? { ...el, photoId: queue.shift()! } : el)),
  };

  let pageCount = Math.max(rest.length, PAGE_RULES.min - 1);
  const maxPerPage = 4;
  const needed = Math.ceil(queue.length / maxPerPage);
  const added = Math.max(0, Math.min(PAGE_RULES.max - 1, needed) - pageCount);
  pageCount += added;
  if ((pageCount + 1) % 2) pageCount += 1;

  const perPage = queue.length / pageCount;
  const pages: DiaryPage[] = [];
  let carry = 0;
  const cursor: Record<number, number> = {};

  for (let i = 0; i < pageCount; i++) {
    const existing = rest[i];
    const bgPage = existing ?? newInnerPage(tpl);
    if (!queue.length) {
      // Out of photos: a notes page instead of empty frames.
      pages.push({
        id: existing?.id ?? uid(), kind: 'inner', background: paperBackground(tpl, 'lines'),
        elements: [
          makeText({ x: 150, y: 90, width: 690, text: 'Notes', align: 'left', ...textRole('title', tpl) }),
          makeText({ x: 150, y: 1060, width: 690, text: 'little things to remember ✎', align: 'right', rotation: -3, ...textRole('hand', tpl) }),
        ],
      });
      continue;
    }
    carry += perPage;
    let count = Math.max(1, Math.min(6, Math.floor(carry)));
    if (i === pageCount - 1 || queue.length <= count) count = Math.min(6, queue.length) || 1;
    carry -= count;
    const pool = POOLS[count] ?? POOLS[4];
    cursor[count] = ((cursor[count] ?? -1) + 1) % pool.length;
    const layout = getLayout(pool[cursor[count]])!;

    const cleared: DiaryPage = { id: bgPage.id, kind: 'inner', background: bgPage.background, elements: [] };
    const laidOut = applyLayoutToPage(cleared, layout, tpl);
    laidOut.elements = laidOut.elements.map(el => {
      if (el.type !== 'photo') return el;
      const photoId = takePhoto(queue, metas, el);
      return photoId ? { ...el, photoId } : el;
    });
    // Drop frames that could not be filled (last page).
    laidOut.elements = laidOut.elements.filter(el => el.type !== 'photo' || el.photoId);
    pages.push(laidOut);
  }

  const placed = photos.length - queue.length;
  return { pages: [...cover, ...(titlePage ? [titlePage] : []), ...pages, ...back], placed, added };
}
