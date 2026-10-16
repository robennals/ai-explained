"use client";

import { useState, useCallback, useMemo, useRef, useEffect, type ReactNode } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";
import { useSliderDiagramLink } from "../shared/useSliderDiagramLink";
import { ValueChip, type NeuronParam } from "./NeuronDiagramParts";
import { useIsPhone } from "../shared/useMediaQuery";
import { useSvgFontSize } from "../shared/useSvgScale";

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function cutoff(x: number): number {
  return x > 0 ? 1 : 0;
}

function isApproxSigmoid(v: number): boolean {
  return (v > 0 && v < 0.005) || (v > 0.995 && v < 1);
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
    const b = Math.round(160 + (129 - 160) * t);
    return `rgb(${r},${g},${b})`;
  }
}

// Small inline slider rendered via foreignObject
function MiniSlider({
  x,
  y,
  value,
  min,
  max,
  step,
  onChange,
  label,
  interpret,
  showValue = true,
  width = 80,
}: {
  x: number;
  y: number;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  label: string;
  interpret?: (v: number) => string;
  showValue?: boolean;
  width?: number;
}) {
  return (
    <foreignObject x={x - width / 2} y={y} width={width} height={80} style={{ overflow: "visible" }}>
      <div className="flex flex-col items-center" style={{ overflow: "visible" }}>
        {label && (
          <div className="text-[12px] font-bold text-foreground whitespace-nowrap leading-none">
            {label}
          </div>
        )}
        {showValue && (
          <div className="font-mono font-bold text-foreground text-[14px] leading-none">
            {value.toFixed(1)}
          </div>
        )}
        <div className="w-full py-px">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1.5 accent-accent"
          />
        </div>
        {interpret && (
          <div className="font-bold text-foreground text-[10px] leading-none whitespace-nowrap">
            {interpret(value)}
          </div>
        )}
      </div>
    </foreignObject>
  );
}

// Layout constants. WIDE has room for sliders inside the diagram. COMPACT
// (phones) drops them in favour of normal sliders below, so the diagram can be
// narrower and its text drawn at a readable size. With one input, everything
// sits on the middle row, so the diagram is cropped to SINGLE_TOP/SINGLE_H.
const WIDE = {
  W: 680, H: 370, IN_X: 55, IN_A_Y: 65, IN_B_Y: 270, SUM_X: 290, SUM_Y: 160,
  ACT_X: 450, ACT_Y: 160, ACT_W: 110, ACT_H: 75, OUT_X: 610, OUT_Y: 160, W_X: 155,
  SINGLE_TOP: 85, SINGLE_H: 170,
};
const COMPACT = {
  W: 420, H: 240, IN_X: 34, IN_A_Y: 44, IN_B_Y: 196, SUM_X: 180, SUM_Y: 120,
  ACT_X: 290, ACT_Y: 120, ACT_W: 90, ACT_H: 64, OUT_X: 384, OUT_Y: 120, W_X: 105,
  SINGLE_TOP: 70, SINGLE_H: 110,
};

// What a number between 0 and 1 means in words, when it stands for "how true is this?"
const MEANINGS: [number, string][] = [
  [0.05, "definitely not"],
  [0.15, "almost certainly not"],
  [0.35, "probably not"],
  [0.45, "maybe not"],
  [0.55, "not sure"],
  [0.65, "maybe"],
  [0.85, "probably"],
  [0.95, "almost certainly"],
];

function meaning(v: number): string {
  return MEANINGS.find(([below]) => v < below)?.[1] ?? "definitely";
}

export type NeuronFreePlayVariant = "neuron" | "cutoff" | "AND" | "OR" | "NOT";

interface GatePreset {
  name: string;
  w1: number;
  w2: number;
  bias: number;
}

// Two-input versions of the gates from the "adding up" playgrounds.
// NOT ignores input B by giving it a weight of zero.
const CUTOFF_PRESETS: GatePreset[] = [
  { name: "AND", w1: 1, w2: 1, bias: -1.5 },
  { name: "OR", w1: 1, w2: 1, bias: -0.5 },
  { name: "NOT A", w1: -1, w2: 0, bias: 0.5 },
];

