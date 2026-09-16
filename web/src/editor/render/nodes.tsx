import { memo } from 'react';
import { Arrow, Circle, Ellipse, Group, Image as KImage, Line, Path, Rect, Shape, Text } from 'react-konva';
import type Konva from 'konva';
import { SIZES } from '@shared/pricing';
import { PAGE_H, PAGE_W, type Background, type DiaryElement, type FrameStyle, type PhotoElement, type ShapeElement, type StickerElement, type TextElement } from '@shared/types';
import { usePhotoImage, useUrlImage } from '../../lib/imageCache';
import type { PhotoMeta, PhotoVariant } from '../../lib/photos';
import { getSticker } from '../stickers';

type Native = CanvasRenderingContext2D;
const native = (ctx: Konva.Context) => (ctx as unknown as { _context: Native })._context;

export type RenderVariant = PhotoVariant;

/* ——— Background ——— */

function seeded(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export const BackgroundNode = memo(function BackgroundNode({ bg, variant }: { bg: Background; variant: RenderVariant }) {
  const src = bg.image ? (variant === 'original' ? bg.image.print : bg.image.preview) : null;
  const fallback = bg.image && variant === 'original' ? bg.image.preview : null;
  const img = useUrlImage(src);
  const fallbackImg = useUrlImage(fallback);
  const art = img ?? fallbackImg;

  return (
    <Group listening={false}>
      <Rect width={PAGE_W} height={PAGE_H} fill={bg.color} />
      {bg.pattern === 'grid' && (
        <Shape
          stroke={bg.patternColor}
          strokeWidth={1.6}
          opacity={0.13}
          sceneFunc={(ctx, shape) => {
            ctx.beginPath();
            for (let x = 60; x < PAGE_W; x += 60) { ctx.moveTo(x, 0); ctx.lineTo(x, PAGE_H); }
            for (let y = 60; y < PAGE_H; y += 60) { ctx.moveTo(0, y); ctx.lineTo(PAGE_W, y); }
            ctx.strokeShape(shape);
          }}
        />
      )}
      {bg.pattern === 'dots' && (
        <Shape
          fill={bg.patternColor}
          opacity={0.2}
          sceneFunc={(ctx, shape) => {
            ctx.beginPath();
            for (let x = 30; x < PAGE_W; x += 40) for (let y = 30; y < PAGE_H; y += 40) { ctx.moveTo(x + 3, y); ctx.arc(x, y, 3, 0, Math.PI * 2); }
            ctx.fillShape(shape);
          }}
        />
      )}
      {bg.pattern === 'lines' && (
        <>
          <Shape
            stroke={bg.patternColor}
            strokeWidth={1.6}
            opacity={0.16}
            sceneFunc={(ctx, shape) => {
              ctx.beginPath();
              for (let y = 150; y < PAGE_H - 30; y += 56) { ctx.moveTo(0, y); ctx.lineTo(PAGE_W, y); }
              ctx.strokeShape(shape);
            }}
          />
          <Line points={[110, 0, 110, PAGE_H]} stroke="#E4605A" strokeWidth={2} opacity={0.45} />
        </>
      )}
      {bg.pattern === 'kraft' && (
        <Shape
          fill="#5A3D1E"
          opacity={0.1}
          sceneFunc={(ctx, shape) => {
            const r = seeded(97);
            ctx.beginPath();
            for (let i = 0; i < 900; i++) { const x = r() * PAGE_W, y = r() * PAGE_H, s = 0.8 + r() * 2.4; ctx.moveTo(x + s, y); ctx.arc(x, y, s, 0, Math.PI * 2); }
            ctx.fillShape(shape);
          }}
        />
      )}
      {art && <KImage image={art} width={PAGE_W} height={PAGE_H} />}
    </Group>
  );
});

/* ——— Photos ——— */

export function coverCrop(iw: number, ih: number, tw: number, th: number, zoom: number, panX: number, panY: number) {
  const scale = Math.max(tw / iw, th / ih) * Math.max(1, zoom);
  const cw = tw / scale, ch = th / scale;
  const maxX = (iw - cw) / 2, maxY = (ih - ch) / 2;
  const cx = iw / 2 + panX * maxX, cy = ih / 2 + panY * maxY;
  return { x: cx - cw / 2, y: cy - ch / 2, width: cw, height: ch };
}

const FILTER_CSS: Record<PhotoElement['filter'], string> = {
  none: '',
  mono: 'grayscale(1) contrast(1.08)',
  sepia: 'sepia(0.7) saturate(1.1) contrast(1.02)',
  warm: 'sepia(0.22) saturate(1.25) brightness(1.03)',
  cool: 'saturate(0.9) hue-rotate(10deg) brightness(1.04)',
  fade: 'contrast(0.84) brightness(1.1) saturate(0.78)',
};

export function frameInner(frame: FrameStyle, w: number, h: number) {
  const s = Math.min(w, h);
  switch (frame) {
    case 'border': { const p = s * 0.04; return { x: p, y: p, w: w - 2 * p, h: h - 2 * p }; }
    case 'polaroid': { const p = s * 0.05; return { x: p, y: p, w: w - 2 * p, h: h - p - Math.max(p * 2.6, h * 0.15) }; }
    case 'stamp': { const p = s * 0.075; return { x: p, y: p, w: w - 2 * p, h: h - 2 * p }; }
    case 'film': return { x: w * 0.03, y: h * 0.14, w: w * 0.94, h: h * 0.72 };
    case 'tape': { const p = s * 0.022; return { x: p, y: p, w: w - 2 * p, h: h - 2 * p }; }
    default: return { x: 0, y: 0, w, h };
  }
}

function clipFor(frame: FrameStyle, w: number, h: number) {
  if (frame === 'circle') return (ctx: Konva.Context) => native(ctx).ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  if (frame === 'rounded') return (ctx: Konva.Context) => native(ctx).roundRect(0, 0, w, h, Math.min(w, h) * 0.09);
  if (frame === 'arch') return (ctx: Konva.Context) => {
    const n = native(ctx), r = Math.min(w / 2, h);
    n.moveTo(0, h); n.lineTo(0, r); n.arc(w / 2, r, w / 2, Math.PI, 0); n.lineTo(w, h); n.closePath();
  };
  if (frame === 'heart') return (ctx: Konva.Context) => {
    const n = native(ctx);
    n.moveTo(w * 0.5, h * 0.95);
    n.bezierCurveTo(w * 0.1, h * 0.7, -w * 0.02, h * 0.42, w * 0.08, h * 0.2);
    n.bezierCurveTo(w * 0.2, -0.02 * h, w * 0.45, h * 0.02, w * 0.5, h * 0.22);
    n.bezierCurveTo(w * 0.55, h * 0.02, w * 0.8, -0.02 * h, w * 0.92, h * 0.2);
    n.bezierCurveTo(w * 1.02, h * 0.42, w * 0.9, h * 0.7, w * 0.5, h * 0.95);
    n.closePath();
  };
  return undefined;
}

const LOW_DPI = 150;

export const PhotoContent = memo(function PhotoContent({ el, variant, editing, meta }: { el: PhotoElement; variant: RenderVariant; editing: boolean; meta?: PhotoMeta }) {
  const img = usePhotoImage(el.photoId, variant);
  const { width: w, height: h, frame } = el;
  const s = Math.min(w, h);
  const inner = frameInner(frame, w, h);
  const clip = clipFor(frame, inner.w, inner.h);

  if (!el.photoId && !editing) return null;

  let lowRes = false;
  if (editing && img && meta) {
    const crop = coverCrop(img.naturalWidth, img.naturalHeight, inner.w, inner.h, el.zoom, el.panX, el.panY);
    const sourcePx = crop.width * (meta.width / img.naturalWidth);
    const inches = (inner.w / PAGE_W) * SIZES.large.inches[0];
    lowRes = sourcePx / inches < LOW_DPI;
  }

  const backing = frame === 'border' || frame === 'polaroid' || frame === 'tape' || frame === 'film';
  const scallops: { x: number; y: number }[] = [];
  if (frame === 'stamp') {
    const r = s * 0.028, step = r * 2.6;
    for (let x = step / 2; x < w; x += step) scallops.push({ x, y: 0 }, { x, y: h });
    for (let y = step / 2; y < h; y += step) scallops.push({ x: 0, y }, { x: w, y });
  }

  return (
    <>
      {frame === 'shadow' && <Rect x={s * 0.035} y={s * 0.035} width={w} height={h} fill="#141414" />}
      {backing && (
        <Rect width={w} height={h} fill={el.frameColor} shadowColor="#000" shadowOpacity={frame === 'film' ? 0 : 0.2} shadowBlur={s * 0.03} shadowOffsetY={s * 0.01} />
      )}
      {frame === 'stamp' && (
        <>
          <Rect width={w} height={h} fill={el.frameColor} shadowColor="#000" shadowOpacity={0.16} shadowBlur={s * 0.03} />
          {scallops.map((p, i) => <Circle key={i} x={p.x} y={p.y} radius={s * 0.028} fill={el.frameColor} listening={false} />)}
          <Rect x={inner.x - s * 0.018} y={inner.y - s * 0.018} width={inner.w + s * 0.036} height={inner.h + s * 0.036} stroke="#141414" strokeWidth={Math.max(1, s * 0.004)} opacity={0.35} listening={false} />
        </>
      )}
      {frame === 'film' && (
        <Shape
          fill="#F4EFE4"
          listening={false}
          sceneFunc={(ctx, shape) => {
            const hw = w * 0.034, hh = h * 0.06, gap = hw * 1.25;
            ctx.beginPath();
            for (let x = gap * 0.6; x < w - hw; x += hw + gap) {
              native(ctx).roundRect(x, h * 0.035, hw, hh, hw * 0.25);
              native(ctx).roundRect(x, h - h * 0.035 - hh, hw, hh, hw * 0.25);
            }
            ctx.fillShape(shape);
          }}
        />
      )}

      <Group x={inner.x} y={inner.y} clipFunc={clip as never}>
        {img ? (
          <Shape
            width={inner.w}
            height={inner.h}
            fill="#000"
            sceneFunc={ctx => {
              const c = coverCrop(img.naturalWidth, img.naturalHeight, inner.w, inner.h, el.zoom, el.panX, el.panY);
              const n = native(ctx);
              const f = FILTER_CSS[el.filter];
              if (f) n.filter = f;
              n.drawImage(img, c.x, c.y, c.width, c.height, 0, 0, inner.w, inner.h);
              if (f) n.filter = 'none';
            }}
            hitFunc={(ctx, shape) => { ctx.beginPath(); ctx.rect(0, 0, inner.w, inner.h); ctx.closePath(); ctx.fillShape(shape); }}
          />
        ) : (
          <>
            <Rect width={inner.w} height={inner.h} fill="#E9E4D3" />
            <Rect x={6} y={6} width={inner.w - 12} height={inner.h - 12} stroke="#141414" strokeWidth={3} dash={[14, 10]} opacity={0.3} listening={false} />
            <Group x={inner.w / 2} y={inner.h / 2} listening={false} opacity={0.55}>
              <Circle radius={Math.min(46, s * 0.12)} stroke="#141414" strokeWidth={4} />
              <Line points={[-Math.min(20, s * 0.05), 0, Math.min(20, s * 0.05), 0]} stroke="#141414" strokeWidth={5} lineCap="round" />
              <Line points={[0, -Math.min(20, s * 0.05), 0, Math.min(20, s * 0.05)]} stroke="#141414" strokeWidth={5} lineCap="round" />
              {inner.w > 220 && (
                <Text y={Math.min(46, s * 0.12) + 18} x={-160} width={320} align="center" text="drop a photo" fontFamily="Space Grotesk" fontStyle="bold" fontSize={Math.max(22, Math.min(30, s * 0.06))} fill="#141414" />
              )}
            </Group>
          </>
        )}
      </Group>

      {frame === 'shadow' && <Rect width={w} height={h} stroke="#141414" strokeWidth={Math.max(3, s * 0.008)} listening={false} />}
      {frame === 'polaroid' && el.caption && (
        <Text x={inner.x} y={inner.y + inner.h + (h - inner.y - inner.h - s * 0.075) / 2} width={inner.w} align="center" text={el.caption} fontFamily="Caveat Brush" fontSize={s * 0.075} fill="#2A2A2A" listening={false} />
      )}
      {frame === 'tape' && (
        <>
          <Rect x={-w * 0.04} y={-s * 0.02} width={w * 0.26} height={s * 0.075} fill="#FFE08A" opacity={0.85} rotation={-14} listening={false} />
          <Rect x={w * 0.8} y={-s * 0.07} width={w * 0.26} height={s * 0.075} fill="#F4AFD3" opacity={0.85} rotation={14} listening={false} />
        </>
      )}
      {lowRes && (
        <Group x={w - 44} y={16} listening={false}>
          <Circle radius={22} fill="#FFD93D" stroke="#141414" strokeWidth={3} />
          <Text x={-22} y={-15} width={44} align="center" text="!" fontFamily="Space Grotesk" fontStyle="bold" fontSize={30} fill="#141414" />
        </Group>
      )}
    </>
  );
});

/* ——— Text ——— */

export const textAttrs = (el: TextElement) => ({
  text: el.text,
  width: el.width,
  fontFamily: el.fontFamily,
  fontSize: el.fontSize,
  fontStyle: el.fontStyle,
  fill: el.fill,
  align: el.align,
  letterSpacing: el.letterSpacing,
  lineHeight: el.lineHeight,
  wrap: 'word' as const,
});

/* ——— Shapes ——— */

const HEART = 'M50 90S8 64 8 34a21 21 0 0 1 42-10 21 21 0 0 1 42 10c0 30-42 56-42 56Z';
const BLOB = 'M52 6c20 0 40 12 42 34s-10 30-6 44-18 14-34 12S16 94 10 76 2 44 10 28 32 6 52 6Z';
const BURST = (() => {
  let d = '';
  for (let i = 0; i < 24; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 12, r = i % 2 ? 26 : 50; d += `${i ? 'L' : 'M'}${(50 + r * Math.cos(a)).toFixed(1)} ${(50 + r * Math.sin(a)).toFixed(1)}`; }
  return d + 'Z';
})();

export const ShapeContent = memo(function ShapeContent({ el }: { el: ShapeElement }) {
  const { width: w, height: h, fill, stroke, strokeWidth } = el;
  const paint = { fill: fill === 'transparent' ? undefined : fill, stroke: stroke === 'transparent' ? undefined : stroke, strokeWidth };
  const hitBox = <Rect width={w} height={h} fill="rgba(0,0,0,0)" />;
  switch (el.shape) {
    case 'rect': return <Rect width={w} height={h} {...paint} />;
    case 'rounded': return <Rect width={w} height={h} cornerRadius={Math.min(w, h) * 0.18} {...paint} />;
    case 'circle': return <Ellipse x={w / 2} y={h / 2} radiusX={w / 2} radiusY={h / 2} {...paint} />;
    case 'triangle': return <Line points={[w / 2, 0, w, h, 0, h]} closed lineJoin="round" {...paint} />;
    case 'line': return <>{hitBox}<Line points={[0, h / 2, w, h / 2]} stroke={stroke} strokeWidth={strokeWidth} lineCap="round" /></>;
    case 'arrow': return <>{hitBox}<Arrow points={[0, h / 2, w, h / 2]} stroke={stroke} fill={stroke} strokeWidth={strokeWidth} pointerLength={strokeWidth * 3.2} pointerWidth={strokeWidth * 3.2} lineCap="round" lineJoin="round" /></>;
    case 'star':
    case 'heart':
    case 'blob':
    case 'burst': {
      const data = el.shape === 'heart' ? HEART : el.shape === 'blob' ? BLOB : el.shape === 'burst' ? BURST : 'm50 4 13.6 30.3 32.9 3.2-24.8 22 7.2 32.3L50 75.2 21.1 91.8l7.2-32.3-24.8-22 32.9-3.2Z';
      return <>{hitBox}<Path data={data} scaleX={w / 100} scaleY={h / 100} strokeScaleEnabled={false} lineJoin="round" {...paint} /></>;
    }
  }
});

/* ——— Stickers ——— */

export const StickerContent = memo(function StickerContent({ el }: { el: StickerElement }) {
  const def = getSticker(el.sticker);
  if (!def) return null;
  const color = (token?: string) => (token === 'ink' ? el.ink : token === 'tint' ? el.tint : token);
  return (
    <Group scaleX={el.width / 100} scaleY={el.height / 100}>
      <Rect width={100} height={100} fill="rgba(0,0,0,0)" />
      {def.parts.map((p, i) => (
        <Path
          key={i}
          data={p.d}
          fill={p.fill && p.fill !== 'none' ? color(p.fill) : undefined}
          stroke={p.stroke && p.stroke !== 'none' ? color(p.stroke) : undefined}
          strokeWidth={p.width ?? 0}
          dash={p.dash}
          opacity={p.opacity ?? 1}
          lineCap="round"
          lineJoin="round"
          listening={false}
        />
      ))}
    </Group>
  );
});

/* ——— Generic element ——— */

export interface ElementHandlers {
  onSelect?: (id: string) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDblClick?: (id: string) => void;
}

export function ElementNode({ el, variant, interactive = false, placeholders = false, hidden = false, meta, handlers = {} }: {
  el: DiaryElement;
  variant: RenderVariant;
  interactive?: boolean;
  /** Show empty photo slots (thumbnails) without making nodes interactive. */
  placeholders?: boolean;
  hidden?: boolean;
  meta?: PhotoMeta;
  handlers?: ElementHandlers;
}) {
  const common = {
    id: el.id,
    name: 'element',
    x: el.x,
    y: el.y,
    rotation: el.rotation,
    opacity: hidden ? 0 : el.opacity,
    listening: interactive,
    draggable: interactive && !el.locked,
    onMouseDown: () => handlers.onSelect?.(el.id),
    onTap: () => handlers.onSelect?.(el.id),
    onDragStart: () => handlers.onSelect?.(el.id),
    onDragMove: handlers.onDragMove,
    onDragEnd: handlers.onDragEnd,
    onDblClick: () => handlers.onDblClick?.(el.id),
    onDblTap: () => handlers.onDblClick?.(el.id),
  };

  if (el.type === 'text') return <Text {...common} {...textAttrs(el)} />;
  return (
    <Group {...common}>
      {el.type === 'photo' && <PhotoContent el={el} variant={variant} editing={interactive || placeholders} meta={interactive ? meta : undefined} />}
      {el.type === 'shape' && <ShapeContent el={el} />}
      {el.type === 'sticker' && <StickerContent el={el} />}
    </Group>
  );
}
