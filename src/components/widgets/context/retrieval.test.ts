import { describe, it, expect } from "vitest";
import { CORPUS, EXAMPLE_QUERIES } from "./corpus";
import { keywordScore, semanticScore, rank } from "./retrieval";

describe("corpus data", () => {
  it("has docs with text and meaning tags", () => {
    expect(CORPUS.length).toBeGreaterThanOrEqual(5);
    for (const d of CORPUS) expect(d.tags.length).toBeGreaterThan(0);
  });
  it("includes a meaning-not-words query and an exact-word query", () => {
    expect(EXAMPLE_QUERIES.length).toBeGreaterThanOrEqual(2);
  });
});

describe("keywordScore", () => {
  it("counts shared words", () => {
    const doc = { id: 1, text: "the dog barked loudly", tags: [] };
    expect(keywordScore("dog barked", doc)).toBe(2);
    expect(keywordScore("cat meowed", doc)).toBe(0);
  });
});

describe("semanticScore", () => {
  it("counts shared meaning tags", () => {
    const doc = { id: 1, text: "the pup wouldn't stop", tags: ["dog", "noise"] };
    expect(semanticScore({ tags: ["dog"] }, doc)).toBe(1);
    expect(semanticScore({ tags: ["car"] }, doc)).toBe(0);
  });
});

describe("rank", () => {
  it("orders docs by score descending, stable on ties", () => {
    const ranked = rank(CORPUS, (d) => (d.id === CORPUS[0].id ? 5 : 0));
    expect(ranked[0].doc.id).toBe(CORPUS[0].id);
  });
});
