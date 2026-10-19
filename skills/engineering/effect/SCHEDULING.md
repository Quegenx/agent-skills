# Scheduling: Schedule, retry and repeat

**Contents:** [The Schedule model](#the-schedule-model) · [Constructors](#constructors) · [Combinators](#combinators) · [Retry](#retry) · [Repeat and schedule](#repeat-and-schedule) · [Recipes](#recipes) · [Porting v3 schedules](#porting-v3-schedules) · [Anti-patterns](#anti-patterns) · [Prove it](#prove-it)

Everything here targets Effect v4. Stream pacing (`Stream.schedule`, `Stream.retry`, `Stream.repeat`) is in [STREAMS.md](STREAMS.md).

## The Schedule model

- **`Schedule<Output, Input = unknown, Error = never, Env = never>`** is stepped with an input value; each step either stops or produces an output together with the delay before the next step. Retry, repeat, stream and channel APIs all use it.
- **Steps return `[output, Duration]`** and terminate with `Cause.done`. v3 `ScheduleDriver` was removed; use `Schedule.toStepWithSleep`.
- **`Schedule.Metadata`** is `{ input, attempt, start, now, elapsed, elapsedSincePrevious, output, duration }`. The elapsed fields are millisecond numbers; `attempt` replaces v3 `recurrence`.
- **`Schedule.CurrentMetadata`** is a `Context.Reference` that repeat, retry, stream and channel scheduling provide to the effects run between steps (v3 called it `CurrentIterationMetadata`).
- **Schedules are in-process only:** they work while the current Effect runtime runs, and they neither persist jobs nor recover runs missed during downtime.

## Constructors

- **`Schedule.recurs(n)`:** a counter with no delay; one initial attempt plus at most `n` retries.
- **`Schedule.spaced(d)`:** each delay starts after the previous action completes. A 2-minute action with `spaced("5 minutes")` starts every 7 minutes.
- **`Schedule.fixed(d)`:** an aligned cadence. If the action takes longer than the interval, the next recurrence happens immediately, but missed intervals are not replayed.
- **`Schedule.exponential(base, factor = 2)`:** delay `base * factor^(attempt-1)`.
- **`Schedule.fibonacci(one)`, `Schedule.windowed(interval)`.**
- **`Schedule.duration(d)`** recurs once after `d`; **`Schedule.during(d)`** recurs only during `d`.
- **`Schedule.forever`** is `spaced(Duration.zero)` and outputs 0, 1, 2 and so on.
- **`Schedule.once`** recurs once, so with repeat the effect runs twice.
- **`Schedule.identity<A>()`.**
- **`Schedule.cron(expr, tz?)`:** five fields with an optional leading seconds field. When both day-of-month and weekday are specific, a date matches if either matches. Validate expressions with `Cron.parse` (returns a `Result`) and `Effect.fromResult`; preview with `Cron.sequence`. Pass the time zone; don't rely on the server's local time zone for a business rule.

## Combinators

- **`Schedule.max([a, b])`** continues while all continue, uses the largest delay and outputs that Duration (v3 called it `intersect`).
- **`Schedule.min([a, b])`** continues while any continues and uses the smallest delay (v3 `union` and `either`).
- **`Schedule.concat(other)`** runs phases in sequence (v3 `andThen`); `Schedule.concatResult` tags which phase produced each output.
- **`Schedule.upTo({ times?, duration? })`** stops at whichever limit comes first. `times` counts schedule outputs, so evaluations can be one more. `duration` is checked at step time, so a long effect is caught on the following step.
- **`Schedule.while(metadata => boolean | Effect<boolean>)`** (exported as `while`) replaces v3 `whileInput`, `whileOutput`, `untilInput`, `untilOutput`, `check`, `recurWhile` and `recurUntil`; refinements are supported.
- **`Schedule.modifyDelay(meta => Effect<Duration>)`** is effectful by default; **`Schedule.addDelay`** adds to the delay.
- **`Schedule.jittered`** scales the delay by a factor between 0.8 and 1.2; for custom bounds use `modifyDelay` with `Random.next`.
- **`Schedule.map`, `Schedule.tap`, `Schedule.passthrough`.**
- **`Schedule.setInputType<T>()`** sets the input type at compile time only.

## Retry

- **`Effect.retry` takes a `Schedule`, a builder `($) => ...`, or `Retry.Options` `{ while?, until?, times?, schedule? }`;** the predicates may return a boolean or an Effect. The builder form helps infer the input type when the schedule inspects the error.
- **The effect always runs once before the policy applies.** Defects and interruptions are not retried. If the policy stops while still failing, the last failure is propagated.
- **`{ times: 5 }` allows at most six executions.**
- **`Effect.retryOrElse(effect, schedule, (error, scheduleOutput) => fallback)`** runs a fallback once retries are exhausted.
- **`Effect.eventually`** retries until success, yielding between attempts.
- **Retry only what can succeed later:** retrying is not a substitute for handling permanent errors. Put a retryable predicate in the schedule.

## Repeat and schedule

- **`Effect.repeat(schedule | { while?, until?, times?, schedule? })`** repeats after success and stops at the first failure. The effect runs once before the schedule is stepped, so `Schedule.once` runs it twice. v3 `repeatN(n)` is `Effect.repeat({ times: n })`.
- **`Effect.schedule(effect, schedule)`** steps the schedule first, so the first run waits too: an hourly cleanup that doesn't run at startup.
- **`Effect.scheduleFrom(effect, initial, schedule)`** feeds `initial` to the schedule before the first run.
- **`Effect.repeatOrElse`'s fallback receives `Option<Schedule.Metadata<B, A>>`** (in v3 it received `Option<B>`).
- **`Effect.forever(effect, { disableYield? })`** repeats until the first error.
- **`Effect.whileLoop({ while, body, step })`** for a plain loop.
- **Run a schedule in the background:** v3 `scheduleForked` is `Effect.schedule` plus `Effect.forkScoped`.
- **Keep a repeating loop alive deliberately:** if an expected failure should not stop later runs, handle it inside the repeated action; don't hide permanent errors just to keep the loop running.

## Recipes

### Production retry

Capped exponential backoff with jitter and a retryable predicate:

```ts
export const productionRetrySchedule = Schedule.min([
  Schedule.exponential("250 millis"),
  // Cap the delay at 10 seconds to avoid excessively long waits.
  Schedule.spaced("10 seconds")
]).pipe(
  Schedule.jittered,
  Schedule.setInputType<HttpError>(),
  Schedule.while(({ input }) => input.retryable)
)
```

### A hard deadline for the whole retry

- **Place `Effect.timeout` after `Effect.retry`** so the budget covers the waits too; placed before it, the timeout applies per attempt.
- **`Schedule.upTo({ duration })` is not a deadline:** it cannot interrupt an attempt or a scheduled wait already in progress.

### Follow `Retry-After`

Carry the server's delay in the error and take the larger of it and the schedule's delay:

```ts
Schedule.modifyDelay(({ duration, input }) =>
  Effect.succeed(Duration.max(duration, input.retryAfter))
)
```

`Schedule.max` is wrong here: Retry-After is data, not a schedule.

### Record retries

Use `Schedule.tap` placed after the retry limit. A failure in the tap callback fails the retrying effect.

### Test schedules without waiting

Use `TestClock.adjust` from `effect/testing` with `TestClock.layer()`, and fork the program while it sleeps.

## Porting v3 schedules

- **`Schedule.linear`:** `Schedule.forever` + `Schedule.map` + `Schedule.modifyDelay`.
- **`fromDelays`:** `Schedule.duration` + `Schedule.concat`.
- **Day, hour and minute constraints:** `Schedule.cron`.
- **No direct replacement** for `collectAll*`, `reduce`, `zipWith`, `zipLeft`, `zipRight`, `compose`, `resetAfter`, `resetWhen`, `mapInput` and `provideService`: rebuild them with `Schedule.fromStep` and `Schedule.toStep`.

## Anti-patterns

- **Retrying permanent errors:** add `Schedule.while` with a retryable predicate.
- **Expecting `Schedule.upTo({ duration })` to cut an attempt short:** use `Effect.timeout` after `Effect.retry`.
- **Combining a Retry-After value with `Schedule.max`:** use `Schedule.modifyDelay`.
- **Swallowing permanent errors to keep a repeat loop running.**
- **Treating a Schedule as a job scheduler:** nothing persists across restarts, and missed runs are not recovered.
- **Assuming the first run of `Effect.schedule` is immediate:** it waits for the schedule; `Effect.repeat` runs first.

## Prove it

- A `TestClock` test advances time with `TestClock.adjust` and shows the expected number of attempts: `{ times: n }` gives `n + 1` executions.
- Retry schedules that inspect errors have a `Schedule.while` predicate, and a whole-operation deadline is an `Effect.timeout` placed after `Effect.retry`.
- No v3 names (`intersect`, `union`, `andThen`, `whileInput`, `repeatN`, `scheduleForked`) remain.
