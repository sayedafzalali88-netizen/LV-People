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
  await loadAttendance();await loadStores();try{if(BIOP.length)bioProcess()}catch(e){console.warn('bio',e)}await loadKpis();await loadAccounts();try{await pullPortal()}catch(e){console.warn('portal',e)}
}

/* ---------- attendance punches: the attendance table <-> ATT ---------- */
const IST=330*60000;
const t12=ts=>{if(!ts)return '';const d=new Date(new Date(ts).getTime()+IST);let h=d.getUTCHours(), m=d.getUTCMinutes();const ap=h<12?'am':'pm';h=h%12||12;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')} ${ap}`};
const toTs=(date,s)=>{if(!s)return null;const n=toMin(s);if(n==null)return null;return `${date}T${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}:00+05:30`};
LIVE.attSnap={};
/* only in, out, status and source go to the attendance table; all punches and lunch stay in the punch log (BIOP) */
const attSig=v=>JSON.stringify({in:v.in||'',out:v.out||'',status:v.status||'',src:v.src||''});
/* night shift: an out time earlier than the in time is on the next day */
const outTs=(date,v)=>{if(!v.out)return null;if(v.in&&toMin(v.out)<toMin(v.in))return toTs(addD(date,1),v.out);return toTs(date,v.out)};
async function loadAttendance(){
  const from=PERIODS.length?payKey(PERIODS[0])+'-01':TODAY_S;let rows=[], page=0;
  while(true){const r=await sb.from('attendance').select('employee_id,work_date,in_time,out_time,source').gte('work_date',from).range(page*1000,page*1000+999);if(r.error)throw r.error;rows=rows.concat(r.data||[]);if(!r.data||r.data.length<1000)break;page++}
  Object.keys(ATT).forEach(k=>delete ATT[k]);
  rows.forEach(r=>{const n=LIVE.rev.emps[r.employee_id];if(!n)return;ATT[n+'|'+r.work_date]={in:t12(r.in_time),out:t12(r.out_time),src:r.source==='Web'?'GPS selfie':r.source,bio:true}});
  LIVE.attSnap={};Object.keys(ATT).forEach(k=>LIVE.attSnap[k]=attSig(ATT[k]));
}
async function syncAttendance(){
  const me=LIVE.profile&&LIVE.rev.emps[LIVE.profile.employee_id];
  for(const k of Object.keys(ATT)){const v=ATT[k], s=attSig(v);if(LIVE.attSnap[k]===s)continue;const [n,date]=k.split('|'), uuid=LIVE.map.emps[+n];if(!uuid){LIVE.attSnap[k]=s;continue}
    const old=LIVE.attSnap[k]?JSON.parse(LIVE.attSnap[k]):{};
    if(LIVE.asOf&&+n===me&&date===TODAY_S){LIVE.attSnap[k]=s;continue}
    if(+n===me&&date===TODAY_S&&((v.in&&!old.in)||(v.out&&!old.out))){const r=await sb.rpc('punch');if(r.error)throw r.error;
      const a=(await sb.from('attendance').select('in_time,out_time').eq('employee_id',uuid).eq('work_date',date).maybeSingle()).data;if(a){v.in=t12(a.in_time);v.out=t12(a.out_time);v.bio=true}}
    else if(isHRrole()&&(v.in||v.out||v.status)){const row={client_id:LIVE.profile.client_id,employee_id:uuid,work_date:date,in_time:toTs(date,v.in),out_time:outTs(date,v),source:v.src||'Imported',note:v.status||null};
      const r=await sb.from('attendance').upsert(row,{onConflict:'employee_id,work_date'});if(r.error)throw r.error}
    LIVE.attSnap[k]=attSig(v)}
}

/* ---------- the other prototype stores (leave, attendance requests, time office, payroll) ---------- */
const CONFIG=['SHIFTS','HBANK','HCAL','ATPOL','LT','LRULE','PHEADS','STAT','PAYRUN','ADJHEADS','ADVPOL','LTYPES','LTC','LTI','LTM','LTR','LTSW','LPRE','LVR','CHK','WFD','TAR','CCT','RFR','SLA','CHKLINK','FBQ','ALTJT','ALTP','QB','STG','XTYPE','SLCAT','BIOSRC','BIODEV','XQT','ALTSET','BIOSET','CRULE','EMPCODE','ORGS','SERIES','SYSSERX','STKSET','TRULE','WAUTO','MINW','MINWSK','MINWZ','OFFPAY','ALWR','ATTWV','PVER','ROLES'];
/* SYSSER has functions inside, so only its plain values (prefix, digits, next number...) are kept */
window.SYSSERX={};const sysToX=()=>{try{SYSSER.forEach(s=>{const o={};Object.keys(s).forEach(k=>{if(typeof s[k]!=='function')o[k]=s[k]});SYSSERX[s.key]=o})}catch(e){}};const sysFromX=()=>{try{SYSSER.forEach(s=>{const o=SYSSERX[s.key];if(o)Object.keys(o).forEach(k=>{if(typeof s[k]!=='function')s[k]=o[k]})})}catch(e){}};sysToX();
const DATASTORES=['AR','REGS','IMPORTS','ASSIGN','RH','LEAVES','ADJ','ADV','FS','INCASG','ENC','ACORR','STATA','BANK','VARS','ATTP','ADVL','INCS','LADJ','CF','STATV','MRATE','KFS','AUD','CT','SURV','POLLS','TASKS','WFI','DEC','MTG','CHAL','RFL','BIL','CLF','EL','SVL','EVP','CCO','STKA','SUPT','AIS','AREQ','KYC','FBT','FBF','CFB','CMP','PAY','PAYB','INCREG','OTL','SHORT','LOCR','INDP','ASG','TODO','DAILYT','WARNLOG','HOLD','HOLDREL','KBA','BIOP','BIOIMP','SLC','SLASG','SLP','SLT','SLCERT','SLLOG','CREQ','XADV','XREP','XPAY','XRES','XIT','CHE','AND','NTC','POLL','DOCS','LETTERS','LTR','RECOG','UREQ','WISH','XTRIP','RC','KRULES','SSTR','TGR','AST','AUDIT','TDSD','ATTARR'];
try{Object.keys(SRC).filter(k=>Array.isArray(SRC[k])).forEach(k=>DATASTORES.push('SRC.'+k))}catch(e){}
const EMPSTORES=['LEAVES','AR','REGS','RH','ADV','MRATE','AUD','CT','KYC','SURV','TASKS','WFI','DEC','MTG','CHAL','RFL','BIL','CLF','EL','SVL','EVP','CCO','STKA','SUPT','AIS','AREQ','FBT','CFB','ASG','TODO','DAILYT','SLP','SLASG','SLLOG','SLT','SLCERT','CREQ','XADV','XREP','XRES','XTRIP','UREQ','WISH','CHE','POLL','RECOG','SRC.content','SRC.campaign','SRC.post','SRC.creview','SRC.ttest','AUDIT','TDSD'];
const involved=(x,me,team,store,key)=>{if(store==='MRATE'||store==='CT')return team.has(+String(key).slice(2).split('|')[0]);if(store==='KYC')return +String(key).slice(2).split('|')[0]===me;if(!x||typeof x!=='object')return false;
  if(['emp','by','mgr','owner','assignee','auditor','chair','reviewer','creator','poster'].some(f=>+x[f]===me))return true;if(['to','att','invited','emps','done'].some(f=>Array.isArray(x[f])&&x[f].includes(me)))return true;
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
      if(!demo&&n==='ORGS'&&LIVE.client){v.org=LIVE.client.name}
      LIVE.stSnap[n]={}; continue }
    if(Array.isArray(v)){v.length=0;mine.sort((a,b)=>{const x=a.key.split(':'), y=b.key.split(':');return (+x[1]||0)-(+y[1]||0)}).forEach(r=>v.push(r.data))}
    else{Object.keys(v).forEach(k=>delete v[k]);mine.forEach(r=>{v[r.key.slice(2)]=r.data})}
    LIVE.stSnap[n]={};mine.forEach(r=>LIVE.stSnap[n][r.key]=JSON.stringify(r.data))}
  try{if(typeof syncHoli==='function')syncHoli()}catch(e){}
  sysFromX();
  /* a month with no saved state is a draft: never "processed" by default */
  try{Object.keys(PMON).forEach(m=>{if(!PAYRUN[m])PAYRUN[m]='draft'})}catch(e){}
  try{pslRoles()}catch(e){}
  if(rows.some(r=>r.data&&hasFileRef(r.data))){try{await showFiles([...CONFIG,...DATASTORES].map(ref).filter(v=>v&&typeof v==='object'))}catch(e){console.warn('files',e)}}
  try{let base=1e12;AUDIT.forEach(a=>{if(a.id==null)a.id=base--});AUDIT.sort((a,b)=>b.id-a.id)}catch(e){}
  /* new records must not reuse an id that is already stored */
  let mx=0;rows.forEach(r=>{const id=r.data&&+r.data.id;if(id&&id<1e12&&id>mx)mx=id});
  try{if(mx>=seq)seq=mx+1}catch(e){}
}
async function syncStores(){
  const hr=isHRrole();
  for(const n of [...CONFIG,...DATASTORES]){if(!hr&&!EMPSTORES.includes(n))continue;const items=itemsOf(n);if(!items)continue;const snap=LIVE.stSnap[n]||(LIVE.stSnap[n]={});
    let up=[];for(const k of Object.keys(items)){const raw=JSON.stringify(items[k]);if(raw===undefined||snap[k]===raw)continue;let d=items[k];
      if(raw.includes('"data:')||raw.includes('token=')){d=await toStored(items[k],n);if(snap[k]===JSON.stringify(d))continue}
      up.push({client_id:LIVE.profile.client_id,store:n,key:k,data:d})}
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
/* month-end lock: while the month runs, each KPI result is saved (KSNAP); once the month is over the saved result is used and never worked out again.
   Only a manager rating that was still pending can be given late, so the month can be closed. */
window.KSNAP={};DATASTORES.push('KSNAP');LIVE.ksT=0;
function snapKpis(force){if(!isHRrole()||(!force&&Date.now()-LIVE.ksT<10*60000))return;LIVE.ksT=Date.now();
  try{DATA.emps.filter(e=>e.active).forEach(e=>assignedKpis(e,CUR_P).forEach(k=>{if(k._hidden)return;const r=_kres(e.id,k,CUR_P);if(!r)return;
    const v={state:r.state,score:r.score==null?null:r.score,text:r.text||''}, key=e.id+'|'+k.id+'|'+CUR_P;if(JSON.stringify(KSNAP[key])!==JSON.stringify(v))KSNAP[key]=v}))}catch(x){console.warn('ksnap',x)}}
const _kres=kpiResult;
kpiResult=function(emp,k,p){if(p===CUR_P||!LIVE.on)return _kres(emp,k,p);
  const s=KSNAP[emp+'|'+k.id+'|'+p];
  if(k.method==='Manager Scoring'&&(!s||s.state==='PENDING')){const r=MRATE[emp+'|'+k.id+'|'+p];if(r)return{state:'SCORED',score:r2(r*k.max/10),text:`${t('kr_rated')} ${r}/10`}}
  if(s)return{state:s.state,score:s.score==null?undefined:s.score,text:s.text+' · '+L('locked at month end','महीने के अंत में लॉक')};
  return _kres(emp,k,p)};
LIVE.snapKpis=snapKpis;
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
  <div class="card tw"><table class="tbl"><thead><tr><th>${L('In pack','पैक में')}</th><th>KPI</th><th>${L('Name','नाम')}</th><th>${L('Method','तरीका')}</th><th>${L('Module','मॉड्यूल')}</th><th>${L('Client max','क्लाइंट अधिकतम')}</th></tr></thead><tbody>${rows.slice(0,400).map(l=>{const p=LIVE.kp.pack[l.id], ok=mods.includes(l.module)&&(l.status==='released'||(l.status==='testing'&&cl.status==='test'));
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
  <div class="card tw"><table class="tbl"><thead><tr><th>${L('Company code','कंपनी कोड')}</th><th>${L('Company','कंपनी')}</th><th>${L('Status','स्थिति')}</th><th>${L('Employees','कर्मचारी')}</th><th>${L('Modules','मॉड्यूल')}</th><th></th></tr></thead><tbody>${LIVE.cl.rows.map(c=>`<tr><td><b>${esc(c.code)}</b></td><td>${esc(c.name)}</td><td><span class="pill ${c.status==='active'?'p-ok':c.status==='test'?'p-warn':'p-bad'}">${esc(c.status)}</span></td><td>${LIVE.cl.counts[c.id]||0} / ${c.employee_limit}</td><td style="white-space:normal;max-width:360px;font-size:12px">${esc((c.modules||[]).join(', '))}</td><td style="text-align:right"><button class="btn btn-o btn-s" data-clbk="${c.id}">${L('Backup','बैकअप')}</button> <button class="btn btn-o btn-s" data-cled="${c.id}">${L('Edit','बदलें')}</button></td></tr>`).join('')}</tbody></table></div>`}
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
bindExtra=function(){_bx2.apply(this,arguments);if(state.page!=='lvclients')return;const b=document.getElementById('clNew');if(b)b.onclick=clNewModal;document.querySelectorAll('[data-cled]').forEach(x=>x.onclick=()=>clEditModal(x.dataset.cled));document.querySelectorAll('[data-clbk]').forEach(x=>x.onclick=()=>clBackup(x.dataset.clbk,x))};
const BK_TABLES=['branches','divisions','departments','job_functions','designations','employees','employee_private','employee_statutory','profiles','attendance','app_store','client_kpi_pack','statutory_settings','attendance_policy','payroll_policy','code_series','role_rights','shifts','leave_types','holidays','leave_requests','payroll_runs','payslips','pay_heads','pay_adjustments','salary_advances','final_settlements','audit_log'];
async function clBackup(id,btn){const c=LIVE.cl.rows.find(x=>x.id===id);btn.disabled=true;btn.textContent='…';const out={made:new Date().toISOString(),client:c,tables:{}};
  try{for(const tb of BK_TABLES){let rows=[],p=0;while(true){const r=await sb.from(tb).select('*').eq('client_id',id).range(p*1000,p*1000+999);if(r.error)throw new Error(tb+': '+r.error.message);rows=rows.concat(r.data||[]);if(!r.data||r.data.length<1000)break;p++}out.tables[tb]=rows}
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(out)],{type:'application/json'}));a.download='LV-People-backup-'+c.code+'-'+TODAY_S+'.json';document.body.appendChild(a);a.click();a.remove();toast(L('Backup downloaded','बैकअप डाउनलोड हुआ'))}
  catch(e){toast(L('Backup failed: ','बैकअप नहीं हुआ: ')+e.message)}finally{btn.disabled=false;btn.textContent=L('Backup','बैकअप')}}
/* ---------- platform: the KPI library (add, change, Draft -> Testing -> Released) ---------- */
try{PAGES.push('kpilib');Object.keys(RIGHTS).forEach(r=>RIGHTS[r].kpilib=r==='platform'?['V','E']:[]);NAV.push({id:'kpilib',ic:'M4 19.5A2.5 2.5 0 016.5 17H20M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5z',roles:[],day:'—',built:true});
  Object.assign(T.en,{kpilib:'KPI library'});Object.assign(T.hi,{kpilib:'KPI लाइब्रेरी'})}catch(e){}
const KL={q:'',st:'',mod:''};LIVE.kl={rows:[],loaded:false};
const KMETH=['Auto','Manager Scoring','Audit','Survey','Team Average'];
async function klLoad(){const r=await sb.from('kpi_library').select('*').order('id');LIVE.kl.rows=r.data||[]}
function kpiLibPage(){
  if(!LIVE.kl.loaded){LIVE.kl.loaded=true;klLoad().then(()=>render());return `<div class="page-h"><div><h1>${L('KPI library','KPI लाइब्रेरी')}</h1></div></div><p>…</p>`}
  const qq=KL.q.toLowerCase(), rows=LIVE.kl.rows.filter(r=>(!KL.st||r.status===KL.st)&&(!KL.mod||r.module===KL.mod)&&(!qq||(r.id+' '+(r.data.name||'')+' '+(r.data.cat||'')).toLowerCase().includes(qq))), mods=[...new Set(LIVE.kl.rows.map(r=>r.module))].sort();
  const pill=s=>`<span class="pill ${s==='released'?'p-ok':s==='testing'?'p-warn':'p-teal'}">${s}</span>`;
  return `<div class="page-h"><div><h1>${L('KPI library','KPI लाइब्रेरी')}</h1><p>${L('Only LV People adds or changes KPIs. A new KPI starts as Draft, goes to Testing (seen only by clients whose status is test), then Released (can be added to any client pack).','सिर्फ़ LV People KPI जोड़ता या बदलता है। नई KPI ड्राफ़्ट से शुरू होती है, फिर टेस्टिंग (सिर्फ़ test स्थिति वाले क्लाइंट को दिखती है), फिर रिलीज़ (किसी भी क्लाइंट पैक में जुड़ सकती है)।')}</p></div><button class="btn btn-p" id="klNew">+ ${L('New KPI','नई KPI')}</button></div>
  <div class="tools"><input class="inp" id="klQ" placeholder="${L('Search KPI','KPI खोजें')}" value="${esc(KL.q)}" style="max-width:240px"><select class="inp" id="klS" style="max-width:150px"><option value="">${L('All status','सभी स्थिति')}</option>${['draft','testing','released'].map(s=>`<option ${KL.st===s?'selected':''}>${s}</option>`).join('')}</select><select class="inp" id="klM" style="max-width:160px"><option value="">${L('All modules','सभी मॉड्यूल')}</option>${mods.map(m=>`<option ${KL.mod===m?'selected':''}>${m}</option>`).join('')}</select><span class="pill p-teal">${rows.length}</span></div>
  <div class="card tw"><table class="tbl"><thead><tr><th>KPI</th><th>${L('Name','नाम')}</th><th>${L('Method','तरीका')}</th><th>${L('Max','अधिकतम')}</th><th>${L('Module','मॉड्यूल')}</th><th>${L('Status','स्थिति')}</th><th></th></tr></thead><tbody>${rows.slice(0,400).map(r=>`<tr><td><b>${esc(r.id)}</b></td><td>${esc(r.data.name||'')}<small style="display:block;color:var(--muted)">${esc(r.data.cat||'')}</small></td><td>${esc(r.data.method||'')}${r.data.method==='Auto'&&!AUTO_IMPL.has(r.id)?` <span class="pill p-bad">${L('no formula yet','फ़ॉर्मूला नहीं')}</span>`:''}</td><td>${esc(r.data.max)}</td><td>${esc(r.module)}</td><td>${pill(r.status)}</td><td style="text-align:right"><button class="btn btn-o btn-s" data-kled="${esc(r.id)}">${L('Edit','बदलें')}</button></td></tr>`).join('')}</tbody></table></div>`}
function klModal(id){const r=id?LIVE.kl.rows.find(x=>x.id===id):null, d=r?r.data:{name:'',cat:'',level:'Data',max:10,freq:'Monthly',method:'Manager Scoring',rule:''};
  const nextId=()=>'KPI-'+String(Math.max(0,...LIVE.kl.rows.map(x=>+String(x.id).slice(4)||0))+1).padStart(3,'0');
  openModal(`<h3>${r?esc(r.id):L('New KPI','नई KPI')+' · '+nextId()}</h3><div class="fgrid"><div><label>${L('Name','नाम')} *</label><input class="inp" name="name" value="${esc(d.name)}"></div><div><label>${L('Category','श्रेणी')}</label><input class="inp" name="cat" value="${esc(d.cat||'')}"></div>
  <div><label>${L('Method','तरीका')}</label><select class="inp" name="method">${KMETH.map(m=>`<option ${d.method===m?'selected':''}>${m}</option>`).join('')}</select></div><div><label>${L('Max score','अधिकतम स्कोर')}</label><input class="inp" type="number" name="max" min="1" max="100" value="${esc(d.max)}"></div>
  <div><label>${L('Frequency','आवृत्ति')}</label><select class="inp" name="freq">${['Daily','Weekly','Monthly','Quarterly','Yearly'].map(f=>`<option ${d.freq===f?'selected':''}>${f}</option>`).join('')}</select></div><div><label>${L('Module it needs','ज़रूरी मॉड्यूल')}</label><select class="inp" name="module">${MODLIST.map(m=>`<option ${(r?r.module:'pms')===m?'selected':''}>${m}</option>`).join('')}</select></div>
  <div><label>${L('Status','स्थिति')}</label><select class="inp" name="status">${['draft','testing','released'].map(s=>`<option ${(r?r.status:'draft')===s?'selected':''}>${s}</option>`).join('')}</select></div></div>
  <label>${L('How it is scored (rule)','स्कोर कैसे बनता है (नियम)')}</label><textarea class="inp" name="rule" rows="4">${esc(d.rule||'')}</textarea>
  <p style="font-size:12px;color:var(--muted)">${L('An Auto KPI needs its formula built in the code first; until then it stays pending. Manager Scoring, Audit and Survey work without new code.','ऑटो KPI का फ़ॉर्मूला पहले कोड में बनता है; तब तक वह लंबित रहती है। मैनेजर स्कोरिंग, ऑडिट और सर्वे बिना नए कोड के चलते हैं।')}</p><div id="me" style="color:var(--bad);font-size:12px"></div><div class="acts"><button type="button" class="btn btn-o" data-close>${t('cancel')}</button><button class="btn btn-p">${t('save')}</button></div>`,
  async(f,close)=>{const fd=new FormData(f), er=m=>{f.querySelector('#me').textContent=m}, name=(fd.get('name')||'').trim();if(name.length<3)return er(L('Write the KPI name','KPI का नाम लिखें'));
    const kid=r?r.id:nextId(), method=fd.get('method'), status=fd.get('status');
    if(method==='Auto'&&status==='released'&&!AUTO_IMPL.has(kid))return er(L('An Auto KPI without a formula cannot be released. Keep it in Draft or Testing, or choose another method.','बिना फ़ॉर्मूला की ऑटो KPI रिलीज़ नहीं हो सकती। ड्राफ़्ट/टेस्टिंग में रखें या दूसरा तरीका चुनें।'));
    const data={...d,id:kid,name,cat:(fd.get('cat')||'').trim(),method,max:+fd.get('max')||10,freq:fd.get('freq'),rule:(fd.get('rule')||'').trim(),level:d.level||'Data'};
    const res=await sb.from('kpi_library').upsert({id:kid,data,module:fd.get('module'),status,updated_at:new Date().toISOString()});if(res.error)return er(res.error.message);
    close();toast(t('saved'));await klLoad();LIVE.kp.loaded=false;render()})}
try{const _ph3=placeholder;placeholder=function(P){return P==='kpilib'?kpiLibPage():_ph3.apply(this,arguments)}}catch(e){}
const _bx3=bindExtra;
bindExtra=function(){_bx3.apply(this,arguments);if(state.page!=='kpilib')return;const g=id=>document.getElementById(id);
  if(g('klNew'))g('klNew').onclick=()=>klModal(null);document.querySelectorAll('[data-kled]').forEach(b=>b.onclick=()=>klModal(b.dataset.kled));
  if(g('klQ'))g('klQ').oninput=e=>{KL.q=e.target.value;clearTimeout(KL.t);KL.t=setTimeout(()=>{render();const x=g('klQ');if(x){x.focus();x.setSelectionRange(x.value.length,x.value.length)}},300)};
  if(g('klS'))g('klS').onchange=e=>{KL.st=e.target.value;render()};if(g('klM'))g('klM').onchange=e=>{KL.mod=e.target.value;render()}};
/* ---------- accounts (Settings > Accounts): the real logins ---------- */
LIVE.prof={};
const tmpPw=()=>{const A='ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz',D='23456789',a=new Uint32Array(10);crypto.getRandomValues(a);let p='';for(let i=0;i<8;i++)p+=A[a[i]%A.length];return p+D[a[8]%8]+D[a[9]%8]};
async function loadAccounts(){if(!isHRrole())return;const r=await sb.from('profiles').select('user_id,employee_id,role,active,must_change_password,created_at');LIVE.prof={};
  (r.data||[]).forEach(p=>{const n=LIVE.rev.emps[p.employee_id];if(n)LIVE.prof[n]=p});
  try{DATA.emps.forEach(e=>{const p=LIVE.prof[e.id], a=ACC[e.id]||(ACC[e.id]={uid:e.code,hist:[],fails:0,lockUntil:0,by:'System'});
    a.uid=e.code;a.status=p?(p.active?'Active':'Closed'):'Closed';a.must=p?p.must_change_password:false;a.tempUntil='';a.created=p?(p.created_at||'').slice(0,10):'';a.roleOver=p&&p.role!==roleOf(e)?p.role:'';a.last=p&&!p.must_change_password?a.last||'yes':'';a.noLogin=!p})}catch(e){}}
function showPasswords(list){if(!list.length)return;try{openModal(`<h3>${L('Give these first passwords','ये पहले पासवर्ड दें')}</h3><p style="font-size:13px;color:var(--muted)">${L('SMS and email are not connected yet, so give each person the company code, the employee number and this password. They must change it at the first sign-in. This list is shown only now.','SMS और ईमेल अभी नहीं जुड़े, इसलिए हर व्यक्ति को कंपनी कोड, कर्मचारी नंबर और यह पासवर्ड दें। पहले साइन-इन पर बदलना होगा। यह सूची सिर्फ़ अभी दिखती है।')}</p>
  <div class="card tw"><table class="tbl"><thead><tr><th>${L('Company code','कंपनी कोड')}</th><th>${L('Employee','कर्मचारी')}</th><th>${L('Password','पासवर्ड')}</th></tr></thead><tbody>${list.map(x=>`<tr><td>${esc(LIVE.client.code)}</td><td><b>${esc(x.code)}</b> ${esc(x.name)}</td><td style="font-family:monospace">${esc(x.pw)}</td></tr>`).join('')}</tbody></table></div><div class="acts"><button type="button" class="btn btn-p" data-close>${L('Done','हो गया')}</button></div>`,(f,close)=>close())}catch(e){}}
async function ensureLogins(ids){if(!isHRrole())return;const made=[];
  for(const e of DATA.emps){if(!ids.includes(e.id)||!e.active||LIVE.prof[e.id])continue;const uuid=LIVE.map.emps[e.id];if(!uuid)continue;const pw=tmpPw(), role=['admin','hr','manager','employee'].includes(roleOf(e))?roleOf(e):'employee';
    const r=await sb.rpc('create_login',{p_employee:uuid,p_role:role==='admin'?'employee':role,p_password:pw});if(r.error)continue;made.push({code:e.code,name:e.name,pw})}
  if(made.length){await loadAccounts();showPasswords(made)}}
try{hrReset=async function(eid){const p=LIVE.prof[eid], e=empById(eid);if(!p)return toast(L('This person has no login yet','इस व्यक्ति का लॉगिन अभी नहीं है'));const pw=tmpPw();
  const r=await sb.rpc('reset_login_password',{p_user:p.user_id,p_password:pw});if(r.error)return toast(r.error.message);await loadAccounts();showPasswords([{code:e.code,name:e.name,pw}]);render()}}catch(e){}
const _bx4=bindExtra;
bindExtra=function(){_bx4.apply(this,arguments);if(!LIVE.on||!isHRrole())return;const m=document.getElementById('main');if(!m)return;
  const upd=async(eid,role,active)=>{const p=LIVE.prof[eid];if(!p)return toast(L('This person has no login yet','इस व्यक्ति का लॉगिन अभी नहीं है'));const r=await sb.rpc('update_login',{p_user:p.user_id,p_role:role||p.role,p_active:active});if(r.error)return toast(r.error.message);await loadAccounts();toast(t('saved'));render()};
  m.querySelectorAll('[data-acrst]').forEach(b=>b.onclick=()=>hrReset(+b.dataset.acrst));
  m.querySelectorAll('[data-acunl]').forEach(b=>b.onclick=()=>{toast(L('Unlocked','खुल गया'))});
  m.querySelectorAll('[data-accls]').forEach(b=>b.onclick=()=>upd(+b.dataset.accls,null,false));
  m.querySelectorAll('[data-acopen]').forEach(b=>b.onclick=async()=>{const eid=+b.dataset.acopen;if(!LIVE.prof[eid]){await ensureLogins([eid]);render();return}upd(eid,null,true)});
  m.querySelectorAll('[data-acrole]').forEach(s=>s.onchange=()=>{if(state.role!=='admin')return;upd(+s.dataset.acrole,s.value,true)})};
/* ---------- photos and documents go to file storage, not inside the records ---------- */
LIVE.files={byData:{},byUrl:{},urlOf:{}};
const fkey=s=>{let h=0;for(let i=0;i<s.length;i+=97)h=(h*31+s.charCodeAt(i))|0;return s.length+':'+h+':'+s.slice(-48)};
async function toStored(x,store){
  if(typeof x==='string'){
    if(x.startsWith('data:')&&x.length>2000){const k=fkey(x);let p=LIVE.files.byData[k];
      if(!p){const blob=await (await fetch(x)).blob(), ext=(blob.type.split('/')[1]||'bin').replace(/[^a-z0-9]/gi,'').slice(0,5);p=`${LIVE.profile.client_id}/${store}/${crypto.randomUUID()}.${ext}`;
        const r=await sb.storage.from('files').upload(p,blob,{contentType:blob.type||'application/octet-stream',upsert:false});if(r.error)throw r.error;LIVE.files.byData[k]=p}
      return 'sbfile:'+p}
    if(LIVE.files.byUrl[x])return 'sbfile:'+LIVE.files.byUrl[x];
    return x}
  if(Array.isArray(x)){const o=[];for(const v of x)o.push(await toStored(v,store));return o}
  if(x&&typeof x==='object'){const o={};for(const k of Object.keys(x))o[k]=await toStored(x[k],store);return o}
  return x}
const hasFileRef=x=>JSON.stringify(x).includes('"sbfile:');
async function showFiles(roots){
  const paths=new Set();const walk=x=>{if(typeof x==='string'){if(x.startsWith('sbfile:'))paths.add(x.slice(7))}else if(Array.isArray(x))x.forEach(walk);else if(x&&typeof x==='object')Object.values(x).forEach(walk)};roots.forEach(walk);
  const need=[...paths].filter(p=>!LIVE.files.urlOf[p]);
  for(let i=0;i<need.length;i+=100){const r=await sb.storage.from('files').createSignedUrls(need.slice(i,i+100),86400);(r.data||[]).forEach(s=>{if(s.signedUrl){LIVE.files.urlOf[s.path]=s.signedUrl;LIVE.files.byUrl[s.signedUrl]=s.path}})}
  const fix=x=>{if(Array.isArray(x)){x.forEach((v,i)=>{if(typeof v==='string'&&v.startsWith('sbfile:'))x[i]=LIVE.files.urlOf[v.slice(7)]||v;else fix(v)})}
    else if(x&&typeof x==='object'){Object.keys(x).forEach(k=>{const v=x[k];if(typeof v==='string'&&v.startsWith('sbfile:'))x[k]=LIVE.files.urlOf[v.slice(7)]||v;else fix(v)})}};
  roots.forEach(fix)}
/* ---------- see other people's changes: refresh when the page comes back and every 5 minutes ---------- */
LIVE.lastLoad=Date.now();
async function refreshLive(force){
  if(!LIVE.on||LIVE.platform||!LIVE.profile||LIVE.refreshing)return;
  if(!force&&Date.now()-LIVE.lastLoad<3*60000)return;
  if(document.querySelector('.modal-bg'))return; /* never under an open form */
  LIVE.refreshing=true;
  try{await syncNow();while(LIVE.busy)await new Promise(r=>setTimeout(r,200));await loadLive();applyModules();LIVE.lastLoad=Date.now();
    const ae=document.activeElement;if(!ae||!['INPUT','TEXTAREA','SELECT'].includes(ae.tagName))render()}
  catch(e){console.warn('refresh',e)}finally{LIVE.refreshing=false}}
LIVE.refresh=refreshLive;
window.addEventListener('focus',()=>refreshLive(false));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshLive(false)});
setInterval(()=>refreshLive(true),5*60000);
/* every audit line gets a stable id and who did it, so it can be kept */
try{const _au=audit;audit=function(){_au.apply(this,arguments);try{const a=AUDIT[0];if(a&&a.id==null){a.id=Date.now()*100+Math.floor(Math.random()*100);a.by=LIVE.profile?LIVE.rev.emps[LIVE.profile.employee_id]:null;a.ts=new Date().toISOString()}}catch(e){}}}catch(e){}
LIVE.invite=async id=>{if(!isHRrole())return toast(L('Only HR or Admin can do this','यह सिर्फ़ HR या एडमिन कर सकता है'));if(LIVE.prof[id]){const p=LIVE.prof[id];return toast(p.active?L('This person already has a login. Use Reset password in Settings > Accounts.','इस व्यक्ति का लॉगिन पहले से है। सेटिंग > अकाउंट्स में पासवर्ड रीसेट करें।'):L('The login is closed. Reopen it in Settings > Accounts.','लॉगिन बंद है। सेटिंग > अकाउंट्स में फिर खोलें।'))}
  await ensureLogins([id]);render()};
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
  if(d===TODAY_D&&!ATT[k]&&['P','L'].includes(r.st))return LIVE.asOf&&!(typeof ACORR==='object'&&ACORR[k])&&!r.od?{st:'A'}:{st:'N'};
  return r};

/* ---------- save what changed ---------- */
async function syncNow(){
  if(!LIVE.on||LIVE.platform||!LIVE.profile)return;
  if(LIVE.busy){LIVE.queued=true;return}
  LIVE.busy=true;let n=0;
  try{
    sysToX();try{snapKpis()}catch(x){}await syncAttendance();await syncStores();await syncKpis();
    if(isHRrole())for(const k of KINDS){const t=TBL[k];
      for(const o of DATA[k]){const s=sig(k,o);if(LIVE.snap[k][o.id]===s)continue;
        const row=toRow(k,o);let uuid=LIVE.map[k][o.id];
        if(uuid){const r=await sb.from(t).update(row).eq('id',uuid);if(r.error)throw r.error}
        else{const r=await sb.from(t).insert(row).select('id').single();if(r.error)throw r.error;uuid=r.data.id;LIVE.map[k][o.id]=uuid;LIVE.rev[k][uuid]=o.id;if(k==='emps')(LIVE.newEmp=LIVE.newEmp||[]).push(o.id)}
        if(k==='emps'){const r=await sb.from('employee_private').upsert({employee_id:uuid,...toPriv(o)});if(r.error)throw r.error}
        LIVE.snap[k][o.id]=sig(k,o);n++}}
    /* a manager set before the manager was saved: fill it now */
    if(isHRrole())for(const o of DATA.emps){if(o.mgr&&LIVE.map.emps[+o.mgr]){const s=sig('emps',o);if(LIVE.snap.emps[o.id]!==s){await sb.from('employees').update({manager_id:LIVE.map.emps[+o.mgr]}).eq('id',LIVE.map.emps[o.id]);LIVE.snap.emps[o.id]=s}}}
    if(LIVE.newEmp&&LIVE.newEmp.length){const ids=LIVE.newEmp;LIVE.newEmp=[];await ensureLogins(ids)}
    LIVE.err='';
  }catch(e){LIVE.err=(e&&e.message)||String(e);console.error('LIVE sync',e);try{toast('Not saved to the database: '+LIVE.err)}catch(x){}}
  finally{LIVE.busy=false;if(LIVE.queued){LIVE.queued=false;setTimeout(syncNow,50)}}
  if(n){try{await sb.from('audit_log').insert({client_id:LIVE.profile.client_id,user_id:LIVE.profile.user_id,module:'Sync',action:'Saved',subject:n+' record(s)',detail:''})}catch(e){}}
}
let syncT=null;const schedule=()=>{clearTimeout(syncT);syncT=setTimeout(syncNow,600)};

/* ---------- public doors: career portal, candidate joining link, employee referral (server function "portal") ---------- */
const PORTAL='https://okhikmjugdytahgnddjm.supabase.co/functions/v1/portal';
async function portalCall(o,files,auth){const fd=new FormData();Object.keys(o).forEach(k=>{if(o[k]!=null)fd.append(k,o[k])});Object.keys(files||{}).forEach(k=>{if(files[k])fd.append(k,files[k])});
  const h={};if(auth){const s=await sb.auth.getSession();if(s.data.session)h.Authorization='Bearer '+s.data.session.access_token}
  let r;try{r=await fetch(PORTAL,{method:'POST',body:fd,headers:h})}catch(e){throw new Error(L('No internet. Please try again.','इंटरनेट नहीं है। फिर कोशिश करें।'))}
  let j={};try{j=await r.json()}catch(e){}if(!r.ok)throw new Error(j.message||L('Something went wrong. Please try again.','कुछ गड़बड़ हुई। फिर कोशिश करें।'));return j}
const sha=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
const pubTop=(org,right)=>`<div style="display:flex;align-items:center;gap:10px;margin-bottom:18px"><h1 style="margin:0;flex:1;font-size:22px">${esc(org||'LV People')}</h1>${right||''}<a href="#" id="pubLang" style="font-size:13px">${lang==='hi'?'EN':'हिं'}</a></div>`;
const pubLang=(el,again)=>{const a=el.querySelector('#pubLang');if(a)a.onclick=e=>{e.preventDefault();lang=lang==='hi'?'en':'hi';again()}};
const pubShell=id=>{let el=document.getElementById(id);if(!el){el=document.createElement('div');el.id=id;el.style.cssText='position:fixed;inset:0;z-index:10000;overflow:auto;background:var(--bg,#f4f7f6)';document.body.appendChild(el)}return el};
const pubMsg=(el,org,txt)=>{el.innerHTML=`<div style="max-width:620px;margin:0 auto;padding:24px 16px">${pubTop(org)}<div class="card"><p>${txt}</p></div></div>`;pubLang(el,()=>{})};
/* the candidate's joining form: #join=<token> */
function joinBoot(){const m=location.hash.match(/^#join=([a-f0-9]{64})/), el0=document.getElementById('joinPage');if(!m){if(el0)el0.remove();return}renderJoin(pubShell('joinPage'),m[1])}
async function renderJoin(el,tok){el.innerHTML=`<div style="max-width:620px;margin:0 auto;padding:40px 16px;text-align:center;color:var(--muted)">…</div>`;
  let d;try{d=await portalCall({action:'link',token:tok})}catch(e){return pubMsg(el,'LV People',esc(e.message))}
  const I=d.info||{}, P=d.prev||{}, up=d.uploaded||{}, v=k=>esc(P[k]||'');
  if(d.locked)return pubMsg(el,I.org,L('HR has already received your details. Thank you. Please contact HR if something must be changed.','HR को आपकी जानकारी मिल चुकी है। धन्यवाद। कुछ बदलना हो तो HR से संपर्क करें।'));
  const docs=[['id',L('Aadhaar card (copy)','आधार कार्ड (प्रति)'),1],['pan',L('PAN card (copy)','पैन कार्ड (प्रति)'),1],['bank',L('Bank proof: cancelled cheque or passbook first page','बैंक का प्रमाण: कैंसिल चेक या पासबुक का पहला पन्ना'),1],['edu',L('Education certificate (highest)','शिक्षा प्रमाणपत्र (सबसे ऊँचा)'),1],['photo',L('Passport size photo','पासपोर्ट साइज़ फ़ोटो'),1],['rel',L('Relieving letter of your last job (if you have worked before)','पिछली नौकरी का रिलीविंग लेटर (पहले काम किया हो तो)'),0]];
  el.innerHTML=`<div style="max-width:620px;margin:0 auto;padding:24px 16px">${pubTop(I.org)}
   <div class="card" style="margin-bottom:14px"><h3 style="margin-top:0">${L('Welcome','स्वागत है')}, ${esc(I.name||'')}</h3><p style="margin:0;font-size:14px">${esc(I.position||'')} · ${esc(I.branch||'')}${I.joinDate?' · '+L('Joining','जॉइनिंग')+' '+fmtY(I.joinDate):''}</p><p style="font-size:13px;color:var(--muted);margin-bottom:0">${L('Please fill your details and upload the documents before the day you join. Files: PDF or photo, up to 2 MB each. You can send the form again to change something, until HR has received it.','जॉइनिंग से पहले अपनी जानकारी भरें और दस्तावेज़ अपलोड करें। फ़ाइल: PDF या फ़ोटो, हर एक 2 MB तक। HR के लेने से पहले आप फ़ॉर्म दोबारा भेजकर कुछ बदल सकते हैं।')}</p>${d.submitted?`<p class="pill p-ok" style="margin-top:10px">${L('You have already sent the form. You may send it again to change something.','आप फ़ॉर्म भेज चुके हैं। कुछ बदलना हो तो दोबारा भेज सकते हैं।')}</p>`:''}</div>
   <form class="card" id="jf" novalidate><h3 style="margin-top:0">${L('Personal details','निजी जानकारी')}</h3><div class="fgrid">
    <div><label>${L('Father\'s name','पिता का नाम')} *</label><input class="inp" name="father" value="${v('father')}"></div><div><label>${L('Date of birth','जन्म तिथि')} *</label><input class="inp" type="date" name="dob" value="${v('dob')}"></div>
    <div><label>${L('Gender','लिंग')} *</label><select class="inp" name="gender"><option value="">—</option><option value="M" ${P.gender==='M'?'selected':''}>${L('Male','पुरुष')}</option><option value="F" ${P.gender==='F'?'selected':''}>${L('Female','महिला')}</option><option value="O" ${P.gender==='O'?'selected':''}>${L('Other','अन्य')}</option></select></div><div><label>Email</label><input class="inp" name="email" value="${v('email')}"></div></div>
   <label>${L('Address','पता')} *</label><textarea class="inp" name="address" rows="2">${v('address')}</textarea><div class="fgrid">${locPickHTML('j',{s:P.a_s,d:P.a_d,y:P.a_y},{req:true})}</div>
   <h3>${L('Emergency contact','आपातकालीन संपर्क')}</h3><div class="fgrid"><div><label>${L('Name','नाम')} *</label><input class="inp" name="ec_name" value="${v('ec_name')}"></div><div><label>${L('Mobile','मोबाइल')} *</label><input class="inp" name="ec_mobile" inputmode="numeric" maxlength="10" value="${v('ec_mobile')}"></div></div>
   <h3>${L('Identity and bank','पहचान और बैंक')}</h3><div class="fgrid"><div><label>PAN *</label><input class="inp" name="pan" maxlength="10" style="text-transform:uppercase" value="${v('pan')}"></div><div><label>Aadhaar ${L('number','नंबर')} *</label><input class="inp" name="aadhaar" inputmode="numeric" maxlength="12" value="${v('aadhaar')}"></div>
    <div><label>UAN (${L('if you have one','अगर है')})</label><input class="inp" name="uan" inputmode="numeric" maxlength="12" value="${v('uan')}"></div><div><label>${L('Bank account holder name','बैंक खाताधारक का नाम')} *</label><input class="inp" name="bank_holder" value="${v('bank_holder')}"></div>
    <div><label>${L('Bank account number','बैंक खाता नंबर')} *</label><input class="inp" name="acc" inputmode="numeric" maxlength="20" value="${v('acc')}"></div><div><label>IFSC *</label><input class="inp" name="ifsc" maxlength="11" style="text-transform:uppercase" value="${v('ifsc')}"></div></div>
   <h3>${L('Documents','दस्तावेज़')}</h3>${docs.map(([k,l,req])=>`<label>${l}${req?' *':''}${up[k]?` <span class="pill p-ok" style="font-size:11px">${L('uploaded','अपलोड हो चुका')}</span>`:''}</label><input class="inp" type="file" name="f_${k}" accept=".pdf,image/*">`).join('')}
   <input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
   <div id="jfe" style="color:var(--bad);font-size:13px;margin-top:10px"></div><div class="acts"><button class="btn btn-p" id="jfb">${L('Send to HR','HR को भेजें')}</button></div></form></div>`;
  pubLang(el,()=>renderJoin(el,tok));
  const f=el.querySelector('#jf'), er=m=>{el.querySelector('#jfe').textContent=m};
  f.onsubmit=async e=>{e.preventDefault();const x=Object.fromEntries(new FormData(f));er('');
    if(!x.father.trim()||!x.dob||!x.gender||!x.address.trim())return er(L('Please fill father\'s name, date of birth, gender and address','पिता का नाम, जन्म तिथि, लिंग और पता भरें'));
    if(!+x.j_s||!+x.j_d||!+x.j_y)return er(L('Choose your state, district and city','अपना राज्य, ज़िला और शहर चुनें'));
    if(!x.ec_name.trim()||!/^[6-9]\d{9}$/.test(x.ec_mobile))return er(L('Enter the emergency contact name and a 10 digit mobile number','आपातकालीन संपर्क का नाम और 10 अंक का मोबाइल भरें'));
    if(!/^[A-Za-z]{5}\d{4}[A-Za-z]$/.test(x.pan))return er(L('PAN looks wrong (like ABCDE1234F)','PAN सही नहीं लगता (जैसे ABCDE1234F)'));if(!/^\d{12}$/.test(x.aadhaar))return er(L('Aadhaar must be 12 digits','आधार 12 अंक का हो'));
    if(!x.bank_holder.trim()||!/^\d{6,20}$/.test(x.acc)||!/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(x.ifsc))return er(L('Check the bank holder name, account number and IFSC','बैंक खाताधारक का नाम, खाता नंबर और IFSC जाँचें'));
    for(const [k,,req] of docs){const fl=f.elements['f_'+k].files[0];if(req&&!fl&&!up[k])return er(L('Please upload all the documents marked *','* वाले सारे दस्तावेज़ अपलोड करें'));if(fl&&fl.size>2*1024*1024)return er(L('A file is larger than 2 MB','कोई फ़ाइल 2 MB से बड़ी है'))}
    const fields={action:'submit',token:tok,father:x.father,dob:x.dob,gender:x.gender,email:x.email,address:x.address,a_s:x.j_s,a_d:x.j_d,a_y:x.j_y,ec_name:x.ec_name,ec_mobile:x.ec_mobile,pan:x.pan,aadhaar:x.aadhaar,uan:x.uan,bank_holder:x.bank_holder,acc:x.acc,ifsc:x.ifsc,website:x.website}, files={};docs.forEach(([k])=>{files['f_'+k]=f.elements['f_'+k].files[0]});
    const b=el.querySelector('#jfb');b.disabled=true;b.textContent=L('Sending…','भेज रहे हैं…');
    try{await portalCall(fields,files);f.innerHTML=`<h3 style="margin-top:0">${L('Thank you','धन्यवाद')}, ${esc(I.name||'')}</h3><p>${L('HR has received your details and documents. See you on the joining day.','HR को आपकी जानकारी और दस्तावेज़ मिल गए। जॉइनिंग के दिन मिलते हैं।')}</p><p style="color:var(--muted);font-size:13px">${L('If something is wrong, you can open this link again and send the form once more until HR has received it.','कुछ गलत हो तो यही लिंक दोबारा खोलकर फ़ॉर्म फिर भेज सकते हैं, जब तक HR उसे न ले ले।')}</p>`}
    catch(err){er(err.message);b.disabled=false;b.textContent=L('Send to HR','HR को भेजें')}}}
/* the career portal on the real data: #careers=<company code> */
const careerCode=()=>{const m=location.hash.match(/^#careers=([a-z0-9_-]{2,30})/);return m?m[1]:''};
renderCareers=function(el){renderCareersLive(el)};
async function renderCareersLive(el){const code=careerCode();
  if(!code)return pubMsg(el,'LV People',L('This career link is not complete. Please ask the company for the right link.','यह करियर लिंक अधूरा है। कंपनी से सही लिंक माँगें।'));
  el.innerHTML=`<div style="max-width:620px;margin:0 auto;padding:40px 16px;text-align:center;color:var(--muted)">…</div>`;
  let d;try{d=await portalCall({action:'vacancies',code})}catch(e){return pubMsg(el,'LV People',esc(e.message))}
  const pre=(location.hash.match(/vac=(\d+)/)||[])[1], open=d.vacancies||[];
  el.innerHTML=`<div style="max-width:620px;margin:0 auto;padding:24px 16px">${pubTop(d.org+' · '+L('Careers','करियर'),'')}
   ${open.length?`<div class="card" id="cpForm"><h3 style="margin-top:0">${L('Apply for a job','नौकरी के लिए आवेदन')}</h3><form id="cpf" novalidate>
    <label>${L('Select vacancy','वैकेंसी चुनें')} *</label><select class="inp" name="vac">${open.map(v=>`<option value="${v.id}" ${String(v.id)===pre?'selected':''}>${esc(v.desig)} · ${esc(v.branch)}</option>`).join('')}</select>
    <label>${L('Name','नाम')} *</label><input class="inp" name="name"><label>${L('Father\'s name','पिता का नाम')} *</label><input class="inp" name="father"><label>${L('Mobile number','मोबाइल नंबर')} *</label><input class="inp" name="mobile" inputmode="numeric" maxlength="10"><label>${L('Address','पता')} *</label><textarea class="inp" name="address" rows="2"></textarea><div class="fgrid">${locPickHTML('a',{},{req:true})}</div>
    <label>${L('Years of experience','अनुभव (वर्ष)')} *</label><input class="inp" type="number" min="0" max="60" step="0.5" name="exp"><label>${L('Current salary (per month)','मौजूदा सैलरी (प्रति माह)')} *</label><input class="inp" type="number" min="0" name="cur"><label>${L('Expected salary (per month)','अपेक्षित सैलरी (प्रति माह)')} *</label><input class="inp" type="number" min="0" name="exp2">
    <label>${L('Resume (PDF, Word or photo, up to 2 MB, optional)','रिज़्यूमे (PDF, Word या फ़ोटो, 2 MB तक, वैकल्पिक)')}</label><input class="inp" type="file" name="resume" accept=".pdf,.doc,.docx,image/*"><label>${L('Or a resume link (optional)','या रिज़्यूमे लिंक (वैकल्पिक)')}</label><input class="inp" name="resume_link">
    <input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
    <div id="cpe" style="color:var(--bad);font-size:13px;margin-top:8px"></div><div class="acts"><button class="btn btn-p" id="cpb">${L('Submit application','आवेदन भेजें')}</button></div></form></div>`:`<div class="card"><p>${L('There is no open vacancy right now. Please check again later.','अभी कोई वैकेंसी खुली नहीं है। कृपया बाद में देखें।')}</p></div>`}</div>`;
  pubLang(el,()=>renderCareersLive(el));
  const f=el.querySelector('#cpf');if(!f)return;
  f.onsubmit=async e=>{e.preventDefault();const v=Object.fromEntries(new FormData(f)), er=m=>{el.querySelector('#cpe').textContent=m};er('');
    if(!v.name.trim()||!v.father.trim()||!v.address.trim())return er(L('Name, father\'s name and address are required','नाम, पिता का नाम और पता ज़रूरी हैं'));if(!/^[6-9]\d{9}$/.test(v.mobile))return er(L('Enter a 10 digit mobile number','10 अंक का मोबाइल नंबर भरें'));if(!+v.a_s||!+v.a_d||!+v.a_y)return er(L('Choose your state, district and city','अपना राज्य, ज़िला और शहर चुनें'));
    if(v.exp===''||v.cur===''||v.exp2==='')return er(L('Enter experience and both salaries','अनुभव और दोनों सैलरी भरें'));const rf=f.elements.resume.files[0];if(rf&&rf.size>2*1024*1024)return er(L('The resume file is larger than 2 MB','रिज़्यूमे फ़ाइल 2 MB से बड़ी है'));
    const b=el.querySelector('#cpb');b.disabled=true;b.textContent='…';
    try{const r=await portalCall({action:'apply',code,vac:v.vac,name:v.name,father:v.father,mobile:v.mobile,address:v.address,a_s:v.a_s,a_d:v.a_d,a_y:v.a_y,exp:v.exp,cur:v.cur,exp2:v.exp2,resume_link:v.resume_link,website:v.website},{resume:rf});
      el.querySelector('#cpForm').innerHTML=`<h3 style="margin-top:0">${L('Thank you','धन्यवाद')}, ${esc(v.name)}</h3><p>${L('Your application is received. Our HR team will call you.','आपका आवेदन मिल गया। हमारी HR टीम आपसे संपर्क करेगी।')}</p><p style="color:var(--muted);font-size:13px">${L('Reference','संदर्भ')}: ${esc(r.ref||'')}</p>`}
    catch(err){er(err.message);b.disabled=false;b.textContent=L('Submit application','आवेदन भेजें')}}}
/* an employee's referral goes to HR through the server (employees cannot write the recruitment records) */
LIVE.isReferServer=()=>LIVE.on&&!isHRrole();
LIVE.refer=(v,file)=>portalCall({action:'refer',vac:v.vac,name:v.name,mobile:v.mobile,email:v.email,resume_link:v.resume},{resume:file},true);
/* HR: a joining link for a candidate (only the fingerprint of the link is kept; the link itself is shown once) */
LIVE.joinLink=async cid=>{const c=candById(cid), v=vacById(c.vac), off=RC.offer.find(o=>o.cand===cid&&['Offered','Accepted'].includes(o.st));
  const tok=[...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join('');
  const jd=off?off.joinDate:addD(TODAY_S,7), exp=new Date(jd+'T23:59:59+05:30');exp.setDate(exp.getDate()+7);
  const del=await sb.from('candidate_links').delete().eq('client_id',LIVE.profile.client_id).eq('cand_id',cid);if(del.error)throw del.error;
  const r=await sb.from('candidate_links').insert({client_id:LIVE.profile.client_id,cand_id:cid,token_hash:await sha(tok),info:{name:c.name,position:nm('desigs',v.desig),branch:nm('branches',v.branch),org:ORGS.org,joinDate:jd},expires_at:exp.toISOString(),created_by:LIVE.profile.user_id});if(r.error)throw r.error;
  return location.origin+location.pathname+'#join='+tok};
window.joinLinkModal=async function(cid){if(!isHRrole())return toast(L('Only HR or Admin can do this','यह सिर्फ़ HR या एडमिन कर सकता है'));
  let url;try{url=await LIVE.joinLink(cid)}catch(e){return toast(L('The link could not be made: ','लिंक नहीं बना: ')+(e.message||e))}
  const c=candById(cid), txt=`${L('Hello','नमस्ते')} ${c.name}, ${L('please fill your joining details and upload your documents here','कृपया अपनी जॉइनिंग की जानकारी भरें और दस्तावेज़ यहाँ अपलोड करें')}: ${url}`;
  openModal(`<h3>${L('Joining link','जॉइनिंग लिंक')} · ${esc(c.name)}</h3><p style="font-size:13px;color:var(--muted)">${L('Send this link to the candidate. It works only for this candidate and stops working 7 days after the joining date. It is shown only now; making a new link cancels this one.','यह लिंक उम्मीदवार को भेजें। यह सिर्फ़ इसी उम्मीदवार के लिए है और जॉइनिंग के 7 दिन बाद बंद हो जाता है। यह अभी ही दिखता है; नया लिंक बनाने पर यह रद्द हो जाता है।')}</p>
   <textarea class="inp" id="jlTxt" rows="4" readonly style="font-size:12px">${esc(url)}</textarea><div class="acts" style="flex-wrap:wrap"><button type="button" class="btn btn-o" data-close>${t('cancel')}</button><button type="button" class="btn btn-o" id="jlCopy">${L('Copy link','लिंक कॉपी करें')}</button><a class="btn btn-p" target="_blank" rel="noopener" href="https://wa.me/91${esc(c.mobile)}?text=${encodeURIComponent(txt)}">WhatsApp</a></div>`,(f,close)=>close());
  const bg=document.querySelector('.modal-bg');bg.querySelector('#jlCopy').onclick=()=>{const ta=bg.querySelector('#jlTxt');ta.select();try{navigator.clipboard.writeText(url)}catch(e){document.execCommand('copy')}toast(L('Copied','कॉपी हुआ'))}};
/* HR: what candidates sent through the portal becomes part of the recruitment records */
const dayOf=ts=>String(ts||'').slice(0,10)||TODAY_S;
function mergePortal(links,apps){const doneL=[],doneA=[],say=[];
  links.forEach(row=>{const c=RC.cand.find(x=>x.id===row.cand_id), d=row.data;doneL.push(row.id);if(!c||!d)return;
    const fl={}, nmf={};Object.keys(d.files||{}).forEach(k=>{fl[k]='sbfile:'+d.files[k].path;nmf[k]=d.files[k].name});
    c.self={father:d.father,dob:d.dob,gender:d.gender,address:d.address,ec_name:d.ec_name,ec_mobile:d.ec_mobile,email:d.email,pan:d.pan,aadhaar:d.aadhaar,uan:d.uan,bank_holder:d.bank_holder,acc:d.acc,ifsc:d.ifsc,files:fl,fileNames:nmf,at:row.submitted_at};
    c.father=d.father;c.address=d.address;c.loc=locRead(d,'a');if(!c.email&&d.email)c.email=d.email;
    RC.docs[c.id]=RC.docs[c.id]||Object.fromEntries(DOCITEMS.map(x=>[x[0],{rec:'',ver:''}]));Object.keys(fl).forEach(k=>{const dd=RC.docs[c.id][k];if(dd&&!dd.rec)dd.rec=dayOf(row.submitted_at)});
    c.hist.push({at:dayOf(row.submitted_at),from:c.stage,to:c.stage,by:0,note:L('The candidate filled the joining form','उम्मीदवार ने जॉइनिंग फ़ॉर्म भरा')});
    try{notify([hrId()],`${L('Joining form received','जॉइनिंग फ़ॉर्म मिला')}: ${c.name}`,{page:'recruit',tab:'cand'},'JF|'+c.id+'|'+row.id)}catch(e){}say.push(c.name)});
  apps.forEach(row=>{const d=row.data;doneA.push(row.id);if(!d||RC.cand.some(x=>x.mobile===row.mobile))return;const v=RC.vac.find(x=>x.id===+d.vac);if(!v)return;
    const c={id:++seq,name:d.name,father:d.father||'',mobile:row.mobile,email:d.email||'',address:d.address||'',loc:d.a_s?locRead(d,'a'):undefined,exp:d.exp,curSal:d.cur,expSal:d.exp2,source:d.source||'Career portal',refBy:+d.refBy||0,resume:d.resumeLink||'',resumeData:d.resumeFile?'sbfile:'+d.resumeFile.path:'',resumeName:d.resumeFile?d.resumeFile.name:'',vac:v.id,recruiter:v.recruiter,created:dayOf(row.created_at),stage:'Applied',stageAt:dayOf(row.created_at),hist:[{at:dayOf(row.created_at),from:'',to:'Applied',by:0,note:d.source||'Career portal'}],reason:''};
    RC.cand.push(c);audit('Recruitment','Candidate applied ('+(d.source||'Career portal')+')',c.name,vacName(v));say.push(c.name)});
  return{doneL,doneA,say}}
LIVE.mergePortal=mergePortal;
async function pullPortal(){if(!isHRrole())return;
  try{const [cl,ca]=await Promise.all([sb.from('candidate_links').select('id,cand_id,data,submitted_at').not('submitted_at','is',null).is('merged_at',null),sb.from('career_applications').select('id,mobile,data,created_at').is('merged_at',null)]);
    if(cl.error||ca.error)throw (cl.error||ca.error);if(!(cl.data||[]).length&&!(ca.data||[]).length)return;
    const r=mergePortal(cl.data||[],ca.data||[]), now=new Date().toISOString();
    const roots=[];RC.cand.forEach(c=>{if(c.self)roots.push(c.self);if(typeof c.resumeData==='string'&&c.resumeData.startsWith('sbfile:'))roots.push(c)});try{await showFiles(roots)}catch(e){console.warn('portal files',e)}
    if(r.doneL.length)await sb.from('candidate_links').update({merged_at:now}).in('id',r.doneL);if(r.doneA.length)await sb.from('career_applications').update({merged_at:now}).in('id',r.doneA);
    if(r.say.length)try{toast(L('From the portal: ','पोर्टल से: ')+r.say.join(', '))}catch(e){}}
  catch(e){console.warn('portal pull',e)}}
LIVE.pullPortal=pullPortal;
window.addEventListener('hashchange',joinBoot);
/* ---------- the note at the top of each page ---------- */
const LIVE_PAGES=['dashboard','employees','profile','setup','org','workforce','cockpit','attendance','attreq','leave','timeoffice','payroll','myreq','team','pms','decision','assets','myasset','support','inbox','recruit','expense','exits','training','marketing','crm','library','engage','bizdata','stock','import','analytics','reports','settings'];
function note(){const m=document.getElementById('main');if(!m||!LIVE.on||LIVE.platform)return;let n=document.getElementById('liveNote');
  const live=LIVE_PAGES.includes(state.page);
  const txt=live?L('Live: the data on this page is saved in the database.','लाइव: इस पेज का डेटा डेटाबेस में सेव होता है।')
    :L('This module is not connected to the database yet: it shows sample data and changes are not saved. Live now: employees, organisation, attendance, leave, payroll, PMS, My Assignment, assets, support and inbox.','यह मॉड्यूल अभी डेटाबेस से नहीं जुड़ा: इसमें नमूना डेटा है और बदलाव सेव नहीं होते। अभी लाइव: कर्मचारी, संगठन, हाज़िरी, छुट्टी, पेरोल, PMS, माई असाइनमेंट, एसेट, सपोर्ट और इनबॉक्स।');
  if(!n){n=document.createElement('div');n.id='liveNote';n.style.cssText='margin:0 0 12px;padding:8px 12px;border-radius:10px;font-size:12px'}
  n.style.background=live?'rgba(22,138,74,.12)':'rgba(183,121,31,.14)';n.style.color=live?'#166534':'#92400e';n.textContent=(LIVE.err?'⚠ '+LIVE.err+' · ':'')+txt;
  if(m.firstChild!==n)m.insertBefore(n,m.firstChild);closeBar(m)}
/* ---------- close last month: HR works on the app as on the last day of last month (attendance, payroll, KPI) ---------- */
LIVE.asOf=typeof _ASOF!=='undefined'?_ASOF:null;
/* a day whose lunch punch is missing shows in Punch exceptions */
try{EXTYPE.lunch=['Lunch punch missing','लंच पंच छूटा','p-warn'];
  const _exr=excRows;excRows=function(){const out=_exr();DATA.emps.filter(e=>e.active!==false).forEach(e=>{for(let d=1;d<=TODAY_D;d++){const s=ds(d), a=ATT[e.id+'|'+s];if(!a||!a.lunchMiss||ACORR[e.id+'|'+s]||out.some(x=>x.emp===e.id&&x.s===s&&x.type==='lunch'))continue;out.push({emp:e.id,d,s,type:'lunch',r:dayRec(e.id,d)})}});return out.sort((a,b)=>a.s<b.s?1:a.s>b.s?-1:a.emp-b.emp)}}catch(e){console.warn('lunch exc',e)}
/* when closing a month its last day is over: one punch only = missed punch (Absent until corrected) */
try{const _dst=dayStatus;dayStatus=function(){const r=_dst.apply(this,arguments);return LIVE.asOf&&r&&r.pending?{...r,st:'A',miss:true,pending:false}:r}}catch(e){}
const setAsOf=v=>{try{if(v)sessionStorage.setItem('lvAsOf',v);else sessionStorage.removeItem('lvAsOf')}catch(e){}location.reload()};LIVE.setAsOf=setAsOf;
/* after the app opens a month or comes back to today, show the page the person was on */
LIVE.afterLoad=()=>{try{const a=JSON.parse(sessionStorage.getItem('lvAfter')||'null');if(!a)return;sessionStorage.removeItem('lvAfter');Object.assign(state,a);if(a.paym&&!PMON[a.paym])delete state.paym;render()}catch(e){}};
const lastMonthEnd=()=>{const n=new Date(Date.now()+(330+new Date().getTimezoneOffset())*60000);const d=new Date(n.getFullYear(),n.getMonth(),0);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
function closeBar(m){let b=document.getElementById('closeBar');if(b)b.remove();if(!isHRrole()){if(LIVE.asOf&&LIVE.profile)setAsOf(null);return}
  const mname=s=>new Date(s+'T12:00:00').toLocaleDateString(loc(),{month:'long',year:'numeric'});
  b=document.createElement('div');b.id='closeBar';b.style.cssText='margin:0 0 12px;padding:9px 12px;border-radius:10px;font-size:13px;display:flex;gap:10px;align-items:center;flex-wrap:wrap';
  if(LIVE.asOf){b.style.background='rgba(185,28,28,.12)';b.style.color='#991b1b';
    b.innerHTML=`<b>${L('Closing month: ','महीना बंद हो रहा है: ')+mname(LIVE.asOf)}</b><span>${L('The app shows the last day of that month. Process attendance, run payroll and close the KPI scores, then go back.','ऐप उस महीने का आख़िरी दिन दिखा रहा है। हाज़िरी प्रोसेस, पेरोल और KPI स्कोर बंद करें, फिर वापस जाएँ।')}</span><button class="btn btn-p btn-s" id="asOfBack">${L('Back to today','आज पर वापस')}</button>`}
  else return; /* last month is closed from Payroll > Monthly payroll: choose the month there */
  m.insertBefore(b,m.children[1]||null);
  const g=document.getElementById('asOfGo');if(g)g.onclick=()=>setAsOf(lastMonthEnd());const k=document.getElementById('asOfBack');if(k)k.onclick=()=>setAsOf(null)}

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
  try{LIVE.afterLoad&&LIVE.afterLoad()}catch(x){}
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
try{joinBoot();careersBoot()}catch(e){console.warn('public pages',e)}
})();
