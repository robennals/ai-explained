"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { useEmbeddingData } from "./useEmbeddingData";
import { vecSub, vecNormalize, dotProduct } from "./embeddingUtils";

interface AxisDef {
  from: string;
  to: string;
}

interface Preset {
  label: string;
  x: AxisDef;
  y: AxisDef;
}

const PRESETS: Preset[] = [
  { label: "gender vs power", x: { from: "man", to: "woman" }, y: { from: "servant", to: "king" } },
  { label: "land vs water", x: { from: "land", to: "water" }, y: { from: "small", to: "big" } },
  { label: "old vs new", x: { from: "old", to: "new" }, y: { from: "safe", to: "dangerous" } },
];

function AxisInput({
  label,
  axis,
  onChange,
  words,
}: {
  label: string;
  axis: AxisDef;
  onChange: (axis: AxisDef) => void;
  words: string[];
}) {
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);

  const fromSuggestions = useMemo(() => {
    if (fromInput.length < 1) return [];
    return words.filter((w) => w.startsWith(fromInput.toLowerCase())).slice(0, 6);
  }, [fromInput, words]);

  const toSuggestions = useMemo(() => {
    if (toInput.length < 1) return [];
    return words.filter((w) => w.startsWith(toInput.toLowerCase())).slice(0, 6);
  }, [toInput, words]);

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted whitespace-nowrap">{label}:</span>
      {/* From word */}
      <div className="relative flex-1">
        <input
          type="text"
          value={fromInput}
          onChange={(e) => { setFromInput(e.target.value); setShowFrom(true); }}
          onFocus={() => setShowFrom(true)}
          onBlur={() => setTimeout(() => setShowFrom(false), 200)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && fromSuggestions.length > 0) {
              e.preventDefault();
              onChange({ ...axis, from: fromSuggestions[0] });
              setFromInput("");
              setShowFrom(false);
            }
          }}
          placeholder={axis.from}
          className="w-full rounded-md border border-border bg-white px-2 py-1 text-[11px] text-foreground outline-none focus:border-accent"
        />
        {showFrom && fromSuggestions.length > 0 && (
          <div className="absolute left-0 top-full z-20 mt-0.5 max-h-32 w-full overflow-y-auto rounded-md border border-border bg-white shadow-lg">
            {fromSuggestions.map((w) => (
              <button
                key={w}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onChange({ ...axis, from: w }); setFromInput(""); setShowFrom(false); }}
                className="block w-full px-2 py-1 text-left text-[11px] text-foreground hover:bg-accent/10"
              >
                {w}
              </button>
            ))}
          </div>
        )}
      </div>
      <span className="text-muted text-xs">→</span>
      {/* To word */}
      <div className="relative flex-1">
        <input
          type="text"
          value={toInput}
          onChange={(e) => { setToInput(e.target.value); setShowTo(true); }}
          onFocus={() => setShowTo(true)}
          onBlur={() => setTimeout(() => setShowTo(false), 200)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && toSuggestions.length > 0) {
              e.preventDefault();
              onChange({ ...axis, to: toSuggestions[0] });
              setToInput("");
              setShowTo(false);
            }
          }}
          placeholder={axis.to}
          className="w-full rounded-md border border-border bg-white px-2 py-1 text-[11px] text-foreground outline-none focus:border-accent"
        />
        {showTo && toSuggestions.length > 0 && (
          <div className="absolute left-0 top-full z-20 mt-0.5 max-h-32 w-full overflow-y-auto rounded-md border border-border bg-white shadow-lg">
            {toSuggestions.map((w) => (
              <button
                key={w}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onChange({ ...axis, to: w }); setToInput(""); setShowTo(false); }}
                className="block w-full px-2 py-1 text-left text-[11px] text-foreground hover:bg-accent/10"
              >
                {w}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CustomAxisScatter() {
  const { data, loading, error } = useEmbeddingData();
  const [xAxis, setXAxis] = useState<AxisDef>({ from: "man", to: "woman" });
  const [yAxis, setYAxis] = useState<AxisDef>({ from: "servant", to: "king" });
  const [searchWord, setSearchWord] = useState("");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 500, height: 450 });

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        setDims({ width: w, height: Math.min(w * 0.85, 500) });
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const resetState = useCallback(() => {
    setXAxis({ from: "man", to: "woman" });
    setYAxis({ from: "servant", to: "king" });
    setSearchWord("");
    setHoveredIdx(null);
  }, []);

  // Compute axis directions and project all words
  const projections = useMemo(() => {
    if (!data) return null;
    const getVec = (w: string) => {
      const idx = data.words.indexOf(w);
      return idx >= 0 ? data.vectors[idx] : null;
    };

    const xFrom = getVec(xAxis.from);
    const xTo = getVec(xAxis.to);
    const yFrom = getVec(yAxis.from);
    const yTo = getVec(yAxis.to);

    if (!xFrom || !xTo || !yFrom || !yTo) return null;

    const xDir = vecNormalize(vecSub(xTo, xFrom));
    const yDir = vecNormalize(vecSub(yTo, yFrom));

    const points = data.words.map((_, i) => ({
      x: dotProduct(data.vectors[i], xDir),
      y: dotProduct(data.vectors[i], yDir),
    }));

    // Compute bounds for scaling
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    // Trim outliers (use percentile approach)
    const xs = points.map((p) => p.x).sort((a, b) => a - b);
    const ys = points.map((p) => p.y).sort((a, b) => a - b);
    const p5 = Math.floor(points.length * 0.02);
    const p95 = Math.floor(points.length * 0.98);
    minX = xs[p5]; maxX = xs[p95];
    minY = ys[p5]; maxY = ys[p95];

    // Add padding
    const padX = (maxX - minX) * 0.1;
    const padY = (maxY - minY) * 0.1;
    minX -= padX; maxX += padX;
    minY -= padY; maxY += padY;

    return { points, minX, maxX, minY, maxY };
  }, [data, xAxis, yAxis]);

  // Find highlighted word by search
  const highlightedIdx = useMemo(() => {
    if (!data || !searchWord) return -1;
    return data.words.indexOf(searchWord.toLowerCase());
  }, [data, searchWord]);

  const handlePreset = (preset: Preset) => {
    setXAxis(preset.x);
    setYAxis(preset.y);
  };

  if (loading) {
    return (
      <WidgetContainer title="Custom Axis Scatter" description="Loading...">
        <div className="flex items-center justify-center p-8 text-sm text-muted">Loading word vectors...</div>
      </WidgetContainer>
    );
  }

  if (error || !data) {
    return (
      <WidgetContainer title="Custom Axis Scatter">
        <div className="p-4 text-sm text-error">Failed to load embedding data.</div>
      </WidgetContainer>
    );
  }

  const MARGIN = { top: 15, right: 15, bottom: 40, left: 50 };
  const plotW = dims.width - MARGIN.left - MARGIN.right;
  const plotH = dims.height - MARGIN.top - MARGIN.bottom;

  const scaleX = (v: number) => {
    if (!projections) return 0;
    return MARGIN.left + ((v - projections.minX) / (projections.maxX - projections.minX)) * plotW;
  };
  const scaleY = (v: number) => {
    if (!projections) return 0;
    return dims.height - MARGIN.bottom - ((v - projections.minY) / (projections.maxY - projections.minY)) * plotH;
  };

  return (
    <WidgetContainer
      title="Directions in Embedding Space"
      description="Define custom axes by word pairs. Every word is projected onto these two directions."
      onReset={resetState}
    >
      {/* Presets */}
      <div className="mb-3 flex flex-wrap gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted self-center">Presets:</span>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => handlePreset(p)}
            className="rounded-lg bg-surface px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:bg-accent/10 hover:text-accent"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Axis inputs */}
      <div className="mb-3 space-y-2">
        <AxisInput label="X axis" axis={xAxis} onChange={setXAxis} words={data.words} />
        <AxisInput label="Y axis" axis={yAxis} onChange={setYAxis} words={data.words} />
      </div>

      {/* Search */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Find:</span>
        <input
          type="text"
          value={searchWord}
          onChange={(e) => setSearchWord(e.target.value)}
          placeholder="Search for a word..."
          className="flex-1 rounded-md border border-border bg-white px-2 py-1 text-[11px] text-foreground outline-none focus:border-accent"
        />
      </div>

      {/* Scatter plot */}
      <div ref={containerRef}>
        {projections ? (
          <svg width={dims.width} height={dims.height} className="overflow-visible">
            {/* Axes */}
            <line
              x1={MARGIN.left} y1={dims.height - MARGIN.bottom}
              x2={dims.width - MARGIN.right} y2={dims.height - MARGIN.bottom}
              stroke="var(--color-foreground)" strokeWidth={1} opacity={0.2}
            />
            <line
              x1={MARGIN.left} y1={MARGIN.top}
              x2={MARGIN.left} y2={dims.height - MARGIN.bottom}
              stroke="var(--color-foreground)" strokeWidth={1} opacity={0.2}
            />

            {/* Axis labels */}
            <text x={dims.width / 2} y={dims.height - 5} textAnchor="middle" className="fill-muted text-[10px]">
              ← {xAxis.from} · · · {xAxis.to} →
            </text>
            <text
              x={10} y={dims.height / 2}
              textAnchor="middle"
              className="fill-muted text-[10px]"
              transform={`rotate(-90, 10, ${dims.height / 2})`}
            >
              ← {yAxis.from} · · · {yAxis.to} →
            </text>

            {/* Data points */}
            {projections.points.map((pt, i) => {
              const cx = scaleX(pt.x);
              const cy = scaleY(pt.y);
              // Skip out-of-bounds
              if (cx < MARGIN.left || cx > dims.width - MARGIN.right) return null;
              if (cy < MARGIN.top || cy > dims.height - MARGIN.bottom) return null;

              const isHovered = hoveredIdx === i;
              const isHighlighted = highlightedIdx === i;
              const isAxisWord =
                data.words[i] === xAxis.from || data.words[i] === xAxis.to ||
                data.words[i] === yAxis.from || data.words[i] === yAxis.to;

              const showLabel = isHovered || isHighlighted || isAxisWord;

              return (
                <g
                  key={i}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="cursor-default"
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={showLabel ? 4 : 1.5}
                    fill={isAxisWord ? "var(--color-accent)" : isHighlighted ? "#ef4444" : "var(--color-foreground)"}
                    opacity={showLabel ? 1 : 0.15}
                  />
                  {/* Invisible larger hit target */}
                  <circle cx={cx} cy={cy} r={6} fill="transparent" />
                  {showLabel && (
                    <text
                      x={cx}
                      y={cy - 7}
                      textAnchor="middle"
                      className="text-[10px] font-semibold pointer-events-none select-none"
                      fill={isAxisWord ? "var(--color-accent)" : isHighlighted ? "#ef4444" : "var(--color-foreground)"}
                    >
                      {data.words[i]}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        ) : (
          <div className="flex items-center justify-center rounded-lg bg-surface p-12 text-xs text-muted">
            Enter valid word pairs for both axes to see the plot.
          </div>
        )}
      </div>
    </WidgetContainer>
  );
}
