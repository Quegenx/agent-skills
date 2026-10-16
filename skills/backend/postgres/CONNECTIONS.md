# Connections, transactions and locks

## Every connection is a process

Postgres forks one operating system process per connection: a few MB of base memory each, plus whatever its queries use, plus context switching. 500 connections on a small server spend their memory on processes instead of cache. `max_connections` defaults to 100, needs a restart to change, and `superuser_reserved_connections` (default 3) keeps the last slots for an administrator, so ordinary roles are refused a little before the limit.

- **Pool, then size:** a pooler (PgBouncer, the platform's pooler, or the driver's pool in a long-lived server) multiplexes many application connections onto a few backends. 1,000 clients often fit in 20 to 50 backends. A starting point is about two connections per CPU core; then size from observed concurrency and query memory, not from cores alone.
- **Serverless and edge functions** open many short-lived connections, which a driver's pool can't cover: always go through a server-side pooler there.
- **Alert at 80% of `max_connections`, page at 95%.** `too many clients already` means a leak or a missing pooler, not a limit to raise.

## Pool modes and what they forbid

| Mode | A backend is lent for | Use |
|---|---|---|
| Transaction | one transaction | Most application traffic: the most clients per backend |
| Session | the whole client session | Work that needs session state |

In transaction mode the next transaction may run on a different backend, so these break or leak:

- **Session `set` leaks to the next client.** A `set default_transaction_read_only = on` (or `search_path`, `statement_timeout`) stays on the backend and the next unrelated client inherits it; writes start failing with nothing in the config to explain it. Inside a transaction use `set local`, which ends with it; for anything else connect directly.
- **Named prepared statements:** `execute` may land on a backend that never prepared it (`prepared statement "x" does not exist`). Use the driver's unnamed or protocol-level statements, or turn preparing off (`prepare: false` in postgres.js, `prepareThreshold=0` in JDBC).
- **Temporary tables, `listen`/`notify`, session advisory locks** don't survive between transactions.

**Use a direct connection** (bypassing the transaction pooler) for migrations and other DDL, `pg_dump`, analytics and long reports, ETL and streaming, and any maintenance that changes session state.

**PgBouncer sizing:** `default_pool_size` is per user and database pair (default 20), so 2 users and 3 databases at 45 is 270 backends; 25 to 50 suits one or a few pairs, 10 to 25 when many pairs are active together. Keep the pooler's total under `max_connections` minus direct connections, with about 20% headroom.

## Timeouts

| Setting | Starting value | Catches |
|---|---|---|
| `statement_timeout` | 30 s for the application role, lower for user-facing paths | Runaway queries |
| `idle_in_transaction_session_timeout` | 30 s to 5 min | A transaction left open by a crashed or careless client: it holds locks and blocks vacuum everywhere |
| `idle_session_timeout` | about 10 min, for interactive sessions only (a pooler may not react well to the closed connection) | Clients that connect and forget |
| `lock_timeout` | a few seconds in migrations (`5s`) | A statement waiting too long to acquire a lock |

Set them per role (`alter role app set statement_timeout = '30s'`) or per transaction (`set local`), rather than globally; poolers have their own idle timeouts (`server_idle_timeout`, `client_idle_timeout`).

## Transactions

- **Read committed** (the default) takes a new snapshot per statement, so two statements in one transaction can see different data. **Repeatable read** keeps one snapshot from the first query; **serializable** makes concurrent transactions behave as if run one at a time. Both raise `could not serialize access` on conflicts, and the application **must retry** the whole transaction. Read uncommitted behaves as read committed.
- **Readers never block writers and writers never block readers;** only two writers on the same row wait. Row locks never escalate to table locks.
- **Keep them short:** call external APIs, validate input and do computation before `begin`; inside, only the statements that must be atomic.

```sql
-- After the payment API answered, outside any transaction:
update orders set status = 'paid', payment_id = $1
where id = $2 and status = 'pending'
returning *;
```

## Locks and deadlocks

- **Deadlocks come from taking the same locks in different orders.** Lock rows in one order everywhere (`select ... where id = any($1) order by id for update`), or change them in one statement. Postgres checks for a deadlock after waiting `deadlock_timeout` (default 1 s) and aborts one of the transactions; log them with `log_lock_waits = on` and count them in `pg_stat_database.deadlocks`.
- **Work queues: `for update skip locked`** lets each worker take a different row without waiting; claim and mark in one statement (the `background-jobs` skill has the full pattern).
- **Advisory locks** coordinate work that has no row to lock (one report generator at a time): `pg_advisory_xact_lock(hashtext('daily_report'))` releases at commit; `pg_try_advisory_lock` returns false instead of waiting. Session-level advisory locks don't work through a transaction pooler. Don't create dummy rows just to lock them.

## Writing many rows

- **Batch inserts:** one `insert ... values (...), (...), ...` of up to about 1,000 rows instead of a round trip per row; `copy` for bulk loads (fastest, from a file or `stdin`).
- **Upsert atomically:** `insert ... on conflict (user_id, key) do update set value = excluded.value` (or `do nothing`), never select-then-insert, which races. The conflict target is matched to a unique index on exactly those columns.
- **Many lookups by key:** `where id = any($1::bigint[])` with one array parameter, not a query per ID.

## Prove it

Under a load test: backend count stays under the pool size, no `too many clients`, no `idle in transaction` sessions older than the timeout, and a session `set` made through the pooler never shows up on another client's connection. For a transaction at repeatable read or serializable, a test forces a serialization failure and the retry succeeds.
