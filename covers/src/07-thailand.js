COVERS.push({ id: '07', slug: 'thailand', name: 'Thailand', bg: '#FCE3BC', svg() {
  const sky = '#FCE3BC', sunC = '#F8AF33', sunL = '#FAC869', magenta = '#C4205E', far = '#A8CBB1', mid = '#5F9E78', front = '#2E7657', jungle = '#23603F',
    sea = '#23AFB3', seaL = '#86DAD2', seaD = '#15878E', wood = '#8A4A28', woodL = '#B56C3C', woodD = '#5C301A', blue = '#2F6FB4',
    pink = '#E8457E', yellow = '#F7C23B', orange = '#F08A2C', cream = '#FFF7EA', leaf = '#2F7A4E', leafL = '#4E9B61', ink = '#253238';
  const R = rng(17);
  let s = `<rect width="900" height="1200" fill="${sky}"/>`;
  s += `<circle cx="596" cy="560" r="150" fill="${sunL}"/><circle cx="596" cy="560" r="112" fill="${sunC}"/>`;

  // Limestone karsts: far, mid, front
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

  // Water
  s += `<rect y="790" width="900" height="410" fill="${sea}"/><rect y="790" width="900" height="14" fill="${seaL}" opacity="0.6"/>`;
  let rip = '';
  for (let i = 0; i < 40; i++) { const x = R() * 860, y = 816 + R() * 290, w = 20 + R() * 46; rip += `M${r1(x)} ${r1(y)}h${r1(w)}`; }
  s += `<path d="${rip}" stroke="${seaL}" stroke-width="4" stroke-linecap="round" opacity="0.8"/>`;
  s += `<path d="M560 804h72M540 830h112M570 856h52" stroke="${sunL}" stroke-width="6" stroke-linecap="round" opacity="0.9"/>`;

  // Long-tail boat
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

  // Frangipani
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
