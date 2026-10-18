# The contract

## Resources and names

- Name resources as plural nouns from the domain the client knows (`/loans`, `/books/{id}/copies`), one casing everywhere (pick `camelCase` or `snake_case` for fields and keep it), one word per concept across the API ("loan" is never also "borrowing").
- Don't expose database shape: join tables, internal flags and storage ids don't belong in the contract. Model what the client does.
- **Nest only when the child belongs to and dies with the parent** (`/users/{id}/settings`). Deep paths (`/users/{u}/habits/{h}/entries/{e}/comments/{c}`) hard-code today's data model into every client URL, and someone holding only a comment id can't fetch it. Flatten with filters: `GET /entries?habitId=123` works without knowing the user.
- Actions that aren't plain CRUD can be explicit sub-resources or commands (`POST /loans/{id}/renewals`), consistently.
- Optional expansions go in a query parameter (`?include=copies,reviews`), not a second endpoint per combination.
- Dates in ISO 8601 with a timezone (UTC), money as integer minor units plus a currency code, ids as opaque strings.

## Bounded responses

- **Wrap every list in an object** from day one: `{ "data": [...], "nextCursor": "..." , "hasMore": true }`. A bare array can't gain pagination fields later without breaking every client.
- **Every list is paginated** with a default and a maximum page size enforced on the server. A request for "all" gets the maximum. Adding pagination after launch is a breaking change, so it ships with the endpoint.
- **Prefer cursor pagination** (an opaque cursor for "after this item", from a stable sort with a unique tiebreaker such as `created_at, id`) for feeds and large or changing sets. Offset pagination is fine for small, stable, admin-style lists; it skips or repeats rows when data changes and slows down deep pages.
- Return the next cursor (or `null`), not total counts, unless the client truly needs a count and it's cheap.
- **Offset vs cursor, the trade-off:** offset can jump to page 5 but skips or repeats rows when data changes and gets slower with depth; a cursor is stable and fast but can't jump to an arbitrary page, and must be rejected cleanly (400 with a problem type) when it's malformed or expired.
- **Filtering and searching are different operations.** Filters (`GET /entries?habitId=123&status=completed`) are exact matches that use indexes; search (`GET /entries/search?q=morning+run`) is ranked full-text or semantic matching. Keep them separate rather than one parameter that does both badly.
- Filtering and sorting only on fields you've indexed and promised.

## Status codes

| Situation | Status |
|---|---|
| Read succeeded | 200 |
| Created (include a `Location` header) | 201 |
| Accepted for async processing (return a status URL) | 202 |
| Succeeded, nothing to return | 204 |
| Malformed request: unparsable JSON, wrong types, missing required fields | 400 |
| Not authenticated, or the token expired (send `WWW-Authenticate`) | 401 |
| Authenticated but not allowed | 403 (or 404 when revealing that the resource exists is itself a leak) |
| Resource doesn't exist (or isn't visible to this caller) | 404 |
| Existed, deliberately and permanently removed (deleted account, used one-time link, retired endpoint) | 410 |
| Conflicts with current state: already borrowed, duplicate, version mismatch on a write | 409 |
| Precondition on `If-Match` failed (optimistic concurrency with ETags) | 412 |
| Well-formed but fails business validation (when the API separates it from 400) | 422 |
| Rate limited (send `Retry-After`) | 429 |
| Our bug | 500 |
| A dependency returned an invalid response / timed out | 502 / 504 |
| Temporarily unavailable, try later (send `Retry-After`) | 503 |

Each ambiguous pair has one deciding question:

- **400 vs 422:** could a schema validator have caught it (broken JSON, wrong type, missing structure)? 400. Did it need business rules (end date before start date, quantity -5)? 422. Some teams use 400 for both; pick once and use it everywhere.
- **401 vs 403:** "who are you?" (missing, expired or invalid credentials; authenticating again can succeed) vs "I know who you are, and no" (retrying with the same identity never helps).
- **404 vs 410:** unknown, with no promise about past or future, vs verifiably existed and removed on purpose. 410 tells clients to drop their references and crawlers to de-index. Use it only when you can prove the past (a soft-deleted row); a retired API version returns 410 with a body linking the migration guide.
- **422 vs 409:** never valid as written vs not valid right now (a duplicate, a changed version, cancelling an order that already shipped). A 409 may succeed after a re-read; a client's conflict handling depends on that difference.

Each status tells the client what to do next: fix the request (400/422), log in again (401), stop (403/404/410), refresh and retry with the new state (409/412), wait (429/503), retry later or report (5xx).

**Never return 200 with an error in the body** (`{ "success": false }`). Machines act on the status without reading your docs: error-rate dashboards read 0% during an outage, and retry logic can't tell transient from permanent. Encode the mapping once (validation, exception handler, Problem Details) so endpoints can't freelance. [milan-jovanovic, apis/rest-api-http-status-codes.md]

- **Cacheability depends on the response and cache policy.** RFC 9111 permits storage under its stated conditions, including explicit freshness; heuristic cacheability is a separate rule. The source and old paragraph said CDNs cache 200 and 404 but never 500, which is not a general HTTP guarantee. https://www.rfc-editor.org/rfc/rfc9111.html#section-3
- **GraphQL has request, transport and execution errors.** A successful HTTP response can contain GraphQL execution errors, while malformed requests and server failures can use error statuses. Check the server's documented behavior and response media type. The source and old paragraph called GraphQL an always-200 model. https://graphql.org/learn/debug-errors/

## Error bodies: Problem Details

One helper builds every error response, so the shape and the correlation fields can't drift between endpoints. Use the standard shape (RFC 9457), `Content-Type: application/problem+json`:

