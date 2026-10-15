/**
 * Shared wrapper for the small looping chapter illustrations on the home page.
 *
 * Each illustration is a plain SVG animated with CSS keyframes in an inline
 * <style>, so it renders on the server and ships no JavaScript. Base styles
 * describe the finished frame, so under prefers-reduced-motion (where the
 * animations are switched off) the reader sees a meaningful still image.
 */
export function ArtFrame({
  label,
  prefix,
  css,
  children,
}: {
  label: string;
  /** Class-name prefix unique to this illustration, scoping its CSS. */
  prefix: string;
  css: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 320 180"
      className={`${prefix} h-full w-full`}
      role="img"
      aria-label={label}
    >
      <style>
        {`${css}
@media (prefers-reduced-motion: reduce) {
  .${prefix} * { animation: none !important; }
}`}
      </style>
      {children}
    </svg>
  );
}

/** Builds one keyframes rule from [percent, declarations] pairs. */
export function keyframes(
  name: string,
  frames: [number, string][]
): string {
  const body = frames
    .map(([pct, decl]) => `${pct.toFixed(2)}%{${decl}}`)
    .join("");
  return `@keyframes ${name}{${body}}`;
}

/** Converts a time in a loop of `periodMs` to a keyframe percentage. */
export function timeline(periodMs: number): (ms: number) => number {
  return (ms) => (ms / periodMs) * 100;
}
