"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface ChapterLink {
  label: string;
  href: string;
}

interface BlockInfo {
  id: string;
  tabLabel: string;
  diagramLabel: string;
  description: string;
  chapterLinks: ChapterLink[];
  color: string;
  border: string;
}

const BLOCKS: BlockInfo[] = [
  {
    id: "tokenization",
    tabLabel: "Tokenization",
    diagramLabel: "Tokenizer",
    description:
      "Splits raw text into tokens.\n\n Common words get their own token; rare words are assembled from pieces (e.g. \"unbreakable\" → \"un\", \"break\", \"able\").",
    chapterLinks: [{ label: "Chapter 5: From Words to Meanings", href: "/embeddings" }],
    color: "#e9d5ff",
    border: "#9333ea",
  },
  {
    id: "embedding",
    tabLabel: "Embedding",
    diagramLabel: "Token Embedding",
    description:
      "Converts each token to a vector that represents its meaning.\n\n Similar words end up with similar vectors. Directions in the space also carry meaning — for example, the direction from 'king' to 'queen' is similar to the direction from 'man' to 'woman'.\n\n The mapping from tokens to embedding vectors is learned, just like every other part of the neural network.",
    chapterLinks: [{ label: "Chapter 5: From Words to Meanings", href: "/embeddings" }],
    color: "#d1fae5",
    border: "#059669",
  },
  {
    id: "attention",
    tabLabel: "Attention",
    diagramLabel: "Multi-Head Attention",
    description:
      "Find related words and get information from them.\n\n Each token is mapped to a query vector, a key vector, and a value vector. If another token's key matches this token's query, we pull in that token's value vector. We use softmax applied to the dot product of query and key to determine how much we pull in each value.\n\n A causal mask ensures that a token only pays attention to tokens before it.\n\n This step also includes positional encoding so that it takes account of word position.\n\n There may be multiple attention \"heads\" in one attention block — meaning that we run attention multiple times, using different keys, queries, and values, to model different kinds of word relationships.",
    chapterLinks: [
      { label: "Chapter 7: Paying Attention", href: "/attention" },
      { label: "Chapter 8: Where Am I?", href: "/positions" },
    ],
    color: "#fed7aa",
    border: "#f97316",
  },
  {
    id: "addresidual1",
    tabLabel: "Add Residual",
    diagramLabel: "Add Residual",
    description:
      "This is a simple one. Add the result of the attention block to the embedding we previously had for the token.\n\n This ensures that each layer of the transformer is adding new information to what we already know.",
    chapterLinks: [],
    color: "#fecaca",
    border: "#dc2626",
  },
  {
    id: "layernorm1",
    tabLabel: "Layer Norm",
    diagramLabel: "Layer Norm",
    description:
      "A simple one. Scale the values of the embedding so the average is 0 and the spread is 1.\n\n Without this, the values in the embedding could get really big or really small, which makes the model harder to train.",
    chapterLinks: [],
    color: "#fef08a",
    border: "#ca8a04",
  },
  {
    id: "feedforward",
    tabLabel: "Feed Forward",
    diagramLabel: "Feed-Forward Network",
    description:
      "Do a bit of thinking to process what we learned from the other tokens.\n\n Each transformer layer has its own two-layer neural network which it applies to each token.",
    chapterLinks: [{ label: "Chapter 3: Building a Brain", href: "/neurons" }],
    color: "#bfdbfe",
    border: "#3b82f6",
  },
  {
    id: "addresidual2",
    tabLabel: "Add Residual",
    diagramLabel: "Add Residual",
    description:
      "This is a simple one. Add the result of the feed forward network to the embedding we already had for the token.\n\n This ensures that the feed forward network is computing a modification to what we already knew and doesn't need to worry about having to preserve existing knowledge.\n\n Residuals also make the network easier to train.",
    chapterLinks: [],
    color: "#fecaca",
    border: "#dc2626",
  },
  {
    id: "layernorm2",
    tabLabel: "Layer Norm",
    diagramLabel: "Layer Norm",
    description:
        "A simple one. Scale the values of the embedding so the average is 0 and the spread is 1.\n\n Without this, the values in the embedding could get really big or really small, which makes the model harder to train.\n\n The same as the layer norm applied after attention, except that this one is after the feed forward network.",
    chapterLinks: [],
    color: "#fef08a",
    border: "#ca8a04",
  },
  {
    id: "stacking",
    tabLabel: "× N Layers",
    diagramLabel: "More Transformer Layers",
    description:
      "A typical transformer stacks many transformer layers on top of each other.\n\n Each transformer layer computes a more sophisticated embedding for each token, incorporating more knowledge from other tokens.\n\n State-of-the-art models like GPT-5 don't disclose how many layers they have, but GPT-3 was 96 layers.",
    chapterLinks: [],
    color: "#f3f4f6",
    border: "#9ca3af",
  },
  {
    id: "output",
    tabLabel: "Output",
    diagramLabel: "Next Token Probabilities",
    description:
      "If the transformer is being used for next word prediction, then at the end of the transformer, we identify the likely next token.\n\n The way this works is a lot like how attention works. We compute a query vector from the final token's representation, take the dot product of that query with the embedding of every word in the vocabulary, and then use softmax to get the probability of each possible next token.",
    chapterLinks: [{ label: "Chapter 6: Understanding by Predicting", href: "/next-word-prediction" }],
    color: "#fce7f3",
    border: "#db2777",
  },
];

