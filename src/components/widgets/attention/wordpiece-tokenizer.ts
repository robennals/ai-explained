/**
 * Minimal WordPiece tokenizer for the TinyStories 4096-vocab tokenizer
 * stored at public/data/tokenizer/ts-tokenizer-4096.json.
 *
 * Implements: lowercase normalization, basic punctuation splitting,
 * greedy longest-match WordPiece, with special tokens [BOS] [EOS] [UNK].
 *
 * Does NOT prepend [BOS] / append [EOS] — callers do that explicitly so they
 * stay in control of the model's input layout.
 */

interface TokenizerJson {
  added_tokens: Array<{ id: number; content: string; special: boolean }>;
  model: {
    type: string;
    unk_token: string;
    continuing_subword_prefix?: string;
    vocab: Record<string, number>;
  };
}

export interface WordPieceTokenizer {
  vocab: Record<string, number>;
  idToToken: string[];
  unkId: number;
  bosId: number;
  eosId: number;
  prefix: string;
  encode(text: string): { ids: number[]; tokens: string[] };
}

export async function loadTokenizer(url: string): Promise<WordPieceTokenizer> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Tokenizer load failed: ${resp.status}`);
  const data: TokenizerJson = await resp.json();

  const vocab = data.model.vocab;
  const prefix = data.model.continuing_subword_prefix ?? "##";
  const size = Object.keys(vocab).length;
  const idToToken: string[] = new Array(size);
  for (const [tok, id] of Object.entries(vocab)) idToToken[id] = tok;

  const unkId = vocab[data.model.unk_token] ?? 0;
  const bosId = vocab["[BOS]"] ?? unkId;
  const eosId = vocab["[EOS]"] ?? unkId;

  // Punctuation chars the tokenizer's "Punctuation: Isolated" pre-tokenizer
  // splits on. Reasonable subset for ASCII English.
  const PUNCT = /[.,!?;:()[\]{}"'\-]/;

  function preTokenize(text: string): string[] {
    // Lowercase + strip combining marks (NFD then drop \p{M}); split on
    // whitespace and isolate punctuation as its own pre-token.
    const lower = text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
    const result: string[] = [];
    let cur = "";
    for (const ch of lower) {
      if (/\s/.test(ch)) {
        if (cur) { result.push(cur); cur = ""; }
      } else if (PUNCT.test(ch)) {
        if (cur) { result.push(cur); cur = ""; }
        result.push(ch);
      } else {
        cur += ch;
      }
    }
    if (cur) result.push(cur);
    return result;
  }

  function wordPiece(word: string): { ids: number[]; tokens: string[] } {
    const out: number[] = [];
    const tokens: string[] = [];
    let start = 0;
    while (start < word.length) {
      let end = word.length;
      let matchedToken: string | null = null;
      while (start < end) {
        let candidate = word.slice(start, end);
        if (start > 0) candidate = prefix + candidate;
        if (vocab[candidate] !== undefined) {
          matchedToken = candidate;
          break;
        }
        end -= 1;
      }
      if (matchedToken === null) {
        // No prefix of `word[start:]` is in the vocab. Emit a single [UNK]
        // for the whole word (matches HF tokenizers' default behavior).
        return { ids: [unkId], tokens: ["[UNK]"] };
      }
      out.push(vocab[matchedToken]);
      tokens.push(matchedToken);
      start = end;
    }
    return { ids: out, tokens };
  }

  function encode(text: string): { ids: number[]; tokens: string[] } {
    const words = preTokenize(text);
    const ids: number[] = [];
    const tokens: string[] = [];
    for (const w of words) {
      const r = wordPiece(w);
      ids.push(...r.ids);
      tokens.push(...r.tokens);
    }
    return { ids, tokens };
  }

  return { vocab, idToToken, unkId, bosId, eosId, prefix, encode };
}
