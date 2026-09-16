import type { ReactNode, SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const stroke = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

function burstPath(spikes: number, rOut: number, rIn: number, cx = 60, cy = 60) {
  const wobble = [1, 0.82, 0.96, 0.78, 1, 0.9, 0.8, 0.98, 0.86, 0.94, 0.8, 1];
  let d = '';
  for (let i = 0; i < spikes * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / spikes;
    const r = i % 2 ? rIn * (0.9 + 0.2 * wobble[(i + 3) % wobble.length]) : rOut * wobble[(i / 2) % wobble.length];
    d += `${i ? 'L' : 'M'}${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
  }
  return d + 'Z';
}
const BURST = burstPath(9, 56, 17);

/** Pink starburst with an ink outline and hard grey shadow. */
export const Starburst = ({ color = 'var(--pink)', ...p }: P & { color?: string }) => (
  <svg viewBox="-4 -4 132 132" aria-hidden {...p}>
    <path d={BURST} fill="var(--shadow)" transform="translate(6 6)" />
    <path d={BURST} fill={color} stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>
);

/** Spiky sun with a little face — lives on sticky notes. */
export const SunFace = (p: P) => {
  let ring = '';
  for (let i = 0; i < 28; i++) {
    const a = (i * Math.PI) / 14, r = i % 2 ? 26 : 44;
    ring += `${i ? 'L' : 'M'}${(50 + r * Math.cos(a)).toFixed(1)} ${(50 + r * Math.sin(a)).toFixed(1)}`;
  }
  return (
    <svg viewBox="0 0 100 100" aria-hidden {...p}>
      <path d={ring + 'Z'} {...stroke} strokeWidth="2.6" />
      <circle cx="50" cy="50" r="17" {...stroke} strokeWidth="2.6" />
      <path d="M44 46v3M56 46v3M43 56c4 5 10 5 14 0" {...stroke} strokeWidth="2.4" />
    </svg>
  );
};

export const Smiley = (p: P) => (
  <svg viewBox="0 0 54 44" aria-hidden {...p}>
    <path d="M17 6v11M36 4v11M4 22c9 21 38 22 46-6" {...stroke} strokeWidth="5" />
  </svg>
);

export const Sparkle = (p: P) => (
  <svg viewBox="0 0 48 48" aria-hidden {...p}>
    <path d="M24 1c2 14 9 21 23 23-14 2-21 9-23 23C22 33 15 26 1 24 15 22 22 15 24 1Z" fill="currentColor" />
  </svg>
);

export const CurlyArrow = (p: P) => (
  <svg viewBox="0 0 120 64" aria-hidden {...p}>
    <path d="M6 40C22 10 56 2 66 24c7 16-18 22-19 9-1-15 30-20 56 12" {...stroke} strokeWidth="3" />
    <path d="M103 45l-15-1M103 45l-4-15" {...stroke} strokeWidth="3" />
  </svg>
);

export const LoopArrowDown = (p: P) => (
  <svg viewBox="0 0 64 100" aria-hidden {...p}>
    <path d="M40 4c-6 22-13 38 2 46 15 7 20-12 8-16-14-4-26 18-30 58" {...stroke} strokeWidth="3" />
    <path d="M20 92l-7-12M20 92l10-9" {...stroke} strokeWidth="3" />
  </svg>
);

export const MotionLines = (p: P) => (
  <svg viewBox="0 0 48 44" aria-hidden {...p}>
    <path d="M28 6h16M22 18l12 9M12 26l5 14" {...stroke} strokeWidth="4.5" />
  </svg>
);

export const Squiggle = (p: P) => (
  <svg viewBox="0 0 200 18" preserveAspectRatio="none" aria-hidden {...p}>
    <path d="M3 11C40 3 66 15 100 9s62-6 97 1" {...stroke} strokeWidth="5" />
  </svg>
);

export const Cursor = ({ color = 'var(--pink)', ...p }: P & { color?: string }) => (
  <svg viewBox="0 0 48 52" aria-hidden {...p}>
    <path d="M5 4l34 18-15 5-7 16Z" fill={color} stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" />
  </svg>
);

export const Bulb = (p: P) => (
  <svg viewBox="0 0 64 64" aria-hidden {...p}>
    <circle cx="32" cy="32" r="29" fill="var(--yellow)" stroke="var(--ink)" strokeWidth="3" />
    <path d="M26 42c0-6-6-8-6-16a12 12 0 0 1 24 0c0 8-6 10-6 16ZM27 47h10M29 51h6M30 30l2 4 2-4" {...stroke} stroke="var(--ink)" strokeWidth="2.2" />
    <path d="M32 10v-3M47 16l2-2M17 16l-2-2" {...stroke} stroke="var(--ink)" strokeWidth="2.2" />
  </svg>
);

export const PaperPlane = (p: P) => (
  <svg viewBox="0 0 140 70" aria-hidden {...p}>
    <path d="M4 60c20-6 34-20 58-18" {...stroke} strokeWidth="2.5" strokeDasharray="2 8" />
    <path d="M70 38l62-30-22 56-14-18Z" fill="var(--white)" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" />
    <path d="M96 46l36-38M96 46l-4 16 12-8" {...stroke} stroke="var(--ink)" strokeWidth="3" />
  </svg>
);

/* ——— Small line icons (32 × 32) for badges and UI ——— */
const icon = (children: ReactNode, w = 2.6) => (p: P) => (
  <svg viewBox="0 0 32 32" aria-hidden {...p} style={{ strokeWidth: w, ...p.style }}>
    <g {...stroke}>{children}</g>
  </svg>
);

export const IconBook = icon(<><path d="M5 6h9a3 3 0 0 1 3 3v17a3 3 0 0 0-3-3H5Z" /><path d="M27 6h-7a3 3 0 0 0-3 3v17a3 3 0 0 1 3-3h7Z" /></>);
export const IconPhotos = icon(<><rect x="4" y="8" width="19" height="17" rx="2" /><path d="M9 5h17a2 2 0 0 1 2 2v14" /><path d="M4 21l6-6 5 5 3-3 5 5" /><circle cx="17" cy="13" r="1.6" /></>);
export const IconWand = icon(<><path d="M6 26 22 10" /><path d="M20 6v3M26 12h-3M24 7l-2 2M9 5v4M7 7h4M26 20v4M24 22h4" /></>);
export const IconTruck = icon(<><path d="M3 9h15v12H3ZM18 13h6l4 4v4H18" /><circle cx="9" cy="23" r="2.6" /><circle cx="23" cy="23" r="2.6" /></>);
export const IconCart = icon(<><path d="M3 5h4l3 15h14l3-11H9" /><circle cx="12" cy="26" r="1.8" /><circle cx="22" cy="26" r="1.8" /></>);
export const IconArrowUpRight = icon(<path d="M9 23 23 9M11 9h12v12" />, 3.2);
export const IconArrowRight = icon(<path d="M5 16h21M18 8l8 8-8 8" />, 3);
export const IconArrowLeft = icon(<path d="M27 16H6M14 8l-8 8 8 8" />, 3);
export const IconPlus = icon(<path d="M16 6v20M6 16h20" />, 3);
export const IconMinus = icon(<path d="M6 16h20" />, 3);
export const IconClose = icon(<path d="M8 8l16 16M24 8 8 24" />, 3);
export const IconCheck = icon(<path d="M6 17l6 6L26 9" />, 3.4);
export const IconTrash = icon(<><path d="M5 9h22M12 9V5h8v4M8 9l1.5 18h13L24 9M13.5 14v8M18.5 14v8" /></>);
export const IconCopy = icon(<><rect x="10" y="10" width="16" height="16" rx="2" /><path d="M6 21V8a2 2 0 0 1 2-2h13" /></>);
export const IconUndo = icon(<><path d="M10 7 5 12l5 5" /><path d="M5 12h13a8 8 0 0 1 0 16h-6" /></>);
export const IconRedo = icon(<><path d="m22 7 5 5-5 5" /><path d="M27 12H14a8 8 0 0 0 0 16h6" /></>);
export const IconEye = icon(<><path d="M3 16s5-9 13-9 13 9 13 9-5 9-13 9S3 16 3 16Z" /><circle cx="16" cy="16" r="4" /></>);
export const IconUpload = icon(<><path d="M16 21V5M9 11l7-7 7 7" /><path d="M5 20v5a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2v-5" /></>);
export const IconLayout = icon(<><rect x="4" y="4" width="24" height="24" rx="2" /><path d="M4 17h24M15 4v13M19 17v11" /></>);
export const IconFrame = icon(<><rect x="4" y="4" width="24" height="24" rx="2" /><rect x="9" y="9" width="14" height="11" /><path d="M9 24h9" /></>);
export const IconText = icon(<><path d="M6 8V5h20v3M16 5v22M11 27h10" /></>);
export const IconShapes = icon(<><circle cx="10" cy="10" r="6" /><path d="M20 4l7 12H13ZM6 20h10v8H6ZM24 19l1.5 3.4 3.5.4-2.7 2.3.8 3.5L24 27l-3.1 1.6.8-3.5-2.7-2.3 3.5-.4Z" /></>);
export const IconSticker = icon(<><path d="M5 5h22v13l-9 9H5Z" /><path d="M18 27v-7a2 2 0 0 1 2-2h7" /><path d="M11 12v1M19 12v1M11 18c2 2 5 2 7 0" /></>);
export const IconPaint = icon(<><path d="M5 16a11 11 0 1 1 11 11c-2 0-3-1-3-3s2-2 2-4-2-2-4-2-6 1-6-2Z" /><circle cx="11" cy="11" r="1.4" /><circle cx="18" cy="9" r="1.4" /><circle cx="23" cy="14" r="1.4" /></>);
export const IconPages = icon(<><rect x="4" y="7" width="11" height="18" rx="1" /><rect x="17" y="7" width="11" height="18" rx="1" /></>);
export const IconSparkles = icon(<><path d="M13 4c1 6 4 9 10 10-6 1-9 4-10 10-1-6-4-9-10-10 6-1 9-4 10-10Z" /><path d="M25 20c.5 2.5 1.5 3.5 4 4-2.5.5-3.5 1.5-4 4-.5-2.5-1.5-3.5-4-4 2.5-.5 3.5-1.5 4-4Z" /></>, 2.2);
export const IconUp = icon(<path d="M16 26V6M8 14l8-8 8 8" />, 3);
export const IconDown = icon(<path d="M16 6v20M8 18l8 8 8-8" />, 3);
export const IconLock = icon(<><rect x="7" y="14" width="18" height="13" rx="2" /><path d="M11 14V9a5 5 0 0 1 10 0v5" /></>);
export const IconUnlock = icon(<><rect x="7" y="14" width="18" height="13" rx="2" /><path d="M11 14V9a5 5 0 0 1 9.5-2" /></>);
export const IconZoom = icon(<><circle cx="14" cy="14" r="9" /><path d="M21 21l7 7M10 14h8M14 10v8" /></>);
export const IconGift = icon(<><rect x="4" y="11" width="24" height="6" /><path d="M6 17v10h20V17M16 11v16M16 11s-2-7-7-6c-4 1-2 6 7 6ZM16 11s2-7 7-6c4 1 2 6-7 6Z" /></>);
export const IconMenu = icon(<path d="M5 9h22M5 16h22M5 23h22" />, 3);
export const IconWarning = icon(<><path d="M16 4 29 27H3Z" /><path d="M16 12v7M16 23v.5" /></>);
export const IconStar = icon(<path d="m16 4 3.6 7.6 8.4 1-6.2 5.8 1.6 8.3L16 22.6 8.6 26.7l1.6-8.3L4 12.6l8.4-1Z" />);
export const IconHeart = icon(<path d="M16 27S4 20 4 11.5A6.5 6.5 0 0 1 16 8a6.5 6.5 0 0 1 12 3.5C28 20 16 27 16 27Z" />);
export const IconHash = icon(<path d="M12 5 9 27M23 5l-3 22M5 12h22M4 20h22" />, 3);
export const IconAsterisk = icon(<path d="M16 4v24M6 10l20 12M26 10 6 22" />, 3);
