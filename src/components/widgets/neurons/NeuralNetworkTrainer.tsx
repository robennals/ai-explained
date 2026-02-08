"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";
import { SelectControl } from "../shared/SelectControl";
import {
  createNetwork,
  trainStep,
  predict,
  type NetworkState,
  type ActivationName,
} from "./lib/neural-net";

interface DataPoint {
  x: number;
  y: number;
  label: number;
}

const SVG_SIZE = 360;
const PAD = 4;
const GRID_RES = 40;
const STEPS_PER_FRAME = 8;

// Preset datasets
function makeCircle(): DataPoint[] {
  const pts: DataPoint[] = [];
  for (let i = 0; i < 40; i++) {
    const angle = (i / 40) * Math.PI * 2;
    // Inner circle: class 0
    const r1 = 0.15 + Math.random() * 0.05;
    pts.push({ x: 0.5 + r1 * Math.cos(angle), y: 0.5 + r1 * Math.sin(angle), label: 0 });
    // Outer ring: class 1
    const r2 = 0.3 + Math.random() * 0.08;
    pts.push({ x: 0.5 + r2 * Math.cos(angle), y: 0.5 + r2 * Math.sin(angle), label: 1 });
  }
  return pts;
}

function makeXOR(): DataPoint[] {
  const pts: DataPoint[] = [];
  const clusters: [number, number, number][] = [
    [0.25, 0.25, 0],
    [0.75, 0.75, 0],
    [0.25, 0.75, 1],
    [0.75, 0.25, 1],
  ];
  for (const [cx, cy, label] of clusters) {
    for (let i = 0; i < 10; i++) {
      pts.push({
        x: cx + (Math.random() - 0.5) * 0.15,
        y: cy + (Math.random() - 0.5) * 0.15,
        label,
      });
    }
  }
  return pts;
}

function makeSpirals(): DataPoint[] {
  const pts: DataPoint[] = [];
  const n = 50;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * 3 * Math.PI;
    const r = (i / n) * 0.4;
    const noise = () => (Math.random() - 0.5) * 0.03;
    pts.push({
      x: 0.5 + r * Math.cos(t) + noise(),
      y: 0.5 + r * Math.sin(t) + noise(),
      label: 0,
    });
    pts.push({
      x: 0.5 - r * Math.cos(t) + noise(),
      y: 0.5 - r * Math.sin(t) + noise(),
      label: 1,
    });
  }
  return pts;
}

function makeCheckerboard(): DataPoint[] {
  const pts: DataPoint[] = [];
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * 0.8 + 0.1;
    const y = Math.random() * 0.8 + 0.1;
    const cx = Math.floor(x * 4);
    const cy = Math.floor(y * 4);
    pts.push({ x, y, label: (cx + cy) % 2 });
  }
  return pts;
}

type PresetName = "xor" | "circle" | "spirals" | "checkerboard";

const PRESETS: Record<PresetName, () => DataPoint[]> = {
  xor: makeXOR,
  circle: makeCircle,
  spirals: makeSpirals,
  checkerboard: makeCheckerboard,
};

const ACTIVATION_OPTIONS = [
  { value: "sigmoid", label: "Sigmoid" },
  { value: "relu", label: "ReLU" },
  { value: "swish", label: "Swish" },
];

const LAYER_OPTIONS = [
  { value: "1", label: "1 layer" },
  { value: "2", label: "2 layers" },
  { value: "3", label: "3 layers" },
  { value: "4", label: "4 layers" },
];

const NEURON_OPTIONS = [
  { value: "2", label: "2 neurons" },
  { value: "4", label: "4 neurons" },
  { value: "6", label: "6 neurons" },
  { value: "8", label: "8 neurons" },
];

