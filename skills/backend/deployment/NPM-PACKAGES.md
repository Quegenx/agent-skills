# npm packages in a monorepo

How to add a workspace package, give it an exports map that resolves the same everywhere, version it from release notes, and publish it from CI with npm trusted publishing instead of a token. The method comes from c15t's own maintainer skills (`creating-a-package`, `releasing`; Apache-2.0), checked against the npm and Node docs. Signing and verifying other release artifacts is in [RELEASES.md](RELEASES.md); the Dart side of the same job is [dart PACKAGES.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/dart/PACKAGES.md).

## Create a package

[c15t, creating-a-package]

- **Copy the shape of an existing package rather than inventing one.** Name a template for each shape the repo has: a minimal one, one with a prebuild code-generation step and bundled docs, one with subpath exports, CSS entrypoints and browser tests.
- **package.json:** `"type": "module"`, `"sideEffects": false` where true, the licence, `repository.directory` set, and the same `version` as the linked group if the package will join it. `sideEffects` and `module` are bundler conventions (webpack, Rollup); Node's packages docs define neither and Node ignores them (https://nodejs.org/api/packages.html).
- **ESM-only exports map** pointing at build output: "no CJS build, no `require` condition, no `module` field; `default` mirrors `import` and must come last":

  ```json
  "exports": { ".": { "types": "./dist-types/index.d.ts", "import": "./dist/index.js", "default": "./dist/index.js" } },
  "main": "./dist/index.js", "types": "./dist-types/index.d.ts",
  "files": ["dist", "dist-types"]
  ```

