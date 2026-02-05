export interface Chapter {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  prerequisites: number[];
  description: string;
}

export const chapters: Chapter[] = [
  {
    id: 1,
    slug: "01-computation",
    title: "What Is Computation?",
    subtitle: "Gates, thresholds, and the seed of intelligence",
    prerequisites: [],
    description:
      "Boolean logic, gates, why addition and multiplication alone can't compute, universality of NAND, fuzzy logic as a bridge to continuous computation.",
  },
  {
    id: 2,
    slug: "02-neurons",
    title: "Neurons and Perceptrons",
    subtitle: "Fuzzy logic gates that learn their own rules",
    prerequisites: [1],
    description:
      "A neuron is a fuzzy logic gate that learned its own truth table. The XOR problem and why a single line can't solve everything.",
  },
  {
    id: 3,
    slug: "03-activation-functions",
    title: "Activation Functions",
    subtitle: "The nonlinearity that makes depth matter",
    prerequisites: [2],
    description:
      "Why stacking linear layers is pointless, sigmoid's vanishing gradient, ReLU's dead neurons, and Swish's surprising fix.",
  },
  {
    id: 4,
    slug: "04-layers-and-networks",
    title: "Layers and Networks",
    subtitle: "Depth vs width, and why hierarchy wins",
    prerequisites: [2, 3],
    description:
      "Universal approximation, the exponential advantage of depth, and what layers actually learn.",
  },
  {
    id: 5,
    slug: "05-matrix-math",
    title: "Matrix Math and Linear Transformations",
    subtitle: "Neural networks as geometry",
    prerequisites: [4],
    description:
      "Every layer is a geometric transformation. Training is learning which rotation, scaling, and shearing to apply.",
  },
  {
    id: 6,
    slug: "06-training",
    title: "Training, Gradient Descent, Backpropagation",
    subtitle: "Rolling downhill in a million dimensions",
    prerequisites: [3, 4, 5],
    description:
      "Gradient descent, saddle points vs local minima, learning rate, momentum, Adam, and flat vs sharp minima.",
  },
  {
    id: 7,
    slug: "07-loss-functions",
    title: "Loss Functions",
    subtitle: "Defining what 'wrong' means",
    prerequisites: [6],
    description:
      "MSE, cross-entropy, Huber loss. The loss function shapes what the model learns. Cross-entropy as compression.",
  },
  {
    id: 8,
    slug: "08-regularization",
    title: "Regularization and Generalization",
    subtitle: "Why perfect training is perfectly terrible",
    prerequisites: [6, 7],
    description:
      "Overfitting, L1/L2 regularization, dropout. Why deliberately handicapping the model makes it better.",
  },
  {
    id: 9,
    slug: "09-embeddings",
    title: "Embeddings and Vector Spaces",
    subtitle: "The geometry of meaning",
    prerequisites: [5, 6],
    description:
      "From one-hot to learned representations. Word analogies, semantic structure, and rotatable dimensions of meaning.",
  },
  {
    id: 10,
    slug: "10-recurrent",
    title: "Recurrent Architectures",
    subtitle: "Memory, forgetting, and the telephone game",
    prerequisites: [4, 9],
    description:
      "RNNs, LSTMs, vanishing gradients through time, and why memory decays. Historical context for attention.",
  },
  {
    id: 11,
    slug: "11-attention-transformers",
    title: "Attention and Transformers",
    subtitle: "The architecture that changed everything",
    prerequisites: [5, 9, 10],
    description:
      "Self-attention, Q/K/V, position encoding, multi-head attention. Why transformers replaced RNNs.",
  },
  {
    id: 12,
    slug: "12-tokenization",
    title: "Tokenization",
    subtitle: "The ugly plumbing that shapes what models see",
    prerequisites: [9],
    description:
      "BPE, token artifacts, why LLMs can't do arithmetic, cross-language efficiency. Tokenization as compression.",
  },
  {
    id: 13,
    slug: "13-pretraining-finetuning",
    title: "Pre-training and Fine-tuning",
    subtitle: "Learning everything by predicting the next word",
    prerequisites: [6, 11, 12],
    description:
      "Next-token prediction, transfer learning, few-shot magic. Pre-training as education, fine-tuning as specialization.",
  },
  {
    id: 14,
    slug: "14-scaling-laws",
    title: "Scaling Laws",
    subtitle: "Smooth trends, sudden capabilities",
    prerequisites: [13],
    description:
      "Power laws, Chinchilla scaling, emergence. Predictable loss curves, unpredictable capability jumps.",
  },
  {
    id: 15,
    slug: "15-rlhf-alignment",
    title: "RLHF and Alignment",
    subtitle: "Teaching AI what humans actually want",
    prerequisites: [6, 13],
    description:
      "Reward models, Goodhart's Law, reward hacking, KL penalties, the alignment tax.",
  },
  {
    id: 16,
    slug: "16-modern-architectures",
    title: "Modern Architectures",
    subtitle: "GPT, BERT, T5, and Mixture of Experts",
    prerequisites: [11, 13, 14],
    description:
      "Attention masks, causal vs bidirectional, encoder-decoder, sparse routing, temperature and sampling.",
  },
  {
    id: 17,
    slug: "17-image-generation",
    title: "Image Generation",
    subtitle: "Creating images from noise and numbers",
    prerequisites: [6, 9, 16],
    description:
      "Autoencoders, VAEs, diffusion models. Train real toy models in the browser.",
  },
];

export function getChapter(slug: string): Chapter | undefined {
  return chapters.find((c) => c.slug === slug);
}

export function getAdjacentChapters(slug: string): {
  prev: Chapter | undefined;
  next: Chapter | undefined;
} {
  const idx = chapters.findIndex((c) => c.slug === slug);
  return {
    prev: idx > 0 ? chapters[idx - 1] : undefined,
    next: idx < chapters.length - 1 ? chapters[idx + 1] : undefined,
  };
}
