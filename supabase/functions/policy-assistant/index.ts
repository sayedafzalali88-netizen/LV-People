// Server function "policy-assistant" (Supabase Edge Function).
// Employees ask about company policy; the answer comes ONLY from the policies of their own company.
// Every request: the signed-in person's own profile decides the company, role and department (nothing from the browser is trusted).
// Deploy: supabase functions deploy policy-assistant --no-verify-jwt   (the function checks the login itself; the cron call has no login)
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.118.0";
import { PDFDocument } from "npm:pdf-lib@1.17.1";
import { chunkPages, extractDocx, extractPdf, extractTxt, fileTypeOf, MIN_PAGE_CHARS, parseOcr, sourceLabel, type Page } from "./extract.ts";
import { answer, CFG, describeAiError, embed, ocrPdf, searchQuery, vectorLiteral, type Ctx } from "./ai.ts";
import { checkAnswer, NOT_FOUND } from "./check.ts";

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

const env = (k: string, d = "") => Deno.env.get(k) ?? d;
const num = (k: string, d: number) => { const v = Number(env(k)); return Number.isFinite(v) && env(k) !== "" ? v : d; };
const SETTINGS = {
  minScore: () => num("POLICY_MIN_SCORE", 0.45),        // top match below this: no AI call, fixed "not available" answer
  topK: () => Math.min(Math.max(num("POLICY_TOP_K", 5), 4), 6), // 4–6 policy parts go to the AI
  perMinute: () => num("POLICY_RATE_PER_MIN", 5),
  monthCap: () => num("POLICY_MONTHLY_CAP", 3000),      // questions per company per month (0 = no limit)
  maxMb: () => num("POLICY_MAX_FILE_MB", 20),
  maxPages: () => num("POLICY_MAX_PAGES", 300),
  ocrBatch: () => Math.min(Math.max(num("POLICY_OCR_BATCH", 4), 1), 10),
  budgetMs: () => Math.max(num("POLICY_WORKER_BUDGET_MS", 100_000), 60_000),
  cronSecret: () => env("POLICY_CRON_SECRET"),
  origins: () => env("POLICY_ALLOWED_ORIGINS", "*"),
};
const CATEGORIES = ["Leave", "Attendance", "Salary", "Conduct", "Travel", "Holiday", "Benefits", "Safety", "IT", "Exit", "Other"];
const ROLES = ["admin", "hr", "manager", "employee"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FN_URL = `${env("SUPABASE_URL")}/functions/v1/policy-assistant`;

const db: SupabaseClient = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });

class HttpError extends Error { constructor(public status: number, msg: string) { super(msg); } }
class PermanentError extends Error {}   // a file problem: trying again will not help

function cors(req: Request): Record<string, string> {
  const allowed = SETTINGS.origins().split(",").map((s) => s.trim()).filter(Boolean), origin = req.headers.get("Origin") || "";
  const allow = allowed.includes("*") ? "*" : allowed.includes(origin) ? origin : allowed[0] || "";
  return { "Access-Control-Allow-Origin": allow, "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", Vary: "Origin" };
}
const json = (req: Request, body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...cors(req) } });
const must = <T>(r: { data: T; error: { message: string } | null }, what: string): T => { if (r.error) throw new Error(`${what}: ${r.error.message}`); return r.data; };

// ---------------------------------------------------------------- who is asking
type Me = { user_id: string; client_id: string; client_name: string; role: string; isHr: boolean; employee_id: string | null; dept_id: string | null; name: string };

