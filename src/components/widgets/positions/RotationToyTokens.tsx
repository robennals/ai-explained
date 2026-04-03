"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";
import { VectorCard } from "../vectors/VectorCard";

/* ------------------------------------------------------------------ */
/*  Data — same toy tokens as ALiBiToyTokens                          */
/* ------------------------------------------------------------------ */

interface Token {
  label: string;
  key: number[];
  query: number[];
  color: string;
}

interface Sentence {
  label: string;
  tokens: Token[];
}

const S = 3;

const CAT: Token = {
  label: "cat", key: [S], query: [0],
  color: "text-amber-600 dark:text-amber-400",
};
const DOG: Token = {
  label: "dog", key: [S], query: [0],
  color: "text-blue-600 dark:text-blue-400",
};
const BLA: Token = {
  label: "blah", key: [0], query: [0],
  color: "text-foreground/40",
};
const IT: Token = {
  label: "it", key: [0], query: [S],
  color: "text-purple-600 dark:text-purple-400",
};

const SENTENCES: Sentence[] = [
  { label: "dog blah blah blah cat blah it", tokens: [DOG, BLA, BLA, BLA, CAT, BLA, IT] },
  { label: "cat blah blah blah dog blah it", tokens: [CAT, BLA, BLA, BLA, DOG, BLA, IT] },
  { label: "dog blah cat blah it", tokens: [DOG, BLA, CAT, BLA, IT] },
  { label: "cat blah blah blah blah dog blah blah it", tokens: [CAT, BLA, BLA, BLA, BLA, DOG, BLA, BLA, IT] },
];

/* ------------------------------------------------------------------ */
/*  Math                                                              */
/* ------------------------------------------------------------------ */

function rotateScalar(value: number, angleDeg: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [value * Math.cos(rad), value * Math.sin(rad)];
}

function dot2(a: [number, number], b: [number, number]): number {
  return a[0] * b[0] + a[1] * b[1];
}

