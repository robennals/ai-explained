/**
 * Hand-authored memory.
 *
 * Two separate conversations, weeks apart. The first ends with the model
 * writing a note; the second begins with it searching for one. Nothing about
 * the model changed in between, which is the point: the only thing carrying
 * anything across is a line of text in a store the harness can read.
 */

export type MemoryTurnRole =
  | "user"
  | "assistant"
  | "memory-write"
  | "memory-search"
  | "memory-result";

export interface MemoryTurn {
  role: MemoryTurnRole;
  text: string;
}

export interface Conversation {
  /** When this conversation happens, shown above it. */
  when: string;
  turns: MemoryTurn[];
}

export const conversations: Conversation[] = [
  {
    when: "Tuesday",
    turns: [
      {
        role: "user",
        text: "Can you help me sort out the Lisbon trip? One thing: I'm useless before nine, so nothing that leaves early.",
      },
      {
        role: "memory-write",
        text: 'save_memory("Does not want flights departing before 09:00.")',
      },
      { role: "memory-result", text: "Saved." },
      {
        role: "assistant",
        text: "Noted, nothing before nine. There are two afternoon departures on the Thursday, at 13:20 and 16:05. Shall I look at what they cost?",
      },
    ],
  },
  {
    when: "Three weeks later, in a new conversation",
    turns: [
      { role: "user", text: "Get me on something to Berlin next Friday." },
      {
        role: "memory-search",
        text: 'search_memory("flights, travel preferences")',
      },
      {
        role: "memory-result",
        text: 'Does not want flights departing before 09:00.  (saved 3 weeks ago)',
      },
      {
        role: "assistant",
        text: "There's an 07:15 and an 11:40. You've mentioned before that you'd rather not fly before nine, so I've gone with the 11:40 unless you say otherwise.",
      },
    ],
  },
];

export function senderLabel(turn: MemoryTurn): string {
  switch (turn.role) {
    case "user":
      return "Human";
    case "assistant":
    case "memory-write":
    case "memory-search":
      return "Model";
    case "memory-result":
      return "Memory store";
  }
}

export function senderKind(
  turn: MemoryTurn
): "human" | "model" | "tool" | "system" {
  switch (turn.role) {
    case "user":
      return "human";
    case "memory-result":
      return "tool";
    default:
      return "model";
  }
}

/** Only the human's own messages and the model's replies reach the chat window. */
export function isVisible(turn: MemoryTurn): boolean {
  return turn.role === "user" || turn.role === "assistant";
}

export function isMonospace(turn: MemoryTurn): boolean {
  return !isVisible(turn);
}
