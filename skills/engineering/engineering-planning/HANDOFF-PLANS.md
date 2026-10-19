# Implementation handoffs

Prepare a plan a fresh executor can follow without the preceding conversation. Obra's writing-plans supplies independently reviewable tasks and consistent interfaces; shadcn's improve references supply current-state excerpts, drift checks and reconciliation. [obra/superpowers, writing-plans/SKILL.md] [shadcn/improve, improve/references/plan-template.md, improve/references/closing-the-loop.md]

## Carry the necessary context

[shadcn/improve, improve/references/plan-template.md]

- State the concrete problem, intended result, relevant design/product intent and accepted architectural decisions. Include why the change is justified and why rejected approaches were rejected.
- Bound the work with files or responsibilities in scope, explicit non-goals, dependencies and assumptions. Link the authoritative specification and decisions.
- Record the date and revision at which the plan was prepared. Include exact relevant current excerpts with paths and line anchors, plus an existing repository exemplar that demonstrates the convention the executor should follow.
- Supply only the excerpts needed to execute and recognize drift. Full unrelated files make a handoff harder to use; a pointer alone may omit the behavior the plan depends on.
- Keep secret values out of the plan. Name only the credential type and its location when that information is needed.

## Define tasks and contracts

[obra/superpowers, writing-plans/SKILL.md]

- Make each task an independently testable deliverable worth a fresh review. Fold setup and documentation into the task that owns their outcome rather than fragment the work into administrative microtasks.
- List global constraints once, preserving exact names and behavioral requirements from the accepted specification where ambiguity would matter.
- Declare what each task consumes and produces. Keep names, parameters, return types, domain terminology and error contracts consistent between producers, consumers and the plan's examples.
- Give each step one action with a checkable result. Include exact relevant paths and interfaces, while leaving implementation bodies to the executor when a clear contract is sufficient.
- Derive verification commands from the repository, with the expected observable result for each. Do not invent a command or pretend an unauthorized test/build is available. Test technique remains in [testing](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/testing/SKILL.md).
- Self-review requirement coverage, cross-task interface consistency, missing dependencies and proportionality before handing the plan off.

## Detect drift and stop conditions

[shadcn/improve, improve/references/plan-template.md]

- Before executing, compare the plan's revision, assumptions and excerpts with the live implementation. Refresh changed evidence rather than apply a stale textual instruction.
- Specify stop conditions for false assumptions, incompatible current contracts, failed gates and work required outside the authorized boundary. Name the decision or proof needed to proceed.
- Include objective done criteria, maintenance effects and triggers for deferred follow-ups. A deferred item needs a reason or trigger, not a promise that it will somehow be handled later.
- Use [EXECUTION.md](EXECUTION.md) for task dispatch, progress state and execution; this document owns the handoff's contents.

## Reconcile the result

[shadcn/improve, improve/references/closing-the-loop.md]

- Re-read the relevant implementation and evidence before accepting a completed status. Marking a checkbox does not establish that the work landed.
- Investigate blocked work and record whether the plan needs revision, a separate decision or rejection with a reason. Do not repeatedly retry an obsolete plan.
- Flag an in-progress record left behind by a previous session. Check unfinished tasks against current code; refresh stale evidence, and record a finding resolved independently when that is what happened.
- Preserve meaningful status history and decision rationale while bringing the plan into line with the actual result.

## Prove it

[obra/superpowers, writing-plans/SKILL.md] [shadcn/improve, improve/references/plan-template.md, improve/references/closing-the-loop.md]

A fresh executor can identify the goal, exact current evidence, allowed scope, dependencies, consistent interfaces and expected results. It can detect drift and recognize when to stop. Completion is reconciled against the changed code and actual authorized checks, with blocked, superseded and independently resolved work described accurately.
