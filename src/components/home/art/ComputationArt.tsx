import { ArtFrame, keyframes, timeline } from "./ArtFrame";

// A pixel heart and the word "cat" both dissolve into the numbers a computer
// actually stores: everything is numbers.

const PERIOD_MS = 7000;
const CELL = 17;
const GRID_X = 22;
const GRID_Y = 30;
const HEART = [
  ".XX..XX.",
  "XXXXXXXX",
  "XXXXXXXX",
  "XXXXXXXX",
  ".XXXXXX.",
  "..XXXX..",
  "...XX...",
];
const COLUMNS = HEART[0].length;

const pct = timeline(PERIOD_MS);
const SWEEP_START_MS = 900;
const COLUMN_STEP_MS = 160;
const columnMs = (c: number) => SWEEP_START_MS + c * COLUMN_STEP_MS;
const WORD_MS = columnMs(COLUMNS) + 200;
const HOLD_END_MS = 6200;
const RESET_MS = 6700;

const css = [
  ...Array.from({ length: COLUMNS }, (_, c) => {
    const t = columnMs(c);
    return [
      `.ca-px${c}{fill-opacity:.15;animation:ca-px${c} ${PERIOD_MS}ms ease-in-out infinite}`,
      keyframes(`ca-px${c}`, [
        [0, "fill-opacity:1"],
        [pct(t), "fill-opacity:1"],
        [pct(t + 300), "fill-opacity:.15"],
        [pct(HOLD_END_MS), "fill-opacity:.15"],
        [pct(RESET_MS), "fill-opacity:1"],
        [100, "fill-opacity:1"],
      ]),
      `.ca-n${c}{animation:ca-n${c} ${PERIOD_MS}ms ease-in-out infinite}`,
      keyframes(`ca-n${c}`, [
        [0, "opacity:0"],
        [pct(t), "opacity:0"],
        [pct(t + 300), "opacity:1"],
        [pct(HOLD_END_MS), "opacity:1"],
        [pct(RESET_MS), "opacity:0"],
        [100, "opacity:0"],
      ]),
    ].join("");
  }),
  `.ca-codes{animation:ca-codes ${PERIOD_MS}ms ease-out infinite}`,
  keyframes("ca-codes", [
    [0, "opacity:0;transform:translateY(-6px)"],
    [pct(WORD_MS), "opacity:0;transform:translateY(-6px)"],
    [pct(WORD_MS + 400), "opacity:1;transform:translateY(0)"],
    [pct(HOLD_END_MS), "opacity:1;transform:translateY(0)"],
    [pct(RESET_MS), "opacity:0;transform:translateY(0)"],
    [100, "opacity:0"],
  ]),
].join("\n");

export function ComputationArt({ accent }: { accent: string }) {
  return (
    <ArtFrame
      prefix="ca"
      css={css}
      label='A pixel heart and the word "cat" turning into the numbers a computer stores'
    >
      {HEART.map((row, r) =>
        row.split("").map((cell, c) => {
          const on = cell === "X";
          const x = GRID_X + c * CELL;
          const y = GRID_Y + r * CELL;
          return (
            <g key={`${r}-${c}`}>
              <rect
                className={on ? `ca-px${c}` : undefined}
                x={x + 0.5}
                y={y + 0.5}
                width={CELL - 1}
                height={CELL - 1}
                rx={2}
                fill={on ? accent : "#e2e8f0"}
                fillOpacity={on ? undefined : 0.5}
              />
              <text
                className={`ca-n${c}`}
                x={x + CELL / 2}
                y={y + CELL / 2 + 3.5}
                fontSize={10}
                textAnchor="middle"
                fill={on ? accent : "#94a3b8"}
                fontWeight={on ? 700 : 400}
                fontFamily="var(--font-geist-mono)"
              >
                {on ? 1 : 0}
              </text>
            </g>
          );
        })
      )}
      <text x={236} y={78} fontSize={30} textAnchor="middle" fill="#334155" fontFamily="var(--font-serif)">
        cat
      </text>
      <g className="ca-codes">
        <path d="M236,90 v14 m-5,-5 l5,5 l5,-5" fill="none" stroke="#94a3b8" strokeWidth={1.5} />
        <text x={236} y={128} fontSize={16} textAnchor="middle" fill={accent} fontWeight={600} fontFamily="var(--font-geist-mono)">
          99 97 116
        </text>
      </g>
    </ArtFrame>
  );
}
