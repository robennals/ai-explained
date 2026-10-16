// Scrolls a horizontally scrolling row (e.g. a sentence laid out as token
// columns) so the given elements are in view. On a phone a sentence often
// doesn't fit, and the token that matters — usually the query word near the
// end — would otherwise start off-screen.
//
// If all targets fit in the visible width, they are all brought into view;
// if not, the first target wins. `leftInset` is the width covered by a sticky
// column at the scroller's left edge. Adjusts scrollLeft only, so the page
// itself never scrolls.
export function keepInHorizontalView(
  scroller: HTMLElement,
  targets: (HTMLElement | null | undefined)[],
  {
    margin = 12,
    leftInset = 0,
    behavior = "smooth",
  }: { margin?: number; leftInset?: number; behavior?: ScrollBehavior } = {},
) {
  const els = targets.filter((t): t is HTMLElement => !!t);
  if (els.length === 0) return;
  const box = scroller.getBoundingClientRect();
  const lefts = els.map((el) => el.getBoundingClientRect().left - box.left + scroller.scrollLeft);
  const rights = els.map((el, i) => lefts[i] + el.getBoundingClientRect().width);
  // Content x-range that must be visible, and the visible width available.
  const lo = Math.min(...lefts) - margin - leftInset;
  const hi = Math.max(...rights) + margin;
  const view = scroller.clientWidth;
  let next = scroller.scrollLeft;
  if (hi - lo <= view) {
    if (lo < next) next = lo;
    else if (hi > next + view) next = hi - view;
  } else {
    next = lefts[0] - margin - leftInset;
  }
  next = Math.max(0, Math.min(next, scroller.scrollWidth - view));
  if (Math.abs(next - scroller.scrollLeft) > 1) {
    scroller.scrollTo({ left: next, behavior });
  }
}
