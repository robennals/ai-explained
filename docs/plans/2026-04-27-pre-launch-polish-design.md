# Pre-launch Polish — Design Spec

**Date:** 2026-04-27
**Branch:** `meta/polish`
**Goal:** Address all pre-launch issues identified in the audit so the site can be published tomorrow as a high-quality, share-worthy artifact.

## Scope

**In scope:**
- SEO/social: `metadataBase`, per-chapter OG images, sitemap, robots, README rewrite, Vercel Analytics.
- Mobile/responsive: hamburger drawer for chapter nav, prev/next stacking, header cleanup.
- Header: fix broken GitHub link, remove redundant "Chapters" link.
- Per-chapter metadata: refactor to a single helper sourced from `curriculum.ts`.
- Widget polish: add `onReset` to 3 widgets that have state but don't expose reset.
- Verification: Playwright tests for the new mobile drawer; mobile-width screenshots of any widget I touch.

**Explicitly out of scope:**
- Chapter content / voice rewrites (the "we" pronouns refer to "me and the reader" and stay).
- Per-chapter content tests for chapters 2–8 (defer to post-launch).
- Per-widget responsive layout rewrites (audit confirmed widgets are already responsive at the layout level — only `onReset` is missing).
- Substance changes to chapters or widgets.

## Architecture overview

The plan is one large polish PR on the existing `meta/polish` branch. No new dependencies beyond `@vercel/analytics`. Changes are grouped by area; each area is internally cohesive and largely independent of the others, so the work can be reviewed area-by-area.

