"use client";

import { useCallback, useMemo, useState } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SelectControl } from "../shared/SelectControl";
import { CORPUS, EXAMPLE_QUERIES, type Doc } from "./corpus";
import { keywordScore, semanticScore, rank } from "./retrieval";

const DEFAULT_EXAMPLE_INDEX = 0;

const words = (s: string) => new Set(s.toLowerCase().match(/[a-z0-9]+/g) ?? []);

function HighlightedText({ text, matchWords }: { text: string; matchWords: Set<string> }) {
  const parts = text.split(/(\s+)/);
  return (
    <>
      {parts.map((part, i) => {
        const clean = part.toLowerCase().replace(/[^a-z0-9]/g, "");
        const hit = clean.length > 0 && matchWords.has(clean);
        return hit ? (
          <mark key={i} className="rounded bg-accent/20 px-0.5 text-foreground">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
}

function DocCard({
  doc,
  score,
  matchWords,
  matchTags,
}: {
  doc: Doc;
  score: number;
  matchWords: Set<string>;
  matchTags: Set<string>;
}) {
  const hit = score > 0;
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
        hit ? "border-accent/40 bg-accent/5" : "border-border bg-surface"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="leading-relaxed text-foreground">
          <HighlightedText text={doc.text} matchWords={matchWords} />
        </p>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-xs font-bold ${
            hit ? "bg-accent text-white" : "bg-foreground/10 text-muted"
          }`}
        >
          {score}
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {doc.tags.map((tag) => (
          <span
            key={tag}
            className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${
              matchTags.has(tag)
                ? "bg-accent/20 text-accent"
                : "bg-foreground/5 text-muted"
            }`}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Retrieval() {
  const [queryText, setQueryText] = useState(EXAMPLE_QUERIES[DEFAULT_EXAMPLE_INDEX].text);
  const [exampleIndex, setExampleIndex] = useState(DEFAULT_EXAMPLE_INDEX);

  const handleReset = useCallback(() => {
    setExampleIndex(DEFAULT_EXAMPLE_INDEX);
    setQueryText(EXAMPLE_QUERIES[DEFAULT_EXAMPLE_INDEX].text);
  }, []);

  const activeTags = EXAMPLE_QUERIES[exampleIndex].tags;
  const matchWords = useMemo(() => words(queryText), [queryText]);
  const matchTags = useMemo(() => new Set(activeTags), [activeTags]);

  const keywordRanked = useMemo(
    () => rank(CORPUS, (d) => keywordScore(queryText, d)),
    [queryText]
  );
  const semanticRanked = useMemo(
    () => rank(CORPUS, (d) => semanticScore({ tags: activeTags }, d)),
    [activeTags]
  );

  return (
    <WidgetContainer
      title="What goes in the window"
      description="The same query, searched two ways: by shared words and by shared meaning."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-4">
        <SelectControl
          label="Example query"
          value={String(exampleIndex)}
          options={EXAMPLE_QUERIES.map((q, i) => ({ value: String(i), label: q.text }))}
          onChange={(value) => {
            const i = Number(value);
            setExampleIndex(i);
            setQueryText(EXAMPLE_QUERIES[i].text);
          }}
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted">Or type your own query</label>
          <input
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30"
          />
          <p className="text-xs text-muted">
            Typing changes the words the keyword search sees. Meaning search still uses the
            tags from the selected example above.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wide text-muted">
              Keyword search (grep)
            </h4>
            <div className="flex flex-col gap-2">
              {keywordRanked.map(({ doc, score }) => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  score={score}
                  matchWords={matchWords}
                  matchTags={new Set()}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wide text-muted">
              Meaning search (embeddings)
            </h4>
            <div className="flex flex-col gap-2">
              {semanticRanked.map(({ doc, score }) => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  score={score}
                  matchWords={new Set()}
                  matchTags={matchTags}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