async function whoAmI(req: Request): Promise<Me> {
  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!jwt) throw new HttpError(401, "Please sign in again.");
  const u = await db.auth.getUser(jwt);
  if (u.error || !u.data.user) throw new HttpError(401, "Please sign in again.");
  const uid = u.data.user.id;
  const p = must(await db.from("profiles").select("user_id, client_id, employee_id, role, active").eq("user_id", uid).maybeSingle(), "profile");
  if (!p || !p.active || !p.client_id) throw new HttpError(403, "This login is not active for a company.");
  const c = must(await db.from("clients").select("id, name, status, modules").eq("id", p.client_id).maybeSingle(), "company");
  if (!c || c.status === "suspended") throw new HttpError(403, "Your company's login is not active.");
  const mods = Array.isArray(c.modules) ? c.modules : [];
  if (!mods.includes("policy")) throw new HttpError(403, "Policy Assistant is not switched on for your company.");
  let dept: string | null = null, name = "";
  if (p.employee_id) {
    const e = must(await db.from("employees").select("department_id, name, client_id").eq("id", p.employee_id).maybeSingle(), "employee");
    if (e && e.client_id === p.client_id) { dept = e.department_id || null; name = e.name || ""; }
  }
  return { user_id: uid, client_id: p.client_id, client_name: c.name || "the company", role: p.role, isHr: p.role === "admin" || p.role === "hr", employee_id: p.employee_id, dept_id: dept, name };
}
const requireHr = (me: Me) => { if (!me.isHr) throw new HttpError(403, "Only HR or Admin can do this."); };

async function audit(me: Me | null, client_id: string, action: string, subject: string, detail = "") {
  try { await db.from("audit_log").insert({ client_id, user_id: me?.user_id ?? null, module: "Policy", action, subject: subject.slice(0, 200), detail: detail.slice(0, 500) }); } catch { /* the audit log never blocks the work */ }
}

async function myPolicy(me: Me, id: unknown) {
  if (typeof id !== "string" || !UUID.test(id)) throw new HttpError(400, "Wrong policy.");
  const p = must(await db.from("policies").select("*").eq("id", id).eq("client_id", me.client_id).maybeSingle(), "policy");
  if (!p) throw new HttpError(404, "Policy not found.");
  return p;
}
async function myVersion(me: Me, id: unknown) {
  if (typeof id !== "string" || !UUID.test(id)) throw new HttpError(400, "Wrong version.");
  const v = must(await db.from("policy_versions").select("*").eq("id", id).eq("client_id", me.client_id).maybeSingle(), "version");
  if (!v) throw new HttpError(404, "Version not found.");
  return v;
}

// ---------------------------------------------------------------- admin: upload and manage
function cleanMeta(fd: FormData) {
  const s = (k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);
  const name = s("name", 150), category = s("category", 30), version = s("version", 30) || "1", eff = s("effective_date", 10);
  if (name.length < 2) throw new HttpError(400, "Write the policy name.");
  if (!CATEGORIES.includes(category)) throw new HttpError(400, "Choose a category.");
  if (eff && !/^\d{4}-\d{2}-\d{2}$/.test(eff)) throw new HttpError(400, "The effective date is wrong.");
  let roles: string[] = [], depts: string[] = [];
  try { roles = JSON.parse(s("allowed_roles", 200) || "[]"); depts = JSON.parse(s("allowed_departments", 20000) || "[]"); } catch { throw new HttpError(400, "Wrong roles or departments."); }
  roles = [...new Set(roles.filter((r) => ROLES.includes(r)))];
  depts = [...new Set(depts.filter((d) => typeof d === "string" && UUID.test(d)))];
  if (!roles.length) throw new HttpError(400, "Choose at least one role that may see this policy.");
  return { name, category, version, effective_date: eff || null, roles, depts, auto_publish: s("auto_publish", 1) !== "0" };
}

