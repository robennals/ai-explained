import { describe, expect, it } from "vitest";
import {
  attempts,
  check,
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

  it("gives every attempt some working, not just an answer", () => {
    for (const attempt of attempts) {
      expect(attempt.trace.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("varies how much working the attempts show", () => {
    const lengths = attempts.map((a) => a.trace.length);
    expect(Math.max(...lengths)).toBeGreaterThan(Math.min(...lengths));
  });

  it("has the attempt that worked through the cases as the one that got there", () => {
    const winners = attempts.filter((a) => a.correct).map((a) => a.id);
    expect(winners).toEqual(["checked"]);
  });

  it("is a problem the reader can check in one line, whatever it took to find", () => {
    expect(check.length).toBeLessThan(60);
    expect(Number(correctAnswer) % 7).toBe(0);
    expect(
      String(correctAnswer)
        .split("")
        .reduce((a, d) => a + Number(d), 0)
    ).toBe(11);
  });
});

describe("direction", () => {
  it("pushes correct attempts up and incorrect ones down", () => {
    for (const attempt of attempts) {
      expect(direction(attempt)).toBe(attempt.correct ? "up" : "down");
    }
  });
});
