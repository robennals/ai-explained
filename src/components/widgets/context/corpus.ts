export type Doc = { id: number; text: string; tags: string[] };

// A small, hand-authored stand-in for a document database. Each doc's
// `tags` are author-assigned meaning labels — a toy replacement for an
// embedding vector, not a real one.
export const CORPUS: Doc[] = [
  {
    id: 1,
    text: "The pup wouldn't stop barking through the night.",
    tags: ["dog", "noise"],
  },
  {
    id: 2,
    text: "Our cat knocked a glass off the counter again.",
    tags: ["cat", "mess"],
  },
  {
    id: 3,
    text: "Function getUserToken() reads the session cookie and returns it.",
    tags: ["code", "auth"],
  },
  {
    id: 4,
    text: "The invoice for order 4471 is thirty days overdue.",
    tags: ["billing", "overdue"],
  },
  {
    id: 5,
    text: "Rain is expected across the valley through the weekend.",
    tags: ["weather"],
  },
  {
    id: 6,
    text: "The garden needs watering twice a day in this heat.",
    tags: ["garden", "heat"],
  },
  {
    id: 7,
    text: "Ticket 4471 was closed after the customer confirmed the fix.",
    tags: ["support", "resolved"],
  },
  {
    id: 8,
    text: "The neighbor's dog barks every time the mail carrier arrives.",
    tags: ["dog", "noise"],
  },
];

// Two contrasting example queries: one shares meaning but no words with its
// best doc, one shares an exact word/identifier with its best doc.
export const EXAMPLE_QUERIES: { text: string; tags: string[] }[] = [
  {
    text: "who was making all that noise?",
    tags: ["dog", "noise"],
  },
  {
    text: "what happened with ticket 4471?",
    tags: ["support"],
  },
];
