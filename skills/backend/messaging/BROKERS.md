# Choosing and using a transport

## Queues delete, logs retain

This comparison covers RabbitMQ's classic and quorum queues versus Kafka's ordered consumer groups. A queue tracks each message and deletes it when acknowledged; a log keeps messages for a retention period whether read or not, and each ordered consumer group remembers its position (offset) per partition. https://www.rabbitmq.com/docs/compare/kafka

**Broader broker features:** RabbitMQ Streams are retained, replayable logs. Kafka share groups support individual acknowledgments and can have more consumers than partitions, so the table's partition limit and offset model do not describe them. The source and old introduction treated these as broker-wide differences. https://www.rabbitmq.com/docs/streams and https://github.com/apache/kafka/blob/trunk/docs/design/design.md

| | Queue | Log |
|---|---|---|
| Replay | Gone once acknowledged; you'd have to have stored it elsewhere | Move the offset back and re-read; rebuild a projection, backfill a new service |
| Fan-out to 10 services | The broker copies the message into 10 queues | One copy, 10 offsets; an 11th subscriber tomorrow can start from the beginning of retention |
| Scaling consumers | Add consumers to a queue at any time; each message goes to one of them | Parallelism is capped by the partition count; adding consumers triggers a brief rebalance |
| Ordering | Only within a queue with a single consumer | Per key: same key, same partition, in order |
| A slow or failing message | Handled individually: requeue, delay, dead-letter; neighbors keep flowing | Blocks everything behind it in its partition, so failures go to retry and dead-letter topics you build |
| Routing | Broker-side: exchanges on keys, patterns and headers; TTLs; priorities | Choose topic and key when producing; filter in consumers |
| Best for | Commands and jobs: work done once, retried one by one | Facts many systems read independently, possibly later, possibly again |

**Classify the messages, then the transport picks itself.** Jobs and commands go to a queue; an event backbone goes to a log; both in one system is normal. Two classic mistakes: buying a log for a job workload because of throughput charts, then rebuilding acknowledgment, delays, retries and dead-lettering on top of it; or building an event backbone on a queue and discovering that "replay last month for the new service" is impossible.

**Before either:** a Postgres table with `skip locked` claims, or Supabase Queues (pgmq), plus the outbox, covers a surprising distance; Convex has its scheduler and workflows built in (the `background-jobs` skill). Throughput is rarely the deciding factor at modest volumes; both kinds of broker are fast enough, and operations differ more. A managed service (SQS, Service Bus, Pub/Sub, a hosted Kafka) beats a self-run cluster for a small team.

**Managed workflow engines** are worth it when the work is a long multi-step workflow with timers, retries and human approvals: AWS Step Functions, Azure Durable Functions, Temporal, Inngest, or Convex's workflow component. They trade operational work for vendor coupling and per-step pricing.

## RabbitMQ in Node (amqplib)

The pieces: producers publish to an **exchange**, which routes to **queues** by rules; consumers read from queues. Producers never write to a queue directly (the default exchange routes by queue name).

```ts
import amqp from "amqplib";

const conn = await amqp.connect(process.env.AMQP_URL!);
const ch = await conn.createConfirmChannel();                    // confirms: the broker acknowledges each publish

await ch.assertExchange("orders", "fanout", { durable: true });
await ch.assertExchange("orders.dlx", "fanout", { durable: true });
await ch.assertQueue("orders.billing", { durable: true, deadLetterExchange: "orders.dlx" });
await ch.bindQueue("orders.billing", "orders", "");

// publish: persistent message on a durable queue survives a broker restart
ch.publish("orders", "", Buffer.from(JSON.stringify(event)),
  { persistent: true, messageId: event.id, type: "orders.placed.v1", contentType: "application/json" });
await ch.waitForConfirms();                                      // throws if the broker nacked

// consume: manual acknowledgment, bounded in-flight messages
await ch.prefetch(20);
await ch.consume("orders.billing", async (msg) => {
  if (!msg) return;
  try { await handle(JSON.parse(msg.content.toString())); ch.ack(msg); }
  catch { ch.nack(msg, false, false); }                          // no requeue: the dead-letter exchange takes it
}, { noAck: false });
```

- **Durable queue, persistent message and publisher confirms** establish that a publication was accepted with the intended persistence guarantee. An unroutable message can still be confirmed: `mandatory` requires a `basic.return` handler, or configure an alternate exchange. The source described `mandatory` as making publication fail; the example above waits for confirms but does not implement return handling. https://www.rabbitmq.com/docs/confirms and https://www.rabbitmq.com/docs/reliability
- **Acknowledge after the work commits,** never on receipt. A crash before the ack means redelivery, which is why the handler deduplicates.
- **Competing consumers vs fan-out:** several consumers on one queue share the work, each message going to one of them; to give every service its own copy, give each service its own queue bound to a fanout (or topic) exchange.
- **Direct and topic exchanges** route on exact keys or patterns (`orders.*.eu`) for selective subscriptions; headers exchanges route on message headers.
- **Failure handling is native:** `nack` without requeue sends to the dead-letter exchange; a retry queue with a message TTL that dead-letters back to the work queue gives delayed retries; delayed delivery otherwise needs a broker plugin. Requeuing a poison message forever is the classic hot loop: count deliveries and dead-letter after a limit.
- **Ordering** holds only with one consumer per queue; RabbitMQ's single active consumer option keeps a standby consumer that takes over without breaking order.
- Higher-level libraries (Rascal for config-driven topology and recovery, or a framework's broker integration) handle reconnection, which raw amqplib leaves to you.

## Kafka essentials

These rules describe ordered consumer groups; share groups use different acknowledgment and assignment semantics. https://github.com/apache/kafka/blob/trunk/docs/design/design.md

- **The partition is the unit of order and of parallelism.** Pick the key (the aggregate ID) so everything that must stay ordered shares a partition, and enough partitions for the consumer parallelism you'll need; increasing partitions later remaps keys.
- **Commit offsets after processing,** not before: committing first loses messages on a crash, committing after duplicates them, so handlers are idempotent.
- **Failures don't get special treatment from the broker.** Catch, produce the message to a `retry` topic (or a delayed tier) or a `dlq` topic, commit the offset and keep going, or the partition stalls.
- **There is no per-message delay, priority or TTL;** retention is time- or size-based for the whole topic. Compacted topics keep the latest value per key, useful for state snapshots.
- **Rebalances pause consumption** when group membership changes; keep processing per poll short so the consumer doesn't get kicked out mid-batch.

## Redis pub/sub: at most once

`PUBLISH` sends to whoever is subscribed at that moment; nothing is stored, so a message published while a subscriber is disconnected is simply gone. Use it only where a lost message is harmless or bounded by something else: cache invalidation across instances (a missed eviction is capped by the entry's TTL, and a restarted instance starts with an empty local cache anyway), live presence or typing indicators, best-effort live updates. Anything that must arrive belongs in a queue, a log or Redis Streams (which store entries and track consumer-group acknowledgments). The cross-instance invalidation code is in the `performance-and-caching` skill's CACHING.md.
