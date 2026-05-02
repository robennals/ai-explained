"use client";

import { useEffect, useState, type RefObject } from "react";

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
