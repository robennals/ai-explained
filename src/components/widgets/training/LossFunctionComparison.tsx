"use client";

import { useState, useCallback, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";

const CHART_WIDTH = 500;
const CHART_HEIGHT = 260;
const MARGIN = { top: 20, right: 20, bottom: 40, left: 50 };
const PLOT_W = CHART_WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;

const NUM_POINTS = 200;
const Y_MAX = 5;

function clamp(p: number): number {
  return Math.max(0.001, Math.min(0.999, p));
}

function mseLoss(p: number): number {
  return (1 - p) * (1 - p);
}

function crossEntropyLoss(p: number): number {
  return -Math.log(clamp(p));
}

function buildCurvePoints(
  lossFn: (p: number) => number,
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= NUM_POINTS; i++) {
    const p = i / NUM_POINTS;
    const clamped = clamp(p);
    const loss = lossFn(clamped);
    points.push({ x: p, y: Math.min(loss, Y_MAX) });
  }
  return points;
}

function toSvgPath(
  points: { x: number; y: number }[],
  plotW: number,
  plotH: number,
): string {
  return points
    .map((pt, i) => {
      const sx = (pt.x / 1) * plotW;
      const sy = plotH - (pt.y / Y_MAX) * plotH;
      return `${i === 0 ? "M" : "L"}${sx.toFixed(2)},${sy.toFixed(2)}`;
    })
    .join(" ");
}

