COVERS.push({ id: '08', slug: 'usa', name: 'USA', bg: '#F5EAD5', svg() {
  const cream = '#F5EAD5', ray = '#EDDABA', navy = '#1E2B55', navyL = '#2E3F74', red = '#D5373F', redD = '#A92630', yellow = '#F6C543',
    orange = '#F2913B', sky = '#8FCBE0', skyL = '#B8E0EC', sea = '#2E6DB4', bridge = '#D9482F', hill = '#6D8F5A', mint = '#6FBFA2', mintD = '#4E9E84',
    terra = '#C4643A', terraL = '#DB7C4B', sand = '#EBA86A', cactus = '#3F7D4A';
  let s = `<rect width="900" height="1200" fill="${cream}"/>`;

  // Sunburst
  let rays = '';
  const C = [450, 560];
  for (let i = 0; i < 36; i += 2) {
    const a0 = i * Math.PI / 18, a1 = (i + 1) * Math.PI / 18;
    rays += `M${C[0]} ${C[1]}L${r1(C[0] + 1400 * Math.cos(a0))} ${r1(C[1] + 1400 * Math.sin(a0))}L${r1(C[0] + 1400 * Math.cos(a1))} ${r1(C[1] + 1400 * Math.sin(a1))}Z`;
  }
  s += `<defs><clipPath id="us-page"><rect width="900" height="1200"/></clipPath></defs><g clip-path="url(#us-page)"><path d="${rays}" fill="${ray}"/></g>`;

  // Starry top band
  s += `<rect width="900" height="92" fill="${navy}"/>`;
  for (let i = 0; i < 15; i++) s += star(30 + i * 60, 48, 13, cream, 0.42);

  s += txt(450, 334, 'Greetings from the', { font: 'Yellowtail', size: 86, fill: red, rot: -3 });

  // Big letters: 3D extrusion, scene fill, cream outline
  const G = USA_GLYPHS;
  for (const ch of 'USA') for (let i = 12; i >= 1; i--) s += `<path d="${G[ch].d}" fill="${i > 10 ? '#141D3D' : navy}" transform="translate(${i * 1.6} ${i * 1.6})"/>`;
  const scene = (ch, body) => `<defs><clipPath id="us-${ch}"><path d="${G[ch].d}"/></clipPath></defs><g clip-path="url(#us-${ch})">${body}</g>`;
  // U — Golden Gate at sunset
  let u = `<rect x="40" y="400" width="320" height="310" fill="${orange}"/><rect x="40" y="400" width="320" height="90" fill="${yellow}" opacity="0.7"/>`;
  u += `<circle cx="196" cy="560" r="56" fill="${yellow}"/><path d="M40 610 C120 590 250 600 360 580 V720 H40Z" fill="${hill}"/><rect x="40" y="628" width="320" height="90" fill="${sea}"/>`;
  u += `<path d="M40 540 Q110 610 128 470 Q196 620 262 470 Q280 610 360 540" fill="none" stroke="${bridge}" stroke-width="4"/>`;
  u += `<rect x="120" y="462" width="16" height="190" fill="${bridge}"/><rect x="254" y="462" width="16" height="190" fill="${bridge}"/>`;
  u += `<rect x="116" y="500" width="24" height="6" fill="${bridge}"/><rect x="250" y="500" width="24" height="6" fill="${bridge}"/><rect x="40" y="606" width="320" height="10" fill="${redD}"/>`;
  s += scene('U', u);
  // S — New York skyline + Statue of Liberty
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
  // A — Monument Valley
  let a = `<rect x="585" y="400" width="270" height="310" fill="${yellow}"/><rect x="585" y="520" width="270" height="190" fill="${orange}" opacity="0.55"/>`;
  a += `<path d="M640 640 V586 h14 v-26 h40 v26 h12 V640Z M740 640 V560 h10 v-40 h26 v40 h8 V640Z" fill="${terra}"/><path d="M800 640 V600 h30 V640Z" fill="${terraL}"/>`;
  a += `<rect x="585" y="632" width="270" height="80" fill="${sand}"/>`;
  a += `<path d="M700 700 V612 a10 10 0 0 1 20 0 V700Z M700 662 h-20 v-24 a7 7 0 0 1 14 0 v14 h6Z M720 650 h18 v-30 a7 7 0 0 0 -14 0 v22 h-4Z" fill="${cactus}"/>`;
  s += scene('A', a);
  for (const ch of 'USA') s += `<path d="${G[ch].d}" fill="none" stroke="${cream}" stroke-width="7" stroke-linejoin="round"/>`;

  // Ribbon banner
  s += `<path d="M96 780 L170 780 L170 846 L96 846 L124 813Z" fill="${redD}"/><path d="M804 780 L730 780 L730 846 L804 846 L776 813Z" fill="${redD}"/>`;
  s += `<path d="M150 768 H750 V834 H150Z" fill="${red}"/><path d="M150 834 L170 846 V834Z M750 834 L730 846 V834Z" fill="#6E1A20"/>`;
  s += txt(450, 812, 'COAST TO COAST', { font: 'Courier Prime', weight: 700, size: 32, ls: 7, fill: cream });

  // Route 66 shield
  const sh = 'M372 890 H528 C526 904 530 918 540 928 C562 956 556 1010 524 1040 C502 1060 474 1070 450 1082 C426 1070 398 1060 376 1040 C344 1010 338 956 360 928 C370 918 374 904 372 890Z';
  s += `<path d="${sh}" fill="${cream}" stroke="${navy}" stroke-width="9" stroke-linejoin="round"/><path d="M362 934 H538" stroke="${navy}" stroke-width="5"/>`;
  s += txt(450, 924, 'ROUTE', { font: 'Courier Prime', weight: 700, size: 22, ls: 5, fill: navy });
  s += txt(450, 1040, '66', { font: 'Holtwood One SC', size: 74, fill: navy });

  // Flag stripes + extras
  s += `<rect y="1102" width="900" height="16" fill="${red}"/><rect y="1118" width="900" height="10" fill="${cream}"/><rect y="1128" width="900" height="10" fill="${red}"/>`;
  s += txt(710, 1000, 'wish you were', { font: 'Caveat Brush', size: 52, fill: red, rot: -7 }) + txt(724, 1052, 'here!', { font: 'Caveat Brush', size: 52, fill: red, rot: -7 });
  s += stamp(190, 980, -10, navy, 'NEW YORK', 'US', '2026', 84, cream);
  s += footer('08', '38.9072° N · 77.0369° W', navy);
  return s;
} });
