---
name: system-migration
description: "Moves a running system to new code or off a dependency without stopping the business. Use when planning a rewrite, a port or a legacy migration, or when a dependency's license or support changes."
---

# System migration

Change what runs underneath while the business keeps running. A rewrite fails when it stops the product for months, when nobody can tell whether the new code behaves like the old, or when the knowledge in the old system leaves with the people who wrote it. Every rule below exists to prevent one of those.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Incremental ports, legacy rewrites, hot-path switches and dependency replacement | [SKILL.md](SKILL.md) |
| jscpd function maps, unmatched capabilities, source-test coverage maps and independent behavior evidence | [FUNCTION-PARITY.md](FUNCTION-PARITY.md) |

## Incremental ports (new language, runtime or framework)

- **Start from the requirement, not the language.** Write down the measurable goals (latency, memory, startup, binary size) and the constraint that forces the change, such as loading the runtime in-process from several host languages with no second garbage collector or child process. The choice of language follows from that.
- **Port without freezing the product.** Each pull request replaces one component with a thin shim into the new code and deletes the old code in the same change, on the main branch, released as usual. Small releases make each reported issue traceable to a recent port. No long-lived rewrite branch.
- **The existing end-to-end tests are the contract.** They run unchanged against the new code and block the merge on failure. A ported change that deletes or edits an end-to-end test is a sign of a porting bug, not a cleanup.
- **Fan the work out by unit when agents do it.** Break the task into units (callsites, failing tests, modules), spin off a subagent per fix in its own worktree, have another agent adversarially review each fix, then merge. Tell the agents not to run resource-intensive commands, so you can run the most in parallel without running out of resources on the machine.
- **Layer the review when no human can read every line.** Reviewer agents (on more than one model) compare old and new code line by line until clean; tests and static analysis check what's mechanical; people review architecture, API contracts, risk and anything the other layers flag; one owner decides each merge.
- **Read benchmarks for what they compare.** Numbers measured on a local fake server exclude model and network time. Separate the gain from the language from the gain from the architecture it enabled (in-process instead of a child process can dwarf the rest), and remember both systems changed during the port.
- **Count the whole cost:** tokens, the lead's time, teammates' time on bindings, packaging and reviews, and maintenance after. Agents change how much code one engineer can supervise; they don't remove the engineer who understands the system and vouches for the release. Expect most of that engineer's messages to agents to go to review, tests and CI, challenging design decisions, and pushing agents that stopped before the job was done.

## Rewriting a legacy system

