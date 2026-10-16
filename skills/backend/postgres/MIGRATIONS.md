# Migrations

A migration is a program that runs against live traffic. What decides whether it's safe is the lock it takes and how long it holds it, not whether the SQL is right. Release ordering (expand, migrate, contract) is the `deployment` skill's RELEASES.md and the `system-migration` skill.

## Locks first

- **`alter table` takes an `access exclusive` lock,** which conflicts with everything, `select` included; the `not valid` and `validate constraint` steps below are the lighter exceptions.
- **Set a `lock_timeout` in every migration** (`set local lock_timeout = '5s'`). On a busy table even a brief `access exclusive` lock can queue behind long-running queries; with a timeout the statement is aborted instead of waiting indefinitely, and you retry during a quieter period.
- **Run migrations on a direct connection, not through a transaction pooler** (CONNECTIONS.md).
- **Statements that rewrite the whole table** and its indexes: changing a column's type (normally; not when the old type is binary coercible to the new one and `using` doesn't change the contents), adding a column with a volatile default (`default clock_timestamp()`), `vacuum full` and `cluster` (both under an `access exclusive` lock).
- **Cheap since Postgres 11:** adding a column with a non-volatile default (evaluated once and stored in the table's metadata, no rewrite).

## Indexes

- **`create index concurrently`** on any table with traffic: it builds without locking out inserts, updates or deletes (a plain `create index` locks out writes until done). It takes significantly longer and can't run inside a transaction block, so give it its own migration step.
- **A failed concurrent build leaves an invalid index** that every write still maintains and no read uses. `create index concurrently if not exists` then silently does nothing, because the name exists. Check for invalid indexes (MONITORING.md), drop the invalid one, then retry.
- **Rebuild bloated indexes with `reindex index concurrently`** (Postgres 12+). Confirm before dropping or rebuilding anything.

## Constraints

- **There is no `add constraint if not exists`;** it's a syntax error. Make a constraint idempotent with a check on the catalog:

```sql
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_chart_id_key' and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles add constraint profiles_chart_id_key unique (chart_id);
  end if;
end $$;
```

  `contype` in `pg_constraint` tells the kind: `p` primary key, `f` foreign key, `u` unique, `c` check.
- **Add foreign keys and checks without scanning under a lock:** `add constraint ... not valid` (skips the scan and commits immediately; still enforced for new inserts and updates), then `validate constraint` in a later step (it doesn't lock out concurrent updates).
- **A unique constraint on a big table:** `create unique index concurrently`, then `add constraint ... unique using index`, which builds the constraint on the existing index.
- **`set not null` on a big table:** add `check (col is not null) not valid`, validate it, then `set not null` (since Postgres 12 a valid check that proves no nulls skips the scan), then drop the check.

## Data changes

- **Delete many rows in batches** (5,000 at a time), not in one statement over millions of rows, which holds locks for a long time, generates WAL and affects replication.

## Before running it

- **Test it in a staging environment first,** watching `pg_locks` and `pg_stat_activity` for queries waiting on locks.
- **Generated or diffed migrations** (an ORM, a schema diff tool, a declarative schema) are reviewed before they run.

## Prove it

The migration in staging: its duration, the locks it took (`select locktype, mode, granted from pg_locks where relation = 'orders'::regclass`), queries running alongside it never blocked longer than the lock timeout, and no invalid index left behind.
