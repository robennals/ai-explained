"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Links a panel of sliders to the parts of a diagram they control, for
 * layouts where the two are separated (e.g. phones, with sliders stacked
 * under the diagram). One parameter at a time is "active":
 *
 * - Touching or focusing a slider row makes its parameter active, so the
 *   widget can highlight the matching part of the diagram.
 * - Tapping that part of the diagram (`selectFromDiagram`) makes it active
 *   and focuses its slider, scrolling the row into view if needed.
 *
 * Spread `rowProps(param)` onto the element wrapping each slider.
 */
export function useSliderDiagramLink<P extends string>() {
  const [active, setActive] = useState<P | null>(null);
  const rows = useRef(new Map<P, HTMLElement>());

  const selectFromDiagram = useCallback((param: P) => {
    setActive(param);
    const row = rows.current.get(param);
    row?.querySelector<HTMLElement>('[role="slider"], input[type="range"]')?.focus({ preventScroll: true });
    row?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);

  const rowProps = (param: P) => ({
    ref: (el: HTMLElement | null) => {
      if (el) rows.current.set(param, el);
      else rows.current.delete(param);
    },
    onPointerDownCapture: () => setActive(param),
    onFocusCapture: () => setActive(param),
    className: `-mx-2 rounded-md px-2 transition-colors ${
      active === param ? "bg-accent/10 ring-1 ring-accent/40" : ""
    }`,
  });

  return { active, setActive, selectFromDiagram, rowProps };
}
