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

## Supabase Queues (pgmq)

- Send with `pgmq_public.send(queue_name, message, sleep_seconds)` (the delay before the message becomes visible), or `pgmq.send` inside your own transaction alongside the job row.
- Read with `pgmq_public.read(queue_name, sleep_seconds, n)`. **That `sleep_seconds` is the visibility timeout:** how long the message stays hidden from other consumers while you work on it. Set it longer than the handler's worst case. A value of 0 makes the message visible again at once and another worker will process it too.
- After success, `delete` it (or `archive` it to keep history). If the handler fails, do nothing: the message reappears after the timeout and is retried.
- Each message carries `read_ct`, the number of times it was read. Past a limit (say 5), archive it to a dead-letter queue or table and alert, instead of retrying a poison message forever.
- Trigger consumers from `pg_cron` or an Edge Function on a schedule; process a small batch per run and stay under the function's time limit.

## Convex scheduler and crons

- `ctx.scheduler.runAfter(ms, fn, args)` and `runAt(timestamp, fn, args)` schedule durably. From a mutation, scheduling is atomic with the mutation: it happens only if the mutation commits.
- **Scheduled mutations run exactly once** and are retried on transient errors. **Scheduled actions run at most once and are not retried:** an action that calls an external API can fail and simply not run again. For important work, have the action record its outcome through a mutation, and let a mutation (or a cron) check for unfinished jobs and reschedule them.
- Schedule `internal` functions so clients can't call them directly.
- Recurring work goes in `crons.ts`. A cron that might overlap a still-running previous run must check job state before starting.
- For many parallel actions with limits and retries, use a work pool component rather than scheduling unbounded actions at once.

## Retries and failure

- **One failing job must not stop the worker.** Catch errors per job inside the loop, mark that job failed or scheduled for retry, log it with the job id, and move to the next; an uncaught error that kills the loop stops every job behind it.
- Retry transient failures with exponential backoff and jitter, up to a limit, by setting `run_at` (or the message delay) in the future.
- Classify errors: a validation or permission error won't succeed on retry; mark the job failed with the reason right away.
- After the last attempt, move the job to `failed` (or a dead-letter store) with the error, alert, and make it re-runnable by an operator.
- Record attempts, last error and timestamps on the job so a failure can be understood without digging through logs.

## Prove it

Run two workers against the same queue with ten jobs: each job runs once. Kill a worker mid-job: the job is picked up again after its lease or visibility timeout, and the side effect isn't duplicated. Feed a message that always fails: it stops after the retry limit and lands in the dead-letter store.
