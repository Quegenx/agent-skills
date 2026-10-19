# Flutter APK build evidence

From [morluto/rea, docs/flutter-analysis.md; src/contracts/flutter/flutterToolContracts.ts; src/flutter/FlutterBuildProvider.ts]. Use these advertised REA tools to identify a supplied Flutter APK and inspect bounded Dart AOT facts. Flutter development remains in the global [Flutter skill](https://github.com/Quegenx/agent-skills/blob/main/skills/mobile/flutter/SKILL.md).

## Identify the build

[morluto/rea, docs/flutter-analysis.md; src/flutter/FlutterBuildProvider.ts; src/flutter/FlutterPayloadScan.ts; src/flutter/ElfBuildId.ts]

- `identify_flutter_build` takes the selected local APK path. It parses an owned read-only snapshot and runs no application, engine, device or external lookup.
- Preserve the APK SHA-256 and each ABI's `libapp.so` and `libflutter.so` byte sizes and digests. Available facts include observed snapshot hashes, ELF-header validity, engine GNU build IDs and labeled Dart/toolchain strings.
- `flutter_detected` describes whether the APK contains a matching `lib/<abi>/libapp.so` payload. Do not turn absence of that payload into a broader claim about every possible Flutter build format.
- Keep conflicting hash and build-ID candidates, null values and partial coverage. An absent labeled Dart version is unknown; do not infer a release version from a missing string.
- The snapshot hash can be matched against an external SDK dataset, but this tool performs no hash-to-SDK lookup. Hash identity and an externally established release mapping are separate evidence.

## Inspect one AOT payload

[morluto/rea, docs/flutter-analysis.md; src/flutter/FlutterBuildProvider.ts; src/flutter/DartElf.ts]

- `inspect_dart_aot` takes the APK path and optional explicit `abi`. Use the returned selected ABI rather than assuming all architectures were examined.
- It reads snapshot symbols through the ELF dynamic symbol table and reports their file offsets, sizes and data-header observations. Missing exported symbols are refused rather than guessed. Ambiguous load mappings, overlapping/aliased data symbols and invalid extents retain their coverage limitations.
- Snapshot-kind interpretation is SDK-layout-specific. This parser's complete structural profile uses the Dart 2.14 FullAOT layout; do not generalize its enum values to other releases. [Dart 2.14 snapshot definition](https://github.com/dart-lang/sdk/blob/2.14.0/runtime/vm/snapshot.h)
- The isolate-data string projection exposes `package_uris`, `dart_uris` and `class_like_tokens`. These are byte-pattern observations, including incidental identifier matches, rather than deserialized class/function semantics or original Dart source.
- Structural `libapp.coverage` and `string_pool.coverage` are independent. Preserve both, plus every `_at_least` lower-bound count and truncation marker. A complete header does not make a bounded string projection complete.

## Read retained strings

[morluto/rea, docs/flutter-analysis.md; src/contracts/flutter/flutterToolContracts.ts]

- When advertised, select `detail: "summary"` for selected ABI/library identity, snapshot headers, coverage and counts without string lists. Complete source Evidence remains retained under the returned `normalized_result.parent_evidence_id`.
- Use `inspect_analysis_view` with kind `dart-aot` and the needed collection: `package_uris`, `dart_uris` or `class_like_tokens`. Follow its offsets while preserving the original order, selected ABI and library identity.
- Exhausting returned pages does not upgrade a partial source pool or turn tokens into typed classes. Preserve the original complete Evidence under the existing [retention rules](CAPTURES-AND-EVIDENCE.md#preserve-the-record).

## Prove it

The report binds each fact to the APK and selected library digests, identifies which ABIs were examined, preserves structural and string-pool coverage separately and leaves contradictory or missing build metadata explicit. It distinguishes observed strings/hashes from SDK-release mapping, typed recovery and runtime behavior. [morluto/rea, docs/flutter-analysis.md; src/flutter/FlutterBuildProvider.ts]
