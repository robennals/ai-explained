import { describe, expect, it } from "vitest";
import {
  biasCases,
  truthCases,
  valueCases,
} from "./societyCases";
import { resources } from "./resourceData";
import { technologies } from "./technologies";

const caseSets = [biasCases, truthCases, valueCases];

describe("case sets", () => {
  it("gives every set a distinct title, since it names the widget in analytics", () => {
    const titles = caseSets.map((s) => s.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("gives every case in a set a unique id", () => {
    for (const set of caseSets) {
      const ids = set.cases.map((c) => c.id);
      expect(new Set(ids).size, set.title).toBe(ids.length);
    }
  });

  it("keeps headlines to one skimmable sentence", () => {
    for (const set of caseSets) {
      for (const c of set.cases) {
        expect(c.headline.length, c.id).toBeLessThan(130);
      }
    }
  });

  it("cites at least one https source for every case, or for each of its examples", () => {
    for (const set of caseSets) {
      for (const c of set.cases) {
        const sourceLists = c.examples ? c.examples.map((e) => e.sources) : [c.sources];
        for (const sources of sourceLists) {
          expect(sources.length, c.id).toBeGreaterThan(0);
          for (const source of sources) expect(source.url, c.id).toMatch(/^https:\/\//);
        }
      }
    }
  });
});

describe("technologies", () => {
  it("gives every technology a unique id", () => {
    const ids = technologies.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every technology a good side, a bad side and at least one adaptation", () => {
    for (const t of technologies) {
      expect(t.good.text.trim(), t.id).not.toBe("");
      expect(t.bad.text.trim(), t.id).not.toBe("");
      expect(t.adapted.length, t.id).toBeGreaterThan(0);
    }
  });

  it("backs both the good and the bad side of every technology with a number", () => {
    for (const t of technologies) {
      expect(t.good.stat, t.id).toBeDefined();
      expect(t.bad.stat, t.id).toBeDefined();
    }
  });

  it("cites at least one https source for every technology", () => {
    for (const t of technologies) {
      expect(t.sources.length, t.id).toBeGreaterThan(0);
      for (const source of t.sources) expect(source.url, t.id).toMatch(/^https:\/\//);
    }
  });
});

describe("resource data", () => {
  it("has positive values everywhere", () => {
    for (const resource of resources) {
      for (const bar of [...resource.everyday.bars, ...resource.world.bars]) {
        expect(bar.value, bar.label).toBeGreaterThan(0);
      }
      for (const series of resource.overTime.series) {
        for (const point of series.points) expect(point.value, series.label).toBeGreaterThan(0);
      }
    }
  });

  it("lists comparison bars from smallest to largest", () => {
    for (const resource of resources) {
      for (const comparison of [resource.everyday, resource.world]) {
        const values = comparison.bars.map((b) => b.value);
        expect(values, `${resource.id} ${comparison.title}`).toEqual([...values].sort((a, b) => a - b));
      }
    }
  });

  it("lists each trend's points in year order", () => {
    for (const resource of resources) {
      for (const series of resource.overTime.series) {
        const years = series.points.map((p) => p.year);
        expect(years, series.label).toEqual([...years].sort((a, b) => a - b));
      }
    }
  });

  it("keeps a forecast range around its central value", () => {
    for (const resource of resources) {
      for (const series of resource.overTime.series) {
        for (const point of series.points) {
          if (!point.range) continue;
          expect(point.range[0]).toBeLessThanOrEqual(point.value);
          expect(point.range[1]).toBeGreaterThanOrEqual(point.value);
        }
      }
    }
  });
});
