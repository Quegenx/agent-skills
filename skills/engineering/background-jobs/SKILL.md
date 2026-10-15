---
name: background-jobs
description: Builds background work and concurrency control that survive restarts, retries and multiple instances - async APIs that accept durable work and return a status resource (202 plus a job location), job state machines with progress and failure, workers that claim work safely (Postgres SKIP LOCKED, Supabase Queues/pgmq visibility timeouts, Convex scheduler and crons), at-least-once handlers made idempotent, retries with backoff and dead-lettering, in-process races between awaits fixed with per-key locks or semaphores, Postgres row locks (for update, for no key update, nowait, lock_timeout, isolation levels, deadlock-free lock order), and coordination across instances with database constraints, transactions, transaction or session advisory locks, or leases with fencing. Use when an operation is too slow for a request, adding a queue, cron or worker, scheduling work, fixing duplicate or lost jobs, race conditions, double processing, "only one instance should run this", or choosing a lock.
---

# Background jobs and concurrency

Work that leaves the request, and state that more than one thing touches at once. Both fail quietly: a job accepted into memory vanishes on deploy; two workers both think they won. Pick the file:

| The job | Read |
|---|---|
| An endpoint that starts long work and lets the client track it | [ASYNC-APIS.md](ASYNC-APIS.md) |
| Queues, workers, schedulers, crons, retries, dead letters | [WORKERS.md](WORKERS.md) |
| Races, row locks, isolation, deadlocks, "only one at a time", across one process or many | [CONCURRENCY.md](CONCURRENCY.md) |

For jobs that call paid AI APIs, also read the `ai-features` skill's AI-JOBS.md; for idempotency keys and status codes, the `api-design` skill.

## The rules under all of them

1. **Accepted means durable.** Work is accepted only once it's written somewhere that survives a restart (a database row, a queue, a scheduled function). An in-memory queue or a fire-and-forget promise is lost on the next deploy.
2. **Every job is a state machine** with visible states (queued, running, succeeded, failed, plus uncertain where a side effect may have happened) and every transition is a conditional write, so two workers can't both move it.
3. **Assume at-least-once.** Queues and schedulers redeliver after crashes and timeouts. Every handler must be safe to run twice: check the state first, key side effects by the job id.
4. **Protect the invariant, not the code.** Decide what must never happen (a copy reserved twice, a reminder sent twice) and enforce it where the data lives: a unique constraint, a conditional update, a transaction. Locks are for when that isn't possible.
5. **A local lock coordinates one process only.** With more than one instance, worker or serverless invocation, coordination needs a shared authority (the database, Redis, the platform's transactional runtime).
6. **Uncertain is not acquired.** If you can't confirm you hold a lock or that a side effect didn't happen, act as if you don't hold it and as if it might have happened.
7. **Every failure has a defined outcome** written down: skipped, retried later, or rejected with a visible reason. Never silently dropped.

## Prove it

For any job or lock you build, test on purpose: a restart right after accepting; a crash mid-job; two workers or instances at once; the lock backend unavailable; the same message delivered twice. For each, write down what the user sees and confirm the invariant held.
