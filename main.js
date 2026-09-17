const {app,BrowserWindow,ipcMain,shell,Notification,dialog,net}=require('electron');
const {Worker}=require('worker_threads');
const fs=require('fs'),path=require('path'); let win;
let processor;
let workerSeq=0;
const workerPending=new Map();
let refreshPromise=null;
const C=[{id:'politics',name:'السياسة',order:1},{id:'sports',name:'الرياضة',order:2},{id:'technology',name:'التقنية',order:3},{id:'local',name:'المحليات',order:4},{id:'world',name:'الصحف العالمية',order:5},{id:'stats',name:'الإحصاءات والأرقام',order:6},{id:'economy',name:'الاقتصاد',order:7},{id:'uncategorized',name:'غير مصنف',order:99}];
const R={
politics:{important:['الملك','ولي العهد','مجلس الوزراء','الديوان الملكي','أمر ملكي','أمر سام','وزارة الخارجية','وزارة الداخلية','وزارة الدفاع','رئاسة أمن الدولة','بيان رسمي','تصريح رسمي','علاقات دولية','قمة','اتفاقية','معاهدة','سفير','إيران','الولايات المتحدة','اليمن','فلسطين','مجلس التعاون'],urgent:['أمر ملكي','بيان عاجل','هجوم','صاروخ','مسيرة','انفجار','اغتيال','وفاة','إجلاء','حالة طوارئ']},
sports:{important:['المنتخب السعودي','الدوري السعودي','دوري روشن','الهلال','النصر','الاتحاد','الأهلي','الشباب','القادسية','الاتفاق','كأس العالم','فيفا','الاتحاد الآسيوي','صفقة','انتقال','مدرب','إصابة','نهائي'],urgent:['نتيجة','هدف','إصابة خطيرة','إيقاف','انسحاب','تأجيل','تأهل','نهائي']},
technology:{important:['ذكاء اصطناعي','الذكاء الاصطناعي','أبل','جوجل','مايكروسوفت','ميتا','أمازون','أمن سيبراني','اختراق','بيانات','تقنية','رقمنة','سحابة','رقائق','معالج','روبوت','ستارلينك','اتصالات'],urgent:['اختراق','تسريب بيانات','هجوم سيبراني','تعطل','انقطاع','ثغرة أمنية']},
local:{important:['الرياض','جدة','مكة','المدينة','الدمام','الخبر','الطائف','نيوم','حريق','حادث','مرور','الدفاع المدني','الأمن العام','الأرصاد','تعليق الدراسة','المدارس','الصحة','المستشفيات','النقل','المطارات'],urgent:['زلزال','سيول','فيضانات','حريق','انفجار','حادث كبير','إخلاء','إغلاق طريق','تحذير جوي','تعليق الدراسة']},
world:{important:['رويترز','Reuters','BBC','واشنطن','لندن','أمريكا','الولايات المتحدة','روسيا','الصين','أوروبا','الاتحاد الأوروبي','الأمم المتحدة','الناتو','إسرائيل','إيران','أوكرانيا','حرب','انتخابات'],urgent:['هجوم','صاروخ','حرب','انفجار','زلزال','وفاة رئيس','انقلاب','إخلاء','طوارئ']},
stats:{important:['أرقام','إحصاءات','نسبة','نمو','انكماش','تضخم','بطالة','الناتج المحلي','الصادرات','الواردات','أسعار النفط','الإنتاج','السكان','مؤشر','إيرادات','أرباح','خسائر','تقرير'],urgent:['هبوط حاد','ارتفاع حاد','تراجع قياسي','ارتفاع قياسي','رقم قياسي','توقعات عاجلة']},
economy:{important:['وزارة المالية','البنك المركزي السعودي','ساما','أرامكو','صندوق الاستثمارات العامة','تاسي','السوق المالية','أسهم','سندات','ميزانية','استثمار','استحواذ','اندماج','اكتتاب','نفط','أوبك','الاقتصاد السعودي'],urgent:['رفع الفائدة','خفض الفائدة','إفلاس','تعثر','انهيار','قفزة','هبوط حاد','ميزانية','قرار مالي']},
uncategorized:{important:['السعودية','المملكة','رياض','بيان','وزارة','إعلان','قرار','تصريح'],urgent:['عاجل','هجوم','انفجار','وفاة','زلزال','حريق','إخلاء','طوارئ']}};
const S=[{id:'alarabiya',name:'العربية',url:'https://www.alarabiya.net/feed/rss2/ar.xml',authority:86,enabled:true,categoryId:'uncategorized',kind:'news'},{id:'aawsat',name:'الشرق الأوسط',url:'https://aawsat.com/feed/news',authority:90,enabled:true,categoryId:'uncategorized',kind:'news'}];
const PEOPLE=[
 {name:'محمد بن سلمان',aliases:['محمد بن سلمان','محمد سلمان','ولي العهد','بن سلمان']},
 {name:'سلمان بن عبدالعزيز',aliases:['سلمان بن عبدالعزيز','الملك سلمان']},
 {name:'ترامب',aliases:['ترامب','دونالد ترامب','Donald Trump']},
 {name:'محمد بن زايد',aliases:['محمد بن زايد','بن زايد']},
 {name:'نتنياهو',aliases:['نتنياهو','بنيامين نتنياهو']},
 {name:'بوتين',aliases:['بوتين','فلاديمير بوتين']},
 {name:'ماكرون',aliases:['ماكرون','إيمانويل ماكرون']},
 {name:'شي جين بينغ',aliases:['شي جين بينغ','شي جينبينغ','الرئيس الصيني شي']},
 {name:'بايدن',aliases:['بايدن','جو بايدن']},
 {name:'خامنئي',aliases:['خامنئي','علي خامنئي','المرشد الإيراني']},
 {name:'بزشكيان',aliases:['بزشكيان','مسعود بزشكيان']},
 {name:'زيلينسكي',aliases:['زيلينسكي','فولوديمير زيلينسكي']},
 {name:'أحمد الشرع',aliases:['أحمد الشرع','الشرع']},
 {name:'محمد شياع السوداني',aliases:['محمد شياع السوداني','السوداني']},
 {name:'عبدالفتاح السيسي',aliases:['عبدالفتاح السيسي','السيسي']},
 {name:'تميم بن حمد',aliases:['تميم بن حمد','أمير قطر']},
 {name:'رجب طيب أردوغان',aliases:['رجب طيب أردوغان','أردوغان']},
 {name:'كير ستارمر',aliases:['كير ستارمر','ستارمر']},
 {name:'أورسولا فون دير لاين',aliases:['أورسولا فون دير لاين','فون دير لاين']},
 {name:'إيلون ماسك',aliases:['إيلون ماسك','ماسك']},
 {name:'ساتيا ناديلا',aliases:['ساتيا ناديلا','ناديلا']},
 {name:'سام ألتمان',aliases:['سام ألتمان','ألتمان']},
 {name:'مارك زوكربيرغ',aliases:['مارك زوكربيرغ','زوكربيرغ']},
 {name:'جي دي فانس',aliases:['جي دي فانس','فانس']}
];
const ORGANIZATIONS=[
 {name:'أرامكو السعودية',aliases:['أرامكو السعودية','أرامكو','Saudi Aramco']},
 {name:'صندوق الاستثمارات العامة',aliases:['صندوق الاستثمارات العامة','PIF','صندوق الاستثمارات']},
 {name:'البنك المركزي السعودي',aliases:['البنك المركزي السعودي','ساما','SAMA']},
 {name:'وزارة الخارجية',aliases:['وزارة الخارجية السعودية','وزارة الخارجية']},
 {name:'وزارة الداخلية',aliases:['وزارة الداخلية السعودية','وزارة الداخلية']},
 {name:'وزارة الدفاع',aliases:['وزارة الدفاع السعودية','وزارة الدفاع']},
 {name:'وزارة المالية',aliases:['وزارة المالية السعودية','وزارة المالية']},
 {name:'وزارة الصحة',aliases:['وزارة الصحة السعودية','وزارة الصحة']},
 {name:'وزارة التعليم',aliases:['وزارة التعليم السعودية','وزارة التعليم']},
 {name:'وزارة العدل',aliases:['وزارة العدل السعودية','وزارة العدل']},
 {name:'وزارة الطاقة',aliases:['وزارة الطاقة السعودية','وزارة الطاقة']},
 {name:'وزارة الاقتصاد والتخطيط',aliases:['وزارة الاقتصاد والتخطيط']},
 {name:'وزارة التجارة',aliases:['وزارة التجارة السعودية','وزارة التجارة']},
 {name:'وزارة الصناعة والثروة المعدنية',aliases:['وزارة الصناعة والثروة المعدنية','وزارة الصناعة']},
 {name:'هيئة السوق المالية',aliases:['هيئة السوق المالية','CMA']},
 {name:'تداول السعودية',aliases:['تداول السعودية','تداول']},
 {name:'رؤية السعودية 2030',aliases:['رؤية السعودية 2030','رؤية 2030']},
 {name:'نيوم',aliases:['نيوم','NEOM']},
 {name:'الهيئة العامة للإحصاء',aliases:['الهيئة العامة للإحصاء','الإحصاء']},
 {name:'الهيئة العامة للطيران المدني',aliases:['الهيئة العامة للطيران المدني','الطيران المدني']},
 {name:'الهيئة العامة للترفيه',aliases:['الهيئة العامة للترفيه','هيئة الترفيه']},
 {name:'الاتحاد السعودي لكرة القدم',aliases:['الاتحاد السعودي لكرة القدم']},
 {name:'رابطة الدوري السعودي للمحترفين',aliases:['رابطة الدوري السعودي للمحترفين','رابطة الدوري السعودي']},
 {name:'وكالة الأنباء السعودية',aliases:['وكالة الأنباء السعودية','واس','SPA']},
 {name:'الديوان الملكي',aliases:['الديوان الملكي']},
 {name:'مجلس الوزراء السعودي',aliases:['مجلس الوزراء السعودي','مجلس الوزراء']},
 {name:'النيابة العامة',aliases:['النيابة العامة']},
 {name:'الدفاع المدني',aliases:['الدفاع المدني']},
 {name:'الأمن العام',aliases:['الأمن العام']}
];
const LOCATIONS=[
 {name:'الرياض',aliases:['الرياض','Riyadh']},{name:'جدة',aliases:['جدة','Jeddah']},{name:'مكة المكرمة',aliases:['مكة المكرمة','مكة','مكه']},{name:'المدينة المنورة',aliases:['المدينة المنورة','المدينة']},{name:'الدمام',aliases:['الدمام']},{name:'الخبر',aliases:['الخبر']},{name:'الطائف',aliases:['الطائف']},{name:'نيوم',aliases:['نيوم','NEOM']},{name:'العلا',aliases:['العلا']},{name:'الأحساء',aliases:['الأحساء','الاحساء']},{name:'تبوك',aliases:['تبوك']},{name:'أبها',aliases:['أبها']},{name:'القصيم',aliases:['القصيم']},{name:'حائل',aliases:['حائل']},{name:'جازان',aliases:['جازان']},{name:'نجران',aliases:['نجران']},{name:'الباحة',aliases:['الباحة']},{name:'الجبيل',aliases:['الجبيل']},{name:'ينبع',aliases:['ينبع']},{name:'رأس الخير',aliases:['رأس الخير']},{name:'دبي',aliases:['دبي','Dubai']},{name:'أبوظبي',aliases:['أبوظبي','ابوظبي','Abu Dhabi']},{name:'الدوحة',aliases:['الدوحة','Doha']},{name:'واشنطن',aliases:['واشنطن','Washington']},{name:'نيويورك',aliases:['نيويورك','New York']},{name:'لندن',aliases:['لندن','London']},{name:'طهران',aliases:['طهران','Tehran']},{name:'بكين',aliases:['بكين','Beijing']},{name:'موسكو',aliases:['موسكو','Moscow']},{name:'باريس',aliases:['باريس','Paris']}
];
const STOP=new Set(['السعودية','المملكة','السعودي','السعودية','اليوم','أمس','غدا','عاجل','مهم','بعد','قبل','حول','ضمن','خلال','هذا','هذه','ذلك','تلك','الذي','التي','وقال','وقالت','يعلن','تعلن','أعلنت','أعلن','مصدر','مصادر','خبر','أخبار','تفاصيل','جديد','الجديد','العالم','البلاد','البلد','عام','عاما','عاماً','من','في','على','إلى','عن','مع','منذ','حتى','بين','أمام','بعد','قبل','و','وهو','وهي','ثم','كما','أن','إن','ما','لا','لم','لن','قد','هل','كان','كانت','يكون','تكون','تم','يتم']);
const OFFICIAL_HINTS=['واس','وزارة','هيئة','مؤسسة','رئاسة','الديوان','البنك المركزي','ساما','النيابة','الدفاع المدني','الأمن العام','الداخلية','الخارجية','الدفاع','الصحة','المالية','العدل','البيئة','البلدية','التعليم'];
const DEFAULT_SETTINGS={refreshSeconds:60,important:72,breaking:88,eventWindowHours:12,clusterThreshold:46,peopleWindowHours:24,minPeople:3,minOrganizations:3,minLocations:3,entityActiveHours:24,eventEngineVersion:3};
let state={items:[],sources:[],categories:[],rules:R,settings:{...DEFAULT_SETTINGS},notified:[],events:[],people:[],organizations:[],locations:[]};
const dir=()=>{let d=path.join(app.getPath('userData'),'newsroom-radar-data');fs.mkdirSync(d,{recursive:true});return d},file=()=>path.join(dir(),'state.json');
let saveChain=Promise.resolve();
function save(){
 const snapshot=JSON.stringify(state,null,2);
 saveChain=saveChain.then(()=>fs.promises.writeFile(file(),snapshot,'utf8')).catch(()=>{});
 return saveChain;
}
function pruneRecent(){
 const now=Date.now(),cut=now-24*60*60*1000;
 state.items=state.items.filter(x=>{const t=activeTime(x);return t>=cut&&t<=now+60*60*1000;});
 state.notified=(state.notified||[]).filter(id=>state.items.some(x=>x.id===id)).slice(-2000);
}
function load(){
 try{state=JSON.parse(fs.readFileSync(file(),'utf8'))}catch(_){ }
 if(!Array.isArray(state.items))state.items=[];
 if(!Array.isArray(state.sources))state.sources=[...S];
 // V9.1/V10/V11 migration: keep only direct RSS/Atom/news sources.
 state.sources=state.sources.filter(s=>s && (!s.kind||s.kind==='news') && /^https?:\/\//i.test(String(s.url||''))).map(s=>({...s,kind:'news',platform:'RSS / Atom'}));
 if(!Array.isArray(state.categories)||!state.categories.length)state.categories=[...C];
 state.settings={...DEFAULT_SETTINGS,...(state.settings||{})};delete state.settings.webAdapter;delete state.settings.webTimeoutSeconds;
 if(state.settings.eventEngineVersion!==3){state.settings.clusterThreshold=46;state.settings.eventEngineVersion=3;}
 if(!Array.isArray(state.people))state.people=[];if(!Array.isArray(state.organizations))state.organizations=[];if(!Array.isArray(state.locations))state.locations=[];
 if(!Array.isArray(state.notified))state.notified=[];if(!state.rules)state.rules=JSON.parse(JSON.stringify(R));if(!Array.isArray(state.events))state.events=[];
 for(const c of C)if(!state.categories.some(x=>x.id===c.id))state.categories.push({...c});
 for(const k of Object.keys(R))if(!state.rules[k])state.rules[k]={important:[],urgent:[]};
 for(const s of state.sources)if(!s.categoryId||!state.categories.some(c=>c.id===s.categoryId))s.categoryId='uncategorized';
 pruneRecent();
 state.categories.sort((a,b)=>(a.order||99)-(b.order||99));
 save();
}
function dec(s=''){return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi,'$1').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(+n))}
function tag(b,n){for(const x of n){let m=b.match(new RegExp(`<${x}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${x}>`,'i'));if(m)return dec(m[1].trim())}return''}
function strip(s=''){return s.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()}
function parseDateValue(v){
 const x=String(v||'').trim(); if(!x)return null;
 let t=Date.parse(x); if(Number.isFinite(t))return t;
 const n=Number(x); if(Number.isFinite(n)&&n>1000000000)return n<100000000000? n*1000:n;
 return null;
}
function parse(xml,s){
 const text=String(xml||''); let blocks=[],m,re=/<item\b[^>]*>([\s\S]*?)<\/item>/gi;
 while((m=re.exec(text)))blocks.push(m[1]);
 if(!blocks.length){re=/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi;while((m=re.exec(text)))blocks.push(m[1]);}
 if(!blocks.length){re=/<rdf:li\b[^>]*resource=["']([^"']+)["'][^>]*>/gi;while((m=re.exec(text)))blocks.push(`<link>${dec(m[1])}</link>`);}
 return blocks.map((b,i)=>{
   let link=tag(b,['link']);
   if(!/^https?:/i.test(link)){
     const lm=b.match(/<link\b[^>]*?(?:href|resource)=["']([^"']+)["']/i); link=lm?dec(lm[1]):'';
   }
   let title=strip(tag(b,['title','media:title']));
   let published=tag(b,['pubDate','published','dc:date','dcterms:issued','date']);
   let updated=tag(b,['updated','modified','dcterms:modified','lastBuildDate']);
   if(!published){const a=b.match(/<published\b[^>]*>([\s\S]*?)<\/published>/i);if(a)published=dec(a[1].trim());}
   if(!updated){const a=b.match(/<updated\b[^>]*>([\s\S]*?)<\/updated>/i);if(a)updated=dec(a[1].trim());}
   let desc=strip(tag(b,['content:encoded','description','summary','content','media:description']));
   let p=parseDateValue(published),u=parseDateValue(updated);
   if(p===null&&u!==null)p=u;
   const active=(p!==null||u!==null)?new Date(Math.max(p??0,u??0)).toISOString():null;
   return {id:s.id+':'+(tag(b,['guid','id'])||link||i),sourceId:s.id,sourceName:s.name,title,link,description:desc.slice(0,1200),publishedAt:p!==null?new Date(p).toISOString():null,updatedAt:u!==null?new Date(u).toISOString():null,activeAt:active,authority:+s.authority||70,categoryId:s.categoryId||'uncategorized',kind:'news',platform:'RSS / Atom'};
 }).filter(x=>x.title&&x.link&&/^https?:/i.test(x.link));
}
function activeTime(item){const t=new Date(item.activeAt||item.updatedAt||item.publishedAt||0).getTime();return Number.isFinite(t)?t:0}
function startProcessor(){
 processor=new Worker(path.join(__dirname,'processor.js'));
 processor.on('message',msg=>{const p=workerPending.get(msg.id);if(!p)return;workerPending.delete(msg.id);if(msg.ok)p.resolve(msg.result);else p.reject(new Error(msg.error||'فشل التحليل الخلفي'));});
 processor.on('error',err=>{for(const p of workerPending.values())p.reject(err);workerPending.clear();processor=null;});
 processor.on('exit',code=>{if(code!==0){for(const p of workerPending.values())p.reject(new Error('محرك التحليل الخلفي توقف'));workerPending.clear();}processor=null;});
}
function runWorker(payload){
 if(!processor)startProcessor();
 const id=++workerSeq;
 return new Promise((resolve,reject)=>{workerPending.set(id,{resolve,reject});try{processor.postMessage({id,payload});}catch(e){workerPending.delete(id);reject(e);}});
}
async function reprocessState(){
 const result=await runWorker({items:state.items,sources:state.sources,rules:state.rules,settings:state.settings,now:Date.now()});
 state.items=result.items;state.events=result.events;state.people=result.people;state.organizations=result.organizations;state.locations=result.locations;
 await save();
 return result;
}

