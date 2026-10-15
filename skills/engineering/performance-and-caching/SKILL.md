---
name: "performance-and-caching"
description: "Makes slow endpoints, pages and queries fast in the right order - measure a breakdown first, remove round trips and N+1 queries, run independent waits in parallel with a bound, fix indexes, let SQL filter, aggregate, sort and limit (exists and anti-joins, top N with a tie-breaker, distinct on and window functions, predicates that don't wrap the indexed column, keyset pagination with row comparisons, composite index column order for filters, sorts and lateral latest-per-group queries, new indexes that make a query slower, Postgres full-text search with weighted tsvector columns and GIN, build-time search indexes for static sites) - and only then cache, with keys that include every input (content-addressed keys that never go stale), expiry, stampede protection that collapses concurrent misses into one refresh, failure cleanup, bounded memory, and invalidation across instances (pub/sub plus expiry). Covers each layer in a TypeScript stack: HTTP and CDN caching, TanStack Query on the client, Convex's automatic query cache, in-memory and Redis caches, and caching or timing added as a wrapper. Use when something is slow, when adding or debugging a cache, stale data, cache invalidation, thundering herd, when an index isn't used or a new index slowed a query, when adding search, or when asked to optimize an endpoint, query or page."
---

# Performance and caching

Speed comes from doing less work, then from doing it at the same time, and only last from remembering it. A cache added before measuring hides the slow part, adds stale data and a second source of truth. Read the file for the step:

| The step | Read |
|---|---|
| Find where the time goes; cut round trips; parallelize; index | [MEASURE.md](MEASURE.md) |
| Push filtering, aggregation, ordering and limits into SQL; anti-joins, top N, window functions, sargable predicates, keyset pagination, index design and index regressions, full-text search | [QUERIES.md](QUERIES.md) |
| Add, fix or remove a cache at any layer | [CACHING.md](CACHING.md) |

## The rules

1. **Measure before changing anything,** with a breakdown (database, each external call, compute, serialization), on realistic data and load. Write the baseline down.
2. **Change one thing at a time and re-measure.** A combined change can't tell you what helped, and one that didn't help should be reverted.
3. **Remove work before caching it:** fewer queries, fewer round trips, smaller payloads, the right index. Then overlap independent waits.
4. **A cache is a copy with a staleness budget.** Before adding one, write down how stale the data may be and who invalidates it. If nobody can answer, don't cache.
5. **The key is the complete set of inputs.** Any input left out of the key (user, locale, permissions, version) serves someone else's result.
6. **Results are evidence for their workload.** "15x faster" describes one endpoint, one data size, one machine. Report numbers with the conditions they were measured under, and don't promise them elsewhere.
7. **Keep concerns separate.** Caching, timing and retries wrap the real function (a decorator or higher-order function); they don't get tangled into its body. The wrapping order decides what each one sees: timing outside the cache measures hits and misses, timing inside measures only misses.

## Prove it

Before and after numbers for the same request, same data, same environment, each change measured separately. For a cache: the hit rate, the staleness after an update, and what happens on a cold start, a failing source and fifty concurrent misses for the same key.
