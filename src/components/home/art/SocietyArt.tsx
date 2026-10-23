import { ArtFrame, keyframes, timeline } from "./ArtFrame";

// One AI model at the centre sends a pulse out to each person in turn, and
// each person it reaches takes on its colour: one model, everyone's homework,
// news, work and advice.

const PERIOD_MS = 7600;
const CENTER = { x: 160, y: 92 };
const PEOPLE = [
  { x: 46, y: 40, label: "homework" },
  { x: 274, y: 40, label: "news" },
  { x: 46, y: 92, label: "work" },
  { x: 274, y: 92, label: "advice" },
  { x: 46, y: 144, label: "art" },
  { x: 274, y: 144, label: "code" },
];
const TRAVEL_MS = 600;
const sendMs = (i: number) => 400 + i * 700;
const HOLD_END_MS = 6800;
const RESET_MS = 7200;

const pct = timeline(PERIOD_MS);

const buildCss = (accent: string) => PEOPLE.map((p, i) => {
  const start = sendMs(i);
  const arrive = start + TRAVEL_MS;
  const dx = p.x - CENTER.x;
  const dy = p.y - CENTER.y;
  return [
    `.so-pulse${i}{opacity:0;animation:so-pulse${i} ${PERIOD_MS}ms linear infinite}`,
    keyframes(`so-pulse${i}`, [
      [0, "opacity:0;transform:none"],
      [pct(start), "opacity:1;transform:none"],
      [pct(arrive), `opacity:1;transform:translate(${dx}px,${dy}px)`],
      [pct(arrive + 1), "opacity:0;transform:none"],
      [100, "opacity:0;transform:none"],
    ]),
    `.so-person${i}{animation:so-person${i} ${PERIOD_MS}ms ease-out infinite}`,
    keyframes(`so-person${i}`, [
      [0, "fill:#cbd5e1"],
      [pct(arrive), "fill:#cbd5e1"],
      [pct(arrive + 250), `fill:${accent}`],
      [pct(HOLD_END_MS), `fill:${accent}`],
      [pct(RESET_MS), "fill:#cbd5e1"],
      [100, "fill:#cbd5e1"],
    ]),
  ].join("");
}).join("\n");

export function SocietyArt({ accent }: { accent: string }) {
  return (
    <ArtFrame
      prefix="so"
      css={buildCss(accent)}
      label="One AI model at the centre reaching out to people using it for homework, news, work, advice, art and code"
    >
      <g>
        {PEOPLE.map((p) => (
          <line
            key={p.label}
            x1={CENTER.x}
            y1={CENTER.y}
            x2={p.x}
            y2={p.y}
            stroke="#cbd5e1"
            strokeWidth={1.5}
            strokeDasharray="3 4"
          />
        ))}
        {PEOPLE.map((p, i) => (
          <g key={p.label} className={`so-person${i}`} fill={accent}>
            <circle cx={p.x} cy={p.y - 7} r={6} />
            <path d={`M${p.x - 10},${p.y + 11} a10,9 0 0 1 20,0 z`} />
            <text
              x={p.x}
              y={p.y + 24}
              fontSize={10}
              textAnchor="middle"
              fill="#475569"
              fontFamily="var(--font-geist-mono)"
            >
              {p.label}
            </text>
          </g>
        ))}
        {PEOPLE.map((p, i) => (
          <circle key={p.label} className={`so-pulse${i}`} cx={CENTER.x} cy={CENTER.y} r={4} fill={accent} />
        ))}
        <rect x={CENTER.x - 32} y={CENTER.y - 20} width={64} height={40} rx={10} fill="white" stroke={accent} strokeWidth={2} />
        <text
          x={CENTER.x}
          y={CENTER.y + 5}
          fontSize={14}
          textAnchor="middle"
          fill="#334155"
          fontWeight={700}
          fontFamily="var(--font-geist-mono)"
        >
          AI
        </text>
      </g>
    </ArtFrame>
  );
}
