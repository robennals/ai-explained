"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { WidgetTabs } from "../shared/WidgetTabs";
import { SliderControl } from "../shared/SliderControl";

interface Example {
  id: string;
  label: string;
  dimensions: { name: string; min: number; max: number; step: number; initial: number; unit?: string }[];
  render: (values: number[], onChange?: (idx: number, val: number) => void) => React.ReactNode;
}

// Canvas dimensions: full tile width, cropped vertically to cut polar extremes
const TILE_SIZE = 256;
const FULL_GRID = 512; // 2x2 tiles
const CROP_Y = 64;     // pixels to crop from top and bottom of 512px grid
const CANVAS_W = FULL_GRID;
const CANVAS_H = FULL_GRID - 2 * CROP_Y; // 384

// OSM zoom-1 tiles: 2x2 grid, each 256x256
// We show the middle two rows (y=0 top half, y=1 bottom half) cropped to 512x256
const TILE_URLS = [
  // top row
  ["https://tile.openstreetmap.org/1/0/0.png", "https://tile.openstreetmap.org/1/1/0.png"],
  // bottom row
  ["https://tile.openstreetmap.org/1/0/1.png", "https://tile.openstreetmap.org/1/1/1.png"],
];

// Convert lat/lng to pixel position on the full 512x512 Mercator tile grid
function latLngToPixel(lat: number, lng: number): { x: number; y: number } {
  const fullSize = 512; // 2 tiles x 256px
  const x = ((lng + 180) / 360) * fullSize;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * fullSize;
  return { x, y };
}

function pixelToLatLng(px: number, py: number): { lat: number; lng: number } {
  const fullSize = FULL_GRID;
  const lng = (px / fullSize) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * py) / fullSize;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lat, lng };
}

function PositionPreview({ lat, lng, onChange }: { lat: number; lng: number; onChange?: (idx: number, val: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tiles, setTiles] = useState<HTMLImageElement[] | null>(null);

  const clampedLat = Math.max(-80, Math.min(80, lat));

  // Load tiles once
  useEffect(() => {
    let cancelled = false;
    const urls = TILE_URLS.flat();
    Promise.all(
      urls.map(
        (url) =>
          new Promise<HTMLImageElement>((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.src = url;
          })
      )
    ).then((loaded) => {
      if (!cancelled) setTiles(loaded);
    });
    return () => { cancelled = true; };
  }, []);

  // Draw whenever tiles are ready or lat/lng change
  useEffect(() => {
    if (tiles && canvasRef.current) {
      drawMap(canvasRef.current, tiles, clampedLat, lng);
    }
  }, [tiles, clampedLat, lng]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onChange || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      const canvasX = (e.clientX - rect.left) * scaleX;
      const canvasY = (e.clientY - rect.top) * scaleY;
      // Convert canvas pixel back to full-grid pixel, then to lat/lng
      const gridX = canvasX;
      const gridY = canvasY + CROP_Y;
      const { lat: newLat, lng: newLng } = pixelToLatLng(gridX, gridY);
      onChange(0, Math.round(Math.max(-80, Math.min(80, newLat))));
      onChange(1, Math.round(Math.max(-180, Math.min(180, newLng))));
    },
    [onChange]
  );

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="w-full max-w-[340px] rounded-lg border border-foreground/10 cursor-crosshair"
        style={{ imageRendering: "auto" }}
        onClick={handleClick}
      />
      <div className="mt-0.5 text-right text-[8px] text-muted opacity-50 max-w-[340px]">© OpenStreetMap</div>
    </div>
  );
}

