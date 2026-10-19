# Generating a project verification skill

A coding agent that changes an app should prove the change the way a user would see it. A verification skill (`.agents/skills/verify-<app>/`) tells the next agent, reading it cold mid-task, exactly how to launch, check, drive and clean up this app. Verification skills have had the most measurable impact on Claude's output quality inside the Claude Code team; it can be worth an engineer spending a week making them excellent. It is generated from observation of the repo, and it is a deliverable only once it has been executed end to end. The commands use the `e2e` runner. [tester-army/e2e, verification-skill]

## Interview the repo, not the user

- **Surface:** a web app through `@e2e-dev/web`; iOS or Android through `@e2e-dev/mobile`. An API with no UI still gets a `web()` target with `app.url` and `app.command`, and tests that take only `app` and `fetch`. A native desktop app, CLI, library, batch job, or a desktop frontend that shows only a native-runtime notice has no engine: say so and stop, naming the entry point and the engine that cannot drive it, with nothing generated. Stop on the observation, not after a write.
- **Run:** the dev command, ports, environment, seed and auth. Prefer a production build; a route compiling on first visit reads as broken.
- **Runner state:** config, glob, skill, MCP registration. An existing Playwright or Cypress suite is the best source of locators, seeds and sign-in steps.
- **Observe:** trace, screenshots, video, report, and the side-effect stores (files, rows, sent messages, logs).
- **Isolate:** port 0 or `reuseExisting`. A shared instance that cannot be duplicated becomes a rule: refusing to double-drive it beats corrupting the user's session.
- **Name:** the package or repo name, lowercase, no scope.
- **The checkout must build and start first;** a skill written against a broken base teaches wrong steps. An irrelevant missing asset may be created as verification scaffolding and removed in Cleanup.
- **An existing `verify-<app>/` is read first:** keep it, add missing features, change it only where the app contradicts it.

## The generated SKILL.md

YAML frontmatter with `name: verify-<app>` and a `description` naming the app, the surface and when to reach for it; without frontmatter the skill never registers. Sections:

- **Read first:** link the runner's skill; name the config and the glob.
- **Launch:** the exact command and its readiness check, ports, environment, seeds.
- **Doctor:** `npx e2e list` (a config check that starts nothing), then a model-free smoke test that opens the app and pins one landmark. A signed-in doctor is a signed-in smoke test consuming a named session; running the setup file alone selects no test and exits `NO_TESTS`, so it is not the doctor. Run Doctor first whenever anything looks off.
- **Drive:** the live MCP lane vs the scripted lane; credentials and sessions.
- **Evidence:** `.e2e/report.json`, trace pages, `--trace on`, `--video`, `app.screenshot`. The next run clears `.e2e/results/` (Doctor's included), so durable proof runs with `--output .e2e/proof/<name>` or is copied out.
- **Bug bash:** the bug-bash config and charters (BUG-BASH.md).
- **Cleanup:** stop only what you started, by pid; never kill by process name (`pkill node`). Remove instances and scratch, never evidence.
- **Helpers:** any script, executable, with its invocation in the body; usually none.

## Proof standards

- **Exercise the real user path,** not internal setters or test-only endpoints.
- **Capture the action and the resulting state,** not only the final screen.
- **Assert state at each step in code,** not only at the end (signup, then email verify, then onboarding, each with its own check), and record a video so a reader can see exactly what was tested.
- **Verify side effects in the stores you found** (for example `localStorage` via `browser.evaluate`, a session cookie via `browser.cookies()`).
- **Mock only where a production boundary already isolates the external system.**
- **When the safe path is a dry run or test mode,** verify what it skips by watching files, network and refs rather than trusting its name.
- **Two ways to sign in** when screenshots matter: a fill-based session withholds screenshots after the password; a cookie-based one keeps them.

## The feature map

- **`features/README.md`** is an index table (feature, route, test file, `tested` or `untested`), plus one file per feature, the top 3 to 5 first.
- **Each feature file's H2s:** `Sub-features`, `How to get to it (user POV)`, `Driving it with e2e` (the test file, locators checked with `locate`, MCP live-walk steps), `Proof` (on screen plus the side-effect store), `Charters` (1 or 2 lines of `slug|target|agent|charter`; a signed-in charter names `--session` and runs alone), `Gotchas`.
- **Gotchas look like:** every test and session starts from a fresh context, so a non-empty list at start is a bug; a typeahead reacts to key events, not a plain fill; a dev admin account's existence is not a finding.
- **A proof driving one entry point is incomplete when the map lists others;** a bug bash that skips a mapped feature reports the gap.

## Prove the generated skill once

1. **Doctor:** both commands exit 0.
2. **Drive one mapped feature through its test** (write the test if it's missing).
3. **Bug-bash one charter:** `npx e2e explore '<charter>' --config <bug-bash config> --agent <persona> --max-steps 3 --output .e2e/bugbash/<slug>`. Read `run.explore`: `aborted`, or steps that are a generic survey, leave it unproven. Exit `1` can also mean no step executed, so the steps prove the charter ran, not the exit code. Without a model, skip this and say so.
4. **Cleanup, then confirm the evidence still exists.** A cleanup that eats the proof fails this step.

Run Cleanup after every failed iteration so attempts do not strand ports. A generated skill that was never executed is a draft, not a deliverable.

## Hand over and rules

- **Hand over:** the skill path, the features with their tested status, the charters, the proof results and the evidence paths. When a route or label changes and a test fails, the feature file changes in the same commit.
- **Generate from observation:** a section that could apply to any app is not finished.
- **Link rather than restate. No secrets. No commits.** `.e2e/bugbash/` and `.e2e/proof/` are gitignored.

## Prove it

Both Doctor commands exit 0, one feature's test passes, one charter's `run.explore` shows steps that walked that charter, Cleanup stopped only what was started, and the evidence under `.e2e/proof/` survives it.
