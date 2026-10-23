"use client";

import { useState } from "react";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { WidgetTabs } from "@/components/widgets/shared/WidgetTabs";
import { SourceLine } from "@/components/widgets/shared/SourceLine";
import type { Source } from "@/components/widgets/shared/caseTypes";

/**
 * Steps through how fast AI has improved, then into imagined futures, with a
 * diagram of how much of the world the AI of each stage could act on. The
 * point is that worries are about where AI is heading, not today's chatbot.
 */

// Clockwise from the top, roughly in the order AI reaches each one.
const REACH = [
  "Running code",
  "Computer use",
  "Critical systems",
  "Autonomous factories",
  "Robots",
  "Weapons",
] as const;

type Reach = (typeof REACH)[number];

/** How far AI has got into an area: growing, or widespread. */
type Level = 1 | 2;

const LEVEL_NAMES: Record<Level, string> = { 1: "Growing", 2: "Widespread" };
const LINE_WIDTH: Record<Level, number> = { 1: 2.5, 2: 4.5 };
/** Growing reach is dotted; widespread reach is solid. */
const LINE_DASH: Record<Level, string | undefined> = { 1: "1 5", 2: undefined };

function everywhereAt(level: Level): Partial<Record<Reach, Level>> {
  const reach: Partial<Record<Reach, Level>> = {};
  for (const r of REACH) reach[r] = level;
  return reach;
}

interface Step {
  id: string;
  label: string;
  when: string;
  imagined: boolean;
  could: string;
  reach: Partial<Record<Reach, Level>>;
  sources: Source[];
}

const STEPS: Step[] = [
  {
    id: "2022",
    label: "2022",
    when: "2022",
    imagined: false,
    could: "The original ChatGPT answered questions and wrote essays and short programs well enough to become the fastest-growing app ever, but it was still a chatbot in a window.",
    reach: {},
    sources: [{ label: "Wikipedia, ChatGPT", url: "https://en.wikipedia.org/wiki/ChatGPT" }],
  },
  {
    id: "2023",
    label: "2023",
    when: "2023",
    imagined: false,
    could: "GPT-4 passed the US bar exam, scoring around the top 10% of human test-takers by OpenAI's measure. Chatbots began searching the web for answers and running small programs.",
    reach: { "Running code": 1 },
    sources: [{ label: "Wikipedia, GPT-4", url: "https://en.wikipedia.org/wiki/GPT-4" }],
  },
  {
    id: "2024",
    label: "2024",
    when: "2024",
    imagined: false,
    could: "Models began operating computers for people, clicking and typing like a person would, and drones in Ukraine increasingly steered themselves to their targets.",
    reach: { "Running code": 1, "Computer use": 1, "Weapons": 1 },
    sources: [
      { label: "Wikipedia, Claude", url: "https://en.wikipedia.org/wiki/Claude_(language_model)" },
      { label: "Wikipedia, lethal autonomous weapons", url: "https://en.wikipedia.org/wiki/Lethal_autonomous_weapon" },
    ],
  },
  {
    id: "2025",
    label: "2025",
    when: "2025",
    imagined: false,
    could: "AI reached gold-medal standard at the International Mathematical Olympiad. Agents began doing tasks on their own on real computers, and the length of task they could complete was doubling about every seven months. Driverless taxis gave hundreds of thousands of rides a week, and humanoid robots began rolling off production lines.",
    reach: { "Running code": 2, "Computer use": 1, "Weapons": 1 },
    sources: [
      { label: "Google DeepMind", url: "https://deepmind.google/discover/blog/advanced-version-of-gemini-with-deep-think-officially-achieves-gold-medal-standard-at-the-international-mathematical-olympiad/" },
      { label: "METR", url: "https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/" },
      { label: "Wikipedia, Waymo", url: "https://en.wikipedia.org/wiki/Waymo" },
      { label: "Wikipedia, humanoid robots", url: "https://en.wikipedia.org/wiki/Humanoid_robot" },
    ],
  },
  {
    id: "2026",
    label: "2026",
    when: "2026: today",
    imagined: false,
    could: "Agents work on their own for hours at a time and are trusted with company systems. AI is starting to help run power grids, factories, robots and weapons.",
    reach: { "Running code": 2, "Computer use": 1, "Critical systems": 1, "Autonomous factories": 1, "Robots": 1, "Weapons": 1 },
    sources: [
      { label: "Wikipedia, METR", url: "https://en.wikipedia.org/wiki/METR" },
      { label: "Wikipedia, Waymo", url: "https://en.wikipedia.org/wiki/Waymo" },
      { label: "Wikipedia, humanoid robots", url: "https://en.wikipedia.org/wiki/Humanoid_robot" },
      { label: "Wikipedia, lethal autonomous weapons", url: "https://en.wikipedia.org/wiki/Lethal_autonomous_weapon" },
      { label: "Wikipedia, lights-out factories", url: "https://en.wikipedia.org/wiki/Lights_out_(manufacturing)" },
      { label: "PNNL on AI in power systems", url: "https://www.pnnl.gov/publications/artificial-intelligence-and-machine-learning-applications-modern-power-systems" },
    ],
  },
  {
    id: "future",
    label: "Imagine",
    when: "An imagined future",
    imagined: true,
    could: "If progress continues, AI could do most office work, and most of the work of building the next AI. Because it does these jobs well, people hand it the power grid, supply chains and factories with no people in them, guarded by robots and building more robots. Militaries rely on AI that reacts faster than any person, and many people do whatever their trusted AI advisers persuade them to. An AI in this world that wanted something we didn't would not be a chatbot in a window.",
    reach: everywhereAt(2),
    sources: [{ label: "AI 2027", url: "https://ai-2027.com/" }],
  },
];

