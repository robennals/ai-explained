import { describe, expect, it } from "vitest";
import {
  completionFor,
  exchanges,
  isVisible,
  promptParts,
  senderKind,
  senderLabel,
  transcript,
} from "./chatTranscript";

const [firstReply, secondReply] = exchanges;
const joined = (i: number) =>
  promptParts(i)
    .map((p) => p.text)
    .join("");

describe("exchanges", () => {
  it("finds the turns the model wrote", () => {
    expect(exchanges.length).toBeGreaterThanOrEqual(3);
    for (const i of exchanges) {
      expect(transcript[i].role).toBe("assistant");
    }
  });

  it("gives the model a longer prompt every time it replies", () => {
    const lengths = exchanges.map((i) => joined(i).length);
    for (let i = 1; i < lengths.length; i++) {
      expect(lengths[i]).toBeGreaterThan(lengths[i - 1]);
    }
  });

  it("ends with a question that only makes sense from the earlier turns", () => {
    const last = exchanges[exchanges.length - 1];
    expect(transcript[last - 1].text).not.toMatch(/Canberra|Australia/);
    expect(transcript[last].text).toContain("Canberra");
  });
});

describe("promptParts", () => {
  it("ends with the marker opening the model's turn, so a reply is what comes next", () => {
    for (const i of exchanges) {
      expect(joined(i).endsWith("<|assistant|>")).toBe(true);
    }
  });

  it("holds no part of the model's own reply", () => {
    for (const i of exchanges) {
      expect(joined(i)).not.toContain(transcript[i].text);
    }
  });

  it("sends nothing twice over on the first exchange", () => {
    expect(promptParts(firstReply).every((p) => !p.carriedOver)).toBe(true);
  });

  it("re-sends the whole first exchange when answering the second", () => {
    const parts = promptParts(secondReply);
    const carried = parts.filter((p) => p.carriedOver).map((p) => p.text).join("");
    expect(carried).toContain(transcript[1].text);
    expect(carried).toContain(transcript[firstReply].text);
  });

  it("marks only the newest human turn as new", () => {
    const added = promptParts(secondReply)
      .filter((p) => !p.carriedOver)
      .map((p) => p.text)
      .join("");
    expect(added).toContain(transcript[3].text);
    expect(added).not.toContain(transcript[1].text);
  });
});

describe("completionFor", () => {
  it("is the reply and the marker that ends the turn, and nothing else", () => {
    expect(completionFor(firstReply)).toBe(
      `${transcript[firstReply].text}<|end|>`
    );
  });
});

describe("bubbles", () => {
  it("hides the system prompt and shows everything else", () => {
    for (const turn of transcript) {
      expect(isVisible(turn)).toBe(turn.role !== "system");
    }
  });

  it("labels the three speakers", () => {
    expect(new Set(transcript.map(senderLabel))).toEqual(
      new Set(["System prompt", "Human", "Model"])
    );
  });

  it("colours the human and the model differently", () => {
    expect(senderKind(transcript[1])).toBe("human");
    expect(senderKind(transcript[2])).toBe("model");
  });
});
