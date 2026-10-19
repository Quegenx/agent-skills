---
name: dart
description: "Writes Dart 3 the way dart.dev and the Dart team's skills prescribe: language versions, class modifiers, sealed types, extension types, dot shorthands and null safety, records and pattern matching, primary and concise constructors, futures, streams and isolates, core library APIs (DateTime across daylight saving, map kinds, copying collections, JSON pretty-printing, Function.apply), Effective Dart style, documentation, usage and API design, analysis_options.yaml, lints, dart fix and dart format, the Dart and Flutter MCP server, unit tests, mockito, package:checks and coverage, pub dependencies, workspaces and publishing, package:path, CLI apps with package:args, exit codes and compiled binaries, FFI with build hooks and ffigen, and the release history with breaking changes. Use when writing, reviewing or upgrading Dart code, setting up lints or tests for a Dart or Flutter package, resolving pub conflicts, publishing to pub.dev, building a command-line tool, or calling C code from Dart."
---

# Dart

Dart code, its tools and its packages, for pure Dart and for the Dart inside a Flutter app. A package's language version is the lower bound of `environment.sdk` in its `pubspec.yaml`, not the SDK binary you run, and that one value decides which features compile (patterns need 3.0, dot shorthands 3.10, primary constructors 3.13), which breaking changes apply and how `dart format` lays out the code. Current stable is 3.13.5 (2026-09-29). Widgets, Flutter testing, builds and app releases are in [flutter SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/SKILL.md).

Apply only the routes and checks for the selected job. Read a linked skill's named file from its installed folder when available, or from the linked source. Report an unavailable required reference instead of inventing it. [skill-authoring, DISTRIBUTION.md#composing-skills]

| The job | Read |
|---|---|
| Feature minimums per language version, class modifiers, `sealed` and exhaustive switches, modifiers in a published API, extension methods, extension types, dot shorthands, null safety and `late` | [LANGUAGE.md](LANGUAGE.md) |
| Records, where patterns appear, switch statement or expression, every pattern type, picking a pattern, anti-patterns, JSON validation | [RECORDS-AND-PATTERNS.md](RECORDS-AND-PATTERNS.md) |
| Primary constructors (3.13), concise `new` / `factory` syntax, private named parameters (3.12), the 3.13 `extraneous_modifier` break, migration and diagnostics | [CONSTRUCTORS.md](CONSTRUCTORS.md) |
| `async` / `await`, `Future.wait` and `.wait` with `ParallelWaitError`, `Future.any`, the Future API and `catchError` chains, using and creating streams, `StreamController`, `Isolate.run`, long-lived isolates and ports | [ASYNC.md](ASYNC.md) |
| Adding days across daylight saving, `HashMap` / `LinkedHashMap` / `SplayTreeMap` and map operations, shallow and deep copies of lists and maps, immutable collection packages, `JsonEncoder.withIndent`, `Function.apply`, runtime paths with `package:path` | [CORE-LIBRARIES.md](CORE-LIBRARIES.md) |
| Effective Dart Style and Documentation: identifier casing, import ordering, `dart format`, comments, `///` doc comments, references, `{@example}` | [STYLE-AND-DOCS.md](STYLE-AND-DOCS.md) |
| Effective Dart Usage and Design: imports, null, strings, collections, functions, members, constructors, error handling, async, naming APIs, privacy, classes, types, parameters, equality | [USAGE-AND-DESIGN.md](USAGE-AND-DESIGN.md) |
| `analysis_options.yaml`, strict modes, lint sets and their rules, severities and suppression, formatter settings, analyzer plugins, `dart analyze`, `dart fix`, `dart format`, fixing errors, and a pointer to shared MCP setup | [ANALYSIS-AND-LINTS.md](ANALYSIS-AND-LINTS.md) |
| `package:test`, layout, running and selecting tests, platforms, skips, timeouts and tags, `dart_test.yaml`, mockito, migrating to `package:checks`, coverage | [TESTING.md](TESTING.md) |
| Pub resolution, dependency sources, version constraints, overrides, pubspec fields, package layout, upgrading and conflicts, workspaces, publishing and automated publishing, shipping agent skills | [PACKAGES.md](PACKAGES.md) |
| The `dart` command, CLI project setup, exit codes, stdout and stderr, `package:args`, stack traces, subprocesses and finding the SDK, signals, testing CLIs, `dart run`, `dart install`, `dart build` and `dart compile` | [CLI-APPS.md](CLI-APPS.md) |
| Build hooks and native assets, compiling C locally with tree shaking, precompiled downloads with hash checks, generating bindings with ffigen, shipping | [FFI.md](FFI.md) |
| Current channels, release dates, language version rules, changes and breaking changes per version, experiments, why macros will not ship, upgrading old code | [VERSIONS.md](VERSIONS.md) |

## The rules

1. **Check the package's language version before using a feature:** the `environment.sdk` lower bound must be at least the version that introduced it, per package, even inside a workspace.
2. **Keep analysis clean:** an `analysis_options.yaml` at the package root that includes `package:lints/recommended.yaml` (or `package:flutter_lints/flutter.yaml`), then `dart analyze`, `dart fix --dry-run` before `dart fix --apply`, and `dart format`, whose output is the official whitespace style.
3. **Await every future or leave it unawaited on purpose,** catch errors where the `await` or the stream listener is, and move long synchronous work off the main isolate with `Isolate.run` so the UI does not jank.
4. **Use patterns where they replace `is` / `as` chains and length checks,** switch exhaustively over `sealed` families, and fail fast with `FormatException` on malformed data instead of letting an `if-case` skip it.
5. **Test through constructor-injected dependencies:** tests under `test/` mirroring `lib` with a `_test.dart` suffix, mocks from `@GenerateNiceMocks`, and `thenAnswer` (never `thenReturn`) for anything returning a `Future` or `Stream`.
6. **Never delete the whole `pubspec.lock` to fix a conflict;** delete only the conflicting package's block and run `dart pub get`. Use caret constraints with the widest range that works, and commit `pubspec.lock` for applications only.
7. **In a CLI, set `exitCode` and let `main()` return instead of calling `exit()`,** which skips `finally` blocks, drops buffered output and zeroes coverage. Send results to `stdout` and errors and usage to `stderr`, and find `dart` with `package:cli_util`, never `Platform.resolvedExecutable`.
8. **Never hand-write FFI bindings when headers exist:** generate them with ffigen, build native code through build hooks and `package:native_toolchain_c`, and use `dart build` (not `dart compile exe`) once any dependency has hooks.

## Prove it

`dart analyze --fatal-infos` exits 0; `dart format -o none --set-exit-if-changed .` exits 0; `dart test` passes; `dart pub get --enforce-lockfile` succeeds in CI; every package's `environment.sdk` lower bound covers the features its code uses; and every file's own Prove it checks pass for the parts you touched.
