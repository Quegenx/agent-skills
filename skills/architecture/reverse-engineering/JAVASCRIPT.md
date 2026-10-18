# JavaScript and Electron artifacts

From [morluto/rea, reverse-engineer-anything/references/javascript-applications.md]. Analyze the operator-supplied ASAR or extracted JS tree with the connected server's advertised contract.

## Select source and preserve identity

[morluto/rea, reverse-engineer-anything/references/javascript-applications.md]

- Start with analyze_javascript_application. If source_paths is advertised, select exact inventoried paths and include required manifests or source maps explicitly. Dependencies are not implicitly analyzed.
- Source selection retains the artifact inventory but limits source reading and analysis. Outside-scope relationships remain unknown. Summary detail changes delivery, not the underlying analysis boundary.
- Exact package imports-map aliases can resolve to package-local files. Wildcard, recursive and external-package alias targets retain their unresolved limitations.
- Optional recover_javascript_sources requires its advertised external provider and explicit inputs. Additional shared/runtime/lazy files retain their own digests and byte provenance. Recovered code and source maps are not evidence of execution.
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

## Trace the remaining question

[morluto/rea, reverse-engineer-anything/references/javascript-applications.md]

- trace_application_feature accepts a literal seed such as a node, route, string, API or IPC channel. Pick incoming, outgoing or both according to the question.
- Containment traversal can reach unrelated siblings. Reached nodes are not automatically participants in the feature.
- BrowserWindow options, preload/contextBridge surfaces, IPC registrations, utility processes and native binding requests are static observations. Dynamic or ambiguous channels stay unresolved; a requested native member is not a verified native export.
- Only a unique exact literal IPC channel supports an inferred pairing. State that it is inferred and retain coverage limitations.

## Compare versions

[morluto/rea, reverse-engineer-anything/references/javascript-applications.md]

- Analyze each version once, then compare_application_versions using supported digest, source-map, structural or semantic matches. Minified names and module ordinals are not persistent identity.
- Added/removed requires complete opposite-side coverage. Otherwise report unknown.
- For one exported callable's returned shape, use compare_javascript_export_shapes with explicit module paths and export names. Inspect property inventories and presence separately from unresolved values.
- Accept variant pairing only under the tool's supported exact discriminant. Static shape inference does not establish runtime behavior; use scoped runtime evidence when behavior is the question.

## Prove it

Every finding preserves artifact/source identity, selected scope and Evidence reference. Version changes have supported identity matches and adequate opposite-side coverage. Unknown graph edges or values are reported rather than converted into absence. [morluto/rea, reverse-engineer-anything/references/javascript-applications.md]
