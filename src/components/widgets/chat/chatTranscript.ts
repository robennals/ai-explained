/**
 * One short conversation, held in the form the model actually sees.
 *
 * The widget renders it twice: as the single stream of tokens it really is,
 * and as the speech bubbles the rest of the tutorial uses as shorthand. The
 * system prompt is in the transcript but never shown to the human, which is
 * what establishes the convention for a hidden message.
 */

export interface TranscriptTurn {
  role: "system" | "user" | "assistant";
  text: string;
}

export const transcript: TranscriptTurn[] = [
  {
    role: "system",
    text: "You are a helpful assistant. Today is 28 August 2026.",
  },
  { role: "user", text: "What's the capital of Australia?" },
  { role: "assistant", text: "Canberra." },
  { role: "user", text: "Are you sure?" },
  {
    role: "assistant",
    text: "Yes. Sydney is bigger and better known, which is where the confusion comes from, but Canberra has been the capital since 1913.",
  },
];

const markers: Record<TranscriptTurn["role"], string> = {
  system: "<|system|>",
  user: "<|user|>",
  assistant: "<|assistant|>",
};

/**
 * The transcript as one stream of tokens, markers and all. Every turn is
 * closed, as in every real chat template. What differs is who wrote the
 * marker: the model generates the one that ends its own turn, and the harness
 * writes all the others.
 */
export function asRawText(turns: TranscriptTurn[] = transcript): string {
  return turns
    .map((turn) => `${markers[turn.role]}${turn.text}<|end|>`)
    .join("\n");
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
