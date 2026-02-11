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

const INPUT_COMBOS: [number, number][] = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
];

type ChallengeName = "XOR" | "XNOR";

const CHALLENGES: Record<ChallengeName, { targets: number[]; label: string }> = {
  XOR: { targets: [0, 1, 1, 0], label: "XOR (one but not both)" },
  XNOR: { targets: [1, 0, 0, 1], label: "XNOR (both same)" },
};

// Forward pass for 2→2→1
function forward2Layer(
  a: number,
  b: number,
  wH1a: number, wH1b: number, bH1: number,
  wH2a: number, wH2b: number, bH2: number,
  wO1: number, wO2: number, bO: number,
): { h1: number; h2: number; out: number } {
  const h1 = sigmoid(wH1a * a + wH1b * b + bH1);
  const h2 = sigmoid(wH2a * a + wH2b * b + bH2);
  const out = sigmoid(wO1 * h1 + wO2 * h2 + bO);
  return { h1, h2, out };
}

// Binary cross-entropy loss for a single sample
function bceLoss(output: number, target: number): number {
  const eps = 1e-7;
  const o = Math.max(eps, Math.min(1 - eps, output));
  return -(target * Math.log(o) + (1 - target) * Math.log(1 - o));
}

// Compact MiniSlider for SVG
function MiniSlider({
  x,
  y,
  value,
  min,
  max,
  step,
  onChange,
  label,
  showValue = true,
  width = 70,
}: {
  x: number;
  y: number;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  label: string;
  showValue?: boolean;
  width?: number;
}) {
  return (
    <foreignObject x={x - width / 2} y={y} width={width} height={60} style={{ overflow: "visible" }}>
      <div className="flex flex-col items-center" style={{ overflow: "visible" }}>
        {label && (
          <div className="text-[9px] font-bold text-foreground whitespace-nowrap leading-none">
            {label}
          </div>
        )}
        {showValue && (
          <div className="font-mono font-bold text-foreground text-[11px] leading-none">
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
            className="w-full h-1 accent-accent"
          />
        </div>
      </div>
    </foreignObject>
  );
}

const CANVAS_SIZE = 280;

export function TwoLayerPlayground() {
  // Hidden layer 1 weights/bias
  const [wH1a, setWH1a] = useState(8.0);
  const [wH1b, setWH1b] = useState(8.0);
  const [bH1, setBH1] = useState(-4.0);
  // Hidden layer 2 weights/bias
  const [wH2a, setWH2a] = useState(-8.0);
  const [wH2b, setWH2b] = useState(-8.0);
  const [bH2, setBH2] = useState(12.0);
  // Output weights/bias
  const [wO1, setWO1] = useState(10.0);
  const [wO2, setWO2] = useState(10.0);
  const [bO, setBO] = useState(-15.0);

  const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<ChallengeName | null>(null);
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
    setActiveChallenge(null);
    setIsOptimizing(false);
    setOptimizeStatus(null);
    if (animRef.current) cancelAnimationFrame(animRef.current);
  }, []);

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

  const challengeTargets = useMemo(() => {
    if (!activeChallenge) return null;
    return CHALLENGES[activeChallenge].targets;
  }, [activeChallenge]);

  const challengeSolved = useMemo(() => {
    if (!challengeTargets) return false;
    return challengeTargets.every((t, i) => {
      const [a, b] = INPUT_COMBOS[i];
      const { out } = forward2Layer(a, b, wH1a, wH1b, bH1, wH2a, wH2b, bH2, wO1, wO2, bO);
      return t === 1 ? out > 0.8 : out < 0.2;
    });
  }, [challengeTargets, wH1a, wH1b, bH1, wH2a, wH2b, bH2, wO1, wO2, bO]);

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

  const activateChallenge = useCallback((name: ChallengeName) => {
    setActiveChallenge(name);
    setIsOptimizing(false);
    setOptimizeStatus(null);
    if (animRef.current) cancelAnimationFrame(animRef.current);
  }, []);

  const startOptimize = useCallback(() => {
    if (!challengeTargets) return;
    if (isOptimizing) {
      setIsOptimizing(false);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }
    setIsOptimizing(true);
    setOptimizeStatus(null);
    stateRef.current = {
      wH1a, wH1b, bH1,
      wH2a, wH2b, bH2,
      wO1, wO2, bO,
      step: 0,
    };

    const targets = challengeTargets;
    const maxSteps = 500;

    const animate = () => {
      const s = stateRef.current;
      const lr = 1.5;
      const stepsPerFrame = 3;

      for (let step = 0; step < stepsPerFrame; step++) {
        // Accumulate gradients over 4 corners
        let g_wH1a = 0, g_wH1b = 0, g_bH1 = 0;
        let g_wH2a = 0, g_wH2b = 0, g_bH2 = 0;
        let g_wO1 = 0, g_wO2 = 0, g_bO = 0;

        for (let i = 0; i < 4; i++) {
          const [a, b] = INPUT_COMBOS[i];
          // Forward
          const z1 = s.wH1a * a + s.wH1b * b + s.bH1;
          const h1 = sigmoid(z1);
          const z2 = s.wH2a * a + s.wH2b * b + s.bH2;
          const h2 = sigmoid(z2);
          const zO = s.wO1 * h1 + s.wO2 * h2 + s.bO;
          const out = sigmoid(zO);

          // BCE gradient: d_loss/d_out = (out - target) / (out * (1-out)), times sigmoid deriv = out - target
          const dOut = out - targets[i];

          // Output layer gradients
          g_wO1 += dOut * h1;
          g_wO2 += dOut * h2;
          g_bO += dOut;

          // Hidden layer gradients (backprop through output layer)
          const dH1 = dOut * s.wO1 * sigmoidDeriv(h1);
          const dH2 = dOut * s.wO2 * sigmoidDeriv(h2);

          g_wH1a += dH1 * a;
          g_wH1b += dH1 * b;
          g_bH1 += dH1;

          g_wH2a += dH2 * a;
          g_wH2b += dH2 * b;
          g_bH2 += dH2;
        }

        const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
        s.wH1a = clamp(s.wH1a - lr * g_wH1a, -15, 15);
        s.wH1b = clamp(s.wH1b - lr * g_wH1b, -15, 15);
        s.bH1 = clamp(s.bH1 - lr * g_bH1, -20, 20);
        s.wH2a = clamp(s.wH2a - lr * g_wH2a, -15, 15);
        s.wH2b = clamp(s.wH2b - lr * g_wH2b, -15, 15);
        s.bH2 = clamp(s.bH2 - lr * g_bH2, -20, 20);
        s.wO1 = clamp(s.wO1 - lr * g_wO1, -15, 15);
        s.wO2 = clamp(s.wO2 - lr * g_wO2, -15, 15);
        s.bO = clamp(s.bO - lr * g_bO, -20, 20);
        s.step++;
      }

      setWH1a(s.wH1a); setWH1b(s.wH1b); setBH1(s.bH1);
      setWH2a(s.wH2a); setWH2b(s.wH2b); setBH2(s.bH2);
      setWO1(s.wO1); setWO2(s.wO2); setBO(s.bO);

      // Check convergence
      let totalLoss = 0;
      for (let i = 0; i < 4; i++) {
        const [a, b] = INPUT_COMBOS[i];
        const { out } = forward2Layer(a, b, s.wH1a, s.wH1b, s.bH1, s.wH2a, s.wH2b, s.bH2, s.wO1, s.wO2, s.bO);
        totalLoss += bceLoss(out, targets[i]);
      }

      if (totalLoss < 0.2) {
        setIsOptimizing(false);
        setOptimizeStatus("solved");
        return;
      }
      if (s.step >= maxSteps) {
        setIsOptimizing(false);
        setOptimizeStatus("done");
        return;
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
  }, [isOptimizing, wH1a, wH1b, bH1, wH2a, wH2b, bH2, wO1, wO2, bO, challengeTargets]);

  // Probed values
  const probeInput = clickPos ?? { x: 0.5, y: 0.5 };
  const { h1: probeH1, h2: probeH2, out: probeOut } = forward2Layer(
    probeInput.x, probeInput.y,
    wH1a, wH1b, bH1, wH2a, wH2b, bH2, wO1, wO2, bO
  );

  // Network diagram SVG layout
  const NW = 520;
  const NH = 300;
  const INX = 40;
  const INA_Y = 80;
  const INB_Y = 220;
  const HX = 220;
  const H1_Y = 80;
  const H2_Y = 220;
  const OX = 440;
  const OY = 150;

  return (
    <WidgetContainer
      title="Two-Layer Playground"
      description="Two hidden neurons combine their boundaries to solve problems one neuron can't."
      onReset={reset}
    >
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 2D Canvas */}
        <div className="flex-shrink-0">
          <div className="text-[10px] font-medium text-muted mb-1">
            Network output across input space
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
              {/* Challenge dots at corners */}
              {challengeTargets &&
                INPUT_COMBOS.map(([a, b], i) => {
                  const cx = a * (CANVAS_SIZE - 20) + 10;
                  const cy = (1 - b) * (CANVAS_SIZE - 20) + 10;
                  const target = challengeTargets[i];
                  const { out } = forward2Layer(a, b, wH1a, wH1b, bH1, wH2a, wH2b, bH2, wO1, wO2, bO);
                  const correct = target === 1 ? out > 0.8 : out < 0.2;
                  return (
                    <g key={i}>
                      <circle cx={cx} cy={cy} r={12} fill={target === 1 ? "#10b981" : "#ef4444"} opacity={0.9} />
                      <circle cx={cx} cy={cy} r={12} fill="none" stroke="white" strokeWidth={2} />
                      {correct && (
                        <text x={cx} y={cy + 4} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                          &#10003;
                        </text>
                      )}
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
                Input A →
              </text>
              <text x={8} y={CANVAS_SIZE / 2} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" opacity={0.7} transform={`rotate(-90, 8, ${CANVAS_SIZE / 2})`}>
                Input B →
              </text>
            </svg>
          </div>
        </div>

        {/* Network Diagram */}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-medium text-muted mb-1">
            Network ({clickPos ? "clicked point" : "center"} values)
          </div>
          <svg viewBox={`0 0 ${NW} ${NH}`} className="w-full">
            <defs>
              <marker id="tl-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca3af" />
              </marker>
            </defs>

            {/* Input A */}
            <text x={INX} y={INA_Y - 22} textAnchor="middle" className="fill-foreground text-[11px] font-bold pointer-events-none select-none">A</text>
            <circle cx={INX} cy={INA_Y} r={18} fill="#f0f4ff" stroke="#3b82f6" strokeWidth="2" />
            <text x={INX} y={INA_Y + 4} textAnchor="middle" className="fill-accent text-[12px] font-bold font-mono pointer-events-none select-none">
              {probeInput.x.toFixed(2)}
            </text>

            {/* Input B */}
            <text x={INX} y={INB_Y - 22} textAnchor="middle" className="fill-foreground text-[11px] font-bold pointer-events-none select-none">B</text>
            <circle cx={INX} cy={INB_Y} r={18} fill="#f0f4ff" stroke="#3b82f6" strokeWidth="2" />
            <text x={INX} y={INB_Y + 4} textAnchor="middle" className="fill-accent text-[12px] font-bold font-mono pointer-events-none select-none">
              {probeInput.y.toFixed(2)}
            </text>

            {/* --- Arrows: A → H1 --- */}
            <line x1={INX + 20} y1={INA_Y} x2={HX - 22} y2={H1_Y} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#tl-arrow)" />
            <MiniSlider x={120} y={INA_Y - 40} value={wH1a} min={-15} max={15} step={0.1} onChange={setWH1a} label="w" />

            {/* --- Arrows: B → H1 --- */}
            <line x1={INX + 20} y1={INB_Y} x2={HX - 22} y2={H1_Y} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#tl-arrow)" />
            <MiniSlider x={100} y={138} value={wH1b} min={-15} max={15} step={0.1} onChange={setWH1b} label="w" />

            {/* --- Arrows: A → H2 --- */}
            <line x1={INX + 20} y1={INA_Y} x2={HX - 22} y2={H2_Y} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#tl-arrow)" />
            <MiniSlider x={140} y={138} value={wH2a} min={-15} max={15} step={0.1} onChange={setWH2a} label="w" />

            {/* --- Arrows: B → H2 --- */}
            <line x1={INX + 20} y1={INB_Y} x2={HX - 22} y2={H2_Y} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#tl-arrow)" />
            <MiniSlider x={120} y={INB_Y + 10} value={wH2b} min={-15} max={15} step={0.1} onChange={setWH2b} label="w" />

            {/* Hidden H1 */}
            <text x={HX} y={H1_Y - 24} textAnchor="middle" className="fill-foreground text-[10px] font-bold pointer-events-none select-none">H1</text>
            <circle cx={HX} cy={H1_Y} r={20} fill={outputColor(probeH1)} stroke={outputColor(probeH1)} strokeWidth="2" />
            <text x={HX} y={H1_Y + 4} textAnchor="middle" className="fill-white text-[11px] font-bold font-mono pointer-events-none select-none">
              {probeH1.toFixed(2)}
            </text>
            {/* H1 bias */}
            <MiniSlider x={HX} y={H1_Y + 22} value={bH1} min={-20} max={20} step={0.1} onChange={setBH1} label="bias" />

            {/* Hidden H2 */}
            <text x={HX} y={H2_Y - 24} textAnchor="middle" className="fill-foreground text-[10px] font-bold pointer-events-none select-none">H2</text>
            <circle cx={HX} cy={H2_Y} r={20} fill={outputColor(probeH2)} stroke={outputColor(probeH2)} strokeWidth="2" />
            <text x={HX} y={H2_Y + 4} textAnchor="middle" className="fill-white text-[11px] font-bold font-mono pointer-events-none select-none">
              {probeH2.toFixed(2)}
            </text>
            {/* H2 bias */}
            <MiniSlider x={HX} y={H2_Y + 22} value={bH2} min={-20} max={20} step={0.1} onChange={setBH2} label="bias" />

            {/* --- Arrows: H1 → Out --- */}
            <line x1={HX + 22} y1={H1_Y} x2={OX - 22} y2={OY} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#tl-arrow)" />
            <MiniSlider x={340} y={H1_Y - 20} value={wO1} min={-15} max={15} step={0.1} onChange={setWO1} label="w" />

            {/* --- Arrows: H2 → Out --- */}
            <line x1={HX + 22} y1={H2_Y} x2={OX - 22} y2={OY} stroke="#9ca3af" strokeWidth="1.5" markerEnd="url(#tl-arrow)" />
            <MiniSlider x={340} y={OY + 30} value={wO2} min={-15} max={15} step={0.1} onChange={setWO2} label="w" />

            {/* Output */}
            <text x={OX} y={OY - 26} textAnchor="middle" className="fill-foreground text-[10px] font-bold pointer-events-none select-none">Output</text>
            <circle cx={OX} cy={OY} r={22} fill={outputColor(probeOut)} stroke={outputColor(probeOut)} strokeWidth="2" />
            <text x={OX} y={OY + 4} textAnchor="middle" className="fill-white text-[13px] font-bold font-mono pointer-events-none select-none">
              {probeOut.toFixed(2)}
            </text>
            {/* Output bias */}
            <MiniSlider x={OX} y={OY + 24} value={bO} min={-20} max={20} step={0.1} onChange={setBO} label="bias" />
          </svg>

          {/* Challenges */}
          <div className="mt-1">
            <div className="text-[10px] font-semibold text-foreground mb-1">Challenges</div>
            <div className="flex flex-wrap gap-1.5 items-center">
              {(Object.keys(CHALLENGES) as ChallengeName[]).map((name) => (
                <button
                  key={name}
                  onClick={() => activateChallenge(name)}
                  className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                    challengeSolved && activeChallenge === name
                      ? "bg-success/20 text-success"
                      : activeChallenge === name
                      ? "bg-accent/20 text-accent"
                      : "bg-foreground/5 text-foreground hover:bg-foreground/10"
                  }`}
                >
                  {challengeSolved && activeChallenge === name ? "✓ " : ""}{name}
                </button>
              ))}
              {activeChallenge && (
                <>
                  <button
                    onClick={startOptimize}
                    className={`px-3 py-1 text-[10px] font-medium rounded-md transition-colors ${
                      isOptimizing
                        ? "bg-error text-white hover:bg-error/80"
                        : "bg-accent text-white hover:bg-accent/80"
                    }`}
                  >
                    {isOptimizing ? "Stop" : "Optimize"}
                  </button>
                  {optimizeStatus === "solved" && (
                    <span className="text-[10px] font-medium text-success">Solved!</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
