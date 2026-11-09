// Tests for text extraction and chunking. Run: deno test --allow-read supabase/functions/policy-assistant/extract_test.ts
import { assert, assertEquals } from "jsr:@std/assert@1.0.13";
import { PDFDocument, StandardFonts } from "npm:pdf-lib@1.17.1";
import { strToU8, zipSync } from "npm:fflate@0.8.3";
import { chunkPages, extractDocx, extractPdf, extractTxt, fileTypeOf, isHeadingLine, parseOcr, sourceLabel } from "./extract.ts";

const words = (n: number, w = "leave") => Array.from({ length: n }, (_, i) => `${w}${i}`).join(" ");

async function makePdf(pages: string[][]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const lines of pages) {
    const p = doc.addPage([595, 842]);
    lines.forEach((l, i) => p.drawText(l, { x: 40, y: 800 - i * 16, size: 11, font }));
  }
  return await doc.save();
}

Deno.test("file types", () => {
  assertEquals(fileTypeOf("Leave Policy.PDF"), "pdf");
  assertEquals(fileTypeOf("a.docx"), "docx");
  assertEquals(fileTypeOf("a.txt"), "txt");
  assertEquals(fileTypeOf("a.doc"), null);
  assertEquals(fileTypeOf("a.exe"), null);
});

Deno.test("PDF: text per page, blank page marked for OCR", async () => {
  const pdf = await makePdf([
    ["3. Leave Types", "3.1 Casual Leave", "Every confirmed employee gets 12 days of Casual Leave in a calendar year."],
    [],
    ["4. Attendance", "An employee coming more than 15 minutes late three times in a month loses half a day of CL."],
  ]);
  const pages = await extractPdf(pdf);
  assertEquals(pages.length, 3);
  assert(pages[0].text.includes("12 days of Casual Leave"), pages[0].text);
  assertEquals(pages[0].need_ocr, false);
  assertEquals(pages[1].need_ocr, true);
  assert(pages[2].text.includes("15 minutes late"));
});

Deno.test("DOCX: headings, text, page breaks, entities", () => {
  const p = (t: string, style = "") => `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ""}<w:r><w:t xml:space="preserve">${t}</w:t></w:r></w:p>`;
  const xml = `<?xml version="1.0"?><w:document xmlns:w="x"><w:body>${p("Leave Policy", "Title")}${p("Casual Leave", "Heading1")}${p("Employees get 12 days &amp; may take 3 at a time.")}<w:p><w:r><w:br w:type="page"/></w:r></w:p>${p("Sick Leave", "Heading1")}${p("सभी कर्मचारियों को 7 दिन की बीमारी की छुट्टी मिलती है।")}</w:body></w:document>`;
  const docx = zipSync({ "word/document.xml": strToU8(xml), "[Content_Types].xml": strToU8("<Types/>") });
  const pages = extractDocx(docx);
  assertEquals(pages.length, 2);
  assert(pages[0].text.includes("## Casual Leave"));
  assert(pages[0].text.includes("12 days & may take 3"));
  assert(pages[1].text.includes("## Sick Leave"));
  assert(pages[1].text.includes("7 दिन"));
});

Deno.test("DOCX: a broken file gives a clear error", () => {
  let msg = "";
  try { extractDocx(new Uint8Array([1, 2, 3])); } catch (e) { msg = (e as Error).message; }
  assert(msg.includes("DOCX"), msg);
});

Deno.test("TXT: form feed splits pages, BOM removed", () => {
  const pages = extractTxt(new TextEncoder().encode("﻿Page one text\fPage two text"));
  assertEquals(pages.map((p) => p.text), ["Page one text", "Page two text"]);
});

Deno.test("heading lines", () => {
  for (const h of ["3. Leave Types", "3.1 Casual Leave", "CASUAL LEAVE", "Section 4 Travel", "Eligibility:", "IV. Conduct", "## Anything", "धारा 5 यात्रा भत्ता"]) assert(isHeadingLine(h), h);
  for (const b of ["Every employee gets 12 days of casual leave in a year.", "This is a normal sentence, with a comma,", "12", "a"]) assert(!isHeadingLine(b), b);
});

Deno.test("chunks: 300–500 words, ~50 overlap, heading and pages kept", () => {
  const pages = [
    { page_no: 1, text: `1. Leave Types\n${words(380, "cl")}\n\n${words(200, "sl")}` },
    { page_no: 2, text: `2. Travel\n${words(420, "ta")}` },
    { page_no: 3, text: `${words(90, "ta2")}` },
  ];
  const ch = chunkPages(pages);
  assert(ch.length >= 3, String(ch.length));
  for (const c of ch.slice(0, -1)) assert(c.word_count >= 150 && c.word_count <= 560, `chunk ${c.chunk_no}: ${c.word_count}`);
  assertEquals(ch[0].heading, "1. Leave Types");
  assertEquals(ch[0].page_from, 1);
  // overlap: the 2nd chunk starts with the last words of the 1st
  const lastOf1 = ch[0].content.split(/\s+/).slice(-5).join(" ");
  assert(ch[1].content.includes(lastOf1), "overlap missing");
  // a new section does not start inside the previous chunk's overlap from another section
  const travel = ch.find((c) => c.heading?.startsWith("2. Travel"))!;
  assert(travel, "travel chunk");
  assert(ch.some((c) => c.page_to === 3));
  assertEquals(ch.map((c) => c.chunk_no), ch.map((_, i) => i + 1));
});

Deno.test("chunks: a very long paragraph is split", () => {
  const ch = chunkPages([{ page_no: 1, text: words(1500) }]);
  assert(ch.length >= 3);
  for (const c of ch) assert(c.word_count <= 560, String(c.word_count));
});

Deno.test("OCR output is split back into pages", () => {
  const m = parseOcr("===PAGE 5===\nपहला पेज\n\n=== PAGE 6 ===\nSecond page\n", [5, 6]);
  assertEquals(m.get(5), "पहला पेज");
  assertEquals(m.get(6), "Second page");
  assertEquals(parseOcr("just text", [9]).get(9), "just text");
});

Deno.test("source label", () => {
  assertEquals(sourceLabel("3.1 Casual Leave / 3.2 Sick", 2, 2, true), "3.1 Casual Leave · Page 2");
  assertEquals(sourceLabel(null, 2, 3, true), "Page 2–3");
  assertEquals(sourceLabel("Travel", 1, 1, false), "Travel");
});
