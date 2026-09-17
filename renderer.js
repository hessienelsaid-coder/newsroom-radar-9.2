let D={items:[],sources:[],categories:[],rules:{},events:[],settings:{},people:[],organizations:[],locations:[]};
let view='all',sourceView=null,eventView=null,entityView=null;
const $=x=>document.getElementById(x);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function catName(id){return(D.categories.find(c=>c.id===id)||{name:'غير مصنف'}).name}
function fmtDate(d){let x=new Date(d);return Number.isNaN(x.getTime())?'—':new Intl.DateTimeFormat('ar-SA-u-ca-gregory',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(x)}
function ago(d){let m=Math.max(0,Math.round((Date.now()-new Date(d))/60000));return m<1?'الآن':m<60?`قبل ${m} د`:m<1440?`قبل ${Math.round(m/60)} س`:`قبل ${Math.round(m/1440)} يوم`}
function phraseInText(text,phrase){let a=String(text||'').toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}\s]/gu,' ').split(/\s+/).filter(Boolean),b=String(phrase||'').toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}\s]/gu,' ').split(/\s+/).filter(Boolean);if(!b.length)return false;for(let i=0;i<=a.length-b.length;i++){let ok=true;for(let j=0;j<b.length;j++)if(a[i+j]!==b[j]){ok=false;break}if(ok)return true}return false}
function renderNav(){
 let cats=[...D.categories].sort((a,b)=>(a.order||99)-(b.order||99));
 $('nav').innerHTML=`<button class="nav ${view==='all'&&!sourceView&&!entityView?'active':''}" data-v="all"><span>الرئيسية</span><span class="count">${D.items.length}</span></button>`+
 cats.filter(c=>c.id!=='uncategorized').map(c=>`<button class="nav ${view===c.id&&!sourceView&&!entityView?'active':''}" data-v="${esc(c.id)}">${esc(c.name)} <span class="count">${D.sources.filter(s=>s.categoryId===c.id).length}</span></button>`).join('')+
 `<button class="nav ${view==='uncategorized'&&!sourceView&&!entityView?'active':''}" data-v="uncategorized">غير مصنف <span class="count">${D.sources.filter(s=>s.categoryId==='uncategorized').length}</span></button>`+
 `<button class="nav ${view==='sources'?'active':''}" data-v="sources">إدارة المصادر</button>`;
 document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>switchView(b.dataset.v));
}
function renderSourceNav(){
 let health=new Map((D.health||[]).map(x=>[x.id,x]));
 $('sourceNav').innerHTML=D.sources.filter(s=>s.enabled).map(s=>{let h=health.get(s.id),ok=h?h.ok:true;return `<button class="srcBtn ${sourceView===s.id?'active':''}" data-src="${esc(s.id)}"><span class="srcName"><i class="dot ${ok?'':'bad'}"></i>${esc(s.name)}</span><span class="srcMeta">${h?(ok?`${h.count} خبر`:'خطأ'):D.items.filter(x=>x.sourceId===s.id).length+' خبر'}</span></button>`}).join('');
 document.querySelectorAll('[data-src]').forEach(b=>b.onclick=()=>{sourceView=b.dataset.src;entityView=null;view='source';showMainArea();renderNav();renderSourceNav();render()});
}
function showMainArea(){
 const special=['sources','cats','rules','events','breaking','important','trending','people','organizations','locations','settings'];
 $('newsView').classList.toggle('hidden',special.includes(view));
 $('eventsView').classList.toggle('hidden',!['events','breaking','important','trending'].includes(view));
 $('peopleView').classList.toggle('hidden',view!=='people');
 $('organizationsView').classList.toggle('hidden',view!=='organizations');
 $('locationsView').classList.toggle('hidden',view!=='locations');
 
 $('eventDetail').classList.add('hidden');
 $('sourcesView').classList.toggle('hidden',view!=='sources');
 $('catsView').classList.toggle('hidden',view!=='cats');
 $('rulesView').classList.toggle('hidden',view!=='rules');
 $('settingsView').classList.toggle('hidden',view!=='settings');
}
function switchView(v){
 view=v;
 if(v!=='source')sourceView=null;
 if(v!=='people'&&v!=='organizations'&&v!=='locations'&&v!=='all'&&v!=='source')entityView=null;
 eventView=null;
 showMainArea();
 renderNav();renderSourceNav();
 $('title').textContent=v==='sources'?'إدارة المصادر':v==='cats'?'إدارة التبويبات':v==='rules'?'قواعد الأهمية والتصنيف':v==='settings'?'الإعدادات':v==='events'?'الأحداث الآن':v==='breaking'?'الأحداث العاجلة':v==='important'?'الأحداث المهمة':v==='trending'?'الموضوعات الصاعدة':v==='people'?'الشخصيات الأكثر تداولاً':v==='organizations'?'الجهات والمؤسسات الأكثر تداولاً':v==='locations'?'المواقع الجغرافية الأكثر تداولاً':v==='all'?'الرادار الإخباري':v==='source'?(D.sources.find(s=>s.id===sourceView)?.name||'المصدر'):catName(v);
 if(v==='rules')renderRules();if(v==='sources')renderSources();if(v==='cats')renderCats();if(['events','breaking','important','trending'].includes(v))renderEvents();if(v==='people')renderPeople();if(v==='organizations')renderOrganizations();if(v==='locations')renderLocations();if(v==='settings')renderSettings();if(!['sources','cats','rules','events','breaking','important','trending','people','organizations','locations','settings'].includes(v))render();
}
function render(){
 let q=$('search').value.toLowerCase();
 let entity=entityView;
 let a=D.items.filter(x=>{
  let text=(x.title+' '+x.description).toLowerCase();
  if(q&&!text.includes(q))return false;
  if(entity&&!entity.aliases.some(k=>phraseInText(text,String(k))))return false;
  if(sourceView)return x.sourceId===sourceView;
  if(x.kind&&x.kind!=='news')return false;
  if(view==='all')return true;
  return x.categoryId===view;
 });
 a.sort((x,y)=>$('sort').value==='score'?y.score-x.score:new Date(y.publishedAt)-new Date(x.publishedAt));
 $('feed').innerHTML=a.slice(0,600).map(x=>`<article class="card ${x.isUrgent?'hot':x.isImportant?'imp':''}"><div><div class="badges">${x.isUrgent?'<span class="badge r">عاجل</span>':''}${x.isImportant?'<span class="badge i">مهم</span>':''}</div><div class="meta">${esc(x.sourceName)} · ${esc(catName(x.categoryId))} · ${fmtDate(x.publishedAt)}</div><div class="ttl" data-u="${esc(x.link)}">${esc(x.title)}</div>${x.description?`<div class="desc">${esc(x.description)}</div>`:''}${x.importanceReason?.length?`<div class="meta">سبب التصنيف: ${esc(x.importanceReason.join(' • '))}</div>`:''}</div><div><div class="score">${x.score}</div><button class="open" data-u="${esc(x.link)}">فتح ↗</button></div></article>`).join('');
 updateStats();
 document.querySelectorAll('[data-u]').forEach(e=>e.onclick=()=>window.radar.open(e.dataset.u));
 let hint=entity?`عرض ${entity.kind}: ${esc(entity.name)} — ${a.length} خبر`:sourceView?`عرض المصدر: ${esc(D.sources.find(s=>s.id===sourceView)?.name||'')}: ${a.length} خبر`:view!=='all'?`عرض قسم: ${esc(catName(view))}`:'';
 $('filterHint').innerHTML=hint;$('filterHint').classList.toggle('hidden',!hint);
}
function updateStats(){
 $('all').textContent=D.items.filter(x=>!x.kind||x.kind==='news').length;
 $('eventsCount').textContent=D.events.length;
 $('imp').textContent=D.events.filter(e=>e.isImportant).length;
 $('brk').textContent=D.events.filter(e=>e.isUrgent).length;
 $('trendingCount').textContent=D.events.filter(e=>e.rising).length;
 $('peopleCount').textContent=(D.people||[]).length;
 $('orgCount').textContent=(D.organizations||[]).length;
 $('locCount').textContent=(D.locations||[]).length;

}
function eventCard(e){return `<article class="eventCard ${e.isUrgent?'eventHot':''}" data-event="${esc(e.id)}"><div class="eventTop"><div><div class="badges">${e.isUrgent?'<span class="badge r">عاجل</span>':''}${e.official?'<span class="badge ok">مؤكد رسمياً</span>':''}${e.rapid?'<span class="badge wave">موجة سريعة</span>':''}</div><h3>${esc(e.title)}</h3><div class="meta">${esc(catName(e.categoryId))} · ${ago(e.lastAt)} · ${e.spread} التغطية</div></div><div class="eventScore">${e.score}</div></div><div class="eventMetrics"><span>◉ ${e.sourceCount} مصادر</span><span>📰 ${e.itemCount} تحديث</span><span>⚡ ${e.velocity}/دقيقة</span>${e.rising?'<span>📈 صاعد</span>':''}</div><div class="eventReason">${esc(e.reasons.join(' · ')||'حدث قيد المراقبة')}</div></article>`}
async function refresh(){
 const btn=$('refresh');
 const last=$('last');
 if(btn.disabled)return;
 btn.disabled=true;
 last.textContent='جاري التحديث...';
 try{
   const payload=await window.radar.refresh();
   if(payload){
     D={...D,...payload};
     renderNav();renderSourceNav();
     if(view==='sources')renderSources();
     else if(view==='cats')renderCats();
     else if(view==='rules')renderRules();
     else if(['events','breaking','important','trending'].includes(view))renderEvents();
     else if(view==='people')renderPeople();
     else if(view==='organizations')renderOrganizations();
     else if(view==='locations')renderLocations();
     else render();
     if(payload.at)$('time').textContent=fmtDate(payload.at);
   }
   last.textContent='تم التحديث';
 }catch(e){
   last.textContent='تعذر تحديث البيانات';
   console.error('Refresh failed:',e);
 }finally{
   btn.disabled=false;
 }
}
$('refresh').onclick=refresh;
if(window.radar.onRefreshStatus)window.radar.onRefreshStatus(s=>{
 if(!s)return;
 const last=$('last');
 if(s.phase==='fetching')last.textContent='جاري جلب المصادر...';
 else if(s.phase==='processing')last.textContent=s.message||'جاري التحليل في الخلفية...';
 else if(s.phase==='done')last.textContent='تم التحديث';
});

