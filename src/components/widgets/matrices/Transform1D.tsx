"use client";

import { useState, useCallback, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";
import { useSvgFontSize, useSvgTextScale } from "../shared/useSvgScale";

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

// Phones: start the number lines further right so the enlarged
// "input"/"output" labels fit in the left margin.
const PHONE_LINE_X_START = 110;
const PHONE_LINE_X_END = 570;

export function Transform1D() {
  const svgRef = useRef<SVGSVGElement>(null);
  const ts = useSvgTextScale(svgRef, 600);
  const fontSize = useSvgFontSize(svgRef, 600);
  const squeezed = ts > 1;
  const lineStart = squeezed ? PHONE_LINE_X_START : LINE_X_START;
  const lineEnd = squeezed ? PHONE_LINE_X_END : LINE_X_END;
  const toX = (value: number) =>
    lineStart + ((value + RANGE) / (2 * RANGE)) * (lineEnd - lineStart);
  // Leave room below the output line for its (scaled) numbers and the equation.
  const eqY = Y_OUT + 14 + 24 * ts;
  const svgH = eqY + 12;
  const [scalar, setScalar] = useState(2);

  const handleReset = useCallback(() => setScalar(2), []);

  return (
    <WidgetContainer
      title="1D Transformation"
      description="A &lsquo;matrix&rsquo; in one dimension is just a single number"
      onReset={handleReset}
    >
      <svg ref={svgRef} viewBox={`0 0 600 ${svgH}`} className="w-full">
        {/* Input number line */}
        <line
          x1={lineStart}
          y1={Y_IN}
          x2={lineEnd}
          y2={Y_IN}
          stroke="#d1d5db"
          strokeWidth={1.5}
        />
        <text
          x={squeezed ? lineStart - 16 : 25}
          y={Y_IN + 4}
          textAnchor={squeezed ? "end" : "start"}
          fontSize={fontSize(11)}
          fill="#6b7280"
          fontWeight="600"
        >
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
                fontSize={fontSize(10)}
                fill="#9ca3af"
              >
                {v}
              </text>
            </g>
          )
        )}

        {/* Output number line */}
        <line
          x1={lineStart}
          y1={Y_OUT}
          x2={lineEnd}
          y2={Y_OUT}
          stroke="#d1d5db"
          strokeWidth={1.5}
        />
        <text
          x={squeezed ? lineStart - 16 : 18}
          y={Y_OUT + 4}
          textAnchor={squeezed ? "end" : "start"}
          fontSize={fontSize(11)}
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
                y={Y_OUT + 6 + 10 * ts}
                textAnchor="middle"
                fontSize={fontSize(10)}
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
          y={eqY}
          textAnchor="middle"
          fontSize={fontSize(13)}
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
