import { describe, it, expect } from "vitest";
import { buildSteps, type Message } from "./kvcache";

const convo: Message[] = [
  { role: "user", text: "u1" },
  { role: "assistant", text: "a1" },
  { role: "user", text: "u2" },
  { role: "assistant", text: "a2" },
  { role: "user", text: "u3" },
  { role: "assistant", text: "a3" },
];

describe("kv cache steps", () => {
  const steps = buildSteps(convo);

  it("produces three steps per round", () => {
    expect(steps).toHaveLength(9); // 3 rounds × (match, compute, generate)
  });

  it("reuses nothing on the first round and something later", () => {
    expect(steps[0].reused).toBe(0);
    const round2Start = steps.find((s) => s.round === 2)!;
    expect(round2Start.reused).toBeGreaterThan(0);
  });

  it("shows the new user message as plain text while older ones are cached", () => {
    const round2Start = steps.find((s) => s.round === 2)!;
    expect(round2Start.states[0]).toBe("cached"); // u1
    expect(round2Start.states[1]).toBe("cached"); // a1
    expect(round2Start.states[2]).toBe("text"); // u2 — new, not computed yet
    expect(round2Start.states[3]).toBe("pending"); // a2 — not generated yet
  });

  it("marks the new message as computing on the compute step", () => {
    const computeStep = steps.filter((s) => s.round === 2)[1];
    expect(computeStep.states[2]).toBe("computing");
  });

  it("ends with every message cached", () => {
    const last = steps[steps.length - 1];
    // after the final generate step the reply is added; check the running set
    expect(last.states.filter((s) => s === "pending")).toHaveLength(0);
    expect(last.cached).toEqual([0, 1, 2, 3, 4]); // a3 added after this step
  });
});
