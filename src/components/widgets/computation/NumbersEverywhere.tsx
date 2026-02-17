"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";
import { SliderControl } from "../shared/SliderControl";

type Tab = "text" | "image" | "color" | "sound";

const INITIAL_TEXT = "Hello!";
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
  const W = "#ffffff";
  const K = "#000000";
  const Y = "#eab308";
  return [
    [W, W, K, K, K, K, W, W],
    [W, K, Y, Y, Y, Y, K, W],
    [K, Y, K, Y, Y, K, Y, K],
    [K, Y, Y, Y, Y, Y, Y, K],
    [K, Y, K, Y, Y, K, Y, K],
    [K, Y, Y, K, K, Y, Y, K],
    [W, K, Y, Y, Y, Y, K, W],
    [W, W, K, K, K, K, W, W],
  ];
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
      <div className="mt-4 rounded-lg border-l-4 border-accent bg-accent/5 px-4 py-3 text-sm text-muted">
        <p className="mb-1">
          Characters use a system called <strong className="text-foreground">Unicode</strong> that covers symbols, emoji, and every language — so the numbers are bigger than simple alphabet positions.
        </p>
        <p>
          Uppercase and lowercase get different numbers (A&nbsp;=&nbsp;65, a&nbsp;=&nbsp;97) — to a computer they&apos;re as different as &quot;A&quot; and &quot;7&quot;.
        </p>
      </div>
    </div>
  );
}

