"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

const PANEL_WIDTH = 260;
const PANEL_HEIGHT = 200;
const PADDING = 20;
const BALL_R = 7;

// Animation constants
const PIXEL_STEP = 1 / (PANEL_WIDTH - 2 * PADDING); // one pixel in x-space
const FRAME_DELAY = 16; // ~60fps

// Smooth landscape
function smoothFn(x: number): number {
  return (x - 0.5) * (x - 0.5);
}

// Rugged landscape: same bowl + noise
function ruggedFn(x: number): number {
  return (x - 0.5) * (x - 0.5) + 0.05 * Math.sin(15 * Math.PI * x);
}

// Which direction is downhill? Returns -1, 0, or +1
function downhillDir(fn: (x: number) => number, x: number): number {
  const h = PIXEL_STEP;
  const here = fn(x);
  const left = x - h >= 0 ? fn(x - h) : Infinity;
  const right = x + h <= 1 ? fn(x + h) : Infinity;
  if (left < here && left <= right) return -1;
  if (right < here) return 1;
  return 0; // local minimum
}

function xToSvg(x: number): number {
  return PADDING + x * (PANEL_WIDTH - 2 * PADDING);
}

function yToSvg(y: number, maxY: number): number {
  return PANEL_HEIGHT - PADDING - (y / maxY) * (PANEL_HEIGHT - 2 * PADDING);
}

function generateLandscapePath(fn: (x: number) => number, maxY: number): string {
  const points: string[] = [];
  const steps = 200;
  for (let i = 0; i <= steps; i++) {
    const x = i / steps;
    const y = fn(x);
    const sx = xToSvg(x);
    const sy = yToSvg(y, maxY);
    points.push(`${i === 0 ? "M" : "L"}${sx.toFixed(1)},${sy.toFixed(1)}`);
  }
  return points.join(" ");
}

function generateFillPath(fn: (x: number) => number, maxY: number): string {
  let path = `M${xToSvg(0).toFixed(1)},${PANEL_HEIGHT}`;
  const steps = 200;
  for (let i = 0; i <= steps; i++) {
    const x = i / steps;
    const y = fn(x);
    const sx = xToSvg(x);
    const sy = yToSvg(y, maxY);
    path += ` L${sx.toFixed(1)},${sy.toFixed(1)}`;
  }
  path += ` L${xToSvg(1).toFixed(1)},${PANEL_HEIGHT} Z`;
  return path;
}

interface PanelData {
  ballX: number | null;
  trail: number[];
  steps: number;
  loss: number | null;
  settled: boolean;
  running: boolean;
}

const INITIAL_PANEL: PanelData = {
  ballX: null,
  trail: [],
  steps: 0,
  loss: null,
  settled: false,
  running: false,
};

