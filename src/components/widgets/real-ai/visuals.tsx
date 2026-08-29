"use client";

import { useState } from "react";

const WORDS = ["volcano", "17 × 24", "sonnet", "def main():", "photosynthesis"];
// Which of the 16 experts wake for each word. Illustrative, not from a real router.
const PICKS = [
  [2, 11],
  [5, 6],
  [0, 13],
  [7, 8],
  [3, 10],
];

/** Mixture of experts: a router wakes a couple of experts out of many. */
export function MoEVisual() {
  const [i, setI] = useState(0);
  const lit = PICKS[i % PICKS.length];

  return (
    <div className="rounded-md border border-border bg-widget-bg p-3">
      <div className="flex items-center gap-2 text-[11px]">
        <span className="rounded bg-foreground/10 px-2 py-1 font-medium text-foreground">
          {WORDS[i % WORDS.length]}
        </span>
        <span className="text-muted">→</span>
        <span className="rounded border border-accent/40 bg-accent/10 px-2 py-1 font-medium text-accent">
          router
        </span>
        <span className="text-muted">→</span>
        <span className="text-muted">wakes 2 of 16</span>
      </div>

      <div className="mt-3 grid grid-cols-8 gap-1.5">
        {Array.from({ length: 16 }, (_, n) => {
          const on = lit.includes(n);
          return (
            <div
              key={n}
              className={`flex h-8 items-center justify-center rounded text-[10px] font-medium transition-colors duration-300 ${
                on
                  ? "bg-accent text-white shadow-sm"
                  : "bg-foreground/5 text-muted/50"
              }`}
              title={on ? "awake for this word" : "asleep"}
            >
              {n + 1}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={() => setI((n) => n + 1)}
          className="rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-accent-dark"
        >
          Send another word →
        </button>
        <p className="text-[11px] text-muted">
          Every word wakes a different pair. All 16 are stored; only 2 do any work.
        </p>
      </div>

      <p className="mt-2 text-[11px] text-muted">
        Real models are bigger in both directions: DeepSeek-V3 has 256 experts and wakes 8, Kimi K2 has 384.
      </p>
    </div>
  );
}

/** How much memory the model keeps per earlier word, under three schemes. */
export function KVCacheVisual() {
  const rows = [
    { label: "One copy per head (the original)", pct: 100, note: "what the first transformers did" },
    { label: "Heads share copies (GQA)", pct: 12.5, note: "8 heads sharing one, in Llama-scale models" },
    { label: "Squeezed into a summary (MLA)", pct: 6.7, note: "DeepSeek reports a 93% reduction" },
  ];
  return (
    <div className="rounded-md border border-border bg-widget-bg p-3">
      <p className="mb-2 text-[11px] font-medium text-muted">
        Memory kept for every earlier word
      </p>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex items-baseline justify-between gap-2 text-[11px]">
              <span className="text-foreground">{r.label}</span>
              <span className="tabular-nums text-muted">{r.pct}%</span>
            </div>
            <span className="mt-0.5 block h-2.5 w-full rounded-full bg-foreground/5">
              <span
                className="block h-2.5 rounded-full bg-accent"
                style={{ width: `${r.pct}%` }}
              />
            </span>
            <p className="mt-0.5 text-[10px] text-muted">{r.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Full attention vs. only looking at a chosen few. */
export function SparseAttentionVisual() {
  const [sparse, setSparse] = useState(false);
  const N = 10;
  const cells: boolean[][] = Array.from({ length: N }, (_, row) =>
    Array.from({ length: N }, (_, col) => {
      if (col > row) return false; // can't look ahead
      if (!sparse) return true;
      return col > row - 3 || col === 0; // recent window, plus the first word
    })
  );
  const count = cells.flat().filter(Boolean).length;
  const full = (N * (N + 1)) / 2;

  return (
    <div className="rounded-md border border-border bg-widget-bg p-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setSparse((s) => !s)}
          className="rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-accent-dark"
        >
          {sparse ? "Show full attention" : "Show sparse attention"}
        </button>
        <p className="text-[11px] tabular-nums text-muted">
          {count} of {full} comparisons ({Math.round((count / full) * 100)}%)
        </p>
      </div>

      <div className="mt-3 inline-grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${N}, 14px)` }}>
        {cells.flatMap((row, r) =>
          row.map((on, c) => (
            <span
              key={`${r}-${c}`}
              className={`h-3.5 w-3.5 rounded-[2px] transition-colors ${
                on ? "bg-accent" : c > r ? "bg-transparent" : "bg-foreground/8"
              }`}
            />
          ))
        )}
      </div>
      <p className="mt-2 text-[11px] text-muted">
        Each row is a word deciding which earlier words to look at. Full attention checks all of them, and
        the cost grows with the square of the length. Sparse attention checks a chosen few.
      </p>
    </div>
  );
}

/** The three training stages, as a before/after strip. */
export function StagesVisual({
  base,
  sft,
  aligned,
}: {
  base: string;
  sft: string;
  aligned: string;
}) {
  const stages = [
    { label: "Raw", text: base, tone: "text-muted" },
    { label: "Fine-tuned", text: sft, tone: "text-foreground/70" },
    { label: "Aligned", text: aligned, tone: "text-foreground" },
  ];
  return (
    <div className="space-y-2">
      {stages.map((s) => (
        <div key={s.label} className="rounded-md border border-border bg-widget-bg p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{s.label}</p>
          <p className={`mt-1 text-xs leading-relaxed ${s.tone}`}>{s.text}</p>
        </div>
      ))}
    </div>
  );
}
