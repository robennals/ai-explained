import { ArtFrame, keyframes, timeline } from "./ArtFrame";

// The word "it" looks back at the earlier words, and attends most strongly
// to "cat": attention resolving what a pronoun refers to.

const PERIOD_MS = 7000;
const WORDS = ["The", "cat", "ate", "because", "it", "was", "hungry"];
const QUERY = 4;
const WEIGHTS = [0.04, 0.72, 0.08, 0.16];
const CHAR_W = 7.6;
const GAP = 12;
const BASELINE = 140;
const ARC_BASE = 122;

const totalWidth =
  WORDS.reduce((sum, w) => sum + w.length * CHAR_W, 0) + GAP * (WORDS.length - 1);
let cursor = (320 - totalWidth) / 2;
const centers = WORDS.map((w) => {
  const c = cursor + (w.length * CHAR_W) / 2;
  cursor += w.length * CHAR_W + GAP;
  return c;
});

const arcs = WEIGHTS.map((w, i) => {
  const x1 = centers[QUERY];
  const x2 = centers[i];
  const h = 18 + Math.abs(x1 - x2) * 0.42;
  return {
    w,
    d: `M${x1},${ARC_BASE} C${x1},${ARC_BASE - h} ${x2},${ARC_BASE - h} ${x2},${ARC_BASE}`,
    peak: { x: (x1 + x2) / 2, y: ARC_BASE - h * 0.75 },
  };
});

const pct = timeline(PERIOD_MS);

const css = [
  ...arcs.map((_, i) => {
    const start = 500 + (QUERY - 1 - i) * 250;
    return [
      `.aa-arc${i}{stroke-dasharray:1;stroke-dashoffset:0;animation:aa-arc${i} ${PERIOD_MS}ms ease-out infinite}`,
      keyframes(`aa-arc${i}`, [
        [0, "stroke-dashoffset:1;opacity:1"],
        [pct(start), "stroke-dashoffset:1;opacity:1"],
        [pct(start + 700), "stroke-dashoffset:0;opacity:1"],
        [pct(6300), "stroke-dashoffset:0;opacity:1"],
        [pct(6800), "stroke-dashoffset:0;opacity:0"],
        [100, "stroke-dashoffset:1;opacity:0"],
      ]),
    ].join("");
  }),
  `.aa-hit{animation:aa-hit ${PERIOD_MS}ms ease-out infinite}`,
  keyframes("aa-hit", [
    [0, "opacity:0"],
    [pct(2100), "opacity:0"],
    [pct(2500), "opacity:1"],
    [pct(6300), "opacity:1"],
    [pct(6800), "opacity:0"],
    [100, "opacity:0"],
  ]),
].join("\n");

export function AttentionArt({ accent }: { accent: string }) {
  return (
    <ArtFrame
      prefix="aa"
      css={css}
      label='In "The cat ate because it was hungry", the word "it" attends most strongly to "cat"'
    >
      {arcs.map((a, i) => (
        <path
          key={i}
          className={`aa-arc${i}`}
          d={a.d}
          pathLength={1}
          fill="none"
          stroke={accent}
          strokeWidth={1 + 6 * a.w}
          strokeOpacity={0.25 + 0.75 * a.w}
          strokeLinecap="round"
        />
      ))}
      <text
        className="aa-hit"
        x={arcs[1].peak.x}
        y={arcs[1].peak.y - 6}
        fontSize={11}
        textAnchor="middle"
        fill={accent}
        fontFamily="var(--font-geist-mono)"
      >
        72%
      </text>
      <rect
        x={centers[QUERY] - 13}
        y={BASELINE - 16}
        width={26}
        height={22}
        rx={5}
        fill={accent}
        fillOpacity={0.15}
      />
      <rect
        className="aa-hit"
        x={centers[1] - 17}
        y={BASELINE - 16}
        width={34}
        height={22}
        rx={5}
        fill={accent}
        fillOpacity={0.3}
      />
      {WORDS.map((w, i) => (
        <text
          key={i}
          x={centers[i]}
          y={BASELINE}
          fontSize={14}
          textAnchor="middle"
          fill={i === QUERY ? accent : "#334155"}
          fontWeight={i === QUERY || i === 1 ? 600 : 400}
          fontFamily="var(--font-geist-mono)"
        >
          {w}
        </text>
      ))}
    </ArtFrame>
  );
}
