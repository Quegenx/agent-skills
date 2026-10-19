# Analysis and lints

Static analysis catches type, null safety and style problems before code runs, and `dart fix` repairs many of them automatically. What the analyzer reports is decided by one file, `analysis_options.yaml`: the lint set it includes, the strict modes it turns on and the severities it assigns. `dart fix` only fixes diagnostics that are enabled, so a thin options file means fewer automatic fixes. The style rules these lints enforce are in [STYLE-AND-DOCS.md](STYLE-AND-DOCS.md); the language features behind the errors are in [LANGUAGE.md](LANGUAGE.md); Flutter specifics are in [flutter SKILL.md](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/SKILL.md).

**Contents:** [analysis_options.yaml](#analysis_optionsyaml) · [Strict modes](#strict-modes) · [Lint sets](#lint-sets) · [Rules, severities and suppression](#rules-severities-and-suppression) · [Formatter settings](#formatter-settings) · [Analyzer plugins](#analyzer-plugins) · [dart analyze](#dart-analyze) · [dart fix](#dart-fix) · [dart format](#dart-format) · [Fixing analysis errors](#fixing-analysis-errors) · [The Dart and Flutter MCP server](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/AGENT-TOOLING.md#the-mcp-server) · [VM inlining hints](#vm-inlining-hints) · [Changes by version](#changes-by-version) · [Prove it](#prove-it)

## analysis_options.yaml

- **Location:** at the package root, next to `pubspec.yaml`. If it is missing, the analyzer walks up the directory tree; if it finds none, it uses the standard checks. In a monorepo a nested package's own file wins for that package. YAML: no tabs, 2 spaces per level.
- **Always `include:` a standard rule set:** `package:lints/recommended.yaml` for Dart, `package:flutter_lints/flutter.yaml` for Flutter.
- **Top-level keys:** `include:` (one URI or a list), `analyzer:` (strict modes, exclude, ignore rules, severity, experiments), `linter:`, `formatter:`, `plugins:`.
- **Include merging:** includes merge in order and local options take precedence. With `include: [one.yaml, three.yaml]` where `three.yaml` includes `two.yaml`, the order is one, two, three, then the local file. Compatible settings combine rather than replace whole sections.
- **Exclude files** with globs relative to the options file: `analyzer: exclude: [lib/client.dart, lib/server/*.g.dart, test/_data/**]`. Generated code is the usual case (`"**/*.g.dart"`, `"lib/generated/**"`).

The docs sample:

```yaml
include:
  - package:lints/recommended.yaml

analyzer:
  exclude: [build/**]
  language:
    strict-casts: true
    strict-raw-types: true

linter:
  rules:
    - cancel_subscriptions
```

The dart-lang analysis skill's "Comprehensive `analysis_options.yaml`" example:

```yaml
include: package:flutter_lints/recommended.yaml

analyzer:
  exclude:
    - "**/*.g.dart"
    - "lib/generated/**"
  language:
    strict-casts: true
    strict-inference: true
    strict-raw-types: true
  errors:
    todo: ignore
    invalid_assignment: warning
    missing_return: error

linter:
  rules:
    avoid_shadowing_type_parameters: false
    await_only_futures: true
    use_super_parameters: true

formatter:
  page_width: 100
  trailing_commas: preserve
```

**Where the source contradicts itself:** this example's `include:` line names `package:flutter_lints/recommended.yaml`, while the same skill's prose names `package:flutter_lints/flutter.yaml` as the base rule set, and the flutter_lints source file is `lib/flutter.yaml` (which includes `package:lints/recommended.yaml`). Confirm the file name in the current flutter_lints package before copying the include line.

## Strict modes

All three default to `false`; the dart-lang skills turn all three on under `analyzer: language:`.

| Mode | What it forbids | Example diagnostic |
|---|---|---|
| `strict-casts` | Implicit casts from `dynamic` (introduced Dart 2.16; replaces the deprecated `strong-mode: implicit-casts: false`) | `argument_type_not_assignable` |
| `strict-inference` | Choosing `dynamic` when inference fails | `final lines = {};` gives `inference_failure_on_collection_literal` |
| `strict-raw-types` | Generic types without type arguments | `List numbers = [1, 2, 3];` gives `strict_raw_type` |

- **Why `strict-casts`:** it forces explicit casting and catches implicit downcast errors at compile time.
- **Dart 3.13 replacements:** the SDK changelog adds lints `no_dynamic_casts` (replaces `strict-casts`) and `no_raw_types` (replaces `strict-raw-types`). The dart.dev analysis page still documents only the strict modes. Confirm in the current docs before choosing.

## Lint sets

| Set | Contents | Use |
|---|---|---|
| `package:lints/core.yaml` | Critical issues; all code should pass. The pub.dev package score is partly based on it. | Floor for every package |
| `package:lints/recommended.yaml` | Core plus idiomatic style | Dart packages and apps |
| `package:flutter_lints/flutter.yaml` | Recommended plus Flutter rules | Flutter |

- **Install:** `dart pub add --dev lints`, then `include: package:lints/recommended.yaml`.
- **Upgrading `lints` can break the build:** a new version can make previously passing code fail.
- **Current versions (pub.dev, checked 2026-10-17):** `lints` 6.1.0 (2026-01-30, sdk `^3.8.0`); `flutter_lints` 6.0.0 (2025-05-27, sdk `^3.8.0`).
- **Stricter third-party set:** Very Good Ventures' `very_good_analysis`, used as community practice: `dart pub add dev:very_good_analysis`, then `include: package:very_good_analysis/analysis_options.yaml` (always the latest lints) or a versioned file such as `analysis_options.10.0.0.yaml` to pin them. Its page says it also sets the formatter's `trailing_commas: automate`.
- **More rule sets:** pub.dev topic `#lints`. Rule status is Stable, Experimental, Deprecated or Removed; some rules have quick fixes that `dart fix` or editors apply.

**lints 6.1.0 `core.yaml`:** avoid_empty_else, avoid_relative_lib_imports, avoid_shadowing_type_parameters, avoid_types_as_parameter_names, await_only_futures, camel_case_extensions, camel_case_types, collection_methods_unrelated_type, curly_braces_in_flow_control_structures, dangling_library_doc_comments, depend_on_referenced_packages, empty_catches, file_names, hash_and_equals, implicit_call_tearoffs, library_annotations, no_duplicate_case_values, no_wildcard_variable_uses, non_constant_identifier_names, null_check_on_nullable_type_parameter, prefer_generic_function_type_aliases, prefer_is_empty, prefer_is_not_empty, prefer_iterable_whereType, prefer_typing_uninitialized_variables, provide_deprecation_message, secure_pubspec_urls, strict_top_level_inference, type_literal_in_constant_pattern, unintended_html_in_doc_comment, unnecessary_overrides, unrelated_type_equality_checks, use_string_in_part_of_directives, valid_regexps, void_checks.

**`recommended.yaml` adds:** annotate_overrides, avoid_function_literals_in_foreach_calls, avoid_init_to_null, avoid_renaming_method_parameters, avoid_return_types_on_setters, avoid_returning_null_for_void, avoid_single_cascade_in_expression_statements, constant_identifier_names, control_flow_in_finally, empty_constructor_bodies, empty_statements, exhaustive_cases, implementation_imports, invalid_runtime_check_with_js_interop_types, library_prefixes, library_private_types_in_public_api, no_leading_underscores_for_library_prefixes, no_leading_underscores_for_local_identifiers, null_closures, overridden_fields, package_names, prefer_adjacent_string_concatenation, prefer_collection_literals, prefer_conditional_assignment, prefer_contains, prefer_final_fields, prefer_for_elements_to_map_fromIterable, prefer_function_declarations_over_variables, prefer_if_null_operators, prefer_initializing_formals, prefer_inlined_adds, prefer_interpolation_to_compose_strings, prefer_is_not_operator, prefer_null_aware_operators, prefer_spread_collections, recursive_getters, slash_for_doc_comments, type_init_formals, unnecessary_brace_in_string_interps, unnecessary_const, unnecessary_constructor_name, unnecessary_getters_setters, unnecessary_late, unnecessary_library_name, unnecessary_new, unnecessary_null_aware_assignments, unnecessary_null_in_if_null_operators, unnecessary_nullable_for_final_variable_declarations, unnecessary_string_escapes, unnecessary_string_interpolations, unnecessary_this, unnecessary_to_list_in_spreads, unnecessary_underscores, use_function_type_syntax_for_parameters, use_null_aware_elements, use_rethrow_when_possible, use_super_parameters.

**flutter_lints `flutter.yaml` adds:** avoid_print, avoid_unnecessary_containers, avoid_web_libraries_in_flutter, no_logic_in_create_state, prefer_const_constructors_in_immutables, sized_box_for_whitespace, sort_child_properties_last, use_build_context_synchronously, use_full_hex_values_for_flutter_colors, use_key_in_widget_constructors.

**lints changelog:**

| Version | Change |
|---|---|
| 7.0.0-wip (unreleased, on main) | core adds `switch_on_type` and promotes `invalid_runtime_check_with_js_interop_types` from recommended; recommended adds `simple_directive_paths`, `simplify_variable_pattern`, `unnecessary_unawaited` |
| 6.1.0 | recommended adds `use_null_aware_elements` |
| 6.0.0 | core adds `strict_top_level_inference`; recommended adds `unnecessary_underscores`; requires Dart 3.8 |
| 5.1.0 | core adds `unintended_html_in_doc_comment` |
| 5.0.0 | recommended adds `invalid_runtime_check_with_js_interop_types`, `unnecessary_library_name`; removes `avoid_null_checks_in_equality_operators`; SDK lower bound 3.5 |

## Rules, severities and suppression

- **Enable rules** as a YAML list under `linter: rules:` (a fresh set). **Override included rules** with a map (`avoid_shadowing_type_parameters: false`, `await_only_futures: true`). Do not mix list and map syntax in the same `rules` block.
- **Severities:** change them under `analyzer: errors:`, for example `todo: ignore`, `invalid_assignment: warning`, `missing_return: error`, `dead_code: info`.

| Severity | Fails the build? | Example |
|---|---|---|
| `info` | No | `dead_code` |
| `warning` | Only if warnings are treated as errors | `invalid_null_aware_operator` |
| `error` | Yes | `invalid_assignment` |

- **Suppress in a file:** `// ignore_for_file: unused_local_variable, duplicate_ignore, dead_code` at the top; `// ignore_for_file: type=lint` suppresses all lints (Dart 2.15+).
- **Suppress one line:** `// ignore: invalid_assignment` on the line above or appended to the line.
- **Suppress in pubspec.yaml:** `# ignore: sort_pub_dependencies` above the line (Dart 3.3+).
- **Plugin diagnostics** take the plugin name as prefix: `// ignore: some_plugin/some_code`.
- **Some rules exclude each other.** `always_use_package_imports` ("Avoid relative imports for files in `lib/`", not in the core or recommended sets on its page) is incompatible with `prefer_relative_imports` (https://dart.dev/tools/linter-rules/always_use_package_imports). Enable one; which one is a project choice, covered in [USAGE-AND-DESIGN.md](USAGE-AND-DESIGN.md#libraries-and-imports).

```dart
// Suppress for the entire file
// ignore_for_file: unused_local_variable, dead_code

void processData() {
  // Suppress for a specific line
  // ignore: invalid_assignment
  int x = '';
  
  const y = 10; // ignore: constant_identifier_names
}
```

## Formatter settings

- **In analysis_options.yaml:** `formatter: page_width: 120` (default 80) and `trailing_commas: automate` (default: adds or removes trailing commas based on whether the list splits) or `preserve` (a trailing comma forces a split; the formatter adds commas but doesn't remove them).
- **Per file:** `// dart format width=123` at the top, before any code.
- **Language versions:** configurable options need language version 3.7 or later; `trailing_commas` needs 3.8 or later.

## Analyzer plugins

- **New plugins (Dart 3.10+):** a top-level `plugins:` key, `my_plugin: ^1.0.0` or `path:`. Restart the Dart Analysis Server after changes. Plugin warnings are on by default, plugin lints off; enable lints under `plugins: my_plugin: diagnostics: rule_1: true`. Find plugins on pub.dev with `dependency:analysis_server_plugin`.
- **Legacy plugins (`analyzer: plugins:`):** one per options file, and they increase memory; avoid them on machines with less than 16 GB of memory or in monorepos with more than 10 `pubspec.yaml` and `analysis_options.yaml` files. Dart 3.13.2 (2026-08-25) deprecated the legacy plugin system.
- **Where sources disagree:** the dart-lang analysis skill puts plugins under `analyzer: plugins:` with the plugin package as a dev_dependency, and the Dart 3.10 blog example uses `analyzer: plugins: - some_plugin`; the analyzer-plugins docs page uses the top-level `plugins:` map. Confirm the current form in https://dart.dev/tools/analyzer-plugins before adding one.
- **Writing a plugin:** depend on `analysis_server_plugin: ^0.3.0`, `analyzer_plugin: ^0.13.0`, `analyzer: ^8.0.0` (sdk `^3.10.0`). In `lib/main.dart` declare a top-level `final plugin = SimplePlugin();` whose class extends `Plugin` and overrides `register(PluginRegistry registry)`. `print` doesn't work (the plugin runs in a separate isolate), so log to a file; check the analyzer diagnostics pages.
- **Deprecated lints to re-implement as plugins if wanted (3.13):** `avoid_private_typedef_functions`, `one_member_abstracts`.

## dart analyze

- **Same analysis as the IDE.** Accepts a directory or a file: `dart analyze bin`.
- **Exit status:** fails on errors or warnings, not infos, by default. `--fatal-infos` makes infos fatal; `--no-fatal-warnings` makes warnings non-fatal.
- **Workflow:** check that `analysis_options.yaml` exists at the root; run the `analyze_files` MCP tool if available, otherwise `dart analyze <target_directory>`; review the output; add `--fatal-infos` if info-level issues must fail; fix by hand or go on to `dart fix`.
- **Speed:** since Dart 3.9 `dart analyze` and `dart fix` use an AOT-compiled analysis server snapshot ("`dart analyze` got nearly 50% faster").
- **Analyzer performance traces:** `dart info record-performance` (Dart 3.12) captures analysis server traces and CPU profiles.

## dart fix

- **What it fixes:** analysis issues that have automated fixes, outdated API usages (data-driven fixes from the SDK and dependencies), and migrations (for example Dart 3 migrations).
- **Commands:** `dart fix --dry-run` (`-n`) to preview; `dart fix --apply`; `--code=prefer_single_quotes,use_super_parameters` for specific codes; `--compare-to-golden` for package maintainers verifying data-driven fixes.
- **Only enabled diagnostics get fixed.** Enabling lints (for example `use_super_parameters`, which needs an SDK lower bound of 2.17 or later) increases the fixes. Save all files before running.
- **Workflow:** preview with the `dart_fix` MCP tool or `dart fix --dry-run`; check that the fixes fit the architecture; enable the matching lint rules for more fixes; apply with `dart_fix` or `dart fix --apply`; format with the `dart_format` MCP tool or `dart format .`; re-run analysis.

## dart format

- **Run:** `dart format .` (recurses) or `dart format lib bin/updater.dart`. It overwrites files by default; `-o`/`--output` with `show`, `json` or `none` doesn't overwrite.
- **CI:** `--set-exit-if-changed` returns exit code 1 if anything changed, 0 otherwise: `dart format -o none --set-exit-if-changed bin/my_app.dart`.
- **What it changes:** removes whitespace, wraps to 80 characters, adds trailing commas to split argument and parameter lists and removes them from unsplit ones, may move comments around commas.
- **Language-versioned style:** since 3.7 `dart format` is tied to the language version (the tall style); at 3.8 it automates trailing commas; 3.13 adds block-formatted parameter lists and `as`/`is`/`is!`, blank lines between import sections (it doesn't sort them), and prefers splitting call chains for single-element targets. `dart format --version --verbose` shows the supported language versions.
- **Removed and renamed:** `dart format --fix` was removed in 3.7, and `--line-length` deprecated for `--page-width`.
- **Editors:** VS Code format on save: `"[dart]": { "editor.formatOnSave": true }`. Options: `dart help format`; formatter FAQ: https://github.com/dart-lang/dart_style/wiki/FAQ.
- **Where sources differ, format on save off for Dart:** [ApparenceKit](https://apparencekit.dev/flutter-tips/usefull-vscode-configurations-to-save-time/) sets `"editor.formatOnSave": true` globally but `"editor.formatOnSave": false` inside `[dart]`, "if you prefer formatting Dart using other methods or specific save actions". That is a preference; either way CI should run `dart format --set-exit-if-changed`.
- **VS Code save actions for Dart** (same source): `source.fixAll` "automatically applies suggested fixes", which "can include adding missing `const` keywords"; `source.organizeImports` "sorts your import statements and removes any imports that aren't being used" (which `dart format` does not do). `"explicit"` runs them on an explicit save (Ctrl+S / Cmd+S). `"editor.inlayHints.enabled": "off"` inside `[dart]` hides inline type hints. Open the file with `Ctrl+,` / `Cmd+,` and search "settings json".

```json
"editor.codeActionsOnSave": {
  "source.fixAll": "explicit",
  "source.organizeImports": "explicit"
}
```

## Fixing analysis errors

Workflow from the dart-lang error-fixing skill:

1. `dart analyze . --fatal-infos`.
2. `dart fix --dry-run`, then `dart fix --apply`.
3. Fix the rest by hand with the table below.
4. Verify with `dart analyze .` and `dart test`. If the analyzer still reports errors, go back to step 3.

| Error | Fix |
| --- | --- |
| Null safety, e.g. "Property cannot be accessed on a nullable receiver" | If the value can really be null, use `?.` or `??`. If not, and it is set elsewhere, mark it `late` |
| Type mismatch, e.g. "The argument type 'List<dynamic>' can't be assigned..." | Trace where it is created and add explicit generics (`<int>[]`, not `[]`) |
| Invalid override, e.g. "The parameter type doesn't match the overridden method" | Widen the parameter to match the superclass, or add `covariant` if the narrower type is intended |
| `dart test` fails with `TypeError` | A bad explicit cast (`as T`) or a read of an uninitialized `late` variable. Fix the type hierarchy or the initialization order |

- **Overrides:** return types are covariant and parameter types contravariant. Never tighten a parameter type in a subclass unless it is marked `covariant`.
- **Generics:** annotate them explicitly (`List<T>`, `Map<K, V>`). Never assign `List<dynamic>` to a typed list such as `List<Cat>`.
- **Casts:** avoid implicit downcasts from `dynamic`. When a cast is needed, make it explicit (`as List<Cat>`) and make sure the runtime type matches, or it throws `TypeError`.
- **Null safety:** `?` for nullable types, `!` for null assertion, the [required-argument rule](LANGUAGE.md#null-safety) for named arguments. Use `late` for a non-nullable top-level or instance variable that is set before use where flow analysis cannot prove it. Use the `_` wildcard (Dart 3.7+) for non-binding locals or parameters to avoid unused-variable warnings.
  - P2 correction: the old null-safety line said `required` was for named parameters that cannot be null; see the official distinction in [Dart null safety](https://dart.dev/null-safety/understanding-null-safety).
- **Error handling:** catch `Exception` subtypes for failures you can recover from. Never explicitly catch `Error` or its subtypes (`TypeError`, `ArgumentError`): they are bugs to fix; enforce with the `avoid_catching_errors` lint. `rethrow` inside `catch` keeps the original stack trace.
- **Runtime errors in a running app:** the skill's description says it "Uses get_runtime_errors and lsp to fetch an active stack trace, locate the failing line, apply a fix, and verify resolution via hot_reload", but its body covers only `dart analyze`, `dart fix` and manual fixes and never mentions those tools again. The MCP tools are in [Flutter agent tooling](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/AGENT-TOOLING.md#tools).

The fixed forms:

```dart
void printInts(List<int> a) => print(a);

void main() {
  final list = <int>[]; // Explicitly typed
  list.add(1);
  list.add(2);
  printInts(list);
}
```

```dart
class Animal {
  void chase(Animal a) {}
}

class Cat extends Animal {
  @override
  void chase(covariant Mouse a) {} // Explicitly marked covariant
}
```

```dart
class Thermometer {
  late String temperature; // Defers initialization check to runtime

  void read() {
    temperature = '20C';
  }
}
```

Before the fixes these were `final list = [];` (inferred `List<dynamic>`, can't be assigned to `List<int>`), `void chase(Mouse a) {}` (tightened parameter type) and `String temperature;` (non-nullable instance field must be initialized).

## The Dart and Flutter MCP server

Install clients, connect through DTD and choose tools using the canonical [Dart and Flutter MCP setup](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/AGENT-TOOLING.md#the-mcp-server). Analysis-specific analyze_files and dart_fix workflows remain above.

## VM inlining hints

[ApparenceKit](https://apparencekit.dev/flutter-tips/speed-up-flutter-code-inline-compilation/), checked against the [Dart VM compiler pragmas](https://github.com/dart-lang/sdk/blob/main/runtime/docs/compiler/pragmas_recognized_by_compiler.md) and [VM FAQ](https://github.com/dart-lang/sdk/blob/main/docs/Frequently-asked-questions-about-the-Dart-VM.md).

- `@pragma("vm:prefer-inline")` asks the VM to inline a function or method when possible; other factors can prevent it, so the annotation is not a guarantee. `@pragma("vm:never-inline")` prevents inlining and is always respected by the VM.
- Keep the compiler's heuristic unless the method is performance-critical and measurement shows an improvement. Excessive inlining increases code size and can regress performance. The community tip describes a possible call-overhead benefit, not a measured speedup for the app being edited.

## Changes by version

Current stable is 3.13.5 (2026-09-29).

| Version (date) | Analysis and tooling change |
|---|---|
| 3.13 (2026-08-12) | Lints `no_raw_types`, `no_dynamic_casts` replace the strict modes; deprecated `avoid_private_typedef_functions`, `one_member_abstracts`; new lints with fixes `empty_container_bodies`, `initialize_in_field_declaration`, `unnecessary_const_in_enum_constructor`, `unnecessary_primary_constructor_body`, `unnecessary_type_name_in_constructor`, `use_declaring_parameters`, and `async_return_with_no_await`; experimental `use_primary_constructors`; 3.13 formatter style |
| 3.13.2 (2026-08-25) | Legacy analyzer plugin system deprecated |
| 3.11 (2026-02-11) | Deprecated lints `avoid_null_checks_in_equality_operators`, `prefer_final_parameters`, `use_if_null_to_convert_nulls_to_bools`; analysis server caches compiled plugin entry points |
| 3.10 (2025-11-12) | Analyzer plugins; lint `remove_deprecations_in_breaking_versions` |
| 3.9 (2025-08-13) | MCP server on stable; AOT analysis server snapshot; null safety assumed in flow analysis gives more `dead_code` warnings |
| 3.8 (2025-05-20) | Deprecates `avoid_null_checks_in_equality_operators` (the breaking-changes page; the 3.11 blog lists it again as deprecated in 3.11); formatter automates trailing commas |
| 3.7 (2025-02-12) | Tall formatter style tied to language version; `dart format --fix` removed; `--line-length` deprecated for `--page-width`; lints `package_api_docs`, `unsafe_html` removed |

Unreleased on the SDK main branch: 3.15.0 adds lint `unnecessary_this_alias`.

## Prove it

- **`dart analyze --fatal-infos`** exits 0 on the package (or `analyze_files` returns no diagnostics).
- **`dart fix --dry-run`** proposes nothing.
- **`dart format -o none --set-exit-if-changed .`** exits 0.
- **`analysis_options.yaml`** sits at the package root, includes `package:lints/recommended.yaml` or `package:flutter_lints/flutter.yaml`, and no `rules:` block mixes list and map syntax.
- **Inlining:** every retained `vm:prefer-inline` annotation has a measured benefit on a performance-critical method; otherwise rely on the compiler heuristic. [Dart VM FAQ](https://github.com/dart-lang/sdk/blob/main/docs/Frequently-asked-questions-about-the-Dart-VM.md)
