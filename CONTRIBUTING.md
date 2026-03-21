# Contributing

This repo is built for fast prototype work by two contributors at the same time.

The goal is not heavyweight process. The goal is fewer collisions, clearer handoffs, and more reliable merges.

## Default workflow

1. Start from up-to-date `main`.
2. Create a short-lived branch with the prefix `codex/`.
3. Keep the branch focused on one subsystem or one idea.
4. Make changes, test the affected flow, and run `npm run build`.
5. Open or prepare a PR-style summary before merging.
6. Merge to `main`.
7. Push `main`.
8. Delete the finished branch.

For the fast path, use:

```bash
npm run start-topic -- "short topic name"
npm run ship -- "Short PR title"
```

That command runs a fast local `npm run check`, stages and commits the branch, pushes it, opens or reuses a PR to `main`, enables auto-merge, waits for the required build check to pass, then switches the local repo back to `main` and deletes the finished local topic branch.
The `start-topic` command checks that your tree is clean, updates `main`, and creates a fresh `codex/` branch for the new idea.

## Branch naming

Use branch names like:

- `codex/appointments-layout`
- `codex/measurements-draft-flow`
- `codex/order-bag-cleanup`

Keep the branch name tied to one problem. If the name starts feeling long or mixed-purpose, the scope is probably too wide.

## What to do before coding

Before implementing, answer these quickly:

- What subsystem is this in?
- Are we changing layout only, logic only, or both?
- Does a feature module already exist for this?
- Are we solving one idea, or sneaking three ideas into one branch?

If the work touches multiple subsystems, stop and split the change if possible.

## Safe subsystem boundaries

Use these to avoid conflict:

- `src/features/order/`
  - order workflow, pricing, cart, order-specific modals
- `src/features/customer/`
  - customer display rules, customer-specific helpers, drawer support
- `src/features/home/`
  - home dashboard grouping and derived schedule views
- `src/features/measurements/`
  - measurement set lifecycle, body map, measurement editor, measurement selectors
- `src/state/`
  - reducer actions, state shape, initialization
- `src/data/`
  - fixtures, catalogs, seeded scenarios
- `src/components/ui/`
  - shared reusable UI primitives
- `src/screens/`
  - composition only; avoid growing business logic here

## Pull request / merge checklist

Before merging, make sure the answer to all of these is `yes`:

- Is the branch still focused on one problem?
- Did we keep new logic out of screens when a feature module already existed?
- Did we remove dead code introduced during the change?
- Did we run `npm run build`?
- Did we sanity-check the affected UI flow in the running app?
- Did we write down any remaining logic holes or visual holes?
- Is the branch ready to be closed immediately after merge?

## PR notes template

Use this structure in your merge notes or PR body:

- What changed
- Why it changed
- Files or subsystem touched
- What was validated
- Known gaps still open

Keep it short and operational.

Apply the repo labels when they help route work clearly, especially:

- `workflow`
- `ui`
- `logic`
- subsystem labels like `appointments`, `measurements`, or `order-builder`

## When to split work into a new branch

Create a new branch instead of piling on if:

- the problem statement changed
- you moved to a different subsystem
- the original idea is effectively done
- the next change would need a different test flow

Do not keep reopening one branch for unrelated cleanup.

## When two contributors are active

Use this coordination rhythm:

1. Name the problem clearly.
2. Pick the subsystem.
3. Pick the branch name.
4. Decide what "done" means before editing.
5. At the end, ask:
   - Are the logic holes closed?
   - Are the design holes closed enough for this pass?
   - Is this ready to merge, or does it need another pass on the same branch?

## Local commands

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git checkout -b codex/your-branch-name
npm run check
npm run build
npm run start-topic -- "short topic name"
npm run ship -- "Short PR title"
```

## What not to do

- Do not work directly on `main` for normal feature work.
- Do not mix unrelated screens or subsystems in one branch.
- Do not use the screen file as the default place for new behavior.
- Do not merge without a successful build.
- Do not leave finished branches hanging around after merge.
