# Durable workflows: work that runs for minutes, hours or days

A job that does one thing fits a queue and a worker ([WORKERS.md](WORKERS.md)). Work with several side effects in a row, waits in between, or a run longer than a request (an import, an onboarding sequence, an AI agent researching for twenty minutes) needs a durable workflow: code written as one function, run as a series of steps whose results are saved, so a crash, deploy or timeout resumes at the next step instead of starting over. Use a workflow engine for this (Inngest, Vercel Workflow, Convex's workflow component, Temporal), not a hand-rolled state machine, unless the flow is two steps.

For Convex-specific component isolation, app wrappers and generated APIs, see [convex COMPONENTS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/convex/COMPONENTS.md); retain this file as the generic workflow owner. [get-convex/agent-skills, convex-design, convex-suggest]

## How a step function runs

The engine calls your function again and again. Each call replays it from the top: a step that already finished returns its saved result at once, and the first step without a result runs (or is scheduled) and the call ends. So:

- **Code outside steps runs on every call.** Keep it free of side effects and of anything that changes between calls: no `Date.now()`, random ids, API reads or logs that must appear once outside a step. Put them in a step, which records the value once.
- **The function must make the same step calls in the same order** given the same saved results. Branch only on step results and the triggering input.
- **Step ids are stable and unique.** The id is the key its saved result is found by; a step called in a loop gets a counter suffix from the engine, so the loop's order must not change between calls.
- **Step results are JSON.** A `Date` comes back a string, a class instance a plain object. Return plain data, and parse it with a schema on the way out of the step if the type matters.
- **Keep saved state small:** the engine stores every result and resends them on each call. Put large payloads (files, long transcripts) in storage and pass the id.
- **Changing the code of a running workflow** can leave a saved result with no step to match, or a step with no result. Add steps, don't rename or reorder the ones in-flight runs have passed; for a change that can't be compatible, ship it as a new workflow (or a version branch) and let the old runs finish on the old one.

## Failure

- **Each step retries on its own** (a few times, with backoff); the steps before it are not rerun. Make each step idempotent anyway: a step can run, succeed at the outside service and crash before its result is saved.
- **Mark errors that retrying can't fix** (a missing record, a rejected card) as non-retryable, so the run fails at once with that reason.
- **A failure handler** runs when the run gives up: notify, mark the record failed, release what was reserved.
- **Side effects already done stay done.** For a multi-step booking (hold seat, charge, confirm), give each step its compensation (release the seat, refund) and run them in reverse when a later step fails for good. Cancelling a run stops future steps; it undoes nothing.
- **After an ambiguous failure of an outside write** (a timeout, a dropped connection), read the destination before writing again; the first attempt may have landed. Pass the same idempotency key on the retry.
- **Give rows a step writes a deterministic id,** so a retried step overwrites its own earlier output instead of adding to it: open-seo's audit steps store each issue with a `dedupeKey` in a deterministic id "so step retries don't duplicate issues". [open-seo]

## Waiting

- **Sleep** for a duration or until a time, without holding a worker. Sleeping for a week costs nothing.
- **Wait for an event** (a payment confirmed, a reply from a person) matched on an id from the run's own input (`order_id` equals `order_id`), with a timeout. A timeout returns nothing, and the code must handle that branch ("no reply in 4 hours: escalate").
- **A result that lands after the timeout branch ran** (a slow enrichment, a late reply) guards its write with the current state: [third-party-integrations CALLS-AND-SYNC.md](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/third-party-integrations/CALLS-AND-SYNC.md) [coreyhaines31/marketingskills, revops].
- **An event sent before the wait began is missed.** If the other side can answer quickly, have it also record the answer in the database, and check the database first, then wait.
- **A named signal** (one key, one waiter) suits approvals: decide what happens when a second wait for the same key starts (replace the old one, or fail).
- **Cancel on an event** (the user deleted the project, the order was cancelled) so a sleeping run doesn't wake up and act on something gone.

## Calling other work

| Need | Use | Waits for the result? |
|---|---|---|
| The result, to continue | invoke another workflow as a step | yes |
| Notify anything interested | send an event as a step | no |
| One specific job, later, fire and forget (scoring, cleanup) | a deferred run of that workflow | no |
| Several independent steps at once | run steps in parallel (`Promise.all` over steps) | yes, all of them |

Send events and start other work from inside a step, so a replay doesn't send them twice.

## Flow control

Decide these per workflow, keyed by the tenant or user so one account can't starve the rest:

| Control | Behaviour | Typical use |
|---|---|---|
| Concurrency limit (per key) | at most N steps of this workflow running at once, per key; the rest wait | one agent run per conversation; 5 imports per account |
| Throttle | start at most N runs per period, the rest queue (can build a backlog) | an API with a per-minute quota |
| Rate limit | at most N runs per period, the rest are dropped | expensive, skippable work |
| Debounce | wait until the events for a key stop for a period, then run once with the latest; with a maximum delay | reindex after a burst of edits |
| Batch | collect up to N events or a timeout, run once on the list | bulk writes, embeddings |
| Priority | run some runs before others already queued | paying accounts, interactive before background |
| Singleton (per key) | one active run per key: skip the new one, or cancel the old one | "sync this account" pressed twice |
| Idempotency key | the same key within a window starts one run | a webhook delivered twice |
| Timeouts | cancel if it waits too long to start, or runs too long once started | stale work that no one needs anymore |

For a form or booking webhook the idempotency key is the provider's stable submission id: a replay "should not create another contact, task, notification, or booking" [coreyhaines31/marketingskills, revops]; for affiliate payouts, "Replayed webhooks and exports must not count a conversion or payment twice" [coreyhaines31/marketingskills, referrals].

Throttle queues, rate limit drops: choosing the wrong one either loses work or builds an unbounded backlog.

## Running inline, then in the background

Many engines can run a workflow inside the request first, saving each step as it goes, and hand it to the background if it outlives the request. Set the hand-off a little below the platform's request timeout, so it moves before the platform kills it. Steps not yet saved when the process dies run again.

## Progress the user sees

- **Stream frequent updates** (tokens, "searching source 3 of 8") with a plain publish: cheap, may repeat on a retry, fine to lose.
- **Publish state changes** (step finished, waiting for approval, done) from a step, so they happen once.
- **Subscribe through a token** the server mints for that user and that run's channel; never let the client choose a channel by name.
- **The stored run state** stays the source of truth; a page that reloads reads it, then resumes the stream.

## Testing

- Run the whole function with mocked step results, and run it up to one step to check what that step was given or which wait it registered.
- Mock a step to throw, to test the failure branch and the failure handler (which test helpers often don't run for you).
- Mocked results usually skip the JSON round trip: test a step returning a `Date` through real serialisation once.

## Retention

Run history grows without limit. Delete a run's records only after it reached a final state (completed, failed, cancelled, skipped) and finished longer ago than the retention window. Deleting by age alone destroys runs still sleeping, debouncing or waiting for a reply.

## Prove it

Kill the worker mid-run and confirm it resumes at the next step without repeating the last side effect; deploy a change while runs are sleeping and confirm they finish; send the awaited event before the wait starts and confirm the run still proceeds; trigger the same work twice and confirm the singleton or idempotency key held; deliver the same form webhook twice and confirm one contact, one task and one booking; fail the last step for good and confirm the compensations ran.
