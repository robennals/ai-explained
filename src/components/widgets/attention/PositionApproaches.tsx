"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

/* ------------------------------------------------------------------ */
/*  Data                                                              */
/* ------------------------------------------------------------------ */

interface Approach {
  name: string;
  how: string;
  where: string;
  pro: string;
  con: string;
  models: string;
  /** Visual diagram type */
  kind: "add-to-embedding" | "rotate-embedding" | "add-to-scores";
}

const APPROACHES: Approach[] = [
  {
    name: "Learned absolute",
    how: "Learn a separate embedding vector for each position (position 1 gets one vector, position 2 gets another, etc.) and add it to the token embedding.",
    where: "Added to input embeddings before attention",
    pro: "Simple to implement — just a lookup table of position vectors.",
    con: "Can't handle positions longer than the training data. Position 512 in a 1,000-word sentence is the same as position 512 in a 513-word sentence.",
    models: "GPT-2, BERT",
    kind: "add-to-embedding",
  },
  {
    name: "Sinusoidal",
    how: "Add a fixed pattern of sine and cosine waves at different frequencies to each position. No learned parameters — the pattern is a mathematical formula.",
    where: "Added to input embeddings before attention",
    pro: "Works for any sequence length (no learned limit). Nearby positions have similar patterns.",
    con: "Fixed formula can't adapt to what the model actually needs. Largely replaced by learned or rotary methods.",
    models: "Original Transformer (2017)",
    kind: "add-to-embedding",
  },
  {
    name: "ALiBi",
    how: "Don't touch the embeddings at all. Instead, after computing the Q·K dot products, subtract a penalty proportional to the distance between each pair of tokens. Nearby words keep their scores; far-apart words get penalized.",
    where: "Added to attention scores after Q·K",
    pro: "Elegantly simple. Generalizes to longer sequences than seen in training.",
    con: "Only encodes distance, not richer positional relationships. The penalty is the same regardless of content.",
    models: "BLOOM, MPT",
    kind: "add-to-scores",
  },
  {
    name: "RoPE (Rotary)",
    how: "Rotate each token's query and key vectors by an angle proportional to its position. The dot product of two rotated vectors naturally depends on their relative distance.",
    where: "Applied to Q and K vectors before dot product",
    pro: "Encodes relative position directly in the dot product. No extra parameters. Elegant math.",
    con: "Requires understanding of rotation matrices to fully grasp. Needs modifications (like YaRN) for very long contexts.",
    models: "Llama, Mistral, Gemma, Qwen, DeepSeek",
    kind: "rotate-embedding",
  },
];

/* ------------------------------------------------------------------ */
/*  Mini diagrams                                                     */
/* ------------------------------------------------------------------ */

