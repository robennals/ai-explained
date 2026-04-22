import type { ExampleData } from "./types";
import { validateExample } from "./validate";

const layers: ExampleData["layers"] = [
  {
    id: "L0",
    label: "Embed",
    description: "Each token is looked up in the model's embedding table — its raw dictionary meaning, before any other word has influenced it.",
    heads: [],
  },
  {
    id: "L1",
    label: "L1",
    description: "Layer 1 runs one attention head — a positional head that gives every token a copy of its predecessor, which the feed-forward step then composes.",
    heads: [
      {
        id: "prev",
        label: "Previous-token",
        description: "Rule-based: every token attends to the one immediately before it. No content-based matching.",
        kind: "positional",
      },
    ],
  },
  {
    id: "L2",
    label: "L2",
    description: "Layer 2 runs one attention head — pronouns find their antecedents via a content-based match.",
    heads: [
      {
        id: "pronoun",
        label: "Pronoun → Antecedent",
        description: "Each pronoun's Q seeks a compatible preceding noun. Only 'her' does work here.",
        kind: "content",
      },
    ],
  },
  {
    id: "L3",
    label: "L3",
    description: "Layer 3 runs three narrow heads that together pull the features 'blue' needs to predict the next word.",
    heads: [
      {
        id: "possessor",
        label: "Adj → Possessor",
        description: "'blue' attends to the possessor whose noun it modifies.",
        kind: "content",
      },
      {
        id: "location",
        label: "Adj → Location",
        description: "'blue' attends to the scene's location.",
        kind: "content",
      },
      {
        id: "direction",
        label: "Adj → Direction",
        description: "'blue' attends to the direction in which the observation is happening.",
        kind: "content",
      },
    ],
  },
  {
    id: "Predict",
    label: "Predict",
    description: "The prediction head reads 'blue's L3 output rep and produces a probability distribution over the next token.",
    heads: [],
  },
];

const predictions: ExampleData["predictions"] = [
  { token: "planet", probability: 0.62 },
  { token: "home", probability: 0.14 },
  { token: "Earth", probability: 0.11 },
  { token: "world", probability: 0.06 },
  { token: "marble", probability: 0.04 },
  { token: "dot", probability: 0.03 },
];

/*
 * Tokens in the passage. Indices used by pulls below:
 *  0: "On"        1: "Mars"      2: ","         3: "the"
 *  4: "astronaut" 5: "looked"    6: "to"        7: "the"
 *  8: "sky"       9: "and"      10: "saw"      11: "her"
 * 12: "blue"
 */

