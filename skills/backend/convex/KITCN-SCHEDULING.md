# kitcn scheduling and job visibility

Scheduling guidance comes from [udecode/kitcn, SKILL.md, references/features/scheduling.md, references/setup/server.md], checked against [Convex scheduling](https://docs.convex.dev/scheduling/scheduled-functions). This topic owns generated scheduling calls and source corrections; transaction/retry guarantees already live in the [native Convex scheduler section](FUNCTIONS-AND-DATA.md#native-scheduling-guarantees).

## Generated procedure schedules

[udecode/kitcn, SKILL.md, section 10; references/features/scheduling.md, Scheduling functions; https://kitcn.dev/docs/server/scheduling]

| Job | Generated API |
|---|---|
| Work scheduled immediately | `caller.schedule.now.*` |
| Delay in milliseconds | `caller.schedule.after(ms).*` |
| Specific Unix timestamp in milliseconds | `caller.schedule.at(timestamp).*` |
| Cancel a stored job ID | `caller.schedule.cancel(jobId)` |

The generated Caller comes from the scheduled module's runtime. Use its scheduling namespace for kitcn procedures and native `ctx.scheduler` for raw internal Convex functions. `requireSchedulerCtx(ctx)` narrows a scheduling-capable mutation/action context; `requireActionCtx(ctx)` is only for actual action callbacks, not a mutation that happens to schedule work. [KITCN.md](KITCN.md#generated-call-boundaries) owns other dispatch boundaries.

Source use cases are recurring cleanup/analytics, post-signup mail, timed subscription expiry, reminders and delayed order processing. A mutation's schedule.now target runs after commit, not inline before the mutation returns. Store returned job IDs only where later status/cancellation needs them. [udecode/kitcn, references/features/scheduling.md, When to use each and Schedule immediately]

## Native boundaries and limits

[https://docs.convex.dev/scheduling/scheduled-functions]

- Keep [mutation scheduling atomicity and mutation/action execution guarantees](FUNCTIONS-AND-DATA.md#native-scheduling-guarantees) with their canonical owner. A schedule made from an action is not rolled back when that action later fails.
- Authentication is not propagated to the scheduled function. Pass the required user/org context explicitly from an already authorized boundary, then check the current target/conditions when work executes; the target may have been deleted. Prefer internal entrypoints for scheduled work. [udecode/kitcn, references/features/scheduling.md, Auth context and Best practices]
- One function can schedule at most 1000 functions with 8 MB total argument size. Completed scheduling records/results are retained for seven days.
- The source's blanket reminder that scheduled work "might run multiple times" does not override Convex's mutation/action-specific guarantees. Application-level manual retries and repeated cron runs still need the intended effect policy; generic retry design remains in [background jobs](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/background-jobs/WORKERS.md#retries-and-failure).

## Recurring jobs

[udecode/kitcn, references/features/scheduling.md, Cron jobs; https://docs.convex.dev/scheduling/cron-jobs]

Use `cronJobs()` in the configured crons file and the actual generated internal reference, including for a function defined in the same file. Registration basics remain in [FUNCTIONS-AND-DATA.md](FUNCTIONS-AND-DATA.md#http-storage-and-scheduled-work).

Five-field cron strings use minute, hour, day-of-month, month and day-of-week in UTC. The source's one-minute statement applies to those expressions, **not** all scheduler intervals: official `crons.interval` supports seconds-level intervals.

| Source expression | UTC schedule |
|---|---|
| `* * * * *` | Every minute |
| `*/15 * * * *` | Every 15 minutes |
| `0 * * * *` | Every hour |
| `0 0 * * *` | Midnight daily |
| `0 9 * * *` | 09:00 daily |
| `0 9 * * 1-5` | 09:00 weekdays |
| `0 0 1 * *` | First day of each month |

## Status, output and cancellation

[udecode/kitcn, references/features/scheduling.md, Cancellation and Job status; https://docs.convex.dev/api/interfaces/server.SystemDataModel]

Inspect jobs in the dashboard's Schedules tab or the `_scheduled_functions` system table. Kitcn ORM exposes the raw `db.system` reader, so rows retain **`_id`**, not an ORM-renamed id. The source listPendingJobs destructures id incorrectly. Raw records can contain name, args, scheduledTime, completedTime and state; expose only the authorized application projection. [https://github.com/udecode/kitcn/blob/main/packages/kitcn/src/orm/database.ts]

| State | Source meaning |
|---|---|
| `pending` | Not started |
| `inProgress` | Action running |
| `success` | Completed |
| `failed` | Failed |
| `canceled` | Canceled through dashboard/API |

The source's public get/list examples do not establish application authorization, and its collect-based pending list is unbounded. Their output schemas strip args, so these exact projected examples are not proof of an argument leak. Use the existing [bounded reads](FUNCTIONS-AND-DATA.md#access-paths-and-values) and [document/parent authorization](AUTH.md#public-functions-and-referenced-parents), rather than copying them as public job-management endpoints.

The subscription-cancellation template accepts a subscription ID, reads its stored job ID and deletes the subscription without matching the caller to its owner/org. Authentication alone does not authorize cancellation. Keep that app permission at the public boundary before using the stored job reference. [udecode/kitcn, references/features/scheduling.md, Canceling; https://docs.convex.dev/auth/functions-auth]

## Prove it

[udecode/kitcn, SKILL.md, sections 10 and 11; references/features/scheduling.md]

Read the generated target, scheduling-capable context, delay/timestamp units, stored job ID and selected deployment. Trace current ownership for cancellation/status, the context passed into scheduled work, the target's current existence and the deliberate output projection. Distinguish scheduled work from completed work using [the existing testing completion guidance](TESTING.md). Verify cron timezone and interval API rather than applying the source's one-minute statement to every schedule. Runtime execution remains unperformed unless authorized.
