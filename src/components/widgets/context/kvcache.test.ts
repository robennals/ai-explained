import { describe, it, expect } from "vitest";
import { keyValueWork, cacheMemory } from "./kvcache";

describe("keyValueWork", () => {
  it("without cache recomputes the whole history each step", () => {
    // prompt 2, generate 3: (2)+(3)+(4) = 9
    expect(keyValueWork(2, 3, false)).toBe(9);
  });
  it("with cache computes the prompt once then one per new token", () => {
    // prompt 2, generate 3: 2 + 3 = 5
    expect(keyValueWork(2, 3, true)).toBe(5);
  });
  it("cache savings grow with length", () => {
    const without = keyValueWork(10, 100, false);
    const withC = keyValueWork(10, 100, true);
    expect(without).toBeGreaterThan(withC * 5);
  });
});

describe("cacheMemory", () => {
  it("grows linearly with total tokens", () => {
    expect(cacheMemory(10, 0)).toBe(10);
    expect(cacheMemory(10, 90)).toBe(100);
  });
});
