---
name: debugging
description: "Diagnoses bugs from a reproducible contract violation, traces the shared root cause, tests falsifiable hypotheses and reports what the evidence proves. Use when debugging unexpected behavior, regressions, intermittent failures or a fix whose result needs verification."
---

# Debugging

Find where observed behavior first departs from its contract before choosing a repair. This workflow combines Matt Pocock's diagnosing-bugs, obra/superpowers' systematic-debugging, Octocode's problem framing and causal receipts, and Cursor's verify-this. Their process choices are attributed below; they are not guarantees about debugging speed or success.

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Classify the request, build a reproducer, trace the cause and choose a repair | [SKILL.md](SKILL.md) |
| Test a falsifiable claim, compare evidence and state a verdict | [VERIFICATION.md](VERIFICATION.md) |

## The rules

1. **Name the violated contract.** Record actual behavior, expected behavior, its authority, the trigger, impact, success criterion and non-goals. A test, specification, schema, documented promise, accepted criterion or established behavior can supply that authority. Keep the classification unresolved while decisive facts are missing. [bgauryy/octocode, octocode-research/references/problem-framing.md]
2. **Get a signal that can catch this bug.** Prefer a small repeatable reproducer that fails on the user's exact symptom. A command merely finishing without an error is insufficient. If a reproducer is unavailable, describe the equivalent evidence and its limit rather than claim reproduction. [mattpocock/skills, diagnosing-bugs/SKILL.md] [bgauryy/octocode, octocode-research/references/workflow-debug.md]
3. **Trace the cause through callers.** Read the complete error and stack, follow the bad value back to its origin, and inspect the relevant component boundaries. Repair the shared cause rather than add a patch to each symptomatic caller. [obra/superpowers, systematic-debugging/SKILL.md, systematic-debugging/root-cause-tracing.md]
4. **Separate competing explanations.** State a prediction for each plausible cause, then change one variable at a time. A failed probe revises the explanation; it does not justify stacking another speculative fix on the last one. [mattpocock/skills, diagnosing-bugs/SKILL.md] [obra/superpowers, systematic-debugging/SKILL.md]
5. **Make one repair and verify the original case.** A smaller reproducer helps diagnosis, but success must also cover the original scenario. Keep unrelated refactoring outside the repair. [mattpocock/skills, diagnosing-bugs/SKILL.md] [obra/superpowers, systematic-debugging/SKILL.md]
6. **Keep claims within the evidence.** State the mechanism, trigger, decisive anchors, rejected alternative and remaining uncertainty. Use [VERIFICATION.md](VERIFICATION.md) for a completion or improvement claim. [bgauryy/octocode, octocode-research/references/workflow-debug.md] [cursor/plugins, verify-this/SKILL.md]

## Classify before fixing

[bgauryy/octocode, octocode-research/references/problem-framing.md]

| What the evidence shows | Route |
|---|---|
| Supported current behavior is violated | Reproduce and diagnose the bug |
| A desired capability creates a new contract | Define acceptance in [engineering-planning](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/engineering-planning/SKILL.md) |
| The contract holds but a quality target should improve | Establish a baseline, bottleneck and target with [VERIFICATION.md](VERIFICATION.md) |
| Actual behavior, authority or desired outcome is unresolved | Identify the missing fact and cheapest decisive check, or ask a focused question |

## Build and minimize the reproducer

[mattpocock/skills, diagnosing-bugs/SKILL.md]

- Choose the smallest surface that reaches the real failure: an existing test seam, HTTP request, CLI fixture, browser journey, captured-request replay, isolated harness, property check, differential comparison or controlled human interaction. Reuse the project's available tools.
- Capture the symptom precisely: error, incorrect output or timing condition. Tighten setup cost, assertions and determinism. For intermittent failures, record the reproduction frequency and conditions rather than impose a universal percentage cutoff.
- Once it fails, remove inputs, callers, configuration and steps one at a time, checking after each removal. Stop when the remaining elements are necessary for that reproducer to fail.
- If the environment prevents reproduction, list the attempts and request the specific missing access, redacted artifact or authorization for instrumentation. Do not pass an untested explanation off as established cause.
- Redact secrets before showing commands, logs or captured artifacts. Use environment-held credentials and quote only the signal-bearing portion of sensitive output.

