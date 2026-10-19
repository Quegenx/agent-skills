---
name: api-design
description: "Designs HTTP API contracts: pagination, errors, idempotency keys, versioning, feature flags, streaming, timeouts and rate limits. Use when adding or changing an endpoint, or reviewing an API."
---

# API design

An API is a promise to clients you don't control. Every decision below is cheap before the first consumer and expensive after. Pick the file for the job:

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Resource shape, names, pagination, status codes, error bodies, compatibility, versioning | [CONTRACT.md](CONTRACT.md) |
| Safe retries, idempotency keys, deadlines, cancellation, retry/timeout/circuit breaker, rate limits | [RELIABILITY.md](RELIABILITY.md) |
| Rolling out behind a flag, A/B experiments | [FLAGS.md](FLAGS.md) |
| Streaming updates to a browser (SSE) | [STREAMING.md](STREAMING.md) |
| Before changing a developer tool's public surface: the job, reuse, metric, defaults, compatibility and removal brief | [Engineering planning](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/engineering-planning/PRODUCT-PASS.md) |

## The rules under all of them

1. **Design from a real client journey,** not from the database tables. Walk one journey end to end (search, view, reserve, pay, get confirmation) and design the operations it needs.
2. **Every response is bounded.** Lists are paginated with a maximum page size; payloads have a known worst case; requests have a deadline.
3. **One meaning per status and per error type,** the same across every resource. Failures never return a success status.
4. **Change by adding.** New optional fields and new operations keep old clients working. A new version is the last resort, for changes that genuinely can't coexist.
5. **Anything that can be retried is safe to retry.** Reads are naturally; writes get idempotency keys or a natural unique key.
6. **Every external call has a deadline, and the deadline propagates.** A timeout that doesn't cancel the downstream work only hides it.
7. **Identity comes from something verified:** a validated token or key, or an address from a proxy you configured, never a header the caller can set.
8. **Authorize every resource access,** on every operation, including streams, replays and exports. Hiding an id is not authorization.
9. **Internal details never reach the caller:** no stack traces, SQL, internal hostnames or exception text in responses.
10. **Security ships with the first version,** not "phase 2": adding authentication later breaks every client, and whatever leaked before is already scraped. HTTPS everywhere, including internal services; authentication and authorization checked separately (being logged in doesn't mean you may read this record); rate limits from day one.
11. **Write down the trade-offs you chose** (why cursor pagination, why 400 for validation, why no versioning) next to the API description, and stay consistent with them. Consistency beats a locally better choice.

## The worked check

Use this scenario to test a design (a library: readers search and reserve one physical copy; a confirmation message goes out after the reservation commits):
1. Two readers reserve the last copy at once: which database rule or transaction lets exactly one succeed? (A unique constraint on the copy's active reservation, or a conditional update `... where copy_id = $1 and status = 'available'` that checks the affected row count.)
2. The cache says the copy is available after someone reserved it: the write path checks the authoritative database, never the cache.
3. The API commits, then crashes before sending the confirmation: the intent to send is a row written in the same transaction (an outbox), and another worker picks it up.
4. The worker sends the message and loses the acknowledgement: the send is keyed by the reservation id, so a repeat doesn't produce a second effect.
5. One API instance dies: a second identical instance behind health-checked routing takes over; list what is still a single point of failure.

After each failure, write down what the reader sees. A design isn't correct because every box is connected; the connections must express ownership, durability and authorization.

## Reviewing an API

Report findings most damaging first: broken authorization, then duplicate or lost effects (missing idempotency, retries on unsafe operations), then unbounded responses and missing deadlines, then contract inconsistency (status codes, error shapes, names), then breaking changes, then style. Each finding names the operation, the client impact and the fix.
