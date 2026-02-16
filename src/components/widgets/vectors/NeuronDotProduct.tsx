"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";

const SVG_SIZE = 300;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;
const SCALE = 90;

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function Arrow({
  fx, fy, tx, ty, color, width = 2, label,
}: {
  fx: number; fy: number; tx: number; ty: number;
  color: string; width?: number; label?: string;
}) {
  const dx = tx - fx;
  const dy = ty - fy;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 3) return null;
  const angle = Math.atan2(dy, dx);
  const hl = 7;
  const h1x = tx - hl * Math.cos(angle - 0.4);
  const h1y = ty - hl * Math.sin(angle - 0.4);
  const h2x = tx - hl * Math.cos(angle + 0.4);
  const h2y = ty - hl * Math.sin(angle + 0.4);
  return (
    <g>
      <line x1={fx} y1={fy} x2={tx} y2={ty} stroke={color} strokeWidth={width} />
      <polygon points={`${tx},${ty} ${h1x},${h1y} ${h2x},${h2y}`} fill={color} />
      {label && (
        <text x={tx + 8} y={ty - 5} fontSize={12} fill={color} fontWeight={700}>{label}</text>
      )}
    </g>
  );
}

function toSvg(x: number, y: number): [number, number] {
  return [CX + x * SCALE, CY - y * SCALE];
}

