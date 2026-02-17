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
  return (
    <div className="flex items-center gap-4">
      <label className="w-24 shrink-0 text-xs font-medium text-muted">
        {label}
      </label>
      <Slider.Root
        className="relative flex h-5 flex-1 touch-none select-none items-center"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        onValueCommit={onCommit ? ([v]) => onCommit(v) : undefined}
      >
        <Slider.Track className="relative h-1 flex-1 rounded-full bg-foreground/10">
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
        <Slider.Thumb className="block h-4 w-4 rounded-full border-2 border-accent bg-white shadow-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-accent/30" />
      </Slider.Root>
      <span className="w-12 shrink-0 text-right font-mono text-xs text-muted">
        {formatValue ? formatValue(value) : value.toFixed(2)}
      </span>
    </div>
  );
}
