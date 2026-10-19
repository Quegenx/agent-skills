# Vertical slices

Minimize coupling between features and maximize it inside one. A slice holds everything one use case needs: the request type, validation, the logic, the data access, the response, the endpoint. Changing a feature means changing one place; adding one means adding code, not editing shared code. The codebase "screams" what the system does: the top-level names are business capabilities (`bookings/`, `payments/`, `disputes/`), not `controllers/`, `services/`, `repositories/`.

## Structure that grows with the feature count

**5 to 15 features:** one package, one `features/` folder, one file per use case.

```
src/
  features/
    orders/
      place-order.ts        <- request schema, handler, route, response: everything for this use case
      get-order.ts
      list-orders.ts
      cancel-order.ts
      routes.ts             <- registers this group's routes under one prefix
    customers/
      register-customer.ts
      get-customer.ts
  domain/                   <- entities and value objects several features share
    order.ts
    customer.ts
  db/                       <- client, schema, migrations
  shared/                   <- cross-cutting wrappers and middleware only; small and boring
    with-validation.ts
    with-logging.ts
tests/
  features/orders/place-order.test.ts      <- mirrors features/
```

- **Files are verbs:** `place-order.ts`, never `order-service.ts`. The folder listing is the feature list.
- **One use case per file.** A file that handles two operations is two slices pretending to be one.
- **A slice graduates to a folder** when it needs private helpers, has complex validation or several response types. The source preferences differ: roughly 300 to 400 lines in the 2025 article, roughly 150 to 200 in the 2026 article. Both are author heuristics; the old 150 to 300 range blended them without a source. Mix file and folder forms freely. [milan-jovanovic, vertical-slice-architecture-is-easier-than-you-think; vertical-slice-project-structure-dotnet]
- **A feature-local `shared/`** (`orders/shared/order-summary.ts`) holds what two or three sibling slices reuse. It's deleted with the feature, so no zombie code.
- **50+ features:** add a level for the domain area (`features/ordering/`, `features/catalog/`, `features/identity/`). These groups mirror bounded contexts and become modules if you move to a modular monolith. Signals you've reached this point: scrolling to find anything, two areas reaching into each other's entities, teams colliding in the same folders. Restructure in one pull request before the pain compounds; it's mechanical.
- **One package until you need compile-time enforcement.** Folder boundaries are cheap to change, package boundaries aren't; an import-graph rule gives most of the enforcement without splitting.

### Conventions that keep it healthy

- **No slice imports another slice.** If `place-order` needs something from shipping, it's a domain function, a domain event, or the other module's public API, never `import { ... } from "../shipping/create-shipment"`.
- **The route is the only entry point** to a slice's handler; export only what the route registration needs.
- **One route prefix per group:** `orders/routes.ts` owns `/orders`; nothing else registers under it.
- **Register explicitly or by convention, not both.** A `routes.ts` per group that lists its slices is greppable; discovering slices by scanning a folder (a file-based router, a glob import) saves the list but hides the wiring. Pick one per codebase.
- **Enforce it with an import-graph rule** (dependency-cruiser or `eslint-plugin-boundaries`): features may import `domain/`, `db/` and `shared/`, never a sibling feature. Two or three rules per area are enough.

## One slice

Request, endpoint, response (REPR): each operation is its own small unit with a typed input, one handler and a typed output, instead of a controller class collecting every order operation, its constructor dependencies and everyone's merge conflicts. Writes (POST, PUT, PATCH, DELETE) are commands; reads (GET) are queries.