async function upload(req: Request, me: Me) {
  requireHr(me);
  const fd = await req.formData();
  const file = fd.get("file");
  if (!(file instanceof File) || !file.size) throw new HttpError(400, "Choose the policy file.");
  const ft = fileTypeOf(file.name);
  if (!ft) throw new HttpError(400, "Only PDF, DOCX or TXT files can be uploaded.");
  if (file.size > SETTINGS.maxMb() * 1024 * 1024) throw new HttpError(400, `The file is larger than ${SETTINGS.maxMb()} MB.`);
  const m = cleanMeta(fd);
  if (m.depts.length) {
    const ok = must(await db.from("departments").select("id").eq("client_id", me.client_id).in("id", m.depts), "departments") as { id: string }[];
    m.depts = ok.map((d) => d.id);
  }
  let policyId = String(fd.get("policy_id") || ""), created = false;
  if (policyId) {
    const p = await myPolicy(me, policyId);
    const busy = must(await db.from("policy_versions").select("id").eq("policy_id", p.id).eq("status", "processing").limit(1), "versions") as unknown[];
    if (busy.length) throw new HttpError(409, "The previous file of this policy is still being processed. Please wait a minute.");
    must(await db.from("policies").update({ name: m.name, category: m.category, allowed_roles: m.roles, allowed_department_ids: m.depts, updated_by: me.user_id }).eq("id", p.id), "update policy");
  } else {
    const p = must(await db.from("policies").insert({ client_id: me.client_id, name: m.name, category: m.category, allowed_roles: m.roles, allowed_department_ids: m.depts, created_by: me.user_id, updated_by: me.user_id }).select("id").single(), "new policy") as { id: string };
    policyId = p.id; created = true;
  }
  const versionId = crypto.randomUUID();
  const safe = file.name.normalize("NFKD").replace(/[^\w.\-]+/g, "_").slice(-80) || `policy.${ft}`;
  const path = `${me.client_id}/${policyId}/${versionId}/${safe}`;
  const up = await db.storage.from("policies").upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (up.error) { if (created) await db.from("policies").delete().eq("id", policyId); throw new Error("File not saved: " + up.error.message); }
  const v = await db.from("policy_versions").insert({ id: versionId, client_id: me.client_id, policy_id: policyId, version: m.version, effective_date: m.effective_date, file_path: path, file_name: file.name.slice(0, 200), file_type: ft, file_size: file.size, auto_publish: m.auto_publish, created_by: me.user_id });
  if (v.error) { await db.storage.from("policies").remove([path]); if (created) await db.from("policies").delete().eq("id", policyId); throw new Error("Version not saved: " + v.error.message); }
  must(await db.from("policy_jobs").insert({ client_id: me.client_id, version_id: versionId, created_by: me.user_id }), "job");
  await audit(me, me.client_id, created ? "Uploaded" : "New version", m.name, `v${m.version} ${file.name}`);
  startWorker();
  return { policy_id: policyId, version_id: versionId };
}

async function updatePolicy(body: Record<string, unknown>, me: Me) {
  requireHr(me);
  const p = await myPolicy(me, body.policy_id);
  const fd = new FormData();
  for (const k of ["name", "category"]) fd.set(k, String(body[k] ?? p[k]));
  fd.set("allowed_roles", JSON.stringify(body.allowed_roles ?? p.allowed_roles));
  fd.set("allowed_departments", JSON.stringify(body.allowed_departments ?? p.allowed_department_ids));
  const m = cleanMeta(fd);
  if (m.depts.length) m.depts = (must(await db.from("departments").select("id").eq("client_id", me.client_id).in("id", m.depts), "departments") as { id: string }[]).map((d) => d.id);
  must(await db.from("policies").update({ name: m.name, category: m.category, allowed_roles: m.roles, allowed_department_ids: m.depts, updated_by: me.user_id }).eq("id", p.id), "update");
  await audit(me, me.client_id, "Changed", m.name, `roles ${m.roles.join(",")}; departments ${m.depts.length || "all"}`);
  return { ok: true };
}

