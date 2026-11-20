// Server function "meeting-assistant" (Supabase Edge Function) for the Client Meetings app (app/meetings/).
// Steps, each started by the browser and run in the background (the browser watches the meeting's status):
//   transcribe: recording in the private "meetings" bucket -> ElevenLabs Scribe -> transcript (status transcribed)
//   analyse:    transcript -> Claude -> summary, focus areas, strategy, plan, follow-up message (status done)
// Every request checks the Supabase login, the meeting_members list and that the meeting belongs to the caller.
// Deploy: supabase functions deploy meeting-assistant
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.118.0";
import { analyse, CFG, StepError, transcribe, transcriptForAi, type Segment } from "./analyse.ts";

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

const env = (k: string, d = "") => Deno.env.get(k) ?? d;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STALE_MS = 10 * 60_000;   // a step that shows "running" for longer than this has died and may be started again

const db: SupabaseClient = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });

class HttpError extends Error { constructor(public status: number, msg: string) { super(msg); } }

function cors(req: Request): Record<string, string> {
  const allowed = env("MEETING_ALLOWED_ORIGINS", "*").split(",").map((s) => s.trim()).filter(Boolean), origin = req.headers.get("Origin") || "";
  const allow = allowed.includes("*") ? "*" : allowed.includes(origin) ? origin : allowed[0] || "";
  return { "Access-Control-Allow-Origin": allow, "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", Vary: "Origin" };
}
const json = (req: Request, body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...cors(req) } });

async function whoAmI(req: Request): Promise<{ id: string; email: string }> {
  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!jwt) throw new HttpError(401, "Please sign in again.");
  const u = await db.auth.getUser(jwt);
  if (u.error || !u.data.user) throw new HttpError(401, "Please sign in again.");
  const email = (u.data.user.email || "").toLowerCase();
  const m = await db.from("meeting_members").select("email").eq("email", email).maybeSingle();
  if (m.error) throw new Error("member check: " + m.error.message);
  if (!m.data) throw new HttpError(403, "This login may not use Client Meetings. Ask the admin to add your e-mail.");
  return { id: u.data.user.id, email };
}

type Meeting = {
  id: string; owner: string; client_name: string; title: string; meeting_date: string; out_lang: string; context: string;
  source: string; audio_path: string | null; status: string; updated_at: string; transcript: Segment[] | null;
  transcript_text: string | null; speakers: Record<string, string>;
};

async function load(id: string, owner: string): Promise<Meeting> {
  if (!UUID.test(id)) throw new HttpError(400, "Wrong meeting id.");
  const r = await db.from("meetings").select("*").eq("id", id).maybeSingle();
  if (r.error) throw new Error("meeting: " + r.error.message);
  if (!r.data || r.data.owner !== owner) throw new HttpError(404, "Meeting not found.");
  return r.data as Meeting;
}

async function setRow(id: string, patch: Record<string, unknown>) {
  const r = await db.from("meetings").update(patch).eq("id", id);
  if (r.error) console.error("update meeting", id, r.error.message);
}

const busy = (m: Meeting) => (m.status === "transcribing" || m.status === "analysing") && Date.now() - Date.parse(m.updated_at) < STALE_MS;

async function runTranscribe(m: Meeting, opts: { language?: string; speakers?: number }) {
  try {
    const signed = await db.storage.from("meetings").createSignedUrl(m.audio_path!, 3600);
    if (signed.error || !signed.data) throw new StepError("The recording file was not found in storage.");
    const t = await transcribe(signed.data.signedUrl, opts);
    if (!t.segments.length) throw new StepError("No speech was found in the recording.");
    const ids = [...new Set(t.segments.map((s) => s.speaker))];
    const speakers = { ...Object.fromEntries(ids.map((s) => [s, ""])), ...(m.speakers || {}) };
    await setRow(m.id, {
      status: "transcribed", error: null, transcript: t.segments, lang_detected: t.language, stt_seconds: t.seconds, speakers,
      transcript_text: transcriptForAi(t.segments, null, {}),
    });
  } catch (e) {
    console.error("transcribe", m.id, e);
    await setRow(m.id, { status: "failed", error: e instanceof StepError ? e.message : "Transcription failed: " + (e instanceof Error ? e.message : String(e)) });
  }
}

async function runAnalyse(m: Meeting) {
  try {
    // for an audio meeting the speaker turns are used (with the names you gave); for a text meeting the pasted text
    const transcript = transcriptForAi(m.source === "audio" ? m.transcript : null, m.transcript_text, m.speakers || {});
    const out = await analyse({
      client: m.client_name, title: m.title, date: m.meeting_date, context: m.context || "",
      transcript, outLang: m.out_lang, speakers: m.speakers || {},
    });
    await setRow(m.id, { status: "done", error: null, summary: out.result, model: out.model, input_tokens: out.input_tokens, output_tokens: out.output_tokens });
  } catch (e) {
    console.error("analyse", m.id, e);
    await setRow(m.id, { status: "failed", error: e instanceof StepError ? e.message : "Summary failed: " + (e instanceof Error ? e.message : String(e)) });
  }
}

function background(p: Promise<unknown>) {
  if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(p); else p.catch(console.error);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "Use POST." }, 405);
  try {
    const me = await whoAmI(req);
    const body = await req.json().catch(() => ({})) as { action?: string; meeting_id?: string; language?: string; speakers?: number };
    const m = await load(String(body.meeting_id || ""), me.id);
    if (busy(m)) throw new HttpError(409, "This meeting is already being processed.");

    if (body.action === "transcribe") {
      if (m.source !== "audio" || !m.audio_path) throw new HttpError(400, "This meeting has no recording.");
      if (!m.audio_path.startsWith(me.id + "/")) throw new HttpError(403, "Wrong file.");
      const language = /^[a-z]{2,3}$/i.test(body.language || "") ? body.language!.toLowerCase() : undefined;
      const speakers = Number.isInteger(body.speakers) ? Number(body.speakers) : undefined;
      await setRow(m.id, { status: "transcribing", error: null });
      background(runTranscribe(m, { language, speakers }));
      return json(req, { ok: true, status: "transcribing", stt_model: CFG.sttModel() });
    }

    if (body.action === "analyse") {
      const hasText = m.source === "audio" ? !!m.transcript?.length : !!(m.transcript_text || "").trim();
      if (!hasText) throw new HttpError(400, m.source === "audio" ? "Make the transcript first." : "Paste the meeting notes or transcript first.");
      await setRow(m.id, { status: "analysing", error: null });
      background(runAnalyse(m));
      return json(req, { ok: true, status: "analysing", model: CFG.model() });
    }

    throw new HttpError(400, "Unknown action.");
  } catch (e) {
    if (e instanceof HttpError) return json(req, { error: e.message }, e.status);
    console.error(e);
    return json(req, { error: "Server error. Please try again." }, 500);
  }
});
