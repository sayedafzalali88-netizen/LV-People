// Text extraction (PDF, DOCX, TXT) and chunking for the Policy Assistant.
// Pure functions: no database, no network. Tested with: deno test supabase/functions/policy-assistant/extract_test.ts
import { unzipSync, strFromU8 } from "npm:fflate@0.8.3";
import { extractText, getDocumentProxy } from "npm:unpdf@1.9.1";

export type Page = { page_no: number; text: string; source: "text" | "ocr" | "docx" | "txt"; need_ocr: boolean };
export type Chunk = { chunk_no: number; heading: string | null; page_from: number; page_to: number; content: string; word_count: number };

/** A page with fewer letters/digits than this is treated as a scanned page (needs OCR). */
export const MIN_PAGE_CHARS = 40;
const HEADING_MARK = "## ";

export function fileTypeOf(name: string): "pdf" | "docx" | "txt" | null {
  const ext = (name.split(".").pop() || "").toLowerCase();
  return ext === "pdf" || ext === "docx" || ext === "txt" ? ext : null;
}

const meaningful = (s: string) => (s.match(/[\p{L}\p{N}]/gu) || []).length;

function cleanText(s: string): string {
  return s.replace(/\r\n?/g, "\n").replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export async function extractPdf(bytes: Uint8Array): Promise<Page[]> {
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  const { text } = await extractText(pdf, { mergePages: false });
  const pages = (Array.isArray(text) ? text : [text]).map((t, i) => {
    const clean = cleanText(String(t || ""));
    return { page_no: i + 1, text: clean, source: "text" as const, need_ocr: meaningful(clean) < MIN_PAGE_CHARS };
  });
  return pages;
}

const xmlDecode = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)).replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, "&");

