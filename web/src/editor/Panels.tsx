import { useRef, useState, type ReactNode } from 'react';
import { getTemplate, type Template } from '@shared/catalog';
import type { BackgroundPattern, FrameStyle, PhotoElement, PhotoFilter, ShapeKind } from '@shared/types';
import { IconClose, IconSparkles, IconUpload } from '../components/Doodles';
import { usePhotoThumbUrl } from '../lib/imageCache';
import { useCurrentPage, useProjects, useSelectedElement } from '../store/projects';
import { toast } from '../store/toast';
import { fillEmptyFrames, rebuildAllPages } from './autofill';
import { Section, Swatches } from './controls';
import { setPhotoDragData } from './EditorCanvas';
import { applyLayoutToPage, makePhoto, makeShape, makeSticker, makeText, textRole } from './factory';
import { LAYOUTS, type Layout } from './layouts';
import { STICKERS } from './stickers';
import { useEditorUi, type EditorTab } from './uiStore';

const useTemplate = (): Template => {
  const slug = useProjects(s => s.project?.templateSlug ?? 'blank');
  return getTemplate(slug) ?? getTemplate('blank')!;
};

export const paletteColors = (tpl: Template) => [tpl.palette.ink, tpl.palette.accent, tpl.palette.accent2, tpl.palette.paper, '#FFFFFF', '#141414', '#FFD93D', '#F4AFD3', '#BFE6FF', '#A9E6C3'];

/* ——— Photos ——— */

function PhotoTile({ id, uses, onUse }: { id: string; uses: number; onUse: (id: string) => void }) {
  const url = usePhotoThumbUrl(id);
  const removePhoto = useProjects(s => s.removePhoto);
  return (
    <div className="ph-tile">
      <button type="button" className="ph-tile__img" draggable onDragStart={e => setPhotoDragData(e, id)} onClick={() => onUse(id)} aria-label="Place photo on page">
        {url ? <img src={url} alt="" draggable={false} /> : <span className="ph-tile__loading" />}
      </button>
      {uses > 0 && <span className="ph-tile__uses" title={`Used ${uses}×`}>{uses}</span>}
      <button type="button" className="ph-tile__remove" aria-label="Remove photo" onClick={() => { if (confirm('Remove this photo from the diary?')) removePhoto(id); }}>
        <IconClose width={12} />
      </button>
    </div>
  );
}