```json
{
  "type": "https://api.example.com/problems/copy-unavailable",
  "title": "Copy not available",
  "status": 409,
  "detail": "Copy 4411 of 'Dune' is on loan until 2026-11-02.",
  "instance": "/loans",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736"
}
```

- `type` is a stable identifier clients can branch on (document each one); `title` is the same for every occurrence of the type; `detail` is about this occurrence and safe to show.
- Validation errors add an `errors` field mapping each field to its messages.
- Include a trace or correlation id so support can find the request in logs.
- A good error says what broke, why, and how to fix it. Field errors carry the field, the reason and the rejected value (`{ "field": "frequency", "reason": "Must be one of: daily, weekly, monthly", "value": "sometimes" }`).
- Unexpected exceptions become a generic 500 problem with the trace id. The exception text, stack, SQL and internal names stay in the logs (full detail is fine in local and staging builds, never in production). Don't copy the common shortcut of putting the exception's class name in `type` and its message in `detail`.
- **Framework-generated errors use the same shape:** an unmatched route, a wrong method, an unparsable body, an auth middleware rejection. A catch-all that turns empty error responses into Problem Details closes the gap.
- Add the correlation fields in one shared place (the error helper or middleware), not per endpoint. `instance` is a URI-reference identifying this occurrence; keep the request id and trace id in documented extension fields. The source and removed helper used method plus path, which is not a URI-reference. https://www.rfc-editor.org/rfc/rfc9457.html#section-3.1.5
- Map known domain failures to specific types deliberately, in one place, so the same failure looks the same from every endpoint.

## Changing a contract

**Safe (additive):** a new optional request field with a default that preserves old behavior; a new response field; a new endpoint or operation; a new optional query parameter.

**Breaking:** removing or renaming a field; changing a field's type, format or meaning (`"total": 100` becoming `"total": { "amount": 100, "currency": "USD" }` breaks clients as surely as deleting the endpoint); making an optional field required, or adding a new required field; tightening validation; changing pagination or error formats; changing status codes or error types clients depend on. Adding an enum value breaks clients that switch exhaustively: document enums as open and tell clients to handle unknown values.

**Behavior is part of the contract,** even when the URL, method and JSON shape stay identical and no schema diff shows anything:
- `DELETE /orders/{id}` was a recoverable soft delete; making it a hard delete silently destroys data for a support tool that relied on "undo". Add the new behavior as its own operation (`DELETE /orders/{id}/purge`, with its own permission) and leave the old one alone.
- `POST /orders` stops honoring the idempotency key; `/cancel` stops refunding automatically; `PUT` turns from full replace into a merge; a webhook that fired once per order now fires per line item. Each breaks every integration.

**The four compatibility rules:** take nothing away, don't change what an existing operation does, never make optional things required, and make everything new optional. Sometimes an ugly contract (`total` and `totalMoney` side by side) is the price of compatibility.

**Tightening request rules without breaking:** accept the missing value during a transition window, infer it where you can (the country from the billing profile), or put the stricter workflow in a new operation (`POST /checkout-sessions`).

**When one endpoint grows flags** (`POST /orders?validateOnly=true&includeTaxEstimate=true&reserveInventory=true`), it's hiding several workflows. Split them into operations (`POST /orders`, `POST /orders/quote`, `POST /checkout-sessions`) instead of a new version.

**Clients must be tolerant readers:** ignore unknown fields, never depend on field order. The usual trap is self-inflicted: response schemas parsed with `z.object(...).strict()`, generated SDKs that reject unknown properties, or contract tests that assert exact JSON equality. Parse responses with the default (strip unknown keys) and assert only the fields you use.

**When a change can't be additive:** first try a new operation or resource alongside the old one (a semantic change gets a new name, not a reinterpretation). Version only when the old and new semantics truly can't coexist or the resource model changed fundamentally, and choose the smallest break you can justify; for public APIs, URL versioning (`/v2/...`) is the easiest to communicate. Every live version multiplies bug fixes, security patches, docs and support questions, and the real work isn't creating v2, it's getting clients off v1.

**Deprecate like you mean it,** with all four parts:
1. Mark it `deprecated: true` in the OpenAPI description.
2. Signal it at runtime on every response that uses it. `Deprecation` uses a Structured Field Date, as in the RFC's `Deprecation: @1688169599`; `Sunset` uses an HTTP-date, and a `Link` with `rel="deprecation"` points to deprecation documentation. The source and old example used `Deprecation: true`; their Sunset example also mislabeled 31 December 2026 as Wednesday instead of Thursday. https://www.rfc-editor.org/rfc/rfc9745.html#section-2.1 and https://www.rfc-editor.org/rfc/rfc8594.html#section-3
3. Publish a migration guide with examples, and give real notice (6 to 12 months for external clients), running old and new in parallel.
4. Measure usage per client id, API key or tenant, contact the remaining callers, and remove only when usage is actually gone or the owners agreed, not because a date passed.

## Prove it

- Walk one client journey and list every operation it needs; anything in the API that no journey uses is a candidate to remove before release.
- Find every list endpoint and confirm the maximum page size is enforced.
- Assign statuses for: malformed loan JSON (400), an expired login (401), an already-borrowed copy (409), an unknown loan (404). Confirm each returns a matching Problem Details body and no internal text.
- Add a field to an existing request (say, a preferred pickup branch) and run the old client's tests unchanged. Then name a change to the same operation that would need a new operation instead (the request now reserves the copy, not just records a preference).
- Remove an item and request it again: 410 if it was deliberately removed and you can prove it existed, 404 otherwise.
