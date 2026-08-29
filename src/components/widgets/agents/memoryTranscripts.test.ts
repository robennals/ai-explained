import { describe, expect, it } from "vitest";
import {
  getMemoryScenario,
  isVisible,
  memoryScenarios,
  senderKind,
  senderLabel,
} from "./memoryTranscripts";

const allTurns = memoryScenarios.flatMap((s) =>
  s.conversations.flatMap((c) => c.turns)
);

describe("memoryScenarios", () => {
  it("has a unique id and label for every scenario", () => {
    expect(new Set(memoryScenarios.map((s) => s.id)).size).toBe(
      memoryScenarios.length
    );
    expect(new Set(memoryScenarios.map((s) => s.label)).size).toBe(
      memoryScenarios.length
    );
  });

  it("separates the conversations in time wherever there are two", () => {
    for (const scenario of memoryScenarios) {
      if (scenario.conversations.length > 1) {
        expect(scenario.conversations[1].when).toMatch(/later/);
      }
    }
  });

  it("follows every write and search with a result from the store", () => {
    for (const scenario of memoryScenarios) {
      for (const conversation of scenario.conversations) {
        conversation.turns.forEach((turn, i) => {
          if (turn.role === "memory-write" || turn.role === "memory-search") {
            expect(conversation.turns[i + 1]?.role).toBe("memory-result");
          }
        });
      }
    }
  });

  it("starts each conversation with the memory instructions, then the human", () => {
    for (const scenario of memoryScenarios) {
      for (const conversation of scenario.conversations) {
        expect(conversation.turns[0].role).toBe("system");
        expect(conversation.turns[1].role).toBe("user");
        expect(
          conversation.turns[conversation.turns.length - 1].role
        ).toBe("assistant");
      }
    }
  });
});

describe("remembering a preference", () => {
  const scenario = getMemoryScenario("preference");

  it("writes in the first conversation and reads in the second", () => {
    const [first, second] = scenario.conversations;
    expect(first.turns.some((t) => t.role === "memory-write")).toBe(true);
    expect(second.turns.some((t) => t.role === "memory-search")).toBe(true);
  });

  it("reads back the preference it wrote", () => {
    const [first, second] = scenario.conversations;
    const written = first.turns.find((t) => t.role === "memory-write")!;
    const read = second.turns.find((t) => t.role === "memory-result")!;
    expect(written.text).toContain("09:00");
    expect(read.text).toContain("09:00");
  });

  it("surfaces the memory rather than silently obeying it", () => {
    const second = scenario.conversations[1].turns;
    expect(second[second.length - 1].text).toMatch(/mentioned before/);
  });
});

describe("learning from a mistake", () => {
  const scenario = getMemoryScenario("mistake");
  const [first, second] = scenario.conversations;

  it("gives every conversation the same instructions, since each starts from nothing", () => {
    const texts = memoryScenarios.flatMap((s) =>
      s.conversations.map((c) => c.turns[0].text)
    );
    expect(new Set(texts).size).toBe(1);
    expect(texts[0]).toContain("save_memory");
    expect(texts[0]).toContain("search_memory");
  });

  it("gets it wrong, is corrected, and only then writes anything down", () => {
    const roles = first.turns.map((t) => t.role);
    expect(roles.indexOf("assistant")).toBeLessThan(
      roles.indexOf("memory-write")
    );
    expect(roles.filter((r) => r === "user")).toHaveLength(2);
  });

  it("spells the name wrongly first and correctly after the correction", () => {
    const replies = first.turns.filter((t) => t.role === "assistant");
    expect(replies[0].text).toContain("Siobhan");
    expect(replies[0].text).not.toContain("Siobhán");
    expect(replies[1].text).toContain("Siobhán");
  });

  it("later gets it right even though the request spells it wrongly", () => {
    const request = second.turns.find((t) => t.role === "user")!;
    const reply = second.turns[second.turns.length - 1];
    expect(request.text).toContain("Siobhan");
    expect(request.text).not.toContain("Siobhán");
    expect(reply.text).toContain("Siobhán");
  });
});

describe("rendering", () => {
  it("hides everything between the model and the memory store", () => {
    for (const turn of allTurns) {
      expect(isVisible(turn)).toBe(
        turn.role === "user" || turn.role === "assistant"
      );
    }
  });

  it("attributes writes to the model and results to the store", () => {
    const write = allTurns.find((t) => t.role === "memory-write")!;
    const result = allTurns.find((t) => t.role === "memory-result")!;
    expect(senderLabel(write)).toBe("Model");
    expect(senderKind(write)).toBe("model");
    expect(senderLabel(result)).toBe("Memory store");
    expect(senderKind(result)).toBe("tool");
  });
});

describe("getMemoryScenario", () => {
  it("falls back to the first scenario for an unknown id", () => {
    expect(getMemoryScenario("nope")).toBe(memoryScenarios[0]);
  });
});
