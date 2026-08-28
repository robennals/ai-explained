import { describe, expect, it } from "vitest";
import {
  buildPrefix,
  completionExamples,
  getExample,
} from "./baseVsChatExamples";

describe("completionExamples", () => {
  it("has a unique id for every example", () => {
    const ids = completionExamples.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every example both a base and a chat completion", () => {
    for (const example of completionExamples) {
      expect(example.base.trim()).not.toBe("");
      expect(example.chat.trim()).not.toBe("");
      expect(example.base).not.toBe(example.chat);
    }
  });
});

describe("buildPrefix", () => {
  it("hands a base model the raw prompt and nothing else", () => {
    const example = getExample("maths");
    expect(buildPrefix(example, "base")).toBe(example.prompt);
  });

  it("wraps the same words in role markers for a chat model", () => {
    const example = getExample("maths");
    const prefix = buildPrefix(example, "chat");
    expect(prefix).toContain(example.prompt);
    expect(prefix.startsWith("<|user|>")).toBe(true);
    expect(prefix.endsWith("<|assistant|>")).toBe(true);
  });
});

describe("getExample", () => {
  it("looks an example up by id", () => {
    expect(getExample("maths").label).toBe("A maths problem");
  });

  it("falls back to the first example for an unknown id", () => {
    expect(getExample("nope")).toBe(completionExamples[0]);
  });
});
