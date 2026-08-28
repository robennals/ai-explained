"use client";

import { useState } from "react";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { WidgetTabs } from "@/components/widgets/shared/WidgetTabs";
import {
  getScenario,
  isVisibleToUser,
  scenarios,
  senderLabel,
  type Turn,
} from "./toolTranscripts";

/**
 * CSS `border-style: dashed` gives no control over dash and gap length, so a
 * hidden message draws its outline as an SVG rect instead, where
 * `stroke-dasharray` sets both. `rx` matches the bubble's rounded-2xl corner.
 */
const dashedOutline =
  "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' stroke='%236b7280' stroke-width='4' stroke-dasharray='8%2c 6' rx='16' ry='16'/%3e%3c/svg%3e\")";

function Message({ turn }: { turn: Turn }) {
  const fromHuman = turn.role === "user";
  const hidden = !isVisibleToUser(turn);
  const mono = turn.role === "tool-call" || turn.role === "tool-result";

  return (
    <div className={`flex flex-col ${fromHuman ? "items-end" : "items-start"}`}>
      <div className="mb-1 px-1 text-xs font-bold uppercase tracking-widest text-muted">
        {senderLabel(turn)}
        {hidden && <span className="font-medium normal-case"> (hidden)</span>}
      </div>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
          hidden
            ? ""
            : fromHuman
              ? "bg-accent/15"
              : "bg-surface ring-1 ring-widget-border"
        }`}
        style={hidden ? { backgroundImage: dashedOutline } : undefined}
      >
        <div
          className={`whitespace-pre-wrap leading-relaxed text-foreground ${
            mono ? "font-mono text-sm" : "text-base"
          }`}
        >
          {turn.text}
        </div>
      </div>
    </div>
  );
}

export function ToolLoop() {
  const [scenarioId, setScenarioId] = useState(scenarios[0].id);
  const scenario = getScenario(scenarioId);

  return (
    <WidgetContainer
      title="The tool-use loop"
      description="One conversation. The dashed messages are part of it too, the human is just never shown them."
      onReset={() => setScenarioId(scenarios[0].id)}
    >
      <WidgetTabs
        tabs={scenarios.map((s) => ({ id: s.id, label: s.label }))}
        activeTab={scenarioId}
        onTabChange={setScenarioId}
      />

      <p className="text-base leading-relaxed text-foreground">
        {scenario.intro}
      </p>

      <div className="mt-4 space-y-3">
        {scenario.turns.map((turn, i) => (
          <Message key={i} turn={turn} />
        ))}
      </div>

      <p className="mt-4 border-t border-widget-border pt-3 text-sm leading-relaxed text-muted">
        {scenario.takeaway}
      </p>
    </WidgetContainer>
  );
}
