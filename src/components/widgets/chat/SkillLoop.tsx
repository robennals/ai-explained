"use client";

import { useState } from "react";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { WidgetTabs } from "@/components/widgets/shared/WidgetTabs";
import { ChatMessage } from "./ChatMessage";
import {
  getSkillScenario,
  isSkillTurnVisible,
  skillScenarios,
  skillSenderKind,
  skillSenderLabel,
} from "./skillTranscripts";

export function SkillLoop() {
  const [scenarioId, setScenarioId] = useState(skillScenarios[0].id);
  const scenario = getSkillScenario(scenarioId);

  return (
    <WidgetContainer
      title="Loading a skill"
      description="The conversation opens with a list of what is available, one line each."
      onReset={() => setScenarioId(skillScenarios[0].id)}
    >
      <WidgetTabs
        tabs={skillScenarios.map((s) => ({ id: s.id, label: s.label }))}
        activeTab={scenarioId}
        onTabChange={setScenarioId}
      />

      <div className="space-y-3">
        {scenario.turns.map((turn, i) => (
          <ChatMessage
            key={i}
            sender={skillSenderLabel(turn)}
            kind={skillSenderKind(turn)}
            hidden={!isSkillTurnVisible(turn)}
            mono={
              turn.role === "skill-request" ||
              turn.role === "skill-document" ||
              turn.role === "system"
            }
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
