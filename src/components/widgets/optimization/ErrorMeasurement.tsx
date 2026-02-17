"use client";

import { useState, useCallback } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";

interface Example {
  id: string;
  label: string;
  thing: string;
  unit: string;
  current: number;
  perfect: number;
  /** higher is better (like exam score) vs lower is better (like race time) */
  higherIsBetter: boolean;
  sliderMin: number;
  sliderMax: number;
  step: number;
  format: (v: number) => string;
  errorLabel: string;
  /** "green-red" = green value bar + red error, "red-only" = only red error bar */
  barStyle: "green-red" | "red-only";
  /** show star icons instead of a plain bar */
  showStars?: boolean;
  /** total number of stars (for star mode) */
  starCount?: number;
}

const GOOD_COLOR = "#22c55e"; // green for "good" portion
const ERROR_COLOR = "#ef4444"; // red for error
const MUTED_COLOR = "#6b7280"; // grey for labels/markers

const EXAMPLES: Example[] = [
  {
    id: "exam",
    label: "Exam score",
    thing: "Your score",
    unit: "points",
    current: 72,
    perfect: 100,
    higherIsBetter: true,
    sliderMin: 0,
    sliderMax: 100,
    step: 1,
    format: (v) => `${v}`,
    errorLabel: "points from perfect",
    barStyle: "green-red",
  },
  {
    id: "race",
    label: "100m sprint",
    thing: "Your time",
    unit: "seconds",
    current: 14.2,
    perfect: 0,
    higherIsBetter: false,
    sliderMin: 0,
    sliderMax: 20,
    step: 0.1,
    format: (v) => `${v.toFixed(1)}s`,
    errorLabel: "seconds (your whole time is the error!)",
    barStyle: "red-only",
  },
  {
    id: "restaurant",
    label: "Restaurant rating",
    thing: "Your rating",
    unit: "stars",
    current: 3.2,
    perfect: 5.0,
    higherIsBetter: true,
    sliderMin: 0,
    sliderMax: 5,
    step: 0.1,
    format: (v) => `${v.toFixed(1)} ★`,
    errorLabel: "stars from perfect",
    barStyle: "green-red",
    showStars: true,
    starCount: 5,
  },
];

const BAR_WIDTH = 380;
const BAR_HEIGHT = 32;
const SVG_WIDTH = 460;
const SVG_HEIGHT = 140;
const BAR_X = 40;
const BAR_Y = 30;
const ERROR_Y = BAR_Y + BAR_HEIGHT + 36;

/** Render a star path centered at (0,0) with given radius */
function starPath(outerR: number, innerR: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / 2) + (i * Math.PI) / 5;
    pts.push(`${Math.cos(angle) * r},${-Math.sin(angle) * r}`);
  }
  return `M${pts.join("L")}Z`;
}

type ExampleId = "exam" | "race" | "restaurant";

const ERROR_TABS: { id: ExampleId; label: string }[] = EXAMPLES.map((e) => ({
  id: e.id as ExampleId,
  label: e.label,
}));

