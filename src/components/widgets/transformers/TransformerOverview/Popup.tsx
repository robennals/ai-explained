"use client";

import type { ReactNode } from "react";

interface PopupProps {
  /** Cell or label center, in viewBox coordinates. */
  anchorX: number;
  anchorY: number;
  /** "below" = popup sits above the anchor, with pointer underneath; "above" reverses. */
  pointerDirection: "below" | "above";
  /** SVG viewBox dimensions, used to convert anchor coords into CSS percentages. */
  viewWidth: number;
  viewHeight: number;
  title: ReactNode;
  body: ReactNode;
  onClose: () => void;
}

export function Popup({
  anchorX,
  anchorY,
  pointerDirection,
  viewWidth,
  viewHeight,
  title,
  body,
  onClose,
}: PopupProps) {
  // The SVG is rendered with width=100% and aspect-ratio preserved (viewBox).
  // Convert the anchor's viewBox coords to percentages so the popup follows on resize.
  const leftPct = (anchorX / viewWidth) * 100;
  const topPct = (anchorY / viewHeight) * 100;

  // Popup is positioned with its tip at (leftPct, topPct).
  // pointerDirection "below" means the tip is at the bottom edge of the popup.
  const transform =
    pointerDirection === "below"
      ? "translate(-50%, calc(-100% - 8px))"
      : "translate(-50%, 8px)";

  return (
    <div
      className="absolute z-10 w-[300px] rounded-lg border border-amber-700 bg-white p-3 text-xs text-foreground shadow-lg"
      style={{ left: `${leftPct}%`, top: `${topPct}%`, transform }}
      role="region"
      aria-label="Cell details"
    >
      <div className="mb-1 flex items-baseline justify-between">
        <div className="font-semibold text-amber-900">{title}</div>
        <button
          onClick={onClose}
          className="text-muted hover:text-foreground"
          aria-label="Close popup"
        >
          ✕
        </button>
      </div>
      <div className="leading-relaxed">{body}</div>
      {/* Pointer triangle */}
      <div
        className="absolute h-3 w-3 border border-amber-700 bg-white"
        style={
          pointerDirection === "below"
            ? { left: "50%", bottom: "-7px", transform: "translateX(-50%) rotate(45deg)", borderTop: "none", borderLeft: "none" }
            : { left: "50%", top: "-7px", transform: "translateX(-50%) rotate(45deg)", borderBottom: "none", borderRight: "none" }
        }
        aria-hidden="true"
      />
    </div>
  );
}
