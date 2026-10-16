# Monitoring and audits

Statistics accumulate since the last reset or restart: check `stats_reset` in `pg_stat_database` (and the server start time) before trusting a zero. Reset only after a major change, never routinely, and confirm first: a reset erases the baseline that tells an unused index from a monthly one. Prefer snapshotting stats into external monitoring.

## Logs first

Postgres says what's wrong in its log. Useful settings: `log_min_duration_statement` (100 to 500 ms in development, 1 to 3 s for OLTP, 30 to 60 s for analytics), `log_checkpoints`, `log_connections`, `log_disconnections`, `log_lock_waits`, `log_temp_files = 0`, and CSV output for a report tool such as pgBadger.

## The views

| View | Answers |
|---|---|
| `pg_stat_activity` | What is running now, its state, wait events, who blocks whom (`pg_blocking_pids(pid)`) |
| `pg_stat_statements` | Which statements cost the most in total, on average, and in calls; needs `shared_preload_libraries = 'pg_stat_statements'` and the extension |
| `pg_stat_database` | Cache hit ratio, temp files, deadlocks, connections per database |
| `pg_stat_user_tables` | Sequential against index scans, dead rows, last vacuum and analyze |
| `pg_stat_user_indexes` | How often each index is used |
| `pg_stat_checkpointer` (17+), `pg_stat_bgwriter`, `pg_stat_io` | Checkpoints and who writes to disk |
| `pg_stat_replication`, `pg_replication_slots`, `pg_stat_archiver` | Lag, retained WAL, archive failures |
| `pg_stat_progress_vacuum` | Vacuums running now |

## Queries

**The costliest statements:**

```sql
select calls, round(total_exec_time::numeric, 1) as total_ms, round(mean_exec_time::numeric, 1) as mean_ms,
       100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) as cache_hit_pct, query
from pg_stat_statements order by total_exec_time desc limit 10;
```

Sort by `mean_exec_time` for the slowest, by `calls` for the chattiest (an N+1 shows as one cheap statement with enormous calls). A rising `temp_blks_written` means sorts spilling past `work_mem`.

**Reading a plan** (`explain (analyze, buffers)`): a `Seq Scan` on a large table with a big `Rows Removed by Filter` wants an index; `read` far above `hit` means the data isn't cached; a `Nested Loop` with huge `loops` wants a different join; `Sort Method: external merge` means `work_mem` is too small for that query. Under `Gather`, a `Parallel Seq Scan` with `loops=3` is the leader plus two workers each reading a third, and its `rows` are per loop.

**Unused indexes** (excluding unique, constraint and expression indexes):

```sql
select s.schemaname, s.relname as table_name, s.indexrelname as index_name,
       pg_size_pretty(pg_relation_size(s.indexrelid)) as size
from pg_stat_user_indexes s join pg_index i on i.indexrelid = s.indexrelid
where s.idx_scan = 0
  and 0 <> all (i.indkey)
  and not i.indisunique
  and not exists (select 1 from pg_constraint c where c.conindid = s.indexrelid)
order by pg_relation_size(s.indexrelid) desc;
```

Check how long stats have been collecting before calling one unused. Primary key and unique indexes are left out on purpose: they enforce rules about the data, not just speed, so never drop one because of this number.

**Duplicate indexes:**

```sql
select schemaname || '.' || tablename as table_name, array_agg(indexname) as duplicates
from pg_indexes
where schemaname not in ('pg_catalog', 'information_schema')
group by schemaname, tablename, regexp_replace(indexdef, 'INDEX \S+ ON ', 'INDEX ON ')
having count(*) > 1;
```

Indexes that differ in operator class, collation, predicate or sort order aren't duplicates even if they look alike.

**Invalid indexes** (a failed concurrent build, maintained on every write and never read):

```sql
select indexrelid::regclass from pg_index where not indisvalid;
```

**Foreign keys without an index:**

