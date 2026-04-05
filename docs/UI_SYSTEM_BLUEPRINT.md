# UI System Blueprint

This repo is still a prototype. The point of this blueprint is not to formalize a production design system too early. The point is to make the prototype easier to extend now while keeping the useful parts portable into a future `WeWeb + Xano` stack.

## Why this exists

We already have a working visual language in the repo:

- semantic surfaces
- shared text roles
- shared pills and status tones
- reducer-driven workflow state
- feature modules that keep screens from becoming the entire app

What was missing was a clear contract for how those pieces should be organized and what should later be portable out of React and into `WeWeb`.

This document is that contract.

## Prototype boundary

Keep this system prototype-safe:

- no new framework or design-system dependency
- no heavy token pipeline
- no abstract component factory layer
- no backend assumptions leaking into the presentation layer

We only extract patterns that are already repeated or clearly on the critical path for faster iteration.

## System layers

Use this stack consistently:

1. `Tokens`
   - color, typography, spacing, radius, shadow, state tones
   - source of truth lives in [`src/index.css`](/Users/daniel/Dev%20Work/maximus/src/index.css)
2. `Structural primitives`
   - layout and generic UI building blocks
   - source of truth lives in [`src/components/ui/primitives.tsx`](/Users/daniel/Dev%20Work/maximus/src/components/ui/primitives.tsx)
3. `Semantic primitives`
   - reusable domain meanings like payment status, VIP, readiness, measurement state
   - source of truth lives in [`src/components/ui/pills.tsx`](/Users/daniel/Dev%20Work/maximus/src/components/ui/pills.tsx)
4. `Feature composites`
   - workflow-specific assemblies like order bag, workflow selector, measurement rail
   - source of truth lives in `src/features/*/components`
5. `Screens`
   - composition only
   - screens should assemble the system, not redefine it

If a screen starts inventing layout shells, form controls, badge logic, or text hierarchy again, that is system drift.

## Portability target for WeWeb + Xano

The future split should be:

- `Xano`
  - canonical entities
  - workflow records
  - order/appointment/customer measurement relationships
  - status enums and lifecycle data
- `WeWeb`
  - class settings
  - typography and spacing tokens
  - surface styles
  - reusable components and section shells
  - page composition rules

That means the prototype should preserve portable semantics now:

- tokens should be named by purpose, not by one screen
- primitives should be generic enough to rebuild in `WeWeb`
- feature components should stay tied to workflow meaning, not DOM trivia
- selectors should produce clean UI-facing models without presentation leakage

## Token families

The current token families we should preserve and expand carefully are:

### Color

- `--app-bg`
- `--app-surface`
- `--app-surface-muted`
- `--app-surface-elevated`
- `--app-border`
- `--app-border-strong`
- `--app-text`
- `--app-text-muted`
- `--app-text-soft`
- state tokens for warn, success, and danger

### Typography

- `app-text-overline`
- `app-text-caption`
- `app-text-body`
- `app-text-body-muted`
- `app-text-strong`
- `app-text-value`

These are already the correct portability shape for `WeWeb`: they should become reusable text classes, not re-decided per screen.

### Spacing

Spacing was previously implicit in utility strings. We now have a small token base in [`src/index.css`](/Users/daniel/Dev%20Work/maximus/src/index.css):

- `--app-space-1`
- `--app-space-2`
- `--app-space-3`
- `--app-space-4`
- `--app-space-5`
- `--app-space-6`

For now, keep spacing tokens small and operational. Do not create a giant scale until repeated use actually demands it.

### Radius and shadow

- `--app-radius-sm`
- `--app-radius-md`
- `--app-shadow-sm`
- `--app-shadow-lg`

These should remain global, because they define the operational tone more than any individual component does.

## Structural primitives

The primitives layer should own the recurring “how” of the UI:

### Surfaces

Use named surface types instead of repeating surface class strings inline:

- `card`
- `control`
- `work`
- `support`

React source lives in `Surface` inside [`src/components/ui/primitives.tsx`](/Users/daniel/Dev%20Work/maximus/src/components/ui/primitives.tsx). In `WeWeb`, these should become reusable section/container presets.

### Internal headers and action tiles

Reusable surface-internal framing should also live in primitives:

- `SurfaceHeader`
- `QuickActionTile`
- `SelectionChip`
- `CalendarDayCard`

These cover the repeated patterns for:

- section headers inside work/support surfaces
- lane headers with counts or utility actions
- front-desk launcher tiles

### Fields

Search and select controls should use a shared field shell:

- `app-field-shell`
- `app-field-control`
- `SearchField`
- `SelectField`

These are deliberately simple. They standardize the repeated filter/search treatment without locking us into a heavyweight form system.

### Existing stable primitives

Keep building on these instead of inventing local variants:

- `ActionButton`
- `Callout`
- `EmptyState`
- `InlineEmptyState`
- `SectionHeader`
- `PanelSection`
- `EntityRow`
- `WorkflowToggle`
- `StatusPill`

## Semantic primitives

Domain meaning should not be hard-coded in screens. Shared domain semantics belong in wrappers like:

- `VipPill`
- `MeasurementStatusPill`
- `PaymentStatusPill`
- `OrderStatusPill`
- `ReadinessPill`
- `LocationPill`
- `CountPill`

This is the right portability shape for `WeWeb` too: one semantic component or style preset per recurring meaning.

## WeWeb translation targets

When this moves into `WeWeb`, the first-pass rebuild should map like this:

