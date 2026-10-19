# Dependency audit

Source: [grafana/skills, audit-and-reduce-dependencies]. This is an evidence-based package-footprint audit. Module direction remains in [DEPENDENCIES.md](DEPENDENCIES.md), and installation policy in [secure-coding PACKAGE-INSTALLS.md](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/secure-coding/PACKAGE-INSTALLS.md).

## Establish the package contract

[grafana/skills, audit-and-reduce-dependencies]

- Inventory manifests, workspace membership, direct dependency sections, the selected package manager/version, lockfile and existing installation policy.
- Preserve the manager, workspace layout, lockfile and dependency-range style. The supplied workflow is pnpm-specific; it does not authorize migrating another project to pnpm.
- Record the existing verification commands and what is actually authorized. A dependency audit does not itself authorize installs, tests or builds.
- Establish measured direct counts, lockfile/package counts and installed size when available. Missing node_modules is not a reason to invent its size.
- Review installation boundaries before mutating manifests or the lockfile; do not weaken script, protocol or release-age policy to make cleanup easier.

## Prove usage before removal

[grafana/skills, audit-and-reduce-dependencies]

An unused-dependency tool proposes candidates, not proof. Check each candidate's imports and subpaths, dynamic loading, configuration, scripts, generated-code hooks, framework/plugin conventions, CLI/bin use, fixtures, peer and optional requirements, and published package contracts.

When use remains only in tooling, moving a declaration between runtime and development sections can be more accurate than removal. Do not inline security, parsing, crypto, Unicode, URL, date/time, locale or compatibility behavior merely because the call site is small.

## Measure total and exclusive closure

[grafana/skills, audit-and-reduce-dependencies]

- **Total closure:** every transitive lockfile entry reachable from a direct dependency.
- **Exclusive closure:** entries that disappear when that dependency is removed because no other retained direct dependency needs them.
- Rank by exclusive impact and risk as well as total size. Shared transitive cost is not all removable.
- If a controlled removal/install experiment is authorized, preserve the starting manifest and lockfile and restore both before measuring the next candidate. Never discard pre-existing user changes.
- Compare compatible direct ranges before introducing overrides. A dedupe can change transitive resolution and behavior; it is not cosmetic formatting.

## Keep, replace or remove

[grafana/skills, audit-and-reduce-dependencies]

Use the source's decision labels: Keep, Replace-with-Better, Replace-with-Internal, Remove or Needs-user-review. They are decisions, not a severity scale; findings still use P0 to P3.

For each nontrivial package, record its name/version, owning manifest section, usage evidence, total/exclusive closure, proposed exact change, rationale, verification limits and unresolved consumers. New direct dependencies or swaps need the user's authorization. Native APIs or deletion can be candidates when behavior is fully characterized; e18e suggestions remain candidates rather than automatic migrations.

Work in small reviewable batches, compare measured before/after footprint and retain the established install protections. Do not promise a smaller or safer result from package popularity or an unmeasured tree.

## Prove it

Each removal has evidence across imports, dynamic/config/CLI/peer/public consumers; shared and exclusive costs are separate; manifests and lockfile preserve the project's manager/workspace policy; every replacement has an authorized behavior contract; and the report states measured impact and actual verification.
