# Maximus Prototype

Operational tailoring prototype built with `Vite + React + Tailwind v4`.

## Collaboration docs

If two people are actively iterating in this repo, use these first:

- [CONTRIBUTING.md](/Users/daniel/Dev%20Work/maximus/CONTRIBUTING.md)
  - branch workflow, PR checklist, merge/closeout steps
- [docs/STYLE_GUIDE.md](/Users/daniel/Dev%20Work/maximus/docs/STYLE_GUIDE.md)
  - UI/system/style rules so we stop reinventing patterns
- [docs/UI_SYSTEM_BLUEPRINT.md](/Users/daniel/Dev%20Work/maximus/docs/UI_SYSTEM_BLUEPRINT.md)
  - portability contract for tokens, primitives, feature layers, and future `WeWeb + Xano` translation
- [AGENTS.md](/Users/daniel/Dev%20Work/maximus/AGENTS.md)
  - Codex-specific repo rules and subsystem boundaries
- [docs/DOMAIN_SCHEMA.md](/Users/daniel/Dev%20Work/maximus/docs/DOMAIN_SCHEMA.md)
  - canonical prototype schema, lifecycle assumptions, and database-runtime direction

## What changed

This repo is structured for fast two-person prototyping:

- `src/state/`
  - reducer-driven app, order, appointment, and measurement workflow state
- `src/data/`
  - navigation, UI-only config, and non-canonical helpers
- `src/db/`
  - normalized prototype database schema, runtime seed generation, reference helpers, canonical mutations, and adapters back to UI models
- `src/features/order/`
  - order workflow selectors, builders, summary rail, and modals
- `src/features/home/`, `src/features/customer/`
  - lightweight view selectors
- `src/components/ui/`
  - shared operational UI primitives and layout patterns

## Current architecture status

The app now behaves like a local db-backed mini application for its core operational flows:

- customers
  - create, update, archive, and historical lookup
- measurement sets
  - db-backed draft, save, and delete flows
- orders
  - draft -> save -> edit -> payment -> ready -> pickup completion
- appointments
  - create, reschedule, complete, cancel
- checkout
  - reads canonical saved order records rather than decorative summary strings

What is still intentionally static:

- alteration service definitions
- custom garment definitions
- style option definitions
- measurement field definitions
- pickup location definitions

Those reference catalogs still live in `src/db/` and are treated as canonical seed/reference tables, but they are not operator-editable CRUD entities yet.

## Working rules

- Put static lookup data and catalogs in `src/data/`
- Put canonical business entities, relationships, runtime-relative seed logic, and app bootstrap data in `src/db/`
- Put shared reference helpers in `src/db/referenceData.ts`
- Put derived view logic in feature `selectors.ts` files, not inside screens
- Put reusable interaction patterns in `src/components/ui/primitives.tsx`
- Use [`docs/UI_SYSTEM_BLUEPRINT.md`](/Users/daniel/Dev%20Work/maximus/docs/UI_SYSTEM_BLUEPRINT.md) as the source of truth for what belongs in tokens vs primitives vs feature composites vs screens
- Put shared pill and badge patterns in `src/components/ui/pills.tsx`
- Keep screens thin; feature modules should own workflow behavior
- Use reducer actions for order state changes instead of ad hoc shallow patching

## Orders terminology

The Orders surface now uses a specific operator-facing vocabulary. Keep that language consistent across UI, selectors, docs, and seed scenarios:

- `Worklist`
  - operational items needing action now
  - can include both active orders and scheduled pickup appointments
- `Order Registry`
  - active orders only
- `Closed Orders`
  - completed and picked-up work
- `Promised ready by`
  - the shop's promised-ready time
  - not the same thing as a pickup appointment
- `Payment Due`
  - unpaid operator-facing payment state

Avoid older or ambiguous phrasing like `Open orders`, `Mixed`, `Pickup target`, or `Pay later` unless you are explicitly migrating legacy code and immediately replacing it.

## Runtime entry point

The app should consume canonical prototype business data through `src/db/appRuntime.ts`.

- `src/db/runtime.ts`
  - builds the normalized local prototype database relative to the current date
- `src/db/mutations.ts`
  - canonical create/update/archive/closeout mutations over database records
