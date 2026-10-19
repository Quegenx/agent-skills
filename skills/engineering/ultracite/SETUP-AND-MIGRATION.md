# Ultracite setup and migration

Use this for an existing or explicitly selected Ultracite installation. Sources: [haydenbleasel/ultracite, SKILL.md and references/upgrades/v5.md to v8.md], checked against the first-party [CLI source](https://github.com/haydenbleasel/ultracite/blob/main/packages/cli/src/index.ts), [migration guide](https://www.ultracite.ai/docs/migrate.md) and [upgrade guide](https://github.com/haydenbleasel/ultracite/blob/main/apps/docs/(guides)/upgrade.mdx). Inspect the installed version before applying a current guide; the checked upstream package was 8.0.1, not a permanent latest-version guarantee.

## Detect the configured backend

[haydenbleasel/ultracite, SKILL.md]

- Find `ultracite` in dependencies or devDependencies, then inspect the nearest applicable config while walking upward. Biome uses `biome.json` or `biome.jsonc`; ESLint uses a flat `eslint.config.*`; Oxlint uses `oxlint.config.ts`, `oxlint.config.mts` or legacy `.oxlintrc.json`. These are the source's canonical names, not a complete filename catalogue.
- The three backends are Oxlint with Oxfmt, Biome, and ESLint with separate Prettier and Stylelint. The source recommends Oxlint; an existing backend stays in place unless changing it is requested.
- Init uses the `.mts` Oxlint/Oxfmt config form when the package is not an ES module. Do not change the package's module mode just to make a copied `.ts` example load. [Oxlint setup source](https://github.com/haydenbleasel/ultracite/blob/main/packages/cli/src/linters/oxlint.ts)

## Installed commands and their effects

[haydenbleasel/ultracite, SKILL.md]

| Job | Source command | Effect |
| --- | --- | --- |
| Inspect issues | `bunx ultracite check` | Runs the configured checks; default behavior does not fix files |
| Apply fixes | `bunx ultracite fix` | Mutates files using the selected backend's fixes and formatter |
| Diagnose setup | `bunx ultracite doctor` | Checks installation, dependency/config markers and conflicting tools |
| Initialize or migrate setup | `bunx ultracite init` | Can install dependencies, create/update configuration and write selected integrations |
| Upgrade | `npx ultracite@latest upgrade` | Fetches the upgrade CLI and installs the chosen release's compatible tools |

- Prefer the project's installed executable: adapt the runner to `npx`, `pnpm exec` or `yarn` as appropriate. `pnpm dlx` and `yarn dlx` fetch a temporary package; they are not aliases for the installed version. A project without Ultracite needs a download runner for init. [pnpm exec](https://pnpm.io/cli/exec), [pnpm dlx](https://pnpm.io/cli/dlx), [Yarn dlx](https://yarnpkg.com/cli/dlx), [Bun bunx](https://bun.com/docs/pm/bunx)
- Check and fix accept file paths, and pass unknown flags to the underlying checker. Review their effects for that backend: the source's read-only description of check applies to its defaults, while ESLint `check --suppress-all` writes a suppression file. [Check implementation](https://github.com/haydenbleasel/ultracite/blob/main/packages/cli/src/commands/check.ts), [ESLint suppressions](https://eslint.org/docs/latest/use/suppressions)
- Doctor is setup preflight, not a semantic config evaluator or a successful linter run. Its pass does not establish runtime correctness or complete configuration validity; the source called this config validity. [Doctor implementation](https://github.com/haydenbleasel/ultracite/blob/main/packages/cli/src/commands/doctor.ts)

## Explicit initialization

[haydenbleasel/ultracite, SKILL.md], [CLI source](https://github.com/haydenbleasel/ultracite/blob/main/packages/cli/src/index.ts)

- Choose the package manager, backend and applicable framework rather than silently switching them. Source flags include `--pm`, `--linter`, `--frameworks`, `--editors`, `--agents` and `--integrations`; the selected integration can write hooks or agent/editor settings. Keep unsupported framework presets out.
- `--yes` or `-y` accepts defaults; the CLI also enables that behavior for `CI=true`, `CI=1` or no terminal. `--quiet` only reduces output. Noninteractive defaults do not replace the user's authorization for setup changes.
- `--skip-install` skips dependency installation; `--install-skill` requests the reusable source skill. Neither is an instruction to install anything during a documentation review.
- `--type-aware` selects the type-aware configuration for the chosen backend. Oxlint uses `oxlint-tsgolint` and `options.typeAware`; ESLint/Biome use their respective presets. Inspect the result: existing explicit `strictNullChecks: false` is preserved, and an existing Oxlint options object can cause a warning rather than a forced rewrite. The source's unconditional enablement wording omitted those preservation cases. [Migration guide](https://www.ultracite.ai/docs/migrate.md), [Oxlint setup source](https://github.com/haydenbleasel/ultracite/blob/main/packages/cli/src/linters/oxlint.ts)

## Presets and local overrides

[haydenbleasel/ultracite, SKILL.md]

| Backend | Source configuration shape |
| --- | --- |
| Biome | `extends` names provider-qualified presets such as `ultracite/biome/core` and `ultracite/biome/react` |
| ESLint | Import and spread the flat-config arrays from `ultracite/eslint/core` and the selected framework presets |
| Oxlint | Import `defineConfig` from Oxlint and `core` from `ultracite/oxlint/core`; pass core through `extends` and retain its `env` and `ignorePatterns` |

- Add React and Next presets only when the project uses them; keep the existing configuration order and intentional local overrides after presets. Source-provided examples are not permission to overwrite the project's whole config.
- Type-aware ESLint rules live in the explicit `type-aware` preset and selected framework add-ons. Cypress and Storybook rules are separate ESLint presets; their Biome/Oxlint counterparts are empty. Do not enable every optional preset just because it exists.
- Init preselects an existing engine, but unsupported config structures can be replaced with a warning. Read the changes and carry over the project's own settings deliberately. Changing engine can remove obsolete configuration and tool dependencies. [Official migration guide](https://www.ultracite.ai/docs/migrate.md)

## Migrate progressively

[haydenbleasel/ultracite, SKILL.md], [Official migration guide](https://www.ultracite.ai/docs/migrate.md)

- Preserve local rules after the presets. When a broad formatting change is selected, isolate it from subsequent behavior changes; then handle the remaining findings with the existing [code-review scanner triage](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/SCANNER-TRIAGE.md).
- For Oxlint, the JSON report's non-core `plugin(rule)` becomes `plugin/rule` in config; core `eslint(rule)` becomes bare `rule`. The source omitted that core-rule exception.
- For Biome, the summary report distinguishes `linter.rules` from `assist.actions.source`; disable only the relevant rule/action when staging a migration.
- For ESLint, `ultracite check --suppress-all` records current errors by rule and file in `eslint-suppressions.json`; it does not establish that those errors were fixed. Remove resolved entries with `ultracite check --prune-suppressions`. [ESLint suppression semantics](https://eslint.org/docs/latest/use/suppressions)
- Remove temporary overrides in small rule-specific changes, apply authorized fixes and inspect what remains. A suppression or a disabled rule is migration state, not evidence that a finding disappeared.

## Apply only the upgrade guides the config needs

[haydenbleasel/ultracite, references/upgrades/v5.md to v8.md], [Official upgrade guide](https://github.com/haydenbleasel/ultracite/blob/main/apps/docs/(guides)/upgrade.mdx)

- Upgrade installs the target Ultracite release and supported checker versions, then runs doctor. `--version 7` selects that release line; optional `--claude` or `--codex` handoff flags require an upgrade CLI from v8 or later. A guide is selected by actual configuration, not just the old package number. Apply applicable migrations oldest first and keep the engine and existing opt-ins unchanged unless selected otherwise.

| Guide | Detect | Required migration |
| --- | --- | --- |
| v5 | Biome 1 schema or top-level `organizeImports`, `files.ignore` or `files.include` | Move to the Biome 2 configuration and suppression syntax below |
| v6 | Bare `ultracite` in Biome extends | Split into `ultracite/core` plus relevant framework presets; React precedes Next. Keep all other settings. |
| v7 | Preset names lack a backend segment, or scripts still use `lint`/`format` | Prefix Biome presets with `ultracite/biome/`; use `check`/`fix` and preserve arguments and order. Keep Biome. |
| v8 | Prettier linter rules, formerly implicit framework/typed rules, Oxlint type-aware config, or quiet-only init | Apply only the relevant v8 changes below |

### Biome 2 configuration

[haydenbleasel/ultracite, references/upgrades/v5.md], [Official Biome migration guide](https://github.com/biomejs/website/blob/main/src/content/docs/en/installation/upgrade-to-biome-v2.mdx)

- Point the schema at the installed `@biomejs/biome/configuration_schema.json`. Combine old include/ignore settings into `files.includes`, beginning with `**` before negated exclusions. Globs no longer receive an implicit `**/` prefix; paths are relative to the config.
- Move organize-imports configuration to `assist.actions.source.organizeImports`, using `on` or `off`. Remove `linter.rules.all`, which has no replacement.
- Use `biome-ignore lint/<group>/<rule>: <reason>` suppression syntax; the old `lint(<group>/<rule>)` form was removed. Existing `biome.json` need not be renamed to jsonc.
- The source migration command is `npx @biomejs/biome migrate --write`; it mutates config and needs inspection afterward. Do not run it during a read-only audit.

### v8 separation and opt-ins

[haydenbleasel/ultracite, references/upgrades/v8.md]

- Remove inherited `prettier/prettier` entries from ESLint/Stylelint configs when those plugins are no longer loaded. Prettier is a separate check/fix step; preserve its config and the other rule settings.
- Add the separate Cypress or Storybook ESLint preset when that framework was already used. Preserve their position after core and the rest of the flat config.
- If the config already enables rules requiring type information without providing project service, restore that capability with `ultracite/eslint/type-aware` and the applicable already-used framework add-on. Do not automatically enable type-aware linting in an unrelated project. Consult the installed-release guide for the rule inventory rather than copying a version-sensitive list.
- When Oxlint already has `oxlint-tsgolint` installed, set `options.typeAware: true` in its root config; an existing CLI `--type-aware` argument may remain. Inspect existing options before changing them.
- Add `--yes` to an intentional noninteractive init that previously relied on `--quiet`; keep other flags.

## Existing rule owners and conflicts

[haydenbleasel/ultracite, references/code-standards.md]

- Formatting, naming and accidental debug output stay with [anti-slop-code](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-code/SKILL.md). Error handling stays with [typed errors](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/refactoring/ERRORS.md), React/Next behavior with [React](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/react/SKILL.md), and async overlap with [start early, await late](https://github.com/Quegenx/agent-skills/blob/main/skills/backend/performance-and-caching/MEASURE.md#overlap-independent-waits). The source's always-await wording does not require immediately serializing independent work.
- The source's as-const wording can mean compile-time intent; const assertions narrow literal types and add readonly typing, without guaranteeing deep or runtime immutability. [Official TypeScript caveat](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions)
- The source's blanket keyboard-handler wording yields to the existing [native-control exception](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/web-accessibility/SEMANTICS-AND-ARIA.md). Traditional Hook placement also retains React's [use exception](https://github.com/Quegenx/agent-skills/blob/main/skills/web-ui/react/REACT-19.md).
- The source says validate and sanitize input; this repository keeps [allowlisting and context-specific output encoding](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/secure-coding/SKILL.md). Its ban on document.cookie assignment is a lint preference, not a platform prohibition: [MDN documents its setter](https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie).
- Preserve production design when a linter suggests a stylistic replacement; use the existing [code-review owner-design scanner rule](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/SCANNER-TRIAGE.md). No automatic migration is authorized by a finding.

## Troubleshooting

[haydenbleasel/ultracite, SKILL.md]

- Check the actual selected preset paths and installed dependencies when rules do not apply. Re-running init is a setup mutation, not a harmless diagnostic substitute.
- After a selected move to Oxlint/Biome, remove obsolete lint/format config deliberately. With the ESLint backend, Prettier config remains in use and ESLint 10 no longer reads legacy eslintrc; the source correctly treats that legacy config as inert rather than a conflict. [ESLint 10 migration](https://eslint.org/docs/latest/use/migrate-to-10.0.0)

## Prove it

[haydenbleasel/ultracite, SKILL.md and references/upgrades/v5.md to v8.md]

The installed release, engine and applicable config are identified; commands and forwarded flags have their effects stated; local overrides and module mode survive deliberately; only applicable upgrade guides and existing opt-ins are changed; doctor preflight is separated from actual check results; and unrun commands are reported as unrun.
