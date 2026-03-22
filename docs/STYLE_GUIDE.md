# Style Guide

This is an operational prototype, not a luxury marketing site and not a production design system.

The goal is consistency, speed, and readability.

For system architecture, portability, and layer ownership, use [`docs/UI_SYSTEM_BLUEPRINT.md`](/Users/daniel/Dev%20Work/maximus/docs/UI_SYSTEM_BLUEPRINT.md) alongside this guide.

## Product tone

- operational
- clear
- restrained
- dense when useful
- never decorative for its own sake

## Visual hierarchy

Use the hierarchy already defined in `src/index.css`:

- `app-text-overline`
  - structure, labels, metadata
- `app-text-caption`
  - helper text, supporting context
- `app-text-body`
  - default body text
- `app-text-body-muted`
  - quieter operational support text
- `app-text-strong`
  - row titles and emphasized labels
- `app-text-value`
  - important values, active state, selected values

Do not invent local text stacks unless there is a strong reason.

## Layout principles

- Keep screens composition-focused.
- Put complex interaction patterns into feature components.
- Use `SurfaceHeader` when a section inside a work or support surface needs its own title/subtitle/meta row.
- Use `SelectionChip` for repeated tabs, mode pills, and filter chips instead of rebuilding selected/unselected button states inline.
- Prefer a main work surface plus a supporting rail when the workflow benefits from it.
- For operational pages, standardize around three layers:
  - `app-control-deck` for search, filters, mode toggles, and queue rails
  - `app-work-surface` for the primary worksheet, table, calendar, or row surface
  - `app-support-rail` for secondary context, saved sets, bags, and side actions
- Avoid giant empty zones that make the user hunt for focus.
- Avoid “card for every thing.” If something is just metadata, present it as metadata.
- Do not stack lifted cards inside other lifted cards when a bordered section on the page plane will do the job.

## Calendar / table / list behavior

- Do not let dense content destroy the shape of the layout.
- Use progressive disclosure instead of cramming every row into the first view.
- Reserve the strongest emphasis for the user's current target:
  - selected day
  - active order
  - linked measurement set
  - current customer
- For table-like operational surfaces, reuse the shared table system from `src/index.css`:
  - `app-table-shell`
  - `app-table-head`
  - `app-table-row`
- If Customers has already established the correct table treatment for a pattern, other screens should follow that same shell, row border, and hover language instead of inventing a local variant.
- Calendar-first screens can stay calendar-first, but the shell around the calendar should still use the same plane language as the rest of the app.
- Use `CalendarDayCard` for reusable day-cell framing before inventing a new day button treatment.
- Support rails should feel attached to the page plane, not like a second application floating beside the main work.

## Orders language

- Use the current operator-facing Orders vocabulary:
  - `Worklist`
  - `Order Registry`
  - `Closed Orders`
  - `Promised ready by`
  - `Payment Due`
- Do not reintroduce older or vaguer terms like:
  - `Open orders`
  - `Mixed`
  - `Pickup target`
  - `Pay later`
- `Overdue` is the strong operational warning state.
- `Pending` is a calmer work-in-progress state, not a danger state.
- `Ready` and `Ready for pickup` should not compete in the same row. If the row already communicates pickup-readiness, do not add a second near-duplicate ready badge.

## Orders worklist rows

- The worklist row should scan left to right as:
  - customer and order identity
  - promised-ready detail and item summary
  - action, status, and money
- Customer identity anchors the row.
- The middle section should answer:
  - what was promised
  - when it is due
  - where it belongs
  - what items are involved
- The right side is for operator action and financial context, not extra chatter.
- Remove metadata that does not help the merchant act:
  - lane labels
  - repeated location labels
  - vague footer summaries
- If a row contains both a status and an action, the action should sit near the work detail it affects, not drift into a far corner just because there is space there.

## Buttons and actions

- Buttons should be one clear row or one clear stack.
- Use `QuickActionTile` for repeated launcher tiles like front-desk entry points instead of rebuilding the tile shell locally.
- Avoid long labels that wrap if the action can be made shorter.
- Icon-first actions are fine for dense utility areas, but the label still needs to be understandable.
- If a set of actions appears more than once, extract a pattern.

## Callouts

- Use the shared `Callout` primitive for validation blocks, edit-context notices, and workflow warnings.
- Do not hand-roll new alert boxes with one-off border/background combinations when the meaning matches an existing tone.
- Keep callouts short and operational:
  - what is blocked or changing
  - what the operator needs to do next

## Cards

- Cards are for grouped workflows, not for every small piece of data.
- If a section only contains one label and one value, it probably does not need to be a card.
- Right-rail modules should feel like one system, not unrelated stacked boxes.

## Measurements-specific rules

- Saved measurements:
  - customer name leads
  - `Saved measurements` is secondary
  - version pill sits top-right
  - delete action sits bottom-right
- Body map:
  - no text pills
  - use guide lines and highlight only
  - do not force fake mappings for fields that do not belong on the silhouette
- Measurement editor:
  - controls should read top to bottom
  - avoid extra narration if the state is already obvious

## State messaging

- Prefer clear state over verbose explanation.
- Good:
  - `No set loaded`
  - `Draft`
  - `V2`
  - `No customer selected`
- Bad:
- repeated explanatory sentences that restate the same thing multiple times

## Empty states

- Reuse `EmptyState` and `InlineEmptyState` from `src/components/ui/primitives.tsx` instead of inventing local shells.
- Keep empty-state copy short, direct, and operational:
  - title/label says what is missing
  - body says what scope is empty
  - optional caption can explain the filter or date context
- Prefer phrasing like:
  - `No appointments scheduled`
  - `No pickups scheduled`
  - `No customers match this search`
- Avoid decorative or celebratory phrasing for routine operational gaps.
- Inside table lanes or work-surface slots, empty states should feel attached to the lane:
  - use the existing border rhythm
  - avoid introducing a second floating card language
  - add filter context only when it explains why the lane is empty

## Pills and badges

- Use `src/components/ui/primitives.tsx` for the base `StatusPill`.
- Use `src/components/ui/pills.tsx` for shared semantic pills:
  - `VipPill`
  - `MeasurementStatusPill`
  - `PaymentStatusPill`
  - `OrderStatusPill`
  - `ReadinessPill`
  - `LocationPill`
  - `CountPill`
- If the meaning is domain-specific and appears in more than one place, add or reuse a semantic pill wrapper instead of repeating tone/label logic inline.
- Do not hand-roll local VIP, count, payment, measurement, or order-status badges inside screens.
- Keep pill text short, operational, and scannable.

## Code style for UI work

- Reuse feature components before creating more JSX in screens.
- Reuse shared primitives before inventing local wrappers.
- Keep selectors in feature modules when the view needs transformed data.
- Keep seeded fixtures out of screens.

## When to add a new pattern

Add a new shared pattern only if:

- it appears twice already
- the two uses want the same visual language
- extracting it reduces conflict risk or speeds iteration

Otherwise, keep it local and light.
