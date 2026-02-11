"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

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

const CURVE_W = 320;
const CURVE_H = 180;
const MAP_SIZE = 220;

export function SharpnessExplorer() {
  const [sharpness, setSharpness] = useState(1.0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Base weight and bias for 1D: boundary at x=0.5
  // sigmoid(w*(x - 0.5)) = sigmoid(w*x - w*0.5)
  // so weight = w, bias = -w*0.5
  const baseW = 1;
  const baseBias = -0.5;
  const w1d = baseW * sharpness;
  const b1d = baseBias * sharpness;

  // Base weights for 2D: boundary as a diagonal line
  // Line: A + B = 1, i.e. w_A=1, w_B=1, bias=-1
  const baseWa = 1;
  const baseWb = 1;
  const baseBias2d = -1;
  const w2dA = baseWa * sharpness;
  const w2dB = baseWb * sharpness;
  const b2d = baseBias2d * sharpness;

  // Render 2D heatmap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = MAP_SIZE;
    const imageData = ctx.createImageData(size, size);
    const res = 2;
    for (let py = 0; py < size; py += res) {
      for (let px = 0; px < size; px += res) {
        const a = px / (size - 1);
        const b = 1 - py / (size - 1);
        const out = sigmoid(w2dA * a + w2dB * b + b2d);
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
  }, [w2dA, w2dB, b2d]);

  const reset = useCallback(() => setSharpness(1.0), []);

  // 1D curve points
  const curvePoints: string[] = [];
  const padX = 40;
  const padTop = 10;
  const padBot = 30;
  const plotW = CURVE_W - padX - 10;
  const plotH = CURVE_H - padTop - padBot;
  for (let i = 0; i <= 100; i++) {
    const x = i / 100; // input 0..1
    const y = sigmoid(w1d * x + b1d);
    const px = padX + x * plotW;
    const py = padTop + (1 - y) * plotH;
    curvePoints.push(`${px},${py}`);
  }

  return (
    <WidgetContainer
      title="Sharpness"
      description="Scaling all weights and bias together moves the boundary between sharp and blurry."
      onReset={reset}
    >
      <div className="flex flex-col gap-4">
        {/* Sharpness slider */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-foreground shrink-0">Sharpness</span>
          <input
            type="range"
            min={0.2}
            max={20}
            step={0.1}
            value={sharpness}
            onChange={(e) => setSharpness(parseFloat(e.target.value))}
            className="flex-1 h-1.5 accent-accent"
          />
          <span className="text-[12px] font-mono font-bold text-foreground w-10 text-right">{sharpness.toFixed(1)}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* 1D sigmoid curve */}
          <div>
            <div className="text-[10px] font-medium text-muted mb-1">
              1D: sigmoid(input) — w={w1d.toFixed(1)}, bias={b1d.toFixed(1)}
            </div>
            <svg width={CURVE_W} height={CURVE_H} className="bg-foreground/[0.03] rounded-lg border border-border">
              {/* Grid lines */}
              <line x1={padX} y1={padTop} x2={padX} y2={padTop + plotH} stroke="#e5e7eb" strokeWidth="1" />
              <line x1={padX} y1={padTop + plotH} x2={padX + plotW} y2={padTop + plotH} stroke="#e5e7eb" strokeWidth="1" />
              {/* 0.5 horizontal line */}
              <line x1={padX} y1={padTop + plotH * 0.5} x2={padX + plotW} y2={padTop + plotH * 0.5} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 3" />
              {/* Boundary vertical at x=0.5 */}
              <line x1={padX + plotW * 0.5} y1={padTop} x2={padX + plotW * 0.5} y2={padTop + plotH} stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 3" opacity={0.4} />
              {/* Axis labels */}
              <text x={padX - 4} y={padTop + 4} textAnchor="end" className="fill-muted text-[9px]">1</text>
              <text x={padX - 4} y={padTop + plotH * 0.5 + 3} textAnchor="end" className="fill-muted text-[9px]">0.5</text>
              <text x={padX - 4} y={padTop + plotH + 4} textAnchor="end" className="fill-muted text-[9px]">0</text>
              <text x={padX} y={padTop + plotH + 16} textAnchor="middle" className="fill-muted text-[9px]">0</text>
              <text x={padX + plotW * 0.5} y={padTop + plotH + 16} textAnchor="middle" className="fill-muted text-[9px]">0.5</text>
              <text x={padX + plotW} y={padTop + plotH + 16} textAnchor="middle" className="fill-muted text-[9px]">1</text>
              <text x={padX + plotW / 2} y={CURVE_H - 2} textAnchor="middle" className="fill-muted text-[9px]">input</text>
              {/* Curve */}
              <polyline
                points={curvePoints.join(" ")}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* 2D heatmap */}
          <div>
            <div className="text-[10px] font-medium text-muted mb-1">
              2D: sigmoid(wA·A + wB·B + bias) — w={w2dA.toFixed(1)}, bias={b2d.toFixed(1)}
            </div>
            <div
              className="relative rounded-lg overflow-hidden border border-border"
              style={{ width: MAP_SIZE, height: MAP_SIZE }}
            >
              <canvas
                ref={canvasRef}
                width={MAP_SIZE}
                height={MAP_SIZE}
                className="block"
              />
              <svg
                width={MAP_SIZE}
                height={MAP_SIZE}
                className="absolute inset-0 pointer-events-none"
              >
                {/* Boundary line: A + B = 1, i.e. B = 1 - A */}
                <line
                  x1={0}
                  y1={0}
                  x2={MAP_SIZE}
                  y2={MAP_SIZE}
                  stroke="white"
                  strokeWidth="1"
                  strokeDasharray="4 3"
                  opacity={0.5}
                />
                <text x={MAP_SIZE / 2} y={MAP_SIZE - 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" opacity={0.7}>
                  A →
                </text>
                <text x={6} y={MAP_SIZE / 2} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" opacity={0.7} transform={`rotate(-90, 6, ${MAP_SIZE / 2})`}>
                  B →
                </text>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
