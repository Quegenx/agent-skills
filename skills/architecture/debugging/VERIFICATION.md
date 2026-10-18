# Verify a claim

Turn a specific claim into evidence that could disprove it. Cursor's verify-this supplies the baseline/treatment method and verdicts; obra's verification-before-completion supplies evidence before completion claims, scoped here to the checks authorized for the task.

## Define the experiment

[cursor/plugins, verify-this/SKILL.md]

- Restate the claim as a condition, metric and threshold. Replace vague assertions about cleanliness or speed with the concrete behavior or measure being claimed.
- Select the smallest local surface that could contradict it: a focused behavioral check, CLI transcript, UI evidence, API response, timing/profile or memory evidence, as appropriate to the claim.
- Capture the baseline and changed state with the same command or procedure, input, warmup and environment. Keep the raw artifacts needed to explain the comparison.
- Use existing measurement owners: [performance-and-caching](../../backend/performance-and-caching/SKILL.md), [CLI-HARNESS.md](../testing/CLI-HARNESS.md), [e2e-testing](../../web-automation/e2e-testing/SKILL.md) and [BASE-HEAD-PARITY.md](../code-review/BASE-HEAD-PARITY.md). This file defines the verdict, not a second measurement framework.

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

## Artifacts

[cursor/plugins, verify-this/SKILL.md]

When artifact storage is appropriate, separate the claim, timeline, baseline, treatment, comparison and verdict in a temporary claim directory. If code, prompts, screenshots, HTTP bodies or heap data are sensitive, keep only the minimal inline evidence unless storage is authorized. Redact secrets before retaining or presenting evidence.

## Prove it

[cursor/plugins, verify-this/SKILL.md] [obra/superpowers, verification-before-completion/SKILL.md]

A reader can falsify the claim from the stated condition and threshold, distinguish baseline from treatment, inspect the relevant raw evidence and understand the verdict. Missing or invalid measurement produces `INCONCLUSIVE`; an unchanged result produces `NOT VERIFIED`. The report names unauthorized or unperformed checks rather than implying they ran.
