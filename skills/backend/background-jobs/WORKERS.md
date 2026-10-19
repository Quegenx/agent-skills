# Workers, queues and schedulers

## Delivery is at least once

Any reliable queue or scheduler will, after a crash or timeout, deliver the same work again. Design every handler to be safe to run twice:
- read the job's state first and exit if it's already done;
- move state with a conditional write (`update jobs set status = 'running' where id = $1 and status = 'queued'`) and stop if no row changed;
- key every side effect by the job id (an email keyed by `reminder:{loanId}:{date}`, a charge with an idempotency key), so a repeat is recognized.

## Claiming work in Postgres

A jobs table works as a queue when workers claim rows without blocking each other:

```sql
update jobs set status = 'running', locked_until = now() + interval '5 minutes', attempts = attempts + 1
where id in (
  select id from jobs
  where status = 'queued' and run_at <= now()
  order by run_at
  limit 10
  for update skip locked
)
returning *;
```

`for update skip locked` lets each worker take different rows. A job whose `locked_until` passed without completing is considered abandoned and can be reclaimed (only if the handler is idempotent).

- **A worker's late write is fenced:** a renewal or a finish checks that the claim is still its own (the same run id, not expired, not superseded) after locking the row, and commits results, progress and notifications in one transaction. A reclaimed job's old worker then can't write or clear the new claim.
- **Claim one at a time and renew before each slow step** (a read, a model call) when steps run long.
- **Rotate shared budgets:** pick the next group or account by when it was last served, and persist cursors with the original look-back window, or the same busy sources take every run and their newest pages hide the rest.
- **Read from where you left off, not a fixed window.** "The last 24 hours" leaves a gap after a late run and repeats items after an early one. Keep a bookmark per source (the timestamp of the newest item read, written at the end of the run) so the next window stretches or shrinks to cover everything since.

## Supabase Queues (pgmq)

See [Supabase queue APIs, visibility, permissions and consumers](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/supabase/CRON-AND-QUEUES.md#queues-consumers).

## Convex scheduler and crons

Use [native Convex scheduling guarantees](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/convex/FUNCTIONS-AND-DATA.md#native-scheduling-guarantees) for durable API calls, atomicity, execution/retry guarantees and cron registration.

- **A recurring job's first run sets its watermark to "now"** rather than processing all history; backfills and resets: [marketing-loops LOOP-STATE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/marketing/marketing-loops/LOOP-STATE.md#resetting-and-backfilling-safely) [coreyhaines31/marketingskills, marketing-loops].

## Retries and failure

- **One failing job must not stop the worker.** Catch errors per job inside the loop, mark that job failed or scheduled for retry, log it with the job id, and move to the next; an uncaught error that kills the loop stops every job behind it.
- Retry transient failures with exponential backoff and jitter, up to a limit, by setting `run_at` (or the message delay) in the future.
- Classify errors: a validation or permission error won't succeed on retry; mark the job failed with the reason right away.
- After the last attempt, move the job to `failed` (or a dead-letter store) with the error, alert, and make it re-runnable by an operator.
- Record attempts, last error and timestamps on the job so a failure can be understood without digging through logs.

## Prove it

Run two workers against the same queue with ten jobs: each job runs once. Kill a worker mid-job: the job is picked up again after its lease or visibility timeout, and the side effect isn't duplicated. Feed a message that always fails: it stops after the retry limit and lands in the dead-letter store.
