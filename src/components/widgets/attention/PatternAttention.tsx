"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

const SHAPES = ["circle", "square", "triangle", "star"] as const;
type Shape = (typeof SHAPES)[number];

const COLORS = [
  { name: "red", bg: "bg-red-400", text: "text-red-600", hex: "#f87171" },
  { name: "blue", bg: "bg-blue-400", text: "text-blue-600", hex: "#60a5fa" },
  { name: "green", bg: "bg-green-400", text: "text-green-600", hex: "#4ade80" },
  { name: "yellow", bg: "bg-yellow-400", text: "text-yellow-600", hex: "#facc15" },
];

const ATTENTION_WEIGHTS = [0.05, 0.85, 0.05, 0.05];

interface SymbolToken {
  shape: Shape;
  colorIndex: number;
}

function randomShape(): Shape {
  return SHAPES[Math.floor(Math.random() * SHAPES.length)];
}

function randomColorIndex(): number {
  return Math.floor(Math.random() * COLORS.length);
}

function generateSequence(): SymbolToken[] {
  return [
    { shape: randomShape(), colorIndex: randomColorIndex() },
    { shape: randomShape(), colorIndex: randomColorIndex() },
    { shape: randomShape(), colorIndex: randomColorIndex() },
    { shape: randomShape(), colorIndex: randomColorIndex() },
  ];
}

function ShapeSVG({
  shape,
  color,
  size = 32,
}: {
  shape: Shape;
  color: string;
  size?: number;
}) {
  const half = size / 2;
  switch (shape) {
    case "circle":
      return <circle cx={half} cy={half} r={half * 0.8} fill={color} />;
    case "square":
      return (
        <rect
          x={half * 0.2}
          y={half * 0.2}
          width={size * 0.8}
          height={size * 0.8}
          rx={2}
          fill={color}
        />
      );
    case "triangle":
      return (
        <polygon
          points={`${half},${size * 0.1} ${size * 0.9},${size * 0.9} ${size * 0.1},${size * 0.9}`}
          fill={color}
        />
      );
    case "star": {
      const cx = half;
      const cy = half;
      const outerR = half * 0.85;
      const innerR = half * 0.35;
      const points: string[] = [];
      for (let i = 0; i < 5; i++) {
        const outerAngle = (Math.PI / 2) * -1 + (2 * Math.PI * i) / 5;
        const innerAngle = outerAngle + Math.PI / 5;
        points.push(
          `${cx + outerR * Math.cos(outerAngle)},${cy + outerR * Math.sin(outerAngle)}`
        );
        points.push(
          `${cx + innerR * Math.cos(innerAngle)},${cy + innerR * Math.sin(innerAngle)}`
        );
      }
      return <polygon points={points.join(" ")} fill={color} />;
    }
  }
}

export function PatternAttention() {
  const [sequence, setSequence] = useState<SymbolToken[]>(generateSequence);

  const handleReset = useCallback(() => {
    setSequence(generateSequence());
  }, []);

  const predictionColor = COLORS[sequence[1].colorIndex];
  const predictionShape = randomShape();

  // Layout positions for the 5 slots (4 tokens + prediction)
  const slotWidth = 80;
  const totalWidth = slotWidth * 5 + 40;
  const slotY = 50;
  const predX = 4 * slotWidth + slotWidth / 2 + 20;
  const predY = slotY + 20;

  return (
    <WidgetContainer
      title="Pattern Attention"
      description="Which position does the model look at to predict the next symbol?"
      onReset={handleReset}
    >
      <div className="flex flex-col items-center gap-4">
        {/* SVG visualization */}
        <svg
          viewBox={`0 0 ${totalWidth} 160`}
          className="w-full max-w-lg"
          aria-label="Pattern attention visualization"
        >
          {/* Attention lines from prediction to each token */}
          {sequence.map((_, i) => {
            const fromX = predX;
            const fromY = predY;
            const toX = i * slotWidth + slotWidth / 2 + 10;
            const toY = slotY + 40;
            const weight = ATTENTION_WEIGHTS[i];
            return (
              <line
                key={`line-${i}`}
                x1={fromX}
                y1={fromY}
                x2={toX}
                y2={toY}
                stroke="#6366f1"
                strokeWidth={weight * 6 + 0.5}
                opacity={weight * 0.9 + 0.1}
              />
            );
          })}

          {/* Token shapes */}
          {sequence.map((token, i) => {
            const x = i * slotWidth + slotWidth / 2 + 10;
            return (
              <g key={`token-${i}`}>
                <svg x={x - 20} y={slotY - 10} width={40} height={40}>
                  <ShapeSVG
                    shape={token.shape}
                    color={COLORS[token.colorIndex].hex}
                    size={40}
                  />
                </svg>
                <text
                  x={x}
                  y={slotY + 50}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#94a3b8"
                  fontFamily="monospace"
                >
                  pos {i + 1}
                </text>
              </g>
            );
          })}

          {/* Prediction slot */}
          <g>
            <rect
              x={predX - 24}
              y={slotY - 14}
              width={48}
              height={48}
              rx={8}
              fill="none"
              stroke="#6366f1"
              strokeWidth={2}
              strokeDasharray="4,3"
            />
            <svg x={predX - 20} y={slotY - 10} width={40} height={40}>
              <ShapeSVG
                shape={predictionShape}
                color={predictionColor.hex}
                size={40}
              />
            </svg>
            <text
              x={predX}
              y={slotY + 50}
              textAnchor="middle"
              fontSize={11}
              fill="#6366f1"
              fontWeight="bold"
              fontFamily="monospace"
            >
              prediction
            </text>
          </g>
        </svg>

        {/* Attention weight bars */}
        <div className="flex w-full max-w-lg justify-between gap-2 px-2">
          {ATTENTION_WEIGHTS.map((weight, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="relative h-16 w-full rounded bg-foreground/5">
                <div
                  className="absolute bottom-0 w-full rounded bg-indigo-500 transition-all"
                  style={{ height: `${weight * 100}%`, opacity: 0.3 + weight * 0.7 }}
                />
              </div>
              <span className="font-mono text-[10px] text-muted">
                {(weight * 100).toFixed(0)}%
              </span>
              <span className="text-[10px] text-muted">pos {i + 1}</span>
            </div>
          ))}
        </div>

        {/* New Sequence button */}
        <button
          onClick={() => setSequence(generateSequence())}
          className="rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-dark"
        >
          New Sequence
        </button>

        {/* Message */}
        <div className="rounded-lg border border-border bg-surface px-4 py-3 text-center text-sm text-foreground">
          The model learned to <strong>always look at position 2</strong> — no
          matter what&apos;s in the other positions!
        </div>
      </div>
    </WidgetContainer>
  );
}
