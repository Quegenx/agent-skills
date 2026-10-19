# Modular monolith

One deployable application, split into modules that each own a business capability, its data and a deliberate public surface. You get boundaries, team ownership and the option to split later, while keeping in-process calls, one deployment, local transactions when you truly need them, and simple debugging. A module is a bounded context (the `domain-modeling` skill's STRATEGIC.md), not a vertical slice: modules are the system's boundaries, slices organize code inside one.

## Shape in code

```
src/
  modules/
    ordering/
      public.ts            <- the only file other modules may import: use-case-shaped functions, contract types, event types
      features/  domain/  infrastructure/      <- internal; any micro architecture (slices, layers)
    catalog/
      public.ts
      ...
  shared-kernel/           <- small, governed, depends on nothing (below)
  app.ts                   <- composition root: wires each module, registers routes and event handlers
```

- **Only `public.ts` is importable** from outside the module; enforce it with an import-graph rule in CI. In a monorepo, a package per module with an `exports` map gives the same guarantee at build time.
- **Each module picks its internal architecture.** Ticketing can be layered around a rich model while notifications is three small slices; the boundary protects everyone else either way.
- **Deployment stays flexible:** because modules only meet at their public APIs, the same code can run as one process or, for a season, with a hot module (bookings, payments during holidays) deployed as extra instances of its own, and merged back afterwards.
- **4 to 10 modules** is typical. One module with more than 15 to 20 entities is probably two.

## Drawing boundaries

- **Follow the language.** Where the meaning of a word changes, a boundary is close: ordering's `OrderLine` keeps a snapshot of name and price at order time; catalog's `Product` is the live, editable item. They're two concepts, so two types, not duplication.
- **Group what changes together.** List the capabilities, group them by which change together, then test the grouping against recent and planned changes: each should land in one module. Cut by capability, never by entity ("customer module", "product module") or by technical layer ("API module", "data module").
- **Chatty modules are one module.** If ordering calls pricing on every operation and they always change together, merge them.
- **Let consistency draw the line.** If two things must be correct at the same instant (a dealer changes a configuration and the price must be right on save), they belong on the same side. Eventual consistency across a boundary is a bet that no requirement will ever demand immediate correctness there; make it on purpose.
- **Start coarse.** You draw boundaries when you know least about the domain. Splitting a coarse module once the seam is obvious is cheap; merging two that have grown apart is expensive.
- **Treat the cheap-looking decision as the expensive one.** A module boundary costs nothing on the day it's drawn, so it gets little deliberation; the cost arrives later, compounding, one reasonable feature at a time. Revisit boundaries on a schedule instead of filing them as settled.
- **Watch for a boundary that has stopped being one:** one module constantly reads another's data, nearly every new feature reaches across, event handlers exist only to keep the two in sync, and the first "this must be correct immediately" hotfix lands. Each looks normal alone; together they say merge.

## Public APIs

The public API is intentional, explicit coupling: it is the contract, it controls who depends on what, and it's where change is managed.

- **Start with nothing public** and expose what a real caller needs.
- **Shape it by use case, not CRUD:** `getOrderForShipping(orderId)` returning exactly what shipping needs, not `getOrder` returning the whole aggregate or a generic `updateOrder`.
- **Contracts are plain data:** IDs, primitives, small DTOs and event payloads, never domain entities. Exposing an entity welds the two models together.
- **Treat it like an external API** once it's used: additive changes, deprecate before removing (the `api-design` skill).

## Data isolation

[milan-jovanovic, schema-per-module-vs-database-per-module; https://www.postgresql.org/docs/18/glossary.html; https://www.postgresql.org/docs/18/app-pgdump.html; https://www.postgresql.org/docs/18/app-pgrestore.html]

Rules: a module reads and writes only its own tables; no table is shared; joins happen only inside one module.

Levels, weakest to strongest:

1. **Table prefixes or naming conventions:** nothing enforces them.
2. **Schema per module** in one database (`ordering.orders`, `catalog.products`): real isolation with little operational cost. **Start here.**
3. **Database per module:** a separate logical database and its operational boundary. Resource isolation needs a separate instance or capacity boundary; PostgreSQL can manage several databases in one instance. The source equated separate databases with physical isolation. [milan-jovanovic, schema-per-module-vs-database-per-module; https://www.postgresql.org/docs/18/glossary.html]
4. **A different store per module** where the data shape demands it (a document or search store for one module), which is also database per module.

**Make the database enforce the boundary** with a role per module that can use only its own schema, so a cross-module query fails loudly instead of working silently:

```sql
create schema ordering;
create role ordering_owner nologin;                    -- owns the tables; migrations run as this role
create role ordering_app login password '...';         -- the module's runtime role
alter schema ordering owner to ordering_owner;
grant usage on schema ordering to ordering_app;
alter default privileges for role ordering_owner in schema ordering
  grant select, insert, update, delete on tables to ordering_app;
alter role ordering_app set search_path = ordering;
-- a new schema grants nothing to other roles, so ordering_app gets "permission denied for schema catalog"
```

- **Migrations per module:** each module owns its migration folder and its own migration history table, ideally inside its schema, so modules add and apply migrations independently. With Drizzle Kit, a config per module with `schemaFilter` for push and pull and `migrations: { schema: "ordering", table: "__migrations" }`; other tools have an equivalent setting.
- **Supabase:** server-side modules can connect with their own roles over a direct connection; tables exposed through the Data API stay protected by RLS (the `secure-coding` skill's TENANCY.md). Expose module schemas to the Data API only on purpose.
- **Convex:** a module's tables are touched only by its own functions; other modules call its exported functions. Enforce the "only these files touch these tables" rule with the import-graph check.

**When a module needs another's data:**

- call its public API when it needs current data and can accept the dependency on that module being available;
- keep a local read model updated from its integration events when it needs the data often or must work while the owner is down;
- for reporting across modules, a read-only view owned by the source module and granted to a reporting role. Treat the view as a published contract; it's replaced by an API or a replicated read model if the modules ever move to separate databases.

| | Schema per module | Database per module |
|---|---|---|
| Cross-module transactions | Possible; an escape hatch that couples locks and blocks extraction | One database per ordinary PostgreSQL connection; externally coordinated 2PC is supported, so outbox and sagas are alternatives rather than forced |
| Operations | One database to provision, monitor and back up | One per module, plus their connection pools (watch the total connection count) |
| Performance isolation | Shared instance resources | Separate logical databases can still share instance resources; independent capacity needs a separate boundary |
| Backup and restore | Selected-schema logical dump/restore is possible, with dependency limitations | Per-database logical dump/restore; physical recovery scope is separate |
| Local development | One connection string | Several databases (a Compose file) |
| Path to a service | A data copy first | Already separated |

The source and old matrix called cross-module transactions impossible across separate databases. PostgreSQL documents [one database per connection](https://www.postgresql.org/docs/18/manage-ag-overview.html), while [PREPARE TRANSACTION](https://www.postgresql.org/docs/18/sql-prepare-transaction.html) supports atomic global transactions through an external transaction manager. This facility is intended for transaction managers, not ad hoc application use. [milan-jovanovic, schema-per-module-vs-database-per-module]

The source and old matrix promised independent resources and all-or-nothing schema recovery. PostgreSQL documents [one instance managing all databases in a cluster](https://www.postgresql.org/docs/18/glossary.html), [selected-schema dumps and their dependency limitation](https://www.postgresql.org/docs/18/app-pgdump.html), and [selected-schema restores](https://www.postgresql.org/docs/18/app-pgrestore.html). Logical recovery is distinct from physical/PITR recovery. [milan-jovanovic, schema-per-module-vs-database-per-module]

Move a module to its own database when it needs independent scaling, its own restore, relief from a noisy neighbor, or is about to become a service. If nothing queries across modules, that move is a data copy plus a connection string change.

## Communication between modules

| | Synchronous call to the public API | Integration events |
|---|---|---|
| Good for | Queries that need current data, commands that need an immediate answer | Notifying others that something happened; work that may lag |
| Cost | Availability coupling: if the callee fails, the caller fails | Eventual consistency, duplicate deliveries, more moving parts |

- **In-process events are decoupled code, not decoupled runtime.** A publish that awaits every handler in the same call adds their latency to the request and propagates their exceptions; one failing subscriber fails the publisher. For reactions that must not block or break the operation, write the event to an outbox in the publisher's transaction and dispatch it after commit.
- **Grow in steps:** in-process dispatch first; an outbox per module (in its own schema) once losing an event matters; a broker when a module leaves the process. The outbox processor stores the event's type name, retries with a count and last error, dead-letters after N attempts, and uses the event ID as the consumers' deduplication key (the `messaging` skill's OUTBOX-INBOX.md). The source promised save ordering from occurrence timestamps with one processor. That does not establish commit order under concurrent writers, and equal sort values need a tie breaker. Use the canonical [ordering contract](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/messaging/FAILURE-AND-ORDER.md#ordering-per-aggregate-not-global), including when processors compete. [milan-jovanovic, event-driven-communication-modules; https://www.postgresql.org/docs/18/queries-limit.html; https://www.postgresql.org/docs/18/transaction-iso.html]
- **Event contracts** live with the publishing module's public surface (or a shared contracts package; pick one convention): versioned, minimal, primitives only, no domain types. Domain events stay inside the module; an integration event is a deliberate translation of one (the `domain-modeling` skill's EVENTS.md).
- **A direct call still couples.** Replacing it with an event changes the code dependency; failure isolation depends on dispatch, as the in-process rule above explains. The source's extraction advice and old line implied the event alone isolated notification failures. [milan-jovanovic, refactoring-overgrown-bounded-contexts-in-modular-monoliths; event-driven-communication-modules]

## Work that spans modules

Treat each module boundary as a transaction boundary. One transaction across two schemas is possible in one database, but it holds locks on another module's tables and makes extraction a rewrite.

- **Two modules:** usually a direct call with explicit error handling, or a local commit plus an event.
- **Three or more modules, steps that fail independently, a process that runs for minutes or days, or operations needing to see where an instance is stuck:** an orchestrated saga on a persisted state machine (states like `started`, `inventory_reserved`, `payment_processed`, `shipment_scheduled`, `completed`, `compensating`, `failed`). Design, compensations and idempotency are in the `domain-modeling` skill's EVENTS.md and the `messaging` skill's FAILURE-AND-ORDER.md. Points specific to a modular monolith:
  - the participating modules don't know the saga exists; it uses their public APIs and listens to their integration events;
  - the saga stores in its own state what later steps need (the order total captured at the start), rather than asking other modules again;
  - commit the state transition and outgoing command intent together; persistence followed by a separate send leaves a crash gap. The source's persist-before-command shorthand omitted that contract; use the canonical [saga plumbing](https://github.com/Quegenx/agent-skills/blob/main/skills/architecture/domain-modeling/EVENTS.md#sagas-and-process-managers). [milan-jovanovic, saga-pattern-modular-monolith; https://learn.microsoft.com/en-us/azure/architecture/patterns/compensating-transaction]
  - each event type must be routed to the saga; a missing registration leaves instances stuck silently, so add a test that every event the saga handles is registered;
  - a version column on the saga row with retry on conflict handles concurrent events for one instance.

## Shared kernel

A middle path between duplicating identical code in every module and a `common` package that grows until modularity is gone: a small, explicit, governed set of types every module may depend on.

- **Belongs:** base types for entities and aggregates if you use them, the `Result` and error types, the domain event and integration event interfaces, branded ID types that genuinely cross modules (`CustomerId`), the unit-of-work port.
- **Doesn't belong:** module-specific logic (the `Order` entity is ordering's), infrastructure (database, HTTP clients, logging helpers), utilities one module uses, request and response DTOs. Rule: if removing a type breaks only one module, it doesn't belong.
- **Zero runtime dependencies.** If it needs the ORM or a framework, that code belongs in a shared infrastructure package; the kernel declares an interface, the infrastructure package implements and registers it.
- **Governance:** changes reviewed by every consuming module's owner; additive only (add new types, don't rename or remove); resist convenience helpers (a `toSlug` string helper is not a cross-module contract; an `IntegrationEventHandler<E>` interface is).
- **Governance conflict:** the additive-only source policy above protects existing consumers. The supplied project rule removes obsolete paths unless compatibility requires them; retained paths are deprecated and point to their replacements. Keep these views tagged and resolve compatibility before choosing removal or retention. [milan-jovanovic, shared-kernel-pattern-modular-monolith; owner AGENTS.md, Architecture]
- Event payload types can live either in the kernel or in each module's public surface; the second scopes each contract to its owner at the cost of more imports. Pick one.

## Refactoring an overgrown module

Signs: everyone is afraid to touch it, one entity serves four unrelated use cases, files past a thousand lines, and one subdomain's changes keep breaking another's.

1. **Find the seams:** group functions and tables by subdomain. Do they change together? Use different vocabulary? Belong to different people?
2. **Extract the lowest-risk piece first,** usually a pure side effect such as notifications: new module, public API, then use the [dispatch contract](#communication-between-modules) when choosing events for failure isolation. The source's event-only shorthand omitted whether handlers still run on the caller's path. [milan-jovanovic, refactoring-overgrown-bounded-contexts-in-modular-monoliths]
3. **Move the data after the code:** the new module gets its own schema; move its tables over gradually; during the transition both sides may read, then switch writes when confident; cross-module reads go through the public API, events or a view.
4. **Repeat** for the next area, one module per release, and lock each boundary in with the import-graph rule, separate models, public APIs and database roles.

## Prove it

State which instance supplies each module's resources and which recovery scope is available; distinguish timestamp order from the required event order; and show that a failed asynchronous reaction cannot invalidate a committed business operation. Saga progress and command intent use the canonical atomic handoff, including the crash between recording progress and sending. [https://www.postgresql.org/docs/18/glossary.html; milan-jovanovic, event-driven-communication-modules; saga-pattern-modular-monolith]
