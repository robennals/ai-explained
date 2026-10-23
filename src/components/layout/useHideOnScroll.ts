"use client";

import { useEffect, useState } from "react";

// Hides on scroll-down, reveals on scroll-up. Stays revealed while scroll
// is still inside `threshold` of the top so the header doesn't flicker
// during over-scroll bounce on iOS.
export function useHideOnScroll(threshold = 64): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < threshold) {
          setHidden(false);
        } else if (y > lastY) {
          setHidden(true);
        } else if (y < lastY) {
          setHidden(false);
        }
        lastY = y;
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return hidden;
}
