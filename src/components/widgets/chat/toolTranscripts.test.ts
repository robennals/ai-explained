import { describe, expect, it } from "vitest";
import {
  addressLine,
  getScenario,
  isVisibleToUser,
  scenarios,
} from "./toolTranscripts";

describe("scenarios", () => {
  it("has a unique id and label for every scenario", () => {
    expect(new Set(scenarios.map((s) => s.id)).size).toBe(scenarios.length);
    expect(new Set(scenarios.map((s) => s.label)).size).toBe(scenarios.length);
  });

  it("starts with the user and ends with a plain reply, which is what stops the loop", () => {
    for (const scenario of scenarios) {
      expect(scenario.turns[0].role).toBe("user");
      expect(scenario.turns[scenario.turns.length - 1].role).toBe("assistant");
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

  it("takes two round trips in the chained and failing scenarios", () => {
    for (const id of ["chained", "broken"]) {
      const calls = getScenario(id).turns.filter(
        (t) => t.role === "tool-call"
      );
      expect(calls).toHaveLength(2);
    }
  });
});

describe("addressLine", () => {
  it("addresses each turn from someone to someone", () => {
    for (const scenario of scenarios) {
      for (const turn of scenario.turns) {
        const { from, to } = addressLine(turn);
        expect(from).toBeTruthy();
        expect(to).toBeTruthy();
        expect(from).not.toBe(to);
      }
    }
  });

  it("puts the model on one side of every turn", () => {
    for (const scenario of scenarios) {
      for (const turn of scenario.turns) {
        const { from, to } = addressLine(turn);
        expect([from, to]).toContain("Model");
      }
    }
  });

  it("names the tool as the correspondent on a call and its result", () => {
    const scenario = getScenario("chained");
    const call = scenario.turns.find((t) => t.role === "tool-call")!;
    const result = scenario.turns.find((t) => t.role === "tool-result")!;
    expect(addressLine(call).to).toBe("Email search");
    expect(addressLine(result).from).toBe("Email search");
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
