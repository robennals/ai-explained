"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SelectControl } from "../shared/SelectControl";
import { SliderControl } from "../shared/SliderControl";
import {
  createNetwork,
  trainStep,
  predict,
  getLayerGradientMagnitudes,
  type NetworkState,
  type ActivationName,
} from "./lib/neural-net";

// Spirals dataset for training comparison
function makeSpirals(): { inputs: number[][]; targets: number[][] } {
  const inputs: number[][] = [];
  const targets: number[][] = [];
  const n = 50;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * 3 * Math.PI;
    const r = (i / n) * 0.4;
    const noise = () => (Math.random() - 0.5) * 0.03;
    inputs.push([0.5 + r * Math.cos(t) + noise(), 0.5 + r * Math.sin(t) + noise()]);
    targets.push([0]);
    inputs.push([0.5 - r * Math.cos(t) + noise(), 0.5 - r * Math.sin(t) + noise()]);
    targets.push([1]);
  }
  return { inputs, targets };
}

type FnName = "sigmoid" | "relu" | "leaky_relu" | "swish";

function evalFn(x: number, fn: FnName): number {
  switch (fn) {
    case "sigmoid":
      return 1 / (1 + Math.exp(-x));
    case "relu":
      return Math.max(0, x);
    case "leaky_relu":
      return x > 0 ? x : 0.01 * x;
    case "swish":
      return x / (1 + Math.exp(-x));
  }
}

function evalDerivative(x: number, fn: FnName): number {
  switch (fn) {
    case "sigmoid": {
      const s = 1 / (1 + Math.exp(-x));
      return s * (1 - s);
    }
    case "relu":
      return x > 0 ? 1 : 0;
    case "leaky_relu":
      return x > 0 ? 1 : 0.01;
    case "swish": {
      const s = 1 / (1 + Math.exp(-x));
      return s + x * s * (1 - s);
    }
  }
}

const FN_OPTIONS = [
  { value: "sigmoid", label: "Sigmoid" },
  { value: "relu", label: "ReLU" },
  { value: "leaky_relu", label: "Leaky ReLU" },
  { value: "swish", label: "Swish" },
];

const SVG_W = 260;
const SVG_H = 180;
const CURVE_PAD_L = 36;
const CURVE_PAD_R = 10;
const CURVE_PAD_T = 10;
const CURVE_PAD_B = 24;
const CURVE_PLOT_W = SVG_W - CURVE_PAD_L - CURVE_PAD_R;
const CURVE_PLOT_H = SVG_H - CURVE_PAD_T - CURVE_PAD_B;

const HEAT_W = 260;
const HEAT_H = 100;
const HEAT_PAD_L = 36;
const HEAT_PAD_R = 10;
const HEAT_PAD_T = 10;
const HEAT_PAD_B = 24;

const TRAIN_SVG = 180;
const TRAIN_PAD = 4;
const TRAIN_GRID = 25;

const STEPS_PER_FRAME = 5;
const MAX_HISTORY = 60;

