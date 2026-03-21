# Style Guide

This is an operational prototype, not a luxury marketing site and not a production design system.

The goal is consistency, speed, and readability.

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
- Prefer a main work surface plus a supporting rail when the workflow benefits from it.
- Avoid giant empty zones that make the user hunt for focus.
- Avoid “card for every thing.” If something is just metadata, present it as metadata.

## Calendar / table / list behavior

- Do not let dense content destroy the shape of the layout.
- Use progressive disclosure instead of cramming every row into the first view.
- Reserve the strongest emphasis for the user's current target:
  - selected day
  - active order
  - linked measurement set
  - current customer

## Buttons and actions

- Buttons should be one clear row or one clear stack.
- Avoid long labels that wrap if the action can be made shorter.
- Icon-first actions are fine for dense utility areas, but the label still needs to be understandable.
- If a set of actions appears more than once, extract a pattern.

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
