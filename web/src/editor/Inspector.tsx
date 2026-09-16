import { getTemplate } from '@shared/catalog';
import type { DiaryElement, PhotoElement, ShapeElement, StickerElement, TextElement } from '@shared/types';
import { IconCopy, IconDown, IconLock, IconTrash, IconUnlock, IconUp, IconWarning } from '../components/Doodles';
import { EDITOR_FONTS } from '../lib/fonts';
import { useCurrentPage, useProjects, useSelectedElement } from '../store/projects';
import { toast } from '../store/toast';
import { IconButton, Section, Segmented, Slider, Swatches } from './controls';
import { innerPageCount, pageLabel, slotStats } from './factory';
import { FILTERS, FRAMES, FrameIcon, paletteColors } from './Panels';
import { useEditorUi } from './uiStore';

function useUpdate(el: DiaryElement) {
  const updateElement = useProjects(s => s.updateElement);
  return <T extends DiaryElement>(patch: Partial<T>, coalesce?: string) => updateElement(el.id, patch as Partial<DiaryElement>, coalesce);
}

function Arrange({ el }: { el: DiaryElement }) {
  const { arrange, duplicateElement, removeElement, updateElement } = useProjects.getState();
  return (
    <Section title="Arrange">
      <div className="ed-toolbar">
        <IconButton label="Bring forward" onClick={() => arrange(el.id, 'forward')}><IconUp width={18} /></IconButton>
        <IconButton label="Send backward" onClick={() => arrange(el.id, 'backward')}><IconDown width={18} /></IconButton>
        <IconButton label="Duplicate" onClick={() => duplicateElement(el.id)}><IconCopy width={18} /></IconButton>
        <IconButton label={el.locked ? 'Unlock' : 'Lock position'} active={el.locked} onClick={() => updateElement(el.id, { locked: !el.locked })}>{el.locked ? <IconLock width={18} /> : <IconUnlock width={18} />}</IconButton>
        <IconButton label="Delete" className="icon-btn--danger" onClick={() => removeElement(el.id)}><IconTrash width={18} /></IconButton>
      </div>
      <Slider label="Opacity" value={Math.round(el.opacity * 100)} min={10} max={100} onChange={v => updateElement(el.id, { opacity: v / 100 }, 'opacity')} format={v => `${v}%`} />
      <Slider label="Rotation" value={Math.round(el.rotation)} min={-180} max={180} onChange={v => updateElement(el.id, { rotation: v }, 'rotation')} format={v => `${v}°`} />
    </Section>
  );
}

function PhotoInspector({ el }: { el: PhotoElement }) {
  const update = useUpdate(el);
  const photos = useProjects(s => s.photos);
  const setTab = useEditorUi(s => s.setTab);
  const meta = el.photoId ? photos[el.photoId] : undefined;
  return (
    <>
      <Section title="Photo">
        {el.photoId ? (
          <div className="ed-toolbar ed-toolbar--wide">
            <button type="button" className="btn btn--sm btn--white" onClick={() => { setTab('photos'); toast('Click a photo in the panel to swap it in'); }}>Replace</button>
            <button type="button" className="btn btn--sm btn--ghost" onClick={() => update<PhotoElement>({ photoId: null })}>Empty frame</button>
          </div>
        ) : (
          <button type="button" className="btn btn--sm btn--yellow btn--block" onClick={() => setTab('photos')}>Choose a photo</button>
        )}
        {meta && <p className="ed-meta">{meta.width} × {meta.height}px · {meta.name}</p>}
      </Section>
      {el.photoId && (
        <Section title="Crop">
          <Slider label="Zoom" value={Math.round(el.zoom * 100)} min={100} max={300} onChange={v => update<PhotoElement>({ zoom: v / 100 }, 'zoom')} format={v => `${v}%`} />
          <Slider label="Move left / right" value={Math.round(el.panX * 100)} min={-100} max={100} onChange={v => update<PhotoElement>({ panX: v / 100 }, 'panx')} />
          <Slider label="Move up / down" value={Math.round(el.panY * 100)} min={-100} max={100} onChange={v => update<PhotoElement>({ panY: v / 100 }, 'pany')} />
        </Section>
      )}
      <Section title="Frame">
        <div className="frame-grid frame-grid--compact">
          {FRAMES.map(f => (
            <button type="button" key={f.key} className={`frame-card ${el.frame === f.key ? 'is-active' : ''}`} title={f.label} onClick={() => update<PhotoElement>({ frame: f.key, frameColor: f.key === 'film' ? '#1A1A1A' : el.frame === 'film' ? '#FFFFFF' : el.frameColor })}>
              <FrameIcon frame={f.key} />
            </button>
          ))}
        </div>
        {['border', 'polaroid', 'stamp', 'film', 'tape'].includes(el.frame) && (
          <Swatches label="Frame colour" value={el.frameColor} colors={['#FFFFFF', '#FFFDEF', '#F4E9D8', '#141414', '#1A1A1A', '#FFD0EE', '#BFE6FF', '#FFEB99']} onChange={frameColor => update<PhotoElement>({ frameColor }, 'frame-color')} />
        )}
        {el.frame === 'polaroid' && (
          <input className="input input--sm" placeholder="Caption under the photo" value={el.caption ?? ''} maxLength={40} onChange={e => update<PhotoElement>({ caption: e.target.value }, 'caption')} />
        )}
      </Section>
      {el.photoId && (
        <Section title="Filter">
          <div className="chip-row">
            {FILTERS.map(f => <button type="button" key={f.key} className="chip chip--sm" aria-pressed={el.filter === f.key} onClick={() => update<PhotoElement>({ filter: f.key })}>{f.label}</button>)}
          </div>
        </Section>
      )}
    </>
  );
}

