"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

const SENTENCES = [
  { text: "The cat sat on the", answers: ["mat", "floor", "chair", "bed", "couch"], note: "Simple — you probably got this!" },
  { text: "The capital of France is", answers: ["Paris"], note: "Only one right answer. To predict this, you'd need to KNOW this fact." },
  { text: "She opened the letter and began to", answers: ["read", "cry", "smile", "laugh", "tremble"], note: "Many valid answers — predicting well requires understanding emotions and context." },
  { text: "The scientist discovered a new", answers: ["species", "element", "planet", "gene", "particle", "method"], note: "Requires knowing what scientists discover." },
  { text: "I couldn't believe how", answers: ["fast", "beautiful", "big", "strange", "easy", "hard", "quickly"], note: "Almost anything works — some contexts are very open." },
  { text: "Two plus two equals", answers: ["four"], note: "Math! A next-word predictor needs to understand arithmetic too." },
  { text: "The dog chased the", answers: ["cat", "ball", "rabbit", "squirrel", "car", "stick"], note: "Common sense about what dogs chase." },
  { text: "In 1969, humans first walked on the", answers: ["moon", "Moon"], note: "Historical knowledge from just predicting text!" },
];

export function NextWordGame() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [guess, setGuess] = useState("");
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const resetState = useCallback(() => {
    setCurrentIdx(0);
    setGuess("");
    setChecked(false);
    setScore(0);
    setFinished(false);
  }, []);

  const sentence = SENTENCES[currentIdx];
  const isCorrect = sentence
    ? sentence.answers.some((a) => a.toLowerCase() === guess.trim().toLowerCase())
    : false;

  const handleCheck = () => {
    if (!guess.trim()) return;
    setChecked(true);
    if (isCorrect) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 >= SENTENCES.length) {
      setFinished(true);
    } else {
      setCurrentIdx((i) => i + 1);
      setGuess("");
      setChecked(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (!checked) {
        handleCheck();
      } else if (!finished) {
        handleNext();
      }
    }
  };

  return (
    <WidgetContainer
      title="Guess the Next Word"
      description="Can you predict what comes next? See what it takes."
      onReset={resetState}
    >
      {finished ? (
        <div className="space-y-4 text-center">
          <div className="text-2xl font-bold text-foreground">
            {score} / {SENTENCES.length}
          </div>
          <div className="text-sm text-muted">
            You got {score} out of {SENTENCES.length} right.
          </div>
          <div className="mx-auto max-w-md rounded-lg bg-surface px-4 py-3 text-left text-sm text-foreground">
            To predict the next word well, you need to understand{" "}
            <span className="font-semibold">grammar</span>,{" "}
            <span className="font-semibold">facts about the world</span>,{" "}
            <span className="font-semibold">emotions</span>, and{" "}
            <span className="font-semibold">common sense</span>. A model that
            can do this well must have learned a lot about language — and the
            world.
          </div>
          <button
            onClick={resetState}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
          >
            Play Again
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Progress */}
          <div className="flex items-center justify-between text-xs text-muted">
            <span>
              Question {currentIdx + 1} of {SENTENCES.length}
            </span>
            <span className="font-mono">
              Score: {score}/{currentIdx + (checked ? 1 : 0)}
            </span>
          </div>

          {/* Sentence */}
          <div className="rounded-lg bg-surface px-4 py-3 text-base text-foreground">
            {sentence.text}{" "}
            <span className="inline-block w-20 border-b-2 border-accent text-center font-mono text-accent">
              {checked ? guess.trim() || "___" : "___"}
            </span>
          </div>

          {/* Input area */}
          {!checked ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your guess..."
                className="flex-1 rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30"
                autoFocus
              />
              <button
                onClick={handleCheck}
                disabled={!guess.trim()}
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark disabled:opacity-40"
              >
                Check
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Result */}
              {isCorrect ? (
                <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
                  <span className="text-lg">&#10003;</span> Nice! &ldquo;{guess.trim()}&rdquo; is a
                  great prediction.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">
                    &ldquo;{guess.trim()}&rdquo; wasn&apos;t in our list. Common answers:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {sentence.answers.map((a) => (
                      <span
                        key={a}
                        className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-foreground"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Note */}
              <div className="text-xs text-muted italic">{sentence.note}</div>

              {/* Next button */}
              <button
                onClick={handleNext}
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
              >
                {currentIdx + 1 >= SENTENCES.length ? "See Results" : "Next"}
              </button>
            </div>
          )}
        </div>
      )}
    </WidgetContainer>
  );
}
