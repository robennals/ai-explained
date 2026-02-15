"use client";

import { useState, useMemo, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";

const COMPARISONS = [
  { label: "Words in a book", exponent: 5 },
  { label: "Words on Wikipedia", exponent: 9 },
  { label: "Words on the internet", exponent: 13 },
  { label: "Atoms in the observable universe", exponent: 80 },
];

export function NgramExplosion() {
  const [contextSize, setContextSize] = useState(2);
  const [vocabSize, setVocabSize] = useState(1000);

  const resetState = useCallback(() => {
    setContextSize(2);
    setVocabSize(1000);
  }, []);

  const { exponent, mantissa, exactSmall } = useMemo(() => {
    const log10 = contextSize * Math.log10(vocabSize);
    const exp = Math.floor(log10);
    const mant = Math.pow(10, log10 - exp);
    // For small results, show exact number
    if (exp <= 9) {
      return { exponent: exp, mantissa: mant.toFixed(2), exactSmall: Math.pow(vocabSize, contextSize) };
    }
    return { exponent: exp, mantissa: mant.toFixed(2), exactSmall: null };
  }, [contextSize, vocabSize]);

  const intensity = Math.min(exponent / 80, 1);

  const exceedsText = exponent > 13;

  return (
    <WidgetContainer
      title="N-gram Context Explosion"
      description="How many possible contexts exist for a given n-gram size?"
      onReset={resetState}
    >
      <div className="space-y-4">
        <SliderControl
          label="Context size (n)"
          value={contextSize}
          min={1}
          max={10}
          step={1}
          onChange={setContextSize}
          formatValue={(v) => String(v)}
        />

        <SliderControl
          label="Vocabulary size"
          value={vocabSize}
          min={100}
          max={100000}
          step={100}
          onChange={setVocabSize}
          formatValue={(v) => v.toLocaleString()}
        />

        {/* Formula */}
        <div className="text-center">
          <div className="mb-1 text-xs text-muted">
            <span className="font-mono">{vocabSize.toLocaleString()}</span>
            <sup className="font-mono">{contextSize}</sup>
            {" "}= possible contexts
          </div>
          <div
            className="font-mono text-3xl font-bold transition-colors duration-300"
            style={{
              color: `color-mix(in srgb, var(--color-foreground) ${Math.round((1 - intensity) * 100)}%, var(--color-error) ${Math.round(intensity * 100)}%)`,
            }}
          >
            {exactSmall !== null ? (
              exactSmall.toLocaleString()
            ) : (
              <>
                {mantissa} &times; 10<sup>{exponent.toLocaleString()}</sup>
              </>
            )}
          </div>
          <div className="mt-1 text-xs text-muted">unique {contextSize}-word contexts</div>
        </div>

        {/* Comparison bars */}
        <div className="space-y-1.5">
          {COMPARISONS.map((comp) => {
            const exceeded = exponent >= comp.exponent;
            return (
              <div
                key={comp.label}
                className={`flex items-center justify-between rounded-md px-3 py-1.5 text-xs transition-all duration-300 ${
                  exceeded
                    ? "bg-error/10 text-error font-medium"
                    : "bg-surface text-muted"
                }`}
              >
                <span>{comp.label}</span>
                <span className="font-mono">
                  ~10<sup>{comp.exponent}</sup>
                  {exceeded && " \u2713"}
                </span>
              </div>
            );
          })}
        </div>

        {exceedsText && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-center text-sm font-medium text-error">
            There isn&apos;t enough text in the world to have seen every{" "}
            {contextSize}-word combination. We need a smarter approach.
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}
