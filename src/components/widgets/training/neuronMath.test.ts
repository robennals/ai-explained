import { describe, it, expect } from "vitest";
import {
  activate,
  activateDerivative,
  learningStep,
  chainForward,
  chainWeightGradients,
} from "./neuronMath";

describe("activate", () => {
  it("sigmoid is 0.5 at zero and squashes to (0, 1)", () => {
    expect(activate(0, "sigmoid")).toBe(0.5);
    expect(activate(10, "sigmoid")).toBeCloseTo(0.9999546, 6);
    expect(activate(-10, "sigmoid")).toBeCloseTo(0.0000454, 6);
  });

  it("relu clamps negatives to zero and passes positives through", () => {
    expect(activate(-3, "relu")).toBe(0);
    expect(activate(0, "relu")).toBe(0);
    expect(activate(3, "relu")).toBe(3);
  });
});

describe("activateDerivative", () => {
  it("sigmoid derivative peaks at 0.25 at zero and vanishes at the ends", () => {
    expect(activateDerivative(0, "sigmoid")).toBe(0.25);
    expect(activateDerivative(10, "sigmoid")).toBeLessThan(0.001);
    expect(activateDerivative(-10, "sigmoid")).toBeLessThan(0.001);
  });

  it("relu derivative is 1 for positive z and 0 otherwise", () => {
    expect(activateDerivative(2, "relu")).toBe(1);
    expect(activateDerivative(0, "relu")).toBe(0);
    expect(activateDerivative(-2, "relu")).toBe(0);
  });
});

describe("learningStep", () => {
  it("moves the output toward the target for a responsive neuron", () => {
    const before = activate(0, "sigmoid"); // 0.5
    const { w, b } = learningStep(0, 0, 1, "sigmoid", 1);
    const after = activate(w * 1 + b, "sigmoid");
    expect(after).toBeGreaterThan(before);
    expect(after).toBeLessThan(1);
  });

  it("a saturated sigmoid barely learns (the flat-zone problem)", () => {
    const { w, b } = learningStep(10, 0, 0, "sigmoid", 0.2);
    // Deep in the flat zone the update is negligible.
    expect(Math.abs(w - 10)).toBeLessThan(1e-4);
    expect(Math.abs(b)).toBeLessThan(1e-4);
  });

  it("a dead ReLU (z < 0) does not learn at all", () => {
    const { w, b } = learningStep(-1, 0, 0.5, "relu", 0.2);
    expect(w).toBe(-1);
    expect(b).toBe(0);
  });
});

describe("chainForward", () => {
  it("passes activations forward in a plain chain", () => {
    const state = chainForward([{ w: 1, b: 0 }], "relu", false, 1);
    expect(state.zs).toEqual([1]);
    expect(state.as).toEqual([1]);
    expect(state.input).toBe(1);
  });

  it("adds the input back at each layer when residual is on", () => {
    const plain = chainForward([{ w: 1, b: 0 }], "relu", false, 1);
    const residual = chainForward([{ w: 1, b: 0 }], "relu", true, 1);
    // residual output = prev input (1) + relu(z) (1) = 2
    expect(residual.as[0]).toBe(plain.as[0] + 1);
  });
});

describe("chainWeightGradients", () => {
  const deep = Array.from({ length: 6 }, () => ({ w: 0.5, b: 0 }));

  it("the earliest neuron's gradient vanishes relative to the last in a plain chain", () => {
    const state = chainForward(deep, "sigmoid", false, 1);
    const grads = chainWeightGradients(deep, state, 1, "sigmoid", false);
    expect(grads[0]).toBeLessThan(grads[grads.length - 1]);
    expect(grads[0]).toBeLessThan(1e-3);
  });

  it("residual connections keep the earliest neuron's gradient alive", () => {
    const plainState = chainForward(deep, "sigmoid", false, 1);
    const resState = chainForward(deep, "sigmoid", true, 1);
    const plain = chainWeightGradients(deep, plainState, 1, "sigmoid", false);
    const res = chainWeightGradients(deep, resState, 1, "sigmoid", true);
    expect(res[0]).toBeGreaterThan(plain[0]);
  });

  it("returns one non-negative gradient per neuron", () => {
    const state = chainForward(deep, "sigmoid", false, 1);
    const grads = chainWeightGradients(deep, state, 1, "sigmoid", false);
    expect(grads).toHaveLength(deep.length);
    grads.forEach((g) => expect(g).toBeGreaterThanOrEqual(0));
  });
});
