import { useEffect, useRef, useState } from 'react';
import type { DiaryPage } from '@shared/types';
import { renderPage } from './renderPage';

// Unedited pages keep their object identity (immer), so cached renders stay valid.
const cache = new WeakMap<DiaryPage, Promise<string>>();

export function pagePreviewUrl(page: DiaryPage, pixelRatio = 0.9): Promise<string> {
  let hit = cache.get(page);
  if (!hit) {
    hit = renderPage(page, { pixelRatio, variant: 'preview', quality: 0.86 }).then(blob => URL.createObjectURL(blob));
    cache.set(page, hit);
  }
  return hit;
}

/**
 * Renders page previews one at a time, always picking the unrendered page closest
 * to `focus` (the spread being viewed), so flipping ahead never shows blank pages for long.
 */
export function usePagePreviews(pages: DiaryPage[] | undefined, focus = 0) {
  const [urls, setUrls] = useState<(string | undefined)[]>(() => (pages ? new Array(pages.length).fill(undefined) : []));
  const focusRef = useRef(focus);
  useEffect(() => { focusRef.current = focus; }, [focus]);

  useEffect(() => {
    if (!pages) return;
    let alive = true;
    const done = new Array<boolean>(pages.length).fill(false);
    setUrls(new Array(pages.length).fill(undefined));
    (async () => {
      for (let n = 0; n < pages.length && alive; n++) {
        let next = -1;
        for (let i = 0; i < pages.length; i++) {
          if (!done[i] && (next < 0 || Math.abs(i - focusRef.current) < Math.abs(next - focusRef.current))) next = i;
        }
        done[next] = true;
        try {
          const url = await pagePreviewUrl(pages[next]);
          if (alive) setUrls(prev => { const copy = [...prev]; copy[next] = url; return copy; });
        } catch {
          /* leave the page blank if one render fails */
        }
      }
    })();
    return () => { alive = false; };
  }, [pages]);

  return urls;
}
