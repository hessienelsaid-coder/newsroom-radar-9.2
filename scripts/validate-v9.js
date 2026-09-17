const fs=require('fs'),path=require('path'),assert=require('assert');
for(const f of ['main.js','renderer.js','preload.js','processor.js']){
 const t=fs.readFileSync(path.join(__dirname,'..',f),'utf8');assert(t.trim().length>100,`${f} is empty`);
}
const pkg=JSON.parse(fs.readFileSync(path.join(__dirname,'..','package.json'),'utf8'));
assert(pkg.version==='9.1.1','version must be 9.1.1');
const main=fs.readFileSync(path.join(__dirname,'..','main.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const renderer=fs.readFileSync(path.join(__dirname,'..','renderer.js'),'utf8');
assert(!main.includes("require('./web-engine')"),'web engine must be removed');
assert(!/social|trends|fetchWebSource|extractWebItems/.test(main+renderer+html),'non-RSS source types must be absent');
assert(html.includes('RSS / Atom مباشر'),'official RSS/Atom UI missing');
assert(html.includes('لا يقوم Newsroom Radar بتحويل المواقع'),'web conversion warning missing');
assert(main.includes('24*60*60*1000'),'24h retention missing');
assert(main.includes("If-None-Match")&&main.includes("If-Modified-Since"),'conditional request support missing');
assert(main.includes('mapLimit(enabled,6,one)'),'bounded concurrent fetching missing');
assert(main.includes('setImmediate(()=>refresh().catch(()=>{}))'),'background source refresh missing');
assert(require('fs').existsSync(path.join(__dirname,'..','.github/workflows/build-windows.yml')),'workflow missing');
console.log('V9.1.1 Official RSS validation passed');
