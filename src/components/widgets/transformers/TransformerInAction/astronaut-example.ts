import type { ExampleData } from "./types";
import { validateExample } from "./validate";

const layers: ExampleData["layers"] = [
  {
    id: "L0",
    label: "Start",
    description: "Each token shows just its dictionary meaning — what the model knows before any word has talked to any other. Click any word to see its raw embedding.",
    heads: [],
  },
  {
    id: "L1",
    label: "Previous-token",
    description: "Every word pulls a copy of the word immediately before it. Click 'Mars' to see how it picks up that 'On' came before — the seed for later realising it's a location.",
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
    label: "Place in the scene",
    description: "Several words query for a location and pull from 'Mars'. Click 'astronaut', 'looked', 'sky', or 'saw' — each one's representation now includes 'on Mars' alongside everything it already knew.",
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
    label: "Resolve pronouns",
    description: "Every pronoun in the sentence attends to its noun. Click 'her' to see it resolve to the astronaut — inheriting all the Mars context the astronaut accumulated at the previous layer.",
    heads: [
      {
        id: "refers",
        label: "Resolve pronouns",
        description: "Rule: a pronoun attends to the nearest preceding compatible noun (matching person/gender/number). In this sentence, only 'her' matches the rule.",
        kind: "content",
      },
    ],
  },
  {
    id: "L4",
    label: "Previous-token",
    description: "Same head as Layer 1 — every token pulls a copy of its previous token — but now the previous tokens have been enriched by the intervening layers. 'Blue' pulls 'her' again and this time gets her's resolved meaning ('the astronaut on Mars'). 'To' pulls 'looked' again and gets its Mars-enriched rep, and so on.",
    heads: [
      {
        id: "prev",
        label: "Previous-token",
        description: "Uses normal attention — every token offers the same Key and the same Value; position encoding biases strongly toward the token immediately before. The same head from Layer 1, re-applied over the now-richer representations.",
        kind: "positional",
      },
    ],
  },
  {
    id: "L5",
    label: "Find what verb acts on this",
    description: "Every word inside a verb's object-phrase attends to that verb. 'Sky' (object of 'looked to') pulls 'looked'; 'her' and 'blue' (inside 'saw's object phrase) pull 'saw'.",
    heads: [
      {
        id: "verb-of-object",
        label: "Find what verb acts on this",
        description: "Rule: a word within a verb's object-phrase attends to the verb. Click 'blue', 'her', or 'sky' to see the binding.",
        kind: "content",
      },
    ],
  },
  {
    id: "L6",
    label: "Find where this is visible",
    description: "An adjective modifying the object of a seeing-verb attends to the direction of the seeing. Only 'blue' matches. It now pulls the Martian sky into its representation — enough context to predict 'planet'.",
    heads: [
      {
        id: "visible-direction",
        label: "Find where this is visible",
        description: "Rule: an adjective modifying the object of a visual-observation verb attends to the direction of the observation. Only 'blue' matches in this sentence.",
        kind: "content",
      },
    ],
  },
  {
    id: "Predict",
    label: "Predict",
    description: "The model reads 'blue's accumulated representation and ranks possible next words. The top candidate is 'planet' because everything blue now carries — Earth-human, on Mars, looking at the sky — fingerprints exactly that word.",
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
const IDX_LOOKED = 5;
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
      L5: "a preposition meaning 'at the location of'",
      L6: "a preposition meaning 'at the location of'",
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
      L4: {
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
      L0: "the fourth planet from the sun — a cold, reddish desert world; another planet in Earth's solar system",
      L1: "the planet Mars — the fourth planet from the sun, a cold reddish desert world, another planet in Earth's solar system; here, the location someone or something is on",
      L2: "the planet Mars — the fourth planet from the sun, a cold reddish desert world, another planet in Earth's solar system; here, the location someone or something is on",
      L3: "the planet Mars — the fourth planet from the sun, a cold reddish desert world, another planet in Earth's solar system; here, the location someone or something is on",
      L4: "the planet Mars — the fourth planet from the sun, a cold reddish desert world, another planet in Earth's solar system; here, the location someone or something is on",
      L5: "the planet Mars — the fourth planet from the sun, a cold reddish desert world, another planet in Earth's solar system; here, the location someone or something is on",
      L6: "the planet Mars — the fourth planet from the sun, a cold reddish desert world, another planet in Earth's solar system; here, the location someone or something is on",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "the fourth planet from the sun — a cold, reddish desert world; another planet in Earth's solar system",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 0, value: "a preposition meaning 'at the location of'", weight: 1.0 },
          ],
          contribution: "previous token is 'On'",
        },
      },
      L4: {
        prev: {
          kind: "positional",
          inputRep: "the planet Mars — the fourth planet from the sun, a cold reddish desert world, another planet in Earth's solar system; here, the location someone or something is on",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 0, value: "a preposition meaning 'at the location of'", weight: 1.0 },
          ],
          contribution: "previous token is 'On'; its representation was not updated by intervening layers",
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
      L5: "a comma (pacing punctuation)",
      L6: "a comma (pacing punctuation)",
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
      L5: "a definite article following a comma",
      L6: "a definite article following a comma",
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
      L4: {
        prev: {
          kind: "positional",
          inputRep: "a definite article following a comma",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 2, value: "a comma (pacing punctuation)", weight: 1.0 },
          ],
          contribution: "previous token is ','; its representation was not updated by intervening layers",
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
      L2: "the astronaut — a specific human trained to travel in space, currently on Mars (the fourth planet from the sun, a cold reddish desert world, another planet in Earth's solar system; the location they are on)",
      L3: "the astronaut — a specific human trained to travel in space, currently on Mars (the fourth planet from the sun, a cold reddish desert world, another planet in Earth's solar system; the location they are on)",
      L4: "the astronaut — a specific human trained to travel in space, currently on Mars (the fourth planet from the sun, a cold reddish desert world, another planet in Earth's solar system; the location they are on)",
      L5: "the astronaut — a specific human trained to travel in space, currently on Mars (the fourth planet from the sun, a cold reddish desert world, another planet in Earth's solar system; the location they are on)",
      L6: "the astronaut — a specific human trained to travel in space, currently on Mars (the fourth planet from the sun, a cold reddish desert world, another planet in Earth's solar system; the location they are on)",
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
              value: "the planet Mars — the fourth planet from the sun, a cold reddish desert world, another planet in Earth's solar system; here, the location someone or something is on",
              weight: 1.0,
            },
          ],
          contribution: "binds the astronaut to being on Mars",
        },
      },
      L4: {
        prev: {
          kind: "positional",
          inputRep: "the astronaut — a specific human trained to travel in space, currently on Mars (the fourth planet from the sun, a cold reddish desert world, another planet in Earth's solar system; the location they are on)",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 3, value: "a definite article following a comma", weight: 1.0 },
          ],
          contribution: "previous token is 'the'; its representation was not updated by intervening layers",
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
      L1: "a past act of looking — turning one's visual attention somewhere — performed by the astronaut",
      L2: "a past act of looking — turning one's visual attention somewhere — performed by the astronaut, happening on Mars (another planet in Earth's solar system)",
      L3: "a past act of looking — turning one's visual attention somewhere — performed by the astronaut, happening on Mars (another planet in Earth's solar system)",
      L4: "a past act of looking — turning one's visual attention somewhere — performed by the astronaut (a specific human trained to travel in space), happening on Mars (another planet in Earth's solar system)",
      L5: "a past act of looking — turning one's visual attention somewhere — performed by the astronaut (a specific human trained to travel in space), happening on Mars (another planet in Earth's solar system)",
      L6: "a past act of looking — turning one's visual attention somewhere — performed by the astronaut (a specific human trained to travel in space), happening on Mars (another planet in Earth's solar system)",
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
          inputRep: "a past act of looking — turning one's visual attention somewhere — performed by the astronaut",
          query: "a location",
          pulls: [
            {
              fromTokenIndex: IDX_MARS,
              key: "a location",
              value: "the planet Mars — the fourth planet from the sun, a cold reddish desert world, another planet in Earth's solar system; here, the location someone or something is on",
              weight: 1.0,
            },
          ],
          contribution: "binds the looking to happen on Mars",
        },
      },
      L4: {
        prev: {
          kind: "positional",
          inputRep: "a past act of looking — turning one's visual attention somewhere — performed by the astronaut, happening on Mars (another planet in Earth's solar system)",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            {
              fromTokenIndex: IDX_ASTRONAUT,
              value: "the astronaut — a specific human trained to travel in space, currently on Mars (the fourth planet from the sun, a cold reddish desert world, another planet in Earth's solar system; the location they are on)",
              weight: 1.0,
            },
          ],
          contribution: "previous token is 'astronaut'; its representation has since been enriched by intervening layers",
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
      L4: "a directional preposition attached to a past act of looking — turning one's visual attention somewhere — performed by the astronaut (a specific human trained to travel in space), happening on Mars (another planet in Earth's solar system)",
      L5: "a directional preposition attached to a past act of looking — turning one's visual attention somewhere — performed by the astronaut (a specific human trained to travel in space), happening on Mars (another planet in Earth's solar system)",
      L6: "a directional preposition attached to a past act of looking — turning one's visual attention somewhere — performed by the astronaut (a specific human trained to travel in space), happening on Mars (another planet in Earth's solar system)",
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
      L4: {
        prev: {
          kind: "positional",
          inputRep: "a directional preposition attached to the act of looking",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            {
              fromTokenIndex: IDX_LOOKED,
              value: "a past act of looking — turning one's visual attention somewhere — performed by the astronaut, happening on Mars (another planet in Earth's solar system)",
              weight: 1.0,
            },
          ],
          contribution: "previous token is 'looked'; its representation has since been enriched by intervening layers",
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
      L5: "a definite article following the preposition 'to'",
      L6: "a definite article following the preposition 'to'",
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
      L4: {
        prev: {
          kind: "positional",
          inputRep: "a definite article following the preposition 'to'",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 6, value: "a directional preposition attached to the act of looking", weight: 1.0 },
          ],
          contribution: "previous token is 'to'; its representation was not updated by intervening layers",
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
      L1: "the specific sky — the expanse above, where clouds and celestial objects appear",
      L2: "the specific Martian sky — the expanse above where clouds and celestial objects appear, here on Mars (another planet in Earth's solar system)",
      L3: "the specific Martian sky — the expanse above where clouds and celestial objects appear, here on Mars (another planet in Earth's solar system)",
      L4: "the specific Martian sky — the expanse above where clouds and celestial objects appear, here on Mars (another planet in Earth's solar system)",
      L5: "the specific Martian sky — the expanse above where clouds and celestial objects appear, here on Mars (another planet in Earth's solar system); now known to be what the astronaut looked at (via a past act of looking — turning one's visual attention somewhere — performed by the astronaut, happening on Mars)",
      L6: "the specific Martian sky — the expanse above where clouds and celestial objects appear, here on Mars (another planet in Earth's solar system); now known to be what the astronaut looked at (via a past act of looking — turning one's visual attention somewhere — performed by the astronaut, happening on Mars)",
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
          inputRep: "the specific sky — the expanse above, where clouds and celestial objects appear",
          query: "a location",
          pulls: [
            {
              fromTokenIndex: IDX_MARS,
              key: "a location",
              value: "the planet Mars — the fourth planet from the sun, a cold reddish desert world, another planet in Earth's solar system; here, the location someone or something is on",
              weight: 1.0,
            },
          ],
          contribution: "binds the sky to being above Mars",
        },
      },
      L4: {
        prev: {
          kind: "positional",
          inputRep: "the specific Martian sky — the expanse above where clouds and celestial objects appear, here on Mars (another planet in Earth's solar system)",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 7, value: "a definite article following the preposition 'to'", weight: 1.0 },
          ],
          contribution: "previous token is 'the'; its representation was not updated by intervening layers",
        },
      },
      L5: {
        "verb-of-object": {
          kind: "content",
          inputRep: "the specific Martian sky — the expanse above where clouds and celestial objects appear, here on Mars (another planet in Earth's solar system)",
          query: "a verb acting on this thing",
          pulls: [
            {
              fromTokenIndex: IDX_LOOKED,
              key: "a verb whose object this is",
              value: "a past act of looking — turning one's visual attention somewhere — performed by the astronaut, happening on Mars (another planet in Earth's solar system)",
              weight: 1.0,
            },
          ],
          contribution: "sky binds to the act of looking as what was being looked at",
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
      L4: "a conjunction following the first clause (which ended at 'sky' — the specific Martian sky, the expanse above where clouds and celestial objects appear, here on Mars, another planet in Earth's solar system)",
      L5: "a conjunction following the first clause (which ended at 'sky' — the specific Martian sky, the expanse above where clouds and celestial objects appear, here on Mars, another planet in Earth's solar system)",
      L6: "a conjunction following the first clause (which ended at 'sky' — the specific Martian sky, the expanse above where clouds and celestial objects appear, here on Mars, another planet in Earth's solar system)",
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
      L4: {
        prev: {
          kind: "positional",
          inputRep: "a conjunction following the first clause (ending at 'sky')",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            {
              fromTokenIndex: IDX_SKY,
              value: "the specific Martian sky — the expanse above where clouds and celestial objects appear, here on Mars (another planet in Earth's solar system)",
              weight: 1.0,
            },
          ],
          contribution: "previous token is 'sky'; its representation has since been enriched by intervening layers",
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
      L1: "a past act of seeing with the eyes, starting a new conjoined action",
      L2: "a past act of seeing with the eyes, happening on Mars (another planet in Earth's solar system), starting a new conjoined action",
      L3: "a past act of seeing with the eyes, happening on Mars (another planet in Earth's solar system), starting a new conjoined action",
      L4: "a past act of seeing with the eyes, happening on Mars (another planet in Earth's solar system), starting a new conjoined action",
      L5: "a past act of seeing with the eyes, happening on Mars (another planet in Earth's solar system), starting a new conjoined action",
      L6: "a past act of seeing with the eyes, happening on Mars (another planet in Earth's solar system), starting a new conjoined action",
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
          inputRep: "a past act of seeing with the eyes, starting a new conjoined action",
          query: "a location",
          pulls: [
            {
              fromTokenIndex: IDX_MARS,
              key: "a location",
              value: "the planet Mars — the fourth planet from the sun, a cold reddish desert world, another planet in Earth's solar system; here, the location someone or something is on",
              weight: 1.0,
            },
          ],
          contribution: "binds the seeing to happen on Mars",
        },
      },
      L4: {
        prev: {
          kind: "positional",
          inputRep: "a past act of seeing with the eyes, happening on Mars (another planet in Earth's solar system), starting a new conjoined action",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 9, value: "a conjunction following the first clause (ending at 'sky')", weight: 1.0 },
          ],
          contribution: "previous token is 'and'; its representation was not updated by intervening layers",
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
      L3: "her — a feminine possessive pronoun appearing as the possessor of what was seen, now known to refer to the astronaut (a specific human trained to travel in space, currently on Mars — another planet in Earth's solar system)",
      L4: "her — a feminine possessive pronoun appearing as the possessor of what was seen, now known to refer to the astronaut (a specific human trained to travel in space, currently on Mars — another planet in Earth's solar system); observed via a past act of seeing with the eyes, happening on Mars",
      L5: "her — a feminine possessive pronoun appearing as the possessor of what was seen, now known to refer to the astronaut (a specific human trained to travel in space, currently on Mars — another planet in Earth's solar system); observed via a past act of seeing with the eyes, happening on Mars; also the possessor of the thing observed in the act of seeing (a past act of seeing with the eyes, happening on Mars, starting a new conjoined action)",
      L6: "her — a feminine possessive pronoun appearing as the possessor of what was seen, now known to refer to the astronaut (a specific human trained to travel in space, currently on Mars — another planet in Earth's solar system); observed via a past act of seeing with the eyes, happening on Mars; also the possessor of the thing observed in the act of seeing (a past act of seeing with the eyes, happening on Mars, starting a new conjoined action)",
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
              value: "the astronaut — a specific human trained to travel in space, currently on Mars (the fourth planet from the sun, a cold reddish desert world, another planet in Earth's solar system; the location they are on)",
              weight: 1.0,
            },
          ],
          contribution: "resolves 'her' to the astronaut on Mars",
        },
      },
      L4: {
        prev: {
          kind: "positional",
          inputRep: "her — a feminine possessive pronoun appearing as the possessor of what was seen, now known to refer to the astronaut (a specific human trained to travel in space, currently on Mars — another planet in Earth's solar system)",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            {
              fromTokenIndex: IDX_SAW,
              value: "a past act of seeing with the eyes, happening on Mars (another planet in Earth's solar system), starting a new conjoined action",
              weight: 1.0,
            },
          ],
          contribution: "previous token is 'saw'; its representation has since been enriched by intervening layers",
        },
      },
      L5: {
        "verb-of-object": {
          kind: "content",
          inputRep: "her — a feminine possessive pronoun appearing as the possessor of what was seen, now known to refer to the astronaut (a specific human trained to travel in space, currently on Mars — another planet in Earth's solar system); observed via a past act of seeing with the eyes, happening on Mars",
          query: "a verb acting on this thing",
          pulls: [
            {
              fromTokenIndex: IDX_SAW,
              key: "a verb whose object this is",
              value: "a past act of seeing with the eyes, happening on Mars (another planet in Earth's solar system), starting a new conjoined action",
              weight: 1.0,
            },
          ],
          contribution: "her binds to the act of seeing as the possessor of the thing seen",
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
      L4: "the color blue, modifying a thing that belongs to her — the astronaut (a specific human trained to travel in space, currently on Mars, another planet in Earth's solar system)",
      L5: "the color blue, modifying a thing that belongs to her (the astronaut on Mars); that thing is the object of an act of seeing (a past act of seeing with the eyes, happening on Mars — another planet in Earth's solar system)",
      L6: "the color blue, modifying a thing that belongs to her (the astronaut on Mars), seen in an act of seeing happening on Mars; visible in the Martian sky (the expanse above where things appear, on Mars); her home, which by all this context is the other blue planet in this same solar system",
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
        prev: {
          kind: "positional",
          inputRep: "the color blue, modifying something that belongs to 'her'",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            {
              fromTokenIndex: IDX_HER,
              value: "her — a feminine possessive pronoun appearing as the possessor of what was seen, now known to refer to the astronaut (a specific human trained to travel in space, currently on Mars — another planet in Earth's solar system)",
              weight: 1.0,
            },
          ],
          contribution: "previous token is 'her'; its representation has since been enriched by intervening layers",
        },
      },
      L5: {
        "verb-of-object": {
          kind: "content",
          inputRep: "the color blue, modifying a thing that belongs to her — the astronaut (a specific human trained to travel in space, currently on Mars, another planet in Earth's solar system)",
          query: "a verb acting on this thing",
          pulls: [
            {
              fromTokenIndex: IDX_SAW,
              key: "a verb whose object this is",
              value: "a past act of seeing with the eyes, happening on Mars (another planet in Earth's solar system), starting a new conjoined action",
              weight: 1.0,
            },
          ],
          contribution: "blue binds to the act of seeing that targets its noun",
        },
      },
      L6: {
        "visible-direction": {
          kind: "content",
          inputRep: "the color blue, modifying a thing that belongs to her (the astronaut on Mars); that thing is the object of an act of seeing (a past act of seeing with the eyes, happening on Mars — another planet in Earth's solar system)",
          query: "the visual direction where this is seen",
          pulls: [
            {
              fromTokenIndex: IDX_SKY,
              key: "a visual direction where things are seen",
              value: "the specific Martian sky — the expanse above where clouds and celestial objects appear, here on Mars (another planet in Earth's solar system); now known to be what the astronaut looked at (via a past act of looking — turning one's visual attention somewhere — performed by the astronaut, happening on Mars)",
              weight: 1.0,
            },
          ],
          contribution: "blue binds to the Martian sky as the direction where the seen thing appears",
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
  answerEmbedding: {
    token: "Earth",
    description: "a blue planet, home to humans, visible from other planets in the solar system",
  },
};

// Fail fast if a later edit breaks the data.
validateExample(astronautExample);
