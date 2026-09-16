COVERS.push({ id: '09', slug: 'uk', name: 'United Kingdom', bg: '#CFE0EA', svg() {
  const sky = '#CFE0EA', cloud = '#EEF4F7', cream = '#F7F0E4', navy = '#1B2550', red = '#D22B35', redD = '#A51E28', gold = '#E2B24A',
    stone = '#DDC494', stoneD = '#C2A571', slate = '#4B5563', far = '#AEC2D1', black = '#16161B', skin = '#F2C7A1', cheek = '#EE9C8E',
    glass = '#2C3655', road = '#8E99A6', roadD = '#6F7A87', white = '#FFFFFF';
  const R = rng(13);
  let s = `<rect width="900" height="1200" fill="${sky}"/>`;

  // Bunting
  s += `<path d="M-10 18 Q450 96 910 18" fill="none" stroke="${navy}" stroke-width="3"/>`;
  const cols = [red, white, navy];
  for (let i = 0; i < 17; i++) {
    const x = 10 + i * 54, t = x / 900, y = (1 - t) * (1 - t) * 18 + 2 * (1 - t) * t * 96 + t * t * 18 - 2;
    s += `<path d="M${r1(x)} ${r1(y)} L${r1(x + 44)} ${r1(y + 2)} L${r1(x + 22)} ${r1(y + 54)}Z" fill="${cols[i % 3]}"/>`;
  }

  // Title
  s += txt(461, 188, 'UNITED', { font: 'Alfa Slab One', size: 76, fill: red, ls: 22 });
  s += txt(455, 332, 'KINGDOM', { font: 'Alfa Slab One', size: 138, fill: red });
  s += txt(450, 326, 'KINGDOM', { font: 'Alfa Slab One', size: 138, fill: navy });

  // Clouds + far skyline (St Paul's, Gherkin, Shard)
  const cl = (x, y, k) => `<path d="M${x} ${y} h${170 * k} a${24 * k} ${24 * k} 0 0 0 -${30 * k} -${34 * k} a${34 * k} ${34 * k} 0 0 0 -${60 * k} -${18 * k} a${28 * k} ${28 * k} 0 0 0 -${60 * k} ${14 * k} a${20 * k} ${20 * k} 0 0 0 -${20 * k} ${38 * k}Z" fill="${cloud}"/>`;
  s += cl(80, 470, 1) + cl(690, 430, 0.8);
  let sk = `M0 1000 V860 H40 V820 H70 V860 H96 V800 Q140 730 184 800 V860 H220 V840 H260 V1000Z`;
  sk += `M600 1000 V820 Q640 700 680 820 V1000Z M720 1000 L790 640 L860 1000Z M300 1000 V880 H340 V850 H380 V1000Z`;
  s += `<path d="${sk}" fill="${far}"/><path d="M137 730 v-26 h6 v26Z" fill="${far}"/>`;

  // Big Ben (Elizabeth Tower)
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

  // Double-decker bus
  const bu = 596, bt = 846;
  s += `<rect x="${bu}" y="${bt}" width="340" height="222" rx="26" fill="${red}"/><rect x="${bu}" y="${bt + 104}" width="340" height="14" fill="${cream}"/>`;
  for (let i = 0; i < 4; i++) s += `<rect x="${bu + 70 + i * 66}" y="${bt + 26}" width="54" height="56" rx="8" fill="${glass}"/><rect x="${bu + 70 + i * 66}" y="${bt + 138}" width="54" height="50" rx="8" fill="${glass}"/>`;
  s += `<rect x="${bu + 12}" y="${bt + 26}" width="46" height="56" rx="10" fill="${glass}"/><rect x="${bu + 12}" y="${bt + 134}" width="40" height="84" rx="6" fill="${glass}"/>`;
  s += `<rect x="${bu + 14}" y="${bt + 90}" width="44" height="10" fill="${black}"/><rect x="${bu}" y="${bt + 196}" width="340" height="26" fill="${redD}"/>`;
  s += `<circle cx="${bu + 90}" cy="${bt + 222}" r="30" fill="${black}"/><circle cx="${bu + 90}" cy="${bt + 222}" r="12" fill="${road}"/><circle cx="${bu + 262}" cy="${bt + 222}" r="30" fill="${black}"/><circle cx="${bu + 262}" cy="${bt + 222}" r="12" fill="${road}"/>`;
  s += `<circle cx="${bu + 8}" cy="${bt + 184}" r="7" fill="${gold}"/>`;

  // Pavement
  s += `<rect y="1080" width="900" height="120" fill="${road}"/><rect y="1080" width="900" height="10" fill="${roadD}"/>`;

  // King's Guard
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
