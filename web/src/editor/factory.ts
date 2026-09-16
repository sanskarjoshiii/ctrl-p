import { nanoid } from 'nanoid';
import { coverUrls, type Template } from '@shared/catalog';
import { DEFAULT_OPTIONS, PAGE_RULES } from '@shared/pricing';
import type { Background, DiaryElement, DiaryPage, DiaryProject, PhotoElement, ShapeElement, ShapeKind, StickerElement, TextElement } from '@shared/types';
import { LAYOUTS, type Layout, type LayoutText } from './layouts';
import { getSticker } from './stickers';

export const uid = () => nanoid(10);

const base = { rotation: 0, opacity: 1 };

export const makePhoto = (p: Partial<PhotoElement> = {}): PhotoElement => ({
  id: uid(), type: 'photo', x: 150, y: 250, width: 600, height: 700, ...base,
  photoId: null, frame: 'none', frameColor: '#FFFFFF', filter: 'none', zoom: 1, panX: 0, panY: 0, ...p,
});

export const makeText = (p: Partial<TextElement> = {}): TextElement => ({
  id: uid(), type: 'text', x: 100, y: 500, width: 700, height: 100, ...base,
  text: 'Your words here', fontFamily: 'Space Grotesk', fontSize: 56, fontStyle: 'normal', fill: '#141414', align: 'center', letterSpacing: 0, lineHeight: 1.2, ...p,
});

export const makeShape = (shape: ShapeKind, p: Partial<ShapeElement> = {}): ShapeElement => {
  const wide = shape === 'line' || shape === 'arrow';
  return {
    id: uid(), type: 'shape', shape, x: 300, y: wide ? 580 : 450, width: wide ? 340 : 300, height: wide ? 40 : 300, ...base,
    fill: shape === 'line' || shape === 'arrow' ? 'transparent' : '#FFD93D', stroke: '#141414', strokeWidth: 6, ...p,
  };
};

export const makeSticker = (key: string, p: Partial<StickerElement> = {}): StickerElement => ({
  id: uid(), type: 'sticker', sticker: key, x: 350, y: 500, width: 200, height: 200, ...base,
  ink: '#141414', tint: getSticker(key)?.defaultTint ?? '#FFD93D', ...p,
});

export const cloneElement = <T extends DiaryElement>(el: T, offset = 30): T => ({ ...el, id: uid(), x: el.x + offset, y: el.y + offset });

export const paperBackground = (tpl: Template, pattern: Background['pattern'] = 'plain'): Background => ({
  color: tpl.palette.paper, pattern, patternColor: tpl.palette.ink, image: null,
});

/** Text styles derived from a template, used by layouts and the text panel. */
export function textRole(role: LayoutText['role'], tpl: Template): Partial<TextElement> {
  const { ink, accent } = tpl.palette;
  switch (role) {
    case 'title': return { fontFamily: tpl.displayFont, fontSize: 80, fill: ink, lineHeight: 1.05 };
    case 'hand': return { fontFamily: 'Caveat Brush', fontSize: 64, fill: accent };
    case 'label': return { fontFamily: 'Courier Prime', fontStyle: 'bold', fontSize: 26, fill: ink, letterSpacing: 4 };
    default: return { fontFamily: 'Space Grotesk', fontSize: 32, fill: ink, lineHeight: 1.45 };
  }
}

/** Applies a collage layout to a page: photos keep their order, other elements stay put. */
export function applyLayoutToPage(page: DiaryPage, layout: Layout, tpl: Template, withTexts = true): DiaryPage {
  const oldPhotos = page.elements.filter((e): e is PhotoElement => e.type === 'photo');
  const filled = oldPhotos.filter(p => p.photoId);
  const others = page.elements.filter(e => e.type !== 'photo');
  const slots = layout.slots.map((s, i) => {
    const prev = filled[i];
    return makePhoto({
      x: s.x, y: s.y, width: s.w, height: s.h, rotation: s.rotation ?? 0,
      frame: s.frame ?? 'none', photoId: prev?.photoId ?? null, filter: prev?.filter ?? 'none',
      frameColor: s.frame === 'film' ? '#1A1A1A' : '#FFFFFF', caption: s.frame === 'polaroid' ? '' : undefined,
    });
  });
  const hasTexts = others.some(e => e.type === 'text');
  const texts = withTexts && !hasTexts
    ? (layout.texts ?? []).map(t => makeText({ x: t.x, y: t.y, width: t.w, text: t.text, align: t.align ?? 'left', rotation: t.rotation ?? 0, ...textRole(t.role, tpl) }))
    : [];
  return { ...page, elements: [...slots, ...others, ...texts] };
}

const STARTER_SEQUENCE = ['polaroid', 'duo-stack', 'trio-hero', 'journal', 'quad', 'scatter', 'duo-overlap', 'mosaic', 'film', 'circles', 'trio-column', 'stamps', 'postcard', 'arches', 'six', 'duo-side', 'single'];

