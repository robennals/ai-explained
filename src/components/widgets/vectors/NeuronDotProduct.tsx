"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";

const SVG_SIZE = 300;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;
const MAX_VAL = 5;
const SCALE = (SVG_SIZE / 2 - 20) / MAX_VAL; // pixels per unit

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function outputColor(v: number): string {
  if (v <= 0.5) {
    const t = v / 0.5;
    const r = Math.round(239 + (160 - 239) * t);
    const g = Math.round(68 + (160 - 68) * t);
    const b = Math.round(68 + (160 - 68) * t);
    return `rgb(${r},${g},${b})`;
  } else {
    const t = (v - 0.5) / 0.5;
    const r = Math.round(160 + (16 - 160) * t);
    const g = Math.round(160 + (185 - 160) * t);
    const b = Math.round(160 + (160 - 160) * t);
    return `rgb(${r},${g},${b})`;
  }
}

// Fixed-width number: always 5 chars (e.g. " 0.70", "-1.23")
function fmt(n: number): string {
  const s = n.toFixed(2);
  return s.length < 5 ? " " + s : s;
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

function fromSvg(sx: number, sy: number, rect: DOMRect): [number, number] {
  const svgX = ((sx - rect.left) / rect.width) * SVG_SIZE;
  const svgY = ((sy - rect.top) / rect.height) * SVG_SIZE;
  return [(svgX - CX) / SCALE, -(svgY - CY) / SCALE];
}

export function NeuronDotProduct() {
  const [w1, setW1] = useState(2.5);
  const [w2, setW2] = useState(1.8);
  const [x1, setX1] = useState(2.0);
  const [x2, setX2] = useState(1.0);
  const [bias, setBias] = useState(-1.0);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragTarget = useRef<"w" | "x" | null>(null);

  const handleReset = useCallback(() => {
    setW1(2.5); setW2(1.8);
    setX1(2.0); setX2(1.0);
    setBias(-1.0);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const [wx, wy] = fromSvg(e.clientX, e.clientY, rect);
    // Find closest vector tip
    const dW = Math.hypot(wx - w1, wy - w2);
    const dX = Math.hypot(wx - x1, wy - x2);
    dragTarget.current = dW < dX ? "w" : "x";
    (e.target as Element).setPointerCapture(e.pointerId);
    // Apply immediately
    const clamp = (v: number) => Math.max(-MAX_VAL, Math.min(MAX_VAL, v));
    if (dragTarget.current === "w") {
      setW1(clamp(wx)); setW2(clamp(wy));
    } else {
      setX1(clamp(wx)); setX2(clamp(wy));
    }
  }, [w1, w2, x1, x2]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragTarget.current) return;
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const [wx, wy] = fromSvg(e.clientX, e.clientY, rect);
    const clamp = (v: number) => Math.max(-MAX_VAL, Math.min(MAX_VAL, v));
    if (dragTarget.current === "w") {
      setW1(clamp(wx)); setW2(clamp(wy));
    } else {
      setX1(clamp(wx)); setX2(clamp(wy));
    }
  }, []);

  const handlePointerUp = useCallback(() => { dragTarget.current = null; }, []);

  const dot = w1 * x1 + w2 * x2;
  const preActivation = dot + bias;
  const output = sigmoid(preActivation);

  // Angle between weight and input vectors
  const magW = Math.sqrt(w1 * w1 + w2 * w2);
  const magX = Math.sqrt(x1 * x1 + x2 * x2);
  const cosTheta = magW > 0 && magX > 0 ? dot / (magW * magX) : 0;
  const theta = Math.acos(Math.max(-1, Math.min(1, cosTheta)));
  const thetaDeg = (theta * 180) / Math.PI;

  // Unit vectors
  const wUnitX = magW > 0 ? w1 / magW : 0;
  const wUnitY = magW > 0 ? w2 / magW : 0;
  const xUnitX = magX > 0 ? x1 / magX : 0;
  const xUnitY = magX > 0 ? x2 / magX : 0;

  // Projection of input onto weight direction
  const projScalar = magW > 0 ? dot / magW : 0;
  const projX = projScalar * wUnitX;
  const projY = projScalar * wUnitY;

  const [wsx, wsy] = toSvg(w1, w2);
  const [xsx, xsy] = toSvg(x1, x2);
  const [psx, psy] = toSvg(projX, projY);
  const [wusx, wusy] = toSvg(wUnitX, wUnitY);
  const [xusx, xusy] = toSvg(xUnitX, xUnitY);

  const outColor = outputColor(output);

  // Neuron diagram layout
  const ND_W = 580;
  const ND_H = 200;
  const ND_IN_X = 45;
  const ND_SUM_X = 200;
  const ND_SUM_Y = 100;
  const ND_ACT_X = 360;
  const ND_ACT_Y = 100;
  const ND_ACT_W = 100;
  const ND_ACT_H = 70;
  const ND_OUT_X = 520;
  const ND_OUT_Y = 100;

  // Sigmoid curve for diagram
  const sigmoidPath = useMemo(() => {
    const pts: string[] = [];
    const pL = ND_ACT_X - ND_ACT_W / 2 + 8;
    const pR = ND_ACT_X + ND_ACT_W / 2 - 8;
    const pT = ND_ACT_Y - ND_ACT_H / 2 + 8;
    const pB = ND_ACT_Y + ND_ACT_H / 2 - 8;
    for (let i = 0; i <= 100; i++) {
      const xv = -10 + 20 * (i / 100);
      const yv = sigmoid(xv);
      pts.push(
        `${i === 0 ? "M" : "L"}${(pL + (i / 100) * (pR - pL)).toFixed(1)},${(pB - yv * (pB - pT)).toFixed(1)}`
      );
    }
    return pts.join(" ");
  }, []);

  // Operating point on sigmoid curve
  const opFrac = Math.max(0, Math.min(1, (preActivation + 10) / 20));
  const ndPL = ND_ACT_X - ND_ACT_W / 2 + 8;
  const ndPR = ND_ACT_X + ND_ACT_W / 2 - 8;
  const ndPT = ND_ACT_Y - ND_ACT_H / 2 + 8;
  const ndPB = ND_ACT_Y + ND_ACT_H / 2 - 8;
  const opSx = ndPL + opFrac * (ndPR - ndPL);
  const opSy = ndPB - output * (ndPB - ndPT);

  // Input nodes for diagram
  const inputNodes = [
    { label: "x₁", y: 30 },
    { label: "x₂", y: 72 },
    { label: null, y: 110 }, // ellipsis
    { label: "xₙ", y: 148 },
  ];

  return (
    <WidgetContainer
      title="A Neuron Is a Dot Product"
      description="The weighted sum is the dot product of inputs and weights"
      onReset={handleReset}
    >
      {/* Neuron diagram matching NeuronFreePlay / NeuronDiagram style */}
      <svg viewBox={`0 0 ${ND_W} ${ND_H}`} className="w-full mb-4" aria-label="Neuron as dot product diagram">
        <defs>
          <marker id="ndp-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca3af" />
          </marker>
        </defs>

        {/* Input nodes */}
        {inputNodes.map((node, i) => {
          if (!node.label) {
            return (
              <text key={i} x={ND_IN_X} y={node.y + 5} textAnchor="middle" className="fill-muted text-[16px]">⋮</text>
            );
          }
          const wLabel = i === 0 ? "w₁" : i === 1 ? "w₂" : "wₙ";
          const midX = (ND_IN_X + 16 + ND_SUM_X - 26) / 2;
          const midY = (node.y + ND_SUM_Y) / 2;
          return (
            <g key={i}>
              <circle cx={ND_IN_X} cy={node.y} r={16} fill="#f0f4ff" stroke="#3b82f6" strokeWidth="1.5" />
              <text x={ND_IN_X} y={node.y + 4} textAnchor="middle" className="fill-accent text-[11px] font-medium">{node.label}</text>
              <line x1={ND_IN_X + 16} y1={node.y} x2={ND_SUM_X - 26} y2={ND_SUM_Y} stroke="#9ca3af" strokeWidth="1.2" markerEnd="url(#ndp-arrow)" />
              <text x={midX} y={midY - 5} textAnchor="middle" className="fill-muted text-[8px] font-mono">{wLabel}</text>
            </g>
          );
        })}

        {/* Sum node — shows w · x */}
        <circle cx={ND_SUM_X} cy={ND_SUM_Y} r={24} fill="#fef9ee" stroke="#f59e0b" strokeWidth="1.5" />
        <text x={ND_SUM_X} y={ND_SUM_Y - 3} textAnchor="middle" className="fill-foreground text-[10px] font-semibold">w · x</text>
        <text x={ND_SUM_X} y={ND_SUM_Y + 10} textAnchor="middle" className="fill-foreground text-[10px] font-semibold">+ bias</text>

        {/* Bias arrow */}
        <line x1={ND_SUM_X} y1={ND_SUM_Y + 38} x2={ND_SUM_X} y2={ND_SUM_Y + 26} stroke="#9ca3af" strokeWidth="1" strokeDasharray="3,2" markerEnd="url(#ndp-arrow)" />
        <text x={ND_SUM_X} y={ND_SUM_Y + 50} textAnchor="middle" className="fill-muted text-[9px]">bias = {bias.toFixed(1)}</text>

        {/* Sum value */}
        <text x={ND_SUM_X} y={ND_SUM_Y - 30} textAnchor="middle" className="fill-warning text-[11px] font-bold font-mono">{preActivation.toFixed(2)}</text>

        {/* Arrow sum → activation */}
        <line x1={ND_SUM_X + 26} y1={ND_SUM_Y} x2={ND_ACT_X - ND_ACT_W / 2 - 4} y2={ND_ACT_Y} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#ndp-arrow)" />

        {/* Activation function box */}
        <rect x={ND_ACT_X - ND_ACT_W / 2} y={ND_ACT_Y - ND_ACT_H / 2} width={ND_ACT_W} height={ND_ACT_H} rx={8} fill="#f0fdf4" stroke="#10b981" strokeWidth="1.5" />
        <text x={ND_ACT_X} y={ND_ACT_Y - ND_ACT_H / 2 - 6} textAnchor="middle" className="fill-success text-[8px] font-semibold uppercase tracking-wider">Activation</text>
        {/* Sigmoid curve */}
        <path d={sigmoidPath} fill="none" stroke="#10b981" strokeWidth="2" />
        {/* Operating point */}
        <line x1={opSx} y1={ndPB} x2={opSx} y2={opSy} stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,2" opacity={0.6} />
        <line x1={ndPL} y1={opSy} x2={opSx} y2={opSy} stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,2" opacity={0.6} />
        <circle cx={opSx} cy={opSy} r={5} fill="#f59e0b" stroke="white" strokeWidth="1.5" />

        {/* Arrow activation → output */}
        <line x1={ND_ACT_X + ND_ACT_W / 2 + 2} y1={ND_ACT_Y} x2={ND_OUT_X - 22} y2={ND_OUT_Y} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#ndp-arrow)" />

        {/* Output node */}
        <text x={ND_OUT_X} y={ND_OUT_Y - 26} textAnchor="middle" className="fill-foreground text-[11px] font-bold">Output</text>
        <circle cx={ND_OUT_X} cy={ND_OUT_Y} r={20} fill={outColor} stroke={outColor} strokeWidth="2" />
        <text x={ND_OUT_X} y={ND_OUT_Y + 5} textAnchor="middle" className="fill-white text-[13px] font-bold font-mono">{output.toFixed(2)}</text>
      </svg>

      <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
        {/* Vector diagram */}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          className="mx-auto w-full max-w-[320px] cursor-crosshair touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Grid */}
          {Array.from({ length: MAX_VAL * 2 + 1 }, (_, i) => i - MAX_VAL).map((t) => (
            <g key={t}>
              <line x1={CX + t * SCALE} y1={0} x2={CX + t * SCALE} y2={SVG_SIZE} stroke="currentColor" strokeOpacity={t === 0 ? 0.12 : 0.05} />
              <line x1={0} y1={CY - t * SCALE} x2={SVG_SIZE} y2={CY - t * SCALE} stroke="currentColor" strokeOpacity={t === 0 ? 0.12 : 0.05} />
            </g>
          ))}

          {/* Angle arc */}
          {magW > 0.05 && magX > 0.05 && (() => {
            const aW = Math.atan2(-w2, w1);
            const aX = Math.atan2(-x2, x1);
            let diff = aW - aX;
            if (diff > Math.PI) diff -= 2 * Math.PI;
            if (diff < -Math.PI) diff += 2 * Math.PI;
            const endAngle = aX + diff;
            const r = 22;
            const sx = CX + r * Math.cos(aX);
            const sy = CY + r * Math.sin(aX);
            const ex = CX + r * Math.cos(endAngle);
            const ey = CY + r * Math.sin(endAngle);
            const large = Math.abs(diff) > Math.PI ? 1 : 0;
            const sweep = diff > 0 ? 1 : 0;
            const midAngle = aX + diff / 2;
            const lr = 34;
            const lx = CX + lr * Math.cos(midAngle);
            const ly = CY + lr * Math.sin(midAngle);
            return (
              <>
                <path
                  d={`M ${sx} ${sy} A ${r} ${r} 0 ${large} ${sweep} ${ex} ${ey}`}
                  fill="none" stroke="#94a3b8" strokeWidth={1.5}
                />
                <text x={lx} y={ly} fontSize={10} fill="#94a3b8" textAnchor="middle" dominantBaseline="central">
                  {thetaDeg.toFixed(0)}°
                </text>
              </>
            );
          })()}

          {/* Unit circle arc connecting both unit vectors */}
          {magW > 0.05 && magX > 0.05 && (() => {
            const r = SCALE; // unit circle radius in SVG pixels
            const aW = Math.atan2(-wUnitY, wUnitX);
            const aX = Math.atan2(-xUnitY, xUnitX);
            let diff = aW - aX;
            if (diff > Math.PI) diff -= 2 * Math.PI;
            if (diff < -Math.PI) diff += 2 * Math.PI;
            const endAngle = aX + diff;
            const sx = CX + r * Math.cos(aX);
            const sy = CY + r * Math.sin(aX);
            const ex = CX + r * Math.cos(endAngle);
            const ey = CY + r * Math.sin(endAngle);
            const large = Math.abs(diff) > Math.PI ? 1 : 0;
            const sweep = diff > 0 ? 1 : 0;
            return (
              <path
                d={`M ${sx} ${sy} A ${r} ${r} 0 ${large} ${sweep} ${ex} ${ey}`}
                fill="none" stroke="currentColor" strokeOpacity={0.12}
                strokeWidth={1} strokeDasharray="3 3"
              />
            );
          })()}

          {/* Dashed line from input tip to projection point */}
          <line
            x1={xsx} y1={xsy}
            x2={psx} y2={psy}
            stroke="currentColor" strokeWidth={1} strokeOpacity={0.2}
            strokeDasharray="3 3"
          />

          {/* Projection vector (green, along weight direction) */}
          {Math.abs(projScalar) > 0.02 && (
            <Arrow fx={CX} fy={CY} tx={psx} ty={psy} color="#22c55e" width={3} />
          )}

          {/* Weight unit vector (dashed) */}
          <line
            x1={CX} y1={CY}
            x2={wusx} y2={wusy}
            stroke="#f59e0b" strokeWidth={1.5}
            strokeDasharray="4 3" strokeOpacity={0.5}
          />

          {/* Input unit vector (dashed) */}
          <line
            x1={CX} y1={CY}
            x2={xusx} y2={xusy}
            stroke="#3b82f6" strokeWidth={1.5}
            strokeDasharray="4 3" strokeOpacity={0.5}
          />

          {/* Weight vector */}
          <Arrow fx={CX} fy={CY} tx={wsx} ty={wsy} color="#f59e0b" width={2.5} label="w" />
          {/* Input vector */}
          <Arrow fx={CX} fy={CY} tx={xsx} ty={xsy} color="#3b82f6" width={2.5} label="x" />

          {/* Drag handles */}
          <circle cx={wsx} cy={wsy} r={8} fill="#f59e0b" fillOpacity={0.2} className="cursor-grab" />
          <circle cx={xsx} cy={xsy} r={8} fill="#3b82f6" fillOpacity={0.2} className="cursor-grab" />
        </svg>

        {/* Bias slider + Computation breakdown */}
        <div className="min-w-[170px] space-y-4">
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Bias</div>
            <SliderControl label="bias" value={bias} min={-10} max={10} step={0.1} onChange={setBias} />
          </div>
          <div className="rounded-lg bg-foreground/[0.03] p-3 space-y-1" style={{ fontVariantNumeric: "tabular-nums" }}>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Vectors</div>
            <div className="font-mono text-xs">
              <span className="text-amber-500">w</span> = ({fmt(w1)}, {fmt(w2)})
            </div>
            <div className="font-mono text-xs">
              <span className="text-blue-500">x</span> = ({fmt(x1)}, {fmt(x2)})
            </div>
          </div>
          <div className="rounded-lg bg-foreground/[0.03] p-3 space-y-1.5" style={{ fontVariantNumeric: "tabular-nums" }}>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Computation</div>
            <div className="font-mono text-xs whitespace-pre">
              <span className="text-amber-500">w</span> · <span className="text-blue-500">x</span> = ({fmt(w1)}×{fmt(x1)}) + ({fmt(w2)}×{fmt(x2)})
            </div>
            <div className="font-mono text-xs text-accent whitespace-pre">
              {"    "}= {fmt(dot)}
            </div>
            <div className="mt-1.5 font-mono text-xs whitespace-pre">
              + bias ({fmt(bias)}) = {fmt(preActivation)}
            </div>
            <div className="mt-1.5 border-t border-foreground/10 pt-1.5 font-mono text-xs whitespace-pre">
              sigmoid({fmt(preActivation)}) = <span className="font-bold" style={{ color: outColor }}>{output.toFixed(3)}</span>
            </div>
          </div>

          <div className="rounded-lg bg-foreground/[0.03] p-3 space-y-1" style={{ fontVariantNumeric: "tabular-nums" }}>
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
