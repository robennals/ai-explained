"use client";

import { useState } from "react";
import { ChatMessage } from "@/components/widgets/shared/ChatMessage";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { WidgetTabs } from "@/components/widgets/shared/WidgetTabs";
import { getReasoningExample, reasoningExamples } from "./reasoningExamples";

export function ThinkFirst() {
  const [exampleId, setExampleId] = useState(reasoningExamples[0].id);
  const example = getReasoningExample(exampleId);

  return (
    <WidgetContainer
      title="Thinking before answering"
      description="The model writes to itself first, in a message the human never sees."
      onReset={() => setExampleId(reasoningExamples[0].id)}
    >
      <WidgetTabs
        tabs={reasoningExamples.map((e) => ({ id: e.id, label: e.label }))}
        activeTab={exampleId}
        onTabChange={setExampleId}
      />

      <div className="space-y-3">
        <ChatMessage
          sender="Human"
          kind="human"
          hidden={false}
          text={example.question}
        />
        <ChatMessage
          sender="Model, thinking"
          kind="model"
          hidden
          text={example.trace.join("\n")}
        />
        <ChatMessage
          sender="Model"
          kind="model"
          hidden={false}
          text={example.answer}
        />
      </div>

      <p className="mt-4 text-base leading-relaxed text-foreground">
        The dashed message is the model talking to itself. It is predicted one
        token at a time, exactly like the answer, and the model reads it back
        before writing that answer.
      </p>
    </WidgetContainer>
  );
}
