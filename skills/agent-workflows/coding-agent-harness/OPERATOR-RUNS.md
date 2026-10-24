# Running and resuming coding work

Keep long coding-agent runs reviewable, rebuild working context within its scope, and return decisions the human can act on. Sources are show-me-your-work, recall, ketchup and poteto-mode's Orchestrate playbook from the supplied new/skills collection. These workflows operate an existing coding agent; they do not require building a product agent. [new/skills/show-me-your-work, SKILL.md; new/skills/recall, SKILL.md; new/skills/ketchup, SKILL.md; new/skills/poteto-mode, playbooks/orchestrate.md]

## Select the record

- A selected implementation plan keeps its task status, rulings and recovery state in the existing [execution progress ledger](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/engineering-planning/EXECUTION.md#keep-a-progress-ledger). The decision trail below records consequential choices and their evidence; it does not replace that task record. [existing engineering-planning, EXECUTION.md; new/skills/show-me-your-work, SKILL.md]
- Use [session diagnosis](SESSION-DIAGNOSIS.md) to investigate what a recorded run actually did. Use the context pickup below to establish current working state before continuing; a supplied state capsule can make history mining unnecessary. [new/skills/recall, SKILL.md; existing coding-agent-harness, SESSION-DIAGNOSIS.md]
- A standing program that outlives one agent may need the coordinator layer below. Work that one session can finish does not need its store or hierarchy. Scale the ceremony to the units, and keep [shared worker packets](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-harness/WORKFLOWS.md#delegation-packets) canonical. [new/skills/poteto-mode, playbooks/orchestrate.md]
- Keep the task's authorization. The source poteto-mode grants team-chat posts, ticket updates and eval execution without asking, and reflect automatically files backlog items; those grants do not replace this repository's permissions for external actions, sharing or checks. [new/skills/poteto-mode, SKILL.md, Autonomy; new/skills/reflect, SKILL.md, Apply; existing coding-agent-harness, SKILL.md, The rules]

## Keep a decision trail

Use one canonical TSV file with single-line cells. Its source format is: [new/skills/show-me-your-work, SKILL.md, The format]

| Column | Record |
|---|---|
| ts | Timestamp |
| phase | Phase or workstream |
| decision | What was chosen or done |
| why | Plain-language reason |
| evidence | A resolving artifact, trace, screenshot or source-location pointer |
| result | Observed outcome or predicate state, including inconclusive or open |

- Log forks, completed units and their verification, pivots, reverts, blockers and gates. For an iterative run, record each iteration. Skip trivial actions and keep evidence as pointers rather than paragraphs. [new/skills/show-me-your-work, SKILL.md, Logging a row]
- Keep the trail local by default. Publish it only within the agreed scope when a reviewer needs it to trust the result. [new/skills/show-me-your-work, SKILL.md, Where it lives; existing coding-agent-harness, SKILL.md, The rules]
- Keep it append-only. Correct an erroneous row by adding a row that supersedes it and points to what actually happened. Do not edit history to match a later explanation. [new/skills/show-me-your-work, SKILL.md, Rules and Audit the log against the transcript]
- Attribute rows to runs. One conversation, including later turns and compaction summaries, is one run; a pickup, replacement agent or new chat starts another. A run appending to an existing trail first writes a `start` phase row naming the preceding timestamp range it did not write and its own agent identity. If another run has written a `start` row since, add a new `start` row before continuing. Reserve that phase for attribution. [new/skills/show-me-your-work, SKILL.md, Logging a row]
- Audit this run's stretches against its actual transcript: each row maps to a real decision or action, each pointer supports the claim, and consequential abandoned approaches are represented. Stay within the active workspace. Add superseding corrections for invented or unsupported rows and add missing pivots. [new/skills/show-me-your-work, SKILL.md, Audit the log against the transcript]
- A trail review can inspect weak evidence, skipped checks, scope creep and risky choices against the transcript. Use the existing [independent-review contract](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-harness/WORKFLOWS.md#delegation-packets), and report the actual review and its limits. The source requires a different model family and a fixed Attention footer; this repository retains proportionate review and the task's available host capabilities. [new/skills/show-me-your-work, SKILL.md, Cross-model review of the trail; existing agent-harness, WORKFLOWS.md, Delegation packets and Cost and stopping]

## Rebuild current context

- Pin the topic, workspace and time window before searching, and state that scope. Do not silently replace an all-history request with the most recent items or read unrelated projects. Use a complete state capsule already supplied by the user instead of mining it again. [new/skills/recall, SKILL.md]
- Establish actual session identity and record meanings through [session diagnosis](SESSION-DIAGNOSIS.md#identify-the-case). When history is large enough to delegate, split the scoped corpus and keep raw transcripts with those readers. Return each relevant chat's goal, decisions, open threads, corrections and artifacts with its identity. [new/skills/recall, SKILL.md; existing coding-agent-harness, SESSION-DIAGNOSIS.md]
- For a named feature or bug, combine relevant personal history with the shared record: symptoms, earlier attempts, reverted fixes and errors still occurring. Use [code research](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-research/SOURCE-RESEARCH.md) for source evidence. Report an unavailable source rather than implying that it was checked. Keep adjacent work out unless it blocks the target. [new/skills/recall, SKILL.md]
- Reconcile the recovered record with current artifacts before acting. When the answer depends on what an agent actually ran or read, inspect its transcript rather than relying on a trimmed summary. [new/skills/recall, SKILL.md; existing engineering-planning, EXECUTION.md, Hand off a phase]
- Return a compact capsule, the state of each relevant thread, recurring problems including reverted attempts, and the single most useful next action. Preserve thread coverage when cutting detail, and sanitize private context before an authorized public output. [new/skills/recall, SKILL.md, Output contract]

## Coordinate a standing program

- Keep standing constraints in a durable record and include the applicable orders with every worker dispatch and resume. Owners publish facts; readers aggregate them. Assign one writer to each shared file, and derive the status view from unit and verification records rather than hand-maintaining a competing narrative. [new/skills/poteto-mode, playbooks/orchestrate.md, Store layout and The brief]
- Pilot the unit shape through its full authorized path before multiplying it. Use the first ordinary unit for cheap repeated work; a separate pilot pipeline is for novel or expensive work whose brief, verification recipe or unit size needs testing. [new/skills/poteto-mode, playbooks/orchestrate.md, Steps]
- Use a rolling window sized to the coordinator's ability to process results. Add a track coordinator only when that work exceeds one coordinator's capacity; it returns a rollup instead of raw child reports. Relay upstream findings into dependent briefs. [new/skills/poteto-mode, playbooks/orchestrate.md, Roles and placement and Steps]
- Treat completion notifications as queued events. Finish a current critical section, then drain a batch before refilling or reporting to the human. Classify every completion, update the unit and verification records, regenerate status, and leave arrivals during the drain for the next one. [new/skills/poteto-mode, playbooks/orchestrate.md, Queue and drain]
- Account for every spawned worker in its track's rollup: its result arrived, it was replaced, or its scope was explicitly absorbed. Quietly redoing missing work hides its cost and coverage gap. Keep the [existing completion barrier](https://github.com/Quegenx/agent-skills/blob/main/skills/ai-agents/agent-harness/WORKFLOWS.md#delegation-packets) for acceptance. [new/skills/poteto-mode, playbooks/orchestrate.md, Queue and drain]
- Check liveness using the host's actual read-only status surfaces and durable artifacts; transcript modification time alone is not liveness. Do not use a resume as a status probe when it would restart execution. Bound retries and replan from the observed failure; a late worker result must be reconciled with current state before acceptance. [new/skills/poteto-mode, playbooks/orchestrate.md, Liveness and failure]
- Stop refilling when bad upstream output, broken acceptance or unavailable infrastructure would invalidate the whole program. Preserve in-flight state, fix the cause within scope, then resume. If continued infrastructure retries cannot progress, leave a durable handoff with completed work, its location and the next executable step. [new/skills/poteto-mode, playbooks/orchestrate.md, Liveness and failure]
- Close only after the final inbox is drained, every spawned worker has a terminal disposition, and the done predicate has been checked against the real artifact. Keep the records for subsequent review. [new/skills/poteto-mode, playbooks/orchestrate.md, Steps]

## Catch the human up

- Scope a catch-up to changes since the human's last message before the request; notifications and worker results do not reset that boundary. Keep the catch-up read-only and use existing artifacts. [new/skills/ketchup, SKILL.md, Gather what changed]
- Distinguish work the agent can continue from a choice, permission, irreversible action or missing access only the human can supply. Include older decisions still waiting on them. Do not invent a decision to fill the reply. [new/skills/ketchup, SKILL.md, Gather what changed]
- State outcomes as done, running, failed or unverified, and keep a task waiting on the human visibly pending. For each human decision, give the relevant item, available options, gains and costs, evidence, recommendation and risk. Mark a needed unknown as unknown. A link may add depth but must not replace the information needed to decide. [new/skills/ketchup, SKILL.md, Write the reply]
- Preserve every pending decision rather than dropping items to satisfy a word count. Group a shared decision once while retaining each affected item's evidence and risk. [new/skills/ketchup, SKILL.md, Write the reply]
- Use genuine captures for visible results and diagrams for relationships supported by the evidence. Do not manufacture a screen capture, number or artifact link. [new/skills/ketchup, SKILL.md, Visuals]

## Prove it

- The trail identifies its run's rows, records real choices and resolving evidence, and supersedes errors without rewriting them. [new/skills/show-me-your-work, SKILL.md]
- Context pickup states its scope, distinguishes history from current evidence, and identifies the next action without claiming unavailable sources were checked. [new/skills/recall, SKILL.md]
- A standing program accounts for every worker and reconciles late results with current artifacts; its status comes from its records. [new/skills/poteto-mode, playbooks/orchestrate.md]
- The catch-up distinguishes continuing agent work from human decisions and preserves all pending decisions with actual outcomes and evidence limits. [new/skills/ketchup, SKILL.md]
