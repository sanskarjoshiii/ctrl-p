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
COVERS.push({ id: '06', slug: 'japan', name: 'Japan', bg: '#F3EAD7', svg() {
const washi = '#F3EAD7', indigo = '#233058', indigoL = '#3A4B80', red = '#D8412F', snow = '#FBF7EE', pink = '#F5B7C5', pinkD = '#E0849B',
branch = '#3A2A2A', gold = '#E2B04A', ink = '#1D1D22';
const R = rng(9);
let s = `<rect width="900" height="1200" fill="${washi}"/>`;
s += txt(450, 250, 'JAPAN', { font: 'Rampart One', size: 176, fill: indigo, ls: 8 });
s += txt(450, 330, 'こんにちは', { font: 'Yomogi', size: 50, fill: red, ls: 6 });
s += `<circle cx="450" cy="660" r="236" fill="${red}"/>`;
const kumo = (x, y, w) => `<rect x="${x}" y="${y}" width="${w}" height="30" rx="15" fill="${washi}"/><path d="M${x + 15} ${y + 15} a10 10 0 1 1 10 10" fill="none" stroke="${red}" stroke-width="4" stroke-linecap="round" opacity="0.7"/>`;
s += kumo(254, 566, 200) + kumo(304, 526, 116) + kumo(498, 694, 172) + kumo(566, 734, 100);
const fuji = 'M-40 1000 C160 930 320 720 398 640 Q450 628 502 640 C580 720 740 930 940 1000 Z';
s += `<defs><clipPath id="jp-fuji"><path d="${fuji}"/></clipPath></defs><path d="${fuji}" fill="${indigo}"/><g clip-path="url(#jp-fuji)">`;
s += `<path d="M482 626 L600 600 C660 760 780 920 960 1010 L700 1010 C620 880 530 760 482 626 Z" fill="${indigoL}" opacity="0.6"/>`;
s += `<path d="M300 600 H600 V712 L574 738 L552 716 L528 748 L504 718 L480 752 L456 720 L430 750 L406 716 L382 744 L360 716 L300 730 Z" fill="${snow}"/>`;
s += `<path d="M482 626 L500 600 H600 V712 L574 738 L552 716 L528 748 L520 738 C508 704 494 664 482 626 Z" fill="#DDE4EF"/></g>`;
const top = 930, bottom = 1120, rowH = 24, colW = 76, rr = 38;
s += `<defs><clipPath id="jp-sea"><rect y="${top}" width="900" height="${bottom - top}"/></clipPath></defs><g clip-path="url(#jp-sea)"><rect y="${top}" width="900" height="${bottom - top}" fill="${indigo}"/>`;
const circ = (cx, cy, r) => `M${r1(cx - r)} ${r1(cy)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
for (let row = 0; row * rowH < bottom - top + rr; row++) {
const cy = top + row * rowH, off = row % 2 ? colW / 2 : 0;
const rings = [[rr, indigo], [rr - 6, washi], [rr - 12, indigo], [rr - 18, washi], [rr - 24, indigo], [rr - 30, washi]];
for (const [r, c] of rings) { let d = ''; for (let x = -colW + off; x < 900 + colW; x += colW) d += circ(x, cy, r); s += `<path d="${d}" fill="${c}"/>`; }
}
s += `</g>`;
const tx = 208, ty = 770;
s += `<rect x="${tx - 62}" y="${ty + 30}" width="16" height="200" fill="${red}"/><rect x="${tx + 46}" y="${ty + 30}" width="16" height="200" fill="${red}"/>`;
s += `<rect x="${tx - 82}" y="${ty + 52}" width="164" height="14" fill="${red}"/><rect x="${tx - 6}" y="${ty + 20}" width="12" height="34" fill="${red}"/>`;
s += `<path d="M${tx - 104} ${ty + 4} Q${tx} ${ty + 22} ${tx + 104} ${ty + 4} L${tx + 96} ${ty + 22} Q${tx} ${ty + 36} ${tx - 96} ${ty + 22} Z" fill="${ink}"/>`;
s += `<path d="M${tx - 94} ${ty + 22} Q${tx} ${ty + 36} ${tx + 94} ${ty + 22} L${tx + 88} ${ty + 34} Q${tx} ${ty + 46} ${tx - 88} ${ty + 34} Z" fill="${red}"/>`;
s += `<path d="M920 420 C840 440 780 470 720 520 C690 545 660 560 620 566 M780 470 C770 430 740 410 700 404 M720 520 C724 560 712 590 690 610" fill="none" stroke="${branch}" stroke-width="8" stroke-linecap="round"/>`;
const bloom = (x, y, k, rot) => {
let o = `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${k})">`;
for (let i = 0; i < 5; i++) o += `<path d="M0 0 C-12 -10 -14 -26 -6 -34 L0 -28 L6 -34 C14 -26 12 -10 0 0Z" fill="${pink}" transform="rotate(${i * 72})"/>`;
return o + `<circle r="6" fill="${pinkD}"/><circle r="2.5" fill="${gold}"/></g>`;
};
for (const [x, y, k, a] of [[860, 436, 1, 10], [790, 452, 0.9, 40], [700, 404, 1.05, -20], [742, 500, 0.8, 5], [640, 560, 1, 30], [690, 612, 0.85, 60], [820, 400, 0.6, 0], [600, 540, 0.55, 15], [900, 470, 0.7, 20]]) s += bloom(x, y, k, a);
for (const [x, y] of [[560, 640], [520, 700], [590, 760]]) s += `<path d="M${x} ${y} c-8 -6 -8 -16 0 -20 c8 4 8 14 0 20Z" fill="${pink}" transform="rotate(${r1(R() * 90)} ${x} ${y})"/>`;
s += `<rect x="92" y="400" width="72" height="136" rx="8" fill="${red}"/><rect x="100" y="408" width="56" height="120" rx="4" fill="none" stroke="${washi}" stroke-width="2"/>`;
s += txt(128, 460, '日', { font: 'Noto Serif JP', weight: 900, size: 44, fill: washi }) + txt(128, 512, '本', { font: 'Noto Serif JP', weight: 900, size: 44, fill: washi });
s += `<rect y="1120" width="900" height="80" fill="${washi}"/>`;
s += stamp(760, 1000, 12, indigo, 'TOKYO', 'JP', '2026', 84, washi);
s += footer('06', '35.6762° N · 139.6503° E', indigo);
return s;
} });
COVERS.push({ id: '07', slug: 'thailand', name: 'Thailand', bg: '#FCE3BC', svg() {
const sky = '#FCE3BC', sunC = '#F8AF33', sunL = '#FAC869', magenta = '#C4205E', far = '#A8CBB1', mid = '#5F9E78', front = '#2E7657', jungle = '#23603F',
sea = '#23AFB3', seaL = '#86DAD2', seaD = '#15878E', wood = '#8A4A28', woodL = '#B56C3C', woodD = '#5C301A', blue = '#2F6FB4',
pink = '#E8457E', yellow = '#F7C23B', orange = '#F08A2C', cream = '#FFF7EA', leaf = '#2F7A4E', leafL = '#4E9B61', ink = '#253238';
const R = rng(17);
let s = `<rect width="900" height="1200" fill="${sky}"/>`;
s += `<circle cx="596" cy="560" r="150" fill="${sunL}"/><circle cx="596" cy="560" r="112" fill="${sunC}"/>`;
const karst = (x, base, w, h, col, lean = 0) => {
const t = base - h;
return `<path d="M${r1(x - w / 2)} ${base}C${r1(x - w * 0.62)} ${r1(base - h * 0.45)} ${r1(x - w * 0.52 + lean)} ${r1(t + h * 0.12)} ${r1(x - w * 0.18 + lean)} ${r1(t + 4)}C${r1(x - w * 0.05 + lean)} ${r1(t - 8)} ${r1(x + w * 0.2 + lean)} ${r1(t - 6)} ${r1(x + w * 0.34 + lean)} ${r1(t + 14)}C${r1(x + w * 0.56 + lean)} ${r1(t + h * 0.25)} ${r1(x + w * 0.58)} ${r1(base - h * 0.4)} ${r1(x + w / 2)} ${base}Z" fill="${col}"/>`;
};
s += karst(300, 780, 170, 250, far, -10) + karst(420, 780, 120, 170, far, 8) + karst(760, 780, 150, 220, far, 10);
s += karst(110, 800, 260, 420, mid, 20) + karst(810, 800, 220, 360, mid, -20);
let bumps = '';
const bump = (x, y, r) => `M${r1(x - r)} ${r1(y)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
for (let i = 0; i < 10; i++) bumps += bump(40 + i * 16 + R() * 6, 396 + Math.abs(i - 5) * 6 + R() * 6, 14 + R() * 8);
for (let i = 0; i < 9; i++) bumps += bump(740 + i * 16 + R() * 6, 452 + Math.abs(i - 4) * 6 + R() * 6, 13 + R() * 7);
s += `<path d="${bumps}" fill="${front}"/>`;
let vines = '';
for (let i = 0; i < 7; i++) { const x = 30 + i * 30 + R() * 10; vines += `M${r1(x)} ${410 + R() * 20}v${r1(40 + R() * 90)}`; }
for (let i = 0; i < 6; i++) { const x = 740 + i * 26 + R() * 10; vines += `M${r1(x)} ${462 + R() * 20}v${r1(40 + R() * 80)}`; }
s += `<path d="${vines}" stroke="${front}" stroke-width="7" stroke-linecap="round"/>`;
s += `<path d="M150 560 C160 640 150 720 162 790 M200 520 C214 600 206 700 220 790 M770 600 C760 680 772 740 764 800 M840 560 C850 640 842 720 852 800" fill="none" stroke="${jungle}" stroke-width="5" stroke-linecap="round" opacity="0.3"/>`;
s += karst(-10, 820, 170, 300, jungle, 30) + karst(930, 820, 160, 260, jungle, -30);
s += `<rect y="790" width="900" height="410" fill="${sea}"/><rect y="790" width="900" height="14" fill="${seaL}" opacity="0.6"/>`;
let rip = '';
for (let i = 0; i < 40; i++) { const x = R() * 860, y = 816 + R() * 290, w = 20 + R() * 46; rip += `M${r1(x)} ${r1(y)}h${r1(w)}`; }
s += `<path d="${rip}" stroke="${seaL}" stroke-width="4" stroke-linecap="round" opacity="0.8"/>`;
s += `<path d="M560 804h72M540 830h112M570 856h52" stroke="${sunL}" stroke-width="6" stroke-linecap="round" opacity="0.9"/>`;
const hull = 'M150 812 C176 846 200 900 262 944 C360 986 560 986 742 952 L752 918 C600 934 420 936 300 914 C236 896 196 860 150 812 Z';
s += `<path d="M230 990 Q480 1010 740 980" stroke="${seaD}" stroke-width="12" stroke-linecap="round" fill="none" opacity="0.5"/>`;
s += `<path d="M300 904 L302 836 M660 916 L656 846" stroke="${woodD}" stroke-width="7"/>`;
s += `<path d="M276 836 Q480 800 684 844 L688 868 Q480 830 274 860 Z" fill="${blue}"/>`;
let fringe = '';
for (let i = 0; i < 16; i++) { const t = i / 15, x = 280 + t * 402, y = (1 - t) * (1 - t) * 860 + 2 * (1 - t) * t * 830 + t * t * 868 - 1; fringe += `M${r1(x - 10)} ${r1(y)}L${r1(x + 10)} ${r1(y)}L${r1(x)} ${r1(y + 14)}Z`; }
s += `<path d="${fringe}" fill="${yellow}"/>`;
s += `<path d="${hull}" fill="${wood}"/><path d="M150 812 C196 860 236 896 300 914 C420 936 600 934 752 918 L748 932 C600 948 420 950 296 928 C226 906 186 870 150 812Z" fill="${woodL}"/>`;
s += `<path d="M232 922 C330 962 560 966 740 940" fill="none" stroke="${blue}" stroke-width="8"/>`;
s += `<path d="M752 916 L806 912 L812 940 L760 950 Z" fill="${ink}"/><path d="M806 926 L880 1080" stroke="${ink}" stroke-width="6" stroke-linecap="round"/><path d="M866 1070 l28 8 l-4 14 l-28 -8Z" fill="${ink}"/>`;
const ribbons = [[pink, 0], [yellow, 1], [orange, 2], [blue, 3], [pink, 4]];
for (const [c, i] of ribbons) s += `<path d="M${156 + i * 5} ${822 + i * 7} q${-12 + i * 4} 40 ${-4 + i * 6} ${70 + i * 6} l12 -2 q${-4} -34 ${6 + i * 2} ${-66 - i * 6}Z" fill="${c}"/>`;
let gar = '';
for (let i = 0; i < 9; i++) gar += bump(148 + i * 5.2, 816 + i * 6.8, 6);
s += `<path d="${gar}" fill="${yellow}"/><circle cx="150" cy="812" r="8" fill="${pink}"/>`;
const fr = (x, y, k, rot) => {
let o = `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${k})">`;
for (let i = 0; i < 5; i++) o += `<path d="M0 0 C-30 -8 -40 -44 -18 -60 C2 -66 14 -40 0 0Z" fill="${cream}" transform="rotate(${i * 72})"/>`;
for (let i = 0; i < 5; i++) o += `<path d="M0 0 C-10 -4 -14 -18 -8 -26 C-2 -18 2 -8 0 0Z" fill="${yellow}" transform="rotate(${i * 72})"/>`;
return o + `</g>`;
};
const lf = (x, y, rot, k) => `<path d="M0 0 C40 -30 120 -30 170 0 C120 30 40 30 0 0Z" fill="${leaf}" transform="translate(${x} ${y}) rotate(${rot}) scale(${k})"/><path d="M0 0 H160" stroke="${leafL}" stroke-width="3" transform="translate(${x} ${y}) rotate(${rot}) scale(${k})"/>`;
s += `<rect y="1128" width="900" height="72" fill="${sky}"/>`;
s += lf(904, 1090, -158, 1) + lf(904, 1112, 172, 0.9) + lf(904, 1010, -128, 0.8);
s += fr(812, 1046, 0.92, 10) + fr(712, 1082, 0.7, 50) + fr(868, 942, 0.66, -20);
s += lf(-4, 1070, -24, 0.86) + fr(76, 1062, 0.64, 30);
s += txt(455, 262, 'Thailand', { font: 'Chonburi', size: 150, fill: sunC });
s += txt(450, 256, 'Thailand', { font: 'Chonburi', size: 150, fill: magenta });
s += txt(290, 388, 'สวัสดี', { font: 'Mali', weight: 700, size: 64, fill: front, rot: -8 });
s += stamp(772, 356, 10, magenta, 'BANGKOK', 'TH', '2026', 78, sky);
s += footer('07', '13.7563° N · 100.5018° E', magenta);
return s;
} });
const USA_GLYPHS = {"U": {"d": "M205.1 703.4Q163.3 703.4 134.2 688.9Q105.1 674.4 89.9 642.9Q74.6 611.5 74.6 560.6V495.5L50.0 490.7V408.3H188.7V490.7L164.1 495.5V556.8Q164.1 584.3 172.5 598.0Q180.9 611.7 204.0 611.7Q227.0 611.7 235.4 598.0Q243.8 584.3 243.8 556.8V495.5L219.2 490.7V408.3H343.4V490.7L318.8 495.5V560.6Q318.8 631.1 290.4 667.2Q261.9 703.4 205.1 703.4Z", "x0": 50.0, "x1": 343.4, "top": 408.3, "bot": 703.4}, "S": {"d": "M463.9 703.4Q434.9 703.4 410.4 698.8Q385.9 694.1 365.5 681.2V606.2H412.3Q418.9 617.2 428.4 625.0Q438.0 632.8 451.6 632.8Q462.5 632.8 467.0 625.6Q471.5 618.5 471.5 604.7Q450.5 602.4 431.1 596.7Q411.7 591.0 396.4 579.9Q381.2 568.8 372.3 550.2Q363.4 531.7 363.4 503.8Q363.4 466.4 377.1 444.9Q390.7 423.5 414.6 414.4Q438.5 405.2 469.1 405.2Q499.5 405.2 522.9 410.9Q546.2 416.6 566.0 427.8V501.9H519.1Q512.9 491.1 503.7 483.2Q494.5 475.3 481.4 475.3Q470.5 475.3 465.7 483.4Q460.9 491.5 460.9 505.5Q484.7 506.5 504.9 511.6Q525.0 516.7 539.9 528.2Q554.8 539.7 562.9 559.2Q571.1 578.6 571.1 608.5Q571.1 635.6 562.9 653.9Q554.6 672.3 540.0 683.1Q525.3 693.9 505.9 698.7Q486.4 703.4 463.9 703.4Z", "x0": 363.4, "x1": 571.1, "top": 405.2, "bot": 703.4}, "A": {"d": "M591.1 700.0V604.3L610.3 599.5L656.2 408.3H784.8L830.9 599.5L850.0 604.3V700.0H761.4L753.0 651.0H687.9L679.7 700.0ZM701.3 585.9H739.6L720.5 475.9Z", "x0": 591.1, "x1": 850.0, "top": 408.3, "bot": 700.0}};
COVERS.push({ id: '08', slug: 'usa', name: 'USA', bg: '#F5EAD5', svg() {
const cream = '#F5EAD5', ray = '#EDDABA', navy = '#1E2B55', navyL = '#2E3F74', red = '#D5373F', redD = '#A92630', yellow = '#F6C543',
orange = '#F2913B', sky = '#8FCBE0', skyL = '#B8E0EC', sea = '#2E6DB4', bridge = '#D9482F', hill = '#6D8F5A', mint = '#6FBFA2', mintD = '#4E9E84',
terra = '#C4643A', terraL = '#DB7C4B', sand = '#EBA86A', cactus = '#3F7D4A';
let s = `<rect width="900" height="1200" fill="${cream}"/>`;
let rays = '';
const C = [450, 560];
for (let i = 0; i < 36; i += 2) {
const a0 = i * Math.PI / 18, a1 = (i + 1) * Math.PI / 18;
rays += `M${C[0]} ${C[1]}L${r1(C[0] + 1400 * Math.cos(a0))} ${r1(C[1] + 1400 * Math.sin(a0))}L${r1(C[0] + 1400 * Math.cos(a1))} ${r1(C[1] + 1400 * Math.sin(a1))}Z`;
}
s += `<defs><clipPath id="us-page"><rect width="900" height="1200"/></clipPath></defs><g clip-path="url(#us-page)"><path d="${rays}" fill="${ray}"/></g>`;
s += `<rect width="900" height="92" fill="${navy}"/>`;
for (let i = 0; i < 15; i++) s += star(30 + i * 60, 48, 13, cream, 0.42);
s += txt(450, 334, 'Greetings from the', { font: 'Yellowtail', size: 86, fill: red, rot: -3 });
const G = USA_GLYPHS;
for (const ch of 'USA') for (let i = 12; i >= 1; i--) s += `<path d="${G[ch].d}" fill="${i > 10 ? '#141D3D' : navy}" transform="translate(${i * 1.6} ${i * 1.6})"/>`;
const scene = (ch, body) => `<defs><clipPath id="us-${ch}"><path d="${G[ch].d}"/></clipPath></defs><g clip-path="url(#us-${ch})">${body}</g>`;
let u = `<rect x="40" y="400" width="320" height="310" fill="${orange}"/><rect x="40" y="400" width="320" height="90" fill="${yellow}" opacity="0.7"/>`;
u += `<circle cx="196" cy="560" r="56" fill="${yellow}"/><path d="M40 610 C120 590 250 600 360 580 V720 H40Z" fill="${hill}"/><rect x="40" y="628" width="320" height="90" fill="${sea}"/>`;
u += `<path d="M40 540 Q110 610 128 470 Q196 620 262 470 Q280 610 360 540" fill="none" stroke="${bridge}" stroke-width="4"/>`;
u += `<rect x="120" y="462" width="16" height="190" fill="${bridge}"/><rect x="254" y="462" width="16" height="190" fill="${bridge}"/>`;
u += `<rect x="116" y="500" width="24" height="6" fill="${bridge}"/><rect x="250" y="500" width="24" height="6" fill="${bridge}"/><rect x="40" y="606" width="320" height="10" fill="${redD}"/>`;
s += scene('U', u);
let n = `<rect x="355" y="400" width="225" height="310" fill="${sky}"/><circle cx="420" cy="470" r="26" fill="${skyL}"/>`;
const blds = [[360, 590, 30], [388, 560, 26], [412, 520, 22], [434, 600, 30], [500, 540, 26], [526, 575, 24], [548, 520, 30]];
for (const [x, t, w] of blds) n += `<rect x="${x}" y="${t}" width="${w}" height="${710 - t}" fill="${navyL}"/>`;
n += `<path d="M412 520 l4 -22 h14 l4 22Z M421 498 v-24 h4 v24Z" fill="${navyL}"/>`;
n += `<rect x="440" y="662" width="54" height="46" fill="${mintD}"/><rect x="432" y="654" width="70" height="10" fill="${mintD}"/>`;
n += `<path d="M448 654 L452 590 Q458 566 468 566 Q480 566 484 590 L488 654Z" fill="${mint}"/>`;
n += `<circle cx="468" cy="552" r="10" fill="${mint}"/><path d="M458 546 l-9 -9 M463 541 l-4 -12 M468 540 v-13 M473 541 l4 -12 M478 546 l9 -9" stroke="${mint}" stroke-width="3" stroke-linecap="round"/>`;
n += `<path d="M460 580 L444 520 L452 516 L470 572Z" fill="${mint}"/><rect x="438" y="504" width="12" height="16" fill="${mintD}"/><path d="M444 504 q-10 -12 0 -26 q10 14 0 26Z" fill="${yellow}"/>`;
n += `<rect x="478" y="584" width="16" height="22" fill="${mintD}" transform="rotate(-12 486 595)"/>`;
s += scene('S', n);
let a = `<rect x="585" y="400" width="270" height="310" fill="${yellow}"/><rect x="585" y="520" width="270" height="190" fill="${orange}" opacity="0.55"/>`;
a += `<path d="M640 640 V586 h14 v-26 h40 v26 h12 V640Z M740 640 V560 h10 v-40 h26 v40 h8 V640Z" fill="${terra}"/><path d="M800 640 V600 h30 V640Z" fill="${terraL}"/>`;
a += `<rect x="585" y="632" width="270" height="80" fill="${sand}"/>`;
a += `<path d="M700 700 V612 a10 10 0 0 1 20 0 V700Z M700 662 h-20 v-24 a7 7 0 0 1 14 0 v14 h6Z M720 650 h18 v-30 a7 7 0 0 0 -14 0 v22 h-4Z" fill="${cactus}"/>`;
s += scene('A', a);
for (const ch of 'USA') s += `<path d="${G[ch].d}" fill="none" stroke="${cream}" stroke-width="7" stroke-linejoin="round"/>`;
s += `<path d="M96 780 L170 780 L170 846 L96 846 L124 813Z" fill="${redD}"/><path d="M804 780 L730 780 L730 846 L804 846 L776 813Z" fill="${redD}"/>`;
s += `<path d="M150 768 H750 V834 H150Z" fill="${red}"/><path d="M150 834 L170 846 V834Z M750 834 L730 846 V834Z" fill="#6E1A20"/>`;
s += txt(450, 812, 'COAST TO COAST', { font: 'Courier Prime', weight: 700, size: 32, ls: 7, fill: cream });
const sh = 'M372 890 H528 C526 904 530 918 540 928 C562 956 556 1010 524 1040 C502 1060 474 1070 450 1082 C426 1070 398 1060 376 1040 C344 1010 338 956 360 928 C370 918 374 904 372 890Z';
s += `<path d="${sh}" fill="${cream}" stroke="${navy}" stroke-width="9" stroke-linejoin="round"/><path d="M362 934 H538" stroke="${navy}" stroke-width="5"/>`;
s += txt(450, 924, 'ROUTE', { font: 'Courier Prime', weight: 700, size: 22, ls: 5, fill: navy });
s += txt(450, 1040, '66', { font: 'Holtwood One SC', size: 74, fill: navy });
s += `<rect y="1102" width="900" height="16" fill="${red}"/><rect y="1118" width="900" height="10" fill="${cream}"/><rect y="1128" width="900" height="10" fill="${red}"/>`;
s += txt(710, 1000, 'wish you were', { font: 'Caveat Brush', size: 52, fill: red, rot: -7 }) + txt(724, 1052, 'here!', { font: 'Caveat Brush', size: 52, fill: red, rot: -7 });
s += stamp(190, 980, -10, navy, 'NEW YORK', 'US', '2026', 84, cream);
s += footer('08', '38.9072° N · 77.0369° W', navy);
return s;
} });
COVERS.push({ id: '09', slug: 'uk', name: 'United Kingdom', bg: '#CFE0EA', svg() {
const sky = '#CFE0EA', cloud = '#EEF4F7', cream = '#F7F0E4', navy = '#1B2550', red = '#D22B35', redD = '#A51E28', gold = '#E2B24A',
stone = '#DDC494', stoneD = '#C2A571', slate = '#4B5563', far = '#AEC2D1', black = '#16161B', skin = '#F2C7A1', cheek = '#EE9C8E',
glass = '#2C3655', road = '#8E99A6', roadD = '#6F7A87', white = '#FFFFFF';
const R = rng(13);
let s = `<rect width="900" height="1200" fill="${sky}"/>`;
s += `<path d="M-10 18 Q450 96 910 18" fill="none" stroke="${navy}" stroke-width="3"/>`;
const cols = [red, white, navy];
for (let i = 0; i < 17; i++) {
const x = 10 + i * 54, t = x / 900, y = (1 - t) * (1 - t) * 18 + 2 * (1 - t) * t * 96 + t * t * 18 - 2;
s += `<path d="M${r1(x)} ${r1(y)} L${r1(x + 44)} ${r1(y + 2)} L${r1(x + 22)} ${r1(y + 54)}Z" fill="${cols[i % 3]}"/>`;
}
s += txt(461, 188, 'UNITED', { font: 'Alfa Slab One', size: 76, fill: red, ls: 22 });
s += txt(455, 332, 'KINGDOM', { font: 'Alfa Slab One', size: 138, fill: red });
s += txt(450, 326, 'KINGDOM', { font: 'Alfa Slab One', size: 138, fill: navy });
const cl = (x, y, k) => `<path d="M${x} ${y} h${170 * k} a${24 * k} ${24 * k} 0 0 0 -${30 * k} -${34 * k} a${34 * k} ${34 * k} 0 0 0 -${60 * k} -${18 * k} a${28 * k} ${28 * k} 0 0 0 -${60 * k} ${14 * k} a${20 * k} ${20 * k} 0 0 0 -${20 * k} ${38 * k}Z" fill="${cloud}"/>`;
s += cl(80, 470, 1) + cl(690, 430, 0.8);
let sk = `M0 1000 V860 H40 V820 H70 V860 H96 V800 Q140 730 184 800 V860 H220 V840 H260 V1000Z`;
sk += `M600 1000 V820 Q640 700 680 820 V1000Z M720 1000 L790 640 L860 1000Z M300 1000 V880 H340 V850 H380 V1000Z`;
s += `<path d="${sk}" fill="${far}"/><path d="M137 730 v-26 h6 v26Z" fill="${far}"/>`;
const bx = 520;
s += `<rect x="${bx - 50}" y="700" width="100" height="380" fill="${stone}"/>`;
for (let x = bx - 38; x < bx + 40; x += 19) s += `<rect x="${x}" y="712" width="6" height="360" fill="${stoneD}"/>`;
for (let y = 760; y < 1060; y += 60) s += `<rect x="${bx - 50}" y="${y}" width="100" height="5" fill="${stoneD}"/>`;
s += `<rect x="${bx - 64}" y="584" width="128" height="122" fill="${stone}"/><rect x="${bx - 64}" y="584" width="128" height="10" fill="${stoneD}"/><rect x="${bx - 64}" y="696" width="128" height="10" fill="${stoneD}"/>`;
s += `<circle cx="${bx}" cy="645" r="48" fill="${gold}"/><circle cx="${bx}" cy="645" r="41" fill="${cream}"/>`;
let ticks = '';
for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; ticks += `M${r1(bx + 33 * Math.cos(a))} ${r1(645 + 33 * Math.sin(a))}L${r1(bx + 39 * Math.cos(a))} ${r1(645 + 39 * Math.sin(a))}`; }
s += `<path d="${ticks}" stroke="${navy}" stroke-width="3"/><path d="M${bx} 645 L${bx - 18} 628 M${bx} 645 L${bx + 24} 626" stroke="${navy}" stroke-width="5" stroke-linecap="round"/><circle cx="${bx}" cy="645" r="4" fill="${navy}"/>`;
s += `<rect x="${bx - 54}" y="534" width="108" height="52" fill="${stone}"/>`;
for (let x = bx - 42; x < bx + 40; x += 28) s += `<path d="M${x} 580 V556 a8 8 0 0 1 16 0 V580Z" fill="${glass}"/>`;
s += `<path d="M${bx - 58} 536 L${bx} 430 L${bx + 58} 536Z" fill="${slate}"/><path d="M${bx - 34} 494 H${bx + 34}" stroke="${gold}" stroke-width="5"/><path d="M${bx - 16} 462 H${bx + 16}" stroke="${gold}" stroke-width="4"/>`;
s += `<path d="M${bx} 430 V388" stroke="${slate}" stroke-width="5"/><circle cx="${bx}" cy="392" r="5" fill="${gold}"/>`;
for (const dx of [-64, 56]) s += `<path d="M${bx + dx} 586 L${bx + dx + 4} 548 L${bx + dx + 8} 586Z" fill="${slate}"/>`;
const bu = 596, bt = 846;
s += `<rect x="${bu}" y="${bt}" width="340" height="222" rx="26" fill="${red}"/><rect x="${bu}" y="${bt + 104}" width="340" height="14" fill="${cream}"/>`;
for (let i = 0; i < 4; i++) s += `<rect x="${bu + 70 + i * 66}" y="${bt + 26}" width="54" height="56" rx="8" fill="${glass}"/><rect x="${bu + 70 + i * 66}" y="${bt + 138}" width="54" height="50" rx="8" fill="${glass}"/>`;
s += `<rect x="${bu + 12}" y="${bt + 26}" width="46" height="56" rx="10" fill="${glass}"/><rect x="${bu + 12}" y="${bt + 134}" width="40" height="84" rx="6" fill="${glass}"/>`;
s += `<rect x="${bu + 14}" y="${bt + 90}" width="44" height="10" fill="${black}"/><rect x="${bu}" y="${bt + 196}" width="340" height="26" fill="${redD}"/>`;
s += `<circle cx="${bu + 90}" cy="${bt + 222}" r="30" fill="${black}"/><circle cx="${bu + 90}" cy="${bt + 222}" r="12" fill="${road}"/><circle cx="${bu + 262}" cy="${bt + 222}" r="30" fill="${black}"/><circle cx="${bu + 262}" cy="${bt + 222}" r="12" fill="${road}"/>`;
s += `<circle cx="${bu + 8}" cy="${bt + 184}" r="7" fill="${gold}"/>`;
s += `<rect y="1080" width="900" height="120" fill="${road}"/><rect y="1080" width="900" height="10" fill="${roadD}"/>`;
const gx = 214;
s += `<path d="M${gx - 46} 1076 h40 v-14 a14 14 0 0 0 -14 -14 h-12 a14 14 0 0 0 -14 14Z M${gx + 6} 1076 h40 v-14 a14 14 0 0 0 -14 -14 h-12 a14 14 0 0 0 -14 14Z" fill="${black}"/>`;
s += `<rect x="${gx - 46}" y="880" width="44" height="170" fill="${navy}"/><rect x="${gx + 2}" y="880" width="44" height="170" fill="${navy}"/>`;
s += `<rect x="${gx - 46}" y="880" width="8" height="170" fill="${red}"/><rect x="${gx + 38}" y="880" width="8" height="170" fill="${red}"/>`;
s += `<path d="M${gx - 70} 700 Q${gx} 680 ${gx + 70} 700 L${gx + 74} 890 H${gx - 74}Z" fill="${red}"/>`;
s += `<path d="M${gx - 70} 700 Q${gx - 92} 720 ${gx - 92} 760 L${gx - 88} 876 H${gx - 62} L${gx - 58} 730Z M${gx + 70} 700 Q${gx + 92} 720 ${gx + 92} 760 L${gx + 88} 876 H${gx + 62} L${gx + 58} 730Z" fill="${redD}"/>`;
s += `<circle cx="${gx - 76}" cy="886" r="16" fill="${white}"/><circle cx="${gx + 76}" cy="886" r="16" fill="${white}"/>`;
s += `<rect x="${gx - 74}" y="836" width="148" height="20" fill="${white}"/><rect x="${gx - 14}" y="834" width="28" height="24" rx="3" fill="${gold}"/>`;
s += `<path d="M${gx - 70} 700 Q${gx - 60} 690 ${gx - 40} 694 L${gx - 44} 712 L${gx - 74} 718Z M${gx + 70} 700 Q${gx + 60} 690 ${gx + 40} 694 L${gx + 44} 712 L${gx + 74} 718Z" fill="${gold}"/>`;
for (const y of [724, 744, 776, 796, 870]) s += `<circle cx="${gx}" cy="${y}" r="5.5" fill="${gold}"/>`;
s += `<rect x="${gx - 30}" y="682" width="60" height="22" rx="4" fill="${navy}"/><rect x="${gx - 30}" y="696" width="60" height="4" fill="${gold}"/>`;
s += `<ellipse cx="${gx}" cy="650" rx="40" ry="38" fill="${skin}"/><circle cx="${gx - 22}" cy="662" r="8" fill="${cheek}" opacity="0.7"/><circle cx="${gx + 22}" cy="662" r="8" fill="${cheek}" opacity="0.7"/>`;
s += `<path d="M${gx - 10} 676 q10 6 20 0" fill="none" stroke="#8A4B3A" stroke-width="3" stroke-linecap="round"/>`;
s += `<path d="M${gx - 62} 636 C${gx - 80} 540 ${gx - 60} 452 ${gx} 446 C${gx + 60} 452 ${gx + 80} 540 ${gx + 62} 636 C${gx + 30} 646 ${gx - 30} 646 ${gx - 62} 636Z" fill="${black}"/>`;
s += `<path d="M${gx - 34} 480 C${gx - 50} 520 ${gx - 52} 570 ${gx - 44} 610" fill="none" stroke="#34343C" stroke-width="6" stroke-linecap="round"/>`;
s += `<path d="M${gx - 40} 640 Q${gx} 710 ${gx + 40} 640" fill="none" stroke="${gold}" stroke-width="5"/>`;
s += `<path d="M${gx + 62} 596 C${gx + 86} 570 ${gx + 84} 530 ${gx + 64} 510 C${gx + 70} 540 ${gx + 66} 570 ${gx + 58} 590Z" fill="${red}"/>`;
s += txt(706, 470, 'cheers, love!', { font: 'Caveat Brush', size: 62, fill: red, rot: -8 });
s += stamp(790, 646, 12, red, 'LONDON', 'GB', '2026', 76, cream);
s += footer('09', '51.5072° N · 0.1276° W', cream);
return s;
} });
COVERS.push({ id: '10', slug: 'mexico', name: 'México', bg: '#E4217A', svg() {
const rosa = '#E4217A', rosaD = '#B5155E', yellow = '#FFCB3D', orange = '#FF7E2B', marigold = '#FFA11C', teal = '#16A39B', purple = '#6A3D9E',
green = '#2F8A55', greenL = '#55B56D', greenD = '#1F6B40', stone = '#F2C48D', stoneD = '#DA9C60', stoneDD = '#B97B44', sky = '#FFD76E', skyR = '#FFC94A',
sunC = '#FF9A3C', cream = '#FFF4E2', terra = '#C4513A', terraD = '#A8412E', fruit = '#F2508C';
const R = rng(4);
let s = `<rect width="900" height="1200" fill="${rosa}"/>`;
const circ = (cx, cy, r) => `M${r1(cx - r)} ${r1(cy)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
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
const M = [450, 800], MR = 300;
s += `<defs><clipPath id="mx-med"><path d="M${M[0] - MR} 990 V${M[1]} A${MR} ${MR} 0 0 1 ${M[0] + MR} ${M[1]} V990Z"/></clipPath></defs><g clip-path="url(#mx-med)">`;
s += `<rect x="140" y="490" width="620" height="520" fill="${sky}"/>`;
let rays = '';
for (let i = 0; i < 24; i += 2) { const a0 = Math.PI + i * Math.PI / 24, a1 = a0 + Math.PI / 24; rays += `M450 640L${r1(450 + 600 * Math.cos(a0))} ${r1(640 + 600 * Math.sin(a0))}L${r1(450 + 600 * Math.cos(a1))} ${r1(640 + 600 * Math.sin(a1))}Z`; }
s += `<path d="${rays}" fill="${skyR}"/><circle cx="450" cy="652" r="124" fill="${sunC}"/>`;
s += `</g>`;
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
s += `<path d="M0 980 H900 V1200 H0Z" fill="${terra}"/><rect y="980" width="900" height="14" fill="${terraD}"/>`;
let pebbles = '';
for (let i = 0; i < 40; i++) pebbles += circ(R() * 900, 1010 + R() * 110, 2 + R() * 3);
s += `<path d="${pebbles}" fill="${terraD}"/>`;
let spines = '';
const pad = (x, y, rx, ry, a, c) => {
const ca = Math.cos(a * Math.PI / 180), sa = Math.sin(a * Math.PI / 180);
for (let i = 0; i < 9; i++) { const t = R() * Math.PI * 2, u = Math.sqrt(R()) * 0.72, px = Math.cos(t) * rx * u, py = Math.sin(t) * ry * u; spines += `M${r1(x + px * ca - py * sa)} ${r1(y + px * sa + py * ca)}l4 -4`; }
return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}" transform="rotate(${a} ${x} ${y})"/>`;
};
s += pad(130, 1010, 62, 86, 0, green) + pad(70, 900, 44, 64, -28, greenL) + pad(196, 890, 42, 60, 24, green) + pad(40, 1080, 50, 70, -10, greenL) + pad(150, 800, 34, 48, 8, greenL) + pad(236, 790, 30, 42, 36, green);
s += `<path d="${spines}" stroke="${cream}" stroke-width="2.5" stroke-linecap="round" opacity="0.8"/>`;
for (const [x, y] of [[150, 748], [236, 744], [44, 834], [104, 842], [250, 836]]) s += `<ellipse cx="${x}" cy="${y}" rx="13" ry="17" fill="${fruit}"/><path d="M${x - 8} ${y - 16} l4 -8 l4 6 l4 -6 l4 8" fill="${fruit}"/>`;
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
const hex = h => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });
const page = figma.currentPage;
page.name = 'Travel Diary Covers';
const made = [], errors = [];

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