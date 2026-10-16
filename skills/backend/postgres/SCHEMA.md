# Schema

## Keys

- **`bigint generated always as identity`** for a table that lives in one database. Eight bytes, sequential (inserts land at the end of the index), the SQL standard. `serial` works but is the older form; prefer identity in new tables.
- **UUIDs only when IDs are made outside the database or must not be guessable, and then time-ordered (UUIDv7).** Random UUIDv4 keys scatter every insert across the index (page splits, a bigger, colder index, slower joins) and take 16 bytes. Postgres 18 has `uuidv7()` built in; earlier versions need an extension, or the values are generated outside the database. A ULID gives the same ordering.
- **`bigint` for every key and foreign key,** even on small tables: `int` stops at about 2.1 billion, and changing a key's type later normally rewrites the table and its indexes.
- **Partitioned tables put the partition key in the primary key** and in every unique constraint; uniqueness across partitions on any other column isn't possible.

## Column types

| Use | Instead of | Why |
|---|---|---|
| `text` | `varchar(n)` | No performance difference, apart from a few CPU cycles to check the length |
| `timestamptz` | `timestamp` | Stores an instant; `timestamp` drops the zone and lies across zones and DST |
| `numeric(p, s)` | `float`, `real` | Recommended for money and other quantities where exactness is required |
| `boolean` | `'yes'`/`'Y'`/`varchar(5)` | One byte, one meaning |
| `jsonb` | `json`, text holding JSON | Supports indexing and containment queries, needs no reparsing, drops insignificant whitespace and keeps only the last of duplicate keys (`json` stores the exact text) |
| `text` with a `check (status in (...))` | `create type ... as enum` | A check is easier to modify; an enum's values can be added and renamed, but not removed or reordered short of dropping and re-creating the type |

Avoid types tied to one extension or host when the schema may move.

## Constraints

- **`not null` on every column that always has a value,** which is most of them.
- **Let the database enforce invariants:** `unique` (single or multi-column), `check`, foreign keys, and exclusion constraints for non-overlapping ranges. A check-then-insert in application code races.
- **Index every foreign key column.** The referenced side always has an index (it must be a primary key, a unique constraint or a non-partial unique index), but the referencing side doesn't get one; without it, joins scan, and every delete or key update on the parent scans the child table while holding a lock. The query that lists unindexed foreign keys is in MONITORING.md.
- **Choose `on delete` on purpose** (`cascade`, `set null`, `restrict`) and write it out. Avoid circular foreign keys.
- **`created_at timestamptz not null default now()`** on every table.

## Names

- **Lowercase `snake_case`, unquoted,** for every table, column, index and constraint. Postgres folds unquoted names to lowercase, so `"userId"` must be quoted forever and `select userId` fails; tools, ORMs and agents trip on it. Configure ORMs to emit snake_case. If a schema is stuck with mixed case, a view with snake_case aliases is the compatibility layer.
- **One convention, everywhere:** tables singular; indexes `{table}_{columns}_idx`; constraints `{table}_{columns}_{kind}` (`orders_status_check`, `orders_customer_id_fkey`). A predictable name is what lets a migration check whether a constraint exists.

## Wide and large values

- **Rows over about 2 KB are TOASTed:** large values are compressed and moved to a side table. `select *` drags every one back. Select only the columns you use, and move large, rarely read columns to their own table.
- **`jsonb` is for genuinely variable data:** webhook payloads, user-defined attributes, API responses. Keys every row has and that you filter or join on are columns.
- **A `jsonb` value is stored whole:** updating one key rewrites the entire document and every index on it. High-churn counters don't belong inside a big document.
- **Already compressed data** (images, archives) goes in columns set to `storage external`, which stores them out of line without compressing.

## Normalize first

Keep tables normalized; denormalize only for a read path proven to be hot.

## Partitioning

Partitioning helps maintenance and retention more than single-query speed. Plan it up front for tables that will grow: turning an existing table into a partitioned one is a migration of all its data.

| Table | Consider partitioning past |
|---|---|
| General | about 100 GB, or larger than memory, or about 20M rows |
| Time series, logs, events, audit trails, metrics | about 50 GB or 10M rows |

- **Range by time** for append-heavy data with retention (`partition by range (created_at)`, monthly or daily partitions); **list** by region, tenant or category, with a `default` partition for values nobody listed.
- **Queries must filter on the partition key,** or every partition is scanned (no pruning).
- **Create future partitions ahead of time** (a scheduled job or `pg_partman`); an insert with no matching partition fails.
- **Retire data by dropping or detaching a partition,** not by `delete`, which leaves dead rows for vacuum. `detach partition ... concurrently` (Postgres 14+) avoids an exclusive lock on the parent. Both are destructive: confirm first.
- **Indexes created on the parent** are created on every partition, including future ones.

```sql
create table events (
  id bigint generated always as identity,
  event_type text not null,
  payload jsonb,
  created_at timestamptz not null default now(),
  primary key (id, created_at)                    -- the partition key is part of the key
) partition by range (created_at);

create table events_2026_10 partition of events for values from ('2026-10-01') to ('2026-11-01');
```

## Prove it

Run the unindexed-foreign-key and mixed-case-name queries from MONITORING.md: both return nothing. Every column without `not null` has a stated reason. A test inserts a row that breaks each invariant (duplicate, bad status, overlapping range, orphan) and the database rejects it.
