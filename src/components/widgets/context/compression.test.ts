import { describe, it, expect } from "vitest";
import { OLD, SUMMARY, BUDGET, FRAMES, totalTokens } from "./compression";

describe("compression scenario", () => {
  it("overflows the budget once the whole conversation is revealed", () => {
    expect(totalTokens(OLD)).toBeGreaterThan(BUDGET);
  });

  it("has a summary far smaller than the full conversation", () => {
    expect(SUMMARY.tokens).toBeLessThan(BUDGET);
    expect(SUMMARY.tokens).toBeLessThan(totalTokens(OLD));
  });

  it("only crosses the budget on the third frame", () => {
    expect(totalTokens(OLD.slice(0, FRAMES[1].old))).toBeLessThanOrEqual(BUDGET);
    expect(totalTokens(OLD.slice(0, FRAMES[2].old))).toBeGreaterThan(BUDGET);
  });

  it("writes the summary, opens a fresh agent, then deletes the old one", () => {
    expect(FRAMES.some((f) => f.summaryOut)).toBe(true);
    expect(FRAMES.some((f) => f.newOpen)).toBe(true);
    const last = FRAMES[FRAMES.length - 1];
    expect(last.oldDeleted).toBe(true);
    expect(last.newOpen).toBe(true);
  });

  it("never deletes the old context before the fresh agent exists", () => {
    for (const f of FRAMES) {
      if (f.oldDeleted) expect(f.newOpen).toBe(true);
    }
  });
});
