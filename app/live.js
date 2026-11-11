/* ================= Mirror-HR live layer =================
   The prototype screens stay exactly as they are. This file only:
   1. signs in through Supabase (company code + employee code + password),
   2. loads the client's organisation and employees from the database into the prototype data,
   3. saves employee and organisation changes back to the database.
   Modules not connected yet keep showing the prototype sample data; a note at the top says so. */
(function(){
if(!window.supabase){document.body.innerHTML='<div style="min-height:100vh;display:grid;place-items:center;padding:16px;font-family:system-ui"><div style="max-width:380px;text-align:center"><h1 style="color:#1f3a5f">Mirror-HR</h1><p>Internet is not available, or it is very slow. Please check the connection and reload the page.</p><p>इंटरनेट उपलब्ध नहीं है या बहुत धीमा है। कनेक्शन जाँचें और पेज दोबारा खोलें।</p><button onclick="location.reload()" style="padding:8px 16px">Reload</button></div></div>';return}
const sb=window.supabase.createClient('https://okhikmjugdytahgnddjm.supabase.co','sb_publishable_2rSs43HfAzKoTbqw5_AQkA_7XzAxMv0',{auth:{persistSession:true,autoRefreshToken:true}});
const LIVE=window.LIVE={sb,on:false,profile:null,client:null,platform:false,map:{},rev:{},snap:{},busy:false,queued:false,err:''};
const KINDS=['functions','depts','branches','divisions','subdivs','desigs','emps'];
const TBL={branches:'branches',subdivs:'sub_divisions',divisions:'divisions',depts:'departments',functions:'job_functions',desigs:'designations',emps:'employees'};
KINDS.forEach(k=>{LIVE.map[k]={};LIVE.rev[k]={};LIVE.snap[k]={}});
const nz=v=>v===''||v===undefined?null:v;
const isHRrole=()=>['admin','hr'].includes(LIVE.profile&&LIVE.profile.role);

/* ---------- database row <-> prototype object ---------- */
const P1=a=>(a&&a.length?a[0]:null);
function toRow(kind,o){const r=toRow0(kind,o);r.num_id=+o.id||null;return r}
function toRow0(kind,o){const M=LIVE.map, c=LIVE.profile.client_id;
  const ids=(k,a)=>(a||[]).map(i=>M[k][i]).filter(Boolean), act=o.off?false:true;
  /* Organization structure order: Function > Department > Branch > Division > Sub-division > Designation. Each level keeps the ids of the level above */
  if(kind==='functions')return{client_id:c,code:nz(o.code),name:o.name,active:act};
  if(kind==='depts')return{client_id:c,code:nz(o.code),name:o.name,parent_ids:ids('functions',o.parents),active:act};
  if(kind==='branches')return{client_id:c,code:nz(o.code),name:o.name,city:nz(o.city),state:nz(o.state),pin:nz(o.pin),address:nz(o.line),zone:nz(o.zone),parent_ids:ids('depts',o.parents),active:act};
  if(kind==='divisions')return{client_id:c,code:nz(o.code),name:o.name,parent_ids:ids('branches',o.parents),dept_ids:o.depts?ids('depts',o.depts):null,active:act};
  if(kind==='subdivs')return{client_id:c,code:nz(o.code),name:o.name,parent_ids:ids('divisions',o.parents),active:act};
  if(kind==='desigs')return{client_id:c,code:nz(o.code),name:o.name,parent_ids:ids('subdivs',o.parents),division_ids:o.divs?ids('divisions',o.divs):null,function_ids:o.funcs?ids('functions',o.funcs):null,active:act};
  const em=[1,2].filter(i=>o['ec'+i+'_name']).map(i=>({name:o['ec'+i+'_name'],relation:o['ec'+i+'_rel']||'',mobile:o['ec'+i+'_mob']||''}));
  return{client_id:c,code:o.code,name:o.name,mobile:nz(o.mobile),email:nz(o.email),dob:nz(o.dob),gender:['M','F','O'].includes(o.gender)?o.gender:null,doj:nz(o.doj),
    branch_id:M.branches[o.branch]||null,division_id:M.divisions[o.division]||null,sub_division_id:M.subdivs[o.subdiv]||null,department_id:M.depts[o.dept]||null,function_id:M.functions[o.func]||null,designation_id:M.desigs[o.desig]||null,
    manager_id:o.mgr?(M.emps[+o.mgr]||null):null,functional_manager_id:o.fm?(M.emps[+o.fm]||null):null,level:+o.level||1,status:o.status||'Working',lwd:nz(o.lwd),active:o.active!==false,caste:nz(o.caste),marital_status:nz(o.marital),weekly_off:nz(o.wo),emergency:em}}
function toPriv(o){return{client_id:LIVE.profile.client_id,ctc:+o.ctc||0,pan:nz(o.pan),aadhaar:nz(o.aadhaar),uan:nz(o.uan),esi:nz(o.esi),bank_name:nz(o.bank),ifsc:nz(o.ifsc),account_no:nz(o.acc)}}
const sig=(kind,o)=>JSON.stringify(kind==='emps'?[toRow(kind,o),isHRrole()?toPriv(o):null]:toRow(kind,o));

/* ---------- load ---------- */
async function q(t,sel){const r=await sb.from(t).select(sel||'*');if(r.error)throw r.error;return r.data||[]}
async function loadLive(){
  const [br,dv,dp,fn,dg,em,sd]=await Promise.all([q('branches'),q('divisions'),q('departments'),q('job_functions'),q('designations'),q('employees'),q('sub_divisions')]);
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
  /* the levels are loaded top down, because each one points to the level above it */
  const up=(kind,a)=>(a||[]).map(u=>LIVE.rev[kind][u]).filter(Boolean);
  pick('functions',fn,nmKey,(o,r)=>Object.assign(o,{name:r.name,code:r.code||o.code||'',parents:[],off:!r.active}));
  pick('depts',dp,nmKey,(o,r)=>Object.assign(o,{name:r.name,code:r.code||o.code||'',head:o.head||'',parents:up('functions',r.parent_ids),off:!r.active}));
  pick('branches',br,nmKey,(o,r)=>Object.assign(o,{name:r.name,code:r.code||o.code||'',city:r.city||'',state:r.state||'',pin:r.pin||'',line:r.address||'',zone:r.zone||'',parents:up('depts',r.parent_ids),off:!r.active}));
  pick('divisions',dv,nmKey,(o,r)=>{Object.assign(o,{name:r.name,code:r.code||o.code||'',parents:up('branches',r.parent_ids),off:!r.active});if(r.dept_ids)o.depts=up('depts',r.dept_ids);else delete o.depts});
  pick('subdivs',sd,nmKey,(o,r)=>Object.assign(o,{name:r.name,code:r.code||o.code||'',parents:up('divisions',r.parent_ids),off:!r.active}));
  pick('desigs',dg,nmKey,(o,r)=>{Object.assign(o,{name:r.name,code:r.code||o.code||'',parents:up('subdivs',r.parent_ids),off:!r.active});if(r.division_ids)o.divs=up('divisions',r.division_ids);else delete o.divs;if(r.function_ids)o.funcs=up('functions',r.function_ids);else delete o.funcs});
  const codeKey=x=>String(x.code||'').toUpperCase();
  pick('emps',em,codeKey,(o,r)=>{const p=pv.find(z=>z.employee_id===r.id)||{}, ec=r.emergency||[];
    Object.assign(o,{code:r.code,name:r.name,mobile:r.mobile||'',email:r.email||'',dob:r.dob||'',gender:r.gender||'',doj:r.doj||'',branch:LIVE.rev.branches[r.branch_id]||'',division:LIVE.rev.divisions[r.division_id]||'',subdiv:LIVE.rev.subdivs[r.sub_division_id]||'',dept:LIVE.rev.depts[r.department_id]||'',func:LIVE.rev.functions[r.function_id]||'',desig:LIVE.rev.desigs[r.designation_id]||'',
      level:r.level||1,status:r.status||'Working',lwd:r.lwd||'',active:r.active,caste:r.caste||o.caste||'',marital:r.marital_status||'',wo:r.weekly_off||'',
      ctc:+p.ctc||0,pan:p.pan||'',aadhaar:p.aadhaar||'',uan:p.uan||'',esi:p.esi||'',bank:p.bank_name||'',ifsc:p.ifsc||'',acc:p.account_no||'',
      ec1_name:(ec[0]||{}).name||'',ec1_rel:(ec[0]||{}).relation||'',ec1_mob:(ec[0]||{}).mobile||'',ec2_name:(ec[1]||{}).name||'',ec2_rel:(ec[1]||{}).relation||'',ec2_mob:(ec[1]||{}).mobile||'',
      hist:o.hist||[],lvlHist:o.lvlHist||[{from:'0000-00',lvl:r.level||1,desig:LIVE.rev.desigs[r.designation_id]||''}],createdAt:o.createdAt||(r.created_at||'').slice(0,10),fm:o.fm||''})});
  DATA.emps.forEach(o=>{const r=em.find(z=>z.id===LIVE.map.emps[o.id]);o.mgr=r&&r.manager_id&&LIVE.rev.emps[r.manager_id]?String(LIVE.rev.emps[r.manager_id]):'';o.fm=r&&r.functional_manager_id&&LIVE.rev.emps[r.functional_manager_id]?String(LIVE.rev.emps[r.functional_manager_id]):''});
  KINDS.forEach(k=>DATA[k].forEach(o=>LIVE.snap[k][o.id]=sig(k,o)));
  /* an item without a code (older data) gets one now, and is saved by the next sync */
  try{orgCodesFill()}catch(e){}
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
/* the career framework (level names, pass marks) has defaults; a new client must never start with it empty, or the dashboard fails */
let CF0=null;try{CF0=JSON.parse(JSON.stringify(CF))}catch(e){}
const CONFIG=['CF','ORGCODE','SHIFTS','HBANK','HCAL','ATPOL','LT','LRULE','PHEADS','STAT','PAYRUN','ADJHEADS','ADVPOL','LTYPES','LTC','LTI','LTM','LTR','LTSW','LPRE','LVR','CHK','WFD','TAR','CCT','RFR','SLA','CHKLINK','FBQ','ALTJT','ALTP','QB','STG','XTYPE','SLCAT','BIOSRC','BIODEV','XQT','ALTSET','BIOSET','CRULE','EMPCODE','ORGS','SERIES','SYSSERX','STKSET','TRULE','WAUTO','MINW','MINWSK','MINWZ','OFFPAY','ALWR','ATTWV','PVER','ROLES'];
/* SYSSER has functions inside, so only its plain values (prefix, digits, next number...) are kept */
window.SYSSERX={};const sysToX=()=>{try{SYSSER.forEach(s=>{const o={};Object.keys(s).forEach(k=>{if(typeof s[k]!=='function')o[k]=s[k]});SYSSERX[s.key]=o})}catch(e){}};const sysFromX=()=>{try{SYSSER.forEach(s=>{const o=SYSSERX[s.key];if(o)Object.keys(o).forEach(k=>{if(typeof s[k]!=='function')s[k]=o[k]})})}catch(e){}};sysToX();
const DATASTORES=['AR','REGS','IMPORTS','ASSIGN','RH','LEAVES','ADJ','ADV','FS','INCASG','ENC','ACORR','STATA','BANK','VARS','ATTP','ADVL','INCS','LADJ','STATV','MRATE','KFS','AUD','CT','SURV','POLLS','TASKS','WFI','DEC','MTG','CHAL','RFL','BIL','CLF','EL','SVL','EVP','CCO','STKA','SUPT','AIS','AREQ','KYC','FBT','FBF','CFB','CMP','PAY','PAYB','INCREG','OTL','SHORT','LOCR','INDP','ASG','TODO','DAILYT','WARNLOG','HOLD','HOLDREL','KBA','BIOP','BIOIMP','SLC','SLASG','SLP','SLT','SLCERT','SLLOG','CREQ','XADV','XREP','XPAY','XRES','XIT','CHE','AND','NTC','POLL','DOCS','LETTERS','LTR','RECOG','UREQ','WISH','XTRIP','RC','KRULES','SSTR','TGR','AST','AUDIT','TDSD','ATTARR','SALREV','IBL'];
try{Object.keys(SRC).filter(k=>Array.isArray(SRC[k])).forEach(k=>DATASTORES.push('SRC.'+k))}catch(e){}
const EMPSTORES=['LEAVES','AR','REGS','RH','ADV','MRATE','AUD','CT','KYC','SURV','TASKS','WFI','DEC','MTG','CHAL','RFL','BIL','CLF','EL','SVL','EVP','CCO','STKA','SUPT','AIS','AREQ','FBT','CFB','ASG','TODO','DAILYT','SLP','SLASG','SLLOG','SLT','SLCERT','CREQ','XADV','XREP','XRES','XTRIP','UREQ','WISH','CHE','POLL','RECOG','SRC.content','SRC.campaign','SRC.post','SRC.creview','SRC.ttest','SRC.audience','AUDIT','TDSD','IBL'];
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
    else{/* SLA: a value added by a newer version of the app stays when the saved list does not have it yet */
      const keep=n==='SLA'?{...v}:null;Object.keys(v).forEach(k=>delete v[k]);mine.forEach(r=>{v[r.key.slice(2)]=r.data});if(keep)Object.keys(keep).forEach(k=>{if(!(k in v))v[k]=keep[k]})}
    LIVE.stSnap[n]={};mine.forEach(r=>LIVE.stSnap[n][r.key]=JSON.stringify(r.data))}
  try{if(typeof syncHoli==='function')syncHoli()}catch(e){}
  try{if(CF0)Object.keys(CF0).forEach(k=>{if(CF[k]===undefined||CF[k]===null||(Array.isArray(CF0[k])&&(!Array.isArray(CF[k])||(k==='lv'&&!CF[k].length))))CF[k]=JSON.parse(JSON.stringify(CF0[k]))})}catch(e){}
  sysFromX();
  /* a month with no saved state is a draft: never "processed" by default */
  try{Object.keys(PMON).forEach(m=>{if(!PAYRUN[m])PAYRUN[m]='draft'})}catch(e){}
  try{pslRoles()}catch(e){}
  if(rows.some(r=>r.data&&hasFileRef(r.data))){try{await showFiles([...CONFIG,...DATASTORES].map(ref).filter(v=>v&&typeof v==='object'))}catch(e){console.warn('files',e)}}
  try{let base=1e12;AUDIT.forEach(a=>{if(a.id==null)a.id=base--});AUDIT.sort((a,b)=>b.id-a.id)}catch(e){}
  /* new records must not reuse an id that is already stored */
  /* every stored id counts (a task or request made after a reload used to get the id of an older one); only the audit trail has its own numbers */
  let mx=0;rows.forEach(r=>{if(r.store==='AUDIT')return;const id=r.data&&+r.data.id;if(id&&id<1e15&&id>mx)mx=id});
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
/* ---------- KPIs: one library kept by Mirror-HR, one pack per client ---------- */
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
  for(let i=KPI.length-1;i>=0;i--){const k=KPI[i];if(k._hidden){if(k.active){k.active=false;try{toast(L('This KPI is not in your pack. Ask Mirror-HR to add it.','यह KPI आपके पैक में नहीं है। Mirror-HR से जोड़ने को कहें।'))}catch(e){}}continue}
    if(!LIVE.pack[k.id]){KPI.splice(i,1);try{toast(L('New KPIs are added by Mirror-HR to your pack. Please send the request to Mirror-HR.','नई KPI Mirror-HR आपके पैक में जोड़ता है। अनुरोध Mirror-HR को भेजें।'))}catch(e){}continue}
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
  <div class="tools"><button class="btn btn-o btn-s" data-kpall="add">${L('Add all shown','दिख रही सब जोड़ें')}</button><button class="btn btn-o btn-s btn-d" data-kpall="del">${L('Remove all shown','दिख रही सब हटाएँ')}</button><span style="flex:1"></span>
   <select class="inp" id="kpCopy" style="max-width:240px"><option value="">${L('Copy the pack of another client…','दूसरे क्लाइंट का पैक कॉपी करें…')}</option>${LIVE.kp.clients.filter(c=>c.id!==KP.client).map(c=>`<option value="${c.id}">${esc(c.name)} (${esc(c.code)})</option>`).join('')}</select><button class="btn btn-o btn-s" data-kpcopy>${L('Copy','कॉपी')}</button></div>
  <div class="card tw"><table class="tbl"><thead><tr><th>${L('In pack','पैक में')}</th><th>KPI</th><th>${L('Name','नाम')}</th><th>${L('Method','तरीका')}</th><th>${L('Module','मॉड्यूल')}</th><th>${L('Client max','क्लाइंट अधिकतम')}</th></tr></thead><tbody>${rows.slice(0,400).map(l=>{const p=LIVE.kp.pack[l.id], ok=mods.includes(l.module)&&(l.status==='released'||(l.status==='testing'&&cl.status==='test'));
    return `<tr style="${ok?'':'opacity:.55'}"><td><input type="checkbox" data-kpk="${l.id}" ${p?'checked':''} ${ok||p?'':'disabled'}></td><td><b>${esc(l.id)}</b></td><td>${esc(l.data.name||'')}<small style="display:block;color:var(--muted)">${esc(l.data.cat||'')}</small></td><td>${esc(l.data.method||'')}</td><td>${ok?esc(l.module):`<span class="pill p-bad">${esc(l.module)}: ${L('module not given','मॉड्यूल नहीं दिया')}</span>`}</td><td>${p?(p.max!=null?p.max:l.data.max):'—'}</td></tr>`}).join('')}</tbody></table></div>`}
try{PAGEFN.kpipack=()=>kpiPackPage()}catch(e){}
try{const _ph=placeholder;placeholder=function(P){return P==='kpipack'?kpiPackPage():_ph.apply(this,arguments)}}catch(e){}
const _bx=bindExtra;
bindExtra=function(){_bx.apply(this,arguments);if(state.page!=='kpipack')return;const g=id=>document.getElementById(id);
  if(g('kpC'))g('kpC').onchange=async e=>{KP.client=e.target.value;await kpLoad();render()};
  if(g('kpQ'))g('kpQ').oninput=e=>{KP.q=e.target.value;clearTimeout(KP.t);KP.t=setTimeout(()=>{render();const x=g('kpQ');if(x){x.focus();x.setSelectionRange(x.value.length,x.value.length)}},300)};
  if(g('kpM'))g('kpM').onchange=e=>{KP.mod=e.target.value;render()};if(g('kpO'))g('kpO').onchange=e=>{KP.only=e.target.value;render()};
  /* the same rule as the single tick: the module must be given to the client, and the KPI must be released (testing only for a test client) */
  const kpOk=(l,cl)=>(cl.modules||[]).includes(l.module)&&(l.status==='released'||(l.status==='testing'&&cl.status==='test'));
  const kpShown=()=>{const qq=KP.q.toLowerCase();return LIVE.kp.lib.filter(l=>(!KP.mod||l.module===KP.mod)&&(!qq||(l.id+' '+(l.data.name||'')+' '+(l.data.cat||'')).toLowerCase().includes(qq))&&(!KP.only||(KP.only==='in'?LIVE.kp.pack[l.id]:!LIVE.kp.pack[l.id])))};
  const kpDone=async(msg)=>{await kpLoad();toast(msg);render()};
  document.querySelectorAll('[data-kpall]').forEach(b=>b.onclick=async()=>{const cl=LIVE.kp.clients.find(c=>c.id===KP.client)||{}, add=b.dataset.kpall==='add', rows=kpShown();
    if(add){const todo=rows.filter(l=>kpOk(l,cl)&&!LIVE.kp.pack[l.id]);if(!todo.length)return toast(L('Nothing to add','जोड़ने को कुछ नहीं'));
      if(!confirm(`${L('Add','जोड़ें')} ${todo.length} KPI → ${cl.name}?`))return;b.disabled=true;
      const r=await sb.from('client_kpi_pack').insert(todo.map(l=>({client_id:KP.client,kpi_id:l.id,max:+(l.data.max)||10})));
      if(r.error){b.disabled=false;return toast(r.error.message)}await kpDone(`${todo.length} ${L('added','जुड़ीं')}`)}
    else{const todo=rows.filter(l=>LIVE.kp.pack[l.id]);if(!todo.length)return toast(L('Nothing to remove','हटाने को कुछ नहीं'));
      if(!confirm(`${L('Remove','हटाएँ')} ${todo.length} KPI ← ${cl.name}?`))return;b.disabled=true;
      const r=await sb.from('client_kpi_pack').delete().eq('client_id',KP.client).in('kpi_id',todo.map(l=>l.id));
      if(r.error){b.disabled=false;return toast(r.error.message)}await kpDone(`${todo.length} ${L('removed','हटीं')}`)}});
  document.querySelectorAll('[data-kpcopy]').forEach(b=>b.onclick=async()=>{const src=g('kpCopy').value, cl=LIVE.kp.clients.find(c=>c.id===KP.client)||{}, sc=LIVE.kp.clients.find(c=>c.id===src);if(!src)return toast(L('Choose the client to copy from','जिससे कॉपी करनी है वह क्लाइंट चुनें'));
    const r0=await sb.from('client_kpi_pack').select('*').eq('client_id',src);if(r0.error)return toast(r0.error.message);
    const have=new Set(Object.keys(LIVE.kp.pack)), lib=Object.fromEntries(LIVE.kp.lib.map(l=>[l.id,l]));
    const todo=(r0.data||[]).filter(p=>!have.has(p.kpi_id)&&lib[p.kpi_id]&&kpOk(lib[p.kpi_id],cl)), skipped=(r0.data||[]).filter(p=>!have.has(p.kpi_id)).length-todo.length;
    if(!todo.length)return toast(L('Nothing to copy','कॉपी करने को कुछ नहीं')+(skipped?` (${skipped} ${L('not allowed for this client','इस क्लाइंट के लिए नहीं')})`:''));
    if(!confirm(`${L('Copy','कॉपी')} ${todo.length} KPI: ${sc?sc.name:''} → ${cl.name}${skipped?`\n(${skipped} ${L('skipped: module not given','छोड़ी: मॉड्यूल नहीं दिया')})`:''}`))return;b.disabled=true;
    const r=await sb.from('client_kpi_pack').insert(todo.map(p=>({client_id:KP.client,kpi_id:p.kpi_id,max:p.max})));
    if(r.error){b.disabled=false;return toast(r.error.message)}await kpDone(`${todo.length} ${L('copied','कॉपी हुईं')}${skipped?`, ${skipped} ${L('skipped','छोड़ी')}`:''}`)});
  document.querySelectorAll('[data-kpk]').forEach(c=>c.onchange=async()=>{const id=c.dataset.kpk;c.disabled=true;
    const r=c.checked?await sb.from('client_kpi_pack').insert({client_id:KP.client,kpi_id:id,max:+(LIVE.kp.lib.find(l=>l.id===id).data.max)||10}):await sb.from('client_kpi_pack').delete().eq('client_id',KP.client).eq('kpi_id',id);
    if(r.error){toast(r.error.message);c.checked=!c.checked}else{if(c.checked)LIVE.kp.pack[id]={kpi_id:id};else delete LIVE.kp.pack[id];toast(L('Saved','सेव हुआ'))}c.disabled=false;render()})};
/* ---------- the client's modules switch the prototype's module licence ---------- */
function applyModules(){try{const mods=(LIVE.client&&LIVE.client.modules)||[];if(typeof LIC==='object'&&LIC&&LIC.mods){Object.keys(LIC.mods).forEach(k=>LIC.mods[k]=mods.includes(k))}
  if(typeof LIC==='object'&&LIC&&LIVE.client){LIC.name=LIVE.client.name}}catch(e){}}
/* ---------- platform: clients (create a client, its modules and status) ---------- */
const MODLIST=['timeoffice','payroll','pms','recruit','workforce','decision','training','crm','stock','marketing','library','support','cockpit','expense','requests','assets','analytics','engage','policy'];
try{PAGES.push('lvclients');Object.keys(RIGHTS).forEach(r=>RIGHTS[r].lvclients=r==='platform'?['V','E']:[]);NAV.push({id:'lvclients',ic:'M3 21h18M5 21V7l7-4 7 4v14M9 9h1M14 9h1M9 13h1M14 13h1',roles:[],day:'—',built:true});
  Object.assign(T.en,{lvclients:'Clients (live)'});Object.assign(T.hi,{lvclients:'क्लाइंट (लाइव)'})}catch(e){}
LIVE.cl={rows:[],loaded:false,counts:{}};
async function clLoad(){const [c,e]=await Promise.all([q('clients'),q('employees','client_id,active')]);LIVE.cl.rows=c.sort((a,b)=>a.created_at<b.created_at?-1:1);LIVE.cl.counts={};e.forEach(x=>{if(x.active)LIVE.cl.counts[x.client_id]=(LIVE.cl.counts[x.client_id]||0)+1})}
function clientsPage(){
  if(!LIVE.cl.loaded){LIVE.cl.loaded=true;clLoad().then(()=>render());return `<div class="page-h"><div><h1>${L('Clients (live)','क्लाइंट (लाइव)')}</h1></div></div><p>…</p>`}
  return `<div class="page-h"><div><h1>${L('Clients (live)','क्लाइंट (लाइव)')}</h1><p>${L('Every company that uses Mirror-HR. A new client starts clean: its own data only, no sample data.','Mirror-HR इस्तेमाल करने वाली हर कंपनी। नया क्लाइंट साफ़ शुरू होता है: सिर्फ़ उसका डेटा, नमूना डेटा नहीं।')}</p></div><button class="btn btn-p" id="clNew">+ ${L('New client','नया क्लाइंट')}</button></div>
  <div class="card tw"><table class="tbl"><thead><tr><th>${L('Company code','कंपनी कोड')}</th><th>${L('Company','कंपनी')}</th><th>${L('Status','स्थिति')}</th><th>${L('Employees','कर्मचारी')}</th><th>${L('Modules','मॉड्यूल')}</th><th></th></tr></thead><tbody>${LIVE.cl.rows.map(c=>`<tr><td><b>${esc(c.code)}</b></td><td>${esc(c.name)}</td><td><span class="pill ${c.status==='active'?'p-ok':c.status==='test'?'p-warn':'p-bad'}">${esc(c.status)}</span></td><td>${LIVE.cl.counts[c.id]||0} / ${c.employee_limit}</td><td style="white-space:normal;max-width:360px;font-size:12px">${esc((c.modules||[]).join(', '))}</td><td style="text-align:right"><button class="btn btn-o btn-s" data-cllogo="${c.id}">${c.logo?'✓ ':''}${L('Logo','लोगो')}</button> <button class="btn btn-o btn-s" data-clbk="${c.id}">${L('Backup','बैकअप')}</button> <button class="btn btn-o btn-s" data-cled="${c.id}">${L('Edit','बदलें')}</button></td></tr>`).join('')}</tbody></table></div>`}
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
bindExtra=function(){_bx2.apply(this,arguments);if(state.page!=='lvclients')return;const b=document.getElementById('clNew');if(b)b.onclick=clNewModal;document.querySelectorAll('[data-cled]').forEach(x=>x.onclick=()=>clEditModal(x.dataset.cled));document.querySelectorAll('[data-cllogo]').forEach(x=>x.onclick=()=>clLogoModal(x.dataset.cllogo));document.querySelectorAll('[data-clbk]').forEach(x=>x.onclick=()=>clBackup(x.dataset.clbk,x))};
/* the logo of a client company: uploaded by the Mirror-HR team, shown in the top bar to every user of that client */
function logoShrink(file){return new Promise((ok,no)=>{if(!/^image\/(png|jpeg)$/.test(file.type))return no(new Error(L('Choose a PNG or JPG picture','PNG या JPG तस्वीर चुनें')));const fr=new FileReader();fr.onerror=()=>no(new Error('read'));fr.onload=()=>{const im=new Image();im.onerror=()=>no(new Error(L('The picture could not be read','तस्वीर पढ़ी नहीं जा सकी')));im.onload=()=>{const k=Math.min(1,400/im.width,160/im.height),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));c.getContext('2d').drawImage(im,0,0,c.width,c.height);const u=c.toDataURL('image/png');u.length>280000?no(new Error(L('The picture is too big','तस्वीर बहुत बड़ी है'))):ok(u)};im.src=fr.result};fr.readAsDataURL(file)})}
function clLogoModal(id){const c=LIVE.cl.rows.find(x=>x.id===id);if(!c)return;let pick=null;
  const bg=openModal(`<h3 style="margin-top:0">${L('Logo of','लोगो:')} ${esc(c.name)}</h3><p style="font-size:12px;color:var(--muted);margin:-4px 0 8px">${L('Take the logo file from the client and upload it here. Every user of this client will see it in the top bar. Our own name stays where it is.','क्लाइंट से लोगो की फ़ाइल लें और यहाँ अपलोड करें। इस क्लाइंट के हर यूज़र को यह ऊपर की पट्टी में दिखेगा। हमारा अपना नाम अपनी जगह रहेगा।')}</p>
   <div style="background:var(--card,#fff);border:1px dashed var(--line,#ccc);border-radius:8px;padding:12px;min-height:70px;display:flex;align-items:center;justify-content:center" id="lgPrev">${c.logo?`<img src="${c.logo}" style="max-height:60px;max-width:100%">`:`<span style="color:var(--muted)">${L('No logo yet','अभी लोगो नहीं है')}</span>`}</div>
   <input type="file" accept="image/png,image/jpeg" id="lgFile" style="margin:10px 0"><div id="lgE" style="color:var(--bad);font-size:12px"></div>
   <div class="acts"><button type="button" class="btn btn-o" data-close>${t('cancel')}</button>${c.logo?`<button type="button" class="btn btn-d" id="lgDel">${L('Remove logo','लोगो हटाएँ')}</button>`:''}<button class="btn btn-p">${t('save')}</button></div>`,
  async(f,close)=>{const er=m=>{bg.querySelector('#lgE').textContent=m};if(!pick)return er(L('Choose a picture first','पहले तस्वीर चुनें'));const r=await sb.rpc('platform_set_client_logo',{p_client:id,p_logo:pick});if(r.error)return er(r.error.message);close();toast(t('saved'));await clLoad();render()});
  bg.querySelector('#lgFile').onchange=async e=>{const fl=e.target.files[0];if(!fl)return;try{pick=await logoShrink(fl);bg.querySelector('#lgPrev').innerHTML=`<img src="${pick}" style="max-height:60px;max-width:100%">`;bg.querySelector('#lgE').textContent=''}catch(x){pick=null;bg.querySelector('#lgE').textContent=x.message}};
  const dl=bg.querySelector('#lgDel');if(dl)dl.onclick=async()=>{const r=await sb.rpc('platform_set_client_logo',{p_client:id,p_logo:null});if(r.error)return bg.querySelector('#lgE').textContent=r.error.message;bg.remove();toast(t('saved'));await clLoad();render()}}
window.clientLogoImg=function(h){try{const s=state.role!=='platform'&&LIVE.client&&LIVE.client.logo;return s?'<img src="'+s+'" alt="" style="max-height:'+(h||44)+'px;max-width:180px;margin-bottom:6px">':''}catch(e){return ''}};
function clientLogoBar(){try{const h=document.querySelector('header');if(!h)return;let im=document.getElementById('clientLogo');const src=state.role!=='platform'&&LIVE.client&&LIVE.client.logo;if(!src){if(im)im.remove();return}
  if(!im){im=document.createElement('img');im.id='clientLogo';im.alt=(LIVE.client.name||'')+' logo';im.style.cssText='height:38px;max-width:200px;object-fit:contain;margin-left:8px;background:#fff;border-radius:6px;padding:3px 6px';const sp=h.querySelector('.sp');h.insertBefore(im,sp||null)}if(im.src!==src)im.src=src}catch(e){}}
{const _rL=render;render=function(){const r=_rL.apply(this,arguments);clientLogoBar();return r}}const BK_TABLES=['branches','sub_divisions','divisions','departments','job_functions','designations','employees','employee_private','employee_statutory','profiles','attendance','app_store','client_kpi_pack','statutory_settings','attendance_policy','payroll_policy','code_series','role_rights','shifts','leave_types','holidays','leave_requests','payroll_runs','payslips','pay_heads','pay_adjustments','salary_advances','final_settlements','audit_log'];
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
  return `<div class="page-h"><div><h1>${L('KPI library','KPI लाइब्रेरी')}</h1><p>${L('Only Mirror-HR adds or changes KPIs. A new KPI starts as Draft, goes to Testing (seen only by clients whose status is test), then Released (can be added to any client pack).','सिर्फ़ Mirror-HR KPI जोड़ता या बदलता है। नई KPI ड्राफ़्ट से शुरू होती है, फिर टेस्टिंग (सिर्फ़ test स्थिति वाले क्लाइंट को दिखती है), फिर रिलीज़ (किसी भी क्लाइंट पैक में जुड़ सकती है)।')}</p></div><button class="btn btn-p" id="klNew">+ ${L('New KPI','नई KPI')}</button></div>
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
  /* a save that got no answer from the server for 30 seconds is dropped, so that it can never block every later save */
  if(LIVE.busy&&Date.now()-(LIVE.busyAt||0)>30000){LIVE.busy=false;LIVE.err=L('The last save got no answer from the server and is tried again.','पिछले सेव का सर्वर से जवाब नहीं आया, फिर कोशिश हो रही है।')}
  if(LIVE.busy){LIVE.queued=true;return}
  LIVE.busy=true;LIVE.busyAt=Date.now();const run=LIVE.runId=(LIVE.runId||0)+1;let n=0;
  try{
    /* the organization and the people are saved FIRST, so nothing that fails later (attendance, stores, KPIs) can stop them; a failure names the table */
    if(isHRrole())for(const k of KINDS){const t=TBL[k];
      for(const o of DATA[k]){let s;try{s=sig(k,o)}catch(x){x.message=t+': '+x.message;throw x}if(LIVE.snap[k][o.id]===s)continue;
        const row=toRow(k,o);let uuid=LIVE.map[k][o.id];
        if(uuid){const r=await sb.from(t).update(row).eq('id',uuid);if(r.error){r.error.message=t+': '+r.error.message;throw r.error}}
        else{const r=await sb.from(t).insert(row).select('id').single();if(r.error){r.error.message=t+': '+r.error.message;throw r.error}uuid=r.data.id;LIVE.map[k][o.id]=uuid;LIVE.rev[k][uuid]=o.id;if(k==='emps')(LIVE.newEmp=LIVE.newEmp||[]).push(o.id)}
        if(k==='emps'){const r=await sb.from('employee_private').upsert({employee_id:uuid,...toPriv(o)});if(r.error)throw r.error}
        LIVE.snap[k][o.id]=sig(k,o);n++}}
    sysToX();try{snapKpis()}catch(x){}await syncAttendance();await syncStores();await syncKpis();
    /* a manager set before the manager was saved: fill it now */
    if(isHRrole())for(const o of DATA.emps){if((o.mgr&&LIVE.map.emps[+o.mgr])||(o.fm&&LIVE.map.emps[+o.fm])){const s=sig('emps',o);if(LIVE.snap.emps[o.id]!==s){const u=await sb.from('employees').update({manager_id:o.mgr?(LIVE.map.emps[+o.mgr]||null):null,functional_manager_id:o.fm?(LIVE.map.emps[+o.fm]||null):null}).eq('id',LIVE.map.emps[o.id]);if(u.error)throw u.error;LIVE.snap.emps[o.id]=s}}}
    if(LIVE.newEmp&&LIVE.newEmp.length){const ids=LIVE.newEmp;LIVE.newEmp=[];await ensureLogins(ids)}
    LIVE.err='';
  }catch(e){LIVE.err=(e&&e.message)||String(e);console.error('LIVE sync',e);try{toast('Not saved to the database: '+LIVE.err)}catch(x){}}
  finally{if(run===LIVE.runId){LIVE.busy=false;if(LIVE.queued){LIVE.queued=false;setTimeout(syncNow,50)}}}
  if(n){try{await sb.from('audit_log').insert({client_id:LIVE.profile.client_id,user_id:LIVE.profile.user_id,module:'Sync',action:'Saved',subject:n+' record(s)',detail:''})}catch(e){}}
}
let syncT=null;const schedule=()=>{clearTimeout(syncT);syncT=setTimeout(syncNow,600)};
/* watchdog: a save that hangs is shown at the top of the page and tried again */
setInterval(()=>{try{if(LIVE.on&&!LIVE.platform&&LIVE.busy&&Date.now()-(LIVE.busyAt||0)>30000){LIVE.err=L('Saving is slow: no answer from the server for 30 seconds. Do not close the page.','सेव धीमा है: 30 सेकंड से सर्वर का जवाब नहीं। पेज बंद न करें।');note();syncNow()}}catch(e){}},10000);

/* ---------- public doors: career portal, candidate joining link, employee referral (server function "portal") ---------- */
const PORTAL='https://okhikmjugdytahgnddjm.supabase.co/functions/v1/portal';
async function portalCall(o,files,auth){const fd=new FormData();Object.keys(o).forEach(k=>{if(o[k]!=null)fd.append(k,o[k])});Object.keys(files||{}).forEach(k=>{if(files[k])fd.append(k,files[k])});
  const h={};if(auth){const s=await sb.auth.getSession();if(s.data.session)h.Authorization='Bearer '+s.data.session.access_token}
  let r;try{r=await fetch(PORTAL,{method:'POST',body:fd,headers:h})}catch(e){throw new Error(L('No internet. Please try again.','इंटरनेट नहीं है। फिर कोशिश करें।'))}
  let j={};try{j=await r.json()}catch(e){}if(!r.ok)throw new Error(j.message||L('Something went wrong. Please try again.','कुछ गड़बड़ हुई। फिर कोशिश करें।'));return j}
const sha=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
const pubTop=(org,right)=>`<div style="display:flex;align-items:center;gap:10px;margin-bottom:18px"><h1 style="margin:0;flex:1;font-size:22px">${esc(org||'Mirror-HR')}</h1>${right||''}<a href="#" id="pubLang" style="font-size:13px">${lang==='hi'?'EN':'हिं'}</a></div>`;
const pubLang=(el,again)=>{const a=el.querySelector('#pubLang');if(a)a.onclick=e=>{e.preventDefault();lang=lang==='hi'?'en':'hi';again()}};
const pubShell=id=>{let el=document.getElementById(id);if(!el){el=document.createElement('div');el.id=id;el.style.cssText='position:fixed;inset:0;z-index:10000;overflow:auto;background:var(--bg,#f4f7f6)';document.body.appendChild(el)}return el};
const pubMsg=(el,org,txt)=>{el.innerHTML=`<div style="max-width:620px;margin:0 auto;padding:24px 16px">${pubTop(org)}<div class="card"><p>${txt}</p></div></div>`;pubLang(el,()=>{})};
/* the candidate's joining form: #join=<token> */
function joinBoot(){const m=location.hash.match(/^#join=([a-f0-9]{64})/), el0=document.getElementById('joinPage');if(!m){if(el0)el0.remove();return}renderJoin(pubShell('joinPage'),m[1])}
async function renderJoin(el,tok){el.innerHTML=`<div style="max-width:620px;margin:0 auto;padding:40px 16px;text-align:center;color:var(--muted)">…</div>`;
  let d;try{d=await portalCall({action:'link',token:tok})}catch(e){return pubMsg(el,'Mirror-HR',esc(e.message))}
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
  if(!code)return pubMsg(el,'Mirror-HR',L('This career link is not complete. Please ask the company for the right link.','यह करियर लिंक अधूरा है। कंपनी से सही लिंक माँगें।'));
  el.innerHTML=`<div style="max-width:620px;margin:0 auto;padding:40px 16px;text-align:center;color:var(--muted)">…</div>`;
  let d;try{d=await portalCall({action:'vacancies',code})}catch(e){return pubMsg(el,'Mirror-HR',esc(e.message))}
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
const LIVE_PAGES=['dashboard','employees','profile','setup','org','workforce','cockpit','attendance','attreq','leave','timeoffice','payroll','myreq','team','pms','decision','assets','myasset','support','inbox','recruit','expense','exits','training','marketing','crm','library','engage','bizdata','stock','import','analytics','reports','settings','policies'];
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
    lab.parentNode.insertBefore(wrap,lab);try{document.getElementById('lgC').value=localStorage.getItem('lv_company')||''}catch(e){}
    {const ci=document.getElementById('lgC'),lg=document.createElement('div');lg.id='lgLogo';lg.style.cssText='text-align:center;margin:0 0 10px';wrap.parentNode.insertBefore(lg,wrap);let tm;const show=async()=>{const code=(ci.value||'').trim();if(code.length<2){lg.innerHTML='';return}try{const r=await sb.rpc('client_logo_by_code',{p_code:code});lg.innerHTML=r.data?'<img src="'+r.data+'" alt="" style="max-height:56px;max-width:220px">':''}catch(e){}};ci.addEventListener('input',()=>{clearTimeout(tm);tm=setTimeout(show,400)});show()}}
  const s=box.querySelector('.sub');if(s)s.textContent=L('Company code, employee number and password. Platform admin: leave the company code empty and use the email.','कंपनी कोड, कर्मचारी नंबर और पासवर्ड। प्लेटफ़ॉर्म एडमिन: कंपनी कोड ख़ाली छोड़ें और ईमेल डालें।')};
async function startSession(user){
  const [p,pa,sa]=await Promise.all([sb.from('profiles').select('*, client:client_id(code,name,status,modules,logo)').eq('user_id',user.id).maybeSingle(),sb.from('platform_admins').select('user_id').eq('user_id',user.id).maybeSingle(),sb.from('platform_sales').select('user_id,name,active').eq('user_id',user.id).maybeSingle()]);
  try{if(!window.RIGHTS_PLAT0){window.RIGHTS_PLAT0=JSON.parse(JSON.stringify(RIGHTS.platform));delete window.RIGHTS_PLAT0.licensing}Object.keys(RIGHTS.platform).forEach(k=>delete RIGHTS.platform[k]);Object.assign(RIGHTS.platform,JSON.parse(JSON.stringify(window.RIGHTS_PLAT0)));LIVE.salesOnly=false;ENQ.loaded=false}catch(e){}
  LIVE.platform=!!pa.data;LIVE.profile=p.data||null;LIVE.client=p.data?p.data.client:null;
  if(!LIVE.platform&&!p.data&&sa&&sa.data&&sa.data.active){LIVE.platform=true;LIVE.salesOnly=true;LIVE.salesName=sa.data.name;Object.keys(RIGHTS.platform).forEach(k=>RIGHTS.platform[k]=[]);RIGHTS.platform.enquiries=['V','A','E'];try{USERS.platform.name=sa.data.name}catch(e){}}
  if(LIVE.platform&&!LIVE.profile){LIVE.on=true;enterApp(null,'platform',false);return}
  if(!LIVE.profile||!LIVE.profile.active)throw new Error(L('This login is not active','यह लॉगिन चालू नहीं है'));
  await loadLive();applyModules();LIVE.on=true;
  const e=DATA.emps.find(x=>LIVE.map.emps[x.id]===LIVE.profile.employee_id);if(!e)throw new Error(L('No employee record is linked to this login','इस लॉगिन से कोई कर्मचारी रिकॉर्ड नहीं जुड़ा'));
  try{if(typeof CO==='object'&&LIVE.client)CO.name=LIVE.client.name}catch(x){}
  if(LIVE.profile.must_change_password){LV.view='change';LV.pend={first:true,emp:e,role:LIVE.profile.role,live:true};drawLogin();return}
  /* a screen error while the first page is drawn must never close the session: it used to sign the person out while the page stayed on screen, so nothing was saved */
  try{enterApp(e,LIVE.profile.role,false)}catch(x){console.error('enterApp',x);LIVE.err=L('A part of this screen could not be drawn: ','इस स्क्रीन का एक हिस्सा नहीं बन सका: ')+(x&&x.message||x)}
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
doLogout=async function(){
  /* save what is still waiting before the session ends, and sign out of this device only (a global sign-out also closed the same login on other devices) */
  try{clearTimeout(syncT);for(let i=0;i<20&&LIVE.busy;i++)await new Promise(r=>setTimeout(r,250));await syncNow()}catch(e){}
  try{await sb.auth.signOut({scope:'local'})}catch(e){}LIVE.on=false;LIVE.profile=null;location.reload()};
/* leaving the page with changes that are not saved yet: ask first */
window.addEventListener('beforeunload',e=>{try{if(!LIVE.on||LIVE.platform||!isHRrole())return;if(KINDS.some(k=>DATA[k].some(o=>LIVE.snap[k][o.id]!==sig(k,o)))){e.preventDefault();e.returnValue=''}}catch(x){}});
const lo=document.getElementById('logout');if(lo)lo.onclick=doLogout;
/* the prototype's forgot-password and demo buttons are not used in the live app */
const lf=document.getElementById('loginForm');if(lf)lf.addEventListener('click',e=>{const b=e.target.closest('[data-lg]');if(b&&(b.dataset.lg==='forgot'||b.dataset.lg.startsWith('demo:')||b.dataset.lg==='mailbox')){e.stopImmediatePropagation();e.preventDefault();toast(L('Ask your HR to reset the password.','पासवर्ड रीसेट के लिए अपने HR से कहें।'))}},true);
drawLogin();
/* an open session from before */
(async()=>{try{const res=await Promise.race([sb.auth.getSession(),new Promise((_,j)=>setTimeout(()=>j(new Error('timeout')),6000))]);const s=res&&res.data&&res.data.session;if(s)await startSession(s.user)}
  catch(e){if(e&&e.message==='timeout')return;try{Object.keys(localStorage).filter(k=>k.startsWith('sb-')).forEach(k=>localStorage.removeItem(k))}catch(x){}}})();
/* ---------- Enquiries: a prospect fills the public form (#enquiry); the Mirror-HR team (platform admin, and Sales logins) works on it here ---------- */
const ENQ_ST={new:['New','नया','p-teal'],discussion:['In discussion','बातचीत में','p-warn'],hold:['On hold','रोका हुआ','p-bad'],lost:['Lost','खोया','p-bad'],quoted:['Quotation sent','कोटेशन भेजी','p-teal'],accepted:['Accepted','स्वीकार','p-ok'],signed:['Signed','साइन हुआ','p-ok'],live:['Live','लाइव','p-ok']};
const ENQ_TYPES=['Proprietorship','Partnership','LLP','Private Limited','Public Limited','Trust / Society','Other'];
const enqRef=r=>'ENQ-'+String(r.no).padStart(4,'0');
const enqSt=s=>{const x=ENQ_ST[s]||[s,s,'p-teal'];return `<span class="pill ${x[2]}">${L(x[0],x[1])}</span>`};
const ENQ={f:'all',rows:[],sales:[],q:[],steps:[],co:{},tab:'enq',loaded:false,me:null};window.ENQ=ENQ;
async function enqLoad(){const [e,s,u,qq,cc,st]=await Promise.all([sb.from('enquiries').select('*').order('no',{ascending:false}).limit(500),LIVE.salesOnly?{data:[]}:sb.from('platform_sales').select('*').order('created_at'),sb.auth.getUser(),sb.from('quotations').select('*').order('created_at',{ascending:false}).limit(1000),sb.from('platform_settings').select('value').eq('key','company').maybeSingle(),sb.from('enquiry_steps').select('*')]);
  ENQ.rows=e.data||[];ENQ.sales=s.data||[];ENQ.q=qq.data||[];ENQ.co=(cc.data&&cc.data.value)||{};ENQ.steps=st.data||[];const us=u&&u.data&&u.data.user;ENQ.me={id:us?us.id:null,name:LIVE.salesOnly?LIVE.salesName:(us&&us.email)||'Mirror-HR team'};ENQ.loaded=true}
try{
  PAGES.push('enquiries');Object.keys(RIGHTS).forEach(r=>RIGHTS[r].enquiries=r==='platform'?['V','A','E']:[]);
  const at=NAV.findIndex(n=>n.id==='lvclients');NAV.splice(at<0?NAV.length:at,0,{id:'enquiries',ic:'M3 7l9 6 9-6M3 7v10h18V7M3 7l9-4 9 4',roles:[],day:'—',built:true});
  Object.assign(T.en,{enquiries:'Enquiries'});Object.assign(T.hi,{enquiries:'इन्क्वायरी'});
}catch(e){}
const enqLink=()=>location.origin+location.pathname+'#enquiry';
/* the Mirror-HR team adds an enquiry by hand (a client who came by phone or in a meeting): same checks as the public form (submit_enquiry) */
function enqAddModal(){const mods=(typeof MODS!=='undefined'?MODS:[]), sts=INDIA_STATES;
  const inp=(n,l,o={})=>`<div><label>${l}${o.req?' *':''}</label><input class="inp" name="${n}" ${o.max?`maxlength="${o.max}"`:''} ${o.type?`type="${o.type}"`:''} ${o.ph?`placeholder="${o.ph}"`:''} ${o.mode?`inputmode="${o.mode}"`:''} ${o.up?'style="text-transform:uppercase"':''}></div>`;
  const bg0=openModal(`<h3 style="margin-top:0">${L('Add client enquiry','क्लाइंट इन्क्वायरी जोड़ें')}</h3><p style="font-size:12px;color:var(--muted);margin:-4px 0 8px">${L('For a client who came by phone or in a meeting. It goes into the same list as the link enquiries.','जो क्लाइंट फ़ोन या मीटिंग से आया। यह लिंक वाली इन्क्वायरी की ही सूची में जाएगी।')}</p>
   <div class="fgrid">${inp('legal',L('Legal name (as per GST)','कानूनी नाम (GST के अनुसार)'),{req:1,max:150})}${inp('trade',L('Trade name (if different)','ट्रेड नाम (अलग हो तो)'),{max:150})}<div><label>${L('Type of company','कंपनी का प्रकार')}</label><select class="inp" name="type">${ENQ_TYPES.map(x=>`<option>${x}</option>`).join('')}</select></div>${inp('gstin','GSTIN',{req:1,max:15,up:1,ph:'27ABCDE1234F1Z5'})}${inp('pan','PAN',{req:1,max:10,up:1,ph:'ABCDE1234F'})}${inp('cin','CIN',{max:21,up:1})}</div>
   <label>${L('Registered address','पंजीकृत पता')} *</label><textarea class="inp" name="address" rows="2"></textarea><div class="fgrid"><div><label>${L('State','राज्य')}</label><select class="inp" name="state">${sts.map(s=>`<option>${s}</option>`).join('')}</select></div>${inp('pin','PIN',{max:6,mode:'numeric'})}</div>
   <div class="fgrid">${inp('person',L('Authorised person (who signs)','अधिकृत व्यक्ति (जो हस्ताक्षर करेगा)'),{req:1,max:80})}${inp('desig',L('Designation','पद'),{max:60})}${inp('mobile',L('Mobile','मोबाइल'),{req:1,max:10,mode:'numeric'})}${inp('email','Email',{req:1,max:120,type:'email'})}${inp('employees',L('Number of employees','कर्मचारियों की संख्या'),{req:1,type:'number'})}${inp('branches',L('Number of branches','शाखाओं की संख्या'),{type:'number'})}</div>
   <label style="display:flex;gap:10px;align-items:center">${L('Modules wanted','चाहे गए मॉड्यूल')} <span style="font-weight:400;display:flex;gap:6px;align-items:center;margin:0"><input type="checkbox" data-modall> ${L('Select all','सभी चुनें')}</span></label><div style="display:flex;flex-wrap:wrap;gap:6px 14px">${mods.map(m=>`<label style="margin:0;font-weight:400;display:flex;gap:6px"><input type="checkbox" name="mod" value="${m.id}"> ${L(...m.name)}</label>`).join('')}</div>
   <label>${L('Note','टिप्पणी')}</label><textarea class="inp" name="note" rows="2" maxlength="1000"></textarea><div id="ae" style="color:var(--bad);font-size:12px;margin-top:6px"></div><div class="acts"><button type="button" class="btn btn-o" data-close>${t('cancel')}</button><button class="btn btn-p">${L('Save enquiry','इन्क्वायरी सेव करें')}</button></div>`,
  async(f,close,bg)=>{const fd=new FormData(f), v=Object.fromEntries(fd), s=x=>(x||'').trim(), er=m=>{(bg||document).querySelector('#ae').textContent=m};
   const p={legal:s(v.legal),trade:s(v.trade),type:v.type,gstin:s(v.gstin).toUpperCase(),pan:s(v.pan).toUpperCase(),cin:s(v.cin).toUpperCase(),address:s(v.address),state:v.state,pin:s(v.pin),person:s(v.person),desig:s(v.desig),mobile:s(v.mobile),email:s(v.email),bill:{name:'',mobile:'',email:''},support:{name:'',mobile:'',email:''},employees:+v.employees,branches:+v.branches||0,start:'',mods:fd.getAll('mod'),note:s(v.note),by_staff:true};
   const x=await sb.rpc('submit_enquiry',{p,hp:''});if(x.error)return er(x.error.message);close();toast(L('Enquiry saved: ','इन्क्वायरी सेव हुई: ')+x.data);await enqLoad();render()});
  const m=bg0&&bg0.querySelector('.modal');if(m)m.style.maxWidth='720px';
  const all=bg0&&bg0.querySelector('[data-modall]');if(all){const boxes=()=>[...bg0.querySelectorAll('input[name=mod]')];all.onchange=()=>boxes().forEach(b=>b.checked=all.checked);bg0.addEventListener('change',e=>{if(e.target&&e.target.name==='mod')all.checked=boxes().every(b=>b.checked)})}}
function enqListPage(){
  if(!ENQ.loaded){if(!ENQ.busy){ENQ.busy=true;enqLoad().then(()=>{ENQ.busy=false;render()}).catch(e=>{ENQ.busy=false;ENQ.loaded=true;ENQ.err=e.message;render()})}return `<div class="page-h"><div><h1>${L('Enquiries','इन्क्वायरी')}</h1></div></div><p>…</p>`}
  const cnt=k=>ENQ.rows.filter(r=>k==='all'||r.status===k).length, rows=ENQ.rows.filter(r=>ENQ.f==='all'||r.status===ENQ.f);
  const chips=['all','new','discussion','hold','lost'].map(k=>`<button class="btn ${ENQ.f===k?'btn-p':'btn-o'} btn-s" data-enqf="${k}">${k==='all'?L('All','सभी'):L(ENQ_ST[k][0],ENQ_ST[k][1])} (${cnt(k)})</button>`).join(' ');
  return `<div class="page-h"><div><h1>${L('Enquiries','इन्क्वायरी')}</h1><p>${L('Companies that filled the enquiry link. They see no price. You check the details, talk to them and make the quotation.','जिन कंपनियों ने इन्क्वायरी लिंक भरा। उन्हें कोई दाम नहीं दिखता। आप जानकारी जाँचते हैं, बात करते हैं और कोटेशन बनाते हैं।')}</p></div></div>
  ${ENQ.err?`<p class="pill p-bad" style="display:block;white-space:normal">${esc(ENQ.err)}</p>`:''}
  <div class="card" style="margin-bottom:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap"><div style="flex:1;min-width:240px"><b>${L('Enquiry link for clients','क्लाइंट के लिए इन्क्वायरी लिंक')}</b><div style="font-size:13px;color:var(--muted);word-break:break-all">${esc(enqLink())}</div><small style="color:var(--muted)">${L('Send this one link to everybody. One enquiry for a GSTIN or mobile number in 90 days.','यही एक लिंक सबको भेजें। एक GSTIN या मोबाइल से 90 दिन में एक इन्क्वायरी।')}</small></div><button class="btn btn-o btn-s" data-enqcopy>${L('Copy link','लिंक कॉपी')}</button><a class="btn btn-o btn-s" href="#enquiry" target="_blank">${L('Open form','फ़ॉर्म खोलें')}</a><button class="btn btn-p btn-s" data-enqadd>+ ${L('Add client enquiry','क्लाइंट इन्क्वायरी जोड़ें')}</button></div>
  <div class="tools">${chips}</div>
  <div class="card tw"><table class="tbl"><thead><tr><th>${L('Ref','संदर्भ')}</th><th>${L('Company','कंपनी')}</th><th>${L('Contact','संपर्क')}</th><th>${L('Employees','कर्मचारी')}</th><th>${L('Received','मिला')}</th><th>${t('status')}</th><th></th></tr></thead><tbody>${rows.map(r=>{const d=r.data||{};return `<tr><td><b>${enqRef(r)}</b></td><td>${esc(d.legal)}</td><td>${esc(d.person)}<small style="display:block;color:var(--muted)">${esc(r.mobile)}</small></td><td>${esc(d.employees)}</td><td>${fmtS((r.created_at||'').slice(0,10))}</td><td>${enqSt(r.status)}</td><td style="text-align:right"><button class="btn btn-o btn-s" data-enqopen="${r.id}">${L('Open','खोलें')}</button></td></tr>`}).join('')||`<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:22px">${L('No enquiry yet. Send the link to a client.','अभी कोई इन्क्वायरी नहीं। क्लाइंट को लिंक भेजें।')}</td></tr>`}</tbody></table></div>
  ${LIVE.salesOnly?'':`<div class="card tw" style="margin-top:16px"><div style="display:flex;align-items:center;gap:10px;padding:16px 18px 0"><h3 style="margin:0">${L('Sales logins','सेल्स लॉगिन')}</h3><div style="flex:1"></div><button class="btn btn-p btn-s" data-enqsales>+ ${L('Sales login','सेल्स लॉगिन')}</button></div><p style="padding:0 18px;font-size:13px;color:var(--muted);margin:6px 0">${L('A Sales login sees only Enquiries (and later Quotations): no licensing, billing, clients or KPI packs. Sign in with the email and no company code.','सेल्स लॉगिन सिर्फ़ इन्क्वायरी (और आगे कोटेशन) देखता है: लाइसेंस, बिलिंग, क्लाइंट या KPI पैक नहीं। ईमेल से और कंपनी कोड के बिना साइन इन करें।')}</p>
   <table class="tbl"><thead><tr><th>${L('Name','नाम')}</th><th>Email</th><th>${t('status')}</th><th></th></tr></thead><tbody>${ENQ.sales.map(s=>`<tr style="${s.active?'':'opacity:.55'}"><td><b>${esc(s.name)}</b></td><td>${esc(s.email)}</td><td><span class="pill ${s.active?'p-ok':'p-bad'}">${s.active?t('active'):t('inactive_i')}</span></td><td style="text-align:right"><button class="btn btn-o btn-s ${s.active?'btn-d':''}" data-enqstog="${s.user_id}">${s.active?t('inactivate'):t('activate')}</button></td></tr>`).join('')||`<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:16px">${L('No Sales login yet.','अभी कोई सेल्स लॉगिन नहीं।')}</td></tr>`}</tbody></table></div>`}`}
const enqKV=(l,v)=>v?`<div><label style="font-size:11px;color:var(--muted);display:block;margin:0">${l}</label><div style="font-size:13px">${esc(v)}</div></div>`:'';
async function enqOpen(id){const r=ENQ.rows.find(x=>x.id===id);if(!r)return;const d=r.data||{}, nr=await sb.from('enquiry_notes').select('*').eq('enquiry_id',id).order('created_at');
  const sub=o=>o&&(o.name||o.mobile||o.email)?[o.name,o.mobile,o.email].filter(Boolean).join(' · '):'';
  const mods=(d.mods||[]).map(m=>{const x=((typeof MODS!=='undefined'?MODS:[])).find(k=>k.id===m);return x?L(...x.name):m}).join(', ');
  const bg=openModal(`<h3>${enqRef(r)} · ${esc(d.legal)} ${enqSt(r.status)}</h3><div class="fgrid" style="gap:8px 14px">
   ${enqKV(L('Trade name','ट्रेड नाम'),d.trade)}${enqKV(L('Type','प्रकार'),d.type)}${enqKV('GSTIN',d.gstin)}${enqKV('PAN',d.pan)}${enqKV('CIN',d.cin)}
   <div style="grid-column:1/-1">${enqKV(L('Registered address','पंजीकृत पता'),[d.address,d.state,d.pin].filter(Boolean).join(', '))}</div>
   ${enqKV(L('Authorised person','अधिकृत व्यक्ति'),[d.person,d.desig].filter(Boolean).join(', '))}${enqKV(L('Mobile','मोबाइल'),d.mobile)}${enqKV('Email',d.email)}
   ${enqKV(L('Billing contact','बिलिंग संपर्क'),sub(d.bill))}${enqKV(L('Support contact','सपोर्ट संपर्क'),sub(d.support))}
   ${enqKV(L('Employees','कर्मचारी'),d.employees)}${enqKV(L('Branches','शाखाएँ'),d.branches)}${enqKV(L('Preferred start','पसंदीदा शुरुआत'),d.start)}
   <div style="grid-column:1/-1">${enqKV(L('Modules asked','माँगे मॉड्यूल'),mods)}</div><div style="grid-column:1/-1">${enqKV(L('Note from the client','क्लाइंट का नोट'),d.note)}</div></div>
   <h4 style="margin:14px 0 4px">${L('Notes','नोट')}</h4><div id="enqNotes">${(nr.data||[]).map(n=>`<div style="border-top:1px solid var(--line);padding:6px 0;font-size:13px"><small style="color:var(--muted)">${fmtS((n.created_at||'').slice(0,10))} · ${esc(n.by_name||'')}</small><br>${esc(n.note)}</div>`).join('')||`<small style="color:var(--muted)">${L('No note yet.','अभी कोई नोट नहीं।')}</small>`}</div>
   ${(()=>{const lq=qLatest(id);return `<div style="margin:10px 0;padding:8px 10px;border-radius:8px;background:var(--bg,#f4f7f6);font-size:13px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">${lq?`${L('Quotation','कोटेशन')}: <b>${esc(lq.no)}</b> ${qSt(lq.status)} <button type="button" class="btn btn-o btn-s" data-enqq="${lq.id}">${L('Open','खोलें')}</button>`:(['lost','live'].includes(r.status)?`<span style="color:var(--muted)">${L('No quotation'  ,'कोई कोटेशन नहीं')}</span>`:`<button type="button" class="btn btn-p btn-s" data-enqgen>${L('Generate quotation','कोटेशन बनाएँ')}</button>`)}</div>`})()}
   <label style="margin-top:8px">${L('Add a note','नोट जोड़ें')}</label><textarea class="inp" name="note" rows="2" placeholder="${L('For example: called, demo on Monday','जैसे: फ़ोन किया, सोमवार को डेमो')}"></textarea>
   <div id="me" style="color:var(--bad);font-size:12px;margin-top:6px"></div>
   <div class="acts" style="flex-wrap:wrap"><button type="button" class="btn btn-o" data-close>${L('Close','बंद करें')}</button>${['discussion','hold','lost'].filter(s=>s!==r.status).map(s=>`<button type="button" class="btn btn-o" data-enqs="${s}">${s==='discussion'?L('Mark in discussion','बातचीत में करें'):s==='hold'?L('On hold','रोकें'):L('Lost','खोया')}</button>`).join('')}<button class="btn btn-p">${L('Save note','नोट सेव करें')}</button></div>`,
  async(f,close,bgx)=>{const note=(new FormData(f).get('note')||'').trim(),er=m=>{(bgx||document).querySelector('#me').textContent=m};if(!note)return er(t('e_req'));
   const x=await sb.from('enquiry_notes').insert({enquiry_id:id,by_user:ENQ.me.id,by_name:ENQ.me.name,note});if(x.error)return er(x.error.message);close();toast(t('saved'));render()});
  if(bg){const g=bg.querySelector('[data-enqgen]');if(g)g.onclick=()=>{bg.remove();quoteForm({enq:r,mode:'new'})};const o=bg.querySelector('[data-enqq]');if(o)o.onclick=()=>{bg.remove();quoteView(o.dataset.enqq)}}
  if(bg)bg.querySelectorAll('[data-enqs]').forEach(b=>b.onclick=async()=>{const s=b.dataset.enqs,upd={status:s};if(s==='discussion'&&!r.contacted_at)upd.contacted_at=new Date().toISOString();
   const x=await sb.rpc('enquiry_set_status',{p_id:id,p_status:s});if(x.error)return toast(x.error.message);await sb.from('enquiry_notes').insert({enquiry_id:id,by_user:ENQ.me.id,by_name:ENQ.me.name,note:'Status: '+ENQ_ST[r.status][0]+' → '+ENQ_ST[s][0]});Object.assign(r,upd);bg.remove();toast(t('saved'));render()})}
function enqSalesModal(){openModal(`<h3>${L('New Sales login','नया सेल्स लॉगिन')}</h3><label>${L('Name','नाम')} *</label><input class="inp" name="n"><label>Email *</label><input class="inp" name="e" type="email"><label>${L('First password (at least 8 characters)','पहला पासवर्ड (कम से कम 8 अक्षर)')} *</label><input class="inp" name="p"><p style="font-size:12px;color:var(--muted)">${L('Tell the password only to that person. They sign in with the email and leave the company code empty.','पासवर्ड सिर्फ़ उसी व्यक्ति को बताएँ। वह ईमेल से साइन इन करेगा और कंपनी कोड ख़ाली छोड़ेगा।')}</p><div id="me" style="color:var(--bad);font-size:12px"></div><div class="acts"><button type="button" class="btn btn-o" data-close>${t('cancel')}</button><button class="btn btn-p">${t('save')}</button></div>`,
  async(f,close,bg)=>{const v=Object.fromEntries(new FormData(f)),er=m=>{(bg||document).querySelector('#me').textContent=m};if(!v.n.trim()||!v.e.trim()||!v.p)return er(t('e_req'));
   const r=await sb.rpc('platform_create_sales',{p_name:v.n,p_email:v.e,p_password:v.p});if(r.error)return er(r.error.message);close();toast(t('saved'));ENQ.loaded=false;render()})}
/* ---------- Quotations of the Mirror-HR team: made from an enquiry, revised, sent, accepted; and "Our details" printed on them ---------- */
const INDIA_STATES=['Andaman and Nicobar Islands','Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chandigarh','Chhattisgarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jammu and Kashmir','Jharkhand','Karnataka','Kerala','Ladakh','Lakshadweep','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Puducherry','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];
const QST={draft:['Draft','ड्राफ़्ट','p-warn'],sent:['Sent','भेजी','p-teal'],accepted:['Accepted','स्वीकार','p-ok'],rejected:['Rejected','अस्वीकार','p-bad'],superseded:['Replaced','बदली गई','p-bad']};
const qSt=s=>{const x=QST[s]||[s,s,'p-teal'];return `<span class="pill ${x[2]}">${L(x[0],x[1])}</span>`};
const r0q=x=>Math.round(x);
const qMoney=n=>'₹'+Number(n||0).toLocaleString('en-IN');
const qCo=()=>ENQ.co||{};
/* the first invoice: base fee + one-time setup, and the GST: CGST and SGST in our own state, IGST for another state */
function qCalc(d,co){const taxable=(+d.base||0)+(+d.setup||0), rate=+(co.gst!=null?co.gst:18), same=(d.client&&d.client.state)===co.state, g=taxable*rate/100;
  return same?{taxable,rate,cgst:r0q(g/2),sgst:r0q(g/2),igst:0,total:taxable+r0q(g/2)*2}:{taxable,rate,cgst:0,sgst:0,igst:r0q(g),total:taxable+r0q(g)}}
const qLatest=eid=>ENQ.q.filter(x=>x.enquiry_id===eid&&x.status!=='superseded').sort((a,b)=>b.rev-a.rev)[0];
async function enqReload(){ENQ.loaded=false;render()}
function enqConfirm(title,text,okLabel,fn,withReason){openModal(`<h3>${title}</h3><p style="font-size:13px">${text}</p>${withReason?`<label>${L('Reason (optional)','कारण (वैकल्पिक)')}</label><textarea class="inp" name="why" rows="2"></textarea>`:''}<div id="me" style="color:var(--bad);font-size:12px"></div><div class="acts"><button type="button" class="btn btn-o" data-close>${t('cancel')}</button><button class="btn btn-p">${okLabel}</button></div>`,
  async(f,close,bg)=>{const r=await fn(new FormData(f).get('why')||'');if(r&&r.error)return (bg||document).querySelector('#me').textContent=r.error.message;close();toast(t('saved'));enqReload()})}
function quoteForm(o){const enq=o.enq, q=o.q, mode=o.mode, co=qCo(), ed=enq.data||{};
  const base=q?q.data:{client:{name:ed.legal||'',address:[ed.address,ed.pin].filter(Boolean).join(' - '),state:ed.state||co.state||'Maharashtra',gstin:ed.gstin||'',email:ed.email||'',person:ed.person||'',mobile:enq.mobile||''},
    mods:Object.fromEntries(MODS.map(m=>[m.id,(ed.mods||[]).includes(m.id)])),cycle:'Monthly',term:12,base:0,incl:+ed.employees||25,rate:0,hardPct:SAAS.hardPct,setup:0,valid:addD(TODAY_S,+co.validDays||15),notes:''};
  const d=base, cl=d.client||{};
  const title=mode==='new'?L('New quotation','नई कोटेशन'):mode==='revise'?`${L('Revise','संशोधन')} ${q.no} → R${q.rev+1}`:`${q.no}`;
  const bg0=openModal(`<h3>${title} · ${esc(cl.name)}</h3><div class="fgrid"><div><label>${L('Client company','क्लाइंट कंपनी')} *</label><input class="inp" name="cn" value="${esc(cl.name)}"></div><div><label>GSTIN</label><input class="inp" name="gs" maxlength="15" style="text-transform:uppercase" value="${esc(cl.gstin)}"></div>
   <div><label>${L('Address','पता')}</label><input class="inp" name="ad" value="${esc(cl.address)}"></div><div><label>${L('State (place of supply)','राज्य (आपूर्ति का स्थान)')} *</label><select class="inp" name="st">${INDIA_STATES.map(s=>`<option ${s===cl.state?'selected':''}>${s}</option>`).join('')}</select></div>
   <div><label>${L('Contact person','संपर्क व्यक्ति')}</label><input class="inp" name="pn" value="${esc(cl.person)}"></div><div><label>Email</label><input class="inp" name="em" value="${esc(cl.email)}"></div>
   <div><label>${L('Plan preset','प्लान नमूना')}</label><select class="inp" name="pl">${Object.keys(PLANS).map(p=>`<option>${p}</option>`).join('')}<option value="Custom">${L('Customize (choose modules)','अपनी पसंद (मॉड्यूल चुनें)')}</option></select></div></div>
   <label>${L('Modules','मॉड्यूल')}</label><div id="qmods" style="display:flex;flex-wrap:wrap;gap:6px 14px">${MODS.map(m=>`<label style="margin:0;font-weight:400;display:flex;gap:6px"><input type="checkbox" data-qm="${m.id}" ${d.mods[m.id]?'checked':''}> ${L(...m.name)}</label>`).join('')}</div>
   <div class="fgrid" style="margin-top:10px"><div><label>${L('Billing cycle','बिलिंग साइकिल')}</label><select class="inp" name="cy">${Object.keys(CYC).map(c=>`<option ${c===d.cycle?'selected':''}>${c}</option>`).join('')}</select></div><div><label>${L('Contract (months)','अनुबंध (महीने)')}</label><input class="inp" type="number" min="1" name="tm" value="${d.term}"></div>
   <div><label>${L('Base fee per cycle (before GST)','बेस फ़ीस प्रति साइकिल (GST से पहले)')} *</label><input class="inp" type="number" min="1" name="bf" value="${d.base||''}"></div><div><label>${L('Employees included in the base fee','बेस फ़ीस में शामिल कर्मचारी')} *</label><input class="inp" type="number" min="1" name="in" value="${d.incl}"></div>
   <div><label>${L('Extra rate per extra employee per month','अतिरिक्त कर्मचारी की दर प्रति माह')}</label><input class="inp" type="number" min="0" name="rt" value="${d.rate}"></div><div><label>${L('Hard cap above the limit (%)','सीमा से ऊपर पक्की रोक (%)')}</label><input class="inp" type="number" min="0" name="hp" value="${d.hardPct}"></div>
   <div><label>${L('One-time setup charge (optional)','एक बार का सेटअप चार्ज (वैकल्पिक)')}</label><input class="inp" type="number" min="0" name="su" value="${d.setup||0}"></div><div><label>${L('Valid till','मान्य')}</label><input class="inp" type="date" name="vt" value="${d.valid}"></div></div>
   <label>${L('Note for the PDF (optional)','PDF के लिए नोट (वैकल्पिक)')}</label><textarea class="inp" name="nt" rows="2">${esc(d.notes||'')}</textarea>
   <div id="qtot" style="margin:10px 0;padding:10px 12px;border-radius:8px;background:var(--bg,#f4f7f6);font-size:13px"></div>
   <div id="me" style="color:var(--bad);font-size:12px;margin-top:8px"></div><div class="acts"><button type="button" class="btn btn-o" data-close>${t('cancel')}</button><button class="btn btn-p">${mode==='revise'?`${L('Save as','इस रूप में सेव')} R${q.rev+1}`:t('save')}</button></div>`,
  async(f,close,bg)=>{const v=Object.fromEntries(new FormData(f)), er=m=>bg.querySelector('#me').textContent=m, mods={};bg.querySelectorAll('[data-qm]').forEach(c=>mods[c.dataset.qm]=c.checked);
   const gs=(v.gs||'').toUpperCase().trim();if(!v.cn.trim())return er(L('Client name is required','क्लाइंट का नाम ज़रूरी है'));if(gs&&!/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gs))return er(L('GSTIN is not in the right format','GSTIN का फ़ॉर्मेट सही नहीं'));
   const bs=Math.round(+v.bf), incl=Math.round(+v.in);if(!(bs>0)||!(incl>=1))return er(L('Base fee and included employees are required','बेस फ़ीस और शामिल कर्मचारी ज़रूरी हैं'));if(!MODS.some(m=>mods[m.id]))return er(L('Choose at least one module','कम से कम एक मॉड्यूल चुनें'));
   for(const m of MODS){if(mods[m.id]){const bad=m.needs.find(n=>!mods[n]);if(bad)return er(`${L(...m.name)}: ${L('needs','के लिए चाहिए')} ${L(...MODS.find(x=>x.id===bad).name)}`)}}
   const dd={client:{name:v.cn.trim(),address:v.ad.trim(),state:v.st,gstin:gs,email:v.em.trim(),person:v.pn.trim(),mobile:cl.mobile||''},plan:planName(mods),mods,cycle:v.cy,term:Math.max(1,Math.round(+v.tm)),base:bs,incl,rate:Math.max(0,Math.round(+v.rt)),hardPct:Math.max(0,+v.hp||0),setup:Math.max(0,Math.round(+v.su)),valid:v.vt,notes:v.nt.trim()};
   dd.calc=qCalc(dd,co);dd.our=co;
   const r=mode==='new'?await sb.rpc('quotation_create',{p_enquiry:enq.id,p_data:dd}):mode==='revise'?await sb.rpc('quotation_revise',{p_id:q.id,p_data:dd}):await sb.rpc('quotation_save',{p_id:q.id,p_data:dd});
   if(r.error)return er(r.error.message);close();toast(t('saved'));enqReload()});
  const bg=bg0||document.querySelector('.modal-bg'), pl=bg.querySelector('[name=pl]'), tot=()=>{const g=n=>+(bg.querySelector(`[name=${n}]`).value||0), st=bg.querySelector('[name=st]').value, c=qCalc({base:g('bf'),setup:g('su'),client:{state:st}},co);
    bg.querySelector('#qtot').innerHTML=`${L('First invoice','पहला इनवॉइस')}: ${qMoney(g('bf'))} ${g('su')?`+ ${qMoney(g('su'))} ${L('setup','सेटअप')} `:''}= ${qMoney(c.taxable)} · ${c.igst?`IGST ${c.rate}% ${qMoney(c.igst)}`:`CGST ${c.rate/2}% ${qMoney(c.cgst)} + SGST ${c.rate/2}% ${qMoney(c.sgst)}`} · <b>${L('Total','कुल')} ${qMoney(c.total)}</b><br><small style="color:var(--muted)">${L('Our state','हमारा राज्य')}: ${esc(co.state||'')}. ${(g('in')?`${L('Hard cap','पक्की रोक')}: ${hardOf(g('in'),g('hp'))} ${L('employees','कर्मचारी')}`:'')}</small>`};
  const cur0=(()=>{const m={};MODS.forEach(x=>m[x.id]=!!d.mods[x.id]);return planName(m)})();pl.value=cur0;
  pl.onchange=()=>{if(pl.value==='Custom')return;bg.querySelectorAll('[data-qm]').forEach(c=>c.checked=PLANS[pl.value].includes(c.dataset.qm));tot()};
  bg.querySelectorAll('[data-qm]').forEach(c=>c.onchange=()=>{const m=MODS.find(x=>x.id===c.dataset.qm);if(c.checked)m.needs.forEach(n=>{bg.querySelector(`[data-qm="${n}"]`).checked=true});else MODS.filter(x=>x.needs.includes(m.id)).forEach(x=>bg.querySelector(`[data-qm="${x.id}"]`).checked=false);
    const cur={};bg.querySelectorAll('[data-qm]').forEach(x=>cur[x.dataset.qm]=x.checked);pl.value=planName(cur)});
  bg.querySelectorAll('input[type=number],[name=st]').forEach(i=>{i.oninput=tot;i.onchange=tot});tot()}
/* the PDF: opens a clean page and the browser prints it to PDF */
function quotePdf(q){const co=q.data.our&&q.data.our.legal!==undefined?q.data.our:qCo(), d=q.data, cl=d.client||{}, c=d.calc||qCalc(d,co);
  if(!(co.legal||'').trim()){toast(L('Write the legal name of the company in Our details first','पहले Our details में कंपनी का कानूनी नाम लिखें'));return}
  const mods=MODS.filter(m=>d.mods[m.id]).map(m=>m.name[0]).join(', '), E=esc, b=co.bank||{}, hasBank=b.name||b.acc, cap=hardOf(d.incl,d.hardPct), cyc=d.cycle.toLowerCase();
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>${E(q.no)}</title><style>
  *{-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{margin:0}
  body{font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;margin:0;padding:0;font-size:13px;line-height:1.5}h1{font-size:20px;margin:0}h2{font-size:14px;margin:18px 0 6px;color:#0b3b36;border-bottom:2px solid #C9A227;padding-bottom:3px}
  .pg{padding:20px 34px 14px}.hd{background:#0b3b36;color:#fff;padding:16px 34px;display:flex;justify-content:space-between;align-items:center;border-bottom:5px solid #C9A227}.hd small{color:#fff}.brand{display:flex;align-items:center;gap:10px}.bn{font-size:22px;font-weight:bold;line-height:1.1}.bt{color:#F7D774;font-size:11px;font-weight:bold}.qt{font-size:22px;font-weight:bold;letter-spacing:2px;color:#F7D774}
  .two{display:flex;gap:12px}.two>div{flex:1;padding:8px 12px}.fr{background:#eef6f4;border-left:4px solid #0f766e}.to{background:#fdf6e3;border-left:4px solid #C9A227}.lb{font-size:11px;font-weight:bold;letter-spacing:1px}
  .tg{display:inline-block;padding:2px 10px;border-radius:10px;font-size:11px;margin:0 6px 4px 0;background:#e6f1ef;color:#0b3b36}.tg.p{background:#0f766e;color:#fff}.tg.g{background:#fdf1c7;color:#6b5207}
  table{width:100%;border-collapse:collapse}th,td{padding:6px 8px;border-bottom:1px solid #ddd;text-align:left;vertical-align:top}th{background:#0f766e;color:#fff;font-size:12px}tbody tr:nth-child(even){background:#f6faf9}td.r,th.r{text-align:right}
  .tot td{border-bottom:0}.b{font-weight:bold}.gt td{background:#0b3b36;color:#F7D774;font-weight:bold;font-size:14px;padding:8px}.sig{margin-top:46px}.sm{font-size:12px;color:#444}.ft{background:#0b3b36;color:#F7D774;text-align:center;padding:7px;font-size:10px;margin-top:22px}</style></head><body>
  <div class="hd"><div class="brand"><svg viewBox="0 0 40 40" width="46" height="46"><ellipse cx="20" cy="18" rx="12.5" ry="15" fill="rgba(201,162,39,.18)" stroke="#E6C04A" stroke-width="3"/><path d="M11.5 12.5Q13 8.5 17 7" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/><path d="M13.5 24l5-6 3.5 3.5 6-8" fill="none" stroke="#F7D774" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M28 9.5v5M25.5 12h5" stroke="#fff" stroke-width="2" stroke-linecap="round"/><path d="M20 33v5" stroke="#C9A227" stroke-width="3" stroke-linecap="round"/></svg><div><div class="bn">Mirror-HR</div><div class="bt">Grow with clarity</div></div></div><div style="text-align:right"><div class="qt">QUOTATION</div><small>No. <b>${E(q.no)}</b><br>Date: ${E(fmtY((q.created_at||'').slice(0,10)||TODAY_S))}<br>Valid till: <b>${E(fmtY(d.valid))}</b></small></div></div>
  <div class="pg"><div class="two"><div class="fr"><div class="lb" style="color:#0f766e">FROM</div><b>${E(co.legal)}</b><br><small style="color:#555">${E([co.address,co.state,co.pin].filter(Boolean).join(', '))}<br>GSTIN ${E(co.gstin||'')} · PAN ${E(co.pan||'')}${co.sac?' · SAC '+E(co.sac):''}</small></div>
  <div class="to"><div class="lb" style="color:#8a6d0b">TO</div><b>${E(cl.name)}</b>${cl.person?'<br>Attn: '+E(cl.person):''}<br><small style="color:#555">${E(cl.address||'')}${cl.gstin?'<br>GSTIN '+E(cl.gstin):''}<br>Place of supply: ${E(cl.state||'')}</small></div></div>
  <h2>Subscription to Mirror-HR (HR management software)</h2><div><span class="tg p">Plan: ${E(d.plan)}</span><span class="tg">${E(d.cycle)}</span><span class="tg">${d.term} month(s)</span><span class="tg g">Up to ${d.incl} employees</span></div><div class="sm">Modules: ${E(mods)}</div>
  <table style="margin-top:8px"><thead><tr><th>Description</th><th class="r">Amount (₹)</th></tr></thead><tbody>
  <tr><td>Subscription fee per ${E(cyc==='monthly'?'month':cyc==='quarterly'?'quarter':'year')} (${E(d.cycle)}), up to <b>${d.incl}</b> employees</td><td class="r">${E(Number(d.base).toLocaleString('en-IN'))}</td></tr>
  ${d.setup?`<tr><td>One-time setup and implementation (first invoice only)</td><td class="r">${E(Number(d.setup).toLocaleString('en-IN'))}</td></tr>`:''}
  <tr class="tot"><td class="b">Taxable value (first invoice)</td><td class="r b">${E(Number(c.taxable).toLocaleString('en-IN'))}</td></tr>
  ${c.igst?`<tr class="tot"><td>IGST ${c.rate}%</td><td class="r">${E(Number(c.igst).toLocaleString('en-IN'))}</td></tr>`:`<tr class="tot"><td>CGST ${c.rate/2}%</td><td class="r">${E(Number(c.cgst).toLocaleString('en-IN'))}</td></tr><tr class="tot"><td>SGST ${c.rate/2}%</td><td class="r">${E(Number(c.sgst).toLocaleString('en-IN'))}</td></tr>`}
  <tr class="gt"><td>Total (first invoice)</td><td class="r">₹ ${E(Number(c.total).toLocaleString('en-IN'))}</td></tr></tbody></table>
  <div class="sm" style="margin-top:6px">Rupees ${E(typeof words==='function'?words(c.total):'')} Only</div>
  ${d.rate?`<h2>Extra employees</h2><div class="sm">Above ${d.incl} employees: ₹${E(Number(d.rate).toLocaleString('en-IN'))} per extra employee per month, plus GST. The number of employees cannot go beyond ${cap} (hard cap).</div>`:''}
  <h2>Terms</h2><div class="sm"><ol style="margin:0;padding-left:18px">
  <li>This quotation is valid till ${E(fmtY(d.valid))}.</li>
  <li>Payment is due within ${+co.payDays||15} days of the invoice date. GST is charged as applicable.</li>
  <li>Support: ${E(co.support||'')}.</li>
  ${co.dataTerm?`<li>${E(co.dataTerm)}</li>`:''}
  ${d.notes?`<li>${E(d.notes)}</li>`:''}</ol></div>
  ${hasBank?`<h2>Bank details</h2><div class="sm">${[b.name&&'Bank: '+E(b.name),b.holder&&'Account name: '+E(b.holder),b.acc&&'Account no.: '+E(b.acc),b.ifsc&&'IFSC: '+E(b.ifsc)].filter(Boolean).join('<br>')}</div>`:''}
  <div class="sig">For <b>${E(co.legal)}</b><br><br><br>${E(co.signName||'')}<br>${E(co.signDesig||'')}</div>
  </div><div class="ft">Mirror-HR · Grow with clarity · This is a computer generated quotation. Prices are in Indian Rupees.</div></body></html>`;
  const w=window.open('','_blank');if(!w){toast(L('Allow pop-ups to see the PDF','PDF देखने के लिए पॉप-अप चालू करें'));return}w.document.open();w.document.write(html);w.document.close();w.focus();setTimeout(()=>{try{w.print()}catch(e){}},500)}
function quoteView(id){const q=ENQ.q.find(x=>x.id===id);if(!q)return;const d=q.data, cl=d.client||{}, c=d.calc||qCalc(d,qCo()), enq=ENQ.rows.find(x=>x.id===q.enquiry_id);
  const mods=MODS.filter(m=>d.mods[m.id]).map(m=>L(...m.name)).join(', '), kv=(l,v)=>`<div style="display:flex;justify-content:space-between;gap:10px;padding:3px 0;font-size:13px"><span style="color:var(--muted)">${l}</span><span>${v}</span></div>`;
  const btns=[`<button type="button" class="btn btn-o" data-qa="pdf">${L('Preview PDF','PDF देखें')}</button>`];
  if(q.status==='draft')btns.push(`<button type="button" class="btn btn-o" data-qa="edit">${t('edit')}</button><button type="button" class="btn btn-p" data-qa="send">${L('Mark as sent','भेजी हुई करें')}</button>`);
  if(q.status==='sent')btns.push(`<button type="button" class="btn btn-o" data-qa="revise">${L('Revise','संशोधन')}</button><button type="button" class="btn btn-o" data-qa="reject">${L('Client rejected','क्लाइंट ने मना किया')}</button><button type="button" class="btn btn-p" data-qa="accept">${L('Accept quotation','कोटेशन स्वीकार करें')}</button>`);
  if(q.status==='accepted')btns.push(`<button type="button" class="btn btn-p" data-qa="onb">${L('Open onboarding','ऑनबोर्डिंग खोलें')}</button>`);
  if(q.status==='rejected')btns.push(`<button type="button" class="btn btn-o" data-qa="revise">${L('Revise','संशोधन')}</button>`);
  const bg=openModal(`<h3>${esc(q.no)} · ${esc(cl.name)} ${qSt(q.status)}</h3>
   ${kv(L('Plan','प्लान'),esc(d.plan))}${kv(L('Modules','मॉड्यूल'),esc(mods))}${kv(L('Billing','बिलिंग'),`${esc(d.cycle)} · ${d.term} ${L('months','महीने')}`)}${kv(L('Base fee per cycle','बेस फ़ीस प्रति साइकिल'),`${qMoney(d.base)} · ${L('up to','तक')} ${d.incl} ${L('employees','कर्मचारी')}`)}${d.rate?kv(L('Extra per employee / month','अतिरिक्त प्रति कर्मचारी / माह'),qMoney(d.rate)):''}${d.setup?kv(L('One-time setup','एक बार का सेटअप'),qMoney(d.setup)):''}
   ${kv(L('Place of supply','आपूर्ति का स्थान'),esc(cl.state||''))}${kv(c.igst?`IGST ${c.rate}%`:`CGST + SGST ${c.rate}%`,qMoney(c.igst||c.cgst+c.sgst))}${kv(`<b>${L('First invoice total','पहले इनवॉइस का कुल')}</b>`,`<b>${qMoney(c.total)}</b>`)}${kv(L('Valid till','मान्य'),fmtS(d.valid))}
   ${q.sent_at?kv(L('Sent on','भेजी गई'),fmtS(q.sent_at.slice(0,10))):''}${q.accepted_at?kv(L('Accepted on','स्वीकार हुई'),`${fmtS(q.accepted_at.slice(0,10))} · ${esc(q.accepted_by||'')}`):''}${q.rejected_at?kv(L('Rejected on','अस्वीकार हुई'),`${fmtS(q.rejected_at.slice(0,10))}${q.reject_reason?' · '+esc(q.reject_reason):''}`):''}
   ${q.status==='accepted'?`<p class="pill p-ok" style="display:block;white-space:normal;margin-top:10px">${L('Accepted and locked. Open Onboarding for the agreement, the onboarding form and the checklist.','स्वीकार और लॉक। एग्रीमेंट, ऑनबोर्डिंग फ़ॉर्म और चेकलिस्ट के लिए ऑनबोर्डिंग खोलें।')}</p>`:''}
   <div class="acts" style="flex-wrap:wrap"><button type="button" class="btn btn-o" data-close>${L('Close','बंद करें')}</button>${btns.join('')}</div>`,()=>{});
  const A=a=>bg&&bg.querySelector(`[data-qa="${a}"]`);
  if(A('pdf'))A('pdf').onclick=()=>quotePdf(q);
  if(A('onb'))A('onb').onclick=()=>{bg.remove();ENQ.tab='onb';render()};
  if(A('edit'))A('edit').onclick=()=>{bg.remove();quoteForm({enq,q,mode:'edit'})};
  if(A('revise'))A('revise').onclick=()=>{bg.remove();quoteForm({enq,q,mode:'revise'})};
  if(A('send'))A('send').onclick=()=>{bg.remove();enqConfirm(L('Mark as sent','भेजी हुई करें'),L('Use this after you have sent the PDF to the client. The enquiry becomes “Quotation sent” and the quotation can no longer be edited, only revised.','PDF क्लाइंट को भेजने के बाद इसे दबाएँ। इन्क्वायरी “कोटेशन भेजी” हो जाएगी और कोटेशन बदली नहीं जा सकेगी, सिर्फ़ संशोधित होगी।'),L('Mark as sent','भेजी हुई करें'),()=>sb.rpc('quotation_send',{p_id:q.id}))};
  if(A('reject'))A('reject').onclick=()=>{bg.remove();enqConfirm(L('Client rejected','क्लाइंट ने मना किया'),L('The enquiry goes On hold. You can revise the quotation later.','इन्क्वायरी On hold हो जाएगी। आप बाद में कोटेशन संशोधित कर सकते हैं।'),L('Mark rejected','अस्वीकार करें'),w=>sb.rpc('quotation_reject',{p_id:q.id,p_reason:w}),true)};
  if(A('accept'))A('accept').onclick=()=>{bg.remove();enqConfirm(L('Accept quotation','कोटेशन स्वीकार करें'),`${esc(q.no)} ${L('is accepted by the client. It will be locked: nothing in it can be changed after this.','को क्लाइंट ने मान लिया। यह लॉक हो जाएगी: इसके बाद इसमें कुछ नहीं बदला जा सकेगा।')}`,L('Accept','स्वीकार'),()=>sb.rpc('quotation_accept',{p_id:q.id}))}}
function quotesTab2(){const f=ENQ.qf||'all', rows=ENQ.q.filter(x=>f==='all'||x.status===f).sort((a,b)=>a.created_at<b.created_at?1:-1);
  const chips=['all','draft','sent','accepted','rejected'].map(k=>`<button class="btn ${f===k?'btn-p':'btn-o'} btn-s" data-qf="${k}">${k==='all'?L('All','सभी'):L(QST[k][0],QST[k][1])} (${ENQ.q.filter(x=>k==='all'||x.status===k).length})</button>`).join(' ');
  return `<div class="page-h"><div><h1>${L('Quotations','कोटेशन')}</h1><p>${L('Made from an enquiry. Every change after it is sent is a new revision; the old one is kept. The client never sees the price in the app.','इन्क्वायरी से बनती हैं। भेजने के बाद हर बदलाव नई रिविज़न है; पुरानी रखी रहती है। क्लाइंट को ऐप में दाम नहीं दिखता।')}</p></div></div>
  <div class="tools">${chips}</div><div class="card tw"><table class="tbl"><thead><tr><th>${L('No.','नंबर')}</th><th>${L('Company','कंपनी')}</th><th>${L('Plan','प्लान')}</th><th>${L('Per cycle','प्रति साइकिल')}</th><th>${L('Valid till','मान्य')}</th><th>${t('status')}</th><th></th></tr></thead><tbody>${rows.map(q=>{const d=q.data||{};return `<tr style="${q.status==='superseded'?'opacity:.55':''}"><td><b>${esc(q.no)}</b></td><td>${esc((d.client||{}).name)}</td><td>${esc(d.plan)} · ${esc(d.cycle)}</td><td>${qMoney(d.base)} + GST</td><td>${fmtS(d.valid)}</td><td>${qSt(q.status)}</td><td style="text-align:right"><button class="btn btn-o btn-s" data-qopen="${q.id}">${L('Open','खोलें')}</button></td></tr>`}).join('')||`<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:22px">${L('No quotation yet. Open an enquiry and press Generate quotation.','अभी कोई कोटेशन नहीं। इन्क्वायरी खोलकर Generate quotation दबाएँ।')}</td></tr>`}</tbody></table></div>`}
function ourTab(){const c=qCo(), b=c.bank||{}, inp=(n,l,v,o={})=>`<div><label>${l}</label><input class="inp" name="${n}" value="${esc(v==null?'':v)}" ${o.max?`maxlength="${o.max}"`:''} ${o.type?`type="${o.type}"`:''} ${o.up?'style="text-transform:uppercase"':''}></div>`;
  return `<div class="page-h"><div><h1>${L('Our details','हमारी जानकारी')}</h1><p>${L('Printed on every quotation. Change it here once; quotations already made keep the details they were made with.','हर कोटेशन पर छपती है। यहाँ एक बार बदलें; बन चुकी कोटेशन अपनी बनी हुई जानकारी रखती हैं।')}</p></div></div>
  ${(c.legal||'').trim()?'':`<p class="pill p-warn" style="display:block;white-space:normal;margin-bottom:10px">${L('The legal name of the company is empty. A quotation PDF cannot be made until you write it.','कंपनी का कानूनी नाम ख़ाली है। जब तक आप इसे नहीं लिखते, कोटेशन PDF नहीं बनेगी।')}</p>`}
  <form id="ourf" class="card" style="padding:16px 18px"><div class="fgrid">${inp('legal',L('Legal name of the company','कंपनी का कानूनी नाम')+' *',c.legal,{max:150})}${inp('trade',L('Brand name','ब्रांड नाम'),c.trade,{max:80})}${inp('address',L('Address','पता'),c.address)}
   <div><label>${L('State','राज्य')}</label><select class="inp" name="state">${INDIA_STATES.map(s=>`<option ${s===c.state?'selected':''}>${s}</option>`).join('')}</select></div>${inp('pin','PIN',c.pin,{max:6})}${inp('gstin','GSTIN',c.gstin,{max:15,up:1})}${inp('pan','PAN',c.pan,{max:10,up:1})}${inp('sac','SAC',c.sac,{max:8})}${inp('gst',L('GST rate (%)','GST दर (%)'),c.gst,{type:'number'})}${inp('payDays',L('Payment due in (days)','भुगतान कितने दिन में'),c.payDays,{type:'number'})}${inp('validDays',L('Quotation valid for (days)','कोटेशन कितने दिन मान्य'),c.validDays,{type:'number'})}</div>
   <label>${L('Support time','सपोर्ट का समय')}</label><input class="inp" name="support" value="${esc(c.support||'')}"><label>${L('Data term printed on the quotation','कोटेशन पर छपने वाली डेटा की शर्त')}</label><textarea class="inp" name="dataTerm" rows="2">${esc(c.dataTerm||'')}</textarea><label style="display:flex;gap:8px;font-weight:400;margin-top:10px"><input type="checkbox" name="agreementReviewed" ${c.agreementReviewed?'checked':''}> ${L('The agreement text has been reviewed by our advocate (removes the DRAFT mark from the agreement PDF)','एग्रीमेंट का टेक्स्ट हमारे वकील ने देख लिया (एग्रीमेंट PDF से DRAFT का निशान हट जाता है)')}</label>
   <h4 style="margin:12px 0 4px">${L('Bank details (optional)','बैंक विवरण (वैकल्पिक)')}</h4><div class="fgrid">${inp('bn',L('Bank','बैंक'),b.name)}${inp('bh',L('Account name','खाते का नाम'),b.holder)}${inp('ba',L('Account number','खाता नंबर'),b.acc)}${inp('bi','IFSC',b.ifsc,{max:11,up:1})}</div>
   <h4 style="margin:12px 0 4px">${L('Signature on the quotation','कोटेशन पर हस्ताक्षर')}</h4><div class="fgrid">${inp('signName',L('Name','नाम'),c.signName)}${inp('signDesig',L('Designation','पद'),c.signDesig)}</div>
   <div id="ourE" style="color:var(--bad);font-size:13px;margin-top:8px"></div><div class="acts"><button class="btn btn-p">${t('save')}</button></div></form>`}
function ourSave(f){const v=Object.fromEntries(new FormData(f)), er=m=>{f.querySelector('#ourE').textContent=m};
  const p={legal:v.legal.trim(),trade:v.trade.trim(),address:v.address.trim(),state:v.state,pin:v.pin.trim(),gstin:v.gstin.trim().toUpperCase(),pan:v.pan.trim().toUpperCase(),sac:v.sac.trim(),gst:+v.gst||0,payDays:+v.payDays||15,validDays:+v.validDays||15,support:v.support.trim(),dataTerm:v.dataTerm.trim(),signName:v.signName.trim(),signDesig:v.signDesig.trim(),agreementReviewed:!!v.agreementReviewed,bank:{name:v.bn.trim(),holder:v.bh.trim(),acc:v.ba.trim(),ifsc:v.bi.trim().toUpperCase()}};
  sb.rpc('platform_save_company',{p}).then(r=>{if(r.error)return er(r.error.message);ENQ.co=p;toast(t('saved'));render()})}
function enquiriesPage(){
  if(!ENQ.loaded)return enqListPage();
  const tab=LIVE.salesOnly&&ENQ.tab==='our'?'enq':(ENQ.tab||'enq');
  const tabs=`<div class="tabs" style="margin-bottom:14px">${[['enq','Enquiries','इन्क्वायरी'],['quo','Quotations','कोटेशन'],['onb','Onboarding','ऑनबोर्डिंग'],...(LIVE.salesOnly?[]:[['our','Our details','हमारी जानकारी']])].map(([k,en,hi])=>`<button data-enqtab="${k}" class="${tab===k?'on':''}">${L(en,hi)}</button>`).join('')}</div>`;
  if(tab==='quo')return tabs+quotesTab2();
  if(tab==='onb')return tabs+onbTab();
  if(tab==='our')return tabs+ourTab();
  const h=enqListPage(), i=h.indexOf('</p></div></div>');return i<0?tabs+h:h.slice(0,i+16)+tabs+h.slice(i+16)}
/* ---------- Onboarding: documents after a quotation is accepted, the steps, Make live and Make Active ---------- */
const printHtml=html=>{const w=window.open('','_blank');if(!w){toast(L('Allow pop-ups to see the PDF','PDF देखने के लिए पॉप-अप चालू करें'));return}w.document.open();w.document.write(html);w.document.close();w.focus();setTimeout(()=>{try{w.print()}catch(e){}},500)};
const DOC_CSS=`body{font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;margin:0;padding:30px 38px;font-size:12.5px;line-height:1.55}h1{font-size:19px;margin:0 0 4px;text-align:center}h2{font-size:13.5px;margin:16px 0 4px}h3{font-size:12.5px;margin:12px 0 3px}p{margin:3px 0}table{width:100%;border-collapse:collapse}th,td{padding:5px 7px;border:1px solid #bbb;text-align:left;vertical-align:top}th{background:#f1f5f4;font-size:12px}.sm{font-size:11.5px;color:#444}.ln{display:inline-block;border-bottom:1px solid #444;min-width:180px;height:14px;vertical-align:bottom}.box{display:inline-block;width:12px;height:12px;border:1px solid #333;vertical-align:middle;margin-right:5px}.wm{position:fixed;top:42%;left:6%;font-size:64px;color:rgba(200,0,0,.13);transform:rotate(-28deg);z-index:0;font-weight:bold;white-space:nowrap}.dr{background:#fde8e8;border:1px solid #e0a0a0;color:#8a1c1c;padding:6px 10px;margin-bottom:12px;font-weight:bold;text-align:center}.pb{page-break-before:always}.top{display:flex;justify-content:space-between;gap:20px;border-bottom:2px solid #0f5b4d;padding-bottom:8px;margin-bottom:10px}@media print{body{padding:0}}`;
const docPre=(q,enq)=>{const co=(q.data.our&&q.data.our.legal!==undefined?q.data.our:qCo()), d=q.data, cl=d.client||{}, ed=enq.data||{};return{co,d,cl,ed,E:esc,c:d.calc||qCalc(d,co),mods:MODS.filter(m=>d.mods[m.id]).map(m=>m.name[0]),date:fmtY((q.accepted_at||'').slice(0,10)||TODAY_S)}};
const docHead=(p,title)=>`<div class="top"><div><b style="font-size:15px">${p.E(p.co.legal)}</b><br><span class="sm">${p.E([p.co.address,p.co.state,p.co.pin].filter(Boolean).join(', '))}<br>GSTIN ${p.E(p.co.gstin||'')} · PAN ${p.E(p.co.pan||'')}</span></div><div style="text-align:right"><b style="font-size:15px">${title}</b><br><span class="sm">Client: ${p.E(p.cl.name)}<br>Quotation ${p.E(p.q.no)}</span></div></div>`;
/* the agreement: a draft text. It carries a DRAFT banner until the platform admin ticks, in Our details, that an advocate has reviewed the text. */
function agreementHtml(q,enq){const p=docPre(q,enq);p.q=q;const {co,d,cl,ed,E,c}=p, mods=p.mods.join(', '), cyc=d.cycle.toLowerCase(), cap=hardOf(d.incl,d.hardPct), pd=+co.payDays||15;
  const draft=!co.agreementReviewed, ptype=ed.type||'company';
  const cl_=[
   ['Definitions',[`“Agreement” means this agreement, its Annexures and the accepted Quotation ${E(q.no)}.`,'“Services” means the cloud-based human resource management software called Mirror-HR, and the support for it, in the modules named in Annexure A.','“Customer Data” means all data of the Customer and its employees that is entered into, or made by the Services for, the Customer.','“Fees” means the amounts payable by the Customer as stated in Annexure A.','“Effective Date” means the date of this Agreement stated above.']],
   ['The Services and the subscription',[`The Service Provider grants the Customer a non-exclusive, non-transferable right to use the modules named in Annexure A (${E(mods)}) for its own business, for up to ${d.incl} employees (the included employees).`,`The number of employees on the platform shall not go beyond ${cap} (the hard cap). For employees above ${d.incl}, the Customer shall pay the extra rate stated in Annexure A.`,'The Service Provider may improve and update the Services. A change shall not take away a module that the Customer has subscribed to.']],
   ['Term and renewal',[`This Agreement starts on the Effective Date and continues for an initial term of ${d.term} month(s).`,'After the initial term it renews for successive periods of 12 months, unless either party gives the other at least 30 days’ written notice before the end of the current term that it does not wish to renew.','Fees may be revised at renewal by giving 30 days’ written notice before the renewal date.']],
   ['Fees, taxes and payment',[`The Customer shall pay the Fees in Annexure A, billed ${E(cyc)}. A one-time setup charge, if any, is billed with the first invoice.`,`Each invoice is payable within ${pd} days of the invoice date. GST and any other tax are charged extra as applicable.`,'If a payment is late, the Service Provider may charge interest at 1.5% per month on the unpaid amount from the due date until payment, and may suspend the Services after 15 days’ written notice until the dues are cleared.','Fees paid are not refundable, except where this Agreement says so.']],
   ['Responsibilities of the Customer',['The Customer shall give correct information, keep its login credentials safe, and be responsible for all activity under its logins.','The Customer is responsible for the lawful collection and use of the data of its employees, and for complying with labour, wage, PF, ESIC, tax and other laws that apply to it.','The Services are a tool. The Customer shall check the attendance, leave, payroll, statutory and performance results that the Services make before it relies on them. The Service Provider is not a statutory, tax or legal adviser to the Customer.']],
   ['Acceptable use',['The Customer shall not use the Services for any unlawful purpose, copy or resell them, try to break their security, reverse engineer them, or overload them.','The Customer shall not give access to a person who is not its employee or authorised consultant.']],
   ['Data protection and privacy',['For the personal data of the Customer’s employees, the Customer is the data fiduciary (controller) and the Service Provider is the data processor, under the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023, as and when they apply.','The Service Provider shall process Customer Data only to give the Services and as the Customer instructs, and shall keep it confidential.','The Service Provider shall keep reasonable security practices as described in Annexure B, shall allow only authorised persons to access Customer Data, and shall tell the Customer without undue delay if it learns of a breach of Customer Data.','The Customer allows the Service Provider to use cloud infrastructure providers to host the Services. The Service Provider remains responsible for them.']],
   ['Ownership, return and export of data',['Customer Data remains the property of the Customer. The Service Provider gets only a limited right to use it to give the Services.','During the term, and for 30 days after it ends, the Customer may ask for an export of its Customer Data. The return or export of Customer Data is subject to the Customer having cleared all dues to the Service Provider.','After the period in the clause above, and once the dues are cleared and the data is exported, the Service Provider may delete Customer Data, except what the law requires it to keep.']],
   ['Confidentiality',['Each party shall keep the other’s confidential information secret, use it only for this Agreement, and not tell it to anyone except those who need it and are bound to keep it secret.','This does not apply to information that is public without fault, already known, or required to be disclosed by law or by a court.','This clause continues for three years after this Agreement ends.']],
   ['Intellectual property',['The software, the KPI library, the templates, the documents and all other intellectual property of the Services belong to the Service Provider. Nothing in this Agreement transfers them to the Customer.','The Service Provider may use suggestions of the Customer to improve the Services, without payment.']],
   ['Support and availability',[`Support is given ${E(co.support||'during working hours')}.`,'The Service Provider shall use reasonable efforts to keep the Services available, but does not promise that they will be uninterrupted or without error. It may do planned maintenance and shall try to tell the Customer before it does.']],
   ['Warranties and disclaimer',['Each party has the power to enter into this Agreement.','Except as stated, the Services are given “as is”. The Service Provider does not give any other warranty to the extent the law allows.']],
   ['Limit of liability',['Neither party is liable to the other for any indirect, special or consequential loss, or for loss of profit or goodwill.','The total liability of the Service Provider for all claims under this Agreement shall not go beyond the Fees paid by the Customer in the 12 months before the claim.','Nothing in this Agreement limits a liability that the law does not allow to be limited, including for fraud or wilful misconduct.']],
   ['Indemnity',['The Customer shall protect the Service Provider against claims of third parties that come from the Customer’s unlawful use of the Services or from data that the Customer had no right to give.','The Service Provider shall protect the Customer against claims of third parties that the Services, as given, infringe their intellectual property in India.']],
   ['Suspension and termination',['Either party may end this Agreement by written notice if the other commits a material breach and does not put it right within 15 days of a written notice.','The Service Provider may suspend the Services as stated in the clause on fees.','On the end of this Agreement, all dues until the end date become payable at once, and the clause on data export applies. Clauses that by their nature continue shall continue.']],
   ['Force majeure',['Neither party is liable for delay or failure caused by an event beyond its reasonable control, such as natural disaster, war, government order, or failure of the internet or of a public utility. This does not excuse a payment already due.']],
   ['Notices',['Notices shall be in writing and sent to the addresses and email addresses in this Agreement, or to a new address given by notice. An email is a valid notice.']],
   ['Governing law and disputes',['This Agreement is governed by the laws of India.','The parties shall first try to settle a dispute by talking, within 30 days of one party’s written notice of the dispute.','If the dispute is not settled, it shall be referred to arbitration by a sole arbitrator appointed by mutual consent, under the Arbitration and Conciliation Act, 1996. The seat and venue of arbitration shall be Narayanpur, Chhattisgarh, and the language shall be English.','Subject to the above, the courts at Narayanpur, Chhattisgarh shall have exclusive jurisdiction.']],
   ['General',['This Agreement is the entire agreement of the parties about its subject, and replaces earlier talks. It may be changed only in writing signed by both parties.','Neither party may assign it without the other’s written consent, except to a successor of its whole business.','If a part of it is not valid, the rest continues. A delay in using a right is not a waiver of it.','The parties may sign this Agreement in counterparts and by electronic signature under the Information Technology Act, 2000.','Stamp duty, if any, shall be borne equally by the parties.']]
  ];
  return `<!doctype html><html><head><meta charset="utf-8"><title>Agreement ${E(q.no)}</title><style>${DOC_CSS}</style></head><body>
  ${draft?`<div class="wm">DRAFT</div><div class="dr">DRAFT FOR LEGAL REVIEW. Do not sign or send this text until the company’s advocate has reviewed it.</div>`:''}
  <h1>SOFTWARE AS A SERVICE (SaaS) SUBSCRIPTION AGREEMENT</h1><p style="text-align:center" class="sm">Quotation ${E(q.no)}</p>
  <p>This Agreement is made on <b>${E(p.date)}</b> at Narayanpur, Chhattisgarh, between:</p>
  <p><b>(1) ${E(co.legal)}</b>, having PAN ${E(co.pan||'')} and GSTIN ${E(co.gstin||'')}, with its registered office at ${E([co.address,co.state,co.pin].filter(Boolean).join(', '))}, acting through ${E(co.signName||'')}, ${E(co.signDesig||'')} (the “<b>Service Provider</b>”); and</p>
  <p><b>(2) ${E(cl.name)}</b>, a ${E(ptype)} having PAN ${E(ed.pan||'')} and GSTIN ${E(cl.gstin||'')}, with its registered office at ${E(cl.address||'')}, ${E(cl.state||'')}, acting through ${E(cl.person||'')}${ed.desig?', '+E(ed.desig):''} (the “<b>Customer</b>”).</p>
  <p>The Service Provider owns and runs Mirror-HR, a cloud-based human resource management software. The Customer wishes to subscribe to it on the terms of this Agreement and the accepted Quotation ${E(q.no)}. The parties agree as follows:</p>
  ${cl_.map((s,i)=>`<h2>${i+1}. ${E(s[0])}</h2>${s[1].map((t_,j)=>`<p>${i+1}.${j+1} ${t_}</p>`).join('')}`).join('')}
  <h2>Signatures</h2><table style="margin-top:4px"><tr><td style="width:50%"><b>For ${E(co.legal)}</b> (Service Provider)<br><br><br>Name: ${E(co.signName||'')}<br>Designation: ${E(co.signDesig||'')}<br>Date: ____________ Place: ____________</td><td><b>For ${E(cl.name)}</b> (Customer)<br><br><br>Name: ${E(cl.person||'')}<br>Designation: ${E(ed.desig||'')}<br>Date: ____________ Place: ____________</td></tr><tr><td>Witness 1 (name, signature): <span class="ln"></span></td><td>Witness 2 (name, signature): <span class="ln"></span></td></tr></table>
  <div class="pb"></div><h1>ANNEXURE A: COMMERCIAL TERMS</h1><table style="margin-top:8px"><tbody>
   <tr><th style="width:38%">Quotation</th><td>${E(q.no)} (accepted on ${E(p.date)})</td></tr><tr><th>Plan and modules</th><td>${E(d.plan)}: ${E(mods)}</td></tr>
   <tr><th>Billing cycle and term</th><td>${E(d.cycle)}; initial term ${d.term} month(s)</td></tr><tr><th>Fee per cycle (before GST)</th><td>₹ ${E(Number(d.base).toLocaleString('en-IN'))}, for up to ${d.incl} employees</td></tr>
   <tr><th>Extra employees</th><td>${d.rate?`₹ ${E(Number(d.rate).toLocaleString('en-IN'))} per extra employee per month`:'Not applicable'}; hard cap ${cap} employees</td></tr>
   <tr><th>One-time setup (before GST)</th><td>${d.setup?'₹ '+E(Number(d.setup).toLocaleString('en-IN')):'Nil'}</td></tr>
   <tr><th>GST</th><td>${c.rate}% (${c.igst?'IGST':'CGST + SGST'}); place of supply ${E(cl.state||'')}; SAC ${E(co.sac||'')}</td></tr>
   <tr><th>First invoice total</th><td>₹ ${E(Number(c.total).toLocaleString('en-IN'))}</td></tr><tr><th>Payment due</th><td>within ${pd} days of the invoice date</td></tr><tr><th>Support</th><td>${E(co.support||'')}</td></tr>
   <tr><th>Notices</th><td>Service Provider: ${E([co.address,co.state,co.pin].filter(Boolean).join(', '))}<br>Customer: ${E(cl.address||'')}${cl.email?' · '+E(cl.email):''}</td></tr></tbody></table>
  <h1 style="margin-top:26px">ANNEXURE B: DATA PROTECTION AND SECURITY</h1><ol class="sm" style="margin-top:8px">
   <li>Each company’s data is kept separate from the data of other companies on the platform, and is open only to the logins of that company.</li>
   <li>Access inside the Customer is by role (such as Admin, HR, manager and employee), as the Customer sets it.</li>
   <li>All connections to the Services use an encrypted (HTTPS) channel. Passwords are not stored in plain text.</li>
   <li>Important actions are written in an audit trail that the Customer can see.</li>
   <li>The primary database of the Services is currently located in India (Mumbai region) with a cloud infrastructure provider.</li>
   <li>The Service Provider can export a copy of the Customer’s data on request, as stated in the clause on data export.</li>
   <li>A suspected breach of Customer Data shall be told to the Customer without undue delay.</li></ol>
  </body></html>`}
function onboardingFormHtml(q,enq){const p=docPre(q,enq);p.q=q;const {co,d,cl,ed,E}=p, row=(l,v)=>`<tr><td style="width:34%">${l}</td><td>${v?E(v):'&nbsp;'}</td></tr>`, blank=n=>Array.from({length:n},()=>'<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>').join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>Onboarding form</title><style>${DOC_CSS}</style></head><body>${docHead(p,'CLIENT ONBOARDING FORM')}
  <p class="sm">To be filled by the client and returned to ${E(co.legal)}. Please write clearly. What is already filled in is what we have; please correct it if it is wrong.</p>
  <h2>1. Company</h2><table>${row('Legal name',cl.name)}${row('Brand / trade name',ed.trade)}${row('Type of company',ed.type)}${row('GSTIN',cl.gstin)}${row('PAN',ed.pan)}${row('CIN (companies)',ed.cin)}${row('Registered address',[cl.address,cl.state].filter(Boolean).join(', '))}</table>
  <h2>2. People</h2><table>${row('Authorised signatory (name, designation)',[cl.person,ed.desig].filter(Boolean).join(', '))}${row('Signatory mobile and email',[ed.mobile||enq.mobile,cl.email].filter(Boolean).join(' · '))}${row('Admin of Mirror-HR (name)','')}${row('Admin mobile and email','')}${row('Billing contact (name, mobile, email)',ed.bill?[ed.bill.name,ed.bill.mobile,ed.bill.email].filter(Boolean).join(', '):'')}${row('Support contact (name, mobile, email)',ed.support?[ed.support.name,ed.support.mobile,ed.support.email].filter(Boolean).join(', '):'')}</table>
  <h2>3. Branches</h2><table><thead><tr><th>Branch name</th><th>City, state</th><th>Employees</th><th>Branch head</th></tr></thead><tbody>${blank(5)}</tbody></table>
  <h2>4. Organisation structure</h2><table>${row('Functions (for example Sales, Accounts)','')}${row('Departments','')}${row('Divisions and sub-divisions','')}${row('Designations (list, with level)','')}${row('Reporting: who reports to whom (attach the chart)','')}</table>
  <h2 class="pb">5. Attendance, shifts and leave</h2><table>${row('Attendance method (biometric, mobile app, manual)','')}${row('Biometric make and model, if any','')}<tr><td>Shifts (name, start, end, grace minutes)</td><td>&nbsp;<br>&nbsp;<br>&nbsp;</td></tr>${row('Weekly off (day, or rotating)','')}${row('Holiday list (attach)','')}${row('Leave year (April–March or January–December)','')}${row('Leave types and yearly quota (CL, SL, EL, other)','')}${row('Late mark and half day rules','')}</table>
  <h2>6. Payroll and statutory</h2><table>${row('Salary cycle and pay date','')}${row('Salary structure (basic, HRA, allowances, as a note or attach)','')}<tr><td>PF applicable? Establishment code</td><td><span class="box"></span>Yes <span class="box"></span>No &nbsp; Code: <span class="ln"></span></td></tr><tr><td>ESIC applicable? Code</td><td><span class="box"></span>Yes <span class="box"></span>No &nbsp; Code: <span class="ln"></span></td></tr><tr><td>Professional tax applicable? State, registration no.</td><td><span class="box"></span>Yes <span class="box"></span>No &nbsp; No.: <span class="ln"></span></td></tr><tr><td>TDS on salary (TAN)</td><td><span class="box"></span>Yes <span class="box"></span>No &nbsp; TAN: <span class="ln"></span></td></tr>${row('Advance and loan rules, if any','')}</table>
  <h2>7. Employees and the start</h2><table>${row('Number of employees now',String(ed.employees||''))}${row('Modules to start with',p.mods.join(', '))}<tr><td>Employee list ready in Excel?</td><td><span class="box"></span>Yes <span class="box"></span>No, need help</td></tr>${row('Preferred go-live date',ed.start||'')}${row('Person for training (name, mobile)','')}${row('Anything else we should know','')}</table>
  <h2>Declaration</h2><p class="sm">I confirm that the information above is correct and that I am authorised to give it on behalf of the company.</p>
  <p style="margin-top:26px">Name: <span class="ln"></span> &nbsp; Designation: <span class="ln"></span> &nbsp; Signature and stamp: <span class="ln"></span> &nbsp; Date: <span class="ln" style="min-width:90px"></span></p></body></html>`}
function checklistHtml(q,enq){const p=docPre(q,enq);p.q=q;const {co,d,cl,E}=p, item=(a,w)=>`<tr><td style="width:26px"><span class="box"></span></td><td>${a}</td><td style="width:20%">${w}</td><td style="width:16%">&nbsp;</td></tr>`;
  const A=[['GST registration certificate and PAN card of the company','Client'],['Certificate of incorporation / partnership deed / registration proof (as applicable)','Client'],['ID of the authorised signatory, and a board resolution or authority letter if needed','Client'],['Signed agreement','Client'],['Filled onboarding form','Client'],['Organisation chart and the list of branches, departments and designations','Client'],['Employee master in Excel (code, name, mobile, gender, date of joining, designation, branch, manager, bank account, PAN, Aadhaar, UAN, ESIC no.)','Client'],['Salary details of each employee (CTC or salary structure) and the salary cycle','Client'],['PF, ESIC, professional tax and TAN registration details','Client'],['Shift timings, weekly off and the holiday list of the year','Client'],['Leave policy, attendance rules and other HR policies (to put in the Library)','Client'],['Biometric device details, if any','Client'],['Name and mobile of the person who will be the Admin, and of the person for training','Client']];
  const B=[['Quotation accepted','Mirror-HR team'],['Agreement signed and kept','Mirror-HR team'],['Client company created (Test)','Mirror-HR team'],['Modules given as per the quotation','Mirror-HR team'],['KPI pack built for the client','Mirror-HR team'],['Organisation structure imported','Mirror-HR team'],['Employees imported and checked with the client','Mirror-HR team'],['Roles and rights set','Mirror-HR team'],['Shifts, holiday calendar and attendance policy set','Mirror-HR team'],['Leave types and payroll settings set','Mirror-HR team'],['Training and handover to the client Admin','Mirror-HR team'],['Admin’s first login done and password changed','Client Admin'],['Client switched to Active (go live)','Mirror-HR team']];
  return `<!doctype html><html><head><meta charset="utf-8"><title>Checklist</title><style>${DOC_CSS}</style></head><body>${docHead(p,'ONBOARDING CHECKLIST')}
  <p class="sm">Plan: ${E(d.plan)} · Modules: ${E(p.mods.join(', '))} · Start: ${E(p.date)}</p>
  <h2>Part A: What we need from you</h2><table><thead><tr><th></th><th>Item</th><th>Who</th><th>Date given</th></tr></thead><tbody>${A.map(x=>item(E(x[0]),x[1])).join('')}</tbody></table>
  <h2 class="pb">Part B: Our setup steps</h2><table><thead><tr><th></th><th>Step</th><th>Owner</th><th>Date done</th></tr></thead><tbody>${B.map(x=>item(E(x[0]),x[1])).join('')}</tbody></table>
  <p class="sm" style="margin-top:14px">Contact for support: ${E(co.support||'')}. ${E(co.legal)}${co.signName?' · '+E(co.signName)+', '+E(co.signDesig||''):''}.</p></body></html>`}
function docOpen(kind,q,enq){const co=qCo();if(!(co.legal||'').trim()){toast(L('Write the legal name of the company in Our details first','पहले Our details में कंपनी का कानूनी नाम लिखें'));return}
  printHtml(kind==='agreement'?agreementHtml(q,enq):kind==='form'?onboardingFormHtml(q,enq):checklistHtml(q,enq))}
/* the steps of onboarding */
const ONB_DOCS=[['agreement_sent','Agreement','एग्रीमेंट','agreement'],['form_sent','Onboarding form','ऑनबोर्डिंग फ़ॉर्म','form'],['checklist_sent','Checklist','चेकलिस्ट','checklist']];
const ONB_SETUP=[['s_modules','Modules assigned','मॉड्यूल असाइन किए'],['s_kpi','KPI pack built','KPI पैक बना'],['s_org','Org structure imported','ऑर्ग स्ट्रक्चर इम्पोर्ट'],['s_emps','Employees imported','कर्मचारी इम्पोर्ट'],['s_rights','Roles and rights set','रोल और अधिकार तय'],['s_shifts','Shifts and policies set','शिफ़्ट और नीतियाँ तय'],['s_training','Training and handover done','ट्रेनिंग और हैंडओवर पूरा'],['s_login','Admin first login done','एडमिन का पहला लॉगिन हुआ']];
const ONB_ALL=['agreement_sent','form_sent','checklist_sent','agreement_signed','form_received','live',...ONB_SETUP.map(x=>x[0]),'s_active'];
const stepOf=(eid,k)=>(ENQ.steps||[]).find(s=>s.enquiry_id===eid&&s.key===k);
const accQ=eid=>ENQ.q.find(x=>x.enquiry_id===eid&&x.status==='accepted');
const onbDone=eid=>1+ONB_ALL.filter(k=>stepOf(eid,k)).length, onbTotal=1+ONB_ALL.length;
function onbStage(r){if(stepOf(r.id,'s_active'))return [L('Live','लाइव'),'p-ok'];if(r.status==='live')return [L('Setting up (Test)','सेटअप (Test)'),'p-teal'];if(r.status==='signed')return [L('Ready to make live','Make live के लिए तैयार'),'p-teal'];return [L('Waiting for signed agreement','साइन एग्रीमेंट का इंतज़ार'),'p-warn']}
function onbTab(){const rows=ENQ.rows.filter(r=>accQ(r.id));
  return `<div class="page-h"><div><h1>${L('Onboarding','ऑनबोर्डिंग')}</h1><p>${L('Clients whose quotation is accepted: the documents, the signed agreement, making the client live, and the setup steps.','जिनकी कोटेशन स्वीकार हो गई: दस्तावेज़, साइन एग्रीमेंट, क्लाइंट को लाइव करना और सेटअप के चरण।')}</p></div></div>
  <div class="card tw"><table class="tbl"><thead><tr><th>${L('Company','कंपनी')}</th><th>${L('Quotation','कोटेशन')}</th><th>${L('Stage','चरण')}</th><th>${L('Progress','प्रगति')}</th><th></th></tr></thead><tbody>${rows.map(r=>{const q=accQ(r.id), st=onbStage(r), n=onbDone(r.id);return `<tr><td><b>${esc((r.data||{}).legal)}</b></td><td>${esc(q.no)}</td><td><span class="pill ${st[1]}">${st[0]}</span></td><td><span style="display:inline-block;width:110px;height:6px;border-radius:3px;background:var(--line);vertical-align:middle"><i style="display:block;height:100%;width:${Math.round(n/onbTotal*100)}%;background:var(--teal);border-radius:3px"></i></span> ${n} / ${onbTotal}</td><td style="text-align:right"><button class="btn btn-o btn-s" data-onbopen="${r.id}">${L('Open','खोलें')}</button></td></tr>`}).join('')||`<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:22px">${L('No client yet. A quotation that is accepted comes here.','अभी कोई क्लाइंट नहीं। स्वीकार हुई कोटेशन यहाँ आती है।')}</td></tr>`}</tbody></table></div>`}
function onbOpen(eid){const r=ENQ.rows.find(x=>x.id===eid), q=accQ(eid);if(!r||!q)return;const adm=!LIVE.salesOnly, d=r.data||{};
  const tick=(k,label,o={})=>{const s=stepOf(eid,k), can=o.admin?adm:true, lock=o.lock;return `<div style="display:grid;grid-template-columns:24px 1fr;gap:10px;padding:7px 0;border-top:1px solid var(--line);align-items:start"><button type="button" ${can&&!lock?`data-onbt="${k}"`:'disabled'} style="width:20px;height:20px;border-radius:5px;border:1.5px solid ${s?'var(--teal)':'var(--line)'};background:${s?'var(--teal)':'transparent'};color:#fff;font-size:12px;cursor:${can&&!lock?'pointer':'default'};padding:0">${s?'✓':''}</button><div style="font-size:13px">${label}${s?`<div style="font-size:11.5px;color:var(--muted)">${fmtS(s.done_at.slice(0,10))} · ${esc(s.done_by||'')}${s.note?' · '+esc(s.note):''}</div>`:''}${o.extra||''}</div></div>`};
  const live=r.status==='live'||!!r.client_id, signed=!!stepOf(eid,'agreement_signed');
  const bg=openModal(`<h3>${esc(d.legal)} · ${esc(q.no)}</h3>
   <div style="display:grid;grid-template-columns:24px 1fr;gap:10px;padding:7px 0;align-items:start"><span style="width:20px;height:20px;border-radius:5px;background:var(--teal);color:#fff;font-size:12px;text-align:center;line-height:20px">✓</span><div style="font-size:13px">${L('Quotation accepted','कोटेशन स्वीकार')}<div style="font-size:11.5px;color:var(--muted)">${fmtS((q.accepted_at||'').slice(0,10))} · ${esc(q.accepted_by||'')}</div></div></div>
   ${ONB_DOCS.map(([k,en,hi,kind])=>tick(k,`${L(en,hi)} ${L('sent to the client','क्लाइंट को भेजा')}`,{extra:`<div style="margin-top:3px"><button type="button" class="btn btn-o btn-s" data-doc="${kind}">${L('PDF','PDF')}</button></div>`})).join('')}
   ${tick('agreement_signed',L('Signed agreement received','साइन एग्रीमेंट मिला'),{admin:1,lock:live})}${tick('form_received',L('Filled onboarding form received','भरा ऑनबोर्डिंग फ़ॉर्म मिला'))}${tick('advance',`${L('Advance payment received','एडवांस मिला')} <span style="color:var(--muted)">(${L('optional','वैकल्पिक')})</span>`,{admin:1})}
   <div style="display:grid;grid-template-columns:24px 1fr;gap:10px;padding:7px 0;border-top:1px solid var(--line);align-items:start"><span style="width:20px;height:20px;border-radius:5px;border:1.5px solid ${live?'var(--teal)':'var(--line)'};background:${live?'var(--teal)':'transparent'};color:#fff;font-size:12px;text-align:center;line-height:18px">${live?'✓':''}</span><div style="font-size:13px">${L('Client created (Make live)','क्लाइंट बना (Make live)')}${live?(()=>{const s=stepOf(eid,'live');return s?`<div style="font-size:11.5px;color:var(--muted)">${fmtS(s.done_at.slice(0,10))} · ${esc(s.done_by||'')} · ${esc(s.note||'')}</div>`:''})():(adm?`<div style="margin-top:3px"><button type="button" class="btn ${signed?'btn-p':'btn-o'} btn-s" data-onblive ${signed?'':'disabled'}>${L('Make live','Make live')}</button>${signed?'':` <small style="color:var(--muted)">${L('Tick the signed agreement first','पहले साइन एग्रीमेंट टिक करें')}</small>`}</div>`:`<div style="font-size:11.5px;color:var(--muted)">${L('Only the platform admin','सिर्फ़ प्लेटफ़ॉर्म एडमिन')}</div>`)}</div></div>
   <div style="font-size:12px;font-weight:500;color:var(--muted);margin:10px 0 0">${L('Setup checklist','सेटअप चेकलिस्ट')}</div>
   ${ONB_SETUP.map(([k,en,hi])=>tick(k,L(en,hi),{lock:!live})).join('')}
   <div style="display:grid;grid-template-columns:24px 1fr;gap:10px;padding:7px 0;border-top:1px solid var(--line);align-items:start"><span style="width:20px;height:20px;border-radius:5px;border:1.5px solid ${stepOf(eid,'s_active')?'var(--teal)':'var(--line)'};background:${stepOf(eid,'s_active')?'var(--teal)':'transparent'};color:#fff;font-size:12px;text-align:center;line-height:18px">${stepOf(eid,'s_active')?'✓':''}</span><div style="font-size:13px">${L('Switched to Active (go live)','Active किया (गो-लाइव)')}${stepOf(eid,'s_active')?'':(adm&&live?`<div style="margin-top:3px"><button type="button" class="btn btn-p btn-s" data-onbact>${L('Make Active','Active करें')}</button></div>`:'')}</div></div>
   <div id="me" style="color:var(--bad);font-size:12px;margin-top:6px"></div><div class="acts"><button type="button" class="btn btn-o" data-close>${L('Close','बंद करें')}</button></div>`,()=>{});
  if(!bg)return;const err=m=>{const e=bg.querySelector('#me');if(e)e.textContent=m};
  bg.querySelectorAll('[data-doc]').forEach(b=>b.onclick=()=>docOpen(b.dataset.doc,q,r));
  bg.querySelectorAll('[data-onbt]').forEach(b=>b.onclick=async()=>{const k=b.dataset.onbt, x=await sb.rpc('onboarding_step',{p_enquiry:eid,p_key:k,p_done:!stepOf(eid,k),p_note:null});if(x.error)return err(x.error.message);await enqLoad();bg.remove();render();onbOpen(eid)});
  const lv=bg.querySelector('[data-onblive]');if(lv)lv.onclick=()=>{bg.remove();onbLiveModal(r,q)};
  const ac=bg.querySelector('[data-onbact]');if(ac)ac.onclick=()=>{bg.remove();enqConfirm(L('Make Active','Active करें'),L('The client company is switched from Test to Active. Do this when the setup is done and the client is ready to start.','क्लाइंट कंपनी Test से Active हो जाती है। यह तब करें जब सेटअप हो गया हो और क्लाइंट शुरू करने को तैयार हो।'),L('Make Active','Active करें'),()=>sb.rpc('enquiry_activate',{p_enquiry:eid}))}}
function onbLiveModal(r,q){const d=q.data, cl=d.client||{}, lim=hardOf(d.incl,d.hardPct), mods=MODS.filter(m=>d.mods[m.id]).map(m=>L(...m.name)).join(', '), code0=(cl.name||'').toLowerCase().replace(/(private|pvt|limited|ltd|llp|company|co)\b/g,'').replace(/[^a-z0-9]+/g,'').slice(0,20);
  openModal(`<h3>${L('Make live','Make live')} · ${esc(cl.name)}</h3><div class="fgrid"><div><label>${L('Company code (for login)','कंपनी कोड (लॉगिन के लिए)')} *</label><input class="inp" name="code" value="${esc(code0)}" placeholder="darshanam"></div><div><label>${L('Employee limit (hard cap)','कर्मचारी सीमा (पक्की रोक)')}</label><input class="inp" value="${lim}" disabled></div></div>
   <p style="font-size:12px;color:var(--muted);margin:6px 0">${L('Modules from the quotation','कोटेशन के मॉड्यूल')}: ${esc(mods)}</p><h4 style="margin:10px 0 4px">${L('First admin of the company','कंपनी का पहला एडमिन')}</h4>
   <div class="fgrid"><div><label>${L('Name','नाम')} *</label><input class="inp" name="an" value="${esc(cl.person||'')}"></div><div><label>${L('Employee code','कर्मचारी कोड')} *</label><input class="inp" name="ac" value="E001"></div><div><label>${L('Mobile','मोबाइल')} *</label><input class="inp" name="am" maxlength="10" value="${esc(r.mobile||'')}"></div><div><label>${L('First password (at least 8 characters)','पहला पासवर्ड (कम से कम 8 अक्षर)')} *</label><input class="inp" name="pw"></div></div>
   <p style="font-size:12px;color:var(--muted)">${L('The client starts in Test. Switch it to Active after the setup is done. The admin must change the password at the first sign-in. Tell it only to that person.','क्लाइंट Test में शुरू होता है। सेटअप के बाद Active करें। एडमिन को पहले साइन-इन पर पासवर्ड बदलना होगा। यह सिर्फ़ उसी व्यक्ति को बताएँ।')}</p><div id="me" style="color:var(--bad);font-size:12px"></div><div class="acts"><button type="button" class="btn btn-o" data-close>${t('cancel')}</button><button class="btn btn-p">${L('Create client','क्लाइंट बनाएँ')}</button></div>`,
  async(f,close,bg)=>{const v=Object.fromEntries(new FormData(f)), er=m=>{(bg||document).querySelector('#me').textContent=m};if(!v.code.trim()||!v.an.trim()||!v.ac.trim()||!v.am.trim()||!v.pw)return er(t('e_req'));
   const x=await sb.rpc('enquiry_make_live',{p_enquiry:r.id,p_code:v.code.trim(),p_admin_name:v.an.trim(),p_admin_code:v.ac.trim(),p_admin_mobile:v.am.trim(),p_password:v.pw});if(x.error)return er(x.error.message);close();toast(L('Client created in Test. Now set it up and make its KPI pack.','क्लाइंट Test में बना। अब इसे सेटअप करें और KPI पैक बनाएँ।'));await enqLoad();render();onbOpen(r.id)})}
try{PAGEFN.enquiries=()=>enquiriesPage()}catch(e){}
try{const _phE=placeholder;placeholder=function(P){return P==='enquiries'?enquiriesPage():_phE.apply(this,arguments)}}catch(e){}
{const _bxE=bindExtra;bindExtra=function(){_bxE.apply(this,arguments);if(state.page!=='enquiries')return;const m=document.getElementById('main');if(!m)return;
  m.querySelectorAll('[data-enqf]').forEach(b=>b.onclick=()=>{ENQ.f=b.dataset.enqf;render()});
  m.querySelectorAll('[data-enqtab]').forEach(b=>b.onclick=()=>{ENQ.tab=b.dataset.enqtab;render()});
  m.querySelectorAll('[data-qf]').forEach(b=>b.onclick=()=>{ENQ.qf=b.dataset.qf;render()});
  m.querySelectorAll('[data-qopen]').forEach(b=>b.onclick=()=>quoteView(b.dataset.qopen));
  m.querySelectorAll('[data-onbopen]').forEach(b=>b.onclick=()=>onbOpen(b.dataset.onbopen));
  m.querySelectorAll('#ourf').forEach(f=>f.onsubmit=e=>{e.preventDefault();ourSave(f)});
  m.querySelectorAll('[data-enqopen]').forEach(b=>b.onclick=()=>enqOpen(b.dataset.enqopen));
  m.querySelectorAll('[data-enqcopy]').forEach(b=>b.onclick=()=>{try{navigator.clipboard.writeText(enqLink())}catch(x){}toast(L('Link copied','लिंक कॉपी हुआ'))});
  m.querySelectorAll('[data-enqsales]').forEach(b=>b.onclick=enqSalesModal);
  m.querySelectorAll('[data-enqadd]').forEach(b=>b.onclick=enqAddModal);
  m.querySelectorAll('[data-enqstog]').forEach(b=>b.onclick=async()=>{const s=ENQ.sales.find(x=>x.user_id===b.dataset.enqstog);if(!s)return;const r=await sb.rpc('platform_set_sales_active',{p_user:s.user_id,p_active:!s.active});if(r.error)return toast(r.error.message);s.active=!s.active;toast(t('saved'));render()})}}
{const _rE=render;render=function(){if(state.role==='platform'&&state.page==='licensing')state.page='enquiries';if(LIVE.salesOnly&&state.role==='platform'&&state.page!=='enquiries')state.page='enquiries';return _rE.apply(this,arguments)}}
/* the public form: the client sees no price and no quotation */
function renderEnquiry(el){const mods=(typeof MODS!=='undefined'?MODS:[]), sts=INDIA_STATES;
 const inp=(n,l,o={})=>`<div><label>${l}${o.req?' *':''}</label><input class="inp" name="${n}" ${o.max?`maxlength="${o.max}"`:''} ${o.type?`type="${o.type}"`:''} ${o.ph?`placeholder="${o.ph}"`:''} ${o.mode?`inputmode="${o.mode}"`:''} ${o.up?'style="text-transform:uppercase"':''}></div>`;
 el.innerHTML=`<div style="max-width:700px;margin:0 auto;padding:24px 16px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><h1 style="margin:0;flex:1">Mirror-HR · ${L('Tell us about your company','अपनी कंपनी के बारे में बताएँ')}</h1></div><p style="color:var(--muted);margin:0 0 16px">${L('Please fill this form. Our team will check it and contact you.','कृपया यह फ़ॉर्म भरें। हमारी टीम जाँचकर आपसे संपर्क करेगी।')}</p>
 <div class="card" id="enqForm"><form id="enqf" novalidate>
  <h3 style="margin-top:0">${L('Company','कंपनी')}</h3><div class="fgrid">${inp('legal',L('Legal name (as per GST)','कानूनी नाम (GST के अनुसार)'),{req:1,max:150})}${inp('trade',L('Trade name (if different)','ट्रेड नाम (अलग हो तो)'),{max:150})}
   <div><label>${L('Type of company','कंपनी का प्रकार')}</label><select class="inp" name="type">${ENQ_TYPES.map(x=>`<option>${x}</option>`).join('')}</select></div>${inp('gstin','GSTIN',{req:1,max:15,up:1,ph:'27ABCDE1234F1Z5'})}${inp('pan','PAN',{req:1,max:10,up:1,ph:'ABCDE1234F'})}${inp('cin',L('CIN (companies only)','CIN (सिर्फ़ कंपनियाँ)'),{max:21,up:1})}</div>
  <label>${L('Registered address','पंजीकृत पता')} *</label><textarea class="inp" name="address" rows="2"></textarea><div class="fgrid"><div><label>${L('State','राज्य')} *</label><select class="inp" name="state">${sts.map(s=>`<option>${s}</option>`).join('')}</select></div>${inp('pin','PIN',{max:6,mode:'numeric'})}</div>
  <h3>${L('People','लोग')}</h3><div class="fgrid">${inp('person',L('Authorised person (who signs)','अधिकृत व्यक्ति (जो हस्ताक्षर करेगा)'),{req:1,max:80})}${inp('desig',L('Designation','पद'),{max:60})}${inp('mobile',L('Mobile','मोबाइल'),{req:1,max:10,mode:'numeric'})}${inp('email','Email',{req:1,max:120,type:'email'})}</div>
  <div class="fgrid">${inp('bn',L('Billing contact: name','बिलिंग संपर्क: नाम'),{max:80})}${inp('bm',L('Billing contact: mobile','बिलिंग संपर्क: मोबाइल'),{max:10,mode:'numeric'})}${inp('be',L('Billing contact: email','बिलिंग संपर्क: ईमेल'),{max:120})}</div>
  <div class="fgrid">${inp('sn',L('Support contact: name','सपोर्ट संपर्क: नाम'),{max:80})}${inp('sm',L('Support contact: mobile','सपोर्ट संपर्क: मोबाइल'),{max:10,mode:'numeric'})}${inp('se',L('Support contact: email','सपोर्ट संपर्क: ईमेल'),{max:120})}</div>
  <h3>${L('What you need','आपकी ज़रूरत')}</h3><div class="fgrid">${inp('employees',L('Number of employees','कर्मचारियों की संख्या'),{req:1,type:'number'})}${inp('branches',L('Number of branches','शाखाओं की संख्या'),{type:'number'})}${inp('start',L('Preferred start date','पसंदीदा शुरुआत की तारीख़'),{type:'date'})}</div>
  <label>${L('Which modules do you need?','आपको कौन से मॉड्यूल चाहिए?')}</label><div style="display:flex;flex-wrap:wrap;gap:6px 14px">${mods.map(m=>`<label style="margin:0;font-weight:400;display:flex;gap:6px"><input type="checkbox" name="mod" value="${m.id}"> ${L(...m.name)}</label>`).join('')}</div>
  <label>${L('Anything else we should know','और कुछ जो हमें जानना चाहिए')}</label><textarea class="inp" name="note" rows="3" maxlength="1000"></textarea>
  <div style="position:absolute;left:-9999px" aria-hidden="true"><input name="website" tabindex="-1" autocomplete="off"></div>
  <div id="enqe" style="color:var(--bad);font-size:13px;margin-top:8px"></div><div class="acts"><button class="btn btn-p">${L('Submit','भेजें')}</button></div></form></div></div>`;
 const f=el.querySelector('#enqf');f.onsubmit=async e=>{e.preventDefault();const fd=new FormData(f),v=Object.fromEntries(fd),er=m=>{el.querySelector('#enqe').textContent=m};
  const s=x=>(x||'').trim(), c3=(n,m,e_)=>({name:s(v[n]),mobile:s(v[m]),email:s(v[e_])});
  if(!s(v.legal)||!s(v.address)||!s(v.person))return er(L('Company name, address and the authorised person are required','कंपनी का नाम, पता और अधिकृत व्यक्ति ज़रूरी हैं'));
  if(!/^[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z][1-9A-Za-z]Z[0-9A-Za-z]$/.test(s(v.gstin)))return er(L('GSTIN looks wrong (like 27ABCDE1234F1Z5)','GSTIN ग़लत लग रहा है (जैसे 27ABCDE1234F1Z5)'));
  if(!/^[A-Za-z]{5}[0-9]{4}[A-Za-z]$/.test(s(v.pan)))return er(L('PAN looks wrong (like ABCDE1234F)','PAN ग़लत लग रहा है (जैसे ABCDE1234F)'));
  if(!/^[6-9][0-9]{9}$/.test(s(v.mobile)))return er(L('Enter a 10 digit mobile number','10 अंकों का मोबाइल नंबर भरें'));
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s(v.email)))return er(L('Enter a valid email','सही ईमेल भरें'));
  if(!(+v.employees>=1))return er(L('Enter the number of employees','कर्मचारियों की संख्या भरें'));
  const p={legal:s(v.legal),trade:s(v.trade),type:v.type,gstin:s(v.gstin).toUpperCase(),pan:s(v.pan).toUpperCase(),cin:s(v.cin).toUpperCase(),address:s(v.address),state:v.state,pin:s(v.pin),person:s(v.person),desig:s(v.desig),mobile:s(v.mobile),email:s(v.email),bill:c3('bn','bm','be'),support:c3('sn','sm','se'),employees:+v.employees,branches:+v.branches||0,start:v.start||'',mods:fd.getAll('mod'),note:s(v.note)};
  const btn=f.querySelector('.btn-p');btn.disabled=true;let r;try{r=await sb.rpc('submit_enquiry',{p,hp:v.website||''})}catch(x){r={error:x}}btn.disabled=false;
  if(r.error)return er(r.error.message||L('Could not send. Please try again.','भेज नहीं सके। कृपया फिर कोशिश करें।'));
  el.querySelector('#enqForm').innerHTML=`<h3 style="margin-top:0">${L('Thank you','धन्यवाद')}, ${esc(p.person)}</h3><p>${L('We have received your details. Our team will contact you.','हमें आपकी जानकारी मिल गई। हमारी टीम आपसे संपर्क करेगी।')}</p><p style="color:var(--muted);font-size:13px">${L('Reference','संदर्भ')}: ${esc(r.data)}</p>`}}
function enquiryBoot(){const on=location.hash.startsWith('#enquiry');let el=document.getElementById('enquiryPub');if(!on){if(el)el.remove();return}
 if(!el){el=document.createElement('div');el.id='enquiryPub';el.style.cssText='position:fixed;inset:0;z-index:9999;overflow:auto;background:var(--bg,#f4f7f6)';document.body.appendChild(el)}renderEnquiry(el)}
window.addEventListener('hashchange',enquiryBoot);
try{joinBoot();careersBoot();enquiryBoot()}catch(e){console.warn('public pages',e)}
})();
