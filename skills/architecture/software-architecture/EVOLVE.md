# Evolving the architecture: scale, split, replace

## Scale the monolith first

Find the constrained resource before choosing a fix; each step solves a different bottleneck. A practical order:

1. **Fix the code and queries:** missing indexes, N+1 queries, oversized payloads (the `performance-and-caching` skill).
2. **Cache what's read often and changes rarely,** at the right level: browser, CDN, application cache, database.
3. **Scale vertically** while it's cost-effective: it keeps everything simple. Its limits are a hardware ceiling, cost that grows faster than capacity, and a single point of failure. Move on when cost grows faster than users, you need redundancy or deploy downtime hurts the business. The source's about-70-percent utilization trigger is an author example, not a universal capacity ceiling. [milan-jovanovic, scaling-monoliths-a-practical-guide-for-growing-systems]
4. **Scale horizontally** behind a load balancer. The prerequisite is statelessness: token-based auth or a shared session store, a distributed cache, no local files. Converting a stateful app is real refactoring, so keep new code stateless from the start. In return: fault tolerance, rolling deploys and scaling down when quiet (details in the `system-design` skill).
5. **Move slow work to queues** and workers: file processing, emails, reports, search indexing, batch jobs. A queue accepts work at peak rate and processes it at a sustainable one (the `background-jobs` skill).
6. **Scale the database:**
   - **read replicas** for read-heavy load, with replication lag (read-your-own-writes from the primary), lag that grows with write volume, latency by region, and cost per replica;
   - **materialized views** for heavy aggregations and reports, refreshed on a schedule that trades freshness for load;
   - **sharding** only when the data outgrows one instance: by range (simple, but hot ranges become hotspots), by hash (even spread, but range queries fan out to every shard), or by tenant (natural isolation for multi-tenant systems, cross-tenant queries get hard).

A well-structured monolith goes a long way with a subset of these. Measure, then scale the part that's actually saturated.

## Deciding to split

The five questions in [SKILL.md](SKILL.md) decide whether a service boundary is worth it at all. In team terms: a modular monolith suits roughly 2 to 15 developers, strong consistency needs, chatty modules and limited operations capacity; services start paying off with a measured hotspot (an order of magnitude more load), many autonomous teams (dozens of developers), a genuinely different technology need, or hard fault isolation.

**Don't extract when:**

- **the boundaries are still moving** (endpoints migrating between modules, the shared kernel growing every sprint): extraction freezes the wrong boundary into a network contract;
- **the data is entangled:** modules that join each other's tables would replace joins with API calls; fix the data isolation first;
- **the goal is to "try microservices":** that's expensive learning;
- **check first that scaling the whole monolith horizontally is cheaper.** It usually is until the load asymmetry is extreme.

**Ready means:** a public API that is the only way in, its own schema with no foreign keys to other modules, and event-based communication for anything that doesn't need an immediate answer. Missing any of these, extraction produces a distributed monolith.

## Extracting a module into a service

**Pick the first candidate:** low coupling, high cohesion, a distinct function, and a measurable gain from separating it (the hot module, the one that deploys five times a day).

1. **Verify data isolation.** Find foreign keys that cross schemas, and replace each with an ID plus eventual consistency through events:

```sql
select con.conname, cn.nspname as child_schema, c.relname as child_table,
       pn.nspname as referenced_schema, p.relname as referenced_table
from pg_constraint con
join pg_class c      on c.oid = con.conrelid
join pg_namespace cn on cn.oid = c.relnamespace
join pg_class p      on p.oid = con.confrelid
join pg_namespace pn on pn.oid = p.relnamespace
where con.contype = 'f' and cn.nspname <> pn.nspname;
```

2. **Move the code into its own deployable** and make it self-contained; moving it reveals hidden dependencies the import graph missed (shared helpers, configuration, a table read "just once").
3. **Swap the transport behind the same interface.** Callers keep calling the module's public API; only the implementation changes from an in-process call to an HTTP client. This is why use-case-shaped public APIs matter.

```ts
// before: wired at the composition root as the in-process module
export interface CatalogApi {
  checkAvailability(productId: ProductId, quantity: number): Promise<boolean>;
}

// after: same interface, network implementation
export const catalogHttpClient = (baseUrl: string, fetchFn = fetch): CatalogApi => ({
  async checkAvailability(productId, quantity) {
    const res = await fetchFn(`${baseUrl}/products/${productId}/availability?quantity=${quantity}`, {
      signal: AbortSignal.timeout(2_000),                 // an in-process call couldn't time out; this one can
    });
    if (!res.ok) throw new Error(`CATALOG_HTTP_${res.status}`);
    return (await res.json()) as boolean;
  },
});
```

   The hop brings network failure: explicit timeouts, bounded retries with jittered backoff for idempotent calls, a circuit breaker, service-to-service authentication, versioned contracts and error mapping (the `api-design` skill's RELIABILITY.md).
4. **Replace in-memory events with a broker,** publishing through the outbox, because the broker can now be unreachable (the `messaging` skill).
5. **Give it its own pipeline, hosting, database instance and observability,** and propagate trace context across the hop.
6. **Migrate its data:** a one-time copy during a short maintenance window when that's acceptable, or continuous sync (change data capture) and a gradual switch when it isn't. Take a backup and have a rollback plan either way.
7. **Route with the strangler approach:** deploy the service alongside the monolith, route the module's traffic to it (a reverse proxy or gateway with path routing; it can also centralize rate limiting and caching), keep the in-process implementation until the service is proven, then delete it. Routing rollback follows the canonical [migration data contract](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/system-migration/SKILL.md#capture-compare-and-cut-over). A gateway doesn't restore the local transactions the split removed. [milan-jovanovic, when-to-extract-module-to-microservice; https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/strangler-fig.html]

Run the first extracted service in production for a while before extracting the next; the second one goes faster because the pipeline, tracing and messaging already exist.

## Replacing legacy code module by module (strangler fig)

Replace one bounded context at a time through the canonical [legacy migration procedure](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/system-migration/SKILL.md#rewriting-a-legacy-system): routing seam, module order, source of truth, synchronization, shadow reads, cutover and cleanup. The procedure preserves the source's module-specific example and its conflict with the existing core-first rule. [milan-jovanovic, strangler-fig-modular-monolith-migration]

## Prove it

For a legacy replacement, use the canonical [migration checks](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/system-migration/SKILL.md#prove-it). [milan-jovanovic, strangler-fig-modular-monolith-migration; https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/strangler-fig.html]
