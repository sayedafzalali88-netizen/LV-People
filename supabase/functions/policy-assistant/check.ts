// The last check on an AI answer before an employee sees it (pure function, tested in check_test.ts).
// Rule (d): an answer without a source is rejected. Extra guard: every number in the answer must be written in the policy parts it used.
export const NOT_FOUND = "Is vishay par company policy me jaankari uplabdh nahi hai. Kripya HR vibhag se sampark karein.";
export const OUT_OF_SCOPE = "Main sirf company policy se jude sawaalon ka jawab de sakta hoon. Is sawaal ke liye kripya HR vibhag se sampark karein.";

export type CheckCtx = { id: string; kind?: "policy" | "guide"; policy_name: string; version: string; heading: string | null; label: string; content: string; effective_date?: string | null };
export type ModelOut = { result: string; answer: string; source_ids: string[] };
export type Checked =
  | { status: "answered"; text: string; cited: CheckCtx[] }
  | { status: "not_found" | "rejected" | "out_of_scope"; text: string; cited: []; why: string };

const asciiDigits = (s: string) => s.replace(/[०-९]/g, (d) => String("०१२३४५६७८९".indexOf(d)));
export const numbersIn = (s: string) =>
  new Set((asciiDigits(s).match(/\d+(?:[.,]\d+)*/g) || []).map((n) => n.replace(/,/g, "").replace(/\.0+$/, "")));

export const sourceText = (c: CheckCtx) =>
  c.kind === "guide" ? `LV People User Guide – ${c.label}` : `${c.policy_name} (v${c.version})${c.label ? " – " + c.label : ""}`;

export function checkAnswer(out: ModelOut, ctx: CheckCtx[], question: string): Checked {
  if (out.result === "out_of_scope") return { status: "out_of_scope", text: OUT_OF_SCOPE, cited: [], why: "out of scope" };
  const cited = ctx.filter((c) => out.source_ids.includes(c.id));
  let text = (out.answer || "").trim();
  if (out.result === "not_found") return { status: "not_found", text: NOT_FOUND, cited: [], why: "model: not in policy" };
  if (out.result !== "answered") return { status: "rejected", text: NOT_FOUND, cited: [], why: "no usable answer" };
  if (!cited.length) return { status: "rejected", text: NOT_FOUND, cited: [], why: "no source" };
  if (!text || text.includes(NOT_FOUND.slice(0, 40))) return { status: "not_found", text: NOT_FOUND, cited: [], why: "model: not in policy" };

  // the AI's own source line(s) at the end are replaced by the exact names of the parts it used
  const lines = text.split("\n");
  while (lines.length && (/^\s*[*_]*\s*(source|sources|स्रोत|srot|sroat)\b/i.test(lines[lines.length - 1]) || !lines[lines.length - 1].trim())) lines.pop();
  text = lines.join("\n").replace(/\[\s*S\d+(\s*,\s*S\d+)*\s*\]/g, "").replace(/\(\s*S\d+\s*\)/g, "").replace(/[ \t]+\n/g, "\n").replace(/[ \t]{2,}/g, " ").trim();
  if (!text) return { status: "rejected", text: NOT_FOUND, cited: [], why: "only a source line" };

  // every number (days, rupees, %) must be in the parts used, or in the question (list numbering "1." / "2)" at a line start is not a number)
  const allowed = new Set<string>(numbersIn(question));
  const body = text.replace(/^\s*\d{1,2}[.)]\s+/gm, "");
  for (const c of cited) for (const n of numbersIn(`${c.content} ${c.heading ?? ""} ${c.version} ${c.effective_date ?? ""} ${c.policy_name}`)) allowed.add(n);
  const unknown = [...numbersIn(body)].filter((n) => !allowed.has(n));
  if (unknown.length) return { status: "rejected", text: NOT_FOUND, cited: [], why: "numbers not in policy: " + unknown.join(",") };

  text += "\n\nSource: " + cited.map(sourceText).join("; ");
  return { status: "answered", text, cited };
}
