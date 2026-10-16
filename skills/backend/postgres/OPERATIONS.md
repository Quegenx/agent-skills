# Operations

## MVCC and vacuum

Every `update` writes a new row version and marks the old one dead; `delete` marks it dead. Dead rows stay until vacuum reclaims their space for reuse. A table updated constantly and never vacuumed grows (bloat), and every scan and index lookup wades through dead rows.

- **`vacuum`** runs alongside reads and writes and makes dead space reusable; it rarely shrinks the file. **`vacuum full`** rewrites the table under an exclusive lock: last resort. For online compaction use `pg_repack` or `pg_squeeze` (they need a primary key and about twice the table's space).
- **Vacuum can't remove rows newer than the oldest open transaction,** anywhere in the database. One session `idle in transaction` for hours (the most common cause), a long report, or a replication slot holding back the horizon, and bloat grows everywhere. Fix the transaction scope before touching vacuum settings.
- **Autovacuum starts on a table** when its dead rows exceed `autovacuum_vacuum_threshold + autovacuum_vacuum_scale_factor × rows` (default 20%), capped by `autovacuum_vacuum_max_threshold` (100M, Postgres 18+); insert-only tables are vacuumed by an insert threshold too (Postgres 13+), so they get frozen.
- **Tune per table, not globally,** for large or busy tables:

```sql
alter table orders set (
  autovacuum_vacuum_scale_factor = 0.02,     -- vacuum at 2% dead instead of 20%
  autovacuum_analyze_scale_factor = 0.01,    -- refresh statistics sooner
  autovacuum_vacuum_cost_delay = 0           -- on fast storage, don't throttle
);
```

  `autovacuum_vacuum_cost_limit` 1,000 to 2,000 on fast storage (the default of 200 is for spinning disks).
- **Statistics:** `analyze` (run by autovacuum) feeds the planner. After a big load or delete, run `analyze table` yourself; a planner that thinks a million-row table has a thousand rows chooses sequential scans and bad joins. Correlated columns get `create statistics (dependencies, ndistinct, mcv) on a, b from t`; skewed columns `alter column ... set statistics 500` to 1,000, then `analyze`.

## Transaction ID wraparound

Transaction IDs are 32-bit and compared modulo about 2 billion. Vacuum "freezes" old rows so their IDs never wrap. Unfrozen rows past the limit would look like they came from the future: invisible, as if deleted. Postgres warns from about 1.4 billion and stops accepting writes near 2 billion; recovery is a single-user-mode vacuum that can take days.

- **Alert when `age(datfrozenxid)` passes 40 to 50%** of the limit (800M to 1B), long before the warnings.
- **`autovacuum_freeze_max_age`** (default 200M) forces an anti-wraparound vacuum; **`vacuum_failsafe_age`** (default 1.6B, Postgres 14+) drops throttling and skips index cleanup to finish in time.
- **Never disable autovacuum,** and treat a stuck anti-wraparound vacuum (usually blocked by a long transaction or a slot) as an incident.

## Updates that skip the indexes (HOT)

An update that changes no indexed column and fits on the same page skips every index (a heap-only tuple). Aim for over 90% HOT on frequently updated tables:

- **Leave room on the page:** `alter table t set (fillfactor = 70)` to 80 on update-heavy tables; keep 100 for insert-only or read-mostly ones.
- **Don't index columns that change all the time** (`status`, `updated_at`, counters) unless a query needs it; a partial index narrows the cost.
- **Every extra index slows every write.** In one benchmark going from 7 to 39 indexes cut write throughput by more than half. Review tables with 5 to 10 indexes for unused and duplicate ones; over 10 needs an audit.

## Memory

| Setting | What it is | Starting point |
|---|---|---|
| `shared_buffers` | The shared page cache; restart to change | about 25% of RAM; much more starves the OS cache and slows checkpoints |
| `effective_cache_size` | A planner hint, allocates nothing | 50 to 75% of RAM |
| `work_mem` | Per sort or hash **operation**, per process | small globally (4 to 16 MB); raise per session for a heavy query |
| `hash_mem_multiplier` | Hashes may use this × `work_mem` | default 2 |
| `maintenance_work_mem` | Vacuum, index builds, adding foreign keys | 1 to 2 GB; cap autovacuum with `autovacuum_work_mem` |

**The worst case multiplies:** `work_mem × operations per query × (parallel workers + 1) × connections`. At 128 MB, two sorts and a hash join, two parallel workers and 100 connections, that is about 150 GB. It's rare, but it's how containers get killed for memory under a dashboard load. Raise `work_mem` only after `temp_blks_written > 0` shows queries spilling to disk, lower `max_parallel_workers_per_gather` on busy systems, keep a 1.5 to 2× safety margin, and check `dmesg` for OOM kills.

**Storage:** on SSDs set `random_page_cost = 1.1` (the default 4.0 assumes spinning disks, and pushes the planner away from indexes).

## WAL and checkpoints

Every change is written to the write-ahead log and flushed on commit before the data files are touched; recovery replays the WAL since the last checkpoint.

- **Checkpoints** happen every `checkpoint_timeout` (5 min) or when `max_wal_size` (1 GB, a soft limit) fills, whichever comes first; `checkpoint_completion_target = 0.9` spreads the writes. More than 10% of checkpoints requested by size (`num_requested` against `num_timed` in `pg_stat_checkpointer`, Postgres 17+; earlier in `pg_stat_bgwriter`) or "checkpoints are occurring too frequently" in the log means: raise `max_wal_size`. Longer intervals mean less I/O and longer crash recovery.
- **`wal_compression`** (`lz4` or `zstd` on Postgres 15+) shrinks full-page images in WAL, which helps write-heavy and replicated systems.
- **`pg_wal` growing without stopping** is almost always a replication slot nobody reads or a failing WAL archive.
- **`synchronous_commit = off`** on a non-critical write path returns before the WAL flush: up to about 600 ms of commits can be lost on a crash, but nothing is corrupted.

## Disk

Over 80% used is a risk, over 90% critical: vacuum and writes fail when the disk is full. Check inodes too (`df -i`). Sizes: `pg_total_relation_size('t')` (with indexes and TOAST), `pg_relation_size('t')`, `pg_database_size('db')`. TOAST tables bloat and need vacuum like any other.

## Backups and recovery

| Kind | Tool | Recovery point | Notes |
|---|---|---|---|
| Logical | `pg_dump` (`-Fc` custom, `-Fd -j 4` directory in parallel), `pg_restore -j` | the dump time, often 24 h | Portable across versions; restore one table with `-t`; slow on large databases |
| Physical | `pg_basebackup`, pgBackRest, Barman, WAL-G | the backup time | Same major version and platform; whole cluster |
| Point in time | base backup plus continuous WAL archiving | minutes | Restore to a timestamp, transaction or named restore point |
| Synchronous replica | streaming replication | zero | Failover in seconds to minutes; not a backup (a bad `delete` replicates too) |

- **Production uses a tool with retention and verification** (pgBackRest or the platform's point-in-time recovery), keeps about 7 daily, 4 weekly and 12 monthly copies, takes backups from a standby, and checks them with `pg_verifybackup` (Postgres 13+).
- **An `archive_command` must return success only once the file is safely stored,** test it as the postgres user (permission errors are the usual failure), and watch `pg_stat_archiver.failed_count`: a failing archive stops WAL recycling and fills the disk.
- **Restore on a schedule** into a scratch instance and time it; that time is your real recovery time.

## Replication

- **Streaming replicas** are read-only byte copies on the same major version. Without a replication slot the primary may recycle WAL a lagging replica still needs, and the replica must be rebuilt; with a slot, an offline replica makes the primary keep WAL until the disk fills. Cap it with `max_slot_wal_keep_size`, use `idle_replication_slot_timeout` (Postgres 17+), and drop slots nobody uses (after confirming).
- **Synchronous commit levels:** `local` waits for the local flush; `remote_write` for the replica's OS; `on` (default, with `synchronous_standby_names`) for the replica's disk; `remote_apply` until the replica applied it (read your writes on the replica). `FIRST 2 (a, b, c)` waits for the two highest-priority replicas; `ANY 2 (a, b, c)` for any two. Provision one more replica than the number you wait for, or one failure hangs every commit.
- **Failover:** `select pg_promote()` turns a replica into the primary, one way. Rebuild the old primary as a replica, or resync it with `pg_rewind` (needs `wal_log_hints = on` or data checksums), then update connection strings.
- **Replica reads lag:** route reads that must see the user's own write to the primary, or wait for the replica to catch up.

## Prove it

`age(datfrozenxid)` well under the alert line, no session `idle in transaction` past the timeout, HOT over 90% on the busiest tables, checkpoints mostly timed, WAL size and slot lag flat, disk under 80%, and a restore from last night's backup completed into a scratch database in a measured time.
