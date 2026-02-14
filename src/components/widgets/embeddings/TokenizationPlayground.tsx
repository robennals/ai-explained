"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { loadTinyStoriesTokenizer, type EncodedPiece } from "./bpeTokenizer";

const EXAMPLES = [
  "treeishness",
  "superman, superb, superlative", 
  "The dragonfly danced gracefully.",
  "The qwertyflorp blinked twice.",
  "reusable, rereading, and unbelievable",
  "Spaces, punctuation, and numbers: 42!",
];

const TOKEN_COLORS = [
  "bg-sky-100 border-sky-300",
  "bg-emerald-100 border-emerald-300",
  "bg-amber-100 border-amber-300",
  "bg-rose-100 border-rose-300",
  "bg-indigo-100 border-indigo-300",
  "bg-teal-100 border-teal-300",
];

function visualizeWhitespace(text: string): string {
  return text
    .replace(/ /g, "·")
    .replace(/\n/g, "↵\n")
    .replace(/\t/g, "⇥");
}

export function TokenizationPlayground() {
  const defaultText = EXAMPLES[0];
  const [inputText, setInputText] = useState(EXAMPLES[0]);
  const [pieces, setPieces] = useState<EncodedPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadTinyStoriesTokenizer()
      .then((tokenizer) => {
        if (cancelled) return;
        setPieces(tokenizer.encode(defaultText));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Failed to load tokenizer.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [defaultText]);

  const tokenize = useCallback(async (text: string) => {
    try {
      const tokenizer = await loadTinyStoriesTokenizer();
      setPieces(tokenizer.encode(text));
      setError(null);
    } catch {
      setError("Failed to tokenize input.");
    }
  }, []);

  const onChangeText = useCallback(
    (text: string) => {
      setInputText(text);
      void tokenize(text);
    },
    [tokenize]
  );

  const resetState = useCallback(() => {
    setInputText(defaultText);
    void tokenize(defaultText);
  }, [defaultText, tokenize]);

  const tokenCount = pieces.length;

  const uniqueCount = useMemo(() => {
    const ids = new Set<number>();
    for (const p of pieces) ids.add(p.id);
    return ids.size;
  }, [pieces]);

  if (loading) {
    return (
      <WidgetContainer title="BPE Tokenizer Playground" description="Loading...">
        <div className="flex items-center justify-center p-8 text-sm text-muted">
          Loading TinyStories tokenizer...
        </div>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      title="Tokenizer Playground"
      description="Enter some text and see how a tokenizer breaks it into sub-words. This is using a 4096 word WordPiece model."
      onReset={resetState}
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <span className="self-center text-[10px] font-medium uppercase tracking-wider text-muted">Try:</span>
        {EXAMPLES.map((example) => (
          <button
            key={example}
            onClick={() => onChangeText(example)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              inputText === example
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:bg-accent/10 hover:text-accent"
            }`}
          >
            {example.length > 30 ? `${example.slice(0, 30)}...` : example}
          </button>
        ))}
      </div>

      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted">
        Input Text
      </label>
      <textarea
        value={inputText}
        onChange={(e) => onChangeText(e.target.value)}
        rows={3}
        className="w-full rounded-md border border-border bg-white px-2.5 py-2 text-xs text-foreground outline-none focus:border-accent"
      />

      {error ? (
        <div className="mt-3 rounded-lg bg-error/10 p-3 text-xs text-error">{error}</div>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted">
            <span className="rounded bg-surface px-2 py-1">Tokens: {tokenCount}</span>
            <span className="rounded bg-surface px-2 py-1">Unique token IDs: {uniqueCount}</span>
          </div>

          <div className="mt-3 rounded-lg border border-border bg-surface/40 p-3">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted">Tokenized Output</div>
            {pieces.length === 0 ? (
              <div className="text-xs text-muted">Type some text to see tokens.</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {pieces.map((piece, i) => (
                  <span
                    key={`${piece.id}-${i}`}
                    className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-xs ${
                      TOKEN_COLORS[i % TOKEN_COLORS.length]
                    }`}
                    title={`token ${piece.token}`}
                  >
                    <span className="font-mono text-foreground">{visualizeWhitespace(piece.text)}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </WidgetContainer>
  );
}
