# Lint rules and detectors: contract, cases, real code, fuzzing and FP/FN audits

A lint rule is code whose bugs are false positives and missed cases, so it needs its own test design: a written contract before the code, adversarial fixtures on both sides of it, hits on real code read and labelled, a before-and-after run over a fixed corpus, fuzzing, and an audit of false positives and false negatives with a second pass. Source: React Doctor's rule pipeline skills, tagged by skill: [React Doctor, rule-research], [React Doctor, rule-writing], [React Doctor, rule-validate], [React Doctor, rde-eval], [React Doctor, fuzz] and [React Doctor, benchmark-fp-fn-audit]. Their commands, paths and corpus names are left out. Running the checker on a pull request's base and head and diffing its output is [BASE-HEAD-PARITY.md](BASE-HEAD-PARITY.md); triaging a scanner's findings on a change is [code-review SCANNER-TRIAGE.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/SCANNER-TRIAGE.md).

## The rule contract

Source: [React Doctor, rule-research]. Write it before any code, so the implementation does not guess.

1. Define the rule in one sentence: "This rule catches <pattern> that causes <problem>." Then explain the runtime reason.
2. "Resolve only questions that affect correctness":
   - "Which code pattern should report?"
   - "Which runtime behavior makes it harmful?"
   - "Which similar code must stay quiet?"
   - "Does detection need syntax, scope, or path analysis?"
   - "Which imported, dynamic, type-driven, or interprocedural cases stay out of scope?"
3. "Gather official documentation, implementation notes, related linter behavior, and open-source examples." "Separate strong positives, adjacent patterns, valid traps, and unsupported cases." Run a bounded open-source sample (below) "when a bounded open-source sample could change the contract".
4. "Choose syntax-only, scope-aware, or path-aware detection."
5. Search for an existing detector or helper before proposing a new one.

```md
Rule definition:
<pattern and specific problem>

Runtime reason:
<short explanation>

Detector precision:
<syntax-only, scope-aware, or path-aware>

Evidence:

- <source and implication>

Strong positives:

- <reportable examples>

False-positive traps:

- <valid examples>

In scope:

- <supported cases>

Out of scope:

- <explicit boundaries>

Test seeds:

- <invalid and valid fixtures>

Open questions:

- <correctness blockers only>
```

"Treat false positives as correctness bugs. Keep the diagnostic narrower than or equal to the proven behavior. Split adjacent ideas into separate rules."

## Edge cases to write before the detector

Source: [React Doctor, rule-writing], [React Doctor, rule-validate]. "State the diagnostic condition, required syntax and bindings, unsupported cases, and adversarial tests." Then write detector pseudocode, add adversarial valid and invalid tests, and implement "only the contract's supported behavior". This is rule 3 of [testing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/testing/SKILL.md), partitioning the contract, applied to a detector. Account for:

- "import aliases and shadowed bindings"
- "nested functions that do not execute immediately"
- "transparent JavaScript and TypeScript wrappers"
- "dynamic computed properties"
- "imported or unresolved values"
- "framework escape hatches"
- "control-flow paths required by the diagnostic claim"
- "regressions found by reviews or evals"

Review the implementation for the same list, plus: "false positives and missed claimed behavior", "impossible control-flow path merges", "nested functions treated as immediate execution", "dynamic properties treated as static names", "messages that overstate detection", "missing valid and invalid tests".

- "Keep uncertain cases quiet. Match the message to the condition the detector proves."
- "Fix each implementation bug with a focused regression test."
- Report "changed rules, tests, registration, reused or added utilities, reported behavior, intentional non-goals, and validation results."

## Labelling hits on real code

Source: [React Doctor, rde-eval], [React Doctor, rule-validate].

- **A bounded sample first** (their first run takes 100 repositories). "Increase `--take` only after tests and the first sample pass." Run it against the uncommitted change.
- "Inspect all hits when counts are low and a representative sample when counts are high." For each:
  1. "Open the pinned repository at the reported location."
  2. "Compare the code with the rule contract."
  3. "Classify the hit as true positive, false positive, or unsupported."
  4. "Add a rule regression test for each false positive."
  5. "Add confirmed false positives to the `fuzz` regression corpus."
  6. "Rebuild and rerun the same sample."
- "Record repository count separately from project-root count. Do not treat error records as clean scans."
- Report "checkout revisions, target rule, repositories, project roots, diagnostics, inspected hits, fixed false positives, and the artifact path. State any setup error or skipped repository."

## Before and after on fixed repositories

Source: [React Doctor, rule-validate]. Run base and head over a fixed corpus "for every new rule or detector behavior change". "Skip it for documentation-only or test-only changes. If parity cannot run, report the exact blocker."

- "Do not claim parity unless both ... runs complete. Compare repository and project-root counts separately. Inspect target-rule deltas before classifying them."
- The method (pinned SHAs, coverage before diagnostics, exit codes, scoped runs) is [BASE-HEAD-PARITY.md](BASE-HEAD-PARITY.md).
- Review findings: "Defer unsupported control flow only when it falls outside the contract. Reject requests that broaden the message or increase false positives."
- A rule change is a patch release: "Use a patch changeset for rules, bug fixes, false-positive fixes, and diagnostic refinements unless release impact requires more."

The pull request copy:

```md
## Why

<specific runtime problem>

## What changed

- <detector behavior>
- <valid patterns preserved>
- <tests added>

## Eval results

| Check             | Result                |
| ----------------- | --------------------- |
| Projects compared | `<count>`             |
| Skipped projects  | `<count>`             |
| Added / removed   | `<added> / <removed>` |
| Target rule delta | `<added> / <removed>` |
| False positives   | `<count>`             |
| Artifacts         | `<paths>`             |

## Test plan

- `<command and result>`
```

