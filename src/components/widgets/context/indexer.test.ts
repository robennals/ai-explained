import { describe, it, expect } from "vitest";
import { HAYSTACK, QUERIES } from "./haystack";
import { scoreTokens, topK, indexShareLayers, flops } from "./indexer";

describe("haystack data", () => {
  it("has readable tokens and at least two queries with ground truth", () => {
    expect(HAYSTACK.length).toBeGreaterThanOrEqual(20);
    expect(QUERIES.length).toBeGreaterThanOrEqual(2);
    for (const q of QUERIES) expect(q.relevant.length).toBeGreaterThan(0);
  });
});

describe("scoreTokens + topK", () => {
  it("selects the query's relevant tokens when k covers them", () => {
    const q = QUERIES[0];
    const picked = topK(scoreTokens(q, HAYSTACK), q.relevant.length);
    for (const id of q.relevant) expect(picked).toContain(id);
  });
  it("topK never returns more than k", () => {
    const q = QUERIES[0];
    expect(topK(scoreTokens(q, HAYSTACK), 3).length).toBe(3);
  });
});

describe("indexShareLayers", () => {
  it("recomputes layer 0 then every reuseEvery-th layer", () => {
    expect(indexShareLayers(8, 4)).toEqual([true,false,false,false,true,false,false,false]);
  });
});

describe("flops", () => {
  it("sparse is far cheaper than dense at long context", () => {
    const dense = flops(1_000_000, 2048, 8, { sparse: false, share: false, reuseEvery: 4, indexerCost: 1 });
    const sparse = flops(1_000_000, 2048, 8, { sparse: true, share: false, reuseEvery: 4, indexerCost: 1 });
    expect(sparse).toBeLessThan(dense);
  });
  it("index sharing lowers cost versus recomputing every layer", () => {
    const noShare = flops(1_000_000, 2048, 8, { sparse: true, share: false, reuseEvery: 4, indexerCost: 4 });
    const share = flops(1_000_000, 2048, 8, { sparse: true, share: true, reuseEvery: 4, indexerCost: 4 });
    expect(share).toBeLessThan(noShare);
  });
});