- `src/db/adapters.ts`
  - adapts canonical records into current UI-facing view models
- `src/db/appRuntime.ts`
  - the single app-facing bootstrap boundary used by `App.tsx`
- `src/features/app/useAppController.ts`
  - derives screen-facing collections from `state.database`

If you need to change seeded customers, appointments, open orders, readiness, pickup state, or order history, start from `src/db/` and only fall back to `src/data/` for static lookup/config work.

Rule of thumb:

- `createAppRuntime()` should return canonical `database + referenceData`
- screens should consume adapted/selected views over `state.database`
- do not recreate private seed catalogs in feature or state modules just to answer helper questions

## Orders worklist hierarchy

When refining the Orders worklist, preserve the current scan path:

- left
  - customer and order identity
- middle
  - promised-ready detail, location context, and item summary
- right
  - operator status, money, and supporting payment notice

Do not let the row drift back into:
- duplicate ready/overdue messaging
- verbose footer metadata
- aggressive payment/status language that competes with the work detail
- receipt-like exactness when rounded operational values are easier to scan

## Shared pills

Use the shared pill layer before inventing local badge markup:

- `src/components/ui/primitives.tsx`
  - base `StatusPill` primitive and tone system
- `src/components/ui/pills.tsx`
  - semantic wrappers like `VipPill`, `MeasurementStatusPill`, `PaymentStatusPill`, `OrderStatusPill`, `ReadinessPill`, `LocationPill`, and `CountPill`

Rule of thumb:

- if you need a one-off label with an existing tone, use `StatusPill`
- if you are rendering a recurring domain meaning like VIP, readiness, payment state, order state, measurement state, or count badges, use the semantic pill wrappers in `pills.tsx`
- do not hand-roll pill markup in screens or feature components unless you are proving a brand-new pattern

## Typography standard

Use the shared typography roles from `src/index.css` instead of inventing new one-off text combinations in feature code:

- `app-text-overline`
  - small uppercase structural labels and section metadata
- `app-text-caption`
  - short helper copy and secondary supporting text
- `app-text-body`
  - default operational body text
- `app-text-body-muted`
  - muted body text in tables, summaries, and support rows
- `app-text-strong`
  - row titles, emphasized labels, and important inline values
- `app-text-value`
  - key values, selected states, and primary emphasis in cards

Prefer these roles first, then add Tailwind layout utilities around them. Avoid ad hoc mixes of `text-xs`, `text-sm`, `font-semibold`, and `tracking-*` unless there is a strong local reason.

## Prototype constraint check

This repo is a client signoff prototype, not a production foundation and not a true MVP.

Before adding a new framework, dependency, design system layer, or abstraction, do a quick yes/no check:

- Does this directly help the client validate workflow logic right now?
- Will this save more iteration time over the next 1-2 weeks than it costs to introduce?
- Are we repeating the same pattern enough times that not extracting it is now the bigger risk?

If the answer is `no`, keep the change local, minimal, and prototype-scoped.

If the answer is `yes`, pause first and explicitly call out the tradeoff before implementing. The default should be to avoid overbuilding.

## Commands

```bash
npm run dev
npm run test
npm run check
npm run build
npm run preview
npm run start-topic -- "short topic name"
npm run ship -- "Short PR title"
```

## Build checks

This repo includes a lightweight GitHub Actions build check that runs on pushes to `main` and on pull requests. The goal is not enterprise CI, just a simple guardrail so collaborative changes fail fast when the app stops building.

For the local side of the rapid loop, start each new idea with `npm run start-topic -- "short topic name"`. That keeps contributors anchored on fresh `codex/` branches from current `main`.

For the rapid branch-to-main loop, use `npm run ship -- "Short PR title"` from a `codex/` branch. It runs `npm run check` locally for a faster preflight, commits and pushes the branch, opens or reuses a PR, enables auto-merge, then returns the local repo to `main` and deletes the local topic branch after the full GitHub build passes.

Do not ship after every accepted tweak. Continue iterating locally until the user explicitly says `ship`, then use `npm run ship -- "Short PR title"` for the release pass.

Do not keep working on the same `codex/` branch after its PR has been merged or closed. Start a fresh branch with `npm run start-topic -- "short topic name"` for every new follow-up pass.
