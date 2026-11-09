/* ================= LV People · HR Assistant =================
   A separate module: it only adds things, it changes nothing that exists.
   1. Policy Management (Admin and HR): upload policies, versions, publish, archive, Test Chat, Unanswered Questions, Chat Logs.
   2. HR Assistant: a chat button on every page for every signed-in employee. Answers come only from the company's own policies.
   The work is done by the server function "policy-assistant" (supabase/functions/policy-assistant) and the tables of server/policy_assistant.sql.
   The module is on for a company when its modules list has 'policy' (Clients (live) > the company > Modules). */
(function(){
if(typeof NAV==='undefined'||typeof LIVE==='undefined')return;
const sb=()=>LIVE.sb;
const uid=()=>LIVE.profile&&LIVE.profile.user_id;
const isHR=()=>['admin','hr'].includes(state.role);
const CATS=[['Leave','छुट्टी'],['Attendance','हाज़िरी'],['Salary','वेतन'],['Conduct','आचरण'],['Travel','यात्रा'],['Holiday','अवकाश'],['Benefits','सुविधाएँ'],['Safety','सुरक्षा'],['IT','IT'],['Exit','एक्ज़िट'],['Other','अन्य']];
const ROLES=[['employee','Employee','कर्मचारी'],['manager','Manager','मैनेजर'],['hr','HR','HR'],['admin','Admin','एडमिन']];
const catName=c=>{const x=CATS.find(k=>k[0]===c);return x?L(x[0],x[1]):c};
const roleName=r=>{const x=ROLES.find(k=>k[0]===r);return x?L(x[1],x[2]):r};
const dtS=s=>s?new Date(s).toLocaleString(lang==='hi'?'hi-IN':'en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'';
const dS=s=>s?new Date(s).toLocaleDateString(lang==='hi'?'hi-IN':'en-IN',{day:'2-digit',month:'short',year:'numeric'}):'';
const ymd=d=>{const x=new Date(d);x.setMinutes(x.getMinutes()-x.getTimezoneOffset());return x.toISOString().slice(0,10)};
const deptList=()=>{try{return (DATA.depts||[]).filter(d=>!d.off&&LIVE.map.depts[d.id]).map(d=>({uuid:LIVE.map.depts[d.id],name:d.name}))}catch(e){return []}};
const deptName=u=>{try{const n=LIVE.rev.depts[u];const d=DATA.depts.find(x=>x.id===n);return d?d.name:''}catch(e){return ''}};
const empOf=u=>{try{const n=LIVE.rev.emps[u];return DATA.emps.find(x=>x.id===n)||null}catch(e){return null}};
const userName=u=>{try{for(const [eid,p] of Object.entries(LIVE.prof||{})){if(p&&p.user_id===u){const e=DATA.emps.find(x=>x.id===+eid);if(e)return e.name}}}catch(e){}return ''};
const NOT_FOUND='Is vishay par company policy me jaankari uplabdh nahi hai. Kripya HR vibhag se sampark karein.';

/* the server function */
async function pa(body){
  let r;try{r=await sb().functions.invoke('policy-assistant',{body})}catch(e){throw new Error(L('No internet. Please try again.','इंटरनेट नहीं है। फिर कोशिश करें।'))}
  if(r.error){let m=r.error.message||'';try{const j=await r.error.context.json();if(j&&j.message)m=j.message}catch(e){}throw new Error(m||L('Something went wrong. Please try again.','कुछ गड़बड़ हुई। फिर कोशिश करें।'))}
  return r.data}

/* ---------- styles (the app's own colours and shapes) ---------- */
{const st=document.createElement('style');st.textContent=`
.ps-fab{position:fixed;right:calc(18px + env(safe-area-inset-right,0px));bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:35;display:flex;align-items:center;gap:8px;background:var(--teal);color:#fff;border-radius:28px;padding:11px 16px 11px 13px;font-weight:600;font-size:14px;box-shadow:0 6px 20px rgba(15,118,110,.35)}
.ps-fab:hover{background:var(--teal-d)}.ps-fab svg{width:20px;height:20px}
.ps-win{position:fixed;right:calc(18px + env(safe-area-inset-right,0px));bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:36;width:390px;height:min(620px,calc(100vh - 36px));height:min(620px,calc(100dvh - 36px));background:var(--card);border:1px solid var(--line);border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.22);display:flex;flex-direction:column;overflow:hidden}
.ps-head{background:var(--teal);color:#fff;padding:12px 12px 12px 14px;display:flex;align-items:center;gap:10px}
.ps-head b{display:block;font-size:15px}.ps-head small{opacity:.85;font-size:11.5px}
.ps-head button{color:#fff;opacity:.9;padding:6px 8px;border-radius:8px;font-size:12.5px;font-weight:600}.ps-head button:hover{background:rgba(255,255,255,.15);opacity:1}
.ps-av{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.2);display:grid;place-items:center;font-weight:700;flex:none}
.ps-body{flex:1;overflow-y:auto;padding:14px 12px;display:flex;flex-direction:column;gap:10px;background:var(--bg);overscroll-behavior:contain}
.ps-msg{padding:9px 12px;border-radius:13px;max-width:88%;line-height:1.5;font-size:13.5px;word-wrap:break-word}
.ps-bot{background:var(--card);border:1px solid var(--line);border-top-left-radius:4px;align-self:flex-start}
.ps-me{background:var(--teal);color:#fff;border-top-right-radius:4px;align-self:flex-end;white-space:pre-wrap}
.ps-no{background:var(--warn-l);border-color:transparent}
.ps-err{background:var(--bad-l);border-color:transparent;color:var(--bad)}
.ps-chips{display:flex;flex-wrap:wrap;gap:6px}
.ps-chip{border:1px solid var(--teal);color:var(--teal);background:var(--card);border-radius:16px;padding:4px 11px;font-size:12.5px;text-align:left}.ps-chip:hover{background:var(--teal-l)}
.ps-src{display:inline-flex;align-items:center;gap:5px;background:var(--teal-l);color:var(--teal);font-size:11.5px;font-weight:600;padding:3px 9px;border-radius:14px;margin:8px 6px 0 0;text-align:left}.ps-src:hover{filter:brightness(.96)}
.ps-fb{display:flex;gap:6px;margin-top:7px;align-items:center;font-size:12px;color:var(--muted)}
.ps-fb button{border:1px solid var(--line);border-radius:7px;padding:1px 7px;background:var(--bg);font-size:13px}.ps-fb button.on{border-color:var(--teal);background:var(--teal-l)}
.ps-typing{display:flex;gap:4px;padding:12px 14px}.ps-typing i{width:7px;height:7px;border-radius:50%;background:var(--muted);animation:psb 1.2s infinite}
.ps-typing i:nth-child(2){animation-delay:.2s}.ps-typing i:nth-child(3){animation-delay:.4s}
@keyframes psb{0%,60%,100%{opacity:.25}30%{opacity:1}}@media(prefers-reduced-motion:reduce){.ps-typing i{animation:none}}
.ps-foot{border-top:1px solid var(--line);padding:9px 10px calc(9px + env(safe-area-inset-bottom,0px));background:var(--card);display:grid;gap:6px}
.ps-in{display:flex;gap:8px;align-items:flex-end}.ps-in textarea{flex:1;resize:none;border:1px solid var(--line);border-radius:18px;padding:9px 14px;background:var(--bg);color:var(--text);font:inherit;font-size:14px;max-height:110px;min-height:40px}
.ps-in button{background:var(--teal);color:#fff;border-radius:18px;padding:9px 15px;font-weight:600;font-size:13px}.ps-in button:disabled{opacity:.5}
.ps-disc{font-size:11px;color:var(--muted);text-align:center}
.ps-meta{font-size:11px;color:var(--muted);margin-top:5px}
.ps-hist{display:grid;gap:6px}.ps-hist button{text-align:left;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:9px 11px}.ps-hist button:hover{border-color:var(--teal)}
.ps-hist small{display:block;color:var(--muted);font-size:11px}
.ps-test{border:1px solid var(--line);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;height:560px;background:var(--card)}
.ps-ex{white-space:pre-wrap;background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:12px;font-size:13px;max-height:55vh;overflow:auto;line-height:1.55}
.ps-grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 16px}
.ps-ck{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:6px}.ps-ck label{display:flex;gap:6px;align-items:center;font-weight:400;margin:0}
.ps-deps{max-height:160px;overflow:auto;border:1px solid var(--line);border-radius:9px;padding:8px 10px;margin-top:6px;display:grid;gap:4px}
.ps-small{font-size:12px;color:var(--muted)}
.ps-un{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2.4fr);gap:16px;align-items:start}
@media(max-width:760px){.ps-un{grid-template-columns:minmax(0,1fr)}}
@media(max-width:600px){.ps-win{inset:0;width:auto;height:auto;border-radius:0;border:0}.ps-fab span{display:none}.ps-fab{padding:13px}.ps-grid2{grid-template-columns:1fr}}
@media print{.ps-fab,.ps-win{display:none!important}}`;document.head.appendChild(st)}

/* ---------- register the module, the page and the rights ---------- */
try{
  MODS.push({id:'policy',name:['HR Assistant','HR सहायक'],desc:['Policy upload and the HR Assistant chat: employees ask, answers only from company policy','पॉलिसी अपलोड और HR सहायक चैट: कर्मचारी पूछें, जवाब सिर्फ़ कंपनी पॉलिसी से'],pages:['policies'],needs:[]});
  PAGEMOD.policies='policy';if(LIC&&LIC.mods&&!('policy' in LIC.mods))LIC.mods.policy=true;
  PAGES.push('policies');['admin','hr'].forEach(r=>RIGHTS[r].policies=['V','A','E','X']);Object.keys(RIGHTS).forEach(r=>{if(!RIGHTS[r].policies)RIGHTS[r].policies=[]});
  NAV.push({id:'policies',ic:'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M9 13h6M9 17h6M9 9h1',roles:[],day:'—',built:true});
  const adm=NAVMODS.find(g=>g.h&&g.h[0]==='Administration');if(adm)adm.ids.push('policies');else NAVMODS.push({h:['Administration','प्रशासन'],ids:['policies']});
  Object.assign(T.en,{policies:'Policy Management'});Object.assign(T.hi,{policies:'पॉलिसी मैनेजमेंट'});
  PAGEFN.policies=()=>policiesPage();
}catch(e){console.error('policy module',e)}
try{const _ph=placeholder;placeholder=function(P){return P==='policies'?policiesPage():_ph.apply(this,arguments)}}catch(e){}

/* =====================================================================================
   The chat (used by the floating HR Assistant and by the Test Chat of HR)
   ===================================================================================== */
const SUGGEST={en:['CL kitni milti hai?','Late aane ka niyam kya hai?','Notice period kitna hai?','Leave kaise apply karun?','Payslip kahan milegi?'],
  hi:['CL कितनी मिलती है?','देर से आने का नियम क्या है?','नोटिस पीरियड कितना है?','छुट्टी के लिए आवेदन कैसे करूँ?','पे-स्लिप कहाँ मिलेगी?']};
const fmtAns=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>');
const stripSrc=s=>String(s||'').replace(/\n*\s*Source:[^\n]*$/,'').trim();

function makeChat(mode){return {mode,session:null,msgs:[],busy:false,view:'chat',hist:null,el:null,test:{role:'employee',dept:''}}}
const LIVECHAT=makeChat('live'), TESTCHAT=makeChat('test');

function chatBody(c){
  if(c.view==='hist'){
    const h=c.hist;return `<div class="ps-msg ps-bot"><b>${L('Your earlier chats','आपकी पिछली चैट')}</b></div>${!h?`<div class="ps-typing"><i></i><i></i><i></i></div>`:h.length?`<div class="ps-hist">${h.map(s=>`<button data-pshist="${s.id}"><b>${esc(s.title||'…')}</b><small>${dtS(s.last_at)}</small></button>`).join('')}</div>`:`<div class="ps-small">${L('No chats yet.','अभी कोई चैट नहीं।')}</div>`}`}
  const first=(USERS[state.role]&&USERS[state.role].name||'').split(' ')[0];
  let o=`<div class="ps-msg ps-bot">${c.mode==='test'?L('Test Chat: ask the way an employee would. Published and processed (not yet published) versions are searched; the match score is shown.','टेस्ट चैट: वैसे पूछें जैसे कर्मचारी पूछेगा। प्रकाशित और प्रोसेस हो चुके (अभी अप्रकाशित) वर्ज़न खोजे जाते हैं; मिलान स्कोर दिखता है।'):L(`Namaste${first?' '+esc(first):''}! I am your HR Assistant. Ask me about your company's policies (leave, attendance, travel, conduct and more) or how to do something in LV People. I answer only from your company's policies and the LV People User Guide.`,`नमस्ते${first?' '+esc(first):''}! मैं आपका HR सहायक हूँ। कंपनी की पॉलिसी (छुट्टी, हाज़िरी, यात्रा, आचरण और बहुत कुछ) या LV People में कोई काम कैसे करें, यह पूछें। मैं सिर्फ़ आपकी कंपनी की पॉलिसी और LV People यूज़र गाइड से जवाब देता हूँ।`)}</div>`;
  if(!c.msgs.length)o+=`<div class="ps-chips">${SUGGEST[lang==='hi'?'hi':'en'].map(q=>`<button class="ps-chip" data-psq="${esc(q)}">${esc(q)}</button>`).join('')}</div>`;
  c.msgs.forEach((m,i)=>{
    o+=`<div class="ps-msg ps-me">${esc(m.q)}</div>`;
    if(m.pending){o+=`<div class="ps-msg ps-bot ps-typing" aria-label="${L('Typing','लिख रहा है')}"><i></i><i></i><i></i></div>`;return}
    if(m.error){o+=`<div class="ps-msg ps-bot ps-err">${esc(m.error)}</div>`;return}
    const ok=m.status==='answered';
    o+=`<div class="ps-msg ps-bot ${ok?'':'ps-no'}">${fmtAns(ok?stripSrc(m.answer):m.answer)}`;
    if(ok&&m.sources&&m.sources.length)o+=`<div>${m.sources.map((s,j)=>`<button class="ps-src" data-pssrc="${i}:${j}" title="${L('See this part of the source','स्रोत का यह हिस्सा देखें')}">${s.kind==='guide'?'📘 '+L('User Guide','यूज़र गाइड'):'📄 '+esc(s.policy_name)}${s.label?' · '+esc(s.label):''}${c.mode==='test'&&s.score!=null?` · ${s.score}`:''}</button>`).join('')}</div>`;
    if(c.mode==='test')o+=`<div class="ps-meta">${L('Status','स्थिति')}: ${esc(m.status)}${m.top_score!=null?` · ${L('best match','सबसे अच्छा मिलान')} ${(+m.top_score).toFixed(3)} (${L('needed','ज़रूरी')} ${m.min_score})`:''}</div>`;
    else if(m.id)o+=`<div class="ps-fb"><span>${L('Was this helpful?','क्या यह काम का था?')}</span><button data-psfb="${i}:1" class="${m.rating===1?'on':''}" aria-label="${L('Helpful','काम का')}">👍</button><button data-psfb="${i}:-1" class="${m.rating===-1?'on':''}" aria-label="${L('Not helpful','काम का नहीं')}">👎</button></div>`;
    o+=`</div>`;
  });
  return o}

function chatShell(c){
  return `<div class="ps-body" data-psbody>${chatBody(c)}</div>
  <div class="ps-foot"><form class="ps-in" data-psform><textarea rows="1" maxlength="500" data-psinput placeholder="${L('Write your question…','अपना सवाल लिखें…')}" aria-label="${L('Your question','आपका सवाल')}"></textarea><button data-pssend ${c.busy?'disabled':''}>${L('Send','भेजें')}</button></form>
  <div class="ps-disc">${L('Jawab company policy par aadharit hai. Antim nirnay HR ka hoga.','जवाब कंपनी पॉलिसी पर आधारित है। अंतिम निर्णय HR का होगा।')}</div></div>`}

function chatRefresh(c){if(!c.el)return;const b=c.el.querySelector('[data-psbody]');if(!b)return;b.innerHTML=chatBody(c);bindBody(c);b.scrollTop=b.scrollHeight;const s=c.el.querySelector('[data-pssend]');if(s)s.disabled=c.busy}

function bindChat(c){
  const f=c.el.querySelector('[data-psform]'), ta=c.el.querySelector('[data-psinput]');
  if(f)f.onsubmit=e=>{e.preventDefault();const q=ta.value.trim();if(!q||c.busy)return;ta.value='';ta.style.height='';chatAsk(c,q)};
  if(ta){ta.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();f.requestSubmit?f.requestSubmit():f.onsubmit(new Event('submit'))}};ta.oninput=()=>{ta.style.height='';ta.style.height=Math.min(ta.scrollHeight,110)+'px'}}
  bindBody(c);const b=c.el.querySelector('[data-psbody]');if(b)b.scrollTop=b.scrollHeight}

function bindBody(c){
  const b=c.el.querySelector('[data-psbody]');if(!b)return;
  b.querySelectorAll('[data-psq]').forEach(x=>x.onclick=()=>chatAsk(c,x.dataset.psq));
  b.querySelectorAll('[data-pssrc]').forEach(x=>x.onclick=()=>{const [i,j]=x.dataset.pssrc.split(':').map(Number);showSource(c.msgs[i].sources[j])});
  b.querySelectorAll('[data-psfb]').forEach(x=>x.onclick=()=>{const [i,r]=x.dataset.psfb.split(':').map(Number);feedback(c,c.msgs[i],r)});
  b.querySelectorAll('[data-pshist]').forEach(x=>x.onclick=()=>openSession(c,x.dataset.pshist));
}

async function chatAsk(c,q){
  if(c.busy)return;c.view='chat';c.busy=true;const m={q,pending:true};c.msgs.push(m);chatRefresh(c);
  try{const body={action:'ask',question:q,mode:c.mode,session_id:c.session};if(c.mode==='test'){body.test_role=c.test.role;body.test_dept=c.test.dept||null}
    const r=await pa(body);c.session=r.session_id;Object.assign(m,{id:r.message_id,status:r.status,answer:r.answer,sources:r.sources||[],top_score:r.top_score,min_score:r.min_score})}
  catch(e){m.error=e.message}
  m.pending=false;c.busy=false;chatRefresh(c)}

function showSource(s){if(!s)return;const g=s.kind==='guide', ex=g&&lang==='hi'&&s.excerpt_hi?s.excerpt_hi:(s.excerpt||'');
  const bg=openModal(`<h3 style="margin-top:0">${g?L('LV People User Guide','LV People यूज़र गाइड'):esc(s.policy_name)+` <span class="pill p-teal">v${esc(s.version)}</span>`}</h3>${s.label?`<p class="ps-small" style="margin:-4px 0 10px">${esc(s.label)}</p>`:''}
  <div class="ps-ex">${esc(ex)}</div><p class="ps-small">${g?L('This is the part of the User Guide the answer was taken from.','यह यूज़र गाइड का वह हिस्सा है जिससे जवाब लिया गया।'):L('This is the part of the policy the answer was taken from.','यह पॉलिसी का वह हिस्सा है जिससे जवाब लिया गया।')}</p>
  <div class="acts">${g&&s.module_id?`<button type="button" class="btn btn-o" data-psguide>${L('Open in User Guide','यूज़र गाइड में खोलें')}</button>`:''}<button type="button" class="btn btn-p" data-close>${L('Close','बंद करें')}</button></div>`,(f,close)=>close());
  bg.querySelector('.modal').style.maxWidth='640px';
  const gb=bg.querySelector('[data-psguide]');if(gb)gb.onclick=()=>{bg.remove();openGuide(s.module_id,s.entry_id)}}
/* opens the app's User Guide page at that entry */
function openGuide(mod,entry){closeWidget();state.page='guide';try{resetViews()}catch(e){}state.gm=mod;state.gq='';render();
  setTimeout(()=>{const el=document.getElementById(`g-${mod}-${entry}`);if(el){el.scrollIntoView({behavior:'smooth',block:'start'});el.style.boxShadow='0 0 0 2px var(--teal)';setTimeout(()=>{el.style.boxShadow=''},2500)}},80)}

async function feedback(c,m,rating){
  if(!m.id||!uid())return;const was=m.rating;m.rating=rating;chatRefresh(c);
  const row={client_id:LIVE.profile.client_id,message_id:m.id,user_id:uid(),rating,created_by:uid()};
  let r=await sb().from('chat_feedback').insert(row);
  if(r.error&&String(r.error.code)==='23505')r=await sb().from('chat_feedback').update({rating}).eq('message_id',m.id).eq('user_id',uid());
  if(r.error){m.rating=was;chatRefresh(c);return toast(L('Feedback not saved: ','फ़ीडबैक सेव नहीं हुआ: ')+r.error.message)}
  if(rating===-1){openModal(`<h3 style="margin-top:0">${L('What was wrong?','क्या ग़लत था?')}</h3><p class="ps-small">${L('Optional. HR sees this in the Chat Logs.','वैकल्पिक। HR इसे चैट लॉग में देखता है।')}</p><textarea class="inp" name="c" rows="3" maxlength="500"></textarea><div class="acts"><button type="button" class="btn btn-o" data-close>${L('Skip','छोड़ें')}</button><button class="btn btn-p">${L('Send','भेजें')}</button></div>`,
    async(f,close)=>{const t=f.c.value.trim();close();if(t){await sb().from('chat_feedback').update({comment:t}).eq('message_id',m.id).eq('user_id',uid())}toast(L('Thank you','धन्यवाद'))})}
  else toast(L('Thank you','धन्यवाद'))}

async function loadHistory(c){
  c.view='hist';c.hist=null;chatRefresh(c);
  const r=await sb().from('chat_sessions').select('id,title,last_at').eq('user_id',uid()).eq('mode',c.mode).order('last_at',{ascending:false}).limit(30);
  c.hist=r.data||[];chatRefresh(c)}

async function openSession(c,id){
  const r=await sb().from('chat_messages').select('id,question,answer,status,sources,created_at,chat_feedback(rating,user_id)').eq('session_id',id).order('created_at');
  if(r.error)return toast(r.error.message);
  c.session=id;c.view='chat';c.msgs=(r.data||[]).map(x=>{const fb=(x.chat_feedback||[]).find(f=>f.user_id===uid());return {id:x.id,q:x.question,answer:x.answer,status:x.status,sources:x.sources||[],rating:fb?fb.rating:undefined}});chatRefresh(c)}

/* ---------- the floating HR Assistant (every page) ---------- */
const ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/><path d="M8 9h8M8 13h5"/></svg>';
function widgetOn(){try{return LIVE.on&&LIVE.profile&&state.role!=='platform'&&modOn('policy')&&!document.getElementById('app').classList.contains('hidden')}catch(e){return false}}
function ensureWidget(){
  let fab=document.getElementById('psFab');
  if(!widgetOn()){if(fab)fab.remove();const w=document.getElementById('psWin');if(w)w.remove();return}
  if(!fab){fab=document.createElement('button');fab.id='psFab';fab.className='ps-fab';fab.setAttribute('aria-label','HR Assistant');fab.innerHTML=ICON+'<span>HR Assistant</span>';fab.onclick=openWidget;document.body.appendChild(fab)}
  fab.style.display=document.getElementById('psWin')||(state.page==='policies'&&state.poltab==='test')?'none':'';
  const m=document.getElementById('main');if(m)m.style.paddingBottom='84px'}
function openWidget(){
  let w=document.getElementById('psWin');if(w)return;
  w=document.createElement('div');w.id='psWin';w.className='ps-win';w.setAttribute('role','dialog');w.setAttribute('aria-label','HR Assistant');
  w.innerHTML=`<div class="ps-head"><div class="ps-av">HR</div><div style="flex:1;min-width:0"><b>HR Assistant</b><small>${L('Company policy and the LV People guide','कंपनी पॉलिसी और LV People गाइड')}</small></div>
   <button data-psnew title="${L('New chat','नई चैट')}">＋</button><button data-pshis>${L('History','इतिहास')}</button><button data-psx aria-label="${L('Close','बंद करें')}">✕</button></div>${chatShell(LIVECHAT)}`;
  document.body.appendChild(w);LIVECHAT.el=w;bindChat(LIVECHAT);
  w.querySelector('[data-psx]').onclick=closeWidget;
  w.querySelector('[data-pshis]').onclick=()=>LIVECHAT.view==='hist'?(LIVECHAT.view='chat',chatRefresh(LIVECHAT)):loadHistory(LIVECHAT);
  w.querySelector('[data-psnew]').onclick=()=>{LIVECHAT.session=null;LIVECHAT.msgs=[];LIVECHAT.view='chat';chatRefresh(LIVECHAT)};
  w.addEventListener('keydown',e=>{if(e.key==='Escape')closeWidget()});
  ensureWidget();const ta=w.querySelector('[data-psinput]');if(ta&&matchMedia('(hover:hover)').matches)ta.focus()}
function closeWidget(){const w=document.getElementById('psWin');if(w)w.remove();LIVECHAT.el=null;ensureWidget()}
{const _r=render;render=function(){_r.apply(this,arguments);try{ensureWidget()}catch(e){}}}

/* =====================================================================================
   Policy Management (Admin and HR)
   ===================================================================================== */
const PM={loaded:false,busy:false,err:'',pols:[],vers:[],poll:null,
  un:{from:ymd(Date.now()-29*864e5),to:ymd(Date.now()),resolved:false,rows:null},
  lg:{from:ymd(Date.now()-6*864e5),to:ymd(Date.now()),q:'',st:'',fb:'',rows:null}};
window.PM=PM;

async function pmLoad(){
  const [p,v]=await Promise.all([sb().from('policies').select('*').order('updated_at',{ascending:false}),
    sb().from('policy_versions').select('id,policy_id,version,effective_date,file_name,file_type,file_size,status,auto_publish,pages,ocr_pages,chunks,error,processed_at,published_at,created_by,created_at').order('created_at',{ascending:false})]);
  if(p.error)throw p.error;if(v.error)throw v.error;PM.pols=p.data||[];PM.vers=v.data||[];PM.loaded=true;PM.err='';
  clearTimeout(PM.poll);if(PM.vers.some(x=>x.status==='processing'))PM.poll=setTimeout(()=>{if(state.page==='policies'&&(state.poltab||'list')==='list')pmLoad().then(render).catch(()=>{})},5000)}

const versOf=pid=>PM.vers.filter(v=>v.policy_id===pid);
function polState(p){
  const vs=versOf(p.id), last=vs[0], live=vs.find(v=>v.id===p.live_version_id);
  if(p.status==='archived')return {k:'archived',pill:`<span class="pill" style="background:var(--line);color:var(--muted)">${L('Archived','आर्काइव')}</span>`,last,live};
  if(last&&last.status==='processing')return {k:'processing',pill:`<span class="pill p-warn">${L('Processing','प्रोसेस हो रही')}…</span>`,last,live};
  if(last&&last.status==='failed')return {k:'failed',pill:`<span class="pill p-bad" title="${esc(last.error||'')}">${L('Failed','विफल')}</span>`,last,live};
  if(last&&last.status==='ready')return {k:'ready',pill:`<span class="pill p-teal">${L('Ready to test','टेस्ट के लिए तैयार')}</span>`,last,live};
  if(live)return {k:'active',pill:`<span class="pill p-ok">${L('Active','चालू')}</span>`,last,live};
  return {k:'draft',pill:`<span class="pill p-warn">${L('Not published','प्रकाशित नहीं')}</span>`,last,live}}

function policiesPage(){
  const tab=state.poltab||'list';
  const head=`<div class="page-h"><div><h1>${L('Policy Management','पॉलिसी मैनेजमेंट')}</h1><p>${L('Company policies. HR Assistant answers employees only from the Active policies here, and only to the roles and departments you choose.','कंपनी की पॉलिसी। HR सहायक कर्मचारियों को सिर्फ़ यहाँ की चालू पॉलिसी से जवाब देता है, और सिर्फ़ उन्हीं रोल और विभागों को जो आप चुनें।')}</p></div>${tab==='list'?`<button class="btn btn-p" data-pmup>+ ${L('Upload policy','पॉलिसी अपलोड करें')}</button>`:''}</div>
  <div class="tabs">${[['list',L('Policies','पॉलिसी')],['test',L('Test Chat','टेस्ट चैट')],['unans',L('Unanswered Questions','बिना जवाब के सवाल')],['logs',L('Chat Logs','चैट लॉग')]].map(([k,n])=>`<button data-poltab="${k}" class="${tab===k?'on':''}">${n}</button>`).join('')}</div>`;
  if(!modOn('policy'))return head+`<div class="card">${L('HR Assistant is not switched on for your company. Ask the LV People team.','HR सहायक आपकी कंपनी के लिए चालू नहीं है। LV People टीम से कहें।')}</div>`;
  if(!LIVE.on)return head+`<div class="card">${L('Sign in to the live app to use Policy Management.','पॉलिसी मैनेजमेंट के लिए लाइव ऐप में साइन-इन करें।')}</div>`;
  if(tab==='test')return head+testTab();
  if(tab==='unans')return head+unansTab();
  if(tab==='logs')return head+logsTab();
  if(!PM.loaded){if(!PM.busy){PM.busy=true;pmLoad().catch(e=>{PM.err=e.message;PM.loaded=true}).finally(()=>{PM.busy=false;render()})}return head+`<p>…</p>`}
  const rows=PM.pols.map(p=>{const s=polState(p), vs=versOf(p.id), deps=p.allowed_department_ids||[];
    const who=(p.allowed_roles||[]).length===4?L('Everyone','सभी'):(p.allowed_roles||[]).map(roleName).join(', ');
    const dep=deps.length?`<small style="display:block;color:var(--muted)">${deps.map(deptName).filter(Boolean).join(', ')||deps.length+' '+L('departments','विभाग')}</small>`:'';
    const ver=s.live?`v${esc(s.live.version)}${s.live.effective_date?` · ${dS(s.live.effective_date)}`:''}`:'—';
    const newer=s.last&&s.live&&s.last.id!==s.live.id?`<small style="display:block;color:var(--muted)">${L('new','नया')}: v${esc(s.last.version)}</small>`:'';
    const b=(attr,label,cls='')=>`<button class="btn ${cls==='btn-p'?'':'btn-o'} btn-s ${cls}" ${attr}>${label}</button>`;
    return `<tr><td><b>${esc(p.name)}</b><small style="display:block;color:var(--muted)">${catName(p.category)}</small></td><td>${ver}${newer}</td><td>${esc(who)}${dep}</td><td>${s.pill}${s.k==='failed'&&s.last.error?`<small style="display:block;color:var(--bad);max-width:260px;white-space:normal">${esc(s.last.error)}</small>`:''}${s.k==='processing'?`<small style="display:block;color:var(--muted)">${L('You can keep working; this updates by itself.','आप काम जारी रखें; यह अपने आप अपडेट होगा।')}</small>`:''}</td><td>${dS(p.updated_at)}</td>
      <td style="text-align:right;white-space:nowrap">${b(`data-pmview="${p.id}"`,L('View','देखें'))} ${s.k==='ready'?b(`data-pmpub="${s.last.id}"`,L('Publish','प्रकाशित करें'),'btn-p'):''} ${s.k==='failed'?b(`data-pmretry="${s.last.id}"`,L('Try again','फिर कोशिश')):''} ${s.k!=='processing'?b(`data-pmnew="${p.id}"`,L('New version','नया वर्ज़न')):''} ${b(`data-pmedit="${p.id}"`,L('Edit','बदलें'))} ${p.status==='archived'?b(`data-pmres="${p.id}"`,L('Restore','वापस लाएँ')):b(`data-pmarc="${p.id}"`,L('Archive','आर्काइव'))} ${b(`data-pmdel="${p.id}"`,L('Delete','हटाएँ'),'btn-d')}</td></tr>`}).join('');
  const act=PM.pols.filter(p=>polState(p).k==='active').length;
  return head+(PM.err?`<p class="pill p-bad" style="display:block;white-space:normal">${esc(PM.err)}</p>`:'')+
  `<div class="tools"><span class="ps-small">${PM.pols.length} ${L('policies','पॉलिसी')} · ${act} ${L('active','चालू')}</span><div style="flex:1"></div><button class="btn btn-o btn-s" data-pmreload>${L('Refresh','रीफ़्रेश')}</button></div>
  <div class="card tw"><table class="tbl"><thead><tr><th>${L('Policy','पॉलिसी')}</th><th>${L('Live version','चालू वर्ज़न')}</th><th>${L('Who can see','कौन देख सकता है')}</th><th>${t('status')}</th><th>${L('Updated','अपडेट')}</th><th></th></tr></thead>
  <tbody>${rows||`<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:28px">${L('No policy yet. Click "Upload policy" to add the first one (PDF, DOCX or TXT).','अभी कोई पॉलिसी नहीं। पहली पॉलिसी जोड़ने के लिए "पॉलिसी अपलोड करें" दबाएँ (PDF, DOCX या TXT)।')}</td></tr>`}</tbody></table></div>`}

/* ---------- upload / new version / edit ---------- */
function accessFields(p){
  const roles=p?p.allowed_roles:['employee','manager','hr','admin'], deps=p?p.allowed_department_ids||[]:[], all=!deps.length, dl=deptList();
  return `<label>${L('Which roles can get answers from this policy','किन रोल को इस पॉलिसी से जवाब मिलें')} *</label><div class="ps-ck">${ROLES.map(([k,en,hi])=>`<label><input type="checkbox" name="role" value="${k}" ${roles.includes(k)?'checked':''}> ${L(en,hi)}</label>`).join('')}</div>
  <p class="ps-small" style="margin:4px 0 0">${L('Example: a policy only for managers: tick Manager, HR and Admin.','उदाहरण: सिर्फ़ मैनेजरों की पॉलिसी: Manager, HR और Admin चुनें।')}</p>
  <label>${L('Departments','विभाग')}</label><div class="ps-ck"><label><input type="radio" name="dall" value="1" ${all?'checked':''}> ${L('All departments','सभी विभाग')}</label><label><input type="radio" name="dall" value="0" ${all?'':'checked'}> ${L('Only selected departments','सिर्फ़ चुने हुए विभाग')}</label></div>
  <div class="ps-deps" data-pmdeps style="${all?'display:none':''}">${dl.map(d=>`<label style="display:flex;gap:6px;font-weight:400;margin:0"><input type="checkbox" name="dep" value="${d.uuid}" ${deps.includes(d.uuid)?'checked':''}> ${esc(d.name)}</label>`).join('')||`<span class="ps-small">${L('No departments in Settings yet.','सेटिंग्स में अभी कोई विभाग नहीं।')}</span>`}</div>`}
function readAccess(f){const roles=[...f.querySelectorAll('[name=role]:checked')].map(x=>x.value), all=f.querySelector('[name=dall]:checked').value==='1', deps=all?[]:[...f.querySelectorAll('[name=dep]:checked')].map(x=>x.value);return {roles,deps,all}}
function bindAccess(bg){bg.querySelectorAll('[name=dall]').forEach(r=>r.onchange=()=>{bg.querySelector('[data-pmdeps]').style.display=bg.querySelector('[name=dall]:checked').value==='1'?'none':''})}

function uploadModal(pid){
  const p=pid?PM.pols.find(x=>x.id===pid):null, lastV=p?versOf(p.id)[0]:null;
  const nextV=lastV?(String(lastV.version).match(/^\d+$/)?String(+lastV.version+1):lastV.version+'.1'):'1';
  const bg=openModal(`<h3 style="margin-top:0">${p?L('New version','नया वर्ज़न')+': '+esc(p.name):L('Upload policy','पॉलिसी अपलोड करें')}</h3>
  ${p?`<p class="ps-small" style="margin-top:-6px">${L('When the new file is processed it replaces the old one: the old version\'s text is switched off and the new text is used.','नई फ़ाइल प्रोसेस होते ही पुरानी की जगह ले लेगी: पुराने वर्ज़न का टेक्स्ट बंद होगा और नया इस्तेमाल होगा।')}</p>`:''}
  <div class="ps-grid2"><div><label>${L('Policy name','पॉलिसी का नाम')} *</label><input class="inp" name="name" maxlength="150" value="${esc(p?p.name:'')}" placeholder="${L('Leave Policy 2026','लीव पॉलिसी 2026')}"></div>
   <div><label>${L('Category','श्रेणी')} *</label><select class="inp" name="category">${CATS.map(([c])=>`<option value="${c}" ${(p?p.category:'Leave')===c?'selected':''}>${catName(c)}</option>`).join('')}</select></div>
   <div><label>${L('Version','वर्ज़न')} *</label><input class="inp" name="version" maxlength="30" value="${esc(nextV)}"></div>
   <div><label>${L('Effective date','लागू होने की तारीख़')}</label><input class="inp" type="date" name="eff" value="${ymd(Date.now())}"></div></div>
  ${accessFields(p)}
  <label>${L('File (PDF, DOCX or TXT, up to 20 MB)','फ़ाइल (PDF, DOCX या TXT, 20 MB तक)')} *</label><input class="inp" type="file" name="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain">
  <p class="ps-small" style="margin:4px 0 0">${L('Scanned PDFs are read with OCR. A .doc file: save it as .docx first.','स्कैन की हुई PDF OCR से पढ़ी जाती है। .doc फ़ाइल: पहले .docx में सेव करें।')}</p>
  <label style="display:flex;gap:8px;align-items:flex-start;font-weight:400;margin-top:14px"><input type="checkbox" name="auto" checked style="margin-top:3px"> <span>${L('Switch it on for employees as soon as it is processed. Untick to check it in Test Chat first and then press Publish.','प्रोसेस होते ही कर्मचारियों के लिए चालू करें। पहले टेस्ट चैट में जाँचना हो तो हटाएँ, फिर Publish दबाएँ।')}</span></label>
  <div id="pmE" style="color:var(--bad);font-size:13px;margin-top:8px"></div>
  <div class="acts"><button type="button" class="btn btn-o" data-close>${t('cancel')}</button><button class="btn btn-p" data-pmgo>${L('Upload','अपलोड करें')}</button></div>`,
  async(f,close,bg)=>{const er=m=>{bg.querySelector('#pmE').textContent=m}, a=readAccess(f), file=f.file.files[0];
    if(f.name.value.trim().length<2)return er(L('Write the policy name.','पॉलिसी का नाम लिखें।'));
    if(!f.version.value.trim())return er(L('Write the version.','वर्ज़न लिखें।'));
    if(!a.roles.length)return er(L('Choose at least one role.','कम से कम एक रोल चुनें।'));
    if(!a.all&&!a.deps.length)return er(L('Choose the departments, or choose All departments.','विभाग चुनें, या सभी विभाग चुनें।'));
    if(!file)return er(L('Choose the file.','फ़ाइल चुनें।'));
    if(!/\.(pdf|docx|txt)$/i.test(file.name))return er(L('Only PDF, DOCX or TXT files.','सिर्फ़ PDF, DOCX या TXT फ़ाइल।'));
    if(file.size>20*1024*1024)return er(L('The file is larger than 20 MB.','फ़ाइल 20 MB से बड़ी है।'));
    const fd=new FormData();if(p)fd.append('policy_id',p.id);fd.append('name',f.name.value.trim());fd.append('category',f.category.value);fd.append('version',f.version.value.trim());fd.append('effective_date',f.eff.value||'');
    fd.append('allowed_roles',JSON.stringify(a.roles));fd.append('allowed_departments',JSON.stringify(a.deps));fd.append('auto_publish',f.auto.checked?'1':'0');fd.append('file',file,file.name);
    const btn=bg.querySelector('[data-pmgo]');btn.disabled=true;btn.textContent=L('Uploading…','अपलोड हो रहा है…');
    try{await pa(fd)}catch(e){btn.disabled=false;btn.textContent=L('Upload','अपलोड करें');return er(e.message)}
    close();toast(L('Uploaded. It is being processed; the status updates by itself.','अपलोड हो गया। प्रोसेस हो रहा है; स्थिति अपने आप बदलेगी।'));PM.loaded=false;render()});
  bg.querySelector('.modal').style.maxWidth='640px';bindAccess(bg)}

function editModal(pid){const p=PM.pols.find(x=>x.id===pid);if(!p)return;
  const bg=openModal(`<h3 style="margin-top:0">${L('Change policy details','पॉलिसी विवरण बदलें')}</h3>
  <div class="ps-grid2"><div><label>${L('Policy name','पॉलिसी का नाम')} *</label><input class="inp" name="name" maxlength="150" value="${esc(p.name)}"></div><div><label>${L('Category','श्रेणी')}</label><select class="inp" name="category">${CATS.map(([c])=>`<option value="${c}" ${p.category===c?'selected':''}>${catName(c)}</option>`).join('')}</select></div></div>
  ${accessFields(p)}<p class="ps-small">${L('The change works from the next question; no new upload is needed.','बदलाव अगले सवाल से लागू होगा; दोबारा अपलोड की ज़रूरत नहीं।')}</p>
  <div id="pmE" style="color:var(--bad);font-size:13px;margin-top:8px"></div><div class="acts"><button type="button" class="btn btn-o" data-close>${t('cancel')}</button><button class="btn btn-p">${t('save')}</button></div>`,
  async(f,close,bg)=>{const er=m=>{bg.querySelector('#pmE').textContent=m}, a=readAccess(f);
    if(!a.roles.length)return er(L('Choose at least one role.','कम से कम एक रोल चुनें।'));if(!a.all&&!a.deps.length)return er(L('Choose the departments, or choose All departments.','विभाग चुनें, या सभी विभाग चुनें।'));
    try{await pa({action:'update',policy_id:p.id,name:f.name.value.trim(),category:f.category.value,allowed_roles:a.roles,allowed_departments:a.deps})}catch(e){return er(e.message)}
    close();toast(t('saved'));PM.loaded=false;render()});
  bg.querySelector('.modal').style.maxWidth='640px';bindAccess(bg)}

async function viewModal(pid){const p=PM.pols.find(x=>x.id===pid);if(!p)return;const vs=versOf(p.id), s=polState(p), show=s.live||s.last;
  const stName=v=>({processing:L('Processing','प्रोसेस हो रही'),ready:L('Ready to test','टेस्ट के लिए तैयार'),active:L('Active','चालू'),failed:L('Failed','विफल'),superseded:L('Replaced','बदल दी गई')})[v.status]||v.status;
  const bg=openModal(`<h3 style="margin-top:0">${esc(p.name)}</h3><p class="ps-small" style="margin-top:-6px">${catName(p.category)} · ${(p.allowed_roles||[]).map(roleName).join(', ')}${(p.allowed_department_ids||[]).length?' · '+(p.allowed_department_ids||[]).map(deptName).filter(Boolean).join(', '):' · '+L('All departments','सभी विभाग')}</p>
   <div class="tw" style="border:1px solid var(--line);border-radius:10px"><table class="tbl"><thead><tr><th>${L('Version','वर्ज़न')}</th><th>${t('status')}</th><th>${L('File','फ़ाइल')}</th><th>${L('Read','पढ़ा गया')}</th><th>${L('Uploaded','अपलोड')}</th><th></th></tr></thead><tbody>
   ${vs.map(v=>`<tr><td><b>v${esc(v.version)}</b>${v.effective_date?`<small style="display:block;color:var(--muted)">${L('from','से')} ${dS(v.effective_date)}</small>`:''}</td><td>${stName(v)}${v.error?`<small style="display:block;color:var(--bad);white-space:normal;max-width:200px">${esc(v.error)}</small>`:''}</td><td style="max-width:180px;overflow:hidden;text-overflow:ellipsis">${esc(v.file_name)}<small style="display:block;color:var(--muted)">${Math.max(1,Math.round(v.file_size/1024))} KB</small></td><td>${v.pages} ${L('pages','पेज')}${v.ocr_pages?` (${v.ocr_pages} OCR)`:''}<small style="display:block;color:var(--muted)">${v.chunks} ${L('parts','हिस्से')}</small></td><td>${dS(v.created_at)}<small style="display:block;color:var(--muted)">${esc(userName(v.created_by))}</small></td><td><button type="button" class="btn btn-o btn-s" data-pmfile="${v.id}">${L('File','फ़ाइल')}</button></td></tr>`).join('')}</tbody></table></div>
   <h4 style="margin:16px 0 6px">${L('Text read from the file','फ़ाइल से पढ़ा गया टेक्स्ट')}${show?` (v${esc(show.version)})`:''}</h4><p class="ps-small" style="margin-top:0">${L('Check that headings, numbers and Hindi text were read correctly. This is exactly what the assistant answers from.','जाँचें कि हेडिंग, अंक और हिंदी टेक्स्ट सही पढ़े गए। HR सहायक ठीक इसी से जवाब देता है।')}</p><div data-pmchunks class="ps-small">…</div>
   <div class="acts"><button type="button" class="btn btn-p" data-close>${L('Close','बंद करें')}</button></div>`,(f,close)=>close());
  bg.querySelector('.modal').style.maxWidth='860px';
  bg.querySelectorAll('[data-pmfile]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{const r=await pa({action:'file_url',version_id:b.dataset.pmfile});const a=document.createElement('a');a.href=r.url;a.target='_blank';a.rel='noopener';document.body.appendChild(a);a.click();a.remove()}catch(e){toast(e.message)}b.disabled=false});
  const box=bg.querySelector('[data-pmchunks]');
  if(!show||!show.chunks){box.textContent=L('No text yet.','अभी कोई टेक्स्ट नहीं।');return}
  const r=await sb().from('policy_chunks').select('chunk_no,heading,page_from,page_to,content').eq('version_id',show.id).order('chunk_no').limit(400);
  if(r.error){box.textContent=r.error.message;return}
  box.innerHTML=(r.data||[]).map(c=>`<details style="border-top:1px solid var(--line);padding:6px 0"><summary style="cursor:pointer;color:var(--text)"><b>#${c.chunk_no}</b> ${esc(c.heading||'—')} <span style="color:var(--muted)">· ${show.file_type==='txt'?'':L('Page','पेज')+' '+c.page_from+(c.page_to!==c.page_from?'–'+c.page_to:'')}</span></summary><div class="ps-ex" style="margin-top:6px">${esc(c.content)}</div></details>`).join('')}

function confirmModal(title,text,btn,fn){openModal(`<h3 style="margin-top:0">${title}</h3><p>${text}</p><div id="pmE" style="color:var(--bad);font-size:13px"></div><div class="acts"><button type="button" class="btn btn-o" data-close>${t('cancel')}</button><button class="btn btn-p">${btn}</button></div>`,
  async(f,close,bg)=>{const b=bg.querySelector('.btn-p');b.disabled=true;try{await fn();close()}catch(e){b.disabled=false;bg.querySelector('#pmE').textContent=e.message}})}

async function act(body,msg){try{await pa(body);toast(msg);PM.loaded=false;render()}catch(e){toast(e.message)}}

/* ---------- Test Chat ---------- */
function testTab(){const c=TESTCHAT, dl=deptList();
  return `<div class="tools"><label style="margin:0">${L('Ask as','इस रूप में पूछें')}</label><select class="inp" data-pmtrole>${ROLES.map(([k,en,hi])=>`<option value="${k}" ${c.test.role===k?'selected':''}>${L(en,hi)}</option>`).join('')}</select>
   <select class="inp" data-pmtdept><option value="">${L('Any department (only "all departments" policies)','कोई विभाग (सिर्फ़ "सभी विभाग" वाली पॉलिसी)')}</option>${dl.map(d=>`<option value="${d.uuid}" ${c.test.dept===d.uuid?'selected':''}>${esc(d.name)}</option>`).join('')}</select>
   <button class="btn btn-o btn-s" data-pmtclear>${L('Clear chat','चैट साफ़ करें')}</button></div>
   <p class="ps-small" style="margin-top:-6px">${L('Use this before you publish. A question that should not be answered (for example from another company or outside the policy) must give "jaankari uplabdh nahi". Test chats are not counted in the reports.','प्रकाशित करने से पहले इसका इस्तेमाल करें। जिस सवाल का जवाब नहीं मिलना चाहिए (जैसे किसी और कंपनी का या पॉलिसी से बाहर का) उसका जवाब "जानकारी उपलब्ध नहीं" आना चाहिए। टेस्ट चैट रिपोर्ट में नहीं गिनी जातीं।')}</p>
   <div class="ps-test" data-pmtest>${chatShell(c)}</div>`}

/* ---------- Unanswered Questions ---------- */
async function unLoad(){const u=PM.un;u.rows=null;render();
  let q=sb().from('unanswered_questions').select('id,question,question_norm,top_score,created_at,resolved,employee_id').gte('created_at',u.from+'T00:00:00').lte('created_at',u.to+'T23:59:59.999').order('created_at',{ascending:false}).limit(5000);
  if(!u.resolved)q=q.eq('resolved',false);const r=await q;u.rows=r.error?[]:r.data;u.err=r.error?r.error.message:'';render()}
function unansTab(){const u=PM.un;if(u.rows===null&&!u.busy){u.busy=true;unLoad().finally(()=>u.busy=false)}
  const rows=u.rows||[];const byDay={},byQ={};
  rows.forEach(r=>{const d=ymd(r.created_at);byDay[d]=(byDay[d]||0)+1;const g=byQ[r.question_norm]||(byQ[r.question_norm]={q:r.question,n:0,ids:[],last:r.created_at,best:null,res:true});g.n++;g.ids.push(r.id);if(r.created_at>g.last)g.last=r.created_at;if(r.top_score!=null&&(g.best==null||r.top_score>g.best))g.best=r.top_score;if(!r.resolved)g.res=false});
  const qs=Object.values(byQ).sort((a,b)=>b.n-a.n||(b.last>a.last?1:-1)), days=Object.keys(byDay).sort().reverse();
  return `<div class="tools"><label style="margin:0">${L('From','से')}</label><input class="inp" type="date" data-unf value="${u.from}"><label style="margin:0">${L('To','तक')}</label><input class="inp" type="date" data-unt value="${u.to}">
   <label style="margin:0;display:flex;gap:6px;font-weight:400"><input type="checkbox" data-unr ${u.resolved?'checked':''}> ${L('Show resolved too','हल किए गए भी दिखाएँ')}</label><button class="btn btn-o btn-s" data-uncsv>CSV</button></div>
   <p class="ps-small" style="margin-top:-6px">${L('Questions employees asked that the policies do not answer. Add the missing point to the policy (upload a New version), then mark it resolved.','कर्मचारियों के वे सवाल जिनका जवाब पॉलिसी में नहीं है। कमी वाली बात पॉलिसी में जोड़ें (नया वर्ज़न अपलोड करें), फिर हल किया हुआ मार्क करें।')}</p>
   ${u.err?`<p class="pill p-bad" style="display:block">${esc(u.err)}</p>`:''}
   ${u.rows===null?'<p>…</p>':`<div class="ps-un">
   <div class="card tw"><table class="tbl"><thead><tr><th>${L('Date','तारीख़')}</th><th style="text-align:right">${L('Count','गिनती')}</th></tr></thead><tbody>${days.map(d=>`<tr><td>${dS(d)}</td><td style="text-align:right"><b>${byDay[d]}</b></td></tr>`).join('')||`<tr><td colspan="2" style="color:var(--muted)">${L('None','कोई नहीं')}</td></tr>`}${days.length?`<tr><td><b>${L('Total','कुल')}</b></td><td style="text-align:right"><b>${rows.length}</b></td></tr>`:''}</tbody></table></div>
   <div class="card tw"><table class="tbl"><thead><tr><th>${L('Question','सवाल')}</th><th style="text-align:right">${L('Times','बार')}</th><th>${L('Last asked','आख़िरी बार')}</th><th></th></tr></thead><tbody>${qs.map((g,i)=>`<tr><td style="white-space:normal">${esc(g.q)}${g.best!=null?`<small style="display:block;color:var(--muted)">${L('best match','सबसे अच्छा मिलान')} ${(+g.best).toFixed(2)}</small>`:''}</td><td style="text-align:right"><b>${g.n}</b></td><td>${dS(g.last)}</td><td style="text-align:right">${g.res?`<span class="pill p-ok">${L('Resolved','हल')}</span>`:`<button class="btn btn-o btn-s" data-unres="${i}">${L('Mark resolved','हल मार्क करें')}</button>`}</td></tr>`).join('')||`<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:24px">${L('Every question in this period was answered from the policies.','इस अवधि में हर सवाल का जवाब पॉलिसी से मिला।')}</td></tr>`}</tbody></table></div></div>`}`;
}
function unQs(){const byQ={};(PM.un.rows||[]).forEach(r=>{const g=byQ[r.question_norm]||(byQ[r.question_norm]={q:r.question,n:0,ids:[],last:r.created_at,res:true});g.n++;g.ids.push(r.id);if(r.created_at>g.last)g.last=r.created_at;if(!r.resolved)g.res=false});return Object.values(byQ).sort((a,b)=>b.n-a.n||(b.last>a.last?1:-1))}

/* ---------- Chat Logs ---------- */
async function lgLoad(){const g=PM.lg;g.rows=null;render();
  let q=sb().from('chat_messages').select('id,created_at,employee_id,user_id,question,answer,status,sources,top_score,latency_ms,chat_feedback(rating,comment)').eq('mode','live').gte('created_at',g.from+'T00:00:00').lte('created_at',g.to+'T23:59:59.999').order('created_at',{ascending:false}).limit(1000);
  if(g.st)q=q.eq('status',g.st);const r=await q;g.rows=r.error?[]:r.data;g.err=r.error?r.error.message:'';render()}
function lgFiltered(){const g=PM.lg, s=g.q.trim().toLowerCase();return (g.rows||[]).filter(m=>{const fb=(m.chat_feedback||[])[0];
  if(g.fb==='up'&&!(fb&&fb.rating===1))return false;if(g.fb==='down'&&!(fb&&fb.rating===-1))return false;if(g.fb==='none'&&fb)return false;
  if(!s)return true;const e=empOf(m.employee_id);return (m.question+' '+(e?e.name+' '+e.code:'')).toLowerCase().includes(s)})}
const stPill=s=>({answered:`<span class="pill p-ok">${L('Answered','जवाब दिया')}</span>`,not_found:`<span class="pill p-warn">${L('Not in policy','पॉलिसी में नहीं')}</span>`,rejected:`<span class="pill p-warn">${L('Rejected (no source)','अस्वीकार (स्रोत नहीं)')}</span>`,out_of_scope:`<span class="pill" style="background:var(--line);color:var(--muted)">${L('Outside policy','पॉलिसी से बाहर')}</span>`,error:`<span class="pill p-bad">Error</span>`})[s]||esc(s);
function logsTab(){const g=PM.lg;if(g.rows===null&&!g.busy){g.busy=true;lgLoad().finally(()=>g.busy=false)}
  const rows=lgFiltered(), up=rows.filter(m=>(m.chat_feedback||[])[0]&&m.chat_feedback[0].rating===1).length, down=rows.filter(m=>(m.chat_feedback||[])[0]&&m.chat_feedback[0].rating===-1).length;
  return `<div class="tools"><label style="margin:0">${L('From','से')}</label><input class="inp" type="date" data-lgf value="${g.from}"><label style="margin:0">${L('To','तक')}</label><input class="inp" type="date" data-lgt value="${g.to}">
   <input class="inp grow" data-lgq placeholder="${L('Search employee or question','कर्मचारी या सवाल खोजें')}" value="${esc(g.q)}">
   <select class="inp" data-lgs><option value="">${L('All answers','सभी जवाब')}</option>${['answered','not_found','rejected','out_of_scope'].map(s=>`<option value="${s}" ${g.st===s?'selected':''}>${stPill(s).replace(/<[^>]+>/g,'')}</option>`).join('')}</select>
   <select class="inp" data-lgb><option value="">${L('Any feedback','कोई भी फ़ीडबैक')}</option><option value="up" ${g.fb==='up'?'selected':''}>👍</option><option value="down" ${g.fb==='down'?'selected':''}>👎</option><option value="none" ${g.fb==='none'?'selected':''}>${L('No feedback','फ़ीडबैक नहीं')}</option></select>
   <button class="btn btn-o btn-s" data-lgcsv>CSV</button></div>
   ${g.err?`<p class="pill p-bad" style="display:block">${esc(g.err)}</p>`:''}
   ${g.rows===null?'<p>…</p>':`<p class="ps-small" style="margin-top:-6px">${rows.length} ${L('questions','सवाल')} · 👍 ${up} · 👎 ${down}${g.rows.length>=1000?' · '+L('showing the latest 1000; choose fewer days','आख़िरी 1000 दिख रहे हैं; कम दिन चुनें'):''}</p>
   <div class="card tw"><table class="tbl"><thead><tr><th>${L('Date & time','तारीख़ और समय')}</th><th>${L('Employee','कर्मचारी')}</th><th>${L('Question','सवाल')}</th><th>${L('Answer','जवाब')}</th><th>${L('Source','स्रोत')}</th><th>${L('Feedback','फ़ीडबैक')}</th></tr></thead><tbody>
   ${rows.map((m,i)=>{const e=empOf(m.employee_id), fb=(m.chat_feedback||[])[0];return `<tr data-ev data-lgopen="${i}"><td style="white-space:nowrap">${dtS(m.created_at)}</td><td>${e?`${esc(e.name)}<small style="display:block;color:var(--muted)">${esc(e.code)}</small>`:'—'}</td><td style="white-space:normal;min-width:180px">${esc(m.question)}</td><td style="white-space:normal;min-width:200px">${stPill(m.status)}<small style="display:block;color:var(--muted)">${esc(stripSrc(m.answer).slice(0,140))}${stripSrc(m.answer).length>140?'…':''}</small></td><td style="white-space:normal">${(m.sources||[]).map(s=>esc(s.policy_name)+(s.label?` <small style="color:var(--muted)">${esc(s.label)}</small>`:'')).join('<br>')||'—'}</td><td>${fb?(fb.rating===1?'👍':'👎')+(fb.comment?` <small style="color:var(--muted)">${esc(fb.comment.slice(0,60))}</small>`:''):'—'}</td></tr>`}).join('')||`<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:24px">${L('No questions in this period.','इस अवधि में कोई सवाल नहीं।')}</td></tr>`}</tbody></table></div>`}`}
function lgOpen(m){const e=empOf(m.employee_id), fb=(m.chat_feedback||[])[0];
  const bg=openModal(`<h3 style="margin-top:0">${L('Chat','चैट')} · ${dtS(m.created_at)}</h3><p class="ps-small" style="margin-top:-6px">${e?esc(e.name)+' ('+esc(e.code)+')':''} · ${stPill(m.status)}${m.top_score!=null?` · ${L('best match','सबसे अच्छा मिलान')} ${(+m.top_score).toFixed(3)}`:''}${m.latency_ms?` · ${(m.latency_ms/1000).toFixed(1)} s`:''}</p>
   <label>${L('Question','सवाल')}</label><div class="ps-ex">${esc(m.question)}</div><label>${L('Answer','जवाब')}</label><div class="ps-ex">${esc(m.answer)}</div>
   ${(m.sources||[]).map(s=>`<label>${esc(s.policy_name)} v${esc(s.version)} · ${esc(s.label||'')}</label><div class="ps-ex" style="max-height:200px">${esc(s.excerpt||'')}</div>`).join('')}
   ${fb?`<label>${L('Feedback','फ़ीडबैक')}</label><div>${fb.rating===1?'👍':'👎'} ${esc(fb.comment||'')}</div>`:''}<div class="acts"><button type="button" class="btn btn-p" data-close>${L('Close','बंद करें')}</button></div>`,(f,close)=>close());
  bg.querySelector('.modal').style.maxWidth='720px'}

function csv(name,head,rows){const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const s='﻿'+[head,...rows].map(r=>r.map(q).join(',')).join('\r\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([s],{type:'text/csv;charset=utf-8'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}

/* ---------- events of the page ---------- */
{const _bx=bindExtra;bindExtra=function(){_bx.apply(this,arguments);if(state.page!=='policies')return;const m=document.getElementById('main');if(!m)return;
  m.querySelectorAll('[data-poltab]').forEach(b=>b.onclick=()=>{state.poltab=b.dataset.poltab;if(b.dataset.poltab==='list')PM.loaded=false;render()});
  const on=(s,f)=>m.querySelectorAll(s).forEach(f);
  on('[data-pmup]',b=>b.onclick=()=>uploadModal(null));
  on('[data-pmreload]',b=>b.onclick=()=>{PM.loaded=false;render()});
  on('[data-pmnew]',b=>b.onclick=()=>uploadModal(b.dataset.pmnew));
  on('[data-pmedit]',b=>b.onclick=()=>editModal(b.dataset.pmedit));
  on('[data-pmview]',b=>b.onclick=()=>viewModal(b.dataset.pmview));
  on('[data-pmpub]',b=>b.onclick=()=>confirmModal(L('Publish this version?','यह वर्ज़न प्रकाशित करें?'),L('Employees will get answers from this version from now on. The older version stops being used.','अब से कर्मचारियों को इसी वर्ज़न से जवाब मिलेंगे। पुराना वर्ज़न इस्तेमाल होना बंद होगा।'),L('Publish','प्रकाशित करें'),async()=>{await pa({action:'publish',version_id:b.dataset.pmpub});toast(L('Published','प्रकाशित हो गया'));PM.loaded=false;render()}));
  on('[data-pmretry]',b=>b.onclick=()=>act({action:'retry',version_id:b.dataset.pmretry},L('Processing again','फिर से प्रोसेस हो रहा है')));
  on('[data-pmarc]',b=>b.onclick=()=>confirmModal(L('Archive this policy?','यह पॉलिसी आर्काइव करें?'),L('Employees stop getting answers from it at once. You can restore it later.','कर्मचारियों को इससे जवाब मिलना तुरंत बंद होगा। बाद में वापस ला सकते हैं।'),L('Archive','आर्काइव'),async()=>{await pa({action:'archive',policy_id:b.dataset.pmarc});toast(L('Archived','आर्काइव हो गई'));PM.loaded=false;render()}));
  on('[data-pmres]',b=>b.onclick=()=>act({action:'restore',policy_id:b.dataset.pmres},L('Restored','वापस आ गई')));
  on('[data-pmdel]',b=>b.onclick=()=>{const p=PM.pols.find(x=>x.id===b.dataset.pmdel);confirmModal(L('Delete this policy for good?','यह पॉलिसी हमेशा के लिए हटाएँ?'),`<b>${esc(p?p.name:'')}</b><br>${L('All its versions and files are deleted. Past chat logs stay. To only stop it, use Archive.','इसके सभी वर्ज़न और फ़ाइलें हट जाएँगी। पुराने चैट लॉग रहेंगे। सिर्फ़ रोकना हो तो आर्काइव करें।')}`,L('Delete','हटाएँ'),async()=>{await pa({action:'delete',policy_id:b.dataset.pmdel});toast(L('Deleted','हटा दी गई'));PM.loaded=false;render()})});
  // test chat
  const tb=m.querySelector('[data-pmtest]');if(tb){TESTCHAT.el=tb;bindChat(TESTCHAT)}else TESTCHAT.el=null;
  on('[data-pmtrole]',s=>s.onchange=()=>{TESTCHAT.test.role=s.value});
  on('[data-pmtdept]',s=>s.onchange=()=>{TESTCHAT.test.dept=s.value});
  on('[data-pmtclear]',b=>b.onclick=()=>{TESTCHAT.session=null;TESTCHAT.msgs=[];chatRefresh(TESTCHAT)});
  // unanswered
  on('[data-unf]',x=>x.onchange=()=>{PM.un.from=x.value;unLoad()});on('[data-unt]',x=>x.onchange=()=>{PM.un.to=x.value;unLoad()});on('[data-unr]',x=>x.onchange=()=>{PM.un.resolved=x.checked;unLoad()});
  on('[data-unres]',b=>b.onclick=async()=>{const g=unQs()[+b.dataset.unres];if(!g)return;b.disabled=true;const r=await sb().from('unanswered_questions').update({resolved:true,resolved_at:new Date().toISOString(),resolved_by:uid()}).in('id',g.ids);if(r.error){b.disabled=false;return toast(r.error.message)}toast(t('saved'));unLoad()});
  on('[data-uncsv]',b=>b.onclick=()=>csv(`unanswered_${PM.un.from}_${PM.un.to}.csv`,['Question','Times','Last asked','Resolved'],unQs().map(g=>[g.q,g.n,dtS(g.last),g.res?'Yes':'No'])));
  // logs
  on('[data-lgf]',x=>x.onchange=()=>{PM.lg.from=x.value;lgLoad()});on('[data-lgt]',x=>x.onchange=()=>{PM.lg.to=x.value;lgLoad()});on('[data-lgs]',x=>x.onchange=()=>{PM.lg.st=x.value;lgLoad()});
  on('[data-lgb]',x=>x.onchange=()=>{PM.lg.fb=x.value;render()});
  on('[data-lgq]',x=>{x.oninput=()=>{PM.lg.q=x.value;clearTimeout(PM.lgT);PM.lgT=setTimeout(()=>{const pos=x.selectionStart;render();const n=document.querySelector('[data-lgq]');if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}}},350)}});
  on('[data-lgopen]',r=>r.onclick=()=>lgOpen(lgFiltered()[+r.dataset.lgopen]));
  on('[data-lgcsv]',b=>b.onclick=()=>csv(`chat_logs_${PM.lg.from}_${PM.lg.to}.csv`,['Date time','Employee code','Employee','Question','Answer','Status','Source','Feedback','Comment'],lgFiltered().map(m=>{const e=empOf(m.employee_id),fb=(m.chat_feedback||[])[0];return [dtS(m.created_at),e?e.code:'',e?e.name:'',m.question,m.answer,m.status,(m.sources||[]).map(s=>s.policy_name+' '+(s.label||'')).join('; '),fb?(fb.rating===1?'up':'down'):'',fb?fb.comment||'':'']})));
}}

/* =====================================================================================
   ERP User Guide in the HR Assistant: ONE copy for every company (platform admin keeps it indexed)
   Each entry carries its licence module and the roles that may see it, so the server shows a company
   only the entries of the modules it has, and a person only the entries of the pages their role can open.
   ===================================================================================== */
const GI={status:null,loading:false,busy:false,ver:null,entries:null,err:''};
const R4=['admin','hr','manager','employee'];
function guidePayload(){
  const out=[], tx=(x,i)=>Array.isArray(x)?(x[i]||x[0]||''):(x||'');
  (window.GUIDE||[]).forEach(m=>{
    let app=null;try{app=PAGEMOD[m.id]||null}catch(e){}
    let view=R4;
    if(m.id!=='start'){try{view=R4.filter(r=>(RIGHTS[r]&&RIGHTS[r][m.id]||[]).includes('V'))}catch(e){}}
    (m.entries||[]).forEach(e=>{
      const roles=e.hr?view.filter(r=>r==='admin'||r==='hr'):view;if(!roles.length)return;
      const text=i=>{const L2=[];if(e.what)L2.push(tx(e.what,i));if(e.why)L2.push(tx(e.why,i));if(e.who)L2.push((i?'कौन: ':'Who: ')+tx(e.who,i));
        if(e.steps&&e.steps.length)L2.push((i?'स्टेप:':'Steps:')+'\n'+e.steps.map((st,k)=>`${k+1}. ${tx(st,i)}`).join('\n'));
        if(e.notes&&e.notes.length)L2.push((i?'जानने लायक:':'Good to know:')+'\n'+e.notes.map(n=>'- '+tx(n,i)).join('\n'));return L2.join('\n')};
      out.push({module_id:m.id,entry_id:String(e.id),app_module:app,allowed_roles:roles,module_name:tx(m.name,0),title:tx(e.n,0),path:tx(e.path,0),content_en:text(0),content_hi:text(1)})})});
  /* one entry for every KPI (app/kpiguide.js): so that a question with a KPI number, or "how to score well in KPI-277", finds it */
  try{if(typeof window.kpiGuideEntries==='function')out.push(...window.kpiGuideEntries())}catch(e){}
  return out}
async function guideVersion(entries){const b=new TextEncoder().encode(JSON.stringify(entries));const h=await crypto.subtle.digest('SHA-256',b);return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,'0')).join('').slice(0,32)}
async function guideLoad(){if(GI.loading)return;GI.loading=true;
  try{if(!GI.entries){GI.entries=guidePayload();GI.ver=await guideVersion(GI.entries)}GI.status=await pa({action:'guide_status'});GI.err=''}catch(e){GI.err=e.message}
  GI.loading=false;mountGuideCard()}
function guideCardHTML(){const s=GI.status, n=(GI.entries||[]).length, same=s&&s.live_version&&s.live_version===GI.ver;
  const pill=!s?'':!s.live_version?`<span class="pill p-warn">${L('Not indexed yet','अभी इंडेक्स नहीं हुई')}</span>`:same?`<span class="pill p-ok">${L('Up to date','अप-टू-डेट')}</span>`:`<span class="pill p-warn">${L('Guide changed: re-index needed','गाइड बदली: दोबारा इंडेक्स करें')}</span>`;
  return `<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><div style="flex:1;min-width:240px"><b>${L('HR Assistant · LV People User Guide','HR सहायक · LV People यूज़र गाइड')}</b> ${pill}
   <div class="ps-small" style="margin-top:4px">${L('One copy for every company. Each company gets only the entries of its own modules, and each person only those their role can open. Company policies stay separate per company.','सभी कंपनियों के लिए एक ही कॉपी। हर कंपनी को सिर्फ़ उसके अपने मॉड्यूल की एंट्री मिलती हैं, और हर व्यक्ति को सिर्फ़ वही जो उसका रोल खोल सकता है। कंपनी की पॉलिसी हर कंपनी की अलग रहती हैं।')}</div>
   <div class="ps-small">${GI.err?`<span style="color:var(--bad)">${esc(GI.err)}</span>`:s?`${L('Indexed','इंडेक्स')}: ${s.entries||0} ${L('entries','एंट्री')}${s.indexed_at?' · '+dtS(s.indexed_at):''} · ${L('In this app','इस ऐप में')}: ${n}`:'…'}</div></div>
   <button class="btn ${same?'btn-o':'btn-p'} btn-s" data-gidx ${GI.busy||!GI.ver?'disabled':''}>${GI.busy?L('Indexing…','इंडेक्स हो रही है…'):L('Re-index User Guide','यूज़र गाइड दोबारा इंडेक्स करें')}</button></div>`}
function mountGuideCard(){
  const on=state.role==='platform'&&state.page==='lvclients'&&LIVE.on&&LIVE.platform&&!LIVE.salesOnly, m=document.getElementById('main');
  let c=document.getElementById('giCard');if(!on||!m){if(c)c.remove();return}
  if(!c){c=document.createElement('div');c.id='giCard';c.className='card';c.style.marginBottom='14px'}
  const h=m.querySelector('.page-h');if(h&&h.nextSibling!==c)h.after(c);else if(!h&&m.firstChild!==c)m.prepend(c);
  c.innerHTML=guideCardHTML();
  const b=c.querySelector('[data-gidx]');if(b)b.onclick=async()=>{GI.busy=true;mountGuideCard();
    try{const r=await pa({action:'guide_index',version:GI.ver,entries:GI.entries});toast(r.unchanged?L('Already up to date','पहले से अप-टू-डेट'):L('User Guide indexed: ','यूज़र गाइड इंडेक्स हुई: ')+r.entries);GI.status=null}catch(e){toast(e.message)}
    GI.busy=false;guideLoad()};
  if(!GI.status&&!GI.err)guideLoad()}
{const _r2=render;render=function(){_r2.apply(this,arguments);try{mountGuideCard()}catch(e){}}}
})();
