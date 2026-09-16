const COVERS = [];
const W = 900, H = 1200;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const r1 = v => Math.round(v * 10) / 10;
function rng(seed) { let s = seed % 2147483647; return () => (s = (s * 16807) % 2147483647, (s - 1) / 2147483646); }
function txt(x, y, str, o = {}) {
const tr = o.rot ? ` transform="rotate(${o.rot} ${r1(x)} ${r1(y)})"` : '';
return `<text x="${r1(x)}" y="${r1(y)}" font-family="${o.font}" font-size="${o.size}"` +
(o.weight ? ` font-weight="${o.weight}"` : '') + (o.italic ? ` font-style="italic"` : '') +
` fill="${o.fill || '#000'}" text-anchor="${o.anchor || 'middle'}"` +
(o.ls ? ` letter-spacing="${o.ls}"` : '') + (o.op != null ? ` opacity="${o.op}"` : '') + tr + `>${esc(str)}</text>`;
}
const mono = (x, y, s, fill, o = {}) => txt(x, y, s, { font: 'Courier Prime', weight: 700, size: 16, ls: 2.4, fill, ...o });
const footer = (vol, coords, fill) => mono(60, 1158, `VOL. ${vol} — TRAVEL DIARY`, fill, { anchor: 'start' }) + mono(840, 1158, coords, fill, { anchor: 'end' });
const star = (x, y, r, fill, k = 0.45) => { let p = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * k : r; p += (i ? 'L' : 'M') + r1(x + rr * Math.cos(a)) + ' ' + r1(y + rr * Math.sin(a)); } return `<path d="${p}Z" fill="${fill}"/>`; };
function stamp(cx, cy, rot, fill, city, code, year = '2026', rad = 84, paper = '#FFFBF3') {
const cs = city.length > 6 ? 24 : 30;
return `<g transform="translate(${cx} ${cy}) rotate(${rot})">` +
`<circle r="${rad + 7}" fill="${paper}"/>` +
`<circle r="${rad}" fill="none" stroke="${fill}" stroke-width="4.5"/>` +
`<circle r="${rad - 10}" fill="none" stroke="${fill}" stroke-width="1.6" stroke-dasharray="3 4"/>` +
`<rect x="${-rad + 11}" y="-20" width="${2 * rad - 22}" height="36" fill="${fill}"/>` +
txt(0, 7 + (cs === 30 ? 3 : 1), city, { font: 'Courier Prime', weight: 700, size: cs, ls: 1, fill: '#FFFDF7' }) +
txt(0, -36, 'ARRIVED', { font: 'Courier Prime', weight: 700, size: 13, ls: 3.5, fill }) +
txt(0, 50, `${code} · ${year}`, { font: 'Courier Prime', weight: 700, size: 13, ls: 2.5, fill }) +
star(-rad + 26, -36, 6, fill) + star(rad - 26, -36, 6, fill) + `</g>`;
}
COVERS.push({ id: '01', slug: 'france', name: 'France', bg: '#F4EBDD', svg() {
const cream = '#F4EBDD', paper = '#FFFBF3', navy = '#1C2A52', red = '#D8433A', blush = '#F5CDBF', sunC = '#FBE3C2',
zinc = '#98ABC0', zincD = '#61758E', facade = '#FAF1E4', terr = '#C9684B', green = '#3D7A4E', leaf = '#5C9A58';
const R = rng(7);
let s = `<rect width="900" height="1200" fill="${cream}"/>`;
s += `<rect width="900" height="16" fill="${navy}"/>`;
for (let i = 0; i < 15; i++) s += `<path d="M${i * 60} 140 a30 30 0 0 0 60 0 Z" fill="#E4D5BE" transform="translate(0 9)"/>`;
for (let i = 0; i < 15; i++) {
const x = i * 60, c = i % 2 ? paper : red;
s += `<rect x="${x}" y="16" width="60" height="124" fill="${c}"/><path d="M${x} 139 a30 30 0 0 0 60 0 Z" fill="${c}"/>`;
}
s += `<rect y="16" width="900" height="10" fill="#000" opacity="0.08"/>`;
s += txt(456, 356, 'France', { font: 'Abril Fatface', size: 206, fill: red, ls: -2 });
s += txt(450, 350, 'France', { font: 'Abril Fatface', size: 206, fill: navy, ls: -2 });
const arch = (x0, x1, top, bottom) => { const r = (x1 - x0) / 2; return `M${x0} ${bottom} V${top + r} A${r} ${r} 0 0 1 ${x1} ${top + r} V${bottom} Z`; };
const inner = arch(178, 722, 440, 1040);
s += `<path d="${arch(150, 750, 412, 1052)}" fill="${navy}"/>`;
s += `<path d="${arch(162, 738, 424, 1052)}" fill="none" stroke="${paper}" stroke-width="2.5"/>`;
s += `<defs><clipPath id="fr-win"><path d="${inner}"/></clipPath></defs><g clip-path="url(#fr-win)">`;
s += `<rect x="170" y="430" width="560" height="620" fill="${blush}"/>`;
s += `<circle cx="590" cy="610" r="84" fill="${sunC}"/>`;
s += `<rect x="222" y="640" width="150" height="24" rx="12" fill="${paper}" opacity="0.85"/><rect x="262" y="620" width="84" height="24" rx="12" fill="${paper}" opacity="0.85"/>`;
s += `<rect x="560" y="712" width="120" height="20" rx="10" fill="${paper}" opacity="0.7"/>`;
const tower = `M446 478 L454 478 L461 560 L482 700 L495 700 L495 713 L478 713 L520 818 L542 818 L542 836 L516 836 L608 990 L292 990 L384 836 L358 836 L358 818 L380 818 L422 713 L405 713 L405 700 L418 700 L439 560 Z`;
const archCut = `M366 990 C372 930 402 902 450 898 C498 902 528 930 534 990 Z`;
s += `<path d="${tower} ${archCut}" fill="${navy}" fill-rule="evenodd"/>`;
s += `<rect x="447" y="438" width="6" height="42" fill="${navy}"/><rect x="438" y="470" width="24" height="10" fill="${navy}"/>`;
const halfW = y => y < 560 ? 4 + (y - 478) / 82 * 7 : y < 700 ? 11 + (y - 560) / 140 * 21 : y < 818 ? 28 + (y - 713) / 105 * 42 : 66 + (y - 836) / 154 * 92;
let lat = '';
const cross = (y0, y1, n) => {
const h = (y1 - y0) / n, L = y => 450 - halfW(y) + 4, Rt = y => 450 + halfW(y) - 4;
for (let i = 0; i < n; i++) { const a = y0 + i * h, b = a + h; lat += `M${r1(L(a))} ${r1(a)}L${r1(Rt(b))} ${r1(b)}M${r1(Rt(a))} ${r1(a)}L${r1(L(b))} ${r1(b)}`; }
};
cross(574, 696, 6); cross(718, 814, 4); cross(842, 894, 2);
s += `<path d="${lat}" fill="none" stroke="${blush}" stroke-width="1.4" opacity="0.7"/>`;
for (const [x, y, k] of [[300, 560, 1], [336, 540, 0.8], [640, 780, 0.9]]) s += `<path d="M${x - 14 * k} ${y - 6 * k} Q${x - 6 * k} ${y - 10 * k} ${x} ${y} Q${x + 6 * k} ${y - 10 * k} ${x + 14 * k} ${y - 6 * k}" fill="none" stroke="${navy}" stroke-width="3" stroke-linecap="round"/>`;
s += `<rect x="358" y="824" width="184" height="3" fill="${blush}" opacity="0.7"/><rect x="405" y="704" width="90" height="2.5" fill="${blush}" opacity="0.7"/>`;
const mansard = (x0, x1, top, base, col) => `<path d="M${x0} ${base} L${x0 + 16} ${top} L${x1 - 16} ${top} L${x1} ${base} Z" fill="${col}"/>`;
s += mansard(160, 330, 900, 950, zinc) + mansard(560, 760, 890, 945, zinc) + mansard(300, 600, 930, 975, zinc);
s += `<rect x="160" y="945" width="600" height="110" fill="#E9DCCB"/>`;
const bld = (x0, x1, top) => {
let b = mansard(x0, x1, top, top + 52, zincD) + `<rect x="${x0}" y="${top + 52}" width="${x1 - x0}" height="${1060 - top - 52}" fill="${facade}"/>`;
b += `<rect x="${x0}" y="${top + 52}" width="${x1 - x0}" height="7" fill="${navy}" opacity="0.18"/>`;
for (let x = x0 + 22; x + 22 <= x1 - 12; x += 44) {
b += `<path d="M${x} ${top + 44} V${top + 26} a11 11 0 0 1 22 0 V${top + 44} Z" fill="${paper}"/>`;
b += `<rect x="${x}" y="${top + 78}" width="22" height="46" fill="${navy}"/><rect x="${x - 5}" y="${top + 118}" width="32" height="4" fill="${navy}"/>`;
}
return b;
};
s += bld(150, 340, 868) + bld(566, 760, 858);
s += mansard(330, 580, 956, 998, zincD) + `<rect x="330" y="998" width="250" height="60" fill="${facade}"/>`;
for (let x = 356; x < 560; x += 44) s += `<rect x="${x}" y="1014" width="22" height="46" fill="${navy}"/>`;
const chim = (x, y) => `<rect x="${x}" y="${y}" width="30" height="34" fill="${terr}"/><rect x="${x - 4}" y="${y - 6}" width="38" height="8" fill="${terr}"/><rect x="${x + 4}" y="${y - 18}" width="8" height="14" fill="#B25A40"/><rect x="${x + 18}" y="${y - 14}" width="8" height="10" fill="#B25A40"/>`;
s += chim(196, 842) + chim(680, 832) + chim(512, 934);
s += `</g>`;
s += `<path d="${inner}" fill="none" stroke="${navy}" stroke-width="4"/>`;
s += `<path d="M434 406 L466 406 L460 446 L440 446 Z" fill="${paper}" stroke="${navy}" stroke-width="3"/>`;
let fl = '';
for (let i = 0; i < 34; i++) { const x = 150 + R() * 600, y = 1040 + R() * 18; fl += `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(16 + R() * 10)}" ry="${r1(9 + R() * 5)}" fill="${R() > 0.5 ? green : leaf}" transform="rotate(${r1(R() * 60 - 30)} ${r1(x)} ${r1(y)})"/>`; }
for (let i = 0; i < 9; i++) { const x = 185 + i * 66 + R() * 20, y = 1026 + R() * 10; for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2, rr = k ? 12 : 0; fl += `<circle cx="${r1(x + rr * Math.cos(a))}" cy="${r1(y + rr * Math.sin(a))}" r="${k ? 8.5 : 9}" fill="${k % 3 ? red : '#EF6F5E'}"/>`; } }
s += fl;
s += `<rect x="128" y="1056" width="644" height="52" rx="4" fill="${navy}"/><rect x="128" y="1056" width="644" height="8" fill="#000" opacity="0.15"/>`;
let iron = '';
for (let x = 150; x < 750; x += 40) iron += `M${x} 1094 V1080 a10 10 0 0 1 20 0 V1094 M${x + 20} 1080 a10 10 0 0 1 20 0 `;
s += `<path d="${iron}" fill="none" stroke="${paper}" stroke-width="2" opacity="0.5"/>`;
s += txt(236, 442, 'bonjour !', { font: 'Caveat Brush', size: 76, fill: red, rot: -11 });
s += stamp(752, 520, 13, navy, 'PARIS', 'FR');
s += footer('01', '48.8566° N · 2.3522° E', navy);
return s;
} });
COVERS.push({ id: '02', slug: 'italy', name: 'Italy', bg: '#FBF0D6', svg() {
const paper = '#FBF0D6', cobalt = '#1E4B9C', sea = '#2461B0', seaL = '#5A90D2', sunC = '#F8D57A', mount = '#EACAA4', mountD = '#DFB68D',
cliff = '#CD9D71', cliffD = '#B7875D', lemon = '#F6CB2F', lemonL = '#FCE38A', leaf = '#3E7B39', leafL = '#63A24C', coral = '#E4605A',
pink = '#F4B6A8', apricot = '#F2A56A', butter = '#F8DA8E', white = '#FFF8EC', shutter = '#4E8B5B', win = '#34466E', terra = '#C8603E',
sand = '#F3D8A6', branch = '#6E4B2F';
const R = rng(21);
let s = `<rect width="900" height="1200" fill="${paper}"/>`;
s += `<circle cx="236" cy="610" r="168" fill="${sunC}"/>`;
s += `<path d="M0 730 C90 650 170 628 260 660 C340 612 430 580 520 630 C610 590 720 560 900 610 V880 H0 Z" fill="${mount}"/>`;
s += `<path d="M0 790 C120 740 220 745 300 772 C390 735 480 728 580 764 V880 H0 Z" fill="${mountD}"/>`;
s += `<rect y="836" width="900" height="364" fill="${sea}"/>`;
let wv = '';
for (let i = 0; i < 46; i++) { const x = R() * 700, y = 860 + R() * 320, w = 18 + R() * 40; wv += `M${r1(x)} ${r1(y)}h${r1(w)}`; }
s += `<path d="${wv}" stroke="${seaL}" stroke-width="4" stroke-linecap="round" opacity="0.7"/>`;
const boat = (x, y, k, c) => `<path d="M${x - 40 * k} ${y} Q${x} ${y + 22 * k} ${x + 44 * k} ${y - 6 * k} Z" fill="${white}"/><path d="M${x - 34 * k} ${y + 5 * k} Q${x} ${y + 21 * k} ${x + 38 * k} ${y - 1 * k}" fill="none" stroke="${c}" stroke-width="${4 * k}"/><rect x="${x - 12 * k}" y="${y - 16 * k}" width="${22 * k}" height="${14 * k}" rx="${3 * k}" fill="${white}"/>` +
`<path d="M${x - 70 * k} ${y + 14 * k} h${40 * k} M${x + 30 * k} ${y + 12 * k} h${50 * k}" stroke="${seaL}" stroke-width="3" stroke-linecap="round"/>`;
s += boat(120, 930, 1, coral) + boat(290, 1004, 0.8, cobalt) + boat(96, 1068, 1.05, shutter);
const pts = [[900, 520], [720, 575], [580, 690], [480, 850], [436, 960], [390, 1110], [370, 1200]];
const edge = y => { for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; if (y >= y0 && y <= y1) return x0 + (x1 - x0) * (y - y0) / (y1 - y0); } return 900; };
s += `<path d="M${pts.map(p => p.join(' ')).join(' L')} L900 1200 Z" fill="${cliff}"/>`;
s += `<path d="M900 600 L760 640 L660 760 L600 900 L560 1040 L540 1200 L900 1200 Z" fill="${cliffD}" opacity="0.45"/>`;
const cols = [white, white, pink, butter, apricot, white, pink, butter];
const house = (x, y, w, h) => {
const c = cols[Math.floor(R() * cols.length)];
let o = `<rect x="${r1(x)}" y="${r1(y - h)}" width="${r1(w)}" height="${r1(h)}" fill="${c}"/>`;
o += `<rect x="${r1(x + w - 8)}" y="${r1(y - h)}" width="8" height="${r1(h)}" fill="#000" opacity="0.07"/>`;
const roof = R();
if (roof < 0.35) o += `<path d="M${r1(x + 4)} ${r1(y - h)} Q${r1(x + w / 2)} ${r1(y - h - 22)} ${r1(x + w - 4)} ${r1(y - h)} Z" fill="${c}"/>`;
else if (roof < 0.5) o += `<path d="M${r1(x + w / 2 - 14)} ${r1(y - h)} a14 14 0 0 1 28 0 Z" fill="${terra}"/>`;
else o += `<rect x="${r1(x - 2)}" y="${r1(y - h - 5)}" width="${r1(w + 4)}" height="6" fill="${c}"/>`;
const nWin = w > 64 ? 2 : 1;
for (let k = 0; k < nWin; k++) {
const wx = x + (k + 1) * w / (nWin + 1) - 7, wy = y - h + 16;
o += `<path d="M${r1(wx)} ${r1(wy + 20)} V${r1(wy + 7)} a7 7 0 0 1 14 0 V${r1(wy + 20)} Z" fill="${win}"/>`;
if (R() > 0.45) o += `<rect x="${r1(wx - 7)}" y="${r1(wy + 3)}" width="6" height="17" fill="${shutter}"/><rect x="${r1(wx + 15)}" y="${r1(wy + 3)}" width="6" height="17" fill="${shutter}"/>`;
}
return o;
};
const rows = [];
for (let y = 600; y <= 1190; y += 46) rows.push(y);
const church = () => {
let o = `<rect x="560" y="708" width="100" height="84" fill="${white}"/><rect x="578" y="676" width="64" height="34" fill="${white}"/>`;
o += `<path d="M572 678 C572 606 648 606 648 678 Z" fill="${lemon}"/>`;
o += `<path d="M590 676 C588 640 598 622 610 616 M630 676 C632 640 622 622 610 616 M610 676 V616" fill="none" stroke="${leaf}" stroke-width="5"/>`;
o += `<path d="M572 678 C574 660 590 646 610 642 C630 646 646 660 648 678 Z" fill="${leafL}" opacity="0.55"/>`;
o += `<rect x="606" y="586" width="8" height="32" fill="${white}"/><rect x="598" y="596" width="24" height="7" fill="${white}"/>`;
o += `<path d="M596 792 V752 a14 14 0 0 1 28 0 V792 Z" fill="${win}"/>`;
o += `<rect x="672" y="630" width="44" height="162" fill="${white}"/><path d="M672 632 L694 604 L716 632 Z" fill="${terra}"/>`;
o += `<path d="M684 676 V660 a10 10 0 0 1 20 0 V676 Z M684 716 V700 a10 10 0 0 1 20 0 V716 Z" fill="${win}"/>`;
return o;
};
for (const y of rows) {
if (y === 830) s += church();
let x = edge(y) + 6 + R() * 14;
while (x < 900) { const w = 46 + R() * 44, h = 40 + R() * 20; s += house(x, y + R() * 6, w, h); x += w - 2 + R() * 10; }
}
s += `<path d="M130 1130 C180 1090 262 1064 372 1050 L420 1062 L404 1130 Z" fill="${sand}"/>`;
const umb = (x, y, a, b) => {
let o = `<rect x="${x - 2}" y="${y}" width="4" height="34" fill="${branch}"/>`;
for (let i = 0; i < 6; i++) { const t0 = Math.PI + i * Math.PI / 6, t1 = t0 + Math.PI / 6; o += `<path d="M${x} ${y} L${r1(x + 34 * Math.cos(t0))} ${r1(y + 22 * Math.sin(t0))} L${r1(x + 34 * Math.cos(t1))} ${r1(y + 22 * Math.sin(t1))} Z" fill="${i % 2 ? a : b}"/>`; }
return o;
};
s += umb(236, 1084, coral, white) + umb(318, 1066, cobalt, white) + umb(304, 1092, apricot, white) + umb(378, 1080, coral, white);
s += `<rect y="1124" width="900" height="76" fill="${paper}"/><rect y="1124" width="900" height="6" fill="${cobalt}"/>`;
s += `<path d="M912 30 C840 60 760 120 650 118 C600 116 560 96 520 70" fill="none" stroke="${branch}" stroke-width="9" stroke-linecap="round"/>`;
s += `<path d="M770 92 C780 130 776 160 760 176 M676 116 C680 140 672 156 660 164" fill="none" stroke="${branch}" stroke-width="5" stroke-linecap="round"/>`;
const lf = (x, y, a, c, l = 40) => `<path d="M${x} ${y} q${l / 2} ${-l / 3.2} ${l} 0 q${-l / 2} ${l / 3.2} ${-l} 0 Z" fill="${c}" transform="rotate(${a} ${x} ${y})"/>`;
s += lf(870, 48, -160, leaf, 76) + lf(826, 66, -40, leafL, 72) + lf(740, 104, 150, leaf, 74) + lf(704, 116, -34, leafL, 68) + lf(606, 108, -150, leaf, 66) + lf(556, 84, 16, leafL, 62) + lf(640, 118, 70, leaf, 58) + lf(784, 88, 62, leafL, 64) + lf(520, 70, -120, leaf, 56);
const lem = (x, y, a) => `<g transform="rotate(${a} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="44" ry="33" fill="${lemon}"/><path d="M${x + 40} ${y - 6} q14 6 0 12 Z M${x - 40} ${y - 6} q-12 6 0 12 Z" fill="${lemon}"/><ellipse cx="${x - 12}" cy="${y - 13}" rx="16" ry="7" fill="${lemonL}"/></g>`;
s += lem(756, 206, 72) + lem(652, 196, 96) + lem(836, 132, 50);
s += lf(744, 172, 110, leafL, 40);
s += txt(456, 408, 'Italia', { font: 'Shrikhand', size: 214, fill: coral });
s += txt(450, 402, 'Italia', { font: 'Shrikhand', size: 214, fill: cobalt });
s += txt(660, 506, 'ciao bella!', { font: 'Caveat Brush', size: 70, fill: coral, rot: -7 });
s += stamp(150, 540, -12, cobalt, 'ROMA', 'IT');
s += footer('02', '41.9028° N · 12.4964° E', cobalt);
return s;
} });
COVERS.push({ id: '03', slug: 'spain', name: 'Spain', bg: '#D63A2F', svg() {
const red = '#D63A2F', redD = '#A92822', redL = '#E85A45', cream = '#FFF4E0', tileBg = '#FBF3E3', blue = '#1F4E9E', blueL = '#6D93CF',
yellow = '#F2B632', ink = '#221B2B', wood = '#5E3420', woodL = '#86502F', green = '#3E7B3F', greenL = '#5E9C4A', orange = '#F08A1C', gold = '#E6B24A';
const R = rng(5);
let s = `<rect width="900" height="1200" fill="${red}"/>`;
const T0 = 570, TS = 150;
const petal = (cx, cy, ang, len, w) => {
const c = Math.cos(ang), sn = Math.sin(ang), px = -sn, py = c;
const tx = cx + c * len, ty = cy + sn * len, mx = cx + c * len / 2, my = cy + sn * len / 2;
return `M${r1(cx)} ${r1(cy)}Q${r1(mx + px * w)} ${r1(my + py * w)} ${r1(tx)} ${r1(ty)}Q${r1(mx - px * w)} ${r1(my - py * w)} ${r1(cx)} ${r1(cy)}Z`;
};
const circ = (cx, cy, r) => `M${r1(cx - r)} ${r1(cy)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
let pB = '', pL = '', pY = '', cB = '', cY = '', dots = '';
for (let row = 0; row < 4; row++) for (let col = 0; col < 6; col++) {
const cx = col * TS + TS / 2, cy = T0 + row * TS + TS / 2;
for (let k = 0; k < 4; k++) { pB += petal(cx, cy, k * Math.PI / 2, 48, 18); pL += petal(cx, cy, Math.PI / 4 + k * Math.PI / 2, 34, 10); }
pY += circ(cx, cy, 11);
for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2; dots += circ(cx + Math.cos(a) * 58, cy + Math.sin(a) * 58, 4); }
}
for (let row = 0; row <= 4; row++) for (let col = 0; col <= 6; col++) { cB += circ(col * TS, T0 + row * TS, 42); cY += circ(col * TS, T0 + row * TS, 24); }
s += `<rect y="${T0}" width="900" height="${4 * TS}" fill="${tileBg}"/>`;
s += `<defs><clipPath id="es-tiles"><rect y="${T0}" width="900" height="${4 * TS}"/></clipPath></defs><g clip-path="url(#es-tiles)">`;
s += `<path d="${cB}" fill="${blue}"/><path d="${cY}" fill="${yellow}"/><path d="${pB}" fill="${blue}"/><path d="${pL}" fill="${blueL}"/><path d="${pY}" fill="${yellow}"/><path d="${dots}" fill="${blue}"/>`;
let grout = '';
for (let i = 0; i <= 6; i++) grout += `M${i * TS} ${T0}V${T0 + 4 * TS}`;
for (let j = 0; j <= 4; j++) grout += `M0 ${T0 + j * TS}H900`;
s += `<path d="${grout}" stroke="#E2D2B8" stroke-width="3"/></g>`;
s += `<rect y="${T0 - 14}" width="900" height="22" fill="${blue}"/>`;
for (let x = 15; x < 900; x += 30) s += `<circle cx="${x}" cy="${T0 - 3}" r="5" fill="${yellow}"/>`;
const P = [450, 1016], Rf = 400, Ri = 150, n = 15, a0 = 196 * Math.PI / 180, a1 = 344 * Math.PI / 180;
const at = (r, a) => [P[0] + r * Math.cos(a), P[1] + r * Math.sin(a)];
let lace = '';
for (let i = 0; i < n * 3; i++) {
const a = a0 + (a1 - a0) * (i + 0.5) / (n * 3), [x, y] = at(Rf + 4, a);
lace += circ(x, y, 13);
}
s += `<path d="${lace}" fill="${ink}"/>`;
for (let i = 0; i < n; i++) {
const ta = a0 + (a1 - a0) * i / n, tb = a0 + (a1 - a0) * (i + 1) / n;
const [x0, y0] = at(Ri, ta), [x1, y1] = at(Rf, ta), [x2, y2] = at(Rf, tb), [x3, y3] = at(Ri, tb);
s += `<path d="M${r1(x0)} ${r1(y0)}L${r1(x1)} ${r1(y1)}A${Rf} ${Rf} 0 0 1 ${r1(x2)} ${r1(y2)}L${r1(x3)} ${r1(y3)}A${Ri} ${Ri} 0 0 0 ${r1(x0)} ${r1(y0)}Z" fill="${i % 2 ? redD : red}"/>`;
}
let pd = '';
for (let i = 0; i < n; i++) {
const tm = a0 + (a1 - a0) * (i + 0.5) / n, td = (a1 - a0) / n;
for (const [r, off, rad] of [[210, 0, 9], [270, 0.25, 11], [334, -0.25, 13], [376, 0.25, 7]]) { const [x, y] = at(r, tm + off * td); pd += circ(x, y, rad); }
}
s += `<path d="${pd}" fill="${cream}"/>`;
let ribs = '';
for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n, [x, y] = at(Ri + 6, a); ribs += `M${P[0]} ${P[1]}L${r1(x)} ${r1(y)}`; }
s += `<path d="${ribs}" stroke="${wood}" stroke-width="12" stroke-linecap="round"/><path d="${ribs}" stroke="${woodL}" stroke-width="4" stroke-linecap="round"/>`;
s += `<circle cx="${P[0]}" cy="${P[1]}" r="20" fill="${gold}"/><circle cx="${P[0]}" cy="${P[1]}" r="8" fill="${wood}"/>`;
const car = [610, 1000];
s += `<path d="M${car[0] - 20} ${car[1] + 40} C${car[0] - 40} ${car[1] + 90} ${car[0] - 30} ${car[1] + 120} ${car[0] - 60} ${car[1] + 150}" stroke="${green}" stroke-width="9" fill="none" stroke-linecap="round"/>`;
s += `<path d="M${car[0] - 36} ${car[1] + 96} q-50 -10 -70 20 q40 6 70 -20Z" fill="${greenL}"/>`;
s += `<path d="M${car[0] - 44} ${car[1] + 34} L${car[0] - 26} ${car[1] + 74} Q${car[0] - 18} ${car[1] + 80} ${car[0] - 10} ${car[1] + 72} L${car[0] + 2} ${car[1] + 26} Z" fill="${green}"/>`;
for (const [rr, col, cnt] of [[78, redD, 18], [62, red, 16], [44, redL, 13], [26, red, 9]]) {
let fr = '';
for (let i = 0; i < cnt; i++) { const a = i / cnt * Math.PI * 2 + rr; fr += circ(car[0] + Math.cos(a) * rr * 0.62, car[1] + Math.sin(a) * rr * 0.62, rr * 0.42); }
s += `<path d="${fr}" fill="${col}"/>`;
}
s += `<circle cx="${car[0] - 10}" cy="${car[1] - 12}" r="10" fill="${cream}" opacity="0.35"/>`;
const orangeFruit = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${orange}"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.28}" fill="#F7B061"/><path d="M${x - 4} ${y - r + 2} q-26 -30 -58 -18 q26 30 58 18Z M${x + 4} ${y - r + 2} q20 -34 54 -26 q-20 34 -54 26Z" fill="${green}"/>`;
s += `<rect y="1128" width="900" height="72" fill="${cream}"/><rect y="1128" width="900" height="6" fill="${blue}"/>`;
s += orangeFruit(112, 1082, 52) + orangeFruit(200, 1112, 40) + orangeFruit(798, 1088, 54);
s += `<rect x="30" y="30" width="840" height="498" rx="6" fill="none" stroke="${cream}" stroke-width="3"/><rect x="42" y="42" width="816" height="474" rx="3" fill="none" stroke="${cream}" stroke-width="1.2" opacity="0.8"/>`;
for (const [x, y] of [[30, 30], [870, 30], [30, 528], [870, 528]]) s += `<path d="M${x} ${y - 14}L${x + 14} ${y}L${x} ${y + 14}L${x - 14} ${y}Z" fill="${yellow}"/>`;
s += txt(457, 346, 'España', { font: 'Sancreek', size: 196, fill: redD });
s += txt(450, 338, 'España', { font: 'Sancreek', size: 196, fill: cream });
s += txt(700, 470, '¡olé!', { font: 'Caveat Brush', size: 96, fill: yellow, rot: -10 });
s += stamp(170, 450, -12, blue, 'MADRID', 'ES');
s += footer('03', '40.4168° N · 3.7038° W', blue);
return s;
} });
COVERS.push({ id: '04', slug: 'greece', name: 'Greece', bg: '#F8F5EC', svg() {
const paper = '#F8F5EC', white = '#FFFFFF', blue = '#1C4FA6', blueL = '#3D72C8', sky = '#CFE6F7', sea = '#1F5BAF', seaL = '#4F86CF',
island = '#A7C0DD', sunC = '#F7B447', sunL = '#FAD58A', shade = '#DDE6EF', shade2 = '#C7D4E2', ochre = '#F0CB85', pink = '#F4B2A6',
magenta = '#C8337A', magL = '#E4649F', green = '#4E8A4E', olive = '#6F8746', gold = '#D9A441', win = '#1C4FA6';
const R = rng(11);
let s = `<rect width="900" height="1200" fill="${paper}"/>`;
const meander = (y, h, fg, bg) => {
let o = `<rect y="${y}" width="900" height="${h}" fill="${bg}"/>`, d = '';
const u = h / 6, step = 6 * u;
for (let x = -u; x < 900 + step; x += step) {
d += `M${r1(x)} ${r1(y + 5 * u)}H${r1(x + 5 * u)}V${r1(y + u)}H${r1(x + u)}V${r1(y + 4 * u)}H${r1(x + 3 * u)}V${r1(y + 2 * u)}H${r1(x + 2 * u)}`;
d += `M${r1(x + 5 * u)} ${r1(y + 5 * u)}H${r1(x + 6 * u)}`;
}
return o + `<path d="${d}" fill="none" stroke="${fg}" stroke-width="${r1(u * 0.62)}" stroke-linecap="square"/>`;
};
s += meander(0, 60, paper, blue);
s += txt(450, 262, 'GREECE', { font: 'Cinzel Decorative', weight: 900, size: 148, fill: blue, ls: 2 });
s += txt(450, 344, 'Γειά σου!', { font: 'GFS Didot', size: 52, fill: magenta });
const laurel = (x, y, dir) => {
let o = `<path d="M${x} ${y} q${dir * 60} -4 ${dir * 110} -30" fill="none" stroke="${olive}" stroke-width="3" stroke-linecap="round"/>`;
for (let i = 0; i < 6; i++) {
const t = i / 5, px = x + dir * (18 + 88 * t), py = y - 2 - 26 * t * t;
o += `<ellipse cx="${r1(px)}" cy="${r1(py - 9)}" rx="11" ry="5" fill="${olive}" transform="rotate(${r1(dir * (-30 - 20 * t))} ${r1(px)} ${r1(py - 9)})"/>`;
o += `<ellipse cx="${r1(px + dir * 4)}" cy="${r1(py + 8)}" rx="11" ry="5" fill="${green}" transform="rotate(${r1(dir * (25 - 20 * t))} ${r1(px + dir * 4)} ${r1(py + 8)})"/>`;
}
return o;
};
s += laurel(330, 330, -1) + laurel(570, 330, 1);
const top = 392, bot = 1080;
s += `<defs><clipPath id="gr-scene"><rect x="0" y="${top}" width="900" height="${bot - top}"/></clipPath></defs><g clip-path="url(#gr-scene)">`;
s += `<rect y="${top}" width="900" height="${bot - top}" fill="${sky}"/>`;
s += `<circle cx="236" cy="590" r="122" fill="${sunL}"/><circle cx="236" cy="590" r="92" fill="${sunC}"/>`;
s += `<path d="M0 704 C60 670 120 664 170 684 C220 660 290 668 340 704 Z" fill="${island}"/>`;
s += `<rect y="702" width="900" height="400" fill="${sea}"/>`;
let wv = '';
for (let i = 0; i < 30; i++) { const x = R() * 520, y = 720 + R() * 360, w = 16 + R() * 34; wv += `M${r1(x)} ${r1(y)}h${r1(w)}`; }
s += `<path d="${wv}" stroke="${seaL}" stroke-width="4" stroke-linecap="round" opacity="0.75"/>`;
s += `<path d="M150 806 L150 730 L196 800 Z" fill="${white}"/><path d="M144 736 L144 800 L112 800 Z" fill="${white}" opacity="0.85"/><path d="M104 810 H206 L192 826 H118 Z" fill="${white}"/>`;
const xL = y => 600 - (y - 590) * 1.02;
const house = (x, y, w, h) => {
const p = R(), c = p < 0.12 ? ochre : p < 0.2 ? pink : white;
let o = `<rect x="${r1(x)}" y="${r1(y - h)}" width="${r1(w)}" height="${r1(h)}" fill="${c}"/>`;
o += `<rect x="${r1(x + w - 12)}" y="${r1(y - h)}" width="12" height="${r1(h)}" fill="${c === white ? shade : '#000'}" opacity="${c === white ? 1 : 0.08}"/>`;
const roof = R();
if (roof < 0.4) o += `<path d="M${r1(x)} ${r1(y - h)} Q${r1(x + w / 2)} ${r1(y - h - 26)} ${r1(x + w)} ${r1(y - h)} Z" fill="${c}"/>`;
else if (roof < 0.52) o += `<path d="M${r1(x + w / 2 - 20)} ${r1(y - h)} a20 20 0 0 1 40 0 Z" fill="${blue}"/><rect x="${r1(x + w / 2 - 1.5)}" y="${r1(y - h - 30)}" width="3" height="12" fill="${blue}"/>`;
const d = R();
if (d < 0.55) o += `<path d="M${r1(x + 12)} ${r1(y)} V${r1(y - 26)} a9 9 0 0 1 18 0 V${r1(y)} Z" fill="${win}"/>`;
if (w > 70) o += `<rect x="${r1(x + w - 36)}" y="${r1(y - h + 14)}" width="14" height="16" fill="${win}"/>`;
return o;
};
const tower = () => {
let o = `<rect x="360" y="752" width="112" height="128" fill="${white}"/><rect x="460" y="752" width="12" height="128" fill="${shade}"/>`;
o += `<path d="M360 752 H472 V736 Q416 690 360 736 Z" fill="${white}"/>`;
o += `<path d="M378 830 V800 a14 14 0 0 1 28 0 V830 Z M426 830 V800 a14 14 0 0 1 28 0 V830 Z M402 776 V752 a14 14 0 0 1 28 0 V776 Z" fill="${blue}"/>`;
o += `<path d="M383 806 a9 9 0 0 1 18 0 v8 h-18Z M431 806 a9 9 0 0 1 18 0 v8 h-18Z M407 758 a9 9 0 0 1 18 0 v8 h-18Z" fill="${gold}"/>`;
o += `<rect x="413" y="676" width="6" height="34" fill="${blue}"/><rect x="403" y="686" width="26" height="6" fill="${blue}"/>`;
return o;
};
const church = () => {
let o = `<rect x="600" y="648" width="150" height="112" fill="${white}"/><rect x="734" y="648" width="16" height="112" fill="${shade}"/>`;
o += `<rect x="622" y="620" width="106" height="30" fill="${white}"/>`;
o += `<path d="M614 624 C614 520 736 520 736 624 Z" fill="${blue}"/><path d="M640 612 C640 560 660 540 675 537" fill="none" stroke="${blueL}" stroke-width="7" stroke-linecap="round"/>`;
o += `<rect x="672" y="498" width="6" height="36" fill="${white}"/><rect x="662" y="508" width="26" height="6" fill="${white}"/>`;
o += `<path d="M660 760 V714 a15 15 0 0 1 30 0 V760 Z" fill="${blue}"/>`;
return o;
};
for (let y = 650; y <= 1130; y += 58) {
if (y === 766) s += church();
if (y === 882) s += tower();
let x = Math.max(-20, xL(y) + R() * 20);
s += `<rect x="${r1(x - 10)}" y="${y}" width="${r1(920 - x)}" height="12" fill="${shade2}"/>`;
while (x < 900) {
const w = 56 + R() * 56, h = 46 + R() * 22;
if (!(y === 766 && x + w > 590 && x < 760) && !(y === 882 && x + w > 350 && x < 480)) s += house(x, y, w, h);
x += w + 4 + R() * 12;
}
}
s += `<rect x="-10" y="1030" width="520" height="60" fill="${white}"/><rect x="-10" y="1030" width="520" height="8" fill="${shade}"/>`;
const dot = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
let bvD = '', bv1 = '', bv2 = '', lv = '';
for (const [cx, cy, rad] of [[30, 1004, 64], [128, 992, 56], [222, 1016, 50], [306, 1036, 38], [70, 1070, 44], [180, 1070, 36]]) {
for (let i = 0; i < 7; i++) { const a = R() * Math.PI * 2, x = cx + Math.cos(a) * rad * 0.95, y = cy + Math.sin(a) * rad * 0.75; lv += `M${r1(x)} ${r1(y)}q14 -14 28 0q-14 14 -28 0Z`; }
for (let i = 0; i < 26; i++) {
const a = R() * Math.PI * 2, d = Math.sqrt(R()) * rad, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.78, r = 8 + R() * 5;
if (y > cy + rad * 0.3) bvD += dot(x, y, r); else if (R() > 0.4) bv1 += dot(x, y, r); else bv2 += dot(x, y, r);
}
}
s += `<path d="${lv}" fill="${green}"/><path d="${bvD}" fill="#9C2462"/><path d="${bv1}" fill="${magenta}"/><path d="${bv2}" fill="${magL}"/>`;
s += `</g>`;
s += meander(bot, 48, paper, blue);
s += stamp(772, 470, 11, blue, 'ATHENS', 'GR');
s += footer('04', '37.9838° N · 23.7275° E', blue);
return s;
} });
COVERS.push({ id: '05', slug: 'turkiye', name: 'Türkiye', bg: '#FBE4C9', svg() {
const teal = '#15525F', tealL = '#2F8C8C', red = '#D9443A', cream = '#FFF6E8', mustard = '#EDB23C', cobalt = '#2451A8', plum = '#7A3A63',
sky1 = '#FBE4C9', sky2 = '#F9D2B2', sky3 = '#F6BF9E', sky4 = '#F2AC8E', sunC = '#FCDDA0', rockFar = '#EDC9A2', rock = '#DFA978',
rockD = '#C98C5C', cap = '#8F5E42', hole = '#5E3A2B', ground = '#B77A4F', basket = '#7A4A2C';
const R = rng(3);
let s = `<rect width="900" height="1200" fill="${sky1}"/>`;
s += `<rect y="560" width="900" height="640" fill="${sky2}"/><rect y="720" width="900" height="480" fill="${sky3}"/><rect y="850" width="900" height="350" fill="${sky4}"/>`;
s += `<circle cx="450" cy="930" r="190" fill="${sunC}"/>`;
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
const nz = (x, y, k) => `<circle cx="${x}" cy="${y}" r="${30 * k}" fill="${cobalt}"/><circle cx="${x}" cy="${y}" r="${20 * k}" fill="${cream}"/><circle cx="${x}" cy="${y}" r="${13 * k}" fill="#6FA8E0"/><circle cx="${x}" cy="${y}" r="${6.5 * k}" fill="#101A33"/><circle cx="${x - 12 * k}" cy="${y - 14 * k}" r="${4 * k}" fill="#fff" opacity="0.6"/>`;
s += txt(456, 344, 'Türkiye', { font: 'Kavoon', size: 176, fill: red });
s += txt(450, 338, 'Türkiye', { font: 'Kavoon', size: 176, fill: teal });
s += txt(640, 424, 'merhaba!', { font: 'Caveat Brush', size: 66, fill: red, rot: -7 });
s += `<path d="M724 660 V708" stroke="${basket}" stroke-width="2.5"/>` + nz(724, 734, 0.9);
s += stamp(150, 1000, -10, teal, 'İSTANBUL', 'TR');
s += footer('05', '41.0082° N · 28.9784° E', cream);
return s;
} });
const hex = h => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });
const page = figma.currentPage;
page.name = 'Travel Diary Covers';
const made = [], errors = [];
await figma.loadFontAsync({ family: 'Abril Fatface', style: 'Regular' });
await figma.loadFontAsync({ family: 'Courier Prime', style: 'Bold' });
const h1 = figma.createText(); h1.fontName = { family: 'Abril Fatface', style: 'Regular' }; h1.characters = 'Travel Diary — Cover Series'; h1.fontSize = 120; h1.x = 0; h1.y = 60; h1.fills = [{ type: 'SOLID', color: hex('#1C2A52') }]; h1.name = 'Series title';
const h2 = figma.createText(); h2.fontName = { family: 'Courier Prime', style: 'Bold' }; h2.characters = '10 COUNTRIES · HARDCOVER FRONT COVERS · 900 × 1200 (3:4) · VECTOR, EDITABLE TEXT'; h2.fontSize = 30; h2.letterSpacing = { unit: 'PIXELS', value: 3 }; h2.x = 6; h2.y = 230; h2.fills = [{ type: 'SOLID', color: hex('#D8433A') }]; h2.name = 'Series subtitle';
made.push({ id: h1.id, name: h1.name }, { id: h2.id, name: h2.name });
for (const c of COVERS) {
try {
const i = parseInt(c.id, 10) - 1;
const node = figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">' + c.svg() + '</svg>');
node.name = c.id + ' — ' + c.name;
node.x = (i % 5) * 1020;
node.y = 420 + Math.floor(i / 5) * 1440;
node.fills = [{ type: 'SOLID', color: hex(c.bg) }];
node.clipsContent = true;
const fonts = {};
for (const t of node.findAllWithCriteria({ types: ['TEXT'] })) { const f = t.fontName; const k = f === figma.mixed ? 'mixed' : f.family + ' / ' + f.style; fonts[k] = (fonts[k] || 0) + 1; }
made.push({ id: node.id, name: node.name, nodes: node.findAll().length, fonts });
await node.screenshot({ scale: 0.42 });
} catch (e) { errors.push(c.id + ': ' + e.message); }
}
return { made, errors };