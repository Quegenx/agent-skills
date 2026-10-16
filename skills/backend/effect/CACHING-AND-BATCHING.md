# Caching and request batching

Everything here targets Effect v4.

## Memoizing one effect

- **`Effect.cached(self): Effect<Effect<A, E, R>>`** computes once (v3 called it `Effect.once`). Concurrent callers share the pending computation, which is interrupted only once every caller waiting on it has been interrupted.
- **Interrupted computations are never cached:** the next evaluation starts fresh. A docs table says an interrupted first run propagates the cached interruption; the source says it is not cached.
- **Create the cached effect once and reuse it:** each execution of `Effect.cached(task)` creates an independent cache.
- **`Effect.cachedWithTTL(self, ttl | (exit) => ttl)`:** the TTL starts when the computation completes. The function form gives successes and failures different TTLs, for example `(exit) => Exit.isSuccess(exit) ? "1 hour" : 0`; a zero TTL expires immediately.
- **`Effect.cachedInvalidateWithTTL`** returns `[cached, invalidate]`.
- **Keyed caching uses `Cache`:** v3 `Effect.cachedFunction` was removed.

## Cache

Rewritten for 4.0.

- **`Cache.make({ lookup, capacity, timeToLive?, requireServicesAt?: "lookup" | "construction" })`;** the default TTL is `Duration.infinity`. For a TTL per result use `Cache.makeWith(lookup, { timeToLive: (exit, key) => ... })`.
- **Concurrent `Cache.get` calls for the same missing key share one pending lookup.**
- **Failures are cached:** the cache stores the lookup `Exit`, so a failed lookup fails again until the entry expires, is invalidated or is refreshed. Give failures a short TTL with `makeWith` when they should be retried.
- **Interrupted lookups are not cached:** the key is removed, so the next call computes again.
- **Eviction:** at capacity, the least recently accessed entry goes first. The size may slightly exceed the capacity between operations.
- **API:** `getOption`, `getSuccess`, `set`, `has`, `invalidate`, `invalidateWhen`, `refresh`, `invalidateAll`, `size` (counts expired entries until they are accessed), `keys`, `values`, `entries`.
- **Removed:** `CacheStats`, `EntryStats` and `ConsumerCache`; for a read-only view, expose an application-defined wrapper.
- **`ScopedCache`:** each entry owns its own `Scope`. Expiry cleanup is lazy: an expired entry is removed on access to that key or on a `keys`, `values` or `entries` scan, not by a background timer.

## Request batching

A `Request<A, E, R>` describes one logical piece of work without performing it; a `RequestResolver` performs a batch of them.

### Requests

- **Define with `Request.Class<Fields, A, E, R>`, `Request.TaggedClass`, `Request.tagged<T>("Tag")` or `Request.of<T>()`.**
- **v4 adds the `R` parameter** for services needed while resolving. Resolvers have no environment parameter: declare `R` on each Request and use `entry.context` inside the resolver callback.
- **Requests must be comparable (Equal) to be deduplicated.**

### Resolvers

- **A resolver must complete every entry it receives;** an entry left incomplete fails its waiting request.
- **`Request.Entry` fields:** `request`, `context`, `uninterruptible`, `completeUnsafe`. Complete with `entry.completeUnsafe(Exit.succeed(x))` or `Request.complete`, `completeEffect`, `succeed`, `fail`, `failCause`.
- **Constructors:**
  - `RequestResolver.make(runAll(entries, key))`: default `delay: Effect.yieldNow`, single batch key; receives a non-empty batch (v3 called it `makeBatched`).
  - `makeWith({ batchKey, preCheck?, delay, collectWhile, runAll })`.
  - `makeGrouped({ key, resolver })`.
  - `fromFunction`, `fromFunctionBatched` (results by index), `fromEffect` (an effect per entry), `fromEffectTagged<A>()({ Tag: (entries) => ... })`.
- **Modifiers:** `setDelay(duration)`, `setDelayEffect`, `batchN(n)`, `grouped(key)`, `around(before, after)`, `race(other)`, `withSpan(name)`, `withCache({ capacity, strategy?: "lru" | "fifo" })` (returns an Effect), `asCache({ capacity, timeToLive? })` (returns a first-class `Cache`), `persisted`.
- **`withCache` never expires entries by time,** and completed failures without interruptions are cached like successes. The default strategy is `"lru"`. Use `asCache` with `timeToLive` when entries must expire.
- **Resolvers that need services:** build them inside a `Layer` that closes over the services (the best fit for most cases), or as `Effect.map(HttpService, (http) => RequestResolver.fromEffect(...))`.

```ts
const resolver = yield* RequestResolver.make<GetUserById>(Effect.fn(function*(entries) {
  for (const entry of entries) {
    const user = usersTable.get(entry.request.id)
    if (user) {
      entry.completeUnsafe(Exit.succeed(user))
    } else {
      entry.completeUnsafe(Exit.fail(new UserNotFound({ id: entry.request.id })))
    }
  }
})).pipe(
  RequestResolver.setDelay("10 millis"),
  RequestResolver.withSpan("Users.getUserById.resolver"),
  RequestResolver.withCache({ capacity: 1024 })
)
```

### Making requests batch

- **Run with `Effect.request(request, resolver)`;** `resolver` may be a `RequestResolver` or an `Effect<RequestResolver, EX, RX>`.
- **All requests to the same resolver share one batch by default, and the batch runs after `Effect.yieldNow`;** requests started later join a later batch.
- **Set `concurrency`, or nothing batches:** `Effect.forEach` and `Effect.all` are sequential by default, so each request completes before the next starts and every batch holds one request.
- **Repeated IDs are deduplicated:** `Effect.forEach([1, 2, 1, 3, 2], getUserById, { concurrency: "unbounded" })` makes one resolver call with `[1, 2, 3]`.
- **No ambient switches:** `Effect.withRequestBatching`, `withRequestCache` and `withRequestCaching` were removed, and `RequestBlock` is no longer public. Configure batching and caching on the resolver.

## Anti-patterns

- **Calling `Effect.cached(task)` per use:** each call is a new cache.
- **Assuming `Cache` retries failures:** failed lookups stay cached until expiry, invalidation or refresh.
- **Sequential `Effect.forEach` over requests:** one request per batch.
- **A resolver path that leaves an entry incomplete.**
- **Expecting `RequestResolver.withCache` entries to expire.**

## Prove it

- A test running `Effect.forEach` over duplicated IDs with `concurrency: "unbounded"` shows one resolver call with the deduplicated IDs.
- Every branch of each resolver completes its entry.
- Each `Cache` and `cachedWithTTL` states its TTL for failures, and the cached effect from `Effect.cached` is created once and shared.
