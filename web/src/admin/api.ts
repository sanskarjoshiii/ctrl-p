import type { AdminUser, OrderEvent, OrderNote, Permission } from '@shared/admin';
import type { OrderRecord, OrderStatus, PreflightSummary, PrintFileRecord } from '@shared/types';
import type { BookOptions, SizeKey } from '@shared/pricing';

export class AdminApiError extends Error {
  status: number;
  detail?: string | null;
  constructor(message: string, status: number, detail?: string | null) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/admin${url}`, {
      credentials: 'same-origin',
      ...init,
      headers: init?.body instanceof FormData ? init.headers : { 'content-type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new AdminApiError('Can’t reach the server — check your connection.', 0);
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new AdminApiError(body.error ?? `Request failed (${res.status})`, res.status, body.detail);
  return body as T;
}

const json = (method: string, body?: unknown) => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });

export interface OrderSummary {
  id: string;
  createdAt: string;
  status: OrderStatus;
  paymentStatus: OrderRecord['paymentStatus'];
  paymentMethod: OrderRecord['paymentMethod'];
  customerName: string;
  city: string;
  books: number;
  diaries: number;
  total: number;
  shippingMethod: string;
  shipBy: string | null;
  late: boolean;
  warnings: number;
  tags: string[];
  assignedTo: string | null;
}

export interface OrderListResponse {
  orders: OrderSummary[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}

export interface AdminItem {
  index: number;
  title: string;
  templateSlug: string;
  pages: number;
  qty: number;
  unitPrice: number;
  options: BookOptions;
  sizeLabel: string;
  pagesExpected: number;
  pagesOnDisk: number;
  filesReceived: number;
  preflight: PreflightSummary | null;
  printFile: (Pick<PrintFileRecord, 'id' | 'status' | 'fileName' | 'bytes' | 'sha256' | 'error' | 'attempts' | 'report' | 'updatedAt'>) | null;
}

export interface OrderDetail {
  order: OrderRecord & { late: boolean; nextStatus: OrderStatus | null; shippingLabel: string[] };
  items: AdminItem[];
  notes: OrderNote[];
  events: OrderEvent[];
  otherOrders: OrderSummary[];
}

export interface Kpis {
  orders: number;
  netRevenue: number;
  shippingCollected: number;
  averageOrderValue: number;
  booksSold: number;
  pagesPrinted: number;
  codShare: number;
}

export interface Stats {
  range: number;
  kpis: { current: Kpis; previous: Kpis };
  queues: { key: string; label: string; count: number; filter: string }[];
  series: { date: string; orders: number; revenue: number }[];
  funnel: Record<string, number>;
  mix: {
    size: Record<string, number>;
    binding: Record<string, number>;
    paper: Record<string, number>;
    giftBox: { yes: number; no: number };
    template: Record<string, number>;
  };
  printJobs: Record<string, number>;
  activity: OrderEvent[];
  emailTransport: string;
}

export interface Session {
  user: AdminUser;
  permissions: Permission[];
}

export const adminApi = {
  me: () => request<Session>('/me'),
  login: (email: string, password: string) => request<Session>('/login', json('POST', { email, password })),
  logout: () => request<{ ok: true }>('/logout', json('POST')),

  stats: (days = 30) => request<Stats>(`/stats?days=${days}`),
  orders: (query: string) => request<OrderListResponse>(`/orders${query ? `?${query}` : ''}`),
  order: (id: string) => request<OrderDetail>(`/orders/${encodeURIComponent(id)}`),

  setStatus: (id: string, to: OrderStatus, note?: string) =>
    request<{ order: OrderRecord & { nextStatus: OrderStatus | null } }>(`/orders/${encodeURIComponent(id)}/status`, json('PATCH', { to, note })),
  ship: (id: string, carrier: string, trackingNumber: string) =>
    request<{ order: OrderRecord; email: { to: string; subject: string } | null }>(`/orders/${encodeURIComponent(id)}/shipment`, json('POST', { carrier, trackingNumber })),
  updateAddress: (id: string, patch: Record<string, string>) =>
    request<{ order: OrderRecord; shippingLabel: string[] }>(`/orders/${encodeURIComponent(id)}/address`, json('PATCH', patch)),
  addNote: (id: string, body: string) => request<{ note: OrderNote }>(`/orders/${encodeURIComponent(id)}/notes`, json('POST', { body })),
  setTags: (id: string, tags: string[]) => request<{ tags: string[] }>(`/orders/${encodeURIComponent(id)}/tags`, json('PATCH', { tags })),
  resendEmail: (id: string, template: string) =>
    request<{ email: { to: string; subject: string } | null }>(`/orders/${encodeURIComponent(id)}/emails/${template}/resend`, json('POST')),
  regeneratePdf: (id: string, index: number) =>
    request<{ printFile: { id: string; status: string } }>(`/orders/${encodeURIComponent(id)}/items/${index}/print.pdf/regenerate`, json('POST')),

  printPdfUrl: (id: string, index: number) => `/api/admin/orders/${encodeURIComponent(id)}/items/${index}/print.pdf`,
  pageUrl: (id: string, index: number, page: number) => `/api/admin/orders/${encodeURIComponent(id)}/items/${index}/pages/${page}`,
  csvUrl: (query: string) => `/api/admin/orders.csv${query ? `?${query}` : ''}`,
};

export type { SizeKey };
