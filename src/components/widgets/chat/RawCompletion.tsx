"use client";

import { useState } from "react";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { completionExamples, getExample } from "./baseVsChatExamples";

type Mode = "base" | "chat";

export function RawCompletion() {
  const [exampleId, setExampleId] = useState(completionExamples[0].id);
  const [mode, setMode] = useState<Mode>("base");
  const example = getExample(exampleId);
  const completion = mode === "base" ? example.base : example.chat;

  return (
    <WidgetContainer
      title="Base model vs chat model"
      description="The same prompt, given to a model before and after post-training."
      onReset={() => {
        setExampleId(completionExamples[0].id);
        setMode("base");
      }}
    >
      <div className="flex flex-wrap gap-2">
        {completionExamples.map((e) => (
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

      <div className="mt-5 rounded-lg border border-border bg-surface p-4">
        <div className="text-xs font-bold uppercase tracking-widest text-muted">
          Prompt
        </div>
        <p className="mt-1 text-base leading-relaxed text-foreground">
          {example.prompt}
        </p>
      </div>

      <div className="mt-5 flex gap-2">
        {(["base", "chat"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
              m === mode
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted hover:bg-foreground/5"
            }`}
          >
            {m === "base" ? "Base model" : "Chat model"}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-widget-border bg-white p-4">
        <div className="text-xs font-bold uppercase tracking-widest text-muted">
          What comes next
        </div>
        <pre className="mt-2 whitespace-pre-wrap font-sans text-base leading-relaxed text-foreground">
          {completion}
        </pre>
      </div>

      {mode === "base" && (
        <p className="mt-3 text-sm leading-relaxed text-muted">
          <span className="font-semibold text-foreground">Why: </span>
          {example.baseNote}
        </p>
      )}
      {mode === "chat" && (
        <p className="mt-3 text-sm leading-relaxed text-muted">
          <span className="font-semibold text-foreground">Why: </span>
          Post-training taught the model that text arriving in this position is
          a request addressed to it, and that the thing to write next is an
          answer.
        </p>
      )}
    </WidgetContainer>
  );
}