function PhotosPanel() {
  const project = useProjects(s => s.project)!;
  const photos = useProjects(s => s.photos);
  const page = useCurrentPage();
  const selected = useSelectedElement();
  const tpl = useTemplate();
  const { addPhotos, updateElement, addElement, select, edit } = useProjects.getState();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const uses: Record<string, number> = {};
  for (const p of project.pages) for (const el of p.elements) if (el.type === 'photo' && el.photoId) uses[el.photoId] = (uses[el.photoId] ?? 0) + 1;

  const onUse = (photoId: string) => {
    if (!page) return;
    if (selected?.type === 'photo') return updateElement(selected.id, { photoId, zoom: 1, panX: 0, panY: 0 });
    const empty = page.elements.find((el): el is PhotoElement => el.type === 'photo' && !el.photoId);
    if (empty) { updateElement(empty.id, { photoId }); select(empty.id); return; }
    const meta = photos[photoId];
    const ratio = meta ? meta.width / meta.height : 0.8;
    const w = ratio >= 1 ? 600 : 600 * ratio, h = ratio >= 1 ? 600 / ratio : 600;
    addElement(makePhoto({ photoId, width: Math.round(w), height: Math.round(h), x: Math.round(450 - w / 2), y: Math.round(600 - h / 2), frame: 'border' }));
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setProgress(`0 / ${files.length}`);
    const { added, errors } = await addPhotos([...files], (d, t) => setProgress(`${d} / ${t}`));
    setProgress(null);
    if (added.length) toast(`${added.length} photo${added.length > 1 ? 's' : ''} added`);
    errors.slice(0, 3).forEach(e => toast(e, 'error'));
  };

  const autofill = (mode: 'fill' | 'rebuild') => {
    const current = useProjects.getState().project!;
    if (!current.photoIds.length) return toast('Add some photos first', 'error');
    if (mode === 'fill') {
      const { pages, placed } = fillEmptyFrames(current, photos);
      if (!placed) return toast('No empty frames left — try “Rebuild pages” or add pages.');
      edit(d => { d.pages = pages as typeof d.pages; });
      toast(`Placed ${placed} photo${placed > 1 ? 's' : ''} into empty frames`, 'info', { label: 'Undo', run: () => useProjects.getState().undo() });
    } else {
      if (!confirm('Rebuild every inner page around your photos? Text you added to those pages will be replaced. (You can undo.)')) return;
      const { pages, placed, added } = rebuildAllPages(current, photos, tpl);
      edit(d => { d.pages = pages as typeof d.pages; });
      toast(`Arranged ${placed} photos${added ? `, added ${added} pages` : ''}`, 'info', { label: 'Undo', run: () => useProjects.getState().undo() });
    }
  };

  return (
    <>
      <Section title={`Your photos (${project.photoIds.length})`}>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={e => { onFiles(e.target.files); e.target.value = ''; }} />
        <button type="button" className="btn btn--sm btn--white btn--block" onClick={() => inputRef.current?.click()} disabled={Boolean(progress)}>
          <IconUpload width={18} /> {progress ? `Adding ${progress}` : 'Add photos'}
        </button>
        <div className="autofill">
          <button type="button" className="btn btn--sm btn--yellow btn--block" onClick={() => autofill('fill')}><IconSparkles width={18} /> Fill empty frames</button>
          <button type="button" className="btn btn--sm btn--ghost btn--block" onClick={() => autofill('rebuild')}>Rebuild all pages</button>
        </div>
      </Section>
      {project.photoIds.length ? (
        <>
          <p className="ed-hint">Drag onto a frame, or click to fill the selected / next empty frame.</p>
          <div className="ph-grid">
            {project.photoIds.map(id => <PhotoTile key={id} id={id} uses={uses[id] ?? 0} onUse={onUse} />)}
          </div>
        </>
      ) : (
        <p className="ed-empty hand">no photos yet — add a few to get started ✎</p>
      )}
    </>
  );
}

/* ——— Layouts ——— */

function LayoutPreview({ layout }: { layout: Layout }) {
  return (
    <svg viewBox="0 0 900 1200" aria-hidden>
      <rect width="900" height="1200" fill="#fff" />
      {layout.slots.map((s, i) => (
        <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.frame === 'circle' ? s.w / 2 : s.frame === 'rounded' ? 40 : 0}
          transform={s.rotation ? `rotate(${s.rotation} ${s.x + s.w / 2} ${s.y + s.h / 2})` : undefined}
          fill={['#FFD93D', '#F4AFD3', '#BFE6FF', '#C9A8FF', '#A9E6C3', '#FFB23F'][i % 6]} stroke="#141414" strokeWidth="18" />
      ))}
      {layout.texts?.map((t, i) => <rect key={`t${i}`} x={t.x} y={t.y} width={t.w * 0.7} height={t.role === 'title' ? 56 : 26} fill="#141414" opacity={0.75} rx="8" />)}
    </svg>
  );
}

function LayoutsPanel() {
  const page = useCurrentPage();
  const tpl = useTemplate();
  const { edit } = useProjects.getState();
  if (!page) return null;
  if (page.kind === 'cover' && page.background.image) {
    return <p className="ed-hint">The illustrated cover is fixed artwork. Add text or stickers on top from the Text and Stickers tabs.</p>;
  }
  const apply = (layout: Layout) => {
    edit(d => {
      const i = d.pages.findIndex(p => p.id === page.id);
      if (i >= 0) d.pages[i] = applyLayoutToPage(d.pages[i] as typeof page, layout, tpl) as typeof d.pages[number];
    });
  };
  return (
    <Section title="Collage layouts">
      <p className="ed-hint">Photos already on the page move into the new frames.</p>
      <div className="layout-grid">
        {LAYOUTS.map(l => (
          <button type="button" key={l.key} className="layout-card" onClick={() => apply(l)} title={l.name}>
            <LayoutPreview layout={l} />
            <span>{l.name}</span>
          </button>
        ))}
      </div>
    </Section>
  );
}

