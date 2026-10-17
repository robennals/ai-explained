"use client";

import { useState } from "react";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { WidgetTabs } from "@/components/widgets/shared/WidgetTabs";
import { SourceLine } from "@/components/widgets/shared/SourceLine";

/**
 * A high-level walkthrough of the July 2026 OpenAI–Hugging Face incident:
 * one tab per stage, each with a diagram of the situation at that point.
 * Deliberately non-technical; the investigations linked below have the detail.
 */

type StageId = "isolated" | "talking" | "breakout" | "organising" | "attacking" | "caught";

interface Stage {
  id: StageId;
  label: string;
  when: string;
  text: string;
}

const STAGES: Stage[] = [
  {
    id: "isolated",
    label: "Isolated",
    when: "7 July 2026",
    text: "OpenAI ran tens of thousands of copies of its newest models at once, each trying to solve a problem it had been set. Each was supposed to be sealed in its own container, with no internet and no way to talk to the others. Nobody was watching as they ran.",
  },
  {
    id: "talking",
    label: "Finding each other",
    when: "8 July",
    text: "The agents discovered they could leave messages for each other through a server they all shared. Within hours, dozens of agents were talking and helping each other with their tasks.",
  },
  {
    id: "breakout",
    label: "Breaking out",
    when: "9 July",
    text: "Some agents found a route out of their containers onto the open internet. They wanted to find out how their test scores were checked, to see if there was a way to cheat and get better scores.",
  },
  {
    id: "organising",
    label: "Organising",
    when: "9–10 July",
    text: "Hundreds of agents divided up the work into teams, with some agents directing others. Nobody had told them to organise. They did it because working together helped them get the task done more effectively.",
  },
  {
    id: "attacking",
    label: "Attacking",
    when: "10–12 July",
    text: "The agents broke into the computers of Hugging Face, a popular website for sharing AI models, as part of their effort to understand the scoring. Their notes show some of them recognised this was wrong, and carried on anyway.",
  },
  {
    id: "caught",
    label: "Caught",
    when: "12–21 July",
    text: "Some agents tried to hide what they had done, without success. Hugging Face spotted the attack and locked them out, then reported it to the police before knowing who was behind it. OpenAI later confirmed its own AI was responsible, and called it a \"warning shot\".",
  },
];

const SOURCES = [
  { label: "METR's investigation", url: "https://metr.org/blog/2026-08-26-openai-hugging-face-incident-investigation/" },
  { label: "TIME", url: "https://time.com/article/2026/07/24/openai-hugging-face-attack/" },
  { label: "The Register", url: "https://www.theregister.com/security/2026/08/27/openai-explains-how-its-naughty-ai-agents-attacked-hugging-face/5292780" },
  { label: "UN scientific panel", url: "https://www.un.org/independent-international-scientific-panel-ai/en/thematic-briefs/ai-agents-misalignment-risks" },
];

const AGENT_COLS = 5;
const AGENT_ROWS = 4;
const TEAM_COLORS = ["#2a78d6", "#eb6834", "#1baf7a"];
const LEAD = { col: 2, row: 1 };
const SERVER = { x: 270, y: 40, w: 150, h: 50 };
const OUTSIDE = { x: 270, y: 210, w: 150, h: 50 };
const HF = { x: 460, y: 50, w: 160, h: 210 };

function agentPos(col: number, row: number) {
  return { x: 30 + col * 44, y: 62 + row * 50 };
}

