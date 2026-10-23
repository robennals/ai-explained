import { describe, expect, it } from "vitest";
import { promptExamples } from "./promptExamples";

describe("promptExamples", () => {
  it("has a unique id for every example", () => {
    const ids = promptExamples.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("is mostly not questions, which is the point of the section", () => {
    const questions = promptExamples.filter((e) => e.prompt.includes("?"));
    expect(questions.length).toBe(1);
    expect(promptExamples.length).toBeGreaterThanOrEqual(5);
  });

  it("ends on the question, so it reads as one more kind of text", () => {
    expect(promptExamples[promptExamples.length - 1].prompt).toContain("?");
  });

  it("gives every example a prompt and a completion", () => {
    for (const example of promptExamples) {
      expect(example.prompt.trim()).not.toBe("");
      expect(example.completion.trim()).not.toBe("");
      expect(example.kind.trim()).not.toBe("");
    }
  });
});