function drawMap(canvas: HTMLCanvasElement, tiles: HTMLImageElement[], lat: number, lng: number) {
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // Draw the 2x2 tile grid, shifted up by CROP_Y
  ctx.drawImage(tiles[0], 0, -CROP_Y);                     // top-left (NW)
  ctx.drawImage(tiles[1], TILE_SIZE, -CROP_Y);              // top-right (NE)
  ctx.drawImage(tiles[2], 0, TILE_SIZE - CROP_Y);           // bottom-left (SW)
  ctx.drawImage(tiles[3], TILE_SIZE, TILE_SIZE - CROP_Y);   // bottom-right (SE)

  // Convert lat/lng to pixel on the full 512x512 grid, then shift by crop
  const { x: px, y: fullPy } = latLngToPixel(lat, lng);
  const py = fullPy - CROP_Y;

  // Draw pin
  ctx.save();
  ctx.translate(px, py);

  // Pin shadow
  ctx.beginPath();
  ctx.ellipse(0, 4, 6, 3, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fill();

  // Pin body
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.bezierCurveTo(-7, -2, -7, -11, -4, -14);
  ctx.bezierCurveTo(-2, -16, 2, -16, 4, -14);
  ctx.bezierCurveTo(7, -11, 7, -2, 0, 4);
  ctx.closePath();
  ctx.fillStyle = "#ef4444";
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Pin dot
  ctx.beginPath();
  ctx.arc(0, -8, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();

  ctx.restore();
}

function ColorPreview({ r, g, b }: { r: number; g: number; b: number }) {
  const color = `rgb(${r}, ${g}, ${b})`;
  return (
    <div className="flex items-center gap-4">
      <div
        className="h-24 w-24 rounded-xl border border-foreground/10 shadow-inner"
        style={{ backgroundColor: color }}
      />
      <div className="font-mono text-xs text-muted">
        <div>rgb({r}, {g}, {b})</div>
        <div className="mt-1">#{r.toString(16).padStart(2, "0")}{g.toString(16).padStart(2, "0")}{b.toString(16).padStart(2, "0")}</div>
      </div>
    </div>
  );
}

function CharacterPreview({ health, strength, speed }: { health: number; strength: number; speed: number }) {
  const barWidth = 120;
  const stats = [
    { label: "HP", value: health, max: 100, color: "#22c55e" },
    { label: "STR", value: strength, max: 100, color: "#ef4444" },
    { label: "SPD", value: speed, max: 100, color: "#3b82f6" },
  ];
  return (
    <div className="space-y-2">
      <div className="mb-2 text-xs text-muted">RPG character stats</div>
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-3">
          <span className="w-8 text-right font-mono text-xs font-bold text-muted">{s.label}</span>
          <div className="h-4 rounded-full bg-foreground/5" style={{ width: barWidth }}>
            <div
              className="h-4 rounded-full transition-all duration-150"
              style={{ width: (s.value / s.max) * barWidth, backgroundColor: s.color }}
            />
          </div>
          <span className="font-mono text-xs text-muted">{s.value}</span>
        </div>
      ))}
    </div>
  );
}

function VelocityPreview({ vx, vy }: { vx: number; vy: number }) {
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const scale = 1.2;
  const tx = cx + vx * scale;
  const ty = cy - vy * scale; // flip y for screen coords

  const mag = Math.sqrt(vx * vx + vy * vy);
  const angle = Math.atan2(ty - cy, tx - cx);
  const headLen = 8;
  const h1x = tx - headLen * Math.cos(angle - 0.4);
  const h1y = ty - headLen * Math.sin(angle - 0.4);
  const h2x = tx - headLen * Math.cos(angle + 0.4);
  const h2y = ty - headLen * Math.sin(angle + 0.4);

  // Speed label
  const speed = mag.toFixed(1);
  const angleDeg = ((Math.atan2(vy, vx) * 180) / Math.PI + 360) % 360;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[200px] mx-auto">
      {/* Background grid */}
      <circle cx={cx} cy={cy} r={60} fill="none" stroke="currentColor" strokeOpacity={0.06} />
      <circle cx={cx} cy={cy} r={30} fill="none" stroke="currentColor" strokeOpacity={0.06} />
      <line x1={0} y1={cy} x2={size} y2={cy} stroke="currentColor" strokeOpacity={0.08} />
      <line x1={cx} y1={0} x2={cx} y2={size} stroke="currentColor" strokeOpacity={0.08} />

      {/* Velocity arrow */}
      {mag > 1 && (
        <g>
          <line x1={cx} y1={cy} x2={tx} y2={ty} stroke="var(--color-accent)" strokeWidth={2.5} />
          <polygon points={`${tx},${ty} ${h1x},${h1y} ${h2x},${h2y}`} fill="var(--color-accent)" />
        </g>
      )}

      {/* Origin dot */}
      <circle cx={cx} cy={cy} r={3} fill="var(--color-accent)" fillOpacity={0.4} />

      {/* Labels */}
      <text x={cx} y={size - 4} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.4}>
        speed: {speed} | heading: {angleDeg.toFixed(0)}°
      </text>
    </svg>
  );
}

