# Caching

**Contents:** [Decide first](#decide-first) · [Cacheable results](#cacheable-results) · [Keys](#keys) · [Content-addressed keys](#content-addressed-keys) · [Stampede (many concurrent misses)](#stampede-many-concurrent-misses) · [Invalidation across instances](#invalidation-across-instances) · [Lookup data: how much to fetch per miss](#lookup-data-how-much-to-fetch-per-miss) · [Layers in a TypeScript stack](#layers-in-a-typescript-stack) · [CDN caching on Vercel](#cdn-caching-on-vercel) · [Module-level caches](#module-level-caches) · [Caching browser storage reads](#caching-browser-storage-reads) · [Caching as a wrapper](#caching-as-a-wrapper) · [Prove it](#prove-it)

## Decide first

For each cache, write down:
- **what** is cached and **where** (browser, CDN, client state, server memory, Redis);
- **the key:** every input that changes the result;
- **the staleness budget:** how old a value may be when served;
- **who invalidates it,** and what bounds staleness if invalidation is missed (always an expiry);
- **the size bound** and what is evicted first.

## Cacheable results

- **Application-wrapper rule:** cache successful results only. A cached "not found" or validation failure is served to everyone after the fix. Keep this existing rule for the application wrappers. [existing software-architecture, LAYERS.md, Caching; SLICES.md, Commands, queries and the wrappers around them]
- **Source conflict:** the URL-shortener design instead says to cache misses for unknown codes briefly, or scanners hammer the database. Preserve that tagged design choice alongside the existing wrapper rule; do not silently replace either with a universal policy. [existing system-design, DESIGNS.md, URL shortener]
- **404s stay uncached or short.** A change that puts `s-maxage` on every response, 404 included, fails. A not-found branch sets `status: 404` ("a markdown/body-only Response defaults to 200"), and unexpected errors stay 5xx: a fix "must not convert unexpected exceptions into not-found". [Vercel, vercel-optimize, support-topics/cdn-cache-auth-safety.md, lib/verify-claim.mjs, lib/gates/uncached-route.mjs]

## Keys

- Include every input: the identifiers, query parameters, the user or tenant when results differ per user, locale, permissions, feature flags, and the version of the code or template that produced it. A key missing the user serves one user's data to another.
- Use one function to build each kind of key, so every reader and writer agrees.
- **Paid third-party lookups** (enrichment) need exact keys and their own hit, miss and negative rules: [prospecting ENRICHMENT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/prospecting/ENRICHMENT.md#exact-cache-keys) [coreyhaines31/marketingskills, prospecting].

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

**Source conflict:** the content-addressed caching article lists LLM calls at temperature zero as deterministic derivations [milan-jovanovic, caching-and-performance/content-addressed-cache-dotnet.md]. The Ollama article says temperature-zero outputs can still differ and require validation [milan-jovanovic, ai-and-vector-search/how-to-extract-structured-data-from-images-using-ollama-in-dotnet.md]. Keep the existing interchangeable-valid-output rule above; temperature alone does not establish that contract.

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
- **Run the shared refresh detached** from any one caller (a separate task or fiber), so a caller that is cancelled doesn't cancel the refresh the others are waiting on.
- Bound the memory: an LRU or maximum entry count for the cache and for the in-flight map.
- **Coordinate per key, never globally.** One lock or queue for the whole cache makes a refresh of one key block requests for every other key.
- **Prefer a maintained library over this snippet in production.** `lru-cache` with a `fetchMethod` coalesces concurrent `fetch` calls for the same key, bounds size with `max`, expires with `ttl`, and can serve the stale value while refreshing or when the refresh fails (`allowStaleOnFetchRejection`, `allowStaleOnFetchAbort`). Write your own only when you understand which of those edge cases you're taking on.
- This coordinates one process. Across instances, either accept one refresh per instance, or serve slightly stale data while one instance refreshes (stale-while-revalidate), or use a short shared lock in Redis.
- **Put a cache hit-rate graph on the dashboard:** use the canonical [hit-rate and database-load interpretation](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/DIAGNOSE.md#cache-hit-rate) when diagnosing a sudden load increase.

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

## Lookup data: how much to fetch per miss

Large read-mostly lookup data (routes, redirects, a product catalogue, feature flags per tenant, translations) is cached by fetching it. The unit you fetch decides most of the miss cost.

- **One entry per item makes every item its own miss.** With hundreds of thousands of keys, most first lookups miss, and each miss is a round trip. Fetch a **bounded group** (a shard) instead: one miss fills the cache for every item in it, so the next lookups for its neighbours hit.
- **The group size is a trade-off you measure, not guess.** Too big and each miss transfers and parses more than it needs; too small and misses come back. Try a few sizes on production traffic and watch latency at P99, not only the average. (In one large CDN, multi-megabyte shards lost to roughly 200 KB ones.)
- **Assign items to groups deterministically** (sorted ranges, or a hash of the key) and record the mapping in data you already fetch, so finding the right group costs no extra round trip.
- **Versioned keys start cold.** A key that includes the deployment, release or schema version is correct, and every new version begins with an empty cache. Price that in for things that release often; grouping is what makes the cold start cheap.
- **Measure each cache tier on its own.** A small in-memory cache per process in front of a shared regional one (Redis, a CDN tier) has two hit rates. Traffic spread over many processes or serverless instances keeps the per-process hit rate low even when the shared one is high, so "large entries are fine, they'll stay in memory" often fails. Size entries for the cost of a miss at the tier that actually misses.
- **Rule out before looking up.** When most lookups are for keys that don't exist (probing several candidate paths, checking a blocklist), put a Bloom filter in front: "definitely not present" is answered locally with no fetch, and only "maybe present" goes to the exact lookup. Size it for an acceptable false-positive rate; false positives cost a lookup, never a wrong answer.

### Find one record without parsing the group

A bigger group only costs transfer if a lookup doesn't decode all of it. Store the records sorted by key with an index of byte offsets, binary-search the keys in place, and parse only the value that matches:

```ts
// Build time: sorted, one JSON value per line, alternating key and value; offsets point at key lines.
export function buildShard(entries: Map<string, unknown>) {
  const keys = [...entries.keys()].sort();
  const offsets: number[] = [];
  let body = "";
  for (const key of keys) {
    offsets.push(Buffer.byteLength(body));
    body += `${JSON.stringify(key)}\n${JSON.stringify(entries.get(key))}\n`;
  }
  return { index: offsets, data: Buffer.from(body) };
}

// Request time: O(log n) key reads, one JSON.parse for the match; the rest of the shard stays bytes.
export function lookupInShard(shard: { index: number[]; data: Buffer }, key: string): unknown {
  const lineAt = (start: number) => shard.data.toString("utf8", start, shard.data.indexOf(10, start));
  let lo = 0, hi = shard.index.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const start = shard.index[mid]!;
    const found = JSON.parse(lineAt(start)) as string;
    if (found === key) return JSON.parse(lineAt(shard.data.indexOf(10, start) + 1));
    if (found < key) lo = mid + 1; else hi = mid - 1;
  }
  return undefined;
}
```

- The format stays inspectable: `head` shows real records, and line-based tools work on it. To ship the index inside the same file, store the offsets as fixed-width fields so any one can be read without parsing the whole index.
- Compare keys the way you sorted them (here UTF-16 code-unit order, both sides). Store keys as plain UTF-8; packing text into a legacy encoding is where rare characters break.
- Before going further (front-coding the sorted keys, deduplicating values, a custom binary format), simulate the lookup cost offline. Smaller files don't always mean meaningfully faster lookups, and each format change is a migration of its own.

## Layers in a TypeScript stack

- **HTTP and CDN:** `Cache-Control` for responses (`private` for anything per-user, `public` with `s-maxage` for shared ones, `stale-while-revalidate` where a slightly old value is fine), `ETag` with `If-None-Match` for cheap revalidation. Never cache authenticated responses in a shared cache unless the key includes the user.
- **TanStack Query (client):** the `queryKey` must include every variable the fetch uses. Defaults: data is stale immediately (`staleTime: 0`), kept 5 minutes after the last observer unmounts (`gcTime`), refetched on window focus, and identical in-flight requests are deduplicated. Set `staleTime` per query to how stale it may be; after a mutation, invalidate the affected keys (`queryClient.invalidateQueries({ queryKey: [...] })`).
- **Convex:** query results are cached and kept consistent automatically; identical queries with the same arguments share the result, and the cache updates when the underlying data changes. Don't put another cache in front of Convex queries. Keep queries deterministic: reading `Date.now()` in a query defeats its cache; pass a coarse time as an argument instead.
- **Server memory:** fine for small, read-mostly data on one instance; remember each serverless instance has its own and may start cold.
- **Redis / a shared cache:** for data shared across instances, with expiry on every key and the invalidation pattern above.

## CDN caching on Vercel

Facts from https://vercel.com/docs/caching/cache-control-headers (checked 2026-10-18); the safety rules come from Vercel's vercel-optimize skill [Vercel, vercel-optimize, support-topics/cdn-cache-auth-safety.md, lib/verify-claim.mjs, lib/gates/uncached-route.mjs]. Finding the uncached routes is in [VERCEL-METRICS.md](VERCEL-METRICS.md#the-query-catalog).

- **Which header wins:** `Vercel-CDN-Cache-Control`, then `CDN-Cache-Control`, then `Cache-Control`. With no header the default is `public, max-age=0, must-revalidate`; `private` stops CDN caching; `s-maxage` runs from 1 s to 31536000 s. When `Cache-Control` is the only cache header, Vercel strips `s-maxage` before the response reaches the browser; `stale-while-revalidate` and `stale-if-error` are consumed "for all requests".
- **Documented starting values:** the same SSR output for everyone `max-age=0, s-maxage=86400`; semi-static `max-age=120, s-maxage=86400`; per-user `private, max-age=0`; content-hashed assets `max-age=31536000, immutable`.
- **`stale-if-error` works; `proxy-revalidate` doesn't.** "When you set the `stale-if-error` HTTP Cache-Control extension, the CDN serves a stale response when an error is encountered ... Vercel's proxy consumes `stale-if-error` for all requests." "`proxy-revalidate`: This directive is currently not supported." The skill's sanitizer strips both (and `must-revalidate`) as directives "Vercel's CDN silently ignores"; only `proxy-revalidate` is documented as unsupported, and `must-revalidate` is in Vercel's own default.
- **Safety before speed.** The route must be a public, cacheable GET before it gets a shared-cache header: "rule out cookies, sessions, authorization, draft state, and user-specific data." "Do not cache mutations, dashboards, account data, request-personalized responses, or routes whose value changes per viewer. Do not mix `private` with shared-cache directives." A cache change names its "mechanism, scope, TTL/freshness, and `Vary`"; "If the right policy is `no-store`", report no change rather than a weaker header.
- **Mutation routes are not cache misses.** Flag a route as uncached only with more than 500 requests, a hit rate under 50% and a GET share over 20% in the window: "a route that's >80% POST/PUT/DELETE is a mutation endpoint where 0% cache is correct". STALE, REVALIDATED and BYPASS count as not-HIT. Routes named like login, logout, auth, account, dashboard, checkout, cart, profile, session or me are kept out of cache candidates only; "errors/slowness on auth routes still warrant investigation."
- **`Vary` by what the output depends on, at low cardinality.** Output that changes by geography varies on a coarse header (`X-Vercel-IP-Country`, `X-Vercel-IP-Country-Region`, `X-Vercel-IP-City`), never on `X-Vercel-IP-Latitude`, `X-Vercel-IP-Longitude` or `X-Vercel-IP-Postal-Code` ("very high-cardinality CDN cache keys"). Vercel's docs add that a `Vary` on `Cookie` isn't cacheable.
- **404s and unexpected errors:** follow the [cacheable-result policy](#cacheable-results).
- **`immutable` only on a URL whose bytes can't change:** a content-hashed URL, or scope it to `Vercel-CDN-Cache-Control` so the browser never holds it forever.
- **Error-heavy routes:** a cache change on a route with more than 20% function 5xx must exclude or acknowledge the error traffic. Reject a header with an empty directive (a trailing comma).
- **Conditional requests:** "Ensure your Function supports `If-Modified-Since` or `ETag` to prevent duplicate data transmission" (on by default for Next.js applications), per https://vercel.com/docs/manage-cdn-usage.

### `cacheLife` in Next.js 16: what it proves and what it doesn't

`cacheLife` and `cacheTag` became stable in Next.js 16.0.0, with Cache Components (https://nextjs.org/docs/app/api-reference/functions/cacheLife, checked 2026-10-18).

- **It does not set the CDN header.** "The `stale` property controls the Client Cache, not the `Cache-Control` header"; "The server sends the stale time via the `x-nextjs-stale-time` response header". Don't claim a missing `cacheLife` alone makes a route run per request "without production header evidence" [Vercel, vercel-optimize, lib/verify-claim.mjs]. Check the response headers in production.
- **Profiles, the implicit `default` and the one-call rule** are in [react NEXTJS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/react/NEXTJS.md#cachelife).
- **A longer lifetime on content-derived data needs its invalidation path.** Lengthening to `hours`, `days`, `weeks` or `max` requires a `cacheTag` and a matching `revalidateTag(tag, profile)` or `updateTag(tag)` call in the repo for the exact tags, literal or through a config `tags: [...]` array; "near-matches do not count", and "A cacheTag() in the cached function is not proof that CMS edits invalidate it". [Vercel, vercel-optimize, lib/verify-claim.mjs, support-topics/isr-revalidation-static-generation.md] The `revalidateTag` forms are in [react NEXTJS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/react/NEXTJS.md#cachetag-updatetag-and-revalidatetag).
- **A clock inside a cached scope costs ISR writes.** vercel-optimize's scanner flags `new Date()`, `Date.now()` or `Math.random()` in a `'use cache'` file: a timestamp baked into the cached output "forces a fresh ISR write on every regeneration even when the underlying data is unchanged". Its fix: a build-time constant or a client component, and "Do not pass dates as arguments to `'use cache'` functions" [Vercel, vercel-optimize, lib/scanners/use-cache-date-stamp.mjs].
  The Next.js docs allow it: "you can **cache the result** so all users see the same value until revalidation" (`'use cache'` with `crypto.randomUUID()`), or call `await connection()` inside `<Suspense>` for a value per request (https://nextjs.org/docs/app/getting-started/caching#random-values-and-timestamps). So the scanner's line is a cost warning, not a correctness rule ([react NEXTJS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/react/NEXTJS.md#use-cache)).
- **`'use cache'` is in memory per instance** on serverless; `'use cache: remote'` and the rest are in [react NEXTJS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/react/NEXTJS.md#use-cache).

## Module-level caches

A `Map` at module scope caches a function's results across calls, in render, utilities and event handlers alike ("Use a Map (not a hook) so it works everywhere") [Vercel, vercel-react-best-practices, js-cache-function-results.md]:

```typescript
// Module-level cache
const slugifyCache = new Map<string, string>()

function cachedSlugify(text: string): string {
  if (slugifyCache.has(text)) {
    return slugifyCache.get(text)!
  }
  const result = slugify(text)
  slugifyCache.set(text, result)
  return result
}
```

For a single value, a module variable with a reset where the input changes:

```typescript
let isLoggedInCache: boolean | null = null

function isLoggedIn(): boolean {
  if (isLoggedInCache !== null) {
    return isLoggedInCache
  }
  
  isLoggedInCache = document.cookie.includes('auth=')
  return isLoggedInCache
}

// Clear cache when auth changes
function onAuthChange() {
  isLoggedInCache = null
}
```

- **Bound it.** The source's `Map` grows with every distinct input; this file's rule stands ("Bound the memory: an LRU or maximum entry count", in [Stampede](#stampede-many-concurrent-misses)).
- **On the server, module scope is shared between requests.** On Vercel's Fluid compute, "multiple invocations can share the same physical instance (a global state/process) concurrently" (https://vercel.com/docs/fluid-compute). Audit "module-scoped mutable state, lazy singletons holding per-user data, globals keyed on per-request inputs" [Vercel, vercel-optimize, support-topics/fluid-compute-caveats.md]: a module cache is for values that are the same for every user, or its key includes the user (rule 5 in [SKILL.md](SKILL.md)).

## Caching browser storage reads

"`localStorage`, `sessionStorage`, and `document.cookie` are synchronous and expensive. Cache reads in memory." Write through, and "If storage can change externally (another tab, server-set cookies), invalidate cache" [Vercel, vercel-react-best-practices, js-cache-storage.md]. The source's "Correct (Map cache)" and "invalidate on external changes" blocks, joined:

```typescript
const storageCache = new Map<string, string | null>()

function getLocalStorage(key: string) {
  if (!storageCache.has(key)) {
    storageCache.set(key, localStorage.getItem(key))
  }
  return storageCache.get(key)
}

function setLocalStorage(key: string, value: string) {
  localStorage.setItem(key, value)
  storageCache.set(key, value)  // keep cache in sync
}

window.addEventListener('storage', (e) => {
  if (e.key) storageCache.delete(e.key)
})

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    storageCache.clear()
  }
})
```

- **The staleness budget** (rule 4 in [SKILL.md](SKILL.md)) is set by the two listeners: another tab's write fires `storage`, and the whole cache clears when the tab becomes visible again.
- **Wrap the storage calls in try/catch** where storage can be blocked. The source's companion rule (client-localstorage-schema) gives the reason as "`getItem()` and `setItem()` throw in incognito/private browsing (Safari, Firefox)". MDN (https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) lists `SecurityError` for an invalid origin or when "the user has configured the browsers to prevent the page from persisting data", and says of private browsing only that its data "is cleared when the last 'private' tab is closed". Blocked storage is the documented reason to catch.
- **The source's cookie parser** (`document.cookie.split('; ').map(c => c.split('='))`) keeps only the first two parts of each `split('=')`, so a cookie value that contains `=` comes back cut short.
- landing-page-ui does a guarded read in its theme bootstrap instead (`try{stored=localStorage.getItem(...)}catch{}`, [site-theme.ts](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/landing-page-ui/reference/website/widgets/header/theme/site-theme.ts)).

## Caching as a wrapper

Add caching (and timing, retries) around a function or an object rather than inside it, so the original stays coherent and each concern can be removed alone. For an object, the wrapper implements the same interface and delegates (`const members: MemberRepository = cachedMembers(dbMembers, cache)`), and the composition happens in one place where dependencies are wired, so callers never know:

```ts
const getSummary = withTiming("summary", withCache(summaryKey, 60_000, loadSummary));
```

Order matters: here timing wraps the cache, so it records hits and misses; reverse them and it records only misses. Choose based on what you need to see.

## Prove it

- For grouped lookup data: P99 lookup latency before and after on production traffic, the hit rate of each tier separately, and the latency of a cold version (first requests after a release).
- Send 50 concurrent misses for one key: the source is called once. Make the refresh fail: later requests recover and no key stays locked.
- Cache a rendered reading-list page by content, template version and locale: change each one and confirm the key changes; confirm old entries expire.
- Warm a key on two instances, disconnect one instance's invalidation listener, update the source: show that its staleness ends at the local expiry or on reconnect.
- On Vercel, read a cached route's response headers in production: the CDN serves it as HIT on repeat requests, a 404 from the same route is not cached long, and a lengthened `cacheLife` has a matching `revalidateTag` or `updateTag` call for each of its tags.
