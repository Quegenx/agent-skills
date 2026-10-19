# Events, workflows and CQRS

## Domain events and integration events

A **domain event** is an immutable fact that already happened in the domain, named in the past tense (`OrderPlaced`, `CourseCompleted`). It lets other parts react without the entity calling them, so the core rule stays separate from its side effects.

| | Domain event | Integration event |
|---|---|---|
| Audience | The same context | Other contexts or services |
| Transport | In-process | A broker or queue |
| Timing | Same or later transaction | Always asynchronous |
| Contract | Internal, can change freely | A published, versioned contract (the `api-design` skill) |

A domain event handler often turns a domain event into an integration event. Don't publish every internal event onto a bus.

**Design choices:** immutable; past tense; thin (IDs only, handlers load what they need) or fat (the data handlers need, so they don't query back) chosen per event; an event ID and an occurred-at time.

**The entity records events; it doesn't dispatch them:**

```ts
export abstract class AggregateRoot {
  #events: DomainEvent[] = [];
  protected record(event: DomainEvent) { this.#events.push(event); }
  pullEvents(): DomainEvent[] { const e = this.#events; this.#events = []; return e; }
}

// in Order
complete(): Result<void, OrderError> {
  if (this.#status !== "confirmed") return err({ code: "order.not_confirmed" });
  this.#status = "completed";
  this.record({ type: "OrderCompleted", eventId: crypto.randomUUID(), orderId: this.id, customerId: this.customerId, total: this.total });
  return ok();
}
```

Clear events only after they've been captured for storage or dispatch.

### When to dispatch

- **Before the commit, inside the same transaction:** handlers' changes commit or roll back together (immediate consistency), but the transaction grows and any handler failure fails the whole operation.
- **After the commit:** separate transactions and eventual consistency. Dispatching straight from memory after saving risks a crash between the save and the handlers: the change is saved and the side effect lost.
- **After the commit, through an outbox (the reliable default):** write the business changes and the events (as outbox rows) in one transaction; a worker delivers them afterwards and retries. Nothing is lost, at the cost of a short delay.

**In Supabase/Postgres:** do the change and `insert into outbox (...)` (or `pgmq.send`) in one database function called with `rpc`, so both commit or neither does; a worker or scheduled function drains the outbox (the `background-jobs` skill's WORKERS.md).

**In Convex:** a mutation is a transaction, and `ctx.scheduler.runAfter(0, internal.loyalty.awardPoints, { orderId })` inside it is scheduled only if the mutation commits. That is the outbox, built in. A scheduled mutation runs once; a scheduled action can fail without retry, so have actions record their outcome through a mutation.

### Handlers

- **Every handler is idempotent:** delivery is at least once. Record the processed event ID in the same transaction as the handler's change (a `processed_events` table with a unique key), and skip duplicates. A check-then-insert is not enough under concurrent delivery; use the unique constraint.
- A handler that updates another aggregate runs in its own transaction and must load it with concurrency protection.
- Decide what happens when the target is missing (a loyalty account that doesn't exist): retry, park for review, or create it. Never drop silently.
- Side effects like email go in handlers, so the command commits fast and the email retries on failure.

The implementation side (outbox and inbox tables and processors in Postgres, idempotent consumers keyed per consumer, choosing a broker, per-aggregate ordering) is in the `messaging` skill.

## Sagas and process managers

Before designing one, check that you need it: data in one database wants a transaction, boundaries you own can be merged, and a flow with nothing to undo only needs publish/subscribe (the `messaging` skill's FAILURE-AND-ORDER.md).

When one business operation spans several services or contexts, there is no shared transaction. Two separate decisions:

- **How to coordinate:** a central coordinator that decides the next step (orchestration, a process manager), or each participant reacting to the previous one's event (choreography).
- **How to handle partial failure:** retry transient failures, compensate completed steps where the business allows, or escalate to a person.

A **saga** is the business transaction: local commits, each with a **compensating action** (reserve stock / release stock; capture payment / refund; create shipment / cancel shipment). A compensation is not a rollback: the payment really was captured, and the refund is a second real transaction on the customer's statement. The system ends in a new consistent state that acknowledges the attempt.

A **process manager** is a coordination component: it stores each workflow instance's state, consumes events and sends the next command, and is the one place the flow (branches, timeouts, retries, escalation) is written down. It doesn't require compensation; an approval workflow is a process manager too. An orchestrated saga usually runs on a process manager, which is why the two names get mixed up.

**Where is order 4712 stuck?** A process manager's stored state answers that: current step, last transition, deadline. In choreography, progress is implicit in which events fired across services; an operations view of it has to be built deliberately.

**Choosing:** two or three linear steps with low stakes: choreograph. Branching, timeouts, human steps, money, or anything operations must inspect and unstick: a process manager, with the compensations defined next to the flow they undo.

```ts
type FulfillmentState = {
  orderId: OrderId;
  step: "awaiting_stock" | "awaiting_payment" | "awaiting_shipment" | "compensating" | "done" | "needs_attention";
  paymentId?: string;
  deadline: string;
  version: number;
};
```

**The plumbing that makes it correct:**
- **State and outgoing commands commit together** (outbox). Saving state without sending, or sending without saving, corrupts the workflow.
- **Deduplicate incoming events** (an inbox of processed message IDs, in the same transaction) and **reject invalid transitions**: a duplicate `PaymentCaptured` after moving to `awaiting_shipment` must not create a second shipment. A *different* payment ID for the same step is a discrepancy to investigate, not a duplicate to ignore.
- **Concurrent deliveries:** a version check per workflow instance; on conflict, reload and re-evaluate the event rather than resending the earlier decision.
- **Participants are idempotent:** reserving stock twice for one order is a no-op. Use a stable operation ID per step; a timeout after a payment capture doesn't prove it failed, and a refund must reference the original operation.
- **Persist deadlines, attempt counts and a recovery state** for compensations that can't complete automatically. A compensation is a business action that can fail itself; give it retries, visibility and an escalation path.
- **Compensations have business rules** (partial refunds, fees, time limits) that domain experts define, not the messaging library.
- **Order steps so the hardest to undo come last.** Some can't be undone (an email sent, a report filed with a regulator); place that pivot point deliberately.

Workflow libraries often call their persisted state machines "sagas"; most of them are process managers, which also happen to be the natural place to run a saga's compensations, so in practice they play both roles.

On Convex, a workflow component or a mutation-driven state table with scheduled steps covers this; on Supabase, a workflow table plus outbox and workers.

## Event sourcing

Store the sequence of events as the record of truth and derive current state by replaying them, instead of storing only the latest state. A bank account keeps every deposit and withdrawal; the balance is computed.

**Where it fits:** order and inventory histories, financial transactions, sensor data analyzed over time. **What it buys:** a full audit trail; the state at any past point (debugging by replay); history for analysis and for features you didn't anticipate. **What it costs:** a real learning curve; replay gets slower as streams grow; read models are eventually consistent; event schemas must stay readable forever. A state-based aggregate is enough when only current state matters. Event sourcing is a persistence choice, not a requirement of domain modeling; start with one small, history-heavy area.

**The aggregate:** commands validate and raise events; `apply` updates state from an event; replay calls only `apply`.

```ts
type OrderEvent =
  | { type: "OrderCreated"; orderId: string; customerId: string }
  | { type: "LineItemAdded"; orderId: string; productId: string; quantity: number; unitPriceCents: number }
  | { type: "OrderConfirmed"; orderId: string; confirmedAt: string }
  | { type: "OrderCancelled"; orderId: string; reason: string };

class Order {
  version = -1;                 // last committed event: -1 none, first event is 0
  pending: OrderEvent[] = [];
  status: "draft" | "confirmed" | "cancelled" = "draft";
  totalCents = 0;
  lineCount = 0;

  confirm(now: string) {
    if (this.status !== "draft" || this.lineCount === 0) throw new Error("ORDER_NOT_CONFIRMABLE");
    this.raise({ type: "OrderConfirmed", orderId: this.id, confirmedAt: now });
  }
  private raise(e: OrderEvent) { this.apply(e); this.pending.push(e); }
  private apply(e: OrderEvent) {
    switch (e.type) {
      case "LineItemAdded": this.totalCents += e.quantity * e.unitPriceCents; this.lineCount++; break;
      case "OrderConfirmed": this.status = "confirmed"; break;
      // ...every event type; an unknown type throws
    }
  }
}
```

- **`apply` is deterministic:** no clock, no lookups, no I/O, no business validation, so the same history always gives the same state. Timestamps and prices are already in the events.
- **Replay checks the structure:** the stream starts with the creation event, versions have no gaps, every event belongs to this stream, there's no second creation event, unknown types fail.
- **The version advances only after a successful append.** Raising events changes working state, not the committed version.

**Appending with an expected version** is the concurrency control:

```sql
create table events (
  stream_id uuid not null,
  version int not null,
  type text not null,
  schema_version int not null,
  data jsonb not null,
  global_position bigint generated always as identity,
  primary key (stream_id, version)
);
```

Insert all of a command's events in one transaction at `expected + 1, expected + 2, ...`. Two writers that loaded version 3 both try to write version 4; the primary key lets only one succeed. Treat that specific constraint violation as a conflict (reload, re-evaluate the command, which may no longer be valid), and other database errors as what they are. Use one aggregate instance per command.

**Projections** turn events into query-friendly views:
- handle every event that affects the view (forgetting `LineItemAdded` shows every total as zero);
- **idempotent:** skip events at or below the view's recorded version; **reject gaps**;
- save the view and its checkpoint in the same transaction, and acknowledge delivery only after that commit;
- a projection over all streams needs the event store's committed-stream checkpoint contract, since versions are ordered only within a stream. The illustrative identity column above does not establish that contract: PostgreSQL sequence advances are visible independently of commit. A reader advancing past a higher committed identity can miss a lower value that becomes visible later. This is a static inference, not a reproduced execution; the old global-position guidance omitted the distinction. Use the established event-store recommendation below. [https://www.postgresql.org/docs/18/transaction-iso.html]
- projections can be rebuilt from the history, which is one of the main benefits.

**Evolving events:** store stable event type names and a schema version in each record (never a language-specific class name); never change the meaning of an old event; read old shapes with upcasters or tolerant handlers. A network failure after a commit leaves the outcome ambiguous: give commands IDs and deduplicate retries.

**Snapshots** cache an aggregate's full state *and its committed version*; loading restores the snapshot, then replays only later events, still checking for gaps. Starting replay from the beginning after a snapshot double-applies events and breaks the version check. Snapshots carry their own format version and are disposable: discard an unreadable one and replay everything. Add them only when measured load time demands it.

Use an established event store for production instead of a hand-rolled one; you still own event design, retention, compatibility and projection recovery.

## CQRS

CQRS means **the model for changing data and the model for reading it are different**, nothing more. Writes enforce rules on aggregates; reads return shapes built for the screen, joining and flattening freely. It prescribes no library, no separate database and no messaging.

- **Commands** express intent (`placeOrder`, `completeTodo`), go through the domain model, and return a result (often just success or an ID). **Queries** never change state and can read straight from tables or views, skipping the aggregate.
- **Convex already separates them:** `query` functions are read-only and reactive; `mutation` functions are the transactional write path. In Supabase or a Node API, keep separate command handlers and query functions, the queries free to use views or RPC functions shaped for the UI. In a Flutter client, one community post gives use cases separate `Command` and `Query` base types: [flutter ARCHITECTURE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/ARCHITECTURE.md#cqrs-variant-community).
- **No mediator library needed.** Call the handler directly from the route, action or mutation. A mediator adds indirection that makes code harder to follow; its useful part, a pipeline for cross-cutting concerns, is a function wrapper:

```ts
type Handler<C, R> = (command: C, ctx: Ctx) => Promise<Result<R, AppError>>;

const withLogging = <C, R>(name: string, h: Handler<C, R>): Handler<C, R> => async (c, ctx) => {
  const result = await h(c, ctx);
  result.ok ? ctx.log.info({ command: name }, "command completed")
            : ctx.log.warn({ command: name, error: result.error }, "command failed");
  return result;
};

const withValidation = <C, R>(schema: z.ZodType<C>, h: Handler<C, R>): Handler<C, R> => async (c, ctx) => {
  const parsed = schema.safeParse(c);
  return parsed.success ? h(parsed.data, ctx) : err({ code: "validation_failed", issues: parsed.error.issues });
};

export const completeTodo = withLogging("completeTodo", withValidation(CompleteTodo, completeTodoHandler));
```

The outermost wrapper runs first: logging outside validation means validation failures are logged too.

When you do use a dispatcher, keep each command or query type in the same file as its handler, so a reader can jump from the call to the code; the indirection is the main cost of a mediator.

- **Scope reads and writes to the caller:** load `where id = $1 and user_id = $current`, so another user's item is "not found", not "forbidden but exists".
- **A command handler is an application service:** load, call the domain, save. If the handler sets fields and checks state itself (`todo.isCompleted = true`), that's a transaction script; fine for simple areas, a candidate for a domain method when rules grow.
- A separate read store (a projection, a search index) is an option for scale, and brings eventual consistency; it isn't what makes something CQRS.

## Prove it

- Raise `BookReserved` in a domain operation. Decide which reactions must commit in the same transaction and which go through the outbox; then crash the process between the save and the delivery and show the event is still delivered once.
- Design a paid reservation workflow: list the stored coordination state, correlation IDs, and the compensations when payment succeeds but allocation fails. Deliver `PaymentCaptured` twice and show one shipment.
- Record a reservation's lifecycle as events, reject an append from a stale version, and rebuild a projection twice with identical results.
