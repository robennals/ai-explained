"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { useEmbeddingData } from "./useEmbeddingData";

const DISPLAY_WORDS = ["the", "dog", "cat", "fish", "car", "apple", "king", "piano"];
const VISIBLE_INPUT = 6; // Show 6 tokens + "..." + 2 more
const VISIBLE_OUTPUT = 5; // Show 5 dims + "..." + 1 more
const EMBED_DIM = 8; // Actual dims we use internally

function randomVector(length: number, seed: number): number[] {
  let s = seed;
  const next = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return (s / 0x7fffffff) * 2 - 1;
  };
  return Array.from({ length }, () => Math.round(next() * 100) / 100);
}

/** Color a value: positive = blue, negative = red */
function valColor(v: number, maxAbs = 2.5): string {
  const intensity = Math.min(Math.abs(v) / maxAbs, 1);
  return v >= 0
    ? `rgba(59, 130, 246, ${0.15 + intensity * 0.55})`
    : `rgba(239, 68, 68, ${0.15 + intensity * 0.55})`;
}

export function EmbeddingLayerDiagram() {
  const { data, loading, error } = useEmbeddingData();
  const [selectedIdx, setSelectedIdx] = useState(1); // "dog" by default
  const [trained, setTrained] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);
  const inputRefs = useRef<(HTMLDivElement | null)[]>([]);
  const outputRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([]);

  const resetState = useCallback(() => {
    setSelectedIdx(1);
    setTrained(true);
  }, []);

  // Build word data from the real embedding
  const wordData = useMemo(() => {
    if (!data) return DISPLAY_WORDS.map((w) => ({ word: w, dataIdx: -1 }));
    return DISPLAY_WORDS.map((w) => {
      const idx = data.words.indexOf(w);
      return { word: w, dataIdx: idx };
    });
  }, [data]);

  // Random vectors for "before training"
  const randomVecs = useMemo(
    () => DISPLAY_WORDS.map((_, i) => randomVector(EMBED_DIM, 42 + i * 7)),
    []
  );

  // Trained vectors from real data
  const trainedVecs = useMemo(() => {
    if (!data) return randomVecs;
    return wordData.map((wd, i) => {
      if (wd.dataIdx < 0) return randomVecs[i];
      return data.vectors[wd.dataIdx].slice(0, EMBED_DIM).map((v) => Math.round(v * 100) / 100);
    });
  }, [data, wordData, randomVecs]);

  const currentVecs = trained ? trainedVecs : randomVecs;
  const selectedVec = currentVecs[selectedIdx];

  // Compute line positions from input nodes to output nodes
  const updateLines = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const svgRect = svg.getBoundingClientRect();

    const newLines: { x1: number; y1: number; x2: number; y2: number }[] = [];

    const inputEl = inputRefs.current[selectedIdx];
    if (!inputEl) return;
    const inRect = inputEl.getBoundingClientRect();
    const x1 = inRect.right - svgRect.left;
    const y1 = inRect.top + inRect.height / 2 - svgRect.top;

    outputRefs.current.forEach((el) => {
      if (!el) return;
      const outRect = el.getBoundingClientRect();
      const x2 = outRect.left - svgRect.left;
      const y2 = outRect.top + outRect.height / 2 - svgRect.top;
      newLines.push({ x1, y1, x2, y2 });
    });

    setLines(newLines);
  }, [selectedIdx]);

  useEffect(() => {
    updateLines();
    window.addEventListener("resize", updateLines);
    return () => window.removeEventListener("resize", updateLines);
  }, [updateLines, trained]);

  // Indices to display: first few, then "...", then last couple
  // For inputs: show indices 0..VISIBLE_INPUT-1, then "...", then last 2
  const inputIndices: (number | "dots")[] = useMemo(() => {
    const items: (number | "dots")[] = [];
    for (let i = 0; i < VISIBLE_INPUT; i++) items.push(i);
    items.push("dots");
    items.push(DISPLAY_WORDS.length - 2);
    items.push(DISPLAY_WORDS.length - 1);
    return items;
  }, []);

  // For outputs: show dims 0..VISIBLE_OUTPUT-1, then "...", then last dim
  const outputIndices: (number | "dots")[] = useMemo(() => {
    const items: (number | "dots")[] = [];
    for (let i = 0; i < VISIBLE_OUTPUT; i++) items.push(i);
    items.push("dots");
    items.push(EMBED_DIM - 1);
    return items;
  }, []);

  if (loading) {
    return (
      <WidgetContainer title="Embedding as a Network Layer" description="Loading...">
        <div className="flex items-center justify-center p-8 text-sm text-muted">
          Loading word vectors...
        </div>
      </WidgetContainer>
    );
  }

  if (error || !data) {
    return (
      <WidgetContainer title="Embedding as a Network Layer">
        <div className="p-4 text-sm text-error">Failed to load embedding data.</div>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      title="Embedding as a Network Layer"
      description="Click a token on the left to see how the network turns it into an embedding"
      onReset={resetState}
    >
      {/* Training toggle */}
      <div className="mb-5 flex gap-2">
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

      {/* Network diagram */}
      <div className="relative flex items-stretch justify-between gap-0 min-h-[320px]">
        {/* Input layer */}
        <div className="flex flex-col items-end z-10 shrink-0">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted text-center w-full">
            Input tokens
          </div>
          <div className="flex flex-col gap-1">
            {inputIndices.map((item, i) => {
              if (item === "dots") {
                return (
                  <div
                    key={`dots-${i}`}
                    className="flex h-7 items-center justify-center text-sm font-bold text-muted select-none"
                  >
                    &#8942;
                  </div>
                );
              }
              const idx = item;
              const isSelected = idx === selectedIdx;
              return (
                <div
                  key={`in-${idx}`}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  onClick={() => setSelectedIdx(idx)}
                  className={`flex items-center gap-1.5 cursor-pointer rounded-lg px-2 py-1 transition-all ${
                    isSelected
                      ? "bg-accent text-white shadow-sm ring-2 ring-accent/30"
                      : "bg-surface text-foreground hover:bg-accent/10"
                  }`}
                >
                  <span className="text-xs font-semibold w-12 text-right truncate">
                    {wordData[idx].word}
                  </span>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                      isSelected
                        ? "bg-white/90 text-accent"
                        : "bg-white/60 text-muted"
                    }`}
                  >
                    {isSelected ? "1" : "0"}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 text-[9px] text-muted text-center w-full italic">
            (50,000+ tokens in real models)
          </div>
        </div>

        {/* Connection lines via SVG */}
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1 }}
        >
          {lines.map((line, i) => (
            <line
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="var(--color-accent)"
              strokeWidth={1.5}
              strokeOpacity={0.35}
            />
          ))}
        </svg>

        {/* Output layer */}
        <div className="flex flex-col items-start z-10 shrink-0">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted text-center w-full">
            Embedding dimensions
          </div>
          <div className="flex flex-col gap-1">
            {outputIndices.map((item, i) => {
              if (item === "dots") {
                return (
                  <div
                    key={`dots-out-${i}`}
                    className="flex h-7 items-center justify-center text-sm font-bold text-muted select-none"
                  >
                    &#8942;
                  </div>
                );
              }
              const dimIdx = item;
              const val = selectedVec[dimIdx];
              return (
                <div
                  key={`out-${dimIdx}`}
                  ref={(el) => { outputRefs.current[dimIdx] = el; }}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1"
                  style={{ background: valColor(val) }}
                >
                  <span className="text-[10px] text-muted w-8">dim {dimIdx + 1}</span>
                  <span className="text-xs font-mono font-bold text-foreground w-12 text-right">
                    {val.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 text-[9px] text-muted text-center w-full italic">
            (768+ dims in real models)
          </div>
        </div>
      </div>

      {/* One-hot explanation */}
      <div className="mt-4 rounded-lg bg-surface p-3 text-xs text-muted leading-relaxed">
        <strong className="text-foreground">How it works:</strong> The selected token
        &ldquo;{wordData[selectedIdx].word}&rdquo; is set to <strong className="text-accent">1</strong>,
        and every other token is set to <strong>0</strong>. This is called{" "}
        <strong className="text-foreground">one-hot encoding</strong>. Each connection between the
        selected input and an output has a <strong className="text-foreground">weight</strong> — and
        since the input is 1, the output is just those weights. So the embedding for a token
        is simply the row of weights connected to it.
        {!trained && (
          <span className="block mt-1">
            Right now these weights are random noise — the network hasn&apos;t learned anything yet.
            Switch to &ldquo;After training&rdquo; to see meaningful embeddings.
          </span>
        )}
        {trained && (
          <span className="block mt-1">
            After training, these weights have been tuned so that similar words get similar
            patterns of numbers. Try clicking different words and compare their values.
          </span>
        )}
      </div>
    </WidgetContainer>
  );
}
