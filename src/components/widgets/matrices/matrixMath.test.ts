import { describe, it, expect } from "vitest";
import { matVecMul, matMul, invert, relu, sigmoid, applyActivation } from "./matrixMath";

describe("matVecMul", () => {
  it("computes each row's dot product with the vector", () => {
    expect(matVecMul([[1, 0], [0, 1]], [3, 4])).toEqual([3, 4]);
    expect(matVecMul([[1, 2], [3, 4]], [1, 1])).toEqual([3, 7]);
  });
});

describe("matMul", () => {
  it("multiplies identity to return the original", () => {
    const m = [[1, 2], [3, 4]];
    expect(matMul([[1, 0], [0, 1]], m)).toEqual(m);
  });
  it("composes two 2x2 matrices", () => {
    expect(matMul([[1, 2], [3, 4]], [[5, 6], [7, 8]])).toEqual([[19, 22], [43, 50]]);
  });
  it("multiplies non-square matrices (2x3 by 3x2)", () => {
    // [[1,2,3],[4,5,6]] (2x3) times [[7,8],[9,10],[11,12]] (3x2) = [[58,64],[139,154]]
    expect(matMul([[1, 2, 3], [4, 5, 6]], [[7, 8], [9, 10], [11, 12]])).toEqual([[58, 64], [139, 154]]);
  });
});

describe("invert", () => {
  it("inverts the identity to itself", () => {
    expect(invert([[1, 0], [0, 1]])).toEqual([[1, 0], [0, 1]]);
  });
  it("inverse times original is identity (within tolerance)", () => {
    const m = [[4, 7], [2, 6]];
    const inv = invert(m)!;
    const prod = matMul(inv, m);
    expect(prod[0][0]).toBeCloseTo(1, 6);
    expect(prod[0][1]).toBeCloseTo(0, 6);
    expect(prod[1][0]).toBeCloseTo(0, 6);
    expect(prod[1][1]).toBeCloseTo(1, 6);
  });
  it("returns null for a singular matrix", () => {
    expect(invert([[1, 2], [2, 4]])).toBeNull();
  });
});

describe("activations", () => {
  it("relu clips negatives to zero", () => {
    expect(relu(-3)).toBe(0);
    expect(relu(2)).toBe(2);
  });
  it("sigmoid maps 0 to 0.5 and is monotonic", () => {
    expect(sigmoid(0)).toBeCloseTo(0.5, 6);
    expect(sigmoid(10)).toBeGreaterThan(sigmoid(1));
  });
  it("applyActivation maps a function over a vector", () => {
    expect(applyActivation([-1, 0, 2], relu)).toEqual([0, 0, 2]);
  });
});
