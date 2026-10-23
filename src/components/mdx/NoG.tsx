import type { ReactNode } from "react";

/**
 * Marks a word as deliberately *not* a glossary link. The lint script treats
 * children as "claimed" so they pass the strict-gate check without rendering
 * any affordance.
 */
export function NoG({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
