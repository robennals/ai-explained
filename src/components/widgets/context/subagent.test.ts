import { describe, it, expect } from "vitest";
import {
  MAIN_BASE,
  WITHOUT_TAIL,
  WITH_TAIL,
  SUB,
  FRAMES_WITHOUT,
  FRAMES_WITH,
  contextTokens,
} from "./subagent";

const withoutFinal = [...MAIN_BASE, ...WITHOUT_TAIL];
const withFinal = [...MAIN_BASE, ...WITH_TAIL];

describe("subagent scenario", () => {
  it("leaves the without-subagent context far bigger", () => {
    expect(contextTokens(withoutFinal)).toBeGreaterThan(contextTokens(withFinal));
    expect(contextTokens(withoutFinal)).toBe(1416);
    expect(contextTokens(withFinal)).toBe(111);
  });

  it("does not count the cached skill against the subagent context", () => {
    const skill = SUB.find((m) => m.cached)!;
    expect(skill.tokens).toBe(1200);
    expect(contextTokens([skill])).toBe(0);
  });

  it("counts the reprocessed skill in the inline context", () => {
    const skill = WITHOUT_TAIL.find((m) => m.reprocessed)!;
    expect(contextTokens([skill])).toBe(1200);
  });

  it("marks the cache unusable inline and reused with a subagent", () => {
    expect(FRAMES_WITHOUT.some((f) => f.cache === "unusable")).toBe(true);
    expect(FRAMES_WITHOUT.every((f) => f.cache !== "reused")).toBe(true);
    expect(FRAMES_WITH.some((f) => f.cache === "reused")).toBe(true);
  });

  it("opens then closes the subagent in the with tab", () => {
    expect(FRAMES_WITH[0].subOpen).toBe(false);
    expect(FRAMES_WITH.some((f) => f.subOpen)).toBe(true);
    expect(FRAMES_WITH[FRAMES_WITH.length - 1].subOpen).toBe(false);
  });

  it("returns the answer to the main context on the final with-frame", () => {
    expect(FRAMES_WITH[FRAMES_WITH.length - 1].main).toBe(withFinal.length);
    expect(withFinal[withFinal.length - 1].text).toMatch(/tighter/);
  });
});
