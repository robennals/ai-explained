"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";

type Tab = "text" | "image" | "color";

const INITIAL_TEXT = "Hello";
const GRID_SIZE = 8;
const COLORS = [
  "#000000",
  "#ffffff",
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#eab308",
  "#a855f7",
  "#f97316",
];

function createInitialGrid(): string[][] {
  const grid: string[][] = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => "#ffffff")
  );
  // Draw a simple smiley face
  // Eyes
  grid[2][2] = "#000000";
  grid[2][5] = "#000000";
  // Mouth
  grid[5][2] = "#000000";
  grid[5][5] = "#000000";
  grid[6][3] = "#000000";
  grid[6][4] = "#000000";
  return grid;
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function TextTab() {
  const [text, setText] = useState(INITIAL_TEXT);

  return (
    <div>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 30))}
        className="mb-4 w-full rounded-lg border border-border bg-surface px-4 py-2 font-mono text-lg text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        placeholder="Type something..."
        maxLength={30}
      />
      <div className="flex flex-wrap gap-2">
        {text.split("").map((char, i) => (
          <div
            key={i}
            className="flex flex-col items-center rounded-lg border border-border bg-surface px-3 py-2"
          >
            <span className="text-2xl font-medium text-foreground">
              {char === " " ? "\u00A0" : char}
            </span>
            <span className="mt-1 font-mono text-sm font-semibold text-accent">
              {char.charCodeAt(0)}
            </span>
          </div>
        ))}
      </div>
      {text.length > 0 && (
        <p className="mt-3 font-mono text-sm text-muted">
          [{text.split("").map((c) => c.charCodeAt(0)).join(", ")}]
        </p>
      )}
    </div>
  );
}

function ImageTab() {
  const [grid, setGrid] = useState<string[][]>(createInitialGrid);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [hoveredCell, setHoveredCell] = useState<[number, number] | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const paint = useCallback(
    (row: number, col: number) => {
      setGrid((prev) => {
        const next = prev.map((r) => [...r]);
        next[row][col] = selectedColor;
        return next;
      });
    },
    [selectedColor]
  );

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-medium text-muted">Color:</span>
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedColor(c)}
            className={`h-6 w-6 rounded border-2 transition-transform ${
              selectedColor === c
                ? "scale-110 border-accent"
                : "border-border hover:scale-105"
            }`}
            style={{ backgroundColor: c }}
            aria-label={`Select color ${c}`}
          />
        ))}
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <div>
          <div
            className="inline-grid gap-0.5 rounded-lg border border-border bg-border p-0.5"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            }}
            onMouseLeave={() => {
              setHoveredCell(null);
              setIsDrawing(false);
            }}
            onMouseUp={() => setIsDrawing(false)}
          >
            {grid.flatMap((row, r) =>
              row.map((color, c) => (
                <button
                  key={`${r}-${c}`}
                  className="h-7 w-7 transition-opacity hover:opacity-80 sm:h-8 sm:w-8"
                  style={{ backgroundColor: color }}
                  onMouseDown={() => {
                    setIsDrawing(true);
                    paint(r, c);
                  }}
                  onMouseEnter={() => {
                    setHoveredCell([r, c]);
                    if (isDrawing) paint(r, c);
                  }}
                  aria-label={`Pixel ${r},${c}`}
                />
              ))
            )}
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {hoveredCell ? (
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="mb-1 text-xs font-medium text-muted">
                Pixel [{hoveredCell[0]}, {hoveredCell[1]}]
              </p>
              <div className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded border border-border"
                  style={{
                    backgroundColor:
                      grid[hoveredCell[0]][hoveredCell[1]],
                  }}
                />
                <div className="font-mono text-sm">
                  {(() => {
                    const [r, g, b] = hexToRgb(
                      grid[hoveredCell[0]][hoveredCell[1]]
                    );
                    return (
                      <span>
                        [<span className="text-red-500">{r}</span>,{" "}
                        <span className="text-green-600">{g}</span>,{" "}
                        <span className="text-blue-500">{b}</span>]
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">
              Hover over a pixel to see its RGB values. Click or drag to paint.
            </p>
          )}
          <div className="mt-2 max-h-32 overflow-auto rounded border border-border bg-surface p-2 font-mono text-[10px] leading-tight text-muted">
            {grid.map((row, r) => (
              <div key={r}>
                {row
                  .map((color) => {
                    const [rv, gv, bv] = hexToRgb(color);
                    return `(${rv},${gv},${bv})`;
                  })
                  .join(" ")}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorTab() {
  const [r, setR] = useState(59);
  const [g, setG] = useState(130);
  const [b, setB] = useState(246);

  const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <div
          className="h-24 w-24 shrink-0 rounded-xl border border-border shadow-inner"
          style={{ backgroundColor: hex }}
        />
        <div className="font-mono text-lg font-semibold text-foreground">
          [<span className="text-red-500">{r}</span>,{" "}
          <span className="text-green-600">{g}</span>,{" "}
          <span className="text-blue-500">{b}</span>]
        </div>
      </div>
      <div className="space-y-3">
        <SliderControl
          label="Red"
          value={r}
          min={0}
          max={255}
          step={1}
          onChange={setR}
          formatValue={(v) => String(Math.round(v))}
        />
        <SliderControl
          label="Green"
          value={g}
          min={0}
          max={255}
          step={1}
          onChange={setG}
          formatValue={(v) => String(Math.round(v))}
        />
        <SliderControl
          label="Blue"
          value={b}
          min={0}
          max={255}
          step={1}
          onChange={setB}
          formatValue={(v) => String(Math.round(v))}
        />
      </div>
    </div>
  );
}

export function NumbersEverywhere() {
  const [activeTab, setActiveTab] = useState<Tab>("text");

  const tabs: { id: Tab; label: string }[] = [
    { id: "text", label: "Text" },
    { id: "image", label: "Image" },
    { id: "color", label: "Color" },
  ];

  return (
    <WidgetContainer
      title="Numbers Everywhere"
      description="Everything a computer works with is just numbers"
    >
      <div className="mb-4 flex gap-1 rounded-lg bg-surface p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-accent text-white shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === "text" && <TextTab />}
      {activeTab === "image" && <ImageTab />}
      {activeTab === "color" && <ColorTab />}
    </WidgetContainer>
  );
}
