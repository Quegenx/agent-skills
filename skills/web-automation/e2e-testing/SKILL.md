---
name: e2e-testing
description: "Writes, runs and debugs end-to-end tests for web and mobile apps: agentic test runners that mix model-driven goals with exact checks, locators and assertions that don't flake, sign-in sessions and secrets, CI, bug bashes and adversarial UI QA with sub-agents, stress-testing a component with worst-case data, measuring a running page's hover, layout and font invariants with Playwright, migrating an existing suite slice by slice, generating a project verification skill, React Native and Expo with Maestro, and Flutter with Patrol, Maestro or the e2e runner. Use when writing or fixing an end-to-end or UI test, a test is flaky, testing a change in the browser or on a device, running a bug bash, trying the worst case on a component, porting Playwright, Cypress, Selenium, Detox or Maestro tests, or setting up Maestro or Patrol."
---

# End-to-end testing

An end-to-end test drives the app the way a user does and proves the outcome on screen or in a side-effect store. Each agent goal is pinned right after by an exact check: the check lets the replay cache rerun the step and makes the test model-portable, and a sleep or fixed wait becomes an assertion on the state it waited for. An agent's finding is a claim plus evidence, to read against the screenshot before calling it a bug. Unit and integration tests are the `testing` skill.

| The job | Read |
|---|---|
| Writing a test: the workflow, goals vs exact steps, locators, actions, reads, assertions, sign-in sessions, secrets, test data | [WRITING-TESTS.md](WRITING-TESTS.md) |
| Agent steps in an agentic runner: `act`, judgments, budgets, what the model sees, the replay cache, choosing a model | [AGENT-STEPS.md](AGENT-STEPS.md) |
| Installing a runner, its config and defaults, starting the app under test, browsers and mobile targets, running, exit codes, CI | [RUNNER-SETUP.md](RUNNER-SETUP.md) |
| A red or flaky test: reading the trace, error codes, flake causes, measuring a fix, driving the live app over MCP | [DEBUGGING.md](DEBUGGING.md) |
| Exploratory testing and a bug bash: charters, personas, parallel explorers, triage, proving each bug with a failing test | [BUG-BASH.md](BUG-BASH.md) |
| Adversarial UI QA of a change with sub-agents: test plans, the assertion protocol, deterministic browser checks, accessibility, responsive, UX heuristics, reports | [ADVERSARIAL-UI-QA.md](ADVERSARIAL-UI-QA.md) |
| Stress-testing one component with worst-case data: schema-backed values, a Demo / Worst case toggle or an isolated page of every scenario, failure signatures and their fixes, truncate, wrap or clamp, the report | [WORST-CASE-DATA.md](WORST-CASE-DATA.md) |
| The worst-case value catalog: names, emails and identifiers, labels from data, numbers and money, collections, time, images, states, environment | [WORST-CASE-VALUES.md](WORST-CASE-VALUES.md) |
| Measuring a running page with Playwright and a real pointer: hover glide or per-row, tab-select shift, off-token durations and `transition: all`, control heights, variable-font faces, overflow | [UI-INVARIANT-AUDIT.md](UI-INVARIANT-AUDIT.md) |
| Porting Playwright, Cypress, Selenium, Detox or Maestro tests one proven slice at a time | [SUITE-MIGRATION.md](SUITE-MIGRATION.md) |
| Generating a `verify-<app>` skill so the next coding agent can prove its change | [VERIFICATION-SKILL.md](VERIFICATION-SKILL.md) |
| React Native and Expo with Maestro: selectors, auth pre-flight, OTP by email, iOS gotchas, CI | [MAESTRO.md](MAESTRO.md) |
| Flutter with Patrol: setup, the test suite architecture, test keys, native dialogs, common failures | [PATROL.md](PATROL.md) |
| Flutter end to end: choosing Patrol, Maestro or e2e, Semantics identifiers, MergeSemantics, Flutter Web, waits, permissions, CI | [FLUTTER.md](FLUTTER.md) |

## The rules

1. **One goal, one check.** An agent step drives one outcome and an exact assertion pins it right after. Two outcomes worth checking are two goals.
2. **Never add a sleep.** Fix the locator, the expectation or the app. Wait on state with a matcher (a longer `timeout` if needed) or poll the read (`expect.poll`) for off-screen state like a database row.
3. **Use stable handles.** Roles and accessible names, labels, test ids, routes, taken from the source. Where the app lacks an accessible name, add an `aria-label` or heading instead of falling back to CSS classes.
4. **No PASS without evidence.** Every assertion rests on the accessibility tree or a deterministic check. An agent's finding is a claim plus evidence: read it against the screenshot, and call a bug confirmed only when a repro test fails on the assertion that encodes it.
5. **Judge meaning, not phrasing.** `toContain('Pro')`, not the exact sentence a model produced.
6. **Secrets never appear in test code.** Declare accounts and secrets in config with values from the environment, and pass only opaque handles to fills and agents.
7. **Give test data a run-unique name** (`Invoice ${Date.now()}`) and clean it up in `afterEach`, so retries and replays never trip over leftovers. Explorers each get their own account.
8. **Never change app code or weaken an assertion to go green.** Propose the app change instead; never widen a timeout without a reason or drop a step.
9. **Ask before adding a test framework** to a project that lacks one, and name any framework already there. Do not commit on the user's behalf; list what you created and leave project files as you found them.

## Prove it

A new or fixed test passes repeatedly with retries off (`--repeat-each 10 --retries 0`, plus `--no-cache` for agent steps) and its trace shows each outcome pinned by a check. A bug is proven by a repro test that fails today on the assertion encoding it and passes once fixed. A ported test passes 3 of 3 on every target with at least as many assertions as the source, and a planted bug makes it fail at the checking step.
