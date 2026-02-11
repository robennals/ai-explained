"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";

const POINTS = [-2, -1, -0.5, 0.5, 1, 2];
const COLORS = [
  "#3b82f6",
  "#3b82f6",
  "#3b82f6",
  "#3b82f6",
  "#22c55e",
  "#3b82f6",
];

const RANGE = 5;
const LINE_X_START = 60;
const LINE_X_END = 540;
const Y_IN = 50;
const Y_OUT = 140;

function toX(value: number): number {
  return (
    LINE_X_START +
    ((value + RANGE) / (2 * RANGE)) * (LINE_X_END - LINE_X_START)
  );
}

export function Transform1D() {
  const [scalar, setScalar] = useState(2);

  const handleReset = useCallback(() => setScalar(2), []);

  return (
    <WidgetContainer
      title="1D Transformation"
      description="A &lsquo;matrix&rsquo; in one dimension is just a single number"
      onReset={handleReset}
    >
      <svg viewBox="0 0 600 190" className="w-full">
        {/* Input number line */}
        <line
          x1={LINE_X_START}
          y1={Y_IN}
          x2={LINE_X_END}
          y2={Y_IN}
          stroke="#d1d5db"
          strokeWidth={1.5}
        />
        <text x={25} y={Y_IN + 4} fontSize={11} fill="#6b7280" fontWeight="600">
          input
        </text>

        {/* Input tick marks */}
        {Array.from({ length: 2 * RANGE + 1 }, (_, i) => i - RANGE).map(
          (v) => (
            <g key={`ti-${v}`}>
              <line
                x1={toX(v)}
                y1={Y_IN - 4}
                x2={toX(v)}
                y2={Y_IN + 4}
                stroke="#9ca3af"
                strokeWidth={1}
              />
              <text
                x={toX(v)}
                y={Y_IN - 10}
                textAnchor="middle"
                fontSize={10}
                fill="#9ca3af"
              >
                {v}
              </text>
            </g>
          )
        )}

        {/* Output number line */}
        <line
          x1={LINE_X_START}
          y1={Y_OUT}
          x2={LINE_X_END}
          y2={Y_OUT}
          stroke="#d1d5db"
          strokeWidth={1.5}
        />
        <text
          x={18}
          y={Y_OUT + 4}
          fontSize={11}
          fill="#6b7280"
          fontWeight="600"
        >
          output
        </text>

        {/* Output tick marks */}
        {Array.from({ length: 2 * RANGE + 1 }, (_, i) => i - RANGE).map(
          (v) => (
            <g key={`to-${v}`}>
              <line
                x1={toX(v)}
                y1={Y_OUT - 4}
                x2={toX(v)}
                y2={Y_OUT + 4}
                stroke="#9ca3af"
                strokeWidth={1}
              />
              <text
                x={toX(v)}
                y={Y_OUT + 16}
                textAnchor="middle"
                fontSize={10}
                fill="#9ca3af"
              >
                {v}
              </text>
            </g>
          )
        )}

        {/* Zero always stays */}
        <circle
          cx={toX(0)}
          cy={Y_IN}
          r={3}
          fill="#9ca3af"
          stroke="#6b7280"
          strokeWidth={1}
        />
        <circle
          cx={toX(0)}
          cy={Y_OUT}
          r={3}
          fill="#9ca3af"
          stroke="#6b7280"
          strokeWidth={1}
        />

        {/* Points and connections */}
        {POINTS.map((p, i) => {
          const inX = toX(p);
          const outVal = p * scalar;
          const clampedOut = Math.max(-RANGE, Math.min(RANGE, outVal));
          const outX = toX(clampedOut);
          const isClipped = Math.abs(outVal) > RANGE;

          return (
            <g key={i}>
              <line
                x1={inX}
                y1={Y_IN + 6}
                x2={outX}
                y2={Y_OUT - 6}
                stroke={COLORS[i]}
                strokeWidth={1.5}
                opacity={0.35}
                strokeDasharray={isClipped ? "3,3" : "none"}
              />
              <circle cx={inX} cy={Y_IN} r={5} fill={COLORS[i]} />
              <circle
                cx={outX}
                cy={Y_OUT}
                r={5}
                fill={COLORS[i]}
                opacity={isClipped ? 0.3 : 1}
              />
            </g>
          );
        })}

        {/* Equation display */}
        <text
          x={300}
          y={178}
          textAnchor="middle"
          fontSize={13}
          fill="#6b7280"
          fontFamily="var(--font-mono)"
        >
          output = {scalar.toFixed(1)} × input
        </text>
      </svg>

      <div className="mt-2 space-y-2">
        <SliderControl
          label="Multiply by"
          value={scalar}
          min={-3}
          max={3}
          step={0.1}
          onChange={setScalar}
          formatValue={(v) => v.toFixed(1)}
        />
      </div>

      <div className="mt-3 text-center text-sm text-muted">
        {scalar === 0 && <span>Everything collapses to zero</span>}
        {scalar === 1 && <span>Identity — nothing changes</span>}
        {scalar === -1 && <span>Everything flips across zero</span>}
        {Math.abs(scalar) > 1 && (
          <span>
            Stretching by {Math.abs(scalar).toFixed(1)}×
            {scalar < 0 ? " and flipping" : ""}
          </span>
        )}
        {Math.abs(scalar) > 0 && Math.abs(scalar) < 1 && (
          <span>
            Shrinking to {Math.abs(scalar).toFixed(1)}×
            {scalar < 0 ? " and flipping" : ""}
          </span>
        )}
      </div>
    </WidgetContainer>
  );
}
