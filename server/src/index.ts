import express, { type ErrorRequestHandler } from 'express';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { MulterError } from 'multer';
import { ordersRouter, ValidationError } from './orders.ts';

const PORT = Number(process.env.PORT ?? 8787);
const WEB_DIST = fileURLToPath(new URL('../../web/dist', import.meta.url));
const serveWeb = process.argv.includes('--prod') || process.env.NODE_ENV === 'production';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api', ordersRouter);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

if (serveWeb && existsSync(WEB_DIST)) {
  app.use(express.static(WEB_DIST, { maxAge: '7d', index: false }));
  app.get('/{*path}', (_req, res) => res.sendFile('index.html', { root: WEB_DIST }));
}

const onError: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ValidationError) return res.status(422).json({ error: 'Please check the highlighted fields', fields: err.fields });
  if (err instanceof MulterError) return res.status(413).json({ error: `Upload rejected: ${err.message}` });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side' });
};
app.use(onError);

app.listen(PORT, () => console.log(`Book Diaries API on http://localhost:${PORT}${serveWeb ? ' (serving web/dist)' : ''}`));
