"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";
import { softmax } from "./toyMath";

/* ------------------------------------------------------------------ */
/*  Values: softmax turns match scores into attention percentages,     */
/*  then each token hands over its value weighted by that percentage.  */
/*  The asker ends up with a blend, sharp or mixed depending on the     */
/*  split.                                                             */
/* ------------------------------------------------------------------ */

interface Example {
  id: string;
  label: string;
  words: string[];
  asker: number;
  query: string;
  scores: number[];
  /** Token index → the key that token advertises (why it does or doesn't match). */
  keys: Record<number, string>;
  /** Token index → the value that token hands over. */
  values: Record<number, string>;
  result: string;
}

// The scores are chosen to follow naturally from how well each token's key
// matches the query, so a single round of query-key matching produces the
// split we want to show (clear win, even tie, or a semantic lean).
const EXAMPLES: Example[] = [
  {
    id: "winner",
    label: "A clear value",
    words: ["I", "dropped", "the", "glass", "and", "it", "broke", "."],
    asker: 5,
    query: "the thing being referred to",
    scores: [1, 2, 1, 8, 1, 0, 2, 1],
    keys: { 3: "a physical object" },
    values: { 3: "the glass" },
    result: "the glass",
  },
  {
    id: "split",
    label: "An even split",
    words: ["The", "cat", "and", "the", "dog", "were", "napping", "when", "it", "woke", "up", "."],
    asker: 8,
    query: "the thing being referred to",
    scores: [1, 6, 1, 1, 6, 1, 2, 1, 0, 2, 1, 1],
    keys: { 1: "an animal", 4: "an animal" },
    values: { 1: "the cat", 4: "the dog" },
    result: "either the cat or the dog",
  },
  {
    id: "lean",
    label: "A leaning blend",
    words: ["The", "cat", "watched", "the", "dog", ",", "and", "then", "it", "pounced", "."],
    asker: 9,
    query: "the agile animal that pounced",
    scores: [1, 5, 2, 1, 4, 1, 1, 1, 2, 0, 1],
    keys: { 1: "a cat, which pounces", 4: "a dog" },
    values: { 1: "the cat", 4: "the dog" },
    result: "probably the cat, maybe the dog",
  },
];

function pct(n: number): string {
  if (n > 0.995) return "100%";
  if (n < 0.005) return "≈0%";
  return `${(n * 100).toFixed(0)}%`;
}

/** Height of the arc region above the grid, in pixels. */
const ARC_H = 48;
const ARC_HUE = 240;

