# Operations

## MVCC and vacuum

Every `update` writes a new row version and marks the old one dead; `delete` marks it dead. Dead rows stay until vacuum reclaims their space for reuse. A table updated constantly and never vacuumed grows (bloat), and every scan and index lookup wades through dead rows. One `update` of every row leaves the whole table on disk twice (`n_dead_tup` about equal to `n_live_tup`) until vacuum runs.

- **`vacuum`** runs alongside reads and writes and makes dead space reusable; in most cases the extra space is not returned to the operating system (only an empty tail of the file is). It also updates the visibility map, which index-only scans rely on, and freezes rows against wraparound, which is why vacuum can never be switched off entirely. **`vacuum full`** rewrites the table under an exclusive lock: an outage, not maintenance, so last resort. For online compaction use `pg_repack` (it needs a primary key and about twice the table's space) or `pg_squeeze`.
- **Vacuum can't remove rows newer than the oldest open transaction,** anywhere in the database. One session `idle in transaction` for hours (the most common cause), a long report, an abandoned replication slot, or a long query on a hot standby with `hot_standby_feedback = on` holds back the horizon, and bloat grows everywhere. **`n_dead_tup` climbing while autovacuum keeps running** is the signature: find the old transaction or slot pinning the horizon and end it (after confirming) before touching vacuum settings.
- **Autovacuum starts on a table** when its dead rows exceed `autovacuum_vacuum_threshold + autovacuum_vacuum_scale_factor × rows` (default 20%), capped by `autovacuum_vacuum_max_threshold` (100M, Postgres 18+); insert-only tables are vacuumed by an insert threshold too (Postgres 13+), so they get frozen.
- **Tune per table, not globally,** for large or busy tables:

```sql
alter table orders set (
  autovacuum_vacuum_scale_factor = 0.02,     -- vacuum at 2% dead instead of 20%
  autovacuum_analyze_scale_factor = 0.02,    -- analyze at 2% changed instead of 10%
  autovacuum_vacuum_cost_delay = 0           -- on fast storage, don't throttle
);
```

  `autovacuum_vacuum_cost_limit` 1,000 to 2,000 on fast storage (the default, -1, uses `vacuum_cost_limit`, which is 200).
- **Statistics:** `analyze` (run by autovacuum) feeds the planner. After a big load or delete, run `analyze table` yourself; a planner that thinks a million-row table has a thousand rows chooses sequential scans and bad joins. Correlated columns get `create statistics (dependencies, ndistinct, mcv) on a, b from t`; skewed columns `alter column ... set statistics 500` to 1,000, then `analyze`.

## Transaction ID wraparound

Transaction IDs are 32-bit and compared modulo about 2 billion. Vacuum "freezes" old rows so their IDs never wrap. Unfrozen rows past the limit would look like they came from the future: invisible, as if deleted. Postgres warns when the oldest XIDs reach 40 million from the wraparound point and, with fewer than 3 million left, refuses new XIDs: only read-only transactions can start. Recovery is a manual `vacuum` run by a superuser, which can take hours to days on a large database; single-user mode is no longer necessary and should be avoided.

- **Alert when `age(datfrozenxid)` passes 40 to 50%** of the limit (800M to 1B), long before the warnings.
- **`autovacuum_freeze_max_age`** (default 200M) forces an anti-wraparound vacuum; **`vacuum_failsafe_age`** (default 1.6B, Postgres 14+) drops throttling and skips index cleanup to finish in time.
- **Never disable autovacuum.**

## Updates that skip the indexes (HOT)

An update that changes no indexed column and fits on the same page skips every index (a heap-only tuple). Aim for over 90% HOT on frequently updated tables:

- **Leave room on the page:** `alter table t set (fillfactor = 70)` to 80 on update-heavy tables; keep 100 for insert-only or read-mostly ones.
- **Don't index columns that change all the time** (`status`, `updated_at`, counters) unless a query needs it; a partial index narrows the cost.
- **Every extra index slows every write.** In one benchmark going from 7 to 39 indexes cut write throughput by more than half. Review tables with 5 to 10 indexes for unused and duplicate ones; over 10 needs an audit.

## Memory

| Setting | What it is | Starting point |
|---|---|---|
| `shared_buffers` | The shared page cache; restart to change | 25% of RAM on a dedicated server with 1 GB or more; much more starves the OS cache and slows checkpoints |
| `effective_cache_size` | A planner hint, allocates nothing | 50 to 75% of RAM |
| `work_mem` | Per sort or hash **operation**, per process | small globally (the default is 4 MB); raise per session for a heavy query |
| `hash_mem_multiplier` | Hashes may use this × `work_mem` | default 2 |
| `maintenance_work_mem` | Vacuum, index builds, adding foreign keys | 1 to 2 GB; cap autovacuum with `autovacuum_work_mem` |

**The worst case multiplies:** `work_mem × operations per query × (parallel workers + 1) × connections`. At 128 MB, two sorts and a hash join, two parallel workers and 100 connections, that is about 150 GB. It's rare, but it's how containers get killed for memory under a dashboard load. Raise `work_mem` only after `temp_blks_written > 0` shows queries spilling to disk, lower `max_parallel_workers_per_gather` on busy systems, keep a 1.5 to 2× safety margin, and check `dmesg` for OOM kills.

**Storage:** on SSDs set `random_page_cost = 1.1` (the default 4.0 assumes spinning disks; lowering it relative to `seq_page_cost` makes the planner prefer index scans).

## WAL and checkpoints

The WAL corresponding to a dirty data page must reach durable storage before that page is written. Data pages can be written before their transaction commits once their WAL is durable; the old line incorrectly made commit the boundary before any data-file write. Recovery replays the WAL since the last checkpoint. [https://www.postgresql.org/docs/18/wal-intro.html; https://www.postgresql.org/docs/18/wal-configuration.html]

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
| Synchronous replica | streaming replication | zero | Failover in seconds to minutes |

- **Point-in-time recovery:** a base snapshot plus the continuous write-ahead log lets you restore to any second before the incident (a bad migration, a mass delete), not just last night. Managed Postgres (including Supabase's PITR add-on) does this; self-hosted, use a tool like pgBackRest or WAL-G with off-site storage. Snapshots alone lose everything since the last one.

- **Production uses a tool with retention and verification** (pgBackRest), keeps about 7 daily, 4 weekly and 12 monthly copies, takes backups from a standby, and checks them with `pg_verifybackup` (Postgres 13+).
- **An `archive_command` must return success only once the file is safely stored,** test it as the postgres user (permission errors are the usual failure), and watch `pg_stat_archiver.failed_count`: a failing archive stops WAL recycling and fills the disk.
- Follow the canonical [recovery procedure](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/deployment/SKILL.md#recovering-a-data-platform) for scratch restores, reconciliation, projection replay, erasures, control-plane failure and measured recovery targets.

## Replication

- **Streaming replicas** are read-only byte copies on the same major version, replaying the primary's WAL, usually milliseconds behind. Point reports, analytics and read-heavy endpoints at them.
- **Set one up:** on the primary, `create role replicator with replication login password '...'` and a `pg_hba.conf` line for it (`host replication replicator 10.0.0.2/32 scram-sha-256`); on the replica, `pg_basebackup -h primary.internal -U replicator -D /var/lib/postgresql/data -R -P`. `-R` writes the connection settings and a `standby.signal` file; start Postgres and it streams.
- **Lag is real:** a user who saves on the primary and reloads from a replica that hasn't replayed it yet sees the old data. Route read-your-own-writes to the primary (or use `remote_apply`, below). Lag queries for both sides are in MONITORING.md.
- **Long replica queries conflict with incoming WAL:** by default the replica cancels the query after `max_standby_streaming_delay`. `hot_standby_feedback = on` avoids the cancellations at the price of bloat on the primary, since the primary's vacuum then waits for the replica's queries.
- **Slots:** without a replication slot the primary may recycle WAL a lagging replica still needs, and the replica must be rebuilt; with a slot, an offline replica makes the primary keep WAL until the disk fills. Cap it with `max_slot_wal_keep_size`, use `idle_replication_slot_timeout` (Postgres 18+), and drop slots nobody uses (after confirming).
- **Replication is asynchronous by default:** a primary crash can lose the last few transactions. `synchronous_commit = on` with `synchronous_standby_names` makes the primary wait for the replica's acknowledgment: zero data loss, higher commit latency, and writes stall if the synchronous replica dies. Most setups run async and accept seconds of exposure.
- **Synchronous commit levels:** `local` waits for the local flush; `remote_write` for the replica's OS; `on` (default, with `synchronous_standby_names`) for the replica's disk; `remote_apply` until the replica applied it (read your writes on the replica). `FIRST 2 (a, b, c)` waits for the two highest-priority replicas; `ANY 2 (a, b, c)` for any two. Provision one more replica than the number you wait for, or one failure hangs every commit.
- **Failover:** `select pg_promote()` (or `pg_ctl promote -D /var/lib/postgresql/data`) turns a replica into the primary, one way: it stops recovery and accepts writes. Apply the canonical [writer-fencing rule](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/deployment/SKILL.md#recovering-a-data-platform) and repoint clients. Rebuild the old primary as a replica, or resync it with `pg_rewind` (needs `wal_log_hints = on` or data checksums), then update connection strings. Patroni or pg_auto_failover automate this; managed services hide it.

## Prove it

`age(datfrozenxid)` well under the alert line, no session `idle in transaction` past the timeout, HOT over 90% on the busiest tables, checkpoints mostly timed, WAL size and slot lag flat, disk under 80%, and a restore from last night's backup completed into a scratch database in a measured time.
