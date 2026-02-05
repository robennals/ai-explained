"use client";

import { useState, useMemo, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

type InputType = "image" | "text" | "sound";

interface SizeOption {
  label: string;
  count: number;
}

interface DepthOption {
  label: string;
  values: number;
}

interface InputConfig {
  label: string;
  sizeLabel: string;
  depthLabel: string;
  sizes: SizeOption[];
  depths: DepthOption[];
  defaultSize: number;
  defaultDepth: number;
  explain: (size: SizeOption, depth: DepthOption) => string;
}

const INPUT_CONFIGS: Record<InputType, InputConfig> = {
  image: {
    label: "Image",
    sizeLabel: "Image size",
    depthLabel: "Color depth",
    sizes: [
      { label: "2\u00d72", count: 4 },
      { label: "3\u00d73", count: 9 },
      { label: "4\u00d74", count: 16 },
      { label: "8\u00d78", count: 64 },
      { label: "28\u00d728 (MNIST)", count: 784 },
      { label: "256\u00d7256", count: 65536 },
      { label: "512\u00d7512", count: 262144 },
      { label: "1080p photo", count: 2073600 },
    ],
    depths: [
      { label: "Black & white", values: 2 },
      { label: "Grayscale (256 shades)", values: 256 },
      { label: "Full color (RGB)", values: 16777216 },
    ],
    defaultSize: 0,
    defaultDepth: 0,
    explain: (size, depth) =>
      `${size.count.toLocaleString()} pixels, each with ${depth.values.toLocaleString()} possible values`,
  },
  text: {
    label: "Text",
    sizeLabel: "Text length",
    depthLabel: "Character set",
    sizes: [
      { label: "1 character", count: 1 },
      { label: "5 characters", count: 5 },
      { label: "10 characters", count: 10 },
      { label: "A tweet (280 chars)", count: 280 },
      { label: "A paragraph (500 chars)", count: 500 },
      { label: "A page (2,000 chars)", count: 2000 },
    ],
    depths: [
      { label: "Digits only (0\u20139)", values: 10 },
      { label: "Lowercase letters (a\u2013z)", values: 26 },
      { label: "Keyboard characters", values: 95 },
      { label: "Unicode (all languages)", values: 65536 },
    ],
    defaultSize: 0,
    defaultDepth: 0,
    explain: (size, depth) =>
      `${size.count.toLocaleString()} characters, each with ${depth.values.toLocaleString()} possibilities`,
  },
  sound: {
    label: "Sound",
    sizeLabel: "Duration",
    depthLabel: "Quality",
    sizes: [
      { label: "0.1 seconds", count: 4410 },
      { label: "1 second", count: 44100 },
      { label: "5 seconds", count: 220500 },
      { label: "30 seconds", count: 1323000 },
      { label: "3 minutes (a song)", count: 7938000 },
    ],
    depths: [
      { label: "Low (256 levels)", values: 256 },
      { label: "CD quality (65,536 levels)", values: 65536 },
    ],
    defaultSize: 0,
    defaultDepth: 0,
    explain: (size, depth) =>
      `${size.count.toLocaleString()} samples, each with ${depth.values.toLocaleString()} possible levels`,
  },
};

const COMPARISONS = [
  { label: "Grains of sand on Earth", exponent: 19 },
  { label: "Stars in observable universe", exponent: 24 },
  { label: "Atoms in a human body", exponent: 28 },
  { label: "Atoms in Earth", exponent: 50 },
  { label: "Atoms in observable universe", exponent: 80 },
  { label: "Possible chess games", exponent: 120 },
];

function formatBigNumber(count: number, values: number): { mantissa: string; exponent: number } {
  const log10Total = count * Math.log10(values);
  const exponent = Math.floor(log10Total);
  const mantissa = Math.pow(10, log10Total - exponent);
  return { mantissa: mantissa.toFixed(2), exponent };
}

export function LookupTableExplosion() {
  const [inputType, setInputType] = useState<InputType>("image");
  const [sizeIdx, setSizeIdx] = useState(0);
  const [depthIdx, setDepthIdx] = useState(0);

  const config = INPUT_CONFIGS[inputType];
  const size = config.sizes[sizeIdx];
  const depth = config.depths[depthIdx];

  const resetState = useCallback(() => {
    setSizeIdx(0);
    setDepthIdx(0);
  }, []);

  const switchType = (type: InputType) => {
    setInputType(type);
    setSizeIdx(INPUT_CONFIGS[type].defaultSize);
    setDepthIdx(INPUT_CONFIGS[type].defaultDepth);
  };

  const { mantissa, exponent } = useMemo(
    () => formatBigNumber(size.count, depth.values),
    [size.count, depth.values]
  );

  const intensity = Math.min(exponent / 100, 1);

  return (
    <WidgetContainer
      title="Lookup Table Explosion"
      description="How many entries would a lookup table need?"
      onReset={resetState}
    >
      {/* Type selector */}
      <div className="mb-4 flex gap-1 rounded-lg bg-surface p-1">
        {(Object.keys(INPUT_CONFIGS) as InputType[]).map((type) => (
          <button
            key={type}
            onClick={() => switchType(type)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              inputType === type
                ? "bg-accent text-white shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {INPUT_CONFIGS[type].label}
          </button>
        ))}
      </div>

      {/* Size selector */}
      <div className="mb-3">
        <p className="mb-1.5 text-xs font-medium text-muted">{config.sizeLabel}</p>
        <div className="flex flex-wrap gap-1.5">
          {config.sizes.map((s, i) => (
            <button
              key={i}
              onClick={() => setSizeIdx(i)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                sizeIdx === i
                  ? "bg-accent text-white"
                  : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Depth selector */}
      <div className="mb-4">
        <p className="mb-1.5 text-xs font-medium text-muted">{config.depthLabel}</p>
        <div className="flex flex-wrap gap-1.5">
          {config.depths.map((d, i) => (
            <button
              key={i}
              onClick={() => setDepthIdx(i)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                depthIdx === i
                  ? "bg-accent text-white"
                  : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Explanation */}
      <p className="mb-3 text-center text-xs text-muted">
        {config.explain(size, depth)}
      </p>

      {/* Big number */}
      <div className="text-center">
        <p className="mb-1 text-xs text-muted">
          {depth.values.toLocaleString()}<sup>{size.count.toLocaleString()}</sup> possible inputs =
        </p>
        <p
          className="font-mono text-3xl font-bold transition-colors duration-300"
          style={{
            color: `color-mix(in srgb, var(--color-foreground) ${Math.round((1 - intensity) * 100)}%, var(--color-error) ${Math.round(intensity * 100)}%)`,
          }}
        >
          {exponent <= 6 ? (
            <>{Math.pow(depth.values, size.count).toLocaleString()}</>
          ) : (
            <>
              {mantissa} &times; 10<sup>{exponent.toLocaleString()}</sup>
            </>
          )}
        </p>
        <p className="mt-1 text-xs text-muted">table entries needed</p>
      </div>

      {/* Comparisons */}
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
