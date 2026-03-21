# AGENTS.md

## Purpose
This repo is a fast-moving operational prototype for tailoring workflows.

Primary goal:
- make rapid product iteration safe for two people working in parallel.

Secondary goal:
- keep the prototype easy to reshape without reintroducing single-file hotspots, stale UI patterns, or scattered state logic.

## Working Style
- Prefer small, focused changes over broad mixed-purpose edits.
- Keep screens thin. New workflow logic should live in feature modules or selectors, not expand screen files unnecessarily.
- Optimize for collaboration safety first, then visual polish.
- Preserve the current direction: operational/internal tooling, not luxury/client-facing design.

## Prototype Constraint Rule
- Treat this repo as a signoff prototype only. It is not a production app and not the beginning of a true MVP unless the user explicitly changes that direction.
- Before introducing a new framework, dependency, abstraction layer, or system-level refactor, do a fast yes/no evaluation:
  - Does it directly help the client validate workflow logic now?
  - Will it save more iteration time in the next 1-2 weeks than it costs to add?
  - Are we repeating a pattern often enough that not extracting it is now the bigger risk?
- If the answer is `no`, keep the work local, minimal, and prototype-scoped.
- If the answer is `yes`, stop and warn the user before proceeding. Call out that this is a scope/formalization step, explain the tradeoff briefly, and wait for confirmation before overbuilding.
- Default bias: prefer one-off prototype solutions with light reuse over new framework adoption.

## Branching Rules
- Do not work directly on `main` for normal feature work.
- Create short-lived branches with the prefix `codex/`.
- Recommended branch naming:
  - `codex/order-bag-cleanup`
  - `codex/customer-drawer-hierarchy`
  - `codex/home-dashboard-ops`
- Keep one branch focused on one area when possible.
- If two people are working at once, split by subsystem, not by random file slices.

## Safe Work Boundaries
Use these ownership boundaries to reduce merge conflicts:

- `src/features/order/`
  - order workflow UI, selectors, modals, cart behavior, pricing derivation
- `src/features/customer/`
  - customer filtering, customer-specific display rules, drawer support logic
- `src/features/home/`
  - dashboard grouping and derived appointment/pickup views
- `src/state/`
  - reducer state shape, action definitions, initialization
- `src/components/ui/`
  - shared operational primitives and reusable interaction patterns
- `src/data/`
  - seeded fixtures, catalogs, navigation, scenario definitions
- `src/screens/`
  - composition only; avoid pushing new business logic here unless there is a strong reason

If a change spans multiple boundaries, keep the behavior logic in the feature or state layer and keep the screen edits minimal.

## State Rules
- App and order behavior should flow through reducer actions in `src/state/appState.ts`.
- Do not reintroduce shallow “patch the whole draft” mutation patterns.
- Add explicit reducer actions for new workflow behavior.
- Derived values must live in selectors when practical:
  - pricing
  - order bag line items
  - grouped appointments
  - measurement suggestions
  - workflow status / completeness checks

## Data and Scenario Rules
- Keep fixture data split by concern inside `src/data/`.
- Add new reusable lookup/seed data there instead of embedding arrays in screens.
- If a view needs transformed data, create or extend a selector rather than shaping it inline in JSX.
- Keep the prototype local-only. Do not add backend, persistence, or API assumptions unless explicitly requested.

## UI System Rules
- Reuse primitives from `src/components/ui/primitives.tsx` before inventing new one-off markup patterns.
- If a pattern appears more than once, promote it into the UI layer or a feature component.
- Use semantic app classes and tokens from `src/index.css`.
- Use the shared typography roles from `src/index.css` for text hierarchy:
  - `app-text-overline` for structural labels and metadata
  - `app-text-caption` for helper copy
  - `app-text-body` / `app-text-body-muted` for default text
  - `app-text-strong` for emphasized labels
  - `app-text-value` for key values and selected states
- Prefer those roles plus Tailwind layout utilities over ad hoc text styling in feature files.
- Do not bring back broad global overrides that target generic Tailwind utility classes like `.bg-white` or `.text-slate-500`.
- Radius, hierarchy, and dark-mode behavior should stay consistent with the operational UI system already in place.
- Do not add another component framework or design-system layer just to make the prototype feel more formal. Only do this after the prototype constraint rule above is satisfied.

## Repo Hygiene
- Remove dead files and stale styles when replacing old architecture.
- Do not leave unused prototype-only components checked in after a refactor.
- Keep `.playwright-cli/`, `dist/`, and other local artifacts out of commits.
- Update `README.md` when the repo structure or working conventions materially change.

## QA Expectations
- Minimum validation for non-trivial changes:
  - `npm run build`
- For UI workflow changes, also sanity-check the affected flows in the running app.
- High-priority flows:
  - no-customer / no-order empty state
  - alterations-only order
  - custom-only order
  - mixed order with one active workflow surface and one inclusive order bag
  - customer change modal
  - pickup scheduling
  - measurement linking / choosing / creating

## When Adding New Work
Before implementing:
- identify the subsystem
- confirm the reducer actions/selectors needed
- avoid putting new behavior directly into a screen if a feature module already exists
- run the prototype constraint rule quickly; if the work looks like framework adoption, architecture formalization, or reusable-system building, stop and warn the user before proceeding

Before committing:
- remove dead code introduced by the change
- build the app
- make sure the diff is scoped to the intended subsystem
