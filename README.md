# Maximus Prototype

Operational tailoring prototype built with `Vite + React + Tailwind v4`.

## What changed

This repo is structured for fast two-person prototyping:

- `src/state/`
  - reducer-driven app and order workflow state
- `src/data/`
  - seeded domain fixtures split by concern
- `src/features/order/`
  - order workflow selectors, builders, summary rail, and modals
- `src/features/home/`, `src/features/customer/`
  - lightweight view selectors
- `src/components/ui/`
  - shared operational UI primitives and layout patterns

## Working rules

- Put new seeded scenarios and catalogs in `src/data/`
- Put derived view logic in feature `selectors.ts` files, not inside screens
- Put reusable interaction patterns in `src/components/ui/primitives.tsx`
- Keep screens thin; feature modules should own workflow behavior
- Use reducer actions for order state changes instead of ad hoc shallow patching

## Commands

```bash
npm run dev
npm run build
npm run preview
```
