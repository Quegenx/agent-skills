---
name: agent-evals
description: "Builds eval suites that run the real agent with outside services faked, code checks first and calibrated judges second, the fix loop to a clean run, and release gates. Use when testing an LLM agent, raising its pass rate or gating a release."
---

# Agent evals

An agent is probabilistic, so a test is a sample: every case runs several times, and a fix counts only when it holds across the repetitions. The suite runs the **real** agent (the production prompt, tools and model) with every outside service replaced by fixtures, grades exact facts in code and meaning with a judge, and keeps records good enough to read a failed run turn by turn.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| The harness: end result, path and part checks, graph outcomes/node diagnostics, explicit trajectory comparison modes, cases and splits, simulated users, fixtures, records, fingerprints, repetitions and snapshots | [HARNESS.md](HARNESS.md) |
| Grading: code checks, mechanical checks of the claims in an agent's findings, a rubric scored in code with a 0.55 floor, one grader shape, judge prompts, decision-tree rubrics, turn and conversation judges, strict and mean rules, judge self-tests, calibrating new and reworded judges | [JUDGES.md](JUDGES.md) |
| Auditing an eval (including whether it can tell a better agent from a worse one), release gates and the baseline, gates that lie, gating an agent's findings (re-run thresholds, hard triggers, accepting a re-run), production sampling and alerts | [GATES.md](GATES.md) |
| Finding unnamed failures in real traffic, then taking it to a clean run: the loop, its frame and rounds, hillclimbing with keep or revert, triage, fix patterns, mistakes to avoid, safety | [FIX-LOOP.md](FIX-LOOP.md) |
| Audit whether agents can onboard using a product's docs, SDK or skill | [agent-dx-audit](https://github.com/Quegenx/agent-skills/blob/main/skills/agent-workflows/agent-dx-audit/SKILL.md) |
| Human-led open notes, accepted failure definitions versus accepted assignments, unresolved evidence and taxonomy lineage | [REVIEW-AND-TAXONOMY.md](REVIEW-AND-TAXONOMY.md) |
| Preserving source exports, reviewed labels and versions across managed/local tools, operation schemas and migration evidence | [MANAGED-AND-LOCAL.md](MANAGED-AND-LOCAL.md) |
| DeepEval TypeScript modes and metric boundaries, confident-trace Node instrumentation and raw OTLP contracts | [DEEPEVAL.md](DEEPEVAL.md) |
| What to fix in the agent once a failure is understood | the `agent-harness` skill |
| Judges and classifiers built on typed probabilities | the `jev-decisions` skill |

## The rules

1. **Run the real thing.** The production prompt, the real tools and the real model; only the outside world (messaging, payments, maps, email) is faked, through the same clients the app uses, with no eval-only branch in the app.
2. **Nothing reaches the world.** A network guard fails every call that isn't fixtured, and the case fails as a harness error, never graded as the agent's mistake. "Do not treat error records as clean scans" [React Doctor, rde-eval].
3. **Three repetitions at least, five for flaky cases.** One pass proves little; a case at 2 of 3 has a real, occasional problem.
4. **Code checks first, judges second.** Tools called and not called, what was stored, required data in the reply, things it must never contain: exact, in code. Tone, an unanswered question, a detail asked twice: a judge.
5. **A low-confidence judge fail is a hint, not a verdict.** Read the conversation before fixing anything.
6. **One code version, one run.** Fingerprint each run (commit, uncommitted changes, case set, repetitions) and refuse to mix results from changed code. A run over real repositories also reports "checkout revisions, target rule, repositories, project roots, diagnostics, inspected hits, fixed false positives, and the artifact path", with repository and project-root counts kept apart and "any setup error or skipped repository" stated [React Doctor, rde-eval].
7. **Never buy the number.** Don't delete a check, lower a threshold or reword a judge without calibration to get a pass.
8. **Cases come from real conversations,** and every real failure after launch becomes a case. Written cases only fill gaps, and are marked. The other view: users try what they expect to work, so a set drawn strictly from traffic may skew easy; it adds hard cases a person judged hard, each with a stated reason ([HARNESS.md](HARNESS.md)).

## What "100%" means

Every check passed on every repetition of every case. It means the agent handles this sample well, not that it can never fail: a mistake that happens once in a hundred can pass three repetitions, and some judge calls are near coin flips. Expect the curve to flatten (big gains early, then rounds that trade one failure for another), and keep reading real conversations after launch.

## Prove it

A full run whose summary shows the pass rate with its 95% interval, compared with the previous run case by case; every case that fell from all-pass has a fix or a written reason; the network guard's log shows no unfixtured calls; the judge self-tests pass; at least one test drives the real entry path without a key.
