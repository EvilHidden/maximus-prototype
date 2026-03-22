# Airtable Maximus Alignment

## Audit Context

- Airtable server: `airtable_samepage`
- Base reviewed: `Maximus Operations`
- Base ID: `appTUmJqHUEkVWgVh`
- Audit date: `2026-03-22`

This audit compares the live Airtable operations base against the prototype's canonical runtime schema under `src/db/`.

The goal is not to force the prototype to match Airtable one-for-one.
The goal is to keep the prototype's canonical schema:
- portable to PostgreSQL
- clean for future Xano modeling
- reasonably compatible with the real operational base

## High-Level Alignment

The live Airtable base aligns well with the prototype on the main business surfaces:
- `Customers`
- `Orders`
- `Order Items`
- `Payments`
- `Measurements`
- `Locations`

That means the repo is already pointed at the right business domains.

## Repo Canonical Model

Current canonical runtime model:
- `customers`
- `customer_events`
- `measurement_sets`
- `orders`
- `order_scopes`
- `order_scope_lines`
- `pickup_notifications`
- `pickup_appointments`
- `service_appointments`
- `payment_records`
- `locations`
- `square_links`
- `airtable_links`
- reference tables for operational catalogs and measurement definitions

## Airtable Table Mapping

### Good matches

`Customers`
- Airtable stores customer identity, contact info, notes, preferred location, linked orders, linked measurements, and linked payments
- This maps cleanly to repo `customers` plus links to orders, measurement sets, and payments

`Orders`
- Airtable stores customer, order type, due date, status, notes, vendor fields, measurement set linkage, payments, totals, and location
- This maps cleanly to repo `orders` as the parent commercial record

`Order Items`
- Airtable stores quantity, category, names, pricing, notes, and customization details
- This maps to repo `order_scope_lines`, though Airtable currently stores many customization details flat on the item row

`Payments`
- Airtable stores amount, type, card/payment metadata, customer link, order link, status, and notes
- This aligns well with repo `payment_records`

`Measurements`
- Airtable stores one measurement set per row with linked customer/order and numeric measurement columns
- This aligns directionally with repo `measurement_sets`

`Locations`
- Airtable stores location identity, address, phone, notes, and linked customers
- This aligns with repo `locations`

## Material Conflicts And Resolved Direction

These are the mismatches that matter enough to affect PostgreSQL/Xano planning.

### 1. Orders are flatter in Airtable than in the prototype

Airtable:
- `Orders` is the main order record
- `Order Items` hang directly off the order
- there is no explicit intermediate fulfillment unit equivalent to `order_scope`

Prototype:
- one `order` can contain multiple `order_scopes`
- each scope carries its own workflow, readiness, event linkage, and pickup behavior

Why this matters:
- mixed orders are one of the main reasons the prototype normalized scopes in the first place
- flattening back down would make partial readiness and partial pickup behavior less explicit

Resolved direction:
- keep `order_scopes` in the canonical repo/Postgres/Xano model
- keep `orders` and `order_scope_lines` as the integration-facing layer that can map to Square's flatter `Orders` and `Order Items`
- treat Square and Airtable as flatter operational sync surfaces, not the canonical schema authority

Operator note:
- the canonical model is now explicitly "Square-compatible plus Maximus fulfillment overlay"
- said another way: Square's order and item structure is real and should be preserved for integration, but Maximus still needs the added `order_scope` layer for mixed-order readiness, pickup behavior, and workflow truth

### 2. Airtable does not currently expose dedicated appointment tables

Airtable tables reviewed did not include:
- service appointments
- pickup appointments
- pickup notifications

Prototype includes all three as explicit records.

Why this matters:
- the prototype UI already uses appointments operationally on Home, Appointments, and Orders
- if appointments become embedded fields instead of tables later, we lose scheduling flexibility and auditability