function renderEvents(){let a=[...D.events];if(view==='breaking')a=a.filter(e=>e.isUrgent);if(view==='important')a=a.filter(e=>e.isImportant);if(view==='trending')a=a.filter(e=>e.rising);a.sort((x,y)=>y.score-x.score);$('eventsFeed').innerHTML=a.map(eventCard).join('')||'<div class="empty">لا توجد أحداث مطابقة حالياً.</div>';document.querySelectorAll('[data-event]').forEach(e=>e.onclick=()=>showEvent(e.dataset.event));$('eventSub').textContent=view==='trending'?'الأحداث التي يتزايد انتشارها الآن':view==='breaking'?'الأحداث العاجلة فقط':view==='important'?'الأحداث المهمة فقط':'تجميع تلقائي للتغطية المتشابهة وتتبع تطور الحدث'}
function entityCard(e,kind){return `<article class="entityCard" data-entity-kind="${esc(kind)}" data-entity-name="${esc(e.name)}"><div class="entityRank">#${e.rank}</div><div class="entityMain"><h3>${esc(e.name)}</h3><div class="entityMeta">${e.count} أخبار · ${e.lastAt?ago(e.lastAt):'—'}</div></div><strong class="entityCount">${e.count}</strong></article>`}
function renderPeople(){let a=[...(D.people||[])].sort((x,y)=>y.count-x.count||x.name.localeCompare(y.name,'ar'));$('peopleFeed').innerHTML=a.map(p=>entityCard(p,'الشخصية')).join('')||`<div class="empty">لا توجد شخصيات تجاوزت الحد الأدنى الحالي (${D.settings.minPeople||3} أخبار).</div>`;bindEntities()}
function renderOrganizations(){let a=[...(D.organizations||[])].sort((x,y)=>y.count-x.count||x.name.localeCompare(y.name,'ar'));$('organizationsFeed').innerHTML=a.map(p=>entityCard(p,'الجهة')).join('')||`<div class="empty">لا توجد جهات تجاوزت الحد الأدنى الحالي (${D.settings.minOrganizations||3} أخبار).</div>`;bindEntities()}
function renderLocations(){let a=[...(D.locations||[])].sort((x,y)=>y.count-x.count||x.name.localeCompare(y.name,'ar'));$('locationsFeed').innerHTML=a.map(p=>entityCard(p,'الموقع')).join('')||`<div class="empty">لا توجد مواقع تجاوزت الحد الأدنى الحالي (${D.settings.minLocations||3} أخبار).</div>`;bindEntities()}
function bindEntities(){document.querySelectorAll('[data-entity-name]').forEach(e=>e.onclick=()=>{let kind=e.dataset.entityKind,name=e.dataset.entityName,list=kind==='الشخصية'?D.people:kind==='الجهة'?D.organizations:D.locations,entity=list.find(x=>x.name===name);if(!entity)return;entityView={name:entity.name,aliases:entity.aliases||[entity.name],kind};sourceView=null;view='all';switchView('all')})}
function showEvent(id){let e=D.events.find(x=>x.id===id);if(!e)return;eventView=id;$('eventsView').classList.add('hidden');$('eventDetail').classList.remove('hidden');$('title').textContent='تفاصيل الحدث';$('detail').innerHTML=`<button class="back" id="backEvents">← العودة للأحداث</button><div class="detailHead"><div><div class="badges">${e.isUrgent?'<span class="badge r">عاجل</span>':''}${e.official?'<span class="badge ok">مؤكد رسمياً</span>':''}${e.rapid?'<span class="badge wave">موجة سريعة</span>':''}</div><h2>${esc(e.title)}</h2><div class="meta">أول ظهور: ${fmtDate(e.firstAt)} · آخر تحديث: ${fmtDate(e.lastAt)}</div></div><strong class="bigScore">${e.score}</strong></div><div class="detailGrid"><div class="miniStat"><b>${e.sourceCount}</b><span>مصادر</span></div><div class="miniStat"><b>${e.itemCount}</b><span>تحديثات</span></div><div class="miniStat"><b>${e.velocity}</b><span>تحديث/دقيقة</span></div><div class="miniStat"><b>${e.duration}</b><span>دقيقة نشاط</span></div></div><div class="why"><h3>لماذا هذا الحدث مهم؟</h3><p>${esc(e.reasons.join(' · ')||'لا توجد إشارة إضافية')}</p></div><h3>التسلسل الزمني للتغطية</h3><div class="timeline">${e.articles.map(a=>`<div class="tl"><div class="tlTime">${fmtDate(a.publishedAt)}</div><div class="tlBody"><b>${esc(a.sourceName)}</b><span class="sourceMark ${a.authority>=92?'official':''}">${a.authority>=92?'مصدر رسمي':''}</span><a href="#" data-u="${esc(a.link)}">${esc(a.title)}</a><small>درجة الخبر ${a.score}</small></div></div>`).join('')}</div>`;document.querySelectorAll('[data-u]').forEach(x=>x.onclick=ev=>{ev.preventDefault();window.radar.open(x.dataset.u)});$('backEvents').onclick=()=>{eventView=null;switchView(view==='source'?'events':view)}}
function sourcePayload(){return {name:$('sname').value.trim(),url:$('surl').value.trim(),authority:+$('sauth').value||75,categoryId:$('scat').value,kind:'news',platform:'RSS / Atom'}}
function showSourceTest(text,ok=false){$('sourceTest').textContent=text;$('sourceTest').className='sourceTest '+(ok?'ok':'bad')}
function fillCats(){let o=D.categories.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');$('scat').innerHTML=o;$('importCat').innerHTML=o}
$('testSource').onclick=async()=>{try{const p=sourcePayload();if(!p.name)return showSourceTest('أدخل اسم المصدر.');if(!p.url||!/^https?:\/\//i.test(p.url))return showSourceTest('أدخل رابط RSS / Atom رسميًا.');showSourceTest('جاري اختبار RSS / Atom...');const r=await window.radar.testSource(p);showSourceTest(`✓ نجح الاختبار — RSS / Atom مباشر · ${r.total} خبرًا مؤرخًا · ${r.count} خلال آخر 24 ساعة · أحدث خبر: ${ago(r.newestAt)}.`,true);$('add').disabled=false}catch(e){$('add').disabled=true;showSourceTest('✕ لم يعمل المصدر — '+(e.message||'الرابط ليس RSS / Atom مباشرًا.'))}};
$('add').onclick=async()=>{try{const p=sourcePayload();if(!p.name)return showSourceTest('أدخل اسم المصدر.');if(!p.url||!/^https?:\/\//i.test(p.url))return showSourceTest('أدخل رابط RSS / Atom صحيحًا.');D.sources=await window.radar.add(p);$('sname').value='';$('surl').value='';$('add').disabled=true;showSourceTest('✓ تمت إضافة المصدر — جارٍ الجلب والتحليل في الخلفية.',true);renderSources();renderNav();renderSourceNav()}catch(e){showSourceTest('✕ '+(e.message||'تعذر إضافة المصدر.'))}};
$('import').onclick=async()=>{D.sources=await window.radar.importOPML($('importCat').value);renderSources();renderNav();renderSourceNav();refresh()};$('export').onclick=()=>window.radar.exportOPML();
$('addCat').onclick=async()=>{let n=$('catName').value.trim();if(!n)return;try{D.categories=await window.radar.addCategory(n);$('catName').value='';renderCats();renderNav();fillCats()}catch(e){alert(e.message||e)}};
if(window.radar.onStateSync)window.radar.onStateSync(r=>{D={...D,...r};renderNav();renderSourceNav();if(view==='sources')renderSources();else if(view==='cats')renderCats();else if(view==='rules')renderRules();else if(view==='settings')renderSettings();else if(['events','breaking','important','trending'].includes(view))renderEvents();else if(view==='people')renderPeople();else if(view==='organizations')renderOrganizations();else if(view==='locations')renderLocations();else render();if(r.at)$('time').textContent=fmtDate(r.at)});
setInterval(()=>{if($('auto').checked&&!$('refresh').disabled)refresh()},60000);
(async()=>{try{D=await window.radar.data();renderNav();renderSourceNav();render();await refresh()}catch(e){$('last').textContent='تعذر تحميل البيانات'}})();
