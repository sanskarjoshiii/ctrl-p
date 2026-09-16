import { useEffect, useState } from 'react';

export interface EditorFont {
  family: string;
  label: string;
  query: string;
  category: 'display' | 'sans' | 'serif' | 'hand' | 'mono';
  bold?: boolean;
  italic?: boolean;
}

export const EDITOR_FONTS: EditorFont[] = [
  { family: 'Space Grotesk', label: 'Space Grotesk', query: 'Space+Grotesk:wght@400;700', category: 'sans', bold: true },
  { family: 'Bebas Neue', label: 'Bebas Neue', query: 'Bebas+Neue', category: 'display' },
  { family: 'Abril Fatface', label: 'Abril Fatface', query: 'Abril+Fatface', category: 'display' },
  { family: 'Shrikhand', label: 'Shrikhand', query: 'Shrikhand', category: 'display' },
  { family: 'Alfa Slab One', label: 'Alfa Slab One', query: 'Alfa+Slab+One', category: 'display' },
  { family: 'Knewave', label: 'Knewave', query: 'Knewave', category: 'display' },
  { family: 'Sancreek', label: 'Sancreek', query: 'Sancreek', category: 'display' },
  { family: 'Kavoon', label: 'Kavoon', query: 'Kavoon', category: 'display' },
  { family: 'Chonburi', label: 'Chonburi', query: 'Chonburi', category: 'display' },
  { family: 'Cinzel Decorative', label: 'Cinzel Decorative', query: 'Cinzel+Decorative:wght@700', category: 'display' },
  { family: 'Playfair Display', label: 'Playfair Display', query: 'Playfair+Display:ital,wght@0,400;0,700;1,400;1,700', category: 'serif', bold: true, italic: true },
  { family: 'DM Serif Display', label: 'DM Serif Display', query: 'DM+Serif+Display:ital@0;1', category: 'serif', italic: true },
  { family: 'Caveat Brush', label: 'Caveat Brush', query: 'Caveat+Brush', category: 'hand' },
  { family: 'Kalam', label: 'Kalam', query: 'Kalam:wght@400;700', category: 'hand', bold: true },
  { family: 'Yellowtail', label: 'Yellowtail', query: 'Yellowtail', category: 'hand' },
  { family: 'Permanent Marker', label: 'Permanent Marker', query: 'Permanent+Marker', category: 'hand' },
  { family: 'Courier Prime', label: 'Courier Prime', query: 'Courier+Prime:ital,wght@0,400;0,700;1,400', category: 'mono', bold: true, italic: true },
];

let injected: Promise<void> | null = null;

/** Injects the editor font stylesheet once and waits for faces to be usable (max ~4s). */
export function loadEditorFonts(): Promise<void> {
  if (injected) return injected;
  injected = new Promise<void>(resolve => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${EDITOR_FONTS.map(f => `family=${f.query}`).join('&')}&display=block`;
    const done = () => {
      const loads = EDITOR_FONTS.flatMap(f => {
        const faces = [`40px "${f.family}"`];
        if (f.bold) faces.push(`bold 40px "${f.family}"`);
        if (f.italic) faces.push(`italic 40px "${f.family}"`);
        return faces.map(face => document.fonts.load(face).catch(() => []));
      });
      Promise.race([Promise.all(loads), new Promise(r => setTimeout(r, 4000))]).then(() => resolve());
    };
    link.onload = done;
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
  return injected;
}

export function useEditorFonts() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    loadEditorFonts().then(() => alive && setReady(true));
    return () => { alive = false; };
  }, []);
  return ready;
}
