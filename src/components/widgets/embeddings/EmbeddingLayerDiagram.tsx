"use client";

import { useState, useMemo, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { useEmbeddingData } from "./useEmbeddingData";

const DISPLAY_WORDS = ["dog", "cat", "fish", "car", "apple", "king", "sword", "piano"];
const VOCAB_DISPLAY = 8;
const EMBED_DIM = 8; // Show 8 dims for clarity

function randomMatrix(rows: number, cols: number, seed: number): number[][] {
  // Simple seeded pseudo-random for "before training"
  let s = seed;
  const next = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return (s / 0x7fffffff) * 2 - 1;
  };
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Math.round(next() * 100) / 100)
  );
}

export function EmbeddingLayerDiagram() {
  const { data, loading, error } = useEmbeddingData();
  const [selectedWordIdx, setSelectedWordIdx] = useState(0);
  const [trained, setTrained] = useState(true);

  const resetState = useCallback(() => {
    setSelectedWordIdx(0);
    setTrained(true);
  }, []);

  // Get indices of display words in the data
  const wordData = useMemo(() => {
    if (!data) return [];
    return DISPLAY_WORDS.map((w) => {
      const idx = data.words.indexOf(w);
      return { word: w, dataIdx: idx };
    }).filter((d) => d.dataIdx >= 0);
  }, [data]);

  const randomMat = useMemo(() => randomMatrix(VOCAB_DISPLAY, EMBED_DIM, 42), []);

  // Build "after training" matrix from real pre-trained vectors
  const trainedMat = useMemo(() => {
    if (!data || wordData.length === 0) return randomMat;
    return wordData.map((wd) => {
      const vec = data.vectors[wd.dataIdx];
      return vec.slice(0, EMBED_DIM).map((v) => Math.round(v * 100) / 100);
    });
  }, [data, wordData, randomMat]);

  const matrix = trained ? trainedMat : randomMat;
  const selectedWord = wordData[selectedWordIdx] ?? wordData[0];
  const selectedRow = matrix[selectedWordIdx] ?? matrix[0];

  if (loading) {
    return (
      <WidgetContainer title="Embedding Layer" description="Loading...">
        <div className="flex items-center justify-center p-8 text-sm text-muted">
          Loading word vectors...
        </div>
      </WidgetContainer>
    );
  }

  if (error || !data) {
    return (
      <WidgetContainer title="Embedding Layer">
        <div className="p-4 text-sm text-error">Failed to load embedding data.</div>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      title="Inside an Embedding Layer"
      description="An embedding layer is just a lookup table: word index → row of numbers"
      onReset={resetState}
    >
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted">Word:</label>
          <select
            value={selectedWordIdx}
            onChange={(e) => setSelectedWordIdx(Number(e.target.value))}
            className="rounded-md border border-border bg-white px-2 py-1 text-xs font-medium text-foreground outline-none focus:border-accent"
          >
            {wordData.map((wd, i) => (
              <option key={wd.word} value={i}>{wd.word}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          {(["Before training", "After training"] as const).map((label, i) => (
            <button
              key={label}
              onClick={() => setTrained(i === 1)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                (i === 1) === trained
                  ? "bg-accent text-white"
                  : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Diagram: word → one-hot → matrix → embedding */}
      <div className="flex flex-col items-center gap-2 overflow-x-auto sm:flex-row sm:gap-4 sm:items-start">
        {/* Step 1: Word */}
        <div className="flex flex-col items-center">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted">Word</div>
          <div className="rounded-lg border-2 border-accent bg-accent/10 px-4 py-3 text-lg font-bold text-accent">
            {selectedWord?.word}
          </div>
        </div>

        <div className="hidden text-2xl text-muted sm:flex sm:items-center sm:pt-6">→</div>

        {/* Step 2: One-hot */}
        <div className="flex flex-col items-center">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted">One-Hot Index</div>
          <div className="flex gap-0.5">
            {wordData.map((wd, i) => (
              <div
                key={wd.word}
                className={`flex h-7 w-7 items-center justify-center rounded text-[9px] font-bold ${
                  i === selectedWordIdx
                    ? "bg-accent text-white"
                    : "bg-surface text-muted"
                }`}
                title={wd.word}
              >
                {i === selectedWordIdx ? "1" : "0"}
              </div>
            ))}
          </div>
        </div>

        <div className="hidden text-2xl text-muted sm:flex sm:items-center sm:pt-6">→</div>

        {/* Step 3: Embedding matrix */}
        <div className="flex flex-col items-center">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted">
            Embedding Matrix {trained ? "(trained)" : "(random)"}
          </div>
          <div className="rounded-lg border border-border p-1">
            {matrix.map((row, i) => (
              <div
                key={i}
                className={`flex gap-0.5 rounded px-0.5 py-0.5 ${
                  i === selectedWordIdx ? "bg-accent/15" : ""
                }`}
              >
                <span className="flex w-10 items-center text-[8px] font-medium text-muted">
                  {wordData[i]?.word}
                </span>
                {row.map((v, j) => {
                  const absMax = 3;
                  const intensity = Math.min(Math.abs(v) / absMax, 1);
                  const bg =
                    v >= 0
                      ? `rgba(59, 130, 246, ${intensity * 0.6})`
                      : `rgba(239, 68, 68, ${intensity * 0.6})`;
                  return (
                    <div
                      key={j}
                      className="flex h-5 w-8 items-center justify-center rounded-sm text-[8px] font-mono"
                      style={{ background: bg }}
                    >
                      {v.toFixed(1)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="hidden text-2xl text-muted sm:flex sm:items-center sm:pt-6">→</div>

        {/* Step 4: Result embedding vector */}
        <div className="flex flex-col items-center">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted">
            Embedding Vector
          </div>
          <div className="flex flex-col gap-0.5">
            {selectedRow.map((v, j) => {
              const absMax = 3;
              const intensity = Math.min(Math.abs(v) / absMax, 1);
              const bg =
                v >= 0
                  ? `rgba(59, 130, 246, ${intensity * 0.6})`
                  : `rgba(239, 68, 68, ${intensity * 0.6})`;
              return (
                <div
                  key={j}
                  className="flex h-5 w-14 items-center justify-center rounded-sm text-[9px] font-mono font-bold"
                  style={{ background: bg }}
                >
                  {v.toFixed(2)}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-surface p-3 text-xs text-muted">
        {trained ? (
          <>
            <strong className="text-foreground">After training:</strong> The matrix has been
            optimized so that similar words end up with similar vectors. Each row captures
            the meaning of its word as a pattern of numbers.
          </>
        ) : (
          <>
            <strong className="text-foreground">Before training:</strong> The matrix starts
            with random values. No word is similar to any other — there&apos;s no meaningful
            structure yet. Training will gradually reshape these numbers.
          </>
        )}
      </div>
    </WidgetContainer>
  );
}
