import { describe, expect, it } from "vitest";
import {
  getScenario,
  isVisibleToUser,
  scenarios,
  senderKind,
  senderLabel,
} from "./toolTranscripts";

describe("scenarios", () => {
  it("has a unique id and label for every scenario", () => {
    expect(new Set(scenarios.map((s) => s.id)).size).toBe(scenarios.length);
    expect(new Set(scenarios.map((s) => s.label)).size).toBe(scenarios.length);
  });

  it("opens with the tool list and ends with a plain reply, which is what stops the loop", () => {
    for (const scenario of scenarios) {
      expect(scenario.turns[0].role).toBe("system");
      expect(scenario.turns[1].role).toBe("user");
      expect(scenario.turns[scenario.turns.length - 1].role).toBe("assistant");
    }
  });

  it("offers every tool it goes on to call, and some it does not", () => {
    for (const scenario of scenarios) {
      const offered = scenario.turns[0].text;
      const called = scenario.turns
        .filter((t) => t.role === "tool-call")
        .map((t) => /^(\w+)\(/.exec(t.text)![1]);
      for (const name of called) expect(offered).toContain(name + "(");
      const listed = offered.match(/^ {2}(\w+)\(/gm)!.length;
      expect(listed).toBeGreaterThan(new Set(called).size);
    }
  });

  it("follows every tool call with a result from the same tool", () => {
    for (const scenario of scenarios) {
      scenario.turns.forEach((turn, i) => {
        if (turn.role === "tool-call") {
          expect(scenario.turns[i + 1]?.role).toBe("tool-result");
          expect(scenario.turns[i + 1]?.tool).toBe(turn.tool);
        }
      });
    }
  });

  it("names a tool on every call and result, and on nothing else", () => {
    for (const scenario of scenarios) {
      for (const turn of scenario.turns) {
        const isToolTurn =
          turn.role === "tool-call" || turn.role === "tool-result";
        expect(turn.tool !== undefined).toBe(isToolTurn);
      }
    }
  });

  it("takes two round trips when one tool feeds another", () => {
    const calls = getScenario("chained").turns.filter(
      (t) => t.role === "tool-call"
    );
    expect(calls).toHaveLength(2);
  });
});

describe("senderLabel", () => {
  it("names a sender for every message", () => {
    for (const scenario of scenarios) {
      for (const turn of scenario.turns) {
        expect(senderLabel(turn)).toBeTruthy();
      }
    }
  });

  it("attributes the tool call to the model and the result to the tool", () => {
    const scenario = getScenario("chained");
    const call = scenario.turns.find((t) => t.role === "tool-call")!;
    const result = scenario.turns.find((t) => t.role === "tool-result")!;
    expect(senderLabel(call)).toBe("Model");
    expect(senderLabel(result)).toBe("Email search");
  });

  it("labels the person Human rather than You", () => {
    const first = getScenario("search").turns.find((t) => t.role === "user")!;
    expect(senderLabel(first)).toBe("Human");
  });
});

describe("isVisibleToUser", () => {
  it("hides everything between the model and the tools", () => {
    for (const scenario of scenarios) {
      for (const turn of scenario.turns) {
        expect(isVisibleToUser(turn)).toBe(
          turn.role === "user" || turn.role === "assistant"
        );
      }
    }
  });

  it("leaves exactly one visible exchange in every scenario", () => {
    for (const scenario of scenarios) {
      const visible = scenario.turns.filter(isVisibleToUser);
      expect(visible.map((t) => t.role)).toEqual(["user", "assistant"]);
    }
  });
});

describe("getScenario", () => {
  it("falls back to the first scenario for an unknown id", () => {
    expect(getScenario("nope")).toBe(scenarios[0]);
  });
});

describe("senderKind", () => {
  it("puts the setup, the person, the model and the tools in four groups", () => {
    const scenario = getScenario("search");
    expect(scenario.turns.map(senderKind)).toEqual([
      "system",
      "human",
      "model",
      "tool",
      "model",
    ]);
  });
});
