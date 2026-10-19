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

## Facts are read, never remembered

- **A read-only script at the start of every session:** "The stack read runs at the start of every session that installs, composes, or advises." "Neither writes into the project: facts are read again each time, results go in the reply, and only the user's own decisions are kept, with their OK." [fluid-functionalism, stack-audit.md]
- **Every fact cites where it came from:** the script "prints what it read, with the file:line it read it from, and writes nothing." "Reading them again each run means no cached verdict can drift from the code, so the skill never has to leave a record in the project." [fluid-functionalism, stack.mjs]
- **Same derivation, same answer:** "The script derives it the same way every run, so the same project always gets the same answer. Don't override it from memory of an earlier session". On later runs, "Run `stack.mjs` again; it is the record. Trust what it prints over anything remembered from an earlier session." [fluid-functionalism, stack-audit.md]
- **A script must run through a symlinked skill folder.** "Both sides go through realpath: a skill installed globally is usually a symlink (~/.claude/skills/… → ~/.agents/skills/…), and Node reports the main module by its real path." [fluid-functionalism, stack.mjs]

```js
function isMain() {
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (process.argv[1] && isMain()) {
  const args = process.argv.slice(2);
  try {
    const stack = readStack(args.find((a) => !a.startsWith("--")) ?? ".");
    console.log(args.includes("--json") ? JSON.stringify(stack, null, 2) : report(stack));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
```

## Inspect by consequence

[shadcn/improve, references/audit-playbook.md], [DietrichGebert/ponytail, ponytail-audit]

| Area | Evidence to investigate | Canonical detail |
| --- | --- | --- |
| Correctness | A concrete input or state leading to a wrong result, lost error, race, resource leak or inconsistent rule | [Debugging](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/debugging/SKILL.md) |
| Security and data loss | Reachable trust-boundary, authorization, secret, interpreter or persistence defect | [Secure coding](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/secure-coding/SKILL.md) |
| Expected load and speed | Shared-state assumptions, repeated work, unbounded data or measured hot paths | [Measurement](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/MEASURE.md) |
| Test risk | Critical paths or frequently changed logic with no check that detects their plausible failure | [Testing](https://github.com/Quegenx/agent-skills/blob/main/skills/testing/testing/SKILL.md) |
| Architecture and deletion | Duplication, wrong responsibility boundaries, dead paths, speculative abstractions or hidden coupling | [Refactoring](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/refactoring/SKILL.md) |
| Dependencies and migrations | Reachable advisories, supported-version requirements, confirmed deprecations, duplicate tools and migration blast radius | [System migration](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/system-migration/SKILL.md) |
| Developer workflow | Broken documented setup, missing required configuration, unusable feedback or misleading errors | The repository's own scripts and runbooks |
| Documentation | Wrong setup/API guidance or missing decisions with a concrete cost | [Documentation writing](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/developer-docs/WRITING-AND-PUBLISHING.md) |
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
- [DietrichGebert/ponytail, ponytail-audit] says split by responsibility and never by line count. The existing [anti-slop-code](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-code/SKILL.md) treats a file crossing about 1,000 lines as a presumptive structural smell. Keep that threshold as a prompt to inspect responsibilities, not an automatic instruction to create smaller files.

## Report, select and persist only in the selected mode

[DietrichGebert/ponytail, ponytail-audit], [shadcn/improve, SKILL.md]

- Begin with what the repository does and the expected load. Explain each supported issue through its current role, concrete failure, smallest correction and consequence of leaving it. Use numbered findings so a user can select them; finish with the verdict and unchecked areas. State how many lower-priority findings were omitted when applying Ponytail's cap of 20.
- Show grounded product-direction options separately from defects. Explain evidence, user value, effort and tradeoffs; use a design or investigation plan when direction remains undecided.
- A plain audit follows the existing [stateless project-audit policy](#only-decisions-persist): facts and verdicts go in the reply, and only approved decisions persist in existing notes or beside the code.
- [shadcn/improve, SKILL.md] instead maintains a plan index with rejected findings to prevent repeated work. Apply that alternative only to a user-selected planning job: keep the requested plans, their statuses, dependencies and considered/rejected rationale in its agreed artifact. It does not change the stateless default or authorize a new audit file for every run.
- Select findings before creating plans. The source's noninteractive top-findings default does not bypass the user's selection requirement. Use [handoff plans](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/engineering-planning/HANDOFF-PLANS.md) for the selected items; refresh current facts before reusing earlier findings or rejected-decision records.
- Do not present Ponytail's published benchmark as savings on this repository. A hypothetical unbuilt version is not a measured baseline. [DietrichGebert/ponytail, ponytail-gain]

## Only decisions persist

[fluid-functionalism, stack-audit.md]: "The only thing worth carrying between sessions is what the user decided, because nothing in the code shows it". "Record one only when the user makes it, and only with their OK":

- "**Tied to one place** (a duration, one still list): a one-line comment beside the code saying what was kept and why." "The note goes away with the code it explains."

  ```tsx
  // 150ms on purpose: matches the OS sheet it sits on, not an FF token.
  ```

- "**Project-wide** (fluid hover declined, a local alias of a system piece): one line under a `## Fluid Functionalism` heading in the agent notes the project already keeps (`AGENTS.md`, `CLAUDE.md`)", the heading being the skill's own name. The script finds that heading "in the app's directory or any directory above it up to the repository root" (it reads `AGENTS.md`, `CLAUDE.md` and `.github/copilot-instructions.md`) [fluid-functionalism, stack.mjs].

  ```markdown
  ## Fluid Functionalism
  - Fluid hover: declined 2026-09-14, menus stay still on purpose.
  - hooks/use-proximity-hover.ts is this project's use-fluid-hover: extend
    it, don't install beside it.
  ```

- "Never create a new file for decisions. If the project keeps no agent notes, or the user would rather not write any, keep the decision in your own memory if you have one, or just in the reply. A lost decision costs one repeated question, never a wrong install."
- "Record what the user said or what you observed, not what you concluded from it: 'GET /r/select-base.json → 404' is a fact; 'the registry serves Radix only' is a conclusion the fact doesn't support." "A claim you couldn't verify is a question for the user, not a decision."
- **Earlier audit files** a previous version wrote: "read it for decisions only … and honor them. Ignore its versions, inventory, verdicts, and open advice: the script and a fresh measurement replace those. Don't update it." Offer to move its decisions into the agent notes; "Never delete it unasked."
- **Surface advice at natural moments,** "not on every run. If the user declines, offer to record it as a decision so it stops being raised."

## Prove it

[shadcn/improve, SKILL.md and references/audit-playbook.md], [DietrichGebert/ponytail, ponytail-audit]

The report names its scope, expected load and unread areas; every finding survives direct rereading and has a concrete consequence; documented intent and actual drift are distinguished; confidence, severity and fix risk stay separate; direction is outside the defect ranking; and persistent artifacts exist only for the selected planning job or an approved decision.

The audit fact script prints what it read with a `file:line`, writes nothing, and gives the same derivation for the same source. Recorded decisions stay beside their code or in existing agent notes, with the user's consent. [fluid-functionalism, stack-audit.md, stack.mjs]
