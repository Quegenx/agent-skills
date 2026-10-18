# Auditing a repository

Use this for a requested repository or package audit and for selecting evidence-backed improvement plans. Sources: [shadcn/improve, SKILL.md and references/audit-playbook.md], [DietrichGebert/ponytail, ponytail-audit and ponytail-review]. An audit reports findings; it does not silently become an implementation job.

## Scope, intent and expected load

[shadcn/improve, SKILL.md], [DietrichGebert/ponytail, ponytail-audit]

- Audit the scope the user named. Read its README, agent instructions, contribution guidance, manifests, configuration, entry points and relevant tests. Trace important input, persistence and output paths fully, especially authorization, money, writes, background work and cross-process state.
- Read existing specifications, product context, design guidance and architectural decisions. Record their vocabulary and intentional tradeoffs before treating a pattern as a defect. Absent intent documents are a gap, not permission to invent intent.
- Establish the expected load from the repository and deployment context. State whether it is observed or assumed. A shortcut below its documented ceiling is a decision; one already beyond that ceiling needs investigation.
- Weight depth toward costly failures and active hotspots. A quick pass covers hotspots; a broader pass covers key packages and categories; a deep pass still names packages and coverage limits. State what was not read or verified.
- Discover exact available verification commands and their prerequisites, but obey the task's execution permissions. Missing or broken verification is a limitation and can be an improvement candidate; it is not an instruction to install tooling or run tests during a read-only job.
- For a change audit, use [CHANGE-SCOPE.md](CHANGE-SCOPE.md). [DietrichGebert/ponytail, ponytail-review] defaults to the last commit when no uncommitted change exists; the existing scope policy requires the user to choose rather than silently inventing that target.

## Inspect by consequence

[shadcn/improve, references/audit-playbook.md], [DietrichGebert/ponytail, ponytail-audit]

| Area | Evidence to investigate | Canonical detail |
| --- | --- | --- |
| Correctness | A concrete input or state leading to a wrong result, lost error, race, resource leak or inconsistent rule | [Debugging](../debugging/SKILL.md) |
| Security and data loss | Reachable trust-boundary, authorization, secret, interpreter or persistence defect | [Secure coding](../../backend/secure-coding/SKILL.md) |
| Expected load and speed | Shared-state assumptions, repeated work, unbounded data or measured hot paths | [Measurement](../../backend/performance-and-caching/MEASURE.md) |
| Test risk | Critical paths or frequently changed logic with no check that detects their plausible failure | [Testing](../testing/SKILL.md) |
| Architecture and deletion | Duplication, wrong responsibility boundaries, dead paths, speculative abstractions or hidden coupling | [Refactoring](../refactoring/SKILL.md) |
| Dependencies and migrations | Reachable advisories, supported-version requirements, confirmed deprecations, duplicate tools and migration blast radius | [System migration](../system-migration/SKILL.md) |
| Developer workflow | Broken documented setup, missing required configuration, unusable feedback or misleading errors | The repository's own scripts and runbooks |
| Documentation | Wrong setup/API guidance or missing decisions with a concrete cost | [Documentation writing](../../anti-ai-slop/anti-slop-writing/DOCS.md) |
| Direction | Stated but unfinished intent, useful asymmetries, manual friction or nearby capabilities | Present as maintainer options, separately from defects |

These are investigation prompts, not findings by keyword match. Confirm platform-specific claims against the matching official documentation before recommending a correction. [shadcn/improve, references/audit-playbook.md]

## Vet every candidate

[shadcn/improve, SKILL.md and references/audit-playbook.md], [DietrichGebert/ponytail, ponytail-audit]

- Reopen the cited source yourself before presenting it. Reject incorrect attribution, duplicate root causes and intentional behavior. An existing decision does not suppress verified drift between the decision and the current code; report that mismatch explicitly.
- Require a concrete situation and consequence. Before declaring something unused, check callers, tests, fixtures, configuration and dynamic/string references. Before proposing a shared helper, identify the existing implementation that could be reused.
- Record location, impact, effort, confidence, fix risk and a small correction sketch. Keep severity on [P0 to P3](REVIEWER.md#tags-and-output); confidence and risk describe evidence and the proposed fix, not alternative severity scales. Ponytail's must-fix, should-fix and nice-to-have groupings are translated by the demonstrated consequence rather than copied as a second scale.
- Treat low-confidence candidates as investigations, not established bugs. Prefer no supported recommendation over padding a report. Keep secret values out of findings and plans; cite only their type and location and include rotation where exposed credentials are confirmed.
- A selected security audit uses the [boundary, evidence-state and coverage contract](SECURITY-AUDITS.md): current-source revalidation and fresh verification of material replacements supplement this general audit. [cloudflare/security-audit-skill, security-audit/VALIDATION-AND-REPORTING.md]
- Rank supported defects by impact relative to effort, discounted by confidence and fix risk. Dependency-unblocking work, consequential security defects and corrections with a clear verification story can take precedence. A not-worth-doing verdict is valid when its reason is explicit.
- [DietrichGebert/ponytail, ponytail-audit] says split by responsibility and never by line count. The existing [anti-slop-code](../../anti-ai-slop/anti-slop-code/SKILL.md) treats a file crossing about 1,000 lines as a presumptive structural smell. Keep that threshold as a prompt to inspect responsibilities, not an automatic instruction to create smaller files.

## Report, select and persist only in the selected mode

[DietrichGebert/ponytail, ponytail-audit], [shadcn/improve, SKILL.md]

- Begin with what the repository does and the expected load. Explain each supported issue through its current role, concrete failure, smallest correction and consequence of leaving it. Use numbered findings so a user can select them; finish with the verdict and unchecked areas. State how many lower-priority findings were omitted when applying Ponytail's cap of 20.
- Show grounded product-direction options separately from defects. Explain evidence, user value, effort and tradeoffs; use a design or investigation plan when direction remains undecided.
- A plain audit follows the existing [stateless project-audit policy](../../ai-agents/skill-authoring/PROJECT-AUDITS.md#only-decisions-persist): facts and verdicts go in the reply, and only approved decisions persist in existing notes or beside the code.
- [shadcn/improve, SKILL.md] instead maintains a plan index with rejected findings to prevent repeated work. Apply that alternative only to a user-selected planning job: keep the requested plans, their statuses, dependencies and considered/rejected rationale in its agreed artifact. It does not change the stateless default or authorize a new audit file for every run.
- Select findings before creating plans. The source's noninteractive top-findings default does not bypass the user's selection requirement. Use [handoff plans](../engineering-planning/HANDOFF-PLANS.md) for the selected items; refresh current facts before reusing earlier findings or rejected-decision records.
- Do not present Ponytail's published benchmark as savings on this repository. A hypothetical unbuilt version is not a measured baseline. [DietrichGebert/ponytail, ponytail-gain]

## Prove it

[shadcn/improve, SKILL.md and references/audit-playbook.md], [DietrichGebert/ponytail, ponytail-audit]

The report names its scope, expected load and unread areas; every finding survives direct rereading and has a concrete consequence; documented intent and actual drift are distinguished; confidence, severity and fix risk stay separate; direction is outside the defect ranking; and persistent artifacts exist only for the selected planning job or an approved decision.