- tokens in [`src/index.css`](/Users/daniel/Dev%20Work/maximus/src/index.css)
  - become global theme variables and reusable class presets
- `Surface`
  - becomes section/container presets for card, control, work, and support zones
- `SearchField` and `SelectField`
  - become reusable filter controls with shared padding, border, and label behavior
- `Callout`
  - becomes the standard warning/info/edit-state block for workflow guidance
- `SurfaceHeader` and `QuickActionTile`
  - become reusable `WeWeb` blocks for internal section framing and action launchers
- `SelectionChip`
  - becomes the standard tab/filter chip pattern for queue views, segmented modes, and location filters
- `CalendarDayCard`
  - becomes the standard day-cell shell for calendar-first screens
- pills and status wrappers
  - become semantic badge components with fixed tone mappings
- feature composites
  - become reusable `WeWeb` blocks only after the workflow shape stabilizes

The main rule is to port `system language` first and `screen assemblies` second.

## Layout grammar

The app already has a good operational page grammar. Keep using it.

### Page structure

- `app-control-deck`
  - filters, scope toggles, search, queue selection
- `app-work-surface`
  - the main worksheet, table, builder, or list
- `app-support-rail`
  - saved context, summary, side actions, order bag

### Viewport contract

For portability, the app should behave as if it has three real viewport breakpoints:

1. mobile
   - `0-767px`
2. landscape tablet
   - `768-999px`
3. desktop
   - `1000px+`

Important nuance:

- the desktop breakpoint includes small landscape tablets, iPad Pro landscape, and full desktop widths
- `1000-1366px` and `1367px+` are allowed as desktop tuning ranges
- those ranges are not separate product breakpoints
- they should only tune density and proportions inside the desktop shell

That is the right portability shape for a later WeWeb rebuild:

- one mobile layout family
- one tablet shell family
- one desktop shell family
- optional desktop density variants, not extra navigation models

### Responsive shell behavior

The current shell contract should remain stable:

- mobile
  - mobile drawer/tabbar pattern
  - stacked surfaces
- landscape tablet
  - tablet topbar
  - reduced shell chrome
  - simpler single-flow pages
- desktop
  - persistent sidebar
  - `app-page-with-support-rail` or equivalent desktop work surface
  - attached support rails instead of disconnected floating cards

When a screen needs responsive tuning, prefer:

- rail-width changes
- internal grid ratio changes
- tighter control spacing
- denser but still readable table/calendar cells

Avoid:

- adding one-off breakpoints for a single screen
- changing navigation structure inside a desktop tuning range
- rebuilding a screen with a different visual language instead of tuning the existing shell

### Table structure

- `app-table-shell`
- `app-table-head`
- `app-table-row`

When a screen behaves like a registry or operational worklist, it should use the same table shell language instead of inventing a new row surface.

### Screen responsibility

Screens should decide:

- what modules appear
- what data model they receive
- what workflow branch is active

Screens should not decide:

- base text styling
- badge tone logic
- input shell styling
- repeated surface treatment

## Data and semantics boundary

To keep `WeWeb + Xano` migration clean later:

- canonical business records stay in `Xano` eventually
- prototype canonical shape stays in `src/db/` now
- static UI catalogs stay in `src/data/`
- selectors should produce presentation-ready models
- feature components should consume models, not reconstruct business logic ad hoc

If we keep business semantics separated from visual shells, the frontend can move without re-deriving the system from scratch.

## Current strengths

The repo is already in a better state than a typical prototype:

- reducer-driven workflow logic exists
- feature modules already own most non-trivial UI behavior
- shared text roles already exist
- surface classes already exist
- semantic badge wrappers already exist
- screen files are not the only place where logic lives

## Current gaps

These are the main gaps this blueprint is meant to close:

- some responsive shell decisions had become real patterns in code before they were written down clearly
- desktop-band tuning rules were emerging screen by screen instead of being treated as one shared contract
- repeated search and filter markup still appears in a few places as screen-local layout instead of fully standardized field/composition patterns
- spacing and responsive density still mix system rules with one-off utilities in a few high-traffic screens
- the repo had a portability-oriented system map, but not an explicit viewport contract for the future WeWeb rebuild

## Standardization rules

When adding new UI work:

1. Start by asking whether the need is `token`, `primitive`, `semantic primitive`, `feature composite`, or `screen composition`.
2. If it is repeated and generic, add it to the primitives layer.
3. If it is repeated and domain-specific, add it to the semantic layer.
4. If it is unique to one workflow, keep it in the feature layer.
5. If it only assembles existing pieces, keep it in the screen.

## Extraction threshold

Promote something into the shared system when at least one of these is true:

- it appears twice already
- it clearly will appear again in the next 1-2 screens
- leaving it local will create merge conflict hotspots
- leaving it local makes future `WeWeb` reconstruction harder

If none of those are true, keep it local.

## Near-term roadmap

The next standardization steps should stay incremental:

1. Keep moving repeated filter/search blocks onto shared field primitives.
2. Keep documenting and centralizing shared responsive shell behavior in `src/index.css` instead of solving recurring layout problems screen by screen.
3. Standardize recurrent alert/callout boxes the same way we standardized pills.
4. Continue replacing raw surface class strings with named `Surface` usage where it improves clarity.
5. Keep selectors as the contract between raw data and rendered UI.
6. When `WeWeb` work begins, port tokens, text roles, surfaces, pills, field shells, and the three-band viewport contract first.

That sequence gives us the highest leverage without pretending this prototype needs a full enterprise system today.