export function ErrorMeasurement() {
  const [selectedId, setSelectedId] = useState<ExampleId>("exam");
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(EXAMPLES.map((e) => [e.id, e.current]))
  );

  const ex = EXAMPLES.find((e) => e.id === selectedId)!;
  const value = values[ex.id];
  const error = ex.higherIsBetter
    ? ex.perfect - value
    : value - ex.perfect;

  const reset = useCallback(() => {
    setValues(Object.fromEntries(EXAMPLES.map((e) => [e.id, e.current])));
    setSelectedId("exam");
  }, []);

  // Normalized positions on the bar (0 to 1)
  const range = ex.sliderMax - ex.sliderMin;
  const valueFrac = (value - ex.sliderMin) / range;
  const perfectFrac = (ex.perfect - ex.sliderMin) / range;

  const valueBarX = BAR_X + valueFrac * BAR_WIDTH;
  const perfectBarX = BAR_X + perfectFrac * BAR_WIDTH;

  // Error region: between value and perfect
  const errorLeft = Math.min(valueBarX, perfectBarX);
  const errorWidth = Math.abs(valueBarX - perfectBarX);

  // For green-red style: "good" region is from bar start to value (higherIsBetter)
  // or from value to bar end (lowerIsBetter — but we don't have that combo with green-red)
  const goodWidth = ex.higherIsBetter
    ? Math.max(0, valueFrac * BAR_WIDTH)
    : 0;

  return (
    <WidgetContainer
      title="Measuring the Error"
      description="To improve something, you first need a number that says how far off it is"
      onReset={reset}
    >
      {/* Example tabs */}
      <WidgetTabs tabs={ERROR_TABS} activeTab={selectedId} onTabChange={setSelectedId} />

      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Bar background */}
        <rect
          x={BAR_X} y={BAR_Y}
          width={BAR_WIDTH} height={BAR_HEIGHT}
          rx={4}
          fill="currentColor" opacity={0.06}
        />

        {/* Green "good" portion (exam, restaurant) */}
        {ex.barStyle === "green-red" && goodWidth > 0 && (
          <rect
            x={BAR_X} y={BAR_Y}
            width={goodWidth} height={BAR_HEIGHT}
            rx={4}
            fill={GOOD_COLOR} opacity={0.25}
          />
        )}

        {/* Red error region */}
        {errorWidth > 1 && (
          <rect
            x={ex.barStyle === "red-only" ? BAR_X : errorLeft}
            y={BAR_Y}
            width={ex.barStyle === "red-only" ? Math.max(0, valueFrac * BAR_WIDTH) : errorWidth}
            height={BAR_HEIGHT}
            rx={4}
            fill={ERROR_COLOR} opacity={0.2}
          />
        )}

        {/* Star overlays for restaurant */}
        {ex.showStars && ex.starCount && (() => {
          const stars = [];
          const starR = BAR_HEIGHT * 0.35;
          const starInnerR = starR * 0.4;
          const d = starPath(starR, starInnerR);
          for (let i = 0; i < ex.starCount; i++) {
            const starValue = i + 1;
            const frac = (starValue - 0.5) / ex.sliderMax;
            const cx = BAR_X + frac * BAR_WIDTH;
            const cy = BAR_Y + BAR_HEIGHT / 2;
            const filled = value >= starValue;
            const partial = !filled && value > starValue - 1;
            let fillColor = MUTED_COLOR;
            let fillOpacity = 0.15;
            if (filled) {
              // Is this star in the "good" zone or error zone?
              fillColor = starValue <= ex.perfect ? GOOD_COLOR : ERROR_COLOR;
              fillOpacity = 0.7;
            } else if (partial) {
              fillColor = GOOD_COLOR;
              fillOpacity = 0.35;
            }
            stars.push(
              <path
                key={i}
                d={d}
                transform={`translate(${cx},${cy})`}
                fill={fillColor}
                opacity={fillOpacity}
                stroke={starValue <= value ? GOOD_COLOR : starValue <= ex.perfect ? ERROR_COLOR : MUTED_COLOR}
                strokeWidth="1"
                strokeOpacity={0.5}
              />
            );
          }
          return stars;
        })()}

        {/* Perfect marker */}
        <line
          x1={perfectBarX} y1={BAR_Y - 4}
          x2={perfectBarX} y2={BAR_Y + BAR_HEIGHT + 4}
          stroke={MUTED_COLOR} strokeWidth="2" strokeDasharray="3,2"
        />
        <text
          x={Math.max(40, Math.min(SVG_WIDTH - 40, perfectBarX))}
          y={BAR_Y - 8}
          textAnchor={perfectBarX < 80 ? "start" : perfectBarX > SVG_WIDTH - 80 ? "end" : "middle"}
          fontSize="10" fontWeight="600" fill={MUTED_COLOR}
        >
          perfect ({ex.format(ex.perfect)})
        </text>

        {/* Current value marker */}
        <line
          x1={valueBarX} y1={BAR_Y - 4}
          x2={valueBarX} y2={BAR_Y + BAR_HEIGHT + 4}
          stroke={MUTED_COLOR} strokeWidth="2.5"
        />
        <text
          x={Math.max(40, Math.min(SVG_WIDTH - 40, valueBarX))}
          y={BAR_Y + BAR_HEIGHT + 16}
          textAnchor={valueBarX < 80 ? "start" : valueBarX > SVG_WIDTH - 80 ? "end" : "middle"}
          fontSize="10" fontWeight="600" fill={MUTED_COLOR}
        >
          {ex.thing}: {ex.format(value)}
        </text>

        {/* Error bracket and label */}
        {errorWidth > 4 && (() => {
          const errorCenterX = errorLeft + errorWidth / 2;
          // Pin to left or right when near edges
          const pinLeft = errorCenterX < SVG_WIDTH / 2;
          const errorAnchor = pinLeft ? "start" : "end";
          const errorLabelX = pinLeft ? Math.max(10, errorLeft + 2) : Math.min(SVG_WIDTH - 10, errorLeft + errorWidth - 2);
          return (
            <g>
              {/* Bracket lines */}
              <line x1={errorLeft + 2} y1={ERROR_Y} x2={errorLeft + errorWidth - 2} y2={ERROR_Y} stroke={ERROR_COLOR} strokeWidth="1.5" />
              <line x1={errorLeft + 2} y1={ERROR_Y - 4} x2={errorLeft + 2} y2={ERROR_Y + 4} stroke={ERROR_COLOR} strokeWidth="1.5" />
              <line x1={errorLeft + errorWidth - 2} y1={ERROR_Y - 4} x2={errorLeft + errorWidth - 2} y2={ERROR_Y + 4} stroke={ERROR_COLOR} strokeWidth="1.5" />
              {/* Error label */}
              <text
                x={errorLabelX}
                y={ERROR_Y + 16}
                textAnchor={errorAnchor} fontSize="11" fontWeight="700" fill={ERROR_COLOR}
              >
                error: {Math.abs(error).toFixed(ex.step < 1 ? 1 : 0)} {ex.errorLabel}
              </text>
            </g>
          );
        })()}
      </svg>

      {/* Slider to adjust value */}
      <div className="mt-1 flex items-center gap-3 px-1">
        <label className="shrink-0 text-xs font-medium text-muted">{ex.thing}</label>
        <input
          type="range"
          min={ex.sliderMin}
          max={ex.sliderMax}
          step={ex.step}
          value={value}
          onChange={(e) => setValues((prev) => ({ ...prev, [ex.id]: parseFloat(e.target.value) }))}
          className="flex-1"
        />
        <span className="w-12 shrink-0 text-right font-mono text-xs font-bold text-foreground">
          {ex.format(value)}
        </span>
      </div>
    </WidgetContainer>
  );
}
