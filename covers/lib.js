// Shared helpers for the travel-diary cover series. Canvas: 900 x 1200 (3:4 hardcover).
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
// Series footer: volume number left, capital coordinates right.
const footer = (vol, coords, fill) => mono(60, 1158, `VOL. ${vol} — TRAVEL DIARY`, fill, { anchor: 'start' }) + mono(840, 1158, coords, fill, { anchor: 'end' });
// Circular passport stamp.
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