The biggest architectural addition is the **per-chapter Open Graph image pipeline**: a dedicated `/og/[slug]` Next.js route renders a 1200×630 card (chapter title + the chapter's primary diagram), and a Playwright script visits each route and saves a PNG to `public/og/{slug}.png`. Chapter metadata then references the static PNG. Generation is a manual `pnpm og:capture` step; PNGs are committed.

## Components and changes

### 1. Root metadata + analytics (`src/app/layout.tsx`)

Add `metadataBase` (from `NEXT_PUBLIC_SITE_URL` env, fallback to `http://localhost:3000`), default `openGraph` and `twitter` blocks pointing at a site-wide OG image (`/og/site.png`), `viewport` config, and `<Analytics />` from `@vercel/analytics/next`.

### 2. Sitemap and robots (`src/app/sitemap.ts`, `src/app/robots.ts`)

Both derive from `getMainChapters()` + `getAppendixChapters()` filtered by `ready: true`. Sitemap lists `/` plus every ready slug. Robots allows everything and points to the sitemap.

### 3. README rewrite (`README.md`)

Replace the `create-next-app` boilerplate with: what the site is, link to live URL, the curriculum at-a-glance, dev/test commands, and how to contribute or report errors.

### 4. SiteHeader changes (`src/components/layout/SiteHeader.tsx`)

- Fix the GitHub link: `https://github.com` → `https://github.com/robennals/ai-explained`.
- Remove the "Chapters" link entirely (the logo already links home).
- Render a hamburger button that's visible only on `<lg` (mounts `MobileChapterNav` when clicked). On the homepage the hamburger isn't useful, so it's hidden there too — only show it on tutorial routes (read `usePathname()` and check whether it matches a chapter slug).

### 5. Shared `<ChapterList>` component (`src/components/layout/ChapterList.tsx`)

Extract the chapter-list rendering currently inlined in `SideNav.tsx` (the `<ul>` of `ChapterItem`s, the appendix divider, the headings) into a reusable component. Both `SideNav` (desktop) and `MobileChapterNav` (mobile drawer) render `<ChapterList />`. Style is identical to today's desktop sidebar.

### 6. MobileChapterNav (`src/components/layout/MobileChapterNav.tsx`)

A client component with `useState` for open/close. Renders a hamburger button (rendered by `SiteHeader`) and, when open:
- A full-screen scrim (`fixed inset-0 bg-black/40`, click closes).
- A left drawer (`fixed left-0 top-0 bottom-0 w-72 bg-background border-r overflow-y-auto`) with a close button and `<ChapterList />`.
- Closes the drawer when the route changes (so tapping a chapter dismisses it).
- Locks body scroll while open.
- ESC key closes.

The drawer lives in the tutorial layout (`src/app/(tutorial)/layout.tsx`) — root layout doesn't need it because the homepage already shows the chapter grid.

The hamburger button itself is rendered in `SiteHeader`, but the open/close state needs to be shared with the drawer. Easiest: have `MobileChapterNav` own both the button and the drawer, mounted in the tutorial layout, positioned over the header via `fixed`. (The header is `sticky top-0 z-50` — drawer scrim is `z-[60]` to sit above it.)

Decision: render `<MobileChapterNav />` once in the tutorial layout. It owns its own button positioning (`fixed top-2 left-4 lg:hidden z-[55]`). The button visually sits in the header bar but isn't a child of `SiteHeader`. Trade-off: small layout coupling, but avoids context/global state.

### 7. ChapterNav stacking (`src/components/layout/ChapterNav.tsx`)

Change `flex items-stretch gap-4` → `flex flex-col sm:flex-row items-stretch gap-3 sm:gap-4`. Add `sm:text-right` qualifier to the next-link's text-right (currently always right-aligned, which looks awkward when stacked).

### 8. Per-chapter metadata helper (`src/lib/chapter-metadata.ts`)

```ts
export function chapterMetadata(slug: string): Metadata {
  const ch = getChapter(slug);
  if (!ch) return {};
  return {
    title: `${ch.title} — Learn AI Layer by Layer`,
    description: ch.description,
    openGraph: { images: [`/og/${slug}.png`] },
    twitter: { card: "summary_large_image", images: [`/og/${slug}.png`] },
  };
}
```

Each chapter `page.tsx` replaces its hand-written `metadata` object with `export const metadata = chapterMetadata("slug")`. 10 chapter pages × 1-line replacement.

### 9. Per-chapter OG image pipeline

**Route:** `src/app/og/[slug]/page.tsx` (and matching `layout.tsx` that strips the site header). Renders a 1200×630 card:
- Brand strip at top: small "Learn AI Layer by Layer" + chapter number badge.
- Chapter title (large) + subtitle.
- Below: the chapter's "feature diagram" — a single dedicated widget chosen per chapter, marked in a registry.
- Brand color background; the same accent palette as the site.

**Diagram registry:** A new file `src/lib/og-diagrams.tsx` maps `slug → ReactNode` for the diagram to embed. The author picks one widget per chapter (typically the most visual one). The registry renders the chosen widget inside a fixed-size frame with controls/text trimmed via the OG route's CSS — the widget mounts in its initial state and Playwright captures the result. If a chapter has no widget that renders well as a static image, the registry entry can return a custom SVG illustration instead.

**Capture script:** `scripts/capture-og-images.ts` (run via `pnpm og:capture`). Spawns Playwright, navigates to `http://localhost:3000/og/{slug}` for each ready slug at viewport 1200×630, screenshots full page (which equals the viewport because the route's body is exactly 1200×630), saves to `public/og/{slug}.png`. Also captures `public/og/site.png` from `/og/site` (the homepage variant).

**Operational notes:**
- The `/og/*` routes are public but unlinked. They render only when visited (no SEO concern; sitemap excludes them).
- PNGs are committed to git (10 chapters × ~50KB ≈ 500KB total — acceptable).
- Re-running `pnpm og:capture` regenerates all PNGs idempotently.

### 10. Widget `onReset` additions

Three widgets have local state but don't pass `onReset` to `WidgetContainer`:
- `src/components/widgets/computation/NumbersEverywhere.tsx`
- `src/components/widgets/computation/FunctionMachine.tsx`
- `src/components/widgets/neurons/NetworkOverview.tsx`

For each: hoist initial state into a constant or `useReducer` initializer, wire a `handleReset` callback that resets all state to that initial value, and pass `onReset={handleReset}` to `<WidgetContainer>`.

**No layout changes** to these widgets — only adding the reset callback. So no manual QA needed for layout regressions; only verify the reset button now appears and works.

### 11. Verification

**Build/lint:** `pnpm lint && pnpm build` must pass.

**Playwright additions:**
- `tests/mobile-nav.spec.ts` — open drawer on a chapter page at iPhone-12 viewport, click a chapter link, assert navigation + drawer auto-close.
- `tests/og-images.spec.ts` — for one chapter, fetch `/og/{slug}.png` and assert it exists with non-zero byte length (this verifies the capture committed PNGs that ship with the site).

**Mobile screenshot QA (from user request):** For any widget I touch, run a Playwright snippet that loads the chapter at viewport `375×812` (iPhone 12) and screenshots the widget. Save to `test-results/mobile-qa/{widget-name}.png`. Surface this list to the user at end-of-task. (For this PR: only `NumbersEverywhere`, `FunctionMachine`, `NetworkOverview` qualify, since they're the only widgets I'm modifying — and only their reset button is the change. Still capture screenshots so the user can see them.)

**Manual QA list to surface to user:** widgets I changed code in, plus any layout area that was non-trivially modified (mobile drawer, ChapterNav stacking).

## Trade-offs and risks

**Per-chapter OG via dedicated route + Playwright:** Higher implementation cost than `ImageResponse` (which can't render canvas/D3 widgets reliably). Lower cost than per-chapter hand-designed PNGs. Risk: capture script needs the dev server running — documented in script header. Re-runs require regenerating any chapter the author edits.

**MobileChapterNav button positioning via `fixed` outside SiteHeader:** Slight visual coupling. Alternative is React Context, which adds complexity for one button. Accepted trade-off.

**No new test coverage for chapters 2–8:** Acknowledged risk. Existing build/lint/Playwright on chapter 1 + transformers + homepage covers the highest-traffic paths. Filling in the rest is a post-launch task.

**Voice rewrites deferred:** User-confirmed: "we" reads as the author and reader together, so the rule from memory doesn't apply to chapter prose. (Memory entry stands for other contexts; explicit user override here.)

## File inventory

**Create:**
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `src/app/og/site/page.tsx`
- `src/app/og/[slug]/page.tsx`
- `src/app/og/layout.tsx`
- `src/lib/chapter-metadata.ts`
- `src/lib/og-diagrams.tsx`
- `src/components/layout/ChapterList.tsx`
- `src/components/layout/MobileChapterNav.tsx`
- `scripts/capture-og-images.ts`
- `tests/mobile-nav.spec.ts`
- `tests/og-images.spec.ts`

**Modify:**
- `README.md` (full rewrite)
- `package.json` (add `@vercel/analytics`, `og:capture` script)
- `src/app/layout.tsx` (metadataBase, default OG/Twitter, Analytics)
- `src/app/(tutorial)/layout.tsx` (mount MobileChapterNav)
- `src/components/layout/SiteHeader.tsx` (GitHub link, remove Chapters link)
- `src/components/layout/SideNav.tsx` (delegate to ChapterList)
- `src/components/layout/ChapterNav.tsx` (responsive stacking)
- 10 chapter `page.tsx` files (use `chapterMetadata` helper)
- 3 widget files (add `onReset`): `NumbersEverywhere.tsx`, `FunctionMachine.tsx`, `NetworkOverview.tsx`

## Out-of-scope confirmation

- No changes to chapter MDX content.
- No changes to widget layouts, dimensions, or rendering.
- No new tests for chapters 2–8.
- No per-chapter content tests beyond the OG image existence check.
- No infrastructure (deploy config, CI) changes.
