import type { ExampleData } from "./types";
import { validateExample } from "./validate";

const layers: ExampleData["layers"] = [
  {
    id: "L0",
    label: "Start",
    description: "Each token is looked up in the model's table — its raw, dictionary-style meaning, before any other word has influenced it.",
    heads: [],
  },
  {
    id: "L1",
    label: "L1",
    description: "Layer 1 runs one attention head — it gives every token a copy of its previous token, which the feed-forward step then composes.",
    heads: [
      {
        id: "prev",
        label: "Previous-token",
        description: "Uses normal attention — but every token offers the same Key and the same Value. Position encoding gives a strong bias toward the token immediately before, so each word effectively pulls a copy of its predecessor.",
        kind: "positional",
      },
    ],
  },
  {
    id: "L2",
    label: "L2",
    description: "Layer 2 ties each word to the scene's location — several words pull from 'Mars' to learn where the action is happening.",
    heads: [
      {
        id: "location",
        label: "Place in the scene",
        description: "Each word that needs to be situated in the scene queries for a location and pulls from 'Mars'.",
        kind: "content",
      },
    ],
  },
  {
    id: "L3",
    label: "L3",
    description: "Layer 3 figures out what each word refers to — pronouns find their nouns.",
    heads: [
      {
        id: "refers",
        label: "Find what each word refers to",
        description: "Pronouns query for a matching noun and pull its meaning in.",
        kind: "content",
      },
    ],
  },
  {
    id: "L4",
    label: "L4",
    description: "Layer 4 composes the picture for the next word. 'Blue' (the prediction slot) pulls together its owner and the scene where it's being seen.",
    heads: [
      {
        id: "owner",
        label: "Find the owner",
        description: "Find the owner of the thing this adjective is modifying.",
        kind: "content",
      },
      {
        id: "seeing",
        label: "Find where this is seen",
        description: "Find the visual scene this thing appears in.",
        kind: "content",
      },
    ],
  },
  {
    id: "Predict",
    label: "Predict",
    description: "The prediction head reads 'blue's L4 output and produces a probability distribution over the next token.",
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

// Named indices for tokens referenced by non-positional head cards.
// Cross-checked against the tokens array below — if you reorder tokens, update these too.
const IDX_MARS = 1;
const IDX_ASTRONAUT = 4;
const IDX_SKY = 8;
const IDX_SAW = 10;
const IDX_HER = 11;

const tokens: ExampleData["tokens"] = [
  // 0: On
  {
    token: "On",
    clickable: true,
    reps: {
      L0: "a preposition meaning 'at the location of'",
      L1: "a preposition meaning 'at the location of'",
      L2: "a preposition meaning 'at the location of'",
      L3: "a preposition meaning 'at the location of'",
      L4: "a preposition meaning 'at the location of'",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "a preposition meaning 'at the location of'",
          positionalRule: "attend to the token at position N-1",
          pulls: [],
          contribution: "no previous token (this is the first word)",
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
      L1: "the planet Mars — the location someone or something is on, not necessarily a person",
      L2: "the planet Mars — the location someone or something is on, not necessarily a person",
      L3: "the planet Mars — the location someone or something is on, not necessarily a person",
      L4: "the planet Mars — the location someone or something is on, not necessarily a person",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "the fourth planet from the sun — a cold, reddish desert world",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 0, value: "a preposition meaning 'at the location of'", weight: 1.0 },
          ],
          contribution: "previous token is 'On'",
        },
      },
    },
  },
  // 2: ","  (punctuation — not clickable)
  {
    token: ",",
    clickable: false,
    reps: {
      L0: "a comma (pacing punctuation)",
      L1: "a comma (pacing punctuation)",
      L2: "a comma (pacing punctuation)",
      L3: "a comma (pacing punctuation)",
      L4: "a comma (pacing punctuation)",
    },
    headCards: {},
  },
  // 3: the
  {
    token: "the",
    clickable: true,
    reps: {
      L0: "a definite article following a comma",
      L1: "a definite article following a comma",
      L2: "a definite article following a comma",
      L3: "a definite article following a comma",
      L4: "a definite article following a comma",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "a definite article following a comma",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 2, value: "a comma (pacing)", weight: 1.0 },
          ],
          contribution: "previous token is ','",
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
      L2: "the astronaut, currently on Mars",
      L3: "the astronaut, currently on Mars",
      L4: "the astronaut, currently on Mars",
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
          contribution: "previous token is 'the'",
        },
      },
      L2: {
        location: {
          kind: "content",
          inputRep: "the astronaut — a specific human trained to travel in space",
          query: "a location",
          pulls: [
            {
              fromTokenIndex: IDX_MARS,
              key: "a location",
              value: "Mars (a non-Earth desert planet, where this scene is set)",
              weight: 1.0,
            },
          ],
          contribution: "binds the astronaut to being on Mars",
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
      L2: "a past act of visual attention, happening on Mars, performed by the astronaut",
      L3: "a past act of visual attention, happening on Mars, performed by the astronaut",
      L4: "a past act of visual attention, happening on Mars, performed by the astronaut",
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
          contribution: "previous token is 'astronaut'",
        },
      },
      L2: {
        location: {
          kind: "content",
          inputRep: "a past act of visual attention, performed by the astronaut",
          query: "a location",
          pulls: [
            {
              fromTokenIndex: IDX_MARS,
              key: "a location",
              value: "Mars (a non-Earth desert planet, where this scene is set)",
              weight: 1.0,
            },
          ],
          contribution: "binds the looking to happen on Mars",
        },
      },
    },
  },
  // 6: to
  {
    token: "to",
    clickable: true,
    reps: {
      L0: "a directional preposition attached to the act of looking",
      L1: "a directional preposition attached to the act of looking",
      L2: "a directional preposition attached to the act of looking",
      L3: "a directional preposition attached to the act of looking",
      L4: "a directional preposition attached to the act of looking",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "a directional preposition attached to the act of looking",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 5, value: "a verb of visual attention", weight: 1.0 },
          ],
          contribution: "previous token is 'looked'",
        },
      },
    },
  },
  // 7: the (second occurrence)
  {
    token: "the",
    clickable: true,
    reps: {
      L0: "a definite article following the preposition 'to'",
      L1: "a definite article following the preposition 'to'",
      L2: "a definite article following the preposition 'to'",
      L3: "a definite article following the preposition 'to'",
      L4: "a definite article following the preposition 'to'",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "a definite article following the preposition 'to'",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 6, value: "a directional preposition", weight: 1.0 },
          ],
          contribution: "previous token is 'to'",
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
      L2: "the Martian sky — the expanse above where things are seen, here on Mars",
      L3: "the Martian sky — the expanse above where things are seen, here on Mars",
      L4: "the Martian sky — the expanse above where things are seen, here on Mars",
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
          contribution: "previous token is 'the'",
        },
      },
      L2: {
        location: {
          kind: "content",
          inputRep: "the specific sky being referred to",
          query: "a location",
          pulls: [
            {
              fromTokenIndex: IDX_MARS,
              key: "a location",
              value: "Mars (a non-Earth desert planet, where this scene is set)",
              weight: 1.0,
            },
          ],
          contribution: "binds the sky to being above Mars",
        },
      },
    },
  },
  // 9: and
  {
    token: "and",
    clickable: true,
    reps: {
      L0: "a conjunction following the first clause (ending at 'sky')",
      L1: "a conjunction following the first clause (ending at 'sky')",
      L2: "a conjunction following the first clause (ending at 'sky')",
      L3: "a conjunction following the first clause (ending at 'sky')",
      L4: "a conjunction following the first clause (ending at 'sky')",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "a conjunction following the first clause (ending at 'sky')",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 8, value: "the sky (the first clause's object)", weight: 1.0 },
          ],
          contribution: "previous token is 'sky'",
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
      L2: "a past act of seeing, happening on Mars, starting a new conjoined action",
      L3: "a past act of seeing, happening on Mars, starting a new conjoined action",
      L4: "a past act of seeing, happening on Mars, starting a new conjoined action",
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
          contribution: "previous token is 'and'",
        },
      },
      L2: {
        location: {
          kind: "content",
          inputRep: "a past act of seeing, starting a new conjoined action",
          query: "a location",
          pulls: [
            {
              fromTokenIndex: IDX_MARS,
              key: "a location",
              value: "Mars (a non-Earth desert planet, where this scene is set)",
              weight: 1.0,
            },
          ],
          contribution: "binds the seeing to happen on Mars",
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
      L2: "a feminine possessive pronoun, appearing as the possessor of what was seen",
      L3: "her — the astronaut, who is on Mars",
      L4: "her — the astronaut, who is on Mars",
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
          contribution: "previous token is 'saw'",
        },
      },
      L3: {
        refers: {
          kind: "content",
          inputRep: "a feminine possessive pronoun, appearing as the possessor of what was seen",
          query: "a human person",
          pulls: [
            {
              fromTokenIndex: IDX_ASTRONAUT,
              key: "a human person",
              value: "the astronaut, who is on Mars",
              weight: 1.0,
            },
          ],
          contribution: "resolves 'her' to the astronaut on Mars",
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
      L3: "the color blue, modifying something that belongs to 'her'",
      L4: "a blue thing belonging to the astronaut on Mars, seen by her in the Martian sky — her home",
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
          contribution: "previous token is 'her'",
        },
      },
      L4: {
        owner: {
          kind: "content",
          inputRep: "the color blue, modifying something that belongs to 'her'",
          query: "the owner of this thing",
          pulls: [
            {
              fromTokenIndex: IDX_HER,
              key: "the owner of this thing",
              value: "the astronaut, who is on Mars",
              weight: 1.0,
            },
          ],
          contribution: "this blue thing belongs to the astronaut who is on Mars",
        },
        seeing: {
          kind: "content",
          inputRep: "the color blue, modifying something that belongs to 'her'",
          query: "the visual scene this thing appears in",
          pulls: [
            {
              fromTokenIndex: IDX_SKY,
              key: "the visual scene this thing appears in",
              value: "the Martian sky, where the seeing happens",
              weight: 0.5,
            },
            {
              fromTokenIndex: IDX_SAW,
              key: "the visual scene this thing appears in",
              value: "the act of seeing happening on Mars",
              weight: 0.5,
            },
          ],
          contribution: "this blue thing is seen in the sky on Mars",
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
