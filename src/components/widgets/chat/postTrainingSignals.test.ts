import { describe, expect, it } from "vitest";
import { approaches, getApproach, sharedPrompt } from "./postTrainingSignals";

describe("approaches", () => {
  it("has a unique id for every approach", () => {
    const ids = approaches.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every approach panels, an outcome, a blind spot and a citation", () => {
    for (const approach of approaches) {
      expect(approach.panels.length).toBeGreaterThan(1);
      expect(approach.outcome.trim()).not.toBe("");
      expect(approach.blindSpot.trim()).not.toBe("");
      expect(approach.usedBy.trim()).not.toBe("");
    }
  });

  it("keeps scores in range wherever an approach produces one", () => {
    for (const approach of approaches) {
      for (const panel of approach.panels) {
        if (panel.score !== undefined) {
          expect(panel.score).toBeGreaterThanOrEqual(0);
          expect(panel.score).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it("gives the written-answer approach no score at all, since the text is the target", () => {
    const ideal = getApproach("ideal");
    expect(ideal.panels.every((p) => p.score === undefined)).toBe(true);
  });

  it("uses the same prompt everywhere it shows one, so the approaches compare", () => {
    for (const approach of approaches) {
      for (const panel of approach.panels) {
        if (panel.kind === "prompt") {
          expect(panel.text).toBe(sharedPrompt);
        }
      }
    }
  });

  it("scores the flattering answer above the correct one on usage data", () => {
    const scores = getApproach("usage")
      .panels.filter((p) => p.score !== undefined)
      .map((p) => p.score!);
    expect(scores[0]).toBeGreaterThan(scores[1]);
  });

  it("shows the preferred response rising and the rejected one falling", () => {
    const shift = getApproach("comparison").shift!;
    const [preferred, rejected] = shift;
    expect(preferred.after).toBeGreaterThan(preferred.before);
    expect(rejected.after).toBeLessThan(rejected.before);
  });
});

describe("getApproach", () => {
  it("falls back to the first approach for an unknown id", () => {
    expect(getApproach("nope")).toBe(approaches[0]);
  });
});
