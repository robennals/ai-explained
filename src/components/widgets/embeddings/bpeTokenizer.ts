export interface EncodedPiece {
  id: number;
  token: string;
  text: string;
}

interface TokenizerJson {
  normalizer?: {
    type?: string;
    normalizers?: Array<{ type?: string }>;
  };
  model: {
    type: "WordPiece";
    unk_token?: string;
    vocab: Record<string, number>;
  };
}

interface TinyStoriesTokenizer {
  encode: (text: string) => EncodedPiece[];
}

const TOKENIZER_PATH = "/data/tokenizer/ts-tokenizer-4096.json";

let tokenizerPromise: Promise<TinyStoriesTokenizer> | null = null;

function normalizeText(text: string): string {
  // Match tokenizer normalizer: NFD + StripAccents + Lowercase.
  return text
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase();
}

function pretokenize(text: string): string[] {
  const out: string[] = [];
  let current = "";

  const flush = () => {
    if (current.length > 0) {
      out.push(current);
      current = "";
    }
  };

  for (const ch of text) {
    if (/\s/u.test(ch)) {
      flush();
      continue;
    }

    if (/[\p{P}\p{S}]/u.test(ch)) {
      flush();
      out.push(ch);
      continue;
    }

    if (/\p{N}/u.test(ch)) {
      flush();
      out.push(ch);
      continue;
    }

    current += ch;
  }

  flush();
  return out;
}

function buildTokenizer(json: TokenizerJson): TinyStoriesTokenizer {
  const encoder = json.model.vocab;
  const unkToken = json.model.unk_token ?? "[UNK]";
  const unkId = encoder[unkToken];

  const wordpieceTokenize = (word: string): EncodedPiece[] => {
    const fullId = encoder[word];
    if (fullId !== undefined) {
      return [{ id: fullId, token: word, text: word }];
    }

    const pieces: EncodedPiece[] = [];
    let start = 0;

    while (start < word.length) {
      let end = word.length;
      let foundToken: string | null = null;

      while (start < end) {
        let substr = word.slice(start, end);
        if (start > 0) substr = `##${substr}`;

        if (encoder[substr] !== undefined) {
          foundToken = substr;
          break;
        }

        end -= 1;
      }

      if (!foundToken) {
        if (unkId !== undefined) {
          return [{ id: unkId, token: unkToken, text: unkToken }];
        }
        return [];
      }

      pieces.push({
        id: encoder[foundToken],
        token: foundToken,
        text: foundToken.startsWith("##")
          ? `-${foundToken.slice(2)}`
          : foundToken,
      });

      start = end;
    }

    return pieces;
  };

  const encode = (text: string): EncodedPiece[] => {
    if (!text) return [];

    const normalized = normalizeText(text);
    const chunks = pretokenize(normalized);
    const out: EncodedPiece[] = [];

    for (const chunk of chunks) {
      out.push(...wordpieceTokenize(chunk));
    }

    return out;
  };

  return { encode };
}

export async function loadTinyStoriesTokenizer(): Promise<TinyStoriesTokenizer> {
  if (!tokenizerPromise) {
    tokenizerPromise = fetch(TOKENIZER_PATH)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load tokenizer: ${r.status}`);
        return r.json() as Promise<TokenizerJson>;
      })
      .then((json) => buildTokenizer(json));
  }

  return tokenizerPromise;
}