Resolved direction:
- keep dedicated appointment and notification tables in the canonical repo/Postgres/Xano model
- appointments should model Square-sourced scheduling concepts, not be forced to follow the current Airtable shape
- keep appointments flexible enough to support:
  - alterations and fittings
  - wedding-party fittings
  - ad hoc scheduled pickups
  - linkage to customers, orders, and optionally more granular work units when needed

Modeling note:
- appointments should remain associated with people and optionally with orders or order line/work units, but they should not be collapsed into those records

### 3. Customer events are embedded in Airtable customer rows

Airtable:
- `Customers` includes `Event Type` and `Event Date` fields

Prototype:
- uses a dedicated `customer_events` table

Why this matters:
- a dedicated event table supports multiple events over time and cleaner event linkage from custom work
- embedding event fields on customer rows is operationally convenient but less future-proof

Current direction:
- no override was given here, so keep `customer_events` as a dedicated canonical table for now
- Airtable customer-level event fields should be treated as a simplified operational projection, not the canonical long-term model

### 4. Measurements are fixed-width in Airtable and flexible in the prototype

Airtable:
- one row with explicit numeric columns like `Back Length`, `Shoulder`, `Chest`, and so on

Prototype:
- one measurement set with a `values: Record<string, string>` payload plus reference field definitions

Why this matters:
- fixed columns are easier for Airtable operations
- flexible/value-map storage is easier to evolve and port when measurement definitions change

Resolved direction:
- ignore Airtable as the source of truth for measurements
- keep the canonical prototype/Postgres/Xano measurement model as the most flexible, robust, and correct shape for the tailoring workflow
- if Airtable sync is ever needed, use flatten/unflatten adapters rather than letting Airtable's fixed columns drive the backend design

### 5. Location is linked in some Airtable places and plain text in others

Airtable:
- `Customers.Preferred Location` is a linked-record relationship
- `Orders.Location` is currently a single-line text field

Prototype:
- normalizes locations through `location_id`

Why this matters:
- text locations create long-term drift risk
- location filters and reporting are safer with foreign keys

Resolved direction:
- keep normalized `location_id` references in the canonical model
- treat the real business locations as managed records, not hardcoded text
- support future add/remove/edit behavior for locations as part of the long-term model
- treat missing Square location IDs as integration debt to fill in, not a reason to abandon normalization

## Non-Blocking Differences

These differences are worth noting but do not require a decision now.

`External IDs`
- Airtable includes Square IDs directly on multiple tables
- the repo keeps dedicated link records
- both are workable; the repo approach is cleaner for PostgreSQL/Xano

`Order item customization fields`
- Airtable stores many suit/shirt customization fields flat on item rows
- the prototype currently keeps only the fields needed for prototype behavior
- long-term, PostgreSQL/Xano may want either a structured customization JSON field or product-specific child tables

`Customer identity decomposition`
- Airtable stores first name, last name, honorific, suffix, and a formula name
- the prototype currently uses a simpler `name` string
- this is not blocking unless downstream sync/search rules require strict name decomposition

## Recommended Canonical Position

The current approved long-term direction is:

1. Keep repo/Postgres/Xano canonical data normalized
- especially `order_scopes`, appointments, location IDs, and reference tables

2. Treat Airtable as an operational surface, not the long-term schema authority
- align when practical
- do not discard cleaner canonical structure just to imitate Airtable's flatter shape

3. Treat Square as a real integration source but not the whole model
- preserve compatibility with Square's `Orders` and `Order Items`
- overlay Maximus-specific fulfillment logic with normalized scope and scheduling records

4. Use adapters where needed
- Airtable flattening/expansion can happen in sync logic later
- selector formatting remains frontend responsibility

## Remaining Open Point

The only material point still not explicitly overridden in this discussion is customer-event modeling.

Current default:
- keep `customer_events` as its own canonical table

If that should collapse into `customers` later for operational simplicity, that can still be revisited, but it is not blocking the current Postgres/Xano direction.
