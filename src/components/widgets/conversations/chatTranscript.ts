/**
 * One short conversation, in the form the model actually sees.
 *
 * A chat is prefix-and-completion like anything else: the harness assembles a
 * prompt out of the whole conversation so far, opens the model's turn, and the
 * model completes it. The second exchange re-sends the first, which is the
 * point of the repeated-turns widget.
 */

export interface TranscriptTurn {
  role: "system" | "user" | "assistant";
  text: string;
}

export const transcript: TranscriptTurn[] = [
  { role: "user", text: "What's the capital of Australia?" },
  { role: "assistant", text: "Canberra." },
  { role: "user", text: "Are you sure? I thought it was Sydney." },
  {
    role: "assistant",
    text: "Sure. Sydney is bigger and better known, which is where the confusion comes from, but Canberra has been the capital since 1913.",
  },
  { role: "user", text: "How big is it?" },
  {
    role: "assistant",
    text: "Canberra has just over 450,000 people, which makes it about an eighth the size of Sydney.",
  },
];

const markers: Record<TranscriptTurn["role"], string> = {
  system: "<|system|>",
  user: "<|user|>",
  assistant: "<|assistant|>",
};

/** The indices of the turns the model wrote, one per exchange. */
export const exchanges = transcript
  .map((turn, i) => (turn.role === "assistant" ? i : -1))
  .filter((i) => i >= 0);

export interface PromptPart {
  text: string;
  /** True when this text was already sent in an earlier exchange. */
  carriedOver: boolean;
}

function render(turn: TranscriptTurn): string {
  return `${markers[turn.role]}${turn.text}<|end|>`;
}

/**
 * The prompt handed to the model for one exchange: every earlier turn, then
 * the marker that opens the model's own turn. Parts already sent in a previous
 * exchange are flagged, since re-sending them is the thing worth seeing.
 */
export function promptParts(assistantIndex: number): PromptPart[] {
  const previous = exchanges.filter((i) => i < assistantIndex).pop() ?? -1;
  const before = transcript.slice(0, assistantIndex);
  const carried = before
    .filter((_, i) => i <= previous)
    .map(render)
    .join("\n");
  const added = before
    .filter((_, i) => i > previous)
    .map(render)
    .join("\n");
  const parts: PromptPart[] = [];
  if (carried) parts.push({ text: carried + "\n", carriedOver: true });
  parts.push({
    text: (added ? added + "\n" : "") + markers.assistant,
    carriedOver: false,
  });
  return parts;
}

/** What the model writes: its reply, and the marker that ends its turn. */
export function completionFor(assistantIndex: number): string {
  return `${transcript[assistantIndex].text}<|end|>`;
}

/** The hidden message a product puts at the top, introduced in its own section. */
export const systemPrompt: TranscriptTurn = {
  role: "system",
  text: "You are Otter, a friendly assistant who keeps answers short. "
    + "Today is 29 August 2026. The user is in Bristol.",
};

/** The same conversation with the system prompt in front of it. */
export function withSystemPrompt(
  turns: TranscriptTurn[] = transcript.slice(0, 2)
): TranscriptTurn[] {
  return [systemPrompt, ...turns];
}

export function senderLabel(turn: TranscriptTurn): string {
  return turn.role === "system"
    ? "System prompt"
    : turn.role === "user"
      ? "Human"
      : "Model";
}

export function senderKind(
  turn: TranscriptTurn
): "human" | "model" | "system" {
  return turn.role === "system"
    ? "system"
    : turn.role === "user"
      ? "human"
      : "model";
}

/** The system prompt is in the transcript, but the human never sees it. */
export function isVisible(turn: TranscriptTurn): boolean {
  return turn.role !== "system";
}
