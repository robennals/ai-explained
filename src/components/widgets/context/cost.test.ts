import { describe, it, expect } from "vitest";
import {
  attentionFlops,
  energyJoules,
  dollars,
  formatCount,
  formatEnergy,
  formatDollars,
  EQUIVALENTS,
  nearestEquivalent,
  windowForEnergy,
} from "./cost";

describe("attentionFlops", () => {
  it("is 4 * W^2 * headDim * totalHeads", () => {
    expect(attentionFlops(10, 8, 2)).toBe(4 * 10 * 10 * 8 * 2);
  });

  it("quadruples when the window doubles", () => {
    const base = attentionFlops(1000, 64, 100);
    const doubled = attentionFlops(2000, 64, 100);
    expect(doubled).toBe(4 * base);
  });

  it("doubles when totalHeads doubles", () => {
    const base = attentionFlops(1000, 64, 100);
    const doubled = attentionFlops(1000, 64, 200);
    expect(doubled).toBe(2 * base);
  });

  it("doubles when headDim doubles", () => {
    const base = attentionFlops(1000, 64, 100);
    const doubled = attentionFlops(1000, 128, 100);
    expect(doubled).toBe(2 * base);
  });
});

describe("energyJoules", () => {
  it("is flops / flopsPerJoule, defaulting to 1e12", () => {
    expect(energyJoules(1e12)).toBe(1);
    expect(energyJoules(2e12)).toBe(2);
  });

  it("is proportional to flops", () => {
    expect(energyJoules(2e12)).toBe(2 * energyJoules(1e12));
  });

  it("accepts a custom flopsPerJoule", () => {
    expect(energyJoules(1e6, 1e3)).toBe(1000);
  });
});

describe("dollars", () => {
  it("is flops * dollarsPerFlop, defaulting to 1.39e-18", () => {
    expect(dollars(1e18)).toBeCloseTo(1.39, 6);
  });

  it("is proportional to flops", () => {
    expect(dollars(2e18)).toBeCloseTo(2 * dollars(1e18), 6);
  });

  it("accepts a custom dollarsPerFlop", () => {
    expect(dollars(1e6, 1e-3)).toBeCloseTo(1000, 6);
  });
});

describe("formatCount", () => {
  it("uses short human units", () => {
    expect(formatCount(1_000_000)).toBe("1M");
    expect(formatCount(2_500_000_000)).toBe("2.5B");
    expect(formatCount(1_000_000_000_000)).toBe("1T");
    expect(formatCount(950)).toBe("950");
  });
});

describe("formatEnergy", () => {
  it("shows small values in joules", () => {
    expect(formatEnergy(5)).toBe("5 J");
    expect(formatEnergy(500)).toBe("500 J");
  });

  it("shows kJ once past 1000 J", () => {
    expect(formatEnergy(2500)).toBe("2.5 kJ");
  });

  it("shows kWh once at or above 3.6e5 J (1 kWh = 3.6e6 J)", () => {
    expect(formatEnergy(3.6e5)).toBe("0.1 kWh");
    expect(formatEnergy(3.6e6)).toBe("1 kWh");
  });

  it("shows MWh for very large values", () => {
    expect(formatEnergy(3.6e9)).toBe("1,000 kWh");
  });
});

describe("formatDollars", () => {
  it("shows small amounts with cents precision", () => {
    expect(formatDollars(0.002)).toBe("$0.002");
    expect(formatDollars(5.6)).toBe("$5.60");
  });

  it("shows large amounts abbreviated", () => {
    expect(formatDollars(1_200_000)).toBe("$1.2M");
  });
});

describe("EQUIVALENTS", () => {
  it("is sorted ascending by joules", () => {
    for (let i = 1; i < EQUIVALENTS.length; i++) {
      expect(EQUIVALENTS[i].joules).toBeGreaterThan(EQUIVALENTS[i - 1].joules);
    }
  });

  it("includes a web search anchor", () => {
    expect(EQUIVALENTS.some((e) => e.singular.includes("web search"))).toBe(true);
  });
});

describe("nearestEquivalent", () => {
  it("picks the largest anchor at or below the value", () => {
    // pick a value squarely inside the phone-charge band (65,000 J each),
    // well clear of the laptop-hour anchor above it (180,000 J)
    const result = nearestEquivalent(65000 * 2); // 2 phone charges
    expect(result.label.toLowerCase()).toContain("phone charge");
    expect(result.count).toBeCloseTo(2, 5);
  });

  it("falls back to the smallest anchor for tiny values", () => {
    const result = nearestEquivalent(1);
    expect(result.label.toLowerCase()).toContain("web search");
  });

  it("picks GPT-3 training for enormous values", () => {
    const result = nearestEquivalent(4.63e12 * 2);
    expect(result.label.toLowerCase()).toContain("gpt-3");
    expect(result.count).toBeCloseTo(2, 5);
  });

  it("uses singular label when count is approximately 1", () => {
    const result = nearestEquivalent(1080);
    expect(result.label).not.toMatch(/searches/);
  });

  it("also returns the matched anchor entry, for highlighting a ladder UI", () => {
    const result = nearestEquivalent(65000 * 2);
    expect(result.entry.singular).toBe("phone charge");
  });
});

describe("windowForEnergy", () => {
  it("inverts energyJoules(attentionFlops(w, headDim, totalHeads)) for w", () => {
    const headDim = 256;
    const totalHeads = 4992;
    const targetJoules = 3.6e6; // 1 kWh
    const w = windowForEnergy(targetJoules, headDim, totalHeads);
    const flops = attentionFlops(w, headDim, totalHeads);
    expect(energyJoules(flops)).toBeCloseTo(targetJoules, 0);
  });

  it("scales inversely with sqrt(headDim) and sqrt(totalHeads)", () => {
    const base = windowForEnergy(1e6, 128, 1000);
    const doubledHeadDim = windowForEnergy(1e6, 256, 1000);
    expect(doubledHeadDim).toBeCloseTo(base / Math.sqrt(2), 6);
  });
});
