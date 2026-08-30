"use client";

import { useState } from "react";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { WidgetTabs } from "@/components/widgets/shared/WidgetTabs";
import { promptExamples } from "./promptExamples";

export function PromptsAndCompletions() {
  const [exampleId, setExampleId] = useState(promptExamples[0].id);
  const example =
    promptExamples.find((e) => e.id === exampleId) ?? promptExamples[0];

  return (
    <WidgetContainer
      title="Prompts and completions"
      description="Give a model some text, and it writes the text that follows."
      onReset={() => setExampleId(promptExamples[0].id)}
    >
      <WidgetTabs
        tabs={promptExamples.map((e) => ({ id: e.id, label: e.kind }))}
        activeTab={exampleId}
        onTabChange={setExampleId}
      />

      <div className="overflow-hidden rounded-lg border border-widget-border">
        <div className="border-b border-widget-border bg-surface px-4 py-2">
          <span className="text-xs font-bold uppercase tracking-widest text-muted">
            The prompt
          </span>
        </div>
        <div className="whitespace-pre-wrap bg-surface px-4 py-3 font-mono text-sm leading-relaxed text-foreground">
          {example.prompt}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-accent/40">
        <div className="border-b border-accent/30 bg-accent/10 px-4 py-2">
          <span className="text-xs font-bold uppercase tracking-widest text-accent">
            The completion
          </span>
        </div>
        <div className="whitespace-pre-wrap bg-accent/5 px-4 py-3 font-mono text-sm leading-relaxed text-foreground">
          {example.completion.replace(/^\n/, "")}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-dashed border-border">
        <div className="border-b border-border bg-foreground/[0.03] px-4 py-2">
          <span className="text-xs font-bold uppercase tracking-widest text-muted">
            The two of them together
          </span>
        </div>
        <div className="whitespace-pre-wrap px-4 py-3 font-mono text-sm leading-relaxed">
          <span className="text-foreground">{example.prompt}</span>
          <span className="rounded bg-accent/15 text-accent-dark">
            {example.completion}
          </span>
        </div>
      </div>
    </WidgetContainer>
  );
}
