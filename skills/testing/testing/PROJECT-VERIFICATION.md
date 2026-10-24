# Project verification skills and feature maps

Use this to generate or maintain a project-specific way to launch, check, drive and clean up the real application. Sources: [new/skills, create-verification-skill/SKILL.md, its references/feature-map-example files and maintain-verification-skill/SKILL.md], [tester-army/e2e, verification-skill]. This is the shared contract; the selected runner owns its commands and supported surfaces. Execution and prerequisite changes remain subject to the user's authorization. [owner AGENTS.md, Pause and confirm and Goal-Driven Execution]

## Discover the actual project

[new/skills, create-verification-skill/SKILL.md]

- Read an existing verification skill before replacing its instructions. Derive the primary user surface from the repository, and note other surfaces: web or mobile UI, CLI/TUI, desktop application, service or library.
- Read documented startup commands, ports, environment, migrations, seed data and auth. Inspect the existing harness before selecting another. [Interactive terminal verification](CLI-HARNESS.md) owns CLI driving; the [E2E router](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/e2e-testing/SKILL.md) owns the selected UI framework.
- Identify screenshots, transcripts, responses, logs and side-effect stores that can establish the requested behavior. Determine whether instances can run independently by port, data directory or profile. If they cannot, state that constraint and avoid concurrent drives of shared state.
- If the checkout cannot start, report the exact prerequisite or fix it only within the authorized task. The source permits clearly marked verification scaffolding for an irrelevant missing startup asset, removed during cleanup; it does not authorize an unrelated product fix, installation or build.

## Write the project skill

[new/skills, create-verification-skill/SKILL.md]

Write a project-local skill with `name` and `description` frontmatter naming the actual app, surface and use conditions. Use the project's skill destination convention and real commands, selectors and nouns. The following sections describe what the next agent must know:

| Section | Required project evidence |
|---|---|
| Launch | Actual startup and readiness checks, ports, environment, migrations, seed data and teardown. An answering process is insufficient if the app is not usable. For a short-lived CLI, document prerequisites once and an isolated session per drive. |
| Doctor | A read-only check of the right instance/version/build, owned port and valid auth. Use it whenever the instance does something surprising. |
| Drive | The installed harness with stable handles from the app, such as accessible labels, data attributes, route paths or prompt strings. |
| Evidence | Named artifact locations and how the selected harness captures the action, result and required persisted or external effects. |
| Cleanup | Stop only instances/processes the drive started; remove owned scratch state and retain the named evidence. |
| Helpers | Every shipped helper has a documented invocation and can be executed as documented. |

## Define observable proof

[new/skills, create-verification-skill/SKILL.md], [tester-army/e2e, verification-skill]

- Drive the actual user or client entrance, not an internal setter or a test-only endpoint. Capture the action and resulting state, and check the outcome at the relevant steps. Reuse the [public-boundary and independent-evidence rules](INTEGRATION.md#independent-evidence).
- Inspect the stores the behavior changes alongside the visible result. Mock only where a production boundary already isolates the external system. For a dry run or test mode, observe which files, network operations and other effects it actually skips rather than trusting its name.
- Keep secrets out of definitions and artifacts. Select the runner's documented credential/session method rather than inventing a bypass. [owner AGENTS.md, End-to-End and Acceptance Tests; tester-army/e2e, verification-skill]
- Preserve evidence through every teardown. Clean failed-iteration residue too; a failed attempt must not strand ports or processes.

## Seed and prove the feature map

[new/skills, create-verification-skill/SKILL.md and references/feature-map-example files]

- Create `features/README.md` plus a file per identified user-facing feature, starting with the top three to five. Each entry identifies the feature, how the user reaches it, how the chosen harness drives it and the observable outcome that proves it.
- The generic source uses four H2s: `Sub-features`, `How to get to it (user POV)`, `Driving it with <harness>` and `Gotchas`. Resolve the actual harness name when authoring. A selected runner may add its own proof or exploration fields; [tester-army/e2e's template](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/tester-army-e2e/VERIFICATION-SKILL.md#runner-feature-map-fields) defines those additions for that runner.
- Missing seed prerequisites produce a reported journey failure and a concrete Gotcha. Do not weaken a journey to make it pass. One convenient entrance does not cover other entrances listed in the map.
- Prove generation by following launch, Doctor, one mapped feature, evidence capture and cleanup once, then confirm the artifacts still exist. This proves the recipe for that feature, not every mapped feature. Unexecuted instructions remain a draft.
- If proof used a stand-in environment, list setup steps supplied by the stand-in that the real target will not receive. Those steps remain unverified until the real target is exercised.
- Hand over the project skill, feature statuses, actual proof results and artifact paths. Update the affected map entry when a route or label changes. Offer maintenance; suggest a cadence only if asked.

## Maintain source and live coverage

[new/skills, maintain-verification-skill/SKILL.md]

1. Locate the selected verification skill. If absent, report that generation is needed; if the target remains ambiguous, resolve it before driving. Reconcile the feature index with its files, including missing, duplicate and dead entries.
2. Use read-only parallel source readers per feature when available. Each returns the feature summary, source entrances, cited likely drift or none, and one live recipe. Readers do not drive the app or edit files. Reconcile every returned feature, merge recipes into as few app states as practical and check recent user-facing additions against concrete code paths.
3. The coordinator owns live driving. Use one serial long-lived instance for servers/UIs or a fresh isolated session per short-lived CLI, according to the project skill. Maintenance exercises every feature; generation's one-feature proof is insufficient for this pass.
4. Run Doctor before the first drive, on each fresh session and after a failed or surprising drive. If the process is healthy but UI state is wedged, reset or relaunch. A confirmed Doctor instruction drift may be corrected within the verification scope and retried once, restarting only what that correction invalidates.
5. After every cleanup, confirm existing evidence survives. Clean failed residue when it stops being useful; on a shared instance, clean the residue rather than stopping the shared instance. Re-drive a corrected harness before completing final teardown.
6. A feature is `verified-unreachable` only with its attempted route and concrete missing auth, entitlement, OS or external-state prerequisite. This is not a successful feature drive. An omitted prerequisite is map drift.
7. Correct wrong descriptions as documentation drift and undrivable working behavior as a harness gap. Report an actual application regression instead of editing the product or concealing it in the map. Keep edits inside the verification skill and its owned helpers; use concise scratch notes for coverage and blockers.

Report `clean` only after source and live coverage of every feature with nothing to change, `changed` for proven verification corrections, or `blocked` with the exact unfinished coverage or prerequisite. Keep the app's outcomes separate from changes to its verification instructions. [new/skills, maintain-verification-skill/SKILL.md]

## Prove it

The skill uses actual project commands and observables, the selected harness supports its target, only authorized checks ran, and evidence survives cleanup. Generation identifies its one proven feature and unverified surfaces; maintenance names every covered or concretely unreachable feature, re-drives harness changes and distinguishes documentation drift, harness gaps and product regressions. No runtime result is implied by a source-only pass. [new/skills, create-verification-skill/SKILL.md and maintain-verification-skill/SKILL.md]
