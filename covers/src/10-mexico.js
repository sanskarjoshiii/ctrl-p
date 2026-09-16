COVERS.push({ id: '10', slug: 'mexico', name: 'México', bg: '#E4217A', svg() {
  const rosa = '#E4217A', rosaD = '#B5155E', yellow = '#FFCB3D', orange = '#FF7E2B', marigold = '#FFA11C', teal = '#16A39B', purple = '#6A3D9E',
    green = '#2F8A55', greenL = '#55B56D', greenD = '#1F6B40', stone = '#F2C48D', stoneD = '#DA9C60', stoneDD = '#B97B44', sky = '#FFD76E', skyR = '#FFC94A',
    sunC = '#FF9A3C', cream = '#FFF4E2', terra = '#C4513A', terraD = '#A8412E', fruit = '#F2508C';
  const R = rng(4);
  let s = `<rect width="900" height="1200" fill="${rosa}"/>`;
  const circ = (cx, cy, r) => `M${r1(cx - r)} ${r1(cy)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;

  // Papel picado (holes punched with even-odd)
  s += `<path d="M-10 26 Q450 58 910 26" fill="none" stroke="${cream}" stroke-width="3"/>`;
  const pcols = [orange, teal, yellow, purple, greenL, cream, orange, teal];
  for (let i = 0; i < 8; i++) {
    const x = 8 + i * 111, w = 102, t = (x + w / 2) / 900, y = (1 - t) * (1 - t) * 26 + 2 * (1 - t) * t * 58 + t * t * 26, h = 150;
    let d = `M${r1(x)} ${r1(y)}H${r1(x + w)}V${r1(y + h)}`;
    for (let k = 6; k > 0; k--) d += `L${r1(x + (k - 0.5) * w / 6)} ${r1(y + h - 14)}L${r1(x + (k - 1) * w / 6)} ${r1(y + h)}`;
    d += 'Z';
    const cx = x + w / 2, cy = y + 76;
    d += circ(cx, cy, 10);
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; d += circ(cx + Math.cos(a) * 24, cy + Math.sin(a) * 24, 9); }
    for (const [dx, dy] of [[-34, -50], [34, -50], [-34, 44], [34, 44]]) d += `M${r1(cx + dx)} ${r1(cy + dy - 9)}l7 9l-7 9l-7 -9Z`;
    for (let k = 0; k < 5; k++) d += circ(x + 15 + k * 18, y + 14, 3.5);
    s += `<path d="${d}" fill="${pcols[i]}" fill-rule="evenodd"/>`;
  }

  s += txt(458, 398, 'México', { font: 'Knewave', size: 200, fill: purple });
  s += txt(450, 390, 'México', { font: 'Knewave', size: 200, fill: yellow });

  // Sun medallion
  const M = [450, 800], MR = 300;
  s += `<defs><clipPath id="mx-med"><path d="M${M[0] - MR} 990 V${M[1]} A${MR} ${MR} 0 0 1 ${M[0] + MR} ${M[1]} V990Z"/></clipPath></defs><g clip-path="url(#mx-med)">`;
  s += `<rect x="140" y="490" width="620" height="520" fill="${sky}"/>`;
  let rays = '';
  for (let i = 0; i < 24; i += 2) { const a0 = Math.PI + i * Math.PI / 24, a1 = a0 + Math.PI / 24; rays += `M450 640L${r1(450 + 600 * Math.cos(a0))} ${r1(640 + 600 * Math.sin(a0))}L${r1(450 + 600 * Math.cos(a1))} ${r1(640 + 600 * Math.sin(a1))}Z`; }
  s += `<path d="${rays}" fill="${skyR}"/><circle cx="450" cy="652" r="124" fill="${sunC}"/>`;
  s += `</g>`;

  // El Castillo, Chichén Itzá
  const base = 990, steps = 9, sh = 36, w0 = 600, w1 = 250;
  for (let i = 0; i < steps; i++) {
    const yb = base - i * sh, yt = yb - sh, wb = w0 - (w0 - w1) * i / steps, wt = w0 - (w0 - w1) * (i + 1) / steps + 14;
    s += `<path d="M${r1(450 - wb / 2)} ${yb}L${r1(450 - wt / 2)} ${yt}H${r1(450 + wt / 2)}L${r1(450 + wb / 2)} ${yb}Z" fill="${stone}"/>`;
    s += `<rect x="${r1(450 - wt / 2)}" y="${yt}" width="${r1(wt)}" height="7" fill="${cream}" opacity="0.55"/>`;
    s += `<path d="M${r1(450 + wt / 2 - 4)} ${yt}L${r1(450 + wb / 2)} ${yb}H${r1(450 + wb / 2 - 60)}L${r1(450 + wt / 2 - 60)} ${yt}Z" fill="${stoneD}" opacity="0.6"/>`;
    for (let k = -2; k <= 2; k++) if (k) s += `<rect x="${r1(450 + k * wt / 5.4 - 9)}" y="${yt + 14}" width="18" height="18" fill="${stoneD}" opacity="0.55"/>`;
  }
  const topY = base - steps * sh;
  s += `<path d="M406 ${base} L424 ${topY} H476 L494 ${base}Z" fill="${stoneDD}"/>`;
  let st = '';
  for (let y = topY + 12; y < base; y += 12) st += `M${r1(406 + (base - y) * 18 / (base - topY))} ${y}H${r1(494 - (base - y) * 18 / (base - topY))}`;
  s += `<path d="${st}" stroke="${stoneD}" stroke-width="3"/>`;
  s += `<path d="M396 ${base} L418 ${topY} h8 L408 ${base}Z M504 ${base} L482 ${topY} h-8 L492 ${base}Z" fill="${stoneD}"/>`;
  s += `<path d="M380 ${base} v-22 q12 -12 28 0 v22Z M520 ${base} v-22 q-12 -12 -28 0 v22Z" fill="${greenD}"/>`;
  s += `<rect x="372" y="${topY - 70}" width="156" height="70" fill="${stone}"/><rect x="364" y="${topY - 84}" width="172" height="16" fill="${stoneD}"/>`;
  for (let k = 0; k < 7; k++) s += `<rect x="${368 + k * 24}" y="${topY - 96}" width="14" height="14" fill="${stoneD}"/>`;
  s += `<path d="M396 ${topY} V${topY - 44} h22 V${topY}Z M439 ${topY} V${topY - 50} h22 V${topY}Z M482 ${topY} V${topY - 44} h22 V${topY}Z" fill="#6B3A22"/>`;

  // Ground
  s += `<path d="M0 980 H900 V1200 H0Z" fill="${terra}"/><rect y="980" width="900" height="14" fill="${terraD}"/>`;
  let pebbles = '';
  for (let i = 0; i < 40; i++) pebbles += circ(R() * 900, 1010 + R() * 110, 2 + R() * 3);
  s += `<path d="${pebbles}" fill="${terraD}"/>`;

  // Nopal cactus (left)
  let spines = '';
  const pad = (x, y, rx, ry, a, c) => {
    const ca = Math.cos(a * Math.PI / 180), sa = Math.sin(a * Math.PI / 180);
    for (let i = 0; i < 9; i++) { const t = R() * Math.PI * 2, u = Math.sqrt(R()) * 0.72, px = Math.cos(t) * rx * u, py = Math.sin(t) * ry * u; spines += `M${r1(x + px * ca - py * sa)} ${r1(y + px * sa + py * ca)}l4 -4`; }
    return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" transform="rotate(${a} ${x} ${y})"/>`;
  };
  s += pad(130, 1010, 62, 86, 0, green) + pad(70, 900, 44, 64, -28, greenL) + pad(196, 890, 42, 60, 24, green) + pad(40, 1080, 50, 70, -10, greenL) + pad(150, 800, 34, 48, 8, greenL) + pad(236, 790, 30, 42, 36, green);
  s += `<path d="${spines}" stroke="${cream}" stroke-width="2.5" stroke-linecap="round" opacity="0.8"/>`;
  for (const [x, y] of [[150, 748], [236, 744], [44, 834], [104, 842], [250, 836]]) s += `<ellipse cx="${x}" cy="${y}" rx="13" ry="17" fill="${fruit}"/><path d="M${x - 8} ${y - 16} l4 -8 l4 6 l4 -6 l4 8" fill="${fruit}"/>`;

  // Agave + marigolds (right)
  let ag = '';
  for (let i = 0; i < 11; i++) { const a = Math.PI + 0.15 + i * (Math.PI - 0.3) / 10, L = 150 + (i % 2) * 40 - Math.abs(i - 5) * 6; const tx = 790 + Math.cos(a) * L, ty = 1090 + Math.sin(a) * L, px = -Math.sin(a) * 16, py = Math.cos(a) * 16; ag += `M${r1(790 + px)} ${r1(1090 + py)}Q${r1(790 + Math.cos(a) * L * 0.5 + px)} ${r1(1090 + Math.sin(a) * L * 0.5 + py)} ${r1(tx)} ${r1(ty)}Q${r1(790 + Math.cos(a) * L * 0.5 - px)} ${r1(1090 + Math.sin(a) * L * 0.5 - py)} ${r1(790 - px)} ${r1(1090 - py)}Z`; }
  s += `<path d="${ag}" fill="${teal}"/>`;
  const mg = (x, y, r) => { let o = ''; for (const [rr, c] of [[r, orange], [r * 0.72, marigold], [r * 0.42, yellow]]) { let d = ''; for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5; d += circ(x + Math.cos(a) * rr * 0.6, y + Math.sin(a) * rr * 0.6, rr * 0.45); } o += `<path d="${d}" fill="${c}"/>`; } return o; };
  s += mg(622, 1068, 32) + mg(698, 1096, 25) + mg(880, 1004, 30) + mg(560, 1098, 20);

  s += txt(700, 486, '¡hola!', { font: 'Caveat Brush', size: 84, fill: cream, rot: -9 });
  s += stamp(150, 520, -12, purple, 'CDMX', 'MX', '2026', 80, cream);
  s += footer('10', '19.4326° N · 99.1332° W', cream);
  return s;
} });
