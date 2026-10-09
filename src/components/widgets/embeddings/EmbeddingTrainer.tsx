"use client";

import { useCallback, useEffect, useState } from "react";
import { SelectControl } from "../shared/SelectControl";
import { WidgetContainer } from "../shared/WidgetContainer";
import {
  predictedShares,
  randomModel,
  realShares,
  totalError,
  trainStep,
  type EmbeddingModel,
  type TrainingData,
  type TrainingSentence,
  type Vec2,
} from "./embeddingTraining";

const LEARNING_RATE = 0.2;

// Counts are rough guesses at how often each word would fill the blank in
// everyday writing, out of 100. They are not measured from a real corpus.
const TRAINING_DATA: TrainingData = {
  words: [
    "cat", "dog", "rabbit", "wolf", "snake", "bear",
    "pizza", "cake", "chicken", "car", "bus", "truck",
  ],
  sentences: [
    { id: "pet", text: "I like to pet my", counts: { dog: 50, cat: 40, rabbit: 8, chicken: 1, snake: 1 } },
    { id: "bitten", text: "I was bitten by a", counts: { dog: 60, snake: 25, cat: 8, bear: 3, wolf: 2, rabbit: 2 } },
    { id: "woods", text: "In the woods we saw a", counts: { bear: 35, rabbit: 30, wolf: 15, snake: 15, dog: 5 } },
    { id: "dinner", text: "For dinner we had", counts: { pizza: 50, chicken: 40, cake: 5, rabbit: 5 } },
    { id: "baked", text: "She baked a", counts: { cake: 85, pizza: 10, chicken: 5 } },
    { id: "farmer", text: "The farmer fed the", counts: { chicken: 55, dog: 20, cat: 15, rabbit: 10 } },
    { id: "work", text: "I got to work by", counts: { car: 60, bus: 35, truck: 5 } },
    { id: "road", text: "The road was blocked by a", counts: { truck: 50, car: 25, bus: 20, bear: 3, dog: 2 } },
  ],
};
const { words: WORDS, sentences: SENTENCES } = TRAINING_DATA;

/** A colour for each word and each sentence id. Spacing hues by the golden angle keeps them distinct. */
const COLORS: Record<string, string> = Object.fromEntries(
  [...WORDS, ...SENTENCES.map((sentence) => sentence.id)].map((key, i) => [
    key,
    `hsl(${Math.round((i * 137.5) % 360)}, 70%, 42%)`,
  ])
);

interface TrainerState {
  model: EmbeddingModel;
  steps: number;
}

function startState(): TrainerState {
  return { model: randomModel(TRAINING_DATA), steps: 0 };
}

function sentenceLabel(sentence: TrainingSentence): string {
  return `${SENTENCES.indexOf(sentence) + 1}. ${sentence.text} ___`;
}

function percent(share: number): string {
  return `${Math.round(share * 100)}%`;
}

const MAP_SIZE = 360;
const MAP_CENTER = MAP_SIZE / 2;
const MAP_PLOT_RADIUS = MAP_CENTER - 34;

/** A diamond, the shape used for sentences everywhere in this widget. */
function Diamond({ x, y, size, color }: { x: number; y: number; size: number; color: string }) {
  return (
    <rect
      x={x - size / 2}
      y={y - size / 2}
      width={size}
      height={size}
      fill={color}
      stroke="white"
      strokeWidth={1}
      transform={`rotate(45 ${x} ${y})`}
    />
  );
}

