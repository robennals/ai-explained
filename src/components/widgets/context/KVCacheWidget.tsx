"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { WidgetContainer } from "../shared/WidgetContainer";
import { ToggleControl } from "../shared/ToggleControl";
import { keyValueWork, cacheMemory } from "./kvcache";

/* ------------------------------------------------------------------ */
/*  Fixed, author-scripted script — no model, just a fake continuation */
/* ------------------------------------------------------------------ */

const PROMPT_WORDS = ["The", "cat", "sat", "on", "the"];
const PROMPT_LEN = PROMPT_WORDS.length;

const CONTINUATION_WORDS = [
  "mat",
  "and",
  "purred",
  "softly",
  "in",
  "the",
  "sun",
  "for",
  "hours",
  "before",
  "falling",
  "asleep",
];

const MAX_GENERATED = CONTINUATION_WORDS.length;

function Chip({
  word,
  pulse,
  motionKey,
}: {
  word: string;
  pulse: boolean;
  motionKey: string;
}) {
  return (
    <motion.span
      key={motionKey}
      initial={
        pulse
          ? {
              backgroundColor: "var(--color-accent)",
              color: "#fff",
              scale: 1.15,
            }
          : false
      }
      animate={{
        backgroundColor: "var(--color-surface)",
        color: "var(--color-foreground)",
        scale: 1,
      }}
      transition={{ duration: 0.6 }}
      className="inline-block rounded-md px-3 py-1.5 text-lg font-semibold"
    >
      {word}
    </motion.span>
  );
}

export function KVCache() {
  const [generated, setGenerated] = useState(0);
  const [cache, setCache] = useState(true);

  const handleGenerate = useCallback(() => {
    setGenerated((g) => Math.min(g + 1, MAX_GENERATED));
  }, []);

  const handleReset = useCallback(() => {
    setGenerated(0);
    setCache(true);
  }, []);

  const workSoFar = keyValueWork(PROMPT_LEN, generated, cache);
  const memory = cacheMemory(PROMPT_LEN, generated);
  const maxMemory = cacheMemory(PROMPT_LEN, MAX_GENERATED);
  const memoryPct = Math.round((memory / maxMemory) * 100);

  const withoutCacheTotal = keyValueWork(PROMPT_LEN, generated, false);
  const withCacheTotal = keyValueWork(PROMPT_LEN, generated, true);

  const done = generated >= MAX_GENERATED;

  return (
    <WidgetContainer
      title="Don't redo the past"
      description="Generating one word at a time means attending back over everything already written — again and again, or just once."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-6">
        {/* Words: prompt + generated so far */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface p-4">
          {PROMPT_WORDS.map((word, i) => (
            <Chip
              key={cache ? `prompt-${i}` : `prompt-${i}-${generated}`}
              motionKey={cache ? `prompt-${i}` : `prompt-${i}-${generated}`}
              word={word}
              pulse={!cache && generated > 0}
            />
          ))}
          {CONTINUATION_WORDS.slice(0, generated).map((word, j) => {
            const isNewest = j === generated - 1;
            const pulse = cache ? isNewest : true;
            const motionKey = cache ? `gen-${j}` : `gen-${j}-${generated}`;
            return (
              <Chip
                key={motionKey}
                motionKey={motionKey}
                word={word}
                pulse={pulse}
              />
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <ToggleControl
            label="Reuse cached words"
            checked={cache}
            onChange={setCache}
          />
          <button
            onClick={handleGenerate}
            disabled={done}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            {done ? "All words generated" : "Generate next word"}
          </button>
        </div>

        {/* Big counters */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-accent">
              Key/value computations so far
            </p>
            <p className="mt-1 font-mono text-3xl font-bold text-accent">
              {workSoFar}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {cache ? "cache reuse on" : "cache reuse off"}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface px-4 py-3 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Cache memory
            </p>
            <p className="mt-1 font-mono text-3xl font-bold text-foreground">
              {memory} <span className="text-sm font-medium text-muted">entries</span>
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-foreground/10">
              <div
                className="h-full rounded-full bg-foreground/40 transition-all duration-300"
                style={{ width: `${memoryPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Side-by-side total */}
        {generated > 0 && (
          <div className="rounded-lg border border-border bg-surface px-4 py-3 text-center text-sm">
            <span className="font-semibold text-error">
              Without cache: {withoutCacheTotal}
            </span>
            <span className="mx-2 text-muted">vs.</span>
            <span className="font-semibold text-accent">
              With cache: {withCacheTotal}
            </span>
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}
