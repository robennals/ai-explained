"use client";

import { useState, useMemo, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { useEmbeddingData } from "./useEmbeddingData";

/* ── Layout constants (matching NetworkOverview style) ── */
const W = 620;
const H = 360;
const NODE_R = 14;

/* Column x-positions */
const INPUT_X = 80;
const EMBED_X = 280;
const NEXT_X = 480; // "rest of network" column

/* Tokens to display */
const ALL_WORDS = ["the", "dog", "cat", "fish", "car", "apple", "king", "piano"];
const EMBED_DIM = 8;

/* Which indices to show (with a gap for "...") */
const INPUT_SHOW: (number | "dots")[] = [0, 1, 2, 3, 4, 5, "dots", 6, 7];
const OUTPUT_SHOW: (number | "dots")[] = [0, 1, 2, 3, 4, "dots", 5, 6, 7];
/* Next-layer placeholder nodes */
const NEXT_LAYER_COUNT = 5;

/* Colors matching NetworkOverview */
const INPUT_COLOR = "#3b82f6";
const INPUT_BG = "#f0f4ff";
const EMBED_COLOR = "#f59e0b";
const NEXT_COLOR = "#f59e0b";
const NEXT_BG = "#fef9ee";
const ACTIVE_COLOR = "#3b82f6";

/** Compute evenly-spaced Y positions with a dots gap */
function layoutColumn(
  items: (number | "dots")[],
  centerY: number,
  spacing: number
): { y: number; item: number | "dots" }[] {
  const totalH = (items.length - 1) * spacing;
  const startY = centerY - totalH / 2;
  return items.map((item, i) => ({ y: startY + i * spacing, item }));
}

/** Value-based fill for embedding nodes */
function valFill(v: number, maxAbs = 2.5): string {
  const t = Math.min(Math.abs(v) / maxAbs, 1);
  if (v >= 0) return `rgba(59, 130, 246, ${0.12 + t * 0.45})`;
  return `rgba(239, 68, 68, ${0.12 + t * 0.45})`;
}

export function EmbeddingLayerDiagram() {
  const { data, loading, error } = useEmbeddingData();
  const [selectedIdx, setSelectedIdx] = useState(1); // "dog"

  const resetState = useCallback(() => {
    setSelectedIdx(1);
  }, []);

  const wordData = useMemo(() => {
    if (!data) return ALL_WORDS.map((w) => ({ word: w, dataIdx: -1 }));
    return ALL_WORDS.map((w) => ({
      word: w,
      dataIdx: data.words.indexOf(w),
    }));
  }, [data]);

  const trainedVecs = useMemo(() => {
    if (!data) return ALL_WORDS.map(() => Array(EMBED_DIM).fill(0));
    return wordData.map((wd) => {
      if (wd.dataIdx < 0) return Array(EMBED_DIM).fill(0);
      return data.vectors[wd.dataIdx]
        .slice(0, EMBED_DIM)
        .map((v) => Math.round(v * 100) / 100);
    });
  }, [data, wordData]);

  const selVec = trainedVecs[selectedIdx];

  /* ── Node positions ── */
  const centerY = H / 2;
  const inputSpacing = 32;
  const embedSpacing = 34;

  const inputNodes = layoutColumn(INPUT_SHOW, centerY, inputSpacing);
  const embedNodes = layoutColumn(OUTPUT_SHOW, centerY, embedSpacing);

  // "Rest of network" nodes — evenly spaced, fewer nodes
  const nextSpacing = Math.min(40, (H - 80) / (NEXT_LAYER_COUNT - 1 || 1));
  const nextStartY = centerY - ((NEXT_LAYER_COUNT - 1) * nextSpacing) / 2;
  const nextNodes = Array.from({ length: NEXT_LAYER_COUNT }, (_, i) => ({
    x: NEXT_X,
    y: nextStartY + i * nextSpacing,
  }));

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
      description="Select an input token to see how the network turns it into an embedding"
      onReset={resetState}
    >
      {/* Controls */}
      <div className="mb-4 flex items-center gap-2">
        <label className="text-xs font-medium text-muted">Input token:</label>
        <select
          value={selectedIdx}
          onChange={(e) => setSelectedIdx(Number(e.target.value))}
          className="rounded-md border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-foreground outline-none focus:border-accent"
        >
          {ALL_WORDS.map((w, i) => (
            <option key={w} value={i}>
              &ldquo;{w}&rdquo;
            </option>
          ))}
        </select>
      </div>

      {/* SVG Diagram */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-[680px]"
        aria-label="Embedding layer shown as the first layer of a neural network"
      >
        {/* ── Connection lines: input → embedding ── */}
        {inputNodes.map((inp) => {
          if (inp.item === "dots") return null;
          const isActive = inp.item === selectedIdx;
          return embedNodes.map((emb, ei) => {
            if (emb.item === "dots") return null;
            return (
              <line
                key={`ie-${inp.item}-${ei}`}
                x1={INPUT_X + NODE_R}
                y1={inp.y}
                x2={EMBED_X - NODE_R}
                y2={emb.y}
                stroke={isActive ? ACTIVE_COLOR : "#d1d5db"}
                strokeWidth={isActive ? 1.8 : 0.6}
                opacity={isActive ? 0.7 : 0.18}
              />
            );
          });
        })}

        {/* ── Connection lines: embedding → next layer ── */}
        {embedNodes.map((emb) => {
          if (emb.item === "dots") return null;
          return nextNodes.map((nxt, ni) => (
            <line
              key={`en-${emb.item}-${ni}`}
              x1={EMBED_X + NODE_R}
              y1={emb.y}
              x2={nxt.x - NODE_R}
              y2={nxt.y}
              stroke="#d1d5db"
              strokeWidth={0.8}
              opacity={0.4}
            />
          ));
        })}

        {/* ── "..." arrow going off right edge ── */}
        {nextNodes.map((nxt, ni) => (
          <line
            key={`out-${ni}`}
            x1={nxt.x + NODE_R}
            y1={nxt.y}
            x2={nxt.x + NODE_R + 30}
            y2={nxt.y}
            stroke="#d1d5db"
            strokeWidth={0.8}
            opacity={0.4}
          />
        ))}
        {/* Arrow tip in center */}
        <polygon
          points={`${NEXT_X + NODE_R + 30},${centerY - 6} ${NEXT_X + NODE_R + 38},${centerY} ${NEXT_X + NODE_R + 30},${centerY + 6}`}
          fill="#d1d5db"
          opacity={0.5}
        />
        <text
          x={NEXT_X + NODE_R + 44}
          y={centerY + 4}
          className="fill-muted text-[9px] italic"
        >
          more layers...
        </text>

        {/* ── Input nodes (circles) ── */}
        {inputNodes.map((inp) => {
          if (inp.item === "dots") {
            return (
              <text
                key="in-dots"
                x={INPUT_X}
                y={inp.y + 5}
                textAnchor="middle"
                className="fill-muted text-[14px] font-bold select-none"
              >
                ⋮
              </text>
            );
          }
          const idx = inp.item;
          const isActive = idx === selectedIdx;
          return (
            <g key={`in-${idx}`}>
              <circle
                cx={INPUT_X}
                cy={inp.y}
                r={NODE_R}
                fill={isActive ? INPUT_COLOR : INPUT_BG}
                stroke={INPUT_COLOR}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              {/* "1" or "0" inside circle */}
              <text
                x={INPUT_X}
                y={inp.y + 4}
                textAnchor="middle"
                fill={isActive ? "#fff" : "#94a3b8"}
                className="text-[11px] font-bold select-none"
                style={{ pointerEvents: "none" }}
              >
                {isActive ? "1" : "0"}
              </text>
              {/* Word label to the left */}
              <text
                x={INPUT_X - NODE_R - 6}
                y={inp.y + 4}
                textAnchor="end"
                fill={isActive ? INPUT_COLOR : "#64748b"}
                className={`text-[10px] select-none ${isActive ? "font-bold" : "font-medium"}`}
                style={{ pointerEvents: "none" }}
              >
                {wordData[idx].word}
              </text>
            </g>
          );
        })}

        {/* ── Embedding nodes (circles) ── */}
        {embedNodes.map((emb) => {
          if (emb.item === "dots") {
            return (
              <text
                key="emb-dots"
                x={EMBED_X}
                y={emb.y + 5}
                textAnchor="middle"
                className="fill-muted text-[14px] font-bold select-none"
              >
                ⋮
              </text>
            );
          }
          const dimIdx = emb.item as number;
          const val = selVec[dimIdx];
          return (
            <g key={`emb-${dimIdx}`}>
              <circle
                cx={EMBED_X}
                cy={emb.y}
                r={NODE_R}
                fill={valFill(val)}
                stroke={EMBED_COLOR}
                strokeWidth={1.5}
              />
              {/* Value label to the right */}
              <text
                x={EMBED_X + NODE_R + 5}
                y={emb.y + 4}
                textAnchor="start"
                className="fill-muted text-[9px] font-mono select-none"
              >
                {val.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* ── Next-layer nodes (circles) ── */}
        {nextNodes.map((nxt, ni) => (
          <circle
            key={`nxt-${ni}`}
            cx={nxt.x}
            cy={nxt.y}
            r={NODE_R}
            fill={NEXT_BG}
            stroke={NEXT_COLOR}
            strokeWidth={1.5}
          />
        ))}

        {/* ── Column labels ── */}
        <text x={INPUT_X} y={H - 6} textAnchor="middle" className="fill-muted text-[10px]">
          Input
        </text>
        <text
          x={INPUT_X}
          y={16}
          textAnchor="middle"
          className="fill-muted text-[8px] italic"
        >
          (50,000+ in real models)
        </text>

        <text x={EMBED_X} y={H - 6} textAnchor="middle" className="fill-muted text-[10px]">
          Embedding
        </text>
        <text
          x={EMBED_X}
          y={16}
          textAnchor="middle"
          className="fill-muted text-[8px] italic"
        >
          (768+ dims in real models)
        </text>

        <text x={NEXT_X} y={H - 6} textAnchor="middle" className="fill-muted text-[10px]">
          Next layer
        </text>
      </svg>

      {/* Explanation panel */}
      <div className="mt-4 rounded-lg bg-surface p-3 text-xs text-muted leading-relaxed">
        <strong className="text-foreground">How it works:</strong> The selected token
        &ldquo;{wordData[selectedIdx].word}&rdquo; is set to{" "}
        <strong className="text-accent">1</strong>, and every other token is set to{" "}
        <strong>0</strong>. This is called{" "}
        <strong className="text-foreground">one-hot encoding</strong>. Each blue connection
        carries a weight. Since only one input is &ldquo;on,&rdquo; the embedding values are
        just the weights from that input. The embedding then feeds forward into the rest of
        the network — more layers of neurons, just like the ones in the previous chapter.
      </div>
    </WidgetContainer>
  );
}