```sql
select c.conrelid::regclass as table_name, a.attname as fk_column
from pg_constraint c
join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
where c.contype = 'f'
  and not exists (select 1 from pg_index i where i.indrelid = c.conrelid and a.attnum = any (i.indkey));
```

**Indexes per table** (over 10 needs an audit):

```sql
select relname, count(*) from pg_stat_user_indexes group by relname order by count(*) desc;
```

**Index bloat** (`create extension pgstattuple`): `select avg_leaf_density from pgstatindex('orders_customer_id_idx');` 80 to 90% is healthy, under 70% is bloated. Vacuum doesn't compact index pages; `reindex index concurrently` does.

**HOT updates per table:**

```sql
select relname, round(100.0 * n_tup_hot_upd / nullif(n_tup_upd, 0), 1) as hot_pct
from pg_stat_user_tables where n_tup_upd > 0 order by n_tup_upd desc;
```

**Dead rows and vacuum:**

```sql
select relname, n_dead_tup, last_autovacuum, last_autoanalyze
from pg_stat_user_tables order by n_dead_tup desc;      -- a null last_autovacuum: never vacuumed
```

**Wraparound:**

```sql
select datname, age(datfrozenxid), round(100.0 * age(datfrozenxid) / 2147483648, 1) as pct
from pg_database order by 2 desc;
```

**Long transactions:**

```sql
select pid, state, now() - xact_start as age, left(query, 80)
from pg_stat_activity where xact_start is not null order by xact_start;
```

**Who blocks whom:**

```sql
select blocked.pid as blocked_pid, blocked.query as blocked_query,
       blocking.pid as blocking_pid, blocking.query as blocking_query, blocking.state as blocking_state
from pg_stat_activity blocked
join pg_stat_activity blocking on blocking.pid = any (pg_blocking_pids(blocked.pid));
```

A blocker in state `idle in transaction` holds locks while running nothing: end it with `pg_terminate_backend(pid)` (below), after confirming.

**Connections:**

```sql
select state, count(*) from pg_stat_activity where backend_type = 'client backend' group by state;

select count(*) as used, max(s.max_conn) - count(*) as free
from pg_stat_activity, (select setting::int as max_conn from pg_settings where name = 'max_connections') s
where backend_type = 'client backend';
```

**Replication lag and slots:**

```sql
select application_name, pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) / 1048576 as lag_mb from pg_stat_replication;
select slot_name, active, pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) / 1048576 as retained_mb from pg_replication_slots;
select client_addr, state, pg_wal_lsn_diff(sent_lsn, replay_lsn) as replay_lag_bytes from pg_stat_replication;   -- sent but not yet replayed
```

On the replica itself:

```sql
select pg_is_in_recovery();                                      -- true on a replica
select now() - pg_last_xact_replay_timestamp() as replication_lag;
```

**WAL on disk:** `select count(*), pg_size_pretty(sum(size)) from pg_ls_waldir();`

**Mixed-case names** (each must be quoted forever):

```sql
select table_name, column_name from information_schema.columns
where table_schema = 'public' and (table_name <> lower(table_name) or column_name <> lower(column_name));
```

**A stuck query:** `select pg_cancel_backend(pid)` cancels the session's current query; `pg_terminate_backend(pid)` terminates the session, which can abort its in-flight transaction. Confirm before either.

## Outside the database

Postgres can't see the host. Watch it yourself: CPU steal over 10% on a VM, load above the core count; any swap at all; disk `%util` near 100 or `await` over 10 ms (`iostat -x`); disk space and inodes; packet loss and retransmits. An interactive view (`pg_activity`) on the database host shows queries next to CPU, memory and I/O.

## Before optimizing, check

Unused and duplicate indexes; audit and log tables over 10 GB to archive; tables over 100 GB (or 500 GB) to consider for partitioning; extensions the host actually supports; circular foreign keys; random UUID keys on large tables; a pooler in front of OLTP traffic. Confirm with a person before removing, dropping or archiving any of it.
