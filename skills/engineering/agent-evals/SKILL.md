---
name: agent-evals
description: "Builds eval suites that run the real agent with outside services faked, code checks first and calibrated judges second, the fix loop to a clean run, and release gates. Use when testing an LLM agent, raising its pass rate or gating a release."
---

# Agent evals

An agent is probabilistic, so a test is a sample: every case runs several times, and a fix counts only when it holds across the repetitions. The suite runs the **real** agent (the production prompt, tools and model) with every outside service replaced by fixtures, grades exact facts in code and meaning with a judge, and keeps records good enough to read a failed run turn by turn.

| The job | Read |
|---|---|
| The harness: what a case grades, the case set and its splits, simulated users, fixtures and the network guard, fake time, run records and statuses, fingerprints, repetitions, intervals, comparisons, snapshots | [HARNESS.md](HARNESS.md) |
| Grading: code checks, one grader shape, judge prompts, decision-tree rubrics, turn and conversation judges, strict and mean rules, judge self-tests, calibrating new and reworded judges | [JUDGES.md](JUDGES.md) |
| Auditing an eval, release gates and the baseline, gates that lie, production sampling and alerts | [GATES.md](GATES.md) |
| Finding unnamed failures in real traffic, then taking it to a clean run: the loop, its frame and rounds, triage, fix patterns, mistakes to avoid, safety | [FIX-LOOP.md](FIX-LOOP.md) |
| What to fix in the agent once a failure is understood | the `agent-harness` skill |
| Judges and classifiers built on typed probabilities | the `jev-decisions` skill |

## The rules

1. **Run the real thing.** The production prompt, the real tools and the real model; only the outside world (messaging, payments, maps, email) is faked, through the same clients the app uses, with no eval-only branch in the app.
2. **Nothing reaches the world.** A network guard fails every call that isn't fixtured, and the case fails as a harness error, never graded as the agent's mistake.
3. **Three repetitions at least, five for flaky cases.** One pass proves little; a case at 2 of 3 has a real, occasional problem.
4. **Code checks first, judges second.** Tools called and not called, what was stored, required data in the reply, things it must never contain: exact, in code. Tone, an unanswered question, a detail asked twice: a judge.
5. **A low-confidence judge fail is a hint, not a verdict.** Read the conversation before fixing anything.
6. **One code version, one run.** Fingerprint each run (commit, uncommitted changes, case set, repetitions) and refuse to mix results from changed code.
7. **Never buy the number.** Don't delete a check, lower a threshold or reword a judge without calibration to get a pass.
8. **Cases come from real conversations,** and every real failure after launch becomes a case. Written cases only fill gaps, and are marked.

## What "100%" means

Every check passed on every repetition of every case. It means the agent handles this sample well, not that it can never fail: a mistake that happens once in a hundred can pass three repetitions, and some judge calls are near coin flips. Expect the curve to flatten (big gains early, then rounds that trade one failure for another), and keep reading real conversations after launch.

## Prove it

A full run whose summary shows the pass rate with its 95% interval, compared with the previous run case by case; every case that fell from all-pass has a fix or a written reason; the network guard's log shows no unfixtured calls; the judge self-tests pass; at least one test drives the real entry path without a key.
