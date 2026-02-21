"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";

// --- Utility functions ---

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
}

function outputColorRGB(v: number): [number, number, number] {
  if (v <= 0.5) {
    const t = v / 0.5;
    return [
      Math.round(239 + (160 - 239) * t),
      Math.round(68 + (160 - 68) * t),
      Math.round(68 + (160 - 68) * t),
    ];
  } else {
    const t = (v - 0.5) / 0.5;
    return [
      Math.round(160 + (16 - 160) * t),
      Math.round(160 + (185 - 160) * t),
      Math.round(160 + (129 - 160) * t),
    ];
  }
}

function outputColor(v: number): string {
  const [r, g, b] = outputColorRGB(v);
  return `rgb(${r},${g},${b})`;
}

function forward1(x: number, y: number, w1: number, w2: number, b: number): number {
  return sigmoid(w1 * x + w2 * y + b);
}

function forward2(
  x: number, y: number,
  wH1a: number, wH1b: number, bH1: number,
  wH2a: number, wH2b: number, bH2: number,
  wO1: number, wO2: number, bO: number,
): number {
  const h1 = sigmoid(wH1a * x + wH1b * y + bH1);
  const h2 = sigmoid(wH2a * x + wH2b * y + bH2);
  return sigmoid(wO1 * h1 + wO2 * h2 + bO);
}

// --- Types ---

interface DataPoint { word: string; x: number; y: number }
interface Solution1 { layers: 1; w1: number; w2: number; b: number }
interface Solution2 {
  layers: 2;
  wH1a: number; wH1b: number; bH1: number;
  wH2a: number; wH2b: number; bH2: number;
  wO1: number; wO2: number; bO: number;
}
type Solution = Solution1 | Solution2;
interface Challenge { name: string; targetWords: string[]; solution: Solution }
interface TabDef {
  id: string;
  label: string;
  points: DataPoint[];
  xAxis: string;
  yAxis: string;
  challenges: Challenge[];
}

// --- Tab data ---
// Points are normalized to 0–1. Solutions are pre-computed known-good weights.

