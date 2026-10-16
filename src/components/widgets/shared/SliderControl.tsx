"use client";

import * as Slider from "@radix-ui/react-slider";

interface SliderControlProps {
  label: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  onCommit?: (value: number) => void;
  formatValue?: (value: number) => string;
  /** Show tick marks at these values along the track */
  ticks?: number[];
}

export function SliderControl({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  onCommit,
  formatValue,
  ticks,
}: SliderControlProps) {
  const displayValue = formatValue ? formatValue(value) : value.toFixed(2);
  // Phones: label and value on one line above a full-width track, with a
  // larger thumb and touch area. Wider screens: everything on one row.
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
      <div className="flex items-baseline justify-between gap-2 sm:contents">
        <label className="overflow-visible whitespace-nowrap text-xs font-medium text-muted sm:mr-2 sm:w-24 sm:shrink-0">
          {label}
        </label>
        <span className="font-mono text-xs text-muted sm:hidden">{displayValue}</span>
      </div>
      <Slider.Root
        className="relative flex h-8 w-full touch-none select-none items-center sm:h-5 sm:w-auto sm:flex-1"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        onValueCommit={onCommit ? ([v]) => onCommit(v) : undefined}
      >
        <Slider.Track className="relative h-1.5 flex-1 rounded-full bg-foreground/10 sm:h-1">
          <Slider.Range className="absolute h-full rounded-full bg-accent" />
          {ticks?.map((t) => {
            const pct = ((t - min) / (max - min)) * 100;
            return (
              <span
                key={t}
                className="absolute top-1/2 h-2 w-[1.5px] -translate-y-1/2 rounded-full bg-foreground/20"
                style={{ left: `${pct}%` }}
              />
            );
          })}
        </Slider.Track>
        <Slider.Thumb className="block h-6 w-6 rounded-full border-2 border-accent bg-white shadow-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-accent/30 sm:h-4 sm:w-4" />
      </Slider.Root>
      <span className="hidden w-12 shrink-0 text-left font-mono text-[10px] text-muted sm:block">
        {displayValue}
      </span>
    </div>
  );
}
