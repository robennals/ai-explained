import { describe, expect, it } from "vitest";
import { getReasoningExample, reasoningExamples } from "./reasoningExamples";

describe("reasoningExamples", () => {
  it("has a unique id for every example", () => {
    const ids = reasoningExamples.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every example a multi-step trace", () => {
    for (const example of reasoningExamples) {
      expect(example.trace.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("getReasoningExample", () => {
  it("falls back to the first example for an unknown id", () => {
    expect(getReasoningExample("nope")).toBe(reasoningExamples[0]);
  });
});
