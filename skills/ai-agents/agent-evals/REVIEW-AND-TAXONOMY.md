# Human review and failure taxonomy

Sources: [confident-ai/eval-skills, eval-discover and eval-error-analysis], including local-review, workflow and portability references. The existing [discovery loop](FIX-LOOP.md#finding-failures-nobody-has-named-yet) owns sampling and improvement; this file owns the evidence that turns open notes into stable failure kinds.

## Keep observations and decisions separate

[confident-ai/eval-skills, eval-discover, references/local-review.md and workflow.md]

- Preserve the original trace/export and source identifiers. A review note links to the exact conversation or observation and the relevant content.
- Have the person who knows the task write open notes about observable behavior before proposing a taxonomy. An agent can prepare the queue and draft groupings; it does not supply independent human judgments.
- Keep observed symptoms separate from proposed causes. An ambiguous or missing trace remains unresolved rather than becoming a confident failure label.
- The existing loop starts with around 50 real conversations; eval-discover suggests an initial 15 to 25 and expansion by saturation and domain coverage. These are differently scoped discovery heuristics, not statistical sample-size guarantees. Keep the existing loop's guidance when using it.

## Define a failure kind

[confident-ai/eval-skills, eval-error-analysis, references/error-analysis.md and workflow.md]

Each mode needs a stable identifier, a name, a behavioral definition, inclusion and exclusion rules, and evidence-linked examples, including boundary cases. Review two different decisions:

- **Definition acceptance:** does this describe a real, coherent failure kind with usable boundaries?
- **Membership acceptance:** does this particular note meet that definition?

A person can accept a definition while rejecting an assignment. One case can belong to more than one kind; record those memberships rather than forcing mutually exclusive labels. Embedding similarity can propose candidates, not establish membership.

## Resolve every note

[confident-ai/eval-skills, eval-discover, references/local-review.md; eval-error-analysis, references/workflow.md]

- Record a disposition for each note, including accepted assignments, rejected suggestions and unresolved items with their reason.
- Keep reviewer identity and actual review status. Agent-proposed labels are not human-approved labels.
- Preserve revision lineage: renaming keeps the ID; merges and splits retain mappings so earlier evidence can still be interpreted.
- Review coverage as well as counts. Unreviewed or unavailable evidence is not an accepted clean case.
- Keep the review content safe to display and save using the existing [review-screen boundary](GATES.md#production); do not import the source scaffold's styling over the owner's design.

## Handoff to checks and fixes

[confident-ai/eval-skills, eval-error-analysis, SKILL.md]

An accepted failure kind can become a product fix, a deterministic check or a calibrated judge. Preserve its reviewed definition, supporting cases and unresolved boundary before that handoff. Use [JUDGES.md](JUDGES.md) for calibration and [FIX-LOOP.md](FIX-LOOP.md) for changing the agent; do not redefine either here.

## Prove it

Every accepted kind has an evidence-linked definition and boundaries; every assignment has a separate review disposition; unresolved notes remain visible; revisions retain IDs and merge/split lineage; and no agent label is represented as an independent human judgment.
