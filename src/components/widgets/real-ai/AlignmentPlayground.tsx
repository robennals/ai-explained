"use client";

import { useState } from "react";
import { WidgetContainer } from "@/components/widgets/shared/WidgetContainer";
import { ApproachTabs, type Approach } from "./ApproachTabs";
import { ALIGNMENT_EXAMPLES, RANKING_ROUNDS } from "./data";
import { StagesVisual } from "./visuals";

/** The before/after strip, with a prompt switcher. */
function StagesDemo() {
  const [i, setI] = useState(0);
  const ex = ALIGNMENT_EXAMPLES[i];
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
        {ALIGNMENT_EXAMPLES.map((e, n) => (
          <button
            key={e.prompt}
            onClick={() => setI(n)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
              n === i
                ? "border-accent bg-accent/10 text-foreground"
                : "border-border text-muted hover:bg-foreground/5"
            }`}
          >
            {e.prompt}
          </button>
        ))}
      </div>
      <StagesVisual base={ex.base} sft={ex.sft} aligned={ex.aligned} />
      <p className="mt-2 text-[11px] italic text-muted">
        These replies illustrate the character of each stage. They aren&apos;t transcripts of a real model.
      </p>
    </div>
  );
}

/** Rank two answers and see what your choice would teach the model. */
function RankingDemo() {
  const [round, setRound] = useState(0);
  const [choice, setChoice] = useState<"A" | "B" | null>(null);
  const r = RANKING_ROUNDS[round];
  const sycophantic = choice !== null && choice === r.sycophantic;

  return (
    <div>
      <p className="mb-2 text-xs text-foreground/80">{r.question}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {(["A", "B"] as const).map((k) => {
          const text = k === "A" ? r.optionA : r.optionB;
          const picked = choice === k;
          return (
            <button
              key={k}
              onClick={() => setChoice(k)}
              className={`rounded-md border p-2.5 text-left text-xs leading-relaxed transition-colors ${
                picked
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-border text-foreground/80 hover:bg-foreground/5"
              }`}
            >
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted">
                Answer {k}
              </span>
              {text}
            </button>
          );
        })}
      </div>
      {choice && (
        <p
          className={`mt-2 rounded-md border p-2.5 text-xs leading-relaxed ${
            sycophantic
              ? "border-warning/40 bg-warning/5 text-foreground/85"
              : "border-success/40 bg-success/5 text-foreground/85"
          }`}
        >
          {sycophantic ? r.lessonSycophantic : r.lessonHonest}
        </p>
      )}
      <button
        onClick={() => {
          setRound((n) => (n + 1) % RANKING_ROUNDS.length);
          setChoice(null);
        }}
        className="mt-2 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-foreground/5"
      >
        Try another →
      </button>
    </div>
  );
}

const approaches: Approach[] = [
  {
    id: "sft",
    label: "Copy good answers",
    title: "Supervised fine-tuning",
    problem:
      "A freshly trained model only continues text. Ask it a question and a perfectly good continuation is a list of more questions.",
    how: "Show it thousands of examples of a question paired with a good answer, and train it to copy the pattern. This is what first makes it behave like an assistant at all.",
    visual: <StagesDemo />,
    chapter: { label: "Alignment", href: "/alignment" },
  },
  {
    id: "rlhf",
    label: "Human feedback",
    title: "Reinforcement learning from human feedback",
    problem:
      "Copying good answers only gets you so far. Nobody can write an example for every question, and what counts as a good answer is a matter of judgement.",
    how: "People rank the model's attempts from best to worst. Those rankings train a second model to predict what humans like, and the main model is then tuned to score well against it.",
    badge: { text: "beat 100× more size", tone: "accent" },
    note: "When OpenAI compared a 1.3-billion-parameter aligned model against the raw 175-billion-parameter GPT-3, people preferred the small one's answers.",
    visual: <RankingDemo />,
    chapter: { label: "Alignment", href: "/alignment" },
  },
  {
    id: "rlaif",
    label: "AI feedback",
    title: "Constitutional AI, or feedback from the model itself",
    problem:
      "Human ranking is slow and expensive, and you need an enormous amount of it to shape a model's behaviour.",
    how: "Give the AI a written list of principles and have it critique its own answers against them. Improving behaviour then means editing a document rather than hiring more people.",
    chapter: { label: "Alignment", href: "/alignment" },
  },
  {
    id: "rlvr",
    label: "Checkable rewards",
    title: "Rewards a program can verify",
    problem:
      "A model trained to please human raters learns what raters like, which is not quite the same as being right.",
    how: "For maths and code, skip opinion entirely and let a program mark the work. You can't flatter a calculator, so there is nothing to game.",
    chapter: { label: "Reasoning", href: "/reasoning" },
  },
  {
    id: "failures",
    label: "When it goes wrong",
    title: "Three ways alignment backfires",
    problem:
      "Every one of these methods optimises against a stand-in for what you actually want, and stand-ins can be gamed.",
    how: "Sycophancy: train on what people say they like and the model learns that people like being agreed with. Reward hacking: push hard enough to score well and it pleases the scorer rather than being good. Over-refusal: push safety too hard and it refuses harmless things.",
    note: "On one test an early chat model refused 38% of perfectly safe questions, and 100% of the ones that merely sounded dangerous, including how to attack the king in a game of chess. In April 2025 OpenAI shipped a version of GPT-4o that had tipped too far into flattery and rolled it back within days.",
    chapter: { label: "Alignment", href: "/alignment" },
  },
];

export function AlignmentPlayground() {
  return (
    <WidgetContainer
      title="Teaching a text-continuer to be useful"
      description="Five stages and failure modes, one tab each. Two of them you can try yourself."
    >
      <ApproachTabs approaches={approaches} />
    </WidgetContainer>
  );
}
