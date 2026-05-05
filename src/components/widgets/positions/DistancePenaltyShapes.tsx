"use client";

import { WidgetContainer } from "../shared/WidgetContainer";

interface Shape {
  id: string;
  title: string;
  alibiCan: boolean;
  /** attention level (0..1) at a given distance */
  score: (d: number) => number;
  task: string;
}

const N_POSITIONS = 50;

const SHAPES: Shape[] = [
  {
    id: "linear",
    title: "Steady decline",
    alibiCan: true,
    score: (d) => Math.max(0.05, 1 - d * 0.02),
    task:
      "Each step further away costs the same amount of attention. ALiBi can do exactly this — pick a slope and that's the falloff for every word in the head. Steady, but rigid.",
  },
  {
    id: "sharp",
    title: "Sharp local focus",
    alibiCan: false,
    score: (d) => 0.05 + 0.95 * Math.exp(-d * 0.7),
    task:
      "Almost all attention within 4–5 words, almost nothing beyond. Useful for a word like \"the\" that just needs the next noun, or for a verb finding its nearby subject. The right answer is almost always within a handful of words, so looking far away just adds noise.",
  },
  {
    id: "wide",
    title: "Wide and flat",
    alibiCan: false,
    score: (d) => 0.55 + 0.45 * Math.exp(-d * 0.04),
    task:
      "Roughly equal attention out to 40+ words. Useful for figuring out a paragraph's topic, or whether the writing is happy or sad. Every word contributes a little, and a word 30 positions back matters about as much as one 5 positions back.",
  },
  {
    id: "twostage",
    title: "Close focus + long tail",
    alibiCan: false,
    score: (d) =>
      0.6 * Math.exp(-d * 0.5) + 0.4 * Math.max(0.1, 1 - d * 0.015),
    task:
      "Strong attention nearby, then a steady low level reaching far back. Useful for pronouns like \"he\" or \"she\" that usually refer to a nearby name but sometimes need to reach back to the start of a story. Or for code, where a variable is usually defined a few lines up but might come from an import at the top of the file.",
  },
];

function ShapeChart({
  score,
  alibiCan,
}: {
  score: (d: number) => number;
  alibiCan: boolean;
}) {
  const W = 240;
  const H = 100;
  const pad = { left: 22, right: 8, top: 8, bottom: 18 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const pts: string[] = [];
  for (let d = 0; d <= N_POSITIONS; d++) {
    const x = pad.left + (d / N_POSITIONS) * plotW;
    const y = pad.top + plotH - score(d) * plotH;
    pts.push(`${d === 0 ? "M" : "L"} ${x} ${y}`);
  }
  const fillPath = `${pts.join(" ")} L ${pad.left + plotW} ${
    pad.top + plotH
  } L ${pad.left} ${pad.top + plotH} Z`;

  // Color: blue for ALiBi-possible (matches the slope card in ALiBi widget), purple for needs-RoPE
  const stroke = alibiCan ? "rgb(59 130 246)" : "rgb(168 85 247)";
  const fill = alibiCan ? "rgba(59, 130, 246, 0.15)" : "rgba(168, 85, 247, 0.15)";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden>
      {/* gridlines */}
      {[0.25, 0.5, 0.75].map((frac) => (
        <line
          key={frac}
          x1={pad.left}
          y1={pad.top + plotH - frac * plotH}
          x2={pad.left + plotW}
          y2={pad.top + plotH - frac * plotH}
          stroke="currentColor"
          strokeWidth={0.5}
          opacity={0.06}
        />
      ))}
      {/* axes */}
      <line
        x1={pad.left}
        y1={pad.top + plotH}
        x2={pad.left + plotW}
        y2={pad.top + plotH}
        stroke="currentColor"
        strokeWidth={0.5}
        opacity={0.3}
      />
      <line
        x1={pad.left}
        y1={pad.top}
        x2={pad.left}
        y2={pad.top + plotH}
        stroke="currentColor"
        strokeWidth={0.5}
        opacity={0.3}
      />
      {/* fill under curve */}
      <path d={fillPath} fill={fill} />
      {/* curve */}
      <path d={pts.join(" ")} fill="none" stroke={stroke} strokeWidth={2} />
      {/* axis labels */}
      <text
        x={pad.left + plotW / 2}
        y={H - 4}
        textAnchor="middle"
        fontSize={9}
        opacity={0.5}
        fill="currentColor"
      >
        distance from word →
      </text>
      <text
        x={4}
        y={pad.top + plotH / 2}
        fontSize={9}
        opacity={0.5}
        fill="currentColor"
        transform={`rotate(-90, 4, ${pad.top + plotH / 2})`}
        textAnchor="middle"
      >
        attention
      </text>
    </svg>
  );
}

export function DistancePenaltyShapes() {
  return (
    <WidgetContainer
      title="Shapes of Distance Falloff"
      description='ALiBi can only produce the first shape — a straight-line decline. Each of the others suits a different kind of "what should I look at?" question.'
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SHAPES.map((s) => (
          <div
            key={s.id}
            className={`rounded-lg border p-3 flex flex-col gap-2 ${
              s.alibiCan
                ? "border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20"
                : "border-border bg-surface"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold text-foreground">
                {s.title}
              </h4>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  s.alibiCan
                    ? "bg-blue-500 text-white"
                    : "bg-purple-500 text-white"
                }`}
              >
                {s.alibiCan ? "ALiBi can do this" : "Needs RoPE"}
              </span>
            </div>
            <ShapeChart score={s.score} alibiCan={s.alibiCan} />
            <p className="text-sm text-foreground/80 leading-relaxed">
              {s.task}
            </p>
          </div>
        ))}
      </div>
    </WidgetContainer>
  );
}