const EXAMPLES: Example[] = [
  {
    id: "position",
    label: "Position",
    dimensions: [
      { name: "Latitude", min: -90, max: 90, step: 1, initial: 37, unit: "°" },
      { name: "Longitude", min: -180, max: 180, step: 1, initial: -122, unit: "°" },
    ],
    render: (values, onChange) => <PositionPreview lat={values[0]} lng={values[1]} onChange={onChange} />,
  },
  {
    id: "color",
    label: "Color",
    dimensions: [
      { name: "Red", min: 0, max: 255, step: 1, initial: 66 },
      { name: "Green", min: 0, max: 255, step: 1, initial: 135 },
      { name: "Blue", min: 0, max: 255, step: 1, initial: 245 },
    ],
    render: (values) => <ColorPreview r={values[0]} g={values[1]} b={values[2]} />,
  },
  {
    id: "velocity",
    label: "Velocity",
    dimensions: [
      { name: "East/West", min: -60, max: 60, step: 1, initial: 30 },
      { name: "North/South", min: -60, max: 60, step: 1, initial: 40 },
    ],
    render: (values) => <VelocityPreview vx={values[0]} vy={values[1]} />,
  },
  {
    id: "character",
    label: "RPG Stats",
    dimensions: [
      { name: "Health", min: 0, max: 100, step: 1, initial: 80 },
      { name: "Strength", min: 0, max: 100, step: 1, initial: 45 },
      { name: "Speed", min: 0, max: 100, step: 1, initial: 70 },
    ],
    render: (values) => <CharacterPreview health={values[0]} strength={values[1]} speed={values[2]} />,
  },
];

type ExampleId = "position" | "color" | "velocity" | "character";

const VECTOR_TABS: { id: ExampleId; label: string }[] = EXAMPLES.map((e) => ({
  id: e.id as ExampleId,
  label: e.label,
}));

export function VectorExamples() {
  const [selectedId, setSelectedId] = useState<ExampleId>("position");
  const example = EXAMPLES.find((e) => e.id === selectedId)!;
  const [values, setValues] = useState<Record<string, number[]>>(
    Object.fromEntries(EXAMPLES.map((e) => [e.id, e.dimensions.map((d) => d.initial)]))
  );

  const currentValues = values[selectedId];

  const handleChange = useCallback(
    (idx: number, val: number) => {
      setValues((prev) => {
        const next = { ...prev };
        next[selectedId] = [...prev[selectedId]];
        next[selectedId][idx] = val;
        return next;
      });
    },
    [selectedId]
  );

  const handleReset = useCallback(() => {
    setValues(Object.fromEntries(EXAMPLES.map((e) => [e.id, e.dimensions.map((d) => d.initial)])));
    setSelectedId("position");
  }, []);

  return (
    <WidgetContainer
      title="Vectors in Everyday Life"
      description="A vector is just a list of numbers that describes something"
      onReset={handleReset}
    >
      <WidgetTabs tabs={VECTOR_TABS} activeTab={selectedId} onTabChange={setSelectedId} />

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Visual preview */}
        <div>{example.render(currentValues, handleChange)}</div>

        {/* Vector display + sliders */}
        <div className="space-y-4">
          {/* Vector notation */}
          <div className="rounded-lg bg-foreground/[0.03] p-3">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted">
              Vector
            </div>
            <div className="font-mono text-sm">
              ({currentValues.map((v, i) => (
                <span key={i}>
                  {i > 0 && ", "}
                  <span className="text-accent">{v}</span>
                </span>
              ))})
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-2">
            {example.dimensions.map((dim, idx) => (
              <SliderControl
                key={dim.name}
                label={dim.name}
                value={currentValues[idx]}
                min={dim.min}
                max={dim.max}
                step={dim.step}
                onChange={(v) => handleChange(idx, v)}
                formatValue={(v) => `${Math.round(v)}${dim.unit ?? ""}`}
              />
            ))}
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
