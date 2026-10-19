---
name: background-jobs
description: "Builds work outside the request and controls concurrency: async APIs with job status, workers and queues, retries, durable multi-step workflows, locks across instances. Use when adding a job, queue, cron, worker or long-running workflow, or fixing races and duplicate processing."
---

# Background jobs and concurrency

Work that leaves the request, and state that more than one thing touches at once. Both fail quietly: a job accepted into memory vanishes on deploy; two workers both think they won. Pick the file:

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| An endpoint that starts long work and lets the client track it | [ASYNC-APIS.md](ASYNC-APIS.md) |
| Queues, workers, schedulers, crons, retries, dead letters | [WORKERS.md](WORKERS.md) |
| Paid or irreversible provider calls: submission intent, uncertain outcomes, reconciliation and restart | [EXTERNAL-SIDE-EFFECTS.md](EXTERNAL-SIDE-EFFECTS.md) |
| Multi-step work that runs for minutes to days: durable steps, replay rules, waits for events and people, compensation, flow control per tenant, progress streaming | [DURABLE-WORKFLOWS.md](DURABLE-WORKFLOWS.md) |
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

**Next.js `after()` against rule 1.** [Vercel, react-best-practices] `after()` from `next/server` schedules work "after a response is sent", so logging and analytics don't block it; the rule lists "Analytics tracking", "Audit logging", "Sending notifications", "Cache invalidation" and "Cleanup tasks" as uses. Next.js documents it as stable since v15.1.0, usable in Server Components (including `generateMetadata`), Server Functions, Route Handlers and Proxy, "executed even if the response didn't complete successfully", and Server Components can't read `cookies` or `headers` inside it, so read them before and pass the values in (https://nextjs.org/docs/app/api-reference/functions/after). Rule 1 here stands: the `after()` docs promise no retry or persistence, so it counts as a fire-and-forget promise; keep it for work you can afford to lose (logs, analytics), and put anything that must happen (a notification the user expects, an audit record you're required to keep) in a durable job ([WORKERS.md](WORKERS.md), [DURABLE-WORKFLOWS.md](DURABLE-WORKFLOWS.md)).

## Prove it

For any job or lock you build, test on purpose: a restart right after accepting; a crash mid-job; two workers or instances at once; the lock backend unavailable; the same message delivered twice. For each, write down what the user sees and confirm the invariant held.