## Find the first divergence

[obra/superpowers, systematic-debugging/SKILL.md, systematic-debugging/root-cause-tracing.md] [bgauryy/octocode, octocode-research/references/problem-framing.md]

- Map the relevant input, transformations, state/dependency boundaries, side effects, output and consumers. Name the invariant at each boundary and find the first departure from expected behavior.
- Compare a working path with the failing one. Read the complete relevant reference implementation and list differences in data, configuration, dependencies and environment before dismissing them.
- Trace backward from the immediate failure: which caller supplied the value, what transformed it, and what originally produced it? When the stack alone cannot answer, capture targeted entry/exit evidence and configuration propagation at the boundary that distinguishes the explanations.
- Inspect recent changes as evidence for why the trigger appeared now. A recent change, correlation or nearby suspicious line alone does not establish causality.

## Probe explanations

[mattpocock/skills, diagnosing-bugs/SKILL.md] [obra/superpowers, systematic-debugging/SKILL.md]

- Matt's preparation preference is a ranked set of three to five falsifiable hypotheses; obra asks for one explicit hypothesis at a time. Keep the alternatives visible, then test one prediction at a time. The count is a source workflow preference, not a scientific minimum.
- Prefer debugger or REPL inspection when available; otherwise add focused instrumentation at the boundaries that distinguish causes. Give temporary debug output a unique searchable prefix and remove it before completion.
- For performance regressions, establish measurements first. Profiling, timings and query plans belong to [performance-and-caching](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/SKILL.md); avoid replacing measurement with a large log dump.
- If both explanations survive, name the runtime input, log or configuration fact needed to separate them. Say what remains unknown.
- When two or more fixes sharing a premise fail the same gate, write that premise down before another fix. Identify an observation that would differ if it were false and check it within the task's authorized verification; if that check cannot run, report the missing evidence rather than stack another fix on the untested premise. This targets a shared assumption, separately from obra's three-failed-fixes architecture discussion below. [new/skills/principle-attack-the-premise, SKILL.md; existing debugging, VERIFICATION.md#evidence-and-authority]

## Repair and close

[mattpocock/skills, diagnosing-bugs/SKILL.md] [obra/superpowers, systematic-debugging/SKILL.md] [bgauryy/octocode, octocode-research/references/workflow-debug.md]

- Put a regression check at a seam that exercises the actual caller pattern. When no suitable seam exists, report that architectural limitation instead of adding a shallow check that cannot catch the bug. Test design remains in [testing](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/testing/SKILL.md).
- Fix the demonstrated cause, verify the minimized and original scenarios, and remove temporary instrumentation and throwaway debugging artifacts.
- Obra uses three failed fixes as a prompt to question the architecture, especially when each attempt reveals coupling elsewhere or demands a broad refactor. Treat that as a discussion trigger, not proof that the architecture is wrong.
- Obra's defense-in-depth source asks for validation at every layer. This repository keeps the shared root fix first; use additional guards only where a distinct trust boundary or invariant requires them, as described in [secure-coding](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/secure-coding/SKILL.md).
- Report the mechanism and trigger, violated contract and first divergence, exact evidence, an alternative disconfirmed, why the failure appeared now, repair and verification limits. Environmental or external causes still need the investigation record and an explicit handling decision.

## Gotchas

[mattpocock/skills, diagnosing-bugs/SKILL.md] [obra/superpowers, systematic-debugging/SKILL.md]

- A nearby failing case may reproduce a different bug. Compare it with the user's symptom before accepting it as the reproducer.
- A passing regression check can still miss the original multi-caller sequence. Check the seam and the full sequence.
- Another speculative change after repeated failure makes causes harder to distinguish. Return to evidence and reconsider the explanation.

## Prove it

[mattpocock/skills, diagnosing-bugs/SKILL.md] [bgauryy/octocode, octocode-research/references/workflow-debug.md] [cursor/plugins, verify-this/SKILL.md]

Identify the contract authority and actual trigger; show a reproducer or explicitly limited substitute; trace the first divergence to its cause; state a falsifiable prediction and the evidence that rejected an alternative; then account for the original scenario, the regression seam, temporary instrumentation and every check still unperformed. A feature request must not acquire an invented root cause.
