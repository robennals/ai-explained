import { describe, expect, it } from "vitest";
import {
  getSkillScenario,
  isSkillTurnVisible,
  skillScenarios,
  skillSenderKind,
  skillSenderLabel,
} from "./skillTranscripts";

describe("skillScenarios", () => {
  it("starts every scenario with the list of available skills", () => {
    for (const scenario of skillScenarios) {
      expect(scenario.turns[0].role).toBe("system");
    }
  });

  it("offers the same skills in both scenarios, so only the request differs", () => {
    const [first, second] = skillScenarios;
    expect(first.turns[0].text).toBe(second.turns[0].text);
  });

  it("gives every offered skill a name and a line on when it applies", () => {
    const lines = skillScenarios[0].turns[0].text
      .split("\n")
      .filter((line) => line.startsWith("  "));
    expect(lines.length).toBeGreaterThanOrEqual(4);
    for (const line of lines) {
      expect(line.trim().split(/\s{2,}/)).toHaveLength(2);
    }
  });

  it("follows a request with the document it asked for", () => {
    const scenario = getSkillScenario("loads");
    scenario.turns.forEach((turn, i) => {
      if (turn.role === "skill-request") {
        expect(scenario.turns[i + 1]?.role).toBe("skill-document");
      }
    });
  });

  it("loads nothing when no skill applies", () => {
    const roles = getSkillScenario("none").turns.map((t) => t.role);
    expect(roles).not.toContain("skill-request");
  });

  it("ends every scenario with a reply to the human", () => {
    for (const scenario of skillScenarios) {
      expect(scenario.turns[scenario.turns.length - 1].role).toBe("assistant");
    }
  });
});

describe("skill transcript rendering", () => {
  it("hides the system prompt and the skill traffic from the human", () => {
    for (const scenario of skillScenarios) {
      for (const turn of scenario.turns) {
        expect(isSkillTurnVisible(turn)).toBe(
          turn.role === "user" || turn.role === "assistant"
        );
      }
    }
  });

  it("attributes the request to the model and the document to the library", () => {
    const scenario = getSkillScenario("loads");
    const request = scenario.turns.find((t) => t.role === "skill-request")!;
    const document = scenario.turns.find((t) => t.role === "skill-document")!;
    expect(skillSenderLabel(request)).toBe("Model");
    expect(skillSenderKind(request)).toBe("model");
    expect(skillSenderLabel(document)).toBe("Skill library");
    expect(skillSenderKind(document)).toBe("tool");
  });
});

describe("getSkillScenario", () => {
  it("falls back to the first scenario for an unknown id", () => {
    expect(getSkillScenario("nope")).toBe(skillScenarios[0]);
  });
});
