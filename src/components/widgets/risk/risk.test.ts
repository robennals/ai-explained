import { describe, expect, it } from "vitest";
import {
  controlCases,
  fictionCases,
  responseCases,
  whyBadCases,
} from "./riskCases";
import { estimates } from "./estimates";

const caseSets = [fictionCases, whyBadCases, controlCases, responseCases];

describe("risk case sets", () => {
  it("gives every set a distinct title, since it names the widget in analytics", () => {
    const titles = caseSets.map((s) => s.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("keeps headlines to one skimmable sentence", () => {
    for (const set of caseSets) {
      for (const c of set.cases) expect(c.headline.length, c.id).toBeLessThan(130);
    }
  });

  it("cites at least one https source for every case study", () => {
    for (const set of caseSets) {
      for (const c of set.cases) {
        for (const e of c.examples ?? []) {
          expect(e.sources.length, e.title).toBeGreaterThan(0);
          for (const s of e.sources) expect(s.url, e.title).toMatch(/^https:\/\//);
        }
      }
    }
  });
});

describe("estimates", () => {
  it("only includes estimates from 2023 on, after recent progress was visible", () => {
    for (const e of estimates) expect(e.year, e.who).toBeGreaterThanOrEqual(2023);
  });

  it("cites a source for every estimate", () => {
    for (const e of estimates) expect(e.sources.length, e.who).toBeGreaterThan(0);
  });

  it("keeps every range in order and within 0–100%", () => {
    for (const e of estimates) {
      if (!e.range) continue;
      expect(e.range[0], e.who).toBeLessThanOrEqual(e.range[1]);
      expect(e.range[0], e.who).toBeGreaterThanOrEqual(0);
      expect(e.range[1], e.who).toBeLessThanOrEqual(100);
    }
  });
});
