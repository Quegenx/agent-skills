---
name: tester-army-e2e
description: "Writes, runs and debugs tests with the tester-army/e2e TypeScript runner on web and mobile: exact steps, optional agent goals, replay cache, secrets, traces, exploratory bug bashes and migrations into this runner. Use when a project uses the tester-army/e2e packages e2e, @e2e-dev/web or @e2e-dev/mobile, or the user explicitly chooses tester-army/e2e."
---

# tester-army/e2e runner

This is the specific tester-army/e2e product, with packages `e2e`, `@e2e-dev/web` and `@e2e-dev/mobile`. The source supplies the APIs, config, agent steps, replay, migration target and verification template below. It supports both web and mobile. A test without agent steps needs no model. General journey design is a separate [e2e-testing skill](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/e2e-testing/SKILL.md); Patrol, Maestro and browser UI QA have their own skills. [tester-army/e2e, writing tests, web and mobile engines]

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Write tests, exact steps, locators, actions, assertions, fixtures, sessions and secrets | [WRITING-TESTS.md](WRITING-TESTS.md) |
| Optional agent goals, judgments, model budgets, providers and replay cache | [AGENT-STEPS.md](AGENT-STEPS.md) |
| Optional decision-model executor with separate text model, fresh completion checks and gates | [DECISION-EXECUTOR.md](DECISION-EXECUTOR.md) |
| Install/configure this runner, launch the app, select web/mobile targets, run and interpret CI/exit codes | [RUNNER-SETUP.md](RUNNER-SETUP.md) |
| Read runner traces, diagnose failures, measure flakes and use its live MCP | [DEBUGGING.md](DEBUGGING.md) |
| Use this runner's explorer and reproduce bug-bash findings | [BUG-BASH.md](BUG-BASH.md) |
| Migrate an existing suite into tester-army/e2e one proven slice at a time | [SUITE-MIGRATION.md](SUITE-MIGRATION.md) |
| Apply this runner's engines, Doctor, sessions and charters to the shared project verification contract | [VERIFICATION-SKILL.md](VERIFICATION-SKILL.md) |
| Run this runner against a Flutter app | [FLUTTER.md](FLUTTER.md) |

## The rules

1. **One agent goal, one check.** An agent step drives one outcome and an exact assertion pins it right after; the confirming check enables replay and model portability. Two outcomes worth checking are two goals. [tester-army/e2e, writing tests and replay cache]
2. **Never add a sleep.** Fix the locator, expectation or app; wait on state with a matcher or `expect.poll` for off-screen state. [tester-army/e2e, writing tests]
3. **Use stable handles from source.** Roles and accessible names, labels, test ids and routes; where the web app lacks an accessible name, use authorized accessibility instrumentation rather than CSS-class fallback. Mobile capabilities and Flutter semantics follow this runner's own contracts. [tester-army/e2e, locators and mobile engine; owner AGENTS.md]
4. **No PASS without evidence.** Ground assertions in the accessibility tree or a deterministic check. Read a finding against its screenshot; this source's confirmed-bug label needs a failing repro assertion. Action and timeout failures still require cause-based triage. [tester-army/e2e, bug-bash; migrate-to-e2e]
5. **Judge meaning, not phrasing.** `toContain('Pro')`, not the exact sentence a model produced. [tester-army/e2e, writing tests]
6. **Use this runner's declared secrets.** Config takes environment-backed values; fills and agents receive opaque handles. [tester-army/e2e, credentials and secrets]
7. **Give test data a run-unique name** (`Invoice ${Date.now()}`) and clean it up in `afterEach`, so retries and replays never trip over leftovers. Explorers each get their own account. [tester-army/e2e, writing tests and bug-bash]
8. **Never weaken an assertion to go green.** The runner's source says not to change app code during test authoring; Patrol permits shared test keys, and the existing accessibility rule permits instrumentation. Keep those tagged source conventions explicit, apply instrumentation only within the user's authorized scope, and propose unapproved behavior changes. Never widen a timeout without a reason or drop a step. [tester-army/e2e, writing tests; leancodepl/patrol, test keys; owner AGENTS.md]
9. **Honor the authorized task.** Ask before adding a test framework where one is absent. The source's diagnostic, bug-bash and migration workflows say no commits and preserve the user's project files; that source convention does not override explicit user authorization to implement and retain tests or complete an agreed commit flow. [tester-army/e2e, writing tests, bug-bash and migrate-to-e2e; owner authorization rule]

## Prove it

For a new or fixed test in this runner, repeat with retries off (`--repeat-each 10 --retries 0`, plus `--no-cache` for agent steps) and read its trace for an outcome check after every agent goal. For a migration into this runner, the slice passes 3 of 3 on every selected target with at least as many assertions as the source. A planted-bug check is optional and requires the user's agreement; when authorized, it must fail at the checking step. Report only execution actually performed. [tester-army/e2e, writing tests; migrate-to-e2e; owner AGENTS.md]
