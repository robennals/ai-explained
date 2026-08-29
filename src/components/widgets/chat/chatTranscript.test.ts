import { describe, expect, it } from "vitest";
import {
  completionFor,
  exchanges,
  isVisible,
  promptParts,
  senderKind,
  senderLabel,
  transcript,
  withSystemPrompt,
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
    expect(carried).toContain(transcript[0].text);
    expect(carried).toContain(transcript[firstReply].text);
  });

  it("marks only the newest human turn as new", () => {
    const added = promptParts(secondReply)
      .filter((p) => !p.carriedOver)
      .map((p) => p.text)
      .join("");
    const newestHuman = transcript[secondReply - 1];
    const olderHuman = transcript[firstReply - 1];
    expect(newestHuman.role).toBe("user");
    expect(added).toContain(newestHuman.text);
    expect(added).not.toContain(olderHuman.text);
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
  it("shows every turn of a plain conversation", () => {
    // The system prompt gets its own section, so it is not in this transcript.
    expect(transcript.some((t) => t.role === "system")).toBe(false);
    for (const turn of transcript) {
      expect(isVisible(turn)).toBe(true);
    }
  });

  it("adds the system prompt in front, hidden, when asked for it", () => {
    const withSystem = withSystemPrompt();
    expect(withSystem[0].role).toBe("system");
    expect(isVisible(withSystem[0])).toBe(false);
    expect(senderLabel(withSystem[0])).toBe("System prompt");
    expect(withSystem.slice(1).every(isVisible)).toBe(true);
  });

  it("colours the human and the model differently", () => {
    const human = transcript.find((t) => t.role === "user")!;
    const assistant = transcript.find((t) => t.role === "assistant")!;
    expect(senderKind(human)).toBe("human");
    expect(senderKind(assistant)).toBe("model");
  });
});
