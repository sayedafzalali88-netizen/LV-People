// Tests for the last check on an AI answer. Run: deno test supabase/functions/policy-assistant/check_test.ts
import { assert, assertEquals } from "jsr:@std/assert@1.0.13";
import { checkAnswer, NOT_FOUND, OUT_OF_SCOPE } from "./check.ts";

const ctx = [
  { id: "S1", policy_name: "Leave Policy 2026", version: "2", heading: "3.1 Casual Leave", label: "3.1 Casual Leave · Page 2", content: "Every confirmed employee gets 12 days of Casual Leave in a calendar year. Not more than 3 days at a time.", effective_date: "2026-04-01" },
  { id: "S2", policy_name: "Travel Policy", version: "1", heading: "Daily allowance", label: "Daily allowance · Page 4", content: "Daily allowance is Rs. 1,500 per day for metro cities." },
];

Deno.test("a cited answer passes and gets the exact source line", () => {
  const r = checkAnswer({ result: "answered", answer: "Aapko saal me 12 CL milti hain, ek baar me 3 din tak. [S1]\nSource: leave policy", source_ids: ["S1"] }, ctx, "CL kitni milti hai?");
  assertEquals(r.status, "answered");
  assert(r.text.startsWith("Aapko saal me 12 CL milti hain, ek baar me 3 din tak."), r.text);
  assert(!r.text.includes("[S1]"));
  assert(r.text.endsWith("Source: Leave Policy 2026 (v2) – 3.1 Casual Leave · Page 2"), r.text);
});

Deno.test("Devanagari digits and Indian number format are matched", () => {
  const r = checkAnswer({ result: "answered", answer: "मेट्रो शहरों में दैनिक भत्ता ₹१,५०० प्रति दिन है।", source_ids: ["S2"] }, ctx, "DA kitna hai?");
  assertEquals(r.status, "answered");
});

Deno.test("no source → rejected", () => {
  const r = checkAnswer({ result: "answered", answer: "12 days.", source_ids: [] }, ctx, "q");
  assertEquals([r.status, r.text], ["rejected", NOT_FOUND]);
  const r2 = checkAnswer({ result: "answered", answer: "12 days.", source_ids: ["S9"] }, ctx, "q");
  assertEquals(r2.status, "rejected");
});

Deno.test("a number that is not in the policy → rejected", () => {
  const r = checkAnswer({ result: "answered", answer: "Aapko 15 CL milti hain.", source_ids: ["S1"] }, ctx, "CL?");
  assertEquals(r.status, "rejected");
  // a number from another (not cited) part does not count
  const r2 = checkAnswer({ result: "answered", answer: "DA 1500 hai.", source_ids: ["S1"] }, ctx, "DA?");
  assertEquals(r2.status, "rejected");
});

Deno.test("not found and out of scope give the fixed texts", () => {
  assertEquals(checkAnswer({ result: "not_found", answer: "anything", source_ids: ["S1"] }, ctx, "q").text, NOT_FOUND);
  assertEquals(checkAnswer({ result: "out_of_scope", answer: "x", source_ids: [] }, ctx, "q").text, OUT_OF_SCOPE);
  assertEquals(checkAnswer({ result: "answered", answer: NOT_FOUND, source_ids: ["S1"] }, ctx, "q").status, "not_found");
  assertEquals(checkAnswer({ result: "answered", answer: "Source: Leave Policy", source_ids: ["S1"] }, ctx, "q").status, "rejected");
});

Deno.test("list numbering at a line start is not checked as a number", () => {
  const r = checkAnswer({ result: "answered", answer: "Aise apply karein:\n1. Leave kholein\n2. 12 din tak chunein", source_ids: ["S1"] }, ctx, "CL kaise lun?");
  assertEquals(r.status, "answered");
  const r2 = checkAnswer({ result: "answered", answer: "1. Aapko 15 CL milti hain", source_ids: ["S1"] }, ctx, "CL?");
  assertEquals(r2.status, "rejected");
});

Deno.test("a User Guide source gets its own source line", () => {
  const g = [{ id: "S1", kind: "guide" as const, policy_name: "Mirror-HR User Guide", version: "", heading: null, label: "Leave › Apply leave", content: "Open Leave > Apply. Choose the type and the dates. Press Submit." }];
  const r = checkAnswer({ result: "answered", answer: "Leave menu kholein, Apply dabayein, type aur tareekh chunein, Submit karein.", source_ids: ["S1"] }, g, "leave kaise apply karun");
  assertEquals(r.status, "answered");
  assert(r.text.endsWith("Source: Mirror-HR User Guide – Leave › Apply leave"), r.text);
});