function LandscapePanel({
  title,
  fn,
  maxY,
  panelData,
  onDrop,
}: {
  title: string;
  fn: (x: number) => number;
  maxY: number;
  panelData: PanelData;
  onDrop: () => void;
}) {
  const landscapePath = generateLandscapePath(fn, maxY);
  const fillPath = generateFillPath(fn, maxY);
  const { ballX, trail, steps, loss, settled } = panelData;

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-semibold text-foreground">{title}</span>
      <button
        onClick={onDrop}
        disabled={panelData.running}
        className="rounded-md bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20 disabled:opacity-40"
      >
        {panelData.running ? "Rolling..." : "Drop ball"}
      </button>
      <svg
        viewBox={`0 0 ${PANEL_WIDTH} ${PANEL_HEIGHT}`}
        className="w-full cursor-pointer rounded-lg border border-border bg-surface"
        preserveAspectRatio="xMidYMid meet"
        onClick={onDrop}
      >
        {/* Landscape fill */}
        <path d={fillPath} fill="var(--color-accent)" opacity={0.06} />

        {/* Landscape line */}
        <path d={landscapePath} fill="none" stroke="var(--color-accent)" strokeWidth="2" />

        {/* Trail: previous positions as fading dots */}
        {trail.map((tx, i) => {
          const isLast = i === trail.length - 1;
          if (isLast) return null;
          const opacity = 0.1 + 0.3 * (i / trail.length);
          return (
            <circle
              key={`trail-${i}`}
              cx={xToSvg(tx)}
              cy={yToSvg(fn(tx), maxY) - BALL_R}
              r={3}
              fill="var(--color-error)"
              opacity={opacity}
            />
          );
        })}

        {/* Trail lines */}
        {trail.map((tx, i) =>
          i > 0 ? (
            <line
              key={`tl-${i}`}
              x1={xToSvg(trail[i - 1])}
              y1={yToSvg(fn(trail[i - 1]), maxY) - BALL_R}
              x2={xToSvg(tx)}
              y2={yToSvg(fn(tx), maxY) - BALL_R}
              stroke="var(--color-error)"
              strokeWidth="1"
              opacity={0.15}
            />
          ) : null
        )}

        {/* Ball */}
        {ballX !== null && (
          <>
            <circle
              cx={xToSvg(ballX)}
              cy={yToSvg(fn(ballX), maxY) - BALL_R}
              r={BALL_R}
              fill="var(--color-error)"
              stroke="white"
              strokeWidth="1.5"
            />
            {/* Shine */}
            <circle
              cx={xToSvg(ballX) - 2}
              cy={yToSvg(fn(ballX), maxY) - BALL_R - 2}
              r={2}
              fill="white"
              opacity={0.4}
            />
          </>
        )}

        {/* Empty state */}
        {ballX === null && (
          <text
            x={PANEL_WIDTH / 2}
            y={PANEL_HEIGHT / 2}
            textAnchor="middle"
            fill="currentColor"
            fontSize="11"
            opacity={0.3}
          >
            Click to drop a ball
          </text>
        )}
      </svg>

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-muted">
        {steps > 0 && (
          <span>
            Steps: <span className="font-mono font-bold text-foreground">{steps}</span>
          </span>
        )}
        {loss !== null && (
          <span>
            Loss: <span className="font-mono font-bold text-foreground">{loss.toFixed(4)}</span>
          </span>
        )}
        {settled && <span className="font-medium text-success">Converged</span>}
      </div>
    </div>
  );
}

export function SmoothVsRugged() {
  const [smoothData, setSmoothData] = useState<PanelData>(INITIAL_PANEL);
  const [ruggedData, setRuggedData] = useState<PanelData>(INITIAL_PANEL);

  const smoothTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ruggedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = useCallback(() => {
    if (smoothTimerRef.current) clearInterval(smoothTimerRef.current);
    if (ruggedTimerRef.current) clearInterval(ruggedTimerRef.current);
    setSmoothData(INITIAL_PANEL);
    setRuggedData(INITIAL_PANEL);
  }, []);

  useEffect(() => {
    const sTimer = smoothTimerRef;
    const rTimer = ruggedTimerRef;
    return () => {
      if (sTimer.current) clearInterval(sTimer.current);
      if (rTimer.current) clearInterval(rTimer.current);
    };
  }, []);

  const maxY = 0.35;

  const dropBall = useCallback((
    fn: (x: number) => number,
    setter: React.Dispatch<React.SetStateAction<PanelData>>,
    timerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>,
  ) => {
    if (timerRef.current) clearInterval(timerRef.current);

    // Random starting position (avoid extreme edges)
    let x = 0.05 + Math.random() * 0.9;
    let stepCount = 0;

    setter({
      ballX: x,
      trail: [x],
      steps: 0,
      loss: fn(x),
      settled: false,
      running: true,
    });

    timerRef.current = setInterval(() => {
      const dir = downhillDir(fn, x);
      if (dir === 0) {
        // Local minimum — stop
        setter(prev => ({ ...prev, settled: true, running: false }));
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }

      x = Math.max(0.01, Math.min(0.99, x + dir * PIXEL_STEP));
      stepCount++;

      setter(prev => ({
        ballX: x,
        trail: [...prev.trail, x],
        steps: stepCount,
        loss: fn(x),
        settled: false,
        running: true,
      }));
    }, FRAME_DELAY);
  }, []);

  return (
    <WidgetContainer
      title="Smooth vs. Rugged Landscapes"
      description="Click to drop a ball at a random position and watch gradient descent find the bottom"
      onReset={reset}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LandscapePanel
          title="Smooth"
          fn={smoothFn}
          maxY={maxY}
          panelData={smoothData}
          onDrop={() => dropBall(smoothFn, setSmoothData, smoothTimerRef)}
        />
        <LandscapePanel
          title="Rugged (same shape + noise)"
          fn={ruggedFn}
          maxY={maxY}
          panelData={ruggedData}
          onDrop={() => dropBall(ruggedFn, setRuggedData, ruggedTimerRef)}
        />
      </div>
    </WidgetContainer>
  );
}
