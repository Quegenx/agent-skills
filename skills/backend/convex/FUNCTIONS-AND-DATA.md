# Functions and data

Function and data rules come from [get-convex/agent-skills, convex-expert, convex-design, convex-quickstart, convex-reviewer, convex-crons, convex-env], corrected against Convex's official documentation. Inspect generated types rather than inventing a parallel backend interface.

## Function boundaries

- **Queries read; mutations write; actions perform outside work.** Queries and mutations have transactional database guarantees. An action may call queries and mutations, but those calls are separate transactions. The source's old description said every function is a transaction. [https://docs.convex.dev/functions/actions; https://docs.convex.dev/understanding/best-practices#avoid-sequential-ctxrunmutation--ctxrunquery-calls-from-actions]
- **Use generated application references and constructors.** Read the app's `_generated/server`, `_generated/api` and `_generated/dataModel` exports; use public or internal constructors deliberately and call registered functions through their generated references. The source's blanket ban on all convex/server imports was too broad: documented exports such as defineApp and httpRouter remain valid. [get-convex/agent-skills, convex-expert, convex-create-component]
- **Prefer object-form function declarations with argument contracts.** Use validators for IDs, literals, unions and structured arguments. The source's mandatory return-validator style is stricter than ordinary app requirements; component public validators also protect its generated API typing. HTTP actions validate their Request explicitly rather than accepting the ordinary function args object. [get-convex/agent-skills, convex-expert; https://docs.convex.dev/functions/validation; https://docs.convex.dev/functions/http-actions]
- **Honor the configured functions directory.** convex/ is the convention; convex.json.functions may move it. The old expert/quickstart rule treated that literal directory as mandatory. [https://docs.convex.dev/config/convex.json#changing-the-convex-folder-name-or-location]

## Access paths and values

- **Choose indexes from actual queries.** Trace equality prefixes, range and ordering, then bound or paginate the result. Avoid unbounded collect on growing data. A residual filter after an index range does not imply a whole-table scan; the source's blanket classification of every filter as one was wrong. [get-convex/agent-skills, convex-reviewer; https://docs.convex.dev/database/reading-data/indexes; https://docs.convex.dev/understanding/best-practices#avoid-filter-on-database-queries]
- **Validate document and collection size against all applicable limits.** Arrays permit at most 8192 elements, including 8192, subject to other value/document limits. The old reviewer required fewer than 8192. [https://docs.convex.dev/production/state/limits#values]
- **Keep authorization independent of a reference's shape.** An Id validator checks the table-shaped identifier; the public function still checks ownership or membership of the referenced resource. [get-convex/agent-skills, convex-authz; AUTH.md]

## HTTP, storage and scheduled work

- **Use HTTP actions and explicit routes for external requests.** Validate method, body and provider authentication at the route; keep application database changes behind the app's own authorized functions. Components' current HTTP support is in [COMPONENTS.md](COMPONENTS.md#http-and-environment). [get-convex/agent-skills, convex-quickstart, convex-create-component; https://docs.convex.dev/functions/http-actions]
- **Keep storage identifiers and access checks explicit.** Store storage IDs rather than assuming a public URL is the durable identity; check resource access in the wrapper that issues an upload or retrieval capability. [get-convex/agent-skills, convex-expert, convex-reviewer]
- **Register cron work with the actual generated function reference.** Separate recurring schedules from delayed work and from durable multi-step orchestration; the generic workflow choice remains in [background-jobs](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/background-jobs/DURABLE-WORKFLOWS.md). [get-convex/agent-skills, convex-crons, convex-design]
- **Environment access is not actions-only.** It is supported in queries, mutations, actions and HTTP actions; declare typed environment where supported and keep values out of logs and reports. The old convex-env rule prohibited process.env in queries and mutations. Components have a separate declared environment boundary. [https://docs.convex.dev/production/environment-variables; COMPONENTS.md]

## Native scheduling guarantees

- `ctx.scheduler.runAfter(ms, fn, args)` and `runAt(timestamp, fn, args)` schedule durably. From a mutation, scheduling is atomic with the mutation: it happens only if the mutation commits.
- **Scheduled mutations run exactly once** and are retried on transient errors. **Scheduled actions run at most once and are not retried:** an action that calls an external API can fail and simply not run again. For important work, have the action record its outcome through a mutation, and let a mutation (or a cron) check for unfinished jobs and reschedule them.
- Schedule `internal` functions so clients can't call them directly.
- Recurring work goes in `crons.ts`. A cron that might overlap a still-running previous run must check job state before starting.
- For many parallel actions with limits and retries, use a work pool component rather than scheduling unbounded actions at once.

Use the [generic first-run watermark policy](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/background-jobs/WORKERS.md#convex-scheduler-and-crons) when that recurring job needs it. Native guarantees come from the existing worker/provider guidance. [https://docs.convex.dev/scheduling/scheduled-functions; https://docs.convex.dev/scheduling/cron-jobs]

## Prove it

Read the complete public-to-database call path, generated references and configured function directory. Verify each validator and output shape against the installed API; demonstrate the actual index range and bound rather than merely finding withIndex; inspect HTTP and storage authorization and cron targets; report any unperformed runtime verification. [get-convex/agent-skills, convex-reviewer, convex-verify]
