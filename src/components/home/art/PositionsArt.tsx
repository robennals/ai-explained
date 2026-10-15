import { ArtFrame, keyframes, timeline } from "./ArtFrame";

// Each word gets a dial turned by an amount set by its position, the way
// rotary position encodings tell the model where each word sits.

const PERIOD_MS = 7000;
const WORDS = ["the", "dog", "bit", "the", "man"];
const DEGREES_PER_POSITION = 50;
const DIAL_R = 19;
const SPACING = 58;
const FIRST_X = 160 - ((WORDS.length - 1) * SPACING) / 2;
const WORD_Y = 62;
const DIAL_Y = 116;

const pct = timeline(PERIOD_MS);
const HOLD_END_MS = 6200;
const RESET_MS = 6700;
const startMs = (i: number) => 500 + i * 350;

const css = [
  ...WORDS.map((_, i) => {
    const deg = i * DEGREES_PER_POSITION;
    const t = startMs(i);
    return [
      `.pa-hand${i}{transform:rotate(${deg}deg);animation:pa-hand${i} ${PERIOD_MS}ms cubic-bezier(.3,1.4,.5,1) infinite}`,
      keyframes(`pa-hand${i}`, [
        [0, "transform:rotate(0deg)"],
        [pct(t), "transform:rotate(0deg)"],
        [pct(t + 800), `transform:rotate(${deg}deg)`],
        [pct(HOLD_END_MS), `transform:rotate(${deg}deg)`],
        [pct(RESET_MS), "transform:rotate(0deg)"],
        [100, "transform:rotate(0deg)"],
      ]),
      `.pa-num${i}{animation:pa-num${i} ${PERIOD_MS}ms ease-out infinite}`,
      keyframes(`pa-num${i}`, [
        [0, "opacity:0"],
        [pct(t), "opacity:0"],
        [pct(t + 300), "opacity:1"],
        [pct(HOLD_END_MS), "opacity:1"],
        [pct(RESET_MS), "opacity:0"],
        [100, "opacity:0"],
      ]),
    ].join("");
  }),
].join("\n");

export function PositionsArt({ accent }: { accent: string }) {
  return (
    <ArtFrame
      prefix="pa"
      css={css}
      label="Each word in a sentence gets a dial rotated according to its position"
    >
      {WORDS.map((word, i) => {
        const x = FIRST_X + i * SPACING;
        return (
          <g key={i}>
            <text className={`pa-num${i}`} x={x} y={WORD_Y - 24} fontSize={10} textAnchor="middle" fill="#94a3b8" fontFamily="var(--font-geist-mono)">
              #{i + 1}
            </text>
            <text x={x} y={WORD_Y} fontSize={16} textAnchor="middle" fill="#334155" fontWeight={500} fontFamily="var(--font-geist-mono)">
              {word}
            </text>
            <line x1={x} y1={WORD_Y + 8} x2={x} y2={DIAL_Y - DIAL_R - 4} stroke="#e2e8f0" strokeWidth={1.5} />
            <g transform={`translate(${x} ${DIAL_Y})`}>
              <circle r={DIAL_R} fill="white" stroke="#cbd5e1" strokeWidth={1.5} />
              <line x1={0} y1={-DIAL_R} x2={0} y2={-DIAL_R + 4} stroke="#cbd5e1" strokeWidth={1.5} />
              <g className={`pa-hand${i}`}>
                <line x1={0} y1={0} x2={0} y2={-DIAL_R + 4} stroke={accent} strokeWidth={3} strokeLinecap="round" />
              </g>
              <circle r={3} fill={accent} />
            </g>
          </g>
        );
      })}
    </ArtFrame>
  );
}
