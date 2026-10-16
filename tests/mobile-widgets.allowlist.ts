// Accepted exceptions to the phone checks in mobile-widgets.spec.ts, keyed
// "<chapter slug> / <widget title> / <rule>", each with the reason it's OK.
// Keep this short: fix the widget instead where you can.
export const MOBILE_ALLOWLIST: Record<string, string> = {
  "transformers / A Transformer At a Glance / small-target":
    "The drawn cells are 23px tall on phones, but each has invisible tap padding (HitPad in TransformerOverview/Grid.tsx) making the real target about 31px.",
};
