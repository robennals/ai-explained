import { describe, expect, it } from "vitest";
import {
  getSkillScenario,
  isSkillTurnVisible,
  skillScenarios,
  skillSenderKind,
  skillSenderLabel,
} from "./skillTranscripts";

describe("skillScenarios", () => {
  it("starts every scenario by offering its own list of skills", () => {
    const lists = skillScenarios.map((s) => s.turns[0].text);
    for (const scenario of skillScenarios) {
      expect(scenario.turns[0].role).toBe("system");
    }
    expect(new Set(lists).size).toBeGreaterThan(1);
  });

  it("gives every offered skill a name and a line on when it applies", () => {
    for (const scenario of skillScenarios) {
      const lines = scenario.turns[0].text
        .split("\n")
        .filter((line) => line.startsWith("  "));
      expect(lines.length).toBeGreaterThanOrEqual(3);
      for (const line of lines) {
        expect(line.trim().split(/\s{2,}/)).toHaveLength(2);
      }
    }
  });

  it("loads at least one skill in every scenario", () => {
    for (const scenario of skillScenarios) {
      const requests = scenario.turns.filter(
        (t) => t.role === "skill-request"
      );
      expect(requests.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("writes every skill document as prose, not a bare parameter table", () => {
    for (const scenario of skillScenarios) {
      for (const turn of scenario.turns) {
        if (turn.role === "skill-document") {
          expect(turn.text).toMatch(/\b(Use this|Read this|Work through|Book it)\b/);
        }
      }
    }
  });

  it("has a scenario where one skill sends the model to another", () => {
    const chained = skillScenarios.find(
      (s) => s.turns.filter((t) => t.role === "skill-request").length > 1
    );
    expect(chained).toBeDefined();
    const first = chained!.turns.find((t) => t.role === "skill-document")!;
    const second = chained!.turns.filter(
      (t) => t.role === "skill-request"
    )[1];
    const name = /load_skill\("([^"]+)"\)/.exec(second.text)![1];
    expect(first.text).toContain(name);
  });

  it("asks only for skills that scenario was offered", () => {
    for (const scenario of skillScenarios) {
      const offered = scenario.turns[0].text;
      for (const request of scenario.turns.filter(
        (t) => t.role === "skill-request"
      )) {
        const name = /load_skill\("([^"]+)"\)/.exec(request.text)![1];
        expect(offered).toContain(name);
      }
    }
  });

  it("follows a request with the document it asked for", () => {
    for (const scenario of skillScenarios) {
      scenario.turns.forEach((turn, i) => {
        if (turn.role === "skill-request") {
          expect(scenario.turns[i + 1]?.role).toBe("skill-document");
        }
      });
    }
  });

  it("follows every tool call with a result from the same tool", () => {
    for (const scenario of skillScenarios) {
      scenario.turns.forEach((turn, i) => {
        if (turn.role === "tool-call") {
          expect(scenario.turns[i + 1]?.role).toBe("tool-result");
          expect(scenario.turns[i + 1]?.tool).toBe(turn.tool);
        }
      });
    }
  });

  it("covers skills that drive a tool and skills that do not", () => {
    const usesTool = skillScenarios.map((s) =>
      s.turns.some((t) => t.role === "tool-call")
    );
    expect(usesTool).toContain(true);
    expect(usesTool).toContain(false);
  });

  it("ends every scenario with a reply to the human", () => {
    for (const scenario of skillScenarios) {
      expect(scenario.turns[scenario.turns.length - 1].role).toBe("assistant");
    }
  });
});

describe("skill transcript rendering", () => {
  it("hides the system prompt, the skill traffic and the tool traffic", () => {
    for (const scenario of skillScenarios) {
      for (const turn of scenario.turns) {
        expect(isSkillTurnVisible(turn)).toBe(
          turn.role === "user" || turn.role === "assistant"
        );
      }
    }
  });

  it("attributes the request to the model and the document to the library", () => {
    const scenario = getSkillScenario("tool-use");
    const request = scenario.turns.find((t) => t.role === "skill-request")!;
    const document = scenario.turns.find((t) => t.role === "skill-document")!;
    expect(skillSenderLabel(request)).toBe("Model");
    expect(skillSenderKind(request)).toBe("model");
    expect(skillSenderLabel(document)).toBe("Skill library");
    expect(skillSenderKind(document)).toBe("tool");
  });

  it("names the tool on a result", () => {
    const result = getSkillScenario("tool-use").turns.find(
      (t) => t.role === "tool-result"
    )!;
    expect(skillSenderLabel(result)).toBe("Council website");
  });
});

describe("getSkillScenario", () => {
  it("falls back to the first scenario for an unknown id", () => {
    expect(getSkillScenario("nope")).toBe(skillScenarios[0]);
  });
});