export function NeuralNetworkTrainer() {
  const [data, setData] = useState<DataPoint[]>(() => makeXOR());
  const [layers, setLayers] = useState("2");
  const [neurons, setNeurons] = useState("4");
  const [activation, setActivation] = useState("sigmoid");
  const [learningRate, setLearningRate] = useState(2);
  const [training, setTraining] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [loss, setLoss] = useState<number | null>(null);
  const [heatmap, setHeatmap] = useState<string[]>([]);
  const [brushLabel, setBrushLabel] = useState(0);

  const netRef = useRef<NetworkState | null>(null);
  const animRef = useRef<number>(0);
  const trainingRef = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const buildNetwork = useCallback(() => {
    const sizes = [2];
    const nLayers = parseInt(layers);
    const nNeurons = parseInt(neurons);
    for (let i = 0; i < nLayers; i++) sizes.push(nNeurons);
    sizes.push(1);
    return createNetwork(sizes, activation as ActivationName);
  }, [layers, neurons, activation]);

  const updateHeatmap = useCallback((net: NetworkState) => {
    const cells: string[] = [];
    for (let i = 0; i < GRID_RES; i++) {
      for (let j = 0; j < GRID_RES; j++) {
        const x = (i + 0.5) / GRID_RES;
        const y = 1 - (j + 0.5) / GRID_RES;
        const out = predict(net, x, y);
        const v = Math.max(0, Math.min(1, out));
        const r = Math.round(59 + (251 - 59) * v);
        const g = Math.round(130 + (146 - 130) * v);
        const b = Math.round(246 + (20 - 246) * v);
        cells.push(`rgb(${r},${g},${b})`);
      }
    }
    setHeatmap(cells);
  }, []);

  const resetNet = useCallback(() => {
    trainingRef.current = false;
    cancelAnimationFrame(animRef.current);
    setTraining(false);
    setEpoch(0);
    setLoss(null);
    const net = buildNetwork();
    netRef.current = net;
    updateHeatmap(net);
  }, [buildNetwork, updateHeatmap]);

  // Rebuild when architecture changes
  useEffect(() => {
    resetNet();
  }, [resetNet]);

  useEffect(() => {
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const fullReset = useCallback(() => {
    setData(makeXOR());
    resetNet();
  }, [resetNet]);

  const train = useCallback(() => {
    if (trainingRef.current) {
      trainingRef.current = false;
      setTraining(false);
      return;
    }
    if (data.length < 2) return;

    trainingRef.current = true;
    setTraining(true);

    const inputs = data.map((d) => [d.x, d.y]);
    const targets = data.map((d) => [d.label]);
    let currentEpoch = 0;

    function step() {
      if (!trainingRef.current || !netRef.current) return;

      let l = 0;
      for (let i = 0; i < STEPS_PER_FRAME; i++) {
        l = trainStep(netRef.current, inputs, targets, learningRate);
        currentEpoch++;
      }

      setEpoch(currentEpoch);
      setLoss(l);

      if (currentEpoch % 3 === 0) {
        updateHeatmap(netRef.current);
      }

      if (currentEpoch < 5000 && trainingRef.current) {
        animRef.current = requestAnimationFrame(step);
      } else {
        trainingRef.current = false;
        setTraining(false);
        if (netRef.current) updateHeatmap(netRef.current);
      }
    }

    animRef.current = requestAnimationFrame(step);
  }, [data, learningRate, updateHeatmap]);

  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = SVG_SIZE / rect.width;
      const scaleY = SVG_SIZE / rect.height;
      const sx = (e.clientX - rect.left) * scaleX;
      const sy = (e.clientY - rect.top) * scaleY;
      const x = (sx - PAD) / (SVG_SIZE - 2 * PAD);
      const y = 1 - (sy - PAD) / (SVG_SIZE - 2 * PAD);
      if (x < 0 || x > 1 || y < 0 || y > 1) return;
      setData((prev) => [...prev, { x, y, label: brushLabel }]);
    },
    [brushLabel]
  );

  const loadPreset = useCallback(
    (name: PresetName) => {
      trainingRef.current = false;
      cancelAnimationFrame(animRef.current);
      setTraining(false);
      setEpoch(0);
      setLoss(null);
      const newData = PRESETS[name]();
      setData(newData);
      const net = buildNetwork();
      netRef.current = net;
      updateHeatmap(net);
    },
    [buildNetwork, updateHeatmap]
  );

  const cellSize = (SVG_SIZE - 2 * PAD) / GRID_RES;

  return (
    <WidgetContainer
      title="Neural Network Trainer"
      description="Place points and watch a network learn to classify them in real time"
      onReset={fullReset}
    >
      <div className="flex flex-col gap-4 xl:flex-row">
        {/* Canvas */}
        <div className="flex-1">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            className="w-full max-w-[400px] cursor-crosshair rounded-lg border border-border"
            onClick={handleSvgClick}
          >
            {/* Heatmap */}
            {heatmap.map((color, idx) => {
              const i = Math.floor(idx / GRID_RES);
              const j = idx % GRID_RES;
              return (
                <rect
                  key={idx}
                  x={PAD + i * cellSize}
                  y={PAD + j * cellSize}
                  width={cellSize + 0.5}
                  height={cellSize + 0.5}
                  fill={color}
                />
              );
            })}

            {/* Data points */}
            {data.map((d, i) => (
              <circle
                key={i}
                cx={PAD + d.x * (SVG_SIZE - 2 * PAD)}
                cy={PAD + (1 - d.y) * (SVG_SIZE - 2 * PAD)}
                r={5}
                fill={d.label === 1 ? "#fb923c" : "#3b82f6"}
                stroke="white"
                strokeWidth="1.5"
              />
            ))}
          </svg>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-[10px] text-muted">Click to add:</span>
            <button
              onClick={() => setBrushLabel(0)}
              className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium ${
                brushLabel === 0 ? "bg-blue-500/20 text-blue-600" : "bg-foreground/5 text-muted"
              }`}
            >
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500" /> Blue
            </button>
            <button
              onClick={() => setBrushLabel(1)}
              className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium ${
                brushLabel === 1 ? "bg-orange-500/20 text-orange-600" : "bg-foreground/5 text-muted"
              }`}
            >
              <span className="inline-block h-2 w-2 rounded-full bg-orange-400" /> Orange
            </button>
            <button
              onClick={() => setData([])}
              className="ml-auto rounded px-2 py-0.5 text-[10px] font-medium text-muted hover:bg-foreground/5"
            >
              Clear points
            </button>
          </div>
        </div>

        {/* Controls panel */}
        <div className="flex flex-col gap-3 xl:w-56">
          {/* Presets */}
          <div>
            <div className="mb-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">Presets</div>
            <div className="flex flex-wrap gap-1">
              {(Object.keys(PRESETS) as PresetName[]).map((name) => (
                <button
                  key={name}
                  onClick={() => loadPreset(name)}
                  className="rounded-md bg-foreground/5 px-2.5 py-1 text-[10px] font-medium text-muted transition-colors hover:bg-foreground/10 hover:text-foreground capitalize"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Architecture */}
          <div>
            <div className="mb-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">Architecture</div>
            <div className="flex flex-col gap-2">
              <SelectControl label="Layers" value={layers} options={LAYER_OPTIONS} onChange={setLayers} />
              <SelectControl label="Neurons" value={neurons} options={NEURON_OPTIONS} onChange={setNeurons} />
              <SelectControl label="Activation" value={activation} options={ACTIVATION_OPTIONS} onChange={setActivation} />
            </div>
          </div>

          {/* Learning rate */}
          <SliderControl
            label="Learn rate"
            value={learningRate}
            min={0.1}
            max={5}
            step={0.1}
            onChange={setLearningRate}
          />

          {/* Train button */}
          <button
            onClick={train}
            disabled={data.length < 2}
            className={`rounded-md px-4 py-2 text-xs font-medium transition-colors ${
              training
                ? "bg-error/10 text-error hover:bg-error/20"
                : "bg-accent/10 text-accent hover:bg-accent/20"
            } disabled:opacity-40`}
          >
            {training ? "Stop" : "Train"}
          </button>

          {/* Stats */}
          {epoch > 0 && (
            <div className="text-xs text-muted space-y-0.5">
              <div>
                Epoch: <span className="font-mono font-bold text-foreground">{epoch}</span>
              </div>
              {loss !== null && (
                <div>
                  Loss: <span className="font-mono font-bold text-foreground">{loss.toFixed(4)}</span>
                </div>
              )}
              <div>
                Points: <span className="font-mono text-foreground">{data.length}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </WidgetContainer>
  );
}