const W = 440;
const H = 250;
const CX = W / 2;
const CY = 125;
const RX = 150;
const RY = 92;
const FONT = 13;
const PILL_H = 30;

function nodePos(i: number) {
  const angle = -Math.PI / 2 + (i / REACH.length) * Math.PI * 2;
  return { x: CX + RX * Math.cos(angle), y: CY + RY * Math.sin(angle) };
}

const COLOR = "#2a78d6";
/** Pill fill for each level: first signs barely tinted, widespread strongly. */
const PILL_FILL: Record<Level, string> = { 1: "#eff6ff", 2: "#bfdbfe" };

/** `growth` runs from 0 at the first step to 1 at the last. */
function ReachDiagram({ step, growth }: { step: Step; growth: number }) {
  const reached = REACH.flatMap((r) => {
    const level = step.reach[r];
    return level ? [`${r} (${LEVEL_NAMES[level].toLowerCase()})`] : [];
  });
  const horizon = 0.3 + 0.75 * growth;
  const coreR = 20 + 18 * growth;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`What the AI of ${step.when} could act on: ${reached.join(", ") || "nothing beyond its chat window"}`}>
      {/* The shaded horizon and the AI itself both grow with each step. */}
      <ellipse cx={CX} cy={CY} rx={RX * horizon} ry={RY * horizon} fill={COLOR} fillOpacity={0.08} />
      {REACH.map((name, i) => {
        const level = step.reach[name];
        if (!level) return null;
        const p = nodePos(i);
        return (
          <line
            key={name}
            x1={CX}
            y1={CY}
            x2={p.x}
            y2={p.y}
            stroke={COLOR}
            strokeWidth={LINE_WIDTH[level]}
            strokeDasharray={LINE_DASH[level]}
            strokeLinecap="round"
            strokeOpacity={level === 2 ? 0.95 : 0.8}
          />
        );
      })}
      {REACH.map((name, i) => {
        const level = step.reach[name];
        const p = nodePos(i);
        const w = name.length * FONT * 0.56 + 24;
        return (
          <g key={`${name}-label`}>
            <rect
              x={p.x - w / 2}
              y={p.y - PILL_H / 2}
              width={w}
              height={PILL_H}
              rx={PILL_H / 2}
              fill={level ? PILL_FILL[level] : "white"}
              stroke={level ? COLOR : "#d1d5db"}
              strokeWidth={level === 2 ? 2 : 1}
            />
            <text
              x={p.x}
              y={p.y + FONT * 0.35}
              fontSize={FONT}
              textAnchor="middle"
              fill={level ? "#111827" : "#9ca3af"}
              fontWeight={level === 2 ? 600 : 400}
            >
              {name}
            </text>
          </g>
        );
      })}
      <circle cx={CX} cy={CY} r={coreR} fill={COLOR} />
      <text x={CX} y={CY + 5} fontSize={15} textAnchor="middle" fill="white" fontWeight={700}>
        AI
      </text>
    </svg>
  );
}

function Legend() {
  return (
    <div className="not-prose mt-1 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-muted">
      {([1, 2] as const).map((level) => (
        <span key={level} className="inline-flex items-center gap-1.5">
          <svg width="28" height="10" aria-hidden>
            <line x1="2" y1="5" x2="26" y2="5" stroke={COLOR} strokeWidth={LINE_WIDTH[level]} strokeDasharray={LINE_DASH[level]} strokeLinecap="round" />
          </svg>
          {LEVEL_NAMES[level]}
        </span>
      ))}
    </div>
  );
}

export function Trajectory() {
  const [stepId, setStepId] = useState(STEPS[0].id);
  const step = STEPS.find((s) => s.id === stepId) ?? STEPS[0];

  return (
    <WidgetContainer
      title="Where AI is heading"
      description="How fast AI has improved, how much of the world it can act on, and where that could lead."
      onReset={() => setStepId(STEPS[0].id)}
    >
      <WidgetTabs tabs={STEPS.map((s) => ({ id: s.id, label: s.label }))} activeTab={step.id} onTabChange={setStepId} />
      <div className="not-prose mb-2 flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">{step.when}</span>
        {step.imagined && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Imagined, not a prediction</span>
        )}
      </div>
      <p className="not-prose mb-3 text-base leading-relaxed text-foreground">{step.could}</p>
      <ReachDiagram step={step} growth={STEPS.indexOf(step) / (STEPS.length - 1)} />
      <Legend />
      <SourceLine sources={step.sources} />
    </WidgetContainer>
  );
}
