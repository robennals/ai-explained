"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";
import { VectorCard } from "../vectors/VectorCard";

function rotateVector(position: number, degPerPos: number): [number, number] {
  const angle = position * degPerPos * (Math.PI / 180);
  return [Math.cos(angle), Math.sin(angle)];
}

// 24 words of a sample sentence — placed one word per position around the circle.
const SENTENCE = [
  "The", "dog", "ran", "fast", "and", "the",
  "small", "girl", "saw", "it", "dash", "past",
  "her", "on", "the", "road", "near", "the",
  "old", "red", "barn", "at", "dawn", "today",
];

export function RotationPosition() {
  const [posA, setPosA] = useState(1);
  const [posB, setPosB] = useState(4);
  const [degPerPos, setDegPerPos] = useState(15);

  // Max gap: the position gap where dot product reaches -1 (180°)
  const maxGap = Math.floor(180 / degPerPos);
  // Max position on circle: just before wrapping back to 0° (360°)
  const maxPosOnCircle = Math.ceil(360 / degPerPos) - 1;
  // Cap positions to the sentence length so every position has a word
  const sentenceMaxPos = SENTENCE.length - 1;
  const effectiveMaxPos = Math.min(maxPosOnCircle, sentenceMaxPos);
  // B's max depends on A: can go up to A + maxGap, but not past sentence
  const maxPosB = Math.min(posA + maxGap, effectiveMaxPos);
  // A can go anywhere on the sentence (with gap 0, B = A)
  const maxPosA = effectiveMaxPos;
  // Current effective max gap for the gap slider
  const currentMaxGap = Math.min(maxGap, effectiveMaxPos - posA);

  const handleReset = useCallback(() => {
    setPosA(1);
    setPosB(4);
    setDegPerPos(15);
  }, []);

  const radPerPos = (Math.PI / 180) * degPerPos;
  const vecA = useMemo(() => rotateVector(posA, degPerPos), [posA, degPerPos]);
  const vecB = useMemo(() => rotateVector(posB, degPerPos), [posB, degPerPos]);

  // Clamp positions
  const clampedPosA = Math.min(posA, maxPosA);
  const clampedPosB = Math.min(posB, maxPosB);
  const gap = Math.abs(clampedPosB - clampedPosA);

  const angleA = clampedPosA * degPerPos;
  const angleB = clampedPosB * degPerPos;
  const angleBetween = Math.abs(angleB - angleA);
  const dotProduct = Math.cos(gap * radPerPos);

  // SVG config — extra room around the circle so the sentence words extend outward without clipping
  const size = 380;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 110;

  // Convert to SVG coordinates (y-axis flipped)
  const aEndX = cx + vecA[0] * radius;
  const aEndY = cy - vecA[1] * radius;
  const bEndX = cx + vecB[0] * radius;
  const bEndY = cy - vecB[1] * radius;

  // Projection of B onto A: proj = (A·B / A·A) * A
  // Since both are unit vectors, proj = cos(angle_between) * A_unit
  const projScalar = dotProduct; // cos(angle between) since both are unit vectors
  const projX = cx + vecA[0] * projScalar * radius;
  const projY = cy - vecA[1] * projScalar * radius;

  // Right-angle mark at projection point
  const markSize = 8;
  // Perpendicular direction to A (rotated 90°)
  const perpX = -vecA[1];
  const perpY = vecA[0];
  // Right-angle mark corners
  const mark1X = projX + vecA[0] * markSize;
  const mark1Y = projY - vecA[1] * markSize;
  const mark2X = projX + vecA[0] * markSize + perpX * markSize;
  const mark2Y = projY - vecA[1] * markSize - perpY * markSize;
  const mark3X = projX + perpX * markSize;
  const mark3Y = projY - perpY * markSize;

  // Arc path for the angle between vectors
  const arcRadius = 40;
  const arcStartX = cx + Math.cos(-angleA * (Math.PI / 180)) * arcRadius;
  const arcStartY = cy + Math.sin(-angleA * (Math.PI / 180)) * arcRadius;
  const arcEndX = cx + Math.cos(-angleB * (Math.PI / 180)) * arcRadius;
  const arcEndY = cy + Math.sin(-angleB * (Math.PI / 180)) * arcRadius;
  const largeArc = angleBetween > 180 ? 1 : 0;
  // Sweep direction depends on which angle is larger
  const sweep = angleB > angleA ? 0 : 1;

  // Element-wise products for the multiply-and-add display
  const products = [vecA[0] * vecB[0], vecA[1] * vecB[1]];
  const dotViaComponents = products[0] + products[1];

  // Auto-scroll the gap table to center the active row
  const activeRowRef = useRef<HTMLTableRowElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = activeRowRef.current;
    const container = tableContainerRef.current;
    if (!row || !container) return;
    // Scroll so the row is centered in the container
    const rowCenter = row.offsetTop + row.offsetHeight / 2;
    const containerCenter = container.clientHeight / 2;
    const targetScroll = rowCenter - containerCenter;
    const maxScroll = container.scrollHeight - container.clientHeight;
    container.scrollTo({
      top: Math.max(0, Math.min(targetScroll, maxScroll)),
      behavior: "smooth",
    });
  }, [gap]);

  // Drag handling
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef<"A" | "B" | null>(null);

  const angleToPos = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const svgX = ((clientX - rect.left) / rect.width) * size;
    const svgY = ((clientY - rect.top) / rect.height) * size;
    // Convert from SVG coords to math coords (y flipped)
    const dx = svgX - cx;
    const dy = -(svgY - cy);
    const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
    const pos = Math.round(((angleDeg % 360) + 360) % 360 / degPerPos);
    return Math.max(0, Math.min(effectiveMaxPos, pos));
  }, [degPerPos, effectiveMaxPos, cx, cy]);

  const handlePointerDown = useCallback((which: "A" | "B") => (e: React.PointerEvent) => {
    dragging.current = which;
    (e.target as SVGElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const newPos = angleToPos(e.clientX, e.clientY);
    if (newPos === null) return;

    if (dragging.current === "A") {
      const currentGap = posB - posA;
      const newB = newPos + currentGap;
      if (newPos >= 0 && newB >= 0 && newB <= effectiveMaxPos && currentGap <= maxGap) {
        setPosA(newPos);
        setPosB(newB);
      }
    } else {
      const newGap = newPos - posA;
      if (newGap >= 0 && newGap <= maxGap && newPos <= effectiveMaxPos) {
        setPosB(newPos);
      }
    }
  }, [posA, posB, angleToPos, effectiveMaxPos, maxGap]);

  const handlePointerUp = useCallback(() => {
    dragging.current = null;
  }, []);

  // When speed changes, clamp positions to stay in range (and within sentence)
  const handleSpeedChange = useCallback((newSpeed: number) => {
    setDegPerPos(newSpeed);
    const newMaxCircle = Math.ceil(360 / newSpeed) - 1;
    const newEffective = Math.min(newMaxCircle, sentenceMaxPos);
    setPosA((prev) => Math.min(prev, newEffective));
    setPosB((prev) => Math.min(prev, newEffective));
  }, [sentenceMaxPos]);

  return (
    <WidgetContainer
      title="Rotation and Dot Product"
      description="Two pointers on a circle, each rotated by their position — the dot product depends only on the gap"
      onReset={handleReset}
    >
      <div className="flex flex-col gap-4">
        {/* Top row: sliders + dot product on left, gap table on right.
            Below md, the gap table wraps to its own row below the sliders/circle. */}
        <div className="flex flex-col items-start gap-4 md:flex-row md:flex-wrap md:gap-6">
          <div className="flex w-full min-w-0 flex-col gap-4 md:w-auto md:flex-1">
            {/* Sliders */}
            <div className="flex flex-col gap-2">
              <SliderControl
                label="Token A position"
                value={posA}
                min={0}
                max={maxPosA}
                step={1}
                onChange={(v) => {
                  const currentGap = posB - posA;
                  // Keep gap, but clamp B to stay within the sentence
                  const maxA = effectiveMaxPos - currentGap;
                  const clampedA = Math.max(0, Math.min(maxA, v));
                  setPosA(clampedA);
                  setPosB(clampedA + currentGap);
                }}
                formatValue={(v) => SENTENCE[v] ?? String(v)}
              />
              <SliderControl
                label="Gap"
                value={gap}
                min={0}
                max={currentMaxGap}
                step={1}
                onChange={(g) => {
                  const clampedGap = Math.min(g, maxGap);
                  const newB = posA + clampedGap;
                  if (newB <= effectiveMaxPos) {
                    setPosB(newB);
                  } else {
                    // Push A down so B doesn't cross sentence end
                    const newA = effectiveMaxPos - clampedGap;
                    setPosA(Math.max(0, newA));
                    setPosB(Math.max(0, newA) + clampedGap);
                  }
                }}
                formatValue={(v) => String(v)}
              />
              <SliderControl
                label="Speed"
                value={degPerPos}
                min={5}
                max={30}
                step={1}
                onChange={handleSpeedChange}
                formatValue={(v) => `${v}°/pos`}
              />
            </div>

            {/* Dot product — prominent display */}
            <div className="flex items-baseline justify-center gap-3">
              <span className="text-sm font-medium text-muted">A · B =</span>
              <span className="font-mono text-3xl font-bold text-accent">
                {dotViaComponents.toFixed(4)}
              </span>
              <span className="text-sm text-muted">(gap = {gap})</span>
            </div>

            {/* Circle visualization */}
            <div className="flex justify-center">
              <svg
                ref={svgRef}
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="max-w-full shrink-0"
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                style={{ touchAction: "none" }}
              >
                {/* Unit circle */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1}
                  opacity={0.1}
                />

                {/* Sentence words around the circle — each word's baseline points
                    radially outward (in the direction of a clock hand at that position).
                    Font scales with degPerPos: bigger when words are angularly far apart,
                    smaller when slow speeds pack them close together so they'd overlap. */}
                {(() => {
                  const wordFontSize = Math.min(14, Math.max(9, degPerPos));
                  return Array.from({ length: effectiveMaxPos + 1 }, (_, p) => {
                    const word = SENTENCE[p];
                    if (!word) return null;
                    const angleDeg = p * degPerPos;
                    const rad = -(angleDeg * Math.PI) / 180;
                    const tickInner = radius - 3;
                    const tickOuter = radius + 3;
                    const wordAnchorR = radius + 8;
                    const wx = cx + Math.cos(rad) * wordAnchorR;
                    const wy = cy + Math.sin(rad) * wordAnchorR;
                    const isA = p === posA;
                    const isB = p === posB;
                    const isActive = isA || isB;
                    const color = isA ? "#3b82f6" : isB ? "#10b981" : "currentColor";
                    return (
                      <g key={p}>
                        <line
                          x1={cx + Math.cos(rad) * tickInner}
                          y1={cy + Math.sin(rad) * tickInner}
                          x2={cx + Math.cos(rad) * tickOuter}
                          y2={cy + Math.sin(rad) * tickOuter}
                          stroke={isActive ? color : "currentColor"}
                          strokeWidth={isActive ? 1.5 : 0.5}
                          opacity={isActive ? 0.7 : 0.2}
                        />
                        <text
                          x={wx}
                          y={wy}
                          textAnchor="start"
                          dominantBaseline="middle"
                          fontSize={wordFontSize}
                          fill={color}
                          opacity={isActive ? 1 : 0.55}
                          fontWeight={isActive ? "bold" : "normal"}
                          transform={`rotate(${-angleDeg} ${wx} ${wy})`}
                        >
                          {word}
                        </text>
                      </g>
                    );
                  });
                })()}

                {/* Axes */}
                <line
                  x1={cx - radius - 10}
                  y1={cy}
                  x2={cx + radius + 10}
                  y2={cy}
                  stroke="currentColor"
                  strokeWidth={0.5}
                  opacity={0.1}
                />
                <line
                  x1={cx}
                  y1={cy - radius - 10}
                  x2={cx}
                  y2={cy + radius + 10}
                  stroke="currentColor"
                  strokeWidth={0.5}
                  opacity={0.1}
                />

                {/* Projection line from B tip perpendicular to A */}
                {gap > 0 && (
                  <>
                    <line
                      x1={bEndX}
                      y1={bEndY}
                      x2={projX}
                      y2={projY}
                      stroke="#f59e0b"
                      strokeWidth={1.5}
                      strokeDasharray="4 3"
                      opacity={0.6}
                    />
                    {/* Projection point on A */}
                    <circle cx={projX} cy={projY} r={3} fill="#f59e0b" opacity={0.7} />
                    {/* Right-angle mark */}
                    <polyline
                      points={`${mark1X},${mark1Y} ${mark2X},${mark2Y} ${mark3X},${mark3Y}`}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth={1}
                      opacity={0.5}
                    />
                    {/* Projection segment on A (from origin to projection) — shows dot product magnitude */}
                    <line
                      x1={cx}
                      y1={cy}
                      x2={projX}
                      y2={projY}
                      stroke="#f59e0b"
                      strokeWidth={3}
                      opacity={0.25}
                    />
                  </>
                )}

                {/* Arc between vectors */}
                {gap > 0 && (
                  <path
                    d={`M ${arcStartX} ${arcStartY} A ${arcRadius} ${arcRadius} 0 ${largeArc} ${sweep} ${arcEndX} ${arcEndY}`}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    opacity={0.6}
                  />
                )}

                {/* Arc label */}
                {gap > 0 && (
                  <text
                    x={
                      cx +
                      Math.cos(
                        -(((angleA + angleB) / 2) * Math.PI) / 180
                      ) *
                        (arcRadius + 14)
                    }
                    y={
                      cy +
                      Math.sin(
                        -(((angleA + angleB) / 2) * Math.PI) / 180
                      ) *
                        (arcRadius + 14)
                    }
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={11}
                    fill="#f59e0b"
                    fontWeight="bold"
                  >
                    {angleBetween}°
                  </text>
                )}

                <defs>
                  <marker
                    id="arrowA"
                    viewBox="0 0 10 10"
                    refX="10"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
                  </marker>
                  <marker
                    id="arrowB"
                    viewBox="0 0 10 10"
                    refX="10"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                  </marker>
                </defs>

                {/* Vector A */}
                <line
                  x1={cx}
                  y1={cy}
                  x2={aEndX}
                  y2={aEndY}
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  markerEnd="url(#arrowA)"
                />
                <circle cx={aEndX} cy={aEndY} r={4} fill="#3b82f6" />
                {/* Invisible larger hit area for dragging A */}
                <circle
                  cx={aEndX}
                  cy={aEndY}
                  r={14}
                  fill="transparent"
                  cursor="grab"
                  onPointerDown={handlePointerDown("A")}
                />

                {/* Vector B */}
                <line
                  x1={cx}
                  y1={cy}
                  x2={bEndX}
                  y2={bEndY}
                  stroke="#10b981"
                  strokeWidth={2.5}
                  markerEnd="url(#arrowB)"
                />
                <circle cx={bEndX} cy={bEndY} r={4} fill="#10b981" />
                {/* Invisible larger hit area for dragging B */}
                <circle
                  cx={bEndX}
                  cy={bEndY}
                  r={14}
                  fill="transparent"
                  cursor="grab"
                  onPointerDown={handlePointerDown("B")}
                />

                {/* Origin dot */}
                <circle cx={cx} cy={cy} r={3} fill="currentColor" opacity={0.3} />
              </svg>
            </div>
          </div>

          {/* Dot product by gap table — words from the sentence, click to set the gap */}
          <div ref={tableContainerRef} className="rounded-lg border border-border bg-surface shrink-0 max-h-[400px] overflow-y-auto min-w-[240px]">
            <div className="px-3 py-2 border-b border-border sticky top-0 bg-surface z-10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                Dot product for each gap
              </span>
              <div className="text-[10px] text-muted mt-0.5 normal-case">
                from <span className="font-bold text-blue-500">{SENTENCE[posA]}</span> at position {posA}
              </div>
            </div>
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-[10px] uppercase text-muted">
                  <th className="px-3 py-1.5 text-left font-medium">Gap</th>
                  <th className="px-3 py-1.5 text-left font-medium">Word</th>
                  <th className="px-3 py-1.5 text-right font-medium">A · B</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: Math.min(maxGap, effectiveMaxPos - posA) + 1 }, (_, g) => {
                  const targetPos = posA + g;
                  const word = SENTENCE[targetPos];
                  if (word === undefined) return null;
                  const d = Math.cos(g * radPerPos);
                  const isCurrent = g === gap;
                  return (
                    <tr
                      key={g}
                      ref={isCurrent ? activeRowRef : undefined}
                      onClick={() => setPosB(targetPos)}
                      className={`cursor-pointer transition-colors ${
                        isCurrent
                          ? "bg-accent/10 font-bold text-accent"
                          : "text-muted hover:bg-foreground/5"
                      }`}
                    >
                      <td className="px-3 py-0.5">{g}</td>
                      <td className="px-3 py-0.5">{word}</td>
                      <td className="px-3 py-0.5 text-right">{d.toFixed(4)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vector cards + dot product computation */}
        <div className="flex flex-wrap items-start justify-center gap-3">
          <VectorCard
            name={`"${SENTENCE[posA]}" (pos ${posA})`}
            emoji=""
            properties={["x", "y"]}
            values={[vecA[0], vecA[1]]}
            barColor="#3b82f6"
            label="A"
            labelColor="#3b82f6"
            signed
            signedMax={1}
            className="text-xs w-40"
            labelWidth="w-6"
          />
          <VectorCard
            name={`"${SENTENCE[posB]}" (pos ${posB})`}
            emoji=""
            properties={["x", "y"]}
            values={[vecB[0], vecB[1]]}
            barColor="#10b981"
            label="B"
            labelColor="#10b981"
            signed
            signedMax={1}
            className="text-xs w-40"
            labelWidth="w-6"
          />

          {/* Multiply-and-add column */}
          <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] text-xs w-48">
            <div className="py-2 px-3 font-medium border-b border-foreground/10 bg-foreground/[0.02]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                Dot product
              </span>
              <br />
              multiply &amp; add
            </div>
            {["x", "y"].map((dim, i) => (
              <div key={dim} className="flex items-center py-1.5 px-3 border-b border-foreground/5 last:border-b-0 font-mono text-[11px]">
                <span className="text-blue-500">{vecA[i].toFixed(2)}</span>
                <span className="text-muted mx-1">×</span>
                <span className="text-emerald-500">{vecB[i].toFixed(2)}</span>
                <span className="text-muted mx-1">=</span>
                <span className="font-semibold">{products[i].toFixed(2)}</span>
              </div>
            ))}
            <div className="py-2 px-3 border-t-2 border-foreground/10">
              <div className="font-mono text-[11px] text-muted">
                {products[0].toFixed(2)} + {products[1].toFixed(2)}
              </div>
              <div className="font-mono text-base font-bold text-accent mt-0.5">
                = {dotViaComponents.toFixed(4)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
