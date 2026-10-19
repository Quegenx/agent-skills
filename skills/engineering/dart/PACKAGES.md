# Packages

Pub manages a Dart or Flutter package's dependencies, versions and publishing. The central rule: a project and all its transitive dependencies resolve to a single shared version of each package (two versions of a library would be unrelated types). Pub solves version ranges, not pins, to find that one version, so wide caret constraints keep resolution possible and a checked-in `pubspec.lock` keeps it reproducible. Runtime paths inside Dart code are in [CORE-LIBRARIES.md](CORE-LIBRARIES.md#paths-with-packagepath). Lints and analysis are in [ANALYSIS-AND-LINTS.md](ANALYSIS-AND-LINTS.md); Flutter-specific pubspec fields are in [flutter SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/SKILL.md).

**Contents:** [How resolution works](#how-resolution-works) · [Dependency sources](#dependency-sources) · [Version constraints](#version-constraints) · [Dev dependencies and overrides](#dev-dependencies-and-overrides) · [pubspec.yaml fields](#pubspecyaml-fields) · [Package layout](#package-layout) · [Upgrading and resolving conflicts](#upgrading-and-resolving-conflicts) · [Workspaces (monorepos)](#workspaces-monorepos) · [Publishing](#publishing) · [Automated publishing](#automated-publishing) · [Shipping agent skills with a package](#shipping-agent-skills-with-a-package) · [Paths with package:path](CORE-LIBRARIES.md#paths-with-packagepath) · [Changes by version](#changes-by-version) · [Prove it](#prove-it)

## How resolution works

- **A name plus a version identifies an immutable chunk of code.** Pub keeps a single copy of each package (not npm's multiple copies) and solves version ranges to avoid version lock. The algorithm is PubGrub.
- **Solving:** pub intersects all ranges and picks the most recent matching release. Example: `>=1.7.0`, `^1.4.0` and `<1.9.0` with releases up to 1.9.0 select 1.8.2. The selected version is a global property of the app; each app gets its own `.dart_tool/package_config.json`.
- **`pubspec.yaml` holds constraints; `pubspec.lock` holds the exact resolved versions and content hashes.** Pub stops touching the lockfile until told to. Check it into source control for an application package only.
- **Failure modes:** disjoint constraints, ranges with no released version, unstable graphs. Pub reports an error.
- **Where packages live:** `pub get` extracts dependencies to the global `$PUB_CACHE` and writes `.dart_tool/package_config.json`.

## Dependency sources

List only immediate dependencies; pub handles transitive ones.

| Source | Form | Notes |
|---|---|---|
| Hosted (pub.dev) | `transmogrify: ^1.0.0` | Any version from 1.0.0 up to but not including 2.0.0 |
| Hosted (custom server) | `transmogrify: hosted: https://some-package-server.com` plus `version: ^1.4.0` | Version optional but recommended (default `any`). SDK constraints below 2.19 must use the `'>=2.14.0 < 3.0.0'` form; below 2.15 need the verbose `hosted: name: url:` form |
| Git | `git: https://github.com/munificent/kittens.git` or SSH `git@github.com:...`; `ref:` (branch, tag, commit); `path:` within the repo | Pub calls `git clone`. `tag_pattern: v{{version}}` plus `version: ^2.0.1` (Dart 3.9+; the depending pubspec needs SDK constraint `^3.9.0` or later). Git LFS is supported natively since 3.12 (needs `git lfs`). Not allowed in packages uploaded to pub.dev |
| Path | `path: /Users/me/transmogrify` (relative to the pubspec directory allowed) | Changes are seen immediately. Can't publish with path dependencies |
| SDK | `flutter_driver: sdk: flutter` | Flutter is the only supported SDK; satisfiable only when run through the `flutter` executable |

- **Path to hosted workflow:** use a path dependency locally, publish the dependency, switch to hosted, then publish the main package.
- **Descriptors on the command line:** `dart pub add foo:^1.2.3`; flow style `{hosted: my-pub.dev, version: ^1.2.3}`, `{git: {url: ../foo.git, ref: branch, path: subdir}}`, `{path: ../foo}`, `{sdk: flutter}`. Dev dependencies: `dart pub add dev:test dev:mockito` (or `--dev`).

## Version constraints

- **Always use caret syntax** (since Dart 2.19): `^1.3.0` means `'>=1.3.0 <2.0.0'`; `^0.1.2` means `'>=0.1.2 <0.2.0'`. Allow the widest range that works.
- **Semantic versioning** (pub follows semver 2.0.0-rc.1, allowing build identifiers such as `+12345`). Before 1.0 the convention shifts down: from `0.1.2`, `0.2.0` is breaking, `0.1.3` a new feature, `0.1.2+1` no public API change. Avoid `+` after 1.0.0.

| Traditional constraint | Use? |
|---|---|
| `any` | No |
| `1.2.3` | No: limits adoption |
| `>=1.2.3` | Yes |
| `>1.2.3`, `<=1.2.3` | No |
| `<1.2.3` | No; only for a known non-working upper bound |

- **Quote constraints containing `>`:** `'>=1.2.3 <2.0.0'`.
- **Re-exported dependencies need tighter bounds:** if a package re-exports another package's API (`export 'package:collection/collection.dart'`), keep both bounds tight (for example `widgets: '>=1.2.0 <1.3.0'`, `collection: '>=2.4.0 <2.5.0'`).

## Dev dependencies and overrides

- **Regular or dev:** imported from `lib` or `bin` means a regular dependency; imported only from `test`, `example` and the like means a dev dependency. Dev dependencies of your dependencies are ignored. Hook dependencies (`hook/`) must be regular dependencies.
- **Dev dependency lower bounds:** set each one to the version in use (the docs say tighten to the latest, for example `build_runner: ^2.15.1`, `lints: ^6.1.0`, `test: ^1.31.1`).
- **`dependency_overrides`** (a path or an exact version such as `'3.2.1'`) is risky. Only the root package's overrides count, so they are ignored for users of your published package. In a workspace each package may have overrides, but a package can be overridden only once.
- **What an override does** ([ApparenceKit](https://apparencekit.dev/flutter-tips/pubspec-use-dependencies/)): when "different packages in your project might need different versions of the *same* underlying library", it means "temporarily forcing all references to use a specific version". Here, "even if `otherlib` normally uses `transmogrify` version `2.0.0`, the `dependency_overrides` makes sure the project uses version `3.2.1` for `transmogrify` everywhere":

```yaml
name: my_app
dependencies:
  transmogrify: 3.2.1
  otherlib: ^1.0.2
dependency_overrides:
  transmogrify: 3.2.1
```

  The source pins `transmogrify: 3.2.1` under `dependencies` too; the caret rule above still applies there.
- **`pubspec_overrides.yaml`** next to `pubspec.yaml` overrides `dependency_overrides`, `workspace` and `resolution` without committing temporary overrides. Usually don't commit it.

## pubspec.yaml fields

```yaml
name: newtify
description: >-
  Have you been turned into a newt?  Would you like to be?
  This package can help. It has all of the
  newt-transmogrification functionality you have been looking
  for.
version: 1.2.3
homepage: https://example-pet-store.com/newtify
documentation: https://example-pet-store.com/newtify/docs

environment:
  sdk: '^3.2.0'

dependencies:
  efts: ^2.0.4
  transmogrify: ^0.4.0

dev_dependencies:
  test: '>=1.15.0 <2.0.0'
```

| Field | Rules |
|---|---|
| `name` | Required. Lowercase with underscores `[a-z0-9_]`, a valid Dart identifier, not a reserved word. Search pub.dev first |
| `version` | Required for pub.dev. Three dot-separated numbers, optional build (`+1`, `+hotfix.oopsie`) or prerelease (`-dev.4`, `-alpha.12`, `-beta.7`, `-rc.5`). Omitted means `0.0.0`. Published versions are sealed |
| `description` | Required for pub.dev. English, 60 to 180 characters, plain text |
| `homepage`, `repository` | Provide one or both. `issue_tracker` defaults to GitHub issues when `repository` points to GitHub. Also `documentation`, `funding` |
| `environment` | Required. `sdk: ^3.0.0`; omitting it is an error ("pubspec.yaml has no lower-bound SDK constraint."). To use a feature, the lower bound must be at least the version that introduced it. `flutter: '>=3.22.0'`: Flutter enforces only the lower bound, except that since Dart 3.9 the root package's upper bound is respected (`flutter: 3.33.0` pins the SDK). Publishing with a Flutter constraint requires a Dart SDK constraint minimum of at least 1.19.0. Caret syntax in SDK constraints works only from Dart 2.19 |
| `executables` | `slidy: main`, or `fvm:` (value inferred from the key). The docs name it for `dart pub global activate`; the dart-lang CLI skill says it enables `dart run <command>` and the global symlinks for `dart install` |
| `platforms` | Dart 2.16+. Overrides pub.dev detection: `android:`, `ios:`, `linux:`, `macos:`, `web:`, `windows:`. For Flutter plugins it takes precedence over plugin declarations |
| `publish_to` | `none` prevents publishing, or a custom server URL |
| `false_secrets` | Dart 2.15+. Gitignore-style allowlist for the pre-publish secret leak check (`/lib/src/hardcoded_api_key.dart`, `/test/localhost_certificates/*.pem`). "Don't rely on leak detection." |
| `screenshots` | Up to 10, each with `description` (160 characters max) and `path`; 4 MB max per image; png, jpg, gif, webp; static or animated; the first is the thumbnail; no logos or branding |
| `topics` | At most 5; 2 to 32 characters; lowercase alphanumeric or hyphens; no `--`; start with a to z; end alphanumeric |
| `ignored_advisories` | `[GHSA-4rgh-jx4f-qfcq]` |
| `hooks` | `hooks: user_defines: my_package: enable_experimental: true` (see [FFI.md](FFI.md)) |
| `workspace`, `resolution` | See workspaces below |

- **Pub ignores all other fields;** give custom fields unique names (`my_pkg_bugs`). Flutter pubspecs have additional fields.
- **Comments silencing pubspec lints:** `# ignore: sort_pub_dependencies` above the line (Dart 3.3+).

## Package layout

- **Directories:** `.dart_tool/` (created by `pub get`; never commit; may be deleted any time), `benchmark/`, `bin/`, `doc/` (`doc/api/` from `dart doc`, don't commit), `example/`, `hook/build.dart`, `integration_test/`, `lib/` (`fix_data.yaml`, public libraries, assets such as `guacamole.css`, `src/`), `skills/<pkg>-<name>/SKILL.md`, `test/`, `test_fixes/` (`*_fix.dart` plus `*.dart.expect`), `tool/`, `web/`, then `CHANGELOG.md`, `LICENSE`, `pubspec.yaml`, `pubspec_overrides.yaml`, `pubspec.lock`.
- **`lib/` and `bin/` are public.** Name the main library after the package (`import 'package:enchilada/enchilada.dart';`). Only libraries go in `lib`: an entrypoint with `main()` there can't resolve `package:` imports. Put implementation in `lib/src`; never import another package's `lib/src`. Inside `lib` import relatively; from outside use `package:`.
- **Scripts:** `bin/` for public scripts, `tool/` for private dev scripts.
- **Tests:** in `test/`, named `*_test.dart`. `integration_test/` isn't run by `dart test` by default (`dart test integration_test`). See [TESTING.md](TESTING.md).
- **Examples:** in `example/` with `package:` imports. The pub.dev Example tab picks the first of `example/example[.md]`, `example[/lib]/main.dart`, `example[/lib]/<package_name>.dart`, `example[/lib]/<package_name>_example.dart`, `example[/lib]/example.dart`, `example/README[.md]`.
- **CHANGELOG.md:** one heading per version, all level 1 or all level 2, the heading text containing the version (optionally prefixed with "v"). It fills the Changelog tab. "The first heading must match the version you're publishing (`## 1.0.0`), or pana will complain" ([ApparenceKit](https://apparencekit.dev/blog/flutter-create-plugin/)).
- **Tool caches:** `.dart_tool/<tool_package_name>/` is reserved for that package (package:build uses `.dart_tool/build/`). A CLI's transient cache goes there, never in the project root.

## Upgrading and resolving conflicts

**Read `dart pub outdated`:**

| Column | Meaning |
|---|---|
| Current | The version in `pubspec.lock` |
| Upgradable | The latest allowed by the pubspec constraints; `dart pub upgrade` resolves to it. Needs no pubspec change |
| Resolvable | The latest that resolves with all other dependencies. Needs a constraint change |
| Latest | The latest published version, excluding prereleases |

Also look for retracted or discontinued packages in the output. "An asterisk `[*]` next to a package name means the version you have is not the newest one" ([ApparenceKit](https://apparencekit.dev/flutter-tips/check-outdated-flutter-packages/)); in its own sample the `*` sits before the Current version, as in `adaptive_dialog      *1.3.0   1.4.0       1.4.0       1.4.0`. The same source runs `flutter pub outdated` in CI (for example weekly on the main branch), extracts the output as JSON and sends a notification (such as an email) when updates exist; it names no flag.

**Upgrade:**

1. **To Upgradable:** `dart pub upgrade`, then `dart pub upgrade --tighten` to raise the lower bounds in pubspec.yaml (example: `http: ^0.13.0` plus `dart pub upgrade --tighten http` gives `http: ^0.13.5`).
2. **To Resolvable (a major bump):** edit the constraint by hand (for example `^0.11.0` to `^0.12.1`), then `dart pub upgrade`.
3. **Then** run `dart analyze` and fix breaking API changes, then `dart test` and fix regressions. Test whenever you update.

**Before publishing,** test with downgraded dependencies: `dart pub downgrade`, `dart analyze`, `dart test`.

**Conflicts and retracted versions:**

- **NEVER delete the entire `pubspec.lock` and run `dart pub get`.** It causes uncontrolled upgrades across the whole dependency graph.
- **Instead** delete only that package's block in `pubspec.lock` (for example the `package_a` block with `dependency: "direct main"`, `source: hosted`, `version: "1.0.0"`), leave the rest, and run `dart pub get`. Check with `dart pub deps`. If resolution still fails, find the transitive dependency causing the lock, update its constraint in pubspec.yaml, and retry.
- **Moving off a retracted version:** `dart pub upgrade <package>`, or `dart pub downgrade <package>` then `upgrade`, or delete its lockfile entry as above. To keep using it, keep it in `pubspec.lock` or pin it in `dependency_overrides`.

**CI integrity:** `dart pub get --enforce-lockfile` requires the pubspec to be satisfied, `pubspec.lock` to be present and content hashes to match. `dart pub check-resolution-up-to-date` (3.13) checks resolution freshness.

**Cache:** `dart pub cache gc` (3.11) deletes cache entries not used by living projects (pub get records project paths since 3.9). `dart pub cache repair` repairs only packages in the current `pubspec.lock` unless `--all` (breaking in 3.12). `dart pub cache preload` (3.13) loads from a `.tar.gz`.

## Workspaces (monorepos)

Dart 3.6+. A workspace gives all member packages one shared resolution, which reduces analysis memory (separate packages get separate analysis contexts). Shared resolution raises conflict risk (one version per package), which the docs call "a useful feature" for packages used together. Without a workspace each package runs `pub get` separately and can drift.

```yaml
name: _
publish_to: none
environment:
  sdk: ^3.6.0
workspace:
  - packages/shared
  - packages/client_package
  - packages/server_package
```

- **Each member** declares `environment: sdk: ^3.6.0` and `resolution: workspace`. All workspace packages (not their dependencies) need an SDK constraint of `^3.6.0` or later.
- **`dart pub get` anywhere** creates one root `pubspec.lock` and one `.dart_tool/package_config.json`, deleting the members' copies. Stray `pubspec.lock` and `package_config.json` files between root and members are deleted; a non-member `pubspec.yaml` in between is an error.
- **Globs (Dart 3.11+):** `workspace: - packages/*` (subdirectories with a pubspec.yaml). **Nested workspaces:** a member can declare its own `workspace:` (the root then lists only `packages/server`).
- **Interdependencies** resolve to the local member, which must still satisfy the constraint (`shared: ^2.3.0`); consumers outside the workspace get the hosted version.
- **Overrides:** every member's `dependency_overrides` counts, a package may be overridden once; prefer the root.
- **Commands:** `dart pub -C packages/client_package publish`; resolve one member alone with a `pubspec_overrides.yaml` containing `resolution:`; `dart pub workspace list` (with `--json` since 3.13).

## Publishing

- **"Publishing is forever."** pub.dev disallows unpublishing except in very few cases. Mark abandoned packages *discontinued* instead (Admin tab, optional "Suggested replacement"; reversible).
- **Requirements:** a `LICENSE` file (BSD 3-clause recommended); the legal right to redistribute; size under 100 MB gzipped and 256 MB uncompressed recommended (split, `.pubignore`, fewer resources); only hosted dependencies from the default server and SDK dependencies (`sdk: flutter`); a Google Account. The page comes from `README.md`, `CHANGELOG.md` (own tab) and `pubspec.yaml`.
- **Files published:** everything under the root except hidden (dot) files and directories and those ignored by `.pubignore` or `.gitignore`. A `.pubignore` in a directory makes pub ignore that directory's `.gitignore`.
- **Check first:** `dart pub publish --dry-run` validates the pubspec and layout and lists the files ("Package has 0 warnings."). `dart pub publish` also checks that `git status` is clean (warns on uncommitted tracked changes). `flutter pub publish` "works too: it's the same command routed through the Flutter CLI" ([ApparenceKit](https://apparencekit.dev/blog/flutter-create-plugin/)).
- **Score it with pana before publishing.** pub.dev says pub points "are awarded in six categories" but heads five: Follow Dart file conventions, Provide documentation, Platform support (with "Support modern toolchains (SwiftPM and Wasm)": web packages get more points if they are Wasm ready, and iOS or macOS plugins "will only receive full score if they support Swift Package Manager"), Pass static analysis, and Support up-to-date dependencies (https://pub.dev/help/scoring). pana computes the same score locally ([ApparenceKit](https://apparencekit.dev/blog/flutter-create-plugin/): "the same analyzer"). It modifies the directory it runs on, so the scoring page runs it on a copy:

```
cp ~/dev/mypkg ~/tmp/mypkg
dart pub global activate pana
dart pub global run pana ~/tmp/mypkg
```

  Re-run the `activate` command now and then, since pana changes frequently (same page). [ApparenceKit](https://apparencekit.dev/blog/flutter-create-plugin/) runs `dart pub global run pana .` in the project root after committing or stashing ("pana can modify files (e.g. format Dart code)"), calls it "a **160-point scale**" and lists a sixth category, "Support sound null safety ... with a Dart 2.12+ lower bound". The scoring page states no total and has no null-safety category, and Dart 3 enforces null safety anyway ([LANGUAGE.md](LANGUAGE.md#null-safety)), so that article (no Dart version stated) is out of date there.
- **Verified publisher (recommended):** a verified domain, hides your personal email, shows a badge. Create one from the pub.dev user menu "Create Publisher" with Google Search Console DNS verification, then invite org members. `dart pub publish` can't publish a *new* package straight to a publisher: publish to a Google Account, then transfer (irreversible; you must be uploader and publisher admin; Admin tab "Transfer to Publisher").
- **Uploaders:** the first publisher is the only uploader; manage them at `https://pub.dev/packages/<package>/admin` or transfer to a verified publisher.
- **Prereleases:** `2.0.0-dev.1`; `2.0.0` takes precedence; users opt in with `^2.1.0-dev.1`; a prerelease doesn't affect score, search or README. A preview version is a stable package version depending on a prerelease SDK (`sdk: '^3.0.0-417.1.beta'`).
- **Retraction (Dart 2.15+):** possible within 7 days of publication and restorable within 7 days; it is not deletion (a "RETRACTED" badge). Prefer publishing a new version unless the constraints were missing or lax.
- **Disable personal-credential publishing:** the pub.dev "Enable manual publishing" checkbox (3.10).
- **Doc pages:** pub.dev docs support `<callout-box>` and `{@example /example/foo.dart#abc}` (3.13); writing them is in [STYLE-AND-DOCS.md](STYLE-AND-DOCS.md).

## Automated publishing

Publish from Google Cloud Build, or anywhere with a GCP service account, through temporary OIDC tokens (no long-lived secret; exported service-account keys are long-lived and riskier). Only for existing packages: the first version must go out with `dart pub publish`.

**Google Cloud Build:** create service account `pub-dev@$PROJECT_ID.iam.gserviceaccount.com` and enable it on the pub.dev Admin tab; `gcloud services enable iamcredentials.googleapis.com`; grant `roles/iam.serviceAccountTokenCreator` to `$PROJECT_NUMBER@cloudbuild.gserviceaccount.com`. In `cloudbuild.yaml`, run `gcloud auth print-identity-token --impersonate-service-account=... --audiences=https://pub.dev --include-email > /secrets/temporary-pub-token.txt` (the token expires within 1 hour; don't store it in `/workspace`), then `cat ... | dart pub token add https://pub.dev` and `dart pub publish --force`. Optionally require build approval (Cloud Build Approver role).

## Shipping agent skills with a package

- **Authors** put Agent Skills (agentskills.io spec) in a top-level `skills/` directory; `dart pub publish` bundles them. Each skill directory must start with the package name (or the name with underscores as hyphens) plus a hyphen: `shelf-routing`, `my_package-routing`, `my-package-routing` are valid; `routing`, `other_pkg-routing` are skipped. Each has a `SKILL.md` with frontmatter `name: <package_name>-<skill_name>` and `description`, then Guidelines and Examples; optional `scripts/`, `references/`, `assets/`. `.agents/skills/` is for internal maintainer skills and isn't distributed.
- **Scaffold:** `dart run skills@ create -n <skill_name> -d "<skill_description>"`. Test via a sample project with a path dependency, then `dart run skills@ get`.
- **Best practices:** one skill per major feature area; prescriptive rules ("Always use X before calling Y"); complete code examples; `SKILL.md` under 500 lines (extras into `references/` or `assets/`); version skills with the package.
- **Consumers:** `dart run skills@ get` scans immediate dependencies interactively (`-p <package>`, `-s <skill>`, `--all`/`-a`; in a workspace it covers all members); `dart run skills@ add <git_repository_url> [--all]`; `list`; `prune` (skills of removed dependencies); `remove -p <package>`. Skills install into the agent directory such as `.agents/skills/`. Commit `.config/dart_skills/` together with `.agents/skills/`, or ignore both. Local modifications are detected and you choose overwrite or keep.

## Paths with package:path

Runtime path operations and the path-refactoring checklist are in [CORE-LIBRARIES.md](CORE-LIBRARIES.md#paths-with-packagepath).

## Changes by version

| Version (date) | Pub change |
|---|---|
| 3.13 (2026-08-12) | `dart pub workspace list` with `--json`, `dart pub check-resolution-up-to-date`, `dart pub cache preload` |
| 3.12 (2026-05-18) | Git dependencies with Git LFS; breaking: `dart pub cache repair` only repairs packages in the current lockfile unless `--all` |
| 3.11 (2026-02-11) | Workspace globs (`pkg/*`); `dart pub cache gc` |
| 3.10 (2025-11-12) | pub.dev "Enable manual publishing" checkbox; build hooks stable |
| 3.9 (2025-08-13) | Git `tag_pattern`; the root package's `flutter` constraint upper bound is respected; pub get records project paths |
| 3.6 (2024-12-11) | Workspaces |

The 3.12 blog post is dated 2026-05-20 while What's new says May 18, 2026.

## Prove it

- **`dart pub get --enforce-lockfile`** succeeds in CI, and `pubspec.lock` is committed for applications only.
- **`dart pub outdated`** shows no retracted or discontinued packages, and every constraint uses caret syntax.
- **Before a release:** `dart pub downgrade`, `dart analyze` and `dart test` pass; then bump with `dart pub upgrade --tighten`.
- **Before publishing:** `dart pub publish --dry-run` ends with "Package has 0 warnings.", the package has a `LICENSE`, no git or path dependencies remain, and pana run on a copy of the package reports no lost points you can fix.
- **In a workspace:** there is exactly one `pubspec.lock`, at the root, and `dart pub workspace list` names every member.
