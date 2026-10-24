# Project verification with tester-army/e2e

Use the shared [project verification contract](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/testing/PROJECT-VERIFICATION.md) for discovery, generation, observable proof, cleanup and maintenance. This file adds only tester-army/e2e's engine limits, commands, sessions and feature-map fields. [tester-army/e2e, verification-skill], [new/skills, create-verification-skill/SKILL.md and maintain-verification-skill/SKILL.md]

## Supported target and runner setup

[tester-army/e2e, verification-skill]

- A web app uses `@e2e-dev/web`; iOS or Android uses `@e2e-dev/mobile`. An API without UI still uses a `web()` target with `app.url`, `app.command` and tests taking only `app` and `fetch`.
- Native desktop, CLI, library, batch jobs and desktop frontends that show only a native-runtime notice have no engine in this runner. Name the unsupported entrance and stop before generating a runner-specific skill. Another installed harness can use the shared contract; this runner limit does not describe that harness.
- Record the config, glob, runner skill and MCP registration. Existing Playwright or Cypress tests supply locators, seeds and sign-in evidence. Prefer a production build when authorized; first-visit route compilation can look like breakage.
- Use port zero or `reuseExisting` as the selected setup allows. Name the generated verification skill after the lowercase, unscoped package or repository name.

## Runner sections in the generated skill

[tester-army/e2e, verification-skill]

| Section | Runner-specific content |
|---|---|
| Read first | This runner's skill, actual config and test glob. |
| Doctor | `npx e2e list`, which checks config without startup, then a model-free smoke test opening the app and asserting one landmark. A signed-in Doctor consumes a named session; a setup file by itself selects no test and exits `NO_TESTS`. |
| Drive | Live MCP lane versus scripted lane, credentials and sessions. |
| Evidence | `.e2e/report.json`, trace pages, `--trace on`, `--video` and `app.screenshot`. The next run, including Doctor, clears `.e2e/results/`; use `--output .e2e/proof/<name>` or copy artifacts out for durable evidence. |
| Bug bash | Selected bug-bash config and charters from [BUG-BASH.md](BUG-BASH.md). |

Two sign-in methods have different capture behavior: a fill-based session withholds screenshots after password entry, while a cookie-based session retains them. Record the selected documented session method when screenshots matter. `.e2e/bugbash/` and `.e2e/proof/` are gitignored. Keep secrets out of the skill and evidence. [tester-army/e2e, verification-skill]

## Runner feature-map fields

[tester-army/e2e, verification-skill]

- The feature index includes the feature, route, test file and `tested` or `untested` status.
- Each feature file has `Sub-features`, `How to get to it (user POV)`, `Driving it with e2e`, `Proof`, `Charters` and `Gotchas` H2s. Driving names the test file, locators checked with `locate` and live MCP steps; Proof names the on-screen outcome and side-effect store.
- Charters contain one or two `slug|target|agent|charter` lines. A signed-in charter names `--session` and runs alone.
- Record observed gotchas: fresh contexts for tests and sessions, typeahead needing key events rather than a plain fill, and why an existing dev admin account is not itself a finding. Do not infer these conditions for a project that was not inspected.

## Runner proof and handoff

[tester-army/e2e, verification-skill]

1. Follow the shared generation pass with this runner's two Doctor commands and one mapped feature's test, within authorized execution.
2. For the selected exploratory lane, run `npx e2e explore '<charter>' --config <bug-bash config> --agent <persona> --max-steps 3 --output .e2e/bugbash/<slug>` with the actual project values. Read `run.explore`: aborted output or generic survey steps leave the charter unproven. Exit one can mean no step ran, so inspect the steps. Without a model, skip this lane and disclose it.
3. Record video and step assertions for the driven journey. Hand over feature statuses, charter results and durable evidence paths using the shared cleanup contract.

The runner source's authoring workflow says no commits; explicit authorization to retain tests and finish the agreed commit flow takes precedence. It does not authorize product behavior changes during verification authoring. [tester-army/e2e, verification-skill; owner authorization rule]

## Prove it

Report the actual Doctor and feature-test results, and the selected charter's observed steps or why it was skipped. Apply the shared evidence-survival and cleanup checks. Do not claim unsupported surfaces, an unexplored charter or unexecuted instructions were verified. [tester-army/e2e, verification-skill], [new/skills, create-verification-skill/SKILL.md]