async function publish(body: Record<string, unknown>, me: Me) {
  requireHr(me);
  const v = await myVersion(me, body.version_id);
  if (v.status !== "ready") throw new HttpError(409, "Only a processed version (Ready) can be published.");
  must(await db.rpc("policy_activate_version", { p_version: v.id, p_by: me.user_id }), "publish");
  const p = must(await db.from("policies").select("name, status").eq("id", v.policy_id).single(), "policy") as { name: string; status: string };
  await audit(me, me.client_id, "Published", p.name, "v" + v.version);
  return { ok: true };
}

async function setArchived(body: Record<string, unknown>, me: Me, archived: boolean) {
  requireHr(me);
  const p = await myPolicy(me, body.policy_id);
  must(await db.rpc("policy_set_archived", { p_policy: p.id, p_archived: archived, p_by: me.user_id }), "archive");
  await audit(me, me.client_id, archived ? "Archived" : "Restored", p.name);
  return { ok: true };
}

async function remove(body: Record<string, unknown>, me: Me) {
  requireHr(me);
  const p = await myPolicy(me, body.policy_id);
  const vs = must(await db.from("policy_versions").select("file_path").eq("policy_id", p.id), "versions") as { file_path: string }[];
  if (vs.length) await db.storage.from("policies").remove(vs.map((v) => v.file_path));
  must(await db.from("policies").update({ live_version_id: null }).eq("id", p.id), "unlink");
  must(await db.from("policies").delete().eq("id", p.id).eq("client_id", me.client_id), "delete");
  await audit(me, me.client_id, "Deleted", p.name, `${vs.length} version(s)`);
  return { ok: true };
}

async function retry(body: Record<string, unknown>, me: Me) {
  requireHr(me);
  const v = await myVersion(me, body.version_id);
  if (v.status !== "failed") throw new HttpError(409, "Only a failed version can be tried again.");
  must(await db.from("policy_versions").update({ status: "processing", error: null }).eq("id", v.id), "version");
  must(await db.from("policy_jobs").delete().eq("version_id", v.id), "old job");
  must(await db.from("policy_jobs").insert({ client_id: me.client_id, version_id: v.id, created_by: me.user_id }), "job");
  startWorker();
  return { ok: true };
}

async function fileUrl(body: Record<string, unknown>, me: Me) {
  requireHr(me);
  const v = await myVersion(me, body.version_id);
  const r = await db.storage.from("policies").createSignedUrl(v.file_path, 600, { download: v.file_name });
  if (r.error) throw new Error(r.error.message);
  return { url: r.data.signedUrl };
}

// ---------------------------------------------------------------- background processing
let workerRunning = false;
function startWorker() {
  const p = runWorker().catch((e) => console.error("worker", e));
  if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(p);
}

async function kickAgain() {
  if (!SETTINGS.cronSecret()) return;   // without the secret the minute schedule cannot call us either
  try { await fetch(FN_URL, { method: "POST", headers: { "Content-Type": "application/json", "x-cron-secret": SETTINGS.cronSecret() }, body: '{"action":"process"}' }); } catch (e) { console.error("kick", e); }
}

async function runWorker() {
  if (workerRunning) return;
  workerRunning = true;
  const deadline = Date.now() + SETTINGS.budgetMs();
  let more = false;                     // a job is not finished because this run's time is up
  try {
    while (Date.now() < deadline - 20_000) {
      const r = await db.rpc("policy_claim_job");
      if (r.error) throw r.error;
      const job = (r.data as Job[] | null)?.[0];
      if (!job) break;
      if (!(await processJob(job, deadline))) { more = true; break; }
    }
  } finally { workerRunning = false; }
  // continue in a fresh run with a full time budget (jobs waiting after an error are picked up by the minute schedule)
  if (more) await kickAgain();
}

type Job = { id: string; client_id: string; version_id: string; stage: string; status: string; runs: number; errors: number };
type Version = { id: string; client_id: string; policy_id: string; version: string; file_path: string; file_name: string; file_type: "pdf" | "docx" | "txt"; auto_publish: boolean; ocr_pages: number; created_by: string | null };
const fileCache = new Map<string, Uint8Array>();

