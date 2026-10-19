---
name: messaging
description: "Makes messages between services reliable: transactional outbox and inbox in Postgres, idempotent consumers, ordering, choosing a broker. Use when publishing events across services or fixing lost or duplicate messages."
---

# Messaging

A message system gives you one of two guarantees: **at most once** (nothing is stored, a message sent while nobody listens is gone) or **at least once** (stored and retried, so duplicates will arrive). Exactly-once *delivery* isn't on offer; exactly-once *effects* are something you build, with an outbox on the sending side and idempotent handling on the receiving side. Read the file for the job:

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| A use case touches several systems and can half-succeed; per-aggregate ordering; whether you need a saga | [FAILURE-AND-ORDER.md](FAILURE-AND-ORDER.md) |
| Outbox and inbox tables in Postgres, the processor, scaling it, idempotent consumers, external calls | [OUTBOX-INBOX.md](OUTBOX-INBOX.md) |
| Queue vs log vs pub/sub, RabbitMQ topology, Kafka consumer groups, Redis channels | [BROKERS.md](BROKERS.md) |

Design-level questions (domain vs integration events, process managers, compensations, event sourcing) are in the `domain-modeling` skill's EVENTS.md; job queues, workers and `202 Accepted` APIs are in the `background-jobs` skill.

## The rules

1. **A use case is a unit of intent, not of atomicity.** The moment it calls a payment provider, an email API or another service, some effects can succeed while others fail. Classify each effect before writing recovery code ([FAILURE-AND-ORDER.md](FAILURE-AND-ORDER.md)).
2. **Never write to the database and then publish in two steps.** A crash or a down broker between them leaves data nobody hears about, or an announcement of data that rolled back. Write the message into an outbox table in the same transaction.
3. **Every consumer must tolerate duplicates.** Retries after a lost acknowledgment, broker redeliveries and outbox republishes all produce them. Record the message ID with the handler's change in one transaction, or make the change naturally idempotent.
4. **Order is per aggregate, never global.** You need events for one order handled in sequence, not every event in the system. Competing consumers break that; a key-based partition, a message group or a chained workflow restores it.
5. **Never swallow a failure to make the use case look successful.** A caught-and-ignored payment error hides the charge and invites a second one on retry. Surface it, retry it with an idempotency key, or turn it into a compensating event.
6. **Choose the transport by what the messages are.** Work to be done once (resize this image) belongs in a queue; facts that several readers consume and may replay (order placed) belong in a log; hints that may be lost (evict this cache key) can go over pub/sub. A Postgres table plus the outbox covers a long way before any broker.
7. **Add infrastructure when the pain justifies it.** One slow endpoint with modest traffic needs a jobs table and a worker, not a broker, a worker fleet and a notification path to operate and monitor.
8. **Measure the pipeline end to end:** publish lag (event occurred to published), consumer lag (published to processed), queue depth, retry and dead-letter counts. Speeding up producers without consumer capacity just moves the backlog.

## Prove it

For the flow you changed: stop the broker (or the consumer) mid-flow and restart it, then show each message's effect happened exactly once. Deliver the same message twice, concurrently: one effect. Kill the process between the database commit and the publish: the message still goes out. For ordered flows, process two events for one aggregate on two workers at once and show the aggregate ends in the right state.
