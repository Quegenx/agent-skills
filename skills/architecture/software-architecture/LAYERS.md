# Layers: Clean Architecture in TypeScript

Clean, onion and hexagonal (ports and adapters) architecture are the same idea with different drawings: the business rules sit in the middle and depend on nothing; everything else depends inward. Hexagonal is the least prescriptive (driving adapters on one side, driven on the other), onion adds a ring for domain services, Clean names use cases as a layer and states the dependency rule explicitly. Don't argue about names; agree on the arrows.

The layers are about dependencies, not folders or packages. One package with four folders and an import-graph rule is a valid Clean Architecture; four packages where the application imports the ORM are not.

## What lives where

| Layer | Contains | Depends on |
|---|---|---|
| **Domain** | Entities, value objects, domain events, domain services, domain errors, enums with their allowed transitions, repository interfaces (or put them in application; pick one place) | Nothing: no framework, ORM, logger or HTTP types, ideally no packages at all |
| **Application** | Use cases (commands and queries), the ports they need (repositories, clock, email, current user, payment), application errors, cross-cutting wrappers | Domain only |
| **Infrastructure** | Adapters implementing the ports: database access and schema mapping, HTTP clients for external APIs, broker, object storage, cache, identity provider, typed configuration | Application and domain |
| **Presentation** | The entry points: HTTP routes, Convex functions, job and queue handlers, CLI commands; turns input into commands and results into responses | Application (and domain types it passes through) |

The **composition root** (app startup, an Effect `Layer`) references everything and wires concrete adapters into use cases; that's by design, not a violation. A service locator called from inside domain code is a runtime violation even when the imports look clean. Mechanics of ports, configuration as a port and breaking cycles: the `refactoring` skill's DEPENDENCIES.md.

Direction is about source code, not runtime flow. At runtime the use case calls the repository; in source, the repository imports the interface the use case declared. That inversion is the whole trick.

## Domain

