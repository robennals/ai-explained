"use client";

import { useState } from "react";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { WidgetTabs } from "@/components/widgets/shared/WidgetTabs";
import { completionExamples, getExample } from "./baseVsChatExamples";

export function RawCompletion() {
  const [exampleId, setExampleId] = useState(completionExamples[0].id);
  const example = getExample(exampleId);
  const completion = example.base.replace(/^\n/, "");

  return (
    <WidgetContainer
      title="What a base model writes"
      description="A model that has only ever been asked to predict the next word."
      onReset={() => setExampleId(completionExamples[0].id)}
    >
      <WidgetTabs
        tabs={completionExamples.map((e) => ({ id: e.id, label: e.label }))}
        activeTab={exampleId}
        onTabChange={setExampleId}
      />

      <div className="overflow-hidden rounded-lg border border-widget-border">
        <div className="border-b border-widget-border bg-surface px-4 py-2">
          <span className="text-xs font-bold uppercase tracking-widest text-muted">
            Text handed to the model
          </span>
        </div>
        <div className="whitespace-pre-wrap bg-surface px-4 py-3 font-mono text-sm leading-relaxed text-foreground">
          {example.prompt}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-accent/40">
        <div className="border-b border-accent/30 bg-accent/10 px-4 py-2">
          <span className="text-xs font-bold uppercase tracking-widest text-accent">
            What the model predicts next
          </span>
        </div>
        <div className="whitespace-pre-wrap bg-accent/5 px-4 py-3 text-base leading-relaxed text-foreground">
          {completion}
        </div>
      </div>

      <p className="mt-4 text-base leading-relaxed text-foreground">
        <span className="font-semibold">Why: </span>
        {example.baseNote}
      </p>
    </WidgetContainer>
  );
}
