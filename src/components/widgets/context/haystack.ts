export type Token = { id: number; text: string };

/**
 * A tiny toy "document" for the sparse-indexer widget: a couple of short,
 * readable scenes buried in some filler chatter. None of this is generated
 * by a model — it's hand-authored so a reader can eyeball which words
 * matter for each query and check the indexer's picks against their own.
 */

const words: string[] = [
  // Scene 1: the dog (ids 0-13)
  "Rex", "the", "dog", "is", "a", "brown", "beagle", "who", "loves",
  "chasing", "tennis", "balls", "in", "the",
  // filler between scenes
  "park", "on", "sunny", "afternoons", "while", "birds", "sing",
  // Scene 2: the recipe (ids 22-31)
  "Add", "two", "cups", "of", "flour", "and", "one", "egg", "then", "stir",
  // more filler
  "gently", "until", "the", "batter", "looks", "smooth", "and", "pale",
  // Scene 3: the phone number (ids 40-46)
  "Call", "Maria", "at", "555", "0142", "before", "noon",
  // closing filler
  "and", "leave", "a", "short", "message", "if", "nobody", "answers",
];

export const HAYSTACK: Token[] = words.map((text, id) => ({ id, text }));

export const QUERIES: { id: string; label: string; relevant: number[] }[] = [
  {
    id: "dog",
    label: "Who is the dog, and what does he like?",
    relevant: [0, 2, 5, 6, 8, 10, 11],
  },
  {
    id: "recipe",
    label: "What goes into the batter?",
    relevant: [22, 23, 25, 27, 28],
  },
  {
    id: "phone",
    label: "What's the phone number, and who is it for?",
    relevant: [40, 42, 43],
  },
];
