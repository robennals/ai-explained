"use client";

import { useState, useCallback, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

const W = 480;
const PAD_L = 44;
const PAD_R = 56;
const PAD_T = 16;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = 172;
const SLIDER_Y = PAD_T + PLOT_H + 32;
const H = SLIDER_Y + 26;
const X_MIN = -8;
const X_MAX = 8;

function toSvgX(x: number): number {
  return PAD_L + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;
}
function toSvgY(y: number): number {
  return PAD_T + (1 - y) * PLOT_H;
}

// Pre-compute the curve path
const CURVE_PTS: string[] = [];
for (let i = 0; i <= 200; i++) {
  const x = X_MIN + (X_MAX - X_MIN) * (i / 200);
  const y = sigmoid(x);
  CURVE_PTS.push(
    `${i === 0 ? "M" : "L"}${toSvgX(x).toFixed(1)},${toSvgY(y).toFixed(1)}`
  );
}
const CURVE_PATH = CURVE_PTS.join(" ");

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function SigmoidExplorer() {
  const [input, setInput] = useState(0);
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const output = sigmoid(input);

  const reset = useCallback(() => setInput(0), []);

  const dotX = toSvgX(input);
  const dotY = toSvgY(output);

  const pointerToInput = useCallback((e: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const t = (svgX - PAD_L) / PLOT_W;
    setInput(
      Math.round(clamp(X_MIN + t * (X_MAX - X_MIN), X_MIN, X_MAX) * 10) / 10
    );
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
      pointerToInput(e);
    },
    [pointerToInput]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      pointerToInput(e);
    },
    [dragging, pointerToInput]
  );

  const onPointerUp = useCallback(() => setDragging(false), []);

  return (
    <WidgetContainer
      title="The Sigmoid Function"
      description="Drag the slider to trace the S-shaped curve."
      onReset={reset}
    >
      <div className="flex flex-col items-center">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full max-w-[520px]"
          style={{ cursor: dragging ? "grabbing" : undefined }}
        >
          {/* Reference lines */}
          <line
            x1={PAD_L}
            y1={toSvgY(0.5)}
            x2={PAD_L + PLOT_W}
            y2={toSvgY(0.5)}
            stroke="var(--color-border)"
            strokeWidth="0.5"
            strokeDasharray="3,3"
          />
          <line
            x1={toSvgX(0)}
            y1={PAD_T}
            x2={toSvgX(0)}
            y2={PAD_T + PLOT_H}
            stroke="var(--color-border)"
            strokeWidth="0.5"
          />
          <line
            x1={PAD_L}
            y1={toSvgY(0)}
            x2={PAD_L + PLOT_W}
            y2={toSvgY(0)}
            stroke="var(--color-border)"
            strokeWidth="0.5"
            strokeDasharray="2,4"
            opacity={0.5}
          />
          <line
            x1={PAD_L}
            y1={toSvgY(1)}
            x2={PAD_L + PLOT_W}
            y2={toSvgY(1)}
            stroke="var(--color-border)"
            strokeWidth="0.5"
            strokeDasharray="2,4"
            opacity={0.5}
          />
          {/* Axes */}
          <line
            x1={PAD_L}
            y1={PAD_T + PLOT_H}
            x2={PAD_L + PLOT_W}
            y2={PAD_T + PLOT_H}
            stroke="var(--color-border)"
            strokeWidth="1"
          />
          <line
            x1={PAD_L}
            y1={PAD_T}
            x2={PAD_L}
            y2={PAD_T + PLOT_H}
            stroke="var(--color-border)"
            strokeWidth="1"
          />
          {/* Y labels */}
          <text
            x={PAD_L - 6}
            y={toSvgY(1) + 4}
            textAnchor="end"
            className="fill-muted text-[10px]"
          >
            1
          </text>
          <text
            x={PAD_L - 6}
            y={toSvgY(0.5) + 3}
            textAnchor="end"
            className="fill-muted text-[10px]"
          >
            0.5
          </text>
          <text
            x={PAD_L - 6}
            y={toSvgY(0) + 3}
            textAnchor="end"
            className="fill-muted text-[10px]"
          >
            0
          </text>
          {/* X labels */}
          <text
            x={toSvgX(-6)}
            y={PAD_T + PLOT_H + 16}
            textAnchor="middle"
            className="fill-muted text-[10px]"
          >
            −6
          </text>
          <text
            x={toSvgX(-3)}
            y={PAD_T + PLOT_H + 16}
            textAnchor="middle"
            className="fill-muted text-[10px]"
          >
            −3
          </text>
          <text
            x={toSvgX(0)}
            y={PAD_T + PLOT_H + 16}
            textAnchor="middle"
            className="fill-muted text-[10px]"
          >
            0
          </text>
          <text
            x={toSvgX(3)}
            y={PAD_T + PLOT_H + 16}
            textAnchor="middle"
            className="fill-muted text-[10px]"
          >
            3
          </text>
          <text
            x={toSvgX(6)}
            y={PAD_T + PLOT_H + 16}
            textAnchor="middle"
            className="fill-muted text-[10px]"
          >
            6
          </text>
          {/* Y axis title */}
          <text
            x={12}
            y={PAD_T + PLOT_H / 2}
            textAnchor="middle"
            className="fill-muted text-[10px]"
            transform={`rotate(-90, 12, ${PAD_T + PLOT_H / 2})`}
          >
            output
          </text>
          {/* Sigmoid curve */}
          <path
            d={CURVE_PATH}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
          />
          {/* Crosshairs to dot */}
          <line
            x1={dotX}
            y1={PAD_T + PLOT_H}
            x2={dotX}
            y2={dotY}
            stroke="#f59e0b"
            strokeWidth="1"
            strokeDasharray="2,2"
            opacity={0.5}
          />
          <line
            x1={PAD_L}
            y1={dotY}
            x2={dotX}
            y2={dotY}
            stroke="#f59e0b"
            strokeWidth="1"
            strokeDasharray="2,2"
            opacity={0.5}
          />
          {/* Dot on curve */}
          <circle
            cx={dotX}
            cy={dotY}
            r={7}
            fill="#f59e0b"
            stroke="white"
            strokeWidth="2"
          />
          {/* Output value label */}
          <text
            x={PAD_L + PLOT_W + 10}
            y={dotY + 5}
            className="fill-foreground text-[14px] font-bold font-mono"
          >
            {output.toFixed(2)}
          </text>
          <text
            x={PAD_L + PLOT_W + 10}
            y={dotY + 19}
            className="fill-muted text-[9px]"
          >
            output
          </text>

          {/* ── SVG slider track, perfectly aligned with x-axis ── */}
          <line
            x1={PAD_L}
            y1={SLIDER_Y}
            x2={PAD_L + PLOT_W}
            y2={SLIDER_Y}
            stroke="var(--color-border)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Filled portion */}
          <line
            x1={toSvgX(X_MIN)}
            y1={SLIDER_Y}
            x2={dotX}
            y2={SLIDER_Y}
            stroke="#f59e0b"
            strokeWidth="3"
            strokeLinecap="round"
            opacity={0.4}
          />
          {/* Vertical tick from x-axis down to slider to reinforce alignment */}
          <line
            x1={dotX}
            y1={PAD_T + PLOT_H}
            x2={dotX}
            y2={SLIDER_Y}
            stroke="#f59e0b"
            strokeWidth="1"
            strokeDasharray="2,2"
            opacity={0.3}
          />
          {/* Slider thumb */}
          <circle
            cx={dotX}
            cy={SLIDER_Y}
            r={7}
            fill="#f59e0b"
            stroke="white"
            strokeWidth="2"
            style={{ cursor: dragging ? "grabbing" : "grab" }}
          />
          {/* Input value label */}
          <text
            x={PAD_L + PLOT_W + 10}
            y={SLIDER_Y + 4}
            className="fill-foreground text-[12px] font-bold font-mono"
          >
            {input.toFixed(1)}
          </text>
          <text
            x={PAD_L + PLOT_W + 10}
            y={SLIDER_Y + 16}
            className="fill-muted text-[9px]"
          >
            input
          </text>

          {/* Invisible hit area for pointer events */}
          <rect
            x={PAD_L - 10}
            y={PAD_T + PLOT_H}
            width={PLOT_W + 20}
            height={SLIDER_Y - (PAD_T + PLOT_H) + 14}
            fill="transparent"
            style={{ cursor: dragging ? "grabbing" : "grab" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
        </svg>
      </div>
    </WidgetContainer>
  );
}
