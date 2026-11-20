// deno test supabase/functions/meeting-assistant/analyse_test.ts
import { assertEquals } from "jsr:@std/assert@1.0.13";
import { RESULT_SCHEMA, toSegments, transcriptForAi } from "./analyse.ts";

Deno.test("words become speaker turns", () => {
  const w = (text: string, start: number, speaker_id: string, type = "word") => ({ text, start, end: start + 0.4, speaker_id, type });
  const segs = toSegments([
    w("Namaste", 0, "speaker_0"), w(" ", 0.4, "speaker_0", "spacing"), w("ji", 0.5, "speaker_0"),
    w("Haan", 1.2, "speaker_1"), w(" ", 1.6, "speaker_1", "spacing"), w("boliye", 1.7, "speaker_1"),
    w("(laughs)", 2.5, "speaker_1", "audio_event"),
    w("Sales", 6, "speaker_1"),            // same speaker after a long pause: a new turn
  ], "");
  assertEquals(segs.map((s) => [s.speaker, s.text]), [["speaker_0", "Namaste ji"], ["speaker_1", "Haan boliye"], ["speaker_1", "Sales"]]);
});

Deno.test("no words: the plain text is used", () => {
  assertEquals(toSegments([], " hello "), [{ speaker: "speaker_0", start: 0, end: 0, text: "hello" }]);
});

Deno.test("speaker names and times go into the AI transcript", () => {
  const t = transcriptForAi([{ speaker: "speaker_0", start: 65, end: 70, text: "Hi" }, { speaker: "speaker_1", start: 3700, end: 3701, text: "Ok" }], null, { speaker_0: "Me" });
  assertEquals(t, "[01:05] Me: Hi\n[1:01:40] speaker_1: Ok");
  assertEquals(transcriptForAi(null, " pasted notes ", {}), "pasted notes");
});

Deno.test("schema: every object lists all its fields as required and allows no others", () => {
  const walk = (s: Record<string, unknown>): void => {
    if (s.type === "object") {
      assertEquals(s.additionalProperties, false);
      assertEquals([...(s.required as string[])].sort(), Object.keys(s.properties as object).sort());
      Object.values(s.properties as Record<string, Record<string, unknown>>).forEach(walk);
    }
    if (s.type === "array") walk(s.items as Record<string, unknown>);
  };
  walk(RESULT_SCHEMA as Record<string, unknown>);
});

import { extractJson, normalise, shapeExample, systemPrompt } from "./analyse.ts";
type S = Parameters<typeof normalise>[1];

Deno.test("reply in ``` fences with text around it is read", () => {
  assertEquals(extractJson('Here it is:\n```json\n{"a": {"b": 1}}\n```\nDone.'), { a: { b: 1 } });
});

Deno.test("a messy reply is made to fit the shape", () => {
  const r = normalise({
    summary: { headline: "H", client_goals: "one goal", key_points: [{ topic: "T", detail: 5, extra: "x" }], action_items: null },
    focus_areas: [{ name: "Sales", priority: "HIGH", steps: [{ step: "S1", source: "maybe" }] }],
    junk: true,
  }, RESULT_SCHEMA as S) as any;
  assertEquals(r.summary.headline, "H");
  assertEquals(r.summary.overview, "");
  assertEquals(r.summary.client_goals, ["one goal"]);
  assertEquals(r.summary.key_points, [{ topic: "T", detail: "5" }]);
  assertEquals(r.summary.action_items, []);
  assertEquals(r.summary.commitments, { by_me: [], by_client: [] });
  assertEquals(r.focus_areas[0].priority, "high");
  assertEquals(r.focus_areas[0].steps[0], { step: "S1", detail: "", owner: "", timeline: "", source: "suggested" });
  assertEquals(r.plan, { phases: [], quick_wins: [], next_meeting_agenda: [] });
  assertEquals("junk" in r, false);
});

Deno.test("an empty reply still gives the full shape", () => {
  const r = normalise(null, RESULT_SCHEMA as S) as any;
  assertEquals(r.follow_up_message, "");
  assertEquals(r.focus_areas, []);
});

Deno.test("the prompt shows every key of the shape", () => {
  const p = systemPrompt("hinglish");
  assertEquals(p.includes(JSON.stringify(shapeExample(RESULT_SCHEMA as S))), true);
  assertEquals(p.includes('"priority":"medium | high | low"'), true);
});
