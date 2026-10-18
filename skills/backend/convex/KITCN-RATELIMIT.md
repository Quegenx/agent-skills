# kitcn rate limiting

This topic preserves udecode/kitcn's `references/features/ratelimit.md` and the rate-limit setup in `references/setup/server.md`, checked against the current first-party rate-limit documentation and implementation. Use it only for an application that has selected kitcn; [kitcn setup](KITCN-SETUP.md) owns scaffolding and registration.

## Algorithms and budgets

[udecode/kitcn, references/features/ratelimit.md; https://kitcn.dev/docs/plugins/ratelimit]

| Builder or option | Contract |
| --- | --- |
| `Ratelimit.fixedWindow(limit, window, options?)` | Replenishes `limit` tokens per window. `capacity` is the stored ceiling and defaults to `limit`; a larger capacity provides burst headroom. `start` is an epoch offset in milliseconds for window alignment. |
| `Ratelimit.slidingWindow(limit, window, options?)` | Weights the previous window across the current window boundary. Reservation is unsupported. |
| `Ratelimit.tokenBucket(refillRate, interval, maxTokens, options?)` | Refills at the configured rate up to `maxTokens`. |
| `shards` | Defaults to `1`. Distributes the configured budget across shards, rather than duplicating it. Increase only after observing contention on hot identifiers. |
| `maxReserved` | A finite, non-negative borrowing ceiling when supplied. Applies to fixed windows and token buckets. Omission leaves reservation headroom uncapped. |
| `window` and `interval` | Accept raw milliseconds or duration strings with optional space, using `ms`, `s`, `m`, `h` or `d`. Exported millisecond constants are `SECOND`, `MINUTE`, `HOUR`, `DAY` and `WEEK`. |

Shards receive whole-token shares with the remainder on low-numbered shards; fractional totals retain their fractional part on one shard. Whole-token reservation headroom is dealt the same way. Token-bucket refill rates are proportional to the shard's capacity share, preserving the configured total across uneven capacities.

One call spends from one shard. Builders reject configurations where `limit / shards`, `capacity / shards` or token-bucket `maxTokens / shards` is below `1`. The source recommends a shard share at least ten times the largest requested count; this is workload guidance, rather than a Convex limit. Preferred shard candidates are tried first; remaining candidates are read concurrently before denial. Fixed-window response `limit` remains the configured refill even when stored `capacity` is larger.

## Enforcement and failure behavior

[udecode/kitcn, references/features/ratelimit.md; https://kitcn.dev/docs/plugins/ratelimit]

| Method | Operation and Convex context |
| --- | --- |
| `limit(identifier, options?)` | Consumes tokens. Requires a mutation database writer. Enforce on the server before protected work. |
| `check(identifier, options?)` | Evaluates the requested count and reservation mode without consuming database tokens. Works with a query reader. It represents the decision at that moment, rather than reserving a later request. |
| `getRemaining(identifier)` | Reads every shard for an exact remaining count at one common timestamp; query reader is sufficient. |
| `getValue(identifier, { sampleShards }?)` | Returns a projection snapshot; defaults to one sampled shard. Works with a query reader. |
| `resetUsedTokens(identifier)` | Clears the identifier's stored state; requires a mutation writer. |
| `setDynamicLimit({ limit })` | Writes an override or clears it with `limit: false`; requires a mutation writer and `dynamicLimits: true`. |
| `getDynamicLimit()` | Returns `{ dynamicLimit: number \| null }`; works with a query reader and requires `dynamicLimits: true`. |
| `blockUntilReady()` | Requires timers, so use an action or a non-Convex runtime. Queries and mutations receive guidance to use those contexts. `limit()` and `check()` do not use timers. |

`LimitRequest` accepts `count` or its `rate` alias, `reserve`, and the protection signals `ip`, `userAgent` and `country`; `geo` is reserved for future rules. Sliding windows reject reservation. `RatelimitResponse.success` and `ok` are identical. Other fields include `limit`, floored `remaining`, epoch-millisecond `reset`, asynchronous-side-effect `pending`, optional `reason`, and `deniedValue` when the reason is `denyList`.

| Constructor option | Default or behavior |
| --- | --- |
| `db` | The database context. Required for database methods; `hookAPI()` obtains it from its query or mutation context. |
| `limiter` | Required resolved algorithm from an algorithm builder. |
| `prefix` | Defaults to `kitcn/ratelimit`; separates stored scopes. |
| `failureMode` | `closed` by default: timeout denies. `open` permits on timeout. |
| `timeout` | `5000` milliseconds. |
| `dynamicLimits` | `false` by default; disabled dynamic-limit methods throw. |
| `enableProtection` | `false` by default; enables repeated-failure tracking. |
| `denyListThreshold` | `30` when protection is enabled. |
| `denyList` | Optional static `identifiers`, `ips`, `userAgents` and `countries` lists. |
| `ephemeralCache` | An instance-local map by default, a supplied shared map, or `false` to disable. |

Reasons are `timeout`, `cacheBlock`, `denyList` and `requestTooLarge`. A fail-open timeout returns `success: true` with `reason: 'timeout'`; the presence of a reason does not prove rejection. Application-layer limiting protects business logic and expensive downstream work; it is not a network firewall or DDoS shield.

The implementation's `check()` avoids database token writes, but protection and cache bookkeeping can still change in memory. The source's broader statement was that it "never writes". [https://github.com/udecode/kitcn/blob/main/packages/kitcn/src/ratelimit/ratelimit.ts]

## Exact reads and snapshots

[udecode/kitcn, references/features/ratelimit.md; https://kitcn.dev/docs/plugins/ratelimit]

Use `getRemaining()` for quota headers and banners. It evaluates all raw shards at one common timestamp and sums independently usable whole tokens. It does not let a saturated shard absorb another shard's refill, subtract reserved debt from an open peer, or merge fractions that cannot be spent across isolated shards.

Use `getValue()` for cheaper client projections. Its sampled token total is scaled by sampled capacity share, so partial samples are estimates. `limit()` and `check()` response `remaining` is also extrapolated from the serving shard under sharding. Sampling every shard preserves independent state for later projections.

| Snapshot or calculation | Meaning |
| --- | --- |
| `RatelimitSnapshot.value` | Tokens left, projected to a common read timestamp. |
| `ts` and `config` | State-update timestamp and resolved algorithm for projection. |
| `shard` | The sampled shard holding the most tokens, rather than the only shard. |
| `state` | Projected aggregate plus every sampled shard state. Sliding windows retain `value`, `auxValue`, `ts` and `auxTs`. |
| `snapshotToState(snapshot)` | Converts the remaining-token snapshot to the stored-state form consumed by `calculateRatelimit()`. Required because sliding windows store used counts. |
| `calculateRatelimit(state, config, timestamp, count)` | Calculates without database access. `remaining` floors at zero; `remainingRaw` retains negative overdraw. Full-shard state preserves independent saturation and sliding-window decay in later projections. |

For a denied reserved fixed-window or token-bucket request, `reset` is when the request fits within `maxReserved`, rather than when all debt is repaid. A count above every shard's capacity plus finite reservation headroom returns `requestTooLarge` and `reset: 0` without reading shard state. Smaller unusable shards do not influence retry deadlines. Snapshot projections retain permanent denial as `retryAfter: Infinity`; reduce count or shards, or increase capacity, to make such a request serviceable.

## Partitioning and middleware

[udecode/kitcn, references/setup/server.md; https://kitcn.dev/docs/plugins/ratelimit]

`RatelimitPlugin.configure()` resolves a bucket, caller, tier, signals and identifier. `buckets` maps bucket names to tier-specific algorithms. Required callbacks are `getBucket`, `getUser`, `getTier`, `getSignals` and `getIdentifier`. `getSignals` runs once before `getIdentifier`, whose arguments include the resolved signals. `prefix` can be a string or callback and defaults to `ratelimit:<bucket>:<tier>`; `message` controls the thrown `TOO_MANY_REQUESTS` message. Limiter failure, protection, dynamic-limit and cache options pass through.

Apply `ratelimit.middleware()` in mutation builders. The default bucket handles ordinary writes; procedure metadata `ratelimit` selects a named override. Keep authentication and resource permissions at the canonical [public boundary](AUTH.md#public-functions-and-referenced-parents); a budget is not authorization.

The identifier partitions the budget. The source starter chooses a user ID when authenticated, otherwise an IP-derived key and finally `ip:unknown`. A constant anonymous identifier shares one budget across all anonymous callers. NAT and carrier-shared addresses also share a budget; calls without metadata converge on the fallback key. Give those flows an appropriate separate bucket rather than assuming they have distinct users.

Read IP and user-agent metadata through `ctx.meta.getRequestMetadata()` in mutation middleware, including anonymous flows. Session-dependent helpers can return no metadata without a session. The rate-limit documentation names Convex `1.38.0` as the minimum for this metadata API; the selected kitcn package's supported peer range still governs installation, as described in [setup](KITCN-SETUP.md).

## Protection, caches and retention

[udecode/kitcn, references/features/ratelimit.md; https://kitcn.dev/docs/plugins/ratelimit]

Protection tracks failures by identifier, IP, user-agent and country. Reaching `denyListThreshold` inside a rolling ten-minute window caches a block for up to 24 hours. Success clears the identifier counter only; shared IP and user-agent counters persist. A deny-list match is checked before a `ratelimitState` read.

Protection uses bounded module memory, with up to `4096` tracked values per prefix. Failure histories are evicted before blocks, active blocks refresh on use, and the coldest block may be evicted when the block capacity is exceeded; the evicted value returns to normal database-backed limiting. Values longer than `128` characters are bounded by the implementation. State is per runtime isolate, is not shared across function entries, and is lost on cold starts or deployment. Mutation conflict retries do not roll back module-memory increments, so recorded failures can exceed requests actually served. Use durable state for a block that must persist.

The ephemeral block cache is separate. It keys retry timestamps by shard, count and reservation mode. A blocked shard does not block usable peers; a failed large request does not block smaller or reserved requests. Expired variants are pruned, infinite resets are not cached, and at most `32` variants are retained per identifier. A request is cache-blocked only if every usable shard is blocked; its reset is the earliest retry across cached and freshly evaluated shards. Cache lifetime is per limiter instance and normally per Convex invocation; an explicit shared map shares it between instances.

The scaffold's schema extension owns `ratelimitState`, `ratelimitDynamicLimit` and `ratelimitProtectionHit`; their underlying storage names remain underscored. Do not define those keys twice. Missing tables produce setup guidance to scaffold the rate limiter and register `ratelimitExtension()`; follow [setup](KITCN-SETUP.md).

The private `plugins/ratelimit:cleanup` mutation removes old state in indexed batches. Choose `olderThanMs` longer than every window, refill horizon and reservation period. The default batch is `500`; `limit` accepts `1` through `1000`. Repeat only while `hasMore` is true. This is an operational mutation, not a step to execute during a documentation import.

## Dynamic limits and client projections

[udecode/kitcn, references/features/ratelimit.md; https://kitcn.dev/docs/plugins/ratelimit]

A dynamic override replaces `limit`, or token-bucket `refillRate`; token-bucket `maxTokens` also changes if it originally equaled the refill rate. Overrides must be positive, finite and serviceable by every configured shard. Setting or clearing one advances the cache generation, invalidates snapshots and ephemeral blocks, and prevents older in-flight operations from restoring stale decisions.

`hookAPI({ identifier, sampleShards }?)` exports a `getRatelimit` query and `getServerTime` mutation. The identifier can be a static string or a callback receiving `(ctx, fromClient)`. Resolve caller-owned partitions on the server; a client-supplied identifier does not establish permission to inspect another caller's quota. `sampleShards` defaults to `1`; larger samples trade reads for accuracy. [https://docs.convex.dev/auth/functions-auth]

`useRatelimit` from `kitcn/ratelimit/react` accepts a generated query reference or a `module:functionName` path. Options include `identifier`, projected `count` defaulting to `1`, `sampleShards`, and `getServerTimeMutation` for clock-skew correction. `status` is undefined while loading, then allowed or `{ ok: false, retryAt }`. Finite retries update automatically; an impossible request uses `Infinity` and schedules no retry timer. `check(ts?, count?)` returns projected `value`, client-time `ts`, algorithm `config`, sampled `shard`, `ok` and optional `retryAt`. A permanent oversize denial may coexist with non-negative aggregate value. These projections improve controls and countdowns; server `limit()` remains the enforcement point.

## Prove it

[udecode/kitcn, references/features/ratelimit.md; https://kitcn.dev/docs/plugins/ratelimit]

- Trace the selected algorithm, refill, capacity, reservation ceiling, partition, bucket and tier to application configuration. Show that one request fits a shard and the configured total is distributed rather than multiplied.
- Identify the mutation that consumes tokens before protected work. Show query-safe reads, fail-open or fail-closed behavior, and action-only waiting without executing a test or build unless requested.
- Distinguish exact whole-token reads from sampled estimates, and convert snapshots before stored-state calculations. Account for permanent oversize denial and reservation retry times.
- Show the lifetime and bounds of module protection and instance caches, including cold starts, conflict retries, shared IPs and metadata-free fallbacks.
- Confirm dynamic overrides invalidate old cache generations, client identifiers preserve caller authorization, and cleanup retention exceeds every configured horizon.
