// node bundle.js -> out/figma-a.js (covers 01-05), out/figma-b.js (06-10): code for use_figma
const fs = require('fs'), path = require('path');
const strip = t => t.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//')).join('\n');
const lib = strip(fs.readFileSync('lib.js', 'utf8'));
const files = fs.readdirSync('src').filter(f => f.endsWith('.js')).sort();
const pick = ids => files.filter(f => ids.includes(f.slice(0, 2))).map(f => strip(fs.readFileSync(path.join('src', f), 'utf8'))).join('\n');
const tail = header => `
const hex = h => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });
const page = figma.currentPage;
page.name = 'Travel Diary Covers';
const made = [], errors = [];
${header}
for (const c of COVERS) {
try {
const i = parseInt(c.id, 10) - 1;
const node = figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">' + c.svg() + '</svg>');
node.name = c.id + ' — ' + c.name;
node.x = (i % 5) * 1020;
node.y = 420 + Math.floor(i / 5) * 1440;
node.fills = [{ type: 'SOLID', color: hex(c.bg) }];
node.clipsContent = true;
const fonts = {};
for (const t of node.findAllWithCriteria({ types: ['TEXT'] })) { const f = t.fontName; const k = f === figma.mixed ? 'mixed' : f.family + ' / ' + f.style; fonts[k] = (fonts[k] || 0) + 1; }
made.push({ id: node.id, name: node.name, nodes: node.findAll().length, fonts });
await node.screenshot({ scale: 0.42 });
} catch (e) { errors.push(c.id + ': ' + e.message); }
}
return { made, errors };`;
const header = `await figma.loadFontAsync({ family: 'Abril Fatface', style: 'Regular' });
await figma.loadFontAsync({ family: 'Courier Prime', style: 'Bold' });
const h1 = figma.createText(); h1.fontName = { family: 'Abril Fatface', style: 'Regular' }; h1.characters = 'Travel Diary — Cover Series'; h1.fontSize = 120; h1.x = 0; h1.y = 60; h1.fills = [{ type: 'SOLID', color: hex('#1C2A52') }]; h1.name = 'Series title';
const h2 = figma.createText(); h2.fontName = { family: 'Courier Prime', style: 'Bold' }; h2.characters = '10 COUNTRIES · HARDCOVER FRONT COVERS · 900 × 1200 (3:4) · VECTOR, EDITABLE TEXT'; h2.fontSize = 30; h2.letterSpacing = { unit: 'PIXELS', value: 3 }; h2.x = 6; h2.y = 230; h2.fills = [{ type: 'SOLID', color: hex('#D8433A') }]; h2.name = 'Series subtitle';
made.push({ id: h1.id, name: h1.name }, { id: h2.id, name: h2.name });`;
fs.writeFileSync('out/figma-a.js', 'const COVERS = [];\n' + lib + '\n' + pick(['01', '02', '03', '04', '05']) + tail(header));
fs.writeFileSync('out/figma-b.js', 'const COVERS = [];\n' + lib + '\n' + pick(['06', '07', '08', '09', '10']) + tail(''));
for (const f of ['out/figma-a.js', 'out/figma-b.js']) { const t = fs.readFileSync(f, 'utf8'); console.log(f, t.length, 'chars'); try { new Function('figma', 'return (async()=>{' + t + '})')(); console.log('  syntax ok'); } catch (e) { console.log('  SYNTAX', e.message); } }
