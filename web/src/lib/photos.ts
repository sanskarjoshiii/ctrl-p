import { createStore, delMany, get, getMany, setMany } from 'idb-keyval';
import { nanoid } from 'nanoid';

export type PhotoVariant = 'thumb' | 'preview' | 'original';

export interface PhotoMeta {
  id: string;
  name: string;
  width: number;
  height: number;
  createdAt: number;
}

const store = createStore('book-diaries-photos', 'photos');

const LIMITS: Record<PhotoVariant, number> = { thumb: 420, preview: 1800, original: 4200 };
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_MB = 40;

export class PhotoImportError extends Error {}

async function encode(bitmap: ImageBitmap, maxEdge: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale), h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
  canvas.width = canvas.height = 0;
  if (!blob) throw new PhotoImportError('Could not process this image');
  return blob;
}

/** Decodes a user file (respecting EXIF orientation) and stores three sizes. */
export async function importPhoto(file: File): Promise<PhotoMeta> {
  if (!ACCEPTED.includes(file.type)) {
    const heic = /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
    throw new PhotoImportError(heic ? `${file.name}: HEIC isn’t supported yet — export it as JPG first` : `${file.name}: only JPG, PNG and WebP images are supported`);
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) throw new PhotoImportError(`${file.name} is larger than ${MAX_FILE_MB} MB`);

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new PhotoImportError(`${file.name} couldn’t be read — is it a valid image?`);
  }
  try {
    const meta: PhotoMeta = { id: nanoid(12), name: file.name, width: bitmap.width, height: bitmap.height, createdAt: Date.now() };
    const [thumb, preview, original] = await Promise.all([
      encode(bitmap, LIMITS.thumb, 0.8),
      encode(bitmap, LIMITS.preview, 0.88),
      encode(bitmap, LIMITS.original, 0.93),
    ]);
    await setMany(
      [
        [`meta:${meta.id}`, meta],
        [`thumb:${meta.id}`, thumb],
        [`preview:${meta.id}`, preview],
        [`original:${meta.id}`, original],
      ],
      store,
    );
    return meta;
  } finally {
    bitmap.close();
  }
}

export async function getPhotoBlob(id: string, variant: PhotoVariant): Promise<Blob | undefined> {
  return (await get<Blob>(`${variant}:${id}`, store)) ?? (variant === 'original' ? get<Blob>(`preview:${id}`, store) : undefined);
}

export async function getPhotoMetas(ids: string[]): Promise<PhotoMeta[]> {
  if (!ids.length) return [];
  const metas = await getMany<PhotoMeta | undefined>(ids.map(id => `meta:${id}`), store);
  return metas.filter((m): m is PhotoMeta => Boolean(m));
}

export async function deletePhotos(ids: string[]) {
  await delMany(ids.flatMap(id => [`meta:${id}`, `thumb:${id}`, `preview:${id}`, `original:${id}`]), store);
}

