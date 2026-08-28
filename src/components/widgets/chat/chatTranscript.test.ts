import { describe, expect, it } from "vitest";
import {
  asRawText,
  isVisible,
  senderKind,
  senderLabel,
  transcript,
} from "./chatTranscript";

describe("asRawText", () => {
  const raw = asRawText();

  it("keeps every turn's words", () => {
    for (const turn of transcript) {
      expect(raw).toContain(turn.text);
    }
  });

  it("marks who is speaking before each turn", () => {
    expect(raw).toContain("<|system|>");
    expect(raw).toContain("<|user|>");
    expect(raw).toContain("<|assistant|>");
  });

  it("closes the model's turns so the harness knows to stop", () => {
    const ends = raw.split("<|end|>").length - 1;
    expect(ends).toBe(
      transcript.filter((t) => t.role === "assistant").length
    );
  });

  it("does not close the human's turns", () => {
    expect(raw).not.toMatch(/What's the capital of Australia\?<\|end\|>/);
  });
});

describe("bubbles", () => {
  it("hides the system prompt and shows everything else", () => {
    for (const turn of transcript) {
      expect(isVisible(turn)).toBe(turn.role !== "system");
    }
  });

  it("labels the three speakers", () => {
    const labels = transcript.map(senderLabel);
    expect(new Set(labels)).toEqual(
      new Set(["System prompt", "Human", "Model"])
    );
  });

  it("colours the human and the model differently", () => {
    expect(senderKind(transcript[1])).toBe("human");
    expect(senderKind(transcript[2])).toBe("model");
  });
});
