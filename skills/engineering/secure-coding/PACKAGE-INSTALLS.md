# Package installation boundaries

Sources: [grafana/skills, check-npm, its managers, protocols and fix-snippets references], corrected against current package-manager documentation. This file owns installation policy; footprint/removal decisions stay in [refactoring DEPENDENCY-AUDIT.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/refactoring/DEPENDENCY-AUDIT.md).

## Identify what will execute

[grafana/skills, check-npm]

- Inspect the actual packageManager pin, lockfile, workspace membership and installed manager version. Discover root and member manifests rather than scanning unrelated projects.
- Read lifecycle-script settings and their exceptions in the configuration used by that exact major. A setting copied into a file the release no longer reads is not protection.
- Inventory dependency source values in runtime, development, optional and peer sections, including aliases, patches and transitive resolution.
- Preserve the lockfile and existing stricter organizational policy. Record the package, version, source, policy and applicable exception before proposing a change.
- Read package provenance and publication age as evidence, not as a guarantee that code is safe. Keep exceptions explicit and scoped; a vendor namespace is not an automatic exemption.

## Lifecycle controls by version

[https://github.com/pnpm/pnpm/blob/main/pnpm/docs/settings/build.md; https://github.com/pnpm/pnpm/blob/main/pnpm11/docs/migration.md]

For pnpm 11, inspect its workspace build policy and `allowBuilds` mapping of package names to booleans. The supplied fix used an empty array; that is the wrong shape for the current map. Treat permitted builds and unreviewed build requirements separately, and verify keys against the installed major instead of transplanting pnpm 10 configuration.

[https://github.com/yarnpkg/berry/blob/master/packages/docusaurus/docs/features/security.mdx]

Yarn's disabled-by-default installation-script policy changed at 4.14. The source generalized it to all Yarn 4; earlier releases differ. Inspect explicit `enableScripts` configuration and exceptions for the actual release.

[grafana/skills, check-npm, references/managers.md]

For npm, inspect `ignore-scripts` and the selected release's supported dependency-source and minimum-age controls. Do not treat an unknown option accepted in a config file as evidence that this manager enforces it. A required native build needs a reviewed package-specific decision, not a blanket enable-all switch.

## Sources and resolution

[grafana/skills, check-npm, references/protocols.md]

The source audit permits registry semver, workspace references, patches and registry aliases, while flagging git, remote tarballs, local file/link, executable and unknown protocols for review. This is its hardening policy, not a claim that every nonregistry protocol is malware. Inspect the resolved target of aliases and patches and the project's actual source policy.

[grafana/skills, check-npm, references/managers.md]

The source's minimum release-age policy is three days: 4,320 minutes for Yarn/pnpm, days for npm. It is a chosen risk window, not proof against compromise or permission to lower a stricter existing gate. Confirm option support and units in the installed version; do not silently substitute a version or add vendor exemptions.

## Report the boundary

[grafana/skills, check-npm]

Report the manager/version, configuration path and exact setting for each finding, its P0 to P3 consequence, the dependency/source involved and a proposed scoped change. Separate an unsupported control, an explicit exception and an observed violation. A read-only audit does not execute scripts or install a tool, and this skill does not authorize an installation.

## Prove it

The manager/version actually reads the cited configuration; permitted build scripts are explicit and reviewed; resolution sources and transitive changes are inspectable in the lockfile; age controls use the correct units and preserve stricter policy; and the report distinguishes observed enforcement from an unverified setting.
