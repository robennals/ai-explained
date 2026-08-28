import { describe, expect, it } from "vitest";
import {
  conversations,
  isVisible,
  senderKind,
  senderLabel,
} from "./memoryTranscripts";

const [first, second] = conversations;

describe("conversations", () => {
  it("shows two conversations, separated in time", () => {
    expect(conversations).toHaveLength(2);
    expect(second.when).toMatch(/later/);
  });

  it("writes a memory in the first and reads one in the second", () => {
    expect(first.turns.some((t) => t.role === "memory-write")).toBe(true);
    expect(first.turns.some((t) => t.role === "memory-search")).toBe(false);
    expect(second.turns.some((t) => t.role === "memory-search")).toBe(true);
    expect(second.turns.some((t) => t.role === "memory-write")).toBe(false);
  });

  it("follows every write and search with a result from the store", () => {
    for (const conversation of conversations) {
      conversation.turns.forEach((turn, i) => {
        if (turn.role === "memory-write" || turn.role === "memory-search") {
          expect(conversation.turns[i + 1]?.role).toBe("memory-result");
        }
      });
    }
  });

  it("reads back the same preference it wrote, and nothing more", () => {
    const written = first.turns.find((t) => t.role === "memory-write")!;
    const read = second.turns.find((t) => t.role === "memory-result")!;
    expect(written.text).toContain("09:00");
    expect(read.text).toContain("09:00");
  });

  it("acts on the memory rather than silently obeying it", () => {
    const reply = second.turns[second.turns.length - 1];
    expect(reply.role).toBe("assistant");
    expect(reply.text).toMatch(/mentioned before|you'd rather/);
  });

  it("starts each conversation with the human and ends with a reply", () => {
    for (const conversation of conversations) {
      expect(conversation.turns[0].role).toBe("user");
      expect(
        conversation.turns[conversation.turns.length - 1].role
      ).toBe("assistant");
    }
  });
});

describe("rendering", () => {
  it("hides everything between the model and the memory store", () => {
    for (const conversation of conversations) {
      for (const turn of conversation.turns) {
        expect(isVisible(turn)).toBe(
          turn.role === "user" || turn.role === "assistant"
        );
      }
    }
  });

  it("attributes the write to the model and the result to the store", () => {
    const write = first.turns.find((t) => t.role === "memory-write")!;
    const result = first.turns.find((t) => t.role === "memory-result")!;
    expect(senderLabel(write)).toBe("Model");
    expect(senderKind(write)).toBe("model");
    expect(senderLabel(result)).toBe("Memory store");
    expect(senderKind(result)).toBe("tool");
  });
});