async function fileBytes(v: Version): Promise<Uint8Array> {
  const hit = fileCache.get(v.id);
  if (hit) return hit;
  const r = await db.storage.from("policies").download(v.file_path);
  if (r.error || !r.data) throw new Error("File could not be read from storage: " + (r.error?.message || ""));
  const b = new Uint8Array(await r.data.arrayBuffer());
  fileCache.clear(); fileCache.set(v.id, b);
  return b;
}

async function failVersion(v: { id: string }, jobId: string, msg: string) {
  await db.from("policy_versions").update({ status: "failed", error: msg.slice(0, 500) }).eq("id", v.id);
  await db.from("policy_jobs").update({ status: "failed", last_error: msg.slice(0, 500), locked_until: null }).eq("id", jobId);
  await db.from("policy_pages").delete().eq("version_id", v.id);
}

/** Returns true when the job needs nothing more from this run (finished, failed, or waiting after an error); false when time ran out. */
async function processJob(job: Job, deadline: number): Promise<boolean> {
  const v = must(await db.from("policy_versions").select("*").eq("id", job.version_id).maybeSingle(), "version") as Version | null;
  if (!v) { await db.from("policy_jobs").update({ status: "failed", last_error: "version deleted", locked_until: null }).eq("id", job.id); return true; }
  if (job.runs > 80) { await failVersion(v, job.id, "Processing took too long. Try a smaller file or upload again."); return true; }
  let stage = job.stage;
  try {
    while (stage !== "done" && Date.now() < deadline - 20_000) {
      const next = await runStage(v, stage, deadline);
      if (next === stage) break;                       // this stage needs more time: continue in the next run
      stage = next;
      await db.from("policy_jobs").update(stage === "done" ? { status: "done", locked_until: null } : { stage }).eq("id", job.id);
    }
    if (stage === "done") return true;
    await db.from("policy_jobs").update({ status: "queued", stage, locked_until: null }).eq("id", job.id);
    return false;
  } catch (e) {
    const msg = describeAiError(e);
    console.error("job", job.id, stage, msg);
    if (e instanceof PermanentError || job.errors + 1 >= 3) { await failVersion(v, job.id, msg); return true; }
    await db.from("policy_jobs").update({ status: "queued", stage, errors: job.errors + 1, last_error: msg.slice(0, 500), locked_until: new Date(Date.now() + 30_000 * (job.errors + 1)).toISOString() }).eq("id", job.id);
    return true;
  }
}

