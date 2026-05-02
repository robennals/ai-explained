import { describe, it, expect } from "vitest";
import { dot, softmax, weightedSum } from "./toyMath";

describe("dot", () => {
  it("returns the sum of element-wise products", () => {
    expect(dot([1, 2, 3], [4, 5, 6])).toBe(32);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(dot([1, 0], [0, 1])).toBe(0);
  });

  it("works with 1-dim vectors", () => {
    expect(dot([3], [1])).toBe(3);
    expect(dot([0], [1])).toBe(0);
  });
});

describe("softmax", () => {
  it("returns a uniform distribution for equal scores", () => {
    const result = softmax([2, 2, 2, 2]);
    expect(result).toEqual([0.25, 0.25, 0.25, 0.25]);
  });

  it("is shift-invariant", () => {
    const a = softmax([3, 0, 0, 0]);
    const b = softmax([4, 1, 1, 1]);
    a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 6));
  });

  it("matches expected weights for [3, 0, 0, 0]", () => {
    const result = softmax([3, 0, 0, 0]);
    expect(result[0]).toBeCloseTo(0.870, 3);
    expect(result[1]).toBeCloseTo(0.0433, 3);
    expect(result[2]).toBeCloseTo(0.0433, 3);
    expect(result[3]).toBeCloseTo(0.0433, 3);
  });

  it("matches expected weights for [3, 0, 3, 0] (two-match case)", () => {
    const result = softmax([3, 0, 3, 0]);
    expect(result[0]).toBeCloseTo(0.476, 3);
    expect(result[1]).toBeCloseTo(0.0238, 3);
    expect(result[2]).toBeCloseTo(0.476, 3);
    expect(result[3]).toBeCloseTo(0.0238, 3);
  });

  it("sums to 1 for any input", () => {
    const inputs = [
      [1, 2, 3],
      [-5, 0, 5],
      [100, 100, 100],
      [0, 0, 0, 0, 0, 0],
    ];
    for (const input of inputs) {
      const result = softmax(input);
      const sum = result.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1, 6);
    }
  });

  it("is numerically stable for large scores", () => {
    const result = softmax([1000, 999]);
    expect(result[0]).toBeCloseTo(0.7311, 3);
    expect(result[1]).toBeCloseTo(0.2689, 3);
  });
});

describe("weightedSum", () => {
  it("blends value vectors by weights", () => {
    const weights = [0.5, 0.5];
    const values = [
      [1, 0],
      [0, 1],
    ];
    expect(weightedSum(weights, values)).toEqual([0.5, 0.5]);
  });

  it("matches expected step-3 result for cat blah blah it", () => {
    // it.q=[3], keys=[1,0,0,0], values=[[1,0],[0,0],[0,0],[0,0]]
    const w = softmax([3, 0, 0, 0]);
    const v = [
      [1, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ];
    const result = weightedSum(w, v);
    expect(result[0]).toBeCloseTo(0.870, 3);
    expect(result[1]).toBeCloseTo(0, 6);
  });

  it("matches expected step-3 result for dog blah dog it (two dogs)", () => {
    // it.q=[3], keys=[1,0,1,0], values=[[0,1],[0,0],[0,1],[0,0]]
    const w = softmax([3, 0, 3, 0]);
    const v = [
      [0, 1],
      [0, 0],
      [0, 1],
      [0, 0],
    ];
    const result = weightedSum(w, v);
    expect(result[0]).toBeCloseTo(0, 6);
    expect(result[1]).toBeCloseTo(0.9526, 3);
  });

  it("matches expected step-4 sink result for blah blah blah it", () => {
    // it.q=[3,1], all keys=[0,1] → scores=[1,1,1,1] → uniform 25%
    // values: blah=[0,0,1], blah=[0,0,1], blah=[0,0,1], it=[0,0,1]
    const w = softmax([1, 1, 1, 1]);
    const v = [
      [0, 0, 1],
      [0, 0, 1],
      [0, 0, 1],
      [0, 0, 1],
    ];
    const result = weightedSum(w, v);
    expect(result[0]).toBeCloseTo(0, 6);
    expect(result[1]).toBeCloseTo(0, 6);
    expect(result[2]).toBeCloseTo(1, 6);
  });
});
