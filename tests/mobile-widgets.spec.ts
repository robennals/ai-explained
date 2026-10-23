// Phone-size checks for every widget in every published chapter, so new or
// changed widgets can't quietly become hard to use on a phone.
//
// At a 390×844 touch viewport, each widget must have:
// - no content poking past its edges (outside deliberate sideways scrollers),
//   and the page must not scroll sideways;
// - text of at least 10px, including SVG text after the SVG is scaled down;
// - tap targets of at least 24×24px (WCAG 2.2 minimum; links and glossary
//   terms inside running text are exempt, as WCAG allows);
// - text boxes of at least 16px, so iOS doesn't zoom the page on focus.
//
// Known, accepted exceptions live in mobile-widgets.allowlist.ts. An
// allowlisted problem that no longer happens also fails, so the list stays
// accurate.
import { test, expect } from "@playwright/test";
import { chapters } from "../src/lib/curriculum";
import { MOBILE_ALLOWLIST } from "./mobile-widgets.allowlist";

const SLUGS = chapters
  .filter((c) => c.ready && c.section !== "appendix")
  .map((c) => c.slug);

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

type Rule = "overflow" | "small-text" | "small-target" | "small-input";

interface WidgetReport {
  title: string;
  problems: Partial<Record<Rule, string[]>>;
}

for (const slug of SLUGS) {
  test(`/${slug} widgets are usable on a phone`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto(`/${slug}`, { waitUntil: "load" });
    // Scroll through so every widget mounts and lays out.
    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < height; y += 600) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(1000);

    const pageOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(pageOverflow, "page scrolls sideways").toBe(0);

    const widgets = page.locator(".widget-container");
    const count = await widgets.count();
    const reports: WidgetReport[] = [];
    for (let i = 0; i < count; i++) {
      const widget = widgets.nth(i);
      await widget.scrollIntoViewIfNeeded();
      reports.push(await widget.evaluate(measureWidget));
    }

    // Compare against the allowlist: every problem must be listed, and every
    // listed problem must still happen.
    const found = new Set<string>();
    const unexpected: string[] = [];
    for (const r of reports) {
      for (const [rule, details] of Object.entries(r.problems)) {
        const key = `${slug} / ${r.title} / ${rule}`;
        found.add(key);
        if (!(key in MOBILE_ALLOWLIST)) unexpected.push(`${key}: ${details.join("; ")}`);
      }
    }
    const stale = Object.keys(MOBILE_ALLOWLIST).filter(
      (key) => key.startsWith(`${slug} / `) && !found.has(key),
    );
    expect(unexpected, "phone usability problems").toEqual([]);
    expect(stale, "allowlisted problems that no longer happen (remove them)").toEqual([]);
  });
}

/** Runs in the browser, inside one `.widget-container`. */
function measureWidget(el: Element): WidgetReport {
  const MIN_TEXT_PX = 9.95; // 10px; the browser reports exactly 10px as 9.9999
  const MIN_TARGET_PX = 23.5; // 24px, allowing for sub-pixel rounding
  const MIN_INPUT_PX = 16;

  const box = el.getBoundingClientRect();
  const title = el.querySelector("h3")?.textContent?.trim() ?? "(untitled)";
  const problems: WidgetReport["problems"] = {};
  const add = (rule: Rule, detail: string) => {
    const list = (problems[rule] ??= []);
    if (list.length < 5) list.push(detail);
  };

  const isVisible = (e: Element) => {
    for (let p: Element | null = e; p && p !== el.parentElement; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (s.display === "none" || s.visibility === "hidden" || parseFloat(s.opacity) === 0) return false;
    }
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  // Inside a deliberate sideways scroller (tab bars, token rows).
  const isInScroller = (e: Element) => {
    for (let p = e.parentElement; p && p !== el; p = p.parentElement) {
      const s = getComputedStyle(p);
      if ((s.overflowX === "auto" || s.overflowX === "scroll") && p.scrollWidth > p.clientWidth) return true;
    }
    return false;
  };
  // Drawn past an SVG's edge, which clips it away.
  const isClippedBySvg = (e: Element) => {
    const svg = e instanceof SVGElement ? e.closest("svg") : null;
    return !!svg && svg !== e && getComputedStyle(svg).overflow !== "visible";
  };
  const isInlineInText = (e: Element) =>
    e.classList.contains("glossary-term") || (e.tagName === "A" && getComputedStyle(e).display === "inline");
  const describe = (e: Element) =>
    (e.getAttribute("aria-label") || e.textContent || e.tagName).trim().replace(/\s+/g, " ").slice(0, 30);

  for (const e of Array.from(el.querySelectorAll("*"))) {
    if (!isVisible(e) || isInScroller(e) || isClippedBySvg(e)) continue;
    const r = e.getBoundingClientRect();
    const over = Math.max(r.right - box.right, box.left - r.left);
    if (over > 2) add("overflow", `${describe(e)} (+${Math.round(over)}px)`);
  }

  const targets = el.querySelectorAll(
    "button, a[href], input, select, textarea, [role=slider], [role=tab], [role=button]",
  );
  for (const e of Array.from(targets)) {
    if (!isVisible(e) || (e as HTMLInputElement).type === "hidden" || isInlineInText(e)) continue;
    const r = e.getBoundingClientRect();
    if (Math.min(r.width, r.height) < MIN_TARGET_PX) {
      add("small-target", `${describe(e)} ${Math.round(r.width)}×${Math.round(r.height)}`);
    }
  }

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent?.trim();
    const parent = node.parentElement;
    if (!text || !parent || !isVisible(parent)) continue;
    let px = parseFloat(getComputedStyle(parent).fontSize);
    if (parent instanceof SVGGraphicsElement) {
      const m = parent.getScreenCTM();
      if (m) px *= Math.hypot(m.a, m.b);
    }
    if (px < MIN_TEXT_PX) add("small-text", `"${text.slice(0, 18)}" ${px.toFixed(1)}px`);
  }

  const inputs = el.querySelectorAll(
    "input:not([type=range]):not([type=checkbox]):not([type=radio]), textarea, select",
  );
  for (const e of Array.from(inputs)) {
    if (!isVisible(e)) continue;
    const px = parseFloat(getComputedStyle(e).fontSize);
    if (px < MIN_INPUT_PX) add("small-input", `${describe(e)} ${px}px`);
  }

  return { title, problems };
}
