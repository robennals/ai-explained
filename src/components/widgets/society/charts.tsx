"use client";

import { useState } from "react";
import type { Comparison, TrendChart } from "./resourceData";

const AI_COLOR = "#2a78d6";
const OTHER_COLOR = "#a3a3a3";
/** Categorical slots for line series, in fixed order; AI always takes slot 1. */
const SERIES_COLORS = ["#2a78d6", "#eb6834", "#1baf7a"];

export function formatNumber(value: number): string {
  if (value === 0) return "0";
  if (value >= 100_000) return value.toLocaleString("en-US", { notation: "compact", maximumSignificantDigits: 2 });
  if (value >= 1000) return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (value >= 10) return value.toFixed(0);
  if (value >= 1) return value.toFixed(1).replace(/\.0$/, "");
  return value.toPrecision(2);
}

/** Round tick values (1, 2 or 5 times a power of ten) covering 0 to max. */
export function niceTicks(max: number, count = 4): number[] {
  const rough = max / count;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((m) => m * power).find((s) => s >= rough) ?? 10 * power;
  const ticks: number[] = [];
  for (let t = 0; t <= max + step / 2; t += step) ticks.push(t);
  return ticks;
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

/**
 * Horizontal bars on a linear scale, one per item, AI items in colour and everything else in
 * grey. Hovering or tapping a bar shows what its number measures.
 */
export function BarComparison({ comparison }: { comparison: Comparison }) {
  const [selected, setSelected] = useState<string | null>(null);
  const max = Math.max(...comparison.bars.map((b) => b.value));
  const widthPct = (value: number) => (value / max) * 100;
  const note = comparison.bars.find((b) => b.label === selected)?.note;
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Legend items={[{ label: "AI", color: AI_COLOR }, { label: "Everything else", color: OTHER_COLOR }]} />
        <span className="text-xs text-muted">{comparison.unit}</span>
      </div>
      <div className="space-y-1.5">
        {comparison.bars.map((bar) => {
          const isSelected = bar.label === selected;
          return (
            <button
              key={bar.label}
              type="button"
              onMouseEnter={() => setSelected(bar.label)}
              onFocus={() => setSelected(bar.label)}
              onClick={() => setSelected(bar.label)}
              className={`grid w-full grid-cols-[minmax(7rem,12rem)_1fr_3.5rem] items-center gap-3 rounded-md px-1 py-0.5 text-left transition-colors ${
                isSelected ? "bg-foreground/5" : "hover:bg-foreground/5"
              }`}
            >
              <span className="text-sm leading-tight text-foreground">{bar.label}</span>
              <span className="relative block h-4">
                <span
                  className="absolute inset-y-0 left-0 rounded-r"
                  style={{
                    width: `${Math.max(widthPct(bar.value), 0.8)}%`,
                    backgroundColor: bar.isAI ? AI_COLOR : OTHER_COLOR,
                  }}
                />
              </span>
              <span className="font-mono text-xs text-muted">{formatNumber(bar.value)}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 min-h-[2.5rem] rounded-md bg-surface px-3 py-2 text-sm leading-snug text-foreground">
        {note ?? "Hover over or tap a bar to see exactly what it measures."}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{comparison.footnote}</p>
    </div>
  );
}

const W = 560;
const H = 260;
const PAD = { left: 48, right: 56, top: 16, bottom: 32 };

/**
 * A line per series over the years. Measured stretches are solid, forecasts
 * dashed, and a forecast range is drawn as a vertical bar.
 */
export function TrendLines({ chart }: { chart: TrendChart }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const allPoints = chart.series.flatMap((s) => s.points);
  const years = allPoints.map((p) => p.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const maxValue = Math.max(...allPoints.map((p) => p.range?.[1] ?? p.value)) * 1.1;
  const x = (year: number) => PAD.left + ((year - minYear) / (maxYear - minYear)) * (W - PAD.left - PAD.right);
  const y = (value: number) => H - PAD.bottom - (value / maxValue) * (H - PAD.top - PAD.bottom);
  const ticks = niceTicks(maxValue / 1.1).filter((t) => t <= maxValue);
  const colored = chart.series.map((s, i) => ({
    ...s,
    color: s.isAI ? SERIES_COLORS[0] : SERIES_COLORS[(i % (SERIES_COLORS.length - 1)) + 1],
  }));

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        {colored.length > 1 ? <Legend items={colored.map((s) => ({ label: s.label, color: s.color }))} /> : <span />}
        <span className="text-xs text-muted">{chart.unit}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${chart.title}: ${chart.unit}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#e5e7eb" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(t) + 4} fontSize={11} textAnchor="end" fill="#6b7280">
              {formatNumber(t)}
            </text>
          </g>
        ))}
        {[...new Set(years)].map((year) => (
          <text key={year} x={x(year)} y={H - 10} fontSize={11} textAnchor="middle" fill="#6b7280">
            {year}
          </text>
        ))}
        {colored.map((s) => (
            <g key={s.label}>
              {s.points.slice(1).map((p, i) => {
                const prev = s.points[i];
                return (
                  <line
                    key={p.year}
                    x1={x(prev.year)}
                    y1={y(prev.value)}
                    x2={x(p.year)}
                    y2={y(p.value)}
                    stroke={s.color}
                    strokeWidth={2}
                    strokeDasharray={p.projected ? "5 5" : undefined}
                  />
                );
              })}
              {s.points.map((p) => {
                const id = `${s.label}-${p.year}`;
                return (
                  <g key={id} onMouseEnter={() => setHovered(id)} onMouseLeave={() => setHovered(null)}>
                    {p.range && (
                      <line x1={x(p.year)} x2={x(p.year)} y1={y(p.range[0])} y2={y(p.range[1])} stroke={s.color} strokeWidth={6} strokeOpacity={0.3} strokeLinecap="round" />
                    )}
                    <circle cx={x(p.year)} cy={y(p.value)} r={12} fill="transparent" />
                    <circle
                      cx={x(p.year)}
                      cy={y(p.value)}
                      r={4.5}
                      fill={p.projected ? "white" : s.color}
                      stroke={s.color}
                      strokeWidth={2}
                    />
                    {hovered === id && (
                      <text x={x(p.year)} y={y(p.value) - 12} fontSize={12} textAnchor="middle" fill="#111827" fontWeight={600}>
                        {p.range ? `${formatNumber(p.range[0])}–${formatNumber(p.range[1])}` : formatNumber(p.value)}
                        {p.projected ? " (forecast)" : ""}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          ))}
      </svg>
      <p className="mt-2 text-sm leading-relaxed text-muted">{chart.footnote}</p>
    </div>
  );
}
