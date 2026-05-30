"use client";

import { useState } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";
import { ANIMAL_DOMAIN, vecDot } from "./vectorData";

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

// red (low) → gray (0.5) → green (high), matching NeuronDotProduct
function outputColor(v: number): string {
  if (v <= 0.5) {
    const t = v / 0.5;
    const r = Math.round(239 + (160 - 239) * t);
    const g = Math.round(68 + (160 - 68) * t);
    const b = Math.round(68 + (160 - 68) * t);
    return `rgb(${r},${g},${b})`;
  }
  const t = (v - 0.5) / 0.5;
  const r = Math.round(160 + (16 - 160) * t);
  const g = Math.round(160 + (185 - 160) * t);
  const b = Math.round(160 + (160 - 160) * t);
  return `rgb(${r},${g},${b})`;
}

// The detector's weight direction. Bear is index 0.
const WEIGHT_IDX = 0;

// x-axis window: real animal bear-likeness lives in ~0.59..1.0, so focus there
// while leaving a little room on the left for the curve's tail.
const X_MIN = 0.3;
const X_MAX = 1.0;

const DEFAULT_MAG = 4;
const DEFAULT_BIAS = -2.8;

// Each preset holds the threshold fixed at ~0.7 (bias = -0.7 × magnitude) and only
// varies the sharpness — so clicking through them pivots the curve around the same
// transition point, from a gentle slope to a hard switch.
const PRESETS: { label: string; mag: number; bias: number }[] = [
  { label: "Wishy-washy", mag: 3, bias: -2.1 },
  { label: "Balanced", mag: 8, bias: -5.6 },
  { label: "Decisive", mag: 18, bias: -12.6 },
];

// SVG geometry
const W = 560;
const H = 300;
const PAD_L = 44;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 40;
const PLOT_L = PAD_L;
const PLOT_R = W - PAD_R;
const PLOT_T = PAD_T;
const PLOT_B = H - PAD_B;

function xPix(v: number): number {
  return PLOT_L + ((v - X_MIN) / (X_MAX - X_MIN)) * (PLOT_R - PLOT_L);
}
function yPix(o: number): number {
  return PLOT_B - o * (PLOT_B - PLOT_T);
}