function titlePage(tpl: Template): DiaryPage {
  const { ink, accent } = tpl.palette;
  const year = new Date().getFullYear();
  return {
    id: uid(), kind: 'inner', background: paperBackground(tpl, 'dots'),
    elements: [
      makeText({ x: 80, y: 250, width: 740, text: tpl.greeting, fontFamily: 'Caveat Brush', fontSize: 110, fill: accent, rotation: -4 }),
      makeText({ x: 80, y: 420, width: 740, text: tpl.slug === 'blank' ? 'Our Travel Diary' : `${tpl.country} ${year}`, fontFamily: tpl.displayFont, fontSize: 104, fill: ink, lineHeight: 1.05 }),
      makeShape('line', { x: 300, y: 610, width: 300, height: 20, stroke: ink, strokeWidth: 5 }),
      makeText({ x: 80, y: 680, width: 740, text: 'THE PEOPLE · THE PLACES · THE STORIES', fontFamily: 'Courier Prime', fontStyle: 'bold', fontSize: 26, letterSpacing: 4, fill: ink }),
      makePhoto({ x: 250, y: 780, width: 400, height: 320, frame: 'tape', rotation: 3 }),
      makeSticker('plane', { x: 640, y: 150, width: 170, height: 170, rotation: 8, ink }),
    ],
  };
}

export function buildProject(tpl: Template): DiaryProject {
  const now = Date.now();
  const cover: DiaryPage = tpl.hasCoverArt
    ? { id: uid(), kind: 'cover', background: { color: tpl.coverColor, pattern: 'plain', patternColor: tpl.palette.ink, image: { preview: coverUrls(tpl.slug).medium, print: coverUrls(tpl.slug).print } }, elements: [] }
    : {
        id: uid(), kind: 'cover', background: { color: '#FFFDEF', pattern: 'grid', patternColor: '#141414', image: null },
        elements: [
          makeSticker('burst', { x: 600, y: 70, width: 240, height: 240, rotation: 12 }),
          makeText({ x: 80, y: 300, width: 740, text: 'My Travel\nDiary', fontFamily: 'Abril Fatface', fontSize: 150, lineHeight: 1, fill: '#141414', align: 'left' }),
          makeShape('rect', { x: 80, y: 640, width: 360, height: 26, fill: '#FFD93D', stroke: 'transparent', strokeWidth: 0 }),
          makePhoto({ x: 280, y: 700, width: 520, height: 400, frame: 'polaroid', rotation: -4 }),
          makeText({ x: 80, y: 1110, width: 740, text: `VOL. 01 — ${new Date().getFullYear()}`, fontFamily: 'Courier Prime', fontStyle: 'bold', fontSize: 26, letterSpacing: 4, align: 'left' }),
        ],
      };

  const inner: DiaryPage[] = [titlePage(tpl)];
  for (let i = 1; i < PAGE_RULES.included; i++) {
    const layout = LAYOUTS.find(l => l.key === STARTER_SEQUENCE[(i - 1) % STARTER_SEQUENCE.length])!;
    const blank: DiaryPage = { id: uid(), kind: 'inner', background: paperBackground(tpl, i % 7 === 3 ? 'grid' : 'plain'), elements: [] };
    inner.push(applyLayoutToPage(blank, layout, tpl));
  }

  const back: DiaryPage = {
    id: uid(), kind: 'back', background: { color: tpl.coverColor, pattern: 'plain', patternColor: tpl.palette.ink, image: null },
    elements: [
      makeSticker('sparkle', { x: 415, y: 930, width: 70, height: 70, tint: tpl.slug === 'spain' || tpl.slug === 'mexico' ? '#FFFFFF' : tpl.palette.ink }),
      makeText({ x: 150, y: 1020, width: 600, text: 'made with book diaries', fontFamily: 'Courier Prime', fontStyle: 'bold', fontSize: 22, letterSpacing: 3, fill: tpl.slug === 'spain' || tpl.slug === 'mexico' ? '#FFFFFF' : tpl.palette.ink }),
    ],
  };

  return {
    id: uid(),
    title: tpl.slug === 'blank' ? 'My travel diary' : `${tpl.country} diary`,
    templateSlug: tpl.slug,
    createdAt: now,
    updatedAt: now,
    pages: [cover, ...inner, back],
    photoIds: [],
    options: { ...DEFAULT_OPTIONS },
  };
}

export function newInnerPage(tpl: Template, layoutKey = 'single'): DiaryPage {
  const layout = LAYOUTS.find(l => l.key === layoutKey) ?? LAYOUTS[0];
  return applyLayoutToPage({ id: uid(), kind: 'inner', background: paperBackground(tpl), elements: [] }, layout, tpl);
}

export const pageLabel = (pages: DiaryPage[], index: number) => {
  const p = pages[index];
  if (!p) return '';
  if (p.kind === 'cover') return 'Front cover';
  if (p.kind === 'back') return 'Back cover';
  return `Page ${index}`;
};

export const innerPageCount = (project: DiaryProject) => project.pages.filter(p => p.kind === 'inner').length;

export function slotStats(project: DiaryProject) {
  let slots = 0, filled = 0;
  for (const page of project.pages) for (const el of page.elements) if (el.type === 'photo') { slots++; if (el.photoId) filled++; }
  return { slots, filled, empty: slots - filled };
}
