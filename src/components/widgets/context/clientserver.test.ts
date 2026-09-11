import { describe, it, expect } from "vitest";
import { CONVO, FRAMES } from "./clientserver";

describe("client / server exchange", () => {
  it("ends with the whole conversation on the device", () => {
    expect(FRAMES[FRAMES.length - 1].device).toBe(CONVO.length);
  });

  it("resends the whole (growing) conversation each round", () => {
    const sends = FRAMES.filter((f) => f.dir === "toServer");
    expect(sends).toHaveLength(2);
    expect(sends[0].serverHolds.length).toBe(1);
    expect(sends[1].serverHolds.length).toBe(3); // grew — the whole thing again
  });

  it("empties the server after every reply (no memory)", () => {
    // the frame right after each toDevice reply must have an empty server
    FRAMES.forEach((f, i) => {
      if (f.dir === "toDevice") {
        const next = FRAMES[i + 1];
        expect(next.serverHolds).toEqual([]);
      }
    });
  });

  it("never shows the device losing messages", () => {
    for (let i = 1; i < FRAMES.length; i++) {
      expect(FRAMES[i].device).toBeGreaterThanOrEqual(FRAMES[i - 1].device);
    }
  });
});
