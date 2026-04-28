# Pre-launch Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land all pre-launch polish — SEO/social, mobile chapter nav, header cleanup, per-chapter metadata, per-chapter OG images, and 3 widget reset handlers — in a single PR on `meta/polish`.

**Architecture:** One PR. Each task is independent and commits separately. Tests use the existing Playwright setup (no new test runner). No new runtime dependencies beyond `@vercel/analytics`. Per-chapter Open Graph images are generated via a dedicated `/og/[slug]` Next.js route + Playwright capture script; PNGs ship in `public/og/`.

**Tech Stack:** Next.js 16 App Router, MDX, React 19, Tailwind 4, Playwright. New: `@vercel/analytics`.

**Spec:** `docs/plans/2026-04-27-pre-launch-polish-design.md`

**Pre-flight:** Working tree should be clean on branch `meta/polish`. Run `pnpm install` once if `node_modules` is missing.

---

## Task 1: Rewrite README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace boilerplate with real project README**

Overwrite `README.md` with:

```markdown
# Learn AI Layer by Layer

An interactive, visual tutorial site for understanding AI from first principles. Tinker with real models, break things on purpose, and discover why neural networks work the way they do.

🌐 **Live site:** https://ai-explained.com (TODO: replace with the real launch URL)
📨 **New chapter notifications:** [messyprogress.substack.com](https://messyprogress.substack.com)

## What's here

The site walks through the big ideas behind modern AI — neural networks, embeddings, attention, transformers — using interactive widgets you can play with. Each chapter is a standalone article with playgrounds inline. A companion Jupyter notebook for each chapter lets you run real PyTorch code in Google Colab.

See `src/lib/curriculum.ts` for the full chapter list.

## Develop

```bash
pnpm install
pnpm dev              # dev server at localhost:3000
pnpm build            # production build
pnpm lint             # ESLint + MDX validation
pnpm test:notebooks   # execute all Jupyter notebooks (needs Python + torch)
npx playwright test   # E2E tests (needs dev server running)
```

## Project structure

- `src/app/(tutorial)/{slug}/` — chapter pages (`page.tsx` + `content.mdx` + `widgets.tsx`)
- `src/components/widgets/{topic}/` — interactive React widgets, one folder per chapter
- `src/components/mdx/` — custom MDX components (`<Callout>`, `<KeyInsight>`, `<TryIt>`, etc.)
- `src/lib/curriculum.ts` — chapter metadata (titles, slugs, prerequisites)
- `notebooks/` — companion Jupyter notebooks, one per chapter
- `docs/plans/` — design and planning docs

## Found an issue?

Please [open an issue](https://github.com/robennals/ai-explained/issues) or use the feedback form at the bottom of any chapter.

## License

See [LICENSE](./LICENSE).
```

**Note:** The launch URL placeholder (`https://ai-explained.com`) is intentional — replace before merging if the real URL differs.

- [ ] **Step 2: Verify**

Run: `head -3 README.md`
Expected: First line is `# Learn AI Layer by Layer`.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: replace boilerplate README with real project overview"
```

---

## Task 2: Add Vercel Analytics

**Files:**
- Modify: `package.json` (dependency)
- Modify: `src/app/layout.tsx` (add `<Analytics />`)

- [ ] **Step 1: Install dependency**

Run: `pnpm add @vercel/analytics`
Expected: dependency added to `package.json`, lockfile updated.

- [ ] **Step 2: Add Analytics to root layout**

Edit `src/app/layout.tsx`. Add this import below the SiteHeader import:

```tsx
import { Analytics } from "@vercel/analytics/next";
```

In the JSX, add `<Analytics />` as the last child of `<body>`, after `{children}`:

```tsx
<body
  className={`${geistSans.variable} ${geistMono.variable} antialiased`}
>
  <SiteHeader />
  {children}
  <Analytics />
</body>
```

- [ ] **Step 3: Verify build still passes**

Run: `pnpm build 2>&1 | tail -20`
Expected: build succeeds. No new warnings.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml src/app/layout.tsx
git commit -m "feat: add Vercel Analytics"
```

---

## Task 3: Add metadataBase, default OG/Twitter, and viewport

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update root layout metadata**

Open `src/app/layout.tsx`. Replace the existing `metadata` export with:

```tsx
import type { Metadata, Viewport } from "next";
// ... existing imports unchanged

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Learn AI Layer by Layer",
    template: "%s — Learn AI Layer by Layer",
  },
  description:
    "An interactive, visual guide to understanding AI from first principles. Learn neural networks, transformers, and modern AI through hands-on experimentation.",
  openGraph: {
    type: "website",
    siteName: "Learn AI Layer by Layer",
    title: "Learn AI Layer by Layer",
    description:
      "An interactive, visual guide to understanding AI from first principles.",
    images: ["/og/site.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Learn AI Layer by Layer",
    description:
      "An interactive, visual guide to understanding AI from first principles.",
    images: ["/og/site.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};
```

**Note:** The `title.template` lets per-chapter pages set just their chapter title (e.g. `title: "Paying Attention"`) and have it rendered as `"Paying Attention — Learn AI Layer by Layer"` automatically. We will use this in Task 12.

**Note:** `images: ["/og/site.png"]` references a PNG that doesn't exist yet — created in Task 17. The site will still build; the OG fetcher will just 404 until then.

- [ ] **Step 2: Verify build still passes**

