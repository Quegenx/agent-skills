# Refining a harness from execution evidence

Use recorded executions to improve the instructions, tools and orchestration around a model. This file paraphrases [google-research/harness2, README.md, docs/EXPERIMENTS.md and harness2/core/]. It covers the refinement method, with model weights held fixed. [agent-evals FIX-LOOP.md](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-evals/FIX-LOOP.md) owns measured optimization against an eval; [coding-agent-harness SESSION-DIAGNOSIS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/agent-workflows/coding-agent-harness/SESSION-DIAGNOSIS.md) owns investigating an existing session.

## Fix the editable surface

[google-research/harness2, harness2/core/spec.py, tree.py, recursion.py and prompts.py]

- State which harness components may change, which files the runtime owns, and which task requirements remain fixed. A harness edit changes how the agent works; it must preserve the requested artifact's names, fields, ordering and output location.
- Record the current component tree and the exact editing baseline. Inherit untouched files, represent deletions explicitly and reject paths outside the editable surface. Check the materialized tree, required helper files, supported component metadata and environment invariants before probing it.
- Choose the component using [SKILL.md](SKILL.md#where-each-rule-lives). A procedure with a narrow trigger can belong in a skill; a repeated deterministic operation can justify a helper. Do not turn one isolated mistake into new infrastructure or professional judgment into a mechanical rule.
- Keep candidate harnesses, trajectories and artifacts as untrusted evidence. An editor or selector inspects candidate scripts and hooks as text; their presence in the evidence does not authorize executing them.
- Keeping the current harness unchanged is a valid proposal. An invalid proposal that falls back to the inherited harness must carry its validation error and fallback status; it is not an accepted improvement.

## Compare executions before proposing edits

[google-research/harness2, harness2/core/prompts.py, context.py and recursion.py]

- Read the actual task, current harness, available executions and what each execution produced. Inventory the whole candidate set before deep-reading the evidence relevant to a proposed edit. A successful write call does not establish that the resulting artifact is usable.
- Attach every edit to a specific trajectory moment or a source document. Record the observed divergence, the component being changed and the behavior the change is meant to affect. Do not restate guidance the harness already gives clearly.
- Separate general workflow hypotheses from domain hypotheses when proposing in parallel. General workflow work concerns tool errors, repetition, sequencing and completion; domain work concerns the requested work product, controlling sources, consistency relationships and practitioner omissions. Keep their editing responsibilities distinct until composition.
- Distinguish incorrect arguments, timeout, missing capability, permission denial and an unread result before prescribing recovery. Prefer a bounded fallback with a stop condition over repeated identical calls.
- A verified workspace fact can help the current execution, but label it as local to that workspace. Recheck mappings, thresholds and other local facts before reusing an earlier harness on a different task; an earlier task's fact is a hypothesis there.

**Conflict:** the source's aggregate prompt calls a defect seen in only one of the base executions "noise". The existing rule remains: an occasional failure can be real, and a case passing two of three runs still has a problem. Keep the observed failure and investigate it; [repetitions and intervals](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-evals/HARNESS.md#repetitions-and-intervals) own uncertainty in comparisons. [google-research/harness2, harness2/core/prompts.py, aggregate; existing agent-harness, SKILL.md, Why agents fail rule 1]

## Probe, then compose

[google-research/harness2, docs/EXPERIMENTS.md and harness2/core/recursion.py, prompts.py and tree.py]

| Mode | What the next stage receives |
|---|---|
| Parallel refinement | Candidates proposed from the same base evidence, each candidate's execution, then compositions built from the shared pool |
| Sequential refinement | The current checkpoint, its observed execution and accumulated earlier candidates, decisions and checkpoints |

- Probe candidate harnesses on the same task, preserving the baseline evidence and candidate diffs. Inspect whether the changed component actually engaged; an unloaded skill or ignored instruction does not demonstrate the proposed mechanism.
- Compose only the parts supported by the observed work. Resolve overlapping rules rather than concatenating proposals. A single candidate, a combination or the unchanged baseline can be the defensible composition.
- Record both gains and regressions, including a run that produced no deliverable. A polished proposal does not compensate for an execution that did not finish the requested work.
- In sequential refinement, "keep current" preserves the current checkpoint; restoring the original harness is a different action. Preserve earlier states so later drift can be reversed to a named checkpoint, and state which rounds' edits survive.
- Record candidate collapse as well as candidate count: identical component trees are not distinct edits merely because they have different labels. Textual diversity does not itself prove useful behavioral diversity.
- Treat a probe as evidence for this task. A selected output and an apparent trajectory contrast do not establish that the harness improved generally; use the existing [eval fix loop](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-evals/FIX-LOOP.md) before making that claim.

## Separate output selection from measurement

[google-research/harness2, harness2/core/selection.py, prompts.py, judge.py and context.py]

- Give an artifact selector the task, authorized source material and anonymous, shuffled outputs. Hide the producing harnesses and their persuasive decision notes during this selection. Judge the artifact's required coverage, source fidelity, internal consistency and practical usability, rather than its length or the elaborateness of its harness.
- State exactly which outputs are eligible. This release selects among composed finals, not the original reference outputs; at a single-final budget it delivers that final without a selector call. An unchanged harness can still be a composition, but that is a new execution, not selection of the original base output.
- Record dropped candidates, extraction failures, the selected artifact's identity and any selector fallback. A fallback after a selector error is not a successful comparative judgment.
- Keep selection and held-out grading separate. The source selects before reading benchmark scores. The broader leakage and network boundaries remain in [agent-evals HARNESS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-evals/HARNESS.md#the-cases); a prompt saying that no answer key is present does not establish that boundary.
- Describe the evidence actually served. Preserve the original artifacts and identify extracted text, name-only listings, unavailable content and renderer truncation. A comparison marker inserted by a renderer is not an omission by the executing agent, and a filename alone does not establish the file's contents.

## Retain supported lessons

[google-research/harness2, harness2/core/prompts.py, experience; selection.py, reflect_adoption and _distil; library.py]

- Diff every candidate against its editing baseline, including rejected candidates. Record the component, change, observed execution difference, run location and a verdict: helped, hurt, no observed effect or confounded.
- Keep adoption separate from attribution. A rejected candidate can contain a useful edit; an edit in the selected candidate may have contributed nothing to the selected output. Multiple simultaneous component changes or a single unisolated execution make attribution uncertain.
- Save a transferable lesson only when the execution contrast supports it: the situation cue, the operation to apply to a named component, supporting evidence and confidence. If no reusable contrast is supported, retain the edit observations without inventing a durable lesson.
- Preserve the adopted component tree with its decision record, rather than only a generated summary. Browse an index by the situation cue, then inspect relevant entries and their evidence before copying a component.
- Keep task-local facts out of durable general rules. Reused components must carry their required helpers, and their local assertions must be reverified against the new workspace.
- For an ordered learning experiment, expose only earlier entries from the same domain. Keep independent modes, budgets, executors and task streams in separate libraries; process tasks sequentially where each consumes prior experience. Independent domains can run concurrently.

## Resume the same experiment

[google-research/harness2, harness2/cli/run_sweep.py, _check_identity; harness2/core/schedule.py, _resume and run_domain; runmark.py]

- Preserve task order and the selected task set, method version, executor, improver, judge and endpoint configuration with the run. A task-order seed records ordering, not deterministic model sampling. Refuse incompatible resumes instead of silently sharing results or learned entries.
- Verify that a cached run has an explicit completion record, the expected harness fingerprint and intact adopted artifacts. An output directory's existence alone is insufficient. A fingerprint identifies bytes; it does not prove that those bytes satisfy the request.
- On resume, restore only the experience that preceded the current task in that stream. Do not let entries left by later tasks leak backward into an earlier retry.
- Use the shared [run-record and resume rules](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-evals/HARNESS.md#run-records) for terminal statuses, retries and missing measurements. Resource accounting for this method belongs in [CONTEXT-COSTS.md](CONTEXT-COSTS.md#a-bounded-comparison).

## Prove it

[google-research/harness2, harness2/core/context.py, recursion.py, selection.py, library.py, schedule.py and prompts.py]

- The editable surface and inherited baseline are recorded, candidate validation is visible, and the task's artifact contract remains intact.
- Every retained edit names its source or execution moment, what engaged, and the observed result or regression.
- Parallel proposals share a baseline; sequential proposals identify their current checkpoint and preserved history.
- Selection lists the eligible outputs and hides producing-harness identities; extraction gaps and fallback judgments remain visible.
- A durable lesson names its situation, component operation and execution evidence. Confounded attribution and no lesson are valid outcomes.
- Resume checks experiment identity and artifact integrity; experience contains only the entries permitted at that point in the task stream.
