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

describe("counting letters", () => {
  const example = getReasoningExample("letters");

  it("writes the word out with a number against every letter", () => {
    const numbered = example.trace.find((line) => line.includes("1: s"))!;
    expect(numbered).toBeDefined();
    const rows = numbered.split("\n");
    expect(rows).toHaveLength("strawberry".length);
    rows.forEach((row, i) => {
      expect(row).toBe(`${i + 1}: ${"strawberry"[i]}`);
    });
  });

  it("picks out the positions of the r's, and there are three", () => {
    const positions = [...("strawberry" as string)]
      .map((c, i) => (c === "r" ? i + 1 : 0))
      .filter(Boolean);
    expect(positions).toEqual([3, 8, 9]);
    expect(example.trace.join(" ")).toContain("3, 8 and 9");
    expect(example.answer.toLowerCase()).toContain("three");
  });
});
