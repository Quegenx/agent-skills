# Migrating an existing suite

A migration is never one change. Each session ports one slice, proves it, and leaves both suites green; the old runner keeps every test, and a progress file lets any later session resume. The user decides when an old test goes. The target below is the `e2e` runner. [tester-army/e2e, migrate-to-e2e/SKILL.md]

## Detect and resume

- **Find the source runner:** Playwright (`playwright.config.*`, `@playwright/test`), Cypress (`cypress.config.*`, `cypress/`), Selenium (`selenium-webdriver`, in pom, gradle or requirements), Detox (`.detoxrc*`), Maestro (YAML opening with `appId:` and `---`, `.maestro/`, `maestro test`). Per-runner guides are at `https://e2e.tester.army/docs/migrate/<runner>.md`, engines at `web.md` and `mobile.md` (also in `node_modules/e2e/docs/`). WebdriverIO and Appium have no guide; map them partially through the Selenium, Detox or Maestro guides and tell the user. With two source runners, do one at a time.
- **Resume or start:** find `MIGRATION.md`; read it and the guides; verify it against the repo (every `ported` test exists in both suites, listed files exist except `retired` ones, new source files get added as `todo`); revert any planted bug left from a defect check; run `Run new` once and fix any failing ported test first. If the harness is not done, build it.

## Inventory

Ask only what you cannot observe.

- **Count tests with the runner's own list or dry run, not grep,** which misses tests made in loops. `npx playwright test --list` prints a test once per project; count it once.
- **Count assertions per file now:** explicit ones plus steps that are checks (Maestro `tapOn` fails when the element is missing).
- **Shared code:** page objects, custom commands, subflows, fixtures, `globalSetup`.
- **How it runs:** the CI job is usually the only complete description; read it line by line.
- **Where end-to-end tests live:** at the JS project root, or for native, Java or Python projects in an `e2e/` folder with its own `package.json`.
- **Runners must not collect each other's files:** Playwright's `*.e2e.ts` can overlap, so separate them by directory and compare `npx playwright test --list` with `npx e2e list`.
- **Can the old suite run here?**
- **Ask once whether to run a defect check** and record `Defect check: on|off`.

## Harness (once)

- **Scaffold:** `npx e2e init --yes` (`--engine mobile` for devices), one target per platform or browser. Ask which model to use; a literal port needs none.
- **Port the CI orchestration, reusing the repo's scripts:** the one serving process becomes `app.command` plus `readyUrl`, with its environment passed explicitly in `command.env`. There is no `services` key.
- **Per-test reset and seed** (`runScript` with `http.post`, `cy.task('db:reset')`, an API call in `beforeEach`) become `fetch` in `beforeEach` or a fixture. Seed helpers that import app code are reused; if ESM loading fails (`__dirname is not defined`, "does not provide an export named", `ERR_UNSUPPORTED_DIR_IMPORT`), run them unchanged in a child process via the repo's `ts-node` or `tsx` from a fixture. Never edit app modules to make them load.
- **Values:** environment values become constants, secrets become credentials or secrets, and `dotenv.config()` is mirrored.
- **Smoke test:** the simplest source test, which must pass on every target. If it can't, the harness is wrong.
- **Keep the old scripts;** add `test:e2e` under a free name if it's taken. Mark the harness done with its start, run-old and run-new commands.

## Pick and port a slice

