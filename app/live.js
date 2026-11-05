/* ================= LV People live layer =================
   The prototype screens stay exactly as they are. This file only:
   1. signs in through Supabase (company code + employee code + password),
   2. loads the client's organisation and employees from the database into the prototype data,
   3. saves employee and organisation changes back to the database.
   Modules not connected yet keep showing the prototype sample data; a note at the top says so. */
(function(){
if(!window.supabase){document.body.innerHTML='<div style="min-height:100vh;display:grid;place-items:center;padding:16px;font-family:system-ui"><div style="max-width:380px;text-align:center"><h1 style="color:#1f3a5f">LV People</h1><p>Internet is not available, or it is very slow. Please check the connection and reload the page.</p><p>इंटरनेट उपलब्ध नहीं है या बहुत धीमा है। कनेक्शन जाँचें और पेज दोबारा खोलें।</p><button onclick="location.reload()" style="padding:8px 16px">Reload</button></div></div>';return}
const sb=window.supabase.createClient('https://okhikmjugdytahgnddjm.supabase.co','sb_publishable_2rSs43HfAzKoTbqw5_AQkA_7XzAxMv0',{auth:{persistSession:true,autoRefreshToken:true}});
const LIVE=window.LIVE={sb,on:false,profile:null,client:null,platform:false,map:{},rev:{},snap:{},busy:false,queued:false,err:''};
const KINDS=['branches','divisions','depts','functions','desigs','emps'];
const TBL={branches:'branches',divisions:'divisions',depts:'departments',functions:'job_functions',desigs:'designations',emps:'employees'};
KINDS.forEach(k=>{LIVE.map[k]={};LIVE.rev[k]={};LIVE.snap[k]={}});
const nz=v=>v===''||v===undefined?null:v;
const isHRrole=()=>['admin','hr'].includes(LIVE.profile&&LIVE.profile.role);

/* ---------- database row <-> prototype object ---------- */
const P1=a=>(a&&a.length?a[0]:null);
function toRow(kind,o){const r=toRow0(kind,o);r.num_id=+o.id||null;return r}
function toRow0(kind,o){const M=LIVE.map, c=LIVE.profile.client_id;
  if(kind==='branches')return{client_id:c,name:o.name,city:nz(o.city),state:nz(o.state),pin:nz(o.pin),address:nz(o.line),zone:nz(o.zone),active:o.off?false:true};
  if(kind==='divisions')return{client_id:c,name:o.name,active:o.off?false:true};
  if(kind==='depts')return{client_id:c,name:o.name,division_id:M.divisions[P1(o.parents)]||null,active:o.off?false:true};
  if(kind==='functions')return{client_id:c,name:o.name,department_id:M.depts[P1(o.parents)]||null,active:o.off?false:true};
  if(kind==='desigs')return{client_id:c,name:o.name,level:nz(o.level),function_id:M.functions[P1(o.parents)]||null,active:o.off?false:true};
  const em=[1,2].filter(i=>o['ec'+i+'_name']).map(i=>({name:o['ec'+i+'_name'],relation:o['ec'+i+'_rel']||'',mobile:o['ec'+i+'_mob']||''}));
  return{client_id:c,code:o.code,name:o.name,mobile:nz(o.mobile),email:nz(o.email),dob:nz(o.dob),gender:['M','F','O'].includes(o.gender)?o.gender:null,doj:nz(o.doj),
    branch_id:M.branches[o.branch]||null,division_id:M.divisions[o.division]||null,department_id:M.depts[o.dept]||null,function_id:M.functions[o.func]||null,designation_id:M.desigs[o.desig]||null,
    manager_id:o.mgr?(M.emps[+o.mgr]||null):null,level:+o.level||1,status:o.status||'Working',lwd:nz(o.lwd),active:o.active!==false,caste:nz(o.caste),marital_status:nz(o.marital),weekly_off:nz(o.wo),emergency:em}}
function toPriv(o){return{client_id:LIVE.profile.client_id,ctc:+o.ctc||0,pan:nz(o.pan),aadhaar:nz(o.aadhaar),uan:nz(o.uan),esi:nz(o.esi),bank_name:nz(o.bank),ifsc:nz(o.ifsc),account_no:nz(o.acc)}}
const sig=(kind,o)=>JSON.stringify(kind==='emps'?[toRow(kind,o),isHRrole()?toPriv(o):null]:toRow(kind,o));

/* ---------- load ---------- */
async function q(t,sel){const r=await sb.from(t).select(sel||'*');if(r.error)throw r.error;return r.data||[]}
async function loadLive(){
  const [br,dv,dp,fn,dg,em]=await Promise.all([q('branches'),q('divisions'),q('departments'),q('job_functions'),q('designations'),q('employees')]);
  let pv=[];try{pv=await q('employee_private')}catch(e){pv=[]}
  const pick=(kind,rows,keyOf,build)=>{const old=DATA[kind].slice(), used=new Set();let next=Math.max(0,...old.map(x=>+x.id||0),...rows.map(r=>+r.num_id||0))+1;const out=[];
    rows.sort((a,b)=>(a.num_id||1e9)-(b.num_id||1e9));
    rows.forEach(r=>{let o, id;
      if(r.num_id){id=r.num_id;o=old.find(x=>x.id===id&&!used.has(id))||{id}}
      else{o=old.find(x=>!used.has(x.id)&&keyOf(x)===keyOf(r)&&!rows.some(z=>z.num_id===x.id));if(o)id=o.id;else{id=next++;o={id}}LIVE.needNum.push([TBL[kind],r.id,id])}
      used.add(id);LIVE.map[kind][id]=r.id;LIVE.rev[kind][r.id]=id;out.push({o,r,id})});
    out.forEach(x=>build(x.o,x.r));DATA[kind].length=0;out.forEach(x=>DATA[kind].push(x.o))};
  LIVE.needNum=[];
  const nmKey=x=>String(x.name||'').trim().toLowerCase();
  pick('branches',br,nmKey,(o,r)=>Object.assign(o,{name:r.name,city:r.city||'',state:r.state||'',pin:r.pin||'',line:r.address||'',zone:r.zone||'',off:!r.active}));
  pick('divisions',dv,nmKey,(o,r)=>Object.assign(o,{name:r.name,parents:o.parents||[1],off:!r.active}));
  pick('depts',dp,nmKey,(o,r)=>Object.assign(o,{name:r.name,head:o.head||'',parents:r.division_id?[LIVE.rev.divisions[r.division_id]]:[],off:!r.active}));
  pick('functions',fn,nmKey,(o,r)=>Object.assign(o,{name:r.name,parents:r.department_id?[LIVE.rev.depts[r.department_id]]:[],off:!r.active}));
  pick('desigs',dg,nmKey,(o,r)=>Object.assign(o,{name:r.name,level:r.level||o.level||'',parents:r.function_id?[LIVE.rev.functions[r.function_id]]:[],off:!r.active}));
  const codeKey=x=>String(x.code||'').toUpperCase();
  pick('emps',em,codeKey,(o,r)=>{const p=pv.find(z=>z.employee_id===r.id)||{}, ec=r.emergency||[];
    Object.assign(o,{code:r.code,name:r.name,mobile:r.mobile||'',email:r.email||'',dob:r.dob||'',gender:r.gender||'',doj:r.doj||'',branch:LIVE.rev.branches[r.branch_id]||'',division:LIVE.rev.divisions[r.division_id]||'',dept:LIVE.rev.depts[r.department_id]||'',func:LIVE.rev.functions[r.function_id]||'',desig:LIVE.rev.desigs[r.designation_id]||'',
      level:r.level||1,status:r.status||'Working',lwd:r.lwd||'',active:r.active,caste:r.caste||o.caste||'',marital:r.marital_status||'',wo:r.weekly_off||'',
      ctc:+p.ctc||0,pan:p.pan||'',aadhaar:p.aadhaar||'',uan:p.uan||'',esi:p.esi||'',bank:p.bank_name||'',ifsc:p.ifsc||'',acc:p.account_no||'',
      ec1_name:(ec[0]||{}).name||'',ec1_rel:(ec[0]||{}).relation||'',ec1_mob:(ec[0]||{}).mobile||'',ec2_name:(ec[1]||{}).name||'',ec2_rel:(ec[1]||{}).relation||'',ec2_mob:(ec[1]||{}).mobile||'',
      hist:o.hist||[],lvlHist:o.lvlHist||[{from:'0000-00',lvl:r.level||1,desig:LIVE.rev.desigs[r.designation_id]||''}],createdAt:o.createdAt||(r.created_at||'').slice(0,10),fm:o.fm||''})});
  DATA.emps.forEach(o=>{const r=em.find(z=>z.id===LIVE.map.emps[o.id]);o.mgr=r&&r.manager_id&&LIVE.rev.emps[r.manager_id]?String(LIVE.rev.emps[r.manager_id]):''});
  KINDS.forEach(k=>DATA[k].forEach(o=>LIVE.snap[k][o.id]=sig(k,o)));
  if(isHRrole())for(const [t,uuid,n] of LIVE.needNum){await sb.from(t).update({num_id:n}).eq('id',uuid)}
  try{if(typeof accSync==='function')accSync()}catch(e){}
  await loadAttendance();await loadStores();await loadKpis();
}

/* ---------- attendance punches: the attendance table <-> ATT ---------- */
const IST=330*60000;
const t12=ts=>{if(!ts)return '';const d=new Date(new Date(ts).getTime()+IST);let h=d.getUTCHours(), m=d.getUTCMinutes();const ap=h<12?'am':'pm';h=h%12||12;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')} ${ap}`};
const toTs=(date,s)=>{if(!s)return null;const n=toMin(s);if(n==null)return null;return `${date}T${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}:00+05:30`};
LIVE.attSnap={};
async function loadAttendance(){
  const from=PERIODS.length?payKey(PERIODS[0])+'-01':TODAY_S;let rows=[], page=0;
  while(true){const r=await sb.from('attendance').select('employee_id,work_date,in_time,out_time,source').gte('work_date',from).range(page*1000,page*1000+999);if(r.error)throw r.error;rows=rows.concat(r.data||[]);if(!r.data||r.data.length<1000)break;page++}
  Object.keys(ATT).forEach(k=>delete ATT[k]);
  rows.forEach(r=>{const n=LIVE.rev.emps[r.employee_id];if(!n)return;ATT[n+'|'+r.work_date]={in:t12(r.in_time),out:t12(r.out_time),src:r.source==='Web'?'GPS selfie':r.source,bio:true}});
  LIVE.attSnap={};Object.keys(ATT).forEach(k=>LIVE.attSnap[k]=JSON.stringify(ATT[k]));
}
async function syncAttendance(){
  const me=LIVE.profile&&LIVE.rev.emps[LIVE.profile.employee_id];
  for(const k of Object.keys(ATT)){const v=ATT[k], s=JSON.stringify(v);if(LIVE.attSnap[k]===s)continue;const [n,date]=k.split('|'), uuid=LIVE.map.emps[+n];if(!uuid){LIVE.attSnap[k]=s;continue}
    const old=LIVE.attSnap[k]?JSON.parse(LIVE.attSnap[k]):{};
    if(+n===me&&date===TODAY_S&&((v.in&&!old.in)||(v.out&&!old.out))){const r=await sb.rpc('punch');if(r.error)throw r.error;
      const a=(await sb.from('attendance').select('in_time,out_time').eq('employee_id',uuid).eq('work_date',date).maybeSingle()).data;if(a){v.in=t12(a.in_time);v.out=t12(a.out_time);v.bio=true}}
    else if(isHRrole()&&(v.in||v.out||v.status)){const row={client_id:LIVE.profile.client_id,employee_id:uuid,work_date:date,in_time:toTs(date,v.in),out_time:toTs(date,v.out),source:v.src||'Imported',note:v.status||null};
      const r=await sb.from('attendance').upsert(row,{onConflict:'employee_id,work_date'});if(r.error)throw r.error}
    LIVE.attSnap[k]=JSON.stringify(v)}
}

/* ---------- the other prototype stores (leave, attendance requests, time office, payroll) ---------- */
const CONFIG=['SHIFTS','HBANK','HCAL','ATPOL','LT','LRULE','PHEADS','STAT','PAYRUN','ADJHEADS','ADVPOL','LTYPES','LTC','LTI','LTM','LTR','LTSW','LPRE','LVR','CHK','WFD','TAR','CCT','RFR','SLA','CHKLINK','FBQ','ALTJT','ALTP','QB','STG','XTYPE','SLCAT','BIOSRC','BIODEV','XQT'];
const DATASTORES=['AR','REGS','IMPORTS','ASSIGN','RH','LEAVES','ADJ','ADV','FS','INCASG','ENC','ACORR','STATA','BANK','VARS','ATTP','ADVL','INCS','LADJ','CF','STATV','MRATE','KFS','AUD','CT','SURV','POLLS','TASKS','WFI','DEC','MTG','CHAL','RFL','BIL','CLF','EL','SVL','EVP','CCO','STKA','SUPT','AIS','AREQ','KYC','FBT','FBF','CFB','CMP','PAY','PAYB','INCREG','OTL','SHORT','LOCR','INDP','ASG','TODO','DAILYT','WARNLOG','HOLD','HOLDREL','KBA','BIOP','BIOIMP','SLC','SLASG','SLP','SLT','SLCERT','SLLOG','CREQ','XADV','XREP','XPAY','XRES','XIT','CHE','AND','NTC','POLL','DOCS','LETTERS','LTR','RECOG','UREQ','WISH','XTRIP','RC','SRC','KRULES','SSTR','TGR','AST'];
const EMPSTORES=['LEAVES','AR','REGS','RH','ADV','MRATE','AUD','CT','KYC','SURV','TASKS','WFI','DEC','MTG','CHAL','RFL','BIL','CLF','EL','SVL','EVP','CCO','STKA','SUPT','AIS','AREQ','FBT','CFB','ASG','TODO','DAILYT','SLP','SLASG','SLLOG','SLT','SLCERT','CREQ','XADV','XREP','XRES','XTRIP','UREQ','WISH','CHE','POLL','RECOG'];
const involved=(x,me,team,store,key)=>{if(store==='MRATE'||store==='CT')return team.has(+String(key).slice(2).split('|')[0]);if(store==='KYC')return +String(key).slice(2).split('|')[0]===me;if(!x||typeof x!=='object')return false;
  if(['emp','by','mgr','owner','assignee','auditor','chair','reviewer'].some(f=>+x[f]===me))return true;if(['to','att','invited','emps','done'].some(f=>Array.isArray(x[f])&&x[f].includes(me)))return true;
  if(Array.isArray(x.steps)&&x.steps.some(s=>Array.isArray(s.holders)&&s.holders.includes(me)))return true;return team.has(+x.emp)};
const ref=n=>{try{return eval(n)}catch(e){return undefined}};
const hasFn=x=>{try{return /^function|=>/.test('')||Object.values(x||{}).some(y=>typeof y==='function')}catch(e){return true}};
const itemsOf=n=>{const v=ref(n);if(v==null||typeof v!=='object'||hasFn(v)||(Array.isArray(v)&&v.some(x=>x&&typeof x==='object'&&hasFn(x))))return null;const o={};if(Array.isArray(v))v.forEach((x,i)=>{o[x&&x.id!=null?'id:'+x.id:'i:'+i]=x});else Object.keys(v).forEach(k=>o['k:'+k]=v[k]);return o};
LIVE.stSnap={};
async function loadStores(){
  let rows=[], page=0;while(true){const r=await sb.from('app_store').select('store,key,data').range(page*1000,page*1000+999);if(r.error)throw r.error;rows=rows.concat(r.data||[]);if(!r.data||r.data.length<1000)break;page++}
  const demo=LIVE.client&&LIVE.client.code==='demo';
  for(const n of [...CONFIG,...DATASTORES]){const v=ref(n);if(v==null||!itemsOf(n))continue;const mine=rows.filter(r=>r.store===n);
    if(!mine.length){ if(!demo&&DATASTORES.includes(n)){if(Array.isArray(v))v.length=0;else Object.keys(v).forEach(k=>{if(Array.isArray(v[k]))v[k]=[];else delete v[k]})}
      if(!demo&&n==='PAYRUN')Object.keys(v).forEach(k=>v[k]='draft');
      LIVE.stSnap[n]={}; continue }
    if(Array.isArray(v)){v.length=0;mine.sort((a,b)=>{const x=a.key.split(':'), y=b.key.split(':');return (+x[1]||0)-(+y[1]||0)}).forEach(r=>v.push(r.data))}
    else{Object.keys(v).forEach(k=>delete v[k]);mine.forEach(r=>{v[r.key.slice(2)]=r.data})}
    LIVE.stSnap[n]={};mine.forEach(r=>LIVE.stSnap[n][r.key]=JSON.stringify(r.data))}
  try{if(typeof syncHoli==='function')syncHoli()}catch(e){}
  /* new records must not reuse an id that is already stored */
  let mx=0;rows.forEach(r=>{const id=r.data&&+r.data.id;if(id&&id<1e12&&id>mx)mx=id});
  try{if(mx>=seq)seq=mx+1}catch(e){}
}
async function syncStores(){
  const hr=isHRrole();
  for(const n of [...CONFIG,...DATASTORES]){if(!hr&&!EMPSTORES.includes(n))continue;const items=itemsOf(n);if(!items)continue;const snap=LIVE.stSnap[n]||(LIVE.stSnap[n]={});
    let up=[];Object.keys(items).forEach(k=>{const s=JSON.stringify(items[k]);if(s!==undefined&&snap[k]!==s)up.push({client_id:LIVE.profile.client_id,store:n,key:k,data:items[k]})});
    const gone=hr?Object.keys(snap).filter(k=>!(k in items)):[];
    if(hr){for(let i=0;i<up.length;i+=200){const r=await sb.from('app_store').upsert(up.slice(i,i+200));if(r.error)throw r.error}}
    else{/* not HR: only own requests and the team's approvals go to the server, one by one; the server checks each */
      const me=LIVE.rev.emps[LIVE.profile.employee_id], team=new Set(DATA.emps.filter(e=>+e.mgr===me).map(e=>e.id));
      const mine=up.filter(x=>involved(x.data,me,team,n,x.key));up.filter(x=>!mine.includes(x)).forEach(x=>snap[x.key]=JSON.stringify(x.data));
      for(const x of mine){const r=await sb.from('app_store').upsert(x);if(r.error){LIVE.err=r.error.message;try{toast(L('Not saved: ','सेव नहीं हुआ: ')+r.error.message)}catch(e){}}}
      up=mine}
    if(gone.length){const r=await sb.from('app_store').delete().eq('store',n).in('key',gone);if(r.error)throw r.error}
    up.forEach(x=>snap[x.key]=JSON.stringify(x.data));gone.forEach(k=>delete snap[k])}
}
/* ---------- KPIs: one library kept by LV People, one pack per client ---------- */
LIVE.lib={};LIVE.pack={};LIVE.kpiSnap={};
const kpiKey=k=>JSON.stringify([+k.max,k.active!==false]);
async function loadKpis(){
  const [lib,pack]=await Promise.all([q('kpi_library'),q('client_kpi_pack')]);
  LIVE.lib={};lib.forEach(r=>LIVE.lib[r.id]=r);LIVE.pack={};pack.forEach(r=>LIVE.pack[r.kpi_id]=r);
  const mods=(LIVE.client&&LIVE.client.modules)||[];
  KPI.length=0;
  /* every library KPI stays known to the screens; only the client's pack is visible and usable */
  lib.forEach(l=>{const p=LIVE.pack[l.id], ok=p&&(!l.module||mods.includes(l.module));
    const k={...l.data,id:l.id,max:p&&p.max!=null?+p.max:+l.data.max,active:ok?p.enabled:false,module:l.module};if(!ok)k._hidden=true;if(p&&p.weight!=null)k.weight=+p.weight;KPI.push(k)});
  KPI.sort((a,b)=>a.id<b.id?-1:1);
  LIVE.kpiSnap={};KPI.forEach(k=>LIVE.kpiSnap[k.id]=kpiKey(k));
}
async function syncKpis(){
  if(!isHRrole())return;
  for(let i=KPI.length-1;i>=0;i--){const k=KPI[i];if(k._hidden){if(k.active){k.active=false;try{toast(L('This KPI is not in your pack. Ask LV People to add it.','यह KPI आपके पैक में नहीं है। LV People से जोड़ने को कहें।'))}catch(e){}}continue}
    if(!LIVE.pack[k.id]){KPI.splice(i,1);try{toast(L('New KPIs are added by LV People to your pack. Please send the request to LV People.','नई KPI LV People आपके पैक में जोड़ता है। अनुरोध LV People को भेजें।'))}catch(e){}continue}
    const s=kpiKey(k);if(LIVE.kpiSnap[k.id]===s)continue;
    const r=await sb.from('client_kpi_pack').update({enabled:k.active!==false,max:+k.max||0}).eq('client_id',LIVE.profile.client_id).eq('kpi_id',k.id);if(r.error)throw r.error;LIVE.kpiSnap[k.id]=s}
}
try{const _kt=kpiTable;kpiTable=function(rows){return _kt.call(this,(rows||[]).filter(k=>!k._hidden))}}catch(e){}
/* the PMS screens show only the client's pack */
const withPack=fn=>function(){const all=KPI.slice();if(!all.some(k=>k._hidden))return fn.apply(this,arguments);const vis=all.filter(k=>!k._hidden), ids=new Set(vis.map(k=>k.id)), ai=[...AUTO_IMPL];
  KPI.length=0;vis.forEach(k=>KPI.push(k));AUTO_IMPL.clear();ai.filter(i=>ids.has(i)).forEach(i=>AUTO_IMPL.add(i));
  try{return fn.apply(this,arguments)}finally{KPI.length=0;all.forEach(k=>KPI.push(k));AUTO_IMPL.clear();ai.forEach(i=>AUTO_IMPL.add(i))}};
try{pmsPage=withPack(pmsPage)}catch(e){}
/* the platform admin builds the pack of each client, one KPI at a time */
try{
  PAGES.push('kpipack');Object.keys(RIGHTS).forEach(r=>RIGHTS[r].kpipack=r==='platform'?['V','E']:[]);
  NAV.push({id:'kpipack',ic:'M4 6h16M4 12h16M4 18h10',roles:[],day:'—',built:true});
  Object.assign(T.en,{kpipack:'KPI packs'});Object.assign(T.hi,{kpipack:'KPI पैक'});
}catch(e){}
const KP={client:'',q:'',mod:'',only:''};LIVE.kp={clients:[],lib:[],pack:{}};
async function kpLoad(){const [c,l]=await Promise.all([q('clients'),q('kpi_library')]);LIVE.kp.clients=c;LIVE.kp.lib=l.sort((a,b)=>a.id<b.id?-1:1);if(!KP.client&&c[0])KP.client=c[0].id;
  LIVE.kp.pack={};if(KP.client){const r=await sb.from('client_kpi_pack').select('*').eq('client_id',KP.client);(r.data||[]).forEach(p=>LIVE.kp.pack[p.kpi_id]=p)}}
function kpiPackPage(){
  if(!LIVE.kp.loaded){LIVE.kp.loaded=true;kpLoad().then(()=>render());return `<div class="page-h"><div><h1>${L('KPI packs','KPI पैक')}</h1></div></div><p>…</p>`}
  const cl=LIVE.kp.clients.find(c=>c.id===KP.client)||{}, mods=cl.modules||[], qq=KP.q.toLowerCase();
  const rows=LIVE.kp.lib.filter(l=>(!KP.mod||l.module===KP.mod)&&(!qq||(l.id+' '+(l.data.name||'')+' '+(l.data.cat||'')).toLowerCase().includes(qq))&&(!KP.only||(KP.only==='in'?LIVE.kp.pack[l.id]:!LIVE.kp.pack[l.id])));
  const inN=Object.keys(LIVE.kp.pack).length, modsAll=[...new Set(LIVE.kp.lib.map(l=>l.module))].sort();
  return `<div class="page-h"><div><h1>${L('KPI packs','KPI पैक')}</h1><p>${L('One KPI library for all clients. Choose the KPIs of each client one by one. A KPI whose module is not given to the client cannot be added.','सभी क्लाइंट के लिए एक KPI लाइब्रेरी। हर क्लाइंट की KPI एक-एक करके चुनें। जिस KPI का मॉड्यूल क्लाइंट को नहीं दिया, वह नहीं जुड़ सकती।')}</p></div></div>
  <div class="tools"><select class="inp" id="kpC" style="max-width:240px">${LIVE.kp.clients.map(c=>`<option value="${c.id}" ${c.id===KP.client?'selected':''}>${esc(c.name)} (${esc(c.code)})</option>`).join('')}</select>
  <input class="inp" id="kpQ" placeholder="${L('Search KPI','KPI खोजें')}" value="${esc(KP.q)}" style="max-width:220px"><select class="inp" id="kpM" style="max-width:170px"><option value="">${L('All modules','सभी मॉड्यूल')}</option>${modsAll.map(m=>`<option ${m===KP.mod?'selected':''}>${m}</option>`).join('')}</select>
  <select class="inp" id="kpO" style="max-width:160px"><option value="">${L('All','सभी')}</option><option value="in" ${KP.only==='in'?'selected':''}>${L('In the pack','पैक में')}</option><option value="out" ${KP.only==='out'?'selected':''}>${L('Not in the pack','पैक में नहीं')}</option></select>
  <span class="pill p-teal">${inN} ${L('KPIs in the pack','KPI पैक में')}</span></div>
  <div class="card tw"><table class="tbl"><thead><tr><th>${L('In pack','पैक में')}</th><th>KPI</th><th>${L('Name','नाम')}</th><th>${L('Method','तरीका')}</th><th>${L('Module','मॉड्यूल')}</th><th>${L('Client max','क्लाइंट अधिकतम')}</th></tr></thead><tbody>${rows.slice(0,400).map(l=>{const p=LIVE.kp.pack[l.id], ok=mods.includes(l.module);
    return `<tr style="${ok?'':'opacity:.55'}"><td><input type="checkbox" data-kpk="${l.id}" ${p?'checked':''} ${ok||p?'':'disabled'}></td><td><b>${esc(l.id)}</b></td><td>${esc(l.data.name||'')}<small style="display:block;color:var(--muted)">${esc(l.data.cat||'')}</small></td><td>${esc(l.data.method||'')}</td><td>${ok?esc(l.module):`<span class="pill p-bad">${esc(l.module)}: ${L('module not given','मॉड्यूल नहीं दिया')}</span>`}</td><td>${p?(p.max!=null?p.max:l.data.max):'—'}</td></tr>`}).join('')}</tbody></table></div>`}
try{PAGEFN.kpipack=()=>kpiPackPage()}catch(e){}
try{const _ph=placeholder;placeholder=function(P){return P==='kpipack'?kpiPackPage():_ph.apply(this,arguments)}}catch(e){}
const _bx=bindExtra;
bindExtra=function(){_bx.apply(this,arguments);if(state.page!=='kpipack')return;const g=id=>document.getElementById(id);
  if(g('kpC'))g('kpC').onchange=async e=>{KP.client=e.target.value;await kpLoad();render()};
  if(g('kpQ'))g('kpQ').oninput=e=>{KP.q=e.target.value;clearTimeout(KP.t);KP.t=setTimeout(()=>{render();const x=g('kpQ');if(x){x.focus();x.setSelectionRange(x.value.length,x.value.length)}},300)};
  if(g('kpM'))g('kpM').onchange=e=>{KP.mod=e.target.value;render()};if(g('kpO'))g('kpO').onchange=e=>{KP.only=e.target.value;render()};
  document.querySelectorAll('[data-kpk]').forEach(c=>c.onchange=async()=>{const id=c.dataset.kpk;c.disabled=true;
    const r=c.checked?await sb.from('client_kpi_pack').insert({client_id:KP.client,kpi_id:id,max:+(LIVE.kp.lib.find(l=>l.id===id).data.max)||10}):await sb.from('client_kpi_pack').delete().eq('client_id',KP.client).eq('kpi_id',id);
    if(r.error){toast(r.error.message);c.checked=!c.checked}else{if(c.checked)LIVE.kp.pack[id]={kpi_id:id};else delete LIVE.kp.pack[id];toast(L('Saved','सेव हुआ'))}c.disabled=false;render()})};
/* ---------- the client's modules switch the prototype's module licence ---------- */
function applyModules(){try{const mods=(LIVE.client&&LIVE.client.modules)||[];if(typeof LIC==='object'&&LIC&&LIC.mods){Object.keys(LIC.mods).forEach(k=>LIC.mods[k]=mods.includes(k))}
  if(typeof LIC==='object'&&LIC&&LIVE.client){LIC.name=LIVE.client.name}}catch(e){}}
/* ---------- platform: clients (create a client, its modules and status) ---------- */
const MODLIST=['timeoffice','payroll','pms','recruit','workforce','decision','training','crm','stock','marketing','library','support','cockpit','expense','requests','assets','analytics','engage'];
try{PAGES.push('lvclients');Object.keys(RIGHTS).forEach(r=>RIGHTS[r].lvclients=r==='platform'?['V','E']:[]);NAV.push({id:'lvclients',ic:'M3 21h18M5 21V7l7-4 7 4v14M9 9h1M14 9h1M9 13h1M14 13h1',roles:[],day:'—',built:true});
  Object.assign(T.en,{lvclients:'Clients (live)'});Object.assign(T.hi,{lvclients:'क्लाइंट (लाइव)'})}catch(e){}
LIVE.cl={rows:[],loaded:false,counts:{}};
async function clLoad(){const [c,e]=await Promise.all([q('clients'),q('employees','client_id,active')]);LIVE.cl.rows=c.sort((a,b)=>a.created_at<b.created_at?-1:1);LIVE.cl.counts={};e.forEach(x=>{if(x.active)LIVE.cl.counts[x.client_id]=(LIVE.cl.counts[x.client_id]||0)+1})}
function clientsPage(){
  if(!LIVE.cl.loaded){LIVE.cl.loaded=true;clLoad().then(()=>render());return `<div class="page-h"><div><h1>${L('Clients (live)','क्लाइंट (लाइव)')}</h1></div></div><p>…</p>`}
  return `<div class="page-h"><div><h1>${L('Clients (live)','क्लाइंट (लाइव)')}</h1><p>${L('Every company that uses LV People. A new client starts clean: its own data only, no sample data.','LV People इस्तेमाल करने वाली हर कंपनी। नया क्लाइंट साफ़ शुरू होता है: सिर्फ़ उसका डेटा, नमूना डेटा नहीं।')}</p></div><button class="btn btn-p" id="clNew">+ ${L('New client','नया क्लाइंट')}</button></div>
  <div class="card tw"><table class="tbl"><thead><tr><th>${L('Company code','कंपनी कोड')}</th><th>${L('Company','कंपनी')}</th><th>${L('Status','स्थिति')}</th><th>${L('Employees','कर्मचारी')}</th><th>${L('Modules','मॉड्यूल')}</th><th></th></tr></thead><tbody>${LIVE.cl.rows.map(c=>`<tr><td><b>${esc(c.code)}</b></td><td>${esc(c.name)}</td><td><span class="pill ${c.status==='active'?'p-ok':c.status==='test'?'p-warn':'p-bad'}">${esc(c.status)}</span></td><td>${LIVE.cl.counts[c.id]||0} / ${c.employee_limit}</td><td style="white-space:normal;max-width:360px;font-size:12px">${esc((c.modules||[]).join(', '))}</td><td style="text-align:right"><button class="btn btn-o btn-s" data-cled="${c.id}">${L('Edit','बदलें')}</button></td></tr>`).join('')}</tbody></table></div>`}
const modBoxes=sel=>`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:4px 10px;margin-top:6px">${MODLIST.map(m=>`<label style="display:flex;gap:6px;font-weight:400;margin:0"><input type="checkbox" name="mod" value="${m}" ${sel.includes(m)?'checked':''}> ${m}</label>`).join('')}</div>`;
function clNewModal(){openModal(`<h3>${L('New client','नया क्लाइंट')}</h3><div class="fgrid"><div><label>${L('Company name','कंपनी का नाम')} *</label><input class="inp" name="name"></div><div><label>${L('Company code (for login)','कंपनी कोड (लॉगिन के लिए)')} *</label><input class="inp" name="code" placeholder="darshanam"></div><div><label>${L('Employee limit','कर्मचारी सीमा')}</label><input class="inp" type="number" name="lim" value="25" min="1"></div></div>
  <label>${L('Modules','मॉड्यूल')}</label>${modBoxes(['timeoffice','payroll','pms','workforce','requests'])}
  <h4 style="margin:14px 0 4px">${L('First admin of the company','कंपनी का पहला एडमिन')}</h4><div class="fgrid"><div><label>${L('Name','नाम')} *</label><input class="inp" name="an"></div><div><label>${L('Employee code','कर्मचारी कोड')} *</label><input class="inp" name="ac" value="E001"></div><div><label>${L('Mobile','मोबाइल')} *</label><input class="inp" name="am" maxlength="10"></div><div><label>${L('First password','पहला पासवर्ड')} *</label><input class="inp" name="pw"></div></div>
  <p style="font-size:12px;color:var(--muted)">${L('The admin must change this password at the first sign-in. Tell it only to that person.','एडमिन को पहले साइन-इन पर पासवर्ड बदलना होगा। यह सिर्फ़ उसी व्यक्ति को बताएँ।')}</p><div id="me" style="color:var(--bad);font-size:12px"></div><div class="acts"><button type="button" class="btn btn-o" data-close>${t('cancel')}</button><button class="btn btn-p">${L('Create','बनाएँ')}</button></div>`,
  async(f,close)=>{const fd=new FormData(f), er=m=>{f.querySelector('#me').textContent=m};
    const r=await sb.rpc('platform_create_client',{p_code:fd.get('code'),p_name:fd.get('name'),p_limit:+fd.get('lim')||25,p_modules:fd.getAll('mod'),p_admin_name:fd.get('an'),p_admin_code:fd.get('ac'),p_admin_mobile:fd.get('am'),p_password:fd.get('pw')});
    if(r.error)return er(r.error.message);close();toast(L('Client created. Now make its KPI pack.','क्लाइंट बन गया। अब उसका KPI पैक बनाएँ।'));await clLoad();render()})}
function clEditModal(id){const c=LIVE.cl.rows.find(x=>x.id===id);openModal(`<h3>${esc(c.name)} (${esc(c.code)})</h3><div class="fgrid"><div><label>${L('Status','स्थिति')}</label><select class="inp" name="st">${['active','test','suspended'].map(s=>`<option ${c.status===s?'selected':''}>${s}</option>`).join('')}</select></div><div><label>${L('Employee limit','कर्मचारी सीमा')}</label><input class="inp" type="number" name="lim" value="${c.employee_limit}" min="1"></div></div><label>${L('Modules','मॉड्यूल')}</label>${modBoxes(c.modules||[])}<p style="font-size:12px;color:var(--muted)">${L('A suspended client cannot open its data. Switching a module off hides it and its KPIs; the data is kept.','सस्पेंड क्लाइंट अपना डेटा नहीं खोल सकता। मॉड्यूल बंद करने पर वह और उसकी KPI छिप जाती हैं; डेटा रहता है।')}</p><div id="me" style="color:var(--bad);font-size:12px"></div><div class="acts"><button type="button" class="btn btn-o" data-close>${t('cancel')}</button><button class="btn btn-p">${t('save')}</button></div>`,
  async(f,close)=>{const fd=new FormData(f);const r=await sb.rpc('platform_update_client',{p_id:id,p_status:fd.get('st'),p_limit:+fd.get('lim')||1,p_modules:fd.getAll('mod')});if(r.error)return f.querySelector('#me').textContent=r.error.message;close();toast(t('saved'));await clLoad();render()})}
try{const _ph2=placeholder;placeholder=function(P){return P==='lvclients'?clientsPage():_ph2.apply(this,arguments)}}catch(e){}
const _bx2=bindExtra;
bindExtra=function(){_bx2.apply(this,arguments);if(state.page!=='lvclients')return;const b=document.getElementById('clNew');if(b)b.onclick=clNewModal;document.querySelectorAll('[data-cled]').forEach(x=>x.onclick=()=>clEditModal(x.dataset.cled))};
/* ---------- dashboard numbers from the real data ---------- */
window.dashN=function(scope,what){
  try{const me=MYEMP[state.role], emps=DATA.emps.filter(e=>e.active&&(scope==='all'||+e.mgr===me));
    if(what==='total')return String(emps.length);
    if(what==='new'){const n=emps.filter(e=>(e.doj||'').slice(0,7)===TODAY_S.slice(0,7)).length;return n?`+${n} ${t('this_month')}`:''}
    const st=emps.map(e=>dayRec(e.id,TODAY_D).st), work=st.filter(s=>!['W','H','F'].includes(s)).length;
    const present=st.filter(s=>['P','L','HD','WOP'].includes(s)).length, leave=st.filter(s=>['LV','LWP'].includes(s)).length, notin=st.filter(s=>s==='N'||s==='A').length;
    if(what==='present')return String(present);if(what==='pct')return work?(Math.round(present/work*1000)/10)+'%':'';
    if(what==='leave')return String(leave);if(what==='absent')return String(notin);
    if(what==='notin')return notin?L('not punched in yet','अभी पंच-इन नहीं'):'';
  }catch(e){return '—'}return ''};
/* attendance % of the last days of this month */
try{chart=function(){const out=[], emps=DATA.emps.filter(e=>e.active);
  for(let d=Math.max(1,TODAY_D-6);d<=TODAY_D;d++){const st=emps.map(e=>dayRec(e.id,d).st), work=st.filter(s=>!['W','H','F'].includes(s)).length, pr=st.filter(s=>['P','L','HD','WOP'].includes(s)).length;
    const dd=new Date(Y,M,d);out.push([dd.toLocaleDateString(loc(),{weekday:'short'}),work?Math.round(pr/work*100):0,d])}
  return `<div class="card"><h3>${t('att7')} <span>%</span></h3><div class="bars">${out.map(([w,p,d])=>`<div><span>${p}</span><i style="height:${p}%"></i><span>${w} ${d}</span></div>`).join('')}</div></div>`}}catch(e){}
/* coming holidays and notices instead of fixed text */
try{side=function(){const up=(typeof HOLI!=='undefined'?HOLI:[]).filter(h=>h[0]>=TODAY_S).slice(0,3), days=s=>Math.round((new Date(s+'T00:00:00')-new Date(TODAY_S+'T00:00:00'))/864e5);
  const nt=(typeof NTC!=='undefined'?NTC:[]).filter(n=>!n.st||n.st==='Published'||n.st==='Active').slice(0,3);
  return `${bdayCard()}<div class="card"><h3>${t('holidays')}</h3><div class="list">${up.map(h=>`<div><div class="grow"><b>${esc(h[1])}</b><small>${new Date(h[0]+'T00:00:00').toLocaleDateString(loc(),{day:'numeric',month:'short',weekday:'short'})}</small></div><span class="pill p-teal">${days(h[0])}d</span></div>`).join('')||`<div><small style="color:var(--muted)">${L('No holiday coming','कोई आने वाली छुट्टी नहीं')}</small></div>`}</div></div>
  ${nt.length?`<div class="card"><h3>${t('ann')}</h3><div class="list">${nt.map(n=>`<div><div class="grow"><b>${esc(n.title||n.subject||'')}</b><small>${esc((n.body||n.msg||'').slice(0,90))}</small></div></div>`).join('')}</div></div>`:''}`}}catch(e){}
/* in the live app a past working day with no punch is absent, never sample data */
const _dayRec=dayRec;
dayRec=function(emp,d){const r=_dayRec(emp,d);if(!LIVE.on||LIVE.platform)return r;const s=ds(d), k=emp+'|'+s;
  if(d<TODAY_D&&['P','L','A'].includes(r.st)&&!ATT[k]&&!(typeof ACORR==='object'&&ACORR[k])&&!r.od&&r.src!=='Regularized'&&r.src!=='Corrected')return{st:'A'};
  if(d===TODAY_D&&!ATT[k]&&['P','L'].includes(r.st))return{st:'N'};
  return r};

/* ---------- save what changed ---------- */
async function syncNow(){
  if(!LIVE.on||LIVE.platform||!LIVE.profile)return;
  if(LIVE.busy){LIVE.queued=true;return}
  LIVE.busy=true;let n=0;
  try{
    await syncAttendance();await syncStores();await syncKpis();
    if(isHRrole())for(const k of KINDS){const t=TBL[k];
      for(const o of DATA[k]){const s=sig(k,o);if(LIVE.snap[k][o.id]===s)continue;
        const row=toRow(k,o);let uuid=LIVE.map[k][o.id];
        if(uuid){const r=await sb.from(t).update(row).eq('id',uuid);if(r.error)throw r.error}
        else{const r=await sb.from(t).insert(row).select('id').single();if(r.error)throw r.error;uuid=r.data.id;LIVE.map[k][o.id]=uuid;LIVE.rev[k][uuid]=o.id}
        if(k==='emps'){const r=await sb.from('employee_private').upsert({employee_id:uuid,...toPriv(o)});if(r.error)throw r.error}
        LIVE.snap[k][o.id]=sig(k,o);n++}}
    /* a manager set before the manager was saved: fill it now */
    if(isHRrole())for(const o of DATA.emps){if(o.mgr&&LIVE.map.emps[+o.mgr]){const s=sig('emps',o);if(LIVE.snap.emps[o.id]!==s){await sb.from('employees').update({manager_id:LIVE.map.emps[+o.mgr]}).eq('id',LIVE.map.emps[o.id]);LIVE.snap.emps[o.id]=s}}}
    LIVE.err='';
  }catch(e){LIVE.err=(e&&e.message)||String(e);console.error('LIVE sync',e);try{toast('Not saved to the database: '+LIVE.err)}catch(x){}}
  finally{LIVE.busy=false;if(LIVE.queued){LIVE.queued=false;setTimeout(syncNow,50)}}
  if(n){try{await sb.from('audit_log').insert({client_id:LIVE.profile.client_id,user_id:LIVE.profile.user_id,module:'Sync',action:'Saved',subject:n+' record(s)',detail:''})}catch(e){}}
}
let syncT=null;const schedule=()=>{clearTimeout(syncT);syncT=setTimeout(syncNow,600)};

/* ---------- the note at the top of each page ---------- */
const LIVE_PAGES=['dashboard','employees','profile','setup','org','workforce','cockpit','attendance','attreq','leave','timeoffice','payroll','myreq','team','pms','decision','assets','myasset','support','inbox','recruit','expense','exits','training','marketing','crm','library','engage','bizdata','stock','import','analytics','reports','settings'];
function note(){const m=document.getElementById('main');if(!m||!LIVE.on||LIVE.platform)return;let n=document.getElementById('liveNote');
  const live=LIVE_PAGES.includes(state.page);
  const txt=live?L('Live: the data on this page is saved in the database.','लाइव: इस पेज का डेटा डेटाबेस में सेव होता है।')
    :L('This module is not connected to the database yet: it shows sample data and changes are not saved. Live now: employees, organisation, attendance, leave, payroll, PMS, My Assignment, assets, support and inbox.','यह मॉड्यूल अभी डेटाबेस से नहीं जुड़ा: इसमें नमूना डेटा है और बदलाव सेव नहीं होते। अभी लाइव: कर्मचारी, संगठन, हाज़िरी, छुट्टी, पेरोल, PMS, माई असाइनमेंट, एसेट, सपोर्ट और इनबॉक्स।');
  if(!n){n=document.createElement('div');n.id='liveNote';n.style.cssText='margin:0 0 12px;padding:8px 12px;border-radius:10px;font-size:12px'}
  n.style.background=live?'rgba(22,138,74,.12)':'rgba(183,121,31,.14)';n.style.color=live?'#166534':'#92400e';n.textContent=(LIVE.err?'⚠ '+LIVE.err+' · ':'')+txt;
  if(m.firstChild!==n)m.insertBefore(n,m.firstChild)}

/* ---------- hooks into the prototype ---------- */
const _render=render;
render=function(){_render.apply(this,arguments);if(LIVE.on){note();schedule()}};
const _draw=drawLogin;
drawLogin=function(){_draw.apply(this,arguments);const box=document.getElementById('loginForm');if(!box||LV.view!=='signin')return;
  box.querySelectorAll('.card').forEach(c=>c.remove());
  const u=document.getElementById('lgU');if(u&&!document.getElementById('lgC')){const lab=u.previousElementSibling;const wrap=document.createElement('div');
    wrap.innerHTML=`<label>${L('Company code','कंपनी कोड')}</label><input class="inp" id="lgC" autocomplete="organization" placeholder="demo">`;
    lab.parentNode.insertBefore(wrap,lab);try{document.getElementById('lgC').value=localStorage.getItem('lv_company')||''}catch(e){}}
  const s=box.querySelector('.sub');if(s)s.textContent=L('Company code, employee number and password. Platform admin: leave the company code empty and use the email.','कंपनी कोड, कर्मचारी नंबर और पासवर्ड। प्लेटफ़ॉर्म एडमिन: कंपनी कोड ख़ाली छोड़ें और ईमेल डालें।')};
async function startSession(user){
  const [p,pa]=await Promise.all([sb.from('profiles').select('*, client:client_id(code,name,status,modules)').eq('user_id',user.id).maybeSingle(),sb.from('platform_admins').select('user_id').eq('user_id',user.id).maybeSingle()]);
  LIVE.platform=!!pa.data;LIVE.profile=p.data||null;LIVE.client=p.data?p.data.client:null;
  if(LIVE.platform&&!LIVE.profile){LIVE.on=true;enterApp(null,'platform',false);return}
  if(!LIVE.profile||!LIVE.profile.active)throw new Error(L('This login is not active','यह लॉगिन चालू नहीं है'));
  await loadLive();applyModules();LIVE.on=true;
  const e=DATA.emps.find(x=>LIVE.map.emps[x.id]===LIVE.profile.employee_id);if(!e)throw new Error(L('No employee record is linked to this login','इस लॉगिन से कोई कर्मचारी रिकॉर्ड नहीं जुड़ा'));
  try{if(typeof CO==='object'&&LIVE.client)CO.name=LIVE.client.name}catch(x){}
  if(LIVE.profile.must_change_password){LV.view='change';LV.pend={first:true,emp:e,role:LIVE.profile.role,live:true};drawLogin();return}
  enterApp(e,LIVE.profile.role,false);
}
const fail=m=>{LV.msg=m;const u=$('#lgU')&&$('#lgU').value, c=$('#lgC')&&$('#lgC').value;drawLogin();if($('#lgU'))$('#lgU').value=u||'';if($('#lgC'))$('#lgC').value=c||''};
doSignin=async function(){
  const c=($('#lgC')&&$('#lgC').value||'').trim().toLowerCase(), u=($('#lgU').value||'').trim(), pw=$('#lgP').value;
  if(!u||!pw)return fail(L('Enter the user id and the password','यूज़र आईडी और पासवर्ड भरें'));
  const email=c?`${u.toLowerCase()}.${c}@login.example.com`:u;
  if(!c&&!u.includes('@'))return fail(L('Enter the company code','कंपनी कोड भरें'));
  const btn=document.querySelector('#loginForm .btn-p');if(btn){btn.disabled=true;btn.textContent='…'}
  try{const r=await sb.auth.signInWithPassword({email,password:pw});if(r.error)throw new Error(L('User id or password is wrong','यूज़र आईडी या पासवर्ड ग़लत है'));
    try{if(c)localStorage.setItem('lv_company',c)}catch(x){}LV.msg='';await startSession(r.data.user)}
  catch(e){await sb.auth.signOut();LIVE.on=false;fail(e.message||String(e))}};
const _doChange=doChange;
doChange=async function(){const p=LV.pend;if(!p||!p.live)return _doChange();
  const n=$('#lgN').value, n2=$('#lgN2').value, err=(n.length<8||!/[A-Za-z]/.test(n)||!/\d/.test(n))?L('At least 8 characters with letters and digits','कम से कम 8 अक्षर, अक्षर और अंक दोनों'):(n!==n2?L('The two passwords are different','दोनों पासवर्ड अलग हैं'):'');
  if(err){LV.msg=err;drawLogin();return}
  const r=await sb.auth.updateUser({password:n});if(r.error){LV.msg=r.error.message;drawLogin();return}
  await sb.from('profiles').update({must_change_password:false}).eq('user_id',LIVE.profile.user_id);LIVE.profile.must_change_password=false;LV.view='signin';LV.msg='';enterApp(p.emp,p.role,false)};
const _logout=doLogout;
doLogout=async function(){try{await sb.auth.signOut()}catch(e){}LIVE.on=false;LIVE.profile=null;location.reload()};
const lo=document.getElementById('logout');if(lo)lo.onclick=doLogout;
/* the prototype's forgot-password and demo buttons are not used in the live app */
const lf=document.getElementById('loginForm');if(lf)lf.addEventListener('click',e=>{const b=e.target.closest('[data-lg]');if(b&&(b.dataset.lg==='forgot'||b.dataset.lg.startsWith('demo:')||b.dataset.lg==='mailbox')){e.stopImmediatePropagation();e.preventDefault();toast(L('Ask your HR to reset the password.','पासवर्ड रीसेट के लिए अपने HR से कहें।'))}},true);
drawLogin();
/* an open session from before */
(async()=>{try{const res=await Promise.race([sb.auth.getSession(),new Promise((_,j)=>setTimeout(()=>j(new Error('timeout')),6000))]);const s=res&&res.data&&res.data.session;if(s)await startSession(s.user)}
  catch(e){if(e&&e.message==='timeout')return;try{Object.keys(localStorage).filter(k=>k.startsWith('sb-')).forEach(k=>localStorage.removeItem(k))}catch(x){}}})();
})();