function TextInspector({ el, colors }: { el: TextElement; colors: string[] }) {
  const update = useUpdate(el);
  const font = EDITOR_FONTS.find(f => f.family === el.fontFamily);
  const bold = el.fontStyle.includes('bold'), italic = el.fontStyle.includes('italic');
  const style = (b: boolean, i: boolean) => (b && i ? 'italic bold' : b ? 'bold' : i ? 'italic' : 'normal') as TextElement['fontStyle'];
  return (
    <>
      <Section title="Text">
        <textarea className="textarea textarea--sm" rows={3} value={el.text} onChange={e => update<TextElement>({ text: e.target.value }, 'text')} aria-label="Text content" />
      </Section>
      <Section title="Font">
        <select className="select select--sm" value={el.fontFamily} onChange={e => update<TextElement>({ fontFamily: e.target.value, fontStyle: 'normal' })} style={{ fontFamily: `"${el.fontFamily}"` }} aria-label="Font">
          {EDITOR_FONTS.map(f => <option key={f.family} value={f.family} style={{ fontFamily: `"${f.family}"` }}>{f.label}</option>)}
        </select>
        <div className="ed-toolbar">
          <IconButton label="Bold" active={bold} disabled={!font?.bold} onClick={() => update<TextElement>({ fontStyle: style(!bold, italic) })}><strong>B</strong></IconButton>
          <IconButton label="Italic" active={italic} disabled={!font?.italic} onClick={() => update<TextElement>({ fontStyle: style(bold, !italic) })}><em style={{ fontFamily: 'serif' }}>I</em></IconButton>
          <Segmented label="Alignment" value={el.align} onChange={align => update<TextElement>({ align })} options={[{ value: 'left', label: 'L', title: 'Align left' }, { value: 'center', label: 'C', title: 'Centre' }, { value: 'right', label: 'R', title: 'Align right' }]} />
        </div>
        <Slider label="Size" value={el.fontSize} min={12} max={260} onChange={fontSize => update<TextElement>({ fontSize }, 'font-size')} />
        <Slider label="Letter spacing" value={el.letterSpacing} min={-5} max={30} onChange={letterSpacing => update<TextElement>({ letterSpacing }, 'spacing')} />
        <Slider label="Line height" value={Math.round(el.lineHeight * 100)} min={70} max={220} step={5} onChange={v => update<TextElement>({ lineHeight: v / 100 }, 'line-height')} format={v => (v / 100).toFixed(2)} />
      </Section>
      <Section title="Colour">
        <Swatches label="Text colour" value={el.fill} colors={colors} onChange={fill => update<TextElement>({ fill }, 'fill')} />
      </Section>
    </>
  );
}

function ShapeInspector({ el, colors }: { el: ShapeElement; colors: string[] }) {
  const update = useUpdate(el);
  const lineLike = el.shape === 'line' || el.shape === 'arrow';
  return (
    <Section title="Shape">
      {!lineLike && (<><p className="ed-label">Fill</p><Swatches label="Fill" allowTransparent value={el.fill} colors={colors} onChange={fill => update<ShapeElement>({ fill }, 'fill')} /></>)}
      <p className="ed-label">{lineLike ? 'Colour' : 'Outline'}</p>
      <Swatches label="Outline" allowTransparent={!lineLike} value={el.stroke} colors={colors} onChange={stroke => update<ShapeElement>({ stroke }, 'stroke')} />
      <Slider label={lineLike ? 'Thickness' : 'Outline width'} value={el.strokeWidth} min={lineLike ? 2 : 0} max={40} onChange={strokeWidth => update<ShapeElement>({ strokeWidth }, 'stroke-w')} />
    </Section>
  );
}

