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
    description: "Words that need placing in the scene query for a scene-location. Astronaut, looked, and sky all reach Mars. Saw — coming later in the sentence — reaches both Mars AND the sky, since both are scene locations it can see.",
    heads: [
      {
        id: "location",
        label: "Place in the scene",
        description: "Rule: a word that participates in the scene attends to scene-location nouns it can causally see. Mars is reachable by all four; sky is also reachable by saw (which comes after sky in the sentence).",
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
      L1: "The planet Mars. It's the fourth planet from the sun: cold, reddish, and covered in desert. It's another planet in Earth's solar system. Here, it's the location that someone or something is on.",
      L2: "The planet Mars. It's the fourth planet from the sun: cold, reddish, and covered in desert. It's another planet in Earth's solar system. Here, it's the location that someone or something is on.",
      L3: "The planet Mars. It's the fourth planet from the sun: cold, reddish, and covered in desert. It's another planet in Earth's solar system. Here, it's the location that someone or something is on.",
      L4: "The planet Mars. It's the fourth planet from the sun: cold, reddish, and covered in desert. It's another planet in Earth's solar system. Here, it's the location that someone or something is on.",
      L5: "The planet Mars. It's the fourth planet from the sun: cold, reddish, and covered in desert. It's another planet in Earth's solar system. Here, it's the location that someone or something is on.",
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
          inputRep: "The planet Mars. It's the fourth planet from the sun: cold, reddish, and covered in desert. It's another planet in Earth's solar system. Here, it's the location that someone or something is on.",
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
      L2: "The astronaut. A specific human trained to travel in space. Currently on Mars — the fourth planet from the sun. Mars is cold, reddish, and another planet in Earth's solar system.",
      L3: "The astronaut. A specific human trained to travel in space. Currently on Mars — the fourth planet from the sun. Mars is cold, reddish, and another planet in Earth's solar system.",
      L4: "The astronaut. A specific human trained to travel in space. Currently on Mars — the fourth planet from the sun. Mars is cold, reddish, and another planet in Earth's solar system.",
      L5: "The astronaut. A specific human trained to travel in space. Currently on Mars — the fourth planet from the sun. Mars is cold, reddish, and another planet in Earth's solar system.",
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
          query: "a scene-location",
          pulls: [
            {
              fromTokenIndex: IDX_MARS,
              key: "a scene-location",
              value: "The planet Mars. It's the fourth planet from the sun: cold, reddish, and covered in desert. It's another planet in Earth's solar system. Here, it's the location that someone or something is on.",
              weight: 1.0,
            },
          ],
          contribution: "binds the astronaut to being on Mars",
        },
      },
      L4: {
        prev: {
          kind: "positional",
          inputRep: "The astronaut. A specific human trained to travel in space. Currently on Mars — the fourth planet from the sun. Mars is cold, reddish, and another planet in Earth's solar system.",
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
      L1: "A past act of looking. Someone turned their visual attention somewhere. The astronaut — a human trained to travel in space — did the looking.",
      L2: "A past act of looking. Someone turned their visual attention somewhere. The astronaut — a human trained to travel in space — did the looking. It happened on Mars, another planet in Earth's solar system.",
      L3: "A past act of looking. Someone turned their visual attention somewhere. The astronaut — a human trained to travel in space — did the looking. It happened on Mars, another planet in Earth's solar system.",
      L4: "A past act of looking. Someone turned their visual attention somewhere. The astronaut — a human trained to travel in space — did the looking. It happened on Mars, another planet in Earth's solar system.",
      L5: "A past act of looking. Someone turned their visual attention somewhere. The astronaut — a human trained to travel in space — did the looking. It happened on Mars, another planet in Earth's solar system.",
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
          inputRep: "A past act of looking. Someone turned their visual attention somewhere. The astronaut — a human trained to travel in space — did the looking.",
          query: "a scene-location",
          pulls: [
            {
              fromTokenIndex: IDX_MARS,
              key: "a scene-location",
              value: "The planet Mars. It's the fourth planet from the sun: cold, reddish, and covered in desert. It's another planet in Earth's solar system. Here, it's the location that someone or something is on.",
              weight: 1.0,
            },
          ],
          contribution: "binds the looking to happen on Mars",
        },
      },
      L4: {
        prev: {
          kind: "positional",
          inputRep: "A past act of looking. Someone turned their visual attention somewhere. The astronaut — a human trained to travel in space — did the looking. It happened on Mars, another planet in Earth's solar system.",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            {
              fromTokenIndex: IDX_ASTRONAUT,
              value: "The astronaut. A specific human trained to travel in space. Currently on Mars — the fourth planet from the sun. Mars is cold, reddish, and another planet in Earth's solar system.",
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
      L4: "A directional preposition. It attaches to a past act of looking. The looking was performed by the astronaut (a specific human trained to travel in space). It happened on Mars, another planet in Earth's solar system.",
      L5: "A directional preposition. It attaches to a past act of looking. The looking was performed by the astronaut (a specific human trained to travel in space). It happened on Mars, another planet in Earth's solar system.",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "a directional preposition attached to the act of looking",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 5, value: "a verb about looking", weight: 1.0 },
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
              value: "A past act of looking. Someone turned their visual attention somewhere. The astronaut — a human trained to travel in space — did the looking. It happened on Mars, another planet in Earth's solar system.",
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
      L1: "The specific sky. It's the expanse above, where clouds and celestial objects appear.",
      L2: "The specific Martian sky. It's the expanse above, where clouds and celestial objects appear. Here, it's above Mars — another planet in Earth's solar system.",
      L3: "The specific Martian sky. It's the expanse above, where clouds and celestial objects appear. Here, it's above Mars — another planet in Earth's solar system.",
      L4: "The specific Martian sky. It's the expanse above, where clouds and celestial objects appear. Here, it's above Mars — another planet in Earth's solar system.",
      L5: "The specific Martian sky. It's the expanse above, where clouds and celestial objects appear. Here, it's above Mars — another planet in Earth's solar system. Now known to be what the astronaut (a human trained to travel in space) looked at.",
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
          inputRep: "The specific sky. It's the expanse above, where clouds and celestial objects appear.",
          query: "a scene-location",
          pulls: [
            {
              fromTokenIndex: IDX_MARS,
              key: "a scene-location",
              value: "The planet Mars. It's the fourth planet from the sun: cold, reddish, and covered in desert. It's another planet in Earth's solar system. Here, it's the location that someone or something is on.",
              weight: 1.0,
            },
          ],
          contribution: "binds the sky to being above Mars",
        },
      },
      L4: {
        prev: {
          kind: "positional",
          inputRep: "The specific Martian sky. It's the expanse above, where clouds and celestial objects appear. Here, it's above Mars — another planet in Earth's solar system.",
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
          inputRep: "The specific Martian sky. It's the expanse above, where clouds and celestial objects appear. Here, it's above Mars — another planet in Earth's solar system.",
          query: "a verb acting on this thing",
          pulls: [
            {
              fromTokenIndex: IDX_LOOKED,
              key: "a verb whose object this is",
              value: "A past act of looking. Someone turned their visual attention somewhere. The astronaut — a human trained to travel in space — did the looking. It happened on Mars, another planet in Earth's solar system.",
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
      L0: "the word 'and', joining what came before to what comes next",
      L1: "the word 'and', joining what came before to what comes next",
      L2: "the word 'and', joining what came before to what comes next",
      L3: "the word 'and', joining what came before to what comes next",
      L4: "The word 'and'. It joins what came before to what comes next. What came before ended at 'sky' — the specific Martian sky, the expanse above on Mars where clouds and celestial objects appear.",
      L5: "The word 'and'. It joins what came before to what comes next. What came before ended at 'sky' — the specific Martian sky, the expanse above on Mars where clouds and celestial objects appear.",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "the word 'and', joining what came before to what comes next",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 8, value: "the sky", weight: 1.0 },
          ],
          contribution: "previous token is 'sky'",
        },
      },
      L4: {
        prev: {
          kind: "positional",
          inputRep: "the word 'and', joining what came before to what comes next",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            {
              fromTokenIndex: IDX_SKY,
              value: "The specific Martian sky. It's the expanse above, where clouds and celestial objects appear. Here, it's above Mars — another planet in Earth's solar system.",
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
      L1: "a past act of seeing with the eyes",
      L2: "A past act of seeing with the eyes. It happens on Mars, another planet in Earth's solar system. It takes place against the visual backdrop of the Martian sky.",
      L3: "A past act of seeing with the eyes. It happens on Mars, another planet in Earth's solar system. It takes place against the visual backdrop of the Martian sky.",
      L4: "A past act of seeing with the eyes. It happens on Mars, another planet in Earth's solar system. It takes place against the visual backdrop of the Martian sky.",
      L5: "A past act of seeing with the eyes. It happens on Mars, another planet in Earth's solar system. It takes place against the visual backdrop of the Martian sky.",
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
          inputRep: "a past act of seeing with the eyes",
          query: "a scene-location",
          pulls: [
            {
              fromTokenIndex: IDX_MARS,
              key: "a scene-location",
              value: "The planet Mars. It's the fourth planet from the sun: cold, reddish, and covered in desert. It's another planet in Earth's solar system. Here, it's the location that someone or something is on.",
              weight: 0.5,
            },
            {
              fromTokenIndex: IDX_SKY,
              key: "a scene-location",
              value: "The specific sky. It's the expanse above, where clouds and celestial objects appear.",
              weight: 0.5,
            },
          ],
          contribution: "binds the seeing to happen on Mars",
        },
      },
      L4: {
        prev: {
          kind: "positional",
          inputRep: "A past act of seeing with the eyes. It happens on Mars, another planet in Earth's solar system. It takes place against the visual backdrop of the Martian sky.",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 9, value: "the word 'and', joining what came before to what comes next", weight: 1.0 },
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
      L2: "A feminine possessive pronoun (the word 'her'). It marks the owner of whatever was seen. The scene is on Mars, another planet in Earth's solar system. The backdrop is the Martian sky — the expanse above where clouds and celestial objects appear.",
      L3: "The word 'her'. A feminine possessive pronoun marking the owner of whatever was seen. Set in the Martian scene under the Martian sky. Now known to refer to the astronaut: a specific human trained to travel in space, currently on Mars (another planet in Earth's solar system).",
      L4: "The word 'her'. A feminine possessive pronoun marking the owner of whatever was seen. Set in the Martian scene under the Martian sky. Now known to refer to the astronaut: a specific human trained to travel in space, currently on Mars. Observed via a past act of seeing with the eyes, happening on Mars.",
      L5: "The word 'her'. A feminine possessive pronoun marking the owner of whatever was seen. Set in the Martian scene under the Martian sky. Now known to refer to the astronaut: a specific human trained to travel in space, currently on Mars. Also the owner of the thing observed in the act of seeing — a past act of seeing with the eyes, happening on Mars and against the Martian sky.",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "a feminine possessive pronoun",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 10, value: "a verb about seeing — what was seen comes next", weight: 1.0 },
          ],
          contribution: "previous token is 'saw'",
        },
      },
      L2: {
        location: {
          kind: "content",
          inputRep: "a feminine possessive pronoun, appearing as the possessor of what was seen",
          query: "a scene-location",
          pulls: [
            {
              fromTokenIndex: IDX_MARS,
              key: "a scene-location",
              value: "The planet Mars. It's the fourth planet from the sun: cold, reddish, and covered in desert. It's another planet in Earth's solar system. Here, it's the location that someone or something is on.",
              weight: 0.5,
            },
            {
              fromTokenIndex: IDX_SKY,
              key: "a scene-location",
              value: "The specific sky. It's the expanse above, where clouds and celestial objects appear.",
              weight: 0.5,
            },
          ],
          contribution: "ties 'her' to the Martian scene and the Martian sky (whoever 'her' refers to belongs in this scene under that sky)",
        },
      },
      L3: {
        refers: {
          kind: "content",
          inputRep: "A feminine possessive pronoun (the word 'her'). It marks the owner of whatever was seen. The scene is on Mars, another planet in Earth's solar system. The backdrop is the Martian sky — the expanse above where clouds and celestial objects appear.",
          query: "a human person",
          pulls: [
            {
              fromTokenIndex: IDX_ASTRONAUT,
              key: "a human person",
              value: "The astronaut. A specific human trained to travel in space. Currently on Mars — the fourth planet from the sun. Mars is cold, reddish, and another planet in Earth's solar system.",
              weight: 1.0,
            },
          ],
          contribution: "resolves 'her' to the astronaut on Mars",
        },
      },
      L4: {
        prev: {
          kind: "positional",
          inputRep: "The word 'her'. A feminine possessive pronoun marking the owner of whatever was seen. Set in the Martian scene under the Martian sky. Now known to refer to the astronaut: a specific human trained to travel in space, currently on Mars (another planet in Earth's solar system).",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            {
              fromTokenIndex: IDX_SAW,
              value: "A past act of seeing with the eyes. It happens on Mars, another planet in Earth's solar system. It takes place against the visual backdrop of the Martian sky.",
              weight: 1.0,
            },
          ],
          contribution: "previous token is 'saw'; its representation has since been enriched by intervening layers",
        },
      },
      L5: {
        "verb-of-object": {
          kind: "content",
          inputRep: "The word 'her'. A feminine possessive pronoun marking the owner of whatever was seen. Set in the Martian scene under the Martian sky. Now known to refer to the astronaut: a specific human trained to travel in space, currently on Mars. Observed via a past act of seeing with the eyes, happening on Mars.",
          query: "a verb acting on this thing",
          pulls: [
            {
              fromTokenIndex: IDX_SAW,
              key: "a verb whose object this is",
              value: "A past act of seeing with the eyes. It happens on Mars, another planet in Earth's solar system. It takes place against the visual backdrop of the Martian sky.",
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
      L4: "The color blue. It modifies a thing. That thing belongs to her — the astronaut, a specific human trained to travel in space, currently on Mars (another planet in Earth's solar system).",
      L5: "The color blue. It modifies a thing. That thing belongs to her — the astronaut (a human trained to travel in space), currently on Mars (another planet in Earth's solar system). That thing is what was seen. The seeing happened with the eyes, on Mars, against the backdrop of the Martian sky.",
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
              value: "The word 'her'. A feminine possessive pronoun marking the owner of whatever was seen. Set in the Martian scene under the Martian sky. Now known to refer to the astronaut: a specific human trained to travel in space, currently on Mars (another planet in Earth's solar system).",
              weight: 1.0,
            },
          ],
          contribution: "previous token is 'her'; its representation has since been enriched by intervening layers",
        },
      },
      L5: {
        "verb-of-object": {
          kind: "content",
          inputRep: "The color blue. It modifies a thing. That thing belongs to her — the astronaut, a specific human trained to travel in space, currently on Mars (another planet in Earth's solar system).",
          query: "a verb acting on this thing",
          pulls: [
            {
              fromTokenIndex: IDX_SAW,
              key: "a verb whose object this is",
              value: "A past act of seeing with the eyes. It happens on Mars, another planet in Earth's solar system. It takes place against the visual backdrop of the Martian sky.",
              weight: 1.0,
            },
          ],
          contribution: "blue binds to the act of seeing that targets its noun",
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