const TRANSFORMER_BLOCK_IDS = new Set([
  "attention",
  "addresidual1",
  "layernorm1",
  "feedforward",
  "addresidual2",
  "layernorm2",
]);

// ---------------------------------------------------------------------------
// SVG layout
// ---------------------------------------------------------------------------

const W = 420;
const H = 810;
const CX = 230;
const BW = 210;
const BH = 44;
const ARR = "#888";
const RX = 72;

// Y positions bottom-to-top (output near top, text at bottom)
const Y: Record<string, number> = {
  text: 780,
  tokenization: 725,
  embedding: 665,
  // -- transformer block --
  attention: 560,
  addresidual1: 500,
  layernorm1: 440,
  feedforward: 350,
  addresidual2: 290,
  layernorm2: 230,
  // -- end block --
  stacking: 120,
  output: 35,
};

const TB_TOP = Y.layernorm2 - BH / 2 - 18;
const TB_BOT = Y.attention + BH / 2 + 18;

// ---------------------------------------------------------------------------
// SVG primitives
// ---------------------------------------------------------------------------

function DiagramBox({
  id,
  cx,
  cy,
  w,
  h,
  label,
  fill,
  stroke,
  selected,
  onClick,
}: {
  id: string;
  cx: number;
  cy: number;
  w: number;
  h: number;
  label: string;
  fill: string;
  stroke: string;
  selected: boolean;
  onClick: (id: string) => void;
}) {
  return (
    <g onClick={() => onClick(id)} style={{ cursor: "pointer" }}>
      <rect
        x={cx - w / 2}
        y={cy - h / 2}
        width={w}
        height={h}
        rx={8}
        fill={fill}
        stroke={selected ? "#6366f1" : stroke}
        strokeWidth={selected ? 3 : 2}
      />
      {selected && (
        <rect
          x={cx - w / 2 - 4}
          y={cy - h / 2 - 4}
          width={w + 8}
          height={h + 8}
          rx={12}
          fill="none"
          stroke="#6366f1"
          strokeWidth={1.5}
          opacity={0.3}
        />
      )}
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={14}
        fontWeight={600}
        fill="#333"
        className="pointer-events-none select-none"
      >
        {label}
      </text>
    </g>
  );
}