async function runStage(v: Version, stage: string, deadline: number): Promise<string> {
  if (stage === "extract") {
    const bytes = await fileBytes(v);
    let pages: Page[];
    try {
      pages = v.file_type === "pdf" ? await extractPdf(bytes) : v.file_type === "docx" ? extractDocx(bytes) : extractTxt(bytes);
    } catch (e) {
      throw new PermanentError(e instanceof Error && /password|encrypt/i.test(e.message) ? "This PDF is password protected. Upload a file without a password." : "The file could not be read: " + (e instanceof Error ? e.message : String(e)));
    }
    if (pages.length > SETTINGS.maxPages()) throw new PermanentError(`The file has ${pages.length} pages; the limit is ${SETTINGS.maxPages()}.`);
    if (!pages.length) throw new PermanentError("No text was found in this file.");
    must(await db.from("policy_pages").delete().eq("version_id", v.id), "pages");
    for (let i = 0; i < pages.length; i += 100) {
      must(await db.from("policy_pages").insert(pages.slice(i, i + 100).map((p) => ({ version_id: v.id, client_id: v.client_id, ...p }))), "pages");
    }
    await db.from("policy_versions").update({ pages: pages.length }).eq("id", v.id);
    const scanned = pages.filter((p) => p.need_ocr).length;
    if (!scanned) return "chunk";
    if (CFG.ocr()) return "ocr";
    if (scanned === pages.length) throw new PermanentError("This looks like a scanned PDF (no text). OCR is switched off: upload a PDF with text, or a DOCX.");
    return "chunk";
  }

  if (stage === "ocr") {
    while (Date.now() < deadline - 50_000) {
      const todo = must(await db.from("policy_pages").select("page_no").eq("version_id", v.id).eq("need_ocr", true).order("page_no").limit(SETTINGS.ocrBatch()), "pages") as { page_no: number }[];
      if (!todo.length) return "chunk";
      const nums = todo.map((t) => t.page_no);
      const src = await PDFDocument.load(await fileBytes(v), { ignoreEncryption: true });
      const out = await PDFDocument.create();
      (await out.copyPages(src, nums.map((n) => n - 1))).forEach((p) => out.addPage(p));
      const r = await ocrPdf(await out.save(), nums);
      const texts = parseOcr(r.text, nums);
      for (const n of nums) {
        must(await db.from("policy_pages").update({ text: texts.get(n) ?? "", source: "ocr", need_ocr: false }).eq("version_id", v.id).eq("page_no", n), "ocr page");
      }
      v.ocr_pages += nums.length;
      await db.from("policy_versions").update({ ocr_pages: v.ocr_pages }).eq("id", v.id);
    }
    return "ocr";
  }

  if (stage === "chunk") {
    const pages = must(await db.from("policy_pages").select("page_no, text").eq("version_id", v.id).order("page_no"), "pages") as { page_no: number; text: string }[];
    const letters = pages.reduce((a, p) => a + (p.text.match(/[\p{L}\p{N}]/gu) || []).length, 0);
    if (letters < MIN_PAGE_CHARS) throw new PermanentError("No readable text was found in this file, even after OCR.");
    const chunks = chunkPages(pages.filter((p) => p.text.trim()));
    must(await db.from("policy_chunks").delete().eq("version_id", v.id), "old chunks");
    for (let i = 0; i < chunks.length; i += 100) {
      must(await db.from("policy_chunks").insert(chunks.slice(i, i + 100).map((c) => ({ ...c, client_id: v.client_id, policy_id: v.policy_id, version_id: v.id, created_by: v.created_by }))), "chunks");
    }
    await db.from("policy_versions").update({ chunks: chunks.length }).eq("id", v.id);
    return "embed";
  }

  if (stage === "embed") {
    const pol = must(await db.from("policies").select("name").eq("id", v.policy_id).single(), "policy") as { name: string };
    while (Date.now() < deadline - 20_000) {
      const rows = must(await db.from("policy_chunks").select("id, heading, content").eq("version_id", v.id).is("embedding", null).order("chunk_no").limit(64), "chunks") as { id: string; heading: string | null; content: string }[];
      if (!rows.length) return "finish";
      const vecs = await embed(rows.map((r) => `${pol.name}${r.heading ? " — " + r.heading : ""}\n${r.content}`), "document");
      must(await db.rpc("policy_set_embeddings", { p_ids: rows.map((r) => r.id), p_vectors: vecs.map(vectorLiteral) }), "save embeddings");
    }
    return "embed";
  }

  if (stage === "finish") {
    must(await db.from("policy_versions").update({ status: "ready", processed_at: new Date().toISOString(), error: null }).eq("id", v.id), "ready");
    if (v.auto_publish) must(await db.rpc("policy_activate_version", { p_version: v.id, p_by: v.created_by }), "publish");
    await db.from("policy_pages").delete().eq("version_id", v.id);
    const pol = must(await db.from("policies").select("name").eq("id", v.policy_id).single(), "policy") as { name: string };
    await audit(null, v.client_id, v.auto_publish ? "Processed and published" : "Processed (ready to test)", pol.name, "v" + v.version);
    return "done";
  }
  throw new Error("Unknown stage " + stage);
}

