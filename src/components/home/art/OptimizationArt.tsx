import { ArtFrame, keyframes, timeline } from "./ArtFrame";

// A ball takes shrinking gradient-descent steps down an error curve,
// leaving a trail of the settings it tried.

const PERIOD_MS = 7000;
const BALL_R = 8;
const STEP_XS = [42, 104, 143, 166, 179, 186, 189];

/** Error as a function of the knob setting: a lopsided bowl. */
function errorAt(x: number): number {
  const halfWidth = x < 190 ? 160 : 135;
  return 150 - 108 * ((x - 190) / halfWidth) ** 2;
}

const curve = Array.from({ length: 59 }, (_, i) => {
  const x = 20 + i * 5;
  return `${i === 0 ? "M" : "L"}${x},${errorAt(x).toFixed(1)}`;
}).join(" ");

const steps = STEP_XS.map((x) => ({ x, y: errorAt(x) - BALL_R - 1.5 }));

const START_MS = 300;
const HOLD_MS = 450;
const MOVE_MS = 350;
const END_MS = 6400;
const FADE_MS = 6800;

const pct = timeline(PERIOD_MS);
const at = (p: { x: number; y: number }) =>
  `transform:translate(${p.x}px,${p.y.toFixed(1)}px)`;

function ballFrames(): [number, string][] {
  const frames: [number, string][] = [
    [0, `${at(steps[0])};opacity:0`],
    [pct(START_MS), `${at(steps[0])};opacity:1`],
  ];
  let t = START_MS;
  for (let i = 1; i < steps.length; i++) {
    t += HOLD_MS;
    frames.push([pct(t), `${at(steps[i - 1])};opacity:1`]);
    t += MOVE_MS;
    frames.push([pct(t), `${at(steps[i])};opacity:1`]);
  }
  frames.push([pct(END_MS), `${at(steps.at(-1)!)};opacity:1`]);
  frames.push([pct(FADE_MS), `${at(steps.at(-1)!)};opacity:0`]);
  frames.push([100, `${at(steps[0])};opacity:0`]);
  return frames;
}

/** A trail dot appears when the ball leaves that spot. */
function trailAppearMs(i: number): number {
  return START_MS + (i + 1) * HOLD_MS + i * MOVE_MS;
}

const css = [
  `.oa-ball{${at(steps.at(-1)!)};animation:oa-ball ${PERIOD_MS}ms ease-in-out infinite}`,
  keyframes("oa-ball", ballFrames()),
  ...steps.slice(0, -1).map((_, i) =>
    [
      `.oa-dot${i}{opacity:.45;animation:oa-dot${i} ${PERIOD_MS}ms linear infinite}`,
      keyframes(`oa-dot${i}`, [
        [0, "opacity:0"],
        [pct(trailAppearMs(i)), "opacity:0"],
        [pct(trailAppearMs(i) + 120), "opacity:.45"],
        [pct(END_MS), "opacity:.45"],
        [pct(FADE_MS), "opacity:0"],
        [100, "opacity:0"],
      ]),
    ].join("")
  ),
].join("\n");

export function OptimizationArt({ accent }: { accent: string }) {
  return (
    <ArtFrame
      prefix="oa"
      css={css}
      label="A ball stepping down an error curve, taking smaller steps as it nears the bottom"
    >
      <path d={curve} fill="none" stroke="#cbd5e1" strokeWidth={3} strokeLinecap="round" />
      {steps.slice(0, -1).map((p, i) => (
        <circle key={i} className={`oa-dot${i}`} cx={p.x} cy={p.y} r={3} fill={accent} />
      ))}
      <g className="oa-ball">
        <circle r={BALL_R} fill={accent} />
        <circle r={BALL_R / 3} cx={-2.5} cy={-2.5} fill="white" opacity={0.5} />
      </g>
      <text x={14} y={22} fontSize={11} fill="#94a3b8" fontFamily="var(--font-geist-mono)">
        error
      </text>
      <text x={306} y={172} fontSize={11} fill="#94a3b8" textAnchor="end" fontFamily="var(--font-geist-mono)">
        knob setting →
      </text>
    </ArtFrame>
  );
}
