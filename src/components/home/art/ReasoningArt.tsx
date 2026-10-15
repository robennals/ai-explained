import { ArtFrame, keyframes, timeline } from "./ArtFrame";

// Faced with a hard sum, the model writes out its working step by step
// before giving the answer.

const PERIOD_MS = 8000;
const STEPS = ["17 × 20 = 340", "17 × 4 = 68", "340 + 68 = 408"];
const BOX = { x: 70, y: 52, w: 180, h: 88 };
const STEP_Y0 = BOX.y + 26;
const STEP_DY = 24;

const pct = timeline(PERIOD_MS);
const BOX_MS = 600;
const stepMs = (i: number) => 1200 + i * 900;
const ANSWER_MS = stepMs(STEPS.length) + 200;
const HOLD_END_MS = 7200;
const RESET_MS = 7600;

const fadeIn = (name: string, startMs: number, from = "translateY(4px)") =>
  keyframes(name, [
    [0, `opacity:0;transform:${from}`],
    [pct(startMs), `opacity:0;transform:${from}`],
    [pct(startMs + 350), "opacity:1;transform:none"],
    [pct(HOLD_END_MS), "opacity:1;transform:none"],
    [pct(RESET_MS), "opacity:0;transform:none"],
    [100, "opacity:0"],
  ]);

const css = [
  `.ra-box{animation:ra-box ${PERIOD_MS}ms ease-out infinite}`,
  fadeIn("ra-box", BOX_MS, "none"),
  ...STEPS.map((_, i) =>
    [
      `.ra-step${i}{animation:ra-step${i} ${PERIOD_MS}ms ease-out infinite}`,
      fadeIn(`ra-step${i}`, stepMs(i)),
    ].join("")
  ),
  `.ra-q{animation:ra-q ${PERIOD_MS}ms steps(1) infinite}`,
  keyframes("ra-q", [
    [0, "opacity:1"],
    [pct(ANSWER_MS), "opacity:0"],
    [pct(RESET_MS), "opacity:1"],
  ]),
  `.ra-answer{transform-box:fill-box;transform-origin:center;animation:ra-answer ${PERIOD_MS}ms cubic-bezier(.3,1.6,.5,1) infinite}`,
  fadeIn("ra-answer", ANSWER_MS, "scale(.6)"),
].join("\n");

export function ReasoningArt({ accent }: { accent: string }) {
  return (
    <ArtFrame
      prefix="ra"
      css={css}
      label="The model works out 17 × 24 step by step in a thinking box before answering 408"
    >
      <text x={160} y={36} fontSize={20} textAnchor="end" fill="#1e293b" fontWeight={600} fontFamily="var(--font-geist-mono)">
        17 × 24 =
      </text>
      <text className="ra-q" x={172} y={36} fontSize={20} fill="#94a3b8" fontFamily="var(--font-geist-mono)">
        ?
      </text>
      <text className="ra-answer" x={172} y={36} fontSize={20} fill={accent} fontWeight={700} fontFamily="var(--font-geist-mono)">
        408
      </text>
      <g className="ra-box">
        <rect x={BOX.x} y={BOX.y} width={BOX.w} height={BOX.h} rx={10} fill="white" fillOpacity={0.7} stroke={accent} strokeOpacity={0.5} strokeDasharray="4 3" />
        <text x={BOX.x + 10} y={BOX.y - 5} fontSize={9} fill={accent} letterSpacing={1} fontFamily="var(--font-geist-mono)">
          THINKING…
        </text>
      </g>
      {STEPS.map((s, i) => (
        <text
          key={i}
          className={`ra-step${i}`}
          x={BOX.x + 18}
          y={STEP_Y0 + i * STEP_DY}
          fontSize={13}
          fill="#475569"
          fontFamily="var(--font-geist-mono)"
        >
          {s}
        </text>
      ))}
      <text x={160} y={166} fontSize={10} textAnchor="middle" fill="#94a3b8" fontFamily="var(--font-geist-mono)">
        working it out before answering
      </text>
    </ArtFrame>
  );
}
