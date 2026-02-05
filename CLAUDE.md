# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interactive visual tutorial website for understanding AI from first principles. Built with Next.js 16 (App Router), MDX, and interactive React widgets. Currently Chapter 1 is implemented; 17 chapters are planned (see `docs/plans/curriculum-outline.md`).

## Commands

```bash
pnpm dev              # Start dev server at localhost:3000
pnpm build            # Production build
pnpm lint             # ESLint
npx playwright test   # E2E tests (expects dev server running)
```

## Architecture

### Routing & Content

Pages use Next.js App Router with a `(tutorial)` route group:

```
src/app/(tutorial)/{slug}/
  page.tsx        — Chapter page wrapper
  content.mdx     — MDX article content
  widgets.tsx     — Dynamic imports for chapter widgets (ssr: false)
```

Chapter metadata (title, slug, prerequisites, descriptions) lives in `src/lib/curriculum.ts`. The homepage (`src/app/page.tsx`) renders a chapter grid from this data.

### MDX Pipeline

- `@next/mdx` with `remark-math` + `rehype-katex` (LaTeX) + `rehype-pretty-code` (Shiki syntax highlighting)
- Custom MDX components registered in `mdx-components.tsx`: `<Callout>`, `<KeyInsight>`, `<TryIt>`
- MDX component source in `src/components/mdx/`

### Widget System

Widgets are client-side interactive components (`"use client"`) organized by chapter topic:

```
src/components/widgets/
  shared/             — WidgetContainer, SliderControl, SelectControl, ToggleControl
  computation/        — Chapter 1 widgets
```

**Pattern for widgets**: Each widget wraps in `<WidgetContainer>` for consistent chrome (title, description, reset button). Widgets are dynamically imported with `next/dynamic` + `{ ssr: false }` and wrapped in `<Suspense>`.

### Layout Structure

- `src/app/layout.tsx` — Root layout with `SiteHeader`, Geist fonts
- `src/app/(tutorial)/layout.tsx` — Tutorial layout with `SideNav`
- `src/components/layout/` — SiteHeader, SideNav, ChapterNav

### Styling

- Tailwind CSS 4 with `@tailwindcss/typography` for prose
- Design tokens as CSS custom properties in `src/app/globals.css` (e.g., `--color-accent`, `--color-surface`)

## Adding a New Chapter

1. Add chapter metadata to `src/lib/curriculum.ts`
2. Create `src/app/(tutorial)/{slug}/` with `page.tsx`, `content.mdx`, `widgets.tsx`
3. Create widgets in `src/components/widgets/{topic}/`
4. Follow the `01-computation` chapter as a template

## Key Conventions

- Import alias: `@/*` maps to `./src/*`
- Widgets are always client components with local `useState` (no global state library)
- Widgets are playgrounds, not demos — designed for experimentation and discovery (see `docs/plans/curriculum-outline.md` for editorial philosophy)
- D3 for data visualizations, Framer Motion for animations, Radix UI for accessible controls
