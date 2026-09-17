const { parentPort } = require('worker_threads');
let state={items:[],sources:[],rules:{},settings:{}};
const R={
politics:{important:['الملك','ولي العهد','مجلس الوزراء','الديوان الملكي','أمر ملكي','أمر سام','وزارة الخارجية','وزارة الداخلية','وزارة الدفاع','رئاسة أمن الدولة','بيان رسمي','تصريح رسمي','علاقات دولية','قمة','اتفاقية','معاهدة','سفير','إيران','الولايات المتحدة','اليمن','فلسطين','مجلس التعاون'],urgent:['أمر ملكي','بيان عاجل','هجوم','صاروخ','مسيرة','انفجار','اغتيال','وفاة','إجلاء','حالة طوارئ']},
sports:{important:['المنتخب السعودي','الدوري السعودي','دوري روشن','الهلال','النصر','الاتحاد','الأهلي','الشباب','القادسية','الاتفاق','كأس العالم','فيفا','الاتحاد الآسيوي','صفقة','انتقال','مدرب','إصابة','نهائي'],urgent:['نتيجة','هدف','إصابة خطيرة','إيقاف','انسحاب','تأجيل','تأهل','نهائي']},
technology:{important:['ذكاء اصطناعي','الذكاء الاصطناعي','أبل','جوجل','مايكروسوفت','ميتا','أمازون','أمن سيبراني','اختراق','بيانات','تقنية','رقمنة','سحابة','رقائق','معالج','روبوت','ستارلينك','اتصالات'],urgent:['اختراق','تسريب بيانات','هجوم سيبراني','تعطل','انقطاع','ثغرة أمنية']},
local:{important:['الرياض','جدة','مكة','المدينة','الدمام','الخبر','الطائف','نيوم','حريق','حادث','مرور','الدفاع المدني','الأمن العام','الأرصاد','تعليق الدراسة','المدارس','الصحة','المستشفيات','النقل','المطارات'],urgent:['زلزال','سيول','فيضانات','حريق','انفجار','حادث كبير','إخلاء','إغلاق طريق','تحذير جوي','تعليق الدراسة']},
world:{important:['رويترز','Reuters','BBC','واشنطن','لندن','أمريكا','الولايات المتحدة','روسيا','الصين','أوروبا','الاتحاد الأوروبي','الأمم المتحدة','الناتو','إسرائيل','إيران','أوكرانيا','حرب','انتخابات'],urgent:['هجوم','صاروخ','حرب','انفجار','زلزال','وفاة رئيس','انقلاب','إخلاء','طوارئ']},
stats:{important:['أرقام','إحصاءات','نسبة','نمو','انكماش','تضخم','بطالة','الناتج المحلي','الصادرات','الواردات','أسعار النفط','الإنتاج','السكان','مؤشر','إيرادات','أرباح','خسائر','تقرير'],urgent:['هبوط حاد','ارتفاع حاد','تراجع قياسي','ارتفاع قياسي','رقم قياسي','توقعات عاجلة']},
economy:{important:['وزارة المالية','البنك المركزي السعودي','ساما','أرامكو','صندوق الاستثمارات العامة','تاسي','السوق المالية','أسهم','سندات','ميزانية','استثمار','استحواذ','اندماج','اكتتاب','نفط','أوبك','الاقتصاد السعودي'],urgent:['رفع الفائدة','خفض الفائدة','إفلاس','تعثر','انهيار','قفزة','هبوط حاد','ميزانية','قرار مالي']},
uncategorized:{important:['السعودية','المملكة','رياض','بيان','وزارة','إعلان','قرار','تصريح'],urgent:['عاجل','هجوم','انفجار','وفاة','زلزال','حريق','إخلاء','طوارئ']}};
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

