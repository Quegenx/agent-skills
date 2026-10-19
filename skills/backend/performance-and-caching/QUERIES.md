# Queries that let the database do the work

For queries that must return the right answer (joins that multiply, NULLs, ties, time zones, streaks, ranges, recursive data), see the `sql-patterns` skill. For pooling, vacuum, memory settings and the audit queries (unused indexes, bloat, `pg_stat_statements`), see the `postgres` skill.

The database filters, joins, aggregates, sorts and limits next to the data and the indexes. Code that fetches rows and does that work in the application moves the whole table over the network, holds it in memory, and issues one more query per row. The examples are Postgres SQL; the same shapes apply through supabase-js, Drizzle, Prisma or any query builder, and the check is the same: read the SQL it actually sends.

## The rules

1. **Filter, sort, project and limit before materializing.** In a builder, everything chained before the call that executes (`await`, `.findMany`, `.then`) becomes SQL; anything after runs in JavaScript on every row fetched. Fetching all rows then calling `.filter` is a full table transfer.
2. **Select only the columns the caller uses.** `select *` (or loading a row with all its relations) sends and deserializes data nobody reads, and defeats index-only scans.
3. **Ask the question you have.** "Does any exist?" is `exists`, which stops at the first hit; `count(*) > 0` counts them all.
4. **One query per screen, not one per row.** A loop that queries for each item (N+1) costs a round trip per row. Join, aggregate with `group by`, or fetch the children for all parents in one `where parent_id = any($1)`.
5. **The query count must not grow with the data.** Test it: log or count queries for 1 parent and for 100 parents; the number should be the same.
6. **Values are bound parameters,** never concatenated (the `secure-coding` skill).
7. **Check the plan, not the guess.** `explain (analyze, buffers)` on realistic data shows whether an index is used, how many rows each step reads, and where the time goes. Without `analyze`, PostgreSQL does not execute the main statement, but planning can evaluate immutable functions/operators. The old line's unconditional production-safety promise was too broad. [https://www.postgresql.org/docs/18/sql-explain.html; https://www.postgresql.org/docs/18/sql-expressions.html#SYNTAX-EXPRESS-EVAL]
8. **Write the clear query; compare the plans.** SQL text order isn't execution order. Equivalent simple join/subquery forms can produce the same plan, as in the source's measured PostgreSQL example. That is not a universal PostgreSQL, MySQL or SQL Server guarantee: PostgreSQL documents join/subquery collapse controls and planning effects. The source and old line said the plans were always the same. Claim a rewrite is faster only after comparing both plans. [milan-jovanovic, debunking-the-filter-early-join-later-sql-performance-myth; https://www.postgresql.org/docs/18/explicit-joins.html]

## Shapes worth knowing

**Existence and anti-join:**

```sql
select exists (select 1 from orders where customer_id = $1);                -- any order at all?

select c.id from customers c                                                -- customers in a country with no orders
where c.country = $1
  and not exists (select 1 from orders o where o.customer_id = c.id)
order by c.id;
```

`not exists` handles nulls correctly where `not in (subquery)` returns nothing if the subquery yields a null.

**Totals per parent in one query, instead of a query per customer:**

```sql
select c.id, c.name, coalesce(sum(o.total_cents), 0) as spent
from customers c left join orders o on o.customer_id = c.id
group by c.id, c.name;
```

**Top N with a stable tie-breaker:** aggregate, order and limit in one statement. Without the second sort key, rows with equal totals come back in arbitrary order and pages overlap or skip.

```sql
select customer_id, sum(total_cents) as spent
from orders group by customer_id
having sum(total_cents) > $1                    -- filter on the aggregate with having, not where
order by spent desc, customer_id asc
limit 10;
```

The `left join` with `coalesce` keeps customers who have no orders, with a total of 0; an inner join silently drops them from the report.

**Keyset (cursor) pagination:** continue after the last row seen, comparing the whole sort key as a row, instead of `offset`, which rereads every skipped row and shifts when rows are inserted.

```sql
select id, created_at from orders
where (created_at, id) > ($1, $2)        -- the last row of the previous page; id breaks ties on equal timestamps
order by created_at, id
limit 20;
```

An index on `(created_at, id)` in the same order serves it directly. Write the row comparison, not the expanded `created_at > $1 or (created_at = $1 and id > $2)`: the planner turns the row form into one index condition, while the `or` form is often applied as a filter over a long index scan (hundreds of milliseconds instead of under one on a million rows). The cursor sent to clients is these two values, encoded opaquely (the `api-design` skill's CONTRACT.md).

- **Fetch `limit + 1` rows** to learn whether another page exists without a count query; return `limit` and a cursor built from the last returned row.
- **What you give up:** jumping to page 37, a total page count, and cheap user-chosen sort orders (the cursor must carry every sort column, and each order needs its own index).
- **Offset is still fine** where users rarely leave the first pages: admin screens, small tables, UIs that need page numbers. Clamp the page size either way.

**Aggregate over aggregates:** compute the inner aggregate in a CTE, then aggregate that (average monthly revenue per customer = monthly sums first, then their average).

**Latest row per group:** `distinct on` keeps the first row per key in the given order.

```sql
select distinct on (device_id) device_id, taken_at, value
from measurements order by device_id, taken_at desc;
```

**Top N per group, running totals, change from the previous row:** window functions.

```sql
select * from (
  select p.*, row_number() over (partition by category_id order by sales desc, id) as rank
  from products p
) ranked where rank <= 3;

select day, amount, sum(amount) over (order by day) as running_total from daily_sales;

select month, revenue, revenue - lag(revenue) over (order by month) as change from monthly_revenue;
```

## Predicates the index can use (sargable)

An index on `created_at` can't help `where date_trunc('month', created_at) = $1` or `where extract(year from created_at) = 2026`, because the function wraps the column. Compare the bare column to a range:

```sql
where created_at >= $1 and created_at < $2      -- half-open: no gap or overlap at midnight
```

For "orders this month in the user's time zone", compute the month's start and next month's start in that zone once, convert both to UTC instants, and pass them as the bounds. Converting every row's timestamp to local time is the same unusable function on the column. The same applies to `lower(email) = $1` (store normalized and compare the bare column, index the expression `lower(email)`, or use the `citext` type), to casts on the column (`id::text like $1`), to arithmetic on it (`price * 1.2 > $1` becomes `price > $1 / 1.2`) and to `like '%term'` (a leading wildcard can't use a B-tree index). A wrapped column is worse than no index: still a full scan, plus one function call per row. When the function must stay, index the expression itself (`create index users_lower_email_idx on users (lower(email))`); the plan may then show a `Bitmap Index Scan` instead of an `Index Scan`, which also reads through the index instead of the whole table.

**A prefix `like 'abc%'` uses a B-tree only** when the index uses the `text_pattern_ops` operator class or the database collation is `C`. Under any other collation it's a sequential scan; check with `explain`.

A case-insensitive prefix search must use the same collation or expression (`lower(name)`) as its index. [Existing sql-patterns/SHAPES.md, LIKE with user input]

## Indexes that serve the query

- **Selectivity is one index benefit.** Low selectivity can favor a sequential scan, but an index can also supply ordering, stop early under an ordered limit, or support an index-only scan. The old line claimed only selective predicates benefit and treated one fifth of a table as a universal no-benefit cutoff. Inspect the actual plan and heap work instead. [https://www.postgresql.org/docs/18/indexes-ordering.html; https://www.postgresql.org/docs/18/indexes-index-only-scans.html]
- **Design from the queries, not the table.** List the access paths a table serves (by user, by issue, by issue and user newest first) and give each important one an index whose order matches it.
- **Equality columns first, then the sort column:** `create index on orders (customer_id, created_at desc)` serves `where customer_id = $1 order by created_at desc limit 20` by reading 20 index entries, with no sort step.
- **The leading columns decide.** A multicolumn index helps queries that constrain its first column (and then the next); the same `(customer_id, created_at)` index does little for a filter on `created_at` alone. Postgres 18 can skip-scan an index for a later column when the leading column has few distinct values; check the plan before dropping a dedicated index on that column.
- **Column order decides whether a sort disappears.** `(issue_id, user_id, created_at desc)` serves "this issue, this user, newest first" in one index scan, but for "latest comment per issue" it's sorted by user before date, so a sort runs once per issue. That query needs `(issue_id, created_at desc)`.
- **An outer `limit` stops early only if rows arrive in order.** "25 newest open issues, each with its latest comment" (a `cross join lateral (... order by created_at desc limit 1)`) needs both an index streaming issues newest first, `(status, created_at desc)`, and the per-issue index above; then each node reads only what it returns.
- **Index-only scans still visit the table** for rows changed since the last vacuum (the plan's `Heap Fetches`), to check visibility. A busy table may need more frequent vacuuming for the index-only plan to pay off.
- **Include the selected columns** (`include (total_cents)`) when an index-only scan is worth it on a hot path.
- **Partial indexes** for a common filter: `create index on jobs (run_at) where status = 'pending'`.
- **Pick the index type by operator:** B-tree (the default, every value in sorted order under a small tree, so one value in a million takes about 20 comparisons) for `=`, ranges, `in`, `is null`, sorting (`order by created_at desc limit 10` with no sort step) and prefixes (with the collation caveat above); GIN for arrays, `jsonb` containment (`@>`, `?`) and full-text (`jsonb_path_ops` supports `@>`, `@?` and `@@`, not key-existence operators; compare actual size; a single key is an expression index, `((attributes->>'brand'))`); GiST for geometry, range types and nearest-neighbour; BRIN for huge append-only tables whose rows are physically in time order (a tiny index); hash for equality only. The old line said only `@>` and gave a fixed size ratio. [https://www.postgresql.org/docs/18/datatype-json.html#JSON-INDEXING]
- Every index slows writes and takes space; add one for a measured slow query, and drop the ones nothing uses. An index whose columns are a prefix of another (`(issue_id)` next to `(issue_id, created_at)`) is usually redundant. Updates that change no indexed column and fit on the same page (HOT updates) skip index maintenance, so indexing a frequently updated column costs more than it looks. Sizes: `select indexrelname, pg_size_pretty(pg_relation_size(indexrelid)) from pg_stat_user_indexes where relname = 'comments';` (a three-column index on a million rows can be four times a single-column one). Each index is a second sorted copy of its columns, and two indexes on one text column can together outweigh the table; compare the table with its indexes:

```sql
select relname, pg_size_pretty(pg_relation_size(oid)) as size
from pg_class
where relname like 'users%' and relkind in ('r', 'i')                -- r: the table, i: its indexes
order by pg_relation_size(oid) desc;
```

## When a new index makes a query slower

Adding an index gives the planner another path, and it can misjudge that path's cost. A user's "latest 10 comments" query (`where user_id = $1 order by created_at desc limit 10`) ran from a `user_id` index plus a sort in 16 ms; after adding `(created_at desc)` for another screen, the planner walked that index newest first expecting to hit ten of the user's rows soon, discarded almost half a million rows (the user had stopped posting a year earlier) and took 241 ms. Fresh statistics don't help: per-column statistics know how many rows match, not where they sit in another column's order.

- **The fix is an index that serves both the filter and the order:** `(user_id, created_at desc)` reads ten entries (under 0.1 ms).
- **Compare important query plans before and after adding any index,** with the same parameters, then with representative ones: an active user and a dormant one. Testing only your busiest account hides this.
- **Read the work under `limit`:** a large `Rows Removed by Filter` or a jump in shared-buffer hits (`explain (analyze, buffers)`) is the signature. Investigate that before changing planner settings.
- **A sequential scan isn't always wrong.** On a small table, reading everything beats index lookups and the planner is right to choose it; judge plans on realistic data after `analyze`, and in tests assert on the plan for a large seeded table, not on timing.

## Text search

`like '%term%'` finds exact substrings, can't use a B-tree index, and can't rank. Full-text search uses tokenized text with configuration-specific stemming and stop words, indexed for matching and ranking. PostgreSQL's built-in ranking uses local document information: `ts_rank` uses matching-lexeme frequency, with optional normalization. The old explanation implied corpus-wide rarity/TF-IDF for the PostgreSQL example; do not infer that model from the presence of full-text ranking. [https://www.postgresql.org/docs/18/textsearch-controls.html#TEXTSEARCH-RANKING; https://www.postgresql.org/docs/18/textsearch-indexes.html]

For indexed substring matching, `pg_trgm` GIN/GiST operator classes can support `LIKE` and `ILIKE`, including leading wildcards. Full-text search changes matching semantics to tokens and stems; it is not a drop-in equivalent for a substring query. The source's claim that wildcard LIKE cannot use an index was too broad. [supabase/agent-skills, advanced-full-text-search; https://www.postgresql.org/docs/18/pgtrgm.html]

**In Postgres,** a generated, weighted search column and a GIN index:

```sql
alter table posts add column search tsvector generated always as (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||     -- title matches rank above body matches
  setweight(to_tsvector('english', coalesce(body, '')), 'B')) stored;
create index posts_search_idx on posts using gin (search);

select id, title, ts_rank(search, q) as rank
from posts, websearch_to_tsquery('english', $1) q                    -- accepts "quoted phrases" and -exclusions safely
where search @@ q
order by rank desc, id
limit 20;
```

Query with the same configuration (`'english'`) that built the vector, or stems won't match. With an expression index (`using gin (to_tsvector('english', body))`) instead of a stored column, the query must repeat that exact expression, or the index is skipped. Typo tolerance needs more: `pg_trgm` similarity, or a dedicated engine (Elasticsearch, OpenSearch, Typesense, Meilisearch) once you need facets, highlighting, synonyms or distributed indexing. Meaning-based search and hybrid ranking are in the `ai-features` skill's VECTOR-SEARCH.md.

**On a static site,** build the index at build time (MiniSearch, Lunr, Pagefind) with boosted fields (title over body), serve it compressed (Brotli shrank one 2.5 MB index to under 200 KB), load it once on the first search and cache it, then map results back to the documents and sort by score instead of date.

## Partitions and CTE materialization

The original SQL-patterns plan comparison demonstrates pruning and a deliberate optimization fence:

```sql
-- the planner skips partitions only when the filter compares the partition key itself
explain (costs off) select count(*) from audit where at >= '2026-02-01' and at < '2026-03-01';
explain (costs off) select count(*) from audit where date_trunc('month', at) = '2026-02-01';   -- scans every partition

-- a CTE referenced once is inlined into the query (Postgres 12+); materialized evaluates it once, as a fence
explain (costs off) with recent as (select * from orders) select * from recent where id = 10;
explain (costs off) with recent as materialized (select * from orders) select * from recent where id = 10;
```

Use `materialized` deliberately when an expensive CTE is referenced several times or must run exactly once; otherwise it blocks filters from reaching the underlying index. Partition lifecycle/retention belongs to [Postgres](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/postgres/SCHEMA.md#partitioning).

## Prove it

For the changed query: the SQL actually sent, the plan before and after on realistic row counts, the query count for 1 and for 100 parents, and a test that pins the ordering with ties (two rows with equal sort values come back in the tie-breaker's order).

**Prove an index on a throwaway table,** never on real data: a scratch Postgres (`docker run --rm -d --name pg-lab -e POSTGRES_PASSWORD=lab -p 5432:5432 postgres:17`, gone when stopped), `\timing on` in `psql`, and a million generated rows:

```sql
create table users (
  id bigint generated always as identity primary key,
  email text not null, country text not null, created_at timestamptz not null
);
insert into users (email, country, created_at)
select 'user' || n || '@example.com', (array['US', 'DE', 'BR', 'IN', 'JP'])[1 + n % 5], now() - n * interval '1 second'
from generate_series(1, 1000000) as n;
analyze users;                                                       -- fresh statistics now, instead of waiting for autovacuum

explain analyze select * from users where email = 'user424242@example.com';   -- before: Seq Scan, Rows Removed by Filter
create index users_email_idx on users (email);
explain analyze select * from users where email = 'user424242@example.com';   -- after: Index Scan using users_email_idx
```

Run each query twice (the first run may read from disk), compare `Execution Time` before and after, then try the cases that defeat it (a function on the column, a leading wildcard, a condition matching a fifth of the rows). Time a 200,000-row insert with every index in place and again after dropping the ones you don't need: fewer indexes, cheaper writes. Drop the table when done.
