export interface Chapter {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  prerequisites: number[];
  description: string;
  ready?: boolean;
  section?: "appendix";
}

export const chapters: Chapter[] = [
  {
    id: 1,
    slug: "computation",
    title: "Everything Is Numbers",
    subtitle: "Computation",
    prerequisites: [],
    description:
      "Text, images, and sound are all numbers. Thinking is a function. Models are machines with knobs. The challenge: find the right settings.",
    ready: true,
  },
  {
    id: 2,
    slug: "optimization",
    title: "The Power of Incremental Improvement",
    subtitle: "Optimization",
    prerequisites: [1],
    description:
      "Evolution, A/B testing, and gradient descent are all the same algorithm. The secret to building complex things: small changes, tested against reality, kept or discarded.",
    ready: true,
  },
  {
    id: 3,
    slug: "neurons",
    title: "Building a Brain",
    subtitle: "Neural networks",
    prerequisites: [2],
    description:
      "A neuron is a smooth logic gate. Stack them in layers and they can compute anything — and backpropagation lets you train all the weights at once.",
    ready: true,
  },
  {
    id: 4,
    slug: "vectors",
    title: "Describing the World with Numbers",
    subtitle: "Vectors",
    prerequisites: [3],
    description:
      "A vector is just a list of numbers — but lists of numbers can describe position, color, animals, and anything else. The dot product measures similarity, and a single neuron turns out to be a pattern detector built from one.",
    ready: true,
  },
  {
    id: 5,
    slug: "embeddings",
    title: "From Words to Meanings",
    subtitle: "Embeddings",
    prerequisites: [4],
    description:
      "From one-hot to learned representations. Word analogies, semantic structure, and the geometry of meaning.",
    ready: true,
  },
  {
    id: 6,
    slug: "next-word-prediction",
    title: "Understanding by Predicting",
    subtitle: "Next-word prediction",
    prerequisites: [5],
    description:
      "If you can predict the next word accurately, you must understand grammar, facts, and common sense. From n-grams to neural networks — prediction REQUIRES understanding.",
    ready: true,
  },
  {
    id: 7,
    slug: "attention",
    title: "Paying Attention",
    subtitle: "Attention",
    prerequisites: [6],
    description:
      "Attention — letting each word choose which other words to focus on — is the breakthrough behind modern AI. Built from things you already know: embeddings, dot products, and neural networks.",
    ready: true,
  },
  {
    id: 8,
    slug: "positions",
    title: "Where Am I?",
    subtitle: "Positional encoding",
    prerequisites: [7],
    description:
      "Attention is position-blind — it has no idea where words are in a sentence. Distance penalties, rotation tricks, and the elegant geometry of RoPE fix this.",
    ready: true,
  },
  {
    id: 9,
    slug: "transformers",
    title: "One Architecture to Rule Them All",
    subtitle: "Transformers",
    prerequisites: [8],
    description:
      "The transformer wires attention and neural networks together. Trained only to predict the next word, it learns grammar, narrative, and common sense — from nothing but prediction.",
    ready: true,
  },
  {
    id: 10,
    slug: "matrix-math",
    title: "Thinking by Rotating",
    subtitle: "Matrix math",
    prerequisites: [4],
    description:
      "Every layer is a transformation in space — a rotation, a stretch, a fold. The geometry of high-dimensional space is how neural networks reshape vectors of meaning.",
  },
  {
    id: 11,
    slug: "training",
    title: "Why Training Almost Doesn't Work",
    subtitle: "Making training work",
    prerequisites: [3],
    description:
      "Plain gradient descent on a deep network barely works. Activation functions (ReLU, Swish), regularization, dropout, learning rate schedules, and Adam are the hard-won tricks that make modern training possible.",
  },
  {
    id: 12,
    slug: "mixture-of-experts",
    title: "Only Wake the Specialists You Need",
    subtitle: "Mixture of experts",
    prerequisites: [9],
    description:
      "A router sends each question to specialist sub-networks. A trillion parameters, but only a fraction active per question. Smarter without getting slower.",
  },
  {
    id: 13,
    slug: "long-context",
    title: "Remembering a Million Words",
    subtitle: "Long context",
    prerequisites: [9],
    description:
      "Attention scales as the square of the input — so how do models read entire books? KV caching, sparse attention, and position scaling tricks stretch memory from sentences to libraries.",
  },
  {
    id: 14,
    slug: "reinforcement-learning",
    title: "Learning from Experience",
    subtitle: "Reinforcement learning",
    prerequisites: [2],
    description:
      "What if you don't have right answers, only rewards? RL learns from trial, error, and consequence — the algorithm behind robots that walk, agents that play games, and models that improve themselves.",
  },
  {
    id: 15,
    slug: "self-play",
    title: "Getting Better by Beating Yourself",
    subtitle: "Self-play",
    prerequisites: [14],
    description:
      "AlphaZero mastered chess and Go without ever seeing a human game — by playing itself, millions of times. The same idea now teaches reasoning models to think.",
  },
  {
    id: 16,
    slug: "reasoning",
    title: "Thinking by Talking to Yourself",
    subtitle: "Reasoning models",
    prerequisites: [9, 14],
    description:
      "Standard LLMs answer in one shot with no scratch paper. Reasoning models use their own output as working memory, talking through problems before answering — and get dramatically smarter.",
  },
  {
    id: 17,
    slug: "alignment",
    title: "Teaching AI Right from Wrong",
    subtitle: "Alignment",
    prerequisites: [9, 14],
    description:
      "RLHF transforms a text completer into a helpful assistant. But optimize too hard and the model learns to tell you what you want to hear, not what's true.",
  },
  {
    id: 18,
    slug: "synthetic-data",
    title: "Models Teaching Models",
    subtitle: "Distillation and synthetic data",
    prerequisites: [9],
    description:
      "Train a small model to mimic a big one. Train a strong model on a weaker one's mistakes. Models can train models — and sometimes the student outgrows the teacher.",
  },
  {
    id: 19,
    slug: "vision",
    title: "Teaching Machines to See",
    subtitle: "Image comprehension",
    prerequisites: [9],
    description:
      "Cut an image into patches, treat them like tokens, feed them to a transformer. CLIP, ViT, and the trick that lets the same architecture read text and see pictures.",
  },
  {
    id: 20,
    slug: "image-generation",
    title: "Drawing Pictures",
    subtitle: "Image generation",
    prerequisites: [9],
    description:
      "Diffusion models start with pure noise and gradually paint a picture. Latent space is a map of all possible images — and you can walk between any two of them.",
  },
  {
    id: 21,
    slug: "audio",
    title: "Listening, Speaking, and Singing",
    subtitle: "Audio",
    prerequisites: [9],
    description:
      "Sound is just numbers over time. Whisper transcribes any language. Voice cloning copies you from seconds. Music models compose. Audio fits into AI the same way text does — with surprises along the way.",
  },
  {
    id: 22,
    slug: "agents",
    title: "Getting Things Done",
    subtitle: "Agents and tool use",
    prerequisites: [9, 16],
    description:
      "A model that just predicts text is a chatbot. A model that picks tools, runs loops, and uses a computer is an agent. From talker to doer.",
  },
  {
    id: 23,
    slug: "context",
    title: "Getting the Right Information",
    subtitle: "Context management",
    prerequisites: [5, 9],
    description:
      "A model's intelligence depends as much on what you put in front of it as on its weights. Retrieval, prompt construction, memory systems — the art of feeding the right facts at the right time.",
  },
  {
    id: 24,
    slug: "appendix-pytorch",
    title: "PyTorch from Scratch",
    subtitle: "A hands-on introduction to the code behind AI",
    prerequisites: [],
    description:
      "Install PyTorch, write your first tensor operations, and train a simple neural network. A standalone guide for readers who want to go from understanding to building.",
    section: "appendix",
    ready: true,
  },
];

export function getChapter(slug: string): Chapter | undefined {
  return chapters.find((c) => c.slug === slug);
}

export function getMainChapters(): Chapter[] {
  return chapters.filter((c) => !c.section);
}

export function getAppendixChapters(): Chapter[] {
  return chapters.filter((c) => c.section === "appendix");
}

export function getAppendixLabel(chapter: Chapter): string {
  const appendixes = getAppendixChapters();
  const idx = appendixes.findIndex((c) => c.id === chapter.id);
  return `A${idx + 1}`;
}

export function getAdjacentChapters(slug: string): {
  prev: Chapter | undefined;
  next: Chapter | undefined;
} {
  const chapter = chapters.find((c) => c.slug === slug);
  // Navigate within the same section (main or appendix)
  const pool = chapter?.section === "appendix" ? getAppendixChapters() : getMainChapters();
  const readyPool = pool.filter((c) => c.ready);
  const idx = readyPool.findIndex((c) => c.slug === slug);
  return {
    prev: idx > 0 ? readyPool[idx - 1] : undefined,
    next: idx < readyPool.length - 1 ? readyPool[idx + 1] : undefined,
  };
}
