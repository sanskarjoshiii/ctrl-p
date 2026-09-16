import type { CreateOrderPayload, OrderRecord } from '@shared/types';

export class ApiError extends Error {
  status: number;
  fields?: Record<string, string>;
  constructor(message: string, status: number, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { 'content-type': 'application/json', ...init?.headers } });
  } catch {
    throw new ApiError('Can’t reach our servers — check your connection and try again.', 0);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body.error ?? `Request failed (${res.status})`, res.status, body.fields);
  return body as T;
}

export type PublicOrder = Omit<OrderRecord, 'customer'> & { customer: { name: string; email: string; city: string; state: string; country: string } };

export const api = {
  createOrder: (payload: CreateOrderPayload) =>
    request<{ order: PublicOrder; uploads: { index: number; expectedFiles: number; url: string }[] }>('/api/orders', { method: 'POST', body: JSON.stringify(payload) }),
  pay: (id: string) => request<{ order: PublicOrder; mode: string }>(`/api/orders/${id}/pay`, { method: 'POST' }),
  getOrder: (id: string) => request<{ order: PublicOrder }>(`/api/orders/${encodeURIComponent(id)}`),

  /** Multipart upload with progress (fetch has no upload progress). */
  uploadPages(url: string, pages: Blob[], projectJson: string, onProgress?: (fraction: number) => void) {
    return new Promise<{ order: PublicOrder }>((resolve, reject) => {
      const form = new FormData();
      pages.forEach((blob, i) => form.append('pages', blob, `${String(i).padStart(3, '0')}.jpg`));
      form.append('project', projectJson);
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress?.(e.loaded / e.total); };
      xhr.onload = () => {
        let body: { error?: string } = {};
        try { body = JSON.parse(xhr.responseText); } catch { /* non-JSON error page */ }
        if (xhr.status >= 200 && xhr.status < 300) resolve(body as { order: PublicOrder });
        else reject(new ApiError(body.error ?? `Upload failed (${xhr.status})`, xhr.status));
      };
      xhr.onerror = () => reject(new ApiError('Upload interrupted — check your connection and retry.', 0));
      xhr.send(form);
    });
  },
};
