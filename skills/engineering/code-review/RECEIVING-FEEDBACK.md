# Receiving review feedback

Use this before implementing review suggestions, particularly when their meaning or technical fit is uncertain. Source: [obra/superpowers, receiving-code-review, SKILL.md]. Read the complete feedback, understand the requested behavior, verify it against the codebase, then respond with evidence and make the authorized correction.

## Verify the suggestion

[obra/superpowers, receiving-code-review, SKILL.md]

- Restate the technical requirement or ask about the uncertain part. Agreement is not verification; do not promise an implementation before checking the finding.
- For outside feedback, inspect whether the suggestion fits this codebase, preserves existing functionality, respects the reason for the current implementation, and applies to the project's supported platforms and versions.
- Check actual callers before adding a supposedly necessary feature or expanding an unused endpoint. Report the usage evidence and let the owner decide whether unused functionality should remain.
- When feedback conflicts with an owner's accepted design or architectural decision, identify both positions and their evidence before changing that decision. A review suggestion does not grant authority to replace production design.
- If evidence is unavailable, name the missing input and what cannot be concluded. Do not convert an unverified suggestion into a claimed fix.

## Synthesize multiple reviews

[new/skills/interrogate, SKILL.md and references/lead-judgment.md]

Give independent reviewers the same intent and relevant context. Merge duplicate findings while retaining their provenance and explicit disagreements; agreement is a signal to inspect, not proof. Trace a proposed failure through actual callers and give even an isolated correctness or security finding proper scrutiny.

Give each finding a disposition and a short technical reason: **Act on** for demonstrated issues relevant to the goal, **Consider** for a legitimate improvement whose cost remains unsettled, **Noted** for valid but currently non-actionable context, or **Dismissed** for a wrong or unsupported objection. These are dispositions, not severities. Map source critical/warning/nit labels onto the existing P0 to P3 scale by actual impact. Review synthesis does not authorize applying the suggestions.

## Resolve uncertainty at its boundary

[obra/superpowers, receiving-code-review, SKILL.md] stops all implementation if any feedback item is unclear, because items may depend on one another. The repository's AGENTS.md keeps independent work moving: determine which items depend on the unresolved answer, hold those, and continue only the authorized independent items. Preserve the dependency concern without making one unclear item block unrelated progress.

## Respond and correct

[obra/superpowers, receiving-code-review, SKILL.md]

- Push back with the concrete code, compatibility requirement, existing behavior or unused-feature evidence. Ask a specific technical question when the reviewer may have missing context.
- For accepted feedback, state what changed and where. If earlier pushback was wrong, state what the new evidence showed and correct the work.
- For multiple items, resolve dependencies first, then address consequential failures, small isolated corrections and larger logic changes in a deliberate order. Verify each relevant correction within the task's authorized checks; source advice to test each fix does not override a user's no-tests restriction.
- Keep the existing [round cap and diff-only re-review](TUNING-THE-REVIEWER.md#review-has-to-converge). [obra/superpowers, subagent-driven-development, SKILL.md] allows five repair rounds with a fresh implementer in later rounds; it does not replace this repository's three-round reconsideration policy.
- [obra/superpowers, receiving-code-review, SKILL.md] prohibits every expression of gratitude. The existing [writing owner](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-writing/SKILL.md) preserves the writer's voice; keep the technical substance and avoid performative agreement without adopting an unrelated universal ban on thanks.

## Prove it

[obra/superpowers, receiving-code-review, SKILL.md]

Each accepted suggestion has codebase evidence and an authorized change; each rejected or deferred suggestion has a technical reason; unclear dependent work stays pending; completed checks are distinguished from unrun checks; and the response identifies the actual correction rather than claiming agreement as proof.

A multi-review synthesis retains finding provenance, explicit disagreement and each disposition's technical reason; consensus is not substituted for a checked failure path. [new/skills/interrogate, SKILL.md and references/lead-judgment.md]
