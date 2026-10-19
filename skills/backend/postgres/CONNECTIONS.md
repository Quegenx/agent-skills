# Connections, transactions and locks

## Every connection is a process

Postgres forks one operating system process per connection: a few MB of base memory each, plus whatever its queries use, plus context switching. 500 connections on a small server spend their memory on processes instead of cache. `max_connections` defaults to 100, needs a restart to change, and `superuser_reserved_connections` (default 3) keeps the last slots for an administrator, so ordinary roles are refused a little before the limit.

- **Pool, then size:** a pooler (PgBouncer, the platform's pooler, or the driver's pool in a long-lived server) multiplexes many application connections onto a few backends. 1,000 clients often fit in 20 to 50 backends. A starting point is about two connections per CPU core; then size from observed concurrency and query memory, not from cores alone.
- **Serverless and edge functions** open many short-lived connections, which a driver's pool can't cover: always go through a server-side pooler there.
- **Alert at 80% of `max_connections`, page at 95%.** `too many clients already` means a leak or a missing pooler, not a limit to raise.
- **A client-side `connection timeout` is not a reason to enlarge the pool.** "Adding connections only makes the line in front of the slow DB longer", and more concurrent sessions can make the DB slower still. Ask why returns became slow first: put the connection wait time metric next to the DB's slow query log ([observability DIAGNOSE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/DIAGNOSE.md#pools-and-queueing)).

## Pool modes and what they forbid

| Mode | A backend is lent for | Use |
|---|---|---|
| Transaction | one transaction | Most application traffic: the most clients per backend |
| Session | the whole client session | Work that needs session state |

In transaction mode the next transaction may run on a different backend, so these break or leak:

- **Session `set` leaks to the next client.** A `set default_transaction_read_only = on` (or `search_path`, `statement_timeout`) stays on the backend and the next unrelated client inherits it; writes start failing with nothing in the config to explain it. Inside a transaction use `set local`, which ends with it; for anything else connect directly.
- **Prepared statements depend on the pooler contract.** SQL `PREPARE`/`EXECUTE` does not become portable across transaction-pooled backends. PgBouncer 1.21+ can track protocol-level named prepared statements when `max_prepared_statements` is nonzero; older or disabled configurations differ. Otherwise use the driver's unnamed path or its actual disable-preparing option (`prepare: false` in postgres.js). The old line did not state the version/configuration condition. [https://www.pgbouncer.org/config.html#max_prepared_statements]
- **Temporary tables, `listen`/`notify`, session advisory locks** don't survive between transactions.

**Use a direct connection** (bypassing the transaction pooler) for migrations and other DDL, `pg_dump`, analytics and long reports, ETL and streaming, and any maintenance that changes session state.

**PgBouncer sizing:** `default_pool_size` is per user and database pair (default 20), so 2 users and 3 databases at 45 is 270 backends; 25 to 50 suits one or a few pairs, 10 to 25 when many pairs are active together. Keep the pooler's total under `max_connections` minus direct connections, with about 20% headroom.

## Timeouts

| Setting | Starting value | Catches |
|---|---|---|
| `statement_timeout` | 30 s for the application role, lower for user-facing paths | Runaway queries |
| `idle_in_transaction_session_timeout` | 30 s to 5 min | A transaction left open by a crashed or careless client: it holds locks and blocks vacuum everywhere |
| `idle_session_timeout` | about 10 min, for interactive sessions only (a pooler may not react well to the closed connection) | Clients that connect and forget |
| `lock_timeout` | a few seconds in migrations (`5s`); a ceiling such as `2s` per role, session or transaction elsewhere, so nothing queues forever | A statement waiting too long to acquire a lock |

Set them per role (`alter role app set statement_timeout = '30s'`) or per transaction (`set local`), rather than globally; poolers have their own idle timeouts (`server_idle_timeout`, `client_idle_timeout`).

## Transactions