// The same gates for a sigmoid neuron. Big weights push the sums far from zero,
// so the outputs land close to 0 or 1.
const NEURON_PRESETS: GatePreset[] = [
  { name: "AND", w1: 10, w2: 10, bias: -15 },
  { name: "OR", w1: 10, w2: 10, bias: -5 },
  { name: "NOT A", w1: -10, w2: 0, bias: 5 },
  { name: "NAND", w1: -10, w2: -10, bias: 15 },
];

interface VariantSettings {
  title: string;
  description: string;
  formula: ReactNode;
  activation: "sigmoid" | "cutoff";
  // The sum at which the cutoff switches from 0 to 1
  threshold: number;
  // Range of sums drawn across the activation box
  sumMin: number;
  sumMax: number;
  boxLabel: string;
  // Gates have weights fixed at these values and no bias; the others have sliders.
  // A null second weight means the gate has only one input.
  fixedWeights: [number, number | null] | null;
  // Gate buttons that glide the weights and bias to each gate's settings
  presets: GatePreset[];
  truthTable: boolean;
  footnote?: string;
  initial: { a: number; b: number; w1: number; w2: number; bias: number };
  weightRange: number;
  biasRange: number;
}

const VARIANTS: Record<NeuronFreePlayVariant, VariantSettings> = {
  neuron: {
    title: "Your First Neuron",
    description: "Slide the inputs, weights, and bias, or pick a gate and watch the weights glide to it.",
    formula: (
      <>
        output = sigmoid(weight<sub>A</sub> &times; input<sub>A</sub> + weight<sub>B</sub> &times; input<sub>B</sub> + bias)
      </>
    ),
    activation: "sigmoid",
    threshold: 0,
    sumMin: -10,
    sumMax: 10,
    boxLabel: "Activation",
    fixedWeights: null,
    presets: NEURON_PRESETS,
    truthTable: true,
    footnote:
      "XOR (output 1 when exactly one input is 1) is missing: no settings of a single neuron can compute it. You'll see why, and how to fix it, soon.",
    initial: { a: 0.5, b: 0.5, w1: 5.0, w2: -3.0, bias: 0 },
    weightRange: 15,
    biasRange: 20,
  },
  cutoff: {
    title: "One Machine, Every Gate",
    description: "Set the weights and bias to turn the same machine into AND, OR, or NOT.",
    formula: (
      <>
        output = 1 if (weight<sub>A</sub> &times; input<sub>A</sub> + weight<sub>B</sub> &times; input<sub>B</sub> + bias) &gt; 0, otherwise 0
      </>
    ),
    activation: "cutoff",
    threshold: 0,
    sumMin: -3,
    sumMax: 3,
    boxLabel: "Cutoff",
    fixedWeights: null,
    presets: CUTOFF_PRESETS,
    truthTable: true,
    initial: { a: 0.5, b: 0.5, w1: 1, w2: 1, bias: 0 },
    weightRange: 3,
    biasRange: 3,
  },
  AND: {
    title: "AND by Adding Up",
    description: "Add the inputs. Output 1 if the total is more than 1.5.",
    formula: (
      <>
        output = 1 if input<sub>A</sub> + input<sub>B</sub> &gt; 1.5, otherwise 0
      </>
    ),
    activation: "cutoff",
    threshold: 1.5,
    sumMin: 0,
    sumMax: 2,
    boxLabel: "More than 1.5?",
    fixedWeights: [1, 1],
    presets: [],
    truthTable: true,
    initial: { a: 0.8, b: 0.5, w1: 1, w2: 1, bias: 0 },
    weightRange: 3,
    biasRange: 3,
  },
  OR: {
    title: "OR by Adding Up",
    description: "Add the inputs. Output 1 if the total is more than 0.5.",
    formula: (
      <>
        output = 1 if input<sub>A</sub> + input<sub>B</sub> &gt; 0.5, otherwise 0
      </>
    ),
    activation: "cutoff",
    threshold: 0.5,
    sumMin: 0,
    sumMax: 2,
    boxLabel: "More than 0.5?",
    fixedWeights: [1, 1],
    presets: [],
    truthTable: true,
    initial: { a: 0.2, b: 0.1, w1: 1, w2: 1, bias: 0 },
    weightRange: 3,
    biasRange: 3,
  },
  NOT: {
    title: "NOT by Adding Up",
    description: "Multiply the input by −1. Output 1 if the total is more than −0.5.",
    formula: (
      <>
        output = 1 if &minus;1 &times; input<sub>A</sub> &gt; &minus;0.5, otherwise 0
      </>
    ),
    activation: "cutoff",
    threshold: -0.5,
    sumMin: -1,
    sumMax: 0,
    boxLabel: "More than −0.5?",
    fixedWeights: [-1, null],
    presets: [],
    truthTable: true,
    initial: { a: 0.2, b: 0, w1: -1, w2: 0, bias: 0 },
    weightRange: 3,
    biasRange: 3,
  },
};

