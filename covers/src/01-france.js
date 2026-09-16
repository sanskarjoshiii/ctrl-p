COVERS.push({ id: '01', slug: 'france', name: 'France', bg: '#F4EBDD', svg() {
  const cream = '#F4EBDD', paper = '#FFFBF3', navy = '#1C2A52', red = '#D8433A', blush = '#F5CDBF', sunC = '#FBE3C2',
    zinc = '#98ABC0', zincD = '#61758E', facade = '#FAF1E4', terr = '#C9684B', green = '#3D7A4E', leaf = '#5C9A58';
  const R = rng(7);
  let s = `<rect width="900" height="1200" fill="${cream}"/>`;

  // Café awning: striped canopy with a shadowed scalloped valance
  s += `<rect width="900" height="16" fill="${navy}"/>`;
  for (let i = 0; i < 15; i++) s += `<path d="M${i * 60} 140 a30 30 0 0 0 60 0 Z" fill="#E4D5BE" transform="translate(0 9)"/>`;
  for (let i = 0; i < 15; i++) {
    const x = i * 60, c = i % 2 ? paper : red;
    s += `<rect x="${x}" y="16" width="60" height="124" fill="${c}"/><path d="M${x} 139 a30 30 0 0 0 60 0 Z" fill="${c}"/>`;
  }
  s += `<rect y="16" width="900" height="10" fill="#000" opacity="0.08"/>`;

  // Title
  s += txt(456, 356, 'France', { font: 'Abril Fatface', size: 206, fill: red, ls: -2 });
  s += txt(450, 350, 'France', { font: 'Abril Fatface', size: 206, fill: navy, ls: -2 });

  // Arched window
  const arch = (x0, x1, top, bottom) => { const r = (x1 - x0) / 2; return `M${x0} ${bottom} V${top + r} A${r} ${r} 0 0 1 ${x1} ${top + r} V${bottom} Z`; };
  const inner = arch(178, 722, 440, 1040);
  s += `<path d="${arch(150, 750, 412, 1052)}" fill="${navy}"/>`;
  s += `<path d="${arch(162, 738, 424, 1052)}" fill="none" stroke="${paper}" stroke-width="2.5"/>`;
  s += `<defs><clipPath id="fr-win"><path d="${inner}"/></clipPath></defs><g clip-path="url(#fr-win)">`;
  s += `<rect x="170" y="430" width="560" height="620" fill="${blush}"/>`;
  s += `<circle cx="590" cy="610" r="84" fill="${sunC}"/>`;
  s += `<rect x="222" y="640" width="150" height="24" rx="12" fill="${paper}" opacity="0.85"/><rect x="262" y="620" width="84" height="24" rx="12" fill="${paper}" opacity="0.85"/>`;
  s += `<rect x="560" y="712" width="120" height="20" rx="10" fill="${paper}" opacity="0.7"/>`;

  // Eiffel Tower with lattice
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

  // Rooftops — back row (light zinc)
  const mansard = (x0, x1, top, base, col) => `<path d="M${x0} ${base} L${x0 + 16} ${top} L${x1 - 16} ${top} L${x1} ${base} Z" fill="${col}"/>`;
  s += mansard(160, 330, 900, 950, zinc) + mansard(560, 760, 890, 945, zinc) + mansard(300, 600, 930, 975, zinc);
  s += `<rect x="160" y="945" width="600" height="110" fill="#E9DCCB"/>`;
  // Front buildings
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

  // Window box with geraniums
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
