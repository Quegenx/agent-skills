---
name: e2e-testing
description: "Designs observable end-to-end user journeys and routes implementation to the project's installed test framework. Use when planning E2E or acceptance tests, choosing the right test skill, or separating journey intent from Patrol, Maestro, tester-army/e2e or browser QA implementation."
---

# End-to-end testing

An end-to-end test drives the app the way a user does and proves the outcome on screen or in a side-effect store. This skill keeps the owner's AGENTS.md journey contract separate from framework APIs. Use the framework already in the project; installing another framework needs the user's authorization. [owner AGENTS.md, End-to-End and Acceptance Tests and Pause and confirm; tester-army/e2e, writing tests]

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Define one coherent journey, its actions and observable checks | [JOURNEY-DESIGN.md](JOURNEY-DESIGN.md) |

## Choose the implementation skill

Only the chosen framework's implementation guide is needed. The following are direct references to separately installable skills, not requirements to install all of them. [owner AGENTS.md, Prefer established dependencies; tester-army/e2e, writing tests; leancodepl/patrol, test setup; mobile-dev-inc/maestro-docs, setup]

| The job | Read |
|---|---|
| Flutter Dart tests with Patrol and native automation | [patrol skill](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/patrol/SKILL.md) |
| Maestro YAML flows for React Native, Expo or Flutter | [maestro skill](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/maestro/SKILL.md) |
| The tester-army/e2e product, its web/mobile engines, optional agent steps or migration into that runner | [tester-army-e2e skill](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/tester-army-e2e/SKILL.md) |
| Browser UI QA, component worst cases, consent or responsive checks | [browser-ui-qa skill](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/browser-ui-qa/SKILL.md) |
| Unit and integration tests | [testing skill](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/testing/SKILL.md) |

## The rules

1. **One coherent user journey per test.** Keep each action and its specific observable check separate. [owner AGENTS.md, End-to-End and Acceptance Tests]
2. **Write the user's intent and observable outcomes.** Plain-language steps should be understandable without implementation knowledge; use visible labels and business context. [owner AGENTS.md, End-to-End and Acceptance Tests]
3. **Make assertions objectively pass or fail.** Require exact wording only when wording is part of the behavior. [owner AGENTS.md, End-to-End and Acceptance Tests]
4. **Use the selected framework's contract.** Setup, selectors and execution APIs belong to the chosen framework's own guide. Do not apply another runner's CLI flags, defaults or acceptance steps to the selected tool. [leancodepl/patrol, test keys; mobile-dev-inc/maestro-docs, Flutter selectors; tester-army/e2e, writing tests]
5. **Keep secrets out of definitions and evidence.** Name the exact validation performed and its result; do not claim runs or coverage that did not happen. [owner AGENTS.md, End-to-End and Acceptance Tests]

## Prove it

The journey has a user intent, separate actions and objectively checkable outcomes. The selected framework is named, its own setup and acceptance were used only where authorized, and the report distinguishes actual results from unexecuted checks. [owner AGENTS.md, End-to-End and Acceptance Tests]
