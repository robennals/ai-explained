/**
 * Hand-authored walkthroughs of the main post-training approaches.
 *
 * Each approach is shown as the scene it actually is: a written answer, a
 * rater's pick, a judge reading a rule, a thumbs-up, a test run. Every
 * approach uses the same prompt so they can be compared, and nothing here
 * comes from a real model or a real rater.
 */

export type PanelKind =
  | "prompt"
  | "response"
  | "target"
  | "human"
  | "judge"
  | "checker";

export interface Panel {
  kind: PanelKind;
  /** Heading above the panel. */
  label: string;
  text: string;
  /** Score attached to this panel, when the approach produces one. */
  score?: number;
}

export interface ProbabilityShift {
  label: string;
  before: number;
  after: number;
}

export interface Approach {
  id: string;
  /** Tab label. */
  label: string;
  /** One sentence on how this approach produces a signal. */
  how: string;
  panels: Panel[];
  /** What training does with what the panels produced. */
  outcome: string;
  /** The honest limitation. */
  blindSpot: string;
  /** Real systems that use it. */
  usedBy: string;
  /** Shown only where a preferred/rejected pair makes the shift concrete. */
  shift?: ProbabilityShift[];
}

export const sharedPrompt =
  "A shirt costs $40 after a 20% discount. What was the original price?";

const correctAnswer =
  "$50. The $40 is 80% of the original price, so 40 ÷ 0.8 = 50.";

const confidentlyWrong =
  "$48. Add the 20% discount back on: 40 + (20% of 40) = 48.";

const flatteringWrong =
  "Great question, you're thinking about this exactly the right way! The original price was $48.";

export const approaches: Approach[] = [
  {
    id: "ideal",
    label: "Write the ideal answer",
    how: "Pay people to write the response you wanted, and train the model to produce it.",
    panels: [
      { kind: "prompt", label: "Prompt", text: sharedPrompt },
      {
        kind: "target",
        label: "Response written by a human, by hand",
        text: correctAnswer,
      },
    ],
    outcome:
      "No score is involved anywhere. The pair goes into a small curated pile, and the model keeps training on the same next-token objective it was pre-trained with. The written text is the target.",
    blindSpot:
      "Someone has to write every one of these, tens of thousands of times, and a written answer says nothing about the responses nobody wrote.",
    usedBy:
      "Supervised fine-tuning. The first stage of InstructGPT, and how Google's FLAN work taught instruction-following.",
  },
  {
    id: "comparison",
    label: "Let a rater pick a winner",
    how: "Show a rater two responses and ask which is better. Their picks train a reward model that can then score responses nobody ever looked at.",
    panels: [
      { kind: "prompt", label: "Prompt", text: sharedPrompt },
      { kind: "response", label: "Response A", text: confidentlyWrong },
      { kind: "response", label: "Response B", text: correctAnswer },
      {
        kind: "human",
        label: "The rater's whole job",
        text: "B is better.",
      },
      {
        kind: "judge",
        label: "After thousands of picks, the reward model scores a response no rater saw",
        text: "Original price: $50, because 40 is 80% of it and 40 / 0.8 = 50.",
        score: 0.81,
      },
    ],
    outcome:
      "The model emits a probability for every possible response, so one training step can raise the preferred response and lower the rejected one at the same time.",
    blindSpot:
      "Raters work fast and are not always checking the arithmetic. A confident, friendly wrong answer wins a surprising number of these comparisons.",
    usedBy:
      "RLHF, as used for InstructGPT and Llama 2. Training straight on the preferred and rejected pair, with no reward model in between, is direct preference optimisation.",
    shift: [
      { label: "Response B, preferred", before: 0.2, after: 0.63 },
      { label: "Response A, rejected", before: 0.25, after: 0.08 },
    ],
  },
  {
    id: "constitution",
    label: "A model judges against written rules",
    how: "Write the principles down in plain English and have a second copy of the model score responses against them.",
    panels: [
      { kind: "prompt", label: "Prompt", text: sharedPrompt },
      { kind: "response", label: "Response", text: flatteringWrong },
      {
        kind: "human",
        label: "One principle from the constitution",
        text: "Prefer the response that does not flatter the user, and that shows its working so the reader can check it.",
      },
      {
        kind: "judge",
        label: "A second copy of the model, reading that principle",
        text: "The response opens by praising the question, which the principle rules out. It shows no working, so nothing can be checked. It is also wrong: $40 is 80% of the original, so the original is 40 ÷ 0.8 = 50, not 48.",
        score: 0.15,
      },
    ],
    outcome:
      "The score is used exactly as a human rating would be. When the rules need to change, someone edits the document. Re-labelling a human dataset would take months.",
    blindSpot:
      "The judge is a model. It catches the flattery every time, because that is visible in the text. On a harder problem it would be no better at the arithmetic than the model it is grading.",
    usedBy: "Constitutional AI and RLAIF, published by Anthropic.",
  },
  {
    id: "usage",
    label: "Watch what real users do",
    how: "Take the signal from the product: thumbs up and down, which response people picked, what they said next.",
    panels: [
      { kind: "response", label: "One conversation", text: flatteringWrong },
      {
        kind: "human",
        label: "What the user did",
        text: "👍  “Thanks, that's what I got too!”",
        score: 0.9,
      },
      { kind: "response", label: "Another conversation", text: correctAnswer },
      {
        kind: "human",
        label: "What the user did",
        text: "👎  “that's not the answer in the back of the book”",
        score: 0.2,
      },
    ],
    outcome:
      "Both signals point the same way, and it is the wrong way. The flattering wrong answer gets more likely, the correct one gets less likely.",
    blindSpot:
      "This measures whether the user was pleased, not whether the answer was right. Optimise hard on it and the model learns to flatter, a failure mode called sycophancy.",
    usedBy: "Preference and feedback data collected inside chat products.",
  },
  {
    id: "checker",
    label: "Just check the answer",
    how: "For maths, code and puzzles, run the check. Nobody has to judge anything.",
    panels: [
      { kind: "prompt", label: "Prompt", text: sharedPrompt },
      { kind: "response", label: "Response", text: confidentlyWrong },
      {
        kind: "checker",
        label: "Automatic check",
        text: "Extracted answer: 48. Expected: 50. Wrong.",
        score: 0,
      },
      { kind: "response", label: "Response", text: correctAnswer },
      {
        kind: "checker",
        label: "Automatic check",
        text: "Extracted answer: 50. Expected: 50. Correct.",
        score: 1,
      },
    ],
    outcome:
      "The score costs nothing, cannot be charmed, and can be produced millions of times overnight. That abundance is what made reasoning models possible.",
    blindSpot:
      "It only works where an answer can be checked. Most of what people ask a chat model has no such check.",
    usedBy:
      "Reinforcement learning from verifiable rewards, published in detail for DeepSeek-R1.",
  },
];

export function getApproach(id: string): Approach {
  return approaches.find((a) => a.id === id) ?? approaches[0];
}
