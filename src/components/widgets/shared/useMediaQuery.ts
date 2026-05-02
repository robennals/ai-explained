"use client";

import { useEffect, useState } from "react";

/**
 * Returns true once the given CSS media query matches.
 * SSR-safe: defaults to false on the server, then updates on mount.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    const update = () => setMatches(m.matches);
    update();
    m.addEventListener("change", update);
    return () => m.removeEventListener("change", update);
  }, [query]);
  return matches;
}
