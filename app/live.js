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
function toRow(kind,o){const M=LIVE.map, c=LIVE.profile.client_id;
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
  const pick=(kind,rows,keyOf,build)=>{const old=DATA[kind].slice(), used=new Set();let next=Math.max(0,...old.map(x=>+x.id||0))+1;const out=[];
    rows.forEach(r=>{let o=old.find(x=>!used.has(x.id)&&keyOf(x)===keyOf(r));let id;if(o){id=o.id;used.add(id)}else{id=next++;o={id}}
      LIVE.map[kind][id]=r.id;LIVE.rev[kind][r.id]=id;out.push({o,r,id})});
    out.forEach(x=>build(x.o,x.r));DATA[kind].length=0;out.forEach(x=>DATA[kind].push(x.o))};
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
  try{if(typeof accSync==='function')accSync()}catch(e){}
}

/* ---------- save what changed ---------- */
async function syncNow(){
  if(!LIVE.on||!isHRrole())return;
  if(LIVE.busy){LIVE.queued=true;return}
  LIVE.busy=true;let n=0;
  try{
    for(const k of KINDS){const t=TBL[k];
      for(const o of DATA[k]){const s=sig(k,o);if(LIVE.snap[k][o.id]===s)continue;
        const row=toRow(k,o);let uuid=LIVE.map[k][o.id];
        if(uuid){const r=await sb.from(t).update(row).eq('id',uuid);if(r.error)throw r.error}
        else{const r=await sb.from(t).insert(row).select('id').single();if(r.error)throw r.error;uuid=r.data.id;LIVE.map[k][o.id]=uuid;LIVE.rev[k][uuid]=o.id}
        if(k==='emps'){const r=await sb.from('employee_private').upsert({employee_id:uuid,...toPriv(o)});if(r.error)throw r.error}
        LIVE.snap[k][o.id]=sig(k,o);n++}}
    /* a manager set before the manager was saved: fill it now */
    for(const o of DATA.emps){if(o.mgr&&LIVE.map.emps[+o.mgr]){const s=sig('emps',o);if(LIVE.snap.emps[o.id]!==s){await sb.from('employees').update({manager_id:LIVE.map.emps[+o.mgr]}).eq('id',LIVE.map.emps[o.id]);LIVE.snap.emps[o.id]=s}}}
    LIVE.err='';
  }catch(e){LIVE.err=(e&&e.message)||String(e);console.error('LIVE sync',e);try{toast('Not saved to the database: '+LIVE.err)}catch(x){}}
  finally{LIVE.busy=false;if(LIVE.queued){LIVE.queued=false;setTimeout(syncNow,50)}}
  if(n){try{await sb.from('audit_log').insert({client_id:LIVE.profile.client_id,user_id:LIVE.profile.user_id,module:'Sync',action:'Saved',subject:n+' record(s)',detail:''})}catch(e){}}
}
let syncT=null;const schedule=()=>{clearTimeout(syncT);syncT=setTimeout(syncNow,600)};

/* ---------- the note at the top of each page ---------- */
const LIVE_PAGES=['employees','profile','setup','org','workforce','cockpit'];
function note(){const m=document.getElementById('main');if(!m||!LIVE.on||LIVE.platform)return;let n=document.getElementById('liveNote');
  const live=LIVE_PAGES.includes(state.page);
  const txt=live?L('Live: employee and organisation data on this page is saved in the database.','लाइव: इस पेज का कर्मचारी और संगठन डेटा डेटाबेस में सेव होता है।')
    :L('This module is not connected to the database yet: it shows sample data and changes are not saved. Employees and organisation are live.','यह मॉड्यूल अभी डेटाबेस से नहीं जुड़ा: इसमें नमूना डेटा है और बदलाव सेव नहीं होते। कर्मचारी और संगठन लाइव हैं।');
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
  await loadLive();LIVE.on=true;
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
  catch(e){try{Object.keys(localStorage).filter(k=>k.startsWith('sb-')).forEach(k=>localStorage.removeItem(k))}catch(x){}}})();
})();
