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
      L0: "A preposition meaning 'at the location of'.",
      L1: "A preposition meaning 'at the location of'.",
      L2: "A preposition meaning 'at the location of'.",
      L3: "A preposition meaning 'at the location of'.",
      L4: "A preposition meaning 'at the location of'.",
      L5: "A preposition meaning 'at the location of'.",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "A preposition meaning 'at the location of'.",
          positionalRule: "attend to the token at position N-1",
          pulls: [],
          contribution: "no previous token (this is the first word)",
        },
      },
      L4: {
        prev: {
          kind: "positional",
          inputRep: "A preposition meaning 'at the location of'.",
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
      L0: "The planet Mars. The fourth planet from the sun. A cold, reddish desert world. Another planet in our solar system, like Earth.",
      L1: "The planet Mars. The fourth planet from the sun. A cold, reddish desert world. Another planet in our solar system, like Earth. Here, it's the location of this scene.",
      L2: "The planet Mars. The fourth planet from the sun. A cold, reddish desert world. Another planet in our solar system, like Earth. Here, it's the location of this scene.",
      L3: "The planet Mars. The fourth planet from the sun. A cold, reddish desert world. Another planet in our solar system, like Earth. Here, it's the location of this scene.",
      L4: "The planet Mars. The fourth planet from the sun. A cold, reddish desert world. Another planet in our solar system, like Earth. Here, it's the location of this scene.",
      L5: "The planet Mars. The fourth planet from the sun. A cold, reddish desert world. Another planet in our solar system, like Earth. Here, it's the location of this scene.",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "The planet Mars. The fourth planet from the sun. A cold, reddish desert world. Another planet in our solar system, like Earth.",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 0, value: "A preposition meaning 'at the location of'.", weight: 1.0 },
          ],
          contribution: "previous token is 'On'",
        },
      },
      L4: {
        prev: {
          kind: "positional",
          inputRep: "The planet Mars. The fourth planet from the sun. A cold, reddish desert world. Another planet in our solar system, like Earth. Here, it's the location of this scene.",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 0, value: "A preposition meaning 'at the location of'.", weight: 1.0 },
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
      L0: "A definite article. Comes after a comma.",
      L1: "A definite article. Comes after a comma.",
      L2: "A definite article. Comes after a comma.",
      L3: "A definite article. Comes after a comma.",
      L4: "A definite article. Comes after a comma.",
      L5: "A definite article. Comes after a comma.",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "A definite article. Comes after a comma.",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 2, value: "a comma (pacing punctuation)", weight: 1.0 },
          ],
          contribution: "previous token is ','",
        },
      },
      L4: {
        prev: {
          kind: "positional",
          inputRep: "A definite article. Comes after a comma.",
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
      L0: "An astronaut. A human trained to travel in space.",
      L1: "An astronaut. A human trained to travel in space. The previous word was 'the' — so this is a specific astronaut.",
      L2: "An astronaut. A human trained to travel in space. The previous word was 'the' — so this is a specific astronaut. Currently on Mars. Mars is the fourth planet from the sun. Mars is a cold, reddish desert world. Mars is another planet in our solar system, like Earth.",
      L3: "An astronaut. A human trained to travel in space. The previous word was 'the' — so this is a specific astronaut. Currently on Mars. Mars is the fourth planet from the sun. Mars is a cold, reddish desert world. Mars is another planet in our solar system, like Earth.",
      L4: "An astronaut. A human trained to travel in space. The previous word was 'the' — so this is a specific astronaut. Currently on Mars. Mars is the fourth planet from the sun. Mars is a cold, reddish desert world. Mars is another planet in our solar system, like Earth.",
      L5: "An astronaut. A human trained to travel in space. The previous word was 'the' — so this is a specific astronaut. Currently on Mars. Mars is the fourth planet from the sun. Mars is a cold, reddish desert world. Mars is another planet in our solar system, like Earth.",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "An astronaut. A human trained to travel in space.",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 3, value: "A definite article.", weight: 1.0 },
          ],
          contribution: "previous token is 'the'",
        },
      },
      L2: {
        location: {
          kind: "content",
          inputRep: "An astronaut. A human trained to travel in space. The previous word was 'the' — so this is a specific astronaut.",
          query: "a scene-location",
          pulls: [
            {
              fromTokenIndex: IDX_MARS,
              key: "a scene-location",
              value: "The planet Mars. The fourth planet from the sun. A cold, reddish desert world. Another planet in our solar system, like Earth. Here, it's the location of this scene.",
              weight: 1.0,
            },
          ],
          contribution: "binds the astronaut to being on Mars",
        },
      },
      L4: {
        prev: {
          kind: "positional",
          inputRep: "An astronaut. A human trained to travel in space. The previous word was 'the' — so this is a specific astronaut. Currently on Mars. Mars is the fourth planet from the sun. Mars is a cold, reddish desert world. Mars is another planet in our solar system, like Earth.",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 3, value: "A definite article. Comes after a comma.", weight: 1.0 },
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
      L0: "A past act of looking. Someone turned their visual attention somewhere.",
      L1: "A past act of looking. Someone turned their visual attention somewhere. The looker is the astronaut. An astronaut is a human trained to travel in space.",
      L2: "A past act of looking. Someone turned their visual attention somewhere. The looker is the astronaut. An astronaut is a human trained to travel in space. It happened on Mars. Mars is another planet in our solar system.",
      L3: "A past act of looking. Someone turned their visual attention somewhere. The looker is the astronaut. An astronaut is a human trained to travel in space. It happened on Mars. Mars is another planet in our solar system.",
      L4: "A past act of looking. Someone turned their visual attention somewhere. The looker is the astronaut. An astronaut is a human trained to travel in space. It happened on Mars. Mars is another planet in our solar system.",
      L5: "A past act of looking. Someone turned their visual attention somewhere. The looker is the astronaut. An astronaut is a human trained to travel in space. It happened on Mars. Mars is another planet in our solar system.",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "A past act of looking. Someone turned their visual attention somewhere.",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 4, value: "An astronaut. A human trained to travel in space.", weight: 1.0 },
          ],
          contribution: "previous token is 'astronaut'",
        },
      },
      L2: {
        location: {
          kind: "content",
          inputRep: "A past act of looking. Someone turned their visual attention somewhere. The looker is the astronaut. An astronaut is a human trained to travel in space.",
          query: "a scene-location",
          pulls: [
            {
              fromTokenIndex: IDX_MARS,
              key: "a scene-location",
              value: "The planet Mars. The fourth planet from the sun. A cold, reddish desert world. Another planet in our solar system, like Earth. Here, it's the location of this scene.",
              weight: 1.0,
            },
          ],
          contribution: "binds the looking to happen on Mars",
        },
      },
      L4: {
        prev: {
          kind: "positional",
          inputRep: "A past act of looking. Someone turned their visual attention somewhere. The looker is the astronaut. An astronaut is a human trained to travel in space. It happened on Mars. Mars is another planet in our solar system.",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            {
              fromTokenIndex: IDX_ASTRONAUT,
              value: "An astronaut. A human trained to travel in space. The previous word was 'the' — so this is a specific astronaut. Currently on Mars. Mars is the fourth planet from the sun. Mars is a cold, reddish desert world. Mars is another planet in our solar system, like Earth.",
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
      L0: "A directional preposition.",
      L1: "A directional preposition. Attached to the act of looking.",
      L2: "A directional preposition. Attached to the act of looking.",
      L3: "A directional preposition. Attached to the act of looking.",
      L4: "A directional preposition. Attached to the act of looking. The looker is the astronaut. An astronaut is a human trained to travel in space. The looking happened on Mars.",
      L5: "A directional preposition. Attached to the act of looking. The looker is the astronaut. An astronaut is a human trained to travel in space. The looking happened on Mars.",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "A directional preposition.",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 5, value: "A past act of looking. Someone turned their visual attention somewhere.", weight: 1.0 },
          ],
          contribution: "previous token is 'looked'",
        },
      },
      L4: {
        prev: {
          kind: "positional",
          inputRep: "A directional preposition. Attached to the act of looking.",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            {
              fromTokenIndex: IDX_LOOKED,
              value: "A past act of looking. Someone turned their visual attention somewhere. The looker is the astronaut. An astronaut is a human trained to travel in space. It happened on Mars. Mars is another planet in our solar system.",
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
      L0: "A definite article. Comes after the preposition 'to'.",
      L1: "A definite article. Comes after the preposition 'to'.",
      L2: "A definite article. Comes after the preposition 'to'.",
      L3: "A definite article. Comes after the preposition 'to'.",
      L4: "A definite article. Comes after the preposition 'to'.",
      L5: "A definite article. Comes after the preposition 'to'.",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "A definite article. Comes after the preposition 'to'.",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 6, value: "A directional preposition.", weight: 1.0 },
          ],
          contribution: "previous token is 'to'",
        },
      },
      L4: {
        prev: {
          kind: "positional",
          inputRep: "A definite article. Comes after the preposition 'to'.",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 6, value: "A directional preposition. Attached to the act of looking.", weight: 1.0 },
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
      L0: "The sky. The expanse above. Where clouds and celestial objects appear.",
      L1: "The sky. The expanse above. Where clouds and celestial objects appear. A specific sky — the previous word was 'the'.",
      L2: "The sky. The expanse above. Where clouds and celestial objects appear. A specific sky — the previous word was 'the'. Here, the sky is above Mars. Mars is another planet in our solar system.",
      L3: "The sky. The expanse above. Where clouds and celestial objects appear. A specific sky — the previous word was 'the'. Here, the sky is above Mars. Mars is another planet in our solar system.",
      L4: "The sky. The expanse above. Where clouds and celestial objects appear. A specific sky — the previous word was 'the'. Here, the sky is above Mars. Mars is another planet in our solar system.",
      L5: "The sky. The expanse above. Where clouds and celestial objects appear. A specific sky — the previous word was 'the'. Here, the sky is above Mars. Mars is another planet in our solar system. Now known to be what the astronaut looked at.",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "The sky. The expanse above. Where clouds and celestial objects appear.",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 7, value: "A definite article.", weight: 1.0 },
          ],
          contribution: "previous token is 'the'",
        },
      },
      L2: {
        location: {
          kind: "content",
          inputRep: "The sky. The expanse above. Where clouds and celestial objects appear. A specific sky — the previous word was 'the'.",
          query: "a scene-location",
          pulls: [
            {
              fromTokenIndex: IDX_MARS,
              key: "a scene-location",
              value: "The planet Mars. The fourth planet from the sun. A cold, reddish desert world. Another planet in our solar system, like Earth. Here, it's the location of this scene.",
              weight: 1.0,
            },
          ],
          contribution: "binds the sky to being above Mars",
        },
      },
      L4: {
        prev: {
          kind: "positional",
          inputRep: "The sky. The expanse above. Where clouds and celestial objects appear. A specific sky — the previous word was 'the'. Here, the sky is above Mars. Mars is another planet in our solar system.",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 7, value: "A definite article. Comes after the preposition 'to'.", weight: 1.0 },
          ],
          contribution: "previous token is 'the'; its representation was not updated by intervening layers",
        },
      },
      L5: {
        "verb-of-object": {
          kind: "content",
          inputRep: "The sky. The expanse above. Where clouds and celestial objects appear. A specific sky — the previous word was 'the'. Here, the sky is above Mars. Mars is another planet in our solar system.",
          query: "a verb acting on this thing",
          pulls: [
            {
              fromTokenIndex: IDX_LOOKED,
              key: "a verb whose object this is",
              value: "A past act of looking. Someone turned their visual attention somewhere. The looker is the astronaut. An astronaut is a human trained to travel in space. It happened on Mars. Mars is another planet in our solar system.",
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
      L0: "The word 'and'. It joins what came before to what comes next.",
      L1: "The word 'and'. It joins what came before to what comes next. The word right before is 'sky'.",
      L2: "The word 'and'. It joins what came before to what comes next. The word right before is 'sky'.",
      L3: "The word 'and'. It joins what came before to what comes next. The word right before is 'sky'.",
      L4: "The word 'and'. It joins what came before to what comes next. The word right before is 'sky'. The sky here is above Mars.",
      L5: "The word 'and'. It joins what came before to what comes next. The word right before is 'sky'. The sky here is above Mars.",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "The word 'and'. It joins what came before to what comes next.",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 8, value: "The sky. The expanse above. Where clouds and celestial objects appear.", weight: 1.0 },
          ],
          contribution: "previous token is 'sky'",
        },
      },
      L4: {
        prev: {
          kind: "positional",
          inputRep: "The word 'and'. It joins what came before to what comes next. The word right before is 'sky'.",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            {
              fromTokenIndex: IDX_SKY,
              value: "The sky. The expanse above. Where clouds and celestial objects appear. A specific sky — the previous word was 'the'. Here, the sky is above Mars. Mars is another planet in our solar system.",
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
      L0: "A past act of seeing with the eyes.",
      L1: "A past act of seeing with the eyes. Joins what came before — the previous word is 'and'.",
      L2: "A past act of seeing with the eyes. Joins what came before — the previous word is 'and'. Happened on Mars. Mars is another planet in our solar system. Took place against the Martian sky.",
      L3: "A past act of seeing with the eyes. Joins what came before — the previous word is 'and'. Happened on Mars. Mars is another planet in our solar system. Took place against the Martian sky.",
      L4: "A past act of seeing with the eyes. Joins what came before — the previous word is 'and'. Happened on Mars. Mars is another planet in our solar system. Took place against the Martian sky.",
      L5: "A past act of seeing with the eyes. Joins what came before — the previous word is 'and'. Happened on Mars. Mars is another planet in our solar system. Took place against the Martian sky.",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "A past act of seeing with the eyes.",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 9, value: "The word 'and'. It joins what came before to what comes next.", weight: 1.0 },
          ],
          contribution: "previous token is 'and'",
        },
      },
      L2: {
        location: {
          kind: "content",
          inputRep: "A past act of seeing with the eyes. Joins what came before — the previous word is 'and'.",
          query: "a scene-location",
          pulls: [
            {
              fromTokenIndex: IDX_MARS,
              key: "a scene-location",
              value: "The planet Mars. The fourth planet from the sun. A cold, reddish desert world. Another planet in our solar system, like Earth. Here, it's the location of this scene.",
              weight: 0.5,
            },
            {
              fromTokenIndex: IDX_SKY,
              key: "a scene-location",
              value: "The sky. The expanse above. Where clouds and celestial objects appear. A specific sky — the previous word was 'the'.",
              weight: 0.5,
            },
          ],
          contribution: "binds the seeing to happen on Mars",
        },
      },
      L4: {
        prev: {
          kind: "positional",
          inputRep: "A past act of seeing with the eyes. Joins what came before — the previous word is 'and'. Happened on Mars. Mars is another planet in our solar system. Took place against the Martian sky.",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 9, value: "The word 'and'. It joins what came before to what comes next. The word right before is 'sky'.", weight: 1.0 },
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
      L0: "A feminine possessive pronoun.",
      L1: "A feminine possessive pronoun. The owner of whatever was seen.",
      L2: "A feminine possessive pronoun. The owner of whatever was seen. The scene is on Mars. The backdrop is the Martian sky.",
      L3: "A feminine possessive pronoun. The owner of whatever was seen. The scene is on Mars. The backdrop is the Martian sky. 'Her' refers to the astronaut. An astronaut is a human trained to travel in space. The astronaut is currently on Mars.",
      L4: "A feminine possessive pronoun. The owner of whatever was seen. The scene is on Mars. The backdrop is the Martian sky. 'Her' refers to the astronaut. An astronaut is a human trained to travel in space. The astronaut is currently on Mars. The act of seeing happened on Mars and against the Martian sky.",
      L5: "A feminine possessive pronoun. The owner of whatever was seen. The scene is on Mars. The backdrop is the Martian sky. 'Her' refers to the astronaut. An astronaut is a human trained to travel in space. The astronaut is currently on Mars. The act of seeing happened on Mars and against the Martian sky.",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "A feminine possessive pronoun.",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 10, value: "A past act of seeing with the eyes.", weight: 1.0 },
          ],
          contribution: "previous token is 'saw'",
        },
      },
      L2: {
        location: {
          kind: "content",
          inputRep: "A feminine possessive pronoun. The owner of whatever was seen.",
          query: "a scene-location",
          pulls: [
            {
              fromTokenIndex: IDX_MARS,
              key: "a scene-location",
              value: "The planet Mars. The fourth planet from the sun. A cold, reddish desert world. Another planet in our solar system, like Earth. Here, it's the location of this scene.",
              weight: 0.5,
            },
            {
              fromTokenIndex: IDX_SKY,
              key: "a scene-location",
              value: "The sky. The expanse above. Where clouds and celestial objects appear. A specific sky — the previous word was 'the'.",
              weight: 0.5,
            },
          ],
          contribution: "ties 'her' to the Martian scene and the Martian sky (whoever 'her' refers to belongs in this scene under that sky)",
        },
      },
      L3: {
        refers: {
          kind: "content",
          inputRep: "A feminine possessive pronoun. The owner of whatever was seen. The scene is on Mars. The backdrop is the Martian sky.",
          query: "a human person",
          pulls: [
            {
              fromTokenIndex: IDX_ASTRONAUT,
              key: "a human person",
              value: "An astronaut. A human trained to travel in space. The previous word was 'the' — so this is a specific astronaut. Currently on Mars. Mars is the fourth planet from the sun. Mars is a cold, reddish desert world. Mars is another planet in our solar system, like Earth.",
              weight: 1.0,
            },
          ],
          contribution: "resolves 'her' to the astronaut on Mars",
        },
      },
      L4: {
        prev: {
          kind: "positional",
          inputRep: "A feminine possessive pronoun. The owner of whatever was seen. The scene is on Mars. The backdrop is the Martian sky. 'Her' refers to the astronaut. An astronaut is a human trained to travel in space. The astronaut is currently on Mars.",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            {
              fromTokenIndex: IDX_SAW,
              value: "A past act of seeing with the eyes. Joins what came before — the previous word is 'and'. Happened on Mars. Mars is another planet in our solar system. Took place against the Martian sky.",
              weight: 1.0,
            },
          ],
          contribution: "previous token is 'saw'; its representation has since been enriched by intervening layers",
        },
      },
      L5: {
        "verb-of-object": {
          kind: "content",
          inputRep: "A feminine possessive pronoun. The owner of whatever was seen. The scene is on Mars. The backdrop is the Martian sky. 'Her' refers to the astronaut. An astronaut is a human trained to travel in space. The astronaut is currently on Mars. The act of seeing happened on Mars and against the Martian sky.",
          query: "a verb acting on this thing",
          pulls: [
            {
              fromTokenIndex: IDX_SAW,
              key: "a verb whose object this is",
              value: "A past act of seeing with the eyes. Joins what came before — the previous word is 'and'. Happened on Mars. Mars is another planet in our solar system. Took place against the Martian sky.",
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
      L0: "The color blue.",
      L1: "The color blue. It modifies a thing. The thing belongs to her.",
      L2: "The color blue. It modifies a thing. The thing belongs to her.",
      L3: "The color blue. It modifies a thing. The thing belongs to her.",
      L4: "The color blue. It modifies a thing. The thing belongs to her. 'Her' is the astronaut. An astronaut is a human trained to travel in space. The astronaut is currently on Mars.",
      L5: "The color blue. It modifies a thing. The thing belongs to her. 'Her' is the astronaut. An astronaut is a human trained to travel in space. The astronaut is currently on Mars. The thing was seen by her. The seeing happened with the eyes. It happened on Mars, against the Martian sky.",
    },
    headCards: {
      L1: {
        prev: {
          kind: "positional",
          inputRep: "The color blue.",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            { fromTokenIndex: 11, value: "A feminine possessive pronoun.", weight: 1.0 },
          ],
          contribution: "previous token is 'her'",
        },
      },
      L4: {
        prev: {
          kind: "positional",
          inputRep: "The color blue. It modifies a thing. The thing belongs to her.",
          positionalRule: "attend to the token at position N-1",
          pulls: [
            {
              fromTokenIndex: IDX_HER,
              value: "A feminine possessive pronoun. The owner of whatever was seen. The scene is on Mars. The backdrop is the Martian sky. 'Her' refers to the astronaut. An astronaut is a human trained to travel in space. The astronaut is currently on Mars.",
              weight: 1.0,
            },
          ],
          contribution: "previous token is 'her'; its representation has since been enriched by intervening layers",
        },
      },
      L5: {
        "verb-of-object": {
          kind: "content",
          inputRep: "The color blue. It modifies a thing. The thing belongs to her. 'Her' is the astronaut. An astronaut is a human trained to travel in space. The astronaut is currently on Mars.",
          query: "a verb acting on this thing",
          pulls: [
            {
              fromTokenIndex: IDX_SAW,
              key: "a verb whose object this is",
              value: "A past act of seeing with the eyes. Joins what came before — the previous word is 'and'. Happened on Mars. Mars is another planet in our solar system. Took place against the Martian sky.",
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