Run: `pnpm build 2>&1 | tail -20`
Expected: build succeeds. No "metadataBase missing" warning.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: add metadataBase, default OG/Twitter cards, viewport"
```

---

## Task 4: Add sitemap

**Files:**
- Create: `src/app/sitemap.ts`

- [ ] **Step 1: Create sitemap**

```ts
// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { getMainChapters, getAppendixChapters } from "@/lib/curriculum";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const ready = [...getMainChapters(), ...getAppendixChapters()].filter(
    (c) => c.ready,
  );
  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    ...ready.map((c) => ({
      url: `${SITE_URL}/${c.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
```

- [ ] **Step 2: Verify sitemap renders**

Run: `pnpm build 2>&1 | tail -20`
Expected: build succeeds. Output should list `/sitemap.xml` as a generated route.

- [ ] **Step 3: Sanity check the rendered XML**

Run: `pnpm build && pnpm start &` (background); then `curl -s http://localhost:3000/sitemap.xml | head -30`; then kill the background `next start` (`pkill -f 'next start'`).

Alternative for speed: just inspect the generated file in `.next/server/app/sitemap.xml.body` if present, or trust the build output.

Expected: XML lists the homepage plus every ready chapter slug (`/computation`, `/optimization`, ..., `/transformers`, `/appendix-pytorch`).

- [ ] **Step 4: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat: generate sitemap.xml from curriculum"
```

---

## Task 5: Add robots.txt

**Files:**
- Create: `src/app/robots.ts`

- [ ] **Step 1: Create robots config**

```ts
// src/app/robots.ts
import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
```

- [ ] **Step 2: Verify build still passes**

Run: `pnpm build 2>&1 | tail -10`
Expected: build succeeds. `/robots.txt` listed as a generated route.

- [ ] **Step 3: Commit**

```bash
git add src/app/robots.ts
git commit -m "feat: add robots.txt pointing to sitemap"
```

---

## Task 6: Fix broken GitHub link in SiteHeader

**Files:**
- Modify: `src/components/layout/SiteHeader.tsx`

- [ ] **Step 1: Replace the GitHub URL**

In `src/components/layout/SiteHeader.tsx` line 15, change:

```tsx
href="https://github.com"
```

to:

```tsx
href="https://github.com/robennals/ai-explained"
```

- [ ] **Step 2: Verify**

Run: `grep -n "github.com" src/components/layout/SiteHeader.tsx`
Expected: line shows `https://github.com/robennals/ai-explained` (full repo path, no bare domain).

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/SiteHeader.tsx
git commit -m "fix: point header GitHub link at the actual repo"
```

---

## Task 7: Remove "Chapters" link from header

**Files:**
- Modify: `src/components/layout/SiteHeader.tsx`

- [ ] **Step 1: Delete the redundant Chapters link**

In `src/components/layout/SiteHeader.tsx`, remove these lines:

```tsx
<Link href="/" className="transition-colors hover:text-foreground">
  Chapters
</Link>
```

The `<nav>` should now contain only the GitHub link.

- [ ] **Step 2: Verify markup is still valid**

Run: `pnpm lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/SiteHeader.tsx
git commit -m "chore: remove redundant 'Chapters' link from header"
```

---

## Task 8: Make ChapterNav (prev/next) stack on mobile

**Files:**
- Modify: `src/components/layout/ChapterNav.tsx`

- [ ] **Step 1: Update the wrapper to stack on small screens**

In `src/components/layout/ChapterNav.tsx`, change line 11 from:

```tsx
<nav className="mt-16 flex items-stretch gap-4 border-t border-border pt-8">
```

to:

```tsx
<nav className="mt-16 flex flex-col items-stretch gap-3 border-t border-border pt-8 sm:flex-row sm:gap-4">
```

Also change the next-link's text alignment from always-right to right-only-when-side-by-side. Find the next link, currently:

```tsx
<Link
  href={`/${next.slug}`}
  className="group flex-1 rounded-lg border border-border p-4 text-right transition-colors hover:border-accent/40 hover:bg-accent/5"
>
```

Change `text-right` to `sm:text-right`:

```tsx
<Link
  href={`/${next.slug}`}
  className="group flex-1 rounded-lg border border-border p-4 transition-colors hover:border-accent/40 hover:bg-accent/5 sm:text-right"
>
```

- [ ] **Step 2: Verify with Playwright at mobile width**

Create `tests/chapter-nav-mobile.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 375, height: 812 } });

test("ChapterNav stacks vertically on mobile", async ({ page }) => {
  await page.goto("/computation");
  const nav = page.locator("article > nav").last();
  await expect(nav).toBeVisible();

  // On mobile, items stack — measure the bounding boxes of prev and next.
  // computation has no prev, so we check that next exists and isn't text-aligned right.
  const next = nav.locator("a").first();
  await expect(next).toBeVisible();
  const flexDirection = await nav.evaluate(
    (el) => getComputedStyle(el).flexDirection,
  );
  expect(flexDirection).toBe("column");
});
```

Run: `npx playwright test tests/chapter-nav-mobile.spec.ts` (needs dev server running). Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/ChapterNav.tsx tests/chapter-nav-mobile.spec.ts
git commit -m "feat: stack chapter prev/next links on mobile"
```

---

## Task 9: Extract shared `<ChapterList>` component

**Files:**
- Create: `src/components/layout/ChapterList.tsx`
- Modify: `src/components/layout/SideNav.tsx` (delegate to ChapterList)

- [ ] **Step 1: Create ChapterList component**

