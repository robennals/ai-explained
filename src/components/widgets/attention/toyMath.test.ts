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

  it("matches expected step-2 weights for cat blah blah it (no sink, magnitude 10)", () => {
    // it.q=[10], keys=[1,0,0,0]. scores = [10, 0, 0, 0]
    const result = softmax([10, 0, 0, 0]);
    expect(result[0]).toBeCloseTo(0.99986, 4);
    expect(result[1]).toBeCloseTo(0.0000454, 6);
    expect(result[2]).toBeCloseTo(0.0000454, 6);
    expect(result[3]).toBeCloseTo(0.0000454, 6);
  });

  it("matches expected step-3 sink weights for cat blah blah it (sink + magnitude 10)", () => {
    // tokens: [SINK, CAT, BLA, BLA, IT]
    // SINK.key=[0.5], CAT.key=[1], BLA.key=[0], IT.key=[0]
    // it.q=[10]; scores: [5, 10, 0, 0, 0]
    const result = softmax([5, 10, 0, 0, 0]);
    expect(result[0]).toBeCloseTo(0.00669, 4); // sink
    expect(result[1]).toBeCloseTo(0.99319, 4); // cat dominates
    expect(result[2]).toBeCloseTo(0.0000451, 6);
  });

  it("matches expected step-3 sink weights for blah blah blah it (no nouns)", () => {
    // scores: [5, 0, 0, 0, 0]
    const result = softmax([5, 0, 0, 0, 0]);
    expect(result[0]).toBeCloseTo(0.9737, 3); // sink dominates
    expect(result[1]).toBeCloseTo(0.00656, 4); // blahs
    expect(result[2]).toBeCloseTo(0.00656, 4);
    expect(result[3]).toBeCloseTo(0.00656, 4);
    expect(result[4]).toBeCloseTo(0.00656, 4);
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

  it("matches expected step-4 result for cat blah blah it (with sink, magnitude 10)", () => {
    // weights from softmax([5, 10, 0, 0, 0])
    // values: SINK=[0,0], CAT=[1,0], BLA=[0,0], BLA=[0,0], IT=[0,0]
    const w = softmax([5, 10, 0, 0, 0]);
    const v = [
      [0, 0],
      [1, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ];
    const result = weightedSum(w, v);
    expect(result[0]).toBeCloseTo(0.9932, 3); // ~99% cat
    expect(result[1]).toBeCloseTo(0, 6);
  });

  it("matches expected step-4 result for dog blah dog it (two dogs, magnitude 10)", () => {
    // scores: [5, 10, 0, 10, 0] — sink + two dogs
    const w = softmax([5, 10, 0, 10, 0]);
    const v = [
      [0, 0],
      [0, 1],
      [0, 0],
      [0, 1],
      [0, 0],
    ];
    const result = weightedSum(w, v);
    expect(result[0]).toBeCloseTo(0, 6);
    expect(result[1]).toBeCloseTo(0.9966, 3); // ~99.7% dog
  });

  it("matches expected step-4 result for blah blah blah it (empty result)", () => {
    // scores: [5, 0, 0, 0, 0] — sink wins
    // all values are zero vectors → result is empty [0, 0]
    const w = softmax([5, 0, 0, 0, 0]);
    const v = [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ];
    const result = weightedSum(w, v);
    expect(result[0]).toBeCloseTo(0, 6);
    expect(result[1]).toBeCloseTo(0, 6);
  });
});
