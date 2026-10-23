import { describe, expect, it } from "vitest";
import { getChapter, getMainChapters } from "./curriculum";
import { getPartOf, learningPath } from "./learning-path";
import { getWidgetCount } from "./widget-counts";

describe("learningPath", () => {
  it("puts every ready main chapter in exactly one part", () => {
    // The home page only shows chapters that belong to a part, so a chapter
    // marked ready without being added here would vanish from it.
    for (const chapter of getMainChapters().filter((c) => c.ready)) {
      const parts = learningPath.filter((p) => p.slugs.includes(chapter.slug));
      expect(parts, chapter.slug).toHaveLength(1);
    }
  });

  it("only refers to main chapters that exist", () => {
    for (const slug of learningPath.flatMap((p) => p.slugs)) {
      const chapter = getChapter(slug);
      expect(chapter, slug).toBeDefined();
      expect(chapter?.section, slug).toBeUndefined();
    }
  });
});

describe("getPartOf", () => {
  it("returns a chapter's part, numbered from 1", () => {
    expect(getPartOf("transformers")).toEqual({ part: learningPath[2], number: 3 });
    expect(getPartOf("post-training")).toEqual({ part: learningPath[3], number: 4 });
  });

  it("returns undefined for pages outside the learning path", () => {
    expect(getPartOf("introduction")).toBeUndefined();
    expect(getPartOf("appendix-pytorch")).toBeUndefined();
  });
});

describe("getWidgetCount", () => {
  it("counts each distinct widget a chapter renders", () => {
    // Every ready main chapter is built around its widgets.
    for (const chapter of getMainChapters().filter((c) => c.ready)) {
      expect(getWidgetCount(chapter.slug), chapter.slug).toBeGreaterThan(0);
    }
  });

  it("returns 0 for a chapter with no content file", () => {
    expect(getWidgetCount("no-such-chapter")).toBe(0);
  });
});
