# Outbox, inbox and idempotent consumers in Postgres

## The outbox table

```sql
create table outbox_messages (
  id uuid primary key,                       -- also the message ID consumers deduplicate on
  type text not null,                        -- a stable contract name ("orders.placed.v1"), never a class or file path
  content jsonb not null,
  headers jsonb,                             -- trace context (traceparent) so the consumer continues the producer's trace
  occurred_at timestamptz not null default now(),
  processed_at timestamptz,
  attempts int not null default 0,
  error text
);

-- Serves "oldest unprocessed first" straight from the index: no table scan, no sort.
create index outbox_unprocessed on outbox_messages (occurred_at)
  include (id, type, content)
  where processed_at is null;
```

- **Write the row in the same transaction as the business change.** In Supabase, do both inside one database function called with `rpc` (or `pgmq.send` in that function); in a Node service, inside `db.transaction`. Collect domain events from the aggregate just before commit and insert them as rows, so handlers never have to remember. In Convex, `ctx.scheduler.runAfter(0, ...)` inside the mutation is the outbox (the `domain-modeling` skill's EVENTS.md).
- **The partial index stays small** because processed rows drop out of it, and the `include` columns allow an index-only scan. Postgres caps an index entry at roughly 2.7 KB, and included columns count: keep message bodies small (IDs and the fields consumers need, not whole documents), or leave `content` out of the `include` list and accept a heap fetch.
- **Plan retention on day one:** delete or archive processed rows after a period, or partition by time and drop old partitions. An outbox that grows forever slows the whole database.

## The processor

Claim a batch, publish it, mark it, in one transaction. `for update skip locked` lets several processors run without taking the same rows.

```ts
const BATCH = 1000;

export async function drainOutbox(): Promise<number> {
  return db.transaction(async (tx) => {
    const rows = await tx.query<OutboxRow>(
      `select id, type, content from outbox_messages
       where processed_at is null and attempts < $2
       order by occurred_at limit $1
       for update skip locked`, [BATCH, MAX_ATTEMPTS]);

    const results = await Promise.all(rows.map(async (row) => {   // publish concurrently, not one awaited round trip each
      try { await publisher.publish(row.type, row.content, { messageId: row.id }); return { id: row.id, error: null }; }
      catch (e) { return { id: row.id, error: String(e) }; }
    }));

    const ok = results.filter((r) => r.error === null), failed = results.filter((r) => r.error !== null);
    if (ok.length) await tx.query(                                   // one statement for the whole batch
      `update outbox_messages set processed_at = now() where id = any($1::uuid[])`, [ok.map((r) => r.id)]);
    if (failed.length) await tx.query(
      `update outbox_messages o set attempts = o.attempts + 1, error = f.error
       from unnest($1::uuid[], $2::text[]) as f(id, error) where o.id = f.id`,
      [failed.map((r) => r.id), failed.map((r) => r.error)]);
    return rows.length;
  });
}
```

- **A failed publish is retried, not marked done.** Count attempts; past the limit the row stays out of the claim (`attempts < MAX_ATTEMPTS`) and an alert fires: that's the outbox's dead-letter state. Marking a failed row as processed with an error loses the message.
- **Wait for the broker's confirmation** before marking a row processed (RabbitMQ publisher confirms, Kafka `acks=all`). Turning confirms off buys a little throughput and loses messages when the broker drops them.
- **Crash after publish, before the update:** the transaction rolls back and the batch is published again. That's the at-least-once part; consumers deduplicate on the message ID.
- **Keep transactions short:** a huge batch holds row locks and a transaction open for the whole publish. Size batches so one run takes well under a second or two.
- **Poll, or tail the log.** Polling every second or two is simple and adds steady load. Log tailing streams committed inserts from the write-ahead log (Postgres logical replication, usually through a change-data-capture tool) for push-based delivery with less polling.
- **Retries toward a down broker** use exponential backoff and a circuit breaker, so a long outage doesn't turn into a hot loop (the `api-design` skill's RELIABILITY.md).

### Scaling it

Measure each step separately (claim query, publish, update) before changing anything; the bottleneck moves. In one measured run on Postgres and RabbitMQ, a single processor went from about 1,350 to 2,700 messages per second with a covering partial index (query 70 ms to 1 ms per batch of 1,000), concurrent publishing and one batched update (300 ms to 52 ms). Five parallel processors barely helped until broker-side batch publishing removed the per-message confirmation wait, reaching about 32,500 per second. Your numbers will differ; the order of the levers usually holds:

1. Index the claim query so it reads only unprocessed rows in order.
2. Publish the batch concurrently and update it in one statement.
3. Run several processors with `skip locked`.
4. Batch at the broker client (or use a client whose async publishing pipelines confirmations).
5. Check consumers can keep up; otherwise you've only moved the queue.

Parallel processors give up ordering: rows claimed by different workers publish in any order. Where order matters per aggregate, see [FAILURE-AND-ORDER.md](FAILURE-AND-ORDER.md).

## The inbox: receive now, process later

The consumer-side counterpart: the broker handler only stores the message, keyed by its ID, and acknowledges. Duplicates vanish at insert.

```sql
create table inbox_messages (
  id uuid primary key,
  type text not null,
  content jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  attempts int not null default 0,
  error text
);
create index inbox_unprocessed on inbox_messages (received_at) include (id, type, content) where processed_at is null;
```

```ts
async function receive(msg: IncomingMessage) {
  await db.query(
    `insert into inbox_messages (id, type, content) values ($1, $2, $3) on conflict (id) do nothing`,
    [msg.messageId, msg.type, msg.body]);
  msg.ack();                                         // a crash before ack just means a second insert that does nothing
}
```

A processor then claims unprocessed rows with `for update skip locked`, dispatches each to its handler, and records success or the error in one batched update, exactly like the outbox processor. **The handler's own writes and the `processed_at` update must commit in the same transaction**, or a crash between them repeats or loses the effect.

- **Poison messages:** after N attempts, stop retrying, move the row to a dead-letter state and alert.
- **Ordering:** `order by received_at` is only arrival order; with several processors it isn't even that.
- **Watch the lag** between `received_at` and `processed_at`; when it grows, raise the batch size, poll more often or add processors.
- **Retention:** same as the outbox.

## Idempotent consumers: process inline, deduplicate in the transaction

```sql
create table processed_messages (
  message_id uuid not null,
  consumer text not null,                    -- several consumers may each process the same message once
  processed_at timestamptz not null default now(),
  primary key (message_id, consumer)
);
```

```ts
async function handleNoteCreated(msg: Message<NoteCreated>) {
  await db.transaction(async (tx) => {
    const claimed = await tx.query(
      `insert into processed_messages (message_id, consumer) values ($1, 'tagging') on conflict do nothing returning 1`,
      [msg.messageId]);
    if (claimed.rowCount === 0) return;              // a duplicate: the effect already committed
    await saveTags(tx, msg.body.noteId, deriveTags(msg.body));
  });
  await cache.set(`note:${msg.body.noteId}:tags`, ...);   // after commit; naturally idempotent
}
```

- **Insert the marker first, inside the transaction,** and let the primary key decide. A separate "is it processed?" check followed by the work races under concurrent delivery; the constraint doesn't. If the work fails, the transaction rolls back the marker too, so the broker's redelivery tries again.
- **Mark only after success.** Recording the ID in its own committed step before the work (and deleting it on failure) leaves a processed marker for work that never happened if the process dies in between.
- **Inbox or idempotent consumer?** The idempotent consumer is simpler and lets the broker schedule retries; use it when the effect is in your database and broker redelivery is good enough. The inbox acknowledges immediately and puts retries, backoff, batching and horizontal scaling in your hands.
- **Broker-side deduplication** (SQS FIFO, Azure Service Bus duplicate detection, Kafka's idempotent producer) catches a producer's republishes within a window, given a stable message ID. It does nothing for consumer-side redelivery, so the consumer still deduplicates.
- **Skip the machinery when the effect is naturally idempotent:** setting a status, overwriting a projection row with a newer version, refreshing a cache. A precondition check (already in the target state, return) is often enough. Appending, incrementing and sending are not idempotent.

## Effects outside the database

A handler that calls an email API or a payment provider can't put that call in its transaction: the database may commit while the call's outcome is unknown, and the retry repeats it.

- **Pass a stable idempotency key** (the message ID, or `order:{id}`) to every provider that supports one; the provider then performs identical requests once.
- **When the provider has no key:** use the [intent, uncertain outcome and reconciliation workflow](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/background-jobs/EXTERNAL-SIDE-EFFECTS.md#a-job-is-a-state-machine). The old line promised a worker could perform an action once and mark it done; a crash after the external effect but before the completion write leaves an uncertain outcome. [milan-jovanovic, ai-and-vector-search/speech-to-text-in-dotnet-with-assemblyai.md]
- **Decide what a repeat costs.** A duplicate "your report is ready" email may be acceptable; a duplicate charge isn't.