function MiniDiagram({ kind }: { kind: Approach["kind"] }) {
  const w = 280;
  const h = 80;

  if (kind === "add-to-embedding") {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[280px]">
        {/* Token embedding */}
        <rect x={10} y={25} width={70} height={30} rx={4} fill="#6366f1" opacity={0.2} stroke="#6366f1" strokeWidth={1} />
        <text x={45} y={44} textAnchor="middle" fontSize={9} fill="#6366f1" fontWeight="bold">embedding</text>
        {/* Plus */}
        <text x={95} y={45} textAnchor="middle" fontSize={16} fill="currentColor" opacity={0.4}>+</text>
        {/* Position vector */}
        <rect x={110} y={25} width={70} height={30} rx={4} fill="#f59e0b" opacity={0.2} stroke="#f59e0b" strokeWidth={1} />
        <text x={145} y={44} textAnchor="middle" fontSize={9} fill="#f59e0b" fontWeight="bold">position</text>
        {/* Arrow */}
        <line x1={190} y1={40} x2={210} y2={40} stroke="currentColor" strokeWidth={1.5} opacity={0.3} />
        <polygon points="210,35 220,40 210,45" fill="currentColor" opacity={0.3} />
        {/* Result */}
        <rect x={225} y={25} width={45} height={30} rx={4} fill="#10b981" opacity={0.2} stroke="#10b981" strokeWidth={1} />
        <text x={247} y={44} textAnchor="middle" fontSize={9} fill="#10b981" fontWeight="bold">input</text>
      </svg>
    );
  }

  if (kind === "rotate-embedding") {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[280px]">
        {/* Q/K vector */}
        <rect x={10} y={25} width={50} height={30} rx={4} fill="#6366f1" opacity={0.2} stroke="#6366f1" strokeWidth={1} />
        <text x={35} y={44} textAnchor="middle" fontSize={9} fill="#6366f1" fontWeight="bold">Q / K</text>
        {/* Rotation arrow */}
        <g transform="translate(85, 40)">
          <path d="M 0,-12 A 12,12 0 1,1 -8,8" fill="none" stroke="#f59e0b" strokeWidth={1.5} />
          <polygon points="-12,6 -8,8 -4,4" fill="#f59e0b" />
        </g>
        <text x={85} y={44} textAnchor="middle" fontSize={8} fill="#f59e0b" fontWeight="bold">rotate</text>
        {/* Arrow */}
        <line x1={110} y1={40} x2={130} y2={40} stroke="currentColor" strokeWidth={1.5} opacity={0.3} />
        <polygon points="130,35 140,40 130,45" fill="currentColor" opacity={0.3} />
        {/* Rotated Q/K */}
        <rect x={145} y={25} width={50} height={30} rx={4} fill="#10b981" opacity={0.2} stroke="#10b981" strokeWidth={1} />
        <text x={170} y={44} textAnchor="middle" fontSize={9} fill="#10b981" fontWeight="bold">Q&apos;/ K&apos;</text>
        {/* Dot product */}
        <text x={210} y={45} textAnchor="middle" fontSize={12} fill="currentColor" opacity={0.4}>→ Q&apos;·K&apos;</text>
      </svg>
    );
  }

  // add-to-scores
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[280px]">
      {/* Q·K */}
      <rect x={10} y={25} width={55} height={30} rx={4} fill="#6366f1" opacity={0.2} stroke="#6366f1" strokeWidth={1} />
      <text x={37} y={44} textAnchor="middle" fontSize={9} fill="#6366f1" fontWeight="bold">Q · K</text>
      {/* Minus */}
      <text x={82} y={45} textAnchor="middle" fontSize={16} fill="currentColor" opacity={0.4}>−</text>
      {/* Distance penalty */}
      <rect x={98} y={25} width={80} height={30} rx={4} fill="#f59e0b" opacity={0.2} stroke="#f59e0b" strokeWidth={1} />
      <text x={138} y={44} textAnchor="middle" fontSize={9} fill="#f59e0b" fontWeight="bold">m × distance</text>
      {/* Arrow */}
      <line x1={188} y1={40} x2={208} y2={40} stroke="currentColor" strokeWidth={1.5} opacity={0.3} />
      <polygon points="208,35 218,40 208,45" fill="currentColor" opacity={0.3} />
      {/* Result */}
      <rect x={223} y={25} width={47} height={30} rx={4} fill="#10b981" opacity={0.2} stroke="#10b981" strokeWidth={1} />
      <text x={246} y={44} textAnchor="middle" fontSize={9} fill="#10b981" fontWeight="bold">score</text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function PositionApproaches() {
  const [selectedIdx, setSelectedIdx] = useState(3); // Default to RoPE

  const handleReset = useCallback(() => setSelectedIdx(3), []);

  const approach = APPROACHES[selectedIdx];

  return (
    <WidgetContainer
      title="Position Encoding Approaches"
      description="Four ways to tell attention where words are. Click each to learn more."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {APPROACHES.map((a, i) => (
            <button
              key={i}
              onClick={() => setSelectedIdx(i)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                i === selectedIdx
                  ? "bg-accent text-white"
                  : "bg-foreground/5 text-muted hover:bg-foreground/10 hover:text-foreground"
              }`}
            >
              {a.name}
            </button>
          ))}
        </div>

        {/* Detail card */}
        <div className="rounded-lg border border-border bg-surface">
          {/* How it works */}
          <div className="border-b border-border px-4 py-3">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted">
              How it works
            </div>
            <div className="text-sm text-foreground">{approach.how}</div>
          </div>

          {/* Diagram */}
          <div className="flex justify-center border-b border-border px-4 py-3">
            <MiniDiagram kind={approach.kind} />
          </div>

          {/* Pro / Con / Models */}
          <div className="grid grid-cols-1 gap-0 sm:grid-cols-3">
            <div className="border-b border-border px-4 py-2.5 sm:border-b-0 sm:border-r">
              <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400">
                Strength
              </div>
              <div className="text-xs text-foreground">{approach.pro}</div>
            </div>
            <div className="border-b border-border px-4 py-2.5 sm:border-b-0 sm:border-r">
              <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Limitation
              </div>
              <div className="text-xs text-foreground">{approach.con}</div>
            </div>
            <div className="px-4 py-2.5">
              <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                Used by
              </div>
              <div className="text-xs font-medium text-foreground">
                {approach.models}
              </div>
            </div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