const tokens: ExampleData["tokens"] = [
  // 0: On
  {
    token: "On",
    clickable: true,
    reps: {
      L0: "a preposition meaning 'at the location of'",
      L1: "a preposition indicating location — first word of the sentence, no predecessor to pull",
      L2: "a preposition indicating location — first word of the sentence, no predecessor to pull",
      L3: "a preposition indicating location — first word of the sentence, no predecessor to pull",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "a preposition meaning 'at the location of'",
          positionalRule: "attend to the token at position N-1",
          pulls: [],
          contribution: "nothing (no predecessor)",
        },
      },
    },
  },
  // 1: Mars
  {
    token: "Mars",
    clickable: true,
    reps: {
      L0: "the fourth planet from the sun — a cold, reddish desert world",
      L1: "the planet Mars, serving as the location someone is on",
      L2: "the planet Mars, serving as the location someone is on",
      L3: "the planet Mars, serving as the location someone is on",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "the fourth planet from the sun — a cold, reddish desert world",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            {
              fromTokenIndex: 0,
              value: "a preposition indicating location-of-being",
              weight: 1.0,
            },
          ],
          contribution: "marks Mars as the location in an 'on'-phrase",
        },
      },
    },
  },
  // 2: ","  (punctuation — not clickable, reps exist but are trivial)
  {
    token: ",",
    clickable: false,
    reps: {
      L0: "a comma (pacing punctuation)",
      L1: "a comma (pacing punctuation)",
      L2: "a comma (pacing punctuation)",
      L3: "a comma (pacing punctuation)",
    },
    headCards: {},
  },
  // 3: the
  {
    token: "the",
    clickable: true,
    reps: {
      L0: "a definite article",
      L1: "a definite article following a comma",
      L2: "a definite article following a comma",
      L3: "a definite article following a comma",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "a definite article",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 2, value: "a comma (pacing)", weight: 1.0 },
          ],
          contribution: "nothing meaningful — prev is punctuation",
        },
      },
    },
  },
  // 4: astronaut
  {
    token: "astronaut",
    clickable: true,
    reps: {
      L0: "a human trained to travel in space",
      L1: "the astronaut — a specific human trained to travel in space",
      L2: "the astronaut — a specific human trained to travel in space",
      L3: "the astronaut — a specific human trained to travel in space",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "a human trained to travel in space",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 3, value: "a definite article", weight: 1.0 },
          ],
          contribution: "marks 'astronaut' as a specific individual",
        },
      },
    },
  },
  // 5: looked
  {
    token: "looked",
    clickable: true,
    reps: {
      L0: "past tense of 'look' — turned one's visual attention somewhere",
      L1: "a past act of visual attention, performed by the astronaut",
      L2: "a past act of visual attention, performed by the astronaut",
      L3: "a past act of visual attention, performed by the astronaut",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "past tense of 'look' — turned one's visual attention somewhere",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 4, value: "the astronaut (a human performing an action)", weight: 1.0 },
          ],
          contribution: "binds the astronaut as the subject of the looking",
        },
      },
    },
  },
  // 6: to
  {
    token: "to",
    clickable: true,
    reps: {
      L0: "a directional preposition",
      L1: "a directional preposition attached to the act of looking",
      L2: "a directional preposition attached to the act of looking",
      L3: "a directional preposition attached to the act of looking",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "a directional preposition",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 5, value: "a verb of visual attention", weight: 1.0 },
          ],
          contribution: "marks 'to' as the directional preposition of 'looked'",
        },
      },
    },
  },
  // 7: the (second occurrence)
  {
    token: "the",
    clickable: true,
    reps: {
      L0: "a definite article",
      L1: "a definite article following the preposition 'to'",
      L2: "a definite article following the preposition 'to'",
      L3: "a definite article following the preposition 'to'",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "a definite article",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 6, value: "a directional preposition", weight: 1.0 },
          ],
          contribution: "marks the following noun as the definite object of 'to'",
        },
      },
    },
  },
  // 8: sky
  {
    token: "sky",
    clickable: true,
    reps: {
      L0: "the expanse above, where clouds and celestial objects appear",
      L1: "the specific sky being referred to",
      L2: "the specific sky being referred to",
      L3: "the specific sky being referred to",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "the expanse above, where clouds and celestial objects appear",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 7, value: "a definite article", weight: 1.0 },
          ],
          contribution: "marks 'sky' as a specific definite referent",
        },
      },
    },
  },
  // 9: and
  {
    token: "and",
    clickable: true,
    reps: {
      L0: "a conjunction joining two clauses",
      L1: "a conjunction following the first clause (ending at 'sky')",
      L2: "a conjunction following the first clause (ending at 'sky')",
      L3: "a conjunction following the first clause (ending at 'sky')",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "a conjunction joining two clauses",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 8, value: "the sky (the first clause's object)", weight: 1.0 },
          ],
          contribution: "marks this conjunction as joining after 'sky'",
        },
      },
    },
  },
  // 10: saw
  {
    token: "saw",
    clickable: true,
    reps: {
      L0: "past tense of 'see' — observed with the eyes",
      L1: "a past act of seeing, starting a new conjoined action",
      L2: "a past act of seeing, starting a new conjoined action",
      L3: "a past act of seeing, starting a new conjoined action",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "past tense of 'see' — observed with the eyes",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 9, value: "a conjunction", weight: 1.0 },
          ],
          contribution: "marks 'saw' as starting the second conjoined clause",
        },
      },
    },
  },
  // 11: her
  {
    token: "her",
    clickable: true,
    reps: {
      L0: "a feminine possessive pronoun",
      L1: "a feminine possessive pronoun, appearing as the possessor of what was seen",
      L2: "her — now known to be the astronaut",
      L3: "her — now known to be the astronaut",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "a feminine possessive pronoun",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 10, value: "a verb of perception — its object follows", weight: 1.0 },
          ],
          contribution: "marks 'her' as the possessor of what was seen",
        },
      },
      L2: {
        pronoun: {
          kind: "content",
          inputRep: "a feminine possessive pronoun, appearing as the possessor of what was seen",
          query: "a human noun",
          pulls: [
            {
              fromTokenIndex: 4,
              key: "a human noun",
              value: "the astronaut",
              weight: 1.0,
            },
          ],
          contribution: "resolves 'her' to the astronaut",
        },
      },
    },
  },
  // 12: blue
  {
    token: "blue",
    clickable: true,
    reps: {
      L0: "the color blue",
      L1: "the color blue, modifying something that belongs to 'her'",
      L2: "the color blue, modifying something that belongs to 'her'",
      L3: "a blue thing, belonging to the astronaut, seen in the sky of Mars — her home planet",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "the color blue",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 11, value: "a feminine possessive pronoun", weight: 1.0 },
          ],
          contribution: "marks blue as modifying something belonging to 'her'",
        },
      },
      L3: {
        possessor: {
          kind: "content",
          inputRep: "the color blue, modifying something that belongs to 'her'",
          query: "a possessor",
          pulls: [
            {
              fromTokenIndex: 11,
              key: "a possessor",
              value: "the astronaut",
              weight: 1.0,
            },
          ],
          contribution: "this blue thing belongs to the astronaut",
        },
        location: {
          kind: "content",
          inputRep: "the color blue, modifying something that belongs to 'her'",
          query: "a location",
          pulls: [
            {
              fromTokenIndex: 1,
              key: "a location",
              value: "the Martian setting — not Earth",
              weight: 1.0,
            },
          ],
          contribution: "this blue thing is set in a Martian, non-Earth context",
        },
        direction: {
          kind: "content",
          inputRep: "the color blue, modifying something that belongs to 'her'",
          query: "a direction of observation",
          pulls: [
            {
              fromTokenIndex: 8,
              key: "a direction of observation",
              value: "seen in the sky above",
              weight: 1.0,
            },
          ],
          contribution: "this blue thing is seen up in the sky",
        },
      },
    },
  },
];

export const astronautExample: ExampleData = {
  name: "astronaut",
  sentence: "On Mars, the astronaut looked to the sky and saw her blue ___",
  tokens,
  layers,
  predictions,
};

// Fail fast if a later edit breaks the data.
validateExample(astronautExample);
