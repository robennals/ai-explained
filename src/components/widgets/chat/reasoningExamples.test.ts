import { describe, expect, it } from "vitest";
import {
  buildPrompt,
  buildStream,
  getReasoningExample,
  reasoningExamples,
} from "./reasoningExamples";

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

describe("buildStream", () => {
  const example = getReasoningExample("bat");

  it("puts the thinking in the same stream as the answer, between think tags", () => {
    const kinds = buildStream(example).map((s) => s.kind);
    expect(kinds).toEqual(["marker", "think", "marker", "answer", "marker"]);
  });

  it("emits nothing the model was handed", () => {
    for (const segment of buildStream(example)) {
      expect(segment.text).not.toContain(example.question);
    }
  });

  it("keeps every trace line in the stream", () => {
    const think = buildStream(example).find((s) => s.kind === "think")!;
    for (const line of example.trace) {
      expect(think.text).toContain(line);
    }
  });
});

describe("buildPrompt", () => {
  it("wraps the question in role markers, with the assistant turn left open", () => {
    const example = getReasoningExample("letters");
    const prompt = buildPrompt(example);
    expect(prompt).toContain(example.question);
    expect(prompt.startsWith("<|user|>")).toBe(true);
    expect(prompt.endsWith("<|assistant|>")).toBe(true);
  });
});
