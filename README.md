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
