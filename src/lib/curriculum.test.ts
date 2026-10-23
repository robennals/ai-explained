import { describe, it, expect } from "vitest";
import { chapters, getChapter, getChapterRefLabel } from "./curriculum";
import { chapterMetadata } from "./chapter-metadata";

describe("getChapterRefLabel", () => {
  it("labels a main chapter with its 1-based position", () => {
    // computation is the first main chapter, next-word-prediction the sixth.
    expect(getChapterRefLabel(getChapter("computation")!)).toBe("Chapter 1");
    expect(getChapterRefLabel(getChapter("next-word-prediction")!)).toBe("Chapter 6");
  });

  it("labels the intro chapter by title, since it isn't numbered", () => {
    expect(getChapterRefLabel(getChapter("introduction")!)).toBe("Introduction");
  });

  it("labels appendix chapters as appendices", () => {
    expect(getChapterRefLabel(getChapter("appendix-pytorch")!)).toBe("Appendix A1");
    expect(getChapterRefLabel(getChapter("glossary")!)).toBe("Appendix A2");
  });
});

describe("searchTitle", () => {
  it("is set on every published chapter except the intro, which isn't promoted to search", () => {
    const missing = chapters.filter(
      (c) => c.ready && c.section !== "intro" && !c.searchTitle
    );
    expect(missing.map((c) => c.slug)).toEqual([]);
  });

  it("is what the page title and link previews use", () => {
    const meta = chapterMetadata("transformers");
    expect(meta.title).toBe("Transformers: How LLMs Work Inside");
    expect(meta.openGraph?.title).toBe("Transformers: How LLMs Work Inside");
  });
});
