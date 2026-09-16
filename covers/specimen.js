const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const rows=[['Italia',['Shrikhand','Kavoon','Caprasimo','Lobster Two:ital,wght@1,700']],['España',['Sancreek','Caprasimo','Rye','Fraunces:ital,wght@1,900']],['GREECE',['Cinzel Decorative:wght@900','Limelight','Gloock','Yeseva One']],['Türkiye',['Lalezar','Kavoon','Chango','Caprasimo']],['JAPAN',['Dela Gothic One','Rampart One','Train One','Mochiy Pop One']],['Thailand',['Chonburi','Pattaya','Sriracha','Kanit:wght@800']],['USA',['Ultra','Holtwood One SC','Bowlby One SC','Rye']],['KINGDOM',['Holtwood One SC','Alfa Slab One','Abril Fatface','Bungee Shade']],['México',['Chango','Titan One','Knewave','Coiny']],['hello',['Caveat Brush','Knewave','Yellowtail','Kaushan Script']]];
const fams=[...new Set(rows.flatMap(r=>r[1]))];
const link='https://fonts.googleapis.com/css2?'+fams.map(f=>'family='+f.replace(/ /g,'+')).join('&')+'&display=block';
const nm=f=>f.split(':')[0];
const st=f=>f.includes('ital')?'font-style:italic;font-weight:'+(f.match(/(\d+)$/)||[0,400])[1]:(f.match(/wght@(\d+)/)?'font-weight:'+f.match(/wght@(\d+)/)[1]:'');
let h=`<!doctype html><link rel=stylesheet href="${link}"><style>body{margin:0;background:#F4EBDD;font:12px monospace;width:1600px}.r{display:flex;border-bottom:1px solid #ccc}.c{width:400px;height:118px;overflow:hidden;padding:4px 10px;box-sizing:border-box}.c b{display:block;font-size:72px;line-height:90px;color:#1C2A52;white-space:nowrap}</style>`;
for(const [w,fs_] of rows){h+='<div class=r>';for(const f of fs_)h+=`<div class=c>${nm(f)}<b style="font-family:'${nm(f)}';${st(f)}">${w}</b></div>`;h+='</div>';}
h+='<script>document.fonts.ready.then(()=>document.title="ok")</script>';
fs.writeFileSync('out/specimen.html',h);
execFileSync('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--hide-scrollbars','--screenshot='+path.resolve('out/specimen.png'),'--window-size=1600,1180','--virtual-time-budget=20000','file:///'+path.resolve('out/specimen.html').split(path.sep).join('/')],{stdio:'ignore'});