- **A transaction is all or nothing:** if the connection drops between two statements, Postgres rolls back the first. Without `begin`, each statement is its own transaction and commits immediately; `begin` stretches that boundary across several statements.
- **Read committed** (the default) takes a new snapshot per statement, so two statements in one transaction can see different data (a non-repeatable read). **Repeatable read** keeps one snapshot from the first query; **serializable** makes concurrent transactions behave as if run one at a time, catching write patterns the lower levels miss. Both raise `could not serialize access` (SQLSTATE `40001`) on conflicts, and the application **must retry** the whole transaction. At these levels retries are not an edge case but the contract: wrap the transaction in a retry loop. Read uncommitted behaves as read committed; no level ever shows another transaction's uncommitted data.
- **Pick the level by the job:** read committed for most OLTP writes; repeatable read for multi-statement reads that must agree (a report across many tables); serializable for invariants that span several rows or tables.
- **Ordinary MVCC data reads do not conflict with row writes,** but locking reads such as `SELECT FOR UPDATE` and table lock modes can block. The old unqualified readers-never-block claim omitted those cases. Row locks do not escalate to table locks. [https://www.postgresql.org/docs/18/explicit-locking.html]
- **Keep them short:** call external APIs, validate input and do computation before `begin`; inside, only the statements that must be atomic.

```sql
-- After the payment API answered, outside any transaction:
update orders set status = 'paid', payment_id = $1
where id = $2 and status = 'pending'
returning *;
```

## Locks and deadlocks

Choose by contention: **optimistic** (a version check) when conflicts are rare and retrying is cheap; **`for update`** when specific rows are contended and the operation isn't safely retryable (payments, stock decrements); **`skip locked`** for workers competing over queue rows ([background-jobs WORKERS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/background-jobs/WORKERS.md)); **advisory locks** when there's no row to lock (a singleton job, an external resource, "create if not exists"). [Existing background-jobs/CONCURRENCY.md, Row locks, timeouts and isolation in Postgres]

- **Slow every time is a plan problem; usually instant but sometimes hanging is a lock problem.** A hung statement is not slow, it is waiting. The usual shape: a transaction updates a row, then does something long (an API call, user input) before committing, and every other writer of that row queues behind it. Find the blocker with the query in MONITORING.md.
- **Plain `insert`, `update` and `delete` take light table locks plus row locks** on the rows they change, held until commit or rollback. DDL is the dangerous kind (MIGRATIONS.md).
- **Read then write as one step with `select ... for update`:** it locks the rows you are about to change, so no other transaction can change or lock them before your `update`.
- **Prevent deadlocks with consistent lock acquisition order across operations.** Lock rows in one order everywhere (`select ... where id = any($1) order by id for update`). One statement can acquire locks during execution; the old alternative of changing rows in one statement did not guarantee deadlock prevention. Postgres checks after `deadlock_timeout` (default 1 s) and aborts one participant with SQLSTATE `40P01`; keep transactions short and retry a deadlock victim once (the existing worker policy); log with `log_lock_waits = on` and count `pg_stat_database.deadlocks`. [https://www.postgresql.org/docs/18/explicit-locking.html#LOCKING-DEADLOCKS]
- **Work queues: `for update skip locked`** lets each worker take a different row without waiting; claim and mark in one statement (the `background-jobs` skill has the full pattern).
- **Postgres advisory locks** are for coordination only and never lock table rows. The key is a 64-bit number, so map the lock name to one with a stable hash that every instance computes the same way: `pg_try_advisory_xact_lock(hashtext('nightly-report'))` in SQL, not a language's per-process hash. Namespace names (`job:nightly-report`, `import:${tenantId}`) so unrelated locks don't collide. The `try` forms return `true` or `false` at once instead of waiting.
  `pg_try_advisory_xact_lock(key)` inside a transaction holds the lock until commit or rollback and releases automatically if the connection dies. Use it when the critical section is one transaction.
  A session lock (`pg_advisory_lock`) on a **dedicated, direct connection** suits work that spans several transactions or isn't database work at all. Its lifetime is the database session's: PostgreSQL releases it when that session ends, with no TTL to tune and no lease to renew. Network failure detection can take time, so a disconnected client does not establish immediate release. The old line promised release at once after a process crash. Release by `pg_advisory_unlock` and by closing the connection, so even a failed unlock can't leak. The price is one pinned connection per held lock: fine for rare, brief, per-user contention (two submissions racing to award the same badge), wrong at thousands of acquisitions per second (Redis territory) or for services that don't already share a database. Bound the wait with a statement timeout or by cancelling the query. A hash collision between two names only makes them occasionally wait for each other; it never breaks correctness. Session-level advisory locks (`pg_advisory_lock`) do not work reliably through a transaction-mode connection pooler (such as Supabase's pooled connection), because consecutive statements can land on different server connections: use the transaction-scoped form, or a direct connection. https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS and https://www.postgresql.org/docs/current/runtime-config-connection.html#RUNTIME-CONFIG-CONNECTION-TCP
  The blocking transaction form is `pg_advisory_xact_lock(hashtext('daily_report'))`, released at commit; do not create dummy rows merely to lock them.

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


For long work, claim in one short transaction, commit, do the slow work, then record the result. `read committed` plus `for update` on the changed rows is the source's default for most check-then-act code; choose by the invariant. PostgreSQL repeatable read also prevents phantom rows. [Existing background-jobs/CONCURRENCY.md, Row locks, timeouts and isolation in Postgres]

## Writing many rows

- **Batch inserts:** one `insert ... values (...), (...), ...` of up to about 1,000 rows instead of a round trip per row; `copy` for bulk loads (fastest, from a file or `stdin`).
- **Upsert atomically:** `insert ... on conflict (user_id, key) do update set value = excluded.value` (or `do nothing`), never select-then-insert, which races. The conflict target is matched to a unique index on exactly those columns.
- **Many lookups by key:** `where id = any($1::bigint[])` with one array parameter, not a query per ID.

## Prove it

Under a load test: backend count stays under the pool size, no `too many clients`, no `idle in transaction` sessions older than the timeout, and a session `set` made through the pooler never shows up on another client's connection. For a transaction at repeatable read or serializable, a test forces a serialization failure and the retry succeeds.
