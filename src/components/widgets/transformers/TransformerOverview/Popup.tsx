"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

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

  // On narrow screens a popup centred on its anchor can run off the edge of
  // the diagram (e.g. a layer label at the far left). Slide the popup
  // sideways to stay inside its container, keeping the pointer on the anchor.
  const popupRef = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);
  useLayoutEffect(() => {
    const popup = popupRef.current;
    const container = popup?.parentElement;
    if (!popup || !container) return;
    const EDGE = 8;
    const update = () => {
      const width = container.clientWidth;
      const anchorPx = (leftPct / 100) * width;
      const half = popup.offsetWidth / 2;
      const clamped = Math.min(Math.max(anchorPx, half + EDGE), width - half - EDGE);
      setShift(clamped - anchorPx);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    return () => ro.disconnect();
  }, [leftPct]);

  // Close on a press anywhere outside the popup, or on Escape. Pressing another
  // layer label closes this popup and its click then opens that one.
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (e.target instanceof Node && popupRef.current?.contains(e.target)) return;
      onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  // Popup is positioned with its tip at (leftPct, topPct).
  // pointerDirection "below" means the tip is at the bottom edge of the popup.
  const transform =
    pointerDirection === "below"
      ? `translate(calc(-50% + ${shift}px), calc(-100% - 8px))`
      : `translate(calc(-50% + ${shift}px), 8px)`;

  return (
    <div
      ref={popupRef}
      className="absolute z-10 w-[min(300px,calc(100%-16px))] rounded-lg border border-amber-700 bg-white p-3 text-xs text-foreground shadow-lg"
      style={{ left: `${leftPct}%`, top: `${topPct}%`, transform }}
      role="region"
      aria-label="Cell details"
    >
      <div className="mb-1 flex items-baseline justify-between">
        <div className="font-semibold text-amber-900">{title}</div>
        <button
          onClick={onClose}
          className="-m-2 p-2 text-muted hover:text-foreground"
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
            ? { left: `calc(50% - ${shift}px)`, bottom: "-7px", transform: "translateX(-50%) rotate(45deg)", borderTop: "none", borderLeft: "none" }
            : { left: `calc(50% - ${shift}px)`, top: "-7px", transform: "translateX(-50%) rotate(45deg)", borderBottom: "none", borderRight: "none" }
        }
        aria-hidden="true"
      />
    </div>
  );
}
