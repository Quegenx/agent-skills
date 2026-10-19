---
name: system-design
description: "Designs a web system's components and how each one fails: load balancers, caches, queues, CDNs, feeds, plus worked designs. Use when sketching or reviewing a system architecture or planning for more traffic."
---

# System design

A design is a set of components plus an answer to "what happens when this one fails or gets ten times the load?". Worked designs (URL shortener, notifications, real-time chat, web crawler, file vault, checkout, recovery choices, sharding and failover) are in [DESIGNS.md](DESIGNS.md). Draw the request path, then walk each box and arrow with three questions: what does it own, what does it do when the next hop is slow or down, and which number tells you it's healthy. Start with the smallest design that meets today's targets, write the targets down (requests per second, p99 latency, data size, freshness), and add a component only when a target or a failure mode needs it.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

## The trusted boundary

- **Clients never talk to the database as an admin.** An application service holds the credentials on infrastructure you control and enforces authentication, authorization per operation, input validation, size limits, rate limits and audit. It also gives clients a stable API while the schema changes underneath.
- **A managed data API is still a boundary.** If the browser talks to a hosted database API (Supabase's REST API), the boundary is the row-level policies on every exposed table plus the anonymous key's limited role; the service-role key stays on servers (the `secure-coding` skill).
- **The service is now a dependency.** Bound its database pool (a connection per request exhausts the database), give every outbound call a timeout, and make retries bounded and idempotent so they don't amplify an outage. Run it on a private network with a least-privilege database role and secrets from a manager or workload identity.
- **Clients submit intent, not rows.** "Publish this text to followers" is a command; the server derives the author from the session, validates visibility and limits, assigns a stable ID, and returns the canonical record. Success means stored, not yet visible to everyone.
- **Decide scarce resources in the database, never from a cache.** Reserving the last copy, seat or unit is a conditional write (`update copies set reserved_by = $1 where id = $2 and reserved_by is null`, then check the row count) or a unique constraint, so two concurrent requests can't both win. The cache may say "available" after someone else took it; the write path reads authoritative state.
- **Relationships that are queried from both ends get their own table** (follows as an edge table indexed both ways), not a JSON array inside a row.

## Scaling the web tier

- **A load balancer in front of at least two stateless instances,** sized so the survivors stay below saturation after one fails. A single self-managed load balancer is itself the single point of failure; use a managed one or a redundant pair.
- **Statelessness is the prerequisite:** sessions in signed tokens or a shared store. Sticky sessions hide state instead of removing it, and lose it when an instance dies.
- **Health checks:** liveness answers "restart me?" and stays cheap; readiness answers "send me traffic?" and may check dependencies. A deep check that fails when the database blips takes every instance out at once (endpoints in the `observability` skill's HEALTH.md).
- **Rolling deploys** drain connections, wait for readiness, and keep enough capacity throughout; shut down gracefully on SIGTERM.
- **Load balancer retries resend requests,** so writes need idempotency keys (the `api-design` skill).
- **Scale on the signal that saturates first** (concurrency, queue time, CPU or latency), keep minimum capacity across zones, and watch the shared parts that scaling the tier doesn't fix: the database, a shared pool, one bad deploy everywhere.

## Caching the hot read path

- **Cache-aside:** read the cache; on a miss read the database and store with a TTL. The database now sees only the misses: 4,000 reads per second at a 95% hit rate leaves about 200 for the database, so the hit rate is a capacity number, not a nicety.
- **Write down the staleness budget,** then choose TTL, explicit invalidation (or versioned keys) and eviction sized for the hot working set.
- **Decide what happens when the cache is down:** a bounded fallback to the database, or the outage cascades. Test p99 with the cache gone.
- **Stampedes:** coalesce concurrent misses for a key into one load, add jitter to TTLs, serve stale while revalidating (the `performance-and-caching` skill).
- **Read replicas add read capacity, not write capacity,** and lag: a user who just wrote may read the old value from a replica. Route read-your-own-writes to the primary, test promotion and failover, and keep backups; a replica copies a bad delete too.
- **Measure** hit rate by route and key class, miss latency, evictions, hot keys and replica lag.
- Public, identical responses belong in a CDN; immutable data in an in-process cache; large shared data in a partitioned distributed cache.

## Writes that arrive faster than they can be processed

- **Buffer a write spike in a durable queue** with redundant workers, so the API accepts quickly and processing catches up. The queue's age is the health metric; workers must be idempotent because delivery is at least once (the `background-jobs` skill).
- **Take slow work off the request path:** a file upload goes straight to object storage with a signed URL, an object-created event starts the pipeline (scan, transcode, thumbnail), and the API records state transitions.
- **Metadata in the database, bytes in object storage,** served through a CDN. Keep authorization (who may play this video, a short-lived signed URL) separate from delivery (the CDN serving bytes), and make the CDN the only way into a private origin.
- **Derived views are replayable projections.** A search index or a home timeline is built asynchronously from events and can be rebuilt from the source of truth; the source never depends on the projection.
- **Trace across the async hops:** propagate trace context through the queue so a request can be followed from the API to the worker that finished it.

## Social feeds: fan-out

- **Fan-out on read goes further than it looks:** with an index on `(author_id, created_at)`, merging followed authors' recent posts at read time serves many products for a long time. Move to fan-out on write when reads clearly dominate (tens of reads per write) and the read query is the measured bottleneck. Caching each user's merged page instead rarely helps: every user's page is different, so the hit rate is poor.
- **Fan-out on write:** the post API is the only writer of posts and publishes an immutable event; workers read the follower list from the social graph and write post IDs into each follower's timeline cache; the feed API reads a bounded slice of IDs and hydrates them. Reads are cheap, writes multiply by follower count, and visibility is eventually consistent.
- **Store post IDs, not posts,** in timelines (a few hundred IDs per user is kilobytes), and apply policy at hydration: deleted posts, blocks and unfollows take effect on the next read instead of requiring a timeline rewrite.
- **One owner for post writes** keeps the post and outgoing intent in one transaction through an outbox; one service can still accept concurrent transactions. The source and old line inferred commit ordering from the owning API alone. Follow the canonical [per-aggregate ordering contract](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/messaging/FAILURE-AND-ORDER.md#ordering-per-aggregate-not-global), with idempotent chunk appends keyed by post ID so redelivery doesn't duplicate entries. [milan-jovanovic, how-do-you-build-a-social-media-feed-system-design; https://www.postgresql.org/docs/18/transaction-iso.html]
- **Read your own writes:** merge the author's own latest posts into their feed at read time, so a new post shows up before fan-out reaches them.
- **Timelines are disposable projections,** rebuildable from posts and the graph; cap rebuild concurrency, or a lost cache node turns into a rebuild storm on the database.
- **The social graph is its own store:** a different write path, read many times per post, and a cardinality that varies by orders of magnitude between accounts.
- **Celebrities break fan-out on write:** one post would mean millions of timeline writes. Use a hybrid: route at publish time by follower count; ordinary authors fan out, celebrity posts go to a compact index keyed by author (or region) that the feed merges at read time (by score or time, deduplicated, then hydrated). The routing decision is made once per publish from a fact the social graph already owns, the follower count, so the graph is read on both write paths: by the post API to route and by the workers to expand followers.
- **The hybrid caps write cost but makes reads less predictable:** a user who follows many celebrities needs several index reads per page. Privacy filtering (blocked or private accounts) has to happen on both sources.
- **The threshold flaps** when an account crosses it: version the routing decision and tolerate a post appearing in both sources (dedupe at merge).
- **Pagination over a merged feed** needs a cursor that doesn't duplicate or skip when new posts arrive: keep a position per source (timeline and each celebrity index) inside the cursor.
- **Demotion is the dangerous direction:** an account dropping below the threshold has posts that were never fanned out; backfill its recent posts into followers' timelines, or keep reading its index for a grace window.
- **Cut write amplification further:** fan out only to followers active recently (others get a rebuild on their next visit), and give big accounts their own queue so they don't delay everyone's posts.
- **Ranked feeds are a funnel:** gather candidates (in-network from the timeline, out-of-network from recommendations), score them with a cheap ranker, re-score the top few hundred with an expensive one, then apply rules (diversity, no repeats, policy). Each stage's latency budget is part of the design.
- **Measure** consumer lag first (it's the user-visible delay), fan-out writes per post by author, time from commit to visibility at a high percentile, timeline cache hit rate and merge latency, and alert when one author dominates the workers.

## Running untrusted code

A platform that executes users' code (graders, notebooks, plugins, CI) assumes someone will try to break out:

- **The API never executes anything.** It records the submission and publishes it to a queue; workers on separate machines consume it (competing consumers: scale by adding workers).
- **Workers hold no secrets they don't need:** no database credentials or API keys, and network rules (ACLs, security groups) that stop them reaching the database even inside the private network.
- **Each submission runs in a throwaway sandbox:** a container or micro-VM with no network, CPU, memory, time, process and disk limits, a read-only base image, and nothing shared with other sandboxes; destroy it afterwards. Infinite loops hit the time limit; fork bombs hit the process limit.
- **Whatever the code needs runs inside the sandbox** (a disposable database for a SQL exercise), so the sandbox never needs a path out.
- **Observe it centrally:** "what exactly happened in run 4712" should be one trace and one log query, not a search across machines.

## Small-team platform choices

- **Private by default:** every machine on a private network (a WireGuard mesh such as Tailscale or a self-hosted coordination server), only 80 and 443 open to a reverse proxy, admin tools and databases reachable only over the private network, with ACLs per machine (the `secure-coding` skill's SECRETS-AND-NETWORK.md). If the coordination server goes down, existing tunnels keep working; only new machines can't join.
- **A database on the same machine as the API** can be a deliberate trade for a small system: no network hop, far cheaper than a managed database, and the failure modes were already coupled. The price is that backups are yours: a nightly dump shipped to object storage, and a restore you've actually tested.
- **Static frontends through a CDN** are close to free and include DNS, caching and DDoS protection.
- **Keep platform services off the request path:** deployments and the observability stack on their own machine, with collectors on each server forwarding to it.
- **Buy what's expensive to get right and not your product,** typically authentication (sign-in UI, emails, social logins, MFA) and payments; a merchant of record also handles global sales tax and VAT. Self-hosting the rest keeps the bill flat as traffic grows.

## Prove it

For the design: the stated targets, the request path drawn end to end, and for each component its failure behavior and its health metric. Then walk two scenarios aloud: one instance (or the cache, or a zone) disappears at peak, and traffic triples for an hour. Every box should have an answer.
