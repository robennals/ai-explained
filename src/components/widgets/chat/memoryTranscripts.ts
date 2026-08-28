/**
 * Hand-authored memory.
 *
 * Conversations separated by weeks. A memory is written in one and fetched in
 * another, and nothing about the model changes in between: the only thing
 * carrying anything across is a line of text in a store the harness can read.
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

export interface MemoryScenario {
  id: string;
  /** Tab label. */
  label: string;
  conversations: Conversation[];
  /** Smaller text at the bottom. */
  takeaway: string;
}

export const memoryScenarios: MemoryScenario[] = [
  {
    id: "preference",
    label: "Something you mentioned once",
    conversations: [
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
            text: "Does not want flights departing before 09:00.  (saved 3 weeks ago)",
          },
          {
            role: "assistant",
            text: "There's an 07:15 and an 11:40. You've mentioned before that you'd rather not fly before nine, so I've gone with the 11:40 unless you say otherwise.",
          },
        ],
      },
    ],
    takeaway:
      "The second conversation is a fresh transcript. The model has no recollection of the first, and no part of it changed in the three weeks between. One line of text crossed the gap, written by one tool call and fetched by another.",
  },
  {
    id: "mistake",
    label: "Getting it wrong once",
    conversations: [
      {
        when: "Monday",
        turns: [
          {
            role: "user",
            text: "Draft a quick note to Siobhan thanking her for covering last week.",
          },
          {
            role: "assistant",
            text: "Here you go:\n\n“Hi Siobhan, thank you for covering last week, it was a real help. I owe you one.”",
          },
          {
            role: "user",
            text: "It's Siobhán, with the fada over the a. She does notice.",
          },
          {
            role: "memory-write",
            text: 'save_memory("Colleague is Siobhán, with the fada. Always spell it that way, even if I type it without.")',
          },
          { role: "memory-result", text: "Saved." },
          {
            role: "assistant",
            text: "Sorry, fixed:\n\n“Hi Siobhán, thank you for covering last week, it was a real help. I owe you one.”",
          },
        ],
      },
      {
        when: "A month later",
        turns: [
          {
            role: "user",
            text: "Ask Siobhan whether she can swap Thursday with me.",
          },
          { role: "memory-search", text: 'search_memory("Siobhan")' },
          {
            role: "memory-result",
            text: "Colleague is Siobhán, with the fada. Always spell it that way, even if I type it without.  (saved a month ago)",
          },
          {
            role: "assistant",
            text: "“Hi Siobhán, any chance you could swap Thursday with me? Happy to take one of yours in return.”",
          },
        ],
      },
    ],
    takeaway:
      "Nothing was learned in the sense of the model changing. It got the name wrong, was corrected, and wrote the correction down. A month later it typed the name correctly even though the request spelled it without the fada, because the note said to.",
  },
];

export function getMemoryScenario(id: string): MemoryScenario {
  return memoryScenarios.find((s) => s.id === id) ?? memoryScenarios[0];
}

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