function DiagramArrow({
  x,
  y1,
  y2,
  color = ARR,
}: {
  x: number;
  y1: number;
  y2: number;
  color?: string;
}) {
  const dir = y2 < y1 ? -1 : 1;
  return (
    <g>
      <line x1={x} y1={y1} x2={x} y2={y2} stroke={color} strokeWidth={2} />
      <polygon
        points={`${x},${y2} ${x - 5},${y2 - dir * 8} ${x + 5},${y2 - dir * 8}`}
        fill={color}
      />
    </g>
  );
}

function ResidualPath({
  id,
  fromY,
  toY,
  mainX,
  sideX,
  selected,
  onClick,
}: {
  id: string;
  fromY: number;
  toY: number;
  mainX: number;
  sideX: number;
  selected: boolean;
  onClick: (id: string) => void;
}) {
  const color = "#ef4444";
  const sw = selected ? 3 : 2;
  const boxLeft = mainX - BW / 2;
  const arrowLen = 8;

  return (
    <g onClick={() => onClick(id)} style={{ cursor: "pointer" }}>
      {/* Path: from main line, left, up, then right stopping before the arrowhead */}
      <path
        d={`M ${mainX} ${fromY} L ${sideX} ${fromY} L ${sideX} ${toY} L ${boxLeft - arrowLen} ${toY}`}
        fill="none"
        stroke={color}
        strokeWidth={sw}
      />
      {/* Right-pointing arrowhead, tip touching the left edge of the box */}
      <polygon
        points={`${boxLeft},${toY} ${boxLeft - arrowLen},${toY - 5} ${boxLeft - arrowLen},${toY + 5}`}
        fill={color}
      />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Mobile popup: speech bubble anchored to the selected box.
// ---------------------------------------------------------------------------

function MobilePopup({
  block,
  tabIdx,
  total,
  boxY,
  onPrev,
  onNext,
  onClose,
}: {
  block: BlockInfo;
  tabIdx: number;
  total: number;
  boxY: number;
  onPrev?: () => void;
  onNext?: () => void;
  onClose: () => void;
}) {
  // Box is in the upper half → popup appears below it (arrow on top).
  // Box is in the lower half → popup appears above it (arrow on bottom).
  const popupBelow = boxY < H / 2;
  const anchorYView = popupBelow ? boxY + BH / 2 + 10 : boxY - BH / 2 - 10;
  const anchorPct = (anchorYView / H) * 100;

  return (
    <div
      className={`lg:hidden absolute left-1/2 z-10 w-[min(96%,340px)] -translate-x-1/2 ${
        popupBelow ? "" : "-translate-y-full"
      }`}
      style={{ top: `${anchorPct}%` }}
      role="region"
      aria-label="Block details"
    >
      <div
        className="relative rounded-lg border-2 bg-white p-3 shadow-lg"
        style={{ borderColor: block.border }}
      >
        {/* Pointer triangle */}
        <div
          className={`absolute left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-white ${
            popupBelow ? "-top-[8px] border-l-2 border-t-2" : "-bottom-[8px] border-b-2 border-r-2"
          }`}
          style={{ borderColor: block.border }}
          aria-hidden="true"
        />
        <div className="mb-2 flex items-center justify-between gap-2">
          <span
            className="rounded-md px-2 py-0.5 text-xs font-bold"
            style={{
              backgroundColor: block.color,
              color: block.border,
              border: `1px solid ${block.border}`,
            }}
          >
            {block.diagramLabel}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted">
              {tabIdx + 1} of {total}
            </span>
            <button
              onClick={onClose}
              aria-label="Close"
              className="-mr-1 -mt-1 rounded-md p-1 text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                aria-hidden="true"
                className="block"
              >
                <path
                  d="M3 3 L11 11 M11 3 L3 11"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </button>
          </div>
        </div>
        {block.description.split(/\n\s*\n/).map((para, i) => (
          <p key={i} className="mb-2 text-xs leading-relaxed text-foreground/80 last:mb-0">
            {para}
          </p>
        ))}
        {block.chapterLinks.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {block.chapterLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="font-medium text-accent underline decoration-accent/30 hover:decoration-accent"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between gap-2">
          {onPrev ? (
            <button
              onClick={onPrev}
              className="rounded-md bg-accent px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-accent/90"
            >
              ← Previous
            </button>
          ) : (
            <span />
          )}
          {onNext ? (
            <button
              onClick={onNext}
              className="rounded-md bg-accent px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-accent/90"
            >
              Next Block →
            </button>
          ) : (
            <span />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TransformerBlockDiagram() {
  const [tabId, setTabId] = useState<string>(BLOCKS[0].id);
  // Mobile popup is dismissable via its close icon; reopens whenever a box is clicked.
  const [popupOpen, setPopupOpen] = useState(true);

  const tabIdx = BLOCKS.findIndex((b) => b.id === tabId);
  const block = BLOCKS[tabIdx >= 0 ? tabIdx : 0];

  const handleBoxClick = useCallback((id: string) => {
    setTabId(id);
    setPopupOpen(true);
  }, []);

  // Clicking a residual path selects the corresponding Add Residual block
  const handleResidualClick = useCallback((id: string) => {
    setTabId(id === "res1" ? "addresidual1" : "addresidual2");
    setPopupOpen(true);
  }, []);

  const handleReset = useCallback(() => {
    setTabId(BLOCKS[0].id);
    setPopupOpen(true);
  }, []);

  const advanceTo = useCallback((id: string) => {
    setTabId(id);
    setPopupOpen(true);
  }, []);

  return (
    <WidgetContainer
      title="The Transformer — Component by Component"
      description="Click any box to learn about it, then hit Next Block to continue."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* SVG diagram (with mobile popup overlay anchored to selected box) */}
        <div className="relative mx-auto w-full max-w-[420px] lg:mx-0 lg:shrink-0">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="block w-full"
            style={{ height: "auto" }}
          >
            {/* ── Transformer block background ── */}
            <rect
              x={52}
              y={TB_TOP}
              width={CX + BW / 2 + 16 - 52}
              height={TB_BOT - TB_TOP}
              rx={12}
              fill="var(--color-surface, #f8f8f8)"
              stroke="var(--color-border, #e0e0e0)"
              strokeWidth={1.5}
            />
            <text
              x={36}
              y={(TB_TOP + TB_BOT) / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={20}
              fontWeight={700}
              fill="#bbb"
              className="select-none"
            >
              N×
            </text>
            <text
              x={52}
              y={TB_TOP - 8}
              textAnchor="start"
              fontSize={14}
              fontWeight={600}
              fill="#333"
              className="select-none"
            >
              Transformer Block
            </text>

            {/* ── Arrows (bottom to top) ── */}
            <DiagramArrow x={CX} y1={Y.text - 8} y2={Y.tokenization + BH / 2 + 2} />
            <DiagramArrow x={CX} y1={Y.tokenization - BH / 2 - 2} y2={Y.embedding + BH / 2 + 2} />
            <DiagramArrow x={CX} y1={Y.embedding - BH / 2 - 2} y2={Y.attention + BH / 2 + 2} />
            <DiagramArrow x={CX} y1={Y.attention - BH / 2 - 2} y2={Y.addresidual1 + BH / 2 + 2} />
            <DiagramArrow x={CX} y1={Y.addresidual1 - BH / 2 - 2} y2={Y.layernorm1 + BH / 2 + 2} />
            <DiagramArrow x={CX} y1={Y.layernorm1 - BH / 2 - 2} y2={Y.feedforward + BH / 2 + 2} />
            <DiagramArrow x={CX} y1={Y.feedforward - BH / 2 - 2} y2={Y.addresidual2 + BH / 2 + 2} />
            <DiagramArrow x={CX} y1={Y.addresidual2 - BH / 2 - 2} y2={Y.layernorm2 + BH / 2 + 2} />
            <DiagramArrow x={CX} y1={Y.layernorm2 - BH / 2 - 2} y2={Y.stacking + BH / 2 + 2} />
            <DiagramArrow x={CX} y1={Y.stacking - BH / 2 - 2} y2={Y.output + BH / 2 + 2} />

            {/* ── Boxes ── */}
            {BLOCKS.map((b) => (
              <DiagramBox
                key={b.id}
                id={b.id}
                cx={CX}
                cy={Y[b.id]}
                w={TRANSFORMER_BLOCK_IDS.has(b.id) ? BW : BW - 14}
                h={BH}
                label={b.diagramLabel}
                fill={b.color}
                stroke={b.border}
                selected={tabId === b.id}
                onClick={handleBoxClick}
              />
            ))}

            {/* ── Residual skip connections (rendered after boxes so arrowheads are visible) ── */}
            <ResidualPath
              id="res1"
              fromY={(Y.embedding + Y.attention) / 2}
              toY={Y.addresidual1}
              mainX={CX}
              sideX={RX}
              selected={tabId === "addresidual1"}
              onClick={handleResidualClick}
            />
            <ResidualPath
              id="res2"
              fromY={(Y.layernorm1 + Y.feedforward) / 2}
              toY={Y.addresidual2}
              mainX={CX}
              sideX={RX}
              selected={tabId === "addresidual2"}
              onClick={handleResidualClick}
            />

            {/* ── Input label ── */}
            <text
              x={CX}
              y={Y.text + 6}
              textAnchor="middle"
              fontSize={14}
              fontWeight={600}
              fill="#666"
              className="select-none"
            >
              &quot;The cat sat on the mat&quot;
            </text>
          </svg>

          {/* Mobile-only popup: speech bubble pointing to the selected box */}
          {popupOpen && (
            <MobilePopup
              block={block}
              tabIdx={tabIdx}
              total={BLOCKS.length}
              boxY={Y[block.id]}
              onPrev={tabIdx > 0 ? () => advanceTo(BLOCKS[tabIdx - 1].id) : undefined}
              onNext={tabIdx < BLOCKS.length - 1 ? () => advanceTo(BLOCKS[tabIdx + 1].id) : undefined}
              onClose={() => setPopupOpen(false)}
            />
          )}
        </div>

        {/* Info panel — desktop only */}
        <div className="hidden flex-1 flex-col lg:flex">
          <div className="flex-1 rounded-lg border border-border bg-surface p-5">
            <div className="mb-1 text-sm text-muted">
              {tabIdx + 1} of {BLOCKS.length}
            </div>
            <div
              className="mb-3 inline-block rounded-md px-3 py-1.5 font-bold"
              style={{
                backgroundColor: block.color,
                color: block.border,
                border: `1.5px solid ${block.border}`,
              }}
            >
              {block.diagramLabel}
            </div>
            {block.description.split(/\n\s*\n/).map((para, i) => (
              <p key={i} className="mb-3 text-sm leading-relaxed text-foreground/80">
                {para}
              </p>
            ))}
            {block.chapterLinks.length > 0 && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                {block.chapterLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="font-medium text-accent underline decoration-accent/30 hover:decoration-accent"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-4 flex items-center gap-3">
            {tabIdx > 0 && (
              <button
                onClick={() => {
                  const prev = BLOCKS[tabIdx - 1];
                  if (prev) setTabId(prev.id);
                }}
                className="rounded-lg bg-accent px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-accent/90"
              >
                ← Previous
              </button>
            )}
            {tabIdx < BLOCKS.length - 1 && (
              <button
                onClick={() => {
                  const next = BLOCKS[tabIdx + 1];
                  if (next) setTabId(next.id);
                }}
                className="rounded-lg bg-accent px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-accent/90"
              >
                Next Block →
              </button>
            )}
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