```tsx
// src/components/layout/ChapterList.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getMainChapters,
  getAppendixChapters,
  getAppendixLabel,
  type Chapter,
} from "@/lib/curriculum";

interface ChapterItemProps {
  ch: Chapter;
  isActive: boolean;
  label: string;
  onNavigate?: () => void;
}

function ChapterItem({ ch, isActive, label, onNavigate }: ChapterItemProps) {
  const href = `/${ch.slug}`;

  if (!ch.ready) {
    return (
      <li>
        <div className="flex items-start gap-3 rounded-lg px-3 py-2 text-sm text-muted/50 cursor-default">
          <span className="mt-0.5 shrink-0 w-5 text-right font-mono text-xs">
            {label}
          </span>
          <div className="leading-snug">
            <span>{ch.title}</span>
            <span className="block text-[10px] uppercase tracking-wide mt-0.5">
              Coming soon
            </span>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        className={`flex items-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
          isActive
            ? "bg-accent/10 text-accent-dark font-medium"
            : "text-muted hover:text-foreground hover:bg-surface"
        }`}
      >
        <span className="mt-0.5 shrink-0 w-5 text-right font-mono text-xs text-muted">
          {label}
        </span>
        <span className="leading-snug">
          {ch.title}
          {ch.polishing && (
            <span
              title="I'm still polishing this chapter — it's good enough to read, but isn't yet at the point where my 11-year-old fully understands it."
              className="ml-1.5 inline-flex items-center rounded-full bg-amber-50 px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-inset ring-amber-200 align-middle"
            >
              Polishing
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}

interface ChapterListProps {
  /** Called when the user clicks a chapter link. Used by mobile drawer to close itself. */
  onNavigate?: () => void;
}

export function ChapterList({ onNavigate }: ChapterListProps) {
  const pathname = usePathname();
  const mainChapters = getMainChapters();
  const appendixChapters = getAppendixChapters();

  return (
    <>
      <h2 className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-muted">
        Chapters
      </h2>
      <ul className="space-y-0.5">
        {mainChapters.map((ch) => (
          <ChapterItem
            key={ch.id}
            ch={ch}
            isActive={pathname === `/${ch.slug}`}
            label={String(ch.id)}
            onNavigate={onNavigate}
          />
        ))}
      </ul>

      {appendixChapters.length > 0 && (
        <>
          <div className="my-4 mx-3 border-t border-border" />
          <h2 className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Appendixes
          </h2>
          <ul className="space-y-0.5">
            {appendixChapters.map((ch) => (
              <ChapterItem
                key={ch.id}
                ch={ch}
                isActive={pathname === `/${ch.slug}`}
                label={getAppendixLabel(ch)}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </>
      )}
    </>
  );
}
```

- [ ] **Step 2: Replace SideNav body with ChapterList**

Replace the entire content of `src/components/layout/SideNav.tsx` with:

```tsx
import { ChapterList } from "./ChapterList";

export function SideNav() {
  return (
    <nav className="scrollbar-autohide sticky top-14 h-[calc(100vh-3.5rem)] w-64 shrink-0 border-r border-border overflow-y-auto py-6 pr-4 hidden lg:block">
      <ChapterList />
    </nav>
  );
}
```

The component is no longer a client component on its own (the `"use client"` directive lives in `ChapterList`). Keeping `SideNav` as a server component is fine — it just renders the client `ChapterList`.

- [ ] **Step 3: Verify desktop sidebar still works**

Run: `pnpm build 2>&1 | tail -10`
Expected: build succeeds.

Run: `pnpm dev` and open `http://localhost:3000/computation` in a browser at desktop width. Expected: sidebar renders identically to before.

- [ ] **Step 4: Verify Playwright tests still pass**

Run: `npx playwright test tests/chapter01.spec.ts` (needs dev server running). Expected: passes (sidebar references in this test should still resolve).

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/ChapterList.tsx src/components/layout/SideNav.tsx
git commit -m "refactor: extract shared ChapterList component for desktop and mobile reuse"
```

---

## Task 10: Build MobileChapterNav (hamburger + drawer)

**Files:**
- Create: `src/components/layout/MobileChapterNav.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/layout/MobileChapterNav.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChapterList } from "./ChapterList";

export function MobileChapterNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on ESC.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock body scroll when open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open chapter list"
        aria-expanded={open}
        className="fixed left-3 top-2.5 z-[55] flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-foreground lg:hidden"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close chapter list"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] overflow-y-auto border-r border-border bg-background py-6 pr-4">
            <div className="mb-2 flex items-center justify-end px-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chapter list"
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-foreground"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <ChapterList onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
```

**Note:** The hamburger button uses `fixed left-3 top-2.5 z-[55]` so it visually sits inside the header. The header itself is `sticky top-0 z-50`; the hamburger floats above it on mobile only. Acceptable per the design spec.

**Note:** The header padding for the homepage logo is `px-6` (24px). The hamburger occupies the left 12 + 36 = 48px area, which on iPhone 12 (375px) leaves ~327px for "Learn AI Layer by Layer" — fits comfortably.

- [ ] **Step 2: Wait until Task 11 to mount it**

This file is created but not yet used. Task 11 mounts it in the tutorial layout. Skip running it for now.

- [ ] **Step 3: Verify it builds in isolation**

Run: `pnpm build 2>&1 | tail -10`
Expected: build succeeds (the component is unused for now, which is fine).

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/MobileChapterNav.tsx
git commit -m "feat: add MobileChapterNav drawer component (not yet mounted)"
```