function softmax(scores: number[]): number[] {
  const max = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

/* ------------------------------------------------------------------ */
/*  Formatting                                                        */
/* ------------------------------------------------------------------ */

function pct(n: number): string {
  if (n > 0.995) return "100%";
  if (n < 0.005) return "≈0%";
  return `${(n * 100).toFixed(1)}%`;
}

/* ------------------------------------------------------------------ */
/*  Arrow helpers                                                     */
/* ------------------------------------------------------------------ */

const HIGHLIGHT_HUE = 30; // amber hue to distinguish from ALiBi's blue

function weightToStroke(w: number): string {
  const alpha = 0.3 + w * 0.55;
  return `hsla(${HIGHLIGHT_HUE}, 75%, 50%, ${alpha})`;
}

function weightToPill(w: number): string {
  const alpha = 0.3 + w * 0.7;
  return `hsla(${HIGHLIGHT_HUE}, 80%, 45%, ${alpha})`;
}

interface Arrow {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  weight: number;
}

/* ------------------------------------------------------------------ */
/*  Mini rotation circle                                               */
/* ------------------------------------------------------------------ */

function RotationCircle({
  vecA,
  vecB,
  angleBetween,
  colorA,
  colorB,
  labelA,
  labelB,
}: {
  vecA: [number, number];
  vecB: [number, number];
  angleBetween: number;
  colorA: string;
  colorB: string;
  labelA: string;
  labelB: string;
}) {
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = 55;

  // Scale vectors to fit the circle, preserving relative lengths
  const lenA = Math.sqrt(vecA[0] * vecA[0] + vecA[1] * vecA[1]);
  const lenB = Math.sqrt(vecB[0] * vecB[0] + vecB[1] * vecB[1]);
  const maxLen = Math.max(lenA, lenB, 0.001);
  const scaleA = lenA / maxLen;
  const scaleB = lenB / maxLen;
  const dirA: [number, number] = lenA > 0 ? [vecA[0] / lenA, vecA[1] / lenA] : [1, 0];
  const dirB: [number, number] = lenB > 0 ? [vecB[0] / lenB, vecB[1] / lenB] : [1, 0];

  const aEndX = cx + dirA[0] * r * scaleA;
  const aEndY = cy - dirA[1] * r * scaleA;
  const bEndX = cx + dirB[0] * r * scaleB;
  const bEndY = cy - dirB[1] * r * scaleB;

  const bothNonZero = lenA > 0.01 && lenB > 0.01;

  // Arc between vectors (only when both are non-zero)
  const arcR = 25;
  const angleA_rad = Math.atan2(dirA[1], dirA[0]);
  const angleB_rad = Math.atan2(dirB[1], dirB[0]);
  const arcStartX = cx + Math.cos(-angleA_rad) * arcR;
  const arcStartY = cy + Math.sin(-angleA_rad) * arcR;
  const arcEndX = cx + Math.cos(-angleB_rad) * arcR;
  const arcEndY = cy + Math.sin(-angleB_rad) * arcR;
  const absDiff = Math.abs(angleBetween);
  const largeArc = absDiff > 180 ? 1 : 0;
  const sweep = angleBetween >= 0 ? 0 : 1;

  const dotProduct = dot2(vecA, vecB);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        {/* Unit circle */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={1} opacity={0.1} />

        {/* Arc — only when both vectors are non-zero */}
        {bothNonZero && absDiff > 0.5 && (
          <>
            <path
              d={`M ${arcStartX} ${arcStartY} A ${arcR} ${arcR} 0 ${largeArc} ${sweep} ${arcEndX} ${arcEndY}`}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={2}
              opacity={0.6}
            />
            <text
              x={cx + Math.cos(-(angleA_rad + angleB_rad) / 2) * (arcR + 12)}
              y={cy + Math.sin(-(angleA_rad + angleB_rad) / 2) * (arcR + 12)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={10}
              fill="#f59e0b"
              fontWeight="bold"
            >
              {Math.round(absDiff)}°
            </text>
          </>
        )}

        <defs>
          <marker id="rot-mini-a" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={colorA} />
          </marker>
          <marker id="rot-mini-b" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={colorB} />
          </marker>
        </defs>

        {/* Vector A */}
        <line x1={cx} y1={cy} x2={aEndX} y2={aEndY} stroke={colorA} strokeWidth={2.5} markerEnd={scaleA > 0.05 ? "url(#rot-mini-a)" : undefined} />
        {scaleA < 0.05 && <circle cx={cx} cy={cy} r={4} fill={colorA} opacity={0.5} />}
        <text
          x={scaleA > 0.05 ? cx + dirA[0] * (r * scaleA + 14) : cx + 14}
          y={scaleA > 0.05 ? cy - dirA[1] * (r * scaleA + 14) : cy - 14}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={10}
          fontWeight="bold"
          fill={colorA}
        >
          {labelA}
        </text>

        {/* Vector B */}
        <line x1={cx} y1={cy} x2={bEndX} y2={bEndY} stroke={colorB} strokeWidth={2.5} markerEnd={scaleB > 0.05 ? "url(#rot-mini-b)" : undefined} />
        {scaleB < 0.05 && <circle cx={cx} cy={cy} r={4} fill={colorB} opacity={0.5} />}
        <text
          x={scaleB > 0.05 ? cx + dirB[0] * (r * scaleB + 14) : cx - 14}
          y={scaleB > 0.05 ? cy - dirB[1] * (r * scaleB + 14) : cy + 14}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={10}
          fontWeight="bold"
          fill={colorB}
        >
          {labelB}
        </text>

        {/* Origin */}
        <circle cx={cx} cy={cy} r={2} fill="currentColor" opacity={0.3} />
      </svg>
      <div className="text-center">
        <span className="text-[10px] text-muted">dot product = </span>
        <span className="font-mono text-sm font-bold text-accent">{dotProduct.toFixed(2)}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function RotationToyTokens() {
  const [sentIdx, setSentIdx] = useState(0);
  const [degPerPos, setDegPerPos] = useState(15);
  const [selectedToken, setSelectedToken] = useState<number | null>(null);
  const [arrows, setArrows] = useState<Arrow[]>([]);

  const rowRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<number, HTMLElement>>(new Map());

  const sentence = SENTENCES[sentIdx];
  const tokens = sentence.tokens;
  const itIdx = tokens.length - 1;

  // Find the default selected token (first noun) when sentence changes
  const firstNounIdx = useMemo(() => {
    return tokens.findIndex((t) => t.label === "dog" || t.label === "cat");
  }, [tokens]);

  // Use explicit selection, or default to first noun
  const activeSelection = selectedToken !== null && selectedToken < tokens.length
    ? selectedToken
    : firstNounIdx;

  const isNoun = (t: Token) => t.label === "cat" || t.label === "dog";
  const isClickable = (t: Token) => t.label !== "it";

  const handleReset = useCallback(() => {
    setSentIdx(0);
    setDegPerPos(15);
    setSelectedToken(null);
  }, []);

  const handleSentenceChange = (idx: number) => {
    setSentIdx(idx);
    setSelectedToken(null); // reset to default for new sentence
  };

  // Compute rotated dot products and attention weights
  const itQuery = rotateScalar(tokens[itIdx].query[0], itIdx * degPerPos);
  const rawScores = tokens.map((t, i) => {
    const rotatedKey = rotateScalar(t.key[0], i * degPerPos);
    return dot2(itQuery, rotatedKey);
  });
  const weights = softmax(rawScores);

  // Rotated vectors for the detail view
  const itRotated = itQuery;
  const selectedRotated = activeSelection >= 0
    ? rotateScalar(tokens[activeSelection].key[0], activeSelection * degPerPos)
    : null;

  const angleBetween = activeSelection >= 0
    ? (itIdx - activeSelection) * degPerPos
    : 0;

  // Measure card positions and compute arrows
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const row = rowRef.current;
      if (!row) return;
      const rowRect = row.getBoundingClientRect();
      const fromEl = cardRefs.current.get(itIdx);
      if (!fromEl) { setArrows([]); return; }

      const fromRect = fromEl.getBoundingClientRect();
      const fromX = fromRect.left + fromRect.width / 2 - rowRect.left;
      const fromY = fromRect.top - rowRect.top;

      const newArrows: Arrow[] = [];
      for (let i = 0; i < tokens.length; i++) {
        if (i === itIdx) continue;
        const w = weights[i];
        if (w < 0.01) continue;
        const toEl = cardRefs.current.get(i);
        if (!toEl) continue;
        const toRect = toEl.getBoundingClientRect();
        newArrows.push({
          fromX, fromY,
          toX: toRect.left + toRect.width / 2 - rowRect.left,
          toY: toRect.top - rowRect.top,
          weight: w,
        });
      }
      setArrows(newArrows);
    });

    return () => cancelAnimationFrame(raf);
  }, [itIdx, weights, sentIdx, tokens]);

  const arcPad = 50;

  // Colors for the detail view
  const itColor = "#9333ea"; // purple
  const selectedColor = activeSelection >= 0
    ? tokens[activeSelection].label === "dog"
      ? "#2563eb" // blue
      : tokens[activeSelection].label === "cat"
      ? "#d97706" // amber
      : "#6b7280" // gray for bla
    : "#6b7280";

  return (
    <WidgetContainer
      title="Rotation Applied to a Dimension"
      description="One dimension gets split into x/y and rotated by position. Click a noun to inspect its rotated vector."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-5">
        {/* Sentence selector */}
        <div className="flex flex-wrap gap-1.5">
          {SENTENCES.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSentenceChange(i)}
              className={`rounded-full px-3 py-1 font-mono text-xs font-medium transition-colors ${
                i === sentIdx
                  ? "bg-accent text-white"
                  : "bg-foreground/5 text-muted hover:bg-foreground/10 hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Rotation speed slider */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/30">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Rotation speed (degrees per position)
          </div>
          <SliderControl
            label=""
            value={degPerPos}
            min={0}
            max={25}
            step={1}
            onChange={setDegPerPos}
            formatValue={(v) => `${v}°`}
          />
          <div className="mt-1 text-[11px] text-amber-700/70 dark:text-amber-400/70">
            {degPerPos === 0
              ? "No rotation — attention is position-blind. Both nouns get equal scores."
              : `Each position rotates by ${degPerPos}°. Nearby keys stay more aligned with the query.`}
          </div>
        </div>

        {/* Token row with arrow overlay */}
        <div className="overflow-x-auto">
          <div className="relative inline-flex min-w-full justify-center" ref={rowRef}>
            {/* SVG overlay for curved arrows */}
            {arrows.length > 0 && (
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                style={{ zIndex: 10 }}
              >
                <defs>
                  <marker
                    id="rotation-arrowhead"
                    markerWidth="6"
                    markerHeight="5"
                    refX="5"
                    refY="2.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 6 2.5, 0 5"
                      fill={`hsla(${HIGHLIGHT_HUE}, 75%, 50%, 0.7)`}
                    />
                  </marker>
                </defs>
                {arrows.map((a, i) => {
                  const dx = Math.abs(a.toX - a.fromX);
                  const arcHeight = Math.min(arcPad + dx * 0.1, 80);
                  const midX = (a.fromX + a.toX) / 2;
                  const midY = Math.min(a.fromY, a.toY) - arcHeight;
                  const strokeWidth = 1.5 + a.weight * 1.5;
                  return (
                    <path
                      key={i}
                      d={`M ${a.fromX} ${a.fromY} Q ${midX} ${midY} ${a.toX} ${a.toY}`}
                      fill="none"
                      stroke={weightToStroke(a.weight)}
                      strokeWidth={strokeWidth}
                      markerEnd="url(#rotation-arrowhead)"
                      className="transition-all duration-300"
                    />
                  );
                })}
              </svg>
            )}

            {/* Token cards */}
            <div className="flex justify-center gap-1.5" style={{ paddingTop: `${arcPad + 8}px` }}>
            {tokens.map((tok, i) => {
              const isIt = i === itIdx;
              const isActive = i === activeSelection;
              const weight = weights[i];
              const isTarget = weight > 0.01 && !isIt;
              const angleDiff = Math.abs((itIdx - i) * degPerPos);
              const clickable = isClickable(tok);

              return (
                <div key={`${sentIdx}-${i}`} className="flex flex-col items-center" style={{ width: 56 }}>
                  {/* Token label */}
                  <div
                    ref={(el) => {
                      if (el) cardRefs.current.set(i, el);
                      else cardRefs.current.delete(i);
                    }}
                    role={clickable ? "button" : undefined}
                    tabIndex={clickable ? 0 : undefined}
                    onClick={clickable ? () => setSelectedToken(i) : undefined}
                    onKeyDown={clickable ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedToken(i);
                      }
                    } : undefined}
                    className={`rounded-md border px-2 py-1 ${
                      isIt
                        ? "ring-2 ring-accent ring-offset-1 border-border bg-surface"
                        : isActive
                        ? "ring-2 ring-amber-500 ring-offset-1 border-border bg-surface"
                        : clickable
                        ? "border-border bg-surface cursor-pointer hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                        : "border-border bg-surface"
                    }`}
                  >
                    <span className={`text-sm font-bold ${tok.color}`}>{tok.label}</span>
                  </div>

                  {/* Compact info below the token */}
                  <div className="mt-1 flex flex-col items-center gap-0.5">
                    {isIt ? (
                      <span className="text-[9px] font-bold text-accent uppercase">query</span>
                    ) : (
                      <>
                        <span className="text-[9px] text-muted">
                          rot {(i * degPerPos)}°
                        </span>
                        {degPerPos > 0 && isNoun(tok) && (
                          <span className="text-[9px] text-amber-600 dark:text-amber-400">
                            Δ{angleDiff}°
                          </span>
                        )}
                      </>
                    )}
                    {/* Attention weight pill */}
                    {isTarget ? (
                      <span
                        className="rounded-full px-1.5 py-0.5 font-mono text-[9px] font-bold text-white"
                        style={{ backgroundColor: weightToPill(weight) }}
                      >
                        {pct(weight)}
                      </span>
                    ) : (
                      <span className={`font-mono text-[9px] font-bold ${isIt ? "text-accent" : "text-muted"}`}>
                        {pct(weight)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </div>

        {/* Detail view: vector cards + rotation circle */}
        {activeSelection >= 0 && selectedRotated && (
          <div className="rounded-lg border border-border bg-surface/50 p-4">
            <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted">
              Rotated vectors — &ldquo;{tokens[activeSelection].label}&rdquo; key vs &ldquo;it&rdquo; query
            </div>
            <div className="flex flex-wrap items-start justify-center gap-4">
              <VectorCard
                name={`"${tokens[activeSelection].label}" at pos ${activeSelection}`}
                emoji=""
                properties={["noun-x", "noun-y"]}
                values={[selectedRotated[0], selectedRotated[1]]}
                barColor={selectedColor}
                label="key"
                labelColor={selectedColor}
                signed
                signedMax={S}
                className="text-xs w-40"
                labelWidth="w-12"
              />

              <RotationCircle
                vecA={selectedRotated}
                vecB={itRotated}
                angleBetween={-angleBetween}
                colorA={selectedColor}
                colorB={itColor}
                labelA={tokens[activeSelection].label}
                labelB="it"
              />

              <VectorCard
                name={`"it" at pos ${itIdx}`}
                emoji=""
                properties={["noun-x", "noun-y"]}
                values={[itRotated[0], itRotated[1]]}
                barColor={itColor}
                label="query"
                labelColor={itColor}
                signed
                signedMax={S}
                className="text-xs w-40"
                labelWidth="w-12"
              />
            </div>
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}