- **A slice is what this session can finish green** (one file, folder, tag or feature area, usually 1 to 5 tests); ask the user which. Otherwise suggest, in order: tests whose helpers are already ported; then often-broken tests (retries, flaky history, workaround comments), because they gain the most; capabilities marked `missing` last. Write the slice into `Next` before starting.
- **Helpers first,** as plain `.ts` (not `.e2e.ts`) under `tests/support/`: a subflow becomes a function or fixture, a page object becomes a fixture.
- **Per test:** keep the title; add a header comment (`// Ported from __e2e__/flows/login.yml`); translate literally first, one awaited call per source step; each source assertion becomes its own assertion, and a wait that fails on timeout (`waitForFunction`) becomes one more, so the count is at least the inventory's.
- **Skipped source tests** are ported in full and stay skipped with their reason.
- **Learn exact names from the live app** (MCP) or the trace page; do not build a bridge.
- **Selector edits:** matching is whole-string, and ambiguity fails where the old runner took the first match; use `{ visible: true }` for hidden copies.
- **Sleeps become assertions;** per-platform branches become `{ platforms }` or an `if` on `platform`.
- **Old-runner workarounds** (a flaky `hideKeyboard`, coordinate taps, picker retry loops): try the plain step first, and keep the workaround only if needed, with a comment.
- **A `missing` capability with no workaround** stays in the old suite (`stays`); offer `npx e2e feedback --type feature`, dry run first.
- **No app code changes.**
- **Agent steps only after the literal port passes,** for stretches the source kept patching, each pinned by a locator assertion.

## Prove the slice

- **`npx e2e run <file> --repeat-each 3`** (plus `--no-cache`) on every target: 3 of 3, or it is not done.
- **Run the source test on the same build when possible:** a failure both show is an app or environment bug (report it, don't port around it); a failure only the port shows is the port's.
- **Assertion count at least the inventory's,** and every end state checked.
- **Never weaken an assertion, widen a timeout without a reason, or drop a step to go green.** Read the trace page before changing the test.

## The defect check

Optional, recorded as `Defect check: on|off`; plant the bug only with the user's agreement.

1. Plant a small bug in an asserted end state, in a clean file, and note it under `Next`.
2. Rebuild and confirm the app shows the bug.
3. Run the old test and `npx e2e run <files> --no-cache`.
4. Revert (`git checkout -- <file>`), rebuild, and confirm `git diff -- <file>` is empty.

| Outcome | Meaning |
|---|---|
| Both fail at the checking step | record it |
| Only the old test passes | the source is weaker |
| Only the port passes | the port lost an assertion; not done |
| Neither fails | pick another bug |
| A failure before the checking step | not a catch |

Record a cell like `total +1: both fail` or `old not run`.

## Run both, and the progress file

- **Ported tests stay in the old suite;** delete one only on the user's confirmation (`retired`). Propose deleting unused helpers. Propose a CI job beside the old one only with consent. Two runners never drive one device at once: run them in sequence in the same job, or on separate devices.

```md
Source: Maestro, `__e2e__/flows/**` (guide: ..., engine: ...)
e2e: `e2e.config.ts`, tests `tests/**/*.e2e.ts`
Start dependencies: `pnpm e2e:mock-server`
Run old: `maestro test __e2e__`
Run new: `npx e2e run`
Harness: done, smoke `tests/login.e2e.ts` on ios and android
Defect check: on

| Source | e2e | Status | Assertions (source → e2e) | Passing | Defect check | Notes |
| flows/login.yml | tests/login.e2e.ts | ported | 3 → 3 | ios 3/3, android 3/3 | wrong screen: both fail | |
```

- **Sections:** Shared helpers, Gaps, Next. One row per source file (per test when statuses differ). Statuses: `todo`, `ported`, `retired`, `blocked`, `stays`. Update it as you go; an interrupted session must leave it true.

## Hand over and rules

- **Hand over:** the ported tests with pass counts per target, defect-check results, helpers, blocked and `stays` tests, gaps and the next slice; ask which ported tests may be retired; list every file changed.
- **One slice per session.**
- **Never delete or edit a source test, helper or old config without confirmation.**
- **Run every command you put in the progress file at least once,** or say it cannot run here.
- **An unclear source step keeps its intent:** note your reading and ask.
- **No secrets in tests, config or the progress file. No commits.**

## Prove it

The slice passes `--repeat-each 3` on every target; the progress file's assertion column shows the port at or above the source for every row; the defect check (when on) shows both suites failing at the checking step; `git diff` on the planted file is empty; and both `Run old` and `Run new` pass.
