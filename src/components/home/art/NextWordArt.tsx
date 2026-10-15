import { ArtFrame, keyframes, timeline } from "./ArtFrame";

// The model weighs candidate next words for "Once upon a ___", then fills in
// the winner.

const PERIOD_MS = 7000;
const CANDIDATES = [
  { word: "time", p: 0.74 },
  { word: "hill", p: 0.09 },
  { word: "dragon", p: 0.06 },
  { word: "star", p: 0.04 },
];
const BAR_X = 96;
const BAR_MAX = 170;
const ROW_Y0 = 84;
const ROW_DY = 24;

const pct = timeline(PERIOD_MS);

const css = [
  `.nw-bar{transform-box:fill-box;transform-origin:left center}`,
  ...CANDIDATES.map((_, i) => {
    const start = 400 + i * 180;
    return [
      `.nw-bar${i}{animation:nw-bar${i} ${PERIOD_MS}ms cubic-bezier(.2,.8,.3,1) infinite}`,
      keyframes(`nw-bar${i}`, [
        [0, "transform:scaleX(0)"],
        [pct(start), "transform:scaleX(0)"],
        [pct(start + 900), "transform:scaleX(1)"],
        [pct(6300), "transform:scaleX(1);opacity:1"],
        [pct(6800), "transform:scaleX(1);opacity:0"],
        [100, "transform:scaleX(0);opacity:0"],
      ]),
    ].join("");
  }),
  `.nw-win{animation:nw-win ${PERIOD_MS}ms ease-out infinite}`,
  keyframes("nw-win", [
    [0, "fill:#cbd5e1"],
    [pct(2200), "fill:#cbd5e1"],
    [pct(2500), "fill:var(--nw-accent)"],
    [100, "fill:var(--nw-accent)"],
  ]),
  `.nw-word{animation:nw-word ${PERIOD_MS}ms ease-out infinite}`,
  keyframes("nw-word", [
    [0, "opacity:0;transform:translateY(6px)"],
    [pct(2600), "opacity:0;transform:translateY(6px)"],
    [pct(2900), "opacity:1;transform:translateY(0)"],
    [pct(6300), "opacity:1;transform:translateY(0)"],
    [pct(6800), "opacity:0;transform:translateY(0)"],
    [100, "opacity:0"],
  ]),
  `.nw-cursor{opacity:0;animation:nw-cursor ${PERIOD_MS}ms steps(1) infinite}`,
  keyframes("nw-cursor", [
    [0, "opacity:1"],
    [pct(500), "opacity:0"],
    [pct(1000), "opacity:1"],
    [pct(1500), "opacity:0"],
    [pct(2000), "opacity:1"],
    [pct(2600), "opacity:0"],
    [pct(6900), "opacity:1"],
  ]),
].join("\n");

export function NextWordArt({ accent }: { accent: string }) {
  return (
    <ArtFrame
      prefix="nw"
      css={`.nw{--nw-accent:${accent}}\n${css}`}
      label='Probability bars for the next word after "Once upon a", with "time" winning'
    >
      <text x={150} y={46} fontSize={20} textAnchor="end" fill="#334155" fontFamily="var(--font-serif)">
        Once upon a
      </text>
      <rect x={158} y={26} width={70} height={28} rx={5} fill="none" stroke="#cbd5e1" strokeDasharray="4 3" />
      <rect className="nw-cursor" x={163} y={31} width={2} height={18} fill="#94a3b8" />
      <text className="nw-word" x={193} y={46} fontSize={20} textAnchor="middle" fill={accent} fontFamily="var(--font-serif)" fontStyle="italic">
        time
      </text>
      {CANDIDATES.map(({ word, p }, i) => {
        const y = ROW_Y0 + i * ROW_DY;
        return (
          <g key={word}>
            <text x={BAR_X - 8} y={y + 12} fontSize={12} textAnchor="end" fill="#64748b" fontFamily="var(--font-geist-mono)">
              {word}
            </text>
            <rect x={BAR_X} y={y} width={BAR_MAX} height={16} rx={3} fill="#f1f5f9" />
            <rect
              className={`nw-bar nw-bar${i} ${i === 0 ? "nw-win" : ""}`}
              x={BAR_X}
              y={y}
              width={Math.max(4, BAR_MAX * p)}
              height={16}
              rx={3}
              fill={i === 0 ? accent : "#cbd5e1"}
            />
            <text x={BAR_X + BAR_MAX + 8} y={y + 12} fontSize={11} fill="#94a3b8" fontFamily="var(--font-geist-mono)">
              {Math.round(p * 100)}%
            </text>
          </g>
        );
      })}
    </ArtFrame>
  );
}
