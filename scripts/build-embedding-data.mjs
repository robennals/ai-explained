#!/usr/bin/env node

/**
 * Build script: exports raw GloVe 6B 50d vectors for curated nouns.
 *
 * Usage:
 *   node scripts/build-embedding-data.mjs <path-to-glove.6B.50d.txt>
 *
 * Download GloVe from: https://nlp.stanford.edu/data/glove.6B.zip → unzip → glove.6B.50d.txt
 *
 * Output: public/data/embeddings.json
 *   Format: { words: string[], vectors: number[][] }
 *   Each vector is the raw 50d GloVe vector for the corresponding word.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createReadStream } from "fs";
import { createInterface } from "readline";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");

// ─── Curated concrete nouns ─────────────────────────────────────────────────

const CONCRETE_NOUNS = [
  // Animals
  "dog", "cat", "bird", "fish", "horse", "cow", "pig", "sheep", "chicken", "duck",
  "goat", "rabbit", "mouse", "rat", "deer", "bear", "wolf", "fox", "lion", "tiger",
  "elephant", "monkey", "snake", "frog", "turtle", "whale", "dolphin", "shark",
  "eagle", "hawk", "owl", "parrot", "penguin", "butterfly", "bee", "ant", "spider",
  "crab", "lobster", "shrimp", "octopus", "jellyfish", "worm", "beetle", "fly",
  "mosquito", "bat", "squirrel", "raccoon", "moose", "buffalo", "zebra", "giraffe",
  "gorilla", "leopard", "panther", "jaguar", "cheetah", "hyena", "hippo", "rhino",
  "camel", "donkey", "pony", "goose", "swan", "crow", "raven", "sparrow", "robin",
  "pigeon", "dove", "flamingo", "peacock", "alligator", "crocodile", "lizard",
  "salamander", "toad", "snail", "slug", "clam", "oyster", "squid", "eel", "trout",
  "salmon", "tuna", "catfish", "goldfish", "puppy", "kitten", "lamb", "cub",
  "dragonfly", "scorpion", "hedgehog", "otter", "seal", "walrus", "pelican",
  "stork", "vulture", "woodpecker", "porcupine", "armadillo", "chinchilla",
  "hamster", "ferret", "mole", "badger", "bison", "elk", "gazelle", "antelope",
  "cobra", "python", "iguana", "gecko", "chameleon",
  "starfish", "seahorse", "swordfish", "piranha", "stingray", "manatee",
  "chick", "rooster", "hen", "stallion", "mare", "bull", "ram",

  // Food & Drink
  "apple", "banana", "orange", "grape", "strawberry", "blueberry", "cherry",
  "peach", "pear", "plum", "lemon", "lime", "watermelon", "melon", "mango",
  "pineapple", "coconut", "avocado", "tomato", "potato", "onion", "garlic",
  "pepper", "carrot", "corn", "rice", "wheat", "bread", "pasta", "noodle",
  "pizza", "burger", "sandwich", "taco", "sushi", "salad", "soup", "stew",
  "cake", "pie", "cookie", "chocolate", "candy", "cheese", "butter", "milk",
  "egg", "bacon", "sausage", "steak", "ham", "sugar", "salt", "honey",
  "coffee", "tea", "juice", "wine", "beer", "soda", "mushroom", "olive",
  "bean", "pea", "spinach", "lettuce", "cabbage", "broccoli", "celery",
  "cucumber", "almond", "walnut", "peanut", "cinnamon", "vanilla", "ginger",
  "mint", "cereal", "yogurt", "syrup", "pretzel", "donut", "muffin", "waffle",
  "pancake", "popcorn", "cracker", "biscuit", "bagel", "jam", "ketchup",
  "mustard", "vinegar", "cream", "gravy", "pudding", "custard",
  "raspberry", "cranberry", "apricot", "fig", "radish", "turnip",
  "beet", "squash", "zucchini", "eggplant", "artichoke", "asparagus",
  "chili", "paprika", "oregano", "basil", "thyme", "parsley",

  // Vehicles & Transport
  "car", "truck", "bus", "van", "motorcycle", "bicycle", "scooter", "train",
  "subway", "airplane", "helicopter", "jet", "rocket", "boat", "ship", "canoe",
  "kayak", "yacht", "ferry", "submarine", "taxi", "ambulance", "tractor",
  "skateboard", "wagon", "sled", "raft", "blimp", "gondola",
  "tricycle", "moped", "sailboat", "hovercraft", "chariot",

  // Buildings & Places
  "house", "apartment", "cabin", "cottage", "mansion", "palace", "castle",
  "church", "temple", "mosque", "cathedral", "school", "library", "museum",
  "theater", "hospital", "restaurant", "cafe", "bar", "hotel",
  "store", "shop", "mall", "market", "supermarket", "bakery", "pharmacy",
  "office", "factory", "warehouse", "garage", "barn", "shed",
  "stadium", "arena", "gym", "pool", "park", "garden", "zoo", "farm", "ranch",
  "airport", "station", "harbor", "dock", "lighthouse",
  "prison", "jail", "courthouse", "tower", "skyscraper", "bridge", "tunnel",
  "village", "island", "beach", "desert", "forest", "jungle", "mountain",
  "valley", "canyon", "river", "lake", "ocean", "pond", "creek", "waterfall",
  "cave", "cliff", "hill", "volcano", "glacier", "swamp", "marsh",
  "meadow", "prairie", "field", "oasis",

  // Household Objects & Furniture
  "chair", "table", "desk", "bed", "couch", "sofa", "bench", "stool",
  "shelf", "cabinet", "drawer", "closet", "wardrobe", "dresser",
  "door", "window", "wall", "floor", "ceiling", "roof", "stairs",
  "lamp", "candle", "lantern", "flashlight", "torch",
  "clock", "watch", "calendar", "compass",
  "mirror", "frame", "painting", "statue",
  "key", "lock", "chain", "rope", "wire", "cable",
  "bucket", "barrel", "basket", "box", "bag", "suitcase", "backpack",
  "bottle", "jar", "cup", "mug", "glass", "plate", "bowl", "pot", "pan",
  "fork", "spoon", "spatula", "ladle", "whisk",
  "broom", "mop", "sponge", "brush", "towel", "rag",
  "blanket", "pillow", "mattress", "curtain", "carpet", "rug",
  "umbrella", "tent", "flag", "banner", "sign",
  "vase", "candelabra", "chandelier", "coaster",
  "fan", "heater", "oven", "stove", "microwave", "refrigerator",
  "toaster", "blender", "mixer", "dishwasher",
  "sink", "bathtub", "shower", "toilet", "faucet",
  "iron", "vacuum", "clothespin",

  // Tools & Hardware
  "hammer", "nail", "screw", "wrench", "pliers", "drill",
  "saw", "axe", "shovel", "rake", "hoe", "pickaxe",
  "screwdriver", "crowbar", "chisel", "clamp", "vice",
  "ladder", "wheelbarrow", "hose",
  "tape", "glue", "sandpaper", "bolt", "nut",

  // Weapons & Armor
  "knife", "sword", "shield", "armor", "helmet",
  "spear", "bow", "arrow", "dagger", "mace", "cannon",
  "rifle", "pistol", "gun", "bullet", "bomb",
  "grenade", "missile", "tank", "fortress",

  // Technology & Electronics
  "phone", "computer", "laptop", "tablet", "keyboard", "screen",
  "camera", "microphone", "speaker", "radio", "television",
  "printer", "scanner", "projector", "satellite",
  "battery", "plug", "switch", "antenna", "router",
  "robot", "drone", "calculator",

  // Writing & Office
  "pen", "pencil", "marker", "crayon", "chalk", "eraser",
  "paper", "envelope", "stamp", "notebook", "book", "magazine",
  "newspaper", "map", "chart", "globe", "ruler", "stapler",
  "clipboard", "folder", "binder",

  // Music & Instruments
  "piano", "guitar", "violin", "drum", "flute", "trumpet", "saxophone",
  "cello", "harp", "banjo", "ukulele", "accordion", "harmonica",
  "clarinet", "trombone", "tuba", "oboe", "cymbal", "tambourine",
  "xylophone", "bell", "whistle", "horn", "organ",

  // Clothing & Accessories
  "shirt", "pants", "jeans", "shorts", "skirt", "dress", "suit", "coat",
  "jacket", "sweater", "vest", "hoodie",
  "hat", "cap", "crown", "veil", "scarf", "tie", "belt",
  "shoe", "boot", "sandal", "slipper", "sock",
  "glove", "mitten",
  "ring", "necklace", "bracelet", "earring", "brooch",
  "glasses", "sunglasses", "mask", "wig",
  "purse", "wallet", "watch",
  "uniform", "robe", "gown", "apron",
  "ribbon", "lace", "silk", "cotton", "wool", "leather",
  "diaper", "bib", "bonnet",

  // Sports & Games
  "ball", "bat", "racket", "net", "goal", "hoop",
  "football", "basketball", "baseball", "soccer", "tennis", "golf",
  "hockey", "volleyball", "cricket", "boxing",
  "surfboard", "snowboard",
  "chess", "checkers", "dice", "puzzle", "maze",
  "trophy", "medal", "frisbee", "kite", "trampoline",
  "puck", "dart", "javelin", "discus",

  // Toys & Play
  "toy", "doll", "puppet", "teddy", "lego", "balloon",
  "marble", "top", "seesaw", "slide", "swing",

  // Nature & Weather
  "sun", "moon", "star", "planet", "comet", "meteor",
  "sky", "cloud", "rain", "snow", "hail", "fog", "mist", "dew",
  "wind", "storm", "thunder", "lightning", "tornado", "hurricane",
  "rainbow", "sunrise", "sunset",
  "tree", "bush", "flower", "grass", "leaf", "root", "branch", "trunk",
  "seed", "berry", "acorn", "pine", "oak", "palm",
  "rose", "daisy", "tulip", "sunflower", "lily", "orchid", "violet",
  "vine", "moss", "fern", "weed", "ivy", "cactus",
  "rock", "stone", "pebble", "boulder", "gravel", "sand", "mud", "clay",
  "soil", "dirt", "dust",
  "diamond", "gold", "silver", "copper", "bronze", "steel",
  "crystal", "gem", "pearl", "ruby", "emerald", "sapphire",
  "coal", "oil", "gas",
  "fire", "flame", "smoke", "ash", "ember",
  "wave", "tide", "flood", "iceberg", "coral",
  "ice",

  // Body Parts
  "head", "face", "eye", "ear", "nose", "mouth", "lip", "tongue", "tooth",
  "chin", "cheek", "forehead", "jaw", "neck", "throat",
  "shoulder", "arm", "elbow", "wrist", "hand", "finger", "thumb", "fist",
  "chest", "stomach", "belly", "waist", "hip", "back", "spine",
  "leg", "knee", "ankle", "foot", "toe", "heel",
  "skin", "bone", "muscle", "blood", "brain", "heart", "lung", "liver",
  "hair", "beard", "nail", "skull", "rib",

  // People & Roles
  "baby", "child", "boy", "girl", "teenager", "man", "woman",
  "mother", "father", "parent", "son", "daughter", "brother", "sister",
  "grandmother", "grandfather", "uncle", "aunt", "cousin",
  "husband", "wife", "bride", "groom",
  "friend", "neighbor", "stranger",
  "king", "queen", "prince", "princess", "knight",
  "doctor", "nurse", "surgeon", "dentist",
  "teacher", "professor", "student",
  "lawyer", "judge", "detective", "officer", "soldier", "sailor",
  "pilot", "driver", "captain",
  "artist", "painter", "musician", "singer", "dancer",
  "actor", "director", "writer", "author", "poet",
  "chef", "baker", "waiter", "bartender",
  "farmer", "gardener", "carpenter", "plumber", "electrician",
  "engineer", "scientist",
  "priest", "monk", "nun",
  "wizard", "witch", "pirate", "cowboy", "clown", "magician",
  "hero", "villain", "warrior", "thief", "spy",

  // Abstract but guessable
  "shadow", "light",
  "music", "song", "dance",
  "dream", "nightmare",
  "ghost", "angel", "devil", "fairy", "dragon", "unicorn",
  "monster", "zombie", "vampire", "werewolf", "mermaid", "giant",
  "treasure",

  // Miscellaneous concrete objects
  "wheel", "gear", "lever", "spring", "pump",
  "photograph", "film", "movie", "cartoon",
  "letter", "word", "sentence",
  "gift", "prize",
  "coin", "dollar", "penny", "nickel", "dime",
  "ticket", "coupon", "receipt",
  "cigarette", "cigar", "pipe",
  "match", "lighter",
  "needle", "thread", "scissors", "pin", "button", "zipper",
  "parachute", "anchor", "telescope", "microscope",
  "thermometer", "scale", "magnet", "lens",
  "pillar", "arch", "dome", "column",
  "fence", "gate", "hedge",
  "cross", "badge",
  "feather", "fur", "shell", "tusk", "claw", "fang",
  "web", "nest", "hive", "cocoon", "den", "burrow",
  "fossil",
  "cradle", "coffin", "grave", "tombstone",
  "altar", "throne", "pedestal",
];

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const glovePath = process.argv[2];

  if (!glovePath) {
    console.error("Usage: node scripts/build-embedding-data.mjs <path-to-glove.6B.50d.txt>");
    console.error("\nDownload from: https://nlp.stanford.edu/data/glove.6B.zip");
    process.exit(1);
  }

  // ─── Load GloVe vectors ──────────────────────────────────────────────
  console.log("Reading GloVe vectors...");
  const gloveMap = new Map();

  const rl = createInterface({ input: createReadStream(resolve(glovePath)), crlfDelay: Infinity });
  let isFirstLine = true;
  for await (const line of rl) {
    if (isFirstLine) {
      isFirstLine = false;
      // Detect word2vec header
      const hdrParts = line.split(" ");
      if (hdrParts.length === 2 && !isNaN(Number(hdrParts[0])) && !isNaN(Number(hdrParts[1]))) {
        console.log(`  Header: ${line} (word2vec format)`);
        continue;
      }
    }
    const idx = line.indexOf(" ");
    if (idx < 0) continue;
    const word = line.slice(0, idx);
    const vec = line.slice(idx + 1).split(" ").map(Number);
    if (vec.length > 0) gloveMap.set(word, vec);
  }
  console.log(`  Loaded ${gloveMap.size} vectors (dim=${gloveMap.get("the")?.length || "?"})`);

  // ─── Build word list from curated nouns ──────────────────────────────
  const wordSet = new Set();
  const missing = [];
  for (const w of CONCRETE_NOUNS) {
    if (gloveMap.has(w)) {
      wordSet.add(w);
    } else {
      missing.push(w);
    }
  }

  // Supplement with frequency nouns
  const NOUN_LIST_PATH = process.argv[3] || resolve("/tmp/top_english_nouns_lower_10000.txt");
  try {
    const nounListRaw = readFileSync(NOUN_LIST_PATH, "utf8");
    const frequencyNouns = nounListRaw.trim().split("\n").map((w) => w.trim().toLowerCase());

    const ABSTRACT_WORDS = new Set([
      "time", "times", "year", "years", "day", "days", "week", "weeks", "month", "months",
      "age", "ages", "era", "period", "century", "decade", "moment", "hour", "hours",
      "way", "ways", "life", "world", "state", "states", "work", "system", "part", "parts",
      "number", "case", "group", "area", "line", "form", "type", "level", "rate", "kind",
      "sort", "lot", "bit", "side", "thing", "things", "point", "end", "set", "use",
      "people", "men", "women", "children", "family", "families", "community", "society",
      "government", "country", "countries", "nation", "nations",
      "law", "laws", "policy", "issue", "issues", "problem", "problems", "question",
      "right", "rights", "power", "effect", "effects", "result", "results",
      "change", "changes", "fact", "facts", "idea", "ideas", "reason", "reasons",
      "process", "program", "plan", "plans", "model", "example", "need", "needs",
      "place", "role", "interest", "value", "values", "force", "action", "course",
      "sense", "order", "source", "experience", "view", "matter", "mind", "term",
      "terms", "class", "basis", "practice", "approach", "risk", "range", "control",
      "support", "focus", "report", "research", "study", "studies", "analysis",
      "evidence", "theory", "data", "information", "knowledge", "education",
      "development", "history", "language", "structure", "position", "situation",
      "condition", "conditions", "relationship", "health", "growth", "trade",
      "response", "income", "production", "performance", "design", "press",
      "method", "access", "market", "service", "services", "management", "cost",
      "industry", "technology", "economy", "strategy", "success", "standard",
      "standards", "impact", "decision", "authority", "attention", "presence",
      "movement", "difference", "opportunity", "threat", "supply", "demand",
      "capacity", "respect", "ability", "figure", "stuff", "material",
      "means", "share", "progress", "challenge", "status", "loss", "competition",
      "debate", "claim", "argument", "step", "measure", "pattern", "chance",
      "lack", "manner", "style", "scale", "amount", "series", "species",
      "energy", "release", "nature", "quality", "price", "effort", "deal",
      "vision", "leadership", "version", "spirit", "trust", "crisis", "opinion",
      "concept", "task", "reform", "mission", "honor", "tradition", "balance",
      "justice", "freedom", "pleasure", "conflict", "doubt", "fear", "anger",
      "love", "hate", "faith", "hope", "truth", "peace", "war", "battle",
      "thought", "thoughts", "feeling", "feelings", "belief", "beliefs",
      "memory", "memories", "choice", "choices", "speech", "crime", "violence",
    ]);

    const ABSTRACT_SUFFIXES = [
      "tion", "sion", "ness", "ment", "ity", "ence", "ance", "ism", "isms",
      "ous", "ive", "ful", "less", "able", "ible", "ical", "ally",
      "ology", "ography",
    ];

    function isPlural(word) {
      if (word.endsWith("ies") && gloveMap.has(word.slice(0, -3) + "y")) return true;
      if (word.endsWith("es") && word.length > 4 && gloveMap.has(word.slice(0, -2))) return true;
      if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3 && gloveMap.has(word.slice(0, -1))) return true;
      return false;
    }

    const BLOCKED_WORDS = new Set([
      "moscow", "jerusalem", "baghdad", "kabul", "tehran", "beirut", "delhi",
      "iraq", "iran", "syria", "afghanistan", "pakistan", "gaza", "los",
      "tokyo", "japan", "china", "india", "london", "paris", "berlin", "rome",
      "africa", "europe", "asia", "america", "mexico", "canada", "spain",
      "city", "town", "east", "west", "north", "south", "street", "avenue",
      "county", "district", "province", "borough", "suburb",
      "gen", "col", "sgt", "capt", "lt", "cpl", "pvt", "maj",
      "commander", "colonel", "lieutenant", "sergeant", "battalion", "regiment",
      "infantry", "artillery", "assault", "attack", "front",
      "carcinoma", "tumor", "lymph", "lesion", "syndrome", "enzyme",
      "coefficient", "petroleum", "dioxide", "celsius", "fahrenheit",
      "electron", "voltage", "neutron", "proton", "nucleus",
      "nato", "opec", "hiv", "aids", "dna", "rna",
      "buddha", "allah", "jesus", "christ", "muhammad",
      "anna", "mary", "john", "james", "william", "george", "david", "robert",
      "wildlife", "aircraft", "passenger",
      "software", "site", "project", "shot", "mount", "flight", "plane",
      "gene", "cell", "dose", "mass", "spread", "crop", "feed", "cattle",
      "cent", "sum", "count", "match", "post", "plot", "spot", "strip",
      "block", "frame", "draft", "stroke", "pitch", "span", "grade", "code",
      "sector", "segment", "fraction", "compound", "formula", "equation",
      "acre", "mile", "meter", "litre", "gram", "inch", "yard",
      "domain", "signal", "circuit", "output", "input", "volume",
      "suicide", "terror", "police", "military", "army", "navy", "campaign",
      "disaster", "internet", "sodium", "diameter", "band", "ministry",
      "ward", "panel", "bid", "loan", "debt", "treaty", "coalition",
      "regime", "rebel", "troop", "patrol", "raid", "siege", "invasion",
      "refugee", "militia", "guerrilla", "insurgent",
      "census", "poll", "vote", "election", "parliament", "congress",
      "bureau", "agency", "commission", "council", "committee",
      "clause", "statute", "amendment", "decree", "mandate",
      "profit", "revenue", "budget", "deficit", "surplus", "subsidy",
      "import", "export", "tariff", "quota", "sanction",
      "fossil", "mineral", "oxygen", "hydrogen", "carbon", "nitrogen",
      "calcium", "potassium", "sulfur", "phosphorus", "chlorine",
      "cir", "fraud", "resource", "square", "crew", "arrest", "murder",
      "artery", "tube", "land", "kitchen", "basin", "mission",
      "cargo", "fleet", "escort", "convoy", "vessel",
      "victim", "suspect", "witness", "trial", "verdict",
      "pact", "accord", "summit",
      "terrain", "habitat", "ecosystem",
      "percent", "death", "shaft", "tourist", "dam",
      "negro", "slave", "slaughter",
      "israel", "iraq", "korea", "vietnam", "taiwan", "cuba", "brazil",
      "egypt", "turkey", "greece", "norway", "sweden", "finland",
      "germany", "france", "italy", "russia", "ukraine", "poland",
      "australia", "zealand", "ireland", "scotland", "wales", "england",
      "california", "texas", "florida", "york", "jersey",
      "january", "february", "march", "april", "may", "june", "july",
      "august", "september", "october", "november", "december",
      "united", "republic", "protest", "failure", "future", "leader",
      "property", "holy", "device",
      "rape", "slavery", "hatred", "urine", "evil", "conquest", "dynasty",
      "goddess", "emperor", "prophet", "tribe", "lord", "saint",
      "res", "tel", "intake", "interface", "insulin", "magnitude",
      "collapse", "breach", "item", "user", "unit", "diet",
      "royal", "marine", "academic", "counsel", "graduate", "campus",
      "accuracy", "diagram", "video", "noise", "sound", "horror",
      "triumph", "universe", "emergency", "rebellion", "luther",
      "ambassador", "attorney", "capital", "paradise", "folk", "animal",
      "sphere", "automobile", "fabric", "cloth", "meat", "fruit",
      "weapon", "furniture", "vehicle",
      "neighbourhood", "neighborhood", "title", "stand", "angle",
      "filter", "god", "catherine", "jose", "peter", "edward",
      "matthew", "jacob", "smith", "jackson", "walker", "jefferson",
      "indiana", "pioneer", "sir", "kate", "java",
      "peninsula", "continent", "hemisphere", "equator",
      "sex", "intercourse", "abuse", "racism", "drug", "breast", "hell",
    ]);

    const MAX_FREQ_NOUNS = 4000;
    let freqAdded = 0;
    let freqConsidered = 0;
    for (const noun of frequencyNouns) {
      if (freqConsidered >= MAX_FREQ_NOUNS) break;
      freqConsidered++;
      if (noun.length < 3) continue;
      if (!gloveMap.has(noun)) continue;
      if (ABSTRACT_WORDS.has(noun)) continue;
      if (BLOCKED_WORDS.has(noun)) continue;
      if (noun.includes(" ") || noun.includes("-") || noun.includes(".")) continue;
      if (isPlural(noun)) continue;
      if (noun.length > 6 && ABSTRACT_SUFFIXES.some((s) => noun.endsWith(s))) continue;
      if (noun.endsWith("ing") && noun.length > 5) continue;
      if (!wordSet.has(noun)) {
        wordSet.add(noun);
        freqAdded++;
      }
    }
    console.log(`\nWord list: ${wordSet.size - freqAdded} curated + ${freqAdded} from frequency list = ${wordSet.size} total`);
  } catch {
    console.log(`\nWord list: ${wordSet.size} curated nouns (frequency list not found at ${NOUN_LIST_PATH})`);
  }

  if (missing.length > 0) {
    console.log(`  Missing from GloVe: ${missing.join(", ")}`);
  }

  const words = [...wordSet];

  // ─── Export raw 50d vectors ────────────────────────────────────────────
  const vectors = words.map((w) => {
    const v = gloveMap.get(w);
    return v.map((x) => Math.round(x * 10000) / 10000);
  });

  const output = { words, vectors };
  const outPath = resolve(PROJECT_ROOT, "public/data/embeddings.json");
  const json = JSON.stringify(output);
  writeFileSync(outPath, json, "utf8");

  const sizeKB = (json.length / 1024).toFixed(0);
  console.log(`\nWrote ${outPath}`);
  console.log(`  ${words.length} words, ${vectors[0].length}d vectors`);
  console.log(`  Raw size: ${sizeKB} KB`);

  // Quick sanity check: nearest neighbors for "dog"
  function cosineSim(a, b) {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] ** 2; nb += b[i] ** 2; }
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
  }

  const dogIdx = words.indexOf("dog");
  if (dogIdx >= 0) {
    const dogVec = vectors[dogIdx];
    const sims = words.map((w, i) => ({ word: w, sim: cosineSim(dogVec, vectors[i]) }));
    sims.sort((a, b) => b.sim - a.sim);
    console.log(`\nNearest to "dog": ${sims.slice(1, 11).map(s => `${s.word}(${s.sim.toFixed(3)})`).join(", ")}`);
  }

  const kingIdx = words.indexOf("king");
  const manIdx = words.indexOf("man");
  const womanIdx = words.indexOf("woman");
  if (kingIdx >= 0 && manIdx >= 0 && womanIdx >= 0) {
    const kv = gloveMap.get("king");
    const mv = gloveMap.get("man");
    const wv = gloveMap.get("woman");
    const analogy = kv.map((v, i) => v - mv[i] + wv[i]);
    const sims = words.map((w, i) => ({ word: w, sim: cosineSim(analogy, vectors[i]) }));
    sims.sort((a, b) => b.sim - a.sim);
    console.log(`king - man + woman: ${sims.slice(0, 5).map(s => s.word).join(", ")}`);
  }
}

main();