const TABS: TabDef[] = [
  {
    id: "size-danger",
    label: "Size × Danger",
    xAxis: "Small → Big",
    yAxis: "Safe → Dangerous",
    points: [
      { word: "ant", x: 0.05, y: 0.03 },
      { word: "dog", x: 0.45, y: 0.25 },
      { word: "horse", x: 0.70, y: 0.20 },
      { word: "bear", x: 0.80, y: 0.85 },
      { word: "elephant", x: 0.95, y: 0.35 },
      { word: "shark", x: 0.75, y: 0.90 },
      { word: "bread", x: 0.20, y: 0.00 },
      { word: "cake", x: 0.35, y: 0.00 },
      { word: "pizza", x: 0.25, y: 0.00 },
      { word: "car", x: 0.55, y: 0.40 },
      { word: "truck", x: 0.80, y: 0.50 },
      { word: "guitar", x: 0.35, y: 0.05 },
      { word: "piano", x: 0.65, y: 0.00 },
      { word: "knife", x: 0.15, y: 0.70 },
      { word: "gun", x: 0.15, y: 1.00 },
    ],
    challenges: [
      { name: "Dangerous", targetWords: ["bear", "shark", "knife", "gun"],
        solution: { layers: 1, w1: -5, w2: 20, b: -8 } },
      { name: "Big", targetWords: ["horse", "bear", "elephant", "shark", "truck"],
        solution: { layers: 1, w1: 20, w2: 0, b: -12 } },
      { name: "Big & Dangerous", targetWords: ["bear", "shark"],
        solution: { layers: 1, w1: 10, w2: 10, b: -14 } },
      { name: "Small & Dangerous", targetWords: ["knife", "gun"],
        solution: { layers: 1, w1: -15, w2: 15, b: -5 } },
    ],
  },
  {
    id: "animal-food",
    label: "Animal or Food?",
    xAxis: "Food ← → Animal",
    yAxis: "Small → Big",
    points: [
      { word: "ant", x: 0.80, y: 0.05 },
      { word: "cat", x: 0.90, y: 0.25 },
      { word: "dog", x: 0.75, y: 0.40 },
      { word: "horse", x: 0.90, y: 0.70 },
      { word: "elephant", x: 0.80, y: 0.95 },
      { word: "grape", x: 0.15, y: 0.05 },
      { word: "apple", x: 0.25, y: 0.15 },
      { word: "bread", x: 0.10, y: 0.30 },
      { word: "cake", x: 0.20, y: 0.40 },
      { word: "pizza", x: 0.15, y: 0.55 },
      { word: "shrimp", x: 0.45, y: 0.10 },
      { word: "chicken", x: 0.55, y: 0.30 },
      { word: "salmon", x: 0.45, y: 0.35 },
      { word: "duck", x: 0.55, y: 0.45 },
      { word: "lamb", x: 0.50, y: 0.60 },
    ],
    challenges: [
      { name: "Pure Animals", targetWords: ["ant", "cat", "dog", "horse", "elephant"],
        solution: { layers: 1, w1: 20, w2: 0, b: -14 } },
      { name: "Pure Food", targetWords: ["grape", "apple", "bread", "cake", "pizza"],
        solution: { layers: 1, w1: -20, w2: 0, b: 6 } },
      { name: "Both (Animal + Food)", targetWords: ["shrimp", "chicken", "salmon", "duck", "lamb"],
        solution: { layers: 2, wH1a: 20, wH1b: 0, bH1: -7, wH2a: -20, wH2b: 0, bH2: 13, wO1: 15, wO2: 15, bO: -20 } },
    ],
  },
  {
    id: "four-categories",
    label: "Four Categories",
    xAxis: "",
    yAxis: "",
    // Normalized from 0–10 quadrant positions to 0–1
    points: [
      { word: "ant", x: 0.13, y: 0.63 },
      { word: "cat", x: 0.22, y: 0.68 },
      { word: "dog", x: 0.28, y: 0.73 },
      { word: "horse", x: 0.37, y: 0.80 },
      { word: "elephant", x: 0.16, y: 0.87 },
      { word: "barn", x: 0.64, y: 0.63 },
      { word: "church", x: 0.68, y: 0.74 },
      { word: "l'house", x: 0.72, y: 0.70 },
      { word: "house", x: 0.80, y: 0.67 },
      { word: "sky'per", x: 0.86, y: 0.87 },
      { word: "mercury", x: 0.13, y: 0.13 },
      { word: "venus", x: 0.18, y: 0.18 },
      { word: "mars", x: 0.23, y: 0.15 },
      { word: "saturn", x: 0.34, y: 0.32 },
      { word: "jupiter", x: 0.29, y: 0.37 },
      { word: "flute", x: 0.86, y: 0.13 },
      { word: "violin", x: 0.78, y: 0.18 },
      { word: "guitar", x: 0.72, y: 0.26 },
      { word: "drum", x: 0.65, y: 0.20 },
      { word: "piano", x: 0.64, y: 0.36 },
    ],
    challenges: [
      { name: "Animals", targetWords: ["ant", "cat", "dog", "horse", "elephant"],
        solution: { layers: 2, wH1a: -20, wH1b: 0, bH1: 10, wH2a: 0, wH2b: 20, bH2: -10, wO1: 15, wO2: 15, bO: -20 } },
      { name: "Buildings", targetWords: ["barn", "church", "l'house", "house", "sky'per"],
        solution: { layers: 2, wH1a: 20, wH1b: 0, bH1: -10, wH2a: 0, wH2b: 20, bH2: -10, wO1: 15, wO2: 15, bO: -20 } },
      { name: "Planets", targetWords: ["mercury", "venus", "mars", "saturn", "jupiter"],
        solution: { layers: 2, wH1a: -20, wH1b: 0, bH1: 10, wH2a: 0, wH2b: -20, bH2: 10, wO1: 15, wO2: 15, bO: -20 } },
      { name: "Instruments", targetWords: ["flute", "violin", "guitar", "drum", "piano"],
        solution: { layers: 2, wH1a: 20, wH1b: 0, bH1: -10, wH2a: 0, wH2b: -20, bH2: 10, wO1: 15, wO2: 15, bO: -20 } },
    ],
  },
];

