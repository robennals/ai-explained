import { describe, it, expect } from "vitest";
import { getChapter, getChapterRefLabel } from "./curriculum";

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
