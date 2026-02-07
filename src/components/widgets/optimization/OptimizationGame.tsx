"use client";

import { useState, useCallback, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";

const SVG_WIDTH = 500;
const SVG_HEIGHT = 400;
const CONSTRAINT_RADIUS = 60;
const FOUND_THRESHOLD = 15;

// Max possible distance (diagonal of canvas)
const MAX_DIST = Math.sqrt(SVG_WIDTH ** 2 + SVG_HEIGHT ** 2);

interface Guess {
  x: number;
  y: number;
  distance: number;
}

function randomTarget(): { x: number; y: number } {
  return {
    x: 60 + Math.random() * (SVG_WIDTH - 120),
    y: 60 + Math.random() * (SVG_HEIGHT - 120),
  };
}

function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

// Closeness: 0 = far away, 1 = right on top of it
function closeness(distance: number): number {
  return Math.max(0, 1 - distance / (MAX_DIST * 0.5));
}

// Color for signal mode: blue (far) → full spectrum → red (close)
function signalColor(t: number): string {
  // HSL hue: 240 (blue) → 0 (red) as t goes 0 → 1
  const hue = 240 * (1 - t);
  const saturation = 80 + t * 20; // 80% → 100%
  const lightness = 55 - t * 10;  // 55% → 45% (brighter blues, deeper reds)
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Pulse duration: slow when far, fast when close
function pulseDuration(t: number): string {
  const dur = 2.5 - t * 2.2; // 2.5s (far) → 0.3s (close)
  return `${dur.toFixed(2)}s`;
}

// Dot radius for signal mode: small when far, larger when close
function signalRadius(t: number, isLatest: boolean): number {
  const base = 3 + t * 7; // 3px far, 10px close
  return isLatest ? base + 1 : base;
}

export function OptimizationGame() {
  const [target, setTarget] = useState(() => randomTarget());
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [mode, setMode] = useState<"blind" | "signal">("blind");
  const [revealed, setRevealed] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const reset = useCallback(() => {
    setTarget(randomTarget());
    setGuesses([]);
    setRevealed(false);
  }, []);

  const switchMode = useCallback((newMode: "blind" | "signal") => {
    setMode(newMode);
    setTarget(randomTarget());
    setGuesses([]);
    setRevealed(false);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (revealed) return;
      const svg = svgRef.current;
      if (!svg) return;

      // Check if already found
      const lastGuess = guesses.length > 0 ? guesses[guesses.length - 1] : null;
      if (lastGuess && lastGuess.distance < FOUND_THRESHOLD) return;

      const rect = svg.getBoundingClientRect();
      const scaleX = SVG_WIDTH / rect.width;
      const scaleY = SVG_HEIGHT / rect.height;
      let x = (e.clientX - rect.left) * scaleX;
      let y = (e.clientY - rect.top) * scaleY;

      // In signal mode, constrain to radius around last guess
      if (mode === "signal" && guesses.length > 0) {
        const last = guesses[guesses.length - 1];
        const d = dist(x, y, last.x, last.y);
        if (d > CONSTRAINT_RADIUS) {
          const angle = Math.atan2(y - last.y, x - last.x);
          x = last.x + Math.cos(angle) * CONSTRAINT_RADIUS;
          y = last.y + Math.sin(angle) * CONSTRAINT_RADIUS;
        }
      }

      const distance = dist(x, y, target.x, target.y);
      setGuesses((prev) => [...prev, { x, y, distance }]);
    },
    [target, guesses, mode, revealed]
  );

  const lastGuess = guesses.length > 0 ? guesses[guesses.length - 1] : null;
  const found = lastGuess && lastGuess.distance < FOUND_THRESHOLD;
  const isBlind = mode === "blind";
  const bestGuess = guesses.length > 0
    ? Math.min(...guesses.map((g) => g.distance))
    : null;

  return (
    <WidgetContainer
      title="Search: Blind vs. Guided"
      description="Find a hidden target — compare searching with no signal vs. an incremental signal"
      onReset={reset}
    >
      {/* Mode tabs */}
      <div className="mb-3 flex items-center gap-2">
        <button
          onClick={() => switchMode("blind")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === "blind"
              ? "bg-accent text-white"
              : "bg-surface text-muted hover:text-foreground"
          }`}
        >
          Blind (no signal)
        </button>
        <button
          onClick={() => switchMode("signal")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === "signal"
              ? "bg-accent text-white"
              : "bg-surface text-muted hover:text-foreground"
          }`}
        >
          With signal
        </button>
      </div>

      {/* Stats bar */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-1.5">
          <span className="text-xs font-medium text-muted">Guesses:</span>
          <span className="font-mono text-sm font-bold text-foreground">
            {guesses.length}
          </span>
        </div>
        {/* Blind mode: show latest feedback */}
        {isBlind && lastGuess && !found && (
          <span className="text-sm font-medium text-muted">Not here.</span>
        )}
        {/* Signal mode: show closeness */}
        {!isBlind && lastGuess && !found && (
          <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-1.5">
            <span className="text-xs font-medium text-muted">Closeness:</span>
            <span className="font-mono text-sm font-bold text-foreground">
              {Math.round(closeness(lastGuess.distance) * 100)}%
            </span>
          </div>
        )}
        {!isBlind && bestGuess !== null && guesses.length > 1 && !found && (
          <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-1.5">
            <span className="text-xs font-medium text-muted">Best:</span>
            <span className="font-mono text-sm font-bold text-foreground">
              {Math.round(closeness(bestGuess) * 100)}%
            </span>
          </div>
        )}
        {found && (
          <span className="text-sm font-bold text-success">Found it in {guesses.length} guesses!</span>
        )}
      </div>

      {/* Color spectrum legend — signal mode only */}
      {!isBlind && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-[10px] font-medium text-muted whitespace-nowrap">Far</span>
          <div
            className="h-3 flex-1 rounded-full"
            style={{
              background: `linear-gradient(to right, ${
                Array.from({ length: 11 }, (_, i) => signalColor(i / 10)).join(", ")
              })`,
            }}
          />
          <span className="text-[10px] font-medium text-muted whitespace-nowrap">Close</span>
        </div>
      )}

      {/* SVG canvas */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="mb-3 w-full cursor-crosshair rounded-lg border border-border bg-surface"
        preserveAspectRatio="xMidYMid meet"
        onClick={handleClick}
      >
        <defs>
          {/* Dynamic glow gradients for each guess */}
          {!isBlind && guesses.map((g, i) => {
            const t = closeness(g.distance);
            const color = signalColor(t);
            return (
              <radialGradient key={`glow-${i}`} id={`pulse-glow-${i}`}>
                <stop offset="0%" stopColor={color} stopOpacity="0.5" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </radialGradient>
            );
          })}
        </defs>

        {/* Constraint radius circle in signal mode */}
        {mode === "signal" && lastGuess && !revealed && !found && (
          <circle
            cx={lastGuess.x}
            cy={lastGuess.y}
            r={CONSTRAINT_RADIUS}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="1"
            strokeDasharray="4,4"
            opacity={0.3}
          />
        )}

        {/* Trail lines connecting consecutive guesses in signal mode */}
        {mode === "signal" &&
          guesses.map((g, i) =>
            i > 0 ? (
              <line
                key={`line-${i}`}
                x1={guesses[i - 1].x}
                y1={guesses[i - 1].y}
                x2={g.x}
                y2={g.y}
                stroke="currentColor"
                strokeWidth="1"
                opacity={0.1}
              />
            ) : null
          )}

        {/* Guess dots */}
        {guesses.map((g, i) => {
          const t = closeness(g.distance);
          const isLatest = i === guesses.length - 1;
          const isHit = g.distance < FOUND_THRESHOLD;

          if (isBlind) {
            // Blind mode: small X marks for misses, green circle for hit
            if (isHit) {
              return (
                <circle
                  key={i}
                  cx={g.x}
                  cy={g.y}
                  r={8}
                  fill="var(--color-success)"
                  stroke="white"
                  strokeWidth="2"
                />
              );
            }
            return (
              <g key={i} opacity={isLatest ? 0.5 : 0.25}>
                <line
                  x1={g.x - 4} y1={g.y - 4}
                  x2={g.x + 4} y2={g.y + 4}
                  stroke="var(--color-muted)" strokeWidth="1.5" strokeLinecap="round"
                />
                <line
                  x1={g.x + 4} y1={g.y - 4}
                  x2={g.x - 4} y2={g.y + 4}
                  stroke="var(--color-muted)" strokeWidth="1.5" strokeLinecap="round"
                />
              </g>
            );
          }

          // Signal mode: sized and colored dots with pulsing
          const r = signalRadius(t, isLatest);
          const color = signalColor(t);
          const dur = pulseDuration(t);
          const pulseScale = 1 + t * 0.4; // pulse amplitude grows with closeness

          return (
            <g key={i}>
              {/* Pulsing glow — all dots pulse, faster when closer */}
              {!found && (
                <circle
                  cx={g.x}
                  cy={g.y}
                  r={r + 6}
                  fill={`url(#pulse-glow-${i})`}
                  opacity={0.5}
                >
                  <animate
                    attributeName="r"
                    values={`${r + 2};${r + 6 + t * 12};${r + 2}`}
                    dur={dur}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values={`${0.3 + t * 0.3};${0.1};${0.3 + t * 0.3}`}
                    dur={dur}
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              {/* Main dot — also pulses */}
              <circle
                cx={g.x}
                cy={g.y}
                r={r}
                fill={color}
                stroke="white"
                strokeWidth={isLatest ? 2 : 1}
                opacity={isLatest ? 1 : 0.7}
              >
                {!found && (
                  <animate
                    attributeName="r"
                    values={`${r};${r * pulseScale};${r}`}
                    dur={dur}
                    repeatCount="indefinite"
                  />
                )}
              </circle>
            </g>
          );
        })}

        {/* Target — revealed on find or manual reveal */}
        {(revealed || found) && (
          <>
            <circle
              cx={target.x}
              cy={target.y}
              r={FOUND_THRESHOLD}
              fill="none"
              stroke="var(--color-success)"
              strokeWidth="2"
            />
            <line
              x1={target.x - 8}
              y1={target.y}
              x2={target.x + 8}
              y2={target.y}
              stroke="var(--color-success)"
              strokeWidth="2"
            />
            <line
              x1={target.x}
              y1={target.y - 8}
              x2={target.x}
              y2={target.y + 8}
              stroke="var(--color-success)"
              strokeWidth="2"
            />
          </>
        )}

        {/* Empty state prompt */}
        {guesses.length === 0 && (
          <text
            x={SVG_WIDTH / 2}
            y={SVG_HEIGHT / 2}
            textAnchor="middle"
            fill="currentColor"
            fontSize="13"
            opacity={0.3}
          >
            Click anywhere to start guessing
          </text>
        )}
      </svg>

      {/* Mode explanation */}
      {isBlind && guesses.length === 0 && (
        <p className="mb-3 text-xs text-muted">
          You only learn &ldquo;not here&rdquo; or &ldquo;you got it.&rdquo; No signal of progress. Can you find the target?
        </p>
      )}
      {!isBlind && guesses.length === 0 && (
        <p className="mb-3 text-xs text-muted">
          Each guess shows how close you are — dots shift from blue to red and pulse faster as you get warmer. Steps are constrained near your last guess.
        </p>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setRevealed(true)}
          className="rounded-md bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
        >
          Reveal target
        </button>
        <button
          onClick={reset}
          className="rounded-md bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
        >
          New game
        </button>
      </div>
    </WidgetContainer>
  );
}