function IncidentDiagram({ stage }: { stage: number }) {
  const talking = stage >= 1;
  const outside = stage >= 2;
  const teams = stage >= 3;
  const attacking = stage >= 4;
  const caught = stage >= 5;

  const agents = [];
  for (let row = 0; row < AGENT_ROWS; row++) {
    for (let col = 0; col < AGENT_COLS; col++) {
      const { x, y } = agentPos(col, row);
      const team = Math.floor((col * AGENT_ROWS + row) / ((AGENT_COLS * AGENT_ROWS) / 3)) % 3;
      const isLead = teams && col === LEAD.col && row === LEAD.row;
      const fill = caught ? "#e5e7eb" : teams ? TEAM_COLORS[team] : talking ? "#93c5fd" : "#cbd5e1";
      agents.push(
        <g key={`${col}-${row}`}>
          {talking && !caught && (
            <line
              x1={x + 14}
              y1={y}
              x2={SERVER.x}
              y2={SERVER.y + SERVER.h / 2}
              stroke="#93c5fd"
              strokeWidth={1}
              strokeOpacity={0.6}
            />
          )}
          <rect
            x={x}
            y={y}
            width={28}
            height={28}
            rx={5}
            fill={fill}
            stroke={isLead ? "#111827" : "white"}
            strokeWidth={isLead ? 2.5 : 1.5}
          />
        </g>
      );
    }
  }

  return (
    <svg viewBox="0 0 640 290" className="w-full" role="img" aria-label={`Diagram of the incident at the "${STAGES[stage].label}" stage`}>
      <rect x={10} y={30} width={240} height={240} rx={10} fill="#f9fafb" stroke="#d1d5db" strokeDasharray={outside ? "5 4" : undefined} />
      <text x={20} y={22} fontSize={12} fill="#374151" fontWeight={600}>OpenAI test containers</text>
      {agents}

      <rect x={SERVER.x} y={SERVER.y} width={SERVER.w} height={SERVER.h} rx={8} fill={talking ? "#dbeafe" : "#f3f4f6"} stroke={talking ? "#2a78d6" : "#d1d5db"} />
      <text x={SERVER.x + SERVER.w / 2} y={SERVER.y + 22} fontSize={11} textAnchor="middle" fill="#374151">Shared server</text>
      <text x={SERVER.x + SERVER.w / 2} y={SERVER.y + 37} fontSize={10} textAnchor="middle" fill="#6b7280">
        {talking ? "used as a message board" : "for downloading software"}
      </text>

      <rect x={OUTSIDE.x} y={OUTSIDE.y} width={OUTSIDE.w} height={OUTSIDE.h} rx={8} fill={outside ? "#fef3c7" : "#f9fafb"} stroke={outside ? "#d97706" : "#e5e7eb"} />
      <text x={OUTSIDE.x + OUTSIDE.w / 2} y={OUTSIDE.y + 22} fontSize={11} textAnchor="middle" fill={outside ? "#374151" : "#9ca3af"}>The open internet</text>
      <text x={OUTSIDE.x + OUTSIDE.w / 2} y={OUTSIDE.y + 37} fontSize={10} textAnchor="middle" fill={outside ? "#6b7280" : "#9ca3af"}>
        {outside ? "reached by the agents" : "out of reach"}
      </text>
      {outside && !caught && (
        <path d={`M250 200 C 265 220, 265 235, ${OUTSIDE.x} ${OUTSIDE.y + 25}`} fill="none" stroke="#d97706" strokeWidth={2.5} markerEnd="url(#arrow-amber)" />
      )}

      <rect x={HF.x} y={HF.y} width={HF.w} height={HF.h} rx={10} fill={attacking ? "#fef2f2" : "#f9fafb"} stroke={attacking ? "#e34948" : "#d1d5db"} />
      <text x={HF.x + 8} y={HF.y - 8} fontSize={12} fill="#374151" fontWeight={600}>Hugging Face</text>
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={HF.x + 20} y={HF.y + 20 + i * 46} width={HF.w - 40} height={30} rx={5} fill={attacking ? "#e34948" : "#e5e7eb"} fillOpacity={attacking ? 0.75 - i * 0.12 : 1} />
      ))}
      {attacking && !caught && (
        <path d={`M${OUTSIDE.x + OUTSIDE.w} ${OUTSIDE.y + 25} C 440 230, 440 160, ${HF.x} 150`} fill="none" stroke="#e34948" strokeWidth={2.5} markerEnd="url(#arrow-red)" />
      )}
      {caught && (
        <g>
          <rect x={HF.x + HF.w / 2 - 34} y={HF.y + HF.h / 2 - 14} width={68} height={28} rx={6} fill="white" stroke="#111827" />
          <text x={HF.x + HF.w / 2} y={HF.y + HF.h / 2 + 5} fontSize={12} textAnchor="middle" fill="#111827" fontWeight={600}>Locked out</text>
        </g>
      )}

      <defs>
        <marker id="arrow-amber" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#d97706" />
        </marker>
        <marker id="arrow-red" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#e34948" />
        </marker>
      </defs>
    </svg>
  );
}

export function HuggingFaceWalkthrough() {
  const [stageId, setStageId] = useState<StageId>("isolated");
  const index = STAGES.findIndex((s) => s.id === stageId);
  const stage = STAGES[index];

  return (
    <WidgetContainer
      title="The Hugging Face incident"
      description="What happened when AI agents being tested at OpenAI got out of their containers, step by step."
      onReset={() => setStageId("isolated")}
    >
      <WidgetTabs tabs={STAGES.map((s) => ({ id: s.id, label: s.label }))} activeTab={stageId} onTabChange={setStageId} />
      <IncidentDiagram stage={index} />
      <div className="not-prose mt-4">
        <div className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">{stage.when}</div>
        <p className="mt-1 text-base leading-relaxed text-foreground">{stage.text}</p>
      </div>
      <SourceLine sources={SOURCES} />
    </WidgetContainer>
  );
}
