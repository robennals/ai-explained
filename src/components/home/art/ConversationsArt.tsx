import { ArtFrame, keyframes, timeline } from "./ArtFrame";

// A chat appears bubble by bubble, then rearranges itself into what the
// model really sees: one long document with "User:" and "AI:" labels.

const PERIOD_MS = 9000;
const MESSAGES = [
  { role: "user", text: "Can you help me?" },
  { role: "ai", text: "Sure! With what?" },
  { role: "user", text: "Name a fruit." },
  { role: "ai", text: "Banana!" },
] as const;
const CHAR_W = 6.4;
const BUBBLE_PAD = 9;
const BUBBLE_H = 24;
const LABEL_W = 42;
const DOC = { x: 44, y: 22, w: 232, h: 140 };
const DOC_TEXT_X = DOC.x + 14 + LABEL_W;

const layout = MESSAGES.map((m, i) => {
  const bubbleW = m.text.length * CHAR_W + BUBBLE_PAD * 2;
  const bubbleX = m.role === "user" ? 300 - bubbleW : 20;
  return {
    ...m,
    bubbleW,
    chat: { x: bubbleX + BUBBLE_PAD, y: 38 + i * 34 },
    doc: { x: DOC_TEXT_X, y: DOC.y + 30 + i * 28 },
  };
});

const pct = timeline(PERIOD_MS);
const MORPH_MS = 3600;
const MORPH_LEN_MS = 900;
const HOLD_END_MS = 8000;
const RESET_MS = 8600;
const tr = (p: { x: number; y: number }) =>
  `transform:translate(${p.x.toFixed(1)}px,${p.y}px)`;

const css = [
  ...layout.map((m, i) => {
    const appear = 300 + i * 650;
    return [
      `.cv-m${i}{${tr(m.doc)};animation:cv-m${i} ${PERIOD_MS}ms cubic-bezier(.5,0,.2,1) infinite}`,
      keyframes(`cv-m${i}`, [
        [0, `${tr(m.chat)};opacity:0`],
        [pct(appear), `${tr(m.chat)};opacity:0`],
        [pct(appear + 250), `${tr(m.chat)};opacity:1`],
        [pct(MORPH_MS), `${tr(m.chat)};opacity:1`],
        [pct(MORPH_MS + MORPH_LEN_MS), `${tr(m.doc)};opacity:1`],
        [pct(HOLD_END_MS), `${tr(m.doc)};opacity:1`],
        [pct(RESET_MS), `${tr(m.doc)};opacity:0`],
        [100, `${tr(m.chat)};opacity:0`],
      ]),
    ].join("");
  }),
  `.cv-bubble{opacity:0;animation:cv-bubble ${PERIOD_MS}ms ease-in-out infinite}`,
  keyframes("cv-bubble", [
    [0, "opacity:1"],
    [pct(MORPH_MS), "opacity:1"],
    [pct(MORPH_MS + MORPH_LEN_MS * 0.6), "opacity:0"],
    [100, "opacity:0"],
  ]),
  `.cv-doc{animation:cv-doc ${PERIOD_MS}ms ease-in-out infinite}`,
  keyframes("cv-doc", [
    [0, "opacity:0"],
    [pct(MORPH_MS + MORPH_LEN_MS * 0.4), "opacity:0"],
    [pct(MORPH_MS + MORPH_LEN_MS), "opacity:1"],
    [pct(HOLD_END_MS), "opacity:1"],
    [pct(RESET_MS), "opacity:0"],
    [100, "opacity:0"],
  ]),
].join("\n");

export function ConversationsArt({ accent }: { accent: string }) {
  return (
    <ArtFrame
      prefix="cv"
      css={css}
      label="Chat bubbles rearranging into a single document with User and AI labels"
    >
      <g className="cv-doc">
        <rect x={DOC.x} y={DOC.y} width={DOC.w} height={DOC.h} rx={6} fill="white" stroke="#cbd5e1" />
        <path d={`M${DOC.x + DOC.w - 18},${DOC.y} v18 h18`} fill="#f1f5f9" stroke="#cbd5e1" />
      </g>
      {layout.map((m, i) => {
        const isUser = m.role === "user";
        return (
          <g key={i} className={`cv-m${i}`}>
            <rect
              className="cv-bubble"
              x={-BUBBLE_PAD}
              y={-16}
              width={m.bubbleW}
              height={BUBBLE_H}
              rx={12}
              fill={isUser ? accent : "#e2e8f0"}
            />
            <text
              className="cv-doc"
              x={-LABEL_W}
              y={0}
              fontSize={10.5}
              fill={isUser ? accent : "#64748b"}
              fontWeight={700}
              fontFamily="var(--font-geist-mono)"
            >
              {isUser ? "User:" : "AI:"}
            </text>
            <text y={0} fontSize={11} fill="#1e293b" fontFamily="var(--font-geist-mono)">
              {m.text}
            </text>
          </g>
        );
      })}
    </ArtFrame>
  );
}
