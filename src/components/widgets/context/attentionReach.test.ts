import { describe, it, expect } from "vitest";
import { layerCost, totalCost, reachableDistance, gemma3Layers } from "./attentionReach";

describe("layerCost", () => {
  it("local scales with window, global with sequence", () => {
    expect(layerCost("local", 1000, 8)).toBe(8000);
    expect(layerCost("global", 1000, 8)).toBe(1_000_000);
  });
});

describe("reachableDistance", () => {
  it("each local layer extends reach by one window", () => {
    expect(reachableDistance(["local", "local"], 4, 100)).toBe(8);
  });
  it("a global layer reaches the whole sequence", () => {
    expect(reachableDistance(["local", "global", "local"], 4, 100)).toBe(100);
  });
  it("caps at the sequence length", () => {
    expect(reachableDistance(["local", "local"], 400, 100)).toBe(100);
  });
});

describe("gemma3Layers", () => {
  it("is five local then one global, repeated", () => {
    expect(gemma3Layers(1)).toEqual(["local","local","local","local","local","global"]);
    expect(gemma3Layers(2)).toHaveLength(12);
  });
});

describe("totalCost", () => {
  it("sums per-layer costs", () => {
    expect(totalCost(["local","global"], 1000, 8)).toBe(8000 + 1_000_000);
  });
});