/* ——— Frames & filters ——— */

export const FRAMES: { key: FrameStyle; label: string }[] = [
  { key: 'none', label: 'None' }, { key: 'border', label: 'Border' }, { key: 'polaroid', label: 'Polaroid' }, { key: 'rounded', label: 'Rounded' },
  { key: 'circle', label: 'Circle' }, { key: 'arch', label: 'Arch' }, { key: 'heart', label: 'Heart' }, { key: 'stamp', label: 'Stamp' },
  { key: 'film', label: 'Film' }, { key: 'tape', label: 'Washi tape' }, { key: 'shadow', label: 'Pop shadow' },
];

export const FILTERS: { key: PhotoFilter; label: string }[] = [
  { key: 'none', label: 'Original' }, { key: 'warm', label: 'Warm' }, { key: 'cool', label: 'Cool' }, { key: 'fade', label: 'Faded' }, { key: 'sepia', label: 'Sepia' }, { key: 'mono', label: 'B&W' },
];

export function FrameIcon({ frame }: { frame: FrameStyle }) {
  const img = <rect x="18" y="16" width="44" height="40" fill="#BFE6FF" />;
  const shapes: Record<FrameStyle, ReactNode> = {
    none: <rect x="12" y="10" width="56" height="60" fill="#BFE6FF" />,
    border: <><rect x="12" y="10" width="56" height="60" fill="#fff" stroke="#141414" strokeWidth="2" /><rect x="17" y="15" width="46" height="50" fill="#BFE6FF" /></>,
    polaroid: <><rect x="12" y="8" width="56" height="64" fill="#fff" stroke="#141414" strokeWidth="2" />{img}</>,
    rounded: <rect x="12" y="10" width="56" height="60" rx="12" fill="#BFE6FF" />,
    circle: <circle cx="40" cy="40" r="29" fill="#BFE6FF" />,
    arch: <path d="M12 70V38a28 28 0 0 1 56 0v32Z" fill="#BFE6FF" />,
    heart: <path d="M40 68S12 50 12 30a14 14 0 0 1 28-6 14 14 0 0 1 28 6c0 20-28 38-28 38Z" fill="#BFE6FF" />,
    stamp: <><rect x="12" y="10" width="56" height="60" fill="#fff" stroke="#141414" strokeWidth="2" strokeDasharray="3 3" /><rect x="19" y="17" width="42" height="46" fill="#BFE6FF" /></>,
    film: <><rect x="8" y="16" width="64" height="48" fill="#1a1a1a" /><rect x="12" y="24" width="56" height="32" fill="#BFE6FF" /></>,
    tape: <><rect x="14" y="14" width="52" height="54" fill="#BFE6FF" stroke="#fff" strokeWidth="3" /><rect x="8" y="9" width="24" height="9" fill="#FFE08A" transform="rotate(-14 20 13)" /><rect x="48" y="9" width="24" height="9" fill="#F4AFD3" transform="rotate(14 60 13)" /></>,
    shadow: <><rect x="17" y="15" width="52" height="56" fill="#141414" /><rect x="11" y="9" width="52" height="56" fill="#BFE6FF" stroke="#141414" strokeWidth="2.5" /></>,
  };
  return <svg viewBox="0 0 80 80" aria-hidden>{shapes[frame]}</svg>;
}

