# Skills that inspect a project

An audit skill needs an explicit evidence contract: facts are read again from the current code, unsupported advice is dropped, and only the user's approved decisions persist. The authoring patterns here come from [fluid-functionalism], `SKILL.md`, `references/stack-audit.md`, `scripts/stack.mjs` and `scripts/audit.mjs`; the telemetry pipeline comes from [Vercel, vercel-optimize]. Execution policy stays with the skill that owns the audit.

## Design the audit contract

- State what the fact reader inspected and where each fact came from. Use a read-only, repeatable derivation rather than a cached verdict. Symlink-safe entry-point detection belongs with the [fact script policy](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/REPOSITORY-AUDIT.md#facts-are-read-never-remembered). [fluid-functionalism, stack-audit.md, stack.mjs]
- Give suggestions an evidence gate, then try to disprove them. A search hit is a lead, and a no-change result is valid. Keep an audience-specific report format with its workflow. [fluid-functionalism, stack-audit.md]
- Keep the fact inventory and advice in the reply; persist only approved decisions in existing notes or beside their code. Use the canonical [decision policy](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/REPOSITORY-AUDIT.md#only-decisions-persist). [fluid-functionalism, stack-audit.md]
- A telemetry-driven audit chooses candidates mechanically, bounds investigation and shows both skipped work and abstentions. Keep its runtime contract in the [performance audit workflow](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/TELEMETRY-AUDIT.md). [Vercel, vercel-optimize]

## Route execution to its owner

| The audit job | Read |
|---|---|
| Fresh source facts, a read-only fact script, symlink-safe entry-point detection and consented decision storage | [Repository audits](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/REPOSITORY-AUDIT.md#facts-are-read-never-remembered) |
| A measured UI improvement shortlist, product-only scanner scope and the alternate Libraries.dev review shape | [UI improvement shortlist](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-ui/IMPROVEMENT-SHORTLIST.md) |
| Rendered UI measurements and their limits | [UI invariant audit](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/browser-ui-qa/UI-INVARIANT-AUDIT.md) |
| Production-signal gates, bounded investigations, recommendations or abstentions and the report | [Telemetry audit](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/TELEMETRY-AUDIT.md) |

## Prove it

The audit skill names its evidence and persistence contracts, reports unsupported or unexamined areas, and routes execution to the domain owner rather than duplicating its rules. Its output format fits the audience, and a no-change outcome is permitted. [fluid-functionalism, stack-audit.md; Vercel, vercel-optimize]
