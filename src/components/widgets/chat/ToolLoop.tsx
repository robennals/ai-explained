"use client";

import { useState } from "react";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { WidgetTabs } from "@/components/widgets/shared/WidgetTabs";
import { ChatMessage } from "./ChatMessage";
import {
  getScenario,
  isVisibleToUser,
  scenarios,
  senderKind,
  senderLabel,
} from "./toolTranscripts";

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

      <div className="space-y-3">
        {scenario.turns.map((turn, i) => (
          <ChatMessage
            key={i}
            sender={senderLabel(turn)}
            kind={senderKind(turn)}
            hidden={!isVisibleToUser(turn)}
            mono={turn.role === "tool-call" || turn.role === "tool-result"}
            text={turn.text}
          />
        ))}
      </div>

      <p className="mt-4 border-t border-widget-border pt-3 text-sm leading-relaxed text-muted">
        {scenario.takeaway}
      </p>
    </WidgetContainer>
  );
}
