import { describe, expect, it } from "vitest";
import { getMainChapters } from "./curriculum";
import { countProseWords, getReadingMinutes } from "./reading-time";

describe("countProseWords", () => {
  it("counts prose and widget captions but not tags, imports, or markup", () => {
    const mdx = [
      'import { Foo } from "./foo";',
      "## A heading",
      "Some *emphasised* text in <Ch slug=\"computation\" />.",
      "<FooWidget>",
      "A caption here.",
      "</FooWidget>",
    ].join("\n");
    expect(countProseWords(mdx)).toBe(9);
  });
});

describe("getReadingMinutes", () => {
  it("gives every ready chapter a plausible time in 5-minute steps", () => {
    for (const chapter of getMainChapters().filter((c) => c.ready)) {
      const minutes = getReadingMinutes(chapter.slug);
      expect(minutes % 5, chapter.slug).toBe(0);
      expect(minutes, chapter.slug).toBeGreaterThanOrEqual(5);
      expect(minutes, chapter.slug).toBeLessThanOrEqual(60);
    }
  });

  it("returns 0 for a chapter with no content", () => {
    expect(getReadingMinutes("no-such-chapter")).toBe(0);
  });
});
