"use client";

import { useState, useMemo, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

const PREDICTIONS: Record<string, { word: string; prob: number }[]> = {
  "cat": [{ word: "sat", prob: 0.18 }, { word: "was", prob: 0.15 }, { word: "is", prob: 0.12 }, { word: "ran", prob: 0.10 }, { word: "jumped", prob: 0.08 }],
  "dog": [{ word: "sat", prob: 0.16 }, { word: "was", prob: 0.14 }, { word: "is", prob: 0.13 }, { word: "ran", prob: 0.11 }, { word: "jumped", prob: 0.09 }],
  "kitten": [{ word: "was", prob: 0.17 }, { word: "sat", prob: 0.14 }, { word: "is", prob: 0.12 }, { word: "played", prob: 0.10 }, { word: "jumped", prob: 0.07 }],
  "puppy": [{ word: "was", prob: 0.16 }, { word: "sat", prob: 0.13 }, { word: "is", prob: 0.13 }, { word: "played", prob: 0.11 }, { word: "jumped", prob: 0.08 }],
  "king": [{ word: "was", prob: 0.20 }, { word: "of", prob: 0.18 }, { word: "said", prob: 0.10 }, { word: "had", prob: 0.09 }, { word: "ordered", prob: 0.07 }],
  "queen": [{ word: "was", prob: 0.19 }, { word: "of", prob: 0.17 }, { word: "said", prob: 0.11 }, { word: "had", prob: 0.10 }, { word: "ordered", prob: 0.06 }],
  "president": [{ word: "of", prob: 0.22 }, { word: "was", prob: 0.15 }, { word: "said", prob: 0.12 }, { word: "had", prob: 0.08 }, { word: "announced", prob: 0.06 }],
  "doctor": [{ word: "said", prob: 0.18 }, { word: "was", prob: 0.14 }, { word: "told", prob: 0.12 }, { word: "had", prob: 0.09 }, { word: "examined", prob: 0.07 }],
  "teacher": [{ word: "said", prob: 0.17 }, { word: "was", prob: 0.15 }, { word: "told", prob: 0.11 }, { word: "had", prob: 0.10 }, { word: "asked", prob: 0.08 }],
  "car": [{ word: "was", prob: 0.18 }, { word: "is", prob: 0.12 }, { word: "drove", prob: 0.10 }, { word: "stopped", prob: 0.08 }, { word: "crashed", prob: 0.06 }],
  "truck": [{ word: "was", prob: 0.17 }, { word: "is", prob: 0.11 }, { word: "drove", prob: 0.11 }, { word: "stopped", prob: 0.09 }, { word: "crashed", prob: 0.07 }],
  "bicycle": [{ word: "was", prob: 0.16 }, { word: "is", prob: 0.12 }, { word: "rode", prob: 0.10 }, { word: "stopped", prob: 0.07 }, { word: "fell", prob: 0.06 }],
};

const GROUPS = [
  ["cat", "dog", "kitten", "puppy"],
  ["king", "queen", "president"],
  ["doctor", "teacher"],
  ["car", "truck", "bicycle"],
];

const AVAILABLE_WORDS = Object.keys(PREDICTIONS);

const wordOptions = AVAILABLE_WORDS.map((w) => ({ value: w, label: w }));

function getGroup(word: string): string[] | null {
  return GROUPS.find((g) => g.includes(word)) || null;
}

function computeOverlap(a: { word: string }[], b: { word: string }[]): number {
  const setA = new Set(a.map((x) => x.word));
  return b.filter((x) => setA.has(x.word)).length;
}

export function SimpleNNPredictor() {
  const [wordA, setWordA] = useState("cat");
  const [wordB, setWordB] = useState("dog");

  const resetState = useCallback(() => {
    setWordA("cat");
    setWordB("dog");
  }, []);

  const predsA = PREDICTIONS[wordA];
  const predsB = PREDICTIONS[wordB];

  const maxProb = useMemo(() => {
    const allProbs = [...predsA, ...predsB].map((p) => p.prob);
    return Math.max(...allProbs);
  }, [predsA, predsB]);

  const groupA = getGroup(wordA);
  const groupB = getGroup(wordB);
  const sameGroup = groupA !== null && groupB !== null && groupA === groupB;
  const overlap = computeOverlap(predsA, predsB);

  return (
    <WidgetContainer
      title="Neural Network Predictor"
      description="Similar embeddings lead to similar predictions"
      onReset={resetState}
    >
      {/* Two side-by-side panels */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Panel A */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted">The</span>
            <select
              value={wordA}
              onChange={(e) => setWordA(e.target.value)}
              className="flex-1 rounded-md border border-border bg-white px-2.5 py-1.5 font-mono text-sm font-medium text-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30"
            >
              {wordOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="text-xs font-medium text-muted">...</span>
          </div>
          <div className="space-y-1">
            {predsA.map((pred) => (
              <div key={pred.word} className="flex items-center gap-2">
                <span className="w-16 text-right font-mono text-xs text-foreground">
                  {pred.word}
                </span>
                <div className="flex-1">
                  <div
                    className="h-4 rounded-sm bg-accent/70 transition-all duration-300"
                    style={{ width: `${(pred.prob / maxProb) * 100}%` }}
                  />
                </div>
                <span className="w-10 text-right font-mono text-xs text-muted">
                  {(pred.prob * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel B */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted">The</span>
            <select
              value={wordB}
              onChange={(e) => setWordB(e.target.value)}
              className="flex-1 rounded-md border border-border bg-white px-2.5 py-1.5 font-mono text-sm font-medium text-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30"
            >
              {wordOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="text-xs font-medium text-muted">...</span>
          </div>
          <div className="space-y-1">
            {predsB.map((pred) => (
              <div key={pred.word} className="flex items-center gap-2">
                <span className="w-16 text-right font-mono text-xs text-foreground">
                  {pred.word}
                </span>
                <div className="flex-1">
                  <div
                    className="h-4 rounded-sm bg-accent/70 transition-all duration-300"
                    style={{ width: `${(pred.prob / maxProb) * 100}%` }}
                  />
                </div>
                <span className="w-10 text-right font-mono text-xs text-muted">
                  {(pred.prob * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Similarity indicator */}
      <div className="mt-4">
        {wordA === wordB ? (
          <div className="rounded-lg bg-surface px-4 py-3 text-center text-sm text-muted">
            Pick two different words to compare their predictions.
          </div>
        ) : sameGroup ? (
          <div className="rounded-lg bg-green-50 px-4 py-3 text-center">
            <div className="text-sm font-medium text-green-700">
              These words have similar embeddings — and similar predictions!
            </div>
            <div className="mt-1 flex items-center justify-center gap-2">
              <span className="text-xs text-green-600">Prediction overlap:</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-3 w-3 rounded-full transition-colors ${
                      i < overlap ? "bg-green-500" : "bg-green-200"
                    }`}
                  />
                ))}
              </div>
              <span className="font-mono text-xs font-medium text-green-700">
                {overlap}/5
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-surface px-4 py-3 text-center">
            <div className="text-sm font-medium text-foreground">
              Different kinds of words — different predictions.
            </div>
            <div className="mt-1 flex items-center justify-center gap-2">
              <span className="text-xs text-muted">Prediction overlap:</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-3 w-3 rounded-full transition-colors ${
                      i < overlap ? "bg-accent/60" : "bg-foreground/10"
                    }`}
                  />
                ))}
              </div>
              <span className="font-mono text-xs font-medium text-muted">
                {overlap}/5
              </span>
            </div>
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}