export function NeuronResponseCurve() {
  const [magnitude, setMagnitude] = useState(DEFAULT_MAG);
  const [bias, setBias] = useState(DEFAULT_BIAS);

  const weight = ANIMAL_DOMAIN.items[WEIGHT_IDX];

  // Each animal's bear-likeness (unit·unit dot) and current neuron output.
  const withOutput = ANIMAL_DOMAIN.items.map((item) => {
    const likeness = vecDot(weight.values, item.values);
    return { ...item, likeness, output: sigmoid(magnitude * likeness + bias) };
  });

  // Sigmoid response curve across the visible window.
  const curvePts: string[] = [];
  for (let i = 0; i <= 200; i++) {
    const v = X_MIN + (X_MAX - X_MIN) * (i / 200);
    const o = sigmoid(magnitude * v + bias);
    curvePts.push(`${i === 0 ? "M" : "L"}${xPix(v).toFixed(1)},${yPix(o).toFixed(1)}`);
  }
  const curvePath = curvePts.join(" ");

  // Threshold: bear-likeness where output crosses 0.5.
  const threshold = magnitude > 0.001 ? -bias / magnitude : Infinity;
  const thresholdInView = threshold >= X_MIN && threshold <= X_MAX;

  const xTicks = [0.4, 0.6, 0.8, 1.0];

  const handleReset = () => {
    setMagnitude(DEFAULT_MAG);
    setBias(DEFAULT_BIAS);
  };

  return (
    <WidgetContainer
      title="Bias Shifts, Magnitude Sharpens"
      description="How the two knobs reshape a neuron's response to its input"
      onReset={handleReset}
    >

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mb-3 w-full select-none"
        aria-label="Neuron output plotted against how bear-like the input is"
      >
        {/* axes */}
        <line x1={PLOT_L} y1={PLOT_T} x2={PLOT_L} y2={PLOT_B} stroke="#9ca3af" strokeWidth="1" />
        <line x1={PLOT_L} y1={PLOT_B} x2={PLOT_R} y2={PLOT_B} stroke="#9ca3af" strokeWidth="1" />

        {/* y ticks: 0, 0.5, 1 */}
        {[0, 0.5, 1].map((o) => (
          <g key={o}>
            <line
              x1={PLOT_L - 4}
              y1={yPix(o)}
              x2={o === 0.5 ? PLOT_R : PLOT_L}
              y2={yPix(o)}
              stroke={o === 0.5 ? "#d1d5db" : "#9ca3af"}
              strokeWidth="1"
              strokeDasharray={o === 0.5 ? "3,3" : undefined}
            />
            <text x={PLOT_L - 8} y={yPix(o) + 4} textAnchor="end" className="fill-muted text-[10px] font-mono">
              {o}
            </text>
          </g>
        ))}
        <text
          x={14}
          y={(PLOT_T + PLOT_B) / 2}
          textAnchor="middle"
          className="fill-muted text-[10px] font-semibold"
          transform={`rotate(-90 14 ${(PLOT_T + PLOT_B) / 2})`}
        >
          neuron output
        </text>

        {/* x ticks */}
        {xTicks.map((v) => (
          <g key={v}>
            <line x1={xPix(v)} y1={PLOT_B} x2={xPix(v)} y2={PLOT_B + 4} stroke="#9ca3af" strokeWidth="1" />
            <text x={xPix(v)} y={PLOT_B + 16} textAnchor="middle" className="fill-muted text-[10px] font-mono">
              {v.toFixed(1)}
            </text>
          </g>
        ))}
        <text x={(PLOT_L + PLOT_R) / 2} y={H - 4} textAnchor="middle" className="fill-muted text-[10px] font-semibold">
          how bear-like the input is →
        </text>

        {/* threshold: where output crosses 0.5 */}
        {thresholdInView ? (
          <g>
            <line
              x1={xPix(threshold)}
              y1={PLOT_T}
              x2={xPix(threshold)}
              y2={PLOT_B}
              stroke="#f59e0b"
              strokeWidth="1.2"
              strokeDasharray="4,3"
              opacity={0.8}
            />
            <text x={xPix(threshold)} y={PLOT_T + 10} textAnchor="middle" className="fill-warning text-[9px] font-semibold">
              decision boundary ({threshold.toFixed(2)})
            </text>
          </g>
        ) : (
          // Boundary has slid off the chart — show which way it went, so the
          // reader can see that magnitude (and bias) drag the boundary around.
          <text
            x={threshold < X_MIN ? PLOT_L + 6 : PLOT_R - 6}
            y={PLOT_T + 10}
            textAnchor={threshold < X_MIN ? "start" : "end"}
            className="fill-warning text-[9px] font-semibold"
          >
            {threshold < X_MIN
              ? `← boundary ${threshold.toFixed(2)} (all fire)`
              : `boundary ${threshold.toFixed(2)} (none fire) →`}
          </text>
        )}

        {/* response curve */}
        <path d={curvePath} fill="none" stroke="#10b981" strokeWidth="2.5" />

        {/* animal markers */}
        {withOutput.map((a) => {
          const cx = xPix(a.likeness);
          const cy = yPix(a.output);
          const isWeight = a.name === weight.name;
          return (
            <g key={a.name}>
              <circle cx={cx} cy={cy} r={isWeight ? 5 : 4} fill={outputColor(a.output)} stroke="white" strokeWidth="1.5" />
              <text x={cx} y={cy - 8} textAnchor="middle" className="text-[13px]">
                {a.emoji}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[10px] font-bold uppercase tracking-widest text-muted">
          Sharpness
        </span>
        {PRESETS.map((preset) => {
          const active =
            Math.abs(magnitude - preset.mag) < 0.05 && Math.abs(bias - preset.bias) < 0.05;
          return (
            <button
              key={preset.label}
              onClick={() => {
                setMagnitude(preset.mag);
                setBias(preset.bias);
              }}
              className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                active
                  ? "bg-accent text-white"
                  : "bg-foreground/5 text-foreground hover:bg-foreground/10"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
        <span className="text-[10px] text-muted">(same threshold, different shapes)</span>
      </div>

      <div className="mb-3 space-y-2">
        <SliderControl
          label="weight magnitude"
          value={magnitude}
          min={0}
          max={20}
          step={0.1}
          onChange={setMagnitude}
        />
        <SliderControl label="bias" value={bias} min={-20} max={5} step={0.1} onChange={setBias} />
      </div>

      {/* per-animal readout, sorted most → least bear-like */}
      <div className="flex flex-wrap gap-1.5">
        {[...withOutput]
          .sort((a, b) => b.likeness - a.likeness)
          .map((a) => (
            <span
              key={a.name}
              className="inline-flex items-center gap-1 rounded-md border border-foreground/10 px-1.5 py-0.5 text-[11px] font-medium"
              style={{ color: outputColor(a.output) }}
              title={`bear-likeness ${a.likeness.toFixed(2)} · output ${a.output.toFixed(2)}`}
            >
              {a.emoji} {a.name}
              <span className="font-mono text-[10px] opacity-80">{a.output.toFixed(2)}</span>
            </span>
          ))}
      </div>
    </WidgetContainer>
  );
}
