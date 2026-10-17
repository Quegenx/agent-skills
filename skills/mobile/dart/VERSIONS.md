# Dart versions

Each Dart minor version is also a *language version*, and a package's language version is the lower bound of `environment.sdk` in its `pubspec.yaml`, not the SDK binary you run. That one rule decides whether a feature compiles, which breaking changes apply and how `dart format` formats the code. This file gives the current channels, the release history with dates, breaking changes and deprecations per version, experiments, and the status of macros. Unmarked items come from dart.dev and the dart-lang SDK CHANGELOG. Items marked *(third-party)* come only from RandalSchwartz's dart-sdk-changelog skill and were not confirmed on dart.dev; where it and dart.dev differ, both are given. Language details are in [LANGUAGE.md](LANGUAGE.md), [RECORDS-AND-PATTERNS.md](RECORDS-AND-PATTERNS.md) and [CONSTRUCTORS.md](CONSTRUCTORS.md); lint changes in [ANALYSIS-AND-LINTS.md](ANALYSIS-AND-LINTS.md).

**Contents:** [Current channels](#current-channels) · [Release dates](#release-dates) · [Language version and minimum SDK](#language-version-and-minimum-sdk) · [Changes by version](#changes-by-version) · [Dart 2 milestones](#dart-2-milestones) · [Experiments](#experiments) · [Macros](#macros) · [Upgrading old code](#upgrading-old-code) · [Prove it](#prove-it)

## Current channels

As of 2026-10-17 (dart-archive VERSION files):

| Channel | Version | Date |
|---|---|---|
| stable | 3.13.5 | 2026-09-29 |
| beta | 3.14.0-315.1.beta | 2026-10-07 |
| dev | 3.15.0-27.0.dev | 2026-10-13 |

- **Check live values** at `https://storage.googleapis.com/dart-archive/channels/<stable|beta|dev>/release/latest/VERSION` and the stable CHANGELOG at https://github.com/dart-lang/sdk/blob/stable/CHANGELOG.md.
- **3.13 patch releases:** 3.13.1 (2026-08-18); 3.13.2 (2026-08-25: deprecates the legacy analyzer plugin system, sdk#62164; fixes a `dart format` crash on enums with primary constructors); 3.13.3 (2026-09-01: Windows to Linux cross-compilation with link hooks, #63953); 3.13.4 (2026-09-15: dart2js crash with `--merge-fragments-threshold` and `--minify`, #64150); 3.13.5 (2026-09-29: dart2wasm TFA removing reachable methods with static JS interop calls, #64153). The stable CHANGELOG already lists an undated 3.13.6 (dart2js emitting several JS calls for one Dart call, #64410).
- **Bundled in Flutter** *(third-party)*: Flutter 3.47.6 stable reports `Tools • Dart 3.13.5 • DevTools 2.60.0`; Flutter 3.49 beta bundles Dart 3.14. Run `flutter --version` to see the bundled Dart.

## Release dates

dart.dev "What's new" dates, with the Flutter release that bundles each version *(third-party matrix, months only)*:

| Dart | Released (dart.dev) | Flutter *(third-party)* |
|---|---|---|
| 3.14 | beta only | 3.49 beta, September 2026 |
| 3.13 | Aug 12, 2026 | 3.47, October 2026 |
| 3.12 | May 18, 2026 | 3.44, May 2026 |
| 3.11 | Feb 11, 2026 | 3.41, February 2026 |
| 3.10 | Nov 12, 2025 | 3.38, November 2025 |
| 3.9 | Aug 13, 2025 | 3.35, August 2025 |
| 3.8 | May 20, 2025 | 3.32, May 2025 |
| 3.7 | Feb 12, 2025 | 3.29, February 2025 |
| 3.6 | Dec 11, 2024 | 3.27, December 2024 |
| 3.5 | Aug 6, 2024 | 3.24, August 2024 |
| 3.4 | May 14, 2024 | 3.22, May 2024 |
| 3.3 | Feb 15, 2024 | 3.19, February 2024 |
| 3.2 | Nov 15, 2023 | 3.16, November 2023 |
| 3.1 | Aug 16, 2023 | 3.13, August 2023 |
| 3.0 | May 10, 2023 | 3.10, May 2023 |

- **Date disagreements.** For 3.13, dart.dev says August 12, 2026 (blog the same day) while the third-party matrix dates Flutter 3.47 to October 2026. Inside dart.dev: the language evolution page says 3.11 was "Released 9 February 2026" against February 11 on What's new and the blog; the 3.12 blog is dated 2026-05-20 against May 18; the 3.9 blog 2025-08-14 against August 13. Confirm on https://dart.dev/resources/whats-new.

## Language version and minimum SDK

- **The lower bound of `environment.sdk` sets the language version** (`major.minor`): `sdk: '>=2.18.0 <3.0.0'` means language 2.18. Patch numbers never change the grammar, and patch releases cannot add language features. Minor versions may introduce breaking changes.
- **An SDK supports its own language version and every earlier one in the same major** (2.18.3 supports 2.0 to 2.18, not 1.x). A 3.13 feature fails with lower bound `3.12.0` even when the local SDK is 3.13.0 *(third-party)*.
- **Per-library override:** `// @dart = 2.17`. It must be a `//` comment (not `///` or `/*`) before any Dart code; other comments may precede it. It cannot be higher than the current SDK *(third-party)*.
- **Tooling follows the language version too:** `dart format` may format a library differently depending on its language version. `dart format --version --verbose` shows the supported language versions.
- **Analyzer message when the version is too low** *(third-party)*: `"This requires the '<feature>' language feature. Try updating your pubspec.yaml SDK constraint to '>=X.Y.0 <4.0.0'."`
- **Library APIs:** check `@Since('X.Y')` in the SDK sources or the "Libraries" section of the CHANGELOG *(third-party)*.
- **CI matrix example** *(third-party)*: `dart: ['3.12.0', 'stable', 'beta']`, verified with `dart analyze` and `dart test`.
- **Since 3.9, pub respects the upper bound of the root package's `flutter` constraint** (for example `flutter: 3.33.0` pins the SDK; the third-party skill's example is `flutter: '>=3.30.0 <=3.33.0'`).
- **Per-version change lists:** https://dart.dev/changelog and https://github.com/dart-lang/sdk/blob/main/CHANGELOG.md. The breaking-changes page (https://dart.dev/resources/breaking-changes) is itself deprecated in favor of the changelog.

## Changes by version

### 3.15 (dev, unreleased)

- **Type promotion of `this`** (needs `sdk: '^3.15.0'`) and the lint `unnecessary_this_alias`. The third-party skill lists `this-promotion` as a gated experiment.

### 3.14 (beta, unreleased)

- **Breaking:** unships the experimental `Isolate.runSync`, `Isolate.create`, `Isolate.shutdownSync`, `Isolate.pinToCurrentThread`, `Isolate.isPinnedToCurrentThread`, `Isolate.runEventLoopSync`, `Isolate.onEvent` and `Isolate.handleEvent`, "accidentally exposed in Dart 3.13" (#64285). The third-party skill presents them as 3.13 features.
- **Breaking:** `toString()` on SIMD types (`Float32x4`, `Int32x4`, `Float64x2`) returns `'V128'`, also in `Error.safeToString` and debugger views (sdk#63847).
- **IEEE 754 `min` / `max`** for `Float32x4` / `Float64x2`.
- **macOS process spawning uses `posix_spawn`:** `PATH` resolves from the parent's `PATH`, so use absolute executable paths in `Process.start` / `Process.run`.
- *(third-party)* `rangeEquals` on typed-data lists and `ByteData` (sdk#64095): `final matches = headerA.rangeEquals(headerB, start: 0, end: 4, otherStart: 0);`. `Int32x4.splat`, `Int32x4.zero()`, bitwise and comparison lane ops. `dart:js_interop` additions (`JSArray.fromAsync`, `JSPromise.resolve` / `reject`, list conversions, `toJSVarArgs`); `Future.toJS` forwards JS errors unwrapped (sdk#61353). `NativeFinalizer.callback` (sdk#63811). New analyzer diagnostic `js_interop_extension_constructor_js_annotation_has_no_effect` (sdk#54366). Formatter fixes for enums with primary constructors (dart_style #1885, #1888).
- *(third-party)* **Deprecation:** `dart:mirrors` annotated `@deprecated`, removal planned in a future major release (sdk#44489). The skill names macros among the alternatives; the Dart team says macros will not ship (see [Macros](#macros)).

### 3.13 (stable, Aug 12, 2026)

- **Language:** primary constructors and concise constructor syntax (experiment `primary-constructors` in 3.12, graduated in 3.13, as was `record-use`). See [CONSTRUCTORS.md](CONSTRUCTORS.md).
- **Breaking (language versioned):** `final` / `var` on a non-declaring parameter is the error `extraneous_modifier`. Type promotion in inner generator functions adjusted (soundness fix, #62889).
- **Libraries:** `Future.pause`, `List.unmodifiableOf`, `Map.unmodifiableOf`, `int.trailingZeroBitCount`, `int.oneBitCount`. `NetworkInterface.addresses` returns `List<InterfaceAddress>` (with `prefixLength` and `broadcast` *(third-party)*). `InternetAddress.lookup` rejects inet_aton-style IPv4. `JSFunction` / `JSExportedDartFunction` are generic. File timestamps keep microsecond precision.
- **Runtime breaking:** built-in fallback root certificates removed; use `--root-certs-file` / `--root-certs-cache`.
- **Lints:** new `no_raw_types` (replaces the `strict-raw-types` analysis option) and `no_dynamic_casts` (replaces `strict-casts`); new `empty_container_bodies`, `initialize_in_field_declaration`, `unnecessary_const_in_enum_constructor`, `unnecessary_primary_constructor_body`, `unnecessary_type_name_in_constructor`, `use_declaring_parameters`, `async_return_with_no_await`, and experimental `use_primary_constructors`. **Deprecated:** `avoid_private_typedef_functions`, `one_member_abstracts`. dart.dev's analysis page and Effective Dart had not caught up (still `strict-casts` / `strict-raw-types` and the two deprecated lints).
- **Formatter (language-versioned 3.13):** block-formatted parameter lists and `as` / `is` / `is!`; blank lines between import sections (no sorting); call chains on single-element targets split; blank lines around `mixin` / `extension type` without a `;` body; trailing comma in split extension type representation clauses. *(third-party)* `if-case` guards split when the pattern block-splits.
- **Tools:** `dart pub workspace list` (`--json`), `dart pub check-resolution-up-to-date`, `dart pub cache preload` (from `.tar.gz`), `dart build cli --target-os` / `--target-arch`. Wasm deferred loading preview: `dart compile wasm -O2 --enable-deferred-loading`. `@RecordUse()` with `package:record_use` for native tree-shaking in `hook/link.dart`.

### 3.12 (May 18, 2026)

- **Language:** private named parameters; primary constructors as an experiment (`dart run --enable-experiment=primary-constructors bin/main.dart`).
- **Breaking:** `dart pub cache repair` repairs only packages in the current `pubspec.lock` unless `--all`; dart2wasm deferred loader API `loadDeferredModules` (array) plus `instantiator`; dart2js `JSExportedDartFunction.toDart` throws for non-`toJS` wrappers; `isA` moved to `NullableObjectUtilExtension`.
- **Tools:** pub supports git dependencies with Git LFS (needs `git lfs`). `dart info record-performance`. *(third-party)* `dart run my_tool@^1.2.0` runs a tool without `pub global activate`; `dart pub add http@^1.2.0`; `RegExp` modifier spans `(?i:...)`; new lint `simple_directive_paths`; `@mustBeConst` warns when its function is torn off.
- **Also announced:** Genkit Dart preview (`package:genkit`, `genkit_google_genai`, `genkit_anthropic`) and experimental Dart in Cloud Functions for Firebase.

### 3.11 (Feb 11, 2026)

- **No language changes.**
- **Breaking:** importing `dart:js_util` or `package:js` is a compile error under Wasm; migrate to `dart:js_interop`.
- **Deprecated lints:** `avoid_null_checks_in_equality_operators`, `prefer_final_parameters`, `use_if_null_to_convert_nulls_to_bools`.
- **Tools:** pub workspace globs (`pkgs/*`, needs 3.11+); `dart pub cache gc`; MCP server tool `read_package_uris`. *(third-party)* AF_UNIX sockets on Windows: `File(socketPath).existsSync()` is `false` on Windows and `true` on POSIX, so use `FileSystemEntity.typeSync()`; `dart pub publish --dry-run --ignore-warnings`; new lint `simplify_variable_pattern`; `dart:js_interop` `JSSymbol` constructor, `JSSymbol.key` and `JSSymbol.description`.

### 3.10 (Nov 12, 2025)

- **Language:** dot shorthands.
- **Stable:** analyzer plugins; build hooks (formerly native assets, experiment `native-assets` graduated).
- **New:** lint `remove_deprecations_in_breaking_versions`; `@Deprecated.extend()`, `.implement()`, `.subclass()`, `.mixin()`, `.instantiate()`, `.optional()`. *(third-party)* `Future.syncValue`; `dart install` / `dart installed` / `dart uninstall` replace `pub global activate`; `Uri.parseIPv4Address` gains `start` / `end`.
- **Breaking:** `sync*` / `async*` without a declared return type infer non-nullable when no null is yielded; `Uri.parseIPv4Address` rejects leading zeros; implementing `RegExp` / `RegExpMatch` deprecated; `IOOverrides` can no longer be implemented (it is now `abstract base` *(third-party)*); the `dart` CLI and the VM are separate executables (`dartvm`), subcommands run AOT snapshots; IA32 removed; using `@experimental` members outside their package warns; `@required` from `package:meta` no longer supported (use `required`); `dart:js_util` / `package:js` unsupported on Wasm.
- **Config disagreement:** the 3.10 blog enables analyzer plugins under `analyzer: plugins: - some_plugin`; https://dart.dev/tools/analyzer-plugins uses a top-level `plugins:` map. Confirm in the current docs.

### 3.9 (Aug 13, 2025)

- **Language:** with `sdk: ^3.9.0`, flow analysis assumes null safety (more `dead_code` warnings).
- **Tools:** Dart and Flutter MCP Server stable; `dart analyze` / `dart fix` use an AOT analysis server ("nearly 50% faster"; `--no-use-aot-snapshot` reverts to JIT *(third-party)*); git dependencies resolve versions from tags (`tag_pattern`); root `flutter` upper bound respected; cross-compilation to Linux `arm` and `riscv64`.
- **Fixed:** a DDC soundness bug for getters returning `T` instantiated as `dynamic` or `Function`.
- **Deprecated:** 32-bit x86 (sdk#49969). **Renamed:** `dart build -f exe <target>` became `dart build cli --target=<target>`.
- *(third-party)* new lints `switch_on_type`, `unnecessary_unawaited`; `@awaitNotRequired`.

```yaml
dependencies:
  my_pkg:
    git:
      url: https://github.com/example/my_pkg
      tag_pattern: v{{version}}
    version: ^2.1.0
```

### 3.8 (May 20, 2025)

- **Language:** null-aware elements. The formatter automates trailing commas (opt out with `formatter: trailing_commas: preserve` in `analysis_options.yaml` *(third-party)*).
- **Deprecated:** `avoid_null_checks_in_equality_operators` (dart.dev lists it under both 3.8 and 3.11).
- *(third-party)* `/// @docImport 'package:other/other.dart';`; `Iterable.withIterator`; `HttpClientBearerCredentials`; `supportsAnsiEscapes` returns true in tmux; `dart:ffi` `Array.elements`. **Breaking:** `dart:html` native classes such as `HtmlElement` can no longer be extended.

### 3.7 (Feb 12, 2025)

- **Language:** wildcard variables: `_` locals and parameters are non-binding (`Foo(_, this._, super._, void _()) {}`; `void handleCallback(int _, String _, bool _)`).
- **Formatter:** tied to the language version; the tall style becomes the default. `dart format --fix` removed; `--line-length` deprecated for `--page-width`.
- **Deprecated:** `dart:html`, `dart:indexed_db`, `dart:svg`, `dart:web_audio`, `dart:web_gl`, `dart:js`, `dart:js_util`, `package:js`. Migrate to `package:web` and `dart:js_interop`. Lints `package_api_docs` and `unsafe_html` removed.
- *(third-party)* Type inference uses type-parameter bounds.

### 3.6 (Dec 11, 2024)

- **Language:** digit separators (`1_000_000_000`, `0x4000_0000_0000_0000`, `0.000_000_001`; not at the start or end, nor next to `.` or `e` *(third-party)*).
- **Pub workspaces** (root `workspace:` list, `sdk: '^3.6.0'`). *(third-party)* `dart pub bump patch|minor|major`, `dart pub upgrade --unlock-transitive <pkg>`.

### 3.5 (Aug 6, 2024)

- **No new language features;** inference context tweaks (`await` in a `dynamic` context infers `FutureOr<_>`; context alignment for `await` and `??`). *(third-party)* `SecurityContext` is now `final`; web `DateTime` stores microseconds.

### 3.4 (May 14, 2024)

- **Type analysis improvements** for conditional, if-null and switch expressions, cast pattern context and the `...?` schema. *(third-party)* `ParallelWaitError` metadata. **Removed:** `dart:cli` `waitFor`.

### 3.3 (Feb 15, 2024)

- **Language:** extension types (experiment `inline-class`); abstract getters promotable under private final field rules. *(third-party)* stable Wasm via `dart compile wasm`; `dart:js_interop` types `JSAny`, `JSString`, `JSNumber`, `JSBoolean`, `JSObject`, `JSArray`.

### 3.2 (Nov 15, 2023)

- **Language:** private final field promotion; if-case promotion fixes. *(third-party)* `dart:ffi` `NativeCallable`.

### 3.1 (Aug 16, 2023)

- **No language changes.** *(third-party)* `interface` modifier on `StreamConsumer`, `StreamTransformer` and `MultiStreamController`; `NativeCallable.listener`. The third-party skill's own files disagree on whether `NativeCallable` and `.listener` landed in 3.1 or 3.2.

### 3.0 (May 10, 2023)

- **Language:** patterns, records, class modifiers, switch expressions, if-case. Sound null safety enforced.
- **Breaking:** classes without `mixin` cannot be used as mixins; `:` before a named parameter default is an error (use `=`); `continue` to a label that is not a loop or switch member is an error; language versions before 2.12 dropped (Dart 3 removed `--no-sound-null-safety` *(third-party)*).

## Dart 2 milestones

*(third-party)*

| Version | Added |
|---|---|
| 2.19 | `library;` (unnamed libraries), `Isolate.run`, better type argument inference |
| 2.18 | ffigen bindings from Objective-C/Swift headers |
| 2.17 | Enhanced enums, super-initializer parameters, named arguments anywhere |
| 2.15 | Constructor tear-offs (`Point.new`), generic function tear-offs (`identity<int>`), isolate groups |
| 2.14 | `>>>` |
| 2.13 | Typedefs for any type; FFI `@Packed(N)` and `Array<Uint8>` |
| 2.12 | Sound null safety (`T?`, `late`, `!`, `required`); `dart:ffi` 1.0 |
| 2.7 | Extension methods, `package:characters` |
| 2.3 | Spreads `...` / `...?`, collection `if` / `for` |
| 2.0 | Sound type system, optional `new` / `const` |

## Experiments

*(third-party)*

- **Three tiers:** beta channel preview (1 to 2 months out), stable but gated (`--enable-experiment`, off by default), stable and ungated.
- **`dart pub publish` refuses packages** that need experiments or enable them in `analysis_options.yaml`. Keep experimental code in sandboxes, and check whether a feature has graduated for the project's SDK before adding a flag.
- **Enable in the analyzer** with `analyzer: enable-experiment: - <flag>` (example in [CONSTRUCTORS.md](CONSTRUCTORS.md#versions)), and on the CLI with `dart --enable-experiment=<flag> run bin/main.dart`, `dart test --enable-experiment=<flag>`, `dart compile exe --enable-experiment=<flag> bin/main.dart`, `flutter run --enable-experiment=<flag>`, `flutter test --enable-experiment=<flag>`.
- **Flags the skill lists as active and gated:** `macros`, `augmentations`, `const-functions`, `enhanced-parts`, `static-extensions`, `this-promotion`, `data-assets`, `anonymous-methods`, `unquoted-imports`, `variance`, `inference-update-4`.

| Version | Graduated |
|---|---|
| 3.13.0 | `primary-constructors`, `record-use` |
| 3.10.0 | `native-assets` |
| 3.7.0 | `wildcard-variables` |
| 3.6.0 | `digit-separators` |
| 3.3.0 | `inline-class` (became extension types) |
| 3.0.0 | `records` / `patterns`, `sealed-class` |
| 2.17.0 | `enhanced-enums`, `super-parameters` |
| 2.15.0 | `constructor-tearoffs` |
| 2.14.0 | `triple-shift` |
| 2.12.0 | `non-nullable` |
| 2.7.0 | `extension-methods` |
| 2.3.0 | `spread-collections`, `control-flow-collections` |

## Macros

- **Macros will not ship.** The Dart team stopped work on macros (blog, 2025-01-29): "we will not be shipping macros in the foreseeable future." Semantic introspection made compile-time costs too high, regressing editing (analysis, completion) and incremental compilation for hot reload.
- **What replaces them:** better data support through bespoke language features (most requested issue dart-lang/language#314), `build_runner` improvements (dart-lang/build#3800), and augmentations shipped independently (dart-lang/language#4154).
- **Conflict:** the third-party skill still lists `macros` as an active gated experiment, documents `@JsonCodable()` from `package:json_codable` behind `--enable-experiment=macros`, and recommends macros as a `dart:mirrors` alternative. The Dart team's statement is at https://dart.dev/blog/an-update-on-dart-macros-data-serialization.
- **Augmentations syntax** *(third-party, experiment `augmentations`)*: `import augment 'user.g.dart';` in the original file, `augment library 'user.dart';` in the augmentation file, then `augment class`, `augment void m() { ...; augmented(); ... }`, `augment int get value`. Augmentations can add fields and constructors and wrap methods; extensions can do none of these; mixins can add fields and wrap via `super` but cannot add constructors.

## Upgrading old code

*(third-party)* Four stages, in order: syntax cleanup (1.x to 2.0), null safety (to 2.12), SDK and dependency bump, Dart 3 modernization.

- **Null safety:** `@required` becomes `required`; pick each field's type (see [LANGUAGE.md](LANGUAGE.md#null-safety)); drop `assert(x != null)`.
- **pubspec:** `sdk: ">=2.7.0 <3.0.0"` becomes `sdk: "^3.5.0"` (or `^3.13.0`).
- **Packages:** `pedantic` becomes `flutter_lints` or `very_good_analysis`; `tuple` becomes records; `meta`'s `@required` becomes the `required` keyword.
- **Dart 3 modernization:** `super.key` parameters, sealed classes with switch expressions instead of `is` ladders, primary constructors.
- **Finish with** `dart pub upgrade` and `dart fix --apply`.
- **Lint prep before 3.13** (dart.dev): on language 3.12 or lower, enable `avoid_final_parameters` and `var_with_no_type_annotation` first (see [CONSTRUCTORS.md](CONSTRUCTORS.md#breaking-change-in-313)).

## Prove it

- **Know the real language version:** read `environment.sdk` in every package's `pubspec.yaml` (in a workspace, each package has its own) and compare with the feature tables in [LANGUAGE.md](LANGUAGE.md#feature-minimums).
- **Channel check:** fetch the stable VERSION file and compare with `dart --version` (or `flutter --version`) before claiming a version is current.
- **Upgrade review:** for each minor version crossed, read its breaking list above and the SDK CHANGELOG; run `dart analyze`, `dart fix --dry-run` and `dart test` on the new lower bound.
- **No experiments in published packages:** `analysis_options.yaml` has no `enable-experiment` entry for a flag that has not graduated at the package's lower bound, and `dart pub publish --dry-run` passes.
- **No macros:** a search for `--enable-experiment=macros` and `@JsonCodable` finds nothing.
- **No dropped APIs:** no `dart:html`, `dart:js`, `dart:js_util` or `package:js` imports in code compiled to Wasm; no `waitFor`; no `@required`; no experimental `Isolate.runSync` family.