export function AttentionValues() {
  const [exampleIdx, setExampleIdx] = useState(0);
  const example = EXAMPLES[exampleIdx];

  const handleReset = useCallback(() => setExampleIdx(0), []);
  const handleTab = useCallback((id: string) => {
    setExampleIdx(EXAMPLES.findIndex((e) => e.id === id));
  }, []);

  const others = example.words.map((_, i) => i).filter((i) => i !== example.asker);
  const weights = softmax(others.map((i) => example.scores[i]));
  const weightByIndex = new Map<number, number>();
  others.forEach((i, k) => weightByIndex.set(i, weights[k]));

  // Tokens whose value makes a real contribution to the blend.
  const contributors = example.words
    .map((_, i) => i)
    .filter((i) => example.values[i] !== undefined && (weightByIndex.get(i) ?? 0) > 0.03)
    .sort((a, b) => (weightByIndex.get(b) ?? 0) - (weightByIndex.get(a) ?? 0));

  const tabs = EXAMPLES.map((e) => ({ id: e.id, label: e.label }));

  const scrollRef = useRef<HTMLDivElement>(null);
  const gridContentRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef<Map<number, HTMLElement>>(new Map());
  // Arcs from the asker column to each contributing token, drawn across the top
  // of the grid. Width scales with how much attention that token draws.
  const [arcs, setArcs] = useState<{ fromX: number; toX: number; weight: number }[]>([]);

  useEffect(() => {
    let raf = 0;
    const run = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const content = gridContentRef.current;
        const askerEl = colRefs.current.get(example.asker);
        if (!content || !askerEl) {
          setArcs([]);
          return;
        }
        const c = content.getBoundingClientRect();
        const a = askerEl.getBoundingClientRect();
        const fromX = a.left + a.width / 2 - c.left;
        const next: { fromX: number; toX: number; weight: number }[] = [];
        for (const i of contributors) {
          const el = colRefs.current.get(i);
          if (!el) continue;
          const r = el.getBoundingClientRect();
          next.push({ fromX, toX: r.left + r.width / 2 - c.left, weight: weightByIndex.get(i) ?? 0 });
        }
        setArcs(next);
      });
    };
    run();
    const scroller = scrollRef.current;
    scroller?.addEventListener("scroll", run, { passive: true });
    window.addEventListener("resize", run);
    return () => {
      cancelAnimationFrame(raf);
      scroller?.removeEventListener("scroll", run);
      window.removeEventListener("resize", run);
    };
    // Recompute when the example changes; contributors/weights derive from it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exampleIdx]);

  return (
    <WidgetContainer
      title="Gathering the Value"
      description="Each token's key scores against the query. Softmax turns those scores into attention percentages, and each token hands over its value weighted by that share."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-5">
        <WidgetTabs tabs={tabs} activeTab={example.id} onTabChange={handleTab} />

        <div className="rounded-lg border border-accent/40 bg-accent/5 px-3 py-2 text-sm">
          <div className="flex items-baseline gap-2">
            <span className="w-12 shrink-0 text-xs font-semibold uppercase tracking-wide text-accent">query</span>
            <span className="text-base font-medium text-foreground">{example.query}</span>
          </div>
          <div className="mt-1 pl-14 text-xs text-muted">
            what &ldquo;{example.words[example.asker]}&rdquo; is looking for in the other tokens
          </div>
        </div>

        {/* token / match score / softmax grid, with arcs from the asker to the
            tokens whose values it gathers */}
        <div ref={scrollRef} className="overflow-x-auto rounded-md border border-border">
          <div ref={gridContentRef} className="relative w-max">
            <svg
              className="pointer-events-none absolute left-0 top-0 overflow-visible"
              width="100%"
              height={ARC_H}
              style={{ zIndex: 10 }}
            >
              <defs>
                <marker id="val-arrowhead" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
                  <polygon points="0 0, 6 2.5, 0 5" fill={`hsla(${ARC_HUE}, 75%, 55%, 0.85)`} />
                </marker>
              </defs>
              {arcs.map((arc, k) => (
                <path
                  key={k}
                  d={`M ${arc.fromX} ${ARC_H - 6} Q ${(arc.fromX + arc.toX) / 2} 2 ${arc.toX} ${ARC_H - 8}`}
                  fill="none"
                  stroke={`hsla(${ARC_HUE}, 75%, 55%, ${0.4 + arc.weight * 0.5})`}
                  strokeWidth={1.5 + arc.weight * 1.5}
                  markerEnd="url(#val-arrowhead)"
                  className="transition-all duration-300"
                />
              ))}
            </svg>
            <div className="border-b border-border" style={{ height: ARC_H }} aria-hidden />
            <div className="flex w-max items-stretch">
            <div className="flex shrink-0 flex-col bg-foreground/[0.02]">
              <div className="flex h-9 items-center justify-end border-b border-border px-3 text-[10px] font-semibold uppercase tracking-wide text-muted">
                token
              </div>
              <div className="flex h-10 items-center justify-end border-b border-border px-3 text-[10px] font-semibold uppercase tracking-wide text-muted">
                match&nbsp;score
              </div>
              <div className="flex h-10 items-center justify-end px-3 text-[10px] font-semibold uppercase tracking-wide text-accent">
                softmax
              </div>
            </div>
            {example.words.map((word, i) => {
              const isAsker = i === example.asker;
              const w = weightByIndex.get(i) ?? 0;
              const hasValue = example.values[i] !== undefined;
              const strong = w > 0.05;
              return (
                <div
                  key={i}
                  ref={(el) => {
                    if (el) colRefs.current.set(i, el);
                    else colRefs.current.delete(i);
                  }}
                  className={`flex flex-col items-stretch border-l border-border ${
                    hasValue ? "bg-indigo-50/60 dark:bg-indigo-950/30" : ""
                  }`}
                >
                  <div
                    className={`flex h-9 items-center justify-center whitespace-nowrap border-b border-border px-3 text-lg ${
                      isAsker ? "font-bold text-accent" : hasValue ? "font-semibold text-indigo-600 dark:text-indigo-400" : "text-foreground"
                    }`}
                  >
                    {word}
                  </div>
                  <div className="flex h-10 items-center justify-center border-b border-border px-3 font-mono text-lg font-bold text-muted/70">
                    {isAsker ? "–" : example.scores[i]}
                  </div>
                  <div
                    className={`flex h-10 items-center justify-center px-3 font-mono text-lg font-bold ${
                      isAsker ? "text-muted/40" : strong ? "text-accent" : "text-muted/50"
                    }`}
                  >
                    {isAsker ? "–" : pct(w)}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>

        {/* Contributing values: each shows the key that earned its match and
            the value it hands over, so the softmax share follows from the key. */}
        <div className="flex flex-col gap-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">How each value matches</div>
          <div className="flex flex-wrap gap-2">
            {contributors.map((i) => (
              <div key={i} className="min-w-[13rem] flex-1 rounded-lg border border-indigo-400/50 bg-indigo-50 px-3 py-2 text-sm dark:bg-indigo-950/40">
                <div className="flex items-baseline justify-between gap-2 border-b border-indigo-400/30 pb-1">
                  <span className="font-bold text-indigo-700 dark:text-indigo-300">&ldquo;{example.words[i]}&rdquo;</span>
                  <span className="font-mono text-sm font-bold text-accent">{pct(weightByIndex.get(i) ?? 0)}</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2 text-foreground">
                  <span className="w-9 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">key</span>
                  <span className="leading-snug">{example.keys[i]}</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2 text-foreground">
                  <span className="w-9 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted">value</span>
                  <span className="leading-snug">{example.values[i]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Combined value */}
        <div className="rounded-lg border-2 border-accent bg-accent/10 px-4 py-3 text-center">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">
            What &ldquo;{example.words[example.asker]}&rdquo; gathered
          </div>
          <div className="text-lg font-medium text-foreground">{example.result}</div>
        </div>
      </div>
    </WidgetContainer>
  );
}
