import { describe, it, expect } from "vitest";
import { cosineSimilarity } from "./embeddingUtils";
import {
  predictedShares,
  randomModel,
  realShares,
  sentenceError,
  totalError,
  trainStep,
  type EmbeddingModel,
  type TrainingData,
} from "./embeddingTraining";

/** Deterministic stand-in for Math.random, so every run starts from the same place. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const DATA: TrainingData = {
  words: ["cat", "dog", "car", "bus"],
  sentences: [
    { id: "pet", text: "I like to pet my", counts: { cat: 50, dog: 50 } },
    { id: "vet", text: "I took the vet my", counts: { cat: 40, dog: 60 } },
    { id: "work", text: "I got to work by", counts: { car: 70, bus: 30 } },
    { id: "road", text: "The road was full of", counts: { car: 50, bus: 50 } },
  ],
};

function train(data: TrainingData, steps: number, seed = 1): EmbeddingModel {
  let model = randomModel(data, seededRandom(seed));
  for (let i = 0; i < steps; i++) model = trainStep(model, data, 0.2);
  return model;
}

describe("realShares", () => {
  it("turns counts into shares that add up to 1", () => {
    expect(realShares(DATA.sentences[1], DATA.words)).toEqual([0.4, 0.6, 0, 0]);
  });

  it("returns null when no word has a count", () => {
    expect(realShares({ id: "empty", text: "", counts: {} }, DATA.words)).toBeNull();
  });

  it("ignores counts for words that are no longer in the word list", () => {
    const sentence = { id: "s", text: "", counts: { cat: 1, hamster: 9 } };
    expect(realShares(sentence, ["cat", "dog"])).toEqual([1, 0]);
  });
});

describe("predictedShares", () => {
  it("adds up to 1", () => {
    const model = randomModel(DATA, seededRandom(3));
    const sum = predictedShares(model, "pet", DATA.words).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 10);
  });

  it("gives the biggest share to the word whose vector lines up with the sentence", () => {
    const model: EmbeddingModel = {
      wordVectors: { cat: [1, 0], dog: [0, 1] },
      wordCommonness: { cat: 0, dog: 0 },
      sentenceVectors: { s: [2, 0] },
    };
    const [cat, dog] = predictedShares(model, "s", ["cat", "dog"]);
    expect(cat).toBeGreaterThan(dog);
  });
});

describe("sentenceError", () => {
  it("is zero when the guess matches exactly", () => {
    expect(sentenceError([0.5, 0.5, 0], [0.5, 0.5, 0])).toBe(0);
  });

  it("is positive when the guess is off", () => {
    expect(sentenceError([0.5, 0.5], [0.9, 0.1])).toBeGreaterThan(0);
  });
});

describe("trainStep", () => {
  it("does not modify the model it is given", () => {
    const model = randomModel(DATA, seededRandom(1));
    const before = JSON.stringify(model);
    trainStep(model, DATA, 0.2);
    expect(JSON.stringify(model)).toBe(before);
  });

  it("lowers the error", () => {
    const start = randomModel(DATA, seededRandom(1));
    const trained = train(DATA, 500);
    expect(totalError(trained, DATA)).toBeLessThan(totalError(start, DATA) / 10);
  });

  it("learns shares close to the real ones", () => {
    const trained = train(DATA, 2000);
    const guess = predictedShares(trained, "vet", DATA.words);
    expect(guess[0]).toBeCloseTo(0.4, 1);
    expect(guess[1]).toBeCloseTo(0.6, 1);
  });

  it("puts words that fill the same blanks closer together than words that do not", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const { wordVectors } = train(DATA, 1000, seed);
      const catDog = cosineSimilarity(wordVectors.cat, wordVectors.dog);
      const catCar = cosineSimilarity(wordVectors.cat, wordVectors.car);
      expect(catDog).toBeGreaterThan(catCar);
    }
  });

  it("skips sentences that have no counts", () => {
    const data: TrainingData = {
      words: DATA.words,
      sentences: [...DATA.sentences, { id: "blank", text: "", counts: {} }],
    };
    const model = randomModel(data, seededRandom(1));
    const stepped = trainStep(model, data, 0.2);
    expect(stepped.sentenceVectors.blank).toEqual(model.sentenceVectors.blank);
  });
});