- Rules and state together: entities with private construction through factories, guarded transitions returning results, value objects that normalize and validate on creation (the `domain-modeling` skill's MODEL.md).
- Persistence-ignorant: no ORM decorators or base classes, no table names; mapping to rows happens in infrastructure.
- No logging and no external calls: raise a domain event and let an application handler log or act.
- Organize by aggregate (`domain/orders/`, `domain/customers/`), not by pattern (`entities/`, `value-objects/`).
- A domain error catalog with stable codes (`order.cannot_cancel_shipped`) that the presentation layer can map.

## Application

- **One use case per operation,** named in the business's words: `placeOrder`, `cancelOrder`, `registerCustomer`, never `updateOrder` with a status field or a shared create-and-update command.
- **Thin handlers:** load, call the domain, save, publish. Around 30 to 40 lines; past that, logic belongs on an entity or in a domain service. A handler that sets fields and checks state itself is a transaction script: fine for a simple area, a smell where rules repeat.
- **Declare ports here,** in the language of the use case (`PaymentGateway.charge(amount, reference)`), not the vendor's.
- **Commands and queries differ** (the `domain-modeling` skill's EVENTS.md on CQRS): commands go through aggregates; queries project straight to the response shape (a select of the needed columns, a view, an RPC function) instead of loading an aggregate and mapping it. A query port can be a read-model function returning DTOs; exposing the ORM's query builder to the application leaks infrastructure types and is a deliberate trade-off if you make it.

### Transactions belong to the use case

The business decides what must succeed or fail together (move stock from one warehouse to another: deduct, add and record the movement, or none of it). So the use case owns the boundary; infrastructure implements it; repositories and routes never decide it. A repository sees one aggregate and can't know whether it's part of a larger unit; a route knows HTTP, not atomicity.

```ts
// application/ports.ts
export interface UnitOfWork {
  run<T>(work: (tx: Repositories) => Promise<T>): Promise<T>;   // commits if work resolves, rolls back if it throws
}

// application/transfer-stock.ts
export const transferStock = (uow: UnitOfWork) => async (cmd: TransferStock) =>
  uow.run(async ({ stock, movements }) => {
    const from = await stock.get(cmd.fromLocation, cmd.sku);
    const to = await stock.get(cmd.toLocation, cmd.sku);
    if (!from || !to) return err("stock.not_found");
    const removed = from.remove(cmd.quantity);
    if (!removed.ok) return removed;           // nothing written yet; a failure after a write must throw to roll back
    to.add(cmd.quantity);
    await stock.save(from);
    await stock.save(to);
    await movements.record(cmd);
    return ok(undefined);
  });
```

- **Repositories never commit on their own.** They take the transaction they're given; one that opens its own makes composition impossible.
- **The outbox row goes in the same transaction** as the state change, which is what solves the dual write (the `messaging` skill's OUTBOX-INBOX.md).
- **Every writer must use the same transaction.** Raw SQL or a second client on its own connection commits independently, and the atomicity you think you have isn't there.
- **No external calls inside the transaction.** A payment API call while row locks are held stretches every lock across a network round trip; call it before or after, with an idempotency key.
- **Don't wrap every request or every command in a transaction by default.** A blanket wrapper draws the boundary at the transport instead of the use case. Make the boundary explicit; read-only operations may also need a shared snapshot. The source said never wrap queries, but PostgreSQL documents [read-only Repeatable Read transactions](https://www.postgresql.org/docs/18/transaction-iso.html#XACT-REPEATABLE-READ). See the canonical [isolation rules](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/postgres/CONNECTIONS.md#transactions). Avoid an ambient transaction hidden in `AsyncLocalStorage` that repositories pick up implicitly: nobody can see where the boundary is, and work started outside that async context (a callback, a fire-and-forget promise) silently runs outside it. Pass the transaction explicitly. [milan-jovanovic, cross-cutting-concerns-in-vertical-slice-architecture]
- **Platform notes:** a Convex mutation is already one serializable transaction, so the use case is the mutation. `supabase-js` has no multi-statement transactions; put an atomic multi-table write in a Postgres function called with `rpc`, or run the use case on the server with a direct Postgres connection (`postgres`, `pg`, Drizzle, Kysely `transaction()`).

### Authorization and the current user

- **Authentication** happens at the edge (verifying the token, the `secure-coding` skill's AUTH.md). **Authorization** that depends on the business belongs to the use case: a route-level "must be logged in" is a coarse gate only, and jobs, queue consumers and scripts don't pass through routes.
- **Expose the caller through a small port:** `currentUser(): { id: UserId; permissions: ReadonlySet<Permission> }`, implemented in infrastructure from the verified token. It throws when there's no user; it never returns an empty ID. A fallback like `claims.sub ?? ""` turns a missing claim into a query for nobody, or worse, a match on rows with an empty owner.
- **Three places a check can live:** in the handler (explicit, easy to read), declared on the command and enforced by one wrapper (uniform, easy to audit), or in the domain when it's about ownership of a specific resource (`order.assertOwnedBy(user)`). Ownership checks happen after loading the resource; a resource the caller may not see is "not found".
- **Background work has no request.** Put the acting user's ID in the job payload and check it in the use case, or use an explicit system identity with its own permissions. Never let a job run as "whoever was last logged in".

### Errors

- The **domain** rejects invalid transitions with results (or throws only for bugs: an invariant that should be impossible).
- The **application** returns typed results for expected outcomes (not found, conflict, forbidden, validation), the `refactoring` skill's ERRORS.md.
- **Infrastructure** exceptions (connection lost, timeout) propagate; don't catch them to return a fake success.
- The **presentation** maps error kinds to status codes in one place (validation 400, forbidden 403, not found 404, conflict 409, anything else 500) with one response shape (problem details), and a global handler logs unexpected errors in full and returns a generic message. No try/catch for control flow inside handlers.

### Logging

- **Domain:** none. **Application:** one wrapper logs each use case's name, duration, a warning above a threshold (for example 500 ms) and the error code of a failed result; it doesn't catch exceptions, so they're logged once, by the global handler. Log the use case name and chosen fields, not the whole command: a destructured request logs passwords and tokens.
- **Infrastructure:** log calls to external systems (target, duration, outcome). **Presentation:** request logging with method, route, status, duration, user ID and correlation ID.
- **Levels mean something:** error for failures someone must look at, warning for degraded but handled (slow use case, retry), information for business events and request summaries, debug off in production.
- Log one failure once, where it's handled, not at every layer it passes through (structured fields and trace correlation: the `observability` skill).

### Caching

The **decision** (what may be cached, for how long, what invalidates it) is application policy; the **mechanism** (Redis, in-memory) is infrastructure behind an application-owned port. The domain never knows.

- Either a decorator around a repository or read function, or a query that declares its cache key and lifetime and one wrapper that honors it. Cacheable outcomes and the tagged negative-cache conflict are defined in [Cacheable results](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/CACHING.md#cacheable-results).
- Invalidate from application code that reacts to the change (an event handler deleting by ID or prefix), and always set a TTL as the backstop.
- Cache response DTOs on the read side, not entities (private state doesn't survive serialization cleanly).
- Test: flushing the cache must change only latency, never results. Stampedes and TTL sizing are in the `performance-and-caching` skill.

### Mapping

Map between shapes only when they differ: the API contract differs from the entity, internals must stay hidden, or the entity has behavior that doesn't serialize. Don't map identical shapes. Queries project directly into the response (select the columns, return the DTO); commands are their own input types; write mapping as plain functions, explicit and greppable, rather than reflection-based auto-mappers whose errors appear at runtime.

## Infrastructure

- One adapter per concern (`infrastructure/persistence/`, `infrastructure/payments/`, `infrastructure/email/`), not one file that knows everything. Schema mapping per table, not one giant schema function.
- Converts at the boundary: row to entity, vendor DTO to domain type, enum string to typed value, with an explicit rejection for unknown values.
- Typed, validated configuration built at startup (a Zod or Effect `Config` schema), passed in as plain values.
- Tested against real dependencies (a Postgres container, the vendor's sandbox), because mocks can't prove SQL or serialization.

## Presentation and other entry points

- Route handlers, Convex functions, cron jobs and queue consumers are all **thin shells**: parse input, build the command, call the use case, map the result. A job that contains business logic hides a second implementation of the rule. Because the job only sends a command, the same use case can also run from an admin endpoint or a script ("rerun last night's billing for this customer") without copying anything.
- Jobs get a fresh scope (connection, unit of work) per run, catch and report failures per run so one failure doesn't stop the scheduler, respect cancellation, and don't overlap with themselves across instances (the `background-jobs` skill). Pure infrastructure loops (an outbox publisher) are fine as infrastructure.

## The cost of abstractions

Every interface is a loan: it's paid back only if it absorbs a change.

- **Abstract policies, not mechanics.** Policies change: which payment provider, which email vendor, retry strategy, a third-party API's shape. Mechanics are stable: your query builder, `fetch` configuration, JSON serialization. A wrapper around an external API that centralizes base URL, auth and parsing earns its keep; a `UserService` whose every method forwards to a `UserRepository` doesn't.
- **Wait for the second implementation** before extracting an interface, except at true boundaries (external systems, the clock, randomness, the file system), where tests need the seam.
- **Concrete inside, interfaces at the edges.** Inside a module, call the query builder and the domain directly.
- **A repository that grows a method per query** (`getActiveUsers`, `getUsersByRole`, `searchUsers`...) has stopped being an abstraction; on the read side, write the query where it's used, and move a repeated one into a named function.
- **Pragmatic split:** repositories behind ports on the command side, where the domain needs protecting and tests need fakes; direct, optimized queries on the read side.
- **Removal test:** if deleting a layer makes the code simpler, it was costing more than it earned. Find its real callers, inline it, delete it, then simplify the callers to use the concrete API.

## Anti-patterns to review for

1. Infrastructure in the domain: ORM decorators, `process.env`, logger imports.
2. Fat use cases making business decisions that belong on entities.
3. Interfaces for everything, including helpers with one implementation.
4. One giant infrastructure module mixing persistence, email and payments.
5. The application importing infrastructure (often through a "convenient" helper), creating a cycle.
6. Mapping mania: three DTOs per entity, identical shapes copied field by field.
7. The full layer stack for a simple CRUD area.
8. Queries that load aggregates just to map them to a response.
9. No architecture tests, so the rules erode one shortcut at a time.

## When to use it, and when not

Use explicit layers when the domain has rules that span entities, invariants that must always hold, calculations or state machines, or rules that change independently of infrastructure; when the project lives for years; when several teams share the codebase; when testability is a hard requirement (finance, healthcare, regulated industries). Skip them for CRUD apps, prototypes, small focused services (send email, resize images), and internal tools you'd rather replace than maintain: a single project with feature folders is faster and just as maintainable. Mixed answers: start simple and migrate when the signs appear.

## Prove it

Every writer participates in the use case's transaction; each read-only operation states whether it needs one snapshot across statements; and non-HTTP entry points enforce the same business permissions. The old never-for-queries rule must not reject a deliberate read snapshot. [https://www.postgresql.org/docs/18/transaction-iso.html; milan-jovanovic, authentication-authorization-clean-architecture]
