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
- Should remain compatible with Square's order-level model, not replace it
- Can be:
  - `open`
  - `partially_ready`
  - `partially_picked_up`
  - `complete`
- May be linked to:
  - Square

### `order_scope`
- The unit of fulfillment truth
- This is the Maximus overlay that sits on top of flatter Square-compatible order/item records
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
- The saved sellable line items that live under a scope
- Used for:
  - order summaries
  - checkout / receipt review
  - queue display
  - future Square line-item mapping
- Should store canonical relational truth for the saved item, not just a display label:
  - garment identity
  - wearer linkage when applicable
  - measurement-set linkage when applicable
  - frozen measurement snapshot when applicable

### `order_scope_line_component`
- Child records for `order_scope_line`
- Used for:
  - alteration services / modifiers
  - custom build options
  - wearer / measurement metadata tied to a saved custom line
- This is the layer that prevents checkout and receipts from reverse-engineering item detail out of one flat label string

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
  - and should remain flexible enough to support ad hoc scheduled pickups
- Should carry scheduling metadata such as:
  - source
  - duration
  - optional linkage to finer-grained work records as needed

### `service_appointment`
- Non-pickup scheduled touchpoints such as:
  - fittings
  - consults
  - review appointments
  - wedding-party fittings

Appointments are modeled as their own domain and should not be collapsed into generic order fields just because a legacy operational surface was flatter.
They should also remain expressive enough to carry normalized scheduling metadata and optional order/work associations.

### `measurement_set`
- Versioned customer measurement history
- Measurements should follow the most correct and flexible tailoring model, not a legacy fixed-column shape

### Reference definitions
- The prototype also carries seeded operational reference tables for:
  - alteration services
  - custom garment definitions
  - style options
  - measurement field definitions

These now live under `src/db/` so operational lookup data is sourced from the same canonical layer as business records.

### `payment_record`
- Local mirror of payment state
- Square remains the payment processor of record
- The prototype stores references and mirrored payment summaries, not card data

### `square_link`
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
- `src/db/referenceData.ts`
  - derives screen-facing operational catalogs from canonical reference tables
- `src/db/adapters.ts`
  - adapts canonical records into current screen-facing view models
- `src/db/appRuntime.ts`
  - provides the single app-facing bootstrap boundary consumed by `App.tsx`

This means:
- business truth lives in the schema/runtime layer
- UI compatibility is preserved through adapters
- app bootstrap should happen through one runtime entry point instead of hand-wiring multiple adapters at the app root
- future PostgreSQL migration starts from the normalized model, not from scattered fixture arrays
- if the UI shows item detail, payment state, or relationship context, it should come from modeled records or derived selectors over modeled records, not decorative placeholders

## Migration intent

Short-term:
- keep the UI working through adapters
- migrate fragile logic first, especially Orders and pickup/readiness behavior
- keep the canonical model compatible with Square integrations without letting Square's flatter structure dictate the whole domain model

Long-term:
- replace adapter-era view-model shaping with direct query/repository patterns
- map canonical local records to backend-owned integrations cleanly
- translate this schema to PostgreSQL with minimal conceptual rework