const tokenCache=new Map(), titleTokenCache=new Map(), keyTermCache=new Map(), entityCache=new Map(), scoreCache=new Map();
const itemSig=x=>String(x.id||'')+'|'+String(x.title||'')+'|'+String(x.description||'')+'|'+String(x.categoryId||'');
const norm=s=>(s||'').toLowerCase().replace(/[ًٌٍَُِّْـ]/g,'').replace(/[إأآ]/g,'ا').replace(/ة/g,'ه').replace(/[ى]/g,'ي').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
function wordTokens(s){return norm(s).split(' ').filter(Boolean)}
function phraseMatch(text,phrase){const A=wordTokens(text),B=wordTokens(phrase);if(!B.length)return false;for(let i=0;i<=A.length-B.length;i++){let ok=true;for(let j=0;j<B.length;j++)if(A[i+j]!==B[j]){ok=false;break}if(ok)return true}return false}
function anyPhrase(text,list){return list.some(k=>phraseMatch(text,k))}
function score(x){
 const r=state.rules[x.categoryId]||state.rules.uncategorized||{important:[],urgent:[]};
 const sig=itemSig(x)+'|'+JSON.stringify(r);
 let cached=scoreCache.get(x.id);
 if(!cached||cached.sig!==sig){
   const t=(x.title||'')+' '+(x.description||''),u=[],im=[];
   for(const k of [...r.important,...(state.rules.uncategorized?.important||[])])if(phraseMatch(t,k)&&!im.includes(k))im.push(k);
   for(const k of [...r.urgent,...(state.rules.uncategorized?.urgent||[])])if(phraseMatch(t,k)&&!u.includes(k))u.push(k);
   cached={sig,base:Math.min(100,Math.max(0,Math.round(x.authority*.65)+im.length*5+u.length*9)),im:im.slice(0,8),u:u.slice(0,8)};scoreCache.set(x.id,cached);
 }
 let v=cached.base,ts=activeTime(x),age=ts?((Date.now()-ts)/60000):Infinity;if(age<15)v+=8;else if(age<60)v+=4;if(cached.u.length)v+=10;
 x.matchedImportant=cached.im;x.matchedUrgent=cached.u;x.importanceReason=[...cached.u.map(k=>'عاجل: '+k),...cached.im.map(k=>'مهم: '+k)].slice(0,6);x.isUrgent=(v>=state.settings.breaking||cached.u.length>0)&&age<=60;x.isImportant=v>=state.settings.important&&age<=24*60;return Math.min(100,Math.max(0,v));
}
function tokens(x){const k=itemSig(x);if(tokenCache.has(k))return tokenCache.get(k);const v=new Set(wordTokens((x.title||'')+' '+(x.description||'')).filter(w=>w.length>2&&!STOP.has(w)&&!/^\d+$/.test(w)));tokenCache.set(k,v);return v}
function overlap(a,b){let A=tokens(a),B=tokens(b),shared=0;for(const w of A)if(B.has(w))shared++;return shared/Math.max(1,Math.min(A.size,B.size))}
function keyTerms(x){const k=itemSig(x)+'|'+JSON.stringify(state.rules[x.categoryId]||{});if(keyTermCache.has(k))return keyTermCache.get(k);const all=[...(state.rules[x.categoryId]?.important||[]),...(state.rules[x.categoryId]?.urgent||[])];const t=(x.title||'')+' '+(x.description||'');const v=all.filter(q=>phraseMatch(t,q)).slice(0,8).map(norm);keyTermCache.set(k,v);return v}
function titleTokens(x){const k=itemSig(x);if(titleTokenCache.has(k))return titleTokenCache.get(k);const v=new Set(wordTokens(x.title||'').filter(w=>w.length>2&&!STOP.has(w)&&!/^\d+$/.test(w)));titleTokenCache.set(k,v);return v}
function jaccard(A,B){let u=new Set([...A,...B]);return [...A].filter(x=>B.has(x)).length/Math.max(1,u.size)}
function entityAliases(x,list=PEOPLE){const k=itemSig(x)+'|'+list[0]?.name;if(entityCache.has(k))return entityCache.get(k);let t=(x.title||'')+' '+(x.description||''),v=list.filter(p=>p.aliases.some(a=>phraseMatch(t,a))).map(p=>p.name);entityCache.set(k,v);return v}
function similarity(a,b){
 const at=titleTokens(a),bt=titleTokens(b),af=tokens(a),bf=tokens(b);
 const tj=jaccard(at,bt),fj=jaccard(af,bf);
 const tov=[...at].filter(x=>bt.has(x)).length/Math.max(1,Math.min(at.size,bt.size));
 const keyA=new Set(keyTerms(a)),keyB=new Set(keyTerms(b));
 const sharedKeys=[...keyA].filter(x=>keyB.has(x)).length;
 const sharedPeople=[...new Set(entityAliases(a,PEOPLE))].filter(x=>new Set(entityAliases(b,PEOPLE)).has(x)).length;
 const sharedOrgs=[...new Set(entityAliases(a,ORGANIZATIONS))].filter(x=>new Set(entityAliases(b,ORGANIZATIONS)).has(x)).length;
 const sharedLocs=[...new Set(entityAliases(a,LOCATIONS))].filter(x=>new Set(entityAliases(b,LOCATIONS)).has(x)).length;
 const nums=(String(a.title).match(/\d+(?:[.,]\d+)?/g)||[]).filter(n=>String(b.title).includes(n)).length;
 const sameCat=a.categoryId===b.categoryId?1:0;
 const phraseBoost=(phraseMatch(a.title,b.title)||phraseMatch(b.title,a.title))?0.15:0;
 return Math.round((tj*.30+fj*.18+tov*.16+Math.min(sharedKeys,3)*.05+Math.min(sharedPeople,2)*.10+Math.min(sharedOrgs,2)*.07+Math.min(sharedLocs,2)*.04+Math.min(nums,2)*.025+sameCat*.035+phraseBoost)*100);
}
function activeTime(item){const t=new Date(item.activeAt||item.updatedAt||item.publishedAt||0).getTime();return Number.isFinite(t)?t:0}
function calculateEntityCounts(list,key){
 const now=Date.now(),hours=+state.settings.entityActiveHours||24,cut=now-hours*3600000,counts=new Map();
 for(const item of state.items){const ts=activeTime(item);if(!Number.isFinite(ts)||ts<cut||ts>now+3600000)continue;const text=(item.title||'')+' '+(item.description||'');
  for(const entity of list){if(entity.aliases.some(a=>phraseMatch(text,a))){let x=counts.get(entity.name)||{name:entity.name,count:0,lastAt:item.activeAt||item.publishedAt,aliases:entity.aliases};x.count++;if(activeTime(item)>activeTime({activeAt:x.lastAt}))x.lastAt=item.activeAt||item.publishedAt;counts.set(entity.name,x)}}
 }
 const min=key==='people'?+state.settings.minPeople||3:key==='organizations'?+state.settings.minOrganizations||3:+state.settings.minLocations||3;
 return [...counts.values()].filter(x=>x.count>=min).sort((a,b)=>b.count-a.count||activeTime({activeAt:b.lastAt})-activeTime({activeAt:a.lastAt})).map((x,i)=>({...x,rank:i+1}))
}
function calculatePeople(){return calculateEntityCounts(PEOPLE,'people')}
function calculateOrganizations(){return calculateEntityCounts(ORGANIZATIONS,'organizations')}
function calculateLocations(){return calculateEntityCounts(LOCATIONS,'locations')}


