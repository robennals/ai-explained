"use client";

import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { ChatMessage } from "./ChatMessage";
import {
  conversations,
  isMonospace,
  isVisible,
  senderKind,
  senderLabel,
} from "./memoryTranscripts";

export function MemoryLoop() {
  return (
    <WidgetContainer
      title="Remembering between conversations"
      description="Two conversations, weeks apart. Nothing about the model changed in between."
    >
      {conversations.map((conversation, c) => (
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
              />
            ))}
          </div>
        </div>
      ))}

      <p className="mt-6 border-t border-widget-border pt-3 text-sm leading-relaxed text-muted">
        The second conversation is a fresh transcript. The model has no
        recollection of the first one, and no part of it changed in the three
        weeks between. The only thing that crossed the gap is one line of text,
        written by a tool call and fetched back by another.
      </p>
    </WidgetContainer>
  );
}