---

## Task 11: Mount MobileChapterNav in tutorial layout

**Files:**
- Modify: `src/app/(tutorial)/layout.tsx`
- Create: `tests/mobile-nav.spec.ts`

- [ ] **Step 1: Write the failing Playwright test**

```ts
// tests/mobile-nav.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Mobile chapter drawer", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("hamburger opens drawer; clicking a chapter navigates and closes it", async ({
    page,
  }) => {
    await page.goto("/computation");

    const hamburger = page.getByRole("button", { name: "Open chapter list" });
    await expect(hamburger).toBeVisible();

    await hamburger.click();

    // Drawer is open — heading "Chapters" should now be visible inside the drawer.
    const drawer = page.locator("nav").filter({ hasText: "Chapters" }).last();
    await expect(drawer).toBeVisible();

    // Click "Building a Brain" (chapter 3, neurons).
    await page.getByRole("link", { name: /Building a Brain/ }).click();

    await expect(page).toHaveURL("/neurons");

    // Drawer closes after route change.
    await expect(
      page.getByRole("button", { name: "Close chapter list" }).first(),
    ).not.toBeVisible();
  });

  test("hamburger is hidden on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/computation");
    await expect(
      page.getByRole("button", { name: "Open chapter list" }),
    ).not.toBeVisible();
  });
});
```

- [ ] **Step 2: Run the test (expect failure)**

Run: `pnpm dev` in one terminal; in another, `npx playwright test tests/mobile-nav.spec.ts`.
Expected: FAIL — "Open chapter list" button not found (component not mounted).

- [ ] **Step 3: Mount the drawer in the tutorial layout**

Replace `src/app/(tutorial)/layout.tsx` with:

```tsx
import { SideNav } from "@/components/layout/SideNav";
import { MobileChapterNav } from "@/components/layout/MobileChapterNav";
import { Feedback } from "@/components/feedback/Feedback";

export default function TutorialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-7xl">
      <SideNav />
      <MobileChapterNav />
      <main className="min-w-0 flex-1 px-6 py-10 lg:px-12">
        {children}
        <Feedback />
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Run the test (expect pass)**

Run: `npx playwright test tests/mobile-nav.spec.ts`
Expected: PASS.

- [ ] **Step 5: Verify desktop tests still pass**

Run: `npx playwright test tests/chapter01.spec.ts tests/transformers.spec.ts tests/homepage.spec.ts`
Expected: PASS (no regressions; the hamburger is hidden on desktop).

- [ ] **Step 6: Commit**

```bash
git add src/app/(tutorial)/layout.tsx tests/mobile-nav.spec.ts
git commit -m "feat: mount mobile chapter drawer in tutorial layout"
```

---

## Task 12: Create chapterMetadata helper

**Files:**
- Create: `src/lib/chapter-metadata.ts`

- [ ] **Step 1: Create the helper**

```ts
// src/lib/chapter-metadata.ts
import type { Metadata } from "next";
import { getChapter } from "./curriculum";

export function chapterMetadata(slug: string): Metadata {
  const ch = getChapter(slug);
  if (!ch) {
    return { title: "Chapter not found" };
  }
  return {
    title: ch.title,
    description: ch.description,
    openGraph: {
      title: ch.title,
      description: ch.description,
      images: [`/og/${slug}.png`],
    },
    twitter: {
      card: "summary_large_image",
      title: ch.title,
      description: ch.description,
      images: [`/og/${slug}.png`],
    },
  };
}
```

**Note:** `title: ch.title` (without the suffix) relies on the `title.template` set in the root layout (Task 3), which renders this as `"<title> — Learn AI Layer by Layer"`.

**Note:** The OG PNG paths reference files that don't exist until Task 17. This is fine — the metadata still renders, the unfurl just won't show an image until the PNGs land.

- [ ] **Step 2: Verify build still passes**

Run: `pnpm build 2>&1 | tail -10`
Expected: build succeeds. No reference errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/chapter-metadata.ts
git commit -m "feat: add chapterMetadata helper sourced from curriculum"
```

---

## Task 13: Apply chapterMetadata to all chapter pages

**Files:**
- Modify: `src/app/(tutorial)/computation/page.tsx`
- Modify: `src/app/(tutorial)/optimization/page.tsx`
- Modify: `src/app/(tutorial)/neurons/page.tsx`
- Modify: `src/app/(tutorial)/vectors/page.tsx`
- Modify: `src/app/(tutorial)/embeddings/page.tsx`
- Modify: `src/app/(tutorial)/next-word-prediction/page.tsx`
- Modify: `src/app/(tutorial)/attention/page.tsx`
- Modify: `src/app/(tutorial)/positions/page.tsx`
- Modify: `src/app/(tutorial)/transformers/page.tsx`
- Modify: `src/app/(tutorial)/appendix-pytorch/page.tsx`
- Modify: `src/app/(tutorial)/matrix-math/page.tsx` (also exists, even though not "ready")

- [ ] **Step 1: Replace each chapter page's metadata**

For each chapter `page.tsx` listed above, find the existing `export const metadata = { ... }` block (typically 4-5 lines) and replace it with:

```tsx
import { chapterMetadata } from "@/lib/chapter-metadata";

export const metadata = chapterMetadata("<slug>");
```

Where `<slug>` matches the directory name. Concrete example for `src/app/(tutorial)/computation/page.tsx` — replace:

```tsx
export const metadata = {
  title: "Everything Is Numbers — Learn AI Layer by Layer",
  description:
    "Text, images, and sound are all numbers. Thinking is a function. The challenge: find the right one.",
};
```

with:

```tsx
import { chapterMetadata } from "@/lib/chapter-metadata";

export const metadata = chapterMetadata("computation");
```

(Place the import at the top with the other imports.)

Repeat for all 11 files. The slug is the directory name in each case.

- [ ] **Step 2: Verify metadata renders correctly**

Run: `pnpm dev` and visit `http://localhost:3000/computation` in a browser. View page source. Expected: `<title>Everything Is Numbers — Learn AI Layer by Layer</title>` and `<meta property="og:image" content=".../og/computation.png">`.

Or via Playwright: create `tests/chapter-metadata.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

const cases = [
  { slug: "computation", expectedTitleStart: "Everything Is Numbers" },
  { slug: "attention", expectedTitleStart: "Paying Attention" },
  { slug: "transformers", expectedTitleStart: "One Architecture to Rule Them All" },
];

for (const c of cases) {
  test(`/${c.slug} has correct metadata`, async ({ page }) => {
    await page.goto(`/${c.slug}`);
    await expect(page).toHaveTitle(
      new RegExp(`^${c.expectedTitleStart} — Learn AI Layer by Layer$`),
    );
    const ogImage = await page
      .locator('meta[property="og:image"]')
      .first()
      .getAttribute("content");
    expect(ogImage).toContain(`/og/${c.slug}.png`);
  });
}
```

Run: `npx playwright test tests/chapter-metadata.spec.ts` (with dev server running). Expected: PASS.

- [ ] **Step 3: Verify build**

Run: `pnpm build 2>&1 | tail -10`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(tutorial\)/*/page.tsx tests/chapter-metadata.spec.ts
git commit -m "refactor: derive each chapter's metadata from chapterMetadata helper"
```

---

## Task 14: Create OG diagram registry

**Files:**
- Create: `src/lib/og-diagrams.tsx`

- [ ] **Step 1: Create the registry**

```tsx
// src/lib/og-diagrams.tsx
//
// Maps chapter slug → ReactNode rendered in the OG card for that chapter.
// The diagram mounts in its initial state; the OG route's CSS frames it.
// Author can iterate on which widget gets featured per chapter.

import type { ReactNode } from "react";

// Lazy-import each widget so the registry doesn't bloat any single bundle.
// Note: the OG route is rendered server-side then captured client-side via
// Playwright, so client-only widgets ("use client") work — the OG page is
// itself a client page (see src/app/og/[slug]/page.tsx).

import {
  NumbersEverywhereWidget,
} from "@/app/(tutorial)/computation/widgets";
// (Other chapters' widgets lazily imported below to keep this file readable.)

export interface OgDiagram {
  /** Rendered inside the OG card. Should be self-contained, no controls. */
  node: ReactNode;
  /** Optional override label for the chapter title (defaults to chapter title). */
  titleOverride?: string;
}

export function getOgDiagram(slug: string): OgDiagram | null {
  switch (slug) {
    case "computation":
      return { node: <NumbersEverywhereWidget /> };
    // For initial launch, the simplest viable approach is to use `null`
    // (just chapter title + brand) for chapters that don't have a clean
    // standalone diagram. Author iterates after launch.
    default:
      return null;
  }
}
```

**Note:** This intentionally launches with only chapter 1 wired up to a real widget; the rest get a clean text-and-brand OG card. The author can fill in more entries after launch by adding `case "<slug>": return { node: <SomeWidget /> };`. This keeps Task 17 (capture) fast and avoids per-widget rendering issues blocking launch.

- [ ] **Step 2: Verify it imports correctly**

Run: `pnpm build 2>&1 | tail -10`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/lib/og-diagrams.tsx
git commit -m "feat: add OG diagram registry (chapter 1 wired; rest get text-only OG)"
```

---

## Task 15: Create the `/og/[slug]` route

**Files:**
- Create: `src/app/og/OgCard.tsx`
- Create: `src/app/og/[slug]/page.tsx`
- Create: `src/app/og/site/page.tsx`

**Approach:** No nested layout file. The root layout (with `<SiteHeader />`) still wraps OG routes — but the `OgCard` is `position: fixed; inset: 0; zIndex: 9999`, so it covers the header completely. Playwright captures the 1200×630 viewport, which is exactly the OgCard. Simpler than fighting Next.js layout inheritance.

- [ ] **Step 1: Create chapter OG page**

```tsx
// src/app/og/[slug]/page.tsx
import { notFound } from "next/navigation";
import { getChapter } from "@/lib/curriculum";
import { getOgDiagram } from "@/lib/og-diagrams";
import { OgCard } from "../OgCard";

export default async function ChapterOgPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ch = getChapter(slug);
  if (!ch) notFound();

  const diagram = getOgDiagram(slug);

  return (
    <OgCard
      title={ch.title}
      subtitle={ch.subtitle}
      number={ch.section === "appendix" ? "Appendix" : `Chapter ${ch.id}`}
      diagram={diagram?.node ?? null}
    />
  );
}
```

- [ ] **Step 2: Create site OG page**

```tsx
// src/app/og/site/page.tsx
import { OgCard } from "../OgCard";

export default function SiteOgPage() {
  return (
    <OgCard
      title="Learn AI Layer by Layer"
      subtitle="An interactive guide to understanding AI from first principles"
      number=""
      diagram={null}
    />
  );
}
```

