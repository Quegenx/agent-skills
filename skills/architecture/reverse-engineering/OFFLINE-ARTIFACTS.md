# Offline WASM and SQLite evidence

From [morluto/rea, docs/wasm-artifacts.md; docs/sqlite-databases.md] and their typed contracts and providers. These routes inspect explicitly selected local artifacts without an active native-disassembler target. Use the connected server's advertised schemas and capability diagnostics.

## Inspect a local WASM module

[morluto/rea, docs/wasm-artifacts.md; src/wasm/WabtArtifactProvider.ts; third_party/wabt/README.md]

- Use `inspect_wasm_artifact`, rather than `open_binary`, for the selected local WASM file. Select JavaScript `glue_paths` and local `candidate_paths` explicitly when those associations matter.
- This adapter admits caller-supplied WABT 1.0.42 through the absolute `REA_WABT_BIN_DIRECTORY`, containing `wasm-validate`, `wasm-objdump` and `wasm2wat`. REA does not install them. This is the adapter's supported producer profile, not a universal latest-version recommendation. The tool roles match [WABT's release README](https://github.com/WebAssembly/wabt/blob/1.0.42/README.md).
- Preserve original byte identity, validation outcome, section ranges, exact import/export WAT forms, decoded WAT identity and executable paths/digests/banners. Caller-supplied tools are trusted executables; their digests do not authenticate a publisher or establish an OS sandbox.
- Selected WASM is not executed and artifacts are not implicitly fetched. WAT is a decoded representation, not original source, proof of runtime behavior or proof of binary round-trip identity.
- JavaScript glue contributes observed literals and source locations. Filesystem or basename matches remain candidate associations; URLs, query/fragment variants, dynamic expressions and multiple matches do not establish loading or data flow.
- When advertised, request summary detail and page exact imports, exports or WAT from the retained complete parent instead of repeating decoding. Keep source identity and all limits/unknowns from the original Evidence.

## Compare core WASM interfaces

[morluto/rea, docs/wasm-artifacts.md; src/application/wasm/WasmInterfaceComparisonService.ts; src/contracts/wasm/wasmComparisonContracts.ts]

- `compare_wasm_interfaces` takes two authenticated complete `inspect_wasm_artifact` records, or exact retained references on the current connection, and explicit `scope`: `imports`, `exports` or `both`. Resolve summary delivery to its complete parent first; separate CLI calls need portable complete Evidence.
- Preserve both artifact identities and every selected occurrence. The comparison examines names, kinds and admitted signatures. Duplicate names, unsupported signatures and incomplete or historical interface inventories remain unknown rather than proving absence or equality.
- Static equality is not runtime/ABI compatibility or successful linking. This comparison covers core modules; it does not establish WebAssembly-component or canonical-ABI relationships.

## Acquire coherent SQLite evidence

[morluto/rea, docs/sqlite-databases.md; src/application/sqlite/SqliteDatabaseCapability.ts; src/sqlite/SqliteDatabaseSnapshot.ts]

- Use `inspect_sqlite_database` on the explicit local database snapshot. The operation is independent of native analysis and requires no separate SQLite installation.
- This REA capability requires Node.js 24.x from 24.15, or a compatible 26+ runtime, with native `DatabaseSync.limits`; the worker checks that API before querying. Inspect capability diagnostics rather than applying SQLite's requirement to every REA operation. Node documents the API in [its SQLite reference](https://nodejs.org/api/sqlite.html#databaselimits); its [24.15 documentation](https://github.com/nodejs/node/blob/v24.15.0/doc/api/sqlite.md#databaselimits) marks that addition.
- Obtain a quiescent database/WAL pair or the application's consistent backup/export before inspection. Stable file identity checks do not make a copy of a live pair atomic.
- Retain original database and existing sibling `-wal` digests and byte counts separately. SQLite opens private copies; source files are not opened by SQLite or modified. Unsupported rollback-journal recovery is refused rather than silently performed.

## Select schema and rows

[morluto/rea, docs/sqlite-databases.md; src/sqlite/SqliteDatabaseInspection.ts; src/application/sqlite/SqliteDatabaseService.ts]

- Without a table, the default schema inventory is compact. Selecting one exact ordinary table expands its own schema; `schema_scope: "database"` explicitly requests the full stored schema. `not_requested` columns are not an empty measured schema.
- Select exact `columns` in the requested order when only some values are needed. Rows are optional, bounded and in unspecified order; preserve the selected row limit, returned count and `truncated` state. Omitted records remain unexamined.
- Keep value tags and original representations: integers are decimal strings, SQL NULL is distinct, blobs retain hex, and text retains bytes/encoding alongside display text. Do not treat replacement characters in display text as the original bytes.
- Views, virtual/shadow-table rows, arbitrary SQL, extension loading, database repair, encrypted databases and live capture are outside this profile. Stored declarations are not execution evidence.
- Resource failures and cleanup outcomes remain part of the result. Row limits do not override byte/worker limits, and a JavaScript heap bound does not establish a cap on SQLite's native heap or total resident memory.

## Prove it

WASM conclusions retain both source bytes and decoder identity, with candidate glue mappings and unknown interface cases visible. SQLite conclusions retain a coherent database/WAL source, the exact schema/table/column scope and row coverage, without claiming live atomicity, forensic recovery or execution. State actual acquisition, tool and cleanup limitations. [morluto/rea, docs/wasm-artifacts.md; docs/sqlite-databases.md]
