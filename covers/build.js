// node build.js [slug]  -> out/<id>-<slug>.svg, out/<id>-<slug>.png, out/sheet.png
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const lib = fs.readFileSync(path.join(__dirname, 'lib.js'), 'utf8');
const files = fs.readdirSync(path.join(__dirname, 'src')).filter(f => f.endsWith('.js')).sort();
const COVERS = [];
eval(lib + '\n' + files.map(f => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8')).join('\n'));
const only = process.argv[2];
const FONTS = ['Abril Fatface', 'Shrikhand', 'Sancreek', 'Cinzel Decorative:wght@900', 'GFS Didot', 'Kavoon', 'Rampart One', 'Yomogi', 'Noto Serif JP:wght@900', 'Chonburi', 'Mali:wght@700', 'Holtwood One SC', 'Yellowtail', 'Alfa Slab One', 'Knewave', 'Caveat Brush', 'Courier Prime:wght@700'];
const link = 'https://fonts.googleapis.com/css2?' + FONTS.map(f => 'family=' + f.replace(/ /g, '+')).join('&') + '&display=block';
const out = path.join(__dirname, 'out');
const shots = [];
for (const c of COVERS) {
  if (only && c.slug !== only) continue;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">${c.svg()}</svg>`;
  const base = `${c.id}-${c.slug}`;
  fs.writeFileSync(path.join(out, base + '.svg'), svg);
  const html = `<!doctype html><html><head><link rel="stylesheet" href="${link}"><style>html,body{margin:0;background:#fff}svg{display:block}</style></head><body>${svg}<script>document.fonts.ready.then(()=>document.title='ready')</script></body></html>`;
  fs.writeFileSync(path.join(out, base + '.html'), html);
  const png = path.join(out, base + '.png');
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', `--screenshot=${png}`, '--window-size=900,1200', '--virtual-time-budget=20000', 'file:///' + path.join(out, base + '.html').split(path.sep).join('/')], { stdio: 'ignore' });
  shots.push(base + '.png');
  console.log('rendered', base, (svg.length / 1024).toFixed(1) + 'KB svg');
}