/** DOCX: paragraphs from word/document.xml. Heading styles become "## " lines; page breaks give approximate page numbers. */
export function extractDocx(bytes: Uint8Array): Page[] {
  let files: Record<string, Uint8Array>;
  try { files = unzipSync(bytes, { filter: (f) => f.name === "word/document.xml" }); }
  catch { throw new Error("This DOCX file could not be opened. Save it again in Word and upload."); }
  const xml = files["word/document.xml"];
  if (!xml) throw new Error("This DOCX file has no document text.");
  const doc = strFromU8(xml);
  const body = doc.slice(doc.indexOf("<w:body"));
  const pages: string[][] = [[]];
  const paraRe = /<w:p[ >][\s\S]*?<\/w:p>|<w:p\/>/g;
  for (const m of body.matchAll(paraRe)) {
    const p = m[0];
    const style = (p.match(/<w:pStyle w:val="([^"]+)"/) || [])[1] || "";
    const isHeading = /^(heading|title|subtitle)/i.test(style) || /^(Heading|Kop|Titre|berschrift)\d/i.test(style) || /<w:outlineLvl w:val="\d"/.test(p);
    let text = "";
    const pageBreakBefore = /<w:pageBreakBefore\/>/.test(p);
    if (pageBreakBefore && pages[pages.length - 1].length) pages.push([]);
    for (const t of p.matchAll(/<w:t(?: [^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\/>|<w:br w:type="page"\/>|<w:br\/>|<w:lastRenderedPageBreak\/>/g)) {
      const tok = t[0];
      if (tok.startsWith("<w:t")) text += xmlDecode(t[1] || "");
      else if (tok === "<w:tab/>") text += "\t";
      else if (tok === "<w:br/>") text += "\n";
      else { // page break
        if (text.trim()) pages[pages.length - 1].push(text);
        text = "";
        pages.push([]);
      }
    }
    text = text.trim();
    if (text) pages[pages.length - 1].push(isHeading ? HEADING_MARK + text.replace(/\s+/g, " ") : text);
  }
  const out = pages.map((lines, i) => ({ page_no: i + 1, text: cleanText(lines.join("\n")), source: "docx" as const, need_ocr: false }))
    .filter((p) => p.text);
  out.forEach((p, i) => (p.page_no = i + 1));
  return out;
}

export function extractTxt(bytes: Uint8Array): Page[] {
  let s = new TextDecoder("utf-8").decode(bytes);
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
  const parts = s.includes("\f") ? s.split("\f") : [s];
  return parts.map((t, i) => ({ page_no: i + 1, text: cleanText(t), source: "txt" as const, need_ocr: false })).filter((p) => p.text);
}

/** Splits the text that OCR returned (with ===PAGE n=== lines) back into pages. */
export function parseOcr(text: string, wanted: number[]): Map<number, string> {
  const out = new Map<number, string>();
  const re = /^\s*=+\s*PAGE\s+(\d+)\s*=+\s*$/gim;
  const marks = [...text.matchAll(re)];
  if (!marks.length) { if (wanted.length === 1) out.set(wanted[0], cleanText(text)); return out; }
  marks.forEach((m, i) => {
    const n = +m[1];
    const end = i + 1 < marks.length ? marks[i + 1].index! : text.length;
    if (wanted.includes(n)) out.set(n, cleanText(text.slice(m.index! + m[0].length, end)));
  });
  return out;
}

// ---------------------------------------------------------------- chunking
const HEAD_WORDS = /^(section|chapter|clause|part|article|annexure|annex|schedule|appendix|rule|policy|अध्याय|धारा|खंड|खण्ड|भाग|नियम|अनुभाग)(?=[\s:.\-–]|\d|$)/iu;

/** Is this one line a heading? (docx headings are already marked) */
export function isHeadingLine(line: string): boolean {
  if (line.startsWith(HEADING_MARK)) return true;
  const s = line.trim();
  const words = s.split(/\s+/).length;
  if (!s || s.length > 90 || words > 12 || meaningful(s) < 3) return false;
  if (/[.,;।]$/.test(s)) return false;                                             // a sentence is body text
  if (HEAD_WORDS.test(s)) return true;
  if (/^\d+(\.\d+){0,3}[.)]?\s+\S/.test(s) && words <= 8) return true;               // 3 Leave / 3.1 Casual leave / 4) Travel
  if (/^[IVXLC]+[.)]\s+\S/.test(s)) return true;                                     // IV. Conduct
  if (/^[A-Z][A-Z0-9 &/(),'’:-]{3,}$/.test(s) && /[A-Z]{3}/.test(s)) return true;      // CASUAL LEAVE
  if (/:$/.test(s) && words <= 8) return true;                                       // Eligibility:
  return false;
}

type Para = { text: string; words: number; page: number; heading: string | null; isHead?: boolean; overlap?: boolean };

export type ChunkOptions = { target?: number; max?: number; min?: number; overlap?: number };

/** 300–500 words per chunk (target 400), about 50 words of overlap. Each chunk keeps its heading(s) and page range. */
export function chunkPages(pages: { page_no: number; text: string }[], opt: ChunkOptions = {}): Chunk[] {
  const target = opt.target ?? 400, max = opt.max ?? 500, min = opt.min ?? 300, overlap = opt.overlap ?? 50;
  const paras: Para[] = [];
  let heading: string | null = null;
  for (const pg of pages) {
    const blocks = pg.text.split(/\n\s*\n/);
    for (const block of blocks) {
      // inside a block, heading lines start a new paragraph; other lines are joined
      let buf: string[] = [];
      const push = () => { const t = buf.join(" ").replace(/\s+/g, " ").trim(); if (t) addPara(t, pg.page_no, heading); buf = []; };
      for (const raw of block.split("\n")) {
        const line = raw.trim();
        if (!line) continue;
        if (isHeadingLine(line)) {
          push();
          heading = line.replace(/^##\s*/, "").replace(/\s+/g, " ").replace(/:$/, "").trim();
          addPara(heading, pg.page_no, heading, true);
        } else buf.push(line);
      }
      push();
    }
  }
  function addPara(text: string, page: number, h: string | null, isHead = false) {
    const words = text.split(/\s+/);
    if (words.length <= max - overlap || isHead) { paras.push({ text, words: words.length, page, heading: h, isHead }); return; }
    for (let i = 0; i < words.length; i += target) {            // a very long paragraph is cut into pieces
      const part = words.slice(i, i + target);
      paras.push({ text: part.join(" "), words: part.length, page, heading: h });
    }
  }

  const chunks: Chunk[] = [];
  let cur: Para[] = [], curWords = 0, fresh = 0;            // fresh = words that are not the overlap
  const flush = (keepOverlap: boolean) => {
    if (!fresh) return;
    // the heading with the most text in this chunk comes first (it is the one shown in the citation)
    const weight = new Map<string, number>();
    cur.filter((p) => !p.overlap).forEach((p) => { if (p.heading) weight.set(p.heading, (weight.get(p.heading) || 0) + (p.isHead ? 0.5 : p.words)); });
    const heads = [...weight.keys()].sort((a, b) => weight.get(b)! - weight.get(a)!);
    const content = cur.map((p) => (p.overlap ? "… " + p.text : p.text)).join("\n");
    chunks.push({
      chunk_no: chunks.length + 1,
      heading: heads.length ? heads.slice(0, 3).join(" / ").slice(0, 300) : null,
      page_from: Math.min(...cur.map((p) => p.page)), page_to: Math.max(...cur.map((p) => p.page)),
      content, word_count: curWords,
    });
    if (keepOverlap && overlap > 0) {
      const all = cur.map((p) => p.text).join(" ").split(/\s+/);
      const tail = all.slice(-overlap);
      const last = cur[cur.length - 1];
      cur = [{ text: tail.join(" "), words: tail.length, page: last.page, heading: last.heading, overlap: true }];
      curWords = tail.length;
    } else { cur = []; curWords = 0; }
    fresh = 0;
  };
  for (const p of paras) {
    if (p.isHead && fresh >= min - 100) flush(false);           // a new section starts: do not drag the old section's tail into it
    else if (p.isHead && fresh === 0 && cur.length) { cur = []; curWords = 0; }   // only the old section's overlap so far: drop it
    else if (curWords + p.words > max && fresh >= 150) flush(true);
    cur.push(p); curWords += p.words; fresh += p.words;
    if (curWords >= target && !p.isHead) flush(true);
  }
  flush(false);
  return chunks;
}

/** One line for the citation: "Section 3.1 Casual leave · Page 2". */
export function sourceLabel(heading: string | null, from: number | null, to: number | null, hasPages: boolean): string {
  const parts: string[] = [];
  if (heading) parts.push(heading.split(" / ")[0]);
  if (hasPages && from) parts.push(from === to || !to ? `Page ${from}` : `Page ${from}–${to}`);
  return parts.join(" · ");
}
