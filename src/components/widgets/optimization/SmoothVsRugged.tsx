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
const GRAVITY = 0.8; // pixels per frame^2 in SVG units
const DROP_SPEED_CAP = 12;

// Smooth landscape
function smoothFn(x: number): number {
  return (x - 0.5) * (x - 0.5);
}

// Step function: 16 random heights in the same range as smooth (0 to 0.25)
const STEP_HEIGHTS = [
  0.18, 0.07, 0.23, 0.12, 0.03, 0.21, 0.09, 0.16,
  0.24, 0.05, 0.19, 0.01, 0.14, 0.22, 0.08, 0.11,
];
function stepFn(x: number): number {
  const idx = Math.min(Math.floor(x * STEP_HEIGHTS.length), STEP_HEIGHTS.length - 1);
  return STEP_HEIGHTS[idx];
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

function svgToX(svgX: number): number {
  return (svgX - PADDING) / (PANEL_WIDTH - 2 * PADDING);
}

function yToSvg(y: number, maxY: number): number {
  return PANEL_HEIGHT - PADDING - (y / maxY) * (PANEL_HEIGHT - 2 * PADDING);
}

function surfaceSvgY(fn: (x: number) => number, x: number, maxY: number): number {
  return yToSvg(fn(x), maxY) - BALL_R;
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
  ballSvgY: number | null; // SVG y-position during drop
  dropping: boolean;
  trail: number[];
  steps: number;
  loss: number | null;
  settled: boolean;
  running: boolean;
}

const INITIAL_PANEL: PanelData = {
  ballX: null,
  ballSvgY: null,
  dropping: false,
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
  onClickAt,
}: {
  title: string;
  fn: (x: number) => number;
  maxY: number;
  panelData: PanelData;
  onClickAt: (x: number, startSvgY: number) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const landscapePath = generateLandscapePath(fn, maxY);
  const fillPath = generateFillPath(fn, maxY);
  const { ballX, ballSvgY, dropping, trail, steps, loss, settled } = panelData;

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const svgX = ((e.clientX - rect.left) / rect.width) * PANEL_WIDTH;
      const svgY = ((e.clientY - rect.top) / rect.height) * PANEL_HEIGHT;
      const x = Math.max(0.02, Math.min(0.98, svgToX(svgX)));
      onClickAt(x, svgY);
    },
    [onClickAt]
  );

  // Compute ball render position
  const ballCx = ballX !== null ? xToSvg(ballX) : 0;
  const ballCy = dropping && ballSvgY !== null
    ? ballSvgY
    : ballX !== null
      ? surfaceSvgY(fn, ballX, maxY)
      : 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-semibold text-foreground">{title}</span>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${PANEL_WIDTH} ${PANEL_HEIGHT}`}
        className="w-full cursor-crosshair rounded-lg border border-border bg-surface"
        preserveAspectRatio="xMidYMid meet"
        onClick={handleClick}
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
              cy={surfaceSvgY(fn, tx, maxY)}
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
              y1={surfaceSvgY(fn, trail[i - 1], maxY)}
              x2={xToSvg(tx)}
              y2={surfaceSvgY(fn, tx, maxY)}
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
              cx={ballCx}
              cy={ballCy}
              r={BALL_R}
              fill="var(--color-error)"
              stroke="white"
              strokeWidth="1.5"
            />
            {/* Shine */}
            <circle
              cx={ballCx - 2}
              cy={ballCy - 2}
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
        {loss !== null && !dropping && (
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

  const startRolling = useCallback((
    fn: (x: number) => number,
    startX: number,
    setter: React.Dispatch<React.SetStateAction<PanelData>>,
    timerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>,
  ) => {
    let x = startX;
    let stepCount = 0;

    timerRef.current = setInterval(() => {
      const dir = downhillDir(fn, x);
      if (dir === 0) {
        setter(prev => ({ ...prev, settled: true, running: false }));
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }

      x = Math.max(0.01, Math.min(0.99, x + dir * PIXEL_STEP));
      stepCount++;

      setter(prev => ({
        ...prev,
        ballX: x,
        trail: [...prev.trail, x],
        steps: stepCount,
        loss: fn(x),
      }));
    }, FRAME_DELAY);
  }, []);

  const dropBall = useCallback((
    fn: (x: number) => number,
    setter: React.Dispatch<React.SetStateAction<PanelData>>,
    timerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>,
    x: number,
    startSvgY: number,
  ) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const landingY = surfaceSvgY(fn, x, maxY);

    // If clicked below or on the surface, skip drop and go straight to rolling
    if (startSvgY >= landingY) {
      setter({
        ballX: x,
        ballSvgY: null,
        dropping: false,
        trail: [x],
        steps: 0,
        loss: fn(x),
        settled: false,
        running: true,
      });
      startRolling(fn, x, setter, timerRef);
      return;
    }

    // Start drop animation
    let svgY = startSvgY;
    let velocity = 0;

    setter({
      ballX: x,
      ballSvgY: svgY,
      dropping: true,
      trail: [],
      steps: 0,
      loss: null,
      settled: false,
      running: true,
    });

    timerRef.current = setInterval(() => {
      velocity = Math.min(velocity + GRAVITY, DROP_SPEED_CAP);
      svgY += velocity;

      if (svgY >= landingY) {
        // Landed — switch to rolling
        setter(prev => ({
          ...prev,
          ballSvgY: null,
          dropping: false,
          trail: [x],
          loss: fn(x),
        }));
        if (timerRef.current) clearInterval(timerRef.current);
        startRolling(fn, x, setter, timerRef);
        return;
      }

      setter(prev => ({
        ...prev,
        ballSvgY: svgY,
      }));
    }, FRAME_DELAY);
  }, [maxY, startRolling]);

  return (
    <WidgetContainer
      title="Smooth vs. Non-Smooth"
      description="Click anywhere to drop a ball — can gradient descent find the bottom?"
      onReset={reset}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LandscapePanel
          title="Smooth"
          fn={smoothFn}
          maxY={maxY}
          panelData={smoothData}
          onClickAt={(x, y) => dropBall(smoothFn, setSmoothData, smoothTimerRef, x, y)}
        />
        <LandscapePanel
          title="Step function (non-smooth)"
          fn={stepFn}
          maxY={maxY}
          panelData={ruggedData}
          onClickAt={(x, y) => dropBall(stepFn, setRuggedData, ruggedTimerRef, x, y)}
        />
      </div>
    </WidgetContainer>
  );
}