function StickerInspector({ el, colors }: { el: StickerElement; colors: string[] }) {
  const update = useUpdate(el);
  return (
    <Section title="Sticker colours">
      <p className="ed-label">Main colour</p>
      <Swatches label="Main colour" value={el.tint} colors={colors} onChange={tint => update<StickerElement>({ tint }, 'tint')} />
      <p className="ed-label">Line colour</p>
      <Swatches label="Line colour" value={el.ink} colors={colors} onChange={ink => update<StickerElement>({ ink }, 'ink')} />
    </Section>
  );
}

function PageInspector() {
  const project = useProjects(s => s.project)!;
  const page = useCurrentPage();
  const { edit, duplicatePage, removePage } = useProjects.getState();
  if (!page) return null;
  const index = project.pages.findIndex(p => p.id === page.id);
  const photoSlots = page.elements.filter(e => e.type === 'photo');
  const empty = photoSlots.filter(e => e.type === 'photo' && !e.photoId).length;
  const stats = slotStats(project);
  const inner = innerPageCount(project);
  return (
    <>
      <Section title={pageLabel(project.pages, index)}>
        <ul className="ed-stats">
          <li><span>Elements</span><strong>{page.elements.length}</strong></li>
          <li><span>Photo frames</span><strong>{photoSlots.length}</strong></li>
          <li className={empty ? 'is-warn' : ''}><span>Empty frames</span><strong>{empty}</strong></li>
        </ul>
        {page.kind === 'inner' && (
          <div className="ed-toolbar ed-toolbar--wide">
            <button type="button" className="btn btn--sm btn--white" onClick={() => duplicatePage(page.id)}>Duplicate</button>
            <button type="button" className="btn btn--sm btn--white" disabled={inner <= 24} onClick={() => removePage(page.id)}>Delete page</button>
          </div>
        )}
        {page.elements.length > 0 && (
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => { edit(d => { d.pages[index].elements = []; }); toast('Page cleared', 'info', { label: 'Undo', run: () => useProjects.getState().undo() }); }}>
            Clear page
          </button>
        )}
      </Section>
      <Section title="Whole diary">
        <ul className="ed-stats">
          <li><span>Inner pages</span><strong>{inner}</strong></li>
          <li><span>Photos placed</span><strong>{stats.filled}</strong></li>
          <li className={stats.empty ? 'is-warn' : ''}><span>Empty frames</span><strong>{stats.empty}</strong></li>
        </ul>
        {stats.empty > 0 && <p className="ed-hint"><IconWarning width={16} /> Empty frames are left blank when printed.</p>}
      </Section>
      <Section title="Shortcuts">
        <ul className="ed-keys">
          <li><kbd>Del</kbd> delete</li><li><kbd>Ctrl</kbd>+<kbd>D</kbd> duplicate</li><li><kbd>Ctrl</kbd>+<kbd>Z</kbd> undo</li>
          <li><kbd>↑↓←→</kbd> nudge</li><li><kbd>Esc</kbd> deselect</li><li><kbd>PgUp</kbd>/<kbd>PgDn</kbd> pages</li>
        </ul>
      </Section>
    </>
  );
}

export default function Inspector() {
  const el = useSelectedElement();
  const slug = useProjects(s => s.project?.templateSlug ?? 'blank');
  const tpl = getTemplate(slug) ?? getTemplate('blank')!;
  const colors = paletteColors(tpl);
  return (
    <aside className="inspector" data-mode={el ? 'element' : 'page'} aria-label={el ? 'Selected element' : 'Page details'}>
      <header className="inspector__head">
        <h2>{el ? ({ photo: 'Photo', text: 'Text', shape: 'Shape', sticker: 'Sticker' } as const)[el.type] : 'Page'}</h2>
        {el?.locked && <span className="stamp inspector__lock">locked</span>}
      </header>
      <div className="inspector__body">
        {!el && <PageInspector />}
        {el?.type === 'photo' && <PhotoInspector el={el} />}
        {el?.type === 'text' && <TextInspector el={el} colors={colors} />}
        {el?.type === 'shape' && <ShapeInspector el={el} colors={colors} />}
        {el?.type === 'sticker' && <StickerInspector el={el} colors={colors} />}
        {el && <Arrange el={el} />}
      </div>
    </aside>
  );
}
