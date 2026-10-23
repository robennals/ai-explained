import { ArtFrame, keyframes } from "./ArtFrame";

// Scattered words drift into clusters by meaning: the geometry of embeddings.

const PERIOD_MS = 8000;

const CLUSTERS = [
  { label: "animals", cx: 74, cy: 64, rx: 58, ry: 40 },
  { label: "fruit", cx: 246, cy: 58, rx: 58, ry: 38 },
  { label: "vehicles", cx: 166, cy: 136, rx: 62, ry: 34 },
];

const WORDS = [
  { word: "cat", cluster: 0, dx: -22, dy: -10, sx: 214, sy: 140 },
  { word: "dog", cluster: 0, dx: 20, dy: -4, sx: 40, sy: 150 },
  { word: "horse", cluster: 0, dx: -4, dy: 18, sx: 270, sy: 100 },
  { word: "apple", cluster: 1, dx: -20, dy: -8, sx: 120, sy: 36 },
  { word: "banana", cluster: 1, dx: 18, dy: 6, sx: 60, sy: 104 },
  { word: "cherry", cluster: 1, dx: -10, dy: 22, sx: 176, sy: 82 },
  { word: "car", cluster: 2, dx: -32, dy: -2, sx: 286, sy: 30 },
  { word: "bus", cluster: 2, dx: 4, dy: 12, sx: 100, sy: 72 },
  { word: "bike", cluster: 2, dx: 34, dy: -4, sx: 230, sy: 160 },
];

const words = WORDS.map((w) => ({
  ...w,
  fx: CLUSTERS[w.cluster].cx + w.dx,
  fy: CLUSTERS[w.cluster].cy + w.dy,
}));

const tr = (x: number, y: number) => `transform:translate(${x}px,${y}px)`;

const css = [
  ...words.map((w, i) =>
    [
      `.ea-w${i}{${tr(w.fx, w.fy)};animation:ea-w${i} ${PERIOD_MS}ms cubic-bezier(.45,0,.25,1) infinite}`,
      keyframes(`ea-w${i}`, [
        [0, tr(w.sx, w.sy)],
        [12, tr(w.sx, w.sy)],
        [42 + i, tr(w.fx, w.fy)],
        [84, tr(w.fx, w.fy)],
        [100, tr(w.sx, w.sy)],
      ]),
    ].join("")
  ),
  `.ea-halo{animation:ea-halo ${PERIOD_MS}ms ease-in-out infinite}`,
  keyframes("ea-halo", [
    [0, "opacity:0"],
    [44, "opacity:0"],
    [54, "opacity:1"],
    [80, "opacity:1"],
    [90, "opacity:0"],
    [100, "opacity:0"],
  ]),
].join("\n");

export function EmbeddingsArt({ accent }: { accent: string }) {
  return (
    <ArtFrame
      prefix="ea"
      css={css}
      label="Scattered words drifting into clusters of animals, fruit, and vehicles"
    >
      {CLUSTERS.map((c) => (
        <g key={c.label} className="ea-halo">
          <ellipse cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} fill={accent} fillOpacity={0.08} stroke={accent} strokeOpacity={0.3} strokeDasharray="3 3" />
          <text
            x={c.cx}
            y={c.cy - c.ry - 4}
            fontSize={9}
            textAnchor="middle"
            fill={accent}
            letterSpacing={1}
            fontFamily="var(--font-geist-mono)"
          >
            {c.label.toUpperCase()}
          </text>
        </g>
      ))}
      {words.map((w, i) => (
        <g key={w.word} className={`ea-w${i}`}>
          <circle r={3} cy={-14} fill={accent} />
          <text fontSize={13} textAnchor="middle" fill="#334155" fontFamily="var(--font-geist-sans)">
            {w.word}
          </text>
        </g>
      ))}
    </ArtFrame>
  );
}
