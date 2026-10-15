# Caching

## Decide first

For each cache, write down:
- **what** is cached and **where** (browser, CDN, client state, server memory, Redis);
- **the key:** every input that changes the result;
- **the staleness budget:** how old a value may be when served;
- **who invalidates it,** and what bounds staleness if invalidation is missed (always an expiry);
- **the size bound** and what is evicted first.

## Keys

- Include every input: the identifiers, query parameters, the user or tenant when results differ per user, locale, permissions, feature flags, and the version of the code or template that produced it. A key missing the user serves one user's data to another.
- Use one function to build each kind of key, so every reader and writer agrees.

## Content-addressed keys

A key like `invoice-pdf:{invoiceId}` names a **location**: the slot keeps its name when what it describes changes, so correctness depends on every write path remembering to evict. List what actually changes the bytes: the invoice data, the template body the design team edits, the locale used for dates and money, and the renderer code. The key mentions one of four. A template edit fires nothing in the invoice's write path, and every cached PDF keeps last quarter's letterhead.

A content key names the **inputs**: hash all of them. Change any input and the key changes, the lookup misses, and the value is computed under the new key. The old entry isn't stale, it's unreachable. There is no invalidation code to forget. (Git objects, Docker layer caching and package lockfiles all work this way.)

```ts
import { createHash } from "node:crypto";

export function contentKey(...parts: (string | null | undefined)[]): string {
  const hash = createHash("sha256");
  for (const part of parts) {
    const bytes = Buffer.from(part ?? "", "utf8");
    const length = Buffer.alloc(4);
    length.writeUInt32BE(bytes.length);
    hash.update(length).update(bytes);     // length-prefix every part
  }
  return hash.digest("hex");
}

const RENDERER_VERSION = "pdf-v3";         // bump on any change to how inputs become output

export const invoicePdfKey = (r: InvoiceRenderRequest) =>
  contentKey(r.templateId, r.templateSource, r.dataJson, r.locale, RENDERER_VERSION);
```

- **Length-prefix the parts.** Joining with a separator makes `("a b", "c")` and `("a", "b c")` the same bytes: two different inputs share one entry, the exact bug the pattern exists to prevent.
- **Hash the content, not its id.** `templateSource` is the template body; a key that refers to an input by name inherits the staleness you were leaving behind.
- **The code is an input.** Fix a rounding bug in the renderer without bumping the version and every existing entry keeps serving the bug.
- **The one failure mode is a missing input,** and it's silent: with no eviction path, the old answer is served indefinitely. The usual culprits don't look like inputs: an environment variable, a feature flag, a config file the code reads on its own, the machine's default locale or time zone. Three habits:
  - **over-include:** a too-sensitive key costs a recompute; a too-coarse key costs a wrong answer;
  - **one key function per computation,** next to the code it describes, reviewed whenever that code changes;
  - **make implicit inputs explicit:** anything the computation reads that isn't a parameter becomes a parameter, so it lands in the key.
- **Expiry becomes a storage decision, not a correctness one.** The value can't be wrong, so pick the TTL from what memory or Redis can hold; longer is strictly better for hit rate.
- **Concurrent misses are only a performance issue.** Two callers with the same inputs compute the same value, so whichever write wins is correct; coalescing saves one duplicate computation. Output that differs harmlessly between runs (an embedded timestamp) is fine; a computation that can produce a *wrong* answer for the same inputs can't use this pattern.
- **Clean up stranded entries:** every edit leaves the previous entry behind (twenty template edits, twenty unused renderings). Bound it with expiry or a size cap (an LRU, Redis `maxmemory` with an LRU policy), which is always safe since evicting a live entry only costs a recompute; or sweep: compute the key for every live input at startup and delete everything else, so what's valid is derived from current inputs, not tracked in a separate list.
- **A file store works** for large values (megabytes): files named by key in object storage or on disk, written to a unique temporary name and then renamed into place so a crash never leaves a truncated entry, with an in-memory map in front for hot keys. A concurrent writer that got there first wrote the same bytes, so there's nothing to reconcile.

**Use it when** the computation is deterministic (any output for the same inputs is equally valid), you can list every input, and computing costs much more than hashing (hashing a few KB takes microseconds): document and report rendering, image transforms, code generation, aggregations over immutable data, LLM calls at temperature 0. Static assets with a content hash in the file name are the browser version and can be cached forever (`Cache-Control: public, max-age=31536000, immutable`).

**Don't use it** for data that changes because the world changed: a price, a stock count, an unread badge. Those need a staleness budget and an expiry.

## Stampede (many concurrent misses)

A plain map in front of a slow call isn't enough: 100 concurrent requests for the same missing key all miss and all call the source (and a third-party API may rate-limit you for it). With an expiry, the same happens every time a popular key expires. Collapse them into one refresh per key (single-flight). In JavaScript the in-flight promise does the job a lock does elsewhere: every caller awaits the same promise.

```ts
const inflight = new Map<string, Promise<unknown>>();

async function getOrLoad<T>(key: string, load: () => Promise<T>, ttlMs: number): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value as T;
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;
  const p = load()
    .then((value) => { cache.set(key, { value, expiresAt: Date.now() + ttlMs }); return value; })
    .finally(() => inflight.delete(key));   // a failed load never leaves the key stuck
  inflight.set(key, p);
  return p;
}
```

