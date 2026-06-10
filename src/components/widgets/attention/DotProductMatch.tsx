"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";
import { VectorCard } from "../vectors/VectorCard";
import { dot } from "./toyMath";

/* ------------------------------------------------------------------ */
/*  Data: the same dot product at three levels of complexity           */
/* ------------------------------------------------------------------ */

interface Candidate {
  label: string;
  vec: number[];
}

interface Level {
  id: string;
  tab: string;
  dims: string[];
  signed: boolean;
  /** A word/phrase describing what the query is hunting for. */
  queryLabel: string;
  query: number[];
  candidates: Candidate[];
  blurb: string;
}

const LEVELS: Level[] = [
  {
    id: "one",
    tab: "One dimension",
    dims: ["noun"],
    signed: false,
    queryLabel: "looking for a noun",
    query: [1],
    candidates: [
      { label: "cat", vec: [1] },
      { label: "blah", vec: [0] },
      { label: "ran", vec: [0] },
    ],
    blurb:
      "The simplest possible case. One dimension, “noun.” The dot product is just one multiplication. “cat” advertises noun, the query wants a noun, they match.",
  },
  {
    id: "named",
    tab: "Named dimensions",
    dims: ["noun", "river", "money", "action"],
    signed: false,
    queryLabel: "a money-related noun",
    query: [1, 0, 1, 0],
    candidates: [
      { label: "cat", vec: [1, 0, 0, 0] },
      { label: "bank", vec: [1, 0, 1, 0] },
      { label: "river", vec: [1, 1, 0, 0] },
      { label: "ran", vec: [0, 0, 0, 1] },
    ],
    blurb:
      "More dimensions let the query look for several things at once. Multiply each pair and add them up. “bank” lines up on both noun and money, so it scores highest.",
  },
  {
    id: "embedding",
    tab: "An embedding",
    dims: ["dim 1", "dim 2", "dim 3", "dim 4", "dim 5"],
    signed: true,
    queryLabel: "a learned pattern (no human name)",
    query: [0.6, -0.2, 0.5, 0.1, -0.4],
    candidates: [
      { label: "word A", vec: [0.5, -0.1, 0.6, 0.0, -0.3] },
      { label: "word B", vec: [-0.4, 0.5, -0.2, 0.3, 0.2] },
      { label: "word C", vec: [0.1, 0.2, 0.0, -0.5, 0.4] },
    ],
    blurb:
      "In a real model the dimensions have no human names — they’re learned. The dot product is exactly the same operation, and it still scores how well two vectors line up.",
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmt(n: number): string {
  const s = Number.isInteger(n) ? String(n) : n.toFixed(1);
  return n < 0 ? `(${s.replace("-", "−")})` : s;
}

function fmtScore(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace("-", "−");
}

function argmax(arr: number[]): number {
  let best = 0;
  for (let i = 1; i < arr.length; i++) if (arr[i] > arr[best]) best = i;
  return best;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function DotProductMatch() {
  const [levelIdx, setLevelIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const level = LEVELS[levelIdx];
  const scores = level.candidates.map((c) => dot(level.query, c.vec));
  const winnerIdx = argmax(scores);
  const shownIdx = selected ?? winnerIdx;
  const shown = level.candidates[shownIdx];

  const handleReset = useCallback(() => {
    setLevelIdx(0);
    setSelected(null);
  }, []);

  const handleTabChange = useCallback((tabId: string) => {
    setLevelIdx(LEVELS.findIndex((l) => l.id === tabId));
    setSelected(null);
  }, []);

  const tabs = LEVELS.map((l) => ({ id: l.id, label: l.tab }));

  const breakdownTerms = level.dims.map(
    (_, d) => `${fmt(level.query[d])}×${fmt(shown.vec[d])}`
  );

  const cardMax = level.signed ? 1 : Math.max(1, ...level.query, ...level.candidates.flatMap((c) => c.vec));

  return (
    <WidgetContainer
      title="Matching with the Dot Product"
      description="A query and a key match when they point the same way. The dot product turns that into one number. Same operation at every level of detail."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-5">
        <WidgetTabs tabs={tabs} activeTab={level.id} onTabChange={handleTabChange} />

        {/* The query */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-accent">
            Query — {level.queryLabel}
          </div>
          <VectorCard
            name=""
            emoji=""
            properties={level.dims}
            values={level.query}
            label="QUERY"
            labelColor="var(--color-accent)"
            barColor="var(--color-accent)"
            barMax={cardMax}
            signed={level.signed}
            signedMax={1}
            animate={false}
            labelWidth="w-12"
            className="text-xs"
          />
        </div>

        {/* Candidate keys with scores */}
        <div className="flex flex-wrap justify-center gap-3">
          {level.candidates.map((cand, i) => {
            const isWinner = i === winnerIdx;
            const isShown = i === shownIdx;
            return (
              <button
                key={`${level.id}-${i}`}
                onClick={() => setSelected(selected === i ? null : i)}
                aria-pressed={isShown}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-2 transition-all ${
                  isShown ? "border-accent ring-2 ring-accent/30" : "border-transparent hover:border-foreground/15"
                }`}
                style={{ width: 150 }}
              >
                <span className="text-base font-bold text-foreground">{cand.label}</span>
                <VectorCard
                  name=""
                  emoji=""
                  properties={level.dims}
                  values={cand.vec}
                  label="KEY"
                  barMax={cardMax}
                  signed={level.signed}
                  signedMax={1}
                  animate={false}
                  labelWidth="w-12"
                  className={`w-full text-xs ${isWinner ? "!border-success" : ""}`}
                />
                <div className="flex flex-col items-center leading-tight">
                  <span className="text-[10px] uppercase tracking-wide text-muted">score</span>
                  <span className={`font-mono text-2xl font-bold ${isWinner ? "text-success" : "text-foreground/45"}`}>
                    {fmtScore(scores[i])}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Multiply-and-add breakdown for the shown candidate */}
        <div className="rounded-lg border border-border bg-foreground/[0.02] px-4 py-3 text-center">
          <div className="text-xs text-muted">
            <span className="font-semibold text-foreground">{shown.label}</span>: multiply each pair, add them up
          </div>
          <div className="mt-1 break-words font-mono text-sm text-foreground">
            {breakdownTerms.join(" + ")} <span className="text-muted">=</span>{" "}
            <span className="font-bold text-accent">{fmtScore(scores[shownIdx])}</span>
          </div>
        </div>

        {/* Per-level explanation */}
        <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
          {level.blurb}
        </div>
      </div>
    </WidgetContainer>
  );
}