**Understand it before moving anything.** Map each business process to where it lives technically (tables, procedures, reports, integrations). The business describes a simple workflow; the implementation shows decades of edge cases. The map shows the domains that become modules (the `domain-modeling` skill's STRATEGIC.md), and the real scope. Expect columns nobody dares drop because some report might use them: list them, and find out.

**Start with the core domain, not the quick wins.** Migrating peripheral features first leaves the core in the old system, so every migrated feature needs synchronization with it and the debt compounds. Moving the core first shows progress later and finishes sooner. Product needs visible progress, so agree on the order openly and show the core's progress in business terms, rather than letting quick wins decide the architecture.

**Source conflict, keep the core-first rule above:** the strangler-fig source instead chooses the least coupled, highest-value context (notifications, payments, user profiles), with its own schema, domain model and public API, as the first module. [milan-jovanovic, strangler-fig-modular-monolith-migration]

**Run both systems side by side** and move one module at a time:
- **One source of truth per piece of data at every stage:** the legacy system for everything not yet migrated, the new system for what has moved. Write it down per table or entity, and update it when a module switches.
- **Modules with their own tables or schemas** in the new system, talking to each other and to the legacy system through messages (a modular monolith with a queue or event bus), so each module can move on its own schedule.
- **Synchronize both ways without loops:** mark every synced change with its origin and skip changes that came from the other side, or the two systems echo each update forever. Make the sync idempotent (a change ID per message).
- **Change data capture tools** (Debezium, logical replication) fit one-to-one table copies. When a legacy table is built from several new ones, or business rules apply during the transformation, you'll likely need custom sync; study the tools' patterns first even if you can't use them.
- **Reconcile before switching traffic:** compare record counts and key totals between the systems for the module about to switch, investigate every difference, and keep the old path available until the numbers agree.

### A routing seam

[milan-jovanovic, strangler-fig-modular-monolith-migration]

An interface with two implementations, chosen per call by a feature flag, so switching and rolling back need no deploy:

```ts
export const orderReadsRouter = (legacy: OrderReads, next: OrderReads, flags: Flags): OrderReads => ({
  async getOrder(id) {
    return (await flags.isEnabled("orders-module")) ? next.getOrder(id) : legacy.getOrder(id);
  },
});
```

When the legacy system is a separate application, the seam is a reverse proxy route table instead: migrated routes go to the new application, everything else to the old one. Flag mechanics and cleanup: the `api-design` skill's FLAGS.md.

### Capture, compare and cut over

- **A polling job** in the source copies rows changed since the last cutoff and advances the cutoff to the run's start. The old line claimed this prevents skips. That recipe alone does not cover deletions, equal timestamps or a transaction that becomes visible after the poll with an earlier modification time. These are static contract limitations; no polling run was executed. The source-of-truth and reconciliation contract above still applies. [milan-jovanovic, strangler-fig-modular-monolith-migration; https://www.postgresql.org/docs/18/transaction-iso.html]
- **Or events:** the legacy code publishes a change after each write and the new module consumes it (in-process while they share a runtime), or change data capture on the legacy tables.

Routing rollback requires the old path to remain runnable with compatible, reconciled data, including accepted new writes. The source and old line called rollback just a routing change. This qualification follows the source-of-truth and synchronization requirements, not a performed rollback test. [milan-jovanovic, when-to-extract-module-to-microservice; https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/strangler-fig.html]

**Compare reads** through the canonical [hot-path switch](#switching-a-hot-path-to-a-new-implementation). The source example and removed TS illustration awaited both answers, so a slow new implementation delayed the user; they did not establish background latency isolation. Never double the writes: that duplicates every side effect. [milan-jovanovic, strangler-fig-modular-monolith-migration]

**Cut over and clean up:** flip the flag for everyone, retaining the legacy path only while the rollback data contract holds; then stop the sync and remove obsolete code and tables through the project's authorized migration. The source's flag-only rollback omitted accepted new writes. [milan-jovanovic, strangler-fig-modular-monolith-migration]

**Timeline per module,** the author's planning example: scoping 1 to 2 weeks, building 2 to 4, data migration 1 to 2, parallel run 1 to 2, cutover a day, cleanup a week; roughly 6 to 11 weeks. The source suggests pipelining later modules and estimates six months to a year for five or six modules. These are contextual estimates, not measured universal baselines. [milan-jovanovic, strangler-fig-modular-monolith-migration]

**Mistakes:** migrating several modules at once; skipping the parallel run; no per-request routing seam; letting old and new code read each other's tables instead of talking through events or APIs.

**Automate deployment early.** A pipeline that deploys to every environment in minutes is what makes many small, safe moves possible.

**Capture the knowledge, not only the code.** When the original developers are about to leave, the real documentation is in their heads. Write down every business rule and edge case they explain, in the repository, as you go; you'll need it after they're gone.

**Manage the people as deliberately as the code.** Product needs visible progress, developers need time to do it right, the business needs to keep running, the legacy team needs to transfer what it knows. What helped: regular meetings where each group raises concerns, tracking visible to everyone, explaining technical decisions in terms of business impact, and celebrating both technical and business milestones.

## Switching a hot path to a new implementation

When the new code answers the same question as the old (a new storage format, a new index, a rewritten lookup), prove they agree before the new one serves anyone:

1. **Offline:** build realistic fixtures and run every input through both implementations, comparing every answer. This finds the bulk of the bugs, cheaply.
2. **Shadow in production:** behind a flag, on a random sample of requests, run both, serve the old result, compare in the background (off the request path, so the user never waits for the new one), and log every mismatch with its input. Keep it on long enough to see rare inputs: weeks, not hours. Expect some mismatches to be bugs in the old implementation; each one explained raises confidence in the comparison.
3. **Switch** by flag, with the old path still deployable, then watch the same metrics.
4. **Delete what the switch made redundant.** Once the new path serves, the build steps, uploads and writes that only fed the old one are pure cost; removing them is often a second win (faster deploys) the migration paid for.

Before adding a further optimization to the new path, simulate its benefit offline. A change that makes the data much smaller but the lookup only slightly faster isn't worth another rollout; leave it for a workload that needs it.

## When a dependency's license or support changes

A library you rely on goes commercial, changes its license, or stops being maintained. Open source is paid for by someone, in time or money; plan for it as maintenance, not as a surprise.

1. **Check the current terms** yourself: which versions stay open, until when security fixes continue, the price for your size. Announcements change before they're final.
2. **Inventory the usage:** every place it's imported, which features you actually use, and how deep it goes. A thin dispatcher is an afternoon to replace; mapping code with business rules buried in custom mappers is real debt; a messaging library with sagas and request-response is a project.
3. **Choose deliberately among four options:**
   - **pay**, which funds the work and gets support;
   - **stay** on the last open version while it gets security fixes, with a date to revisit;
   - **switch** to an alternative or to the raw client underneath (the broker's own SDK);
   - **write it yourself** when what you use is small: an in-process mediator is a few interfaces (the `domain-modeling` skill's EVENTS.md, on CQRS); mapping is often clearer as plain functions.
4. **Estimate the replacement work** from the inventory before deciding, and compare it with the license cost. Building a large library yourself usually costs far more than its license.

Whatever you choose, learn what the library did for you (what a mediator is, how the broker actually delivers messages). The abstraction never excused you from understanding it, and that understanding is what makes the next migration cheap.

## Prove it

- For a hot-path switch: the offline comparison over every fixture input, the shadow mismatch log over the full sampling period with each mismatch explained, and the metric that must hold after the flag flips.
- Plan the migration of one capability: name the source of truth at each stage, how changes synchronize and how loops are prevented, and the reconciliation check that must pass before traffic switches. Account for accepted writes before a routing rollback, explain how deletions and late-visible changes reach the new store, and state migration timelines as attributed estimates. [milan-jovanovic, strangler-fig-modular-monolith-migration; https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/strangler-fig.html]
- For a dependency: list every place it's used and the features each place needs, then estimate the work to replace those features before choosing to pay, stay, switch or rebuild.
