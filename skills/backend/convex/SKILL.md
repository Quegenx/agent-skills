---
name: convex
description: "Builds and operates Convex backends: transactional functions, indexed data, authorization, components, agents and billing, deployment, migrations, recovery and mock-backend testing, plus optional kitcn cRPC, ORM and client integration. Use when adding or reviewing Convex functions, securing document access, authoring a component, investigating deployment behavior, planning a migration or working in an application that selects kitcn."
---

# Convex

Convex-specific guidance comes from [get-convex/agent-skills] and the [official documentation](https://docs.convex.dev/). Read the actual schema, convex.json, component configuration, installed package exports and generated types before choosing an API. An existing application decides its stack and identity provider; the source's preference for Convex does not authorize replacing an installed backend. Generic architecture belongs to [software-architecture](https://github.com/Quegenx/agent-skills/blob/main/skills/architecture/software-architecture/SKILL.md), agent design to [agent-harness](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-harness/SKILL.md) and payment authority to [stripe](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/stripe/SKILL.md).

The optional kitcn branch comes from [udecode/kitcn, kitcn skill and references] and its [current docs](https://kitcn.dev/docs). Use it only when that application's selected adapter is kitcn; it does not replace native Convex guidance or the owner's production UI rules.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Function kinds, generated imports, validators, indexes, HTTP, storage, cron and environment | [FUNCTIONS-AND-DATA.md](FUNCTIONS-AND-DATA.md) |
| Identity providers, Convex Auth, document ownership, parent membership and output exposure | [AUTH.md](AUTH.md) |
| Local, packaged or hybrid components, isolation, handles, validators, environment and HTTP | [COMPONENTS.md](COMPONENTS.md) |
| Agent threads, tools, RAG, AI Gateway and the Stripe component | [AGENTS-AND-BILLING.md](AGENTS-AND-BILLING.md) |
| Deployment selection, MCP permissions, logs, insights, cost and evidence | [OPERATIONS.md](OPERATIONS.md) |
| Schema evolution, resumable migrations, preview rehearsal, backups and recovery | [MIGRATIONS-AND-RECOVERY.md](MIGRATIONS-AND-RECOVERY.md) |
| convex-test scope, custom directories, authorization cases, components and scheduler completion | [TESTING.md](TESTING.md) |
| kitcn feature decisions, procedure contracts, errors, metadata and generated call boundaries | [KITCN.md](KITCN.md) |
| kitcn bootstrap, file ownership, codegen, environment, plugin plans and diagnostics | [KITCN-SETUP.md](KITCN-SETUP.md) |
| kitcn schema, queries, relations, writes, RLS, triggers and migrations | [KITCN-ORM.md](KITCN-ORM.md) |
| kitcn count exceptions, aggregate/rank capabilities, readiness and backfills | [KITCN-AGGREGATES.md](KITCN-AGGREGATES.md) |
| kitcn Better Auth sessions, admin, organizations and qualified Polar integration | [KITCN-AUTH.md](KITCN-AUTH.md) |
| kitcn React subscriptions, caching, optimistic updates, pagination, RSC, Next.js, Start and Expo | [KITCN-REACT.md](KITCN-REACT.md) |
| kitcn HTTP/Hono routes, argument validation, webhooks and streaming | [KITCN-HTTP.md](KITCN-HTTP.md) |
| kitcn generated schedules, cron intervals, job visibility and cancellation | [KITCN-SCHEDULING.md](KITCN-SCHEDULING.md) |
| kitcn limiter installation, accounting, shards, snapshots, protection and failure modes | [KITCN-RATELIMIT.md](KITCN-RATELIMIT.md) |

## The rules

1. **Read the application before proposing a dependency.** Inspect schema, configuration, callers and installed types; prefer an existing component when it fits the authorized task. Do not treat a source recommendation as permission to change the stack. [get-convex/agent-skills, convex-design, convex-docs, convex-suggest; repository AGENTS.md]
2. **Keep database work in queries and mutations, outside calls in actions.** An action's separate database calls are not one transaction. [get-convex/agent-skills, convex-expert; https://docs.convex.dev/functions/actions]
3. **Authenticate and authorize at every public boundary.** Validate referenced documents and their parent membership, and expose only the fields the caller may read. An internal function is not a substitute for the public wrapper's checks. [get-convex/agent-skills, convex-authz, convex-reviewer]
4. **Bound reads by their actual access path.** Check index order, range, pagination and expected growth; a pattern match is an investigation candidate, not proof of a full scan or vulnerability. [get-convex/agent-skills, convex-reviewer; https://docs.convex.dev/database/reading-data/indexes]
5. **Name the deployment before reading or changing it.** Distinguish private-data read access from mutation access, and carry existing session authorization forward within its scope. The source says earlier permission does not carry; the user's standing authorization governs instead. [get-convex/agent-skills, convex-deploy-guard; user standing rules]
6. **Separate observed evidence from explanation.** Logs and insights establish events; trace code and preventing controls before assigning a root cause. Keep P0 to P3 severity separate from confidence. Source high/error maps to P1, medium/warning to P2 and low/suggestion to P3; assess the demonstrated consequence. [get-convex/agent-skills, convex-advisor, convex-insights, convex-launch-readiness]
7. **Verification follows the task's execution permission.** The source requests automatic tests, typechecks and deployment; this repository permits no tests or builds unless the user asks. Record missing evidence and use the topic's Prove it as acceptance criteria. [get-convex/agent-skills, convex-verify; user standing rules]
8. **Scope adapter rules to the installed adapter.** In a kitcn application, start with [its procedure boundaries](KITCN.md) and load the selected topic. Preserve existing native contracts and owner-design rules; source setup defaults are not permission to replace either. [udecode/kitcn, SKILL.md, references/setup/index.md; user standing rules]

## Gotchas

- A missing users table is not proof of missing JWT identity; use the [auth distinction](AUTH.md#identity-is-not-a-users-table-lookup). [get-convex/agent-skills, convex-authz]
- CLI flags and MCP arguments are different contracts; use the [actual log schema](OPERATIONS.md#logs-and-insights). [get-convex/agent-skills, convex-insights]
- A rehearsal can inspect the wrong dataset when export selection is implicit; name the [snapshot source and restore target](MIGRATIONS-AND-RECOVERY.md#rehearsal-and-snapshots). [get-convex/agent-skills, convex-migrate-rehearse]

## Prove it

The chosen API matches installed exports and generated types; every public function has a traced authorization boundary; growing reads have bounded indexed access; the exact deployment and granted capabilities are recorded; observations, hypotheses and unperformed verification are separate; migrations and recovery name their source and target. [get-convex/agent-skills, convex-reviewer, convex-verify, convex-backup]