// --- Slider component ---

const CANVAS_SIZE = 280;

function WeightSlider({
  value, min, max, step, onChange, label, disabled,
}: {
  value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; label: string; disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-mono text-muted w-8 text-right shrink-0">{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1 accent-accent min-w-0"
        disabled={disabled}
      />
      <span className="text-[11px] font-mono font-bold text-foreground w-10 text-right shrink-0">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

// --- Main component ---

export function EmbeddingClassifier() {
  const [activeTabId, setActiveTabId] = useState<string>("size-danger");
  const [challengeIdx, setChallengeIdx] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const animRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 1-layer weights
  const [w1, setW1] = useState(0);
  const [w2, setW2] = useState(0);
  const [bias, setBias] = useState(0);

  // 2-layer weights
  const [wH1a, setWH1a] = useState(0);
  const [wH1b, setWH1b] = useState(0);
  const [bH1, setBH1] = useState(0);
  const [wH2a, setWH2a] = useState(0);
  const [wH2b, setWH2b] = useState(0);
  const [bH2, setBH2] = useState(0);
  const [wO1, setWO1] = useState(0);
  const [wO2, setWO2] = useState(0);
  const [bO, setBO] = useState(0);

  const tab = useMemo(() => TABS.find(t => t.id === activeTabId) ?? TABS[0], [activeTabId]);
  const widgetTabs = useMemo(() => TABS.map(t => ({ id: t.id, label: t.label })), []);
  const challenge = challengeIdx !== null && challengeIdx < tab.challenges.length
    ? tab.challenges[challengeIdx] : null;
  const is2Layer = challenge?.solution.layers === 2;

  const resetWeights = useCallback(() => {
    setW1(0); setW2(0); setBias(0);
    setWH1a(0); setWH1b(0); setBH1(0);
    setWH2a(0); setWH2b(0); setBH2(0);
    setWO1(0); setWO2(0); setBO(0);
  }, []);

  const cancelAnim = useCallback(() => {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = 0; }
    setIsAnimating(false);
  }, []);

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current); }, []);

  const handleTabChange = useCallback((id: string) => {
    cancelAnim(); setActiveTabId(id); setChallengeIdx(null); resetWeights();
  }, [cancelAnim, resetWeights]);

  const handleChallengeClick = useCallback((idx: number) => {
    cancelAnim(); setChallengeIdx(idx); resetWeights();
  }, [cancelAnim, resetWeights]);

  const reset = useCallback(() => {
    cancelAnim(); setActiveTabId("size-danger"); setChallengeIdx(null); resetWeights();
  }, [cancelAnim, resetWeights]);

  // Compute network output at a point
  const computeOutput = useCallback((x: number, y: number): number => {
    if (is2Layer) return forward2(x, y, wH1a, wH1b, bH1, wH2a, wH2b, bH2, wO1, wO2, bO);
    return forward1(x, y, w1, w2, bias);
  }, [is2Layer, w1, w2, bias, wH1a, wH1b, bH1, wH2a, wH2b, bH2, wO1, wO2, bO]);

  // Render heatmap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = CANVAS_SIZE;
    const imageData = ctx.createImageData(size, size);
    const res = 2;
    for (let py = 0; py < size; py += res) {
      for (let px = 0; px < size; px += res) {
        const x = px / (size - 1);
        const y = 1 - py / (size - 1);
        const out = computeOutput(x, y);
        const [r, g, bv] = outputColorRGB(out);
        for (let dy = 0; dy < res && py + dy < size; dy++) {
          for (let dx = 0; dx < res && px + dx < size; dx++) {
            const idx = ((py + dy) * size + (px + dx)) * 4;
            imageData.data[idx] = r;
            imageData.data[idx + 1] = g;
            imageData.data[idx + 2] = bv;
            imageData.data[idx + 3] = 255;
          }
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }, [computeOutput]);

  // Check solved
  const targetWords = useMemo(() => challenge ? new Set(challenge.targetWords) : null, [challenge]);
  const challengeSolved = useMemo(() => {
    if (!challenge || !targetWords) return false;
    return tab.points.every((pt) => {
      const out = computeOutput(pt.x, pt.y);
      return targetWords.has(pt.word) ? out > 0.65 : out < 0.35;
    });
  }, [challenge, targetWords, tab, computeOutput]);

  // Animate to known-good solution
  const startOptimize = useCallback(() => {
    if (!challenge) return;
    if (isAnimating) { cancelAnim(); return; }

    const sol = challenge.solution;
    const duration = 1500;
    const startTime = performance.now();

    const startVals = sol.layers === 1
      ? [w1, w2, bias]
      : [wH1a, wH1b, bH1, wH2a, wH2b, bH2, wO1, wO2, bO];
    const targetVals = sol.layers === 1
      ? [sol.w1, sol.w2, sol.b]
      : [sol.wH1a, sol.wH1b, sol.bH1, sol.wH2a, sol.wH2b, sol.bH2, sol.wO1, sol.wO2, sol.bO];
    const setters: ((v: number) => void)[] = sol.layers === 1
      ? [setW1, setW2, setBias]
      : [setWH1a, setWH1b, setBH1, setWH2a, setWH2b, setBH2, setWO1, setWO2, setBO];

    setIsAnimating(true);
    const animate = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      for (let i = 0; i < startVals.length; i++) {
        setters[i](startVals[i] + (targetVals[i] - startVals[i]) * ease);
      }
      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        animRef.current = 0;
      }
    };
    animRef.current = requestAnimationFrame(animate);
  }, [challenge, isAnimating, cancelAnim, w1, w2, bias, wH1a, wH1b, bH1, wH2a, wH2b, bH2, wO1, wO2, bO]);

  return (
    <WidgetContainer
      title="Neural Network on Embeddings"
      description="Can a neural network learn to classify words by reading their position in an embedding?"
      onReset={reset}
    >
      <WidgetTabs tabs={widgetTabs} activeTab={activeTabId} onTabChange={handleTabChange} />

      <div className="flex flex-col sm:flex-row gap-3 mt-3">
        {/* Heatmap */}
        <div className="flex-shrink-0">
          <div
            className="relative rounded-lg overflow-hidden border border-border"
            style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
          >
            <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="block" />
            <svg width={CANVAS_SIZE} height={CANVAS_SIZE} className="absolute inset-0 pointer-events-none">
              {tab.points.map((pt) => {
                const cx = pt.x * (CANVAS_SIZE - 20) + 10;
                const cy = (1 - pt.y) * (CANVAS_SIZE - 20) + 10;
                const isTarget = targetWords?.has(pt.word) ?? false;
                const out = computeOutput(pt.x, pt.y);
                const correct = targetWords ? (isTarget ? out > 0.65 : out < 0.35) : false;
                const dotColor = targetWords ? (isTarget ? "#10b981" : "#ef4444") : "#ffffff";
                const strokeColor = targetWords ? "white" : "rgba(0,0,0,0.5)";
                return (
                  <g key={pt.word}>
                    <circle cx={cx} cy={cy} r={7} fill={dotColor} opacity={0.9} />
                    <circle cx={cx} cy={cy} r={7} fill="none" stroke={strokeColor} strokeWidth={1.5} />
                    {targetWords && correct && (
                      <text x={cx} y={cy + 3} textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">&#10003;</text>
                    )}
                    <text
                      x={cx} y={cy - 10} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold"
                      stroke="rgba(0,0,0,0.6)" strokeWidth="3" paintOrder="stroke"
                    >
                      {pt.word}
                    </text>
                  </g>
                );
              })}
              {tab.xAxis && (
                <text x={CANVAS_SIZE / 2} y={CANVAS_SIZE - 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" opacity={0.7}>
                  {tab.xAxis}
                </text>
              )}
              {tab.yAxis && (
                <text x={8} y={CANVAS_SIZE / 2} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" opacity={0.7}
                  transform={`rotate(-90, 8, ${CANVAS_SIZE / 2})`}
                >
                  {tab.yAxis}
                </text>
              )}
            </svg>
          </div>
        </div>

        {/* Challenges panel */}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-semibold text-foreground mb-2">Challenges</div>
          <div className="flex flex-col gap-1.5">
            {tab.challenges.map((ch, idx) => {
              const isActive = challengeIdx === idx;
              const isSolved = isActive && challengeSolved;
              return (
                <button
                  key={ch.name}
                  onClick={() => handleChallengeClick(idx)}
                  className={`w-full text-left px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors ${
                    isSolved
                      ? "bg-success/20 text-success ring-1 ring-success/30"
                      : isActive
                      ? "bg-accent/20 text-accent ring-1 ring-accent/30"
                      : "bg-foreground/5 text-foreground hover:bg-foreground/10"
                  }`}
                >
                  {isSolved ? "\u2713 " : ""}{ch.name}
                  {ch.solution.layers === 2 && (
                    <span className="ml-1.5 text-[9px] opacity-50">(2-layer)</span>
                  )}
                </button>
              );
            })}
          </div>
          {challenge && (
            <div className="mt-3">
              <button
                onClick={startOptimize}
                disabled={challengeSolved && !isAnimating}
                className={`w-full px-3 py-2 text-[12px] font-bold rounded-md transition-colors ${
                  isAnimating
                    ? "bg-error text-white hover:bg-error/80"
                    : challengeSolved
                    ? "bg-success/20 text-success cursor-default"
                    : "bg-accent text-white hover:bg-accent/80"
                }`}
              >
                {isAnimating ? "Stop" : challengeSolved ? "Solved!" : "Optimize"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sliders — 1-layer or 2-layer depending on challenge */}
      {challenge && (
        <div className="mt-3">
          {is2Layer ? (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-foreground/[0.03] rounded-lg p-2">
                <div className="text-[10px] font-bold text-foreground mb-1">H&#8321;</div>
                <WeightSlider value={wH1a} min={-20} max={20} step={0.1} onChange={setWH1a} label="w&#8321;" disabled={isAnimating} />
                <WeightSlider value={wH1b} min={-20} max={20} step={0.1} onChange={setWH1b} label="w&#8322;" disabled={isAnimating} />
                <WeightSlider value={bH1} min={-20} max={20} step={0.1} onChange={setBH1} label="bias" disabled={isAnimating} />
              </div>
              <div className="bg-foreground/[0.03] rounded-lg p-2">
                <div className="text-[10px] font-bold text-foreground mb-1">H&#8322;</div>
                <WeightSlider value={wH2a} min={-20} max={20} step={0.1} onChange={setWH2a} label="w&#8321;" disabled={isAnimating} />
                <WeightSlider value={wH2b} min={-20} max={20} step={0.1} onChange={setWH2b} label="w&#8322;" disabled={isAnimating} />
                <WeightSlider value={bH2} min={-20} max={20} step={0.1} onChange={setBH2} label="bias" disabled={isAnimating} />
              </div>
              <div className="bg-foreground/[0.03] rounded-lg p-2">
                <div className="text-[10px] font-bold text-foreground mb-1">Output</div>
                <WeightSlider value={wO1} min={-20} max={20} step={0.1} onChange={setWO1} label="wH&#8321;" disabled={isAnimating} />
                <WeightSlider value={wO2} min={-20} max={20} step={0.1} onChange={setWO2} label="wH&#8322;" disabled={isAnimating} />
                <WeightSlider value={bO} min={-20} max={20} step={0.1} onChange={setBO} label="bias" disabled={isAnimating} />
              </div>
            </div>
          ) : (
            <div className="bg-foreground/[0.03] rounded-lg p-2">
              <div className="grid grid-cols-3 gap-3">
                <WeightSlider value={w1} min={-20} max={20} step={0.1} onChange={setW1} label="w&#8321;" disabled={isAnimating} />
                <WeightSlider value={w2} min={-20} max={20} step={0.1} onChange={setW2} label="w&#8322;" disabled={isAnimating} />
                <WeightSlider value={bias} min={-30} max={30} step={0.1} onChange={setBias} label="bias" disabled={isAnimating} />
              </div>
            </div>
          )}
        </div>
      )}
    </WidgetContainer>
  );
}