- **Exports condition order matters.** Key order in a conditions object is significant. `"types"` "should always be included first" and `"default"` "should always come last" (https://nodejs.org/api/packages.html).
- **Standard scripts:** `build`, `dev` (watch, no type declarations, no clean), `check-types` (`tsc --noEmit`), `lint`, `fmt`, `test` (`vitest run`, "add `--passWithNoTests` until tests exist"). A package that ships to end users also runs a `prepack` artifact verification script.
- **Workspace dependencies use `"workspace:*"`.** Dev dependencies include the shared config packages (TypeScript config, and the Vitest config if the package is tested).
- **tsconfig extends the shared base.** "Don't relax strictness."
- **A generated version file** (`src/version.ts` written by a prebuild step) is gitignored.
- **Task runner:** the generic build, test and lint tasks cover most packages. "Add a package-specific entry only if outputs differ (e.g. bundled docs add `AGENTS.md` + `docs/**` to build outputs)", so the cache restores them.
- **Decide the release grouping now:** linked (versions together with the core packages) or independent (utilities). When a linked package must also be listed in a second place, a test fails when the two lists differ.
- **Bundled docs only for user-facing SDK packages:** a generator config entry, `"AGENTS.md", "docs"` in `files`, and a `build:docs` script. "Never edit generated `packages/*/docs`, `AGENTS.md` or `SKILL.md`" [c15t, writing-docs]; regenerate them.
- **Unused-export checks:** add a `knip.json` if the package has intentional unused-export patterns, and run knip.

Verify a new package (c15t's commands; swap in your package manager):

```bash
bun install
bun turbo run build check-types lint test --filter=@c15t/<name>
bun pm pack --dry-run --cwd packages/<name>
```

The pack dry run shows what the tarball will contain before anything is uploaded.

## Release notes and versions

[c15t, releasing] c15t runs this with its Tegami tool.

- **Read the changed packages' manifests to find the public ones.** "Private packages do not version or publish. Internal tooling and docs-site changes do not need release notes."
- **One note file per change,** with explicit `patch`, `minor` or `major` entries per package in YAML frontmatter. "Include a Markdown heading and describe the user-visible change."
- **Linked groups:** only the selected linked packages and their affected dependents release. "Name every intended package for a group-wide release"; don't turn on a sync-bump option to approximate linked behavior.
- **Leave replay-only notes in place.** "They preserve canary release notes for stable without applying another bump."
- **Never hand-edit generated release files.** "Do not hand-edit package `CHANGELOG.md` files or `.tegami/publish-lock.yaml`. Tegami generates both from release notes and package manifests."
- **Validate in a disposable checkout:** run the version step there (it "updates manifests, dependency ranges, changelogs, and lockfiles"), then a publish dry run "to validate without uploading. The dry run still queries registry and tag status."
- **Test the release code.** "Cover linked and independent bumps, dependency updates, note replay, canary base escalation, channel tags, and rejection of a publish lock from another branch."
- **One channel per release branch.** "Only `main` and `canary` release. `main` uses `latest`, and `canary` uses `canary` with `X.Y.Z-canary.N` versions." Each branch has its own version pull request: "A push opens or updates it, and merging it publishes."
- **Retry from the same commit.** The tool "skips published versions and finishes pending tasks. Once a newer commit lands on the branch, an older run does not release." "Do not discard an unfinished publish lock to force a new version PR."

## Pack once, publish the tarball

[c15t, releasing] "Keep the build and `check:publish-artifacts` hook before any upload. Bun packs packages and resolves workspace dependency ranges; npm publishes the tarballs with OIDC. Package `prepack` checks provide an additional artifact check."

This is [rule 1](SKILL.md#the-rules) applied to npm: pack once with the workspace-aware tool (so `workspace:*` becomes a real range), check that tarball, and publish that same tarball.

## Trusted publishing from CI

[c15t, releasing] "Keep publishing in `.github/workflows/release.yml` on `ubuntu-latest`, with `id-token: write`, npm 11.5.1 or newer, and `NPM_CONFIG_PROVENANCE=true`. npm trusted publishing binds to the workflow filename. Do not move publishing into the reusable CI workflow or add an npm token." Checked against https://docs.npmjs.com/trusted-publishers:

- **Versions:** "Trusted publishing requires npm CLI version 11.5.1 or later and Node version 22.14.0 or higher." The c15t skill names only the npm version; set the Node version too.
- **`id-token: write`** on the publishing job is the critical requirement.
- **Tied to the workflow file.** The trusted publisher is configured per package on npmjs.com with the repository and the workflow filename (with its extension); "All fields are case-sensitive and must be exact." Keep the publish step in that file: with `workflow_call`, validation checks the calling workflow's name instead of the workflow that contains the publish command, and `id-token: write` must be set in both parent and child.
- **Cloud-hosted runners only:** "Trusted publishing currently supports only cloud-hosted runners", which fits `ubuntu-latest`.
- **Provenance is automatic.** With trusted publishing from GitHub Actions or GitLab CI/CD, "npm automatically generates and publishes provenance attestations for your package. This happens by default - you don't need to add the `--provenance` flag." The c15t skill's `NPM_CONFIG_PROVENANCE=true` is redundant there, not wrong. Provenance needs a public repository and a public package.
- **Block token publishing.** npm goes further than "don't add a token": it strongly recommends restricting traditional token-based publishing, choosing "Require two-factor authentication and disallow tokens" in the package settings. That setting affects only token authentication; trusted publishers keep working. Set up trusted publishing and confirm it works first, then restrict tokens, then revoke the automation tokens you no longer need.
- **New package names need their own configuration** for the repository and workflow; existing packages keep theirs [c15t, releasing]. An unvalidated configuration expires 48 hours after creation unless its first successful publish lands first (https://github.blog/changelog/2026-10-02-unvalidated-npm-trusted-publishing-configurations-now-expire).

## Prove it

- `pack --dry-run` lists only the files in `files`, and the exports map has `types` first and `default` last.
- The release workflow publishes with no npm token in its secrets, and the published version shows a provenance attestation on npmjs.com.
- After switching the package to "disallow tokens", a publish with an old automation token fails while the workflow still publishes.
