"use client";

import { useState } from "react";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { WidgetTabs } from "@/components/widgets/shared/WidgetTabs";
import { ChatMessage } from "@/components/widgets/shared/ChatMessage";
import {
  getMemoryScenario,
  isMonospace,
  isVisible,
  memoryScenarios,
  senderKind,
  senderLabel,
} from "./memoryTranscripts";

export function MemoryLoop() {
  const [scenarioId, setScenarioId] = useState(memoryScenarios[0].id);
  const scenario = getMemoryScenario(scenarioId);

  return (
    <WidgetContainer
      title="Remembering between conversations"
      description="Separate conversations, weeks apart. Nothing about the model changes in between."
      onReset={() => setScenarioId(memoryScenarios[0].id)}
    >
      <WidgetTabs
        tabs={memoryScenarios.map((s) => ({ id: s.id, label: s.label }))}
        activeTab={scenarioId}
        onTabChange={setScenarioId}
      />

      {scenario.conversations.map((conversation, c) => (
        <div key={c} className={c > 0 ? "mt-8" : ""}>
          <div className="mb-3 flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-muted">
              {conversation.when}
            </span>
            <span className="h-px flex-1 bg-widget-border" />
          </div>
          <div className="space-y-3">
            {conversation.turns.map((turn, i) => (
              <ChatMessage
                key={i}
                sender={senderLabel(turn)}
                kind={senderKind(turn)}
                hidden={!isVisible(turn)}
                mono={isMonospace(turn)}
                text={turn.text}
                collapsed={c > 0 && turn.role === "system"}
              />
            ))}
          </div>
        </div>
      ))}

      <p className="mt-6 border-t border-widget-border pt-3 text-sm leading-relaxed text-muted">
        {scenario.takeaway}
      </p>
    </WidgetContainer>
  );
}
