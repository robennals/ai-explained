"use client";

import { useState } from "react";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { WidgetTabs } from "@/components/widgets/shared/WidgetTabs";
import {
  addressLine,
  getScenario,
  isVisibleToUser,
  scenarios,
  type Turn,
} from "./toolTranscripts";

function Message({ turn }: { turn: Turn }) {
  const { from, to } = addressLine(turn);
  const hidden = !isVisibleToUser(turn);
  const mono = turn.role === "tool-call" || turn.role === "tool-result";

  return (
    <div>
      <div className="mb-1 px-1 text-xs font-bold uppercase tracking-widest text-muted">
        {from} <span aria-hidden>→</span> {to}
      </div>
      <div
        className={`rounded-lg border px-4 py-2.5 ${
          hidden
            ? "border-dashed border-border bg-foreground/[0.03]"
            : "border-widget-border bg-widget-bg"
        }`}
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
      description="One transcript of messages. The dashed ones are in it too, you are just never shown them."
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
