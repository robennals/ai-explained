"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
}

function sigmoidDeriv(out: number): number {
  return out * (1 - out);
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

// --- Word data points (normalized 0–1 from Size × Danger scatter) ---

interface WordDataPoint {
  word: string;
  x: number; // size (0 = small, 1 = big)
  y: number; // danger (0 = safe, 1 = dangerous)
}

const WORDS: WordDataPoint[] = [
  { word: "ant",      x: 0.05, y: 0.03 },
  { word: "dog",      x: 0.45, y: 0.25 },
  { word: "horse",    x: 0.70, y: 0.20 },
  { word: "bear",     x: 0.80, y: 0.85 },
  { word: "elephant", x: 0.95, y: 0.35 },
  { word: "shark",    x: 0.75, y: 0.90 },
  { word: "bread",    x: 0.20, y: 0.00 },
  { word: "cake",     x: 0.35, y: 0.00 },
  { word: "pizza",    x: 0.25, y: 0.00 },
  { word: "car",      x: 0.55, y: 0.40 },
  { word: "truck",    x: 0.80, y: 0.50 },
  { word: "guitar",   x: 0.35, y: 0.05 },
  { word: "piano",    x: 0.65, y: 0.00 },
  { word: "knife",    x: 0.15, y: 0.70 },
  { word: "gun",      x: 0.15, y: 1.00 },
];

// --- Challenge system ---

interface Challenge {
  name: string;
  description: string;
  targetWords: string[]; // words that should be target=1
}

const CHALLENGES: Challenge[] = [
  {
    name: "Dangerous",
    description: "Find things that are dangerous (bear, shark, knife, gun)",
    targetWords: ["bear", "shark", "knife", "gun"],
  },
  {
    name: "Big",
    description: "Find things that are big (horse, bear, elephant, shark, truck, piano)",
    targetWords: ["horse", "bear", "elephant", "shark", "truck", "piano"],
  },
  {
    name: "Big & Dangerous",
    description: "Find things that are BOTH big and dangerous (bear, shark)",
    targetWords: ["bear", "shark"],
  },
  {
    name: "Small & Dangerous",
    description: "Find things that are small but dangerous (knife, gun)",
    targetWords: ["knife", "gun"],
  },
];

function getChallengePoints(challenge: Challenge): { word: string; x: number; y: number; target: number }[] {
  return WORDS.map((w) => ({
    word: w.word,
    x: w.x,
    y: w.y,
    target: challenge.targetWords.includes(w.word) ? 1 : 0,
  }));
}

// Forward pass for 2→2→1
function forward2Layer(
  a: number, b: number,
  wH1a: number, wH1b: number, bH1: number,
  wH2a: number, wH2b: number, bH2: number,
  wO1: number, wO2: number, bO: number,
): { h1: number; h2: number; out: number } {
  const h1 = sigmoid(wH1a * a + wH1b * b + bH1);
  const h2 = sigmoid(wH2a * a + wH2b * b + bH2);
  const out = sigmoid(wO1 * h1 + wO2 * h2 + bO);
  return { h1, h2, out };
}

const CANVAS_SIZE = 280;

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function WeightSlider({
  value, min, max, step, onChange, label,
}: {
  value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-mono text-muted w-7 text-right shrink-0">{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1 accent-accent min-w-0"
      />
      <span className="text-[11px] font-mono font-bold text-foreground w-10 text-right shrink-0">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

export function EmbeddingClassifier() {
  const [wH1a, setWH1a] = useState(8.0);
  const [wH1b, setWH1b] = useState(8.0);
  const [bH1, setBH1] = useState(-4.0);
  const [wH2a, setWH2a] = useState(-8.0);
  const [wH2b, setWH2b] = useState(-8.0);
  const [bH2, setBH2] = useState(12.0);
  const [wO1, setWO1] = useState(10.0);
  const [wO2, setWO2] = useState(10.0);
  const [bO, setBO] = useState(-15.0);

  const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(null);
  const [activeChallengeIdx, setActiveChallengeIdx] = useState<number | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeStatus, setOptimizeStatus] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const stateRef = useRef({
    wH1a: 8, wH1b: 8, bH1: -4,
    wH2a: -8, wH2b: -8, bH2: 12,
    wO1: 10, wO2: 10, bO: -15,
    step: 0,
  });
  const retryCountRef = useRef(0);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    setWH1a(8.0); setWH1b(8.0); setBH1(-4.0);
    setWH2a(-8.0); setWH2b(-8.0); setBH2(12.0);
    setWO1(10.0); setWO2(10.0); setBO(-15.0);
    setClickPos(null);
    setActiveChallengeIdx(null);
    setIsOptimizing(false);
    setOptimizeStatus(null);
    if (animRef.current) cancelAnimationFrame(animRef.current);
  }, []);

  const activeChallenge = activeChallengeIdx !== null ? CHALLENGES[activeChallengeIdx] : null;
  const activePoints = activeChallenge ? getChallengePoints(activeChallenge) : null;

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
        const a = px / (size - 1);
        const b = 1 - py / (size - 1);
        const { out } = forward2Layer(a, b, wH1a, wH1b, bH1, wH2a, wH2b, bH2, wO1, wO2, bO);
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
  }, [wH1a, wH1b, bH1, wH2a, wH2b, bH2, wO1, wO2, bO]);

  const challengeSolved = useMemo(() => {
    if (!activePoints) return false;
    return activePoints.every((pt) => {
      const { out } = forward2Layer(pt.x, pt.y, wH1a, wH1b, bH1, wH2a, wH2b, bH2, wO1, wO2, bO);
      return pt.target === 1 ? out > 0.8 : out < 0.2;
    });
  }, [activePoints, wH1a, wH1b, bH1, wH2a, wH2b, bH2, wO1, wO2, bO]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const x = Math.max(0, Math.min(1, px / rect.width));
      const y = Math.max(0, Math.min(1, 1 - py / rect.height));
      setClickPos({ x, y });
    },
    []
  );

  const activateChallenge = useCallback((idx: number) => {
    setActiveChallengeIdx(idx);
    setIsOptimizing(false);
    setOptimizeStatus(null);
    if (animRef.current) cancelAnimationFrame(animRef.current);
  }, []);

  const randomizeWeights = useCallback(() => {
    setIsOptimizing(false);
    setOptimizeStatus(null);
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const rng = mulberry32(Date.now());
    const randW = () => (rng() - 0.5) * 4;
    const randB = () => (rng() - 0.5) * 2;
    setWH1a(randW()); setWH1b(randW()); setBH1(randB());
    setWH2a(randW()); setWH2b(randW()); setBH2(randB());
    setWO1(randW()); setWO2(randW()); setBO(randB());
  }, []);

  const initRandomWeights = useCallback(() => {
    const rng = mulberry32(Date.now() + Math.random() * 1e9);
    const randW = () => (rng() - 0.5) * 4;
    const randB = () => (rng() - 0.5) * 2;
    const s = {
      wH1a: randW(), wH1b: randW(), bH1: randB(),
      wH2a: randW(), wH2b: randW(), bH2: randB(),
      wO1: randW(), wO2: randW(), bO: randB(),
      step: 0,
    };
    stateRef.current = s;
    setWH1a(s.wH1a); setWH1b(s.wH1b); setBH1(s.bH1);
    setWH2a(s.wH2a); setWH2b(s.wH2b); setBH2(s.bH2);
    setWO1(s.wO1); setWO2(s.wO2); setBO(s.bO);
  }, []);

  const startOptimize = useCallback(() => {
    if (!activeChallenge) return;
    if (isOptimizing) {
      setIsOptimizing(false);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }
    setIsOptimizing(true);
    setOptimizeStatus(null);
    retryCountRef.current = 0;

    initRandomWeights();

    const points = getChallengePoints(activeChallenge);
    const maxSteps = 3000;

    const animate = () => {
      const s = stateRef.current;
      const lr = 1.5;
      const stepsPerFrame = 5;

      for (let step = 0; step < stepsPerFrame; step++) {
        let g_wH1a = 0, g_wH1b = 0, g_bH1 = 0;
        let g_wH2a = 0, g_wH2b = 0, g_bH2 = 0;
        let g_wO1 = 0, g_wO2 = 0, g_bO = 0;

        for (const pt of points) {
          const a = pt.x, b = pt.y;
          const z1 = s.wH1a * a + s.wH1b * b + s.bH1;
          const h1 = sigmoid(z1);
          const z2 = s.wH2a * a + s.wH2b * b + s.bH2;
          const h2 = sigmoid(z2);
          const zO = s.wO1 * h1 + s.wO2 * h2 + s.bO;
          const out = sigmoid(zO);

          const dOut = out - pt.target;

          g_wO1 += dOut * h1;
          g_wO2 += dOut * h2;
          g_bO += dOut;

          const dH1 = dOut * s.wO1 * sigmoidDeriv(h1);
          const dH2 = dOut * s.wO2 * sigmoidDeriv(h2);

          g_wH1a += dH1 * a;
          g_wH1b += dH1 * b;
          g_bH1 += dH1;

          g_wH2a += dH2 * a;
          g_wH2b += dH2 * b;
          g_bH2 += dH2;
        }

        const n = points.length;
        const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
        s.wH1a = clamp(s.wH1a - lr * g_wH1a / n, -20, 20);
        s.wH1b = clamp(s.wH1b - lr * g_wH1b / n, -20, 20);
        s.bH1 = clamp(s.bH1 - lr * g_bH1 / n, -30, 30);
        s.wH2a = clamp(s.wH2a - lr * g_wH2a / n, -20, 20);
        s.wH2b = clamp(s.wH2b - lr * g_wH2b / n, -20, 20);
        s.bH2 = clamp(s.bH2 - lr * g_bH2 / n, -30, 30);
        s.wO1 = clamp(s.wO1 - lr * g_wO1 / n, -20, 20);
        s.wO2 = clamp(s.wO2 - lr * g_wO2 / n, -20, 20);
        s.bO = clamp(s.bO - lr * g_bO / n, -30, 30);
        s.step++;
      }

      setWH1a(s.wH1a); setWH1b(s.wH1b); setBH1(s.bH1);
      setWH2a(s.wH2a); setWH2b(s.wH2b); setBH2(s.bH2);
      setWO1(s.wO1); setWO2(s.wO2); setBO(s.bO);

      let allCorrect = true;
      for (const pt of points) {
        const { out } = forward2Layer(pt.x, pt.y, s.wH1a, s.wH1b, s.bH1, s.wH2a, s.wH2b, s.bH2, s.wO1, s.wO2, s.bO);
        if (pt.target === 1 ? out <= 0.8 : out >= 0.2) allCorrect = false;
      }

      if (allCorrect) {
        setIsOptimizing(false);
        setOptimizeStatus("solved");
        return;
      }

      if (s.step >= maxSteps) {
        if (retryCountRef.current < 3) {
          retryCountRef.current++;
          initRandomWeights();
          animRef.current = requestAnimationFrame(animate);
          return;
        }
        setIsOptimizing(false);
        setOptimizeStatus("done");
        return;
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
  }, [isOptimizing, activeChallenge, initRandomWeights]);

  // Probed values
  const probeInput = clickPos ?? { x: 0.5, y: 0.5 };
  const { h1: probeH1, h2: probeH2, out: probeOut } = forward2Layer(
    probeInput.x, probeInput.y,
    wH1a, wH1b, bH1, wH2a, wH2b, bH2, wO1, wO2, bO
  );

  // Network diagram SVG layout
  const NW = 520;
  const NH = 180;
  const INX = 50;
  const INA_Y = 50;
  const INB_Y = 130;
  const HX = 220;
  const H1_Y = 50;
  const H2_Y = 130;
  const OX = 420;
  const OY = 90;

  return (
    <WidgetContainer
      title="Neural Network on Embeddings"
      description="A neural network reads 2D embedding coordinates and learns to classify words by meaning."
      onReset={reset}
    >
      <div className="flex flex-col gap-3">
        {/* Row 1: Network Diagram */}
        <div>
          <div className="text-[10px] font-medium text-muted mb-1">
            Network ({clickPos ? "clicked point" : "center"} values)
          </div>
          <svg viewBox={`0 0 ${NW} ${NH}`} className="w-full" style={{ maxHeight: 200 }}>
            <defs>
              <marker id="ec-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca3af" />
              </marker>
            </defs>

            {/* Input: Size */}
            <text x={INX} y={INA_Y - 20} textAnchor="middle" className="fill-foreground text-[10px] font-bold pointer-events-none select-none">Size</text>
            <circle cx={INX} cy={INA_Y} r={16} fill="#f0f4ff" stroke="#3b82f6" strokeWidth="2" />
            <text x={INX} y={INA_Y + 4} textAnchor="middle" className="fill-accent text-[11px] font-bold font-mono pointer-events-none select-none">
              {probeInput.x.toFixed(2)}
            </text>

            {/* Input: Danger */}
            <text x={INX} y={INB_Y - 20} textAnchor="middle" className="fill-foreground text-[10px] font-bold pointer-events-none select-none">Danger</text>
            <circle cx={INX} cy={INB_Y} r={16} fill="#f0f4ff" stroke="#3b82f6" strokeWidth="2" />
            <text x={INX} y={INB_Y + 4} textAnchor="middle" className="fill-accent text-[11px] font-bold font-mono pointer-events-none select-none">
              {probeInput.y.toFixed(2)}
            </text>

            {/* Arrows */}
            <line x1={INX + 18} y1={INA_Y} x2={HX - 20} y2={H1_Y} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#ec-arrow)" />
            <line x1={INX + 18} y1={INB_Y} x2={HX - 20} y2={H1_Y + 10} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#ec-arrow)" />
            <line x1={INX + 18} y1={INA_Y} x2={HX - 20} y2={H2_Y - 10} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#ec-arrow)" />
            <line x1={INX + 18} y1={INB_Y} x2={HX - 20} y2={H2_Y} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#ec-arrow)" />

            {/* Hidden H1 */}
            <text x={HX} y={H1_Y - 22} textAnchor="middle" className="fill-foreground text-[10px] font-bold pointer-events-none select-none">H1</text>
            <circle cx={HX} cy={H1_Y} r={18} fill={outputColor(probeH1)} stroke={outputColor(probeH1)} strokeWidth="2" />
            <text x={HX} y={H1_Y + 4} textAnchor="middle" className="fill-white text-[11px] font-bold font-mono pointer-events-none select-none">
              {probeH1.toFixed(2)}
            </text>

            {/* Hidden H2 */}
            <text x={HX} y={H2_Y - 22} textAnchor="middle" className="fill-foreground text-[10px] font-bold pointer-events-none select-none">H2</text>
            <circle cx={HX} cy={H2_Y} r={18} fill={outputColor(probeH2)} stroke={outputColor(probeH2)} strokeWidth="2" />
            <text x={HX} y={H2_Y + 4} textAnchor="middle" className="fill-white text-[11px] font-bold font-mono pointer-events-none select-none">
              {probeH2.toFixed(2)}
            </text>

            {/* Arrows: H → Out */}
            <line x1={HX + 20} y1={H1_Y} x2={OX - 20} y2={OY - 5} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#ec-arrow)" />
            <line x1={HX + 20} y1={H2_Y} x2={OX - 20} y2={OY + 5} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#ec-arrow)" />

            {/* Output */}
            <text x={OX} y={OY - 24} textAnchor="middle" className="fill-foreground text-[10px] font-bold pointer-events-none select-none">Output</text>
            <circle cx={OX} cy={OY} r={20} fill={outputColor(probeOut)} stroke={outputColor(probeOut)} strokeWidth="2" />
            <text x={OX} y={OY + 5} textAnchor="middle" className="fill-white text-[13px] font-bold font-mono pointer-events-none select-none">
              {probeOut.toFixed(2)}
            </text>

            {/* Weight labels */}
            <text x={(INX + HX) / 2 - 15} y={INA_Y - 12} textAnchor="middle" className="fill-muted text-[9px] font-mono pointer-events-none select-none">{wH1a.toFixed(1)}</text>
            <text x={(INX + HX) / 2 - 30} y={(INA_Y + INB_Y) / 2 - 12} textAnchor="middle" className="fill-muted text-[9px] font-mono pointer-events-none select-none">{wH1b.toFixed(1)}</text>
            <text x={(INX + HX) / 2 + 10} y={(INA_Y + INB_Y) / 2 + 14} textAnchor="middle" className="fill-muted text-[9px] font-mono pointer-events-none select-none">{wH2a.toFixed(1)}</text>
            <text x={(INX + HX) / 2 - 15} y={INB_Y + 14} textAnchor="middle" className="fill-muted text-[9px] font-mono pointer-events-none select-none">{wH2b.toFixed(1)}</text>
            <text x={(HX + OX) / 2} y={H1_Y - 8} textAnchor="middle" className="fill-muted text-[9px] font-mono pointer-events-none select-none">{wO1.toFixed(1)}</text>
            <text x={(HX + OX) / 2} y={H2_Y + 14} textAnchor="middle" className="fill-muted text-[9px] font-mono pointer-events-none select-none">{wO2.toFixed(1)}</text>
          </svg>
        </div>

        {/* Row 2: Slider Groups */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-foreground/[0.03] rounded-lg p-2">
            <div className="text-[10px] font-bold text-foreground mb-1">H1</div>
            <div className="flex flex-col gap-1">
              <WeightSlider value={wH1a} min={-20} max={20} step={0.1} onChange={setWH1a} label="wS" />
              <WeightSlider value={wH1b} min={-20} max={20} step={0.1} onChange={setWH1b} label="wD" />
              <WeightSlider value={bH1} min={-30} max={30} step={0.1} onChange={setBH1} label="bias" />
            </div>
          </div>
          <div className="bg-foreground/[0.03] rounded-lg p-2">
            <div className="text-[10px] font-bold text-foreground mb-1">H2</div>
            <div className="flex flex-col gap-1">
              <WeightSlider value={wH2a} min={-20} max={20} step={0.1} onChange={setWH2a} label="wS" />
              <WeightSlider value={wH2b} min={-20} max={20} step={0.1} onChange={setWH2b} label="wD" />
              <WeightSlider value={bH2} min={-30} max={30} step={0.1} onChange={setBH2} label="bias" />
            </div>
          </div>
          <div className="bg-foreground/[0.03] rounded-lg p-2">
            <div className="text-[10px] font-bold text-foreground mb-1">Output</div>
            <div className="flex flex-col gap-1">
              <WeightSlider value={wO1} min={-20} max={20} step={0.1} onChange={setWO1} label="wH1" />
              <WeightSlider value={wO2} min={-20} max={20} step={0.1} onChange={setWO2} label="wH2" />
              <WeightSlider value={bO} min={-30} max={30} step={0.1} onChange={setBO} label="bias" />
            </div>
          </div>
        </div>

        {/* Row 3: Canvas + Challenges */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Canvas */}
          <div className="flex-shrink-0">
            <div className="text-[10px] font-medium text-muted mb-1">
              Network output across embedding space
            </div>
            <div
              className="relative rounded-lg overflow-hidden border border-border cursor-crosshair"
              style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
              onClick={handleCanvasClick}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                className="block"
              />
              <svg
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                className="absolute inset-0 pointer-events-none"
              >
                {/* Word dots */}
                {WORDS.map((w) => {
                  const cx = w.x * (CANVAS_SIZE - 20) + 10;
                  const cy = (1 - w.y) * (CANVAS_SIZE - 20) + 10;
                  const point = activePoints?.find((p) => p.word === w.word);
                  const isTarget = point?.target === 1;
                  const { out } = forward2Layer(w.x, w.y, wH1a, wH1b, bH1, wH2a, wH2b, bH2, wO1, wO2, bO);
                  const correct = activePoints
                    ? (isTarget ? out > 0.8 : out < 0.2)
                    : false;
                  const dotColor = activePoints
                    ? (isTarget ? "#10b981" : "#ef4444")
                    : "#ffffff";
                  const strokeColor = activePoints
                    ? "white"
                    : "rgba(0,0,0,0.5)";
                  return (
                    <g key={w.word}>
                      <circle cx={cx} cy={cy} r={8} fill={dotColor} opacity={0.9} />
                      <circle cx={cx} cy={cy} r={8} fill="none" stroke={strokeColor} strokeWidth={1.5} />
                      {activePoints && correct && (
                        <text x={cx} y={cy + 3.5} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">
                          &#10003;
                        </text>
                      )}
                      <text
                        x={cx}
                        y={cy - 12}
                        textAnchor="middle"
                        fill="white"
                        fontSize="10"
                        fontWeight="bold"
                        stroke="rgba(0,0,0,0.6)"
                        strokeWidth="3"
                        paintOrder="stroke"
                      >
                        {w.word}
                      </text>
                    </g>
                  );
                })}
                {/* Click marker */}
                {clickPos && (
                  <circle
                    cx={clickPos.x * CANVAS_SIZE}
                    cy={(1 - clickPos.y) * CANVAS_SIZE}
                    r={5}
                    fill={outputColor(probeOut)}
                    stroke="white"
                    strokeWidth={2}
                  />
                )}
                {/* Axis labels */}
                <text x={CANVAS_SIZE / 2} y={CANVAS_SIZE - 4} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" opacity={0.7}>
                  Small → Big
                </text>
                <text x={8} y={CANVAS_SIZE / 2} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" opacity={0.7} transform={`rotate(-90, 8, ${CANVAS_SIZE / 2})`}>
                  Safe → Dangerous
                </text>
              </svg>
            </div>
          </div>

          {/* Challenges Panel */}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold text-foreground mb-2">Challenges</div>
            <div className="flex flex-col gap-1.5">
              {CHALLENGES.map((ch, idx) => (
                <button
                  key={ch.name}
                  onClick={() => activateChallenge(idx)}
                  className={`w-full text-left px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors ${
                    challengeSolved && activeChallengeIdx === idx
                      ? "bg-success/20 text-success ring-1 ring-success/30"
                      : activeChallengeIdx === idx
                      ? "bg-accent/20 text-accent ring-1 ring-accent/30"
                      : "bg-foreground/5 text-foreground hover:bg-foreground/10"
                  }`}
                >
                  {challengeSolved && activeChallengeIdx === idx ? "\u2713 " : ""}
                  {ch.name}
                </button>
              ))}
            </div>
            {activeChallenge && (
              <div className="mt-2">
                <div className="text-[10px] text-muted mb-2">{activeChallenge.description}</div>
                <button
                  onClick={startOptimize}
                  className={`w-full px-3 py-2 text-[12px] font-bold rounded-md transition-colors ${
                    isOptimizing
                      ? "bg-error text-white hover:bg-error/80"
                      : "bg-accent text-white hover:bg-accent/80"
                  }`}
                >
                  {isOptimizing ? "Stop" : "Optimize"}
                </button>
                {optimizeStatus === "solved" && (
                  <div className="mt-1.5 text-[11px] font-medium text-success text-center">
                    Solved! The network learned to classify by meaning.
                  </div>
                )}
                {optimizeStatus === "done" && (
                  <div className="mt-1.5 text-[11px] text-accent text-center">
                    Got stuck — try again, gradient descent sometimes needs a different starting point.
                  </div>
                )}
                <button
                  onClick={randomizeWeights}
                  className="mt-2 w-full px-3 py-1.5 text-[11px] font-medium rounded-md bg-foreground/5 text-foreground hover:bg-foreground/10 transition-colors"
                >
                  Randomize Weights
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
