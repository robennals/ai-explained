import { ArtFrame, keyframes, timeline } from "./ArtFrame";

// Asked a question, a raw model just continues the document with more
// questions; after post-training it answers.

const PERIOD_MS = 8000;
const BEFORE_TEXT = "What's the capital of Spain? What's…";
const AFTER_TEXT = "The capital of France is Paris.";
const TEXT_X = 76;
const BEFORE_Y = 96;
const AFTER_Y = 142;

const pct = timeline(PERIOD_MS);
const BEFORE_MS = 700;
const STRIKE_MS = 2700;
const AFTER_MS = 3500;
const CHECK_MS = 5200;
const HOLD_END_MS = 7200;
const RESET_MS = 7600;

/** Reveals a line of text left to right by scaling its clip rectangle. */
function typeFrames(startMs: number, durationMs: number): [number, string][] {
  return [
    [0, "transform:scaleX(0)"],
    [pct(startMs), "transform:scaleX(0)"],
    [pct(startMs + durationMs), "transform:scaleX(1)"],
    [pct(HOLD_END_MS), "transform:scaleX(1)"],
    [pct(RESET_MS), "transform:scaleX(1)"],
    [100, "transform:scaleX(0)"],
  ];
}

const fadeIn = (name: string, startMs: number) =>
  keyframes(name, [
    [0, "opacity:0"],
    [pct(startMs), "opacity:0"],
    [pct(startMs + 300), "opacity:1"],
    [pct(HOLD_END_MS), "opacity:1"],
    [pct(RESET_MS), "opacity:0"],
    [100, "opacity:0"],
  ]);

const css = [
  `.pt-clip{transform-box:fill-box;transform-origin:left center}`,
  `.pt-type-before{animation:pt-type-before ${PERIOD_MS}ms steps(36) infinite}`,
  keyframes("pt-type-before", typeFrames(BEFORE_MS, 1700)),
  `.pt-type-after{animation:pt-type-after ${PERIOD_MS}ms steps(31) infinite}`,
  keyframes("pt-type-after", typeFrames(AFTER_MS, 1500)),
  `.pt-strike{stroke-dasharray:1;stroke-dashoffset:0;animation:pt-strike ${PERIOD_MS}ms ease-in-out infinite}`,
  keyframes("pt-strike", [
    [0, "stroke-dashoffset:1;opacity:1"],
    [pct(STRIKE_MS), "stroke-dashoffset:1;opacity:1"],
    [pct(STRIKE_MS + 400), "stroke-dashoffset:0;opacity:1"],
    [pct(HOLD_END_MS), "stroke-dashoffset:0;opacity:1"],
    [pct(RESET_MS), "stroke-dashoffset:0;opacity:0"],
    [100, "stroke-dashoffset:1;opacity:0"],
  ]),
  `.pt-label-before{animation:pt-label-before ${PERIOD_MS}ms ease-out infinite}`,
  fadeIn("pt-label-before", BEFORE_MS - 300),
  `.pt-label-after{animation:pt-label-after ${PERIOD_MS}ms ease-out infinite}`,
  fadeIn("pt-label-after", AFTER_MS - 300),
  `.pt-check{animation:pt-check ${PERIOD_MS}ms ease-out infinite}`,
  fadeIn("pt-check", CHECK_MS),
].join("\n");

export function PostTrainingArt({ accent }: { accent: string }) {
  return (
    <ArtFrame
      prefix="pt"
      css={css}
      label="Before post-training the model continues a question with more questions; afterwards it answers it"
    >
      <defs>
        <clipPath id="pt-clip-before">
          <rect className="pt-clip pt-type-before" x={TEXT_X} y={BEFORE_Y - 14} width={230} height={20} />
        </clipPath>
        <clipPath id="pt-clip-after">
          <rect className="pt-clip pt-type-after" x={TEXT_X} y={AFTER_Y - 14} width={230} height={20} />
        </clipPath>
      </defs>
      <rect x={24} y={22} width={272} height={34} rx={17} fill="#f1f5f9" />
      <text x={160} y={44} fontSize={13} textAnchor="middle" fill="#334155" fontWeight={500} fontFamily="var(--font-geist-sans)">
        What&apos;s the capital of France?
      </text>

      <text className="pt-label-before" x={TEXT_X - 10} y={BEFORE_Y} fontSize={9} textAnchor="end" fill="#94a3b8" fontFamily="var(--font-geist-mono)">
        BEFORE
      </text>
      <text clipPath="url(#pt-clip-before)" x={TEXT_X} y={BEFORE_Y} fontSize={11.5} fill="#94a3b8" fontStyle="italic" fontFamily="var(--font-geist-sans)">
        {BEFORE_TEXT}
      </text>
      <line className="pt-strike" x1={TEXT_X - 2} y1={BEFORE_Y - 4} x2={TEXT_X + 196} y2={BEFORE_Y - 4} pathLength={1} stroke="#ef4444" strokeOpacity={0.7} strokeWidth={1.5} />

      <text className="pt-label-after" x={TEXT_X - 10} y={AFTER_Y} fontSize={9} textAnchor="end" fill={accent} fontWeight={700} fontFamily="var(--font-geist-mono)">
        AFTER
      </text>
      <text clipPath="url(#pt-clip-after)" x={TEXT_X} y={AFTER_Y} fontSize={13} fill="#1e293b" fontWeight={600} fontFamily="var(--font-geist-sans)">
        {AFTER_TEXT}
      </text>
      <g className="pt-check">
        <circle cx={290} cy={AFTER_Y - 4} r={9} fill={accent} />
        <path d={`M285,${AFTER_Y - 4} l3.5,3.5 l6,-7`} fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </ArtFrame>
  );
}
