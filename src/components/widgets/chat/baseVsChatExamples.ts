/**
 * Hand-authored base-model / chat-model completions.
 *
 * Nothing here comes from a real model. Each base completion is written to be
 * a plausible continuation of a document that could contain the prompt, which
 * is the point the widget is making: the base model is doing its job well.
 */

export interface CompletionExample {
  id: string;
  /** Short label for the prompt picker. */
  label: string;
  prompt: string;
  /** What a base model does: continue the document the prompt came from. */
  base: string;
  /** Where on the internet that continuation came from. */
  baseNote: string;
  /** What a post-trained chat model does: answer. */
  chat: string;
}

export const completionExamples: CompletionExample[] = [
  {
    id: "question",
    label: "A question",
    prompt: "How do I stop my sourdough starter from going mouldy?",
    base: `How often should I feed my starter?
Why does my starter smell like acetone?
Can I keep a starter in the fridge?
What flour is best for a new starter?

Browse all 47 questions in our Baking forum →`,
    baseNote:
      "A question like this appears most often in a list of other questions, on a forum index or an FAQ page.",
    chat: `Mould usually means something other than your starter is growing in the jar. A few things help:

1. Scrape the sides down after each feed. Dried streaks of flour above the surface are where mould normally takes hold.
2. Feed it more often, or with more flour and water. A hungry starter goes acidic and then weak, and a weak starter loses to mould.
3. Use a clean jar every few feeds rather than topping up the same one for weeks.

If there is fuzzy growth of any colour on the surface, throw the whole jar out. Stirring it in does not work.`,
  },
  {
    id: "request",
    label: "A request",
    prompt: "Write a short poem about the sea.",
    base: `Write a short poem about a city at night.
Write a short poem in the voice of an animal.
Write a short poem that does not rhyme.

These prompts work well for years 5 and 6. Printable version available to subscribers.`,
    baseNote:
      "An instruction phrased like this usually shows up in a worksheet of writing prompts, not in a conversation.",
    chat: `The sea keeps nothing that it takes,
and gives back only what it breaks:
a plank, a bottle, half a shoe,
some brown glass worn to blue.`,
  },
  {
    id: "maths",
    label: "A maths problem",
    prompt: "A shirt costs $40 after a 20% discount. What was the original price?",
    base: `A jacket costs $63 after a 10% discount. What was the original price?
A book costs $17 after a 15% discount. What was the original price?

Answers on page 112. Show your working for full marks.`,
    baseNote:
      "Word problems come in sets, and the answers live at the back of the book.",
    chat: `$50.

The $40 is 80% of the original price, so the original is 40 ÷ 0.8 = 50. Checking: 20% of 50 is 10, and 50 − 10 = 40.`,
  },
  {
    id: "help",
    label: "Asking for help",
    prompt: "My laptop won't turn on. Can you help?",
    base: `Sign in to your account to open a support ticket, or call us on 0800 555 0199 (Mon-Fri, 9am-5pm).

Was this article helpful? Yes / No

Related: Extend your warranty from £4.99/month.`,
    baseNote:
      "“Can you help?” is a phrase from support pages, and support pages continue with contact details.",
    chat: `Let's narrow it down. Does anything at all happen when you press the power button, any light, fan noise, or a beep?

If nothing happens: hold the power button down for 30 seconds with the charger unplugged, then plug the charger in and try again. If you see a charging light but no screen, the machine may be running with a dead display, which is a different problem.

Tell me which of those you get and we can go from there.`,
  },
];

export function getExample(id: string): CompletionExample {
  return completionExamples.find((e) => e.id === id) ?? completionExamples[0];
}