const PRESET_ANIMATION_MS = 1000;

const TWO_INPUT_CORNERS = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
];
const ONE_INPUT_CORNERS = [
  [0, 0],
  [1, 0],
];

interface PhoneSlider {
  param: NeuronParam;
  label: string;
  value: number;
  min: number;
  max: number;
  set: (v: number) => void;
  format: (v: number) => string;
}

function formatWeight(w: number): string {
  return w < 0 ? `× −${Math.abs(w)}` : `× ${w}`;
}

export function NeuronFreePlay({ variant = "neuron" }: { variant?: NeuronFreePlayVariant }) {
  const settings = VARIANTS[variant];
  const singleInput = settings.fixedWeights !== null && settings.fixedWeights[1] === null;
  const compact = useIsPhone();
  const {
    W, H, IN_X, IN_A_Y: TWO_INPUT_A_Y, IN_B_Y, SUM_X, SUM_Y, ACT_X, ACT_Y, ACT_W, ACT_H, OUT_X, OUT_Y, W_X,
    SINGLE_TOP, SINGLE_H,
  } = compact ? COMPACT : WIDE;
  const IN_A_Y = singleInput ? SUM_Y : TWO_INPUT_A_Y;
  const svgRef = useRef<SVGSVGElement>(null);
  const fontSize = useSvgFontSize(svgRef, W);
  const [inputA, setInputA] = useState(settings.initial.a);
  const [inputB, setInputB] = useState(settings.initial.b);
  const [w1, setW1] = useState(settings.initial.w1);
  const [w2, setW2] = useState(settings.initial.w2);
  const [bias, setBias] = useState(settings.initial.bias);

  // Phones: the selected parameter's slider row and its part of the diagram
  // are highlighted together (see useSliderDiagramLink).
  const { active, setActive, selectFromDiagram, rowProps } = useSliderDiagramLink<NeuronParam>();

  // Preset buttons glide the weights and bias to their new values rather than jumping
  const animationFrame = useRef(0);
  useEffect(() => () => cancelAnimationFrame(animationFrame.current), []);

  const reset = useCallback(() => {
    cancelAnimationFrame(animationFrame.current);
    setInputA(settings.initial.a);
    setInputB(settings.initial.b);
    setW1(settings.initial.w1);
    setW2(settings.initial.w2);
    setBias(settings.initial.bias);
    setActive(null);
  }, [settings, setActive]);

  const applyPreset = useCallback(
    (preset: GatePreset) => {
      cancelAnimationFrame(animationFrame.current);
      const start = { w1, w2, bias };
      const startTime = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - startTime) / PRESET_ANIMATION_MS);
        const ease = 1 - Math.pow(1 - t, 3);
        setW1(start.w1 + (preset.w1 - start.w1) * ease);
        setW2(start.w2 + (preset.w2 - start.w2) * ease);
        setBias(start.bias + (preset.bias - start.bias) * ease);
        if (t < 1) animationFrame.current = requestAnimationFrame(tick);
      };
      animationFrame.current = requestAnimationFrame(tick);
    },
    [w1, w2, bias]
  );

  const activate = useCallback(
    (sum: number) => (settings.activation === "sigmoid" ? sigmoid(sum) : cutoff(sum - settings.threshold)),
    [settings]
  );

  const sumOf = (a: number, b: number) => w1 * a + (singleInput ? 0 : w2 * b) + bias;
  const weightedSum = sumOf(inputA, inputB);
  const output = activate(weightedSum);

  const corners = singleInput ? ONE_INPUT_CORNERS : TWO_INPUT_CORNERS;
  const truthOutputs = corners.map(([a, b]) => activate(sumOf(a, b)));
  // Which gate the current settings compute, reading an output above 0.5 as a 1
  const asBit = (v: number) => (v > 0.5 ? 1 : 0);
  const matchingPreset = settings.presets.find((preset) =>
    TWO_INPUT_CORNERS.every(
      ([a, b], i) => asBit(activate(preset.w1 * a + preset.w2 * b + preset.bias)) === asBit(truthOutputs[i])
    )
  );
  const prodA = w1 * inputA;
  const prodB = w2 * inputB;

  // Arrow endpoints
  const aStart = { x: IN_X + 22, y: IN_A_Y };
  const aEnd = { x: SUM_X - 28, y: SUM_Y };
  const bStart = { x: IN_X + 22, y: IN_B_Y };
  const bEnd = { x: SUM_X - 28, y: SUM_Y };

  const waX = W_X;
  const waT = (waX - aStart.x) / (aEnd.x - aStart.x);
  const waY = aStart.y + waT * (aEnd.y - aStart.y);

  const wbX = W_X;
  const wbT = (wbX - bStart.x) / (bEnd.x - bStart.x);
  const wbY = bStart.y + wbT * (bEnd.y - bStart.y);

  // Activation box plot area
  const pL = ACT_X - ACT_W / 2 + 8;
  const pR = ACT_X + ACT_W / 2 - 8;
  const pT = ACT_Y - ACT_H / 2 + 8;
  const pB = ACT_Y + ACT_H / 2 - 8;
  const sumToBoxX = (sum: number) => pL + ((sum - settings.sumMin) / (settings.sumMax - settings.sumMin)) * (pR - pL);

  const activationPath = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 100; i++) {
      const sum = settings.sumMin + (settings.sumMax - settings.sumMin) * (i / 100);
      pts.push(`${i === 0 ? "M" : "L"}${(pL + (i / 100) * (pR - pL)).toFixed(1)},${(pB - activate(sum) * (pB - pT)).toFixed(1)}`);
    }
    return pts.join(" ");
  }, [settings, activate, pL, pR, pT, pB]);

  // Operating point on the activation curve
  const opSx = Math.max(pL, Math.min(pR, sumToBoxX(weightedSum)));
  const opSy = pB - output * (pB - pT);

  // Phones: the sliders sit in a panel under the diagram. Gates only have inputs to slide.
  const inputLabel = (v: number) => `${v.toFixed(1)} · ${meaning(v)}`;
  const oneDecimal = (v: number) => v.toFixed(1);
  const inputSliders: PhoneSlider[] = [
    { param: "inputA", label: "Input A", value: inputA, min: 0, max: 1, set: setInputA, format: inputLabel },
    { param: "inputB", label: "Input B", value: inputB, min: 0, max: 1, set: setInputB, format: inputLabel },
  ];
  const knobSliders: PhoneSlider[] = [
    { param: "w1", label: "Weight A", value: w1, min: -settings.weightRange, max: settings.weightRange, set: setW1, format: oneDecimal },
    { param: "w2", label: "Weight B", value: w2, min: -settings.weightRange, max: settings.weightRange, set: setW2, format: oneDecimal },
    { param: "bias", label: "Bias", value: bias, min: -settings.biasRange, max: settings.biasRange, set: setBias, format: oneDecimal },
  ];
  const phoneSliders = [
    ...(singleInput ? inputSliders.slice(0, 1) : inputSliders),
    ...(settings.fixedWeights ? [] : knobSliders),
  ];

  return (
    <WidgetContainer title={settings.title} description={settings.description} onReset={reset}>
      {settings.presets.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
          {settings.presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="rounded-md border border-border px-3 py-1 text-xs font-semibold text-foreground hover:bg-foreground/5"
            >
              {preset.name}
            </button>
          ))}
        </div>
      )}
      <div className="mb-2 text-center font-mono text-sm text-foreground">{settings.formula}</div>
      <svg
        ref={svgRef}
        viewBox={singleInput ? `0 ${SINGLE_TOP} ${W} ${SINGLE_H}` : `0 0 ${W} ${H}`}
        className="w-full"
        aria-label="Interactive neuron diagram"
      >
        <defs>
          <marker
            id="nfp-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca3af" />
          </marker>
        </defs>

        {/* === INPUT A === */}
        <text
          x={IN_X}
          y={IN_A_Y - 26}
          textAnchor="middle"
          className="fill-foreground text-[12px] font-bold pointer-events-none select-none"
        >
          Input A
        </text>
        {compact && active === "inputA" && (
          <circle cx={IN_X} cy={IN_A_Y} r={27} fill="#3b82f6" opacity={0.18} />
        )}
        <circle
          cx={IN_X}
          cy={IN_A_Y}
          r={20}
          fill="#f0f4ff"
          stroke="#3b82f6"
          strokeWidth={compact && active === "inputA" ? 3.5 : 2}
        />
        <text
          x={IN_X}
          y={IN_A_Y + 5}
          textAnchor="middle"
          className="fill-accent text-[14px] font-bold font-mono pointer-events-none select-none"
        >
          {inputA.toFixed(1)}
        </text>
        {compact && (
          <>
            <text
              x={IN_X}
              y={IN_A_Y + 34}
              textAnchor="middle"
              fontSize={fontSize(10)}
              className="fill-foreground font-bold pointer-events-none select-none"
            >
              {meaning(inputA)}
            </text>
            <circle
              cx={IN_X}
              cy={IN_A_Y}
              r={28}
              fill="transparent"
              className="cursor-pointer"
              role="button"
              aria-label="Adjust Input A"
              onClick={() => selectFromDiagram("inputA")}
            />
          </>
        )}
        {!compact && (
          <MiniSlider
            x={IN_X}
            y={IN_A_Y + 16}
            value={inputA}
            min={0}
            max={1}
            step={0.1}
            onChange={setInputA}
            label=""
            showValue={false}
            interpret={meaning}
            width={90}
          />
        )}

        {/* === INPUT B === */}
        {!singleInput && (
          <>
            <text
              x={IN_X}
              y={IN_B_Y - 26}
              textAnchor="middle"
              className="fill-foreground text-[12px] font-bold pointer-events-none select-none"
            >
              Input B
            </text>
            {compact && active === "inputB" && (
              <circle cx={IN_X} cy={IN_B_Y} r={27} fill="#3b82f6" opacity={0.18} />
            )}
            <circle
              cx={IN_X}
              cy={IN_B_Y}
              r={20}
              fill="#f0f4ff"
              stroke="#3b82f6"
              strokeWidth={compact && active === "inputB" ? 3.5 : 2}
            />
            <text
              x={IN_X}
              y={IN_B_Y + 5}
              textAnchor="middle"
              className="fill-accent text-[14px] font-bold font-mono pointer-events-none select-none"
            >
              {inputB.toFixed(1)}
            </text>
            {compact && (
              <>
                <text
                  x={IN_X}
                  y={IN_B_Y + 34}
                  textAnchor="middle"
                  fontSize={fontSize(10)}
                  className="fill-foreground font-bold pointer-events-none select-none"
                >
                  {meaning(inputB)}
                </text>
                <circle
                  cx={IN_X}
                  cy={IN_B_Y}
                  r={28}
                  fill="transparent"
                  className="cursor-pointer"
                  role="button"
                  aria-label="Adjust Input B"
                  onClick={() => selectFromDiagram("inputB")}
                />
              </>
            )}
            {!compact && (
              <MiniSlider
                x={IN_X}
                y={IN_B_Y + 16}
                value={inputB}
                min={0}
                max={1}
                step={0.1}
                onChange={setInputB}
                label=""
                showValue={false}
                interpret={meaning}
                width={90}
              />
            )}
          </>
        )}

        {/* === ARROW A → SUM === */}
        <line
          x1={aStart.x}
          y1={aStart.y}
          x2={aEnd.x}
          y2={aEnd.y}
          stroke={compact && active === "w1" ? "#3b82f6" : "#9ca3af"}
          strokeWidth={compact && active === "w1" ? 2.5 : 1.5}
          markerEnd="url(#nfp-arrow)"
        />
        {settings.fixedWeights ? (
          <text
            x={waX}
            y={waY - 8}
            textAnchor="middle"
            className="fill-foreground text-[13px] font-bold font-mono pointer-events-none select-none"
          >
            {formatWeight(settings.fixedWeights[0])}
          </text>
        ) : (
          <>
            <line
              x1={waX}
              y1={waY}
              x2={waX}
              y2={waY + 4}
              stroke="#9ca3af"
              strokeWidth="0.8"
              strokeDasharray="2,2"
            />
            {!compact && (
              <MiniSlider
                x={waX}
                y={waY + 4}
                value={w1}
                min={-settings.weightRange}
                max={settings.weightRange}
                step={0.1}
                onChange={setW1}
                label="Weight A"
                width={90}
              />
            )}
            {compact && (
              <ValueChip
                x={waX}
                y={waY}
                text={`×${w1.toFixed(1)}`}
                label="Weight A"
                active={active === "w1"}
                onSelect={() => selectFromDiagram("w1")}
              />
            )}
          </>
        )}
        {!compact && (
          <text
            x={230}
            y={aStart.y + 0.82 * (aEnd.y - aStart.y) - 8}
            textAnchor="middle"
            className="fill-muted text-[9px] font-mono pointer-events-none select-none"
          >
            = {prodA.toFixed(1)}
          </text>
        )}

        {/* === ARROW B → SUM === */}
        {!singleInput && (
          <>
            <line
              x1={bStart.x}
              y1={bStart.y}
              x2={bEnd.x}
              y2={bEnd.y}
              stroke={compact && active === "w2" ? "#3b82f6" : "#9ca3af"}
              strokeWidth={compact && active === "w2" ? 2.5 : 1.5}
              markerEnd="url(#nfp-arrow)"
            />
            {settings.fixedWeights ? (
              <text
                x={wbX}
                y={wbY + 20}
                textAnchor="middle"
                className="fill-foreground text-[13px] font-bold font-mono pointer-events-none select-none"
              >
                {formatWeight(settings.fixedWeights[1] ?? 0)}
              </text>
            ) : (
              <>
                <line
                  x1={wbX}
                  y1={wbY}
                  x2={wbX}
                  y2={wbY + 4}
                  stroke="#9ca3af"
                  strokeWidth="0.8"
                  strokeDasharray="2,2"
                />
                {!compact && (
                  <MiniSlider
                    x={wbX}
                    y={wbY + 4}
                    value={w2}
                    min={-settings.weightRange}
                    max={settings.weightRange}
                    step={0.1}
                    onChange={setW2}
                    label="Weight B"
                    width={90}
                  />
                )}
                {compact && (
                  <ValueChip
                    x={wbX}
                    y={wbY}
                    text={`×${w2.toFixed(1)}`}
                    label="Weight B"
                    active={active === "w2"}
                    onSelect={() => selectFromDiagram("w2")}
                  />
                )}
              </>
            )}
            {!compact && (
              <text
                x={230}
                y={bStart.y + 0.82 * (bEnd.y - bStart.y) + 14}
                textAnchor="middle"
                className="fill-muted text-[9px] font-mono pointer-events-none select-none"
              >
                = {prodB.toFixed(1)}
              </text>
            )}
          </>
        )}

        {/* === SUM NODE === */}
        <text
          x={SUM_X}
          y={SUM_Y - 32}
          textAnchor="middle"
          className="fill-foreground text-[12px] font-bold pointer-events-none select-none"
        >
          Sum
        </text>
        <circle
          cx={SUM_X}
          cy={SUM_Y}
          r={26}
          fill="#fef9ee"
          stroke="#f59e0b"
          strokeWidth="2"
        />
        <text
          x={SUM_X}
          y={SUM_Y + 5}
          textAnchor="middle"
          className="fill-warning text-[14px] font-bold font-mono pointer-events-none select-none"
        >
          {weightedSum.toFixed(1)}
        </text>

        {/* === BIAS (gates have none) === */}
        {!settings.fixedWeights && (
          <>
            <line
              x1={SUM_X}
              y1={SUM_Y + 40}
              x2={SUM_X}
              y2={SUM_Y + 28}
              stroke="#9ca3af"
              strokeWidth="1"
              strokeDasharray="3,2"
              markerEnd="url(#nfp-arrow)"
            />
            {!compact && (
              <MiniSlider
                x={SUM_X}
                y={SUM_Y + 40}
                value={bias}
                min={-settings.biasRange}
                max={settings.biasRange}
                step={0.1}
                onChange={setBias}
                label="Bias"
                width={90}
              />
            )}
            {compact && (
              <>
                <ValueChip
                  x={SUM_X}
                  y={SUM_Y + 52}
                  text={`${bias >= 0 ? "+" : ""}${bias.toFixed(1)}`}
                  label="Bias"
                  active={active === "bias"}
                  onSelect={() => selectFromDiagram("bias")}
                />
                <text
                  x={SUM_X}
                  y={SUM_Y + 80}
                  textAnchor="middle"
                  className="fill-muted text-[12px] font-semibold pointer-events-none select-none"
                >
                  bias
                </text>
              </>
            )}
          </>
        )}

        {/* === SUM → ACTIVATION === */}
        <line
          x1={SUM_X + 28}
          y1={SUM_Y}
          x2={ACT_X - ACT_W / 2 - 4}
          y2={ACT_Y}
          stroke="#9ca3af"
          strokeWidth="1.5"
          markerEnd="url(#nfp-arrow)"
        />

        {/* === ACTIVATION FUNCTION BOX === */}
        <rect
          x={ACT_X - ACT_W / 2}
          y={ACT_Y - ACT_H / 2}
          width={ACT_W}
          height={ACT_H}
          rx={10}
          fill="#f0fdf4"
          stroke="#10b981"
          strokeWidth="2"
        />
        <text
          x={ACT_X}
          y={ACT_Y - ACT_H / 2 - 6}
          textAnchor="middle"
          fontSize={fontSize(9)}
          className="fill-success font-semibold uppercase tracking-wider pointer-events-none select-none"
        >
          {settings.boxLabel}
        </text>
        <path d={activationPath} fill="none" stroke="#10b981" strokeWidth="2" />
        {settings.activation === "cutoff" && (
          <text
            x={sumToBoxX(settings.threshold)}
            y={ACT_Y + ACT_H / 2 + 12}
            textAnchor="middle"
            fontSize={fontSize(9)}
            className="fill-muted font-mono pointer-events-none select-none"
          >
            {settings.threshold < 0 ? `−${Math.abs(settings.threshold)}` : settings.threshold}
          </text>
        )}
        <line
          x1={opSx}
          y1={pB}
          x2={opSx}
          y2={opSy}
          stroke="#f59e0b"
          strokeWidth="1"
          strokeDasharray="2,2"
          opacity={0.6}
        />
        <line
          x1={pL}
          y1={opSy}
          x2={opSx}
          y2={opSy}
          stroke="#f59e0b"
          strokeWidth="1"
          strokeDasharray="2,2"
          opacity={0.6}
        />
        <circle
          cx={opSx}
          cy={opSy}
          r={5}
          fill="#f59e0b"
          stroke="white"
          strokeWidth="1.5"
        />

        {/* === ACTIVATION → OUTPUT === */}
        <line
          x1={ACT_X + ACT_W / 2 + 2}
          y1={ACT_Y}
          x2={OUT_X - 26}
          y2={OUT_Y}
          stroke="#9ca3af"
          strokeWidth="1.5"
          markerEnd="url(#nfp-arrow)"
        />

        {/* === OUTPUT NODE === */}
        <text
          x={OUT_X}
          y={OUT_Y - 30}
          textAnchor="middle"
          className="fill-foreground text-[12px] font-bold pointer-events-none select-none"
        >
          Output
        </text>
        <circle
          cx={OUT_X}
          cy={OUT_Y}
          r={24}
          fill={outputColor(output)}
          stroke={outputColor(output)}
          strokeWidth="2"
        />
        <text
          x={OUT_X}
          y={OUT_Y + 5}
          textAnchor="middle"
          className="fill-white text-[14px] font-bold font-mono pointer-events-none select-none"
        >
          {settings.activation === "sigmoid" ? output.toFixed(2) : output}
        </text>
        <text
          x={OUT_X}
          y={OUT_Y + 40}
          textAnchor="middle"
          fontSize={fontSize(10)}
          className="fill-foreground font-bold pointer-events-none select-none"
        >
          {meaning(output)}
        </text>
        {settings.activation === "sigmoid" && isApproxSigmoid(output) && (
          // Phones: readable-size text no longer fits inside the circle, so it
          // goes underneath, below the meaning.
          <text
            x={OUT_X}
            y={compact ? OUT_Y + 54 : OUT_Y + 18}
            textAnchor="middle"
            fontSize={fontSize(8)}
            className={`${compact ? "fill-muted" : "fill-white/70"} pointer-events-none select-none`}
          >
            approx
          </text>
        )}
      </svg>
      {compact && (
        <div className="mt-3 space-y-2 rounded-lg bg-surface p-3">
          {phoneSliders.map((slider) => (
            <div key={slider.param} {...rowProps(slider.param)}>
              <SliderControl
                label={slider.label}
                value={slider.value}
                min={slider.min}
                max={slider.max}
                step={0.1}
                onChange={slider.set}
                formatValue={slider.format}
              />
            </div>
          ))}
        </div>
      )}
      {settings.truthTable && (
        <div className="not-prose mt-2 flex flex-col items-center gap-1">
          <table className="w-auto text-xs font-mono">
            <thead>
              <tr className="text-muted">
                <th className="px-3 py-1 font-semibold">A</th>
                {!singleInput && <th className="px-3 py-1 font-semibold">B</th>}
                <th className="px-3 py-1 font-semibold">output</th>
              </tr>
            </thead>
            <tbody>
              {corners.map(([a, b], i) => (
                <tr
                  key={`${a}-${b}`}
                  className={`cursor-pointer text-center ${
                    inputA === a && (singleInput || inputB === b) ? "bg-accent/10 font-bold" : "hover:bg-foreground/5"
                  }`}
                  onClick={() => {
                    setInputA(a);
                    setInputB(b);
                  }}
                >
                  <td className="px-3 py-1.5">{a}</td>
                  {!singleInput && <td className="px-3 py-1.5">{b}</td>}
                  <td className="px-3 py-1.5">
                    {settings.activation === "sigmoid" ? truthOutputs[i].toFixed(2) : truthOutputs[i]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {settings.presets.length > 0 && (
            <div className="text-xs text-muted">
              {matchingPreset ? (
                <>
                  These settings compute <strong className="text-foreground">{matchingPreset.name}</strong>
                  {settings.activation === "sigmoid" ? " (reading outputs above 0.5 as 1)" : ""}.
                </>
              ) : (
                `These settings don't match ${settings.presets.map((p) => p.name).join(", ")}.`
              )}
            </div>
          )}
          {settings.footnote && (
            <div className="mt-1 max-w-md text-center text-xs text-muted">{settings.footnote}</div>
          )}
        </div>
      )}
    </WidgetContainer>
  );
}
