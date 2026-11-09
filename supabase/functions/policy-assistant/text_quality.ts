// Is the text that was read from a file broken? (pure function, no imports, tested in text_quality_test.ts)
//
// An old Hindi font (Kruti Dev and the like) makes a PDF whose text comes out wrong when a computer reads it:
// "दिन" becomes "तदन", "प्राप्त" becomes "प्र ाप्त". In right Hindi a vowel sign never stands after a space, and a halant (्)
// is never followed by a space. In the broken text they do, again and again: about 6 times in 100 words, against 0 in right text.

const DEVANAGARI_WORD = /[ऀ-ॿ]+/g;
const SIGN_AFTER_SPACE = /\s[ा-ौ]/g;     // a vowel sign (ा ि ी ु ू ृ े ै ो ौ ...) that stands alone after a space
const HALANT_THEN_SPACE = /्\s/g;             // a joining mark (्) followed by a space

/** How many tokens of the text show the break, and how many Devanagari words it has. */
export function brokenHindiScore(s: string): { words: number; bad: number } {
  const words = (s.match(DEVANAGARI_WORD) || []).length;
  const bad = (s.match(SIGN_AFTER_SPACE) || []).length + (s.match(HALANT_THEN_SPACE) || []).length;
  return { words, bad };
}

/** True when the text looks like broken Hindi from an old font. A short or English text is never "broken". */
export function looksGarbled(s: string): boolean {
  const { words, bad } = brokenHindiScore(s);
  return words >= 20 && bad >= 3 && bad / words >= 0.01;
}
