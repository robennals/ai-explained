import { describe, it, expect } from "vitest";
import { blocksNeeded, pagedWaste, contiguousWaste, sharedBlocks } from "./paging";

describe("blocksNeeded", () => {
  it("rounds up to whole blocks", () => {
    expect(blocksNeeded(17, 4)).toBe(5);
    expect(blocksNeeded(16, 4)).toBe(4);
    expect(blocksNeeded(0, 4)).toBe(0);
  });
});

describe("pagedWaste", () => {
  it("only the last partial block of each sequence is wasted", () => {
    // seq 17 -> blocks 5 -> 20 slots -> waste 3; seq 16 -> waste 0
    expect(pagedWaste([17, 16], 4)).toBe(3);
  });
});

describe("contiguousWaste", () => {
  it("wastes the whole reserved-minus-used gap", () => {
    // reserve 100 each, use 17 and 16 -> 83 + 84 = 167
    expect(contiguousWaste([17, 16], 100)).toBe(167);
  });
});

describe("sharedBlocks", () => {
  it("saves prefix blocks for all but the first sequence", () => {
    // prefix 32, 4 seqs, block 16 -> 2 blocks * 3 = 6
    expect(sharedBlocks(32, 4, 16)).toBe(6);
  });
});
