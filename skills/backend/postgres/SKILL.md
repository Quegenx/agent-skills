---
name: postgres
description: "Runs Postgres well in production: schema and column types, migrations that don't lock or fail, connections and pooling, transactions and locks, vacuum and wraparound, memory, WAL, backups and replication, and the audit queries that find unused indexes, bloat and missing foreign key indexes. Use when designing tables, writing a migration, connections run out, the database is slow or bloated, or before any destructive database change."
---

# Postgres

Most production Postgres trouble is not a slow query but the machinery around it: a migration that takes a lock for ten minutes, a pool that leaks session settings, one forgotten open transaction that stops vacuum for the whole database, a column type chosen once and paid for forever. Query correctness is the `sql-patterns` skill; query speed and index design are the `performance-and-caching` skill's QUERIES.md; row-level security is the `secure-coding` skill's TENANCY.md and, on Supabase, the `supabase` skill.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Tables, keys, column types, constraints, names, partitioning | [SCHEMA.md](SCHEMA.md) |
| Migrations that don't lock, fail halfway or break deploys: indexes, constraints, columns, backfills | [MIGRATIONS.md](MIGRATIONS.md) |
| Connections, poolers and their limits, timeouts, transactions, locks, deadlocks, upserts, batches | [CONNECTIONS.md](CONNECTIONS.md) |
| MVCC, vacuum, wraparound, memory, WAL and checkpoints, storage, backups, replication | [OPERATIONS.md](OPERATIONS.md) |
| The queries that audit a database: slow statements, unused and duplicate indexes, bloat, missing FK indexes, dead rows, connections, lag | [MONITORING.md](MONITORING.md) |
| PlanetScale Postgres targets and pooling, current Insights/inspection surfaces, query-pattern API and extension availability | [PLANETSCALE.md](PLANETSCALE.md) |

## The rules

1. **Confirm with a person before anything destructive:** dropping or rebuilding an index, dropping, detaching or archiving tables and partitions, terminating a backend, dropping a replication slot, resetting statistics. Each can look unused in recent stats and still serve a monthly job, a replica or a recovery path.
2. **Measure before tuning.** Read `pg_stat_statements`, the plan (`explain (analyze, buffers)`) and the logs first; change settings per session or per table before globally.
3. **Keep transactions short.** No network calls, user waits or sleeps inside a transaction. An open transaction holds its locks and stops vacuum from cleaning anything newer than it, in every table.
4. **Pool connections before raising `max_connections`.** Every connection is an operating system process with its own memory.
5. **Never disable autovacuum, `fsync` or `full_page_writes`.** Autovacuum is the only thing standing between you and transaction ID wraparound; the other two trade a crash for corrupted data.
6. **Every migration is checked for the lock it takes** and runs with a `lock_timeout`, so a lock it can't get aborts it after a few seconds instead of waiting indefinitely, and you retry during a quieter period.
7. **Backups count only once a restore has been tested.**
8. **Platform settings change:** on a managed host (Supabase, PlanetScale, Neon, RDS), check its docs for which settings, extensions and ports you control before relying on them.

## Prove it

Use the checks for the selected operation. The million-row table is an index exercise, not required setup for every index task. A restore applies to backup/recovery work; other operations use the relevant topic's evidence and audit queries.

For a schema change: the migration on a copy of production-sized data, its lock taken and its duration, and a rollback. For a performance change: before and after numbers from `pg_stat_statements` or the plan; for an index, the throwaway million-row table in the `performance-and-caching` skill's QUERIES.md (Prove it). For operations: a restore from the latest backup into a scratch database, and the audit queries in MONITORING.md run with their results read.
