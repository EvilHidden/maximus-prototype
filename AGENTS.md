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

## Collaboration Cadence
- Before starting, name the problem and the subsystem out loud.
- Create a fresh branch for that problem. Do not keep reopening old branches for unrelated work.
- Keep iterating locally by default. Only run the shipping flow when the user explicitly says `ship`.
- During the work, check in periodically:
  - what problem are we solving?
  - are logic holes closed?
  - are design holes closed enough for this pass?
  - are we still inside the original branch scope?
- Before merging, summarize:
  - what changed
  - what was validated
  - what is still open
- After merge, close the branch immediately.

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
- `src/db/`
  - canonical business entities, normalized runtime schema, runtime-relative seed generation, and app-facing data adapters
- `src/components/ui/`
  - shared operational primitives and reusable interaction patterns
- `src/data/`
  - static lookup data, catalogs, navigation, and non-canonical scenario helpers
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
- Put canonical business entities, lifecycle records, and runtime-relative prototype scenarios in `src/db/`.
- Keep `src/data/` for static lookup data and UI-facing config such as navigation and non-canonical helpers.
- Keep operational reference catalogs in `src/db/`, including pickup locations, alteration service definitions, custom garment definitions, style options, and measurement field definitions.
- Do not add new canonical customers, appointments, order history, or open-order records back into `src/data/`.
- Use `src/db/referenceData.ts` for shared reference helpers and derived reference catalogs. Do not recreate private seed/reference singletons inside feature, state, or serializer modules.
- If a view needs transformed data, create or extend a selector rather than shaping it inline in JSX.
- Keep the prototype local-only. Do not add backend, persistence, or API assumptions unless explicitly requested.

## Database-first Rules
- Treat `state.database` as the source of truth for operational records.
- `createAppRuntime()` should provide canonical `database + referenceData` only.
- Screen-facing collections should be derived through adapters/selectors over `state.database`, not stored as parallel runtime arrays.
- If the user can create, edit, archive, cancel, complete, or reschedule something, the mutation should live in `src/db/mutations.ts` and flow through reducer actions.
- Prefer archive/inactive semantics over destructive deletion for historical business records unless the user explicitly wants destructive behavior.

## UI System Rules
- Reuse primitives from `src/components/ui/primitives.tsx` before inventing new one-off markup patterns.
- Reuse semantic pill wrappers from `src/components/ui/pills.tsx` for VIP, measurement, payment, readiness, location, order-status, and count badges before adding local badge markup.
- Reuse the shared table surface language already established in Customers:
  - `app-table-shell`
  - `app-table-head`
  - `app-table-row`
- Reuse the shared page-surface language for operational screens:
  - `app-control-deck`
  - `app-work-surface`
  - `app-support-rail`
- If a screen introduces a table/list surface that behaves like Customer Directory or Orders Registry, it should follow that same shell, border, and hover treatment unless there is a strong workflow reason not to.
- Operational pages should read as one system:
  - page-level plane
  - one clear control deck
  - one clear primary work surface
  - lighter support rail
- Do not reintroduce card stacks inside those surfaces when a bordered section or row treatment already communicates the grouping.
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

## Orders terminology rules
- Use the current operator-facing Orders language:
  - `Needs attention`
  - `In-house production`
  - `All active orders`
  - `Closed orders`
  - `Everything`
  - `Ready by`
  - `Paying customer`
- Avoid reintroducing older or fuzzier labels like:
  - `Worklist`
  - `Order Registry`
  - `Open orders`
  - `Mixed`
  - `Pickup target`
  - `Pay later`
  - `Promised ready by`
- `Overdue` should stay the strong attention state.
- `Pending` should read as work-in-progress, not as an alarm state.
- Prefer plain, grounded shop language over system or process language:
  - use `booked`, `choose`, `set`, `save`, `edit`, `back`
  - avoid `workflow`, `operational`, `intake`, `rail`, `handoff`, `promote`, `send it through`, `close out`
- If an Orders row already communicates readiness in one place, do not repeat a second near-duplicate ready message elsewhere in the same row.

## Orders row hierarchy
- For Orders rows, preserve this scan path:
  - left: customer and order identity
  - middle: timing detail, location, and item summary
  - right: operator status, money, and supporting payment cue
- Remove metadata that does not help the operator act.
- Avoid footer chatter and duplicate status explanations.
- Keep the Orders surface focused on actionable state, not schema language or internal implementation concepts.

## Repo Hygiene
- Remove dead files and stale styles when replacing old architecture.
- Do not leave unused prototype-only components checked in after a refactor.
- Keep `.playwright-cli/`, `dist/`, and other local artifacts out of commits.
- Update `README.md` when the repo structure or working conventions materially change.

## QA Expectations
- Minimum validation for non-trivial changes:
  - `npm run build`
- For UI workflow changes, also sanity-check the affected flows in the running app.
- Use the PR template in `.github/pull_request_template.md` when summarizing a branch for merge.
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

## Repo Guardrails
- Keep contributor-facing process docs current:
  - `README.md` for repo overview
  - `CONTRIBUTING.md` for workflow and merge discipline
  - `docs/STYLE_GUIDE.md` for UI/system conventions
- Keep GitHub build checks lightweight and relevant. For this repo, a passing `npm run build` is the baseline merge guardrail.
