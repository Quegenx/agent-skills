# Measuring and improving a skill

Usage logging shows which skills are popular or under-triggering; an eval of the skill shows whether it does the task correctly, and a hillclimb against that eval improves it one change at a time.

## Logging skill usage

- **Log every load with a PreToolUse hook:** the Claude Code team logs skill usage across the company with a PreToolUse hook ([example code](https://gist.github.com/ThariqS/24defad423d701746e23dc19aace4de5)).
- **Read it for popularity and under-triggering:** the log shows which skills are popular and which are under-triggering compared to expectations.

## Evaluating a skill

- **Build the eval from the source the skill teaches:** the claude-api skill is tested with an evaluation set derived from the documentation, checking that the skill can correctly implement code that uses the APIs.
- **Lightweight evals with separate agents:** spin off separate agents in a worktree to produce outputs, then comparison agents to grade them against a rubric, for example to evaluate and then refine a skill you've created against particular criteria.
- **Full suites and audits:** for building a full suite, see [agent-evals](../agent-evals/SKILL.md); to audit a SKILL.md with subagents attempting a real task, see [DX-AUDIT.md](../agent-evals/DX-AUDIT.md).

## Hillclimbing a skill

- **Skills are a good surface:** hillclimbing works well where iteration is cheap; prompts and skills are text, easy to change and revert.
- **Keep the score attributable:** several successful hillclimbs have focused on skill triggering, where the metric (the trigger rate) is directly coupled to the description being modified.
- **`/claude-api hillclimb` can edit skills:** among the surfaces you can let it change are skills or instruction files. Each round it reads the previous round's train transcripts and proposes one change as a patch, keeps it only when both train and test improve, and reverts it when only train rises or either drops.
- **What a skill hillclimb found:** on the claude-api skill's eval, given the documentation and SDKs, the score went from 66% to about 88% over 24 rounds. Adding sections for eight missing features took it to 74%; fixing errors in the C# and Java type tables to 77%; a table near the top steering Claude from the API forms it remembered to the current ones, with warnings moved above their examples, to 80%; then fixing flawed tasks and graders plus more skill edits to about 88%.
- **When the score stalls, sort the failures:** after two stalled rounds, the reflection step makes no edit and only sorts every remaining failure by root cause. Tasks that never improve despite addressing obvious content gaps are tells that the example or grader is flawed: one task asked for code catching one error type while its grader wanted a chain of at least three, and another grader contradicted the docs, which testing the real API showed were right.

## Prove it

A usage log exists and is read for skills that under-trigger; a description change is checked against a trigger-rate eval; a content change is checked against an eval built from the source the skill teaches, on a held-out split; a task that won't move despite content fixes has its grader checked before the skill is edited again.
