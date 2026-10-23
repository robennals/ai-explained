/**
 * Groups the main chapters into "parts" for the home page's learning path.
 * Each part names what the reader will understand by the end of it.
 */
export interface LearningPart {
  title: string;
  promise: string;
  /** Hex colour used for this part's illustrations and accents. */
  accent: string;
  /** A darker shade of `accent`, readable as text on a white background. */
  ink: string;
  slugs: string[];
}

export const learningPath: LearningPart[] = [
  {
    title: "The building blocks",
    promise: "How a machine made of numbers can learn to do things nobody told it how to do.",
    accent: "#3b82f6",
    ink: "#1d4ed8",
    slugs: ["computation", "optimization", "neurons"],
  },
  {
    title: "Meaning as numbers",
    promise: "How words become something a computer can reason about, and why predicting the next word requires understanding.",
    accent: "#8b5cf6",
    ink: "#6d28d9",
    slugs: ["vectors", "embeddings", "next-word-prediction"],
  },
  {
    title: "The transformer",
    promise: "The architecture behind every modern chatbot, built from the pieces you already have.",
    accent: "#f59e0b",
    ink: "#b45309",
    slugs: ["attention", "positions", "transformers"],
  },
  {
    title: "From model to assistant",
    promise: "How a document-continuing machine becomes something that chats, reasons, and gets things done.",
    accent: "#10b981",
    ink: "#047857",
    slugs: ["post-training", "conversations", "reasoning", "agents"],
  },
  {
    title: "AI in the world",
    promise: "What AI is doing to the society around it, and the realistic ways it could go badly wrong.",
    accent: "#f43f5e",
    ink: "#be123c",
    slugs: ["society", "risk"],
  },
];

/** The part containing `slug`, with its 1-based number, if it's in one. */
export function getPartOf(slug: string): { part: LearningPart; number: number } | undefined {
  const i = learningPath.findIndex((p) => p.slugs.includes(slug));
  return i === -1 ? undefined : { part: learningPath[i], number: i + 1 };
}
