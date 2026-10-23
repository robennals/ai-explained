"use client";

import { useState } from "react";
import { ChatMessage } from "@/components/widgets/shared/ChatMessage";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { WidgetTabs } from "@/components/widgets/shared/WidgetTabs";
import {
  completionFor,
  exchanges,
  isVisible,
  promptParts,
  senderKind,
  senderLabel,
  transcript,
} from "./chatTranscript";

type View = "raw" | "bubbles";

const ordinals = ["First reply", "Second reply", "Third reply", "Fourth reply"];

export function RepeatedTurns() {
  const [index, setIndex] = useState(0);
  const [view, setView] = useState<View>("raw");
  const assistantIndex = exchanges[index];

  return (
    <WidgetContainer
      title="The conversation goes back every time"
      description="Step through the replies, and watch the prompt grow."
      onReset={() => {
        setIndex(0);
        setView("raw");
      }}
    >
      <WidgetTabs
        tabs={exchanges.map((_, i) => ({ id: String(i), label: ordinals[i] }))}
        activeTab={String(index)}
        onTabChange={(id) => setIndex(Number(id))}
      />

      <div className="flex gap-2">
        {(["raw", "bubbles"] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
              v === view
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted hover:bg-foreground/5"
            }`}
          >
            {v === "raw" ? "As text" : "As messages"}
          </button>
        ))}
      </div>

      {view === "raw" ? (
        <>
          <div className="mt-5 overflow-hidden rounded-lg border border-widget-border">
            <div className="border-b border-widget-border bg-surface px-4 py-2">
              <span className="text-xs font-bold uppercase tracking-widest text-muted">
                The prompt
              </span>
            </div>
            <div className="whitespace-pre-wrap bg-surface px-4 py-3 font-mono text-sm leading-relaxed text-foreground">
              {promptParts(assistantIndex)
                .map((part) => part.text)
                .join("")}
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-accent/40">
            <div className="border-b border-accent/30 bg-accent/10 px-4 py-2">
              <span className="text-xs font-bold uppercase tracking-widest text-accent">
                The completion
              </span>
            </div>
            <div className="whitespace-pre-wrap bg-accent/5 px-4 py-3 font-mono text-sm leading-relaxed text-foreground">
              {completionFor(assistantIndex)}
            </div>
          </div>
        </>
      ) : (
        <div className="mt-5 space-y-3">
          {transcript.slice(0, assistantIndex + 1).map((turn, i) => (
            <ChatMessage
              key={i}
              sender={senderLabel(turn)}
              kind={senderKind(turn)}
              hidden={!isVisible(turn)}
              text={turn.text}
            />
          ))}
        </div>
      )}

      <p className="mt-4 text-base leading-relaxed text-foreground">
        {index === 0
          ? "The first reply in a conversation. Nothing has been sent before, so the whole prompt is new."
          : "The model kept nothing from last time. Its own earlier replies are in the prompt because the harness put them there, along with everything else that has been said."}
      </p>
    </WidgetContainer>
  );
}
