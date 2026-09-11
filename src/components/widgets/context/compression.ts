export interface Msg {
  who: "user" | "model";
  text: string;
  tokens: number;
  summary?: boolean;
}

export const BUDGET = 1000;

// A conversation that grows until it overflows the window.
export const OLD: Msg[] = [
  { who: "user", text: "Plan my week.", tokens: 120 },
  { who: "model", text: "Monday: school, then homework.", tokens: 140 },
  { who: "user", text: "Add gym on Tuesday.", tokens: 110 },
  { who: "model", text: "Tuesday: gym after school.", tokens: 150 },
  { who: "user", text: "Move the dentist to Wednesday.", tokens: 120 },
  { who: "model", text: "Wednesday: dentist at 4pm.", tokens: 140 },
  { who: "user", text: "What about Friday?", tokens: 130 },
  { who: "model", text: "Friday: free — maybe a movie.", tokens: 150 },
];

// The short note that replaces the whole conversation.
export const SUMMARY: Msg = {
  who: "model",
  text: "Summary so far: week planned — gym Tue, dentist Wed 4pm, Friday free.",
  tokens: 120,
  summary: true,
};

export interface Frame {
  label: string;
  /** How many of the old conversation's messages are revealed. */
  old: number;
  /** The agent has written the summary (shown on its own). */
  summaryOut: boolean;
  /** A fresh agent has started from the summary. */
  newOpen: boolean;
  /** The old context has been deleted. */
  oldDeleted: boolean;
}

export const FRAMES: Frame[] = [
  { label: "The conversation grows, turn by turn.", old: 4, summaryOut: false, newOpen: false, oldDeleted: false },
  { label: "It keeps filling up.", old: 7, summaryOut: false, newOpen: false, oldDeleted: false },
  { label: "Full — there is no room for the next reply.", old: 8, summaryOut: false, newOpen: false, oldDeleted: false },
  { label: "So the agent writes a short summary of everything so far.", old: 8, summaryOut: true, newOpen: false, oldDeleted: false },
  { label: "It starts a fresh agent whose context is just that summary.", old: 8, summaryOut: true, newOpen: true, oldDeleted: false },
  { label: "The old context is deleted. The chat continues with plenty of room.", old: 8, summaryOut: true, newOpen: true, oldDeleted: true },
];

export function totalTokens(msgs: Msg[]): number {
  return msgs.reduce((sum, m) => sum + m.tokens, 0);
}