function EmbeddingMap({
  model,
  selected,
  onSelect,
}: {
  model: EmbeddingModel;
  selected: TrainingSentence;
  onSelect: (id: string) => void;
}) {
  const vectors = [...Object.values(model.wordVectors), ...Object.values(model.sentenceVectors)];
  // Zoom out as the vectors grow, so everything always fits.
  const furthest = Math.max(0.2, ...vectors.map((v) => Math.hypot(v[0], v[1])));
  const place = (v: Vec2): [number, number] => [
    MAP_CENTER + (v[0] / furthest) * MAP_PLOT_RADIUS,
    MAP_CENTER - (v[1] / furthest) * MAP_PLOT_RADIUS,
  ];

  const selectedShares = realShares(selected, WORDS);

  return (
    <svg viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`} className="w-full rounded-lg bg-surface">
      <line x1={MAP_CENTER} y1={8} x2={MAP_CENTER} y2={MAP_SIZE - 8} stroke="var(--color-border)" />
      <line x1={8} y1={MAP_CENTER} x2={MAP_SIZE - 8} y2={MAP_CENTER} stroke="var(--color-border)" />

      {/* Lines from the selected sentence to the words that really fill its blank */}
      {selectedShares &&
        WORDS.map((word, i) => {
          if (selectedShares[i] === 0) return null;
          const [x1, y1] = place(model.sentenceVectors[selected.id]);
          const [x2, y2] = place(model.wordVectors[word]);
          return (
            <line
              key={word}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={COLORS[selected.id]}
              strokeWidth={0.5 + selectedShares[i] * 5}
              strokeOpacity={0.35}
            />
          );
        })}

      {SENTENCES.map((sentence, i) => {
        const [x, y] = place(model.sentenceVectors[sentence.id]);
        const isSelected = sentence === selected;
        return (
          <g key={sentence.id} className="cursor-pointer" onClick={() => onSelect(sentence.id)}>
            <title>{`${sentence.text} ___`}</title>
            {isSelected && (
              <circle cx={x} cy={y} r={13} fill="none" stroke={COLORS[sentence.id]} strokeWidth={1.5} />
            )}
            <Diamond x={x} y={y} size={isSelected ? 13 : 11} color={COLORS[sentence.id]} />
            <text
              x={x}
              y={y + 3}
              textAnchor="middle"
              className="pointer-events-none select-none fill-white text-[8px] font-bold"
            >
              {i + 1}
            </text>
          </g>
        );
      })}

      {WORDS.map((word) => {
        const [x, y] = place(model.wordVectors[word]);
        return (
          <g key={word}>
            <circle cx={x} cy={y} r={5} fill={COLORS[word]} stroke="white" strokeWidth={1} />
            <text
              x={x + 8}
              y={y + 3.5}
              fill={COLORS[word]}
              className="pointer-events-none select-none text-[11px] font-semibold"
            >
              {word}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ShareBar({ label, share, color }: { label: string; share: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-9 shrink-0 text-[10px] text-muted">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-foreground/5">
        <div className="h-full rounded-full" style={{ width: percent(share), background: color }} />
      </div>
      <span className="w-8 shrink-0 text-right font-mono text-[10px] text-foreground">{percent(share)}</span>
    </div>
  );
}

/** For one sentence: how often each word really fills the blank, beside the model's current guess. */
function SentenceShares({ model, sentence }: { model: EmbeddingModel; sentence: TrainingSentence }) {
  const real = realShares(sentence, WORDS);
  const guess = predictedShares(model, sentence.id, WORDS);

  return (
    <div className="grid gap-x-8 gap-y-2 md:grid-cols-2">
      {WORDS.map((word, i) => (
        <div key={word} className="grid grid-cols-[4.5rem_1fr] items-center gap-2">
          <span className="truncate text-xs font-semibold" style={{ color: COLORS[word] }}>
            {word}
          </span>
          <div>
            <ShareBar label="Real" share={real?.[i] ?? 0} color={COLORS[word]} />
            <ShareBar label="Guess" share={guess[i]} color="var(--color-muted)" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmbeddingTrainer() {
  const [state, setState] = useState(startState);
  const [selectedId, setSelectedId] = useState(SENTENCES[0].id);
  const [isTraining, setIsTraining] = useState(false);

  const { model, steps } = state;
  const selected = SENTENCES.find((sentence) => sentence.id === selectedId) ?? SENTENCES[0];

  const takeStep = useCallback(
    () =>
      setState((s) => ({ model: trainStep(s.model, TRAINING_DATA, LEARNING_RATE), steps: s.steps + 1 })),
    []
  );

  useEffect(() => {
    if (!isTraining) return;
    let frame = requestAnimationFrame(function tick() {
      takeStep();
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [isTraining, takeStep]);

  const reset = useCallback(() => {
    setIsTraining(false);
    setState(startState());
    setSelectedId(SENTENCES[0].id);
  }, []);

  return (
    <WidgetContainer
      title="Learn an Embedding"
      description="Every word and every prefix starts at a random spot. Training moves them until the prefixes predict the right words."
      onReset={reset}
    >
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <EmbeddingMap model={model} selected={selected} onSelect={setSelectedId} />
          <div className="mt-2 flex items-center gap-4 text-[11px] text-muted">
            <span className="flex items-center gap-1">
              <svg width={12} height={12} viewBox="0 0 12 12">
                <circle cx={6} cy={6} r={4.5} fill="var(--color-muted)" />
              </svg>
              word
            </span>
            <span className="flex items-center gap-1">
              <svg width={14} height={14} viewBox="0 0 14 14">
                <Diamond x={7} y={7} size={8} color="var(--color-muted)" />
              </svg>
              prefix
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-0.5">
            {SENTENCES.map((sentence, i) => (
              <button
                key={sentence.id}
                onClick={() => setSelectedId(sentence.id)}
                className={`flex items-center gap-2 rounded-md px-2 py-1 text-left text-xs transition-colors ${
                  sentence === selected ? "bg-accent/10" : "hover:bg-foreground/5"
                }`}
              >
                <svg width={18} height={18} viewBox="0 0 18 18" className="shrink-0">
                  <Diamond x={9} y={9} size={11} color={COLORS[sentence.id]} />
                  <text x={9} y={12} textAnchor="middle" className="fill-white text-[8px] font-bold">
                    {i + 1}
                  </text>
                </svg>
                <span className="min-w-0 flex-1 truncate text-foreground">{sentence.text} ___</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={takeStep}
              disabled={isTraining}
              className="rounded-md bg-foreground/10 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/20 disabled:opacity-40"
            >
              Step
            </button>
            <button
              onClick={() => setIsTraining((t) => !t)}
              className={`rounded-md px-4 py-2 text-sm font-medium text-white transition-colors ${
                isTraining ? "bg-error hover:bg-error/80" : "bg-accent hover:bg-accent/80"
              }`}
            >
              {isTraining ? "Pause" : "Train"}
            </button>
            <button
              onClick={() => setState(startState())}
              className="rounded-md bg-foreground/10 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/20"
            >
              Scramble
            </button>
          </div>
          <div className="text-xs text-muted">
            Step <span className="font-mono text-foreground">{steps}</span> · Error{" "}
            <span className="font-mono text-foreground">{totalError(model, TRAINING_DATA).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-border p-3">
        <div className="mb-3">
          <SelectControl
            label="Which words fill this blank?"
            value={selected.id}
            options={SENTENCES.map((sentence) => ({ value: sentence.id, label: sentenceLabel(sentence) }))}
            onChange={setSelectedId}
          />
        </div>
        <SentenceShares model={model} sentence={selected} />
      </div>
    </WidgetContainer>
  );
}
