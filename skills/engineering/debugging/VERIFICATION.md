# Verify a claim

Turn a specific claim into evidence that could disprove it. Cursor's verify-this supplies the baseline/treatment method and verdicts; obra's verification-before-completion supplies evidence before completion claims, scoped here to the checks authorized for the task.

## Define the experiment

[cursor/plugins, verify-this/SKILL.md]

- Restate the claim as a condition, metric and threshold. Replace vague assertions about cleanliness or speed with the concrete behavior or measure being claimed.
- Select the smallest local surface that could contradict it: a focused behavioral check, CLI transcript, UI evidence, API response, timing/profile or memory evidence, as appropriate to the claim.
- Capture the baseline and changed state with the same command or procedure, input, warmup and environment. Keep the raw artifacts needed to explain the comparison.
- Use existing measurement owners: [performance-and-caching](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/SKILL.md), [testing CLI-HARNESS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/testing/CLI-HARNESS.md), [e2e-testing](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/e2e-testing/SKILL.md) and [lint-rule-authoring BASE-HEAD-PARITY.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/lint-rule-authoring/BASE-HEAD-PARITY.md). This file defines the verdict, not a second measurement framework.

## Verdict

[cursor/plugins, verify-this/SKILL.md]

| Verdict | Evidence required |
|---|---|
| `VERIFIED` | Valid baseline and treatment differ in the predicted direction by the claimed threshold, with no evident confound |
| `NOT VERIFIED` | Behavior is unchanged, moves the wrong way or misses the threshold |
| `INCONCLUSIVE` | Missing baseline, noise, failed measurement or differing conditions prevent a valid comparison |

Give one verdict for the specific claim, followed by the claim, artifacts or metrics, baseline, treatment, delta, threshold and a short explanation of confounds or limits. A negative result should remain negative rather than be softened into progress language.

## Evidence and authority

[obra/superpowers, verification-before-completion/SKILL.md] [cursor/plugins, verify-this/SKILL.md]

- Read complete output and exit status before claiming a command passed. A linter does not prove a build; a build does not prove the original bug is fixed; a worker's success report does not prove its work meets the specification.
- Check requirements against their actual evidence. Distinguish a check that passed, a check that failed, one that did not run and a surface it did not cover.
- Obra requires running the verification command in the same message as every success claim. The existing repository policy instead repeats a passed check when changes, failures or unresolved concerns justify it. Keep that policy: evidence must match the current state, and explicit restrictions on tests and builds govern which checks can run. [repository AGENTS.md, Goal-Driven Execution]
- Record checks that could not run and why. Do not invent a successful baseline or infer runtime behavior from a reading-only review.

## Compare the actual fix

[Milan Jovanovic, more skills/evidence-first-review/SKILL.md, references/reporting.md and quick-start.pdf]

- Choose a discriminating probe and retain a nearby passing control. When both versions can run, apply the same relevant probe to the old and changed versions. If the old version cannot run, state that limitation and use the available source evidence; do not claim an executed regression demonstration.
- Confirm the binary or deployed revision matches the source being assessed. Passing evidence applies to that code and environment, not automatically to every caller, provider, concurrent request or restart.
- Inspect stored and external effects separately from the returned response when the invariant depends on state. An uncertain response can leave an effect unresolved; use the actual service contract to say what is known.
- Name the enforcing boundary reached and what a mock, simulator, direct method call or source-only inspection cannot establish. A passing fixture can reject a claim about that path without proving every retry or real-provider behavior safe. One run does not establish customer impact frequency.
- Run only authorized checks and keep reproductions isolated. Report the narrow missing observation when a decisive check would exceed the task's permissions. Stop widening verification after required checks pass unless a new change, failure or unresolved concern justifies more work.

## Artifacts

[cursor/plugins, verify-this/SKILL.md]

When artifact storage is appropriate, separate the claim, timeline, baseline, treatment, comparison and verdict in a temporary claim directory. If code, prompts, screenshots, HTTP bodies or heap data are sensitive, keep only the minimal inline evidence unless storage is authorized. Redact secrets before retaining or presenting evidence.

## Prove it

[cursor/plugins, verify-this/SKILL.md] [obra/superpowers, verification-before-completion/SKILL.md]

A reader can falsify the claim from the stated condition and threshold, distinguish baseline from treatment, inspect the relevant raw evidence and understand the verdict. Missing or invalid measurement produces `INCONCLUSIVE`; an unchanged result produces `NOT VERIFIED`. The report names unauthorized or unperformed checks rather than implying they ran.

The fix report names the tested source/artifact, the same probe's actual old/new results when available, nearby controls and the boundary's limits. It distinguishes returned responses from resulting state and does not inflate a simulated negative result into production proof. [Milan Jovanovic, more skills/evidence-first-review]
