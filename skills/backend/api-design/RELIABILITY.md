# Reliability: retries, idempotency, deadlines, limits

## Idempotency keys

A client retries when it doesn't know whether its request worked (timeout, dropped connection). For a write, the retry must not do the work twice.

GET, HEAD, OPTIONS, PUT and DELETE are idempotent by definition: repeating them has the same intended effect on the resource (the server may still log each call). POST is not, so a POST that creates or triggers something needs a key or a natural unique constraint. A PUT or DELETE is only idempotent if you implement it that way; a DELETE that removes "the latest" item is not.

- The client sends `Idempotency-Key: <uuid>`, one per intended operation, reused on every retry of that operation. A missing or malformed key on an endpoint that requires one is a 400.
- The server stores, per key and caller: a hash of the request (method, path, body), a state (`processing`, `completed`), the response status and body, and an expiry (often 24 hours).
- **Claim the key atomically before doing the work:** insert the row with a unique constraint on `(caller_id, key)`. Only the request whose insert succeeds runs the operation.
  - Insert conflicts and the row is `processing`: return 409 (the first attempt is still running), so the client retries later.
  - Row is `completed` and the request hash matches: return the stored response, don't run again.
  - Row exists with a different request hash: reject with 422 (the key was reused for a different operation).
- **Decide what a failure stores.** Not storing 4xx and 5xx results lets the client retry the same key after a failure, which also means a failed attempt followed by a successful one succeeds; storing deterministic 4xx results makes the key answer the same every time. Never store a result for a transient failure (timeout, 503), or the retry can never succeed.
- **Keep keys long enough to cover real retry windows** (minutes to 24 to 48 hours), in a store every instance shares (the database, Redis), not in process memory.
- When the effect is a database write, write the effect and mark the key `completed` with its response in the same transaction. Caching a response after the work finished is not enough: two concurrent first attempts can both do the work.
- If the operation calls an external paid or irreversible service, treat it as a job with an "uncertain" state (see [external side effects](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/background-jobs/EXTERNAL-SIDE-EFFECTS.md)).
- A natural unique key (one active loan per copy, one payment per order id) is often simpler and stronger than a generic key. Use both where it matters.

```sql
create table idempotency_keys (
  caller_id uuid not null,
  key uuid not null,
  request_hash text not null,
  state text not null check (state in ('processing', 'completed')),
  response_status int,
  response_body jsonb,
  expires_at timestamptz not null default now() + interval '24 hours',
  primary key (caller_id, key)
);
```

```ts
export async function withIdempotency(req: Request, callerId: string, run: () => Promise<{ status: number; body: unknown }>) {
  const key = req.headers.get("idempotency-key");
  if (!key || !isUuid(key)) return problem(400, "idempotency_key_missing");
  const hash = await sha256(`${req.method} ${new URL(req.url).pathname} ${await req.clone().text()}`);

  const claimed = await db.query(
    `insert into idempotency_keys (caller_id, key, request_hash, state)
     values ($1, $2, $3, 'processing') on conflict do nothing returning key`, [callerId, key, hash]);

  if (claimed.rowCount === 0) {                                  // someone already holds this key
    const row = await db.one(`select * from idempotency_keys where caller_id = $1 and key = $2`, [callerId, key]);
    if (row.request_hash !== hash) return problem(422, "idempotency_key_reused");
    if (row.state === "processing") return problem(409, "idempotency_request_in_progress");
    return Response.json(row.response_body, { status: row.response_status });   // replay, don't rerun
  }

  const result = await run();                                     // ideally in the same transaction as the save below
  if (result.status >= 500) {
    await db.query(`delete from idempotency_keys where caller_id = $1 and key = $2`, [callerId, key]);   // transient: allow a retry
  } else {
    await db.query(
      `update idempotency_keys set state = 'completed', response_status = $3, response_body = $4
       where caller_id = $1 and key = $2`, [callerId, key, result.status, result.body]);
  }
  return Response.json(result.body, { status: result.status });
}
```

