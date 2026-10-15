# Measure, then remove work

## Get a breakdown

- Time each step of the request: every database query, every external call, the compute in between, serialization. Tracing (OpenTelemetry spans, set up as in the `observability` skill) shows it as a waterfall; at minimum, log durations per step with the request id.
- Measure on realistic data sizes and concurrency, several runs, and look at the slow end (p95, p99), not just the average.
- In Postgres, run `explain (analyze, buffers)` on the slow queries: look for sequential scans on large tables, row estimates far from actual rows, and sorts or joins spilling to disk. In Supabase, the query performance reports show the most expensive queries.
- In the browser, the Network panel waterfall shows requests that wait for each other and payloads that are too large.

Write the baseline: total time and each step, with the data size and environment. Then fix the slowest step first: it gives the biggest gain, and fixing it often reveals the next bottleneck. Repeat until the target is met, not until nothing is left.

## Remove work

- **Round trips add up.** Each trip to the database or another service costs milliseconds (often 5 to 10 or more) before any work happens, so ten trips in a loop are visible.
- **N+1 queries:** a query per item in a list. Load them in one query (a join, `where id = any($1)` / `in (...)`, or a batched loader).
- **Several queries for one response:** combine them into one database function that returns everything (`supabase.rpc(...)` returning JSON), or one Convex query that reads all it needs, instead of a round trip per piece.
- **Several calls to the same service:** ask it for one batched call that returns everything the caller needs.
- **The same calculation with the same arguments** several times in one request: compute once (memoize for the request's lifetime).
- **Repeated queries:** the same lookup several times in one request. Load once and pass it down.
- **Over-fetching:** select only the columns and rows the response needs; paginate.
- **Missing indexes:** an index that matches the filter and sort of the slow query (in Convex, `.withIndex()` instead of `.filter()` on large tables). When the database is the bottleneck, this is often the whole fix. [QUERIES.md](QUERIES.md) has the query shapes and which index serves which one.
- **Work that doesn't belong in the request:** move it to a background job and return sooner (see the `background-jobs` skill).

## Overlap independent waits

Calls that don't depend on each other can run at the same time:

```ts
// sequential: total = a + b + c
const loans = await getLoans(userId);
const holds = await getHolds(userId);
const recs = await getRecommendations(userId);

// overlapped: total = max(a, b, c)
const [loans, holds, recs] = await Promise.all([getLoans(userId), getHolds(userId), getRecommendations(userId)]);
```

- Use `Promise.allSettled` when one failing call shouldn't fail the whole response, and decide what to show without it.
- **Bound the concurrency** when the count depends on data (one call per item): a limit (for example 5 at a time) protects the dependency and your connection pool. Unbounded `Promise.all` over a large list is a self-inflicted outage.
- All of them share the request's deadline and cancellation signal (see the `api-design` skill's RELIABILITY.md).

## Cache last

Only after the above. A cache adds stale data and a second source of truth. Good candidates are read often and change rarely; decide how long a value may be stale and how it gets cleared before adding it ([CACHING.md](CACHING.md)).

## Compare honestly

Apply one change, re-measure the same way, record the result, then the next change. Keep a small table: change, before, after, conditions. Revert changes that didn't help; they're only complexity.

## Prove it

Take a reader dashboard that queries loans and calls two remote services. Measure the breakdown. Remove one repeated query and measure. Then run the two remote calls in parallel with a concurrency bound and measure again. Report each change's effect separately, with the conditions.
