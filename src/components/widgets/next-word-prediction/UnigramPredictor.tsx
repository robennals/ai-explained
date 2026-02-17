"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";

const TOP_WORDS = [
  { word: "the", pct: 7.0 },
  { word: "of", pct: 3.5 },
  { word: "and", pct: 2.8 },
  { word: "to", pct: 2.7 },
  { word: "a", pct: 2.3 },
  { word: "in", pct: 2.1 },
  { word: "is", pct: 1.0 },
  { word: "it", pct: 0.9 },
  { word: "that", pct: 0.8 },
  { word: "was", pct: 0.8 },
];

const SENTENCES = [
  { text: "The cat sat on the", answer: "mat" },
  { text: "The capital of France is", answer: "Paris" },
  { text: "She opened the letter and began to", answer: "read" },
  { text: "The scientist discovered a new", answer: "species" },
  { text: "I couldn't believe how", answer: "fast" },
  { text: "Two plus two equals", answer: "four" },
  { text: "The dog chased the", answer: "cat" },
  { text: "In 1969, humans first walked on the", answer: "moon" },
];

type Mode = "predict" | "generate";

const UNIGRAM_TABS: { id: Mode; label: string }[] = [
  { id: "predict", label: "Predict" },
  { id: "generate", label: "Generate" },
];

export function UnigramPredictor() {
  const [mode, setMode] = useState<Mode>("predict");
  const [predictIdx, setPredictIdx] = useState(0);
  const [predictResults, setPredictResults] = useState<boolean[]>([]);
  const [showPrediction, setShowPrediction] = useState(false);
  const [generatedWords, setGeneratedWords] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetState = useCallback(() => {
    setMode("predict");
    setPredictIdx(0);
    setPredictResults([]);
    setShowPrediction(false);
    setGeneratedWords([]);
    setIsGenerating(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const prediction = "the"; // Unigram always predicts the most common word
  const sentence = SENTENCES[predictIdx];
  const correctAnswers = ["the", "The"];

  const handlePredict = () => {
    const isCorrect = correctAnswers.includes(sentence.answer);
    setShowPrediction(true);
    setPredictResults((prev) => [...prev, isCorrect]);
  };

  const handleNextSentence = () => {
    if (predictIdx + 1 < SENTENCES.length) {
      setPredictIdx((i) => i + 1);
      setShowPrediction(false);
    }
  };

  const handleGenerate = () => {
    if (isGenerating) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsGenerating(false);
      return;
    }
    setIsGenerating(true);
    intervalRef.current = setInterval(() => {
      setGeneratedWords((prev) => {
        if (prev.length >= 30) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsGenerating(false);
          return prev;
        }
        return [...prev, "the"];
      });
    }, 200);
  };

  const handleClear = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsGenerating(false);
    setGeneratedWords([]);
  };

  const correctCount = predictResults.filter(Boolean).length;

  return (
    <WidgetContainer
      title="Unigram Predictor"
      description="What if you always guessed the most common English word?"
      onReset={resetState}
    >
      {/* Frequency chart */}
      <div className="mb-4">
        <div className="mb-2 text-xs font-medium text-muted">
          Top 10 most common English words
        </div>
        <div className="space-y-1">
          {TOP_WORDS.map((w) => (
            <div key={w.word} className="flex items-center gap-2">
              <span className="w-10 text-right font-mono text-xs text-muted">
                {w.word}
              </span>
              <div className="flex-1">
                <div
                  className="h-4 rounded-sm bg-accent/70 transition-all"
                  style={{ width: `${(w.pct / 7) * 100}%` }}
                />
              </div>
              <span className="w-10 text-right font-mono text-xs text-muted">
                {w.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mode tabs */}
      <WidgetTabs tabs={UNIGRAM_TABS} activeTab={mode} onTabChange={setMode} />

      {mode === "predict" ? (
        <div className="space-y-3">
          {predictIdx < SENTENCES.length ? (
            <>
              <div className="flex items-center justify-between text-xs text-muted">
                <span>
                  Sentence {predictIdx + 1} of {SENTENCES.length}
                </span>
                <span className="font-mono">
                  Correct: {correctCount}/{predictResults.length}
                </span>
              </div>

              <div className="rounded-lg bg-surface px-4 py-3 text-sm text-foreground">
                {sentence.text}{" "}
                <span className="font-mono font-bold text-accent">___</span>
              </div>

              <div className="text-center text-xs text-muted">
                Model always predicts: <span className="font-mono font-bold text-foreground">&ldquo;{prediction}&rdquo;</span>
              </div>

              {!showPrediction ? (
                <button
                  onClick={handlePredict}
                  className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
                >
                  See Prediction
                </button>
              ) : (
                <div className="space-y-2">
                  {correctAnswers.includes(sentence.answer) ? (
                    <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
                      <span>&#10003;</span> Lucky! The answer was &ldquo;{sentence.answer}&rdquo;
                    </div>
                  ) : (
                    <div className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">
                      &#10007; Wrong. The answer was &ldquo;{sentence.answer}&rdquo;, not &ldquo;the&rdquo;.
                    </div>
                  )}
                  {predictIdx + 1 < SENTENCES.length && (
                    <button
                      onClick={handleNextSentence}
                      className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
                    >
                      Next
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-sm text-muted">
              Done! The unigram model got{" "}
              <span className="font-bold text-foreground">{correctCount}</span> out of{" "}
              <span className="font-bold text-foreground">{SENTENCES.length}</span>{" "}
              right. Not great.
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-muted">
            The unigram model generates text by always picking the most common word.
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
            >
              {isGenerating ? "Stop" : "Generate Text"}
            </button>
            <button
              onClick={handleClear}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              Clear
            </button>
          </div>
          {generatedWords.length > 0 && (
            <>
              <div className="min-h-[60px] rounded-lg bg-surface px-4 py-3 font-mono text-sm text-foreground">
                {generatedWords.join(" ")}
              </div>
              <div className="text-xs text-muted">
                {generatedWords.length} words generated. Riveting stuff.
              </div>
            </>
          )}
        </div>
      )}
    </WidgetContainer>
  );
}
