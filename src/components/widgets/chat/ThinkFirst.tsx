"use client";

import { useState } from "react";
import { ToggleControl } from "@/components/widgets/shared/ToggleControl";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { getReasoningExample, reasoningExamples } from "./reasoningExamples";

export function ThinkFirst() {
  const [exampleId, setExampleId] = useState(reasoningExamples[0].id);
  const [thinking, setThinking] = useState(true);
  const example = getReasoningExample(exampleId);

  return (
    <WidgetContainer
      title="Thinking before answering"
      description="The same model, with and without room to work things out first."
      onReset={() => {
        setExampleId(reasoningExamples[0].id);
        setThinking(true);
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {reasoningExamples.map((e) => (
            <button
              key={e.id}
              onClick={() => setExampleId(e.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                e.id === exampleId
                  ? "bg-accent text-white"
                  : "bg-foreground/5 text-muted hover:bg-foreground/10"
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>
        <ToggleControl
          label="Thinking tokens"
          checked={thinking}
          onChange={setThinking}
        />
      </div>

      <div className="mt-5 rounded-lg border border-border bg-surface p-4">
        <div className="text-xs font-bold uppercase tracking-widest text-muted">
          You ask
        </div>
        <p className="mt-1 text-base leading-relaxed text-foreground">
          {example.question}
        </p>
      </div>

      {thinking && (
        <div className="mt-4 rounded-lg border border-dashed border-border bg-foreground/[0.03] p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-muted">
            Thinking &middot; hidden from you
          </div>
          <ol className="mt-2 space-y-1.5">
            {example.trace.map((line, i) => (
              <li
                key={i}
                className="text-base leading-relaxed text-foreground/70"
              >
                {line}
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="mt-4 rounded-lg border border-widget-border bg-white p-4">
        <div className="text-xs font-bold uppercase tracking-widest text-muted">
          The model answers
        </div>
        <p className="mt-1 text-base leading-relaxed text-foreground">
          {thinking ? example.answer : example.quickAnswer}
        </p>
      </div>

      {!thinking && (
        <p className="mt-3 text-sm leading-relaxed text-muted">
          <span className="font-semibold text-foreground">Why it slips: </span>
          {example.quickWhy}
        </p>
      )}
      {thinking && (
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The thinking section is ordinary generated text. The model writes it,
          reads it back as context, and answers from there. Nothing else about
          the model has changed.
        </p>
      )}
    </WidgetContainer>
  );
}
