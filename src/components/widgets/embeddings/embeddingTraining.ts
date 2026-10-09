import { softmax } from "../attention/toyMath";
import { dotProduct } from "./embeddingUtils";

export type Vec2 = [number, number];

/** A sentence with a blank at the end, and how often each word fills the blank. */
export interface TrainingSentence {
  id: string;
  /** The sentence up to the blank, e.g. "I like to pet my". */
  text: string;
  /** Relative count per word. Only the proportions matter; missing words count as 0. */
  counts: Record<string, number>;
}

export interface TrainingData {
  words: string[];
  sentences: TrainingSentence[];
}

/** Everything the training adjusts. */
export interface EmbeddingModel {
  wordVectors: Record<string, Vec2>;
  /** One extra number per word: how likely it is in general, whatever the sentence. */
  wordCommonness: Record<string, number>;
  sentenceVectors: Record<string, Vec2>;
}

const START_SPREAD = 0.3;

export function randomVector(random: () => number = Math.random): Vec2 {
  return [(random() - 0.5) * START_SPREAD, (random() - 0.5) * START_SPREAD];
}

export function randomModel(
  data: TrainingData,
  random: () => number = Math.random
): EmbeddingModel {
  const model: EmbeddingModel = {
    wordVectors: {},
    wordCommonness: {},
    sentenceVectors: {},
  };
  for (const word of data.words) {
    model.wordVectors[word] = randomVector(random);
    model.wordCommonness[word] = 0;
  }
  for (const sentence of data.sentences) {
    model.sentenceVectors[sentence.id] = randomVector(random);
  }
  return model;
}

/**
 * The share of the time each word really fills the blank, in the order of
 * `words`. Returns null when no word has a count, since there is nothing to learn from.
 */
export function realShares(
  sentence: TrainingSentence,
  words: string[]
): number[] | null {
  const counts = words.map((word) => Math.max(0, sentence.counts[word] ?? 0));
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  return counts.map((count) => count / total);
}

/** The model's guess at the share for each word, in the order of `words`. */
export function predictedShares(
  model: EmbeddingModel,
  sentenceId: string,
  words: string[]
): number[] {
  if (words.length === 0) return [];
  const sentenceVector = model.sentenceVectors[sentenceId];
  const scores = words.map(
    (word) => dotProduct(sentenceVector, model.wordVectors[word]) + model.wordCommonness[word]
  );
  return softmax(scores);
}

/**
 * How far the guesses for one sentence are from the real shares (KL divergence).
 * Zero means a perfect match.
 */
export function sentenceError(real: number[], predicted: number[]): number {
  let error = 0;
  for (let i = 0; i < real.length; i++) {
    if (real[i] > 0) error += real[i] * Math.log(real[i] / Math.max(predicted[i], 1e-12));
  }
  return error;
}

export function totalError(model: EmbeddingModel, data: TrainingData): number {
  let error = 0;
  for (const sentence of data.sentences) {
    const real = realShares(sentence, data.words);
    if (!real) continue;
    error += sentenceError(real, predictedShares(model, sentence.id, data.words));
  }
  return error;
}

/**
 * One step of gradient descent over every sentence. Returns a new model.
 *
 * For each sentence and word, `predicted − real` says how much the model
 * over-guessed that word. An over-guessed word and its sentence are pushed
 * apart; an under-guessed word and its sentence are pulled together.
 */
export function trainStep(
  model: EmbeddingModel,
  data: TrainingData,
  learningRate: number
): EmbeddingModel {
  const { words } = data;
  const wordGradients = words.map((): Vec2 => [0, 0]);
  const commonnessGradients = words.map(() => 0);
  const sentenceVectors = { ...model.sentenceVectors };

  for (const sentence of data.sentences) {
    const real = realShares(sentence, words);
    if (!real) continue;
    const predicted = predictedShares(model, sentence.id, words);
    const sentenceVector = model.sentenceVectors[sentence.id];
    const sentenceGradient: Vec2 = [0, 0];
    words.forEach((word, i) => {
      const overGuess = predicted[i] - real[i];
      const wordVector = model.wordVectors[word];
      wordGradients[i][0] += overGuess * sentenceVector[0];
      wordGradients[i][1] += overGuess * sentenceVector[1];
      sentenceGradient[0] += overGuess * wordVector[0];
      sentenceGradient[1] += overGuess * wordVector[1];
      commonnessGradients[i] += overGuess;
    });
    sentenceVectors[sentence.id] = [
      sentenceVector[0] - learningRate * sentenceGradient[0],
      sentenceVector[1] - learningRate * sentenceGradient[1],
    ];
  }

  const wordVectors: Record<string, Vec2> = {};
  const wordCommonness: Record<string, number> = {};
  words.forEach((word, i) => {
    const wordVector = model.wordVectors[word];
    wordVectors[word] = [
      wordVector[0] - learningRate * wordGradients[i][0],
      wordVector[1] - learningRate * wordGradients[i][1],
    ];
    wordCommonness[word] = model.wordCommonness[word] - learningRate * commonnessGradients[i];
  });

  return { wordVectors, wordCommonness, sentenceVectors };
}
