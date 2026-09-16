COVERS.push({ id: '03', slug: 'spain', name: 'Spain', bg: '#D63A2F', svg() {
  const red = '#D63A2F', redD = '#A92822', redL = '#E85A45', cream = '#FFF4E0', tileBg = '#FBF3E3', blue = '#1F4E9E', blueL = '#6D93CF',
    yellow = '#F2B632', ink = '#221B2B', wood = '#5E3420', woodL = '#86502F', green = '#3E7B3F', greenL = '#5E9C4A', orange = '#F08A1C', gold = '#E6B24A';
  const R = rng(5);
  let s = `<rect width="900" height="1200" fill="${red}"/>`;

  // Azulejo wall: all petals of one colour merged into one path each
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

  // Flamenco fan
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

  // Carnation
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

  // Oranges
  const orangeFruit = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${orange}"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.28}" fill="#F7B061"/><path d="M${x - 4} ${y - r + 2} q-26 -30 -58 -18 q26 30 58 18Z M${x + 4} ${y - r + 2} q20 -34 54 -26 q-20 34 -54 26Z" fill="${green}"/>`;
  s += `<rect y="1128" width="900" height="72" fill="${cream}"/><rect y="1128" width="900" height="6" fill="${blue}"/>`;
  s += orangeFruit(112, 1082, 52) + orangeFruit(200, 1112, 40) + orangeFruit(798, 1088, 54);

  // Cartel-style double frame + title + greeting
  s += `<rect x="30" y="30" width="840" height="498" rx="6" fill="none" stroke="${cream}" stroke-width="3"/><rect x="42" y="42" width="816" height="474" rx="3" fill="none" stroke="${cream}" stroke-width="1.2" opacity="0.8"/>`;
  for (const [x, y] of [[30, 30], [870, 30], [30, 528], [870, 528]]) s += `<path d="M${x} ${y - 14}L${x + 14} ${y}L${x} ${y + 14}L${x - 14} ${y}Z" fill="${yellow}"/>`;
  s += txt(457, 346, 'España', { font: 'Sancreek', size: 196, fill: redD });
  s += txt(450, 338, 'España', { font: 'Sancreek', size: 196, fill: cream });
  s += txt(700, 470, '¡olé!', { font: 'Caveat Brush', size: 96, fill: yellow, rot: -10 });
  s += stamp(170, 450, -12, blue, 'MADRID', 'ES');
  s += footer('03', '40.4168° N · 3.7038° W', blue);
  return s;
} });
