import type { Doc } from "./corpus";

const words = (s: string) => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];

export function keywordScore(query: string, doc: Doc): number {
  const q = new Set(words(query));
  return words(doc.text).filter((w) => q.has(w)).length;
}

export function semanticScore(query: { tags: string[] }, doc: Doc): number {
  const q = new Set(query.tags);
  return doc.tags.filter((t) => q.has(t)).length;
}

export function rank(docs: Doc[], score: (d: Doc) => number): { doc: Doc; score: number }[] {
  return docs
    .map((doc) => ({ doc, score: score(doc) }))
    .sort((a, b) => b.score - a.score || a.doc.id - b.doc.id);
}
