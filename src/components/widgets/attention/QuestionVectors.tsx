"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { VectorCard } from "../vectors/VectorCard";
import { dot } from "./toyMath";

/* ------------------------------------------------------------------ */
/*  A question is a vector. These dimensions are illustrative only —    */
/*  real models learn their own and never name them. The point is that  */
/*  a query and a key are vectors, and their dot product scores the      */
/*  overlap between the question asked and the question offered.        */
/* ------------------------------------------------------------------ */

const DIMS = ["river", "money", "person", "place", "action"];

interface Word {
  label: string;
  /** The question this word offers to answer, as a vector over DIMS. */
  key: number[];
  /** Plain-English gloss of that offered question. */
  offers: string;
}

const WORDS: Word[] = [
  { label: "river", key: [1, 0, 0, 1, 0], offers: "a river? a place?" },
  { label: "vault", key: [0, 1, 0, 1, 0], offers: "money? a place?" },
  { label: "chef", key: [0, 0, 1, 0, 0], offers: "a person?" },
  { label: "ran", key: [0, 0, 0, 0, 1], offers: "an action?" },
];

function argmax(arr: number[]): number {
  let best = 0;
  for (let i = 1; i < arr.length; i++) if (arr[i] > arr[best]) best = i;
  return best;
}

export function QuestionVectors() {
  // The query starts as "are we talking about a river or money?"
  const [query, setQuery] = useState<boolean[]>(() => DIMS.map((d) => d === "river" || d === "money"));
  const [selected, setSelected] = useState<number | null>(null);

  const queryVec = query.map((on) => (on ? 1 : 0));
  const scores = WORDS.map((w) => dot(queryVec, w.key));
  const winnerIdx = argmax(scores);
  const maxScore = scores[winnerIdx];
  const shownIdx = selected ?? winnerIdx;
  const shown = WORDS[shownIdx];
  const anyAsked = queryVec.some((q) => q === 1);

  const handleReset = useCallback(() => {
    setQuery(DIMS.map((d) => d === "river" || d === "money"));
    setSelected(null);
  }, []);

  const toggle = useCallback((i: number) => {
    setQuery((prev) => prev.map((on, j) => (j === i ? !on : on)));
  }, []);

  const breakdown = DIMS.map((_, d) => `${queryVec[d]}×${shown.key[d]}`).join(" + ");

  return (
    <WidgetContainer
      title="A Question Is a Vector"
      description="Write a question as a vector, write each word's offer as a vector, and their dot product scores how well they match."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-5">
        {/* Build the query */}
        <div>
          <div className="mb-2 text-xs font-medium text-muted">
            The question being asked (the query) — click to ask about each thing:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {DIMS.map((d, i) => (
              <button
                key={d}
                onClick={() => toggle(i)}
                aria-pressed={query[i]}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  query[i]
                    ? "bg-accent text-white"
                    : "bg-foreground/5 text-muted hover:bg-foreground/10 hover:text-foreground"
                }`}
              >
                {d}?
              </button>
            ))}
          </div>
          <div className="mt-3">
            <VectorCard
              name=""
              emoji=""
              properties={DIMS}
              values={queryVec}
              label="QUERY"
              labelColor="var(--color-accent)"
              barColor="var(--color-accent)"
              barMax={1}
              animate={false}
              labelWidth="w-16"
              className="text-xs"
            />
          </div>
        </div>

        {/* Candidate words, each offering a question (key) */}
        <div className="flex flex-wrap justify-center gap-3">
          {WORDS.map((w, i) => {
            const isWinner = anyAsked && maxScore > 0 && scores[i] === maxScore;
            const isShown = i === shownIdx;
            return (
              <button
                key={w.label}
                onClick={() => setSelected(selected === i ? null : i)}
                aria-pressed={isShown}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-2 transition-all ${
                  isShown ? "border-accent ring-2 ring-accent/30" : "border-transparent hover:border-foreground/15"
                }`}
                style={{ width: 160 }}
              >
                <span className="text-base font-bold text-foreground">{w.label}</span>
                <span className="text-[11px] text-muted">offers: {w.offers}</span>
                <VectorCard
                  name=""
                  emoji=""
                  properties={DIMS}
                  values={w.key}
                  label="KEY"
                  barMax={1}
                  animate={false}
                  labelWidth="w-16"
                  className={`w-full text-xs ${isWinner ? "!border-success" : ""}`}
                />
                <div className="flex flex-col items-center leading-tight">
                  <span className="text-[10px] uppercase tracking-wide text-muted">match</span>
                  <span className={`font-mono text-2xl font-bold ${isWinner ? "text-success" : "text-foreground/45"}`}>
                    {scores[i]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Multiply-and-add breakdown for the shown word */}
        <div className="rounded-lg border border-border bg-foreground/[0.02] px-4 py-3 text-center">
          <div className="text-xs text-muted">
            <span className="font-semibold text-foreground">{shown.label}</span>: multiply each pair, add them up
          </div>
          <div className="mt-1 break-words font-mono text-sm text-foreground">
            {breakdown} <span className="text-muted">=</span>{" "}
            <span className="font-bold text-accent">{scores[shownIdx]}</span>
          </div>
        </div>

        <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
          A question is a vector, and a word&apos;s offer is a vector. The dot product is large wherever they share a
          dimension. Ask about both river and money and two different words light up, each on the part it shares.
        </div>
      </div>
    </WidgetContainer>
  );
}
