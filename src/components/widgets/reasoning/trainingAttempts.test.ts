import { describe, expect, it } from "vitest";
import {
  attempts,
  correctAnswer,
  countCorrect,
  direction,
} from "./trainingAttempts";

describe("attempts", () => {
  it("has a unique id for every attempt", () => {
    const ids = attempts.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("marks an attempt correct exactly when it reaches the right answer", () => {
    for (const attempt of attempts) {
      expect(attempt.correct).toBe(attempt.answer === correctAnswer);
    }
  });

  it("includes attempts that succeed and attempts that fail", () => {
    expect(countCorrect()).toBeGreaterThan(0);
    expect(countCorrect()).toBeLessThan(attempts.length);
  });

  it("gives every attempt working, not just an answer", () => {
    for (const attempt of attempts) {
      expect(attempt.trace.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("has one winning attempt that checked itself and one that guessed well", () => {
    const winners = attempts.filter((a) => a.correct).map((a) => a.id);
    expect(winners).toContain("checked");
    expect(winners).toContain("short");
  });
});

describe("direction", () => {
  it("pushes correct attempts up and incorrect ones down", () => {
    for (const attempt of attempts) {
      expect(direction(attempt)).toBe(attempt.correct ? "up" : "down");
    }
  });
});
