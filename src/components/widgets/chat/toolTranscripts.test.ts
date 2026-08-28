import { describe, expect, it } from "vitest";
import { buildTranscript, roleLabels } from "./toolTranscripts";

describe("buildTranscript", () => {
  it("starts with the user's question either way", () => {
    expect(buildTranscript(false)[0].role).toBe("user");
    expect(buildTranscript(true)[0].role).toBe("user");
  });

  it("ends with a plain assistant turn, which is what stops the loop", () => {
    for (const broken of [false, true]) {
      const turns = buildTranscript(broken);
      expect(turns[turns.length - 1].role).toBe("assistant");
    }
  });

  it("follows every tool call with its result", () => {
    for (const broken of [false, true]) {
      const turns = buildTranscript(broken);
      turns.forEach((turn, i) => {
        if (turn.role === "tool-call") {
          expect(turns[i + 1]?.role).toBe("tool-result");
          expect(turns[i + 1]?.tool).toBe(turn.tool);
        }
      });
    }
  });

  it("takes an extra round trip when the weather tool is broken", () => {
    expect(buildTranscript(true).length).toBeGreaterThan(
      buildTranscript(false).length
    );
  });

  it("marks tool results as coming from the harness, not the model", () => {
    for (const broken of [false, true]) {
      for (const turn of buildTranscript(broken)) {
        expect(turn.fromHarness ?? false).toBe(turn.role === "tool-result");
      }
    }
  });

  it("labels every role", () => {
    for (const turn of buildTranscript(true)) {
      expect(roleLabels[turn.role]).toBeTruthy();
    }
  });
});
