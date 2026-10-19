# Worked designs

Each design lists the decisions that matter, in the order you'd make them, and what to watch in production. The general building blocks (load balancers, caches, queues, CDNs, feeds, sandboxes) are in [SKILL.md](SKILL.md).

## URL shortener

- **Codes:** short, unguessable when links are private: random base62 strings (7 characters is about 3.5 trillion values) inserted with a unique constraint, retrying on the rare collision. A counter encoded in base62 is shorter and collision-free but enumerable (anyone can walk every link). Custom aliases share the same unique column, with a reserved-word list (`admin`, `api`).
- **Redirect:** `301` is cached by browsers forever, so later edits, expiry and click counting stop working; use `302` (or `307`) for links you track or may change, `301` only for permanent ones.
- **Read path:** reads outnumber writes by orders of magnitude. Cache code-to-URL in memory and Redis, and serve redirects from the edge (a CDN worker reading a replicated key-value store) so most requests never reach the origin. Cache misses for unknown codes too (briefly), or scanners hammer the database; keep this design choice scoped through the [cacheable-result policy](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/CACHING.md#cacheable-results).
- **The viral link:** one key gets millions of requests per minute. Edge caching absorbs it; without an edge, an in-process cache in each instance in front of Redis keeps one hot key from saturating a single Redis node.
- **Clicks:** never write a row per click synchronously in the redirect. Emit an event to a queue or log and aggregate in batches (counts per link per minute); accept that counts lag. Deduplicate bots by user agent and rate per IP if counts drive anything paid.
- **Abuse:** check destination URLs against malware and phishing lists at creation and periodically after, rate-limit creation per account, and be able to disable a code instantly (the cache must honor the disable within seconds).
- **Watch:** redirect latency at the edge and the origin, cache hit rate, creation rate per account, the share of 404s.

## Notification platform

- **Accept, then deliver:** the API validates and stores a notification request (recipient, template, data, idempotency key) and returns at once; delivery is asynchronous. Producers never call email or SMS providers directly.
- **Fan out per channel:** one request becomes one delivery job per channel the user has enabled (email, push, SMS, in-app), each in its own queue with its own workers, retries and rate limits, so a slow SMS provider doesn't delay push.
- **Preferences are checked at delivery time,** not at request time: opt-outs per category and channel, quiet hours in the user's time zone (hold and release, or drop for time-sensitive alerts), frequency caps and digests (collapse 20 "new comment" events into one). Legal requirements (unsubscribe links, consent for SMS and marketing) are part of preferences, not templates.
- **Templates are versioned and localized,** rendered with escaped data; the request references a template version, so a template edit doesn't change messages already queued.
- **Providers fail:** retries with backoff and an idempotency key per delivery; a fallback provider per channel; dead letters for permanent failures. Process bounce and complaint webhooks and stop sending to dead addresses and tokens.
- **Exactly-once isn't available;** at-least-once plus a dedupe key per (notification, channel) keeps duplicates rare, and transactional messages (password reset, receipts) get priority queues separate from bulk ones.
- **Watch:** queue age per channel, delivery and failure rate per provider, time from request to delivery at a high percentile, bounce and complaint rates.

## Real-time chat

- **Connections:** clients hold a WebSocket (or SSE plus HTTP posts) to a gateway tier. Gateways are stateful per connection, so scale them horizontally with a connection registry (which gateway holds which user) and drain connections gracefully on deploy (clients reconnect with jittered backoff).
- **Messages are written before they're delivered:** the server assigns the ID and a per-conversation sequence number, stores the message, then publishes it to the gateways holding the conversation's members. Delivery is best effort; correctness comes from the store.
- **Ordering and gaps:** per conversation only. Clients track the last sequence number they have and, after a reconnect or a gap, fetch what they missed from the store. Client-generated message IDs make retries of a send idempotent.
- **Presence and typing indicators** are ephemeral: in-memory with short TTLs, published over pub/sub, never written to the main database.
- **Attachments** upload directly to object storage with signed URLs; the message carries the object reference, and downloads go through short-lived signed links (the file vault below).
- **Storage:** messages partitioned by conversation (and time), read newest first with a cursor; large group chats fan out on read rather than writing a copy per member.
- **Watch:** connected clients per gateway, message end-to-end latency, reconnect rate, missed-message fetches per reconnect.

## Web crawler

- **The frontier** is a durable queue of URLs to fetch, prioritized (importance, freshness need) and partitioned by host, so each host is owned by one worker partition: that's what makes politeness enforceable.
- **Politeness:** fetch and cache `robots.txt` per host (with its own expiry), respect crawl delay, cap concurrent connections per host and per IP (many hosts share one server), and back off on 429 and 5xx. Cache DNS answers per host with their TTL.
- **Deduplicate twice:** URLs before enqueueing (normalize scheme, host case, default ports, fragment, sorted query parameters, known tracking parameters; then a seen-set, a Bloom filter at scale) and content after fetching (a hash for exact duplicates, SimHash or MinHash for near-duplicates such as the same article with different ads).
- **Checkpoint before parsing:** store the raw response (object storage keyed by URL hash and fetch time) before parsing, so a parser bug can be fixed and re-run without refetching the web, and a crash mid-parse loses nothing.
- **Recrawl for freshness:** schedule each URL by its observed change rate (pages that changed on the last few visits come back sooner), use conditional requests (`If-None-Match`, `If-Modified-Since`) to make unchanged pages cheap.
- **Traps:** infinite calendars and session-ID URLs; cap depth per host, URLs per host and URL length, and detect repeating path segments.
- **Indexing** is a separate pipeline reading the stored pages (the derived-projection pattern in [SKILL.md](SKILL.md)).
- **Watch:** fetch rate per host against its limit, frontier size and age, duplicate rate, error rate by host.

## File vault

Upload straight to object storage with a short-lived signed URL scoped to one key, size and content type; record the file as `pending`; scan it (malware, type sniffing that ignores the client's claimed type) on the object-created event; mark it `available` only after the scan passes; serve downloads through short-lived signed URLs issued after an authorization check, through a CDN for large public files. Encrypt at rest with keys per tenant where tenants require separation, keep versions or object lock for files that must not be lost, and make deletion actually delete (versions included) within the stated time.

## Reliable checkout

One command (`placeOrder`) owned by one service; reserve stock before charging (a conditional update or reservation row with an expiry); charge with an idempotency key derived from the order; record the order and its outgoing events in one transaction with an outbox; compensate a failed step (release the reservation, refund) as a business action, not a rollback. Details: the `messaging` skill (FAILURE-AND-ORDER.md, OUTBOX-INBOX.md), the `api-design` skill (idempotency keys) and the `domain-modeling` skill (sagas).

## Recovering a data platform

Choose point-in-time recovery for data loss, a replica for failover, and replayable projections for derived stores. State the recovery point and recovery time targets. Execute the canonical [recovery procedure](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/deployment/SKILL.md#recovering-a-data-platform); PostgreSQL backup tools, WAL and promotion are in [Postgres operations](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/postgres/OPERATIONS.md#backups-and-recovery).

## Fundamentals

- **Survive a database failure:** a synchronous or near-synchronous replica in another zone with automated failover; clients reconnect with backoff and retry idempotent operations; connection strings point at a name that follows the primary. Test failover on purpose.
- **Shard when one database can't hold the writes or the data:** choose the key by the queries (tenant or user ID keeps one user's data together), use many logical shards mapped to fewer physical nodes so you can rebalance by moving whole shards, and expect cross-shard queries and transactions to become application work. Most systems should exhaust indexes, replicas, partitioning and vertical scaling first (the `software-architecture` skill's EVOLVE.md).
- **Rate-limit at the gateway,** per trusted identity, with the limit and remaining budget in response headers (the `api-design` skill's RELIABILITY.md); the gateway protects capacity, while the service still enforces per-user business limits.
- **Serve from the edge** what is public and identical for everyone; **buffer write spikes** in a durable queue; **derive search** asynchronously from the source of truth ([SKILL.md](SKILL.md)).
