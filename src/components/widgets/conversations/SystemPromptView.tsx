"use client";

import { useState } from "react";
import { ChatMessage } from "@/components/widgets/shared/ChatMessage";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import {
  isVisible,
  senderKind,
  senderLabel,
  withSystemPrompt,
} from "./chatTranscript";

type View = "raw" | "bubbles";

const markers: Record<string, string> = {
  system: "<|system|>",
  user: "<|user|>",
  assistant: "<|assistant|>",
};

export function SystemPromptView() {
  const [view, setView] = useState<View>("bubbles");
  const turns = withSystemPrompt();

  return (
    <WidgetContainer
      title="The system prompt"
      description="A message at the top of the conversation that the human never sees."
      onReset={() => setView("bubbles")}
    >
      <div className="flex gap-2">
        {(["bubbles", "raw"] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
              v === view
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted hover:bg-foreground/5"
            }`}
          >
            {v === "bubbles" ? "As messages" : "As text"}
          </button>
        ))}
      </div>

      {view === "bubbles" ? (
        <div className="mt-5 space-y-3">
          {turns.map((turn, i) => (
            <ChatMessage
              key={i}
              sender={senderLabel(turn)}
              kind={senderKind(turn)}
              hidden={!isVisible(turn)}
              text={turn.text}
            />
          ))}
        </div>
      ) : (
        <div className="mt-5 whitespace-pre-wrap rounded-lg border border-widget-border bg-surface px-4 py-3 font-mono text-sm leading-relaxed text-foreground">
          {turns
            .map((t) => `${markers[t.role]}${t.text}<|end|>`)
            .join("\n") + "\n<|assistant|>"}
        </div>
      )}

      <p className="mt-4 text-base leading-relaxed text-foreground">
        The system prompt is not a special channel or a rule the model is forced
        to obey. It is text at the top of the same stream, put there by the
        harness rather than by you, and the model completes the document it
        finds itself in.
      </p>
    </WidgetContainer>
  );
}
