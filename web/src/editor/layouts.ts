import type { FrameStyle } from '@shared/types';

export interface LayoutSlot {
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
  frame?: FrameStyle;
}

export interface LayoutText {
  x: number;
  y: number;
  w: number;
  role: 'title' | 'body' | 'hand' | 'label';
  text: string;
  align?: 'left' | 'center' | 'right';
  rotation?: number;
}

export interface Layout {
  key: string;
  name: string;
  slots: LayoutSlot[];
  texts?: LayoutText[];
}

const M = 60, G = 24;
const colW = (900 - 2 * M - G) / 2; // 378
const rowH2 = (1200 - 2 * M - G) / 2; // 528
const rowH3 = (1200 - 2 * M - 2 * G) / 3; // 344

export const LAYOUTS: Layout[] = [
  { key: 'single', name: 'Single', slots: [{ x: M, y: M, w: 780, h: 1080 }] },
  { key: 'full-bleed', name: 'Full bleed', slots: [{ x: 0, y: 0, w: 900, h: 1200 }] },
  {
    key: 'polaroid', name: 'Polaroid', slots: [{ x: 130, y: 140, w: 640, h: 790, rotation: -3, frame: 'polaroid' }],
    texts: [{ x: 150, y: 1000, w: 600, role: 'hand', text: 'best day ever!', align: 'center', rotation: -3 }],
  },
  { key: 'duo-stack', name: 'Duo stack', slots: [{ x: M, y: M, w: 780, h: rowH2 }, { x: M, y: M + rowH2 + G, w: 780, h: rowH2 }] },
  { key: 'duo-side', name: 'Duo side', slots: [{ x: M, y: 200, w: colW, h: 800 }, { x: M + colW + G, y: 200, w: colW, h: 800 }] },
  {
    key: 'duo-overlap', name: 'Overlap', slots: [{ x: 60, y: 90, w: 520, h: 660, rotation: -4, frame: 'border' }, { x: 330, y: 500, w: 520, h: 620, rotation: 5, frame: 'border' }],
  },
  {
    key: 'trio-hero', name: 'Hero + 2',
    slots: [{ x: M, y: M, w: 780, h: 620 }, { x: M, y: M + 620 + G, w: colW, h: 1080 - 620 - G }, { x: M + colW + G, y: M + 620 + G, w: colW, h: 1080 - 620 - G }],
  },
  {
    key: 'trio-column', name: 'Column + 2',
    slots: [{ x: M, y: M, w: colW, h: 1080 }, { x: M + colW + G, y: M, w: colW, h: rowH2 }, { x: M + colW + G, y: M + rowH2 + G, w: colW, h: rowH2 }],
  },
  {
    key: 'quad', name: 'Grid of 4',
    slots: [0, 1, 2, 3].map(i => ({ x: M + (i % 2) * (colW + G), y: M + Math.floor(i / 2) * (rowH2 + G), w: colW, h: rowH2 })),
  },
  {
    key: 'mosaic', name: 'Mosaic 5',
    slots: [
      { x: M, y: M, w: 780, h: 500 },
      ...[0, 1, 2].map(i => ({ x: M + i * (244 + G), y: M + 500 + G, w: 244, h: 280 })),
      { x: M, y: M + 500 + G + 280 + G, w: 780, h: 1080 - 500 - 280 - 2 * G },
    ],
  },
  {
    key: 'six', name: 'Grid of 6',
    slots: [0, 1, 2, 3, 4, 5].map(i => ({ x: M + (i % 2) * (colW + G), y: M + Math.floor(i / 2) * (rowH3 + G), w: colW, h: rowH3 })),
  },
  {
    key: 'scatter', name: 'Polaroid pile',
    slots: [
      { x: 70, y: 80, w: 440, h: 540, rotation: -7, frame: 'polaroid' },
      { x: 400, y: 300, w: 440, h: 540, rotation: 6, frame: 'polaroid' },
      { x: 110, y: 610, w: 440, h: 540, rotation: -2, frame: 'polaroid' },
    ],
  },
  {
    key: 'film', name: 'Film strip',
    slots: [0, 1, 2].map(i => ({ x: 120, y: 70 + i * 360, w: 660, h: 340, frame: 'film' as FrameStyle })),
  },
  {
    key: 'stamps', name: 'Stamp album',
    slots: [
      { x: 80, y: 110, w: 350, h: 440, rotation: -4, frame: 'stamp' },
      { x: 470, y: 80, w: 350, h: 440, rotation: 3, frame: 'stamp' },
      { x: 90, y: 640, w: 350, h: 440, rotation: 2, frame: 'stamp' },
      { x: 470, y: 610, w: 350, h: 440, rotation: -3, frame: 'stamp' },
    ],
  },
  {
    key: 'journal', name: 'Journal',
    slots: [{ x: M, y: M, w: 780, h: 660, frame: 'tape' }],
    texts: [
      { x: M, y: 770, w: 780, role: 'title', text: 'Day one', align: 'left' },
      { x: M, y: 870, w: 780, role: 'body', text: 'Write a few lines about this day — where you went, what you ate, the moment you want to remember.', align: 'left' },
      { x: 520, y: 1070, w: 320, role: 'hand', text: 'more soon ✦', align: 'right', rotation: -4 },
    ],
  },
  {
    key: 'circles', name: 'Circles',
    slots: [{ x: 90, y: 130, w: 460, h: 460, frame: 'circle' }, { x: 360, y: 560, w: 460, h: 460, frame: 'circle' }],
    texts: [{ x: 90, y: 1060, w: 720, role: 'hand', text: 'little moments', align: 'left', rotation: -3 }],
  },
  {
    key: 'arches', name: 'Arches',
    slots: [0, 1, 2].map(i => ({ x: M + i * (244 + G), y: 360, w: 244, h: 560, frame: 'arch' as FrameStyle })),
    texts: [
      { x: M, y: 150, w: 780, role: 'title', text: 'Wandering', align: 'center' },
      { x: M, y: 990, w: 780, role: 'label', text: 'THREE STREETS · ONE AFTERNOON', align: 'center' },
    ],
  },
  {
    key: 'postcard', name: 'Postcard',
    slots: [{ x: 70, y: 230, w: 760, h: 540, rotation: -2, frame: 'border' }],
    texts: [
      { x: 70, y: 830, w: 760, role: 'hand', text: 'Greetings from…', align: 'left', rotation: -2 },
      { x: 70, y: 950, w: 760, role: 'body', text: 'Wish you were here. Weather perfect, food even better.', align: 'left' },
    ],
  },
];

export const getLayout = (key: string) => LAYOUTS.find(l => l.key === key);
