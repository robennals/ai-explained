import { ArtFrame, keyframes, timeline } from "./ArtFrame";

// The words of a sentence flow up through a stack of attention and
// neural-network layers, and the next word pops out of the top.

const PERIOD_MS = 6500;
const WORDS = ["The", "cat", "sat", "on", "the"];
const LAYERS = 3;
const STACK_X = 58;
const STACK_W = 204;
const BAR_H = 13;
const BAR_GAP = 5;
const LAYER_GAP = 9;
const STACK_BOTTOM = 152;
const WORD_Y = 170;

const bars = Array.from({ length: LAYERS * 2 }, (_, k) => {
  const layer = Math.floor(k / 2);
  const isAttention = k % 2 === 0;
  const y =
    STACK_BOTTOM -
    (k + 1) * BAR_H -
    k * BAR_GAP -
    layer * (LAYER_GAP - BAR_GAP);
  return { y, isAttention };
});
const STACK_TOP = bars.at(-1)!.y;
const columnXs = WORDS.map((_, i) => STACK_X + 24 + i * ((STACK_W - 48) / (WORDS.length - 1)));

const pct = timeline(PERIOD_MS);
const RISE_START_MS = 500;
const BAR_STEP_MS = 380;
const OUTPUT_MS = RISE_START_MS + bars.length * BAR_STEP_MS + 100;
const HOLD_END_MS = 5800;
const RESET_MS = 6200;

const css = [
  ...bars.map((_, k) => {
    const t = RISE_START_MS + k * BAR_STEP_MS;
    return [
      `.ta-bar${k}{fill-opacity:.9;animation:ta-bar${k} ${PERIOD_MS}ms ease-out infinite}`,
      keyframes(`ta-bar${k}`, [
        [0, "fill-opacity:.25"],
        [pct(t), "fill-opacity:.25"],
        [pct(t + 200), "fill-opacity:1"],
        [pct(t + 700), "fill-opacity:.9"],
        [pct(HOLD_END_MS), "fill-opacity:.9"],
        [pct(RESET_MS), "fill-opacity:.25"],
        [100, "fill-opacity:.25"],
      ]),
    ].join("");
  }),
  `.ta-stream{stroke-dasharray:1;stroke-dashoffset:0;animation:ta-stream ${PERIOD_MS}ms linear infinite}`,
  keyframes("ta-stream", [
    [0, "stroke-dashoffset:1"],
    [pct(RISE_START_MS), "stroke-dashoffset:1"],
    [pct(OUTPUT_MS - 100), "stroke-dashoffset:0"],
    [pct(HOLD_END_MS), "stroke-dashoffset:0;opacity:1"],
    [pct(RESET_MS), "stroke-dashoffset:0;opacity:0"],
    [100, "stroke-dashoffset:1;opacity:0"],
  ]),
  `.ta-out{animation:ta-out ${PERIOD_MS}ms cubic-bezier(.3,1.5,.5,1) infinite}`,
  keyframes("ta-out", [
    [0, "opacity:0;transform:translateY(8px)"],
    [pct(OUTPUT_MS), "opacity:0;transform:translateY(8px)"],
    [pct(OUTPUT_MS + 400), "opacity:1;transform:translateY(0)"],
    [pct(HOLD_END_MS), "opacity:1;transform:translateY(0)"],
    [pct(RESET_MS), "opacity:0;transform:translateY(0)"],
    [100, "opacity:0"],
  ]),
].join("\n");

export function TransformersArt({ accent }: { accent: string }) {
  return (
    <ArtFrame
      prefix="ta"
      css={css}
      label='"The cat sat on the" flowing up through a stack of transformer layers, producing "mat"'
    >
      {bars.map((b, k) => (
        <g key={k}>
          <rect
            className={`ta-bar${k}`}
            x={STACK_X}
            y={b.y}
            width={STACK_W}
            height={BAR_H}
            rx={4}
            fill={b.isAttention ? accent : "#64748b"}
          />
          <text
            x={STACK_X + STACK_W - 6}
            y={b.y + BAR_H - 3.5}
            fontSize={8.5}
            textAnchor="end"
            fill="white"
            fontFamily="var(--font-geist-mono)"
          >
            {b.isAttention ? "attention" : "neural net"}
          </text>
        </g>
      ))}
      {columnXs.map((x, i) => (
        <line
          key={i}
          className="ta-stream"
          x1={x}
          y1={WORD_Y - 12}
          x2={x}
          y2={STACK_TOP - 6}
          pathLength={1}
          stroke={accent}
          strokeWidth={1.5}
          strokeOpacity={0.6}
        />
      ))}
      {WORDS.map((w, i) => (
        <text key={i} x={columnXs[i]} y={WORD_Y} fontSize={11} textAnchor="middle" fill="#475569" fontFamily="var(--font-geist-mono)">
          {w}
        </text>
      ))}
      <g className="ta-out">
        <rect x={136} y={STACK_TOP - 30} width={48} height={22} rx={11} fill={accent} />
        <text x={160} y={STACK_TOP - 15} fontSize={13} textAnchor="middle" fill="white" fontWeight={700} fontFamily="var(--font-geist-mono)">
          mat
        </text>
      </g>
    </ArtFrame>
  );
}
