# Postgres/Xano Migration Plan

## Goal

Move the prototype to one canonical, seeded, Postgres-shaped data layer for all operational display data while keeping the implementation light and local.

For this prototype, "database-backed" means:
- all operational records come from `src/db/`
- all operational lookup/reference data comes from `src/db/` seed/reference tables
- selector formatting stays in feature selectors, not the canonical schema
- pure UI chrome can remain outside the DB seed layer when it is not business data

This is still a local-only prototype. We are not introducing a live PostgreSQL dependency yet.

## What Is Now Canonical

Operational display data should now come from:
- `src/db/runtime.ts`
- `src/db/runtime/*.ts`
- `src/db/schema.ts`
- `src/db/referenceData.ts`
- `src/db/appRuntime.ts`

That includes:
- customers
- customer events
- measurements
- orders
- order scopes
- order scope lines
- pickup notifications
- pickup appointments
- service appointments
- payments
- locations
- external links
- operational reference data such as alteration services, custom garment options, style options, and measurement field definitions

Intentional exception:
- `src/data/navigation.ts` remains UI config, not business data

## Review Checklist For Remaining Issues

Before each follow-up pass, review these issue classes repo-wide:

1. Data-source drift
- No operational screen should pull business records or business lookup values from `src/data/`
- No screen should inline business literals that already belong to DB seed/reference data

2. Formatting leakage
- Canonical types should store raw values
- Selector/view layers should own display formatting for:
  - dates
  - times
  - currency
  - readiness/payment labels

3. Enum drift
- Status-like fields should be reviewed for normalization:
  - order status
  - scope phase
  - appointment status/type
  - payment status
  - customer status

4. Screen thinness
- New business logic should land in:
  - `src/features/*/selectors.ts`
  - `src/features/*/service.ts`
  - `src/state/*`
  - `src/db/*`
- Screens should stay composition-first

5. Collaboration hotspots
- Watch for files that start accumulating unrelated concerns:
  - cross-feature selectors
  - large screens
  - app bootstrapping
  - runtime seed assembly

## Canonical Target Shape

### Core record tables
- `customers`
- `customer_events`
- `measurement_sets`
- `orders`
- `order_scopes`
- `order_scope_lines`
- `order_scope_line_components`
- `pickup_notifications`
- `pickup_appointments`
- `service_appointments`
- `payment_records`
- `locations`
- `square_links`

### Reference tables
- `alteration_service_definitions`
- `custom_garment_definitions`
- `style_option_definitions`
- `measurement_field_definitions`

## Approved Modeling Decisions

### Orders and Square compatibility
- Square's flatter `Orders` and `Order Items` model is real and should be preserved as an integration shape
- the canonical Maximus model stays normalized with:
  - `orders`
  - `order_scopes`
- `order_scope_lines`
- `order_scope_line_components`
- practical rule: do not replace the normalized model with the Square shape
- instead, treat the canonical model as a Maximus fulfillment overlay on top of Square-compatible order and item records

### Appointments
- appointments remain their own first-class domain
- appointments are not constrained by any flatter legacy operational shape
- canonical scheduling should support:
  - alterations
  - fittings
  - wedding-party fittings
  - ad hoc scheduled pickups
- appointments should stay linkable to:
  - customers
  - orders
  - optionally more granular work units where needed
- appointments should also keep normalized scheduling metadata such as:
  - source
  - duration
  - typed appointment/status keys

### Measurements
- keep the most flexible, robust canonical measurement model for PostgreSQL/Xano
- if needed, flatten/unflatten only at integration boundaries

### Locations
- locations remain normalized records
- support future add/remove/edit behavior
- missing Square location IDs should be treated as integration debt, not a modeling reason to fall back to text-only locations

## PostgreSQL Mapping Rules

When this moves to PostgreSQL:
- every canonical entity becomes a table
- every reference table becomes a lookup table
- every cross-system ID stays outside tailoring-specific business tables where practical
- timestamps stay raw and UTC-safe
- derived labels do not become persisted columns unless a backend consumer truly needs them

### Foreign key intent
- `customers.preferred_location_id -> locations.id`
- `customer_events.customer_id -> customers.id`
- `measurement_sets.customer_id -> customers.id`
- `orders.payer_customer_id -> customers.id`
- `order_scopes.order_id -> orders.id`
- `order_scopes.event_id -> customer_events.id`
- `order_scope_lines.scope_id -> order_scopes.id`
- `order_scope_line_components.line_id -> order_scope_lines.id`
- `pickup_notifications.scope_id -> order_scopes.id`
- `pickup_appointments.order_id -> orders.id`
- `pickup_appointments.scope_id -> order_scopes.id`
- `pickup_appointments.customer_id -> customers.id`
- `service_appointments.customer_id -> customers.id`
- `service_appointments.location_id -> locations.id`
- `payment_records.order_id -> orders.id`

## Xano Translation Notes

Preferred translation to Xano:
- core record tables map directly to Xano tables
- reference tables map directly to Xano option/reference tables
- external ID links can stay separate or be embedded only if Xano ergonomics clearly outweigh separation

Do not push these into persisted backend fields unless we truly need them:
- formatted money strings
- formatted date labels
- operator-facing pill labels
- derived queue states
- grouped pickup summaries

Those belong in frontend selectors or a thin view-model layer.

## Approved Execution Order

### Phase 1: Canonical cleanup
- Keep removing stray operational fixture imports
- Keep moving operational lookup sets into DB seed/reference tables
- Keep screens dependent on `createAppRuntime()` outputs only

### Phase 2: Backend readiness
- Prepare the canonical schema for owned backend implementation
- Capture only the backend-facing mappings that the frontend truly needs
- Surface only material schema conflicts for approval

### Phase 3: Schema lock
- Normalize any unresolved statuses/types
- Finalize reference-table boundaries
- Freeze the canonical prototype shape for PostgreSQL/Xano porting

### Phase 4: Backend handoff prep
- Produce a table-by-table migration sheet
- Mark derived frontend-only fields explicitly
- Define external sync points for Square/Xano or other owned backend services

## Current Decision Gates

Most of the material direction is now resolved:
- keep normalized order scopes on top of Square-compatible orders/items
- keep appointments as dedicated flexible records
- keep measurements flexible and independent from any legacy fixed-column shape
- keep locations normalized

The only notable canonical-model question still worth revisiting later is:
- whether customer events should stay a dedicated table forever or collapse into customer-level fields for operational simplicity
