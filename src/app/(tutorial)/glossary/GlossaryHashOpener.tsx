"use client";

import { useEffect } from "react";

/**
 * When /glossary is loaded (or navigated to) with a #term hash, expand the
 * matching <details> card, scroll it into view, and briefly highlight it.
 * Also listens for in-page hash changes so cross-links inside one card open
 * the target card without a full reload.
 */
export function GlossaryHashOpener() {
  useEffect(() => {
    function openHash() {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const el = document.getElementById(id);
      if (!(el instanceof HTMLDetailsElement)) return;
      el.open = true;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.classList.remove("glossary-card-highlight");
      // Force reflow so the animation restarts if the same id is targeted twice.
      void el.offsetWidth;
      el.classList.add("glossary-card-highlight");
    }
    openHash();
    window.addEventListener("hashchange", openHash);
    return () => window.removeEventListener("hashchange", openHash);
  }, []);
  return null;
}
