/**
 * Hand-authored prompt and completion pairs.
 *
 * Most of them are not questions. A prompt is any piece of text at all, and
 * the completion is whatever plausibly comes next. The question at the end is
 * there to make the point that asking something is not a special mode: it is
 * one more piece of text to carry on from.
 */

export interface PromptExample {
  id: string;
  /** What kind of text this is, so the variety is visible at a glance. */
  kind: string;
  prompt: string;
  completion: string;
}

export const promptExamples: PromptExample[] = [
  {
    id: "fact",
    kind: "A sentence stopping mid-way",
    prompt: "The capital of France is",
    completion:
      " Paris, which sits on the River Seine in the north of the country.",
  },
  {
    id: "recipe",
    kind: "A list",
    prompt: "Ingredients: 200g plain flour, 2 eggs,",
    completion: " 300ml milk, a pinch of salt, and butter for the pan.",
  },
  {
    id: "code",
    kind: "Some code",
    prompt: "def add(a, b):",
    completion: "\n    return a + b",
  },
  {
    id: "letter",
    kind: "A letter",
    prompt:
      "Dear Ms Whitfield,\n\nThank you for your letter of 14 March. I am writing to",
    completion:
      " confirm that the work will be finished by the end of the month.",
  },
  {
    id: "story",
    kind: "A story",
    prompt: "In a village at the foot of the mountain there lived a girl who",
    completion: " was afraid of nothing at all, which worried her mother.",
  },
  {
    id: "question",
    kind: "A question",
    prompt: "How do I stop my sourdough starter from going mouldy?",
    completion:
      " Keep the jar clean, scrape the sides down after each feed, and throw the whole lot out if anything fuzzy appears.",
  },
];
