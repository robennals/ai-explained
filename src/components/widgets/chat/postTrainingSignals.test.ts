import { describe, expect, it } from "vitest";
import { approaches, getApproach, sharedPrompt } from "./postTrainingSignals";

describe("approaches", () => {
  it("has a unique id for every approach", () => {
    const ids = approaches.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every approach an intro, an outcome and a note", () => {
    for (const approach of approaches) {
      expect(approach.intro.trim()).not.toBe("");
      expect(approach.outcome.trim()).not.toBe("");
      expect(approach.note.trim()).not.toBe("");
    }
  });

  it("keeps the prominent intro text short, since the illustration does the work", () => {
    for (const approach of approaches) {
      expect(approach.intro.length).toBeLessThan(160);
    }
  });

  it("uses the same prompt everywhere it shows one, so the approaches compare", () => {
    for (const approach of approaches) {
      const visual = approach.visual;
      if ("prompt" in visual) {
        expect(visual.prompt).toBe(sharedPrompt);
      }
    }
  });

  it("has a distinct illustration per approach", () => {
    const types = approaches.map((a) => a.visual.type);
    expect(new Set(types).size).toBe(types.length);
  });
});

describe("individual illustrations", () => {
  it("gives the written-answer approach a target and no score", () => {
    const visual = getApproach("ideal").visual;
    expect(visual.type).toBe("target");
  });

  it("offers the rater exactly two options and marks one chosen", () => {
    const visual = getApproach("comparison").visual;
    if (visual.type !== "pair") throw new Error("expected a pair");
    expect(visual.options).toHaveLength(2);
    expect(visual.options.map((o) => o.id)).toContain(visual.chosen);
  });

  it("shows the judge failing a response that dodges the question", () => {
    const visual = getApproach("constitution").visual;
    if (visual.type !== "judge") throw new Error("expected a judge");
    expect(visual.passed).toBe(false);
    expect(visual.response).not.toContain("$50");
  });

  it("reads the usage signal out of what the user typed, not a button", () => {
    const visual = getApproach("usage").visual;
    if (visual.type !== "usage") throw new Error("expected usage");
    expect(visual.turns[visual.turns.length - 1].role).toBe("user");
    expect(visual.good).toBe(false);
  });

  it("verifies the solution against the question, step by step", () => {
    const visual = getApproach("checker").visual;
    if (visual.type !== "check") throw new Error("expected a check");
    expect(visual.passed).toBe(true);
    expect(visual.steps.length).toBeGreaterThanOrEqual(3);
  });
});

describe("getApproach", () => {
  it("falls back to the first approach for an unknown id", () => {
    expect(getApproach("nope")).toBe(approaches[0]);
  });
});
