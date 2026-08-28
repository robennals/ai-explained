import { describe, expect, it } from "vitest";
import { completionExamples, getExample } from "./baseVsChatExamples";

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

describe("getExample", () => {
  it("looks an example up by id", () => {
    expect(getExample("maths").label).toBe("A maths problem");
  });

  it("falls back to the first example for an unknown id", () => {
    expect(getExample("nope")).toBe(completionExamples[0]);
  });
});
