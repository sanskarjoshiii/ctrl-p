COVERS.push({ id: '06', slug: 'japan', name: 'Japan', bg: '#F3EAD7', svg() {
  const washi = '#F3EAD7', indigo = '#233058', indigoL = '#3A4B80', red = '#D8412F', snow = '#FBF7EE', pink = '#F5B7C5', pinkD = '#E0849B',
    branch = '#3A2A2A', gold = '#E2B04A', ink = '#1D1D22';
  const R = rng(9);
  let s = `<rect width="900" height="1200" fill="${washi}"/>`;

  // Title + greeting
  s += txt(450, 250, 'JAPAN', { font: 'Rampart One', size: 176, fill: indigo, ls: 8 });
  s += txt(450, 330, 'こんにちは', { font: 'Yomogi', size: 50, fill: red, ls: 6 });

  // Rising sun + kumo clouds
  s += `<circle cx="450" cy="660" r="236" fill="${red}"/>`;
  const kumo = (x, y, w) => `<rect x="${x}" y="${y}" width="${w}" height="30" rx="15" fill="${washi}"/><path d="M${x + 15} ${y + 15} a10 10 0 1 1 10 10" fill="none" stroke="${red}" stroke-width="4" stroke-linecap="round" opacity="0.7"/>`;
  s += kumo(254, 566, 200) + kumo(304, 526, 116) + kumo(498, 694, 172) + kumo(566, 734, 100);

  // Mt Fuji with snow cap (clipped to the silhouette)
  const fuji = 'M-40 1000 C160 930 320 720 398 640 Q450 628 502 640 C580 720 740 930 940 1000 Z';
  s += `<defs><clipPath id="jp-fuji"><path d="${fuji}"/></clipPath></defs><path d="${fuji}" fill="${indigo}"/><g clip-path="url(#jp-fuji)">`;
  s += `<path d="M482 626 L600 600 C660 760 780 920 960 1010 L700 1010 C620 880 530 760 482 626 Z" fill="${indigoL}" opacity="0.6"/>`;
  s += `<path d="M300 600 H600 V712 L574 738 L552 716 L528 748 L504 718 L480 752 L456 720 L430 750 L406 716 L382 744 L360 716 L300 730 Z" fill="${snow}"/>`;
  s += `<path d="M482 626 L500 600 H600 V712 L574 738 L552 716 L528 748 L520 738 C508 704 494 664 482 626 Z" fill="#DDE4EF"/></g>`;

  // Seigaiha waves
  const top = 930, bottom = 1120, rowH = 24, colW = 76, rr = 38;
  s += `<defs><clipPath id="jp-sea"><rect y="${top}" width="900" height="${bottom - top}"/></clipPath></defs><g clip-path="url(#jp-sea)"><rect y="${top}" width="900" height="${bottom - top}" fill="${indigo}"/>`;
  const circ = (cx, cy, r) => `M${r1(cx - r)} ${r1(cy)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
  for (let row = 0; row * rowH < bottom - top + rr; row++) {
    const cy = top + row * rowH, off = row % 2 ? colW / 2 : 0;
    const rings = [[rr, indigo], [rr - 6, washi], [rr - 12, indigo], [rr - 18, washi], [rr - 24, indigo], [rr - 30, washi]];
    for (const [r, c] of rings) { let d = ''; for (let x = -colW + off; x < 900 + colW; x += colW) d += circ(x, cy, r); s += `<path d="${d}" fill="${c}"/>`; }
  }
  s += `</g>`;

  // Torii gate standing in the water
  const tx = 208, ty = 770;
  s += `<rect x="${tx - 62}" y="${ty + 30}" width="16" height="200" fill="${red}"/><rect x="${tx + 46}" y="${ty + 30}" width="16" height="200" fill="${red}"/>`;
  s += `<rect x="${tx - 82}" y="${ty + 52}" width="164" height="14" fill="${red}"/><rect x="${tx - 6}" y="${ty + 20}" width="12" height="34" fill="${red}"/>`;
  s += `<path d="M${tx - 104} ${ty + 4} Q${tx} ${ty + 22} ${tx + 104} ${ty + 4} L${tx + 96} ${ty + 22} Q${tx} ${ty + 36} ${tx - 96} ${ty + 22} Z" fill="${ink}"/>`;
  s += `<path d="M${tx - 94} ${ty + 22} Q${tx} ${ty + 36} ${tx + 94} ${ty + 22} L${tx + 88} ${ty + 34} Q${tx} ${ty + 46} ${tx - 88} ${ty + 34} Z" fill="${red}"/>`;

  // Sakura branch
  s += `<path d="M920 420 C840 440 780 470 720 520 C690 545 660 560 620 566 M780 470 C770 430 740 410 700 404 M720 520 C724 560 712 590 690 610" fill="none" stroke="${branch}" stroke-width="8" stroke-linecap="round"/>`;
  const bloom = (x, y, k, rot) => {
    let o = `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${k})">`;
    for (let i = 0; i < 5; i++) o += `<path d="M0 0 C-12 -10 -14 -26 -6 -34 L0 -28 L6 -34 C14 -26 12 -10 0 0Z" fill="${pink}" transform="rotate(${i * 72})"/>`;
    return o + `<circle r="6" fill="${pinkD}"/><circle r="2.5" fill="${gold}"/></g>`;
  };
  for (const [x, y, k, a] of [[860, 436, 1, 10], [790, 452, 0.9, 40], [700, 404, 1.05, -20], [742, 500, 0.8, 5], [640, 560, 1, 30], [690, 612, 0.85, 60], [820, 400, 0.6, 0], [600, 540, 0.55, 15], [900, 470, 0.7, 20]]) s += bloom(x, y, k, a);
  for (const [x, y] of [[560, 640], [520, 700], [590, 760]]) s += `<path d="M${x} ${y} c-8 -6 -8 -16 0 -20 c8 4 8 14 0 20Z" fill="${pink}" transform="rotate(${r1(R() * 90)} ${x} ${y})"/>`;

  // Hanko seal
  s += `<rect x="92" y="400" width="72" height="136" rx="8" fill="${red}"/><rect x="100" y="408" width="56" height="120" rx="4" fill="none" stroke="${washi}" stroke-width="2"/>`;
  s += txt(128, 460, '日', { font: 'Noto Serif JP', weight: 900, size: 44, fill: washi }) + txt(128, 512, '本', { font: 'Noto Serif JP', weight: 900, size: 44, fill: washi });

  s += `<rect y="1120" width="900" height="80" fill="${washi}"/>`;
  s += stamp(760, 1000, 12, indigo, 'TOKYO', 'JP', '2026', 84, washi);
  s += footer('06', '35.6762° N · 139.6503° E', indigo);
  return s;
} });
