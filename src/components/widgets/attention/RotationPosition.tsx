"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";

const DEG_PER_POS = 15; // degrees per position
const RAD_PER_POS = (Math.PI / 180) * DEG_PER_POS;

function rotateVector(position: number): [number, number] {
  const angle = position * RAD_PER_POS;
  return [Math.cos(angle), Math.sin(angle)];
}

const SAME_GAP_PRESETS = [
  [1, 4],
  [5, 8],
  [10, 13],
];

const DIFF_GAP_PRESETS = [
  [3, 4],
  [3, 6],
  [3, 10],
  [3, 16],
];

export function RotationPosition() {
  const [posA, setPosA] = useState(1);
  const [posB, setPosB] = useState(4);
  const [presetCycleIdx, setPresetCycleIdx] = useState(0);

  const handleReset = useCallback(() => {
    setPosA(1);
    setPosB(4);
    setPresetCycleIdx(0);
  }, []);

  const vecA = useMemo(() => rotateVector(posA), [posA]);
  const vecB = useMemo(() => rotateVector(posB), [posB]);

  const angleA = posA * DEG_PER_POS;
  const angleB = posB * DEG_PER_POS;
  const angleBetween = Math.abs(angleB - angleA);
  const gap = Math.abs(posB - posA);
  const dotProduct = Math.cos(gap * RAD_PER_POS);

  // SVG config
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 100;

  // Convert to SVG coordinates (y-axis flipped)
  const aEndX = cx + vecA[0] * radius;
  const aEndY = cy - vecA[1] * radius;
  const bEndX = cx + vecB[0] * radius;
  const bEndY = cy - vecB[1] * radius;

  // Arc path for the angle between vectors
  const arcRadius = 40;
  const arcStartX = cx + Math.cos(-angleA * (Math.PI / 180)) * arcRadius;
  const arcStartY = cy + Math.sin(-angleA * (Math.PI / 180)) * arcRadius;
  const arcEndX = cx + Math.cos(-angleB * (Math.PI / 180)) * arcRadius;
  const arcEndY = cy + Math.sin(-angleB * (Math.PI / 180)) * arcRadius;
  const largeArc = angleBetween > 180 ? 1 : 0;
  // Sweep direction depends on which angle is larger
  const sweep = angleB > angleA ? 0 : 1;

  const handleSameGap = () => {
    const nextIdx = (presetCycleIdx + 1) % SAME_GAP_PRESETS.length;
    setPresetCycleIdx(nextIdx);
    const [a, b] = SAME_GAP_PRESETS[nextIdx];
    setPosA(a);
    setPosB(b);
  };

  const handleDiffGap = () => {
    const nextIdx = (presetCycleIdx + 1) % DIFF_GAP_PRESETS.length;
    setPresetCycleIdx(nextIdx);
    const [a, b] = DIFF_GAP_PRESETS[nextIdx];
    setPosA(a);
    setPosB(b);
  };

  // Comparison table
  const sameGapRows = SAME_GAP_PRESETS.map(([a, b]) => ({
    a,
    b,
    gap: Math.abs(b - a),
    dot: Math.cos(Math.abs(b - a) * RAD_PER_POS),
  }));

  const diffGapRows = DIFF_GAP_PRESETS.map(([a, b]) => ({
    a,
    b,
    gap: Math.abs(b - a),
    dot: Math.cos(Math.abs(b - a) * RAD_PER_POS),
  }));

  return (
    <WidgetContainer
      title="Rotary Position Encoding"
      description="Rotate embedding vectors by their position and see how dot products capture relative distance"
      onReset={handleReset}
    >
      <div className="flex flex-col gap-4">
        {/* Sliders */}
        <div className="flex flex-col gap-2">
          <SliderControl
            label="Position A"
            value={posA}
            min={1}
            max={20}
            step={1}
            onChange={setPosA}
            formatValue={(v) => String(v)}
          />
          <SliderControl
            label="Position B"
            value={posB}
            min={1}
            max={20}
            step={1}
            onChange={setPosB}
            formatValue={(v) => String(v)}
          />
        </div>

        {/* SVG visualization */}
        <div className="flex justify-center">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="max-w-full"
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
            <circle cx={aEndX} cy={aEndY} r={4} fill="#3b82f6" />
            <text
              x={aEndX + (vecA[0] > 0 ? 10 : -10)}
              y={aEndY + (vecA[1] > 0 ? -8 : 12)}
              textAnchor={vecA[0] > 0 ? "start" : "end"}
              fontSize={12}
              fontWeight="bold"
              fill="#3b82f6"
            >
              A ({posA})
            </text>

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
            <text
              x={bEndX + (vecB[0] > 0 ? 10 : -10)}
              y={bEndY + (vecB[1] > 0 ? -8 : 12)}
              textAnchor={vecB[0] > 0 ? "start" : "end"}
              fontSize={12}
              fontWeight="bold"
              fill="#10b981"
            >
              B ({posB})
            </text>

            {/* Origin dot */}
            <circle cx={cx} cy={cy} r={3} fill="currentColor" opacity={0.3} />
          </svg>
        </div>

        {/* Stats display */}
        <div className="flex justify-center gap-6">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted">
              Gap |B - A|
            </span>
            <span className="font-mono text-lg font-bold text-foreground">
              {gap}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted">
              Angle
            </span>
            <span className="font-mono text-lg font-bold text-amber-500">
              {angleBetween}°
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted">
              Dot Product
            </span>
            <span className="font-mono text-lg font-bold text-accent">
              {dotProduct.toFixed(4)}
            </span>
          </div>
        </div>

        {/* Preset buttons */}
        <div className="flex justify-center gap-2">
          <button
            onClick={handleSameGap}
            className="rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-dark"
          >
            Same gap, different positions
          </button>
          <button
            onClick={handleDiffGap}
            className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
          >
            Same position A, different gaps
          </button>
        </div>

        {/* Comparison tables */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface px-3 py-2">
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
              Same gap (3) = same dot product
            </div>
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="text-[10px] text-muted">
                  <th className="pb-1 pr-2">A</th>
                  <th className="pb-1 pr-2">B</th>
                  <th className="pb-1 pr-2">Gap</th>
                  <th className="pb-1">Dot</th>
                </tr>
              </thead>
              <tbody>
                {sameGapRows.map((row, i) => (
                  <tr key={i} className="text-foreground">
                    <td className="pr-2">{row.a}</td>
                    <td className="pr-2">{row.b}</td>
                    <td className="pr-2">{row.gap}</td>
                    <td className="font-semibold text-accent">
                      {row.dot.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-border bg-surface px-3 py-2">
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
              Different gap = different dot product
            </div>
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="text-[10px] text-muted">
                  <th className="pb-1 pr-2">A</th>
                  <th className="pb-1 pr-2">B</th>
                  <th className="pb-1 pr-2">Gap</th>
                  <th className="pb-1">Dot</th>
                </tr>
              </thead>
              <tbody>
                {diffGapRows.map((row, i) => (
                  <tr key={i} className="text-foreground">
                    <td className="pr-2">{row.a}</td>
                    <td className="pr-2">{row.b}</td>
                    <td className="pr-2">{row.gap}</td>
                    <td className="font-semibold text-accent">
                      {row.dot.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Key insight */}
        <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground">
          Try different absolute positions but keep the gap the same — the dot
          product stays the same! The dot product only depends on{" "}
          <strong>relative distance</strong>, not absolute position. This is
          exactly what we want: &quot;the word 3 positions ago&quot; matters more
          than &quot;the word at position 7.&quot;
        </div>
      </div>
    </WidgetContainer>
  );
}
