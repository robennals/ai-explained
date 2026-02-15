"use client";

import { useState, useMemo, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";

// Network architecture: [input, hidden1, hidden2, output]
const LAYERS = [3, 5, 5, 2];

const SVG_WIDTH = 220;
const SVG_HEIGHT = 260;
const PADDING_X = 30;
const PADDING_Y = 20;

// Bar chart dimensions
const BAR_WIDTH = 200;
const BAR_HEIGHT = 200;
const BAR_PAD = 30;

/** Compute (x, y) position for a node in the network SVG. */
function nodePos(layer: number, index: number): { x: number; y: number } {
  const layerCount = LAYERS.length;
  const nodesInLayer = LAYERS[layer];
  const x =
    PADDING_X +
    (layer / (layerCount - 1)) * (SVG_WIDTH - 2 * PADDING_X);
  const totalHeight = SVG_HEIGHT - 2 * PADDING_Y;
  const spacing = totalHeight / (nodesInLayer + 1);
  const y = PADDING_Y + spacing * (index + 1);
  return { x, y };
}

/** Generate a random dropout mask for hidden layers. */
function generateMask(dropoutRate: number): boolean[][] {
  return LAYERS.map((size, layerIdx) => {
    // Only drop hidden layers (indices 1 and 2)
    if (layerIdx === 0 || layerIdx === LAYERS.length - 1) {
      return Array(size).fill(true);
    }
    return Array.from({ length: size }, () => Math.random() >= dropoutRate);
  });
}

/** Interpolate simulated accuracy values based on dropout rate. */
function computeAccuracies(dropoutRate: number): {
  training: number;
  test: number;
} {
  // Training accuracy decreases roughly linearly with dropout
  const training = Math.max(45, 99 - dropoutRate * 100 * 0.55);

  // Test accuracy peaks around 40% dropout (quadratic shape)
  const deviation = dropoutRate - 0.4;
  const test = Math.max(40, Math.min(95, 85 - deviation * deviation * 220));

  return { training: Math.round(training), test: Math.round(test) };
}

const NODE_RADIUS = 8;

export function DropoutVisualizer() {
  const [dropoutRate, setDropoutRate] = useState(0);
  const [mask, setMask] = useState<boolean[][]>(() => generateMask(0));
  const [step, setStep] = useState(0);

  const handleNextStep = useCallback(() => {
    setMask(generateMask(dropoutRate));
    setStep((s) => s + 1);
  }, [dropoutRate]);

  const handleDropoutChange = useCallback((value: number) => {
    setDropoutRate(value);
    setMask(generateMask(value));
    setStep(0);
  }, []);

  const handleReset = useCallback(() => {
    setDropoutRate(0);
    setMask(generateMask(0));
    setStep(0);
  }, []);

  const { training, test } = useMemo(
    () => computeAccuracies(dropoutRate),
    [dropoutRate],
  );

  // Pre-compute node positions
  const nodes = useMemo(
    () =>
      LAYERS.map((size, li) =>
        Array.from({ length: size }, (_, ni) => nodePos(li, ni)),
      ),
    [],
  );

  // Build connections between adjacent layers
  const connections = useMemo(() => {
    const conns: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      active: boolean;
    }[] = [];
    for (let li = 0; li < LAYERS.length - 1; li++) {
      for (let si = 0; si < LAYERS[li]; si++) {
        for (let di = 0; di < LAYERS[li + 1]; di++) {
          const from = nodes[li][si];
          const to = nodes[li + 1][di];
          const srcActive = mask[li][si];
          const dstActive = mask[li + 1][di];
          conns.push({
            x1: from.x,
            y1: from.y,
            x2: to.x,
            y2: to.y,
            active: srcActive && dstActive,
          });
        }
      }
    }
    return conns;
  }, [nodes, mask]);

  const gap = test > training ? 0 : training - test;
  const gapLabel =
    gap <= 5 ? "Good generalization" : gap >= 20 ? "Overfitting" : "Moderate";
  const gapColor =
    gap <= 5 ? "text-success" : gap >= 20 ? "text-error" : "text-warning";

  return (
    <WidgetContainer
      title="Dropout in Action"
      description="Watch random neurons switch off each training step \u2014 and see how it improves generalization"
      onReset={handleReset}
    >
      <div className="flex flex-col gap-5 sm:flex-row">
        {/* Left panel: Network diagram */}
        <div className="flex flex-col items-center gap-2">
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="w-full max-w-[220px] rounded-lg border border-border bg-surface"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Connections */}
            {connections.map((c, i) => (
              <line
                key={`c-${i}`}
                x1={c.x1}
                y1={c.y1}
                x2={c.x2}
                y2={c.y2}
                stroke="currentColor"
                strokeWidth={c.active ? 0.8 : 0.4}
                opacity={c.active ? 0.25 : 0.04}
              />
            ))}

            {/* Nodes */}
            {LAYERS.map((size, li) =>
              Array.from({ length: size }, (_, ni) => {
                const { x, y } = nodes[li][ni];
                const active = mask[li][ni];
                const isHidden = li > 0 && li < LAYERS.length - 1;
                return (
                  <circle
                    key={`n-${li}-${ni}`}
                    cx={x}
                    cy={y}
                    r={NODE_RADIUS}
                    fill={active ? "var(--color-accent)" : "transparent"}
                    stroke={
                      active ? "var(--color-accent)" : "currentColor"
                    }
                    strokeWidth={active ? 1.5 : 1}
                    strokeDasharray={
                      !active && isHidden ? "3,2" : undefined
                    }
                    opacity={active ? 1 : 0.2}
                  />
                );
              }),
            )}

            {/* Layer labels */}
            {["Input", "Hidden 1", "Hidden 2", "Output"].map(
              (label, li) => {
                const x =
                  PADDING_X +
                  (li / (LAYERS.length - 1)) *
                    (SVG_WIDTH - 2 * PADDING_X);
                return (
                  <text
                    key={label}
                    x={x}
                    y={SVG_HEIGHT - 4}
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize="8"
                    opacity={0.4}
                  >
                    {label}
                  </text>
                );
              },
            )}
          </svg>

          <div className="flex items-center gap-3">
            <button
              onClick={handleNextStep}
              className="rounded-md bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
            >
              Next Step
            </button>
            <span className="font-mono text-xs text-muted">
              Step {step}
            </span>
          </div>
        </div>

        {/* Right panel: Generalization view */}
        <div className="flex flex-1 flex-col items-center gap-2">
          <svg
            viewBox={`0 0 ${BAR_WIDTH} ${BAR_HEIGHT}`}
            className="w-full max-w-[200px] rounded-lg border border-border bg-surface"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Y-axis labels */}
            {[0, 25, 50, 75, 100].map((v) => {
              const y =
                BAR_PAD +
                ((100 - v) / 100) * (BAR_HEIGHT - 2 * BAR_PAD);
              return (
                <g key={v}>
                  <line
                    x1={BAR_PAD}
                    y1={y}
                    x2={BAR_WIDTH - BAR_PAD}
                    y2={y}
                    stroke="currentColor"
                    strokeOpacity={0.07}
                  />
                  <text
                    x={BAR_PAD - 4}
                    y={y + 3}
                    textAnchor="end"
                    fill="currentColor"
                    fontSize="8"
                    opacity={0.4}
                  >
                    {v}%
                  </text>
                </g>
              );
            })}

            {/* Training bar */}
            {(() => {
              const barW = 36;
              const barX = BAR_PAD + 18;
              const maxBarH = BAR_HEIGHT - 2 * BAR_PAD;
              const barH = (training / 100) * maxBarH;
              const barY = BAR_PAD + maxBarH - barH;
              return (
                <g>
                  <rect
                    x={barX}
                    y={barY}
                    width={barW}
                    height={barH}
                    rx={3}
                    fill="var(--color-accent)"
                    opacity={0.7}
                  />
                  <text
                    x={barX + barW / 2}
                    y={barY - 5}
                    textAnchor="middle"
                    fill="var(--color-accent)"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {training}%
                  </text>
                  <text
                    x={barX + barW / 2}
                    y={BAR_HEIGHT - 6}
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize="8"
                    opacity={0.5}
                  >
                    Train
                  </text>
                </g>
              );
            })()}

            {/* Test bar */}
            {(() => {
              const barW = 36;
              const barX = BAR_WIDTH - BAR_PAD - 18 - barW;
              const maxBarH = BAR_HEIGHT - 2 * BAR_PAD;
              const barH = (test / 100) * maxBarH;
              const barY = BAR_PAD + maxBarH - barH;
              return (
                <g>
                  <rect
                    x={barX}
                    y={barY}
                    width={barW}
                    height={barH}
                    rx={3}
                    fill="var(--color-success, #22c55e)"
                    opacity={0.7}
                  />
                  <text
                    x={barX + barW / 2}
                    y={barY - 5}
                    textAnchor="middle"
                    fill="var(--color-success, #22c55e)"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {test}%
                  </text>
                  <text
                    x={barX + barW / 2}
                    y={BAR_HEIGHT - 6}
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize="8"
                    opacity={0.5}
                  >
                    Test
                  </text>
                </g>
              );
            })()}
          </svg>

          <div className={`text-center text-xs font-medium ${gapColor}`}>
            {gapLabel}
            <span className="ml-1 text-muted">
              (gap: {gap}%)
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 rounded-lg bg-surface p-3">
        <SliderControl
          label="Dropout Rate"
          value={dropoutRate}
          min={0}
          max={0.8}
          step={0.05}
          onChange={handleDropoutChange}
          formatValue={(v) => `${Math.round(v * 100)}%`}
        />
      </div>
    </WidgetContainer>
  );
}