export function ActivationFunctionExplorer() {
  const [fnName, setFnName] = useState<FnName>("sigmoid");
  const [depth, setDepth] = useState(5);
  const [training, setTraining] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [gradHistory, setGradHistory] = useState<number[][]>([]);
  const [trainHeatmap, setTrainHeatmap] = useState<string[]>([]);

  const netRef = useRef<NetworkState | null>(null);
  const animRef = useRef<number>(0);
  const trainingRef = useRef(false);
  const dataRef = useRef(makeSpirals());

  const buildNet = useCallback(() => {
    const sizes = [2];
    for (let i = 0; i < depth; i++) sizes.push(6);
    sizes.push(1);
    return createNetwork(sizes, fnName as ActivationName);
  }, [depth, fnName]);

  const updateTrainHeatmap = useCallback((net: NetworkState) => {
    const cells: string[] = [];
    for (let i = 0; i < TRAIN_GRID; i++) {
      for (let j = 0; j < TRAIN_GRID; j++) {
        const x = (i + 0.5) / TRAIN_GRID;
        const y = 1 - (j + 0.5) / TRAIN_GRID;
        const out = predict(net, x, y);
        const v = Math.max(0, Math.min(1, out));
        const r = Math.round(59 + (251 - 59) * v);
        const g = Math.round(130 + (146 - 130) * v);
        const b = Math.round(246 + (20 - 246) * v);
        cells.push(`rgb(${r},${g},${b})`);
      }
    }
    setTrainHeatmap(cells);
  }, []);

  const resetAll = useCallback(() => {
    trainingRef.current = false;
    cancelAnimationFrame(animRef.current);
    setTraining(false);
    setEpoch(0);
    setGradHistory([]);
    dataRef.current = makeSpirals();
    const net = buildNet();
    netRef.current = net;
    updateTrainHeatmap(net);
  }, [buildNet, updateTrainHeatmap]);

  useEffect(() => {
    resetAll();
  }, [resetAll]);

  useEffect(() => {
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const train = useCallback(() => {
    if (trainingRef.current) {
      trainingRef.current = false;
      setTraining(false);
      return;
    }
    trainingRef.current = true;
    setTraining(true);

    const { inputs, targets } = dataRef.current;
    let currentEpoch = 0;
    const lr = fnName === "sigmoid" ? 2 : fnName === "relu" ? 0.5 : 1;

    function step() {
      if (!trainingRef.current || !netRef.current) return;

      for (let i = 0; i < STEPS_PER_FRAME; i++) {
        trainStep(netRef.current, inputs, targets, lr);
        currentEpoch++;
      }
      setEpoch(currentEpoch);

      // Get gradient magnitudes
      const grads = getLayerGradientMagnitudes(netRef.current, inputs, targets);
      setGradHistory((prev) => {
        const next = [...prev, grads];
        if (next.length > MAX_HISTORY) next.shift();
        return next;
      });

      if (currentEpoch % 5 === 0) {
        updateTrainHeatmap(netRef.current);
      }

      if (currentEpoch < 3000 && trainingRef.current) {
        animRef.current = requestAnimationFrame(step);
      } else {
        trainingRef.current = false;
        setTraining(false);
        if (netRef.current) updateTrainHeatmap(netRef.current);
      }
    }

    animRef.current = requestAnimationFrame(step);
  }, [fnName, updateTrainHeatmap]);

  // Function curve + derivative
  const curveData = useMemo(() => {
    const xMin = -6;
    const xMax = 6;
    const yMin = fnName === "sigmoid" ? -0.5 : -2;
    const yMax = fnName === "sigmoid" ? 1.5 : 4;
    const n = 200;
    const fnPts: string[] = [];
    const derivPts: string[] = [];

    function toSvgX(x: number) {
      return CURVE_PAD_L + ((x - xMin) / (xMax - xMin)) * CURVE_PLOT_W;
    }
    function toSvgY(y: number) {
      return CURVE_PAD_T + ((yMax - y) / (yMax - yMin)) * CURVE_PLOT_H;
    }

    for (let i = 0; i <= n; i++) {
      const x = xMin + ((xMax - xMin) * i) / n;
      const y = evalFn(x, fnName);
      const dy = evalDerivative(x, fnName);
      const sx = toSvgX(x).toFixed(1);
      fnPts.push(`${i === 0 ? "M" : "L"}${sx},${toSvgY(y).toFixed(1)}`);
      derivPts.push(`${i === 0 ? "M" : "L"}${sx},${toSvgY(dy).toFixed(1)}`);
    }

    // Zero line
    const zeroY = toSvgY(0);

    return { fnPath: fnPts.join(" "), derivPath: derivPts.join(" "), zeroY, toSvgX, toSvgY };
  }, [fnName]);

  // Gradient heatmap
  const gradHeatmapCells = useMemo(() => {
    if (gradHistory.length === 0) return [];
    const numLayers = depth + 1; // hidden + output
    const numSteps = gradHistory.length;
    const cellW = (HEAT_W - HEAT_PAD_L - HEAT_PAD_R) / Math.max(numSteps, 1);
    const cellH = (HEAT_H - HEAT_PAD_T - HEAT_PAD_B) / numLayers;

    // Find max for normalization
    let maxGrad = 0;
    for (const grads of gradHistory) {
      for (const g of grads) {
        if (g > maxGrad) maxGrad = g;
      }
    }
    if (maxGrad === 0) maxGrad = 1;

    const cells: { x: number; y: number; w: number; h: number; color: string }[] = [];
    for (let t = 0; t < numSteps; t++) {
      const grads = gradHistory[t];
      for (let l = 0; l < numLayers; l++) {
        const v = Math.min(1, (grads[l] || 0) / maxGrad);
        // Dark (low gradient) to bright green (high gradient)
        const r = Math.round(20 + v * 16);
        const g = Math.round(20 + v * 215);
        const b = Math.round(20 + v * 109);
        cells.push({
          x: HEAT_PAD_L + t * cellW,
          y: HEAT_PAD_T + l * cellH,
          w: cellW + 0.5,
          h: cellH + 0.5,
          color: `rgb(${r},${g},${b})`,
        });
      }
    }
    return cells;
  }, [gradHistory, depth]);

  const trainCellSize = (TRAIN_SVG - 2 * TRAIN_PAD) / TRAIN_GRID;

  return (
    <WidgetContainer
      title="Activation Function Explorer"
      description="Compare how different activations affect gradient flow in deep networks"
      onReset={resetAll}
    >
      <div className="flex flex-col gap-3">
        {/* Top controls */}
        <div className="flex flex-wrap items-center gap-3">
          <SelectControl label="Activation" value={fnName} options={FN_OPTIONS} onChange={(v) => setFnName(v as FnName)} />
          <SliderControl
            label="Depth"
            value={depth}
            min={3}
            max={10}
            step={1}
            onChange={(v) => setDepth(Math.round(v))}
            formatValue={(v) => `${v} layers`}
          />
          <button
            onClick={train}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              training
                ? "bg-error/10 text-error hover:bg-error/20"
                : "bg-accent/10 text-accent hover:bg-accent/20"
            }`}
          >
            {training ? "Stop" : "Train"}
          </button>
          {epoch > 0 && (
            <span className="text-xs text-muted">
              Epoch: <span className="font-mono font-bold text-foreground">{epoch}</span>
            </span>
          )}
        </div>

        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Left: function curve */}
          <div className="flex-1">
            <div className="mb-1 text-[10px] font-semibold text-muted uppercase tracking-wider">
              Function &amp; Derivative
            </div>
            <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full rounded-lg border border-border bg-surface">
              {/* Zero line */}
              <line
                x1={CURVE_PAD_L}
                y1={curveData.zeroY}
                x2={SVG_W - CURVE_PAD_R}
                y2={curveData.zeroY}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              {/* Function */}
              <path d={curveData.fnPath} fill="none" stroke="#3b82f6" strokeWidth="2" />
              {/* Derivative */}
              <path d={curveData.derivPath} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,3" />
              {/* Legend */}
              <line x1={CURVE_PAD_L + 4} y1={CURVE_PAD_T + 8} x2={CURVE_PAD_L + 20} y2={CURVE_PAD_T + 8} stroke="#3b82f6" strokeWidth="2" />
              <text x={CURVE_PAD_L + 24} y={CURVE_PAD_T + 11} className="fill-muted text-[8px]">f(x)</text>
              <line x1={CURVE_PAD_L + 4} y1={CURVE_PAD_T + 20} x2={CURVE_PAD_L + 20} y2={CURVE_PAD_T + 20} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,3" />
              <text x={CURVE_PAD_L + 24} y={CURVE_PAD_T + 23} className="fill-muted text-[8px]">f&apos;(x)</text>
            </svg>
          </div>

          {/* Center: training visualization */}
          <div>
            <div className="mb-1 text-[10px] font-semibold text-muted uppercase tracking-wider">
              Spiral Classification
            </div>
            <svg
              viewBox={`0 0 ${TRAIN_SVG} ${TRAIN_SVG}`}
              className="w-full max-w-[200px] rounded-lg border border-border"
            >
              {trainHeatmap.map((color, idx) => {
                const i = Math.floor(idx / TRAIN_GRID);
                const j = idx % TRAIN_GRID;
                return (
                  <rect
                    key={idx}
                    x={TRAIN_PAD + i * trainCellSize}
                    y={TRAIN_PAD + j * trainCellSize}
                    width={trainCellSize + 0.5}
                    height={trainCellSize + 0.5}
                    fill={color}
                  />
                );
              })}
              {dataRef.current.inputs.map((inp, i) => (
                <circle
                  key={i}
                  cx={TRAIN_PAD + inp[0] * (TRAIN_SVG - 2 * TRAIN_PAD)}
                  cy={TRAIN_PAD + (1 - inp[1]) * (TRAIN_SVG - 2 * TRAIN_PAD)}
                  r={2.5}
                  fill={dataRef.current.targets[i][0] === 1 ? "#fb923c" : "#3b82f6"}
                  stroke="white"
                  strokeWidth="0.5"
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Gradient heatmap */}
        <div>
          <div className="mb-1 text-[10px] font-semibold text-muted uppercase tracking-wider">
            Gradient Magnitude by Layer (rows) over Training (columns)
          </div>
          <svg viewBox={`0 0 ${HEAT_W} ${HEAT_H}`} className="w-full rounded-lg border border-border bg-[#141414]">
            {gradHeatmapCells.map((c, i) => (
              <rect key={i} x={c.x} y={c.y} width={c.w} height={c.h} fill={c.color} />
            ))}
            {/* Layer labels */}
            {Array.from({ length: depth + 1 }, (_, l) => {
              const cellH = (HEAT_H - HEAT_PAD_T - HEAT_PAD_B) / (depth + 1);
              return (
                <text
                  key={l}
                  x={HEAT_PAD_L - 4}
                  y={HEAT_PAD_T + l * cellH + cellH / 2 + 3}
                  textAnchor="end"
                  className="fill-white/50 text-[7px]"
                >
                  L{l + 1}
                </text>
              );
            })}
            {gradHistory.length === 0 && (
              <text x={HEAT_W / 2} y={HEAT_H / 2 + 3} textAnchor="middle" className="fill-white/30 text-[10px]">
                Press Train to see gradient flow
              </text>
            )}
          </svg>
          <div className="mt-1 flex items-center gap-3 text-[9px] text-muted">
            <span>Dark = vanishing gradient</span>
            <span className="inline-block h-2 w-8 rounded" style={{ background: "linear-gradient(to right, #141414, #10b981)" }} />
            <span>Bright = strong gradient</span>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
