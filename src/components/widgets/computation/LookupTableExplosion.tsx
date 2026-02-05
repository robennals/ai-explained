"use client";

import { useState, useMemo, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";

const COMPARISONS = [
  { label: "Grains of sand on Earth", exponent: 19, emoji: "sand" },
  { label: "Stars in observable universe", exponent: 24, emoji: "stars" },
  { label: "Atoms in a human body", exponent: 28, emoji: "body" },
  { label: "Atoms in Earth", exponent: 50, emoji: "earth" },
  { label: "Atoms in observable universe", exponent: 80, emoji: "universe" },
  { label: "Possible chess games", exponent: 120, emoji: "chess" },
];

function formatBigNumber(pixels: number, valuesPerPixel: number): { mantissa: string; exponent: number } {
  // total = valuesPerPixel ^ pixels
  // log10(total) = pixels * log10(valuesPerPixel)
  const log10Total = pixels * Math.log10(valuesPerPixel);
  const exponent = Math.floor(log10Total);
  const mantissa = Math.pow(10, log10Total - exponent);
  return {
    mantissa: mantissa.toFixed(2),
    exponent,
  };
}

export function LookupTableExplosion() {
  const [pixels, setPixels] = useState(9);
  const [valuesPerPixel, setValuesPerPixel] = useState(2);

  const resetState = useCallback(() => {
    setPixels(9);
    setValuesPerPixel(2);
  }, []);

  const { mantissa, exponent } = useMemo(
    () => formatBigNumber(pixels, valuesPerPixel),
    [pixels, valuesPerPixel]
  );

  // Color based on how extreme the number is
  const intensity = Math.min(exponent / 100, 1);

  return (
    <WidgetContainer
      title="Lookup Table Explosion"
      description="How many entries would a lookup table need?"
      onReset={resetState}
    >
      <div className="space-y-3">
        <SliderControl
          label="Input values"
          value={pixels}
          min={1}
          max={100}
          step={1}
          onChange={setPixels}
          formatValue={(v) => String(Math.round(v))}
        />
        <SliderControl
          label="Options each"
          value={valuesPerPixel}
          min={2}
          max={256}
          step={1}
          onChange={setValuesPerPixel}
          formatValue={(v) => String(Math.round(v))}
        />
      </div>

      <div className="mt-4 text-center">
        <p className="mb-1 text-xs text-muted">
          {Math.round(valuesPerPixel)}^{Math.round(pixels)} possible inputs =
        </p>
        <p
          className="font-mono text-3xl font-bold transition-colors duration-300"
          style={{
            color: `color-mix(in srgb, var(--color-foreground) ${Math.round((1 - intensity) * 100)}%, var(--color-error) ${Math.round(intensity * 100)}%)`,
          }}
        >
          {exponent <= 6 ? (
            // Show the actual number for small values
            <>{Math.pow(Math.round(valuesPerPixel), Math.round(pixels)).toLocaleString()}</>
          ) : (
            <>
              {mantissa} &times; 10
              <sup>{exponent.toLocaleString()}</sup>
            </>
          )}
        </p>
        <p className="mt-1 text-xs text-muted">table entries needed</p>
      </div>

      <div className="mt-4 space-y-1.5">
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

      {exponent > 80 && (
        <p className="mt-3 text-center text-xs font-medium text-error">
          More entries than atoms in the observable universe!
        </p>
      )}
    </WidgetContainer>
  );
}
