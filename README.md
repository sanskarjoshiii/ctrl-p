# Book Diaries

Custom printed travel diaries: customers pick a hand-illustrated destination cover, upload photos, design every page (collages, frames, text, stickers), flip through a live preview and order a printed book.

## Run it

Requires Node 22.5+ (built and tested on Node 24).

```bash
npm install
npm run dev          # web on http://localhost:5173, API on http://localhost:8787
```

Production (one server hosts the site and the API):

```bash
npm run build        # builds web/dist and typechecks the server
npm start            # http://localhost:8787  (set PORT to change)
```

## Customer flow

| Step | Route | What happens |
|---|---|---|
| Browse | `/`, `/templates`, `/templates/:slug` | Landing page, cover shop with region filter & search, product page with pricing |
| Photos | `/create/:id/photos` | Drag-and-drop upload; “Auto-fill my diary” or design manually |
| Design | `/create/:id/design` | Page editor (details below) |
| Preview | `/create/:id/preview` | 3D flip-book of the whole diary |
| Order | `/create/:id/order` | Size, binding, paper, gift box, quantity, print check, add to cart |
| Cart | `/cart` | Quantities, delivery method, promo code, multi-book discount |
| Checkout | `/checkout` | Address + payment → print files rendered and uploaded with progress |
| Confirmation | `/order/:orderId` | Order status and totals from the API |
| Drafts | `/diaries` | Continue, preview, duplicate or delete saved diaries |

### Editor

- **Photos:** drag onto frames or drop files straight from the desktop. “Fill empty frames” or “Rebuild all pages” arranges photos automatically, matching landscape/portrait photos to frame shapes.
- **Layouts:** 17 collage layouts (grids, mosaic, polaroid pile, film strip, stamp album, journal, arches, postcard…).
- **Frames:** polaroid (with caption), border, rounded, circle, arch, heart, stamp, film, washi tape, pop shadow, plus photo filters.
- **Crop:** zoom and pan inside any frame.
- **Text:** 17 fonts; presets derived from the cover’s palette; double-click to edit on the page.
- **Stickers & shapes:** 22 hand-drawn stickers and 10 shapes, recolourable.
- **Paper:** colours plus grid, dots, notebook and kraft patterns; apply to all pages.
- **Pages:** thumbnail strip, drag to reorder, add two at a time (24–120), duplicate, delete.
- **Quality of life:** undo/redo, autosave, snapping guides, keyboard shortcuts, low-resolution warnings, mobile bottom-sheet layout.

## Project layout

```
shared/        Types, template catalogue and pricing — imported by web AND server
web/           React 19 + TypeScript + Vite
  src/pages/     Storefront pages and the create flow (pages/create/*)
  src/editor/    Konva canvas, panels, inspector, layouts, stickers, auto-fill, print check
  src/store/     Zustand stores: projects (immer undo history, IndexedDB autosave), cart, toasts
  src/lib/       Photo import, image cache, page renderer, preview cache, API client, fonts
  src/styles/    Design tokens and the doodle UI kit
  public/covers/ Cover art: -sm.webp (cards), .webp (editor), -print.jpg (2700×3600)
server/        Express 5 + node:sqlite
  src/orders.ts  Quote, create order, page uploads, payment stub, order lookup
covers/        Source generator for the 10 illustrated covers (node covers/build.js)
```

## Where to change things

| To change… | Edit |
|---|---|
| Prices, sizes, bindings, paper, shipping, bundle tiers, promo codes, currency | `shared/pricing.ts` — the server recomputes every total from this file |
| Templates (name, palette, greeting, fonts) | `shared/catalog.ts`; add art to `web/public/covers/<slug>{-sm.webp,.webp,-print.jpg}` |
| Collage layouts / stickers | `web/src/editor/layouts.ts`, `web/src/editor/stickers.ts` |
| Brand colours, fonts, UI kit | `web/src/styles/base.css`, `web/src/styles/kit.css` |
| Payment gateway | `POST /api/orders/:id/pay` in `server/src/orders.ts` (currently a demo that marks online orders paid) |

## Data & print files

- **Drafts and photos** live in the customer’s browser (IndexedDB): original (up to 4200 px), editing preview (1800 px) and thumbnail per photo. Nothing is uploaded until checkout.
- **Orders** are stored in `server/data/book-diaries.db` (SQLite). Each diary’s files go to `server/data/orders/<orderId>/item-N/`:
  - `pages/000.jpg` … one JPEG per page, cover first and back cover last, rendered at ~300 dpi for the chosen size (Large: 2481 × 3308 px)
  - `project.json` — the editable design, for reprints or fixes
- Order creation is two-step so large uploads can show progress and be retried: `POST /api/orders` validates and prices the order, then each diary uploads to `POST /api/orders/:id/items/:index/files`. The server checks the page count.

## Before going live

- Connect a real payment gateway (e.g. Razorpay or Stripe) with webhook verification. Remove the “demo mode” note in `Checkout.tsx`.
- Confirmation emails and an admin view for orders (`server/data` is the source today).
- Customer accounts / cloud drafts if people should continue on another device.
- Replace the example promo code, contact email and brand name placeholders.
- Put `server/data` on persistent storage and back it up.
- HEIC photos (iPhone default) are rejected with a friendly message; add server- or WASM-side conversion if needed.