export function LossFunctionComparison() {
  const [confidence, setConfidence] = useState(0.5);

  const handleReset = useCallback(() => {
    setConfidence(0.5);
  }, []);

  const p = clamp(confidence);
  const mse = mseLoss(p);
  const ce = crossEntropyLoss(p);

  const mseCurve = useMemo(() => buildCurvePoints(mseLoss), []);
  const ceCurve = useMemo(() => buildCurvePoints(crossEntropyLoss), []);

  const msePath = useMemo(() => toSvgPath(mseCurve, PLOT_W, PLOT_H), [mseCurve]);
  const cePath = useMemo(() => toSvgPath(ceCurve, PLOT_W, PLOT_H), [ceCurve]);

  const cursorX = (confidence / 1) * PLOT_W;
  const mseCursorY = PLOT_H - (Math.min(mse, Y_MAX) / Y_MAX) * PLOT_H;
  const ceCursorY = PLOT_H - (Math.min(ce, Y_MAX) / Y_MAX) * PLOT_H;

  const yTicks = [0, 1, 2, 3, 4, 5];
  const xTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <WidgetContainer
      title="Loss Function Comparison"
      description="How MSE and cross-entropy measure 'wrongness' differently"
      onReset={handleReset}
    >
      <div className="space-y-5">
        {/* True class label */}
        <div className="rounded-lg bg-surface px-4 py-2.5 text-center text-sm">
          True class: <strong>Cat</strong> — how confident is the model?
        </div>

        {/* Slider */}
        <SliderControl
          label="Confidence"
          value={confidence}
          min={0}
          max={1}
          step={0.01}
          onChange={setConfidence}
          formatValue={(v) => `${(v * 100).toFixed(0)}%`}
        />

        {/* Loss value displays */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
              MSE Loss
            </div>
            <div className="mt-1 font-mono text-2xl font-bold text-blue-600">
              {mse.toFixed(3)}
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-blue-400">
              (1 - {p.toFixed(2)})² = {mse.toFixed(3)}
            </div>
          </div>
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-orange-400">
              Cross-Entropy Loss
            </div>
            <div className="mt-1 font-mono text-2xl font-bold text-orange-600">
              {ce > 6 ? "∞" : ce.toFixed(3)}
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-orange-400">
              -ln({p.toFixed(3)}) = {ce > 6 ? "∞" : ce.toFixed(3)}
            </div>
          </div>
        </div>

        {/* SVG Chart */}
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            className="w-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
              {/* Grid lines */}
              {yTicks.map((tick) => {
                const y = PLOT_H - (tick / Y_MAX) * PLOT_H;
                return (
                  <g key={`y-${tick}`}>
                    <line
                      x1={0}
                      y1={y}
                      x2={PLOT_W}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity={0.07}
                      strokeWidth={1}
                    />
                    <text
                      x={-8}
                      y={y}
                      textAnchor="end"
                      dominantBaseline="middle"
                      className="fill-muted"
                      fontSize={10}
                    >
                      {tick}
                    </text>
                  </g>
                );
              })}

              {/* X-axis ticks */}
              {xTicks.map((tick) => {
                const x = (tick / 1) * PLOT_W;
                return (
                  <g key={`x-${tick}`}>
                    <line
                      x1={x}
                      y1={PLOT_H}
                      x2={x}
                      y2={PLOT_H + 5}
                      stroke="currentColor"
                      strokeOpacity={0.2}
                      strokeWidth={1}
                    />
                    <text
                      x={x}
                      y={PLOT_H + 18}
                      textAnchor="middle"
                      className="fill-muted"
                      fontSize={10}
                    >
                      {`${(tick * 100).toFixed(0)}%`}
                    </text>
                  </g>
                );
              })}

              {/* Axis labels */}
              <text
                x={PLOT_W / 2}
                y={PLOT_H + 34}
                textAnchor="middle"
                className="fill-muted"
                fontSize={11}
                fontWeight={500}
              >
                Confidence (model says &quot;Cat&quot;)
              </text>
              <text
                x={-PLOT_H / 2}
                y={-36}
                textAnchor="middle"
                className="fill-muted"
                fontSize={11}
                fontWeight={500}
                transform="rotate(-90)"
              >
                Loss
              </text>

              {/* Axes */}
              <line
                x1={0}
                y1={0}
                x2={0}
                y2={PLOT_H}
                stroke="currentColor"
                strokeOpacity={0.15}
                strokeWidth={1}
              />
              <line
                x1={0}
                y1={PLOT_H}
                x2={PLOT_W}
                y2={PLOT_H}
                stroke="currentColor"
                strokeOpacity={0.15}
                strokeWidth={1}
              />

              {/* MSE curve */}
              <path
                d={msePath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={2.5}
                strokeLinejoin="round"
              />

              {/* Cross-entropy curve */}
              <path
                d={cePath}
                fill="none"
                stroke="#f97316"
                strokeWidth={2.5}
                strokeLinejoin="round"
              />

              {/* Current position vertical dashed line */}
              <line
                x1={cursorX}
                y1={0}
                x2={cursorX}
                y2={PLOT_H}
                stroke="currentColor"
                strokeOpacity={0.25}
                strokeWidth={1}
                strokeDasharray="4,3"
              />

              {/* Dots at current position */}
              <circle
                cx={cursorX}
                cy={mseCursorY}
                r={5}
                fill="#3b82f6"
                stroke="white"
                strokeWidth={2}
              />
              <circle
                cx={cursorX}
                cy={ceCursorY}
                r={5}
                fill="#f97316"
                stroke="white"
                strokeWidth={2}
              />

              {/* Legend */}
              <g transform={`translate(${PLOT_W - 130}, 4)`}>
                <rect
                  x={-6}
                  y={-4}
                  width={136}
                  height={40}
                  rx={4}
                  fill="white"
                  fillOpacity={0.85}
                  stroke="currentColor"
                  strokeOpacity={0.1}
                />
                <line
                  x1={0}
                  y1={8}
                  x2={20}
                  y2={8}
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                />
                <text x={26} y={12} fontSize={11} className="fill-foreground">
                  MSE
                </text>
                <line
                  x1={0}
                  y1={24}
                  x2={20}
                  y2={24}
                  stroke="#f97316"
                  strokeWidth={2.5}
                />
                <text x={26} y={28} fontSize={11} className="fill-foreground">
                  Cross-Entropy
                </text>
              </g>
            </g>
          </svg>
        </div>

        {/* Insight callout */}
        <div className="rounded-lg bg-accent/5 p-3">
          <p className="text-xs leading-relaxed text-foreground/70">
            <strong>Key insight:</strong> When the model is confidently wrong
            (low confidence for the true class), cross-entropy loss explodes
            while MSE rises only modestly. This harsh penalty is why
            cross-entropy is the standard loss for classification — it
            aggressively punishes confident mistakes, forcing the model to
            take the correct answer seriously.
          </p>
        </div>
      </div>
    </WidgetContainer>
  );
}
