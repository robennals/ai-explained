"use client";

import { WidgetContainer } from "../shared/WidgetContainer";

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

interface Region {
  label: string;
  description: string;
  color: string;
  xMin: number;
  xMax: number;
}

const REGIONS: Region[] = [
  {
    label: "Exponential growth",
    description: "\"It's taking off!\"",
    color: "#f59e0b",
    xMin: -6,
    xMax: -1,
  },
  {
    label: "Linear",
    description: "\"Steady progress\"",
    color: "#3b82f6",
    xMin: -1.5,
    xMax: 1.5,
  },
  {
    label: "Diminishing returns",
    description: "\"Hitting a ceiling\"",
    color: "#ef4444",
    xMin: 1,
    xMax: 6,
  },
];

// Main curve layout
const MW = 480;
const MH = 160;
const ML = 36;
const MR = 12;
const MT = 12;
const MB = 20;
const MPW = MW - ML - MR;
const MPH = MH - MT - MB;
const MX_MIN = -8;
const MX_MAX = 8;

function mx(x: number) {
  return ML + ((x - MX_MIN) / (MX_MAX - MX_MIN)) * MPW;
}
function my(y: number) {
  return MT + (1 - y) * MPH;
}

// Pre-compute main curve
const MAIN_PATH: string[] = [];
for (let i = 0; i <= 200; i++) {
  const x = MX_MIN + (MX_MAX - MX_MIN) * (i / 200);
  const y = sigmoid(x);
  MAIN_PATH.push(
    `${i === 0 ? "M" : "L"}${mx(x).toFixed(1)},${my(y).toFixed(1)}`
  );
}
const MAIN_CURVE = MAIN_PATH.join(" ");

// Zoom panel layout
const ZW = 152;
const ZH = 100;
const ZP = 6;
const ZPW = ZW - ZP * 2;
const ZPH = ZH - ZP * 2;

// Pre-compute zoom curves
const ZOOM_CURVES = REGIONS.map((r) => {
  const yMin = sigmoid(r.xMin);
  const yMax = sigmoid(r.xMax);
  const yRange = yMax - yMin;
  const yPad = yRange * 0.08;
  const yLo = yMin - yPad;
  const yHi = yMax + yPad;

  const pts: string[] = [];
  for (let j = 0; j <= 100; j++) {
    const x = r.xMin + (r.xMax - r.xMin) * (j / 100);
    const y = sigmoid(x);
    const px = ZP + ((x - r.xMin) / (r.xMax - r.xMin)) * ZPW;
    const py = ZP + ((yHi - y) / (yHi - yLo)) * ZPH;
    pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  return pts.join(" ");
});

export function SigmoidZoom() {
  return (
    <WidgetContainer
      title="S-Curves Are Everywhere"
      description="Zoom into three regions of the sigmoid to see three familiar patterns."
    >
      <div className="flex flex-col items-center gap-4">
        {/* Main sigmoid with highlighted regions */}
        <svg viewBox={`0 0 ${MW} ${MH}`} className="w-full max-w-[520px]">
          {/* Axes */}
          <line
            x1={ML}
            y1={MT + MPH}
            x2={ML + MPW}
            y2={MT + MPH}
            stroke="var(--color-border)"
            strokeWidth="0.5"
          />
          <line
            x1={ML}
            y1={MT}
            x2={ML}
            y2={MT + MPH}
            stroke="var(--color-border)"
            strokeWidth="0.5"
          />
          {/* 0.5 line */}
          <line
            x1={ML}
            y1={my(0.5)}
            x2={ML + MPW}
            y2={my(0.5)}
            stroke="var(--color-border)"
            strokeWidth="0.5"
            strokeDasharray="3,3"
          />
          {/* Y labels */}
          <text
            x={ML - 4}
            y={my(1) + 4}
            textAnchor="end"
            className="fill-muted text-[9px]"
          >
            1
          </text>
          <text
            x={ML - 4}
            y={my(0.5) + 3}
            textAnchor="end"
            className="fill-muted text-[9px]"
          >
            .5
          </text>
          <text
            x={ML - 4}
            y={my(0) + 3}
            textAnchor="end"
            className="fill-muted text-[9px]"
          >
            0
          </text>
          {/* Region highlights */}
          {REGIONS.map((r, i) => {
            const x1 = mx(r.xMin);
            const x2 = mx(r.xMax);
            return (
              <g key={i}>
                <rect
                  x={x1}
                  y={MT}
                  width={x2 - x1}
                  height={MPH}
                  fill={r.color}
                  opacity={0.1}
                  rx={2}
                />
                <rect
                  x={x1}
                  y={MT}
                  width={x2 - x1}
                  height={MPH}
                  fill="none"
                  stroke={r.color}
                  strokeWidth="1.5"
                  opacity={0.4}
                  rx={2}
                />
              </g>
            );
          })}
          {/* Curve on top */}
          <path d={MAIN_CURVE} fill="none" stroke="#10b981" strokeWidth="2.5" />
        </svg>

        {/* Zoom panels */}
        <div className="flex flex-wrap gap-4 justify-center">
          {REGIONS.map((r, i) => (
            <div key={i} className="flex flex-col items-center">
              <svg
                width={ZW}
                height={ZH}
                className="rounded-lg border-2 bg-foreground/[0.02]"
                style={{ borderColor: r.color + "40" }}
              >
                <polyline
                  points={ZOOM_CURVES[i]}
                  fill="none"
                  stroke={r.color}
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="mt-1.5 text-center max-w-[160px]">
                <div
                  className="text-[11px] font-semibold"
                  style={{ color: r.color }}
                >
                  {r.label}
                </div>
                <div className="text-[10px] text-muted leading-tight">
                  {r.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </WidgetContainer>
  );
}
