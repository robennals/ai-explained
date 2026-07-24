import { describe, it, expect } from "vitest";
import { pairwiseComparisons, linearReference, formatCount } from "./cost";

describe("pairwiseComparisons", () => {
  it("is n squared (every token vs every token)", () => {
    expect(pairwiseComparisons(1)).toBe(1);
    expect(pairwiseComparisons(10)).toBe(100);
    expect(pairwiseComparisons(1000)).toBe(1_000_000);
  });
  it("quadruples when the input doubles", () => {
    expect(pairwiseComparisons(2000)).toBe(4 * pairwiseComparisons(1000));
  });
});

describe("linearReference", () => {
  it("is perToken * n", () => {
    expect(linearReference(1000, 2048)).toBe(2_048_000);
  });
});

describe("formatCount", () => {
  it("uses short human units", () => {
    expect(formatCount(1_000_000)).toBe("1M");
    expect(formatCount(2_500_000_000)).toBe("2.5B");
    expect(formatCount(1_000_000_000_000)).toBe("1T");
    expect(formatCount(950)).toBe("950");
  });
});