// ---------------------------------------------------------------- the question
type Match = { chunk_id: string; policy_id: string; version_id: string; policy_name: string; version: string; effective_date: string | null; heading: string | null; page_from: number | null; page_to: number | null; content: string; version_status: string; file_type: string; score: number };

const normQ = (q: string) => q.toLowerCase().normalize("NFKC").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 300);

async function ask(body: Record<string, unknown>, me: Me) {
  const t0 = Date.now();
  const question = String(body.question ?? "").replace(/\s+/g, " ").trim();
  if (question.length < 2) throw new HttpError(400, "Please write your question.");
  if (question.length > 500) throw new HttpError(400, "Please keep the question under 500 letters.");
  const test = body.mode === "test";
  if (test) requireHr(me);
  const role = test ? (ROLES.includes(String(body.test_role)) ? String(body.test_role) : "employee") : me.role;
  const dept = test ? (typeof body.test_dept === "string" && UUID.test(body.test_dept) ? body.test_dept : null) : me.dept_id;

  const rate = must(await db.rpc("policy_rate_check", { p_user: me.user_id, p_client: me.client_id, p_per_min: SETTINGS.perMinute(), p_month_cap: test ? 0 : SETTINGS.monthCap() }), "rate") as string;
  if (rate === "minute") throw new HttpError(429, `Please wait a minute: at most ${SETTINGS.perMinute()} questions per minute.`);
  if (rate === "month") throw new HttpError(429, "Your company's question limit for this month is used up. Please contact HR.");

  // the conversation
  let sessionId: string | null = null;
  if (typeof body.session_id === "string" && UUID.test(body.session_id)) {
    const s = must(await db.from("chat_sessions").select("id").eq("id", body.session_id).eq("user_id", me.user_id).eq("client_id", me.client_id).eq("mode", test ? "test" : "live").maybeSingle(), "session");
    sessionId = s?.id ?? null;
  }
  if (!sessionId) {
    const s = must(await db.from("chat_sessions").insert({ client_id: me.client_id, user_id: me.user_id, employee_id: me.employee_id, mode: test ? "test" : "live", title: question.slice(0, 80), created_by: me.user_id }).select("id").single(), "session") as { id: string };
    sessionId = s.id;
  }

  // search: the question as written, plus an English search line (helps Hindi/Hinglish match English policy text)
  let inTok = 0, outTok = 0;
  const rw = await searchQuery(question);
  if (rw) { inTok += rw.input_tokens; outTok += rw.output_tokens; }
  const queries = rw && rw.q.toLowerCase() !== question.toLowerCase() ? [question, rw.q] : [question];
  const vecs = await embed(queries, "query");
  const best = new Map<string, Match>();
  for (const v of vecs) {
    const rows = must(await db.rpc("policy_match", { p_client: me.client_id, p_role: role, p_dept: dept, p_query: vectorLiteral(v), p_count: 8, p_test: test }), "search") as Match[];
    for (const r of rows) { const o = best.get(r.chunk_id); if (!o || r.score > o.score) best.set(r.chunk_id, r); }
  }
  const ranked = [...best.values()].sort((a, b) => b.score - a.score);
  const top = ranked[0]?.score ?? 0;
  const minScore = SETTINGS.minScore();

  const save = async (status: string, text: string, sources: unknown[], model: string | null) => {
    const m = must(await db.from("chat_messages").insert({
      client_id: me.client_id, session_id: sessionId, user_id: me.user_id, employee_id: me.employee_id, mode: test ? "test" : "live", test_role: test ? role : null,
      question, answer: text, status, sources, top_score: ranked.length ? top : null, model, input_tokens: inTok, output_tokens: outTok, latency_ms: Date.now() - t0, created_by: me.user_id,
    }).select("id").single(), "message") as { id: string };
    await db.from("chat_sessions").update({ last_at: new Date().toISOString() }).eq("id", sessionId);
    if (!test && (status === "not_found" || status === "rejected")) {
      await db.from("unanswered_questions").insert({ client_id: me.client_id, message_id: m.id, user_id: me.user_id, employee_id: me.employee_id, question, question_norm: normQ(question), top_score: ranked.length ? top : null, reason: status, created_by: me.user_id });
    }
    return m.id;
  };
  const reply = async (status: string, text: string, sources: SourceOut[], model: string | null) => {
    const id = await save(status, text, sources, model);
    return { message_id: id, session_id: sessionId, status, answer: text, sources: sources.map(({ chunk_id: _c, policy_id: _p, ...s }) => s), ...(test ? { top_score: top, min_score: minScore } : {}) };
  };

  // rule (a): weak match → no AI call
  if (!ranked.length || top < minScore) return reply("not_found", NOT_FOUND, [], null);

  // rule (b): only the best 4–6 parts go to the AI
  const picked = ranked.filter((r) => r.score >= minScore * 0.8).slice(0, SETTINGS.topK());
  const ctx: (Ctx & { m: Match })[] = picked.map((m, i) => ({
    id: "S" + (i + 1), policy_name: m.policy_name, version: m.version, heading: m.heading,
    label: sourceLabel(m.heading, m.page_from, m.page_to, m.file_type !== "txt"), content: m.content, m,
  }));
  const out = await answer(me.client_name, question, ctx);
  inTok += out.input_tokens; outTok += out.output_tokens;
  const ck = checkAnswer(out, ctx.map((c) => ({ ...c, effective_date: c.m.effective_date })), question);
  if (ck.status !== "answered") {
    if (ck.status === "rejected") console.warn("answer rejected:", ck.why);
    return reply(ck.status, ck.text, [], out.model);
  }
  const sources: SourceOut[] = ck.cited.map((c, i) => {
    const m = ctx.find((x) => x.id === c.id)!.m;
    return { n: i + 1, chunk_id: m.chunk_id, policy_id: m.policy_id, policy_name: c.policy_name, version: c.version, label: c.label, excerpt: c.content, ...(test ? { score: Math.round(m.score * 1000) / 1000, version_status: m.version_status } : {}) };
  });
  return reply("answered", ck.text, sources, out.model);
}
type SourceOut = { n: number; chunk_id: string; policy_id: string; policy_name: string; version: string; label: string; excerpt: string; score?: number; version_status?: string };

