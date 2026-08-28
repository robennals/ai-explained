import { describe, expect, it } from "vitest";
import {
  candidates,
  getSignal,
  signals,
  updatedProbabilities,
} from "./postTrainingSignals";

describe("candidates", () => {
  it("has prior probabilities that sum to 1", () => {
    const total = candidates.reduce((a, c) => a + c.priorProbability, 0);
    expect(total).toBeCloseTo(1, 6);
  });

  it("has exactly one correct response", () => {
    expect(candidates.filter((c) => c.correct)).toHaveLength(1);
  });
});

describe("signals", () => {
  it("scores every candidate, in range, for every signal", () => {
    for (const signal of signals) {
      for (const candidate of candidates) {
        const score = signal.scores[candidate.id];
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      }
    }
  });

  it("makes the usage signal prefer the flattering wrong answer", () => {
    const usage = getSignal("usage");
    expect(usage.scores["flattering-wrong"]).toBeGreaterThan(
      usage.scores.correct
    );
  });
});

describe("updatedProbabilities", () => {
  it("returns a distribution", () => {
    for (const signal of signals) {
      const updated = updatedProbabilities(signal);
      const total = Object.values(updated).reduce((a, b) => a + b, 0);
      expect(total).toBeCloseTo(1, 6);
    }
  });

  it("raises the correct answer when the checker is the signal", () => {
    const updated = updatedProbabilities(getSignal("checker"));
    expect(updated.correct).toBeGreaterThan(0.9);
  });

  it("raises the flattering answer above the correct one on usage data", () => {
    const updated = updatedProbabilities(getSignal("usage"));
    expect(updated["flattering-wrong"]).toBeGreaterThan(updated.correct);
  });

  it("leaves the distribution unchanged when every score is equal", () => {
    const flat = {
      ...getSignal("checker"),
      scores: Object.fromEntries(candidates.map((c) => [c.id, 0.5])),
    };
    const updated = updatedProbabilities(flat);
    for (const candidate of candidates) {
      expect(updated[candidate.id]).toBeCloseTo(candidate.priorProbability, 6);
    }
  });
});
