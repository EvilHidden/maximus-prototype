# Domain Schema

This prototype now has a canonical domain model under `src/db/`.

The goal is not to be production-perfect yet. The goal is to stop spreading business logic across UI fixtures and selectors, and instead keep one normalized source of truth that can later map cleanly to PostgreSQL.

## Core entities

### `customer`
- Contact identity for a person or payer
- Owns:
  - measurement sets
  - optional events
  - appointments
  - orders through `payer_customer_id`

### `customer_event`
- Optional event tied to a customer, such as a wedding or prom
- Used primarily by custom scopes for “must have by” logic
- Events are optional, not required for custom orders

### `order`
- Parent commercial record
- Represents the customer-facing order that may contain one or more fulfillment scopes
- Can be:
  - `open`
  - `partially_ready`
  - `partially_picked_up`
  - `complete`
- May be linked to:
  - Square
  - Airtable

### `order_scope`
- The unit of fulfillment truth
- One order can contain:
  - one alteration scope
  - one custom scope
  - or both
- Each scope carries its own:
  - workflow type
  - promised ready target
  - readiness phase
  - optional event linkage
  - pickup behavior

This is what allows mixed orders to be partially ready without pretending the whole order moves as one indivisible block.

UI note:
- The schema can contain multiple scopes under one order, but operator-facing UI should not surface raw schema wording like `mixed` or `scope count` unless it directly helps someone act.
- Prefer human display language like:
  - `Custom + Alterations`
  - grouped garment summaries
  - one promised-ready line for a shared timing group

### `order_scope_line`
- The line items that live under a scope
- Used for:
  - order summaries
  - queue display
  - future Square line-item mapping

### `pickup_notification`
- Explicit customer contact attempts after a scope is ready or nearing pickup
- Exists separately from readiness and separately from appointments
- This gives us a path to:
  - multiple contact attempts
  - later marketing sync
  - clearer auditability

### `pickup_appointment`
- A scheduled customer pickup visit
- Optional
- Not all ready scopes require one
- Can be linked to:
  - an order
  - optionally a specific scope

### `service_appointment`
- Non-pickup scheduled touchpoints such as:
  - fittings
  - consults
  - review appointments

### `measurement_set`
- Versioned customer measurement history

### `payment_record`
- Local mirror of payment state
- Square remains the payment processor of record
- The prototype stores references and mirrored payment summaries, not card data

### `square_link` / `airtable_link`
- External system mapping tables
- Keep external identifiers outside the tailoring-specific domain model

## Lifecycle rules

### Alteration scopes
- Typically carry a `promised_ready_at`
- Can become `ready` before customer pickup is scheduled
- May be picked up independently
- In mixed orders, may be held operationally until the rest of the order is ready

### Custom scopes
- May exist with no event
- May optionally link to a `customer_event`
- Can carry a promised-ready target, event-driven target, or both
- Usually move through longer external production timing and may trigger later pickup behavior

### Mixed orders
- Alteration and custom scopes can progress independently
- The prototype currently supports:
  - partial readiness
  - partial pickup
  - repeat notification as remaining scopes become available
- Hold behavior is inferred in selectors for now, not locked into a rigid schema flag yet

## Orders UI semantics

The Orders UI should reflect the domain model with operator language, not schema language:

- `Worklist`
  - active operational items needing action now
  - may include active orders and scheduled pickup appointments
- `Order Registry`
  - active orders only
- `Closed Orders`
  - completed/picked-up work
- `Promised ready by`
  - the shop promise for when work should be ready
  - not the same thing as a customer pickup appointment
- `Payment Due`
  - unpaid merchant-facing payment state

Avoid surfacing schema/internal phrases directly in the UI when a clearer operator phrase exists.

## Runtime model

The current prototype runtime is:

- `src/db/runtime.ts`
  - creates a local normalized database seeded relative to the current date
- `src/db/adapters.ts`
  - adapts canonical records into current screen-facing view models
- `src/db/appRuntime.ts`
  - provides the single app-facing bootstrap boundary consumed by `App.tsx`

This means:
- business truth lives in the schema/runtime layer
- UI compatibility is preserved through adapters
- app bootstrap should happen through one runtime entry point instead of hand-wiring multiple adapters at the app root
- future PostgreSQL migration starts from the normalized model, not from scattered fixture arrays

## Migration intent

Short-term:
- keep the UI working through adapters
- migrate fragile logic first, especially Orders and pickup/readiness behavior

Long-term:
- replace adapter-era view-model shaping with direct query/repository patterns
- map canonical local records to Square/Airtable integrations cleanly
- translate this schema to PostgreSQL with minimal conceptual rework