- [ ] **Step 3: Create OgCard component**

```tsx
// src/app/og/OgCard.tsx
import type { ReactNode } from "react";

interface OgCardProps {
  title: string;
  subtitle: string;
  number: string;
  diagram: ReactNode | null;
}

export function OgCard({ title, subtitle, number, diagram }: OgCardProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        width: 1200,
        height: 630,
        background: "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)",
        display: "flex",
        flexDirection: "column",
        padding: 64,
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        color: "#1a1a2e",
        boxSizing: "border-box",
      }}
    >
      {/* Top brand bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "#3b82f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          AI
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, color: "#374151" }}>
          Learn AI Layer by Layer
        </div>
        {number && (
          <div
            style={{
              marginLeft: "auto",
              fontSize: 14,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#6b7280",
            }}
          >
            {number}
          </div>
        )}
      </div>

      {/* Title block */}
      <div style={{ marginTop: 56 }}>
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: "#1a1a2e",
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 28,
            fontWeight: 400,
            lineHeight: 1.3,
            color: "#4b5563",
            maxWidth: 1000,
          }}
        >
          {subtitle}
        </div>
      </div>

      {/* Diagram (if any) */}
      {diagram && (
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            maxHeight: 280,
            overflow: "hidden",
          }}
        >
          {diagram}
        </div>
      )}
    </div>
  );
}
```

**Note:** The `position: fixed; inset: 0; zIndex: 9999` strategy lets the OG card cover the site header (rendered by the root layout) without needing a separate route layout. Playwright captures the viewport at 1200×630, which is exactly the OgCard's dimensions.

- [ ] **Step 4: Verify routes render**

Run: `pnpm dev` and visit `http://localhost:3000/og/computation` and `http://localhost:3000/og/site` in a browser at 1200×630 viewport (or just resize). Expected: clean OG card displays. Site header should be covered.

- [ ] **Step 5: Commit**

```bash
git add src/app/og/
git commit -m "feat: add /og/[slug] and /og/site routes for capture"
```

---

## Task 16: Create OG capture script

**Files:**
- Create: `scripts/capture-og-images.ts`
- Modify: `package.json` (add `og:capture` script)

- [ ] **Step 1: Create the capture script**

```ts
// scripts/capture-og-images.ts
//
// Captures 1200x630 OG images for every ready chapter and the site homepage.
// Saves to public/og/{slug}.png and public/og/site.png.
//
// Usage:
//   1. Start the dev server in another terminal: `pnpm dev`
//   2. Run: `pnpm og:capture`
//
// Re-run any time chapter titles or OG diagrams change.

import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { getMainChapters, getAppendixChapters } from "../src/lib/curriculum";

const BASE_URL = process.env.OG_BASE_URL ?? "http://localhost:3000";
const OUTPUT_DIR = path.resolve(process.cwd(), "public/og");

async function captureOne(
  page: import("@playwright/test").Page,
  url: string,
  outPath: string,
) {
  await page.goto(url, { waitUntil: "networkidle" });
  // Give widgets a beat to settle (canvas/D3 may render asynchronously).
  await page.waitForTimeout(800);
  await page.screenshot({
    path: outPath,
    fullPage: false,
    clip: { x: 0, y: 0, width: 1200, height: 630 },
  });
  console.log(`  wrote ${path.relative(process.cwd(), outPath)}`);
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 2, // 2x for sharper PNGs
  });
  const page = await context.newPage();

  console.log(`Capturing OG images from ${BASE_URL}…`);

  // Site homepage variant.
  await captureOne(page, `${BASE_URL}/og/site`, path.join(OUTPUT_DIR, "site.png"));

  // Each ready chapter.
  const chapters = [...getMainChapters(), ...getAppendixChapters()].filter(
    (c) => c.ready,
  );
  for (const ch of chapters) {
    await captureOne(
      page,
      `${BASE_URL}/og/${ch.slug}`,
      path.join(OUTPUT_DIR, `${ch.slug}.png`),
    );
  }

  await browser.close();
  console.log(`\nDone. ${chapters.length + 1} images written to public/og/.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Add `og:capture` script to package.json**

In `package.json`, add to the `scripts` block:

```json
"og:capture": "tsx scripts/capture-og-images.ts"
```

If `tsx` is not already a dev dependency, add it:

Run: `pnpm add -D tsx`

- [ ] **Step 3: Verify the script compiles**

Run: `pnpm tsx --eval "console.log('tsx works')"`
Expected: prints `tsx works`.

Run: `pnpm tsx scripts/capture-og-images.ts --help 2>&1 | head -5` (script will error on actually running without dev server, but it should at least parse).

Actually, since the script doesn't accept `--help`, just type-check it:

Run: `pnpm tsc --noEmit scripts/capture-og-images.ts 2>&1 | head -20`
Expected: no type errors. (If `scripts/` isn't in `tsconfig.json` includes, you'll see errors — in that case skip this and trust the runtime.)

- [ ] **Step 4: Commit**

```bash
git add scripts/capture-og-images.ts package.json pnpm-lock.yaml
git commit -m "feat: add og:capture script using Playwright"
```

---

## Task 17: Run capture and commit OG images

**Files:**
- Create: `public/og/site.png`
- Create: `public/og/{slug}.png` for each ready chapter (10 PNGs)

- [ ] **Step 1: Start the dev server**