```ts
// features/orders/cancel-order.ts
import { z } from "zod";
import { withValidation } from "../../shared/with-validation";
import { cancel } from "../../domain/order";
import type { Db } from "../../db/client";

export const CancelOrder = z.object({ orderId: z.string().uuid(), reason: z.string().min(1).max(500) });
export type CancelOrder = z.infer<typeof CancelOrder>;

export const cancelOrder = (db: Db) =>
  withValidation(CancelOrder, async (cmd, ctx) => {
    const order = await db.orders.findOwned(cmd.orderId, ctx.user.id);
    if (!order) return err({ code: "order.not_found" });
    const cancelled = cancel(order, cmd.reason, ctx.now());     // the rule lives in the domain, shared by every slice
    if (!cancelled.ok) return cancelled;
    await db.orders.save(cancelled.value);
    return ok({ id: order.id, status: cancelled.value.status });
  });

export const registerCancelOrder = (app: App, db: Db) =>
  app.post("/orders/:orderId/cancel", toHttp(cancelOrder(db)));   // toHttp maps the result kinds to status codes in one place
```

Each slice picks its own level of abstraction: a simple query selects straight into its response shape with no repository, a complex command goes through the domain model, a bulk operation runs one SQL statement. Consistency across slices is not the goal; fit is.

On Convex, a slice is one `query` or `mutation` with its argument validators in the same file; a rule several functions share lives in a plain domain module both import.

## Commands, queries and the wrappers around them