function FramesPanel() {
  const page = useCurrentPage();
  const selected = useSelectedElement();
  const { updateElement, edit } = useProjects.getState();
  const photo = selected?.type === 'photo' ? selected : null;
  const photoCount = page?.elements.filter(e => e.type === 'photo').length ?? 0;

  const setFrame = (frame: FrameStyle) => {
    const frameColor = frame === 'film' ? '#1A1A1A' : '#FFFFFF';
    if (photo) return updateElement(photo.id, { frame, frameColor });
    if (!page || !photoCount) return toast('Select a photo, or add photos to this page first');
    edit(d => { for (const el of d.pages.find(p => p.id === page.id)!.elements) if (el.type === 'photo') { el.frame = frame; el.frameColor = frameColor; } });
  };
  const setFilter = (filter: PhotoFilter) => {
    if (photo) return updateElement(photo.id, { filter });
    if (!page || !photoCount) return;
    edit(d => { for (const el of d.pages.find(p => p.id === page.id)!.elements) if (el.type === 'photo') el.filter = filter; });
  };

  return (
    <>
      <p className="ed-hint">{photo ? 'Styling the selected photo.' : `No photo selected — changes apply to all ${photoCount} photos on this page.`}</p>
      <Section title="Frame">
        <div className="frame-grid">
          {FRAMES.map(f => (
            <button type="button" key={f.key} className={`frame-card ${photo?.frame === f.key ? 'is-active' : ''}`} onClick={() => setFrame(f.key)}>
              <FrameIcon frame={f.key} />
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      </Section>
      <Section title="Photo filter">
        <div className="chip-row">
          {FILTERS.map(f => <button type="button" key={f.key} className="chip" aria-pressed={photo?.filter === f.key} onClick={() => setFilter(f.key)}>{f.label}</button>)}
        </div>
      </Section>
    </>
  );
}

/* ——— Text ——— */

function TextPanel() {
  const tpl = useTemplate();
  const addElement = useProjects(s => s.addElement);
  const setEditingText = useEditorUi(s => s.setEditingText);
  const presets = [
    { label: 'Big title', sample: tpl.country === 'Start from scratch' ? 'Our trip' : tpl.country, style: { ...textRole('title', tpl), fontSize: 110 }, text: tpl.slug === 'blank' ? 'Our trip' : tpl.country },
    { label: 'Handwritten note', sample: tpl.greeting, style: textRole('hand', tpl), text: tpl.greeting },
    { label: 'Subheading', sample: 'Day three', style: { fontFamily: 'Space Grotesk', fontStyle: 'bold' as const, fontSize: 54, fill: tpl.palette.ink }, text: 'Day three' },
    { label: 'Paragraph', sample: 'Tell the story…', style: textRole('body', tpl), text: 'Tell the story of this page — who you were with, what you ate, what made you laugh.' },
    { label: 'Typewriter label', sample: 'TICKET NO. 042', style: textRole('label', tpl), text: 'PLATFORM 9 · 08:42' },
    { label: 'Script', sample: 'wish you were here', style: { fontFamily: 'Yellowtail', fontSize: 80, fill: tpl.palette.accent }, text: 'wish you were here' },
  ];
  return (
    <Section title="Add text">
      <div className="text-presets">
        {presets.map(p => (
          <button
            type="button"
            key={p.label}
            className="text-preset"
            onClick={() => {
              const el = makeText({ x: 90, y: 520, width: 720, text: p.text, align: 'center', ...p.style });
              addElement(el);
              setTimeout(() => setEditingText(el.id), 60);
            }}
          >
            <span className="text-preset__sample" style={{ fontFamily: `"${p.style.fontFamily}"`, fontWeight: 'fontStyle' in p.style && p.style.fontStyle === 'bold' ? 700 : 400, color: p.style.fill }}>{p.sample}</span>
            <span className="text-preset__label">{p.label}</span>
          </button>
        ))}
      </div>
      <p className="ed-hint">Double-click text on the page to edit it.</p>
    </Section>
  );
}

/* ——— Stickers & shapes ——— */

const SHAPES: { key: ShapeKind; label: string; svg: ReactNode }[] = [
  { key: 'rect', label: 'Square', svg: <rect x="14" y="14" width="52" height="52" /> },
  { key: 'rounded', label: 'Rounded', svg: <rect x="14" y="14" width="52" height="52" rx="12" /> },
  { key: 'circle', label: 'Circle', svg: <circle cx="40" cy="40" r="27" /> },
  { key: 'triangle', label: 'Triangle', svg: <path d="M40 12 68 66H12Z" /> },
  { key: 'star', label: 'Star', svg: <path d="m40 10 8.2 18.3 20 2-15 13.3 4.4 19.6L40 53 22.4 63.2l4.4-19.6-15-13.3 20-2Z" /> },
  { key: 'heart', label: 'Heart', svg: <path d="M40 66S12 48 12 29a14 14 0 0 1 28-6 14 14 0 0 1 28 6c0 19-28 37-28 37Z" /> },
  { key: 'burst', label: 'Burst', svg: <path d="M40 8l6 18 18-8-8 18 18 6-18 6 8 18-18-8-6 18-6-18-18 8 8-18-18-6 18-6-8-18 18 8Z" /> },
  { key: 'blob', label: 'Blob', svg: <path d="M42 12c14 0 26 8 27 22s-7 20-4 29-12 9-22 8-20 1-24-11-6-21-1-31 10-17 24-17Z" /> },
  { key: 'line', label: 'Line', svg: <path d="M10 40h60" fill="none" strokeWidth="6" /> },
  { key: 'arrow', label: 'Arrow', svg: <path d="M10 40h52M50 28l14 12-14 12" fill="none" strokeWidth="6" /> },
];

export function StickerPreview({ sticker, tint, ink = '#141414' }: { sticker: (typeof STICKERS)[number]; tint?: string; ink?: string }) {
  const color = (token?: string) => (token === 'ink' ? ink : token === 'tint' ? tint ?? sticker.defaultTint : token);
  return (
    <svg viewBox="-4 -4 108 108" aria-hidden>
      {sticker.parts.map((p, i) => (
        <path key={i} d={p.d} fill={p.fill && p.fill !== 'none' ? color(p.fill) : 'none'} stroke={p.stroke && p.stroke !== 'none' ? color(p.stroke) : 'none'} strokeWidth={p.width ?? 0} strokeDasharray={p.dash?.join(' ')} opacity={p.opacity ?? 1} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

function ElementsPanel() {
  const tpl = useTemplate();
  const addElement = useProjects(s => s.addElement);
  const [tint, setTint] = useState<string | null>(null);
  return (
    <>
      <Section title="Sticker colour">
        <Swatches label="Sticker colour" value={tint} colors={[tpl.palette.accent, tpl.palette.accent2, tpl.palette.ink, '#FFD93D', '#F4AFD3', '#BFE6FF', '#A9E6C3', '#FFFFFF']} onChange={setTint} />
        {tint && <button type="button" className="btn btn--ghost btn--sm" onClick={() => setTint(null)}>Use original colours</button>}
      </Section>
      <Section title="Stickers & doodles">
        <div className="sticker-grid">
          {STICKERS.map(s => (
            <button type="button" key={s.key} className="sticker-card" title={s.name} onClick={() => addElement(makeSticker(s.key, { ...(tint ? { tint } : {}), x: 330 + Math.round(Math.random() * 60), y: 480 + Math.round(Math.random() * 60), width: s.key === 'tape' ? 320 : 220, height: s.key === 'tape' ? 320 : 220 }))}>
              <StickerPreview sticker={s} tint={tint ?? undefined} />
              <span className="visually-hidden">{s.name}</span>
            </button>
          ))}
        </div>
      </Section>
      <Section title="Shapes">
        <div className="shape-grid">
          {SHAPES.map(s => (
            <button type="button" key={s.key} className="shape-card" title={s.label} onClick={() => addElement(makeShape(s.key, { fill: s.key === 'line' || s.key === 'arrow' ? 'transparent' : tint ?? tpl.palette.accent2, stroke: s.key === 'line' || s.key === 'arrow' ? tint ?? tpl.palette.ink : '#141414' }))}>
              <svg viewBox="0 0 80 80" aria-hidden fill={tint ?? tpl.palette.accent2} stroke="#141414" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">{s.svg}</svg>
              <span className="visually-hidden">{s.label}</span>
            </button>
          ))}
        </div>
      </Section>
    </>
  );
}

/* ——— Background ——— */

const PATTERNS: { key: BackgroundPattern; label: string }[] = [
  { key: 'plain', label: 'Plain' }, { key: 'grid', label: 'Grid' }, { key: 'dots', label: 'Dots' }, { key: 'lines', label: 'Notebook' }, { key: 'kraft', label: 'Kraft' },
];

function BackgroundPanel() {
  const page = useCurrentPage();
  const tpl = useTemplate();
  const { edit } = useProjects.getState();
  if (!page) return null;
  const locked = Boolean(page.background.image);
  const set = (patch: Partial<typeof page.background>, coalesce?: string) =>
    edit(d => { Object.assign(d.pages.find(p => p.id === page.id)!.background, patch); }, { coalesce });
  const colors = [tpl.palette.paper, tpl.palette.accent2, tpl.palette.accent, tpl.palette.ink, tpl.coverColor, '#FFFFFF', '#FFFDEF', '#F3E7D3', '#C9A27A', '#141414', '#FFD0EE', '#BFE6FF', '#E3F5E9', '#FFEB99'];

  return (
    <>
      {locked && <p className="ed-hint">This cover uses illustrated artwork, so its background is fixed.</p>}
      <fieldset disabled={locked} className="ed-fieldset">
        <Section title="Paper colour">
          <Swatches label="Paper colour" value={page.background.color} colors={colors} onChange={color => set({ color }, 'bg-color')} />
        </Section>
        <Section title="Pattern">
          <div className="chip-row">
            {PATTERNS.map(p => (
              <button type="button" key={p.key} className="chip" aria-pressed={page.background.pattern === p.key} onClick={() => set({ pattern: p.key, ...(p.key === 'kraft' ? { color: '#C9A27A' } : {}) })}>{p.label}</button>
            ))}
          </div>
        </Section>
        <Section title="Pattern ink">
          <Swatches label="Pattern colour" value={page.background.patternColor} colors={[tpl.palette.ink, tpl.palette.accent, '#141414', '#FFFFFF']} onChange={patternColor => set({ patternColor }, 'bg-pattern')} />
        </Section>
      </fieldset>
      {page.kind === 'inner' && (
        <button
          type="button"
          className="btn btn--sm btn--white btn--block"
          onClick={() => {
            edit(d => { for (const p of d.pages) if (p.kind === 'inner') p.background = { ...page.background }; });
            toast('Background applied to every inner page', 'info', { label: 'Undo', run: () => useProjects.getState().undo() });
          }}
        >
          Apply to all inner pages
        </button>
      )}
    </>
  );
}

const PANELS: Record<EditorTab, { title: string; render: () => ReactNode }> = {
  photos: { title: 'Photos', render: () => <PhotosPanel /> },
  layouts: { title: 'Layouts', render: () => <LayoutsPanel /> },
  frames: { title: 'Frames & filters', render: () => <FramesPanel /> },
  text: { title: 'Text', render: () => <TextPanel /> },
  elements: { title: 'Stickers & shapes', render: () => <ElementsPanel /> },
  background: { title: 'Background', render: () => <BackgroundPanel /> },
};

export default function Panels() {
  const tab = useEditorUi(s => s.tab);
  const togglePanel = useEditorUi(s => s.togglePanel);
  const panel = PANELS[tab];
  return (
    <div className="panel" role="tabpanel" aria-label={panel.title}>
      <header className="panel__head">
        <h2>{panel.title}</h2>
        <button type="button" className="panel__close" onClick={() => togglePanel(false)} aria-label="Close panel"><IconClose width={18} /></button>
      </header>
      <div className="panel__body">{panel.render()}</div>
    </div>
  );
}
