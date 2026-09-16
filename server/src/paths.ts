// Filesystem layout for order data. Kept free of any database import so the
// print pipeline can run (and be tested) without opening SQLite.

import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/** Overridable so tests and deployments can point at a scratch or mounted disk. */
export const DATA_DIR = process.env.BOOK_DIARIES_DATA_DIR
  ? path.resolve(process.env.BOOK_DIARIES_DATA_DIR)
  : fileURLToPath(new URL('../data', import.meta.url));
export const ORDERS_DIR = path.join(DATA_DIR, 'orders');
mkdirSync(ORDERS_DIR, { recursive: true });

export const itemDir = (orderId: string, index: number) => path.join(ORDERS_DIR, orderId, `item-${index + 1}`);
export const pagesDir = (orderId: string, index: number) => path.join(itemDir(orderId, index), 'pages');
export const printDir = (orderId: string, index: number) => path.join(itemDir(orderId, index), 'print');
