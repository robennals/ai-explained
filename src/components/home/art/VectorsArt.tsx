import { ArtFrame, keyframes, timeline } from "./ArtFrame";

// Animals become arrows on "size" and "fluffiness" axes; the small angle
// between cat and dog shows they are similar.

const PERIOD_MS = 7500;
const ORIGIN = { x: 44, y: 150 };
const X_SCALE = 250;
const Y_SCALE = 122;
const ANIMALS = [
  { name: "mouse", size: 0.12, fluffy: 0.5 },
  { name: "cat", size: 0.32, fluffy: 0.86 },
  { name: "dog", size: 0.5, fluffy: 0.78 },
  { name: "elephant", size: 0.92, fluffy: 0.12 },
];
const CAT = 1;
const DOG = 2;
const ARC_R = 46;

const tips = ANIMALS.map((a) => ({
  ...a,
  x: ORIGIN.x + a.size * X_SCALE,
  y: ORIGIN.y - a.fluffy * Y_SCALE,
}));

const angleOf = (i: number) =>
  Math.atan2(ORIGIN.y - tips[i].y, tips[i].x - ORIGIN.x);
const arcPoint = (angle: number) => ({
  x: ORIGIN.x + ARC_R * Math.cos(angle),
  y: ORIGIN.y - ARC_R * Math.sin(angle),
});
const arcFrom = arcPoint(angleOf(CAT));
const arcTo = arcPoint(angleOf(DOG));
const arcMid = arcPoint((angleOf(CAT) + angleOf(DOG)) / 2);

const pct = timeline(PERIOD_MS);
const HOLD_END_MS = 6600;
const RESET_MS = 7100;
const ARC_MS = 600 + ANIMALS.length * 350 + 500;

const css = [
  ...tips.map((_, i) => {
    const start = 400 + i * 350;
    return [
      `.va-arrow${i}{stroke-dasharray:1;stroke-dashoffset:0;animation:va-arrow${i} ${PERIOD_MS}ms ease-out infinite}`,
      keyframes(`va-arrow${i}`, [
        [0, "stroke-dashoffset:1;opacity:1"],
        [pct(start), "stroke-dashoffset:1;opacity:1"],
        [pct(start + 600), "stroke-dashoffset:0;opacity:1"],
        [pct(HOLD_END_MS), "stroke-dashoffset:0;opacity:1"],
        [pct(RESET_MS), "stroke-dashoffset:0;opacity:0"],
        [100, "stroke-dashoffset:1;opacity:0"],
      ]),
      `.va-tip${i}{animation:va-tip${i} ${PERIOD_MS}ms ease-out infinite}`,
      keyframes(`va-tip${i}`, [
        [0, "opacity:0"],
        [pct(start + 500), "opacity:0"],
        [pct(start + 700), "opacity:1"],
        [pct(HOLD_END_MS), "opacity:1"],
        [pct(RESET_MS), "opacity:0"],
        [100, "opacity:0"],
      ]),
    ].join("");
  }),
  `.va-arc{animation:va-arc ${PERIOD_MS}ms ease-out infinite}`,
  keyframes("va-arc", [
    [0, "opacity:0"],
    [pct(ARC_MS), "opacity:0"],
    [pct(ARC_MS + 400), "opacity:1"],
    [pct(HOLD_END_MS), "opacity:1"],
    [pct(RESET_MS), "opacity:0"],
    [100, "opacity:0"],
  ]),
].join("\n");

export function VectorsArt({ accent }: { accent: string }) {
  return (
    <ArtFrame
      prefix="va"
      css={css}
      label="Animals drawn as arrows on size and fluffiness axes, with cat and dog pointing in similar directions"
    >
      <path
        d={`M${ORIGIN.x},18 V${ORIGIN.y} H306`}
        fill="none"
        stroke="#cbd5e1"
        strokeWidth={1.5}
      />
      <text x={306} y={ORIGIN.y + 16} fontSize={10} textAnchor="end" fill="#94a3b8" fontFamily="var(--font-geist-mono)">
        size →
      </text>
      <text x={ORIGIN.x - 8} y={22} fontSize={10} textAnchor="end" fill="#94a3b8" fontFamily="var(--font-geist-mono)" transform={`rotate(-90 ${ORIGIN.x - 8} 22)`}>
        fluffy →
      </text>
      <g className="va-arc">
        <path
          d={`M${arcTo.x},${arcTo.y} A${ARC_R},${ARC_R} 0 0 0 ${arcFrom.x},${arcFrom.y}`}
          fill="none"
          stroke={accent}
          strokeWidth={2}
        />
        <text x={arcMid.x + 8} y={arcMid.y - 4} fontSize={10} fill={accent} fontFamily="var(--font-geist-mono)">
          similar
        </text>
      </g>
      {tips.map((t, i) => {
        const highlighted = i === CAT || i === DOG;
        return (
          <g key={t.name}>
            <line
              className={`va-arrow${i}`}
              x1={ORIGIN.x}
              y1={ORIGIN.y}
              x2={t.x}
              y2={t.y}
              pathLength={1}
              stroke={highlighted ? accent : "#94a3b8"}
              strokeWidth={highlighted ? 2.5 : 2}
              strokeLinecap="round"
            />
            <g className={`va-tip${i}`}>
              <circle cx={t.x} cy={t.y} r={4} fill={highlighted ? accent : "#94a3b8"} />
              <text
                // Labels near the right edge sit to the left of their tip.
                x={t.x > 250 ? t.x - 4 : t.x + 7}
                y={t.y - 8}
                textAnchor={t.x > 250 ? "end" : "start"}
                fontSize={12}
                fill="#334155"
                fontWeight={highlighted ? 600 : 400}
                fontFamily="var(--font-geist-sans)"
              >
                {t.name}
              </text>
            </g>
          </g>
        );
      })}
    </ArtFrame>
  );
}
