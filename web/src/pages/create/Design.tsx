import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  IconArrowRight, IconEye, IconFrame, IconLayout, IconMinus, IconPaint, IconPhotos, IconPlus, IconRedo, IconSticker, IconText, IconUndo,
} from '../../components/Doodles';
import EditorCanvas from '../../editor/EditorCanvas';
import Inspector from '../../editor/Inspector';
import PageStrip from '../../editor/PageStrip';
import Panels from '../../editor/Panels';
import { useEditorUi, ZOOM_MAX, ZOOM_MIN, type EditorTab } from '../../editor/uiStore';
import { useEditorFonts } from '../../lib/fonts';
import { useProjects } from '../../store/projects';
import '../../editor/editor.css';

const TABS: { key: EditorTab; label: string; icon: typeof IconPhotos }[] = [
  { key: 'photos', label: 'Photos', icon: IconPhotos },
  { key: 'layouts', label: 'Layouts', icon: IconLayout },
  { key: 'frames', label: 'Frames', icon: IconFrame },
  { key: 'text', label: 'Text', icon: IconText },
  { key: 'elements', label: 'Stickers', icon: IconSticker },
  { key: 'background', label: 'Paper', icon: IconPaint },
];

const isTyping = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName));

function useShortcuts() {
  const navigate = useNavigate();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      const s = useProjects.getState();
      const ui = useEditorUi.getState();
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && key === 'z') { e.preventDefault(); if (e.shiftKey) s.redo(); else s.undo(); return; }
      if (mod && key === 'y') { e.preventDefault(); s.redo(); return; }
      if (mod && key === 'p') { e.preventDefault(); navigate('../preview', { relative: 'path' }); return; }
      if (e.key === 'PageDown' || e.key === 'PageUp') {
        const pages = s.project?.pages ?? [];
        const i = pages.findIndex(p => p.id === s.pageId);
        const next = pages[i + (e.key === 'PageDown' ? 1 : -1)];
        if (next) { e.preventDefault(); s.selectPage(next.id); }
        return;
      }
      if (!s.selectedId) return;
      const el = s.project?.pages.flatMap(p => p.elements).find(x => x.id === s.selectedId);
      if (!el) return;
      if (e.key === 'Escape') { s.select(null); ui.setEditingText(null); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); s.removeElement(el.id); return; }
      if (mod && key === 'd') { e.preventDefault(); s.duplicateElement(el.id); return; }
      if (e.key === 'Enter' && el.type === 'text') { e.preventDefault(); ui.setEditingText(el.id); return; }
      const step = e.shiftKey ? 10 : 2;
      const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (moves[e.key] && !el.locked) {
        e.preventDefault();
        s.updateElement(el.id, { x: el.x + moves[e.key][0], y: el.y + moves[e.key][1] }, 'nudge');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);
}

function Toolbar() {
  const project = useProjects(s => s.project)!;
  const canUndo = useProjects(s => s.past.length > 0);
  const canRedo = useProjects(s => s.future.length > 0);
  const { undo, redo, edit } = useProjects.getState();
  const { zoom, setZoom } = useEditorUi();
  return (
    <div className="ed-bar">
      <label className="ed-bar__title">
        <span className="visually-hidden">Diary title</span>
        <input value={project.title} maxLength={60} onChange={e => edit(d => { d.title = e.target.value; }, { history: false })} />
      </label>
      <div className="ed-bar__group" role="group" aria-label="History">
        <button type="button" className="icon-btn" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" aria-label="Undo"><IconUndo width={20} /></button>
        <button type="button" className="icon-btn" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" aria-label="Redo"><IconRedo width={20} /></button>
      </div>
      <div className="ed-bar__group" role="group" aria-label="Zoom">
        <button type="button" className="icon-btn" onClick={() => setZoom(zoom - 0.15)} disabled={zoom <= ZOOM_MIN} aria-label="Zoom out"><IconMinus width={18} /></button>
        <button type="button" className="ed-bar__zoom" onClick={() => setZoom(1)} title="Fit to screen">{Math.round(zoom * 100)}%</button>
        <button type="button" className="icon-btn" onClick={() => setZoom(zoom + 0.15)} disabled={zoom >= ZOOM_MAX} aria-label="Zoom in"><IconPlus width={18} /></button>
      </div>
      <div className="ed-bar__spacer" />
      <Link to="../preview" relative="path" className="btn btn--sm btn--white" aria-label="Preview"><IconEye width={18} /> <span className="ed-bar__label">Preview</span></Link>
      <Link to="../order" relative="path" className="btn btn--sm btn--yellow"><span className="ed-bar__label">Order now</span><span className="ed-bar__short">Order</span><IconArrowRight width={18} /></Link>
    </div>
  );
}

export default function Design() {
  const fontsReady = useEditorFonts();
  const { tab, panelOpen, setTab, togglePanel } = useEditorUi();
  useShortcuts();
  // On small screens the tool panel is a bottom sheet, so start with it closed.
  useEffect(() => { if (window.matchMedia('(max-width: 900px)').matches) togglePanel(false); }, [togglePanel]);

  return (
    <div className={`editor ${panelOpen ? 'has-panel' : ''}`}>
      <Toolbar />
      <nav className="rail" role="tablist" aria-label="Editor tools">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" role="tab" aria-selected={panelOpen && tab === key} className={`rail__tab ${panelOpen && tab === key ? 'is-active' : ''}`} onClick={() => setTab(key)}>
            <Icon width={24} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      {panelOpen && <Panels />}
      <main className="editor__stage">
        {fontsReady ? <EditorCanvas /> : <div className="create__state"><span className="loader" aria-label="Loading fonts" /></div>}
      </main>
      <Inspector />
      <PageStrip />
    </div>
  );
}