export function NeuronDotProduct() {
  const [w1, setW1] = useState(0.8);
  const [w2, setW2] = useState(0.6);
  const [x1, setX1] = useState(0.9);
  const [x2, setX2] = useState(0.4);
  const [bias, setBias] = useState(-0.5);

  const handleReset = useCallback(() => {
    setW1(0.8); setW2(0.6);
    setX1(0.9); setX2(0.4);
    setBias(-0.5);
  }, []);

  const dot = w1 * x1 + w2 * x2;
  const preActivation = dot + bias;
  const output = sigmoid(preActivation);

  // Angle between weight and input vectors
  const magW = Math.sqrt(w1 * w1 + w2 * w2);
  const magX = Math.sqrt(x1 * x1 + x2 * x2);
  const cosTheta = magW > 0 && magX > 0 ? dot / (magW * magX) : 0;
  const theta = Math.acos(Math.max(-1, Math.min(1, cosTheta)));
  const thetaDeg = (theta * 180) / Math.PI;

  const [wsx, wsy] = toSvg(w1, w2);
  const [xsx, xsy] = toSvg(x1, x2);

  // Output color: green when high, red when low
  const outColor = `hsl(${output * 120}, 70%, 45%)`;

  return (
    <WidgetContainer
      title="A Neuron Is a Dot Product"
      description="The weighted sum is the dot product of inputs and weights"
      onReset={handleReset}
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_auto_auto]">
        {/* Vector diagram */}
        <svg viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="mx-auto w-full max-w-[320px]">
          {/* Grid */}
          {[-1, 0, 1].map((t) => (
            <g key={t}>
              <line x1={CX + t * SCALE} y1={0} x2={CX + t * SCALE} y2={SVG_SIZE} stroke="currentColor" strokeOpacity={0.05} />
              <line x1={0} y1={CY - t * SCALE} x2={SVG_SIZE} y2={CY - t * SCALE} stroke="currentColor" strokeOpacity={0.05} />
            </g>
          ))}
          <line x1={0} y1={CY} x2={SVG_SIZE} y2={CY} stroke="currentColor" strokeOpacity={0.12} />
          <line x1={CX} y1={0} x2={CX} y2={SVG_SIZE} stroke="currentColor" strokeOpacity={0.12} />

          {/* Angle arc */}
          {magW > 0.05 && magX > 0.05 && (
            <>
              <path
                d={describeArc(
                  CX, CY, 22,
                  Math.atan2(-x2, x1),
                  Math.atan2(-w2, w1)
                )}
                fill="none" stroke="#94a3b8" strokeWidth={1.5}
              />
              <text
                x={CX + 32 * Math.cos(Math.atan2(-(x2 + w2) / 2, (x1 + w1) / 2))}
                y={CY + 32 * Math.sin(Math.atan2(-(x2 + w2) / 2, (x1 + w1) / 2))}
                fontSize={10} fill="#94a3b8" textAnchor="middle"
              >
                {thetaDeg.toFixed(0)}°
              </text>
            </>
          )}

          {/* Weight vector */}
          <Arrow fx={CX} fy={CY} tx={wsx} ty={wsy} color="#f59e0b" width={2.5} label="w" />
          {/* Input vector */}
          <Arrow fx={CX} fy={CY} tx={xsx} ty={xsy} color="#3b82f6" width={2.5} label="x" />

          {/* Output indicator */}
          <circle cx={SVG_SIZE - 25} cy={25} r={16} fill={outColor} />
          <text x={SVG_SIZE - 25} y={29} textAnchor="middle" fontSize={11} fill="white" fontWeight={700}>
            {output.toFixed(2)}
          </text>
        </svg>

        {/* Sliders */}
        <div className="space-y-3 min-w-[180px]">
          <div className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Weights</div>
          <SliderControl label="w₁" value={w1} min={-1.5} max={1.5} step={0.05} onChange={setW1} />
          <SliderControl label="w₂" value={w2} min={-1.5} max={1.5} step={0.05} onChange={setW2} />
          <div className="mt-3 text-[10px] font-bold uppercase tracking-widest text-blue-500">Inputs</div>
          <SliderControl label="x₁" value={x1} min={-1.5} max={1.5} step={0.05} onChange={setX1} />
          <SliderControl label="x₂" value={x2} min={-1.5} max={1.5} step={0.05} onChange={setX2} />
          <div className="mt-3 text-[10px] font-bold uppercase tracking-widest text-muted">Bias</div>
          <SliderControl label="bias" value={bias} min={-3} max={3} step={0.1} onChange={setBias} />
        </div>

        {/* Computation breakdown */}
        <div className="min-w-[160px]">
          <div className="rounded-lg bg-foreground/[0.03] p-3 space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Computation</div>
            <div className="font-mono text-xs">
              <span className="text-amber-500">w</span> . <span className="text-blue-500">x</span> = {w1.toFixed(2)}x{x1.toFixed(2)} + {w2.toFixed(2)}x{x2.toFixed(2)}
            </div>
            <div className="font-mono text-xs text-accent">
              = {dot.toFixed(3)}
            </div>
            <div className="mt-1.5 font-mono text-xs">
              + bias ({bias.toFixed(1)}) = {preActivation.toFixed(3)}
            </div>
            <div className="mt-1.5 border-t border-foreground/10 pt-1.5 font-mono text-xs">
              sigmoid({preActivation.toFixed(2)}) = <span className="font-bold" style={{ color: outColor }}>{output.toFixed(3)}</span>
            </div>
          </div>

          <div className="mt-3 rounded-lg bg-foreground/[0.03] p-3 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Alignment</div>
            <div className="font-mono text-xs">angle = {thetaDeg.toFixed(0)}°</div>
            <div className="text-xs text-muted mt-1">
              {thetaDeg < 30
                ? "Vectors are well aligned — neuron fires strongly"
                : thetaDeg < 70
                  ? "Partially aligned — moderate output"
                  : thetaDeg < 110
                    ? "Nearly perpendicular — output near 0.5"
                    : "Opposing directions — neuron stays low"}
            </div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}

function describeArc(cx: number, cy: number, r: number, a1: number, a2: number): string {
  let diff = a2 - a1;
  if (diff > Math.PI) diff -= 2 * Math.PI;
  if (diff < -Math.PI) diff += 2 * Math.PI;
  const end = a1 + diff;
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  const large = Math.abs(diff) > Math.PI ? 1 : 0;
  const sweep = diff > 0 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} ${sweep} ${x2} ${y2}`;
}
