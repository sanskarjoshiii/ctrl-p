import { useEffect, useLayoutEffect, useRef, useState, type DragEvent as ReactDragEvent } from 'react';
import { Group, Layer, Line, Rect, Stage, Transformer } from 'react-konva';
import type Konva from 'konva';
import { PAGE_H, PAGE_W, type DiaryElement, type TextElement } from '@shared/types';
import { useCurrentPage, useProjects } from '../store/projects';
import { toast } from '../store/toast';
import { makePhoto } from './factory';
import { BackgroundNode, ElementNode } from './render/nodes';
import { useEditorUi } from './uiStore';

const PAD = 56;
const SNAP = 10;
const PHOTO_MIME = 'application/x-bd-photo';

export const setPhotoDragData = (e: ReactDragEvent, photoId: string) => {
  e.dataTransfer.setData(PHOTO_MIME, photoId);
  e.dataTransfer.effectAllowed = 'copy';
};

interface Guide { v: number[]; h: number[] }

export default function EditorCanvas() {
  const page = useCurrentPage();
  const photos = useProjects(s => s.photos);
  const selectedId = useProjects(s => s.selectedId);
  const { select, updateElement, addElement, addPhotos } = useProjects.getState();
  const { zoom, editingTextId, setEditingText } = useEditorUi();

  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const pageRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [guides, setGuides] = useState<Guide>({ v: [], h: [] });
  const [dropHover, setDropHover] = useState(false);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setBox({ w: entry.contentRect.width, h: entry.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fit = box.w && box.h ? Math.max(0.1, Math.min((box.w - PAD * 2) / PAGE_W, (box.h - PAD * 2) / PAGE_H)) : 0.5;
  const scale = fit * zoom;
  const stageW = Math.max(box.w, PAGE_W * scale + PAD * 2);
  const stageH = Math.max(box.h, PAGE_H * scale + PAD * 2);
  const offX = (stageW - PAGE_W * scale) / 2;
  const offY = (stageH - PAGE_H * scale) / 2;

  const selected = page?.elements.find(e => e.id === selectedId) ?? null;

  // Attach the transformer to the selected node.
  useEffect(() => {
    const tr = trRef.current, stage = stageRef.current;
    if (!tr || !stage) return;
    const node = selected && !selected.locked && editingTextId !== selected.id ? stage.findOne(`#${selected.id}`) : null;
    tr.nodes(node ? [node] : []);
    if (selected?.type === 'text') tr.enabledAnchors(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right']);
    else tr.enabledAnchors(['top-left', 'top-center', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right']);
    tr.keepRatio(selected?.type === 'sticker');
    tr.getLayer()?.batchDraw();
  }, [selected, editingTextId, page]);

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const rect = node.getClientRect({ relativeTo: pageRef.current ?? undefined });
    const cx = rect.x + rect.width / 2, cy = rect.y + rect.height / 2;
    const v: number[] = [], h: number[] = [];
    const snapX = [PAGE_W / 2, 60, PAGE_W - 60], snapY = [PAGE_H / 2, 60, PAGE_H - 60];
    for (const t of snapX) {
      if (Math.abs(cx - t) < SNAP && t === PAGE_W / 2) { node.x(node.x() + (t - cx)); v.push(t); }
      else if (Math.abs(rect.x - t) < SNAP) { node.x(node.x() + (t - rect.x)); v.push(t); }
      else if (Math.abs(rect.x + rect.width - t) < SNAP) { node.x(node.x() + (t - rect.x - rect.width)); v.push(t); }
    }
    for (const t of snapY) {
      if (Math.abs(cy - t) < SNAP && t === PAGE_H / 2) { node.y(node.y() + (t - cy)); h.push(t); }
      else if (Math.abs(rect.y - t) < SNAP) { node.y(node.y() + (t - rect.y)); h.push(t); }
      else if (Math.abs(rect.y + rect.height - t) < SNAP) { node.y(node.y() + (t - rect.y - rect.height)); h.push(t); }
    }
    setGuides(g => (g.v.join() === v.join() && g.h.join() === h.join() ? g : { v, h }));
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    setGuides({ v: [], h: [] });
    updateElement(e.target.id(), { x: Math.round(e.target.x()), y: Math.round(e.target.y()) });
  };

  const handleTransform = (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    if (selected?.type !== 'text') return;
    const anchor = trRef.current?.getActiveAnchor() ?? '';
    if (anchor === 'middle-left' || anchor === 'middle-right') {
      (node as Konva.Text).width(Math.max(60, node.width() * node.scaleX()));
      node.scaleX(1);
    }
  };

  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    if (!selected) return;
    const sx = node.scaleX(), sy = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    const base = { x: Math.round(node.x()), y: Math.round(node.y()), rotation: Math.round(node.rotation() * 10) / 10 };
    if (selected.type === 'text') {
      const t = selected as TextElement;
      const width = Math.max(60, Math.round((node as Konva.Text).width() * sx));
      const fontSize = Math.abs(sy - 1) > 0.001 ? Math.max(8, Math.round(t.fontSize * sy)) : t.fontSize;
      updateElement(t.id, { ...base, width, fontSize });
    } else {
      updateElement(selected.id, { ...base, width: Math.max(20, Math.round(selected.width * sx)), height: Math.max(20, Math.round(selected.height * sy)) });
    }
  };

  const onStageDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const target = e.target;
    if (target === target.getStage() || !target.findAncestor('.element', true)) {
      if (!target.getParent()?.className?.includes('Transformer')) select(null);
    }
  };

  /* ——— Drag & drop from the photo panel or desktop ——— */
  const pagePointFromEvent = (e: ReactDragEvent) => {
    const stage = stageRef.current, pageGroup = pageRef.current;
    if (!stage || !pageGroup) return null;
    stage.setPointersPositions(e.nativeEvent);
    const pointer = stage.getPointerPosition();
    const local = pageGroup.getRelativePointerPosition();
    if (!pointer || !local) return null;
    const hit = stage.getIntersection(pointer);
    const elNode = hit?.findAncestor('.element', true);
    return { local, targetId: elNode?.id() ?? null };
  };

  const placePhoto = (photoId: string, point: { local: { x: number; y: number }; targetId: string | null } | null) => {
    if (!page) return;
    const target = point?.targetId ? page.elements.find(el => el.id === point.targetId) : null;
    if (target?.type === 'photo') {
      updateElement(target.id, { photoId, zoom: 1, panX: 0, panY: 0 });
      select(target.id);
      return;
    }
    const meta = photos[photoId];
    const ratio = meta ? meta.width / meta.height : 0.8;
    const w = ratio >= 1 ? 560 : 560 * ratio, h = ratio >= 1 ? 560 / ratio : 560;
    const cx = point?.local.x ?? PAGE_W / 2, cy = point?.local.y ?? PAGE_H / 2;
    addElement(makePhoto({ photoId, width: Math.round(w), height: Math.round(h), x: Math.round(cx - w / 2), y: Math.round(cy - h / 2), frame: 'border' }));
  };

  const onDrop = async (e: ReactDragEvent) => {
    e.preventDefault();
    setDropHover(false);
    const point = pagePointFromEvent(e);
    const photoId = e.dataTransfer.getData(PHOTO_MIME);
    if (photoId) return placePhoto(photoId, point);
    const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name));
    if (!files.length) return;
    toast(`Adding ${files.length} photo${files.length > 1 ? 's' : ''}…`);
    const { added, errors } = await addPhotos(files);
    errors.slice(0, 2).forEach(msg => toast(msg, 'error'));
    if (added[0]) placePhoto(added[0].id, point);
  };

  /* ——— Inline text editing ——— */
  const editingEl = page?.elements.find((el): el is TextElement => el.id === editingTextId && el.type === 'text') ?? null;
  const draftRef = useRef<HTMLTextAreaElement>(null);

  const commitText = () => {
    const draft = draftRef.current?.value ?? '';
    if (editingEl && draftRef.current && draft !== editingEl.text) {
      if (draft.trim()) updateElement(editingEl.id, { text: draft });
      else useProjects.getState().removeElement(editingEl.id);
    }
    setEditingText(null);
  };

  useEffect(() => {
    if (!page) return;
    if (editingTextId && !page.elements.some(el => el.id === editingTextId)) setEditingText(null);
  }, [page, editingTextId, setEditingText]);

  if (!page) return <div className="canvas-wrap" ref={wrapRef} />;

  const onDblClick = (id: string) => {
    const el = page.elements.find(x => x.id === id);
    if (el?.type === 'text' && !el.locked) { select(id); setEditingText(id); }
  };

  const handlers = { onSelect: (id: string) => { if (editingTextId && editingTextId !== id) commitText(); select(id); }, onDragMove: handleDragMove, onDragEnd: handleDragEnd, onDblClick };

  return (
    <div
      ref={wrapRef}
      className={`canvas-wrap dot-paper ${dropHover ? 'is-drop' : ''}`}
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; if (!dropHover) setDropHover(true); }}
      onDragLeave={e => { if (e.currentTarget === e.target) setDropHover(false); }}
      onDrop={onDrop}
    >
      <Stage ref={stageRef} width={stageW} height={stageH} onMouseDown={onStageDown} onTouchStart={onStageDown}>
        <Layer>
          <Group x={offX} y={offY} scaleX={scale} scaleY={scale}>
            <Rect x={14 / scale} y={14 / scale} width={PAGE_W} height={PAGE_H} fill="#A3A396" listening={false} />
            <Group ref={pageRef} clipX={0} clipY={0} clipWidth={PAGE_W} clipHeight={PAGE_H}>
              <BackgroundNode bg={page.background} variant="preview" />
              {page.elements.map((el: DiaryElement) => (
                <ElementNode key={el.id} el={el} variant="preview" interactive hidden={el.id === editingTextId} meta={el.type === 'photo' && el.photoId ? photos[el.photoId] : undefined} handlers={handlers} />
              ))}
            </Group>
            <Rect width={PAGE_W} height={PAGE_H} stroke="#141414" strokeWidth={3 / scale} listening={false} />
            {guides.v.map(x => <Line key={`v${x}`} points={[x, -20, x, PAGE_H + 20]} stroke="#FF3D7F" strokeWidth={1.5 / scale} dash={[8 / scale, 6 / scale]} listening={false} />)}
            {guides.h.map(y => <Line key={`h${y}`} points={[-20, y, PAGE_W + 20, y]} stroke="#FF3D7F" strokeWidth={1.5 / scale} dash={[8 / scale, 6 / scale]} listening={false} />)}
          </Group>
          <Transformer
            ref={trRef}
            rotateEnabled
            rotationSnaps={[0, 90, 180, 270]}
            rotationSnapTolerance={4}
            anchorSize={11}
            anchorStroke="#141414"
            anchorStrokeWidth={2}
            anchorFill="#FFFFFF"
            anchorCornerRadius={1}
            borderStroke="#141414"
            borderStrokeWidth={1.6}
            rotateAnchorOffset={28}
            padding={2}
            flipEnabled={false}
            boundBoxFunc={(oldBox, newBox) => (Math.abs(newBox.width) < 16 || Math.abs(newBox.height) < 16 ? oldBox : newBox)}
            onTransform={handleTransform}
            onTransformEnd={handleTransformEnd}
          />
        </Layer>
      </Stage>

      {editingEl && (() => {
        const abs = { x: offX + editingEl.x * scale, y: offY + editingEl.y * scale };
        return (
          <textarea
            key={editingEl.id}
            ref={draftRef}
            className="text-overlay"
            autoFocus
            defaultValue={editingEl.text}
            onBlur={commitText}
            onKeyDown={e => {
              if (e.key === 'Escape') { setEditingText(null); }
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) commitText();
              e.stopPropagation();
            }}
            style={{
              left: abs.x,
              top: abs.y,
              width: editingEl.width * scale,
              minHeight: editingEl.fontSize * editingEl.lineHeight * scale * 1.2,
              fontFamily: `"${editingEl.fontFamily}"`,
              fontSize: editingEl.fontSize * scale,
              fontWeight: editingEl.fontStyle.includes('bold') ? 700 : 400,
              fontStyle: editingEl.fontStyle.includes('italic') ? 'italic' : 'normal',
              lineHeight: editingEl.lineHeight,
              letterSpacing: editingEl.letterSpacing * scale,
              textAlign: editingEl.align,
              color: editingEl.fill,
              transform: `rotate(${editingEl.rotation}deg)`,
            }}
          />
        );
      })()}
      {page.kind === 'cover' && page.background.image && !page.elements.length && (
        <p className="canvas-hint hand">tip: add your names or the year on top of the cover ✎</p>
      )}
    </div>
  );
}