The insert is the atomic claim: of two concurrent first requests, only one gets a row back. When the operation is a database write, do the write and the `completed` update in one transaction, so a crash can't leave the effect without its stored response. A scheduled job deletes expired keys.

**Prove it:** send two concurrent creates with the same key: exactly one record exists and both get the same response. Then send the same key with a different body: rejected.

## Deadlines and cancellation

A timeout returns an error to the caller; it doesn't stop work that was already started unless the work listens for cancellation.

- **There is often no deadline by default.** Many servers and frameworks run a handler as long as it takes; a proxy in front may time out first, but then the proxy picks the deadline and the response, and your work keeps running behind it.
- **Give each endpoint a budget from its workload,** as named policies in one place: a small read a few seconds at most, a report export tens of seconds. Streams, WebSockets, long polling and large uploads get their own longer policy or none, since a 504 can't replace a response that already started. Work that needs minutes returns 202 and runs as a job (the `background-jobs` skill).
- Create one signal per request that combines the client disconnect and the budget, and pass it to every awaited dependency:

```ts
const signal = AbortSignal.any([request.signal, AbortSignal.timeout(2_000)]);
const res = await fetch(url, { signal });                          // HTTP
const { data } = await supabase.from("loans").select().abortSignal(signal); // supabase-js query
```

- **The deadline is cooperative.** It cancels a signal; it doesn't stop code. A handler that never passes the signal on keeps running and may even return 200 after the deadline. Pass it through every layer (handler, service, data access, HTTP client) until it reaches the driver. The same signal also fires when the client disconnects, which is worth wiring before any timeout exists.
- In the database, also set a server-side limit (`statement_timeout`) so a runaway query stops even if the client can't cancel it.
- With Effect, `Effect.timeout("2 seconds")` interrupts the effect; make sure the underlying calls honor interruption (pass the provided signal to `fetch`).
- The application deadline is separate from transport limits (platform function max duration, proxy and load balancer idle timeouts). Set the application deadline below them so you return a clean 504 instead of being cut off.
- **Each inner timeout sits below the outer one** (a timeout budget: gateway 3s, backend DB timeout about 2.5s). With a gateway timeout of 3s over a 5s query, the user gets a 504 while the backend finishes and "proudly records a success": "the backend metrics show no failures, and the gateway metrics show no successes", and under overload the wasted work delays recovery.

**Prove it:** call a slow report with a short budget and confirm the database query is gone from the running queries after the deadline (`pg_stat_activity`, or a trace span that ends at the deadline), not just that the client got an error. A 504 proves the cancellation reached the top of the stack, not that the work below stopped.

## Retry, timeout, circuit breaker

- **Retry only what's safe:** reads, and writes protected by idempotency. Retry only transient failures: network errors, timeouts, 502/503/504, and 429 after `Retry-After`. Never retry 400, 401, 403, 404 or 422.
- **Classify a `409` by the operation's conflict contract.** The [in-progress idempotency-key case](#idempotency-keys) above tells the client to retry later; `409` alone is not a retry decision. MDN describes conflicts with current resource state and implementation-specific concurrent-update uses. The old line said "Never retry 400, 401, 403, 404, 409 or 422", contradicting this file's processing-state contract. [https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/409; existing api-design, RELIABILITY.md, Idempotency keys]
- **Backoff with jitter,** a small number of attempts (two or three), honoring `Retry-After`.
- **Compose in this order:** an overall deadline around everything, retries inside it, a per-attempt timeout inside each retry, and a circuit breaker that stops calling a dependency that keeps failing (it fails fast for a cool-down, then lets a trial request through).
- **The budget must fit the deadline.** Worst case = attempts x per-attempt timeout + the sum of backoff delays. With a 2 s deadline, a 600 ms per-attempt timeout and delays of 100 and 200 ms, three attempts take at most 3 x 600 + 300 = 2,100 ms: over budget, so allow two attempts or shorten the per-attempt timeout.
- **The other strategies:** a **fallback** returns a safe substitute when the call fails (a cached value, an empty result, "temporarily unavailable"), and must be visibly marked as such to the caller; **hedging** sends a second request after a short delay, or several at once, and takes the first success, only for idempotent reads, and at the cost of extra load; an outgoing **concurrency limit** caps in-flight calls to one dependency so a slow dependency can't absorb every connection. Timeouts and limits act before or during a call (proactive); retry, fallback and the breaker react to its result.
- **Define the policy once per dependency** (`catalogClient`, `paymentsClient`) and reuse it, rather than configuring retries inline at each call site. A standard HTTP client policy is, from the outside in: concurrency limit, total timeout, retry, circuit breaker, per-attempt timeout.
- **Log every retry, fallback and breaker state change** with the dependency name, or you won't know in production whether the resilience layer is hiding a failing dependency.
- **Retries multiply load.** If every layer retries three times, one failure becomes 27 calls. Retry at one layer, and stop retrying when a dependency is clearly down (the breaker).