function ImageTab() {
  const [grid, setGrid] = useState<string[][]>(createInitialGrid);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [hoveredCell, setHoveredCell] = useState<[number, number] | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [flashCell, setFlashCell] = useState<string | null>(null);
  const [highlightedCell, setHighlightedCell] = useState<string | null>(null);

  const paint = useCallback(
    (row: number, col: number) => {
      setGrid((prev) => {
        const next = prev.map((r) => [...r]);
        next[row][col] = selectedColor;
        return next;
      });
      const key = `${row}-${col}`;
      setFlashCell(key);
      setTimeout(() => setFlashCell((prev) => (prev === key ? null : prev)), 400);
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
                  className={`h-7 w-7 transition-all hover:opacity-80 sm:h-8 sm:w-8 ${
                    highlightedCell === `${r}-${c}` ? "ring-2 ring-accent ring-offset-1" : ""
                  }`}
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
          <div className="mt-2 max-h-48 overflow-auto rounded border border-border bg-surface p-2">
            {grid.map((row, r) => (
              <div key={r} className={`${r > 0 ? "mt-1 border-t border-border/50 pt-1" : ""}`}>
                <span className="mr-1.5 text-[9px] font-medium text-muted/50">Row {r}</span>
                <div className="flex flex-wrap gap-1">
                  {row.map((color, c) => {
                    const [rv, gv, bv] = hexToRgb(color);
                    const isFlashing = flashCell === `${r}-${c}`;
                    return (
                      <span
                        key={c}
                        className={`inline-flex w-[5.5rem] cursor-default items-center gap-1 rounded-full border px-1.5 py-0.5 font-mono text-[10px] leading-tight text-muted transition-colors duration-300 ${
                          isFlashing ? "border-accent/30 bg-accent/20" : "border-border bg-white hover:border-accent/40 hover:bg-accent/5"
                        }`}
                        onMouseEnter={() => setHighlightedCell(`${r}-${c}`)}
                        onMouseLeave={() => setHighlightedCell(null)}
                      >
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-sm border border-border/50"
                          style={{ backgroundColor: color }}
                        />
                        {String(rv).padStart(3,"\u2007")},{String(gv).padStart(3,"\u2007")},{String(bv).padStart(3,"\u2007")}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type ColorMode = "rgb" | "cmy";

function ColorTab() {
  const [r, setR] = useState(59);
  const [g, setG] = useState(130);
  const [b, setB] = useState(246);
  const [mode, setMode] = useState<ColorMode>("rgb");

  const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

  // CMY is the inverse of RGB (0–255 scale)
  const c = 255 - r;
  const m = 255 - g;
  const y = 255 - b;

  const setFromCmy = (cc: number, mm: number, yy: number) => {
    setR(255 - cc);
    setG(255 - mm);
    setB(255 - yy);
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <div
          className="h-24 w-24 shrink-0 rounded-xl border border-border shadow-inner"
          style={{ backgroundColor: hex }}
        />
        <div>
          <div className="font-mono text-lg font-semibold text-foreground">
            {mode === "rgb" ? (
              <>
                [<span className="text-red-500">{r}</span>,{" "}
                <span className="text-green-600">{g}</span>,{" "}
                <span className="text-blue-500">{b}</span>]
              </>
            ) : (
              <>
                [<span className="text-cyan-500">{c}</span>,{" "}
                <span className="text-pink-500">{m}</span>,{" "}
                <span className="text-yellow-500">{y}</span>]
              </>
            )}
          </div>
          <div className="mt-1 flex gap-1.5">
            <button
              onClick={() => setMode("rgb")}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                mode === "rgb" ? "bg-accent text-white" : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              Light
            </button>
            <button
              onClick={() => setMode("cmy")}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                mode === "cmy" ? "bg-accent text-white" : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              Paint
            </button>
          </div>
        </div>
      </div>
      {mode === "rgb" ? (
        <div className="space-y-3">
          <SliderControl
            label={<span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full border border-border/50" style={{ backgroundColor: "#ef4444" }} />Red</span>}
            value={r}
            min={0}
            max={255}
            step={1}
            onChange={setR}
            formatValue={(v) => String(Math.round(v))}
          />
          <SliderControl
            label={<span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full border border-border/50" style={{ backgroundColor: "#22c55e" }} />Green</span>}
            value={g}
            min={0}
            max={255}
            step={1}
            onChange={setG}
            formatValue={(v) => String(Math.round(v))}
          />
          <SliderControl
            label={<span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full border border-border/50" style={{ backgroundColor: "#3b82f6" }} />Blue</span>}
            value={b}
            min={0}
            max={255}
            step={1}
            onChange={setB}
            formatValue={(v) => String(Math.round(v))}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <SliderControl
            label={<span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full border border-border/50" style={{ backgroundColor: "#06b6d4" }} />Cyan</span>}
            value={c}
            min={0}
            max={255}
            step={1}
            onChange={(v) => setFromCmy(Math.round(v), m, y)}
            formatValue={(v) => String(Math.round(v))}
          />
          <SliderControl
            label={<span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full border border-border/50" style={{ backgroundColor: "#ec4899" }} />Magenta</span>}
            value={m}
            min={0}
            max={255}
            step={1}
            onChange={(v) => setFromCmy(c, Math.round(v), y)}
            formatValue={(v) => String(Math.round(v))}
          />
          <SliderControl
            label={<span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full border border-border/50" style={{ backgroundColor: "#eab308" }} />Yellow</span>}
            value={y}
            min={0}
            max={255}
            step={1}
            onChange={(v) => setFromCmy(c, m, Math.round(v))}
            formatValue={(v) => String(Math.round(v))}
          />
        </div>
      )}
      <div className="mt-4 rounded-lg border-l-4 border-accent bg-accent/5 px-4 py-3 text-sm text-muted">
        <p>
          You may be more familiar with mixing <strong className="text-foreground">paint</strong> than mixing <strong className="text-foreground">light</strong>. They work differently: mixing red and green paint makes brown, but mixing red and green light makes yellow! Computers typically use light mixing (Red, Green, Blue) because screens emit light. Paint mixing uses Cyan, Magenta, and Yellow — sometimes called &quot;red, yellow, and blue&quot; in art class.
        </p>
      </div>
    </div>
  );
}

const SOUND_PRESETS = [
  { label: '"eeee"', f1: 270, f2: 2300 },
  { label: '"aaah"', f1: 730, f2: 1090 },
  { label: '"oooh"', f1: 300, f2: 870 },
  { label: '"mmmm"', f1: 250, f2: 800 },
];

function buildFormantGraph(
  actx: BaseAudioContext,
  pitch: number,
  f1: number,
  f2: number
) {
  const osc = actx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.value = pitch;

  const makeFormant = (freq: number, q: number, gain: number) => {
    const filter = actx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = actx.createGain();
    g.gain.value = gain;
    osc.connect(filter);
    filter.connect(g);
    return { filter, gain: g };
  };

  const formant1 = makeFormant(f1, 8, 1.0);
  const formant2 = makeFormant(f2, 12, 0.5);
  const formant3 = makeFormant(2800, 12, 0.3);

  const masterGain = actx.createGain();
  masterGain.gain.value = 0.25;

  formant1.gain.connect(masterGain);
  formant2.gain.connect(masterGain);
  formant3.gain.connect(masterGain);

  return { osc, filter1: formant1.filter, filter2: formant2.filter, masterGain };
}

function drawWaveform(
  canvas: HTMLCanvasElement,
  data: Float32Array,
  selectedIdx: number | null = null
) {
  const ctx = canvas.getContext("2d")!;
  const w = canvas.width;
  const h = canvas.height;

  const style = getComputedStyle(canvas);
  const accentColor =
    style.getPropertyValue("--color-accent").trim() || "#3b82f6";
  const mutedColor =
    style.getPropertyValue("--color-muted").trim() || "#888";
  const fgColor =
    style.getPropertyValue("--color-foreground").trim() || "#333";

  // Find min/max for full dynamic range normalization
  let min = Infinity,
    max = -Infinity;
  for (let i = 0; i < data.length; i++) {
    if (data[i] < min) min = data[i];
    if (data[i] > max) max = data[i];
  }
  const range = max - min || 0.001;
  const pad = range * 0.08;
  const yMin = min - pad;
  const yMax = max + pad;
  const yRange = yMax - yMin;

  ctx.clearRect(0, 0, w, h);

  // Zero line
  const zeroY = ((yMax - 0) / yRange) * h;
  ctx.beginPath();
  ctx.strokeStyle = mutedColor;
  ctx.lineWidth = 0.5;
  ctx.setLineDash([4, 4]);
  ctx.moveTo(0, zeroY);
  ctx.lineTo(w, zeroY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Waveform
  ctx.beginPath();
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  const step = data.length / w;
  for (let x = 0; x < w; x++) {
    const i = Math.floor(x * step);
    const v = data[i];
    const y = ((yMax - v) / yRange) * h;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Selected sample marker
  if (selectedIdx !== null && selectedIdx >= 0 && selectedIdx < data.length) {
    const markerX = (selectedIdx / data.length) * w;
    const v = data[selectedIdx];
    const markerY = ((yMax - v) / yRange) * h;

    // Vertical hairline
    ctx.beginPath();
    ctx.strokeStyle = fgColor;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    ctx.moveTo(markerX, 0);
    ctx.lineTo(markerX, h);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Dot
    ctx.beginPath();
    ctx.fillStyle = accentColor;
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.arc(markerX, markerY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

const SAMPLES_WINDOW = 20;

function SoundTab() {
  const [pitch, setPitch] = useState(150);
  const [f1, setF1] = useState(730);
  const [f2, setF2] = useState(1090);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveformData, setWaveformData] = useState<Float32Array | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const audioRef = useRef<{
    ctx: AudioContext;
    osc: OscillatorNode;
    filter1: BiquadFilterNode;
    filter2: BiquadFilterNode;
    masterGain: GainNode;
    analyser: AnalyserNode;
  } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.osc.stop();
      audioRef.current.ctx.close();
      audioRef.current = null;
      setIsPlaying(false);
      return;
    }

    const ctx = new AudioContext();
    const { osc, filter1, filter2, masterGain } = buildFormantGraph(
      ctx,
      pitch,
      f1,
      f2
    );

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;

    masterGain.connect(analyser);
    analyser.connect(ctx.destination);

    osc.start();

    audioRef.current = { ctx, osc, filter1, filter2, masterGain, analyser };
    setIsPlaying(true);
  }, [pitch, f1, f2]);

  // Update audio params smoothly when sliders change while playing
  useEffect(() => {
    if (!audioRef.current) return;
    const t = audioRef.current.ctx.currentTime;
    audioRef.current.osc.frequency.setTargetAtTime(pitch, t, 0.02);
    audioRef.current.filter1.frequency.setTargetAtTime(f1, t, 0.02);
    audioRef.current.filter2.frequency.setTargetAtTime(f2, t, 0.02);
  }, [pitch, f1, f2]);

  // Render preview waveform whenever params change (always visible, even when not playing)
  useEffect(() => {
    let cancelled = false;

    const sampleRate = 44100;
    const settleTime = 0.1;
    const displayDuration = 0.04;
    const renderDuration = settleTime + displayDuration + 0.02;
    const totalSamples = Math.ceil(renderDuration * sampleRate);
    const settleEnd = Math.ceil(settleTime * sampleRate);
    const displaySampleCount = Math.ceil(displayDuration * sampleRate);

    const offlineCtx = new OfflineAudioContext(1, totalSamples, sampleRate);
    const { osc, masterGain } = buildFormantGraph(offlineCtx, pitch, f1, f2);
    masterGain.connect(offlineCtx.destination);
    osc.start();

    offlineCtx.startRendering().then((buffer) => {
      if (cancelled) return;
      const fullData = buffer.getChannelData(0);

      // Find the first maximum peak after settling, then back up to the
      // preceding upward zero-crossing so the peak sits at a consistent
      // x-position on the left side of the canvas.
      let peakIdx = settleEnd;
      let peakVal = -Infinity;
      // Scan one fundamental period worth of samples to find the first peak
      const periodSamples = Math.ceil(sampleRate / pitch);
      const searchEnd = Math.min(settleEnd + periodSamples * 2, fullData.length - displaySampleCount);
      for (let i = settleEnd; i < searchEnd; i++) {
        if (fullData[i] > peakVal) {
          peakVal = fullData[i];
          peakIdx = i;
        }
      }
      // Back up from peak to the nearest preceding upward zero-crossing
      let startIdx = peakIdx;
      for (let i = peakIdx; i >= settleEnd; i--) {
        if (fullData[i] <= 0 && fullData[i + 1] > 0) {
          startIdx = i;
          break;
        }
      }

      const data = fullData.slice(startIdx, startIdx + displaySampleCount);
      setWaveformData(data);
      setSelectedIdx(null);
    });

    return () => {
      cancelled = true;
    };
  }, [pitch, f1, f2]);

  // Draw waveform whenever data or selection changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveformData) return;
    drawWaveform(canvas, waveformData, selectedIdx);
  }, [waveformData, selectedIdx]);

  // Handle click on waveform to select a sample
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || !waveformData) return;
      const rect = canvas.getBoundingClientRect();
      const cssX = e.clientX - rect.left;
      const idx = Math.round((cssX / rect.width) * (waveformData.length - 1));
      setSelectedIdx(Math.max(0, Math.min(idx, waveformData.length - 1)));
    },
    [waveformData]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        try {
          audioRef.current.osc.stop();
          audioRef.current.ctx.close();
        } catch {
          /* ignore */
        }
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {SOUND_PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => {
              setF1(p.f1);
              setF2(p.f2);
            }}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              f1 === p.f1 && f2 === p.f2
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={togglePlay}
          className={`ml-auto rounded-lg px-4 py-1.5 text-sm font-semibold text-white transition-colors ${
            isPlaying
              ? "bg-red-500 hover:bg-red-600"
              : "bg-accent hover:opacity-90"
          }`}
          aria-label={isPlaying ? "Stop sound" : "Play sound"}
        >
          {isPlaying ? "\u25A0 Stop" : "\u25B6 Play"}
        </button>
      </div>

      <div className="mb-4 overflow-hidden rounded-lg border border-border bg-surface">
        <canvas
          ref={canvasRef}
          width={500}
          height={120}
          className="w-full cursor-crosshair"
          style={{ height: "100px" }}
          onClick={handleCanvasClick}
        />
      </div>

      <div className="mb-4 space-y-3">
        <SliderControl
          label="Pitch"
          value={pitch}
          min={80}
          max={300}
          step={1}
          onChange={setPitch}
          formatValue={(v) => `${Math.round(v)} Hz`}
        />
        <SliderControl
          label="F1"
          value={f1}
          min={200}
          max={1000}
          step={1}
          onChange={setF1}
          formatValue={(v) => `${Math.round(v)} Hz`}
        />
        <SliderControl
          label="F2"
          value={f2}
          min={500}
          max={3000}
          step={1}
          onChange={setF2}
          formatValue={(v) => `${Math.round(v)} Hz`}
        />
      </div>

      {waveformData && (() => {
        const winStart =
          selectedIdx !== null
            ? Math.max(
                0,
                Math.min(
                  selectedIdx - Math.floor(SAMPLES_WINDOW / 2),
                  waveformData.length - SAMPLES_WINDOW
                )
              )
            : 0;
        const highlightPos =
          selectedIdx !== null ? selectedIdx - winStart : null;

        return (
          <div className="rounded border border-border bg-surface p-2">
            <p className="mb-1 text-xs font-medium text-muted">
              Air pressure samples (44,100 per second)
              {selectedIdx !== null && (
                <span>
                  {" "}&mdash; sample #{selectedIdx} ={" "}
                  <span className="font-semibold text-accent">
                    {waveformData[selectedIdx].toFixed(4)}
                  </span>
                </span>
              )}
              :
            </p>
            <p className="font-mono text-[10px] leading-tight text-muted">
              {winStart > 0 && "... "}
              [
              {Array.from(waveformData.slice(winStart, winStart + SAMPLES_WINDOW)).map(
                (s, i) => (
                  <span key={i}>
                    {i > 0 && ", "}
                    <span
                      className={
                        i === highlightPos
                          ? "rounded bg-accent/20 px-0.5 font-bold text-accent"
                          : ""
                      }
                    >
                      {s.toFixed(3)}
                    </span>
                  </span>
                )
              )}
              , ...]
            </p>
            {selectedIdx === null && (
              <p className="mt-1 text-[10px] text-muted/60">
                Click the waveform to inspect a sample
              </p>
            )}
          </div>
        );
      })()}
    </div>
  );
}

const TABS: { id: Tab; label: string }[] = [
  { id: "text", label: "Text" },
  { id: "color", label: "Color" },
  { id: "image", label: "Image" },
  { id: "sound", label: "Sound" },
];

export function NumbersEverywhere() {
  const [activeTab, setActiveTab] = useState<Tab>("text");

  return (
    <WidgetContainer
      title="Numbers Everywhere"
      description="Everything a computer works with is just numbers"
    >
      <WidgetTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === "text" && <TextTab />}
      {activeTab === "image" && <ImageTab />}
      {activeTab === "color" && <ColorTab />}
      {activeTab === "sound" && <SoundTab />}
    </WidgetContainer>
  );
}
