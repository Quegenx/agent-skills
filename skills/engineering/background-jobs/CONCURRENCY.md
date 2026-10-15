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

Choose by contention: **optimistic** (a version check) when conflicts are rare and retrying is cheap; **`for update`** when specific rows are contended and the operation isn't safely retryable (payments, stock decrements); **`skip locked`** for workers competing over queue rows ([WORKERS.md](WORKERS.md)); **advisory locks** when there's no row to lock (a singleton job, an external resource, "create if not exists").

- **A row lock lives only inside an explicit transaction.** Outside one, each statement auto-commits and the lock is gone when the `select` returns. With Supabase, that means a Postgres function called by `rpc` or a direct connection; supabase-js calls don't share a transaction.
- **Pick the weakest mode that works:**

```sql
select * from orders where id = $1 for update;            -- blocks other lockers and writers; plain reads still run
select * from orders where id = $1 for no key update;     -- same, but lets other transactions insert child rows referencing it
select * from orders where id = $1 for share;             -- many holders; blocks writers
select * from orders where id = $1 for update nowait;     -- fail at once instead of waiting
```

  Locking a parent (an order) while other transactions insert children (order lines) with a foreign key to it: use `for no key update`; plain `for update` blocks those inserts, because each one takes a key-share lock on the parent.
- **Bound the wait.** A blocked lock waits forever by default, holding a request and a pooled connection. Set `set local lock_timeout = '5s'` as the transaction's first statement (`set local` ends with the transaction; a plain `set` stays on the pooled connection for the next user), and map the timeout error (`55P03`) to a retry or a 409.
- **Never hold a lock across slow work.** An external API call inside the transaction serializes every caller on that call. For long work, claim in one short transaction (mark the row `processing`), commit, do the work, then record the result.
- **Isolation levels:** `read committed` (the default) gives each statement a fresh snapshot; `repeatable read` gives the whole transaction one snapshot (in Postgres it also prevents phantom rows); `serializable` behaves as if transactions ran one at a time and aborts the losers with `40001`, so it requires a retry loop around the whole transaction. For most check-then-act code, `read committed` plus `for update` on the rows you'll change is enough.
- **Deadlocks** happen when two transactions lock the same rows in opposite orders; Postgres kills one with `40P01`. Lock in a deterministic order (`where id = any($1) order by id for update`), keep transactions short, and retry a deadlock victim once.

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

- **Postgres advisory locks** are for coordination only and never lock table rows. The key is a 64-bit number, so map the lock name to one with a stable hash that every instance computes the same way: `pg_try_advisory_xact_lock(hashtext('nightly-report'))` in SQL, not a language's per-process hash. Namespace names (`job:nightly-report`, `import:${tenantId}`) so unrelated locks don't collide. The `try` forms return `true` or `false` at once instead of waiting.
  `pg_try_advisory_xact_lock(key)` inside a transaction holds the lock until commit or rollback and releases automatically if the connection dies. Use it when the critical section is one transaction.
  A session lock (`pg_advisory_lock`) on a **dedicated, direct connection** suits work that spans several transactions or isn't database work at all. Its lifetime is the connection's: a crashed or killed process closes the connection and Postgres releases the lock at once, with no TTL to tune and no lease to renew. Release by `pg_advisory_unlock` and by closing the connection, so even a failed unlock can't leak. The price is one pinned connection per held lock: fine for rare, brief, per-user contention (two submissions racing to award the same badge), wrong at thousands of acquisitions per second (Redis territory) or for services that don't already share a database. Bound the wait with a statement timeout or by cancelling the query. A hash collision between two names only makes them occasionally wait for each other; it never breaks correctness. Session-level advisory locks (`pg_advisory_lock`) do not work reliably through a transaction-mode connection pooler (such as Supabase's pooled connection), because consecutive statements can land on different server connections: use the transaction-scoped form, or a direct connection.
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