```ts
// Effect: retry transient errors with jittered backoff, inside an overall timeout
const lookup = fetchCatalog(id).pipe(
  Effect.retry({
    times: 2,
    schedule: Schedule.jittered(Schedule.exponential("100 millis")),
    while: (e) => e.transient,
  }),
  Effect.timeout("2 seconds"),
);
```

**Prove it:** for a read-only lookup with an overall deadline, trace one timeout followed by a retry and write down the maximum number of dependency calls and the maximum elapsed time.

## Rate limits

- **Choose the key in one function,** so every limiter uses the same rule. [milan-jovanovic, apis/advanced-rate-limiting-use-cases-in-dotnet.md]
- **Partition by a trusted identity:** the user or API key from a verified token for authenticated callers; for anonymous callers, use the framework's client address after configuring trusted proxies for the actual topology. Express checks the socket peer and then forwarded addresses from right to left until the first untrusted address. The last trusted proxy must remove or overwrite client-supplied forwarded headers. The source trusted an arbitrary `X-Forwarded-For`; the removed helper indexed that header without establishing peer trust. https://expressjs.com/en/guide/behind-proxies.html
- **Separate budgets** for anonymous and authenticated callers, per tenant, and tighter ones for expensive operations (search, export, AI calls).
- **A single global limit is almost always wrong:** one noisy caller uses up everyone's budget. Partition the limit by caller.
- **Watch for a missing key.** An anonymous request has no user id; if the partition key is `user?.id`, every anonymous caller shares one bucket (or, worse, gets none). Fall back explicitly: user id when authenticated, else the trusted client address.
- **Chain limits** when several must hold at once: a per-user limit and a global ceiling, or a per-key burst limit and an hourly quota. A request passes only if every limiter allows it.
- Pick the algorithm by need: a token bucket allows short bursts, a sliding window is smooth, a fixed window is simplest but allows double bursts at the edges, and a concurrency limit caps simultaneous in-flight requests for slow operations rather than requests per second.
- A reasonable starting point for a public API is around 1,000 requests per hour per key, then per-endpoint limits, higher tiers for paying customers, and a lower one for a client that misbehaves.
- Keep counters in a shared store (Redis, the database) when there is more than one instance; an in-memory limiter gives each instance its own budget, so the real limit is the limit times the instance count. In a distributed system, enforce limits at the gateway or reverse proxy, before requests reach the services.
- Respond 429 with `Retry-After`, and document the limits.
- **Shed load when overloaded.** A queue in front of a saturated server is "debt that lengthens everyone's wait". Cap it and reject the overflow immediately with 429: "some requests are failed fast, and in exchange the accepted remainder is served properly", instead of "everyone dies slowly and fairly, together" ([observability DIAGNOSE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/monitoring/observability/DIAGNOSE.md#queues-backpressure-load-shedding)).

**Prove it:** two users each get their own budget; repeated requests hit 429 at the documented point; a request with a forged `X-Forwarded-For` lands in the same bucket as the real address.
