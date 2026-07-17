"use client";

import { AttentionValues, type Example } from "./AttentionValues";

/* ------------------------------------------------------------------ */
/*  The sink is just another token in the value grid: its value is      */
/*  "nothing" and it faintly matches everything with a small fixed      */
/*  score. A real match beats it; when nothing matches, it wins by      */
/*  default and the asker safely gathers nothing.                       */
/* ------------------------------------------------------------------ */

const SINK_EXAMPLES: Example[] = [
  {
    id: "nomatch",
    label: "Nothing matches",
    words: ["It", "was", "raining", "outside", ".", "sink"],
    asker: 0,
    query: "the thing being referred to",
    scores: [0, 1, 1, 1, 1, 3],
    keys: { 5: "a weak match to anything" },
    values: { 5: "nothing" },
    result: "nothing",
  },
  {
    id: "match",
    label: "Something matches",
    words: ["I", "dropped", "the", "glass", "and", "it", "broke", ".", "sink"],
    asker: 5,
    query: "the thing being referred to",
    scores: [1, 2, 1, 8, 1, 0, 2, 1, 3],
    keys: { 3: "a physical object", 8: "a weak match to anything" },
    values: { 3: "the glass", 8: "nothing" },
    result: "the glass",
  },
];

export function AttentionSink() {
  return (
    <AttentionValues
      examples={SINK_EXAMPLES}
      title="The Attention Sink"
      description="The sink is an extra token worth nothing that faintly matches everything. A real match beats it, but when nothing matches it wins and the answer comes out as nothing."
    />
  );
}
