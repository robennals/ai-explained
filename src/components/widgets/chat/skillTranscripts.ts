/**
 * Hand-authored skill loading.
 *
 * A skill is a tool whose result is a page of instructions, so these are
 * ordinary transcripts: the available skills arrive as one line each in the
 * system prompt, and the model asks for the full document only when one looks
 * relevant. Nothing here comes from a real model.
 */

export type SkillTurnRole =
  | "system"
  | "user"
  | "assistant"
  | "skill-request"
  | "skill-document";

export interface SkillTurn {
  role: SkillTurnRole;
  text: string;
}

export interface SkillScenario {
  id: string;
  /** Tab label. */
  label: string;
  turns: SkillTurn[];
  /** Smaller text at the bottom. */
  takeaway: string;
}

const availableSkills: SkillTurn = {
  role: "system",
  text: `You have these skills available. Load one with load_skill(name).

  chart-style      how charts should look in our documents
  expenses         filing an expense claim
  contract-review  clauses to check before signing anything
  house-voice      how we write, for anything customer-facing`,
};

export const skillScenarios: SkillScenario[] = [
  {
    id: "loads",
    label: "Loading a skill",
    turns: [
      availableSkills,
      {
        role: "user",
        text: "Turn these quarterly numbers into a chart for the board deck.",
      },
      { role: "skill-request", text: 'load_skill("chart-style")' },
      {
        role: "skill-document",
        text: `Chart style

Use the house palette: navy for the current year, grey for earlier years.
No gridlines. Label the last data point directly instead of adding a legend.
Axis in thousands, no decimal places.
The title states the finding, not the metric: "Revenue up 12% on last year",
not "Quarterly revenue".`,
      },
      {
        role: "assistant",
        text: "Here it is in house style: navy for this year against grey for last, no legend, and the final point labelled directly. I've titled it \"Revenue up 12% on last year\".",
      },
    ],
    takeaway:
      "The model was never trained on any of that. It saw four one-line descriptions, decided one applied, and asked for it. What came back was instructions rather than a search result, and that is the only thing that makes a skill different from any other tool.",
  },
  {
    id: "none",
    label: "When none apply",
    turns: [
      availableSkills,
      { role: "user", text: "What time is it in Tokyo?" },
      {
        role: "assistant",
        text: "Tokyo is 9 hours ahead of UTC, and doesn't use daylight saving, so it's currently early evening there.",
      },
    ],
    takeaway:
      "Same four descriptions, and the model asked for none of them. Deciding that is the same next-word prediction as everything else, which is why the one-line description has to say when the skill applies rather than just what it is.",
  },
];

export function getSkillScenario(id: string): SkillScenario {
  return skillScenarios.find((s) => s.id === id) ?? skillScenarios[0];
}

export function skillSenderLabel(turn: SkillTurn): string {
  switch (turn.role) {
    case "system":
      return "System prompt";
    case "user":
      return "Human";
    case "assistant":
    case "skill-request":
      return "Model";
    case "skill-document":
      return "Skill library";
  }
}

export function skillSenderKind(
  turn: SkillTurn
): "human" | "model" | "tool" | "system" {
  switch (turn.role) {
    case "system":
      return "system";
    case "user":
      return "human";
    case "skill-document":
      return "tool";
    default:
      return "model";
  }
}

/** Only the human's own messages and the model's replies reach the chat window. */
export function isSkillTurnVisible(turn: SkillTurn): boolean {
  return turn.role === "user" || turn.role === "assistant";
}
