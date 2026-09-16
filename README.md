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
  src/print/     Print-ready CMYK PDF pipeline: queue, colour conversion, PDF/X writer, prepress checks
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
| Print output: bleed, ink limit, PDF/X standard, ICC profile | `server/src/print/config.ts` — see [Print-ready PDFs](#print-ready-pdfs) |

## Data & print files

- **Drafts and photos** live in the customer’s browser (IndexedDB): original (up to 4200 px), editing preview (1800 px) and thumbnail per photo. Nothing is uploaded until checkout.
- **Orders** are stored in `server/data/book-diaries.db` (SQLite). Each diary’s files go to `server/data/orders/<orderId>/item-N/`:
  - `pages/000.jpg` … one JPEG per page, cover first and back cover last, rendered at ~300 dpi for the chosen size (Large: 2481 × 3308 px)
  - `project.json` — the editable design, for reprints or fixes
- Order creation is two-step so large uploads can show progress and be retried: `POST /api/orders` validates and prices the order, then each diary uploads to `POST /api/orders/:id/items/:index/files`. The server checks the page count.

## Print-ready PDFs

When the last diary in an order finishes uploading, the server queues one **print-ready CMYK PDF per diary** — front cover, pages 1…N, back cover — and writes it to `server/data/orders/<orderId>/item-N/print/`. Generation is asynchronous; the upload response never waits for it.

| | |
|---|---|
| Trim size | Medium **150 × 200 mm**, Large **210 × 280 mm** |
| Bleed | 3 mm on every side, mirrored from the edge pixels; `TrimBox`/`BleedBox` set per page |
| Colour | DeviceCMYK, converted with your printer's ICC profile |
| Standard | PDF/X-4 (or PDF/X-1a:2001) with the profile embedded as the OutputIntent |
| Code | `server/src/print/` — `build.ts` assembles, `color.ts` converts, `writer.ts` emits the PDF, `verify.ts` checks it |

**An ICC profile is required.** Browsers only produce sRGB, so the conversion happens on the server, and without a destination profile it would not be colour managed — the job fails with that message rather than sending unmanaged colour to the press. Put the profile your printer supplies somewhere readable and point at it:

```bash
PRINT_ICC_PROFILE=/srv/profiles/ISOcoated_v2_eci.icc
PRINT_ICC_PROFILE_NAME="ISO Coated v2 (ECI)"
```

Every job runs eight automated prepress checks (page count and order, page boxes to ±0.1 mm, no RGB images, ≥300 ppi at final size, total ink coverage, embedded OutputIntent, PDF/X declaration) and is only marked `ready` if the blocking ones pass. Failures retry three times with backoff and keep the reason in `print_files.error`.

```bash
npm run print:pdf    -w server -- BD-XXXXXXXX      # rebuild an order's PDFs, with the report
npm run print:pdf    -w server -- BD-XXXXXXXX 1 --dry-run
npm run print:sample -w server -- --size large --pages 24 --keep
```

`print:sample` builds a synthetic diary — neon covers, small near-black text, very dark pages — which is the quickest way to check a new profile or a changed bleed before pointing it at real orders.

### Settings

Defaults live in `server/src/print/config.ts`, are overridden by `server/data/print.config.json`, and then by environment variables. The ones marked *confirm* below are sensible defaults that **your printer has to sign off before launch**:

| Setting | Env | Default | |
|---|---|---|---|
| Bleed | `PRINT_BLEED_MM` | `3` | *confirm* |
| Minimum resolution | `PRINT_MIN_PPI` | `300` | |
| Ink limit | `PRINT_MAX_INK_PCT` | `300` | *confirm* — measured at the 99.9th percentile |
| Enforce ink limit | `PRINT_ENFORCE_INK_LIMIT` | `1` | off makes it advisory |
| Standard | `PRINT_PDFX_STANDARD` | `PDF/X-4` | *confirm* — or `PDF/X-1a:2001`, `none` |
| Crop marks | `PRINT_CROP_MARKS` | `0` | *confirm* — the page boxes already carry the trim |
| JPEG quality | `PRINT_JPEG_QUALITY` | `95` | |
| Retries | `PRINT_MAX_ATTEMPTS` | `3` | |

If the ink check fails, the destination profile is wrong for that paper — that is a conversation with the printer, not something to fix per pixel.

### Known limits

Phase 1 converts the JPEGs the browser already uploads, so: page text is raster at 300 ppi rather than vector (near-black text separates as a four-colour black, not 100% K), pages are compressed twice, and the bleed is mirrored rather than real artwork. Cover-wrap output (`coverMode: "split"`) is not built — it needs the printer's spine-width formula. See issue #1 for the phase 2 and 3 plans.

## Before going live

- Connect a real payment gateway (e.g. Razorpay or Stripe) with webhook verification. Remove the “demo mode” note in `Checkout.tsx`.
- Confirmation emails and an admin view for orders (`server/data` is the source today). Print PDFs are generated but are not downloadable yet — that endpoint needs the admin session from issue #2.
- Have the printer sign off the output spec (ICC profile, bleed, ink limit, PDF/X flavour) and approve a physical test print of a Medium and a Large diary.
- Customer accounts / cloud drafts if people should continue on another device.
- Replace the example promo code, contact email and brand name placeholders.
- Put `server/data` on persistent storage and back it up.
- HEIC photos (iPhone default) are rejected with a friendly message; add server- or WASM-side conversion if needed.