- **Don't share request or response types between neighbors.** `GetOrderResponse` and `CreateOrderResponse` look identical today; next week the read needs a tracking URL the create can't have, and a shared type grows a confusingly empty optional field. Duplication is cheaper than the wrong abstraction.
- **Source conflict, keep the strict rule above:** the 2025 shared-logic article says request/response ownership has no exceptions; the 2026 structure article permits a feature-local `OrderResponse` shared by `GetOrder` and `GetOrders`. That allowance concerns related sibling queries, not every contract with matching fields. [milan-jovanovic, vertical-slice-architecture-where-does-the-shared-logic-live; vertical-slice-project-structure-dotnet]
- **Separate read and write paths are allowed to diverge:** the command uses the domain model, the query reads a view, a denormalized table or a replica that only it knows about. Start with one database. If reads become eventually consistent, return the created resource from the command so the client doesn't read stale data.
- **Cross-cutting concerns are wrappers, applied once** (the function-wrapper pattern in the `domain-modeling` skill's EVENTS.md). Mark which ones apply: validation for commands, caching for selected queries, and transactions chosen by the operation's consistency contract. The source excluded queries, but read-only operations can need a shared snapshot; see [Transactions belong to the use case](LAYERS.md#transactions-belong-to-the-use-case). [milan-jovanovic, cross-cutting-concerns-in-vertical-slice-architecture]
- **Order is behavior, and order bugs are silent.** A sensible default from the outside in: logging (so everything is logged, including rejections), validation (so invalid input never starts a transaction or touches the cache), transaction, caching. Use the canonical [cacheable-result policy](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/CACHING.md#cacheable-results). Watch for wrapper sprawl; a wrapper that only one slice needs belongs in that slice.
- **Prefer wrappers and middleware over base classes** for handlers: a base class welds every slice to one shape.
- **Authorization** can be a wrapper driven by a permission declared on the slice, plus ownership checks inside the handler after loading. **Unexpected errors** go to one global handler at the HTTP boundary.

## Validation

- **The schema lives in the slice,** next to the handler it guards, and a wrapper runs it before the handler. Input validation is format and presence: a valid UUID, a positive quantity, a non-empty list, a length limit.
- **Business validation stays in the handler or the domain:** is this product in stock, may this customer order, does this code apply. These need current state, and the handler controls the transaction and the error type. Load what you check in one query (all requested products at once, not one per line item).
- **Database checks in the schema layer are a last resort** (Zod `refine` with an async lookup): uniqueness checked there races with concurrent requests anyway; the real guarantee is a unique constraint, and the handler maps the violation to a conflict.
- **Never encode the same rule twice** with different behavior in the schema and the domain.
- **One error shape:** validation issues become a 400 problem-details response with errors grouped by field; pick either throwing or returning results for validation failures and use it everywhere.
- Test each rule: schema tests run in microseconds, so cover every field.

## Shared code: three tiers

A `common/` or `utils/` package becomes a junk drawer where unrelated features couple through the same helper: one `OrderCalculations` holding cart totals (cart), historical revenue (reporting) and invoice formatting (invoicing) changes for three reasons and ties three features together.

Before sharing, ask: is it infrastructure or domain? How often does it change (yearly: share; with every feature: keep local)? Is it the third real occurrence with identical, stable logic? Then place it by its nature:

1. **Technical infrastructure, shared freely:** the database client, logger, auth middleware, the result type, validation and logging wrappers. Rarely changes for business reasons.
2. **Domain rules, pushed into the domain model:** `canBeCancelled(order)` and `cancel(order)` live with the order, so `cancel-order`, `get-order` (showing a cancel button) and `update-order` all apply the same rule. Different slices sharing one domain model is the normal case.
3. **Feature-family logic, kept local:** what only order slices use stays in `features/orders/shared/`.

**Across unrelated features,** most "sharing" is data access in disguise: `place-order` needs to know the customer exists, so it queries the customer table itself; it doesn't call into the customers feature. A genuine cross-feature rule (tax calculation for orders and invoices) is a domain service in `domain/`; a cross-feature side effect (notify on cancellation) is an event or the other module's public API.

### Duplication is about knowledge, not text

Two functions that look the same but would change for different reasons are not duplication; merging them couples two decisions. The tell is a boolean parameter added to a shared helper so one caller can behave differently. The real duplication to remove is one business rule implemented in several places (an approval threshold that drifted to three different values in three services). Extract when you can name the concept (`Money`, `TaxRate`, `approvalThreshold`), not when you can only call it `helper`.

## Complex slices

Start a slice as a straightforward script; when it grows, decompose it into smaller slices, extract functions, and push rules that belong to an entity down into the domain. A slice is the entry point and orchestration; the domain model handles the rules. Vertical slices work with rich domain models; they're not only for CRUD.

## Testing slices

Organize tests by feature, not by layer (container setup, data isolation and architecture checks in the `testing` skill's INTEGRATION.md): `place-order.test.ts`, not `order-repository.test.ts` plus `order-service.test.ts` plus `order-controller.test.ts` with a mock at every seam.

- **Schema tests** for each input rule: pure, microseconds.
- **Handler tests** for business logic without HTTP, using in-memory fakes for ports (the `testing` skill's recording fakes). An in-memory fake doesn't enforce constraints or run real SQL, so query-heavy slices skip this level.
- **Slice integration tests** through the real HTTP pipeline against a real database (a Postgres container started once per suite, data reset between tests): routing, parsing, validation wiring, the query and serialization in one shot. Because a slice is a whole feature, these carry more weight than in a layered codebase; have plenty.
- **Fake what you don't own, keep what you own real:** replace the payment gateway, email provider and third-party APIs with test doubles; keep your database, handlers and validation real. A passing slice test then means the feature works, minus only the call you can't control.
- **Architecture tests** keep slices from quietly importing each other.

## Adopting slices in a layered codebase

1. New features go into `features/` as slices; leave existing layers alone.
2. When you change an existing feature, move it as part of that change: its route, service method and repository method collapse into one handler.
3. Leave stable code nobody touches.
4. Delete layers as they empty: when `OrderService` has one method left, inline it and remove the class.

The two styles coexist during the transition; that inconsistency is fine and temporary. The same works for adopting feature folders inside an existing Clean Architecture project: organize the application layer by feature, the domain by aggregate, and the presentation mirrors the features.

## Prove it

State each wrapper's scope and order, distinguish a deliberate read snapshot from a blanket write wrapper, and identify which tagged response-sharing policy the project follows. File-splitting thresholds remain attributed preferences. [milan-jovanovic, cross-cutting-concerns-in-vertical-slice-architecture; vertical-slice-project-structure-dotnet]
