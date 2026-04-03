"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { WidgetContainer } from "../shared/WidgetContainer";
import { SliderControl } from "../shared/SliderControl";

const DEG = Math.PI / 180;

export function RotationDotProduct() {
  const [baseAngle, setBaseAngle] = useState(30);
  const [diffAngle, setDiffAngle] = useState(45);

  const handleReset = useCallback(() => {
    setBaseAngle(30);
    setDiffAngle(45);
  }, []);

  const angleA = baseAngle * DEG;
  const angleB = (baseAngle + diffAngle) * DEG;

  const vecA: [number, number] = useMemo(
    () => [Math.cos(angleA), Math.sin(angleA)],
    [angleA]
  );
  const vecB: [number, number] = useMemo(
    () => [Math.cos(angleB), Math.sin(angleB)],
    [angleB]
  );

  const products = [vecA[0] * vecB[0], vecA[1] * vecB[1]];
  const dot = products[0] + products[1];
  // cos(diff) is the "pure" value — should always equal dot for unit vectors
  const cosDiff = Math.cos(diffAngle * DEG);

  // SVG config
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 100;

  // SVG coordinates (y flipped)
  const aEndX = cx + vecA[0] * radius;
  const aEndY = cy - vecA[1] * radius;
  const bEndX = cx + vecB[0] * radius;
  const bEndY = cy - vecB[1] * radius;

  // Arc for angle between
  const arcRadius = 35;
  const arcStartX = cx + Math.cos(-baseAngle * DEG) * arcRadius;
  const arcStartY = cy + Math.sin(-baseAngle * DEG) * arcRadius;
  const arcEndX = cx + Math.cos(-(baseAngle + diffAngle) * DEG) * arcRadius;
  const arcEndY = cy + Math.sin(-(baseAngle + diffAngle) * DEG) * arcRadius;
  const absDiff = Math.abs(diffAngle);
  const largeArc = absDiff > 180 ? 1 : 0;
  const sweep = diffAngle >= 0 ? 0 : 1;

  // Drag handling
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef<"A" | "B" | null>(null);

  const clientToAngle = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      const svgX = ((clientX - rect.left) / rect.width) * size;
      const svgY = ((clientY - rect.top) / rect.height) * size;
      const dx = svgX - cx;
      const dy = -(svgY - cy);
      return ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
    },
    [size, cx, cy]
  );

  const handlePointerDown =
    (which: "A" | "B") => (e: React.PointerEvent) => {
      dragging.current = which;
      (e.target as SVGElement).setPointerCapture(e.pointerId);
    };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const angle = clientToAngle(e.clientX, e.clientY);
      if (angle === null) return;

      if (dragging.current === "A") {
        // Move base angle, keep diff fixed
        setBaseAngle(Math.round(angle));
      } else {
        // Move B — change diff
        let newDiff = Math.round(angle - baseAngle);
        // Normalize to -180..180
        while (newDiff > 180) newDiff -= 360;
        while (newDiff < -180) newDiff += 360;
        setDiffAngle(Math.max(-180, Math.min(180, newDiff)));
      }
    },
    [clientToAngle, baseAngle]
  );

  const handlePointerUp = useCallback(() => {
    dragging.current = null;
  }, []);

  return (
    <WidgetContainer
      title="Rotation Doesn't Change the Dot Product"
      description="Two unit vectors on a circle. Drag them or use the sliders — the dot product depends only on the angle between them."
      onReset={handleReset}
    >
      <div className="flex flex-col gap-5">
        {/* Sliders */}
        <div className="flex flex-col gap-2">
          <SliderControl
            label="Base angle"
            value={baseAngle}
            min={0}
            max={359}
            step={1}
            onChange={setBaseAngle}
            formatValue={(v) => `${v}°`}
          />
          <SliderControl
            label="Angle between"
            value={diffAngle}
            min={-180}
            max={180}
            step={1}
            onChange={setDiffAngle}
            formatValue={(v) => `${v}°`}
          />
        </div>

        {/* Circle + calculation side by side */}
        <div className="flex flex-wrap items-start justify-center gap-6">
          {/* Circle */}
          <div className="flex justify-center">
            <svg
              ref={svgRef}
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="max-w-full shrink-0"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              style={{ touchAction: "none" }}
            >
              {/* Unit circle */}
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={1}
                opacity={0.1}
              />

              {/* Axes */}
              <line x1={cx - radius - 10} y1={cy} x2={cx + radius + 10} y2={cy} stroke="currentColor" strokeWidth={0.5} opacity={0.1} />
              <line x1={cx} y1={cy - radius - 10} x2={cx} y2={cy + radius + 10} stroke="currentColor" strokeWidth={0.5} opacity={0.1} />

              {/* Arc between vectors */}
              {absDiff > 0.5 && (
                <>
                  <path
                    d={`M ${arcStartX} ${arcStartY} A ${arcRadius} ${arcRadius} 0 ${largeArc} ${sweep} ${arcEndX} ${arcEndY}`}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    opacity={0.6}
                  />
                  <text
                    x={
                      cx +
                      Math.cos(
                        -(baseAngle + diffAngle / 2) * DEG
                      ) *
                        (arcRadius + 14)
                    }
                    y={
                      cy +
                      Math.sin(
                        -(baseAngle + diffAngle / 2) * DEG
                      ) *
                        (arcRadius + 14)
                    }
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={11}
                    fill="#f59e0b"
                    fontWeight="bold"
                  >
                    {diffAngle}°
                  </text>
                </>
              )}

              <defs>
                <marker id="rdp-arrowA" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
                </marker>
                <marker id="rdp-arrowB" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                </marker>
              </defs>

              {/* Vector A */}
              <line x1={cx} y1={cy} x2={aEndX} y2={aEndY} stroke="#3b82f6" strokeWidth={2.5} markerEnd="url(#rdp-arrowA)" />
              <circle cx={aEndX} cy={aEndY} r={5} fill="#3b82f6" />
              <circle cx={aEndX} cy={aEndY} r={16} fill="transparent" cursor="grab" onPointerDown={handlePointerDown("A")} />
              <text
                x={cx + vecA[0] * (radius + 18)}
                y={cy - vecA[1] * (radius + 18)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={13}
                fontWeight="bold"
                fill="#3b82f6"
                style={{ pointerEvents: "none" }}
              >
                A
              </text>

              {/* Vector B */}
              <line x1={cx} y1={cy} x2={bEndX} y2={bEndY} stroke="#10b981" strokeWidth={2.5} markerEnd="url(#rdp-arrowB)" />
              <circle cx={bEndX} cy={bEndY} r={5} fill="#10b981" />
              <circle cx={bEndX} cy={bEndY} r={16} fill="transparent" cursor="grab" onPointerDown={handlePointerDown("B")} />
              <text
                x={cx + vecB[0] * (radius + 18)}
                y={cy - vecB[1] * (radius + 18)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={13}
                fontWeight="bold"
                fill="#10b981"
                style={{ pointerEvents: "none" }}
              >
                B
              </text>

              {/* Origin */}
              <circle cx={cx} cy={cy} r={3} fill="currentColor" opacity={0.3} />
            </svg>
          </div>

          {/* Calculation panel */}
          <div className="flex flex-col gap-3 min-w-[220px]">
            {/* Vector components */}
            <div className="rounded-lg border border-border bg-surface text-xs">
              <div className="px-3 py-2 border-b border-border font-medium text-muted">
                Vector components
              </div>
              <div className="px-3 py-2 space-y-1.5 font-mono text-[12px]">
                <div>
                  <span className="font-bold text-blue-500">A</span>
                  <span className="text-muted"> = (</span>
                  <span className="text-blue-500">{vecA[0].toFixed(3)}</span>
                  <span className="text-muted">, </span>
                  <span className="text-blue-500">{vecA[1].toFixed(3)}</span>
                  <span className="text-muted">)</span>
                </div>
                <div>
                  <span className="font-bold text-emerald-500">B</span>
                  <span className="text-muted"> = (</span>
                  <span className="text-emerald-500">{vecB[0].toFixed(3)}</span>
                  <span className="text-muted">, </span>
                  <span className="text-emerald-500">{vecB[1].toFixed(3)}</span>
                  <span className="text-muted">)</span>
                </div>
              </div>
            </div>

            {/* Dot product calculation */}
            <div className="rounded-lg border border-border bg-surface text-xs">
              <div className="px-3 py-2 border-b border-border font-medium text-muted">
                Dot product (multiply &amp; add)
              </div>
              <div className="px-3 py-2 space-y-1.5 font-mono text-[12px]">
                {["x", "y"].map((dim, i) => (
                  <div key={dim} className="flex items-center gap-1">
                    <span className="text-muted">{dim}:</span>
                    <span className="text-blue-500">{vecA[i].toFixed(3)}</span>
                    <span className="text-muted">×</span>
                    <span className="text-emerald-500">{vecB[i].toFixed(3)}</span>
                    <span className="text-muted">=</span>
                    <span className="font-semibold">{products[i].toFixed(3)}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-1.5">
                  <span className="text-muted">{products[0].toFixed(3)} + {products[1].toFixed(3)} = </span>
                  <span className="font-bold text-accent text-sm">{dot.toFixed(4)}</span>
                </div>
              </div>
            </div>

            {/* The key insight: cos(diff) */}
            <div className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-2.5 text-xs">
              <div className="font-medium text-accent mb-1">
                cos({diffAngle}°) = {cosDiff.toFixed(4)}
              </div>
              <div className="text-foreground/70 leading-relaxed">
                The dot product always equals cos(angle between).
                Slide the base angle — the individual x and y values change,
                but the dot product stays the same.
              </div>
            </div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
