"use client";

/**
 * Small illustration for the "How can one vector hold many ideas?" sub-section.
 * Shows a single vector box with two arrows labeled "self" and "pulled-in" pointing
 * into orthogonal directions, and an FFN symbol reading both.
 */
export function VectorSubspaceFig() {
  return (
    <div className="my-6 flex items-center justify-center">
      <svg
        viewBox="0 0 520 260"
        className="max-w-full text-foreground"
        role="img"
        aria-label="A vector carrying two ideas — self-info on one axis, pulled-in info on another — both read by a feed-forward network."
      >
        {/* Vector box */}
        <rect
          x="60" y="80" width="220" height="100"
          rx="10" ry="10"
          fill="var(--color-surface, #f7f7fb)"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <text x="170" y="72" textAnchor="middle" fontSize="12" fill="currentColor">
          one token&apos;s vector
        </text>

        {/* Self arrow (horizontal) */}
        <line x1="90" y1="130" x2="250" y2="130" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrow-blue)" />
        <text x="170" y="148" textAnchor="middle" fontSize="11" fill="#3b82f6" fontWeight="600">
          self (original meaning)
        </text>

        {/* Pulled-in arrow (vertical) */}
        <line x1="170" y1="170" x2="170" y2="95" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrow-amber)" />
        <text x="175" y="110" fontSize="11" fill="#f59e0b" fontWeight="600">
          pulled-in info
        </text>

        {/* FFN reads both */}
        <path
          d="M 280 130 Q 330 130 360 130"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          markerEnd="url(#arrow-fg)"
        />
        <rect
          x="360" y="100" width="100" height="60"
          rx="6" ry="6"
          fill="var(--color-surface, #f7f7fb)"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <text x="410" y="135" textAnchor="middle" fontSize="13" fill="currentColor" fontWeight="600">
          FFN
        </text>
        <text x="410" y="180" textAnchor="middle" fontSize="11" fill="currentColor">
          reads across
        </text>
        <text x="410" y="195" textAnchor="middle" fontSize="11" fill="currentColor">
          both subspaces
        </text>

        <defs>
          <marker id="arrow-blue" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M 0 0 L 8 4 L 0 8 z" fill="#3b82f6" />
          </marker>
          <marker id="arrow-amber" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M 0 0 L 8 4 L 0 8 z" fill="#f59e0b" />
          </marker>
          <marker id="arrow-fg" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M 0 0 L 8 4 L 0 8 z" fill="currentColor" />
          </marker>
        </defs>
      </svg>
    </div>
  );
}
