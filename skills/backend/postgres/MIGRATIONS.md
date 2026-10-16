# Migrations

A migration is a program that runs against live traffic. What decides whether it's safe is the lock it takes and how long it holds it, not whether the SQL is right. Release ordering (expand, migrate, contract) is the `deployment` skill's RELEASES.md and the `system-migration` skill.

## Locks first

- **Set a `lock_timeout` in every migration** (`set lock_timeout = '5s'`). A statement that waits for an exclusive lock queues every later query on that table behind it, including plain reads; with a timeout it fails fast and you retry at a quieter moment.
- **Run migrations on a direct connection, not through a transaction pooler** (CONNECTIONS.md), and as an owner role separate from the application's role.
- **Statements that rewrite the whole table** under an exclusive lock: changing a column's type (most changes), adding a column with a volatile default (`default random()`), `vacuum full`, `cluster`. On a large table, do these as a new column plus a backfill instead.
- **Cheap since Postgres 11:** adding a column with a constant default (stored in the catalog, no rewrite).

## Indexes

- **`create index concurrently`** on any table with traffic: it builds without blocking writes (slower, and it can't run inside a transaction block, so give it its own migration step).
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
- **Add foreign keys and checks without scanning under a lock:** `add constraint ... not valid` (instant, enforced for new rows), then `validate constraint` in a later step (scans with a lighter lock that allows reads and writes).
- **A unique constraint on a big table:** `create unique index concurrently`, then `add constraint ... unique using index`.
- **`set not null` on a big table:** add `check (col is not null) not valid`, validate it, then `set not null` (Postgres 12+ uses the validated check and skips the scan), then drop the check.

## Data changes

- **Backfill in batches** (a few thousand rows per transaction, by key range), each committed, so locks stay short and vacuum keeps up. Never one `update` of every row.
- **Schema and data in separate steps:** the schema change deploys; a backfill job runs; a later migration adds the constraint the backfill made true.
- **Renames and drops follow the expand and contract order:** add the new thing, write to both, move reads, stop writing the old, then drop it, each step deployable on its own.

## Before running it

- **Run it on a copy with production-sized data,** timing it and watching `pg_locks`.
- **Write the down step,** or say plainly that it's forward-only.
- **Generated or diffed migrations** (an ORM, a schema diff tool, a declarative schema) are reviewed line by line for the locks above; tools happily emit a blocking `create index` or a type change that rewrites the table.

## Prove it

The migration on a production-sized copy: its duration, the locks it took (`select locktype, mode, granted from pg_locks where relation = 'orders'::regclass`), queries running alongside it never blocked longer than the lock timeout, no invalid index left behind, and the down step run once.
