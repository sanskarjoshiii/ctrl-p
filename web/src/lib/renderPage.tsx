import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Layer, Stage } from 'react-konva';
import type Konva from 'konva';
import { SIZES, type SizeKey } from '@shared/pricing';
import { PAGE_H, PAGE_W, type DiaryPage, type DiaryProject } from '@shared/types';
import { BackgroundNode, ElementNode, type RenderVariant } from '../editor/render/nodes';
import { loadEditorFonts } from './fonts';
import { loadPhotoImage, loadUrlImage } from './imageCache';

export interface RenderOptions {
  pixelRatio: number;
  variant: RenderVariant;
  mime?: 'image/jpeg' | 'image/png';
  quality?: number;
}

/** Print resolution: ~300 dpi for the chosen size (capped to keep uploads sane). */
export const printPixelRatio = (size: SizeKey) => Math.min(3, Math.max(2, (SIZES[size].inches[0] * 300) / PAGE_W));

async function preload(page: DiaryPage, variant: RenderVariant) {
  const jobs: Promise<unknown>[] = [loadEditorFonts()];
  if (page.background.image) {
    jobs.push(loadUrlImage(variant === 'original' ? page.background.image.print : page.background.image.preview));
  }
  for (const el of page.elements) {
    if (el.type === 'photo' && el.photoId) jobs.push(loadPhotoImage(el.photoId, variant));
  }
  await Promise.all(jobs);
}

function StaticPage({ page, variant, onReady }: { page: DiaryPage; variant: RenderVariant; onReady: (stage: Konva.Stage) => void }) {
  const ref = useRef<Konva.Stage>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => ref.current && onReady(ref.current)));
    return () => cancelAnimationFrame(id);
  }, [onReady]);
  return (
    <Stage ref={ref} width={PAGE_W} height={PAGE_H} listening={false}>
      <Layer listening={false}>
        <BackgroundNode bg={page.background} variant={variant} />
        {page.elements.map(el => <ElementNode key={el.id} el={el} variant={variant} />)}
      </Layer>
    </Stage>
  );
}

export async function renderPage(page: DiaryPage, { pixelRatio, variant, mime = 'image/jpeg', quality = 0.9 }: RenderOptions): Promise<Blob> {
  await preload(page, variant);
  const host = document.createElement('div');
  host.style.cssText = `position:fixed;left:-${PAGE_W * 2}px;top:0;width:${PAGE_W}px;height:${PAGE_H}px;pointer-events:none;opacity:0;`;
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    const stage = await new Promise<Konva.Stage>(resolve => root.render(<StaticPage page={page} variant={variant} onReady={resolve} />));
    const blob = await new Promise<Blob>((resolve, reject) => {
      stage.toBlob({ pixelRatio, mimeType: mime, quality, callback: b => (b ? resolve(b as Blob) : reject(new Error('Render failed'))) });
    });
    return blob;
  } finally {
    root.unmount();
    host.remove();
  }
}

export async function renderProjectPages(project: DiaryProject, opts: RenderOptions, onProgress?: (done: number, total: number) => void) {
  const out: Blob[] = [];
  for (let i = 0; i < project.pages.length; i++) {
    out.push(await renderPage(project.pages[i], opts));
    onProgress?.(i + 1, project.pages.length);
  }
  return out;
}

export const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
