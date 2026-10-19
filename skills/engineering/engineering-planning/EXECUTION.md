# Executing a selected plan

Carry an approved plan through implementation without losing its decisions at compaction or executor handoff. Sources: [obra/superpowers, writing-plans and executing-plans], with implementation traceability from [bgauryy/octocode, octocode-rfc-generator/references/rfc-implementation.md]. The [engineering-planning skill](SKILL.md) owns plan creation; [agent-harness WORKFLOWS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-harness/WORKFLOWS.md#delegation-packets) owns worker packets.

## Establish the execution contract

[obra/superpowers, writing-plans/SKILL.md and executing-plans/SKILL.md]

- Read the selected plan, its governing specification and global constraints. Exact names, values, signatures and acceptance criteria travel with the task; a remembered summary does not replace its brief.
- Identify the plan and its durable progress record. Keep work for different plans separate, and resume from recorded completed work and current evidence rather than replaying tasks after compaction.
- Check shared interfaces before starting: what an earlier task produces must match what later tasks consume. Record the tasks, the exact mismatch and its resolution; do not manufacture dependency rows for independent tasks.
- Resolve routine plan defects against the specification, record the decision and why it is safe, and continue independent work. Ask when the uncertainty or next action exceeds authorization or makes every path a guess.
- Source conflict: obra prescribes universal TDD gates, fixed model choices and specific execution stops. This repository keeps the user's verification limits, available host capabilities and existing approval scope. A plan is not permission to run prohibited checks or install infrastructure.

## Keep a progress ledger

[obra/superpowers, executing-plans/SKILL.md]

Record the plan identity and, for each task:

- Its status and the actual files or interfaces changed.
- The verification command and observed result, or the exact check not run and why.
- Every deviation, its governing requirement, the ruling made and what being wrong would cost.
- Outstanding blockers, deferred findings and the next task whose dependencies are satisfied.

Update the record with the task's work, before relying on memory across a long run. A todo is the current view; the ledger is the recovery record. Compare current source and artifacts with the record when resuming, rather than treating a checkbox as fresh proof. [obra/superpowers, executing-plans/SKILL.md; bgauryy/octocode, octocode-rfc-generator/references/rfc-audit.md]

## Execute and compare

[obra/superpowers, executing-plans/SKILL.md]

- Take one task's exact brief and work its dependency-ordered steps. Compare every authorized command's real output with its expected result; read the output before marking completion.
- If the implementation is wrong, use [debugging](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/debugging/SKILL.md). If the plan is wrong, make the smallest correction consistent with its authority and record the ruling so downstream tasks receive it.
- Mark complete only when the task's deliverable and required evidence exist. An unavailable check stays unavailable; a convincing diff does not become a passing execution result.
- Continue authorized tasks without repeatedly asking whether to proceed. Newly discovered irreversible actions, changed public contracts or expanded scope follow the repository's approval rules.
- Review actual changes against the whole selected scope and specification. Preserve [code-review's convergence rules](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/SKILL.md); the source's single-fix-pass/no-re-review rule does not replace them.

## Hand off a phase

[obra/superpowers, writing-plans/SKILL.md and executing-plans/SKILL.md; bgauryy/octocode, octocode-rfc-generator/references/rfc-implementation.md]

- Pass the governing plan and specification, completed task evidence, current shared interfaces, ledger rulings, remaining dependency order, verification state and the next executable step.
- Keep requirement-to-task-to-acceptance-to-verification links intact. A deferred question names its reason and revisit trigger; a blocked task names the missing input rather than implying the whole plan is complete.
- Use the same progress record when execution changes from inline to delegated or back. Preserve the chosen execution method unless the user changes it; do not fabricate a worker dispatch when the host has none.
- The receiver reads the actual referenced artifacts and compares current state before continuing. For the bounded request/result shape, use [delegation packets](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-harness/WORKFLOWS.md#delegation-packets).

## Finish with decisions visible

[obra/superpowers, executing-plans/SKILL.md]

- Report the resulting behavior, exact verification performed, remaining limitations, all consequential rulings and deferred findings.
- Grade findings by the effect on the user, not by whether the plan happened to name that input. Severity uses this repository's P0 to P3 scale; it is separate from confidence and a decision to defer.
- Do not let cleanup remove the only record of a decision or destroy another plan's artifacts. Follow the agreed retention and cleanup scope.

## Prove it

[obra/superpowers, executing-plans/SKILL.md; bgauryy/octocode, octocode-rfc-generator/references/rfc-implementation.md]

- Each completed task has the deliverable and the required observed verification, with unavailable checks stated honestly.
- Shared producer/consumer interfaces agree, and downstream tasks can find the rulings that affect them.
- A resumed executor can identify the first unfinished task without reconstructing the conversation.
- The final report includes material decisions, deferrals and evidence limits; it does not silently promote a partial plan to complete.
