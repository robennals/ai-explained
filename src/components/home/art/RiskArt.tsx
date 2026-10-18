import { ArtFrame, keyframes, timeline } from "./ArtFrame";

// One job at a time is switched over from a human to the AI, each a sensible
// step on its own, while a gauge of what is at stake fills up.

const PERIOD_MS = 7600;
const JOBS = ["send email", "spend money", "deploy code", "fly drones"];
const ROW_Y0 = 46;
const ROW_DY = 32;
const TRACK = { x: 34, w: 32, h: 18 };
const KNOB_R = 6.5;
const KNOB_TRAVEL = TRACK.w - TRACK.h;
const GAUGE = { x: 250, y: 34, w: 26, h: 116 };
const switchMs = (i: number) => 900 + i * 1100;
const SLIDE_MS = 300;
const HOLD_END_MS = 6800;
const RESET_MS = 7200;

const pct = timeline(PERIOD_MS);

const buildCss = (accent: string) =>
  [
    ...JOBS.map((_, i) => {
      const on = switchMs(i);
      return [
        `.rk-knob${i}{transform:translateX(${KNOB_TRAVEL}px);animation:rk-knob${i} ${PERIOD_MS}ms ease-in-out infinite}`,
        keyframes(`rk-knob${i}`, [
          [0, "transform:none"],
          [pct(on), "transform:none"],
          [pct(on + SLIDE_MS), `transform:translateX(${KNOB_TRAVEL}px)`],
          [pct(HOLD_END_MS), `transform:translateX(${KNOB_TRAVEL}px)`],
          [pct(RESET_MS), "transform:none"],
          [100, "transform:none"],
        ]),
        `.rk-track${i}{animation:rk-track${i} ${PERIOD_MS}ms ease-in-out infinite}`,
        keyframes(`rk-track${i}`, [
          [0, "fill:#e2e8f0"],
          [pct(on), "fill:#e2e8f0"],
          [pct(on + SLIDE_MS), `fill:${accent}`],
          [pct(HOLD_END_MS), `fill:${accent}`],
          [pct(RESET_MS), "fill:#e2e8f0"],
          [100, "fill:#e2e8f0"],
        ]),
      ].join("");
    }),
    // The gauge rises one step each time a job is handed over.
    `.rk-gauge{transform-box:fill-box;transform-origin:bottom;animation:rk-gauge ${PERIOD_MS}ms ease-out infinite}`,
    keyframes("rk-gauge", [
      [0, "transform:scaleY(.04)"],
      ...JOBS.flatMap((_, i): [number, string][] => [
        [pct(switchMs(i)), `transform:scaleY(${(0.04 + (i * 0.96) / JOBS.length).toFixed(3)})`],
        [pct(switchMs(i) + 500), `transform:scaleY(${(0.04 + ((i + 1) * 0.96) / JOBS.length).toFixed(3)})`],
      ]),
      [pct(HOLD_END_MS), "transform:scaleY(1)"],
      [pct(RESET_MS), "transform:scaleY(.04)"],
      [100, "transform:scaleY(.04)"],
    ]),
  ].join("\n");

export function RiskArt({ accent }: { accent: string }) {
  return (
    <ArtFrame
      prefix="rk"
      css={buildCss(accent)}
      label="Jobs switched one by one from a human to the AI, sending email, spending money, deploying code and flying drones, while a gauge of what is at stake fills up"
    >
      <text x={TRACK.x} y={24} fontSize={10} fill="#64748b" fontFamily="var(--font-geist-mono)">
        human → AI
      </text>
      {JOBS.map((job, i) => {
        const y = ROW_Y0 + i * ROW_DY;
        return (
          <g key={job}>
            <rect
              className={`rk-track${i}`}
              x={TRACK.x}
              y={y - TRACK.h / 2}
              width={TRACK.w}
              height={TRACK.h}
              rx={TRACK.h / 2}
              fill={accent}
            />
            <circle
              className={`rk-knob${i}`}
              cx={TRACK.x + TRACK.h / 2}
              cy={y}
              r={KNOB_R}
              fill="white"
              stroke="#94a3b8"
              strokeWidth={1}
            />
            <text x={TRACK.x + TRACK.w + 12} y={y + 4} fontSize={12} fill="#334155" fontFamily="var(--font-geist-sans)">
              {job}
            </text>
          </g>
        );
      })}
      <text x={GAUGE.x + GAUGE.w / 2} y={24} fontSize={10} textAnchor="middle" fill="#64748b" fontFamily="var(--font-geist-mono)">
        at stake
      </text>
      <rect x={GAUGE.x} y={GAUGE.y} width={GAUGE.w} height={GAUGE.h} rx={6} fill="white" stroke="#cbd5e1" strokeWidth={1.5} />
      <rect className="rk-gauge" x={GAUGE.x + 3} y={GAUGE.y + 3} width={GAUGE.w - 6} height={GAUGE.h - 6} rx={4} fill={accent} />
    </ArtFrame>
  );
}