async function fetchText(url,timeoutMs=15000,headers={}){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
 const base={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Newsroom-Radar/9.1','Accept':'application/rss+xml, application/atom+xml, application/rdf+xml, application/xml, text/xml, text/html;q=0.8, */*','Accept-Language':'ar,en;q=0.8','Cache-Control':'no-cache'};
 try{
   let r;
   try{r=await net.fetch(url,{headers:{...base,...headers},redirect:'follow',signal:controller.signal});}
   catch(_){r=await fetch(url,{headers:{...base,...headers},redirect:'follow',signal:controller.signal});}
   if(r.status===304)return {notModified:true,text:''};
   if(!r.ok)throw Error('HTTP '+r.status);
   return {notModified:false,text:await r.text(),etag:r.headers.get('etag')||'',lastModified:r.headers.get('last-modified')||'',contentType:r.headers.get('content-type')||''};
 }catch(e){if(e?.name==='AbortError')throw Error('انتهت مهلة المصدر');throw e}
 finally{clearTimeout(timer)}
}
function isFeedText(text){const x=String(text||'').replace(/^\uFEFF/,'').trim().slice(0,500).toLowerCase();return x.includes('<rss')||x.includes('<feed')||x.includes('<rdf:rdf')||x.includes('<?xml');}
async function fetchSourceData(s){
 const headers={};if(s.etag)headers['If-None-Match']=s.etag;if(s.lastModified)headers['If-Modified-Since']=s.lastModified;
 let r=await fetchText(String(s.url||'').trim(),15000,headers);
 // Some official feeds/proxies mishandle conditional requests. Retry once unconditionally.
 if(r.notModified)return {notModified:true,items:[]};
 if(!isFeedText(r.text)){
   const retry=await fetchText(String(s.url||'').trim(),15000,{});
   r=retry;
 }
 if(!isFeedText(r.text))throw Error('الرابط لا يعيد RSS / Atom مباشرًا');
 return {notModified:false,xml:r.text,etag:r.etag,lastModified:r.lastModified};
}
async function one(s){
 try{
   const data=await fetchSourceData(s);
   if(data.notModified)return{ok:true,s,items:[],unchanged:true,error:'',mode:'feed'};
   const all=parse(data.xml,s);
   if(!all.length)throw Error('لم يعثر المصدر على عناصر RSS / Atom قابلة للقراءة');
   const items=all.filter(x=>activeTime(x)>=Date.now()-24*60*60*1000&&activeTime(x)<=Date.now()+60*60*1000);
   s.etag=data.etag||s.etag||'';s.lastModified=data.lastModified||s.lastModified||'';
   return{ok:true,s,items,error:'',mode:'feed'};
 }catch(e){return{ok:false,s,items:[],error:e.message||'تعذر الاتصال',mode:'feed'}}
}
async function mapLimit(list,limit,fn){const out=new Array(list.length);let next=0;async function worker(){while(true){const i=next++;if(i>=list.length)return;out[i]=await fn(list[i]);}}await Promise.all(Array.from({length:Math.min(limit,list.length)},worker));return out;}
function publicState(health=[]){return{items:state.items,sources:state.sources,categories:state.categories,rules:state.rules,settings:state.settings,events:state.events,people:state.people,organizations:state.organizations,locations:state.locations,health,at:new Date().toISOString()};}
function syncRenderer(payload=publicState()){if(win&&!win.isDestroyed())win.webContents.send('state-sync',payload);}
async function refresh(){
 if(refreshPromise)return refreshPromise;
 refreshPromise=(async()=>{
   pruneRecent();
   win?.webContents.send('refresh-status',{phase:'fetching',message:'جلب RSS / Atom الرسمي...'});
   const enabled=state.sources.filter(s=>s.enabled);
   const rs=await mapLimit(enabled,6,one);
   const bySource=new Map();
   for(const r of rs){bySource.set(r.s.id,r);if(r.ok&&!r.unchanged){
      state.sources=state.sources.map(s=>s.id===r.s.id?r.s:s);
      const incoming=new Map(r.items.map(x=>[x.link,x]));
      state.items=state.items.filter(x=>x.sourceId!==r.s.id||!incoming.has(x.link));
      state.items.push(...r.items);
   }}
   pruneRecent();
   // Deduplicate by URL while preserving the newest representation.
   const map=new Map();for(const x of state.items){const old=map.get(x.link);if(!old||activeTime(x)>=activeTime(old))map.set(x.link,x);}state.items=[...map.values()].sort((a,b)=>activeTime(b)-activeTime(a));
   win?.webContents.send('refresh-status',{phase:'processing',message:`تحليل ${state.items.length} خبرًا في الخلفية...`});
   const result=await reprocessState();
   for(const x of state.items.filter(x=>x.score>=state.settings.breaking&&!state.notified.includes(x.id)).slice(0,8)){state.notified.push(x.id);if(Notification.isSupported()){let n=new Notification({title:'🔴 عاجل — '+x.sourceName,body:x.title});n.on('click',()=>shell.openExternal(x.link));n.show()}}
   state.notified=state.notified.slice(-2000);pruneRecent();await save();
   const health=rs.map(r=>({id:r.s.id,name:r.s.name,ok:r.ok,count:r.unchanged?state.items.filter(x=>x.sourceId===r.s.id).length:r.items.length,error:r.error||''}));
   const payload=publicState(health);win?.webContents.send('refresh-status',{phase:'done',message:'اكتمل التحديث',at:result.at});syncRenderer(payload);return payload;
 })();
 try{return await refreshPromise}finally{refreshPromise=null}
}
function create(){win=new BrowserWindow({width:1550,height:950,minWidth:1150,minHeight:720,backgroundColor:'#071A33',webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false}});win.loadFile('index.html')}
app.whenReady().then(()=>{load();startProcessor();create();ipcMain.handle('open',async(_,url)=>{try{const u=new URL(String(url||''));if(!/^https?:$/.test(u.protocol))throw Error('رابط غير صالح');return await shell.openExternal(u.href)}catch(e){throw Error('تعذر فتح الرابط') }});ipcMain.handle('data',()=>{pruneRecent();return publicState()});ipcMain.handle('refresh',refresh);
ipcMain.handle('test-source',async(_,s)=>{
 const src={...s,kind:'news',url:String(s.url||'').trim(),categoryId:s.categoryId||'uncategorized',authority:+s.authority||75,enabled:true,platform:'RSS / Atom'};
 if(!src.url||!/^https?:\/\//i.test(src.url))throw Error('أدخل رابط RSS / Atom صحيحًا يبدأ بـ http:// أو https://');
 const data=await fetchSourceData(src);if(data.notModified)throw Error('المصدر لم يتغير؛ اختبر الرابط دون بيانات Cache أو أعد المحاولة.');
 const all=parse(data.xml,src);
 if(!all.length)throw Error('الرابط لا يحتوي عناصر RSS / Atom قابلة للقراءة');
 const dated=all.filter(x=>activeTime(x)>0);if(!dated.length)throw Error('المصدر RSS / Atom لكنه لا يرسل تاريخ نشر موثوقًا للأخبار');
 const recent=dated.filter(x=>activeTime(x)>=Date.now()-24*60*60*1000&&activeTime(x)<=Date.now()+60*60*1000);
 return {ok:true,count:recent.length,total:dated.length,mode:'feed',newestAt:new Date(Math.max(...dated.map(activeTime))).toISOString(),items:recent.slice(0,20).map(x=>({title:x.title,link:x.link,publishedAt:x.publishedAt,updatedAt:x.updatedAt}))};
});
ipcMain.handle('add-source',async(_,s)=>{
 const src={id:'src-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),name:String(s.name||'مصدر جديد').trim(),url:String(s.url||'').trim(),authority:+s.authority||75,enabled:true,categoryId:s.categoryId||'uncategorized',kind:'news',platform:'RSS / Atom'};
 if(!src.name)throw Error('أدخل اسم المصدر');
 if(!src.url||!/^https?:\/\//i.test(src.url))throw Error('أدخل رابط RSS / Atom صحيحًا');
 if(state.sources.some(x=>x.url===src.url))throw Error('هذا المصدر مضاف بالفعل');
 state.sources.push(src);await save();syncRenderer(publicState());setImmediate(()=>refresh().catch(()=>{}));return publicState();
});
ipcMain.handle('update-source',async(_,s)=>{let i=state.sources.findIndex(x=>x.id===s.id);if(i>=0){let next={...state.sources[i],...s,kind:'news',platform:'RSS / Atom'};state.sources[i]=next;}await save();syncRenderer(publicState());setImmediate(()=>refresh().catch(()=>{}));return state.sources});
ipcMain.handle('delete-source',async(_,id)=>{state.sources=state.sources.filter(x=>x.id!==id);state.items=state.items.filter(x=>x.sourceId!==id);await save();syncRenderer(publicState());setImmediate(async()=>{try{await reprocessState();await save();syncRenderer(publicState())}catch{}});return publicState()});
ipcMain.handle('add-category',async(_,name)=>{name=String(name||'').trim();if(!name)throw Error('أدخل اسم التبويب');if(state.categories.some(c=>c.name===name))throw Error('هذا التبويب موجود بالفعل');let id='cat-'+Date.now();state.categories.push({id,name,order:state.categories.length+1});state.rules[id]={important:[],urgent:[]};await save();return state.categories});
ipcMain.handle('rename-category',async(_,p)=>{let c=state.categories.find(x=>x.id===p.id);if(c&&p.name?.trim())c.name=p.name.trim();await save();return state.categories});
ipcMain.handle('delete-category',async(_,id)=>{if(id==='uncategorized')throw Error('لا يمكن حذف غير مصنف');state.sources.forEach(s=>{if(s.categoryId===id)s.categoryId='uncategorized'});state.categories=state.categories.filter(x=>x.id!==id);delete state.rules[id];await reprocessState();return state.categories});
ipcMain.handle('save-rules',async(_,p)=>{state.rules[p.id]={important:Array.isArray(p.important)?p.important:[],urgent:Array.isArray(p.urgent)?p.urgent:[]};await reprocessState();return state.rules});
ipcMain.handle('reset-rules',async(_,id)=>{state.rules[id]=JSON.parse(JSON.stringify(R[id]||{important:[],urgent:[]}));await reprocessState();return state.rules});
ipcMain.handle('save-settings',async(_,p)=>{state.settings={...state.settings,minPeople:Math.max(1,+p.minPeople||3),minOrganizations:Math.max(1,+p.minOrganizations||3),minLocations:Math.max(1,+p.minLocations||3)};await reprocessState();await save();return{settings:state.settings,people:state.people,organizations:state.organizations,locations:state.locations}});
ipcMain.handle('import-opml',async(_,categoryId)=>{let r=await dialog.showOpenDialog(win,{title:'استيراد RSS / OPML',properties:['openFile'],filters:[{name:'OPML / XML',extensions:['opml','xml']}]});if(r.canceled)return state.sources;let txt=fs.readFileSync(r.filePaths[0],'utf8'),re=/<outline\b[^>]*xmlUrl=["']([^"']+)["'][^>]*>/gi,m,c=0,cat=state.categories.some(x=>x.id===categoryId)?categoryId:'uncategorized';while((m=re.exec(txt))){let b=m[0],nm=(b.match(/(?:title|text)=["']([^"']+)/i)||[])[1]||'مصدر مستورد',url=dec(m[1]);if(!state.sources.some(s=>s.url===url))state.sources.push({id:'imp-'+Date.now()+'-'+c++,name:dec(nm),url,authority:75,enabled:true,categoryId:cat,kind:'news',platform:'RSS / Atom'})}await save();return state.sources});
ipcMain.handle('export-opml',async()=>{let r=await dialog.showSaveDialog(win,{title:'تصدير المصادر',defaultPath:'newsroom-radar-sources.opml',filters:[{name:'OPML',extensions:['opml']}]});if(r.canceled)return false;let o=state.sources.map(s=>`<outline text="${s.name.replace(/"/g,'&quot;')}" title="${s.name.replace(/"/g,'&quot;')}" type="rss" xmlUrl="${s.url.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}"/>`).join('\n');fs.writeFileSync(r.filePath,`<?xml version="1.0" encoding="UTF-8"?><opml version="2.0"><head><title>Newsroom Radar Sources</title></head><body>${o}</body></opml>`);return true});});
app.on('before-quit',()=>{try{processor?.terminate()}catch(_){}});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
