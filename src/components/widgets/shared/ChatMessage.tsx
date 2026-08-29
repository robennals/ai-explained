"use client";

/**
 * One message in a transcript, shared by the tool-use and skills playgrounds.
 * A message the human never sees gets a dashed outline and a "(hidden)" tag;
 * the human's own messages sit on the right, everything else on the left.
 */

export type ActorKind = "human" | "model" | "tool" | "system";

const actorColors: Record<ActorKind, string> = {
  human: "text-accent",
  model: "text-success",
  tool: "text-warning",
  system: "text-muted",
};

export function ChatMessage({
  sender,
  kind,
  hidden,
  mono,
  text,
  collapsed,
}: {
  sender: string;
  kind: ActorKind;
  hidden: boolean;
  mono?: boolean;
  text: string;
  /**
   * Fold the message away behind a summary line. For a message the reader has
   * already seen once in the same widget, such as a system prompt repeated at
   * the top of a second conversation.
   */
  collapsed?: boolean;
}) {
  const fromHuman = kind === "human";
  return (
    <div className={`flex flex-col ${fromHuman ? "items-end" : "items-start"}`}>
      <div
        className={`mb-1 px-1 text-xs font-bold uppercase tracking-widest ${actorColors[kind]}`}
      >
        {sender}
        {hidden && (
          <span className="font-medium normal-case text-muted"> (hidden)</span>
        )}
      </div>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
          hidden
            ? "border-2 border-dashed border-border bg-transparent"
            : fromHuman
              ? "bg-accent/15"
              : "bg-surface ring-1 ring-widget-border"
        }`}
      >
        {collapsed ? (
          <details>
            <summary className="cursor-pointer text-sm text-muted marker:text-muted">
              Same as above
            </summary>
            <div
              className={`mt-2 whitespace-pre-wrap leading-relaxed text-foreground ${
                mono ? "font-mono text-sm" : "text-base"
              }`}
            >
              {text}
            </div>
          </details>
        ) : (
          <div
            className={`whitespace-pre-wrap leading-relaxed text-foreground ${
              mono ? "font-mono text-sm" : "text-base"
            }`}
          >
            {text}
          </div>
        )}
      </div>
    </div>
  );
}
