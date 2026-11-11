/* Builds the User Guide PDFs (English and Hindi) from the files in app/guide/*.js.
   The Guide page in the app reads the same files, so the app and the PDF can never disagree.
   Run:  node tools/build-guide.js
   Needs Microsoft Edge or Google Chrome on the computer (used to print the PDF, which also shapes the Hindi letters correctly). */
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process'), os = require('os');
const dir = path.join(__dirname, '..', 'app', 'guide');
const files = fs.readdirSync(dir).filter(f => /^g\d+\.js$/.test(f)).sort();
const ctx = {}; ctx.window = ctx; vm.createContext(ctx); /* the window is the global object, as in the browser */
files.forEach(f => vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: f }));
const GUIDE = ctx.GUIDE;
const stamp = new Date().toISOString().slice(0, 10);
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function html(lang) {
  const i = lang === 'hi' ? 1 : 0, T = (x) => Array.isArray(x) ? x[i] : (x || '');
  const U = lang === 'hi'
    ? { title: 'Mirror-HR यूज़र गाइड', sub: 'ERP का हर हिस्सा कैसे काम करता है: कहाँ जाना है, क्या दबाना है, यह क्यों है।', toc: 'विषय-सूची', where: 'कहाँ', what: 'यह क्या है', why: 'यह क्यों है', who: 'कौन इस्तेमाल करता है', steps: 'स्टेप बाय स्टेप', notes: 'जानने लायक', hr: 'HR और Admin के लिए', ver: 'तारीख़', n: 'मॉड्यूल', e: 'फ़ंक्शन' }
    : { title: 'Mirror-HR User Guide', sub: 'How every part of the ERP works: where to go, what to click, why it is there.', toc: 'Contents', where: 'Where', what: 'What it is', why: 'Why it is there', who: 'Who uses it', steps: 'Step by step', notes: 'Good to know', hr: 'For HR and Admin', ver: 'Date', n: 'modules', e: 'functions' };
  const total = GUIDE.reduce((a, m) => a + m.entries.length, 0);
  let toc = '', body = '';
  GUIDE.forEach((m, mi) => {
    toc += `<div class="toc-m"><a href="#m${mi}">${mi + 1}. ${esc(T(m.name))}</a></div>` + m.entries.map(e => `<div class="toc-e"><a href="#m${mi}-${e.id}">${esc(T(e.n))}</a></div>`).join('');
    body += `<section class="mod" id="m${mi}"><h1>${mi + 1}. ${esc(T(m.name))}</h1><p class="desc">${esc(T(m.desc))}</p>`;
    m.entries.forEach(e => {
      const row = (lab, v) => v ? `<p><b>${lab}:</b> ${esc(T(v))}</p>` : '';
      body += `<div class="ent" id="m${mi}-${e.id}"><h2>${esc(T(e.n))}${e.hr ? ` <span class="tag">${U.hr}</span>` : ''}</h2>`
        + (e.path ? `<p class="path">${U.where}: ${esc(T(e.path))}</p>` : '') + row(U.what, e.what) + row(U.why, e.why) + row(U.who, e.who)
        + (e.steps && e.steps.length ? `<p><b>${U.steps}:</b></p><ol>${e.steps.map(s => `<li>${esc(T(s))}</li>`).join('')}</ol>` : '')
        + (e.notes && e.notes.length ? `<div class="note"><b>${U.notes}:</b><ul>${e.notes.map(s => `<li>${esc(T(s))}</li>`).join('')}</ul></div>` : '') + '</div>';
    });
    body += '</section>';
  });
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${U.title}</title><style>
  @page{size:A4;margin:16mm 14mm 16mm 14mm}
  body{font-family:${lang === 'hi' ? "'Nirmala UI','Mangal','Segoe UI'" : "'Segoe UI',Arial"},sans-serif;color:#1b2a28;font-size:11pt;line-height:1.5}
  .cover{height:240mm;display:flex;flex-direction:column;justify-content:center;border-left:8px solid #0f766e;padding-left:18mm;page-break-after:always}
  .cover h1{font-size:34pt;margin:0 0 8px;color:#0f766e}.cover p{font-size:14pt;margin:4px 0;color:#445}
  .toc{page-break-after:always}.toc h1{color:#0f766e}.toc-m{margin-top:7px;font-weight:700}.toc-e{margin-left:16px;font-size:10pt}.toc a{color:inherit;text-decoration:none}
  .mod{page-break-before:always}.mod h1{color:#0f766e;border-bottom:2px solid #0f766e;padding-bottom:4px;font-size:21pt}.desc{background:#e6f4f1;padding:8px 12px;border-radius:6px}
  .ent{margin:14px 0;padding:10px 0;border-top:1px solid #d6dedc;page-break-inside:avoid}.ent h2{font-size:14pt;margin:0 0 4px}.ent p{margin:4px 0}
  .path{background:#eef6e8;display:inline-block;padding:2px 8px;border-radius:5px;font-size:10pt}.tag{font-size:8.5pt;background:#e6f4f1;color:#0f766e;padding:1px 6px;border-radius:4px;font-weight:400}
  ol,ul{margin:3px 0 6px 20px;padding:0}li{margin:2px 0}.note{background:#f3f7f6;border-radius:6px;padding:6px 10px;margin-top:6px;font-size:10pt}
  </style></head><body>
  <div class="cover"><h1>${U.title}</h1><p>${U.sub}</p><p>${GUIDE.length} ${U.n} · ${total} ${U.e}</p><p>${U.ver}: ${stamp}</p></div>
  <div class="toc"><h1>${U.toc}</h1>${toc}</div>${body}</body></html>`;
}

function browser() {
  const c = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'];
  return c.find(p => fs.existsSync(p));
}
const br = browser();
if (!br) { console.error('No Edge or Chrome found: cannot print the PDF.'); process.exit(1); }
['en', 'hi'].forEach(lang => {
  const tmp = path.join(os.tmpdir(), `guide-${lang}.html`), out = path.join(dir, `LV-People-User-Guide-${lang.toUpperCase()}.pdf`);
  fs.writeFileSync(tmp, html(lang), 'utf8');
  cp.execFileSync(br, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--user-data-dir=${path.join(os.tmpdir(), 'guide-profile-' + lang)}`, `--print-to-pdf=${out}`, 'file:///' + tmp.replace(/\\/g, '/')], { stdio: 'ignore', timeout: 120000 });
  console.log(lang.toUpperCase(), fs.statSync(out).size, 'bytes', out);
});
console.log('Modules:', GUIDE.length, 'Functions:', GUIDE.reduce((a, m) => a + m.entries.length, 0));
