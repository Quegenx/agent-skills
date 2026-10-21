# JavaScript and Electron artifacts

From [morluto/rea, reverse-engineer-anything/references/javascript-applications.md]. Analyze the operator-supplied ASAR or extracted JS tree with the connected server's advertised contract.

## Select source and preserve identity

[morluto/rea, reverse-engineer-anything/references/javascript-applications.md]

- Start with analyze_javascript_application. If source_paths is advertised, select exact inventoried paths and include required manifests or source maps explicitly. Dependencies are not implicitly analyzed.
- Source selection retains the artifact inventory but limits source reading and analysis. Outside-scope relationships remain unknown. Summary detail changes delivery, not the underlying analysis boundary.
- Exact package imports-map aliases can resolve to package-local files. Wildcard, recursive and external-package alias targets retain their unresolved limitations.
- Optional recover_javascript_sources requires its advertised external provider and explicit inputs. Additional shared/runtime/lazy files retain their own digests and byte provenance. Recovered code and source maps are not evidence of execution.
- Wakaru recovery uses selected input snapshots and an absent output directory, preserving per-input UTF-8 byte ranges, engine identity, transform choices and producer reports. It does not overwrite an existing output or establish original names, map accuracy or runtime equivalence. Follow the connected adapter's supported host/profile rather than assuming the recovery engine runs everywhere. [morluto/rea, docs/javascript-recovery.md]
- Resource-limited or cancelled analysis can retain completed facts and partial Evidence. Inspect source coverage, limits and unknown scopes before retrying; a limit does not prove malformed source.

## Read the retained analysis

[morluto/rea, reverse-engineer-anything/references/javascript-applications.md]

- Use the actual parent Evidence ID on the same connection. Page module identities and select the returned node_id and role before requesting an item.
- One path can represent asset, bundle and source-module roles. Use a path selector only when uniqueness is established.
- Follow next_offset when further pages matter. Page exhaustion covers matching retained rows, not every possible runtime relationship.
- Item observations do not include every child syntax fact or related edge. An absent item property is not proof of absence from the application.
- If a client truncates a successful response, use smaller retained views or export the complete record. An incomplete preview is not canonical JSON.
- A transport resource_constraint can provide an Evidence reference. Recover that record instead of producing the same oversized analysis again.
- Retained references have session lifetime. Export before close when evidence must survive; another connection needs a portable complete record.
- For exact retained file/native facts, use the advertised `javascript-facts` view with exact paths and selected property keys. Keep each node/observation pair together; omitted properties, retained nulls and unavailable processing scopes have different meanings. These views do not reopen files or include every semantic relationship. [morluto/rea, docs/javascript-application-workflows.md]

## Trace the remaining question

[morluto/rea, reverse-engineer-anything/references/javascript-applications.md]

- trace_application_feature accepts a literal seed such as a node, route, string, API or IPC channel. Pick incoming, outgoing or both according to the question.
- Containment traversal can reach unrelated siblings. Reached nodes are not automatically participants in the feature.
- BrowserWindow options, preload/contextBridge surfaces, IPC registrations, utility processes and native binding requests are static observations. Dynamic or ambiguous channels stay unresolved; a requested native member is not a verified native export.
- Only a unique exact literal IPC channel supports an inferred pairing. State that it is inferred and retain coverage limitations.
- For a selected Electron IPC security review, inventory `ipcMain` handlers and channels exposed through preload/`contextBridge`; trace accepted arguments through shell, child-process, filesystem or webview-navigation operations and record intervening validation with file/function evidence. Apply the [Electron sender and exposure controls](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/secure-coding/BROWSER-BOUNDARIES.md#electron-ipc) and preserve the existing static-versus-observed boundary. [JoasASantos/REA-Prompts, README.md, IPC & contextIsolation security review; morluto/rea, reverse-engineer-anything/references/javascript-applications.md]

## Query semantic relationships

[morluto/rea, docs/javascript-application-workflows.md]

- When advertised, use `trace_javascript_semantics` on the authenticated companion semantic graph for backward provenance, forward influence, callers or ownership. Select a returned node/fingerprint or literal, property, endpoint, event or boundary-field seed appropriate to the question.
- The graph can retain static definition/read/write, call, argument/return, asynchronous, event/timer, configuration and resource relationships. Missing companion data, unsupported shapes and unresolved dynamic effects remain explicit unknowns.
- `resolved` identifies a unique admitted static target, not a path that executed. Candidate dynamic edges are excluded by default; opting in preserves ambiguity and partial coverage. Structural reachability, semantic influence, runtime observation and causal proof remain separate claims.
- Read actual retained properties rather than decoding display labels or identity strings. Reanalyze after analyzer corrections and use the IDs returned by that selected graph; a fingerprint remains a static comparison candidate, not behavioral-equivalence proof.

## Compare versions

[morluto/rea, reverse-engineer-anything/references/javascript-applications.md]

- Analyze each version once, then compare_application_versions using supported digest, source-map, structural or semantic matches. Minified names and module ordinals are not persistent identity.
- Added/removed requires complete opposite-side coverage. Otherwise report unknown.
- For one exported callable's returned shape, use compare_javascript_export_shapes with explicit module paths and export names. Inspect property inventories and presence separately from unresolved values.
- Accept variant pairing only under the tool's supported exact discriminant. Static shape inference does not establish runtime behavior; use scoped runtime evidence when behavior is the question.
- When comparing a selected security fix, identify the check added or changed and inspect sibling paths and callers for the same unfixed pattern. Report possible incomplete fixes as hypotheses with source evidence until authorized controlled validation establishes the result; use the existing [shared-cause investigation](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/debugging/SKILL.md#find-the-first-divergence) and [security evidence contract](https://github.com/Quegenx/agent-skills/blob/main/skills/engineering/code-review/SECURITY-AUDITS.md). [JoasASantos/REA-Prompts, README.md, Patch diffing (1-day to incomplete-fix hunting)]

## Compare historical source with a bundle

[morluto/rea, docs/cli.md; docs/javascript-application-workflows.md]

- `import-reference-source` records a committed historical-source inventory separately from the current artifact. Its summary changes presentation, not the examined source, and is not the full graph consumed by `compare_source_to_bundle`.
- Preserve source hashes, unreadable entries, parser failures and ignore/exclusion reasons. A recorded nearest Git HEAD does not prove the working tree matched it; exclusions and unavailable children leave source coverage partial.
- Compare the authenticated full historical graph with application Evidence. Exact content wins over path inference; weak basename, extension or Unicode-equivalent spelling does not force a mapping. Keep split/merged/duplicate candidates and ambiguity explicit.
- A removal requires complete historical and application inventories. Static source-to-bundle correspondence does not establish runtime loading or semantic equivalence.

## Prove it

Every finding preserves artifact/source identity, selected scope and Evidence reference. Version changes have supported identity matches and adequate opposite-side coverage. Unknown graph edges or values are reported rather than converted into absence. [morluto/rea, reverse-engineer-anything/references/javascript-applications.md]
