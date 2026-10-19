---
name: ultracite
description: "Sets up, operates and migrates Ultracite with its selected Oxlint/Oxfmt, Biome or ESLint backend, preserving existing configuration and applicable version upgrades. Use when a project uses Ultracite, the user selects it, or check, fix, doctor, init or upgrade needs diagnosis."
---

# Ultracite

Ultracite guidance from haydenbleasel/ultracite's skill and v5 to v8 upgrade references, with the existing corrections against its first-party CLI source, migration guide and upgrade guide retained. Inspect the installed release and configured backend before applying version-sensitive guidance; the source check of 8.0.1 is not a permanent latest-version claim. [haydenbleasel/ultracite, SKILL.md and references/upgrades/v5.md to v8.md]

| The job | Read |
|---|---|
| Detect the configured backend; choose installed commands; initialize explicitly; preserve presets and local overrides; migrate or upgrade only applicable configuration; diagnose setup and retain existing domain conflicts | [SETUP-AND-MIGRATION.md](SETUP-AND-MIGRATION.md) |

Ordinary setup inspection and tool use do not require a review-process workflow. When a selected migration produces findings to triage, use the named [code-review scanner-triage reference](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/SCANNER-TRIAGE.md). The guide's existing domain-owner references apply only when interpreting a rule in that domain; they are not requirements to install every linked skill. [haydenbleasel/ultracite, SKILL.md; existing code-review/ULTRACITE.md, Migrate progressively and Existing rule owners and conflicts]

## The rules

1. **Detect the installed release, backend and applicable config first.** Preserve the existing backend unless changing it was requested. [haydenbleasel/ultracite, SKILL.md]
2. **Distinguish command effects.** Default check inspects; fix mutates; init can install dependencies and rewrite configuration; forwarded flags can add effects. Noninteractive defaults do not supply authorization. [haydenbleasel/ultracite, SKILL.md; first-party CLI/check sources]
3. **Prefer the project's installed executable.** A temporary download runner is not an alias for the installed release. [existing code-review/ULTRACITE.md, Installed commands and their effects; pnpm exec/dlx and Yarn/Bun docs]
4. **Preserve module mode, framework selection, preset order and local overrides.** Do not replace the project's whole configuration with a source example or enable unrelated optional presets. [haydenbleasel/ultracite, SKILL.md and migration guide]
5. **Treat doctor as setup preflight.** Its pass does not establish semantic config validity, a successful lint run or application correctness. [haydenbleasel/ultracite, doctor implementation]
6. **Apply only upgrades the actual configuration needs.** Keep existing opt-ins, use the selected release's guide, and distinguish suppression state from fixed findings. [haydenbleasel/ultracite, references/upgrades/v5.md to v8.md]
7. **Keep established rule owners and source conflicts.** Lint preferences do not replace React behavior, accessibility exceptions, typed errors, security boundaries or protected production designs. [haydenbleasel/ultracite, references/code-standards.md; existing code-review/ULTRACITE.md, Existing rule owners and conflicts]

## Prove it

Use the guide's [selected-operation acceptance](SETUP-AND-MIGRATION.md#prove-it): identify the release, backend and config; state command effects; preserve intentional settings; apply only relevant migrations; distinguish doctor from actual check results; and report unrun commands as unrun. [haydenbleasel/ultracite, SKILL.md and references/upgrades/v5.md to v8.md]