"Omit the eval table when parity did not run. State the reason instead."

## Fuzzing a rule

Source: [React Doctor, fuzz]. Fuzz after focused tests pass. This extends the random-input fuzzer in rule 16 of [testing SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/testing/SKILL.md).

- "Confirm that the target rule fires. A silent rule only exercises early exits." If it stays silent, add a triggering shape to the generator and rerun.
- Every finding replays from its seed, one iteration with that fixed seed.
- What to do per finding:
  - "**Crash**: minimize the program, add a no-throw regression test, fix the rule, and replay the seed"
  - "**Slow case**: profile the pathological shape, bound the walk, and keep the existing threshold"
  - "**Verdict drop**: fix detection that depends on incidental syntax, then add the rule to the robustness gate when appropriate"
  - "**Invariant violation**: decide whether the rule should react to the rewrite; fix and test unexpected changes" (the invariants are rewrites that keep the program's meaning)
  - "**False positive**: add the valid program to the rule tests and fuzz regression corpus"
- **Keep every confirmed false positive:** a minimal fixture named `<rule-id>--<slug>`, with "the rule ID, weakness class, and source in the fixture header", a focused valid case in the rule tests, and "a generator snippet when the existing pools cannot produce the weakness".
- "Use a stable weakness name such as `library-idiom`, `control-flow`, `wrapper-transparency`, `name-heuristic`, `alias-guard`, `cross-file`, `framework-gating`, `paren-shape`, `default-parameter`, `dynamic-computed`, `private-member`, or `copy-tracking`."
- Before a release of a batch of rules, sweep a pinned corpus of real checkouts (theirs: 48 repositories) plus diagnostic-dense files from a benchmark, and run a direct false-positive hunt "when a rule change affects common syntax".
- "Project-level dead-code and dependency findings belong in core tests, not the rule fuzzer."
- "Record the command, target-rule fire count, findings, replay seeds, corpus fixtures, and generator changes."

## FP and FN audit with a second pass

Source: [React Doctor, benchmark-fp-fn-audit]. A read-only audit of a checker's results across a benchmark corpus. "Never make a code change as part of this skill unless the user separately requests implementation of a confirmed rule fix."

### Labels

- "**Confirmed FP**: a diagnostic is caused by changed code, the behavior is intentional or required, and the rule contract does not apply or its recommended fix would regress behavior."
- "**Confirmed FN**: a real defect exists in the base or final code, no applicable diagnostic is emitted, and an existing documented rule should cover it."
- "**Taxonomy gap**: a real defect is present but no existing rule contract reasonably claims to cover it."
- "**Harness artifact**: the result is caused by malformed output, stale baseline data, verifier behavior, generated files, or an untouched-file diagnostic."
- "**Candidate**: plausible but missing enough evidence for confirmation."

"Do not call a target-task miss a false negative. Do not call a diagnostic a false positive merely because the model failed tests." A gate result is "not proof that the code is correct." "Every confirmed finding must cite the exact trial, file, line or code span, rule documentation, diagnostic delta, task behavior, and test result. Separate strict rule misses from out-of-taxonomy gaps."

### Method

1. **Inventory.** Record "the benchmark revision, trial count, missing artifacts, duplicate variants, malformed reports". "Do not silently skip incomplete trials." "Normalize duplicate task names and repeated patch hashes before computing task-level statistics."
2. **Recompute, never inherit.** "Do not treat prior reviews or reports as ground truth. Use them as leads and reverify every claim against the current benchmark revision." "Always recompute before relying on a prior summary."
3. **Rank by coverage.** "Rank by trial coverage before raw occurrence count." "Large files can inflate occurrence counts, so show both occurrence count and affected-trial count." Report the distributions: artifact completeness; outcome tuples (reward, test, gate); introduced-diagnostic failures; base-to-head rule-count deltas; concentration by rule, category, severity, task, repository and file; changed-file against untouched-file diagnostics; malformed or truncated reports; duplicated variants; successful against unsuccessful patches.
4. **Inspect each high-impact cluster:** "representative positives, representative negatives, the largest task concentration, and sibling trials with different outcomes."
5. **The independent second pass.** "Search every trial for additional candidates, not just the known clusters." "Verify that a diagnostic is on changed code and not a pre-existing issue, generated artifact, fixture, or untouched neighbor." "For every proposed FP, find a nearby true-positive counterexample. For every proposed FN, find a nearby case the detector catches."

### Output and fix priority

- Audit-only artifacts: a Markdown report, a JSONL with one record per finding, and a rule-distribution TSV.
- Each JSONL record: `id`, `classification` (`confirmed_fp | confirmed_fn | taxonomy_gap | harness_artifact | candidate`), `confidence` (`high | medium | low`), `rule`, `task`, `trial`, `file`, `lines`, `evidence`, `baselineDiagnostics`, `headDiagnostics`, `testStatus`, `rdStatus` (the checker's gate status), `rationale`, `recommendedAction`.
- The report: "corpus/methodology, distributions, confirmed FPs, confirmed FNs, taxonomy gaps, harness artifacts, manual-adjudication candidates, prioritized rule fixes, and limitations."
- Fix order:

```text
affected trial coverage × confidence × reproducibility
```

## Prove it

The contract exists with its strong positives, false-positive traps and out-of-scope list, and every test seed in it is a fixture; the edge-case list has a valid and an invalid test each where the contract covers it; real-code hits are labelled true positive, false positive or unsupported, with every false positive turned into a rule test and a fuzz fixture with its weakness name; the base-and-head run completed on both sides or its blocker is stated; the fuzzer confirmed the rule fires and every finding replays from its seed; and an FP/FN audit labels every finding with one of the five labels, ranks by affected-trial coverage, and shows a nearby counterexample for each proposed FP and FN.
