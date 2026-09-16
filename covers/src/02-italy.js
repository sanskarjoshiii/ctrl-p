
COVERS.push({ id: '02', slug: 'italy', name: 'Italy', bg: '#FBF0D6', svg() {
  const paper = '#FBF0D6', cobalt = '#1E4B9C', sea = '#2461B0', seaL = '#5A90D2', sunC = '#F8D57A', mount = '#EACAA4', mountD = '#DFB68D',
    cliff = '#CD9D71', cliffD = '#B7875D', lemon = '#F6CB2F', lemonL = '#FCE38A', leaf = '#3E7B39', leafL = '#63A24C', coral = '#E4605A',
    pink = '#F4B6A8', apricot = '#F2A56A', butter = '#F8DA8E', white = '#FFF8EC', shutter = '#4E8B5B', win = '#34466E', terra = '#C8603E',
    sand = '#F3D8A6', branch = '#6E4B2F';
  const R = rng(21);
  let s = `<rect width="900" height="1200" fill="${paper}"/>`;

  // Sun + hills
  s += `<circle cx="236" cy="610" r="168" fill="${sunC}"/>`;
  s += `<path d="M0 730 C90 650 170 628 260 660 C340 612 430 580 520 630 C610 590 720 560 900 610 V880 H0 Z" fill="${mount}"/>`;
  s += `<path d="M0 790 C120 740 220 745 300 772 C390 735 480 728 580 764 V880 H0 Z" fill="${mountD}"/>`;

  // Sea with brush-stroke ripples
  s += `<rect y="836" width="900" height="364" fill="${sea}"/>`;
  let wv = '';
  for (let i = 0; i < 46; i++) { const x = R() * 700, y = 860 + R() * 320, w = 18 + R() * 40; wv += `M${r1(x)} ${r1(y)}h${r1(w)}`; }
  s += `<path d="${wv}" stroke="${seaL}" stroke-width="4" stroke-linecap="round" opacity="0.7"/>`;

  // Boats
  const boat = (x, y, k, c) => `<path d="M${x - 40 * k} ${y} Q${x} ${y + 22 * k} ${x + 44 * k} ${y - 6 * k} Z" fill="${white}"/><path d="M${x - 34 * k} ${y + 5 * k} Q${x} ${y + 21 * k} ${x + 38 * k} ${y - 1 * k}" fill="none" stroke="${c}" stroke-width="${4 * k}"/><rect x="${x - 12 * k}" y="${y - 16 * k}" width="${22 * k}" height="${14 * k}" rx="${3 * k}" fill="${white}"/>` +
    `<path d="M${x - 70 * k} ${y + 14 * k} h${40 * k} M${x + 30 * k} ${y + 12 * k} h${50 * k}" stroke="${seaL}" stroke-width="3" stroke-linecap="round"/>`;
  s += boat(120, 930, 1, coral) + boat(290, 1004, 0.8, cobalt) + boat(96, 1068, 1.05, shutter);

  // Cliff and village
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

  // Beach with striped umbrellas
  s += `<path d="M130 1130 C180 1090 262 1064 372 1050 L420 1062 L404 1130 Z" fill="${sand}"/>`;
  const umb = (x, y, a, b) => {
    let o = `<rect x="${x - 2}" y="${y}" width="4" height="34" fill="${branch}"/>`;
    for (let i = 0; i < 6; i++) { const t0 = Math.PI + i * Math.PI / 6, t1 = t0 + Math.PI / 6; o += `<path d="M${x} ${y} L${r1(x + 34 * Math.cos(t0))} ${r1(y + 22 * Math.sin(t0))} L${r1(x + 34 * Math.cos(t1))} ${r1(y + 22 * Math.sin(t1))} Z" fill="${i % 2 ? a : b}"/>`; }
    return o;
  };
  s += umb(236, 1084, coral, white) + umb(318, 1066, cobalt, white) + umb(304, 1092, apricot, white) + umb(378, 1080, coral, white);
  s += `<rect y="1124" width="900" height="76" fill="${paper}"/><rect y="1124" width="900" height="6" fill="${cobalt}"/>`;

  // Lemon branch (top right)
  s += `<path d="M912 30 C840 60 760 120 650 118 C600 116 560 96 520 70" fill="none" stroke="${branch}" stroke-width="9" stroke-linecap="round"/>`;
  s += `<path d="M770 92 C780 130 776 160 760 176 M676 116 C680 140 672 156 660 164" fill="none" stroke="${branch}" stroke-width="5" stroke-linecap="round"/>`;
  const lf = (x, y, a, c, l = 40) => `<path d="M${x} ${y} q${l / 2} ${-l / 3.2} ${l} 0 q${-l / 2} ${l / 3.2} ${-l} 0 Z" fill="${c}" transform="rotate(${a} ${x} ${y})"/>`;
  s += lf(870, 48, -160, leaf, 76) + lf(826, 66, -40, leafL, 72) + lf(740, 104, 150, leaf, 74) + lf(704, 116, -34, leafL, 68) + lf(606, 108, -150, leaf, 66) + lf(556, 84, 16, leafL, 62) + lf(640, 118, 70, leaf, 58) + lf(784, 88, 62, leafL, 64) + lf(520, 70, -120, leaf, 56);
  const lem = (x, y, a) => `<g transform="rotate(${a} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="44" ry="33" fill="${lemon}"/><path d="M${x + 40} ${y - 6} q14 6 0 12 Z M${x - 40} ${y - 6} q-12 6 0 12 Z" fill="${lemon}"/><ellipse cx="${x - 12}" cy="${y - 13}" rx="16" ry="7" fill="${lemonL}"/></g>`;
  s += lem(756, 206, 72) + lem(652, 196, 96) + lem(836, 132, 50);
  s += lf(744, 172, 110, leafL, 40);

  // Title + greeting
  s += txt(456, 408, 'Italia', { font: 'Shrikhand', size: 214, fill: coral });
  s += txt(450, 402, 'Italia', { font: 'Shrikhand', size: 214, fill: cobalt });
  s += txt(660, 506, 'ciao bella!', { font: 'Caveat Brush', size: 70, fill: coral, rot: -7 });
  s += stamp(150, 540, -12, cobalt, 'ROMA', 'IT');
  s += footer('02', '41.9028° N · 12.4964° E', cobalt);
  return s;
} });
