"use client";

import { useState, useCallback, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";
import { SliderControl } from "../shared/SliderControl";
import { VectorCard } from "./VectorCard";
import { ANIMAL_DOMAIN } from "./vectorData";

// --- 2D Space tab ---

const SVG_SIZE = 280;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;
const UNIT_R = 55; // pixels per unit — unit circle is small so scaled vectors have room

function Arrow({
  fx, fy, tx, ty, color, width = 2.5,
}: {
  fx: number; fy: number; tx: number; ty: number;
  color: string; width?: number;
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
    </g>
  );
}

function TwoDTab() {
  const [angle, setAngle] = useState(0.6);
  const [magnitude, setMagnitude] = useState(2.0);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const fx = ux * magnitude;
  const fy = uy * magnitude;

  const unitTipX = CX + ux * UNIT_R;
  const unitTipY = CY - uy * UNIT_R;
  const fullTipX = CX + fx * UNIT_R;
  const fullTipY = CY - fy * UNIT_R;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * SVG_SIZE;
    const my = ((e.clientY - rect.top) / rect.height) * SVG_SIZE;
    setAngle(Math.atan2(-(my - CY), mx - CX));
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * SVG_SIZE;
    const my = ((e.clientY - rect.top) / rect.height) * SVG_SIZE;
    setAngle(Math.atan2(-(my - CY), mx - CX));
  }, []);

  const handlePointerUp = useCallback(() => { dragging.current = false; }, []);

  return (
    <>
      <p className="text-sm text-muted mb-3">
        The blue arrow is a <strong>unit vector</strong> — it always sits on the circle, because its length is always 1. The orange arrow is the same direction, scaled by the magnitude. Drag the blue arrow to change direction; use the slider to change magnitude.
      </p>
      <div className="grid gap-4 sm:grid-cols-[auto_1fr] items-start">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          className="mx-auto w-full max-w-[280px] cursor-crosshair touch-none select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Axes */}
          <line x1={0} y1={CY} x2={SVG_SIZE} y2={CY} stroke="currentColor" strokeOpacity={0.08} />
          <line x1={CX} y1={0} x2={CX} y2={SVG_SIZE} stroke="currentColor" strokeOpacity={0.08} />
          {/* Unit circle */}
          <circle cx={CX} cy={CY} r={UNIT_R} fill="none" stroke="#3b82f6" strokeOpacity={0.15} strokeWidth={1.5} strokeDasharray="4,3" />
          <text x={CX + UNIT_R + 4} y={CY - 4} fontSize={9} fill="#3b82f6" opacity={0.5}>1</text>
          {/* Full vector (draw first so unit is on top) */}
          <Arrow fx={CX} fy={CY} tx={fullTipX} ty={fullTipY} color="#f59e0b" width={2.5} />
          <text x={fullTipX + 8} y={fullTipY - 5} fontSize={11} fill="#f59e0b" fontWeight={700}>
            {magnitude.toFixed(1)} × unit
          </text>
          {/* Unit vector */}
          <Arrow fx={CX} fy={CY} tx={unitTipX} ty={unitTipY} color="#3b82f6" width={2.5} />
          <text x={unitTipX + 8} y={unitTipY - 5} fontSize={10} fill="#3b82f6" fontWeight={700}>unit vector</text>
          <circle cx={unitTipX} cy={unitTipY} r={10} fill="#3b82f6" fillOpacity={0.15} className="cursor-grab" />
        </svg>

        <div className="space-y-3">
          <SliderControl label="magnitude" value={magnitude} min={0.1} max={3} step={0.1} onChange={setMagnitude} />
          <div className="flex gap-2">
            <VectorCard
              name="" emoji=""
              properties={["x", "y"]}
              values={[ux, uy]}
              barColor="#3b82f6"
              label="unit vector" labelColor="#3b82f6"
              className="flex-1 min-w-0"
              signed signedMax={1} animate={false}
            />
            <VectorCard
              name="" emoji=""
              properties={["x", "y"]}
              values={[fx, fy]}
              barColor="#f59e0b"
              label={`× ${magnitude.toFixed(1)}`} labelColor="#f59e0b"
              className="flex-1 min-w-0"
              signed signedMax={3} animate={false}
            />
          </div>
          <div className="rounded-lg bg-foreground/[0.03] p-3 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Scaling math</div>
            {["x", "y"].map((dim, i) => {
              const uv = i === 0 ? ux : uy;
              const fv = i === 0 ? fx : fy;
              return (
                <div key={dim} className="font-mono text-sm">
                  <span className="text-muted">{dim}:</span>{" "}
                  <span className="text-blue-500">{uv.toFixed(2)}</span>
                  {" × "}
                  <span className="text-amber-500">{magnitude.toFixed(1)}</span>
                  {" = "}
                  <span className="font-semibold">{fv.toFixed(2)}</span>
                </div>
              );
            })}
            <div className="border-t border-foreground/10 pt-1 mt-1">
              <div className="font-mono text-[10px] text-muted">
                unit length: {ux.toFixed(2)}² + {uy.toFixed(2)}² = {(ux * ux + uy * uy).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// --- Custom Animal tab ---

const ANIMAL_PROPS = ANIMAL_DOMAIN.properties;

function normalizeToUnit(values: number[], changedIdx: number, newVal: number): number[] {
  const result = [...values];
  result[changedIdx] = newVal;

  const changedSq = newVal * newVal;
  const budget = 1 - changedSq;

  if (budget <= 0) {
    // Changed dimension uses all the budget
    return result.map((_, i) => i === changedIdx ? (newVal > 0 ? 1 : 0) : 0);
  }

  // Sum of squares of other dimensions
  const otherSumSq = result.reduce((s, v, i) => i === changedIdx ? s : s + v * v, 0);

  if (otherSumSq < 0.0001) {
    // Other dimensions are all zero — distribute budget equally
    const each = Math.sqrt(budget / (result.length - 1));
    return result.map((v, i) => i === changedIdx ? newVal : each);
  }

  // Scale other dimensions proportionally
  const scale = Math.sqrt(budget / otherSumSq);
  return result.map((v, i) => i === changedIdx ? newVal : v * scale);
}

function CustomAnimalTab() {
  const [name, setName] = useState("Dragopus");
  const [values, setValues] = useState(() => {
    // Start with equal values that form a unit vector
    const v = Math.sqrt(1 / ANIMAL_PROPS.length);
    return ANIMAL_PROPS.map(() => v);
  });

  const handleSlider = useCallback((idx: number, newVal: number) => {
    setValues(prev => normalizeToUnit(prev, idx, newVal));
  }, []);

  const sumSq = values.reduce((s, v) => s + v * v, 0);

  return (
    <>
      <p className="text-sm text-muted mb-3">
        Design your own animal! Drag any slider to change a property. The other properties automatically scale down so the vector stays a unit vector — the sum of squares always equals 1.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 items-start">
        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-foreground/10 bg-foreground/[0.02] px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="Name your animal..."
          />
          {ANIMAL_PROPS.map((prop, i) => (
            <SliderControl
              key={prop}
              label={prop}
              value={values[i]}
              min={0}
              max={0.99}
              step={0.01}
              onChange={(v) => handleSlider(i, v)}
            />
          ))}
        </div>
        <div className="space-y-3">
          <VectorCard
            name={name || "???"}
            emoji="🐾"
            properties={ANIMAL_PROPS}
            values={values}
            barColor="#8b5cf6"
          />
          <div className="rounded-lg bg-foreground/[0.03] p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Sum of squares</div>
            <div className="font-mono text-sm">
              {values.map((v, i) => (
                <span key={i}>
                  {i > 0 && <span className="text-muted"> + </span>}
                  {v.toFixed(2)}²
                </span>
              ))}
            </div>
            <div className="font-mono text-sm mt-1">
              = {values.map((v, i) => (
                <span key={i}>
                  {i > 0 && <span className="text-muted"> + </span>}
                  {(v * v).toFixed(2)}
                </span>
              ))}
            </div>
            <div className="font-mono text-sm font-bold mt-1" style={{ color: Math.abs(sumSq - 1) < 0.02 ? "#22c55e" : "#f59e0b" }}>
              = {sumSq.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// --- Amplified Animal tab ---

function AmplifiedAnimalTab() {
  const [animalIdx, setAnimalIdx] = useState(0);
  const [magnitude, setMagnitude] = useState(2.0);
  const animal = ANIMAL_DOMAIN.items[animalIdx];
  const amplified = animal.values.map(v => v * magnitude);

  return (
    <>
      <p className="text-sm text-muted mb-3">
        Pick an animal to see its unit vector. The magnitude slider scales every dimension by the same amount — the proportions stay the same, but the vector gets longer. We'll find this useful later, when we use vectors to <em>detect</em> animals and use the magnitude to control how sensitive our detector is.
      </p>
      <div className="flex flex-wrap gap-1 mb-3">
        {ANIMAL_DOMAIN.items.map((item, i) => (
          <button
            key={item.name}
            onClick={() => setAnimalIdx(i)}
            className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
              i === animalIdx
                ? "bg-blue-500 text-white"
                : "bg-foreground/5 text-foreground hover:bg-foreground/10"
            }`}
          >
            {item.emoji} {item.name}
          </button>
        ))}
      </div>

      <SliderControl label="magnitude" value={magnitude} min={0.1} max={5} step={0.1} onChange={setMagnitude} />

      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start mt-3">
        <VectorCard
          name={animal.name}
          emoji={animal.emoji}
          properties={ANIMAL_DOMAIN.properties}
          values={animal.values}
          barColor="#3b82f6"
          label="unit vector" labelColor="#3b82f6"
        />
        <VectorCard
          name={animal.name}
          emoji={animal.emoji}
          properties={ANIMAL_DOMAIN.properties}
          values={amplified}
          barColor="#f59e0b"
          label={`× ${magnitude.toFixed(1)}`} labelColor="#f59e0b"
          barMax={4}
          barWidth="w-32"
          animate={false}
        />
        {/* Multiplication math */}
        <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] overflow-hidden shrink-0" style={{ maxWidth: "10rem" }}>
          <div className="py-2 px-3 text-sm font-medium text-foreground border-b border-foreground/10 bg-foreground/[0.02]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">× {magnitude.toFixed(1)}</span>
          </div>
          {ANIMAL_DOMAIN.properties.map((prop, i) => (
            <div key={prop} className="flex items-center py-1.5 px-3 border-b border-foreground/5 last:border-b-0 min-h-[28px]">
              <span className="font-mono text-[10px] text-muted whitespace-nowrap">
                <span className="text-blue-500">{animal.values[i].toFixed(2)}</span>
                {" × "}
                <span className="text-amber-500">{magnitude.toFixed(1)}</span>
                {" = "}
                <span className="font-semibold">{amplified[i].toFixed(2)}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// --- Main ---

const TABS = [
  { id: "2d", label: "2D Space" },
  { id: "custom", label: "Custom Animal" },
  { id: "amplified", label: "Amplified Animal" },
];

export function UnitVectorExplorer() {
  const [activeTab, setActiveTab] = useState("2d");

  const handleReset = useCallback(() => {
    setActiveTab("2d");
  }, []);

  return (
    <WidgetContainer
      title="Unit Vectors"
      description="A unit vector has length 1 — the standard size for a vector"
      onReset={handleReset}
    >
      <WidgetTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === "2d" && <TwoDTab key="2d" />}
      {activeTab === "custom" && <CustomAnimalTab key="custom" />}
      {activeTab === "amplified" && <AmplifiedAnimalTab key="amplified" />}
    </WidgetContainer>
  );
}
