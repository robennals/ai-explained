"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
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
  targetWords: string[];
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

// Forward pass for single neuron: 2 inputs → 1 output
function forward(
  size: number, danger: number,
  wS: number, wD: number, bias: number,
): number {
  return sigmoid(wS * size + wD * danger + bias);
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
      <span className="text-[10px] font-mono text-muted w-10 text-right shrink-0">{label}</span>
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
  const [wS, setWS] = useState(0.0);
  const [wD, setWD] = useState(0.0);
  const [bias, setBias] = useState(0.0);

  const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(null);
  const [activeChallengeIdx, setActiveChallengeIdx] = useState<number | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeStatus, setOptimizeStatus] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const stateRef = useRef({ wS: 0, wD: 0, bias: 0, step: 0 });
  const retryCountRef = useRef(0);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    setWS(0.0); setWD(0.0); setBias(0.0);
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
        const x = px / (size - 1);
        const y = 1 - py / (size - 1);
        const out = forward(x, y, wS, wD, bias);
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
  }, [wS, wD, bias]);

  const challengeSolved = useMemo(() => {
    if (!activePoints) return false;
    return activePoints.every((pt) => {
      const out = forward(pt.x, pt.y, wS, wD, bias);
      return pt.target === 1 ? out > 0.8 : out < 0.2;
    });
  }, [activePoints, wS, wD, bias]);

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
    setWS(randW()); setWD(randW()); setBias((rng() - 0.5) * 2);
  }, []);

  const initRandomWeights = useCallback(() => {
    const rng = mulberry32(Date.now() + Math.random() * 1e9);
    const s = {
      wS: (rng() - 0.5) * 4,
      wD: (rng() - 0.5) * 4,
      bias: (rng() - 0.5) * 2,
      step: 0,
    };
    stateRef.current = s;
    setWS(s.wS); setWD(s.wD); setBias(s.bias);
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
      const lr = 2.0;
      const stepsPerFrame = 8;

      for (let step = 0; step < stepsPerFrame; step++) {
        let g_wS = 0, g_wD = 0, g_bias = 0;

        for (const pt of points) {
          const out = forward(pt.x, pt.y, s.wS, s.wD, s.bias);
          const dOut = out - pt.target;
          g_wS += dOut * pt.x;
          g_wD += dOut * pt.y;
          g_bias += dOut;
        }

        const n = points.length;
        const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
        s.wS = clamp(s.wS - lr * g_wS / n, -20, 20);
        s.wD = clamp(s.wD - lr * g_wD / n, -20, 20);
        s.bias = clamp(s.bias - lr * g_bias / n, -30, 30);
        s.step++;
      }

      setWS(s.wS); setWD(s.wD); setBias(s.bias);

      let allCorrect = true;
      for (const pt of points) {
        const out = forward(pt.x, pt.y, s.wS, s.wD, s.bias);
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
  const weightedSum = wS * probeInput.x + wD * probeInput.y + bias;
  const probeOut = sigmoid(weightedSum);
  const prodS = wS * probeInput.x;
  const prodD = wD * probeInput.y;

  // Full neuron diagram layout: Inputs → Sum → Activation → Output
  const NW = 620;
  const NH = 220;
  const INX = 50;
  const INA_Y = 60;
  const INB_Y = 160;
  const SUM_X = 240;
  const SUM_Y = 110;
  const ACT_X = 400;
  const ACT_Y = 110;
  const ACT_W = 100;
  const ACT_H = 68;
  const OUT_X = 560;
  const OUT_Y = 110;

  // Sigmoid curve for activation box
  const sigmoidPath = useMemo(() => {
    const pts: string[] = [];
    const pL = ACT_X - ACT_W / 2 + 8;
    const pR = ACT_X + ACT_W / 2 - 8;
    const pT = ACT_Y - ACT_H / 2 + 8;
    const pB = ACT_Y + ACT_H / 2 - 8;
    for (let i = 0; i <= 100; i++) {
      const xv = -10 + 20 * (i / 100);
      const yv = sigmoid(xv);
      pts.push(
        `${i === 0 ? "M" : "L"}${(pL + (i / 100) * (pR - pL)).toFixed(1)},${(pB - yv * (pB - pT)).toFixed(1)}`
      );
    }
    return pts.join(" ");
  }, []);

  // Operating point on sigmoid
  const opFrac = Math.max(0, Math.min(1, (weightedSum + 10) / 20));
  const pL = ACT_X - ACT_W / 2 + 8;
  const pR = ACT_X + ACT_W / 2 - 8;
  const pT = ACT_Y - ACT_H / 2 + 8;
  const pB = ACT_Y + ACT_H / 2 - 8;
  const opSx = pL + opFrac * (pR - pL);
  const opSy = pB - probeOut * (pB - pT);

  return (
    <WidgetContainer
      title="Neural Network on Embeddings"
      description="A single neuron reads 2D embedding coordinates and learns to classify words by meaning."
      onReset={reset}
    >
      <div className="flex flex-col gap-3">
        {/* Row 1: Full neuron diagram */}
        <div>
          <div className="text-[10px] font-medium text-muted mb-1">
            Neuron ({clickPos ? "clicked point" : "center"} values)
          </div>
          <svg viewBox={`0 0 ${NW} ${NH}`} className="w-full" style={{ maxHeight: 240 }}>
            <defs>
              <marker id="ec-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca3af" />
              </marker>
            </defs>

            {/* Input: Size */}
            <text x={INX} y={INA_Y - 22} textAnchor="middle" className="fill-foreground text-[11px] font-bold pointer-events-none select-none">Size</text>
            <circle cx={INX} cy={INA_Y} r={18} fill="#f0f4ff" stroke="#3b82f6" strokeWidth="2" />
            <text x={INX} y={INA_Y + 5} textAnchor="middle" className="fill-accent text-[12px] font-bold font-mono pointer-events-none select-none">
              {probeInput.x.toFixed(2)}
            </text>

            {/* Input: Danger */}
            <text x={INX} y={INB_Y - 22} textAnchor="middle" className="fill-foreground text-[11px] font-bold pointer-events-none select-none">Danger</text>
            <circle cx={INX} cy={INB_Y} r={18} fill="#f0f4ff" stroke="#3b82f6" strokeWidth="2" />
            <text x={INX} y={INB_Y + 5} textAnchor="middle" className="fill-accent text-[12px] font-bold font-mono pointer-events-none select-none">
              {probeInput.y.toFixed(2)}
            </text>

            {/* Arrow: Size → Sum */}
            <line x1={INX + 20} y1={INA_Y} x2={SUM_X - 24} y2={SUM_Y} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#ec-arrow)" />
            {/* Weight label on arrow */}
            <text x={130} y={INA_Y - 4} textAnchor="middle" className="fill-muted text-[9px] font-mono pointer-events-none select-none">w={wS.toFixed(1)}</text>
            {/* Product label near sum end */}
            <text x={195} y={INA_Y + 0.7 * (SUM_Y - INA_Y) - 6} textAnchor="middle" className="fill-muted text-[8px] font-mono pointer-events-none select-none">
              ={prodS.toFixed(1)}
            </text>

            {/* Arrow: Danger → Sum */}
            <line x1={INX + 20} y1={INB_Y} x2={SUM_X - 24} y2={SUM_Y} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#ec-arrow)" />
            {/* Weight label on arrow */}
            <text x={130} y={INB_Y + 14} textAnchor="middle" className="fill-muted text-[9px] font-mono pointer-events-none select-none">w={wD.toFixed(1)}</text>
            {/* Product label near sum end */}
            <text x={195} y={INB_Y + 0.7 * (SUM_Y - INB_Y) + 14} textAnchor="middle" className="fill-muted text-[8px] font-mono pointer-events-none select-none">
              ={prodD.toFixed(1)}
            </text>

            {/* Sum node */}
            <text x={SUM_X} y={SUM_Y - 28} textAnchor="middle" className="fill-foreground text-[11px] font-bold pointer-events-none select-none">Sum</text>
            <circle cx={SUM_X} cy={SUM_Y} r={22} fill="#fef9ee" stroke="#f59e0b" strokeWidth="2" />
            <text x={SUM_X} y={SUM_Y + 5} textAnchor="middle" className="fill-warning text-[13px] font-bold font-mono pointer-events-none select-none">
              {weightedSum.toFixed(1)}
            </text>

            {/* Bias arrow into sum from below */}
            <line x1={SUM_X} y1={SUM_Y + 46} x2={SUM_X} y2={SUM_Y + 24} stroke="#9ca3af" strokeWidth="1" strokeDasharray="3,2" markerEnd="url(#ec-arrow)" />
            <text x={SUM_X} y={SUM_Y + 58} textAnchor="middle" className="fill-muted text-[9px] font-mono pointer-events-none select-none">bias={bias.toFixed(1)}</text>

            {/* Arrow: Sum → Activation */}
            <line x1={SUM_X + 24} y1={SUM_Y} x2={ACT_X - ACT_W / 2 - 4} y2={ACT_Y} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#ec-arrow)" />

            {/* Activation function box */}
            <rect x={ACT_X - ACT_W / 2} y={ACT_Y - ACT_H / 2} width={ACT_W} height={ACT_H} rx={8} fill="#f0fdf4" stroke="#10b981" strokeWidth="2" />
            <text x={ACT_X} y={ACT_Y - ACT_H / 2 - 6} textAnchor="middle" className="fill-success text-[8px] font-semibold uppercase tracking-wider pointer-events-none select-none">
              Activation
            </text>
            {/* Sigmoid curve */}
            <path d={sigmoidPath} fill="none" stroke="#10b981" strokeWidth="2" />
            {/* Operating point crosshairs */}
            <line x1={opSx} y1={pB} x2={opSx} y2={opSy} stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,2" opacity={0.6} />
            <line x1={pL} y1={opSy} x2={opSx} y2={opSy} stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,2" opacity={0.6} />
            <circle cx={opSx} cy={opSy} r={4} fill="#f59e0b" stroke="white" strokeWidth="1.5" />

            {/* Arrow: Activation → Output */}
            <line x1={ACT_X + ACT_W / 2 + 2} y1={ACT_Y} x2={OUT_X - 22} y2={OUT_Y} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#ec-arrow)" />

            {/* Output node */}
            <text x={OUT_X} y={OUT_Y - 26} textAnchor="middle" className="fill-foreground text-[11px] font-bold pointer-events-none select-none">Output</text>
            <circle cx={OUT_X} cy={OUT_Y} r={22} fill={outputColor(probeOut)} stroke={outputColor(probeOut)} strokeWidth="2" />
            <text x={OUT_X} y={OUT_Y + 5} textAnchor="middle" className="fill-white text-[14px] font-bold font-mono pointer-events-none select-none">
              {probeOut.toFixed(2)}
            </text>
          </svg>
        </div>

        {/* Row 2: Sliders */}
        <div className="bg-foreground/[0.03] rounded-lg p-2">
          <div className="grid grid-cols-3 gap-3">
            <WeightSlider value={wS} min={-20} max={20} step={0.1} onChange={setWS} label="wSize" />
            <WeightSlider value={wD} min={-20} max={20} step={0.1} onChange={setWD} label="wDanger" />
            <WeightSlider value={bias} min={-30} max={30} step={0.1} onChange={setBias} label="bias" />
          </div>
        </div>

        {/* Row 2: Canvas + Challenges */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Canvas */}
          <div className="flex-shrink-0">
            <div className="text-[10px] font-medium text-muted mb-1">
              Neuron output across embedding space
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
                  const out = forward(w.x, w.y, wS, wD, bias);
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
                    Solved! The neuron learned to classify by meaning.
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
