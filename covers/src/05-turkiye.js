COVERS.push({ id: '05', slug: 'turkiye', name: 'Türkiye', bg: '#FBE4C9', svg() {
  const teal = '#15525F', tealL = '#2F8C8C', red = '#D9443A', cream = '#FFF6E8', mustard = '#EDB23C', cobalt = '#2451A8', plum = '#7A3A63',
    sky1 = '#FBE4C9', sky2 = '#F9D2B2', sky3 = '#F6BF9E', sky4 = '#F2AC8E', sunC = '#FCDDA0', rockFar = '#EDC9A2', rock = '#DFA978',
    rockD = '#C98C5C', cap = '#8F5E42', hole = '#5E3A2B', ground = '#B77A4F', basket = '#7A4A2C';
  const R = rng(3);
  let s = `<rect width="900" height="1200" fill="${sky1}"/>`;
  s += `<rect y="560" width="900" height="640" fill="${sky2}"/><rect y="720" width="900" height="480" fill="${sky3}"/><rect y="850" width="900" height="350" fill="${sky4}"/>`;
  s += `<circle cx="450" cy="930" r="190" fill="${sunC}"/>`;

  // Hot-air balloons with striped gores
  let bid = 0;
  const balloon = (cx, cy, r, a, b, skirt) => {
    const id = `tr-b${bid++}`, neckY = cy + 1.16 * r, nw = 0.3 * r;
    const env = `M${r1(cx - nw)} ${r1(neckY)}C${r1(cx - 0.86 * r)} ${r1(cy + 0.78 * r)} ${r1(cx - r)} ${r1(cy + 0.3 * r)} ${r1(cx - r)} ${r1(cy)}A${r} ${r} 0 0 1 ${r1(cx + r)} ${r1(cy)}C${r1(cx + r)} ${r1(cy + 0.3 * r)} ${r1(cx + 0.86 * r)} ${r1(cy + 0.78 * r)} ${r1(cx + nw)} ${r1(neckY)}Z`;
    let o = `<defs><clipPath id="${id}"><path d="${env}"/></clipPath></defs><path d="${env}" fill="${a}"/><g clip-path="url(#${id})">`;
    const g = 8;
    for (let i = 0; i < g; i += 2) {
      const f0 = -1 + 2 * i / g, f1 = -1 + 2 * (i + 1) / g;
      o += `<path d="M${cx} ${r1(cy - r - 2)}Q${r1(cx + f0 * 1.5 * r)} ${r1(cy + 0.1 * r)} ${r1(cx + f0 * nw)} ${r1(neckY + 2)}L${r1(cx + f1 * nw)} ${r1(neckY + 2)}Q${r1(cx + f1 * 1.5 * r)} ${r1(cy + 0.1 * r)} ${cx} ${r1(cy - r - 2)}Z" fill="${b}"/>`;
    }
    o += `<rect x="${r1(cx - r)}" y="${r1(cy + 0.62 * r)}" width="${2 * r}" height="${r1(0.16 * r)}" fill="${skirt}"/>`;
    o += `<path d="M${r1(cx - 0.72 * r)} ${r1(cy - 0.1 * r)}A${r1(0.8 * r)} ${r1(0.8 * r)} 0 0 1 ${r1(cx - 0.1 * r)} ${r1(cy - 0.82 * r)}" fill="none" stroke="#fff" stroke-width="${r1(0.09 * r)}" stroke-linecap="round" opacity="0.35"/></g>`;
    const by = neckY + 0.32 * r, bw = 0.34 * r, bh = 0.24 * r;
    o += `<path d="M${r1(cx - nw)} ${r1(neckY)}L${r1(cx - bw / 2)} ${r1(by)}M${r1(cx + nw)} ${r1(neckY)}L${r1(cx + bw / 2)} ${r1(by)}" stroke="${basket}" stroke-width="${r1(Math.max(1.5, 0.02 * r))}"/>`;
    o += `<rect x="${r1(cx - bw / 2)}" y="${r1(by)}" width="${r1(bw)}" height="${r1(bh)}" rx="${r1(0.04 * r)}" fill="${basket}"/>`;
    return o;
  };
  s += balloon(96, 104, 26, plum, cream, mustard) + balloon(792, 150, 36, teal, mustard, red);
  s += balloon(186, 468, 64, tealL, cream, teal) + balloon(724, 520, 82, cobalt, cream, red);
  s += balloon(112, 760, 44, mustard, red, teal) + balloon(812, 800, 40, red, cream, plum);
  s += balloon(448, 626, 138, red, cream, teal);

  // Fairy chimneys
  const cone = (x, base, w, h, col, withCap, holes) => {
    const t = base - h;
    let o = `<path d="M${r1(x - w / 2)} ${base}C${r1(x - w * 0.46)} ${r1(base - h * 0.55)} ${r1(x - w * 0.2)} ${r1(t + h * 0.18)} ${r1(x - w * 0.09)} ${r1(t + 6)}L${r1(x + w * 0.09)} ${r1(t + 6)}C${r1(x + w * 0.2)} ${r1(t + h * 0.18)} ${r1(x + w * 0.46)} ${r1(base - h * 0.55)} ${r1(x + w / 2)} ${base}Z" fill="${col}"/>`;
    o += `<path d="M${r1(x + w * 0.05)} ${r1(t + 10)}C${r1(x + w * 0.16)} ${r1(t + h * 0.3)} ${r1(x + w * 0.3)} ${r1(base - h * 0.4)} ${r1(x + w * 0.44)} ${base}L${r1(x + w / 2)} ${base}C${r1(x + w * 0.46)} ${r1(base - h * 0.55)} ${r1(x + w * 0.2)} ${r1(t + h * 0.18)} ${r1(x + w * 0.09)} ${r1(t + 6)}Z" fill="#000" opacity="0.08"/>`;
    if (withCap) o += `<path d="M${r1(x - w * 0.17)} ${r1(t + 10)}C${r1(x - w * 0.17)} ${r1(t - 16)} ${r1(x + w * 0.17)} ${r1(t - 16)} ${r1(x + w * 0.17)} ${r1(t + 10)}Z" fill="${cap}"/>`;
    for (let i = 0; i < holes; i++) {
      const hy = base - h * (0.2 + 0.22 * i), hx = x - w * 0.12 + (i % 2) * w * 0.18;
      o += `<path d="M${r1(hx - 7)} ${r1(hy)}V${r1(hy - 10)}a7 7 0 0 1 14 0V${r1(hy)}Z" fill="${hole}"/>`;
    }
    return o;
  };
  s += `<path d="M0 960 C120 930 260 950 450 940 C640 930 780 950 900 930 V1200 H0Z" fill="${rockFar}"/>`;
  for (const [x, w, h] of [[60, 80, 150], [150, 70, 120], [300, 60, 110], [620, 64, 130], [760, 76, 150], [860, 60, 110]]) s += cone(x, 980, w, h, rockFar, false, 0);
  s += `<path d="M0 1030 C150 1000 300 1020 450 1010 C600 1000 760 1020 900 1000 V1200 H0Z" fill="${rock}"/>`;
  for (const [x, w, h, k] of [[40, 110, 250, 3], [170, 90, 190, 2], [290, 70, 140, 1], [590, 80, 160, 2], [720, 110, 260, 3], [850, 90, 200, 2]]) s += cone(x, 1060, w, h, rock, true, k);
  s += `<path d="M0 1080 C200 1060 420 1090 620 1070 C740 1060 820 1072 900 1064 V1200 H0Z" fill="${ground}"/>`;

  // Nazar bead
  const nz = (x, y, k) => `<circle cx="${x}" cy="${y}" r="${30 * k}" fill="${cobalt}"/><circle cx="${x}" cy="${y}" r="${20 * k}" fill="${cream}"/><circle cx="${x}" cy="${y}" r="${13 * k}" fill="#6FA8E0"/><circle cx="${x}" cy="${y}" r="${6.5 * k}" fill="#101A33"/><circle cx="${x - 12 * k}" cy="${y - 14 * k}" r="${4 * k}" fill="#fff" opacity="0.6"/>`;

  s += txt(456, 344, 'Türkiye', { font: 'Kavoon', size: 176, fill: red });
  s += txt(450, 338, 'Türkiye', { font: 'Kavoon', size: 176, fill: teal });
  s += txt(640, 424, 'merhaba!', { font: 'Caveat Brush', size: 66, fill: red, rot: -7 });
  s += `<path d="M724 660 V708" stroke="${basket}" stroke-width="2.5"/>` + nz(724, 734, 0.9);
  s += stamp(150, 1000, -10, teal, 'İSTANBUL', 'TR');
  s += footer('05', '41.0082° N · 28.9784° E', cream);
  return s;
} });
