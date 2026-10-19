---
name: "performance-and-caching"
description: "Measures and improves server and query performance, caching and production cost: request breakdowns, bounded parallel waits, query plans and indexes, cache validity/invalidation, Vercel metrics and telemetry-led audits. Use when an endpoint or query is slow, an index is not used, a cache misbehaves, or production latency or cost needs investigation."
---

# Performance and caching

Speed comes from doing less work, then from doing it at the same time, and only last from remembering it. A cache added before measuring hides the slow part, adds stale data and a second source of truth. Read the file for the step:

| The step | Read |
|---|---|
| Find where the time goes; cut round trips; parallelize (start early, await late; never ahead of an auth check; not for CPU-bound work); index; slow-route, cold-start and upstream thresholds on Vercel; deterministic counts and CI ratchets; steering an agent's perf push | [MEASURE.md](MEASURE.md) |
| Push filtering, aggregation, ordering and limits into SQL; anti-joins, top N, window functions, sargable predicates, keyset pagination, index design and index regressions, full-text search | [QUERIES.md](QUERIES.md) |
| Add, fix or remove a cache at any layer; Vercel CDN headers, `Vary`, 404s and `immutable`; what `cacheLife` proves; module-level and browser storage caches; large lookup data: fetch granularity, cache tiers, Bloom filters, indexed shards | [CACHING.md](CACHING.md) |
| Browser loading, media, layout shifts, long lists, main-thread work, interaction traces and Lighthouse gates | [web-performance](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-performance/SKILL.md) |
| Read production metrics on Vercel with `vercel metrics`: setup checks and what each failure means, Observability Plus access and retention, the query catalog with documented metric names, the window, limit and rate rules, Core Web Vitals good limits, project vs team cost | [VERCEL-METRICS.md](VERCEL-METRICS.md) |
| Audit production cost and performance from metrics: candidate gates, bounded investigations, abstentions and evidence-backed recommendations | [TELEMETRY-AUDIT.md](TELEMETRY-AUDIT.md) |

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

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
