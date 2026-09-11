export type Role = "user" | "assistant";

export interface Message {
  role: Role;
  text: string;
}

// State of one message at a given step of the animation.
//  - pending:   not part of this turn's prompt yet (a future message)
//  - text:      in the prompt, but its KV vectors are not computed yet
//  - computing: its KV vectors are being computed right now
//  - cached:    its KV vectors are in the cache, reused for free
export type SegState = "pending" | "text" | "computing" | "cached";

export interface Step {
  round: number;
  label: string;
  states: SegState[];
  cached: number[];
  /** How many earlier messages were reused from the cache this turn. */
  reused: number;
}

/**
 * Build the step-by-step animation for a conversation, one message per entry,
 * strictly alternating user / assistant. Each assistant reply is a "compute"
 * event: match the cached prefix, compute the KV for the new user message, then
 * generate the reply and cache it too. The cache carries over between turns.
 */
export function buildSteps(convo: Message[]): Step[] {
  const steps: Step[] = [];
  const cached = new Set<number>();
  let round = 0;

  const snapshot = (
    promptIdx: number[],
    computing: Set<number>
  ): SegState[] =>
    convo.map((_, i) => {
      if (computing.has(i)) return "computing";
      if (cached.has(i)) return "cached";
      if (promptIdx.includes(i)) return "text";
      return "pending";
    });

  for (let a = 0; a < convo.length; a++) {
    if (convo[a].role !== "assistant") continue;
    round++;

    const promptIdx = Array.from({ length: a }, (_, i) => i); // 0 … a-1
    const uncached = promptIdx.filter((i) => !cached.has(i));
    const reused = promptIdx.length - uncached.length;

    // Step 1 — the prompt arrives; the cached prefix is matched.
    steps.push({
      round,
      label:
        reused > 0
          ? `Turn ${round}: the earlier messages are already in the cache. Reuse them, don't reread them.`
          : `Turn ${round}: the cache is empty, so there is nothing to reuse yet.`,
      states: snapshot(promptIdx, new Set()),
      cached: [...cached].sort((x, y) => x - y),
      reused,
    });

    // Step 2 — compute the KV for the new part of the prompt.
    if (uncached.length > 0) {
      steps.push({
        round,
        label: `Compute the KV vectors for the new message, and add them to the cache.`,
        states: snapshot(promptIdx, new Set(uncached)),
        cached: [...cached].sort((x, y) => x - y),
        reused,
      });
      uncached.forEach((i) => cached.add(i));
    }

    // Step 3 — generate the reply; its KV goes into the cache too.
    steps.push({
      round,
      label: `Generate the reply. Its KV vectors go into the cache too.`,
      states: snapshot(promptIdx, new Set([a])),
      cached: [...cached].sort((x, y) => x - y),
      reused,
    });
    cached.add(a);
  }

  return steps;
}
