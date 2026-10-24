# Test-first behavior slices

Use this when test-first development is requested or already authorized for a feature or fix. Sources: [mattpocock/skills, tdd, SKILL.md, tests.md and mocking.md], [obra/superpowers, test-driven-development, SKILL.md and writing-good-tests.md]. These practices describe a testing workflow; they do not grant permission to run tests or add infrastructure when the user has restricted verification.

## Choose the observable boundary

[mattpocock/skills, tdd, SKILL.md and tests.md]

- Read the relevant domain glossary and architectural decisions before naming scenarios. Identify the public boundary through which the behavior is exercised and what that boundary can and cannot prove.
- Matt's workflow requires the user to confirm every test boundary before writing. Keep already authorized boundaries from the task and repository; ask when choosing a different boundary materially changes scope or the contract. Existing [testing rules](SKILL.md) remain the default for an authorized test change.
- Derive expected values independently from the contract, a worked example or a known-good literal. An assertion that repeats the implementation's calculation cannot distinguish a shared mistake.
- Write a scenario name that states capability or outcome. Keep the setup small and the act explicit. Use the existing [boundary and failure-mode catalog](CATALOG.md) instead of copying its techniques here.

## One vertical slice at a time

[mattpocock/skills, tdd, SKILL.md], [obra/superpowers, test-driven-development, SKILL.md]

1. Select one behavior at one boundary and write its failing check. Run it only within the task's authorized verification.
2. Confirm that it fails for the missing behavior, with the intended failure rather than a syntax, setup or unrelated dependency error. If it already passes, establish why before treating it as evidence of a fix.
3. Add the smallest implementation that satisfies that behavior. Do not anticipate future tests or fill the change with speculative options.
4. Check the relevant existing behavior as authorized, then let the next slice respond to what this cycle revealed. Writing all tests first and all implementation later commits to assumptions before seeing whether the boundary is useful.

## When a failing test is impractical

[new/skills, tdd/SKILL.md] also permits TDD for an obvious cheap local bug check. Keep the existing authorization requirement: an easy test does not authorize execution when the task restricts it. If a new test would require broad infrastructure, brittle mocks or unrelated fixture churn, use the closest useful authorized reproduction instead. Do not create a harness merely to satisfy the workflow. State why a failing-before check could not be demonstrated and name the actual alternative evidence.

## Keep the existing exceptions

[mattpocock/skills, tdd, tests.md] treats database side-channel assertions and collaborator call counts/order as implementation coupling. This repository keeps two scoped exceptions: [fresh persisted-state readback](INTEGRATION.md#integration-tests-against-real-infrastructure) proves the actual write, and [recording commands or counting callback invocations](SKILL.md#fakes-for-code-that-orchestrates) distinguishes outcomes where calling is itself the behavior. Keep those checks when the contract requires them, rather than applying a blanket ban.

[mattpocock/skills, tdd, mocking.md] prefers real test databases while allowing some database substitutes. The real-engine integration policy remains in [INTEGRATION.md](INTEGRATION.md). A substitute's limitations must be established for that engine; do not infer that every in-memory implementation lacks SQL constraints.

[obra/superpowers, test-driven-development, writing-good-tests.md] warns against assertions about mock mechanics. It also permits call arguments, counts and ordering when those are the observable contract. Use the scoped recording-fake rule above and avoid mocks that merely reproduce the code's internal structure.

## Refactoring and evidence

[mattpocock/skills, tdd, SKILL.md] puts refactoring outside the red-to-green loop and into review. [obra/superpowers, test-driven-development, SKILL.md] uses red, green, then refactor. The existing [refactoring policy](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/refactoring/SKILL.md) keeps behavior pinned and changes structure in small verified steps; neither source changes that requirement or authorizes unrelated cleanup.

- Prefer real behavior through the chosen boundary; mock external boundaries only as described by the existing [integration policy](INTEGRATION.md). A test dominated by mock wiring can indicate that the boundary is wrong. [mattpocock/skills, tdd, mocking.md], [obra/superpowers, test-driven-development, writing-good-tests.md]
- Keep test-only behavior out of production objects and avoid fake setups that hide required effects. Read the real dependency path before stubbing it. [obra/superpowers, test-driven-development, writing-good-tests.md]
- [obra/superpowers, test-driven-development, SKILL.md] asks for a test for every new function, while its `writing-good-tests.md` exempts trivial constructors, getters and forwarding unless they enforce behavior. Keep the existing behavior-based scope: exercise the first observable contract instead of adding tests just to satisfy a per-function quota.
- Report what failed before the fix, what passed after it, and what was not run. A test written after implementation may still be useful, but it does not supply an observed red-before-green history. [obra/superpowers, test-driven-development, SKILL.md]

## Prove it

[mattpocock/skills, tdd, SKILL.md and tests.md], [obra/superpowers, test-driven-development, SKILL.md]

Each authorized slice has one observable behavior, an independent expected result and evidence that the intended missing behavior caused the failure; implementation is limited to that slice; persisted writes and callback behavior retain their required checks; and the report distinguishes actual red/green results from unrun verification.
