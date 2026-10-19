# Specifications and deliverable tickets

Synthesize what is already known into a stable behavioral specification, then divide delivery into complete slices. Matt Pocock's to-spec and to-tickets are the sources; execution-plan detail belongs in [HANDOFF-PLANS.md](HANDOFF-PLANS.md). [mattpocock/skills, to-spec/SKILL.md, to-tickets/SKILL.md]

## Synthesize the specification

[mattpocock/skills, to-spec/SKILL.md]

- Read the existing conversation, relevant code, glossary and applicable decisions. Synthesis is not a fresh interview when those inputs already answer the questions.
- State the problem and solution from the user's perspective. Capture the actors, capabilities and benefits in the user stories needed to cover the accepted feature.
- Record settled module boundaries, interface changes, schema/API contracts, technical clarifications and interactions. Keep undecided choices visibly unresolved.
- Describe the behavior to check, the modules involved, existing test seams and prior art. Prefer existing seams reaching the public behavior; propose a new seam only when needed and resolve consequential disagreement about it.
- Name non-goals and relevant further notes. Avoid volatile file paths and pasted implementation code in this durable artifact. The source permits a small, attributed prototype fragment when it encodes an actual decision more precisely than prose; do not invent a fragment to fill that exception.

## Choose complete slices

[mattpocock/skills, to-tickets/SKILL.md]

- Read a supplied specification or ticket and its relevant discussion in full. Use established domain language and respect accepted decisions.
- Each ordinary ticket cuts a narrow, complete route through the layers needed for its behavior. It is independently demonstrable or verifiable and fits a fresh working context.
- Separate preparatory refactoring when it makes the requested change easier. Keep its behavior-preserving purpose explicit; do not use it to enlarge the project.
- For each ticket, state its short descriptive title, end-to-end deliverable, objective acceptance and true blocking tickets. No blockers means it can begin; otherwise it becomes available only after every blocker is complete.
- Present granularity and dependencies for review when they have not already been agreed. A breakdown may need merging, splitting or corrected edges; publication is a separate authorized action.

## Wide mechanical changes

[mattpocock/skills, to-tickets/SKILL.md]

A shared rename or retype may break callers across the codebase before any vertical slice can work. In the ticket graph, each bounded caller-migration batch depends on the expansion ticket, and the final removal ticket depends on every caller batch. Explain why ordinary independently deliverable vertical slices cannot work for this change.

## Local ticket records

[mattpocock/skills, to-tickets/SKILL.md, setup-matt-pocock-skills/issue-tracker-local.md]

Follow the project's existing tracker convention. The source's local convention is one Markdown file per ticket under `.scratch/<feature-slug>/issues/`, numbered in dependency order with blockers first. Each file carries the behavior to build, blocking ticket names/identifiers, status and acceptance criteria. Refer to tickets by their descriptive names with links, rather than bare numbers alone. Tracker administration and platform lifecycle recipes are outside this topic.

## Prove it

[mattpocock/skills, to-spec/SKILL.md, to-tickets/SKILL.md]

The specification reflects accepted behavior without silently filling gaps. Every ordinary ticket delivers a complete observable slice, declares only genuine blockers and has checkable acceptance. A wide-change plan explains why vertical slices cannot stand alone and identifies the final condition for removing compatibility code. Local ticket links and dependency identifiers resolve.
