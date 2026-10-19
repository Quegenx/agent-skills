---
name: lint-rule-authoring
description: "Builds and evaluates lint rules and detectors: a source-grounded contract, adversarial fixtures, real-code labels, reproducible fuzzing, false-positive and false-negative audits, and base/head comparisons with pinned inputs, coverage checks and baseline provenance. Use when creating or fixing a lint rule or detector, investigating false positives or missed cases, auditing a checker's benchmark results, or comparing changed checker output."
---

# Lint rule authoring

Research, implement and evaluate a detector against its stated contract. Sources: React Doctor's rule-research, rule-writing, rule-validate, rde-eval, fuzz, benchmark-fp-fn-audit and run-parity skills. The contract, fixtures and labels are in LINT-RULES.md; paired comparison evidence is in BASE-HEAD-PARITY.md. Consuming a scanner's findings on an application change remains [code-review scanner triage](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/SCANNER-TRIAGE.md).

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Choose the detector-authoring, audit-only or paired-comparison branch | [SKILL.md](SKILL.md) |
| Define or repair a detector: contract, supported syntax and bindings, adversarial cases, labelled real-code hits, fuzzing and replay; audit FP/FN results without implementing fixes | [LINT-RULES.md](LINT-RULES.md) |
| Compare checker revisions on pinned inputs: paired runs, canonical diagnostic identity, coverage, exit codes, scoped fallback, cache provenance, controlled timing and the Vercel Sandbox example | [BASE-HEAD-PARITY.md](BASE-HEAD-PARITY.md) |

## The rules

1. **Write the contract before the detector.** Establish the harmful behavior, valid traps, supported analysis and explicit non-goals through the [rule contract](LINT-RULES.md#the-rule-contract). Search for an existing detector or helper first. [React Doctor, rule-research]
2. **Treat false positives as correctness bugs.** Keep uncertain cases quiet and diagnostic claims within proven behavior; use the [valid and invalid edge cases](LINT-RULES.md#edge-cases-to-write-before-the-detector) before implementation. [React Doctor, rule-research, rule-writing, rule-validate]
3. **Keep real-code and fuzz evidence reproducible.** Label [pinned real-code hits](LINT-RULES.md#labelling-hits-on-real-code), retain confirmed false positives as regressions, and [replay fuzz findings from their seeds](LINT-RULES.md#fuzzing-a-rule). [React Doctor, rde-eval, rule-validate, fuzz]
4. **Compare equivalent completed work.** Use the [paired-run contract](BASE-HEAD-PARITY.md) for changed checker output; incomplete coverage is invalid evidence, and timing verdicts require its controlled sequential comparison. [React Doctor, run-parity]
5. **Keep a benchmark audit read-only.** Use the [FP/FN audit's labels and independent second pass](LINT-RULES.md#fp-and-fn-audit-with-a-second-pass); implement a confirmed rule fix only when separately requested. [React Doctor, benchmark-fp-fn-audit]

## Prove it

The selected branch's own Prove it checks pass: the detector has a documented contract and supported fixtures; inspected hits and fuzz findings retain their labels and replay evidence; a paired comparison has complete, matching coverage or an explicit blocker; and an audit distinguishes confirmed defects, taxonomy gaps, harness artifacts and candidates without silently becoming a code change. [React Doctor, rule-research, rule-writing, rule-validate, rde-eval, fuzz, benchmark-fp-fn-audit, run-parity]
