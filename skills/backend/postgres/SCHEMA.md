# Schema

## Keys

- **`bigint generated always as identity`** for a table that lives in one database. Eight bytes, sequential (inserts land at the end of the index), the SQL standard. `serial` works but is the older form; prefer identity in new tables.
- **UUIDs only when IDs are made outside the database or must not be guessable, and then time-ordered (UUIDv7).** Random UUIDv4 keys scatter every insert across the index (page splits, a bigger, colder index, slower joins) and take 16 bytes. Postgres 18 has `uuidv7()` built in; earlier versions need an extension or the application to generate them. A ULID gives the same ordering.
- **`bigint` for every key and foreign key,** even on small tables: `int` stops at about 2.1 billion, and changing a key's type later rewrites the table and everything that references it.
- **Partitioned tables put the partition key in the primary key** and in every unique constraint; uniqueness across partitions on any other column isn't possible.

## Column types

| Use | Instead of | Why |
|---|---|---|
| `text` | `varchar(n)` | Same storage and speed; add a `check (char_length(x) <= n)` when the limit is a real rule |
| `timestamptz` | `timestamp` | Stores an instant; `timestamp` drops the zone and lies across zones and DST |
| `numeric(p, s)` or integer cents | `float`, `real` | Money and exact quantities can't round |
| `boolean` | `'yes'`/`'Y'`/`varchar(5)` | One byte, one meaning |
| `jsonb` | `json`, text holding JSON | Indexable, deduplicated keys; keep queried, joined or constrained fields as real columns |
| `text` with a `check (status in (...))` | `create type ... as enum` | A check is changed in one statement; removing or reordering enum values is not. An enum is fine for a set that only ever grows |

Avoid types tied to one extension or host when the schema may move.

## Constraints

- **`not null` on every column that always has a value,** which is most of them. A nullable column is a third state every query has to handle.
- **Let the database enforce invariants:** `unique` (single or multi-column), `check`, foreign keys, and exclusion constraints for non-overlapping ranges. A check-then-insert in application code races.
- **Index every foreign key column.** Postgres indexes the referenced side (it's a primary or unique key) but not the referencing one; without it, joins scan, and every delete or key update on the parent scans the child table while holding a lock. The query that lists unindexed foreign keys is in MONITORING.md.
- **Choose `on delete` on purpose** (`cascade`, `set null`, `restrict`) and write it out. Avoid circular foreign keys: they make inserts, deletes and restores order-dependent.
- **`created_at timestamptz not null default now()`** on every table; it costs nothing and answers "since when" later.

## Names

- **Lowercase `snake_case`, unquoted,** for every table, column, index and constraint. Postgres folds unquoted names to lowercase, so `"userId"` must be quoted forever and `select userId` fails; tools, ORMs and agents trip on it. Configure ORMs to emit snake_case. If a schema is stuck with mixed case, a view with snake_case aliases is the compatibility layer.
- **One convention, everywhere:** tables singular or plural but consistent; indexes `{table}_{columns}_idx`; constraints `{table}_{columns}_{kind}` (`orders_status_check`, `orders_customer_id_fkey`). A predictable name is what lets a migration check whether a constraint exists.

## Wide and large values

- **Rows over about 2 KB are TOASTed:** large values are compressed and moved to a side table. `select *` drags every one back. Select only the columns you use, and move large, rarely read columns to their own table.
- **Already compressed data** (images, archives) goes in columns set to `storage external`, which skips a useless compression pass. Better: keep files in object storage and store the key.

## Normalize first

Keep tables normalized; denormalize (a copied column, a summary table, a materialized view) only for a read path measured to be hot, and write down who keeps the copy in sync.

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
