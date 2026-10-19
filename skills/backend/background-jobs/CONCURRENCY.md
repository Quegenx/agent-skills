# Concurrency control

Start by naming the invariant: what must never happen (the counter goes negative, two people reserve the last copy, the nightly reminder goes out twice). Then pick the cheapest tool that enforces it where the data lives.

## Prefer the database

| Invariant | Tool |
|---|---|
| Only one of something can exist (one active loan per copy, one reminder per loan per day) | A unique constraint (a partial unique index for "active" rows); handle the conflict error |
| Change only if the state is still what you read | A conditional update (`... where id = $1 and status = 'available'`) and check the affected row count; or a version column (optimistic concurrency) |
| Several rows must change together | A transaction; at the right isolation level, retry on serialization failure |
| Check-then-act inside one transaction | `select ... for update` on the rows you'll change |

In **Convex**, every mutation is a serializable transaction with optimistic concurrency: reads and writes in one mutation are atomic, and conflicting mutations are retried automatically. Put check-then-act logic in a single mutation and you need no locks. Actions are not transactional; anything they decide must be written back through a mutation that re-checks the state.

## Row locks, timeouts and isolation in Postgres

See [Postgres lock modes, transaction boundaries, timeouts and isolation](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/postgres/CONNECTIONS.md#locks-and-deadlocks).

## Inside one process (JavaScript)

JavaScript runs one thing at a time, but every `await` is a point where other work interleaves. A read, an `await`, then a write based on the read is a race:

```ts
const stock = cache.get(copyId);       // two requests read 1
await reserveInDb(copyId);             // both await here
cache.set(copyId, stock - 1);          // both write 0: one reservation lost
```

- Keep the read and write in one synchronous step, or move the state into the database.
- Serialize per key with an async mutex or a promise chain per key; limit parallel work with a semaphore (e.g. at most 5 concurrent uploads).

```ts
const tails = new Map<string, Promise<unknown>>();

export function withKeyLock<T>(key: string, work: () => Promise<T>): Promise<T> {
  const previous = tails.get(key) ?? Promise.resolve();
  const run = previous.then(work, work);                         // run after the previous holder, even if it failed
  const tail = run.catch(() => {});
  tails.set(key, tail);
  tail.finally(() => { if (tails.get(key) === tail) tails.delete(key); });   // don't grow forever
  return run;
}

await withKeyLock(`account:${accountId}`, () => deposit(accountId, amount));
```

A different key never waits: one global lock would make every account wait for every other.
- Release in `finally`, so an exception or cancellation never leaves the permit held, and give acquisition a timeout.
- Hold the lock only around the state transition that must be atomic, never across slow network calls you don't need to cover.
- An in-process lock does nothing for other instances, other serverless invocations or other workers, and doesn't make a database transaction atomic.

## Across instances

When the invariant can't be expressed in the data, use a shared lock. Typical cases:
- only one worker processes a given job or resource at a time;
- leader election: one instance does periodic work (rebuilding projections, sending digests);
- a scheduled task deployed on several instances runs once, not once per instance;
- one-at-a-time maintenance: a migration, a cleanup, a backfill;
- cache stampede prevention: one instance refreshes an expired key while the others wait or serve stale (the `performance-and-caching` skill).

The options:

- **Postgres advisory locks:** use the [engine contract](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/postgres/CONNECTIONS.md#locks-and-deadlocks) for transaction/session scope, hashing, direct connections and failure detection.
- **A lease row:** `update locks set owner = $me, expires_at = now() + interval '30 seconds' where name = 'nightly-import' and (owner is null or expires_at < now())`, then check the affected row count. Renew while working; stop if a renewal fails.
- **Redis:** `SET key token NX PX 30000`, and release only if the value is still your token (an atomic check-and-delete script). Prefer a maintained lock library over hand-rolling expiry, renewal and release. Multi-node schemes like Redlock still rely on timing, so they need fencing or a data-level invariant as much as the single-node form.
- **Convex:** usually none of these. A mutation that reads the job's state and claims it is already serializable, so "only one worker runs this" is a conditional write in a mutation.

Rules for any of them:
- **Try, don't wait forever.** Decide what losing means: skip this run (a cron), retry later (a job), or reject the request with 409 (a user-triggered operation). If you do wait, wait with a timeout.
- **Release in `finally`,** so an exception can't leave the lock held. Session-level locks also release when the connection closes; leases release by expiring.
- **Decide fail-closed or fail-open when the lock backend is down.** Fail closed (don't run) is the default. Fail open (run without the lock) only when a duplicate run is harmless, and write the choice down where the lock is defined.
- **Treat uncertainty as not holding the lock:** a timeout or error while acquiring, or a failed renewal, means stop.
- **Leases expire,** so a paused or slow holder can lose the lock while still working. Where that would corrupt data, use a **fencing token** (a number that increases with each acquisition) and have the protected resource reject writes carrying an older token. Better still, also enforce the invariant in the data so a stale holder can't do harm.
- **Cover the whole critical operation,** from the check to the last write, and keep it short.

## Prove it

- Protect a shared in-memory reservation counter under concurrent tasks; include a task that throws and one that is cancelled, and verify the permit is always released and the counter never goes wrong.
- Run two reminder workers against the same loans: each reminder goes out once. Then make the lock backend unavailable and write down whether the work is skipped, retried or rejected, and confirm that's what happens.
