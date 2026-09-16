import { useEffect, useSyncExternalStore } from 'react';
import { getPhotoBlob, type PhotoVariant } from './photos';

interface Entry {
  img?: HTMLImageElement;
  promise?: Promise<HTMLImageElement | undefined>;
  objectUrl?: string;
  failed?: boolean;
}

const entries = new Map<string, Entry>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };

function decode(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

function load(key: string, getSrc: () => Promise<{ src: string; objectUrl?: string } | undefined>) {
  const existing = entries.get(key);
  if (existing?.img || existing?.promise || existing?.failed) return existing.promise ?? Promise.resolve(existing.img);
  const entry: Entry = {};
  entries.set(key, entry);
  entry.promise = getSrc()
    .then(async res => {
      if (!res) throw new Error('missing');
      entry.objectUrl = res.objectUrl;
      entry.img = await decode(res.src);
      return entry.img;
    })
    .catch(() => { entry.failed = true; return undefined; })
    .finally(() => { entry.promise = undefined; emit(); });
  return entry.promise;
}

const photoKey = (id: string, v: PhotoVariant) => `photo:${v}:${id}`;

export function loadPhotoImage(id: string, variant: PhotoVariant) {
  return load(photoKey(id, variant), async () => {
    const blob = await getPhotoBlob(id, variant);
    if (!blob) return undefined;
    const objectUrl = URL.createObjectURL(blob);
    return { src: objectUrl, objectUrl };
  });
}

export function loadUrlImage(url: string) {
  return load(`url:${url}`, async () => ({ src: url }));
}

export const peekPhoto = (id: string | null | undefined, v: PhotoVariant) => (id ? entries.get(photoKey(id, v))?.img : undefined);
export const peekUrl = (url: string | null | undefined) => (url ? entries.get(`url:${url}`)?.img : undefined);

/** Best available image for a photo: requested variant, falling back to smaller ones while it loads. */
export function usePhotoImage(id: string | null | undefined, variant: PhotoVariant): HTMLImageElement | undefined {
  const img = useSyncExternalStore(subscribe, () => peekPhoto(id, variant) ?? (variant === 'original' ? peekPhoto(id, 'preview') : undefined) ?? peekPhoto(id, 'thumb'));
  useEffect(() => {
    if (!id) return;
    if (variant !== 'thumb' && !peekPhoto(id, 'thumb')) loadPhotoImage(id, 'thumb');
    loadPhotoImage(id, variant);
  }, [id, variant]);
  return img;
}

export function useUrlImage(url: string | null | undefined): HTMLImageElement | undefined {
  const img = useSyncExternalStore(subscribe, () => peekUrl(url));
  useEffect(() => { if (url) loadUrlImage(url); }, [url]);
  return img;
}

export function forgetPhotos(ids: string[]) {
  for (const id of ids) {
    for (const v of ['thumb', 'preview', 'original'] as PhotoVariant[]) {
      const key = photoKey(id, v);
      const e = entries.get(key);
      if (e?.objectUrl) URL.revokeObjectURL(e.objectUrl);
      entries.delete(key);
    }
  }
  emit();
}

/** Object URL for a photo thumbnail (for plain <img> usage). */
export function usePhotoThumbUrl(id: string) {
  const img = usePhotoImage(id, 'thumb');
  return img?.src;
}
