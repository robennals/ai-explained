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

  it("names a different way of going wrong in every label", () => {
    const labels = completionExamples.map((e) => e.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("gives every prompt both a completion you want and one you do not", () => {
    // The chapter's argument is that both are plausible from the same model,
    // so a prompt with only one continuation would undercut it.
    for (const example of completionExamples) {
      expect(example.helpful.trim()).not.toBe("");
      expect(example.sideways.trim()).not.toBe("");
      expect(example.helpful).not.toBe(example.sideways);
    }
  });

  it("says in every note that both are plausible", () => {
    for (const example of completionExamples) {
      expect(example.note).toMatch(/[Bb]oth/);
    }
  });
});

describe("buildPrefix", () => {
  it("hands a base model the raw prompt and nothing else", () => {
    const example = getExample("no-stopping");
    expect(buildPrefix(example, "base")).toBe(example.prompt);
  });

  it("wraps the same words in role markers for a chat model", () => {
    const example = getExample("no-stopping");
    const prefix = buildPrefix(example, "chat");
    expect(prefix).toContain(example.prompt);
    expect(prefix.startsWith("<|user|>")).toBe(true);
    expect(prefix.endsWith("<|assistant|>")).toBe(true);
  });
});

describe("getExample", () => {
  it("falls back to the first example for an unknown id", () => {
    expect(getExample("nope")).toBe(completionExamples[0]);
  });
});