// ---------------------------------------------------------------- router
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, { message: "Use POST" }, 405);
  try {
    const isForm = (req.headers.get("Content-Type") || "").includes("multipart/form-data");
    if (isForm) return json(req, await upload(req, await whoAmI(req)));
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    if (body.action === "process") {
      if (!SETTINGS.cronSecret() || req.headers.get("x-cron-secret") !== SETTINGS.cronSecret()) return json(req, { message: "Not allowed" }, 403);
      startWorker();
      return json(req, { ok: true }, 202);
    }
    const me = await whoAmI(req);
    switch (body.action) {
      case "ask": return json(req, await ask(body, me));
      case "update": return json(req, await updatePolicy(body, me));
      case "publish": return json(req, await publish(body, me));
      case "archive": return json(req, await setArchived(body, me, true));
      case "restore": return json(req, await setArchived(body, me, false));
      case "delete": return json(req, await remove(body, me));
      case "retry": return json(req, await retry(body, me));
      case "file_url": return json(req, await fileUrl(body, me));
      case "kick": requireHr(me); startWorker(); return json(req, { ok: true });
      default: return json(req, { message: "Unknown action" }, 400);
    }
  } catch (e) {
    if (e instanceof HttpError) return json(req, { message: e.message }, e.status);
    console.error(e);
    const msg = describeAiError(e);
    return json(req, { message: /key|API/.test(msg) ? "The assistant is not available right now. Please try again later." : "Something went wrong. Please try again." }, 500);
  }
});