- A concurrent map protects each operation, not the lookup-then-refresh sequence; that's what the in-flight map is for.
- Clean up on failure (the `finally`), so a failed refresh doesn't block the key and later requests can recover. Decide whether to briefly cache the failure to protect a struggling source.
- Bound the memory: an LRU or maximum entry count for the cache and for the in-flight map.
- **Coordinate per key, never globally.** One lock or queue for the whole cache makes a refresh of one key block requests for every other key.
- **Prefer a maintained library over this snippet in production.** `lru-cache` with a `fetchMethod` coalesces concurrent `fetch` calls for the same key, bounds size with `max`, expires with `ttl`, and can serve the stale value while refreshing or when the refresh fails (`allowStaleOnFetchRejection`, `allowStaleOnFetchAbort`). Write your own only when you understand which of those edge cases you're taking on.
- This coordinates one process. Across instances, either accept one refresh per instance, or serve slightly stale data while one instance refreshes (stale-while-revalidate), or use a short shared lock in Redis.

## Invalidation across instances

A local in-memory cache on each instance in front of a shared store (Redis) is fast, but instances drift apart: one instance updates, the others keep serving their local copy.
- On every write, **after the database commit,** delete the shared entry and publish the key on an invalidation channel (Redis pub/sub) so every instance evicts its local copy. Publishing before the commit lets another instance refill its cache with the old value. The publishing instance receives its own message too; evicting again is harmless and keeps the code simple. Redis pub/sub is at most once: an instance that is disconnected when the key is published never hears it, so keep a local expiry as the upper bound on how long a missed eviction can serve stale data.
- **A short local expiry instead of invalidation only narrows the window.** It also sends far more reads to Redis or the database and gives up most of what the local layer was for. For permissions, feature flags and prices, "mostly current" isn't enough: those need the invalidation channel.
- If your cache library offers a built-in backplane (local plus shared layers with pub/sub invalidation), use it rather than writing your own.
```ts
import Redis from "ioredis";
const pub = new Redis(REDIS_URL);
const sub = new Redis(REDIS_URL);                               // a subscribed connection can't run other commands

export async function invalidate(key: string) {                 // call after the database commit
  await pub.del(key);                                           // the shared copy
  await pub.publish("cache-invalidation", key);                 // every instance, including this one
}

await sub.subscribe("cache-invalidation");
sub.on("message", (_channel, key) => localCache.delete(key));
sub.on("ready", () => localCache.clear());                     // after a reconnect we may have missed messages
```

- **Pub/sub is fire-and-forget:** an instance that is disconnected or restarting misses messages. Always keep a short local expiry that bounds how long a missed invalidation can last, and on reconnect, clear the local cache or reconcile it.
- Prefer deleting the entry on write and letting the next read refill it over writing the new value into the cache from several places.

## Layers in a TypeScript stack

- **HTTP and CDN:** `Cache-Control` for responses (`private` for anything per-user, `public` with `s-maxage` for shared ones, `stale-while-revalidate` where a slightly old value is fine), `ETag` with `If-None-Match` for cheap revalidation. Never cache authenticated responses in a shared cache unless the key includes the user.
- **TanStack Query (client):** the `queryKey` must include every variable the fetch uses. Defaults: data is stale immediately (`staleTime: 0`), kept 5 minutes after the last observer unmounts (`gcTime`), refetched on window focus, and identical in-flight requests are deduplicated. Set `staleTime` per query to how stale it may be; after a mutation, invalidate the affected keys (`queryClient.invalidateQueries({ queryKey: [...] })`).
- **Convex:** query results are cached and kept consistent automatically; identical queries with the same arguments share the result, and the cache updates when the underlying data changes. Don't put another cache in front of Convex queries. Keep queries deterministic: reading `Date.now()` in a query defeats its cache; pass a coarse time as an argument instead.
- **Server memory:** fine for small, read-mostly data on one instance; remember each serverless instance has its own and may start cold.
- **Redis / a shared cache:** for data shared across instances, with expiry on every key and the invalidation pattern above.

## Caching as a wrapper

Add caching (and timing, retries) around a function or an object rather than inside it, so the original stays coherent and each concern can be removed alone. For an object, the wrapper implements the same interface and delegates (`const members: MemberRepository = cachedMembers(dbMembers, cache)`), and the composition happens in one place where dependencies are wired, so callers never know:

```ts
const getSummary = withTiming("summary", withCache(summaryKey, 60_000, loadSummary));
```

Order matters: here timing wraps the cache, so it records hits and misses; reverse them and it records only misses. Choose based on what you need to see.

## Prove it

- Send 50 concurrent misses for one key: the source is called once. Make the refresh fail: later requests recover and no key stays locked.
- Cache a rendered reading-list page by content, template version and locale: change each one and confirm the key changes; confirm old entries expire.
- Warm a key on two instances, disconnect one instance's invalidation listener, update the source: show that its staleness ends at the local expiry or on reconnect.
