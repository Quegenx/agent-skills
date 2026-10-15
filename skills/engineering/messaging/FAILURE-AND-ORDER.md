# Partial failure, ordering, and when a saga is the answer

## The use case that half-succeeds

```ts
// Looks like one transaction. Is three unrelated effects.
async function placeOrder(input: PlaceOrderInput) {
  const order = Order.create(input);
  await orders.insert(order);                 // 1. database
  await payments.charge(order.id, order.total); // 2. external, reversible (refund)
  await email.sendConfirmation(order.id);     // 3. external, irreversible
}
```

If the insert commits and the charge fails, the order exists unpaid. If the charge succeeds and the save fails afterwards, the money is taken and the order is lost. A naive retry charges twice. If the email fails after both, the customer never hears back. Each run can fail in a different place, which is why these bugs show up as "the system thought the payment failed but the customer was charged".

**Classify every effect first:**

| Kind | Examples | Strategy |
|---|---|---|
| Transactional | inserts, updates, outbox rows | Commit together, and **last**: by the time you commit, the work the commit promises is done |
| External and reversible | charge (refund), reserve stock (release), create a shipment (cancel) | Idempotency key so a retry is safe; a compensating action when retrying isn't possible |
| External and irreversible | email, SMS, webhook, a filing with a regulator | Never inline: an event in the outbox, delivered after commit by a worker with its own retries and idempotency |

The reworked shape:

```ts
async function placeOrder(input: PlaceOrderInput): Promise<Result<OrderId, PlaceOrderError>> {
  const order = Order.create(input);

  const charge = await payments.charge({ orderId: order.id, amountCents: order.totalCents, idempotencyKey: `order:${order.id}` });
  if (!charge.ok) return charge;                      // nothing committed, nothing to undo
  order.markPaid(charge.value.transactionId);

  try {
    await db.transaction(async (tx) => {
      await orders.insert(tx, order);
      await outbox.add(tx, { type: "OrderPlaced", orderId: order.id });   // the email goes through here
    });
  } catch (error) {
    // the money is real: record a compensation that a worker turns into a refund, keyed by the transaction ID
    await outbox.addStandalone({ type: "PaymentOrphaned", orderId: order.id, transactionId: charge.value.transactionId, amountCents: order.totalCents });
    throw error;
  }
  return ok(order.id);
}
```

- **The idempotency key is the order ID.** A retry after a crash between the charge and the commit gets the same charge back from the provider (Stripe and most serious payment APIs accept such a key) instead of a new one, and the order finally saves.
- **Compensation for permanent failures:** when the request can't be replayed (the user left, the failure is permanent), the charge must be refunded. Make that a first-class message handled by a consumer that uses the provider's transaction ID as its own idempotency key. The fallback write to the outbox can itself fail; log it as an alert with the transaction ID, and reconcile charges against orders periodically so nothing depends on one catch block.
- **Sometimes you need the database first** (an ID the provider requires). Then save the order in a `pending_payment` state, charge, and move it to `paid`; a sweeper finds orders stuck pending and checks the provider.
- **Use transient retries (same key) for transient failures and compensating events for permanent ones;** they compose.

**Rule of thumb:** if you can hold the recovery logic in your head, a well-built use case is enough. If you can't, or the steps span services and must survive restarts, it's a saga.

## Temporal coupling and responsibility

Calling email and analytics inline also makes the user wait for the slowest of them: a 3-second analytics API means a 3-second registration. And the method now changes for two reasons (the user rules, and "marketing wants an SMS too"). Record the state change and announce it with an event; each follow-up is its own handler, added without touching the use case. Announcing through an in-memory dispatcher fixes the coupling but not reliability: crash between dispatch and commit and you emailed a user who doesn't exist, or commit and lose the event. The outbox fixes both.

**Notification or obligation?**

- Email, analytics, cache invalidation, search indexing: fine if it happens seconds later. Event plus outbox.
- A step the business requires for the first step to stand (a wallet that must exist for the account, stock that must be reserved before payment): if it fails, earlier steps must be undone. That's a saga with compensations.

## Ordering: per aggregate, not global

What the business needs is almost always "events for the same order (customer, invoice) are handled in the order they happened". Unrelated aggregates can run in parallel.

- **The outbox makes publishing reliable, not ordered.** Retries and parallel outbox workers can publish out of sequence.
- **Competing consumers break per-aggregate order.** Worker A takes `PaymentCaptured` while worker B is still on `OrderPlaced` for the same order. Queues scale work; they don't preserve your invariants. The bug appears only under load.
- **One consumer for the whole stream restores order** and caps throughput at one worker.
- **Ordered processing per key, from the transport:** Kafka partitions (same key, same partition, one consumer per partition in a group), SQS FIFO message groups, Azure Service Bus sessions, RabbitMQ single active consumer (per queue, so one queue per key range). These stop concurrent handling of one aggregate.
- **Without transport support:** process one message per aggregate at a time and publish the next only when the previous is done. That's a chained workflow, which is a choreographed saga; when you need to see where each one is and add timeouts, make it a state machine (a process manager).
- **Defend in the handler anyway:** carry the aggregate version in each event and have the consumer apply version n only after n - 1 (park or retry out-of-order ones), or make handlers commutative. Transport ordering doesn't survive a replay from a dead-letter queue.

Per-key ordering still needs the rest: the outbox (order is useless if a message is lost), idempotent consumers (duplicates still happen), and timeouts with compensation when the ordered sequence is really a business workflow that can fail midway.

## Do you need a saga?

A saga is a sequence of local transactions, each committing in its own service and triggering the next, with a compensating action for each completed step. The design side (process managers, compensations as business actions, pivot points) is in the `domain-modeling` skill's EVENTS.md. Before building one:

- **All the data in one database:** use a transaction. A saga is strictly worse there: more code, weaker guarantees.
- **You own both service boundaries:** consider merging them. The cheapest distributed transaction is the one designed away.
- **Nothing to undo:** plain publish/subscribe is enough.
- **The intermediate states become visible.** An order sits in "pending payment" for seconds or minutes; the UI, support tooling and reports must show and explain that state.
- **Define every step's local transaction, compensation, timeout and terminal states** (completed, failed, needs attention) as part of the workflow, and publish each transition through the outbox.

**Choreography or orchestration:**

| | Choreography (react to events) | Orchestration (a coordinator sends commands) |
|---|---|---|
| Fits | Two or three linear steps, each step needs only the incoming message, progress in one direction | Waiting for intermediate results, conditional next steps, all-or-nothing outcomes, central monitoring |
| Strengths | Loose coupling, no central component | The whole flow in one place, easy to add or reorder steps, unit-testable state machine, central compensation |
| Costs | The flow is spread across services and hard to trace; adding a step touches several services; testing needs all of them; cycles between services can form | One more component (state, persistence) that must be highly available; can grow complex |

Mix them per workflow: a choreographed notification chain and an orchestrated checkout can live in the same system.
