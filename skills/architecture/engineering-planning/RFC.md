# Proposals and RFC audits

Octocode's RFC reference organizes a consequential proposal around the decision, evidence, contracts and alternatives. Its RFC audit checks the implementation against the proposal's continuing intent. An accepted architectural decision is recorded using the single [ADR definition](https://github.com/Quegenx/agent-skills/blob/main/skills/architecture/domain-modeling/GLOSSARY-AND-ADRS.md#when-to-record-a-decision). [bgauryy/octocode, octocode-rfc-generator/references/rfc-template.md, octocode-rfc-generator/references/rfc-audit.md]

## Frame the decision

[bgauryy/octocode, octocode-rfc-generator/references/rfc-template.md]

- Follow the repository's RFC convention. Identify author/date, status, the decision sought and how reversible it is.
- Summarize the proposal, goals, non-goals, current state and the cost of leaving it alone. Cite non-obvious claims to code or primary evidence.
- Separate a guide-level explanation of the intended behavior from reference-level contracts, data shapes, boundaries and migration details. Put each definition in one place and link consumers to it.
- Explain alternatives, including doing nothing, and relevant prior art. Recommend based on supported facts; uncertainty that could change the recommendation remains an open question.

## Risks and prerequisites

[bgauryy/octocode, octocode-rfc-generator/references/rfc-template.md, octocode-rfc-generator/references/rfc-prerequisites.md]

- Use a pre-mortem to name plausible failures and their consequences, including compatibility, migration and rollback when applicable.
- For each prerequisite, give exact proof that it holds. Otherwise record the owner, next proof to obtain and why it blocks progress.
- Distinguish the existing environment and baseline from the target. Do not mark an unresolved environment, compatibility or migration requirement satisfied because it appears in a checklist.
- Give open questions an owner and a way to settle them. Deferred work needs an explicit trigger; separate an accepted choice from a proposal still under discussion.

## Audit continuing intent

[bgauryy/octocode, octocode-rfc-generator/references/rfc-audit.md]

- Read the RFC and inspect actual code and relevant verification evidence. Do not infer implementation from checked boxes or a status label.
- Classify the proposal's relevant parts as not implemented, partially implemented, implemented or superseded, with evidence and remaining work.
- Explain why keeping the RFC active remains useful. Separate genuine bugs or unfinished accepted scope from optional roadmap ideas.
- Recommend archiving a superseded or no-longer-useful proposal with its rationale. Do not silently delete the history or treat that recommendation as authorization to remove it.

## Prove it

[bgauryy/octocode, octocode-rfc-generator/references/rfc-template.md, octocode-rfc-generator/references/rfc-audit.md, octocode-rfc-generator/references/rfc-prerequisites.md]

The reader can identify the decision, expected behavior, authoritative facts, alternatives, risks and unresolved proof. An audit traces each implementation verdict to current evidence and distinguishes accepted remaining work from new ideas. Accepted durable decisions link to their ADR rather than redefine it here.
