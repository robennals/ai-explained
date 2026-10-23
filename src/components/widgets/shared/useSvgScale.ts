"use client";

import { useEffect, useState, type RefObject } from "react";
import { useIsPhone } from "./useMediaQuery";

// Returns a multiplier you can apply to SVG `fontSize` (in user units) so
// that the rendered text stays at a constant CSS pixel size as the SVG
// scales with its container. Useful for keeping labels readable on mobile
// when an SVG with a fixed viewBox is squeezed below its native width.
//
// Usage:
//   const ref = useRef<SVGSVGElement>(null);
//   const scale = useSvgScale(ref, SVG_WIDTH);
//   <svg ref={ref} viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}>
//     <text fontSize={11 * scale}>...</text>
//   </svg>
export function useSvgScale(
  ref: RefObject<SVGSVGElement | null>,
  viewBoxWidth: number,
): number {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setScale(viewBoxWidth / w);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, viewBoxWidth]);

  return scale;
}

// Like useSvgScale, but never below 1: text keeps its designed size wherever
// the SVG is drawn at or above its viewBox width (desktop), and grows only
// when the SVG is squeezed narrower (phones), so it never renders smaller
// than designed.
export function useSvgTextScale(
  ref: RefObject<SVGSVGElement | null>,
  viewBoxWidth: number,
): number {
  return Math.max(1, useSvgScale(ref, viewBoxWidth));
}

/** Smallest text size, in CSS pixels, we draw in an SVG on a phone. */
export const MIN_SVG_TEXT_PX = 10;

// Returns fontSize(designPx), giving the SVG `fontSize` (in viewBox units)
// for text designed at `designPx`. Off phones that's just designPx, so desktop
// looks exactly as designed. On phones the text is drawn at no less than its
// designed size, and never below MIN_SVG_TEXT_PX, however much the SVG is
// squeezed.
//
// Usage:
//   const fontSize = useSvgFontSize(ref, SVG_WIDTH);
//   <text fontSize={fontSize(9)}>...</text>
export function useSvgFontSize(
  ref: RefObject<SVGSVGElement | null>,
  viewBoxWidth: number,
): (designPx: number) => number {
  const scale = useSvgScale(ref, viewBoxWidth);
  const isPhone = useIsPhone();
  return (designPx) =>
    isPhone ? Math.max(designPx * Math.max(1, scale), MIN_SVG_TEXT_PX * scale) : designPx;
}
