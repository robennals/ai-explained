import { ArtFrame, keyframes, timeline } from "./ArtFrame";

// An agent goes round a think → act → check loop, ticking off one task of a
// to-do list each time round.

const LOOP_MS = 2000;
const TASKS = ["find flights", "compare prices", "book a seat"];
const PERIOD_MS = LOOP_MS * (TASKS.length + 1);
const CENTER = { x: 98, y: 86 };
const R = 52;
const STATIONS = [
  { label: "think", deg: 0 },
  { label: "use a tool", deg: 120 },
  { label: "check result", deg: 240 },
];
const LIST_X = 192;
const LIST_Y0 = 62;
const LIST_DY = 30;

const pointAt = (deg: number, r = R) => {
  const rad = (deg * Math.PI) / 180;
  return { x: CENTER.x + r * Math.sin(rad), y: CENTER.y - r * Math.cos(rad) };
};

const pct = timeline(PERIOD_MS);
const loopPct = timeline(LOOP_MS);
/** Task i is ticked as the dot completes loop i + 1 and passes "think". */
const tickMs = (i: number) => (i + 1) * LOOP_MS;
const RESET_MS = PERIOD_MS - 300;

const css = [
  `.ag-orbit{animation:ag-orbit ${LOOP_MS}ms linear infinite}`,
  keyframes("ag-orbit", [
    [0, "transform:rotate(0deg)"],
    [100, "transform:rotate(360deg)"],
  ]),
  `.ag-station{fill-opacity:.12;animation:ag-station ${LOOP_MS}ms ease-out infinite}`,
  keyframes("ag-station", [
    [0, "fill-opacity:1"],
    [loopPct(500), "fill-opacity:.12"],
    [100, "fill-opacity:.12"],
  ]),
  ...TASKS.map((_, i) =>
    [
      `.ag-tick${i}{animation:ag-tick${i} ${PERIOD_MS}ms ease-out infinite}`,
      keyframes(`ag-tick${i}`, [
        [0, "opacity:0"],
        [pct(tickMs(i)), "opacity:0"],
        [pct(tickMs(i) + 200), "opacity:1"],
        [pct(RESET_MS), "opacity:1"],
        [100, "opacity:0"],
      ]),
    ].join("")
  ),
].join("\n");

export function AgentsArt({ accent }: { accent: string }) {
  const dot = pointAt(0);
  return (
    <ArtFrame
      prefix="ag"
      css={css}
      label="An agent cycling through think, use a tool, and check result, ticking off tasks on a to-do list"
    >
      <circle cx={CENTER.x} cy={CENTER.y} r={R} fill="none" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="3 4" />
      <text x={CENTER.x} y={CENTER.y + 5} fontSize={14} textAnchor="middle" fill="#334155" fontWeight={700} fontFamily="var(--font-geist-mono)">
        AI
      </text>
      {STATIONS.map((s) => {
        const p = pointAt(s.deg);
        // "think" is labelled above its station; the others below theirs.
        const labelY = s.deg === 0 ? p.y - 15 : p.y + 25;
        return (
          <g key={s.label}>
            <circle cx={p.x} cy={p.y} r={9} fill="white" stroke={accent} strokeWidth={2} />
            <circle
              className="ag-station"
              cx={p.x}
              cy={p.y}
              r={6}
              fill={accent}
              // Light up as the orbiting dot passes this station.
              style={{ animationDelay: `${(s.deg / 360) * LOOP_MS}ms` }}
            />
            <text
              x={p.x}
              y={labelY}
              fontSize={10}
              textAnchor="middle"
              fill="#475569"
              fontFamily="var(--font-geist-mono)"
            >
              {s.label}
            </text>
          </g>
        );
      })}
      <g transform={`translate(${CENTER.x} ${CENTER.y})`}>
        <g className="ag-orbit">
          <circle cx={dot.x - CENTER.x} cy={dot.y - CENTER.y} r={4.5} fill={accent} />
        </g>
      </g>
      {TASKS.map((task, i) => {
        const y = LIST_Y0 + i * LIST_DY;
        return (
          <g key={task}>
            <rect x={LIST_X} y={y - 11} width={14} height={14} rx={3} fill="white" stroke="#94a3b8" strokeWidth={1.5} />
            <path
              className={`ag-tick${i}`}
              d={`M${LIST_X + 3},${y - 4} l3.5,3.5 l6,-7.5`}
              fill="none"
              stroke={accent}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text x={LIST_X + 22} y={y} fontSize={12} fill="#334155" fontFamily="var(--font-geist-sans)">
              {task}
            </text>
          </g>
        );
      })}
    </ArtFrame>
  );
}
