COVERS.push({ id: '04', slug: 'greece', name: 'Greece', bg: '#F8F5EC', svg() {
  const paper = '#F8F5EC', white = '#FFFFFF', blue = '#1C4FA6', blueL = '#3D72C8', sky = '#CFE6F7', sea = '#1F5BAF', seaL = '#4F86CF',
    island = '#A7C0DD', sunC = '#F7B447', sunL = '#FAD58A', shade = '#DDE6EF', shade2 = '#C7D4E2', ochre = '#F0CB85', pink = '#F4B2A6',
    magenta = '#C8337A', magL = '#E4649F', green = '#4E8A4E', olive = '#6F8746', gold = '#D9A441', win = '#1C4FA6';
  const R = rng(11);
  let s = `<rect width="900" height="1200" fill="${paper}"/>`;

  // Greek key (meander) bands
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

  // Title + Greek greeting with laurel sprigs
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

  // Scene
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

  // Whitewashed terraces cascading down to the left
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
  // Bougainvillea spilling over the front wall
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