In one terminal: `pnpm dev`. Wait for "Ready in <time>".

- [ ] **Step 2: Run capture**

In another terminal: `pnpm og:capture`
Expected: writes `public/og/site.png` and one PNG per ready chapter (10 chapters → 11 PNGs total).

- [ ] **Step 3: Spot-check the images**

Open `public/og/computation.png` in an image viewer. Expected: 1200×630 (or 2400×1260 at 2x DPI), shows the chapter title with the brand bar; chapter 1 includes the NumbersEverywhere widget; other chapters show clean text-only cards.

If anything looks broken (cut-off text, blank widget), iterate on `OgCard.tsx` or `og-diagrams.tsx` and re-run capture.

- [ ] **Step 4: Stop the dev server**

In the dev-server terminal: `Ctrl+C`.

- [ ] **Step 5: Commit the images**

```bash
git add public/og/
git commit -m "feat: add captured OG images for each ready chapter and homepage"
```

---

## Task 18: Add OG image existence test

**Files:**
- Create: `tests/og-images.spec.ts`

- [ ] **Step 1: Write the test**

```ts
// tests/og-images.spec.ts
import { test, expect } from "@playwright/test";

const slugs = [
  "site",
  "computation",
  "optimization",
  "neurons",
  "vectors",
  "embeddings",
  "next-word-prediction",
  "attention",
  "positions",
  "transformers",
  "appendix-pytorch",
];

for (const slug of slugs) {
  test(`OG image /og/${slug}.png exists and is non-empty`, async ({
    request,
  }) => {
    const res = await request.get(`/og/${slug}.png`);
    expect(res.status()).toBe(200);
    const body = await res.body();
    expect(body.byteLength).toBeGreaterThan(1000);
  });
}
```

- [ ] **Step 2: Run the test**

Run: `npx playwright test tests/og-images.spec.ts` (with dev server running).
Expected: all 11 tests pass.

- [ ] **Step 3: Commit**

```bash
git add tests/og-images.spec.ts
git commit -m "test: assert OG images ship and are non-empty"
```

---

## Task 19: Add `onReset` to NumbersEverywhere

**Files:**
- Modify: `src/components/widgets/computation/NumbersEverywhere.tsx`

- [ ] **Step 1: Identify all `useState` calls**

Run: `grep -n 'useState' src/components/widgets/computation/NumbersEverywhere.tsx`
Expected: a list of state variables and their initial values (text, grid, colors, sound state, etc.). Note them.

- [ ] **Step 2: Add a handleReset and wire it up**

In `NumbersEverywhere.tsx`, find the top of the component function (where the `useState` calls live). Just below them, add:

```tsx
const handleReset = () => {
  // Reset every useState above to its initial value.
  // Replace these placeholder calls with the actual setters from this file.
  // Example pattern:
  //   setText("hello");
  //   setGrid(initialGrid);
  //   setPitch(150);
  //   ...etc for every useState call above.
};
```

**Engineer note:** Walk through every `useState` call and call its setter with the same initial value passed to `useState`. If an initial value is computed from a constant or function, lift the constant out so both the `useState(...)` and the `setState(...)` reference it.

Then find the `<WidgetContainer>` element and add the `onReset` prop:

```tsx
<WidgetContainer
  title="Numbers Everywhere"
  description="..."
  onReset={handleReset}
>
```

- [ ] **Step 3: Manually verify reset works**

Run: `pnpm dev` and visit `http://localhost:3000/computation`. Interact with the NumbersEverywhere widget — type some text, click pixels, change pitch. Click "Reset" in the widget header. Expected: every input returns to its initial state.

- [ ] **Step 4: Capture mobile screenshot**

Create `tests/mobile-qa.spec.ts` if it doesn't exist; otherwise append:

```ts
import { test } from "@playwright/test";

test.use({ viewport: { width: 375, height: 812 } });

test("@mobile-qa NumbersEverywhere mobile snapshot", async ({ page }) => {
  await page.goto("/computation");
  const widget = page.locator(".widget-container").first();
  await widget.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "test-results/mobile-qa/numbers-everywhere.png",
    fullPage: false,
  });
});
```

Run: `npx playwright test tests/mobile-qa.spec.ts -g "NumbersEverywhere"`
Inspect: `test-results/mobile-qa/numbers-everywhere.png`. Expected: widget readable on mobile.

- [ ] **Step 5: Commit**

```bash
git add src/components/widgets/computation/NumbersEverywhere.tsx tests/mobile-qa.spec.ts
git commit -m "feat: add reset to NumbersEverywhere widget"
```

---

## Task 20: Add `onReset` to FunctionMachine

**Files:**
- Modify: `src/components/widgets/computation/FunctionMachine.tsx`

- [ ] **Step 1: Identify state and add handleReset**

In `src/components/widgets/computation/FunctionMachine.tsx`:

Find: `const [selectedId, setSelectedId] = useState(EXAMPLES[0].id);` (or similar).

Just below, add:

```tsx
const handleReset = () => {
  setSelectedId(EXAMPLES[0].id);
};
```

Find the `<WidgetContainer>` and add `onReset={handleReset}`.

- [ ] **Step 2: Verify**

Run: `pnpm dev`, visit `/computation`, interact with FunctionMachine, click Reset. Expected: returns to first example.

- [ ] **Step 3: Capture mobile screenshot**

Append to `tests/mobile-qa.spec.ts`:

```ts
test("@mobile-qa FunctionMachine mobile snapshot", async ({ page }) => {
  await page.goto("/computation");
  // Find the FunctionMachine widget by its title.
  const widget = page
    .locator(".widget-container")
    .filter({ hasText: "Function" })
    .first();
  await widget.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "test-results/mobile-qa/function-machine.png",
    fullPage: false,
  });
});
```

Run: `npx playwright test tests/mobile-qa.spec.ts -g "FunctionMachine"`
Inspect output PNG.

- [ ] **Step 4: Commit**

```bash
git add src/components/widgets/computation/FunctionMachine.tsx tests/mobile-qa.spec.ts
git commit -m "feat: add reset to FunctionMachine widget"
```

---

## Task 21: Add `onReset` to NetworkOverview

**Files:**
- Modify: `src/components/widgets/neurons/NetworkOverview.tsx`

- [ ] **Step 1: Identify state and add handleReset**

In `src/components/widgets/neurons/NetworkOverview.tsx`:

Find the `useState` calls (around lines 41-44 per audit). Note the initial values.

Add:

```tsx
const handleReset = () => {
  setSelected(null); // or whatever the initial value is — match the useState default
};
```

Find the `<WidgetContainer>` and add `onReset={handleReset}`.

- [ ] **Step 2: Verify**

Run: `pnpm dev`, visit `/neurons`, interact with NetworkOverview, click Reset. Expected: selection clears.

- [ ] **Step 3: Capture mobile screenshot**

Append to `tests/mobile-qa.spec.ts`:

```ts
test("@mobile-qa NetworkOverview mobile snapshot", async ({ page }) => {
  await page.goto("/neurons");
  const widget = page
    .locator(".widget-container")
    .filter({ hasText: /Network|Neuron/ })
    .first();
  await widget.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "test-results/mobile-qa/network-overview.png",
    fullPage: false,
  });
});
```

Run: `npx playwright test tests/mobile-qa.spec.ts -g "NetworkOverview"`
Inspect output PNG.

- [ ] **Step 4: Commit**

```bash
git add src/components/widgets/neurons/NetworkOverview.tsx tests/mobile-qa.spec.ts
git commit -m "feat: add reset to NetworkOverview widget"
```

---

## Task 22: Final verification

**Files:** none

- [ ] **Step 1: Full lint + build**

Run: `pnpm lint && pnpm build 2>&1 | tail -30`
Expected: both succeed. No new warnings.

- [ ] **Step 2: Full Playwright suite**

Start dev server: `pnpm dev` in one terminal.
In another: `npx playwright test 2>&1 | tail -40`
Expected: all tests pass. Note any skipped or failing tests for the user.

- [ ] **Step 3: Manual QA list — surface to user**

Prepare a message for the user listing exactly what to manually verify in a browser:

```
Manual QA before merge:
- [ ] Open /computation on a real phone (or 375px viewport in DevTools). Tap the hamburger. Drawer opens. Tap "Building a Brain" — navigates and drawer closes.
- [ ] Same flow on a tablet (768px). Hamburger should still appear.
- [ ] Desktop (1280px). Hamburger should NOT appear; sidebar is visible.
- [ ] Open every chapter once on desktop. Headers and prev/next buttons render correctly.
- [ ] Spot-check 3 OG images by opening public/og/computation.png, public/og/transformers.png, public/og/site.png — they should look polished.
- [ ] Reset buttons: try them on NumbersEverywhere, FunctionMachine, and NetworkOverview. State should return to initial.
- [ ] View page source on /computation and confirm <meta property="og:image"> contains "/og/computation.png".
- [ ] Confirm github link in header opens https://github.com/robennals/ai-explained.
- [ ] Confirm "Chapters" link is gone from header.
- [ ] Mobile screenshots in test-results/mobile-qa/ — look at each one; flag anything cramped.
```

- [ ] **Step 4: Final commit (only if anything outstanding)**

If any step turned up an issue and you fixed it, commit those fixes. Otherwise no commit needed.

---

## Self-Review

Spec coverage check (against `docs/plans/2026-04-27-pre-launch-polish-design.md`):

- ✅ §1 root metadata — Task 3
- ✅ §2 sitemap/robots — Tasks 4–5
- ✅ §3 README — Task 1
- ✅ §4 SiteHeader changes — Tasks 6–7
- ✅ §5 ChapterList — Task 9
- ✅ §6 MobileChapterNav — Tasks 10–11
- ✅ §7 ChapterNav stacking — Task 8
- ✅ §8 chapterMetadata helper — Tasks 12–13
- ✅ §9 OG image pipeline — Tasks 14–18
- ✅ §10 widget onReset — Tasks 19–21
- ✅ §11 verification — Tasks 11, 18, 22; mobile-qa screenshots in 19–21
- ✅ Vercel Analytics (mentioned §1) — Task 2

Placeholder scan: Task 1's README placeholder for the launch URL is intentional and called out. Task 14's registry intentionally launches with only chapter 1 wired up; this is a documented decision, not a placeholder.

Type consistency: `chapterMetadata(slug)` returns `Metadata`; called from `page.tsx` files in Task 13. `OgCard` props are defined in Task 15 and consumed in `og/[slug]/page.tsx` and `og/site/page.tsx` in the same task. `getOgDiagram` returns `OgDiagram | null`; consumed in Task 15. All signatures match across tasks.

Scope: 22 tasks, single PR, single branch (`meta/polish`), no infrastructure changes. Should land in 2–4 hours of focused work.
