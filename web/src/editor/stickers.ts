// Hand-drawn sticker set, each part drawn in a 100 × 100 box.
// Colour tokens: 'ink' and 'tint' are user-editable; others are literal.

export interface StickerPart {
  d: string;
  fill?: string;
  stroke?: string;
  width?: number;
  dash?: number[];
  opacity?: number;
}

export interface StickerDef {
  key: string;
  name: string;
  defaultTint: string;
  parts: StickerPart[];
}

const burst = (() => {
  let d = '';
  for (let i = 0; i < 20; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 10;
    const r = i % 2 ? 20 : [46, 40, 44, 38, 46, 42, 40, 45, 39, 43][i / 2];
    d += `${i ? 'L' : 'M'}${(50 + r * Math.cos(a)).toFixed(1)} ${(50 + r * Math.sin(a)).toFixed(1)}`;
  }
  return d + 'Z';
})();

const sunRing = (() => {
  let d = '';
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI) / 12, r = i % 2 ? 28 : 45;
    d += `${i ? 'L' : 'M'}${(50 + r * Math.cos(a)).toFixed(1)} ${(50 + r * Math.sin(a)).toFixed(1)}`;
  }
  return d + 'Z';
})();

export const STICKERS: StickerDef[] = [
  { key: 'plane', name: 'Paper plane', defaultTint: '#FFFFFF', parts: [
    { d: 'M4 88c14-6 26-18 40-18', stroke: 'ink', width: 2.5, dash: [2, 7] },
    { d: 'M46 58 96 8 78 90 64 70Z', fill: 'tint', stroke: 'ink', width: 3.5 },
    { d: 'M64 70 96 8M64 70l-6 18 14-10', stroke: 'ink', width: 3.5 },
  ] },
  { key: 'heart', name: 'Heart', defaultTint: '#FF5A52', parts: [
    { d: 'M50 88S10 64 10 36a20 20 0 0 1 40-8 20 20 0 0 1 40 8c0 28-40 52-40 52Z', fill: 'tint', stroke: 'ink', width: 4 },
    { d: 'M26 34c2-8 8-10 12-10', stroke: '#FFFFFF', width: 4, opacity: 0.7 },
  ] },
  { key: 'star', name: 'Star', defaultTint: '#FFD93D', parts: [
    { d: 'm50 6 12 28 30 3-23 20 7 30-26-16-26 16 7-30L8 37l30-3Z', fill: 'tint', stroke: 'ink', width: 4 },
  ] },
  { key: 'sparkle', name: 'Sparkle', defaultTint: '#141414', parts: [
    { d: 'M50 4c4 30 16 42 46 46-30 4-42 16-46 46C46 66 34 54 4 50c30-4 42-16 46-46Z', fill: 'tint' },
  ] },
  { key: 'burst', name: 'Starburst', defaultTint: '#F4AFD3', parts: [
    { d: burst, fill: '#A3A396', stroke: 'none' },
    { d: burst, fill: 'tint', stroke: 'ink', width: 3 },
  ] },
  { key: 'sun', name: 'Happy sun', defaultTint: '#FFD93D', parts: [
    { d: sunRing, fill: 'tint', stroke: 'ink', width: 3 },
    { d: 'M50 32a18 18 0 1 1 0 36 18 18 0 0 1 0-36Z', fill: 'tint', stroke: 'ink', width: 3 },
    { d: 'M43 46v4M57 46v4M42 57c5 5 11 5 16 0', stroke: 'ink', width: 3 },
  ] },
  { key: 'smiley', name: 'Smiley', defaultTint: '#141414', parts: [
    { d: 'M34 20v18M64 16v18M12 50c16 40 70 42 78-8', stroke: 'tint', width: 8 },
  ] },
  { key: 'arrow', name: 'Curly arrow', defaultTint: '#141414', parts: [
    { d: 'M6 70C18 30 50 18 60 40c6 14-14 20-16 8-2-14 26-22 48 6', stroke: 'tint', width: 4 },
    { d: 'M92 54l-13-2M92 54l-4-13', stroke: 'tint', width: 4 },
  ] },
  { key: 'loop', name: 'Loop arrow', defaultTint: '#141414', parts: [
    { d: 'M60 4c-8 20-16 36 2 44 16 6 20-12 8-15-14-3-26 16-32 58', stroke: 'tint', width: 4 },
    { d: 'M38 91l-8-11M38 91l10-9', stroke: 'tint', width: 4 },
  ] },
  { key: 'pin', name: 'Map pin', defaultTint: '#FF5A52', parts: [
    { d: 'M50 94S18 58 18 38a32 32 0 0 1 64 0c0 20-32 56-32 56Z', fill: 'tint', stroke: 'ink', width: 4 },
    { d: 'M50 26a12 12 0 1 1 0 24 12 12 0 0 1 0-24Z', fill: '#FFFFFF', stroke: 'ink', width: 3.5 },
  ] },
  { key: 'camera', name: 'Camera', defaultTint: '#BFE6FF', parts: [
    { d: 'M8 30h20l8-12h28l8 12h20v52H8Z', fill: 'tint', stroke: 'ink', width: 4 },
    { d: 'M50 38a18 18 0 1 1 0 36 18 18 0 0 1 0-36Z', fill: '#FFFFFF', stroke: 'ink', width: 4 },
    { d: 'M50 48a8 8 0 1 1 0 16 8 8 0 0 1 0-16ZM78 40h6', stroke: 'ink', width: 3.5 },
  ] },
  { key: 'suitcase', name: 'Suitcase', defaultTint: '#FFB23F', parts: [
    { d: 'M36 26V14h28v12', stroke: 'ink', width: 4 },
    { d: 'M10 26h80v60H10Z', fill: 'tint', stroke: 'ink', width: 4 },
    { d: 'M30 26v60M70 26v60', stroke: 'ink', width: 4 },
    { d: 'M40 44h20v16H40Z', fill: '#FFFFFF', stroke: 'ink', width: 3 },
  ] },
  { key: 'palm', name: 'Palm tree', defaultTint: '#3E9B5A', parts: [
    { d: 'M52 94c-2-24 0-44 6-60', stroke: '#8A5A34', width: 7 },
    { d: 'M58 34C44 18 22 18 10 30c16-4 30 0 48 4ZM58 34c6-18 22-28 38-24-16 4-28 12-38 24ZM58 34c18-6 34 2 38 16-12-8-24-12-38-16ZM58 34C48 44 36 58 38 72c4-14 10-26 20-38Z', fill: 'tint', stroke: 'ink', width: 3 },
  ] },
  { key: 'waves', name: 'Waves', defaultTint: '#4F9DFF', parts: [
    { d: 'M4 40c8-10 16-10 24 0s16 10 24 0 16-10 24 0 16 10 20 4M4 62c8-10 16-10 24 0s16 10 24 0 16-10 24 0 16 10 20 4', stroke: 'tint', width: 6 },
  ] },
  { key: 'flower', name: 'Flower', defaultTint: '#F4AFD3', parts: [
    { d: 'M50 50C36 36 36 10 50 8c14 2 14 28 0 42Zm0 0c14-14 40-14 42 0-2 14-28 14-42 0Zm0 0c14 14 14 40 0 42-14-2-14-28 0-42Zm0 0C36 64 10 64 8 50c2-14 28-14 42 0Z', fill: 'tint', stroke: 'ink', width: 3 },
    { d: 'M50 40a10 10 0 1 1 0 20 10 10 0 0 1 0-20Z', fill: '#FFD93D', stroke: 'ink', width: 3 },
  ] },
  { key: 'tape', name: 'Washi tape', defaultTint: '#FFD0EE', parts: [
    { d: 'M2 34l6 4-4 6 6 4-4 6 6 4-4 6h84l-6-4 4-6-6-4 4-6-6-4 4-6Z', fill: 'tint', opacity: 0.85 },
    { d: 'M20 40l8 20M40 40l8 20M60 40l8 20M80 40l8 20', stroke: '#FFFFFF', width: 3, opacity: 0.6 },
  ] },
  { key: 'ticket', name: 'Ticket', defaultTint: '#FFEB99', parts: [
    { d: 'M6 26h88v14a10 10 0 0 0 0 20v14H6V60a10 10 0 0 0 0-20Z', fill: 'tint', stroke: 'ink', width: 3.5 },
    { d: 'M68 30v40', stroke: 'ink', width: 3, dash: [4, 5] },
    { d: 'M18 42h36M18 52h28M18 62h32', stroke: 'ink', width: 3 },
  ] },
  { key: 'globe', name: 'Globe', defaultTint: '#A9E6C3', parts: [
    { d: 'M50 8a42 42 0 1 1 0 84 42 42 0 0 1 0-84Z', fill: 'tint', stroke: 'ink', width: 4 },
    { d: 'M50 8c-16 14-16 70 0 84M50 8c16 14 16 70 0 84M10 36h80M10 64h80M50 8v84', stroke: 'ink', width: 3 },
  ] },
  { key: 'cloud', name: 'Cloud', defaultTint: '#FFFFFF', parts: [
    { d: 'M24 78a18 18 0 0 1-2-36 24 24 0 0 1 46-8 20 20 0 0 1 12 38 14 14 0 0 1-6 6Z', fill: 'tint', stroke: 'ink', width: 4 },
  ] },
  { key: 'bubble', name: 'Speech bubble', defaultTint: '#FFFFFF', parts: [
    { d: 'M10 14h80v54H44L24 88l4-20H10Z', fill: 'tint', stroke: 'ink', width: 4 },
  ] },
  { key: 'stamp', name: 'Postmark', defaultTint: '#1C2A52', parts: [
    { d: 'M50 10a40 40 0 1 1 0 80 40 40 0 0 1 0-80Z', stroke: 'tint', width: 4 },
    { d: 'M50 20a30 30 0 1 1 0 60 30 30 0 0 1 0-60Z', stroke: 'tint', width: 2, dash: [3, 4] },
    { d: 'M4 42c10-6 20 6 30 0s20 6 30 0 20 6 32 0M4 58c10-6 20 6 30 0s20 6 30 0 20 6 32 0', stroke: 'tint', width: 3 },
  ] },
  { key: 'underline', name: 'Squiggle', defaultTint: '#FFD93D', parts: [
    { d: 'M4 56C22 42 34 66 50 52s28-14 46 0', stroke: 'tint', width: 9 },
  ] },
];

export const getSticker = (key: string) => STICKERS.find(s => s.key === key);
