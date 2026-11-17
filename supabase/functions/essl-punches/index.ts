// essl-punches: fetches punches from the company's eSSL eTimeTrackLite server (its WebAPIService, GetTransactionsLog)
// and gives them back to the Mirror-HR app as rows { code, ts, dev }. The app then checks and stores them in the punch log.
// Nothing is written here. Who may call: a signed-in Admin or HR of the one company named in the secret ESSL_CLIENT.
// The eSSL address, login and machine serial numbers live only in this function's secrets, never in the browser:
//   ESSL_URL      http://43.251.175.210:94/iclock/WebAPIService.asmx
//   ESSL_USER     the eTimeTrackLite user that has "Is Web API User" ticked
//   ESSL_PASS     its password
//   ESSL_SERIALS  machine serial numbers, comma separated (the API needs a serial number for every call)
//   ESSL_CLIENT   the company code allowed to use this, for example lvsheor
import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const env = (k: string) => Deno.env.get(k) || "";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });

class HttpError extends Error { constructor(public status: number, m: string) { super(m); } }

const xmlEsc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const xmlUnesc = (s: string) => s
  .replace(/&#x([0-9a-fA-F]+);/g, (_m, h) => String.fromCharCode(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_m, d) => String.fromCharCode(parseInt(d, 10)))
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");

/** the answer of the server: "Logs Count:379" and a text with one punch on each line: "1012<tab>2026-11-16 09:07:51" */
export function parseAnswer(xml: string): { result: string; rows: { code: string; ts: string }[] } {
  const g = (tag: string) => {
    const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i").exec(xml);
    return m ? xmlUnesc(m[1]) : "";
  };
  const result = g("GetTransactionsLogResult").trim();
  const data = g("strDataList");
  const rows: { code: string; ts: string }[] = [];
  for (const line of data.split(/\r?\n/)) {
    const m = /^\s*(\S+)\s+(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::\d{2})?\s*$/.exec(line);
    if (m) rows.push({ code: m[1], ts: `${m[2]} ${m[3]}` });
  }
  return { result, rows };
}

async function callOnce(url: string, user: string, pass: string, serial: string, from: string, to: string) {
  const body = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetTransactionsLog xmlns="http://tempuri.org/">
      <FromDate>${xmlEsc(from)}</FromDate>
      <ToDate>${xmlEsc(to)}</ToDate>
      <SerialNumber>${xmlEsc(serial)}</SerialNumber>
      <UserName>${xmlEsc(user)}</UserName>
      <UserPassword>${xmlEsc(pass)}</UserPassword>
      <strDataList></strDataList>
    </GetTransactionsLog>
  </soap:Body>
</soap:Envelope>`;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 60000);
  try {
    const r = await fetch(url, { method: "POST", signal: ctl.signal, headers: { "Content-Type": "text/xml; charset=utf-8", SOAPAction: '"http://tempuri.org/GetTransactionsLog"' }, body });
    const txt = await r.text();
    if (!r.ok) throw new Error(`The eSSL server answered ${r.status}.`);
    return parseAnswer(txt);
  } finally { clearTimeout(t); }
}

const addDays = (d: string, n: number) => { const x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    if (req.method !== "POST") throw new HttpError(405, "Use POST.");
    const db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
    // who is asking: the signed-in person's own profile decides (nothing from the browser is trusted)
    const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const u = await db.auth.getUser(jwt);
    const uid = u.data?.user?.id;
    if (!uid) throw new HttpError(401, "Please sign in again.");
    const p = await db.from("profiles").select("client_id, role, active").eq("user_id", uid).maybeSingle();
    if (!p.data || !p.data.active) throw new HttpError(403, "Your login is not active.");
    if (p.data.role !== "admin" && p.data.role !== "hr") throw new HttpError(403, "Only Admin or HR can fetch punches.");
    const c = await db.from("clients").select("code").eq("id", p.data.client_id).maybeSingle();
    if (!c.data || c.data.code !== env("ESSL_CLIENT")) throw new HttpError(403, "The eSSL server is not set up for your company.");

    const url = env("ESSL_URL"), user = env("ESSL_USER"), pass = env("ESSL_PASS");
    const serials = env("ESSL_SERIALS").split(",").map((s) => s.trim()).filter(Boolean);
    if (!url || !user || !pass || !serials.length) throw new HttpError(500, "The eSSL connection is not set up yet (secrets are missing).");

    const body = await req.json().catch(() => ({}));
    const from = String(body.from || ""), to = String(body.to || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) throw new HttpError(400, "Choose the From and To dates.");
    if (to < from) throw new HttpError(400, "The To date is before the From date.");
    if (addDays(from, 62) < to) throw new HttpError(400, "Choose at most 62 days at a time.");

    // 5 days per call, every machine, in parallel
    const chunks: [string, string][] = [];
    for (let d = from; d <= to; d = addDays(d, 5)) { const e = addDays(d, 4) < to ? addDays(d, 4) : to; chunks.push([d, e]); }
    const per: Record<string, number> = {}, errors: string[] = [], rows: { code: string; ts: string; dev: string }[] = [];
    await Promise.all(serials.map(async (sn) => {
      per[sn] = 0;
      for (const [a, b] of chunks) {
        try {
          const r = await callOnce(url, user, pass, sn, `${a} 00:00`, `${b} 23:59`);
          if (/un\w*thori[sz]ed|invalid|not allowed/i.test(r.result)) { errors.push(`${sn}: the eSSL login was refused (${r.result}).`); break; }
          for (const x of r.rows) rows.push({ ...x, dev: sn });
          per[sn] += r.rows.length;
        } catch (e) { errors.push(`${sn} ${a} to ${b}: ${(e as Error).message}`); break; }
      }
    }));
    return json({ rows, per_device: per, errors, from, to });
  } catch (e) {
    if (e instanceof HttpError) return json({ message: e.message }, e.status);
    return json({ message: "Something went wrong. Please try again." }, 500);
  }
});