function officialForSource(s){let n=norm(s.name);return (+s.authority>=92)||OFFICIAL_HINTS.some(k=>n.includes(norm(k)))}
function clusterEvents(){
 const now=Date.now(),windowMs=(+state.settings.eventWindowHours||12)*3600000;
 const items=state.items.filter(x=>{const age=now-activeTime(x);return (!x.kind||x.kind==='news')&&age<=windowMs&&age>=-3600000&&activeTime(x)>=now-24*3600000}).sort((a,b)=>activeTime(a)-activeTime(b));
 const byId=new Map(state.sources.map(s=>[s.id,s])),events=[];
 for(const item of items){let best=null,bestSim=0;for(const e of events){const age=Math.abs(activeTime(item)-activeTime(e.lastItem));if(age>windowMs)continue;let localBest=0;for(const anchor of e.articles){localBest=Math.max(localBest,similarity(item,anchor));if(localBest>=82)break}if(localBest>bestSim){bestSim=localBest;best=e}}
  if(best&&bestSim>=(+state.settings.clusterThreshold||46)){best.articles.push(item);if(activeTime(item)>activeTime(best.lastItem))best.lastItem=item;best.lastAt=item.activeAt||item.publishedAt;best.similarities.push(bestSim);if(item.score>best.maxScore)best.maxScore=item.score}else{events.push({id:'evt-'+Date.now().toString(36)+'-'+events.length,articles:[item],firstAt:item.activeAt||item.publishedAt,lastAt:item.activeAt||item.publishedAt,lastItem:item,maxScore:item.score,similarities:[]})}}
 return events.map(e=>{
   let sources=[...new Set(e.articles.map(x=>x.sourceId))].map(id=>byId.get(id)).filter(Boolean),sourceCount=sources.length,itemCount=e.articles.length;
   let last10=e.articles.filter(x=>now-activeTime(x)<=10*60000).length;
   let duration=Math.max(1,(activeTime(e.lastItem)-activeTime(e.articles[0]))/60000);
   let official=sources.some(officialForSource),rapid=(sourceCount>=5&&duration<=30)||(last10>=3&&sourceCount>=3);
   let spread=sourceCount>=8?'واسع':sourceCount>=4?'متعدد':'محدود';
   let previous=e.articles.filter(x=>{let age=now-activeTime(x);return age>60*60000&&age<=120*60000}).length;
   let recent=e.articles.filter(x=>now-activeTime(x)<=60*60000).length;
   let rising=recent>=3&&recent>=Math.max(3,previous*1.5);
   let score=Math.min(100,Math.round(e.maxScore+Math.min(15,sourceCount*2)+(rapid?8:0)+(official?7:0)+(rising?6:0)));
   let lead=[...e.articles].sort((a,b)=>(b.score-a.score)||(+activeTime(b)-+activeTime(a)))[0];
   let title=lead?.title||e.articles[0]?.title||'حدث جديد',reasons=[];
   if(official)reasons.push('تأكيد/تغطية من مصدر رسمي');if(sourceCount>=4)reasons.push(`تغطية من ${sourceCount} مصادر`);if(rapid)reasons.push('انتشار سريع');if(rising)reasons.push('الموضوع في صعود');
   let important=score>=state.settings.important||sourceCount>=4;
   let recentMinutes=(now-activeTime(e.lastItem))/60000;
   let urgent=important&&recentMinutes<=60;
   if(urgent)reasons.push('مهم وحديث خلال آخر ساعة');
   return{id:e.id,title,articles:e.articles.sort((a,b)=>activeTime(b)-activeTime(a)),sourceCount,itemCount,firstAt:e.firstAt,lastAt:e.lastAt,score,official,rapid,rising,spread,reasons,duration,last10,sources:sources.map(s=>({id:s.id,name:s.name,official:officialForSource(s)})),categoryId:lead?.categoryId||'uncategorized',isUrgent:urgent,isImportant:important,velocity:Number((itemCount/Math.max(1,duration)).toFixed(2))};
 }).filter(e=>e.sourceCount>=3).sort((a,b)=>b.score-a.score);
}


function processPayload(payload){
  state={items:payload.items||[],sources:payload.sources||[],rules:payload.rules||{},settings:payload.settings||{}};
  const now=Number(payload.now)||Date.now();
  state.items.forEach(x=>{ x.score=score(x); });
  const events=clusterEvents();
  const people=calculateEntityCounts(PEOPLE,'people');
  const organizations=calculateEntityCounts(ORGANIZATIONS,'organizations');
  const locations=calculateEntityCounts(LOCATIONS,'locations');
  return {items:state.items,events,people,organizations,locations,at:new Date(now).toISOString()};
}
parentPort.on('message',(msg)=>{
  try{ parentPort.postMessage({id:msg.id,ok:true,result:processPayload(msg.payload)}); }
  catch(error){ parentPort.postMessage({id:msg.id,ok:false,error:error?.message||String(error)}); }
});
