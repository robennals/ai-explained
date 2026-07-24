import { describe, it, expect } from "vitest";
import { chapters, getMainChapters, getChapter } from "./curriculum";

describe("curriculum ordering", () => {
  it("has no long-context chapter (absorbed into context)", () => {
    expect(getChapter("long-context")).toBeUndefined();
  });

  it("places context at id 10, right after transformers", () => {
    const context = getChapter("context");
    const transformers = getChapter("transformers");
    expect(transformers?.id).toBe(9);
    expect(context?.id).toBe(10);
  });

  it("renumbers the shifted chapters", () => {
    expect(getChapter("matrix-math")?.id).toBe(11);
    expect(getChapter("training")?.id).toBe(12);
    expect(getChapter("mixture-of-experts")?.id).toBe(13);
    expect(getChapter("inference")?.id).toBe(14);
    expect(getChapter("hallucination")?.id).toBe(26);
  });

  it("has contiguous main-chapter ids 1..N in array order", () => {
    const main = getMainChapters();
    main.forEach((c, i) => expect(c.id).toBe(i + 1));
  });

  it("every prerequisite id refers to an existing chapter", () => {
    const ids = new Set(chapters.map((c) => c.id));
    for (const c of chapters) {
      for (const p of c.prerequisites) expect(ids.has(p)).toBe(true);
    }
  });

  it("context is marked ready", () => {
    expect(getChapter("context")?.ready).toBe(true);
  });
});
